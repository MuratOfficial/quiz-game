
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Получить конкретный вопрос по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    
    const question = await prisma.question.findUnique({
      where: { id }
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Вопрос не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error('Get question error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения вопроса' },
      { status: 500 }
    );
  }
}

// PUT - Обновить вопрос
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const questionData = await request.json();

    // Проверяем существование вопроса
    const existingQuestion = await prisma.question.findUnique({
      where: { id }
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Вопрос не найден' },
        { status: 404 }
      );
    }

    function getCategoryColor(category: string): string {
      switch (category) {
        case 'HTML': return 'bg-red-500';
        case 'CSS': return 'bg-blue-500';
        case 'Информатика': return 'bg-green-500';
        default: return 'bg-gray-500';
      }
    }

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        category: questionData.category,
        color: getCategoryColor(questionData.category),
        points: questionData.points,
        type: questionData.type,
        question: questionData.question,
        options: questionData.options || [],
        correctAnswer: questionData.correctAnswer
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Вопрос успешно обновлен',
      question: updatedQuestion 
    });
    /* eslint-disable  @typescript-eslint/no-explicit-any */
  } catch (error: any) {
    console.error('Update question error:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Вопрос с таким текстом уже существует' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Ошибка обновления вопроса' },
      { status: 500 }
    );
  }
}

// DELETE - Удалить вопрос
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    
    // Проверяем существование вопроса
    const existingQuestion = await prisma.question.findUnique({
      where: { id }
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Вопрос не найден' },
        { status: 404 }
      );
    }

    await prisma.question.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Вопрос успешно удален' 
    });
  } catch (error) {
    console.error('Delete question error:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления вопроса' },
      { status: 500 }
    );
  }
}