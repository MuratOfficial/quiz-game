import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GameActionRequest } from '@/types';

export async function GET(): Promise<NextResponse> {
  try {
    const [players, gameState, questions] = await Promise.all([
      prisma.player.findMany({ where: { isActive: true } }),
      prisma.gameState.findFirst(),
      prisma.question.findMany()
    ]);

    let currentQuestion = null;
    if (gameState?.currentQuestion) {
      currentQuestion = await prisma.question.findUnique({
        where: { id: gameState.currentQuestion }
      });
    }

    return NextResponse.json({
      players,
      gameState: {
        ...gameState,
        currentQuestion
      },
      questions
    });
  } catch (error) {
    console.error('Get game data error:', error);
    return NextResponse.json({ error: 'Ошибка загрузки данных' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { action, data }: GameActionRequest = await request.json();
    
    switch (action) {
      case 'startGame':
        await prisma.gameState.deleteMany();
        
        await prisma.gameState.create({
          data: {
            isActive: true,
            playersAnswered: [],
            answeredQuestions: []
          }
        });
        break;

      case 'nextQuestion':
        const gameState = await prisma.gameState.findFirst();
        if (!gameState) break;

        const allQuestions = await prisma.question.findMany();
        const unansweredQuestions = allQuestions.filter(q => 
          !gameState.answeredQuestions.includes(q.id)
        );
        
        if (unansweredQuestions.length > 0) {
          const randomQuestion = unansweredQuestions[
            Math.floor(Math.random() * unansweredQuestions.length)
          ];
          
          await prisma.gameState.updateMany({
            data: {
              currentQuestion: randomQuestion.id,
              playersAnswered: [],
              answeredQuestions: {
                push: randomQuestion.id
              }
            }
          });
        } else {
          // Завершаем игру если вопросы закончились
          await prisma.gameState.updateMany({
            data: {
              isActive: false,
              currentQuestion: null
            }
          });
        }
        break;

      case 'submitAnswer':
        if (!data?.playerId || !data.answer) {
          return NextResponse.json({ error: 'Неверные данные' }, { status: 400 });
        }

        const currentGameState = await prisma.gameState.findFirst();
        if (!currentGameState?.currentQuestion) break;

        const player = await prisma.player.findUnique({
          where: { id: data.playerId }
        });

        const question = await prisma.question.findUnique({
          where: { id: currentGameState.currentQuestion }
        });

        if (player && question && !currentGameState.playersAnswered.includes(data.playerId)) {
          let isCorrect = false;
          
          if (question.type === 'multiple') {
            isCorrect = data.answer === question.correctAnswer;
          } else if (question.type === 'input') {
            isCorrect = data.answer.toLowerCase().trim() === question.correctAnswer.toLowerCase();
          }

          if (isCorrect) {
            await prisma.player.update({
              where: { id: data.playerId },
              data: { score: { increment: question.points } }
            });
          }

          await prisma.gameState.updateMany({
            data: {
              playersAnswered: {
                push: data.playerId
              }
            }
          });
        }
        break;

      case 'endGame':
        await prisma.gameState.updateMany({
          data: {
            isActive: false,
            currentQuestion: null,
            playersAnswered: []
          }
        });
        
        await prisma.player.updateMany({
          data: { isActive: false }
        });
        break;

      default:
        return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
    }

    const updatedGameState = await prisma.gameState.findFirst();
    return NextResponse.json({ success: true, gameState: updatedGameState });
  } catch (error) {
    console.error('Game action error:', error);
    return NextResponse.json({ error: 'Ошибка обновления игры' }, { status: 500 });
  }
}