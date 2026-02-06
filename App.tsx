import React, { useState } from 'react';
import { Team, Player, Lineup, MatchState } from './types';
import { MOCK_TEAMS } from './constants';
import { TeamSetupPanel } from './components/TeamSetupPanel';
import { ConfirmDialog } from './components/ConfirmDialog';
import { LineupEditor } from './components/LineupEditor';
import { RefreshCw, Trophy, Archive, Database, ArrowRight, ArrowLeft, Play, ZoomIn, ZoomOut, Monitor, RotateCcw } from 'lucide-react';

// Helper for initial empty state
const createEmptyTeamState = () => ({
  name: '',
  players: [] as Player[],
  isLocked: false,
});

const App: React.FC = () => {
  // --- State ---
  const [step, setStep] = useState<MatchState['step']>('setup');
  const [savedTeams, setSavedTeams] = useState<Team[]>(MOCK_TEAMS);
  
  // UI Scaling State
  const [uiScale, setUiScale] = useState(1);
  
  // Local editing state for the current match setup
  const [homeTeam, setHomeTeam] = useState(createEmptyTeamState());
  const [guestTeam, setGuestTeam] = useState(createEmptyTeamState());

  // Lineup State (Position 1-6 + 0 for Libero)
  const [homeLineup, setHomeLineup] = useState<Lineup>({});
  const [guestLineup, setGuestLineup] = useState<Lineup>({});

  // App-level dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
    isDangerous: boolean;
  }>({ isOpen: false, title: '', message: '', action: () => {}, isDangerous: false });


  // --- Handlers ---

  const handleSaveToDB = (side: 'home' | 'guest') => {
    const target = side === 'home' ? homeTeam : guestTeam;
    
    // Check if updating existing or creating new based on name match?
    // For simplicity, we just add new. Real app might update by ID.
    const newTeam: Team = {
      id: crypto.randomUUID(),
      name: target.name,
      players: target.players,
      createdAt: Date.now(),
    };

    setSavedTeams((prev) => [newTeam, ...prev]);
    alert(`隊伍「${target.name}」已儲存到資料庫！`);
  };

  const handleDeleteFromDB = (teamId: string) => {
    setSavedTeams((prev) => prev.filter(t => t.id !== teamId));
  };

  const handleLoadFromDB = (side: 'home' | 'guest', teamId: string) => {
    const team = savedTeams.find(t => t.id === teamId);
    if (!team) return;

    const setter = side === 'home' ? setHomeTeam : setGuestTeam;
    setter(prev => ({
        ...prev,
        name: team.name,
        // Clone players to allow editing without affecting saved team immediately
        players: [...team.players],
    }));
  };

  const confirmResetMatch = () => {
    setConfirmDialog({
      isOpen: true,
      title: '重置比賽確認',
      message: '確定要清空所有目前的比賽設定嗎？\n兩隊的資料都將被重置，未儲存的設定將會遺失。',
      isDangerous: true,
      action: () => {
        setHomeTeam(createEmptyTeamState());
        setGuestTeam(createEmptyTeamState());
        setHomeLineup({});
        setGuestLineup({});
        setStep('setup');
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleLoadTestData = () => {
    // Load mock data into current slots
    const t1 = MOCK_TEAMS[0];
    const t2 = MOCK_TEAMS[1];

    setHomeTeam({ name: t1.name, players: [...t1.players], isLocked: false });
    setGuestTeam({ name: t2.name, players: [...t2.players], isLocked: false });
  };

  const handleNextStep = () => {
    // Validation
    const errors = [];
    if (!homeTeam.name) errors.push('請輸入我方隊伍名稱');
    if (homeTeam.players.length < 6) errors.push(`我方隊伍人數不足 (目前 ${homeTeam.players.length})`);
    
    if (!guestTeam.name) errors.push('請輸入對方隊伍名稱');
    if (guestTeam.players.length < 6) errors.push(`對方隊伍人數不足 (目前 ${guestTeam.players.length})`);

    if (errors.length > 0) {
      alert('無法進入下一步：\n' + errors.join('\n'));
      return;
    }

    setStep('lineup');
  };

  const handleStartMatch = () => {
      // Validate Lineups (Ignore Libero 0 for count check, check 1-6)
      const getStartersCount = (l: Lineup) => Object.entries(l).filter(([pos, val]) => parseInt(pos) > 0 && val !== null).length;
      
      const homeCount = getStartersCount(homeLineup);
      const guestCount = getStartersCount(guestLineup);

      if (homeCount < 6 || guestCount < 6) {
          alert(`請填滿雙方先發名單 (目前: 我方 ${homeCount}/6, 對方 ${guestCount}/6)`);
          return;
      }

      setStep('match');
  };

  // Zoom Handlers
  const handleZoomIn = () => setUiScale(prev => Math.min(prev + 0.05, 1.5));
  const handleZoomOut = () => setUiScale(prev => Math.max(prev - 0.05, 0.5));
  const handleZoomReset = () => setUiScale(1);

  return (
    <div className="h-screen w-screen bg-slate-50 overflow-hidden font-sans text-slate-900 relative">
      
      {/* Main App Content - Scaled Wrapper */}
      {/* Using 'zoom' CSS property which works well in WebKit (Chrome/Safari) for "layout scaling" */}
      <div 
        style={{ zoom: uiScale }} 
        className="h-full w-full flex flex-col origin-top-left"
      >
        {/* Top Navigation Bar */}
        <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-4 lg:px-6 shadow-md z-10 shrink-0">
            <div className="flex items-center gap-4">
            {step === 'lineup' && (
                <button 
                    onClick={() => setStep('setup')}
                    className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} /> <span className="text-sm font-medium">上一步</span>
                </button>
            )}
            <div className="h-6 w-px bg-slate-700 mx-2" />
            {/* Logo / Brand */}
            <div className="flex items-center gap-2">
                <div className="text-orange-500">
                    <Trophy size={24} strokeWidth={2.5} />
                </div>
                <h1 className="text-lg font-bold tracking-wide">VolleyStats Pro</h1>
            </div>
            </div>
            
            <div className="flex items-center gap-3">
                
                {/* Zoom Controls integrated in header */}
                <div className="flex items-center gap-1 bg-slate-800 text-white rounded-lg px-2 py-1.5 border-2 border-green-400 shadow-[0_0_10px_rgba(74,222,128,0.2)] mr-2">
                    <span className="text-sm font-bold mr-1 hidden lg:inline-block">畫面縮放</span>
                    <button 
                        onClick={handleZoomOut}
                        className="p-0.5 hover:bg-slate-700 rounded text-white transition-colors"
                        title="縮小"
                    >
                        <ZoomOut size={16} />
                    </button>
                    <button 
                        onClick={handleZoomReset}
                        className="px-1 min-w-[3rem] text-sm font-mono font-bold text-center text-white hover:text-green-300"
                        title="點擊重置為 100%"
                    >
                        {Math.round(uiScale * 100)}%
                    </button>
                    <button 
                        onClick={handleZoomIn}
                        className="p-0.5 hover:bg-slate-700 rounded text-white transition-colors"
                        title="放大"
                    >
                        <ZoomIn size={16} />
                    </button>
                </div>

                {step === 'lineup' && (
                    <button 
                        onClick={handleStartMatch}
                        className="flex items-center gap-2 px-5 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white font-bold shadow transition-all animate-pulse ml-2"
                    >
                        <Play size={16} fill="currentColor" /> 開始比賽
                    </button>
                )}
                
                <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-sm border border-slate-700">
                    <Archive size={14} /> 備份
                </button>
                <button 
                    onClick={confirmResetMatch}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white transition-colors text-sm font-medium shadow-sm"
                >
                    <RefreshCw size={14} /> 開新比賽
                </button>
            </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden flex flex-col w-full mx-auto relative">
            
            {step === 'setup' && (
                <div className="flex flex-col h-full p-3 md:p-4 lg:p-6 animate-in slide-in-from-left-4 duration-300">
                    {/* Action Header */}
                    <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-slate-200 mb-3 md:mb-4 flex flex-col md:flex-row justify-between items-center gap-3 shrink-0">
                        <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
                            賽前設定 (Match Setup)
                        </h2>
                        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                            <button 
                                onClick={handleLoadTestData}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold shadow transition-colors whitespace-nowrap"
                            >
                                <Database size={18} /> 測試資料
                            </button>
                            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold shadow transition-colors whitespace-nowrap">
                                <Archive size={18} /> 匯入備份
                            </button>
                            <button 
                                onClick={handleNextStep}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg hover:shadow-xl transition-all transform active:scale-95 whitespace-nowrap"
                            >
                                下一步 <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Team Panels Container */}
                    <div className="flex-1 flex flex-col md:flex-row gap-3 md:gap-4 min-h-0">
                        <div className="flex-1 h-full min-h-0">
                            <TeamSetupPanel
                            side="home"
                            teamName={homeTeam.name}
                            players={homeTeam.players}
                            isLocked={homeTeam.isLocked}
                            savedTeams={savedTeams}
                            onNameChange={(name) => setHomeTeam(prev => ({...prev, name}))}
                            onPlayersChange={(players) => setHomeTeam(prev => ({...prev, players}))}
                            onLockToggle={() => setHomeTeam(prev => ({...prev, isLocked: !prev.isLocked}))}
                            onSaveToDB={() => handleSaveToDB('home')}
                            onDeleteFromDB={handleDeleteFromDB}
                            onLoadFromDB={(id) => handleLoadFromDB('home', id)}
                            onReset={() => setHomeTeam(createEmptyTeamState())}
                            />
                        </div>
                        <div className="flex-1 h-full min-h-0">
                            <TeamSetupPanel
                            side="guest"
                            teamName={guestTeam.name}
                            players={guestTeam.players}
                            isLocked={guestTeam.isLocked}
                            savedTeams={savedTeams}
                            onNameChange={(name) => setGuestTeam(prev => ({...prev, name}))}
                            onPlayersChange={(players) => setGuestTeam(prev => ({...prev, players}))}
                            onLockToggle={() => setGuestTeam(prev => ({...prev, isLocked: !prev.isLocked}))}
                            onSaveToDB={() => handleSaveToDB('guest')}
                            onDeleteFromDB={handleDeleteFromDB}
                            onLoadFromDB={(id) => handleLoadFromDB('guest', id)}
                            onReset={() => setGuestTeam(createEmptyTeamState())}
                            />
                        </div>
                    </div>
                </div>
            )}

            {step === 'lineup' && (
                <div className="flex flex-col h-full p-2 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex-1 min-h-0">
                        <LineupEditor 
                            homeTeam={{...homeTeam, id: 'temp-home', createdAt: 0}}
                            guestTeam={{...guestTeam, id: 'temp-guest', createdAt: 0}}
                            homeLineup={homeLineup}
                            guestLineup={guestLineup}
                            onHomeLineupChange={setHomeLineup}
                            onGuestLineupChange={setGuestLineup}
                        />
                    </div>
                </div>
            )}

            {step === 'match' && (
                <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-4">
                    <Trophy size={64} className="opacity-20" />
                    <h2 className="text-2xl font-bold">比賽進行中</h2>
                    <p>計分板與輪轉功能開發中...</p>
                    <button 
                        onClick={() => setStep('lineup')}
                        className="mt-4 px-4 py-2 bg-slate-200 rounded text-slate-600 hover:bg-slate-300"
                    >
                        返回陣容設定
                    </button>
                </div>
            )}

        </main>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDangerous={confirmDialog.isDangerous}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default App;