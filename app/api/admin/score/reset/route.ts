
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Требуются права администратора' },
      { status: 403 }
    );
  }

  try {
    // Сбрасываем очки всех игроков
    await prisma.player.updateMany({
      data: {
        score: 0,
      },
    });

    // Сбрасываем все сабмишны
    await prisma.codingSubmission.updateMany({
      data: {
        score: 0,
        isCorrect: false,
        status: 'rejected',
      },
    });

    // Сбрасываем состояние игры
    const gameState = await prisma.gameState.findFirst();
    if (gameState) {
      await prisma.gameState.update({
        where: { id: gameState.id },
        data: {
          playersAnswered: [],
          answeredQuestions: [],
          answeredCodingQuestions: [],
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Все очки успешно сброшены',
    });
  } catch (error) {
    console.error('Reset scores error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сброса очков' },
      { status: 500 }
    );
  }
}