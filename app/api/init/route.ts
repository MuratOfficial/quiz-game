import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Начало инициализации базы данных...');

    // Создаем администратора
    await prisma.user.upsert({
      where: { username: 'admin' },
      update: {
        password: 'admin123',
        isAdmin: true,
      },
      create: {
        username: 'admin',
        password: 'admin123',
        isAdmin: true,
      },
    });
    console.log('Администратор создан/обновлен');

    // Создаем начальные вопросы
    const initialQuestions = [
      {
        category: 'HTML',
        type: 'multiple',
        question: 'Какой тег используется для создания гиперссылки?',
        options: ['<link>', '<a>', '<href>', '<url>'],
        correctAnswer: '<a>',
        points: 10,
        color: 'bg-red-500',
      },
      {
        category: 'CSS',
        type: 'input',
        question: 'Какое свойство CSS используется для изменения цвета текста?',
        options: [],
        correctAnswer: 'color',
        points: 15,
        color: 'bg-blue-500',
      },
      {
        category: 'Информатика',
        type: 'multiple',
        question: 'Что означает аббревиатура HTML?',
        options: [
          'Hyper Text Markup Language',
          'High Tech Modern Language',
          'Hyper Transfer Markup Language',
          'Home Tool Markup Language',
        ],
        correctAnswer: 'Hyper Text Markup Language',
        points: 20,
        color: 'bg-green-500',
      },
      {
        category: 'HTML',
        type: 'multiple',
        question: 'Какой тег используется для создания упорядоченного списка?',
        options: ['<ul>', '<ol>', '<li>', '<list>'],
        correctAnswer: '<ol>',
        points: 10,
        color: 'bg-red-500',
      },
      {
        category: 'CSS',
        type: 'multiple',
        question: 'Какое свойство отвечает за внешние отступы?',
        options: ['padding', 'margin', 'border', 'spacing'],
        correctAnswer: 'margin',
        points: 15,
        color: 'bg-blue-500',
      },
      {
        category: 'Информатика',
        type: 'input',
        question: 'Сколько бит в одном байте?',
        options: [],
        correctAnswer: '8',
        points: 10,
        color: 'bg-green-500',
      },
      {
        category: 'HTML',
        type: 'input',
        question: 'Какой атрибут используется для задания альтернативного текста изображению?',
        options: [],
        correctAnswer: 'alt',
        points: 10,
        color: 'bg-red-500',
      },
      {
        category: 'CSS',
        type: 'multiple',
        question: 'Какое значение position делает элемент абсолютно позиционированным?',
        options: ['relative', 'absolute', 'fixed', 'static'],
        correctAnswer: 'absolute',
        points: 20,
        color: 'bg-blue-500',
      },
      {
        category: 'Информатика',
        type: 'multiple',
        question: 'Что такое HTTP?',
        options: [
          'HyperText Transfer Protocol',
          'High Transfer Text Protocol',
          'Hyper Transfer Text Protocol',
          'High Text Transfer Protocol',
        ],
        correctAnswer: 'HyperText Transfer Protocol',
        points: 15,
        color: 'bg-green-500',
      },
      {
        category: 'HTML',
        type: 'multiple',
        question: 'Какой тег используется для создания таблицы?',
        options: ['<table>', '<tab>', '<grid>', '<tr>'],
        correctAnswer: '<table>',
        points: 10,
        color: 'bg-red-500',
      },
    ];

    for (const questionData of initialQuestions) {
      await prisma.question.upsert({
        where: { question: questionData.question },
        update: questionData,
        create: questionData,
      });
      console.log(`Вопрос добавлен: ${questionData.question}`);
    }

    // Создаем начальное состояние игры
    // Сначала удаляем существующее состояние игры, если есть
    const existingGameState = await prisma.gameState.findFirst();
    
    if (existingGameState) {
      await prisma.gameState.delete({
        where: { id: existingGameState.id }
      });
      console.log('Существующее состояние игры удалено');
    }

    // Создаем новое состояние игры
    const gameState = await prisma.gameState.create({
      data: {
        isActive: false,
        playersAnswered: [],
        answeredQuestions: [],
      },
    });
    console.log('Состояние игры создано');

    // Получаем статистику
    const usersCount = await prisma.user.count();
    const questionsCount = await prisma.question.count();
    const playersCount = await prisma.player.count();

    console.log('Инициализация завершена успешно!');

    return NextResponse.json({
      success: true,
      message: 'База данных успешно инициализирована',
      stats: {
        users: usersCount,
        players: playersCount,
        questions: questionsCount,
        gameState: gameState ? 'Создано' : 'Ошибка',
      },
    });
  } catch (error) {
    console.error('Init error details:', error);
    
    // Более детальный вывод ошибки
    let errorMessage = 'Неизвестная ошибка';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка инициализации базы данных',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}