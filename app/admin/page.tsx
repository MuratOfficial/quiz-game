'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { User, Player, GameState, Question, QuestionRequest, UserUpdateRequest } from '@/types';

interface AdminUser extends User {
  createdAt: string;
}


export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState<'game' | 'questions' | 'users' | 'bulk-import'>('game');
  const [jsonInput, setJsonInput] = useState<string>('');
  const [importResult, setImportResult] = useState<string>('');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    
    const userObj = JSON.parse(userData);
    if (!userObj.isAdmin) {
      router.push('/game');
      return;
    }
    
    setUser(userObj);
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/game');
        const data = await response.json();
        setPlayers(data.players || []);
        setGameState(data.gameState || null);
        setQuestions(data.questions || []);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (data.success) {
        setAdminUsers(data.data.adminUsers || []);
        // Игроки уже загружаются через основной API
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    }
  };

  
  const handleDeleteQuestion = async (questionId: string) => {
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

  const handleGameAction = async (action: string) => {
    try {
      await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  const handleJsonImport = async (e: FormEvent) => {
    e.preventDefault();
    setImportResult('');
    
    try {
      const jsonData = JSON.parse(jsonInput);
      
      const response = await fetch('/api/admin/questions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setImportResult(`Успех! ${result.message}`);
        setJsonInput('');
        // Обновляем список вопросов
        const gameResponse = await fetch('/api/game');
        const gameData = await gameResponse.json();
        setQuestions(gameData.questions || []);
      } else {
        setImportResult(`Ошибка: ${result.error}${result.details ? ` (${result.details})` : ''}`);
      }
      /* eslint-disable  @typescript-eslint/no-explicit-any */
    } catch (error: any) {
      setImportResult(`Ошибка парсинга JSON: ${error.message}`);
    }
  };

  const loadJsonTemplate = async () => {
    try {
      const response = await fetch('/api/admin/questions/bulk');
      const data = await response.json();
      if (data.success) {
        setJsonInput(JSON.stringify(data.template, null, 2));
      }
    } catch (error) {
      console.error('Ошибка загрузки шаблона:', error);
    }
  };

  const handleUserUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const updateData: UserUpdateRequest = {
        id: editingUser.id,
        username: editingUser.username,
        password: editingUser.password,
        isAdmin: editingUser.isAdmin,
      };

      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();
      
      if (result.success) {
        setImportResult('Пользователь успешно обновлен');
        setEditingUser(null);
        fetchUsers();
      } else {
        setImportResult(`Ошибка: ${result.error}`);
      }
      /* eslint-disable  @typescript-eslint/no-explicit-any */
    } catch (error: any) {
      setImportResult(`Ошибка: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId }),
      });

      const result = await response.json();
      
      if (result.success) {
        setImportResult('Пользователь успешно удален');
        fetchUsers();
      } else {
        setImportResult(`Ошибка: ${result.error}`);
      }
      /* eslint-disable  @typescript-eslint/no-explicit-any */
    } catch (error: any) {
      setImportResult(`Ошибка: ${error.message}`);
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">Загрузка...</div>;
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

        {/* Навигация по вкладкам */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b">
            {[
              { id: 'game' as const, name: 'Управление игрой' },
              { id: 'questions' as const, name: 'Вопросы' },
              { id: 'users' as const, name: 'Пользователи' },
              { id: 'bulk-import' as const, name: 'Массовое добавление' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {importResult && (
          <div className={`mb-4 p-4 rounded-lg ${
            importResult.includes('Ошибка') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {importResult}
          </div>
        )}

        {/* Вкладка управления игрой */}
        {activeTab === 'game' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Управление игрой</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => handleGameAction('startGame')}
                  disabled={gameState?.isActive}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                >
                  Начать игру
                </button>
                
                <button
                  onClick={() => handleGameAction('nextQuestion')}
                  disabled={!gameState?.isActive}
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
                      <span className={gameState?.isActive ? 'text-green-600 font-semibold' : 'text-yellow-600 font-semibold'}>
                        {gameState?.isActive ? 'Активна' : 'Не активна'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Текущий вопрос:</span>
                      <span>{gameState?.currentQuestion ? 'Активен' : 'Нет'}</span>
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
          </div>
        )}

        {/* Вкладка пользователей */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Редактирование пользователя */}
            {editingUser && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Редактирование пользователя</h3>
                <form onSubmit={handleUserUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Имя пользователя</label>
                    <input
                      type="text"
                      value={editingUser.username}
                      onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Пароль</label>
                    <input
                      type="password"
                      value={editingUser.password || ''}
                      onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Оставьте пустым, чтобы не менять"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingUser.isAdmin}
                      onChange={(e) => setEditingUser({...editingUser, isAdmin: e.target.checked})}
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">Администратор</label>
                  </div>
                  <div className="flex space-x-4">
                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg">
                      Сохранить
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setEditingUser(null)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Список администраторов */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Администраторы</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Имя пользователя</th>
                      <th className="text-left p-2">Статус</th>
                      <th className="text-left p-2">Дата создания</th>
                      <th className="text-left p-2">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map(admin => (
                      <tr key={admin.id} className="border-b">
                        <td className="p-2">{admin.username}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            admin.isAdmin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {admin.isAdmin ? 'Админ' : 'Пользователь'}
                          </span>
                        </td>
                        <td className="p-2">{new Date(admin.createdAt).toLocaleDateString()}</td>
                        <td className="p-2 space-x-2">
                          <button
                            onClick={() => setEditingUser(admin)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Редактировать
                          </button>
                          {admin.username !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(admin.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Удалить
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Список игроков */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Игроки</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Имя пользователя</th>
                      <th className="text-left p-2">Очки</th>
                      <th className="text-left p-2">Статус</th>
                      <th className="text-left p-2">Дата регистрации</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map(player => (
                      <tr key={player.id} className="border-b">
                        <td className="p-2">{player.username}</td>
                        <td className="p-2 font-semibold">{player.score}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            player.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {player.isActive ? 'Онлайн' : 'Офлайн'}
                          </span>
                        </td>
                        <td className="p-2">{new Date(player.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Вкладка массового добавления */}
        {activeTab === 'bulk-import' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Массовое добавление вопросов</h3>
              <form onSubmit={handleJsonImport} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    JSON данные вопросов
                  </label>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    rows={15}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                    placeholder='{"questions": [{...}]}'
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                  >
                    Импортировать вопросы
                  </button>
                  <button
                    type="button"
                    onClick={loadJsonTemplate}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                  >
                    Загрузить шаблон
                  </button>
                  <button
                    type="button"
                    onClick={() => setJsonInput('')}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                  >
                    Очистить
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Инструкция</h3>
              <div className="prose max-w-none">
                <p>Используйте JSON формат для массового добавления вопросов:</p>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`{
  "questions": [
    {
      "category": "HTML",
      "type": "multiple",
      "question": "Текст вопроса",
      "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
      "correctAnswer": "Правильный ответ",
      "points": 10
    },
    {
      "category": "CSS", 
      "type": "input",
      "question": "Текст вопроса",
      "options": [],
      "correctAnswer": "правильный ответ",
      "points": 15
    }
  ]
}`}</pre>
                <ul className="list-disc pl-5 mt-4 space-y-2">
                  <li><strong>category</strong>: HTML, CSS или Информатика</li>
                  <li><strong>type</strong>: multiple (выбор) или input (текст)</li>
                  <li><strong>question</strong>: текст вопроса (должен быть уникальным)</li>
                  <li><strong>options</strong>: массив вариантов (для multiple)</li>
                  <li><strong>correctAnswer</strong>: правильный ответ</li>
                  <li><strong>points</strong>: количество очков (число)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

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
  );
}




