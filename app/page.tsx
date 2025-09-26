'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Player, GameState } from '@/types';

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    isActive: false,
    currentQuestion: null,
    playersAnswered: []
  });

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const response = await fetch('/api/game');
        const data = await response.json();
        setPlayers(data.players || []);
        setGameState(data.gameState || {});
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    };

    fetchGameData();
    const interval = setInterval(fetchGameData, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-indigo-800 mb-2">Викторина Online</h1>
          <p className="text-lg text-indigo-600">Проверьте свои знания HTML, CSS и информатики!</p>
        </header>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Статус игры</h2>
            <div className={`px-4 py-2 rounded-full font-medium ${
              gameState.isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {gameState.isActive ? 'Игра активна' : 'Ожидание игроков'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-red-600 font-bold text-lg">HTML</div>
              <div className="text-gray-700">Вопросы по разметке</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-blue-600 font-bold text-lg">CSS</div>
              <div className="text-gray-700">Стили и оформление</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-green-600 font-bold text-lg">Информатика</div>
              <div className="text-gray-700">Основы компьютерных наук</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/login" className="flex-1">
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200">
                Войти в игру
              </button>
            </Link>
            <Link href="/admin" className="flex-1">
              <button className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200">
                Панель администратора
              </button>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Текущие игроки</h2>
          {players.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((player) => (
                <div key={player.id} className="bg-gray-50 p-4 rounded-lg flex items-center">
                  <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    {player.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{player.username}</div>
                    <div className="text-sm text-gray-600">Очки: {player.score || 0}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Пока нет игроков в игре</p>
          )}
        </div>
      </div>
    </div>
  );
}