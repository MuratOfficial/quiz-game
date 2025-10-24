
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { playerId, questionId, answer, questionType } = await req.json();

    if (!playerId || !questionId || !answer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Проверяем существование игрока
    const player = await prisma.player.findUnique({
      where: { id: playerId }
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    let isCorrect = false;
    let pointsEarned = 0;

    if (questionType === 'multiple-choice') {
      // Проверяем обычный вопрос
      const question = await prisma.question.findUnique({
        where: { id: questionId }
      });

      if (!question) {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        );
      }

      isCorrect = question.correctAnswer === answer;
      pointsEarned = isCorrect ? question.points : 0;

      // Обновляем счет игрока
      if (isCorrect) {
        await prisma.player.update({
          where: { id: playerId },
          data: {
            score: { increment: pointsEarned }
          }
        });
      }
    }

    // Добавляем игрока в список ответивших
    const gameState = await prisma.gameState.findFirst();
    if (gameState) {
      await prisma.gameState.update({
        where: { id: gameState.id },
        data: {
          playersAnswered: {
            push: playerId
          },
          ...(questionType === 'multiple-choice' && {
            answeredQuestions: {
              push: questionId
            }
          }),
          ...(questionType === 'coding' && {
            answeredCodingQuestions: {
              push: questionId
            }
          })
        }
      });
    }

    return NextResponse.json({
      success: true,
      isCorrect,
      pointsEarned,
      message: isCorrect ? 'Правильный ответ!' : 'Неправильный ответ'
    });

  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    );
  }
}