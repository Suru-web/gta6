import { Character, Arena, Difficulty } from '@/types/game';

export type ActionState = 
  | 'idle' 
  | 'walk_fwd' 
  | 'walk_back' 
  | 'jump' 
  | 'crouch' 
  | 'block' 
  | 'punch' 
  | 'kick' 
  | 'grab' 
  | 'super' 
  | 'hitstun' 
  | 'knockdown' 
  | 'victory' 
  | 'defeat';

export type AttackType = 'punch' | 'kick' | 'grab' | 'super' | null;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
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
