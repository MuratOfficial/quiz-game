
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Получить текущее состояние игры
export async function GET() {
  try {
    let gameState = await prisma.gameState.findFirst();
    
    if (!gameState) {
      gameState = await prisma.gameState.create({
        data: {
          isActive: false,
          playersAnswered: [],
          answeredQuestions: [],
          answeredCodingQuestions: [],
        },
      });
    }
    
    return NextResponse.json(gameState);
  } catch (error) {
    console.error('Error fetching game state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game state' },
      { status: 500 }
    );
  }
}

// POST - Обновить состояние игры (старт/стоп)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { isActive } = await req.json();

    let gameState = await prisma.gameState.findFirst();
    
    if (!gameState) {
      gameState = await prisma.gameState.create({
        data: {
          isActive,
          playersAnswered: [],
          answeredQuestions: [],
          answeredCodingQuestions: [],
        },
      });
    } else {
      gameState = await prisma.gameState.update({
        where: { id: gameState.id },
        data: { 
          isActive,
          // Сбрасываем answered players при старте новой игры
          ...(isActive && {
            playersAnswered: [],
            currentQuestion: null,
            currentCodingQuestion: null,
          })
        },
      });
    }

    return NextResponse.json(gameState);
  } catch (error) {
    console.error('Error updating game state:', error);
    return NextResponse.json(
      { error: 'Failed to update game state' },
      { status: 500 }
    );
  }
}