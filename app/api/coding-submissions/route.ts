
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeCode } from '@/lib/code-executor';
import { prisma } from '@/lib/prisma';

// GET - Получить все сабмишены (с фильтрацией)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const questionId = searchParams.get('questionId');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    const submissions = await prisma.codingSubmission.findMany({
      where: {
        ...(playerId && { playerId }),
        ...(questionId && { codingQuestionId: questionId }),
        ...(status && { status }),
      },
      include: {
        codingQuestion: {
          select: {
            id: true,
            title: true,
            points: true,
            difficulty: true,
            category: true,
          },
        },
        player: {
          select: {
            id: true,
            username: true,
            score: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      ...(limit && { take: parseInt(limit) }),
    });

    return NextResponse.json({
      success: true,
      data: submissions,
      count: submissions.length,
    });
  } catch (error) {
    console.error('Get coding submissions error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка получения решений' },
      { status: 500 }
    );
  }
}

// POST - Создать новый сабмишн (отправить решение)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Необходима авторизация' },
      { status: 401 }
    );
  }

  try {
    const { codingQuestionId, playerId, code, language } = await request.json();

    // Валидация
    if (!codingQuestionId || !playerId || !code) {
      return NextResponse.json(
        { success: false, error: 'Все обязательные поля должны быть заполнены' },
        { status: 400 }
      );
    }

    // Проверяем существование вопроса и игрока
    const [codingQuestion, player] = await Promise.all([
      prisma.codingQuestion.findUnique({
        where: { id: codingQuestionId },
        include: { testCases: true },
      }),
      prisma.player.findUnique({
        where: { id: playerId },
      }),
    ]);

    if (!codingQuestion) {
      return NextResponse.json(
        { success: false, error: 'Задача не найдена' },
        { status: 404 }
      );
    }

    if (!player) {
      return NextResponse.json(
        { success: false, error: 'Игрок не найден' },
        { status: 404 }
      );
    }

    // Проверяем, не отправлял ли уже игрок решение для этого вопроса
    const existingSubmission = await prisma.codingSubmission.findFirst({
      where: {
        codingQuestionId,
        playerId,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Если уже есть успешное решение, не позволяем отправлять снова
    if (existingSubmission?.status === 'approved') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Вы уже успешно решили эту задачу',
          submission: existingSubmission 
        },
        { status: 400 }
      );
    }

    // Выполняем код и проверяем тесты
    let testResults = null;
    let isCorrect = false;
    let score = 0;

    if (!codingQuestion.requiresManualReview) {
      try {
        testResults = await executeCode(code, language, codingQuestion.testCases);
        isCorrect = testResults.passed === testResults.total;
        
        if (isCorrect) {
          score = codingQuestion.points;
        }
      } catch (executionError) {
        console.error('Code execution error:', executionError);
        testResults = {
          passed: 0,
          total: codingQuestion.testCases.length,
          details: codingQuestion.testCases.map(tc => ({
            testCaseId: tc.id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            actualOutput: `Execution error: ${executionError}`,
            passed: false,
            isHidden: tc.isHidden,
          })),
        };
      }
    }

    // Определяем статус сабмишна
    let status: 'pending' | 'approved' | 'rejected' = 'pending';
    
    if (!codingQuestion.requiresManualReview) {
      status = isCorrect ? 'approved' : 'rejected';
    }

    // Создаем сабмишн
    const submission = await prisma.codingSubmission.create({
      data: {
        codingQuestionId,
        playerId,
        code,
        language,
        testResults,
        isCorrect: codingQuestion.requiresManualReview ? null : isCorrect,
        score: codingQuestion.requiresManualReview ? null : score,
        status,
      },
      include: {
        codingQuestion: {
          select: {
            id: true,
            title: true,
            points: true,
            requiresManualReview: true,
          },
        },
        player: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Если решение верное и не требует ручной проверки, обновляем счет игрока
    if (status === 'approved') {
      await prisma.player.update({
        where: { id: playerId },
        data: {
          score: { increment: score },
        },
      });

      // Обновляем gameState - добавляем игрока в список ответивших
      const gameState = await prisma.gameState.findFirst();
      if (gameState && !gameState.playersAnswered.includes(playerId)) {
        await prisma.gameState.update({
          where: { id: gameState.id },
          data: {
            playersAnswered: {
              push: playerId,
            },
            answeredCodingQuestions: {
              push: codingQuestionId,
            },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: codingQuestion.requiresManualReview 
        ? 'Решение отправлено на проверку' 
        : isCorrect 
        ? 'Задача решена верно!' 
        : 'Задача решена неверно',
      data: submission,
    });

  } catch (error) {
    console.error('Create coding submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка отправки решения' },
      { status: 500 }
    );
  }
}