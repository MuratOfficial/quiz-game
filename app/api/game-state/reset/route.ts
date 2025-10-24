
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
    // Сбрасываем всех игроков
    await prisma.player.updateMany({
      data: {
        score: 0,
        isActive: true
      }
    });

    // Сбрасываем состояние игры
    const gameState = await prisma.gameState.findFirst();
    if (gameState) {
      await prisma.gameState.update({
        where: { id: gameState.id },
        data: {
          isActive: false,
          currentQuestion: null,
          currentCodingQuestion: null,
          playersAnswered: [],
          answeredQuestions: [],
          answeredCodingQuestions: [],
        }
      });
    }

    return NextResponse.json({ success: true, message: 'Game reset successfully' });
  } catch (error) {
    console.error('Error resetting game:', error);
    return NextResponse.json(
      { error: 'Failed to reset game' },
      { status: 500 }
    );
  }
}