import { Character, Arena, Difficulty } from '@/types/game';

export type ActionState = 
  | 'idle' 
  | 'walk_fwd' 
  | 'walk_back' 
  | 'jump' 
  | 'crouch' 
  | 'block' 
  | 'blockstun'
  | 'punch' 
  | 'kick' 
  | 'grab' 
  | 'super' 
  | 'hitstun' 
  | 'knockdown' 
  | 'getting_up'
  | 'victory' 
  | 'defeat';

export type AttackType = 'punch' | 'kick' | 'grab' | 'super' | null;

export type AttackPhase = 'none' | 'startup' | 'active' | 'recovery';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HitResult {
  hit: boolean;
  blocked: boolean;
  actualDamage: number;
  isCounterHit: boolean;
  hitstopFrames: number;
  knockdown: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'spark' | 'circle' | 'line';
}

export interface DamagePopup {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
}

export interface RoundState {
  currentRound: number; // 1, 2, 3
  playerRoundsWon: number;
  cpuRoundsWon: number;
  roundTimer: number; // 60 seconds
  phase: 'intro' | 'fight' | 'ko' | 'round_end' | 'match_end';
  bannerText: string;
  bannerSubtext: string;
  bannerAlpha: number;
  bannerScale: number;
}

export interface CombatTelemetry {
  attacksInitiatedPlayer: number;
  attacksInitiatedCpu: number;
  attacksLandedPlayer: number;
  attacksLandedCpu: number;
  attacksWhiffedPlayer: number;
  attacksWhiffedCpu: number;
  attacksBlockedPlayer: number;
  attacksBlockedCpu: number;
  punishesPlayer: number;
  punishesCpu: number;
  combosExecutedPlayer: number;
  combosExecutedCpu: number;
  neutralFrames: number;
  cpuAttackCooldownGaps: number[];
}
