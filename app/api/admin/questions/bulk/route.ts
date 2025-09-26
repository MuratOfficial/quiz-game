import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BulkQuestionsRequest } from '@/types';

function getCategoryColor(category: string): string {
  switch (category) {
    case 'HTML': return 'bg-red-500';
    case 'CSS': return 'bg-blue-500';
    case 'Информатика': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
}

// POST - Массовое добавление вопросов из JSON
export async function POST(request: NextRequest) {
  try {
    const { questions }: BulkQuestionsRequest = await request.json();
    
    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { success: false, error: 'Неверный формат данных. Ожидается массив вопросов.' },
        { status: 400 }
      );
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Массив вопросов пуст' },
        { status: 400 }
      );
    }

    // Валидация вопросов
    const validatedQuestions = questions.map((q, index) => {
      if (!q.question) {
        throw new Error(`Вопрос ${index + 1}: отсутствует текст вопроса`);
      }
      if (!q.category) {
        throw new Error(`Вопрос ${index + 1}: отсутствует категория`);
      }
      if (!q.type) {
        throw new Error(`Вопрос ${index + 1}: отсутствует тип вопроса`);
      }
      if (!q.correctAnswer) {
        throw new Error(`Вопрос ${index + 1}: отсутствует правильный ответ`);
      }
      if (q.points === undefined || q.points < 1) {
        throw new Error(`Вопрос ${index + 1}: некорректное количество очков`);
      }

      return {
        category: q.category,
        type: q.type,
        question: q.question.trim(),
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        points: q.points,
        color: getCategoryColor(q.category),
      };
    });

    const results = {
      added: 0,
      updated: 0,
      errors: [] as string[],
    };

    // Добавляем/обновляем вопросы
    for (const questionData of validatedQuestions) {
      try {
        await prisma.question.upsert({
          where: { question: questionData.question },
          update: questionData,
          create: questionData,
        });
        
        results.added++;
        /* eslint-disable  @typescript-eslint/no-explicit-any */
      } catch (error: any) {
        if (error.code === 'P2002') {
          results.updated++;
        } else {
          results.errors.push(`Ошибка при добавлении вопроса "${questionData.question}": ${error.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Обработка завершена. Добавлено: ${results.added}, Обновлено: ${results.updated}`,
      results,
      totalProcessed: questions.length,
    });
    /* eslint-disable  @typescript-eslint/no-explicit-any */
  } catch (error: any) {
    console.error('Bulk questions error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка массового добавления вопросов',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET - Шаблон для массового добавления
export async function GET() {
  const template = {
    questions: [
      {
        category: "HTML",
        type: "multiple",
        question: "Пример вопроса с выбором ответа",
        options: ["Правильный ответ", "Неправильный ответ 1", "Неправильный ответ 2", "Неправильный ответ 3"],
        correctAnswer: "Правильный ответ",
        points: 10
      },
      {
        category: "CSS",
        type: "input",
        question: "Пример вопроса с текстовым ответом",
        options: [],
        correctAnswer: "правильный ответ",
        points: 15
      }
    ]
  };

  return NextResponse.json({
    success: true,
    template,
    instructions: `
Инструкция по формату JSON:
- questions: массив вопросов
- Каждый вопрос должен содержать:
  * category: "HTML" | "CSS" | "Информатика"
  * type: "multiple" | "input"
  * question: текст вопроса (уникальный)
  * options: массив вариантов ответа (для type="multiple")
  * correctAnswer: правильный ответ
  * points: количество очков (число)
    
Для вопросов типа "input" оставьте options: []
    `.trim()
  });
}