
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

// GET - Получить конкретный coding вопрос
export async function GET(req: NextRequest,  { params }: { params: Promise<{ id: string }>}) {
  try {
     const { id } = await params;
    const codingQuestion = await prisma.codingQuestion.findUnique({
      where: { id },
      include: {
        testCases: true,
        codingSubmissions: {
          include: {
            player: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!codingQuestion) {
      return NextResponse.json(
        { error: 'Coding вопрос не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json(codingQuestion);
  } catch (error) {
    console.error('Get coding question error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения coding вопроса' },
      { status: 500 }
    );
  }
}

// PUT - Обновить coding вопрос
export async function PUT(req: NextRequest,{ params }: { params: Promise<{ id: string }>}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { 
      title, 
      description, 
      initialCode, 
      language, 
      difficulty, 
      points, 
      category, 
      testCases,
      expectedOutput,
      requiresManualReview 
    } = await req.json();

    const { id } = await params;

    const existingQuestion = await prisma.codingQuestion.findUnique({
      where: { id },
      include: { testCases: true }
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Coding вопрос не найден' },
        { status: 404 }
      );
    }

    // Обновляем вопрос
    const updatedQuestion = await prisma.codingQuestion.update({
      where: { id },
      data: {
        title,
        description,
        initialCode,
        language,
        difficulty,
        points: parseInt(points),
        category,
        expectedOutput,
        requiresManualReview,
      },
      include: {
        testCases: true
      }
    });

    // Если есть новые тест кейсы, обновляем их
    if (testCases && Array.isArray(testCases)) {
      // Удаляем старые тест кейсы
      await prisma.testCase.deleteMany({
        where: { codingQuestionId: id }
      });

      // Создаем новые тест кейсы
      await prisma.testCase.createMany({
        /* eslint-disable  @typescript-eslint/no-explicit-any */
        data: testCases.map((testCase: any) => ({
          ...testCase,
          codingQuestionId: id
        }))
      });
    }

    const finalQuestion = await prisma.codingQuestion.findUnique({
      where: { id: id },
      include: { testCases: true }
    });

    return NextResponse.json({
      success: true,
      message: 'Coding вопрос успешно обновлен',
      question: finalQuestion
    });
/* eslint-disable  @typescript-eslint/no-explicit-any */
  } catch (error: any) {
    console.error('Update coding question error:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления coding вопроса' },
      { status: 500 }
    );
  }
}

// DELETE - Удалить coding вопрос
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }>}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  try {
    await prisma.codingQuestion.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Coding вопрос успешно удален'
    });
  } catch (error) {
    console.error('Delete coding question error:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления coding вопроса' },
      { status: 500 }
    );
  }
}