
'use client';
import { useState } from 'react';
import { GameState } from '@/types';

interface AdminControlsProps {
  gameState: GameState | null;
  onGameStateChange: () => void;
}

export default function AdminControls({ gameState, onGameStateChange }: AdminControlsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const startGame = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/game-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });
      onGameStateChange();
    } catch (error) {
      console.error('Error starting game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextQuestion = async (type: 'multiple-choice' | 'coding') => {
    setIsLoading(true);
    try {
      await fetch('/api/game-state/next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      onGameStateChange();
    } catch (error) {
      console.error('Error loading next question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const endGame = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/game-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });
      onGameStateChange();
    } catch (error) {
      console.error('Error ending game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetGame = async () => {
    if (!confirm('Вы уверены, что хотите сбросить игру? Все очки будут обнулены.')) {
      return;
    }

    setIsLoading(true);
    try {
      await fetch('/api/game-state/reset', {
        method: 'POST',
      });
      onGameStateChange();
    } catch (error) {
      console.error('Error resetting game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Управление игрой</h3>
      
      <div className="flex flex-wrap gap-3">
        {!gameState?.isActive ? (
          <>
            <button
              onClick={startGame}
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50"
            >
              Начать игру
            </button>
            <button
              onClick={resetGame}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
            >
              Сбросить игру
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => nextQuestion('multiple-choice')}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
            >
              Следующий вопрос
            </button>
            
            <button
              onClick={() => nextQuestion('coding')}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50"
            >
              Coding задача
            </button>
            
            <button
              onClick={endGame}
              disabled={isLoading}
              className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
            >
              Завершить игру
            </button>
          </>
        )}
      </div>

      {/* Статистика для админа */}
      {gameState && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Отвеченные вопросы</p>
            <p className="font-semibold text-gray-900">
              {gameState.answeredQuestions.length + gameState.answeredCodingQuestions.length}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Ответили на текущий</p>
            <p className="font-semibold text-gray-900">
              {gameState.playersAnswered.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}