
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
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
    const { status, feedback } = await request.json();

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Неверный статус проверки' },
        { status: 400 }
      );
    }

    const submission = await prisma.codingSubmission.findUnique({
      where: { id },
      include: {
        codingQuestion: true,
        player: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'Решение не найдено' },
        { status: 404 }
      );
    }

    if (submission.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Решение уже проверено' },
        { status: 400 }
      );
    }

    /* eslint-disable  @typescript-eslint/no-explicit-any */
    const updateData: any = {
      status,
      reviewedBy: session.user.id,
      reviewFeedback: feedback || null,
    };

    if (status === 'approved') {
      updateData.isCorrect = true;
      updateData.score = submission.codingQuestion.points;
    } else {
      updateData.isCorrect = false;
      updateData.score = 0;
    }

    // Обновляем сабмишн
    const updatedSubmission = await prisma.codingSubmission.update({
      where: { id },
      data: updateData,
      include: {
        codingQuestion: {
          select: {
            id: true,
            title: true,
            points: true,
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

    // Если решение approved, начисляем очки игроку
    if (status === 'approved') {
      await prisma.player.update({
        where: { id: submission.playerId },
        data: {
          score: { increment: submission.codingQuestion.points },
        },
      });

      // Обновляем gameState
      const gameState = await prisma.gameState.findFirst();
      if (gameState && !gameState.playersAnswered.includes(submission.playerId)) {
        await prisma.gameState.update({
          where: { id: gameState.id },
          data: {
            playersAnswered: {
              push: submission.playerId,
            },
            answeredCodingQuestions: {
              push: submission.codingQuestionId,
            },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: status === 'approved' 
        ? 'Решение принято и очки начислены' 
        : 'Решение отклонено',
      data: updatedSubmission,
    });

  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка проверки решения' },
      { status: 500 }
    );
  }
}