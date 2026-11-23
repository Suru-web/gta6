'use client';

import React from 'react';
import { Character, Arena, Difficulty } from '@/types/game';
import { RoundState } from '@/game/types';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';

interface GameHUDProps {
  playerChar: Character;
  cpuChar: Character;
  playerHp: number;
  cpuHp: number;
  playerSuper: number;
  cpuSuper: number;
  roundState: RoundState;
  arena: Arena;
  difficulty?: Difficulty;
  onPause: () => void;
  isPaused: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({ playerChar, cpuChar, playerHp, cpuHp, playerSuper, cpuSuper, roundState, arena, difficulty = 'normal', onPause, isPaused, isMuted, onToggleMute }) => {
  const pct = (value: number, max: number) => Math.max(0, Math.min(100, value / max * 100));
  return (
    <div className="fight-hud">
      <div className="fight-hud-fighter">
        <div className="fight-hud-label"><span>PLAYER 01</span><span>{roundState.playerRoundsWon} / 2</span></div>
        <strong>{playerChar.name}</strong>
        <div className="fight-health"><i style={{ width: `${pct(playerHp, playerChar.stats.health)}%` }} /></div>
        <div className="fight-meter"><span>{playerSuper >= 100 ? 'SUPER READY · L' : 'SUPER'}</span><div><i style={{ width: `${playerSuper}%` }} /></div></div>
      </div>
      <div className="fight-hud-center">
        <span>{difficulty === 'practice' ? 'PRACTICE' : `ROUND ${roundState.currentRound}`}</span>
        <strong>{difficulty === 'practice' ? '∞' : roundState.roundTimer}</strong>
        <div className="fight-hud-controls">
          <button type="button" onClick={onToggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>{isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}</button>
          <button type="button" onClick={onPause} aria-label={isPaused ? 'Resume' : 'Pause'}>{isPaused ? <Play size={15} /> : <Pause size={15} />}</button>
        </div>
      </div>
      <div className="fight-hud-fighter is-right">
        <div className="fight-hud-label"><span>{roundState.cpuRoundsWon} / 2</span><span>CPU OPPONENT</span></div>
        <strong>{cpuChar.name}</strong>
        <div className="fight-health"><i style={{ width: `${pct(cpuHp, cpuChar.stats.health)}%` }} /></div>
        <div className="fight-meter"><div><i style={{ width: `${cpuSuper}%` }} /></div><span>SUPER</span></div>
      </div>
      <span className="sr-only">{arena.name}</span>
    </div>
  );
};
