
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Необходима авторизация' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    // Находим player по username пользователя
    const player = await prisma.player.findFirst({
      where: { username: session.user.username },
    });

    if (!player) {
      return NextResponse.json(
        { success: false, error: 'Профиль игрока не найден' },
        { status: 404 }
      );
    }

    const submissions = await prisma.codingSubmission.findMany({
      where: {
        playerId: player.id,
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
            requiresManualReview: true,
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
    console.error('Get my submissions error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка получения ваших решений' },
      { status: 500 }
    );
  }
}