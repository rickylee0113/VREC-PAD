export interface Player {
  id: string;
  number: string; // Keeping as string to handle '01' vs '1' if needed, but validated as numeric
  name: string;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  createdAt: number;
}

export type PlayerRole = '未定' | '舉球 (S)' | '大砲 (OH)' | '快攻 (MB)' | '舉對 (OP)' | '自由 (L)' | '防守 (DS)';

export interface PlayerPosition {
  playerId: string;
  role: PlayerRole;
}

// Map position index (1-6) to player data
export type Lineup = Record<number, PlayerPosition | null>;

export interface MatchState {
  step: 'setup' | 'lineup' | 'match'; // Added navigation steps
  homeTeamId: string | null;
  guestTeamId: string | null;
  isMatchStarted: boolean;
}

export type Side = 'home' | 'guest';