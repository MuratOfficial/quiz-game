
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Получить все coding вопросы
export async function GET() {
  try {
    const codingQuestions = await prisma.codingQuestion.findMany({
      include: {
        testCases: true,
        codingSubmissions: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(codingQuestions);
  } catch (error) {
    console.error('Get coding questions error:', error);
    return NextResponse.json(
      { error: 'Ошибка получения coding вопросов' },
      { status: 500 }
    );
  }
}

// POST - Создать новый coding вопрос
export async function POST(req: NextRequest) {
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

    // Валидация
    if (!title || !description || !initialCode || !points || !category) {
      return NextResponse.json(
        { error: 'Все обязательные поля должны быть заполнены' },
        { status: 400 }
      );
    }

    const codingQuestion = await prisma.codingQuestion.create({
      data: {
        title,
        description,
        initialCode,
        language: language || 'javascript',
        difficulty: difficulty || 'medium',
        points: parseInt(points),
        category,
        expectedOutput,
        requiresManualReview: requiresManualReview || false,
        testCases: {
          create: testCases || []
        }
      },
      include: {
        testCases: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Coding вопрос успешно создан',
      question: codingQuestion
    });
/* eslint-disable  @typescript-eslint/no-explicit-any */
  } catch (error: any) {
    console.error('Create coding question error:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Вопрос с таким названием уже существует' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Ошибка создания coding вопроса' },
      { status: 500 }
    );
  }
}