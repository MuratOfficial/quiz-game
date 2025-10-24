
'use client';
import { useState, useEffect } from 'react';
import { Player, CodingSubmission } from '@/types';
import ScoreStats from './ScoreStats';

interface AdminScoreManagerProps {
  onUpdate?: () => void;
}

export default function AdminScoreManager({ onUpdate }: AdminScoreManagerProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<CodingSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'players' | 'submissions' | 'stats'>('players');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [scoreAdjustment, setScoreAdjustment] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [playersResponse, submissionsResponse] = await Promise.all([
        fetch('/api/admin/players'),
        fetch('/api/coding-submissions?status=pending'),
      ]);

      const playersData = await playersResponse.json();
      const submissionsData = await submissionsResponse.json();

      setPlayers(playersData.players || playersData);
      setPendingSubmissions(submissionsData.data || submissionsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreUpdate = async (playerId: string, newScore: number) => {
    try {
      const response = await fetch('/api/admin/players', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: playerId, score: newScore }),
      });

      if (response.ok) {
        fetchData();
        onUpdate?.();
        setEditingPlayer(null);
        setScoreAdjustment('');
      }
    } catch (error) {
      console.error('Error updating score:', error);
    }
  };

  const handleAdjustScore = async (playerId: string, adjustment: number) => {
    try {
      const player = players.find(p => p.id === playerId);
      if (!player) return;

      const newScore = Math.max(0, player.score + adjustment);
      await handleScoreUpdate(playerId, newScore);
    } catch (error) {
      console.error('Error adjusting score:', error);
    }
  };

  const handleReviewSubmission = async (submissionId: string, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/coding-submissions/${submissionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status, 
          feedback: feedback || (status === 'approved' ? 'Решение принято' : 'Решение требует доработки') 
        }),
      });

      if (response.ok) {
        setFeedback('');
        fetchData();
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error reviewing submission:', error);
    }
  };

  const handleResetAllScores = async () => {
    if (!confirm('Вы уверены, что хотите сбросить все очки? Это действие нельзя отменить.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/scores/reset', {
        method: 'POST',
      });

      if (response.ok) {
        fetchData();
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error resetting scores:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и табы */}
      <div className="border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Управление очками</h2>
          <button
            onClick={handleResetAllScores}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
          >
            Сбросить все очки
          </button>
        </div>
        
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('players')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'players'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Игроки ({players.length})
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'submissions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Ожидают проверки ({pendingSubmissions.length})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stats'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Статистика
          </button>
        </nav>
      </div>

      {/* Контент табов */}
      {activeTab === 'players' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Игрок
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Текущие очки
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {players.map((player) => (
                  <tr key={player.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{player.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{player.score}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        player.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {player.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {editingPlayer?.id === player.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={scoreAdjustment}
                            onChange={(e) => setScoreAdjustment(e.target.value)}
                            placeholder="Новое значение"
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <button
                            onClick={() => handleScoreUpdate(player.id, parseInt(scoreAdjustment) || 0)}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingPlayer(null)}
                            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingPlayer(player);
                              setScoreAdjustment(player.score.toString());
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Изменить
                          </button>
                          <button
                            onClick={() => handleAdjustScore(player.id, 10)}
                            className="text-green-600 hover:text-green-900"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => handleAdjustScore(player.id, -10)}
                            className="text-red-600 hover:text-red-900"
                          >
                            -10
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {players.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Нет зарегистрированных игроков
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="space-y-4">
          {pendingSubmissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Нет решений, ожидающих проверки
            </div>
          ) : (
            pendingSubmissions.map((submission) => (
              <div key={submission.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {submission.codingQuestion?.title || 'Задача'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Игрок: <span className="font-medium">{submission.player?.username}</span> | 
                      Очки: <span className="font-medium">{submission.codingQuestion?.points}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Отправлено: {new Date(submission.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleReviewSubmission(submission.id, 'approved')}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                    >
                      Принять
                    </button>
                    <button
                      onClick={() => handleReviewSubmission(submission.id, 'rejected')}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                    >
                      Отклонить
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Комментарий к проверке:
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Введите комментарий для игрока..."
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Решение:</h4>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
                    {submission.code}
                  </pre>
                </div>

                {submission.testResults && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Результаты тестов:</h4>
                    <div className="space-y-2">
                      {submission.testResults.details?.map((detail: any, index: number) => (
                        <div
                          key={index}
                          className={`p-3 rounded border ${
                            detail.passed
                              ? 'bg-green-50 border-green-200'
                              : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Тест {index + 1}</span>
                            <span className={detail.passed ? 'text-green-600' : 'text-red-600'}>
                              {detail.passed ? '✓ Пройден' : '✗ Не пройден'}
                            </span>
                          </div>
                          {!detail.isHidden && (
                            <div className="mt-2 text-sm space-y-1">
                              <div>
                                <span className="font-medium">Вход:</span> {detail.input}
                              </div>
                              <div>
                                <span className="font-medium">Ожидалось:</span> {detail.expectedOutput}
                              </div>
                              <div>
                                <span className="font-medium">Получено:</span> {detail.actualOutput}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <ScoreStats />
      )}
    </div>
  );
}