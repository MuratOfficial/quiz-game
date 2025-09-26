'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { User, Player, GameState, Question, QuestionRequest } from '@/types';

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    isActive: false,
    currentQuestion: null,
    playersAnswered: []
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState<QuestionRequest>({
    category: 'HTML',
    type: 'multiple',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    points: 10
  });

  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    
    const userObj: User | Player = JSON.parse(userData);
    if (!('isAdmin' in userObj) || !userObj.isAdmin) {
      router.push('/game');
      return;
    }
    
    setUser(userObj as User);
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/game');
        const data = await response.json();
        setPlayers(data.players || []);
        setGameState(data.gameState || {});
        setQuestions(data.questions || []);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleGameAction = async (action: string) => {
    try {
      await fetch('/api/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  const handleAddQuestion = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newQuestion),
      });

      if (response.ok) {
        setNewQuestion({
          category: 'HTML',
          type: 'multiple',
          question: '',
          options: ['', '', '', ''],
          correctAnswer: '',
          points: 10
        });
        // Обновляем список вопросов
        const dataResponse = await fetch('/api/game');
        const data = await dataResponse.json();
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Ошибка добавления вопроса:', error);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    try {
      await fetch('/api/questions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: questionId }),
      });
      
      // Обновляем список вопросов
      const response = await fetch('/api/game');
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Ошибка удаления вопроса:', error);
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(newQuestion.options || [])];
    newOptions[index] = value;
    setNewQuestion(prev => ({
      ...prev,
      options: newOptions
    }));
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
      <div className="max-w-7xl mx-auto px-4">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-800">Панель администратора</h1>
          <div className="flex items-center space-x-4">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">Администратор</span>
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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Управление игрой */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Управление игрой</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => handleGameAction('startGame')}
                  disabled={gameState.isActive}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                >
                  Начать игру
                </button>
                
                <button
                  onClick={() => handleGameAction('nextQuestion')}
                  disabled={!gameState.isActive}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                >
                  Следующий вопрос
                </button>
                
                <button
                  onClick={() => handleGameAction('endGame')}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                >
                  Завершить игру
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Статус игры</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Состояние:</span>
                      <span className={gameState.isActive ? 'text-green-600 font-semibold' : 'text-yellow-600 font-semibold'}>
                        {gameState.isActive ? 'Активна' : 'Не активна'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Текущий вопрос:</span>
                      <span>{gameState.currentQuestion ? 'Активен' : 'Нет'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Игроков онлайн:</span>
                      <span>{players.length}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Текущие игроки</h3>
                  <div className="max-h-40 overflow-y-auto">
                    {players.map((player: Player) => (
                      <div key={player.id} className="flex justify-between py-1">
                        <span>{player.username}</span>
                        <span className="font-semibold">{player.score || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Добавление вопроса */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Добавить вопрос</h2>
              
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Категория</label>
                    <select
                      name="category"
                      value={newQuestion.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="HTML">HTML</option>
                      <option value="CSS">CSS</option>
                      <option value="Информатика">Информатика</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Тип вопроса</label>
                    <select
                      name="type"
                      value={newQuestion.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="multiple">Выбор ответа</option>
                      <option value="input">Текстовый ответ</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Вопрос</label>
                  <textarea
                    name="question"
                    value={newQuestion.question}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    required
                  />
                </div>

                {newQuestion.type === 'multiple' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Варианты ответов</label>
                    <div className="space-y-2">
                      {newQuestion.options?.map((option, index) => (
                        <input
                          key={index}
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder={`Вариант ${index + 1}`}
                          required
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {newQuestion.type === 'multiple' ? 'Правильный ответ' : 'Правильный ответ (текст)'}
                    </label>
                    {newQuestion.type === 'multiple' ? (
                      <select
                        name="correctAnswer"
                        value={newQuestion.correctAnswer}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      >
                        <option value="">Выберите правильный ответ</option>
                        {newQuestion.options?.map((option, index) => (
                          <option key={index} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        name="correctAnswer"
                        value={newQuestion.correctAnswer}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Очки</label>
                    <input
                      type="number"
                      name="points"
                      value={newQuestion.points}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      min={5}
                      max={50}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg"
                >
                  Добавить вопрос
                </button>
              </form>
            </div>
          </div>

          {/* Список вопросов */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">База вопросов ({questions.length})</h2>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {questions.map((question: Question) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-1 text-xs text-white rounded ${question.color}`}>
                        {question.category}
                      </span>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Удалить
                      </button>
                    </div>
                    <p className="text-sm font-medium mb-1">{question.question}</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{question.type === 'multiple' ? 'Выбор' : 'Текст'}</span>
                      <span>{question.points} очков</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}