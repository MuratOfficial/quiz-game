// app/api/admin/scores/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Требуются права администратора' },
      { status: 403 }
    );
  }

  try {
    // Получаем всех игроков для расчета статистики
    const players = await prisma.player.findMany({
      select: {
        id: true,
        username: true,
        score: true,
        isActive: true,
      },
    });

    // Получаем распределение очков через группировку
    const scoreDistribution = await prisma.player.groupBy({
      by: ['score'],
      _count: {
        _all: true,
      },
      orderBy: {
        score: 'desc',
      },
    });

    // Последние сабмишны
    const recentSubmissions = await prisma.codingSubmission.findMany({
      include: {
        player: {
          select: {
            username: true,
          },
        },
        codingQuestion: {
          select: {
            title: true,
            points: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Рассчитываем статистику вручную
    const totalPlayers = players.length;
    const totalScore = players.reduce((sum, player) => sum + player.score, 0);
    const averageScore = totalPlayers > 0 ? Math.round(totalScore / totalPlayers) : 0;
    const activePlayers = players.filter(p => p.isActive).length;
    const topPlayers = players
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        totalPlayers,
        activePlayers,
        totalScore,
        averageScore,
        scoreDistribution: scoreDistribution.map(item => ({
          score: item.score,
          count: item._count._all,
        })),
        topPlayers,
        recentSubmissions,
      },
    });
  } catch (error) {
    console.error('Get score stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка получения статистики' },
      { status: 500 }
    );
  }
}