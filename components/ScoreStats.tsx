
'use client';
import { useState, useEffect } from 'react';

interface ScoreStatsData {
  totalPlayers: number;
  activePlayers: number;
  totalScore: number;
  averageScore: number;
  scoreDistribution: Array<{ score: number; count: number }>;
  topPlayers: Array<{ username: string; score: number }>;
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  recentSubmissions: any[];
}

export default function ScoreStats() {
  const [stats, setStats] = useState<ScoreStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/scores/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-500">
        Не удалось загрузить статистику
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Основная статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-blue-600">{stats.totalPlayers}</div>
          <div className="text-sm text-gray-600">Всего игроков</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-green-600">{stats.activePlayers}</div>
          <div className="text-sm text-gray-600">Активных игроков</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-purple-600">{stats.totalScore}</div>
          <div className="text-sm text-gray-600">Всего очков</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-orange-600">{stats.averageScore}</div>
          <div className="text-sm text-gray-600">Средний счет</div>
        </div>
      </div>

      {/* Топ игроков */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Топ 5 игроков</h3>
        </div>
        <div className="p-4">
          {stats.topPlayers.map((player, index) => (
            <div key={player.username} className="flex justify-between items-center py-2 border-b last:border-b-0">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-orange-500' :
                  'bg-blue-500'
                }`}>
                  {index + 1}
                </div>
                <span className="font-medium">{player.username}</span>
              </div>
              <span className="font-bold text-gray-900">{player.score} очков</span>
            </div>
          ))}
        </div>
      </div>

      {/* Распределение очков */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Распределение очков</h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {stats.scoreDistribution.slice(0, 10).map((item) => (
              <div key={item.score} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.score} очков</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ 
                        width: `${(item.count / stats.totalPlayers) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8 text-right">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}