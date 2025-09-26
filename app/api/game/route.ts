import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { GameActionRequest, Database, Question, Player } from '@/types';

export async function GET(): Promise<NextResponse> {
  try {
    const db: Database = readDB();
    return NextResponse.json({
      players: db.players.filter((p: Player) => p.isActive),
      gameState: db.gameState,
      questions: db.questions
    });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка загрузки данных' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { action, data }: GameActionRequest = await request.json();
    const db: Database = readDB();

    switch (action) {
      case 'startGame':
        db.gameState = {
          isActive: true,
          currentQuestion: null,
          playersAnswered: [],
          answeredQuestions: []
        };
        break;

      case 'nextQuestion':
        const unansweredQuestions: Question[] = db.questions.filter((q: Question) => 
          !db.gameState.answeredQuestions?.includes(q.id)
        );
        
        if (unansweredQuestions.length > 0) {
          const randomQuestion: Question = unansweredQuestions[
            Math.floor(Math.random() * unansweredQuestions.length)
          ];
          
          db.gameState.currentQuestion = randomQuestion;
          db.gameState.playersAnswered = [];
          
          if (!db.gameState.answeredQuestions) {
            db.gameState.answeredQuestions = [];
          }
          db.gameState.answeredQuestions.push(randomQuestion.id);
        } else {
          db.gameState.isActive = false;
        }
        break;

      case 'submitAnswer':
        if (!data?.playerId || !data.answer) {
          return NextResponse.json({ error: 'Неверные данные' }, { status: 400 });
        }

        const player: Player | undefined = db.players.find((p: Player) => p.id === data.playerId);
        const currentQuestion: Question | null = db.gameState.currentQuestion;

        if (player && currentQuestion && !db.gameState.playersAnswered.includes(data.playerId)) {
          let isCorrect: boolean = false;
          
          if (currentQuestion.type === 'multiple') {
            isCorrect = data.answer === currentQuestion.correctAnswer;
          } else if (currentQuestion.type === 'input') {
            isCorrect = data.answer.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase();
          }

          if (isCorrect) {
            player.score = (player.score || 0) + currentQuestion.points;
          }

          db.gameState.playersAnswered.push(data.playerId);
        }
        break;

      case 'endGame':
        db.gameState = {
          isActive: false,
          currentQuestion: null,
          playersAnswered: []
        };
        // Деактивируем всех игроков
        db.players.forEach((p: Player) => p.isActive = false);
        break;

      default:
        return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
    }

    writeDB(db);
    return NextResponse.json({ success: true, gameState: db.gameState });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка обновления игры' }, { status: 500 });
  }
}