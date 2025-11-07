import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {prisma} from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');

    const codingQuestions = await prisma.codingQuestion.findMany({
      where: {
        ...(category && { category }),
        ...(difficulty && { difficulty }),
      },
      include: {
        testCases: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    // Преобразуем в формат для экспорта
    const exportData = codingQuestions.map(question => ({
      title: question.title,
      description: question.description,
      initialCode: question.initialCode,
      language: question.language,
      difficulty: question.difficulty,
      points: question.points,
      category: question.category,
      expectedOutput: question.expectedOutput || undefined,
      requiresManualReview: question.requiresManualReview,
      testCases: question.testCases.map(testCase => ({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        isHidden: testCase.isHidden,
      })),
    }));

    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="coding-questions.json"'
      }
    });
  } catch (error) {
    console.error('Export coding questions error:', error);
    return NextResponse.json(
      { error: 'Ошибка экспорта вопросов' },
      { status: 500 }
    );
  }
}