import React, { useState } from 'react';
import { Player, Team, Lineup, PlayerRole, PlayerPosition } from '../types';
import { ChevronDown, Shirt, Wand2 } from 'lucide-react';

interface LineupEditorProps {
  homeTeam: Team;
  guestTeam: Team;
  homeLineup: Lineup;
  guestLineup: Lineup;
  onHomeLineupChange: (newLineup: Lineup) => void;
  onGuestLineupChange: (newLineup: Lineup) => void;
}

const ROLES: PlayerRole[] = ['未定', '大砲 (OH)', '快攻 (MB)', '舉對 (OP)', '舉球 (S)', '自由 (L)', '防守 (DS)'];
const LIBERO_POS_ID = 0; // Special ID for Libero position

export const LineupEditor: React.FC<LineupEditorProps> = ({
  homeTeam,
  guestTeam,
  homeLineup,
  guestLineup,
  onHomeLineupChange,
  onGuestLineupChange,
}) => {
  // Track selected player: ID and which side they belong to
  const [selected, setSelected] = useState<{ id: string; side: 'home' | 'guest' } | null>(null);

  // --- Helper Functions ---

  const getPlayerPositionOnCourt = (lineup: Lineup, playerId: string): number | null => {
    for (const [pos, data] of Object.entries(lineup)) {
      const p = data as PlayerPosition | null;
      if (p?.playerId === playerId) return parseInt(pos);
    }
    return null;
  };

  const handlePlayerSelect = (playerId: string, side: 'home' | 'guest') => {
    if (selected?.id === playerId) {
      setSelected(null);
    } else {
      setSelected({ id: playerId, side });
    }
  };

  const handleCourtClick = (side: 'home' | 'guest', posNumber: number) => {
    if (!selected) return;
    if (selected.side !== side) {
      alert("不能將對方球員放入我方場地，反之亦然！");
      return;
    }

    const currentLineup = side === 'home' ? homeLineup : guestLineup;
    const setLineup = side === 'home' ? onHomeLineupChange : onGuestLineupChange;
    
    const newLineup = { ...currentLineup };
    
    // 1. Remove selected player from old position (if any)
    const oldPos = getPlayerPositionOnCourt(currentLineup, selected.id);
    if (oldPos !== null) {
      newLineup[oldPos] = null;
    }

    // 2. Determine Role
    let newRole: PlayerRole = '未定';
    
    if (posNumber === LIBERO_POS_ID) {
        newRole = '自由 (L)';
    } else if (oldPos !== null && currentLineup[oldPos]?.role) {
        newRole = currentLineup[oldPos]!.role;
    }

    // 3. Place player
    newLineup[posNumber] = {
      playerId: selected.id,
      role: newRole
    };

    setLineup(newLineup);
    setSelected(null);
  };

  const handleRoleChange = (side: 'home' | 'guest', posNumber: number, newRole: PlayerRole) => {
    const currentLineup = side === 'home' ? homeLineup : guestLineup;
    const setLineup = side === 'home' ? onHomeLineupChange : onGuestLineupChange;
    
    const currentData = currentLineup[posNumber];
    if (!currentData) return;

    setLineup({
      ...currentLineup,
      [posNumber]: { ...currentData, role: newRole }
    });
  };

  const handleAutoFill = () => {
    if (homeTeam.players.length < 6 || guestTeam.players.length < 6) {
        alert("無法執行測試填入：雙方球隊至少需要 6 名球員。\n請先返回上一頁匯入測試資料或新增球員。");
        return;
    }

    // Check if lineups are empty. If not, confirm overwrite.
    const isHomeEmpty = Object.keys(homeLineup).length === 0;
    const isGuestEmpty = Object.keys(guestLineup).length === 0;

    if ((!isHomeEmpty || !isGuestEmpty) && !confirm('場上已有設定，確定要自動覆蓋成測試陣容嗎？')) {
        return;
    }

    // Helper to generate a lineup with dummy roles using SORTED players
    const generateLineup = (team: Team): Lineup => {
        const newLineup: Lineup = {};
        
        // Sort players by number so the fill is predictable (e.g. #1 is setter, #2 is OH)
        const sortedPlayers = [...team.players].sort((a, b) => parseInt(a.number) - parseInt(b.number));

        // Simple rotation logic for testing:
        // 0: S, 1: OH, 2: MB, 3: OP, 4: OH, 5: MB
        const testRoles: PlayerRole[] = ['舉球 (S)', '大砲 (OH)', '快攻 (MB)', '舉對 (OP)', '大砲 (OH)', '快攻 (MB)'];

        // Fill 1-6
        for(let i=0; i<6; i++) {
            if(sortedPlayers[i]) {
                newLineup[i+1] = { 
                    playerId: sortedPlayers[i].id, 
                    role: testRoles[i] || '未定' 
                };
            }
        }
        // Fill Libero (0) if 7th player exists
        if(sortedPlayers[6]) {
            newLineup[0] = { playerId: sortedPlayers[6].id, role: '自由 (L)' };
        }
        return newLineup;
    };

    onHomeLineupChange(generateLineup(homeTeam));
    onGuestLineupChange(generateLineup(guestTeam));
  };

  // --- Render Components ---

  const RosterSidebar = ({ team, side, lineup }: { team: Team, side: 'home' | 'guest', lineup: Lineup }) => {
    const sortedPlayers = [...team.players].sort((a, b) => parseInt(a.number) - parseInt(b.number));
    const isHome = side === 'home';
    const bgClass = isHome ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200';
    const headerClass = isHome ? 'bg-blue-600 text-white' : 'bg-red-600 text-white';
    const activeClass = isHome ? 'ring-blue-400 bg-blue-100' : 'ring-red-400 bg-red-100';

    return (
      <div className={`flex flex-col h-full rounded-lg border overflow-hidden shadow-sm ${bgClass} w-1/5 min-w-[160px] max-w-[220px]`}>
        <div className={`p-3 font-bold text-center text-sm truncate ${headerClass}`}>
           {team.name}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
          {sortedPlayers.map(player => {
            const isOnCourt = getPlayerPositionOnCourt(lineup, player.id) !== null;
            const isSelected = selected?.id === player.id;
            
            return (
              <button
                key={player.id}
                onClick={() => handlePlayerSelect(player.id, side)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all relative ${
                  isSelected 
                    ? `ring-2 ring-inset border-transparent ${activeClass} shadow-md transform scale-[1.02]` 
                    : isOnCourt
                      ? 'bg-slate-200/50 text-slate-400 border-transparent grayscale opacity-60'
                      : 'bg-white hover:bg-white/80 border-slate-200 text-slate-700 shadow-sm'
                }`}
              >
                <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-md font-bold text-sm ${
                   isSelected ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {player.number}
                </div>
                <span className="truncate text-base font-medium">{player.name}</span>
                {isOnCourt && <span className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500"></span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const CourtPosition = ({ side, posNum, isLibero = false }: { side: 'home' | 'guest', posNum: number, isLibero?: boolean }) => {
    const lineup = side === 'home' ? homeLineup : guestLineup;
    const team = side === 'home' ? homeTeam : guestTeam;
    const playerData = lineup[posNum];
    const player = playerData ? team.players.find(p => p.id === playerData.playerId) : null;
    
    const isTarget = selected && selected.side === side && !player;
    
    return (
      <div 
        onClick={() => handleCourtClick(side, posNum)}
        className={`
            relative flex flex-col items-center justify-center transition-all cursor-pointer select-none
            ${isLibero 
                ? 'bg-yellow-50/90 border-2 border-dashed border-yellow-400 rounded-xl w-24 h-24 lg:w-32 lg:h-32 shadow-sm hover:bg-yellow-100 mx-auto' 
                : 'bg-orange-50/20 hover:bg-orange-100/40 w-full h-full'
            }
            ${isTarget ? 'ring-4 ring-inset ring-green-400/70 bg-green-50/50' : ''}
        `}
      >
        {/* Position Number Label */}
        <span className={`absolute ${isLibero ? 'top-1 left-2 text-xs text-yellow-600' : 'top-1 left-2 text-xl lg:text-3xl text-orange-900/10'} font-bold`}>
             {isLibero ? '自由(L)' : posNum}
        </span>

        {player ? (
            <div className="z-10 flex flex-col items-center gap-1 w-full px-1 animate-in zoom-in duration-200">
                {/* Player Number Circle/Box */}
                <div className={`
                    flex items-center justify-center font-bold border-2 shadow-sm
                    ${isLibero 
                        ? 'w-10 h-10 lg:w-14 lg:h-14 rounded-full bg-yellow-300 text-yellow-900 border-yellow-500' 
                        : 'w-12 h-12 lg:w-16 lg:h-16 rounded-xl bg-white text-slate-800 border-white'
                    }
                `}>
                    <span className="text-xl lg:text-3xl">{player.number}</span>
                </div>
                
                {/* Name Label - Matched size */}
                <div className="text-xl lg:text-3xl font-bold text-slate-900 truncate max-w-full px-2 bg-white/70 rounded backdrop-blur-[2px] shadow-sm mt-1 border border-white/40">
                    {player.name}
                </div>

                {/* Role Selector - Massive Size Increase */}
                <div className="relative w-full max-w-[180px]" onClick={(e) => e.stopPropagation()}>
                    <select 
                        value={playerData?.role}
                        onChange={(e) => handleRoleChange(side, posNum, e.target.value as PlayerRole)}
                        className={`
                            w-full appearance-none border-none text-xl lg:text-3xl font-bold text-center focus:outline-none cursor-pointer py-1 mt-1 rounded shadow-sm
                            ${isLibero ? 'text-yellow-900 bg-yellow-100/50' : 'text-slate-900 bg-white/40'}
                        `}
                    >
                        {ROLES.map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>
            </div>
        ) : (
            isLibero && <div className="text-yellow-400/50"><Shirt size={32} /></div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-row h-full gap-3 p-2 bg-slate-100 rounded-xl overflow-hidden select-none">
      
      {/* 1. Left Sidebar: Home Roster */}
      <RosterSidebar team={homeTeam} side="home" lineup={homeLineup} />

      {/* 2. Center Area: Gym Floor (Includes Liberos + Court) */}
      <div className="flex-1 bg-orange-100 rounded-xl shadow-inner border border-orange-200 flex relative overflow-hidden">
        
        {/* Test Button (Absolute positioned in the gym area) */}
        <button 
            onClick={handleAutoFill}
            className="absolute top-2 left-2 z-40 flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-slate-800 rounded-xl shadow-md border border-slate-300 text-base font-bold backdrop-blur transition-all active:scale-95"
        >
            <Wand2 size={20} className="text-purple-600"/> 
            <span className="hidden md:inline">測試陣容</span>
        </button>

        {/* Left Side Zone (Home Libero / Bench) */}
        <div className="w-28 lg:w-36 flex flex-col justify-end pb-4 items-center bg-orange-100/50 z-20">
             <div className="mb-2 text-xs font-bold text-blue-800/50 uppercase tracking-widest">Home Libero</div>
             <CourtPosition side="home" posNum={LIBERO_POS_ID} isLibero />
        </div>

        {/* Main Court Area (Center) */}
        <div className="flex-1 flex flex-col relative my-2 lg:my-4 bg-orange-300 border-[3px] border-white shadow-lg mx-1">
             
             {/* NET (Center Line) */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1.5 bg-slate-800/90 -translate-x-1/2 z-20 flex items-center justify-center shadow-md">
                <div className="bg-slate-800 text-white text-[10px] py-6 px-0.5 rounded-full writing-vertical font-bold tracking-widest border border-white/20">NET</div>
            </div>

             <div className="flex-1 flex relative">
                
                {/* Home Half (Left) */}
                <div className="flex-1 relative border-r border-slate-300/30">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                        <span className="text-4xl lg:text-7xl font-bold text-blue-900/10 rotate-[-15deg] whitespace-nowrap">{homeTeam.name}</span>
                    </div>
                    {/* Grid: 2 Cols x 3 Rows */}
                    <div className="absolute inset-0 grid grid-cols-2 h-full">
                        {/* Back Row (Left Col) */}
                        <div className="grid grid-rows-3 h-full border-r-2 border-orange-400/30">
                            <div className="border-b-2 border-orange-400/30"><CourtPosition side="home" posNum={5} /></div>
                            <div className="border-b-2 border-orange-400/30"><CourtPosition side="home" posNum={6} /></div>
                            <div><CourtPosition side="home" posNum={1} /></div>
                        </div>
                        {/* Front Row (Right Col) */}
                        <div className="grid grid-rows-3 h-full">
                            <div className="border-b-2 border-orange-400/30"><CourtPosition side="home" posNum={4} /></div>
                            <div className="border-b-2 border-orange-400/30"><CourtPosition side="home" posNum={3} /></div>
                            <div><CourtPosition side="home" posNum={2} /></div>
                        </div>
                    </div>
                </div>

                {/* Guest Half (Right) */}
                <div className="flex-1 relative">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                        <span className="text-4xl lg:text-7xl font-bold text-red-900/10 rotate-[15deg] whitespace-nowrap">{guestTeam.name}</span>
                    </div>
                    {/* Grid: 2 Cols x 3 Rows */}
                    <div className="absolute inset-0 grid grid-cols-2 h-full">
                         {/* Front Row (Left Col) */}
                        <div className="grid grid-rows-3 h-full border-r-2 border-orange-400/30">
                            <div className="border-b-2 border-orange-400/30"><CourtPosition side="guest" posNum={2} /></div>
                            <div className="border-b-2 border-orange-400/30"><CourtPosition side="guest" posNum={3} /></div>
                            <div><CourtPosition side="guest" posNum={4} /></div>
                        </div>
                        {/* Back Row (Right Col) */}
                        <div className="grid grid-rows-3 h-full">
                            <div className="border-b-2 border-orange-400/30"><CourtPosition side="guest" posNum={1} /></div>
                            <div className="border-b-2 border-orange-400/30"><CourtPosition side="guest" posNum={6} /></div>
                            <div><CourtPosition side="guest" posNum={5} /></div>
                        </div>
                    </div>
                </div>

             </div>
        </div>

        {/* Right Side Zone (Guest Libero / Bench) */}
        <div className="w-28 lg:w-36 flex flex-col justify-end pb-4 items-center bg-orange-100/50 z-20">
             <div className="mb-2 text-xs font-bold text-red-800/50 uppercase tracking-widest">Guest Libero</div>
             <CourtPosition side="guest" posNum={LIBERO_POS_ID} isLibero />
        </div>

      </div>

      {/* 3. Right Sidebar: Guest Roster */}
      <RosterSidebar team={guestTeam} side="guest" lineup={guestLineup} />
      
    </div>
  );
};