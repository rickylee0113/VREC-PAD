import React, { useState, useEffect } from 'react';
import { Team, Player, Side } from '../types';
import { PlayerList } from './PlayerList';
import { ConfirmDialog } from './ConfirmDialog';
import { Save, Trash2, RotateCcw, Lock, Unlock, Plus, FolderOpen } from 'lucide-react';

interface TeamSetupPanelProps {
  side: Side;
  teamName: string;
  players: Player[];
  isLocked: boolean;
  savedTeams: Team[];
  onNameChange: (name: string) => void;
  onPlayersChange: (players: Player[]) => void;
  onLockToggle: () => void;
  onSaveToDB: () => void;
  onDeleteFromDB: (teamId: string) => void;
  onLoadFromDB: (teamId: string) => void;
  onReset: () => void;
}

export const TeamSetupPanel: React.FC<TeamSetupPanelProps> = ({
  side,
  teamName,
  players,
  isLocked,
  savedTeams,
  onNameChange,
  onPlayersChange,
  onLockToggle,
  onSaveToDB,
  onDeleteFromDB,
  onLoadFromDB,
  onReset,
}) => {
  const [newNumber, setNewNumber] = useState('');
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Track the selected value in the dropdown to allow deletion
  const [selectedDbId, setSelectedDbId] = useState('');

  // Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
    isDangerous: boolean;
  }>({ isOpen: false, title: '', message: '', action: () => {}, isDangerous: false });

  const isHome = side === 'home';
  const title = isHome ? '我方隊伍 (Home)' : '對方隊伍 (Away)';
  const titleColor = isHome ? 'text-blue-600' : 'text-red-600';

  // Ensure selectedDbId is valid relative to savedTeams
  useEffect(() => {
    if (selectedDbId && !savedTeams.find(t => t.id === selectedDbId)) {
      setSelectedDbId('');
    }
  }, [savedTeams, selectedDbId]);

  const handleAddPlayer = () => {
    setError(null);
    if (isLocked) return;

    if (!newNumber) {
      setError('請輸入背號');
      return;
    }
    if (!/^\d+$/.test(newNumber)) {
      setError('背號只能是數字');
      return;
    }
    if (players.some((p) => p.number === newNumber)) {
      setError(`背號 ${newNumber} 重複`);
      return;
    }

    const newPlayer: Player = {
      id: crypto.randomUUID(),
      number: newNumber,
      name: newName.trim(),
    };

    onPlayersChange([...players, newPlayer]);
    setNewNumber('');
    setNewName('');
    
    // Focus back to number input
    const numberInput = document.getElementById(`number-input-${side}`);
    if (numberInput) numberInput.focus();
  };

  const handleDeletePlayer = (id: string) => {
    if (isLocked) return;
    onPlayersChange(players.filter((p) => p.id !== id));
  };

  const confirmClearPlayers = () => {
    if (isLocked) return;
    setConfirmDialog({
      isOpen: true,
      title: '清空名單確認',
      message: '確定要清空目前的球員名單嗎？\n(這只會清空當前編輯區，不會刪除資料庫中的隊伍)',
      isDangerous: true,
      action: () => {
        onPlayersChange([]);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSave = () => {
     if (players.length < 7) {
         alert(`目前只有 ${players.length} 人，至少需要 7 人才能儲存隊伍。`);
         return;
     }
     if (!teamName.trim()) {
         alert('請輸入隊伍名稱');
         return;
     }
     onSaveToDB();
  };

  const confirmDeleteSavedTeam = () => {
      if (!selectedDbId) return;
      
      const teamToDelete = savedTeams.find(t => t.id === selectedDbId);
      if (!teamToDelete) return;

      setConfirmDialog({
        isOpen: true,
        title: '刪除資料庫隊伍',
        message: `警告：您確定要從資料庫中永久刪除「${teamToDelete.name}」嗎？\n刪除後，目前的編輯畫面也會被清空。`,
        isDangerous: true,
        action: () => {
          onDeleteFromDB(selectedDbId); // 刪除資料庫紀錄
          onReset(); // 關鍵修改：刪除後同時清空畫面上的輸入欄位
          setSelectedDbId(''); 
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      });
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
        {/* Header Section */}
        <div className="p-4 border-b border-slate-100 space-y-4">
          <h2 className={`text-xl font-bold ${titleColor}`}>{title}</h2>

          {/* Row 1: Name & Actions */}
          <div className="flex flex-col xl:flex-row gap-3">
            <input
              type="text"
              value={teamName}
              onChange={(e) => onNameChange(e.target.value)}
              disabled={isLocked}
              placeholder="輸入隊伍名稱..."
              className="flex-1 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
            />
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={onReset}
                disabled={isLocked}
                className="flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 disabled:opacity-50 text-sm font-medium whitespace-nowrap"
              >
                <RotateCcw size={16} /> 重置設定
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1 px-3 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 disabled:opacity-50 text-sm font-medium whitespace-nowrap"
              >
                <Save size={16} /> 存隊伍
              </button>
              <button
                type="button"
                onClick={onLockToggle}
                className={`flex items-center gap-1 px-3 py-2 rounded border text-sm font-medium transition-colors w-24 justify-center ${
                  isLocked
                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {isLocked ? <><Lock size={16} /> 鎖定</> : <><Unlock size={16} /> 鎖定</>}
              </button>
            </div>
          </div>

          {/* Row 2: DB Selection & Delete */}
          <div className="flex gap-2">
              <div className="relative flex-1">
              <select
                  onChange={(e) => {
                      const id = e.target.value;
                      setSelectedDbId(id);
                      if (id) onLoadFromDB(id);
                  }}
                  disabled={isLocked}
                  value={selectedDbId}
                  className="w-full p-2 pl-3 pr-10 border border-slate-300 rounded bg-slate-50 text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50 appearance-none text-sm"
              >
                  <option value="">-- 從資料庫快速選擇 --</option>
                  {savedTeams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.players.length}人)</option>
                  ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <FolderOpen size={16} />
              </div>
              </div>
              {selectedDbId && !isLocked && (
                  <button 
                      type="button"
                      onClick={confirmDeleteSavedTeam}
                      title="從資料庫刪除此隊伍"
                      className="px-3 py-2 bg-red-100 text-red-600 border border-red-200 rounded hover:bg-red-200 transition-colors"
                  >
                      <Trash2 size={18} />
                  </button>
              )}
          </div>

          {/* Row 3: Add Player Form */}
          <div className={`space-y-2 transition-opacity ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex gap-2">
              <input
                id={`number-input-${side}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value.replace(/\D/g, '').slice(0, 3))}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                placeholder="背號"
                className="w-20 p-2 border border-slate-300 rounded text-center"
              />
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                placeholder="姓名 (可留空)"
                className="flex-1 p-2 border border-slate-300 rounded"
              />
              <button
                type="button"
                onClick={handleAddPlayer}
                className="bg-slate-800 text-white px-4 rounded hover:bg-slate-900 flex items-center gap-1 font-medium text-sm whitespace-nowrap"
              >
                <Plus size={16} /> 新增
              </button>
              <button
                type="button"
                onClick={confirmClearPlayers}
                className="bg-red-50 text-red-500 border border-red-200 px-3 rounded hover:bg-red-100 flex items-center gap-1 font-medium text-sm whitespace-nowrap"
              >
                <Trash2 size={16} /> 清空名單
              </button>
            </div>
            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
          </div>
        </div>

        {/* Player List Section */}
        <div className="flex-1 p-4 bg-slate-50 overflow-hidden flex flex-col">
          <h3 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">
              球員名單 <span className="ml-2 bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{players.length}</span>
          </h3>
          <PlayerList players={players} onDelete={isLocked ? undefined : handleDeletePlayer} readonly={isLocked} />
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDangerous={confirmDialog.isDangerous}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};