
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Получить конкретный сабмишн
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const submission = await prisma.codingSubmission.findUnique({
      where: { id },
      include: {
        codingQuestion: {
          include: {
            testCases: true,
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
    });

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'Решение не найдено' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: submission,
    });
  } catch (error) {
    console.error('Get coding submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка получения решения' },
      { status: 500 }
    );
  }
}

// DELETE - Удалить сабмишн (только для админа)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Требуются права администратора' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;

    const submission = await prisma.codingSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'Решение не найдено' },
        { status: 404 }
      );
    }

    // Если решение было approved, отнимаем очки у игрока
    if (submission.status === 'approved' && submission.score) {
      await prisma.player.update({
        where: { id: submission.playerId },
        data: {
          score: { decrement: submission.score },
        },
      });
    }

    await prisma.codingSubmission.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Решение успешно удалено',
    });
  } catch (error) {
    console.error('Delete coding submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка удаления решения' },
      { status: 500 }
    );
  }
}