'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { User, Player, GameState, Question } from '@/types';

export default function Game() {
  const [user, setUser] = useState<User | Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    id: '',
    isActive: false,
    currentQuestion: '',
    playersAnswered: [],
    answeredQuestions: [],
    answeredCodingQuestions: [],
    createdAt: new Date()
  });
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [answeredQuestionId, setAnsweredQuestionId] = useState<string | null>(null);
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
        
        // Проверяем, ответил ли текущий пользователь на текущий вопрос
        if (user && data.gameState?.currentQuestion && data.gameState?.playersAnswered?.includes(user.id)) {
          setHasAnswered(true);
          setAnsweredQuestionId(data.gameState.currentQuestion.id || data.gameState.currentQuestion);
        } else if (data.gameState?.currentQuestion?.id !== answeredQuestionId) {
          // Если сменился вопрос, сбрасываем состояние ответа
          setHasAnswered(false);
          setAnsweredQuestionId(null);
          setIsSubmitting(false);
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    };

    fetchGameData();
    const interval = setInterval(fetchGameData, 1000);
    return () => clearInterval(interval);
  }, [user, answeredQuestionId]);

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
    if (!user || hasAnswered || isSubmitting) {
      console.log('Ответ уже отправлен или отправляется');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/game', {
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

      const result = await response.json();
      
      if (result.success) {
        setHasAnswered(true);
        setSelectedAnswer(answer);
        setAnsweredQuestionId(currentQuestion?.id || null);
        console.log('Ответ успешно отправлен');
      } else {
        console.error('Ошибка отправки ответа:', result.error);
        // В случае ошибки разрешаем повторную отправку
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Ошибка отправки ответа:', error);
      // В случае ошибки разрешаем повторную отправку
      setIsSubmitting(false);
    }
  };

  // Функция для безопасной отправки ответа с защитой от повторных нажатий
  const safeHandleAnswerSubmit = (answer: string) => {
    if (isSubmitting) {
      console.log('Запрос уже отправляется...');
      return;
    }
    
    if (hasAnswered) {
      console.log('Вы уже ответили на этот вопрос');
      return;
    }

    handleAnswerSubmit(answer);
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
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3 ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-500' : 'bg-indigo-500'
                        }`}>
                          {index + 1}
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
                      Вы ответили: <span className="text-indigo-600">{selectedAnswer}</span>
                    </div>
                    <div className="text-gray-600 animate-pulse">
                      ✅ Ответ принят! Ожидаем других игроков...
                    </div>
                    {isSubmitting && (
                      <div className="mt-2 text-sm text-yellow-600">
                        Завершаем обработку ответа...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentQuestion.type === 'multiple' ? (
                      currentQuestion.options?.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => safeHandleAnswerSubmit(option)}
                          disabled={isSubmitting}
                          className={`w-full border rounded-lg p-4 text-left transition duration-200 ${
                            isSubmitting 
                              ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
                              : 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center mr-3 ${
                              isSubmitting ? 'border-gray-300' : 'border-gray-400'
                            }`}>
                              {String.fromCharCode(65 + index)}
                            </div>
                            {option}
                          </div>
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
                          disabled={isSubmitting}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                            isSubmitting 
                              ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
                              : 'border-gray-300'
                          }`}
                          placeholder={isSubmitting ? "Отправка ответа..." : "Введите ваш ответ..."}
                        />
                        <button
                          onClick={() => safeHandleAnswerSubmit(selectedAnswer)}
                          disabled={!selectedAnswer.trim() || isSubmitting}
                          className={`w-full font-bold py-3 px-4 rounded-lg transition duration-200 ${
                            !selectedAnswer.trim() || isSubmitting
                              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          {isSubmitting ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Отправка...
                            </div>
                          ) : (
                            'Отправить ответ'
                          )}
                        </button>
                      </div>
                    )}
                    
                    {isSubmitting && (
                      <div className="text-center text-yellow-600 text-sm">
                        ⏳ Отправляем ваш ответ...
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 text-sm text-gray-500 text-center">
                  Ответили: {gameState.playersAnswered?.length || 0} из {players.length} игроков
                  {hasAnswered && (
                    <div className="mt-1 text-green-600 font-medium">
                      ✓ Вы уже ответили на этот вопрос
                    </div>
                  )}
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