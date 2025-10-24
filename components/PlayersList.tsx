
'use client';
import { Player } from '@/types';

interface PlayersListProps {
  players: Player[];
  currentPlayerId?: string;
  playersAnswered: string[];
}

export default function PlayersList({ players, currentPlayerId, playersAnswered }: PlayersListProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Игроки ({players.length})</h3>
      <div className="space-y-3">
        {sortedPlayers.map((player) => {
          const hasAnswered = playersAnswered.includes(player.id);
          const isCurrentPlayer = player.id === currentPlayerId;
          
          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                isCurrentPlayer ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full ${
                    player.isActive 
                      ? hasAnswered ? 'bg-green-500' : 'bg-yellow-500'
                      : 'bg-gray-400'
                  }`} />
                </div>
                <div>
                  <p className={`font-medium ${
                    isCurrentPlayer ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {player.username}
                    {isCurrentPlayer && ' (Вы)'}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-gray-900">{player.score}</p>
                <p className="text-xs text-gray-500">
                  {hasAnswered ? 'Ответил' : 'Ожидает'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Статистика */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Ответили</p>
            <p className="font-semibold text-green-600">
              {playersAnswered.length}/{players.length}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Всего очков</p>
            <p className="font-semibold text-blue-600">
              {players.reduce((sum, player) => sum + player.score, 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}