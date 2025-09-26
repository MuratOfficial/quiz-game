import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { QuestionRequest, Database, Question } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const questionData: QuestionRequest = await request.json();
    const db: Database = readDB();

    const newQuestion: Question = {
      id: Date.now(),
      color: getCategoryColor(questionData.category),
      ...questionData
    };

    db.questions.push(newQuestion);
    writeDB(db);

    return NextResponse.json({ success: true, question: newQuestion });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка добавления вопроса' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { id } = await request.json();
    const db: Database = readDB();

    db.questions = db.questions.filter((q: Question) => q.id !== id);
    writeDB(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка удаления вопроса' }, { status: 500 });
  }
}

function getCategoryColor(category: 'HTML' | 'CSS' | 'Информатика'): string {
  switch (category) {
    case 'HTML': return 'bg-red-500';
    case 'CSS': return 'bg-blue-500';
    case 'Информатика': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
}