
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface BulkScoreUpdate {
  playerId: string;
  score: number;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Требуются права администратора' },
      { status: 403 }
    );
  }

  try {
    const { updates }: { updates: BulkScoreUpdate[] } = await request.json();

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { success: false, error: 'Неверный формат данных' },
        { status: 400 }
      );
    }

    // Выполняем все обновления в транзакции
    const results = await prisma.$transaction(
      updates.map(update =>
        prisma.player.update({
          where: { id: update.playerId },
          data: { score: update.score },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Обновлено ${results.length} записей`,
      data: results,
    });
  } catch (error) {
    console.error('Bulk score update error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка массового обновления очков' },
      { status: 500 }
    );
  }
}