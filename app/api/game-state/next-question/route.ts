
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { type } = await req.json();
    const gameState = await prisma.gameState.findFirst();

    if (!gameState) {
      return NextResponse.json(
        { error: 'Game state not found' },
        { status: 404 }
      );
    }

    let updatedGameState;

    if (type === 'multiple-choice') {
      // Получаем случайный обычный вопрос, который еще не был отвечен
      const questions = await prisma.question.findMany({
        where: {
          id: {
            notIn: gameState.answeredQuestions,
          },
        },
      });

      if (questions.length === 0) {
        return NextResponse.json(
          { error: 'No questions available' },
          { status: 400 }
        );
      }

      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

      updatedGameState = await prisma.gameState.update({
        where: { id: gameState.id },
        data: {
          currentQuestion: randomQuestion.id,
          currentCodingQuestion: null, // Очищаем coding вопрос
          playersAnswered: [], // Сбрасываем список ответивших
        },
      });
    } else if (type === 'coding') {
      // Получаем случайную coding задачу, которая еще не была отвечена
      const codingQuestions = await prisma.codingQuestion.findMany({
        where: {
          id: {
            notIn: gameState.answeredCodingQuestions,
          },
        },
      });

      if (codingQuestions.length === 0) {
        return NextResponse.json(
          { error: 'No coding questions available' },
          { status: 400 }
        );
      }

      const randomCodingQuestion = codingQuestions[Math.floor(Math.random() * codingQuestions.length)];

      updatedGameState = await prisma.gameState.update({
        where: { id: gameState.id },
        data: {
          currentCodingQuestion: randomCodingQuestion.id,
          currentQuestion: null, // Очищаем обычный вопрос
          playersAnswered: [], // Сбрасываем список ответивших
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid question type' },
        { status: 400 }
      );
    }

    return NextResponse.json(updatedGameState);
  } catch (error) {
    console.error('Error loading next question:', error);
    return NextResponse.json(
      { error: 'Failed to load next question' },
      { status: 500 }
    );
  }
}