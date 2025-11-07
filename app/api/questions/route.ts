
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { QuestionRequest } from '@/types';

function getCategoryColor(category: string): string {
  switch (category) {
    case 'HTML': return 'bg-red-500';
    case 'CSS': return 'bg-blue-500';
    case 'Информатика': return 'bg-green-500';
    case 'JavaScript': return 'bg-yellow-500';
    case 'React': return 'bg-blue-400';
    case 'Node.js': return 'bg-green-400';
    default: return 'bg-gray-500';
  }
}

// GET - Получить все вопросы
export async function GET(): Promise<NextResponse> {
  try {
    const questions = await prisma.question.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({
      success: true,
      data: questions,
      count: questions.length
    });
  } catch (error) {
    console.error('Get questions error:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка загрузки вопросов' }, 
      { status: 500 }
    );
  }
}

// POST - Создать новый вопрос
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const questionData: QuestionRequest = await request.json();
    
    // Валидация
    if (!questionData.question || !questionData.category || !questionData.correctAnswer) {
      return NextResponse.json(
        { success: false, error: 'Все обязательные поля должны быть заполнены' },
        { status: 400 }
      );
    }

    const newQuestion = await prisma.question.create({
      data: {
        category: questionData.category,
        color: getCategoryColor(questionData.category),
        points: questionData.points || 10,
        type: questionData.type || 'multiple-choice',
        question: questionData.question,
        options: questionData.options || [],
        correctAnswer: questionData.correctAnswer
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Вопрос успешно создан',
      data: newQuestion 
    });
    /* eslint-disable  @typescript-eslint/no-explicit-any */
  } catch (error: any) {
    console.error('Create question error:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Вопрос с таким текстом уже существует' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Ошибка создания вопроса' }, 
      { status: 500 }
    );
  }
}

// DELETE - Удалить вопрос (альтернативный вариант через query параметр)
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID вопроса обязателен' },
        { status: 400 }
      );
    }

    // Проверяем существование вопроса
    const existingQuestion = await prisma.question.findUnique({
      where: { id }
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { success: false, error: 'Вопрос не найден' },
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
      { success: false, error: 'Ошибка удаления вопроса' },
      { status: 500 }
    );
  }
}