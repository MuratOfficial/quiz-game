'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { User, Player, GameState, Question } from '@/types';

export default function Game() {
  const [user, setUser] = useState<User | Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    isActive: false,
    currentQuestion: null,
    playersAnswered: []
  });
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const response = await fetch('/api/game');
        const data = await response.json();
        
        setPlayers(data.players || []);
        setGameState(data.gameState || {});
        setCurrentQuestion(data.gameState?.currentQuestion || null);
        
        // Проверяем, ответил ли текущий пользователь
        if (user && data.gameState?.playersAnswered?.includes(user.id)) {
          setHasAnswered(true);
        } else {
          setHasAnswered(false);
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    };

    fetchGameData();
    const interval = setInterval(fetchGameData, 1000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (gameState.isActive && currentQuestion) {
      setTimeLeft(30);
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [currentQuestion, gameState.isActive]);

  const handleAnswerSubmit = async (answer: string) => {
    if (!user || hasAnswered) return;

    try {
      await fetch('/api/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'submitAnswer',
          data: {
            playerId: user.id,
            answer: answer
          }
        }),
      });
      
      setHasAnswered(true);
      setSelectedAnswer(answer);
    } catch (error) {
      console.error('Ошибка отправки ответа:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-800">Игровая комната</h1>
          <div className="flex items-center space-x-4">
            <div className="bg-white px-4 py-2 rounded-lg shadow">
              <span className="font-medium">{user.username}</span>
              <span className="ml-2 text-indigo-600">Очки: {'score' in user ? user.score : 0}</span>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('user');
                router.push('/');
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Выйти
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Таблица лидеров */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Таблица лидеров</h2>
              <div className="space-y-3">
                {players
                  .sort((a, b) => (b.score || 0) - (a.score || 0))
                  .map((player, index) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        player.id === user.id ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                          {player.username.charAt(0).toUpperCase()}
                        </div>
                        <span className={player.id === user.id ? 'font-semibold text-indigo-700' : ''}>
                          {player.username}
                        </span>
                      </div>
                      <div className="font-semibold text-gray-700">{player.score || 0}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Игровая область */}
          <div className="lg:col-span-2">
            {!gameState.isActive ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Ожидание начала игры</h2>
                <p className="text-gray-600">Администратор скоро начнет игру</p>
                <div className="mt-6 text-sm text-gray-500">
                  Игроков онлайн: {players.length}
                </div>
              </div>
            ) : currentQuestion ? (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className={`px-4 py-2 rounded-full text-white font-medium ${currentQuestion.color}`}>
                    {currentQuestion.category} • {currentQuestion.points} очков
                  </div>
                  <div className="text-lg font-semibold">
                    Время: <span className={timeLeft <= 10 ? 'text-red-500' : 'text-gray-700'}>{timeLeft}с</span>
                  </div>
                </div>

                <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                  {currentQuestion.question}
                </h2>

                {hasAnswered ? (
                  <div className="text-center py-8">
                    <div className="text-lg font-semibold text-gray-700 mb-4">
                      Вы ответили: {selectedAnswer}
                    </div>
                    <div className="text-gray-600">Ожидаем других игроков...</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentQuestion.type === 'multiple' ? (
                      currentQuestion.options?.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleAnswerSubmit(option)}
                          className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-4 text-left transition duration-200"
                        >
                          {option}
                        </button>
                      ))
                    ) : (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={selectedAnswer}
                          onChange={(e: FormEvent<HTMLInputElement>) => 
                            setSelectedAnswer(e.currentTarget.value)
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="Введите ваш ответ..."
                        />
                        <button
                          onClick={() => handleAnswerSubmit(selectedAnswer)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg"
                        >
                          Отправить ответ
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 text-sm text-gray-500 text-center">
                  Ответили: {gameState.playersAnswered?.length || 0} из {players.length} игроков
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Подготовка следующего вопроса</h2>
                <p className="text-gray-600">Ожидайте...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}