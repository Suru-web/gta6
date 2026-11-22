export type Difficulty = 'easy' | 'normal' | 'hard';

export type ArenaId = 'vice-city' | 'los-santos' | 'liberty-city' | 'san-andreas' | 'leonida';

export interface CharacterStats {
  health: number;    // 80 - 120 (base 100)
  strength: number;  // 70 - 130 (attack power)
  speed: number;     // 70 - 130 (movement & attack speed)
  defence: number;   // 70 - 130 (damage reduction)
}

export interface SpecialMove {
  name: string;
  command: string;
  description: string;
  damage: number;
  meterCost: number; // usually 100 (full meter)
  themeColor: string;
}

export interface Character {
  id: string;
  name: string;
  alias: string;
  game: string;
  releaseYear: number;
  tagline: string;
  quote: string;
  portrait: string;
  themeColor: string;
  accentColor: string;
  stats: CharacterStats;
  specialMove: SpecialMove;
  styleDescription: string;
}

export interface Arena {
  id: ArenaId;
  name: string;
  city: string;
  tagline: string;
  bgGradient: string;
  groundColor: string;
  neonColor: string;
  timeOfDay: string;
  landmarks: string[];
}

export interface MatchStartRequest {
  playerCharacterId: string;
  cpuCharacterId: string;
  arenaId: ArenaId;
  difficulty: Difficulty;
}

export interface MatchStartResponse {
  success: boolean;
  matchToken: string;
  matchId: string;
  timestamp: number;
}

export interface MatchFinishRequest {
  matchToken: string;
  matchId: string;
  playerCharacterId: string;
  cpuCharacterId: string;
  arenaId: ArenaId;
  difficulty: Difficulty;
  playerWon: boolean;
  roundsWonPlayer: number;
  roundsWonCpu: number;
  durationSeconds: number;
  damageDealtPlayer: number;
  damageDealtCpu: number;
  maxCombo: number;
}

export interface MatchRecord {
  id: string;
  timestamp: number;
  playerCharacterId: string;
  cpuCharacterId: string;
  arenaId: ArenaId;
  difficulty: Difficulty;
  playerWon: boolean;
  roundsWonPlayer: number;
  roundsWonCpu: number;
  durationSeconds: number;
  damageDealtPlayer: number;
  damageDealtCpu: number;
  maxCombo: number;
}

export interface FighterStatSummary {
  characterId: string;
  characterName: string;
  game: string;
  themeColor: string;
  picks: number;
  wins: number;
  losses: number;
  totalMatches: number;
  winRate: number; // percentage (0 - 100)
  easyWins: number;
  normalWins: number;
  hardWins: number;
  totalDamageDealt: number;
  score: number; // Composite strength score
}

export interface LeaderboardResponse {
  success: boolean;
  totalMatches: number;
  stats: FighterStatSummary[];
  byPopularity: FighterStatSummary[];
  byVictories: FighterStatSummary[];
  byWinRate: FighterStatSummary[];
  byStrength: FighterStatSummary[];
  updatedAt: number;
}
