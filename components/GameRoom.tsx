'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Question, CodingQuestion, Player, GameState } from '@/types';
import { useRouter } from 'next/navigation';

import CodingEditor from './CodingEditor';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import AdminControls from './AdminControl';
import PlayersList from './PlayersList';
import LogoutButton from './LogoutButton';

export default function GameRoom() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | CodingQuestion | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Редирект если не авторизован
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const isAdmin = session?.user?.isAdmin;
  const currentPlayer = players?.find(p => p.username === session?.user?.username);

  // Основной useEffect для загрузки данных
  useEffect(() => {
    if (status === 'authenticated') {
      fetchGameState();
      fetchPlayers();
      const interval = setInterval(fetchGameState, 3000);
      return () => clearInterval(interval);
    }
  }, [status]); // Добавлена зависимость status

  // useEffect для загрузки текущего вопроса
  useEffect(() => {
    if (gameState?.currentQuestion) {
      fetchCurrentQuestion();
    } else if (gameState?.currentCodingQuestion) {
      fetchCurrentCodingQuestion();
    } else {
      setCurrentQuestion(null); // Сброс вопроса если нет активного
    }
  }, [gameState?.currentQuestion, gameState?.currentCodingQuestion]); // Добавлены зависимости

  useEffect(() => {
    if (timeLeft === 0) {
      handleTimeUp();
    }
  }, [timeLeft]);

  const fetchGameState = async () => {
    try {
      const response = await fetch('/api/game-state');
      if (!response.ok) throw new Error('Failed to fetch game state');
      const data = await response.json();
      setGameState(data);
    } catch (error) {
      console.error('Error fetching game state:', error);
    }
  };

  const fetchPlayers = async () => {
  try {
    const response = await fetch('/api/admin/players');
    if (!response.ok) throw new Error('Failed to fetch players');
    const data = await response.json();
    
    // Извлекаем players из ответа
    setPlayers(data.players || data); // data.players если есть, иначе data
    setIsLoading(false);
  } catch (error) {
    console.error('Error fetching players:', error);
    setIsLoading(false);
  }
};

  const fetchCurrentQuestion = async () => {
    try {
      const response = await fetch(`/api/questions/${gameState?.currentQuestion}`);
      if (!response.ok) throw new Error('Failed to fetch question');
      const data = await response.json();
      setCurrentQuestion(data);
    } catch (error) {
      console.error('Error fetching question:', error);
    }
  };

  const fetchCurrentCodingQuestion = async () => {
    try {
      const response = await fetch(`/api/coding-questions/${gameState?.currentCodingQuestion}`);
      if (!response.ok) throw new Error('Failed to fetch coding question');
      const data = await response.json();
      setCurrentQuestion(data);
    } catch (error) {
      console.error('Error fetching coding question:', error);
    }
  };

  const handleAnswerSubmit = async (answer: string) => {
    if (!currentPlayer || !currentQuestion) return;

    try {
      const response = await fetch('/api/submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: currentPlayer.id,
          questionId: currentQuestion.id,
          answer,
          questionType: 'multiple-choice'
        }),
      });

      if (response.ok) {
        fetchPlayers(); // Обновляем список игроков
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleCodingSubmit = async () => {
    if (!currentPlayer) return;
    fetchPlayers(); // Обновляем список игроков после сабмита
  };

  const handleTimeUp = () => {
    setTimeLeft(null);
  };
/* eslint-disable  @typescript-eslint/no-explicit-any */
  const isCodingQuestion = (question: any): question is CodingQuestion => {
    return question && 'initialCode' in question;
  };

  const hasPlayerAnswered = () => {
    if (!currentPlayer || !gameState) return false;
    return gameState.playersAnswered.includes(currentPlayer.id);
  };

  // Показываем загрузку пока проверяется авторизация
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Редирект уже произойдет
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка игровой комнаты...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-16">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold text-gray-900">CodingBattle</h1>
        {gameState?.isActive && (
          <span className="ml-4 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Игра активна
          </span>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        {currentPlayer && (
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{currentPlayer.username}</p>
            <p className="text-sm text-gray-500">{currentPlayer.score} очков</p>
          </div>
        )}
        <LogoutButton />
      </div>
    </div>
  </div>
</header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Основная область - вопрос */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-6">
              {!gameState?.isActive ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎮</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Ожидание начала игры
                  </h2>
                  <p className="text-gray-600">
                    Администратор запустит игру в ближайшее время
                  </p>
                </div>
              ) : !currentQuestion ? (
                <div className="text-center py-12">
                  <div className="animate-pulse text-6xl mb-4">⏳</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Ожидание вопроса...
                  </h2>
                </div>
              ) : hasPlayerAnswered() ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✅</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Ответ принят!
                  </h2>
                  <p className="text-gray-600">
                    Ожидайте следующий вопрос или окончание игры
                  </p>
                </div>
              ) : isCodingQuestion(currentQuestion) ? (
                <CodingEditor
                  question={currentQuestion}
                  playerId={currentPlayer?.id || ''}
                  onSubmit={handleCodingSubmit}
                />
              ) : (
                <MultipleChoiceQuestion
                  question={currentQuestion}
                  onSubmit={handleAnswerSubmit}
                  timeLimit={timeLeft || undefined}
                />
              )}
            </div>

            {/* Статистика игры (только для админа) */}
            {isAdmin && (
              <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
                <AdminControls 
                  gameState={gameState}
                  onGameStateChange={fetchGameState}
                />
              </div>
            )}
          </div>

          {/* Боковая панель - список игроков */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <PlayersList 
                players={players}
                currentPlayerId={currentPlayer?.id}
                playersAnswered={gameState?.playersAnswered || []}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}