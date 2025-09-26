import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { QuestionRequest } from '@/types';

function getCategoryColor(category: string): string {
  switch (category) {
    case 'HTML': return 'bg-red-500';
    case 'CSS': return 'bg-blue-500';
    case 'Информатика': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const questions = await prisma.question.findMany();
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Get questions error:', error);
    return NextResponse.json({ error: 'Ошибка загрузки вопросов' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const questionData: QuestionRequest = await request.json();
    
    const newQuestion = await prisma.question.create({
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

    return NextResponse.json({ success: true, question: newQuestion });
  } catch (error) {
    console.error('Create question error:', error);
    return NextResponse.json({ error: 'Ошибка добавления вопроса' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { id } = await request.json();
    
    await prisma.question.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete question error:', error);
    return NextResponse.json({ error: 'Ошибка удаления вопроса' }, { status: 500 });
  }
}