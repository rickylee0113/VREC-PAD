import React from 'react';
import { User, Trash2 } from 'lucide-react';
import { Player } from '../types';

interface PlayerListProps {
  players: Player[];
  onDelete?: (playerId: string) => void;
  readonly?: boolean;
}

export const PlayerList: React.FC<PlayerListProps> = ({ players, onDelete, readonly = false }) => {
  // Sort players by number (converted to int)
  const sortedPlayers = [...players].sort((a, b) => parseInt(a.number) - parseInt(b.number));

  if (players.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
        <User size={32} className="mb-2 opacity-40" />
        <p className="text-sm">尚未新增球員</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 overflow-y-auto h-full content-start pr-1 pb-2">
      {sortedPlayers.map((player) => (
        <div
          key={player.id}
          className="flex items-center justify-between bg-white px-3 py-2 rounded border border-slate-200 shadow-sm h-12"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-slate-800 text-white font-bold rounded-full text-sm">
              {player.number}
            </div>
            <div className="truncate text-sm font-medium text-slate-700">
              {player.name || <span className="text-slate-400 text-xs">-</span>}
            </div>
          </div>
          {!readonly && onDelete && (
            <button
              onClick={() => onDelete(player.id)}
              className="flex-shrink-0 text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors"
              aria-label="移除球員"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};