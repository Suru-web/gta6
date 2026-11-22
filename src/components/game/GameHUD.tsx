'use client';

import React from 'react';
import { Character, Arena } from '@/types/game';
import { RoundState } from '@/game/types';
import { Volume2, VolumeX, Pause, Shield, Zap } from 'lucide-react';
import { gameAudio } from '@/game/audio';

interface GameHUDProps {
  playerChar: Character;
  cpuChar: Character;
  playerHp: number;
  cpuHp: number;
  playerSuper: number;
  cpuSuper: number;
  roundState: RoundState;
  arena: Arena;
  onPause: () => void;
  isPaused: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  playerChar,
  cpuChar,
  playerHp,
  cpuHp,
  playerSuper,
  cpuSuper,
  roundState,
  arena,
  onPause,
  isPaused,
  isMuted,
  onToggleMute,
}) => {
  const playerHpPct = Math.max(0, Math.min(100, (playerHp / playerChar.stats.health) * 100));
  const cpuHpPct = Math.max(0, Math.min(100, (cpuHp / cpuChar.stats.health) * 100));

  return (
    <div className="absolute inset-x-0 top-0 p-3 sm:p-5 pointer-events-none select-none z-20">
      {/* Top Header: Health Bars, Timer, Round Indicators */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 max-w-4xl mx-auto">
        
        {/* ========================================= */}
        {/* PLAYER 1 (LEFT)                           */}
        {/* ========================================= */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl filter drop-shadow">{playerChar.portrait}</span>
            <div className="leading-tight">
              <span className="font-bebas text-lg sm:text-2xl text-white tracking-wider block">
                {playerChar.name}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#fca47a]">
                1P // {playerChar.game}
              </span>
            </div>
            {/* Round Win Stars */}
            <div className="ml-auto flex items-center gap-1">
              {[1, 2].map((r) => (
                <div
                  key={r}
                  className={`w-3.5 h-3.5 rounded-full border border-yellow-400 flex items-center justify-center transition-all ${
                    roundState.playerRoundsWon >= r
                      ? 'bg-yellow-400 shadow-[0_0_8px_#facc15]'
                      : 'bg-black/50'
                  }`}
                >
                  {roundState.playerRoundsWon >= r && (
                    <span className="text-[9px] font-bold text-black leading-none">★</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Health Bar */}
          <div className="relative h-4 sm:h-5 w-full bg-red-950/80 rounded-md overflow-hidden border border-white/20 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-yellow-400 transition-all duration-150 ease-out"
              style={{ width: `${playerHpPct}%` }}
            />
          </div>

          {/* Super / Rage Meter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold text-cyan-300 flex items-center gap-0.5">
              <Zap size={11} className={playerSuper >= 100 ? 'animate-bounce text-yellow-300' : ''} />
              RAGE
            </span>
            <div className="relative h-2 flex-1 bg-black/60 rounded-full overflow-hidden border border-cyan-500/40">
              <div
                className={`h-full transition-all duration-200 ${
                  playerSuper >= 100
                    ? 'bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-300 animate-pulse'
                    : 'bg-cyan-400'
                }`}
                style={{ width: `${playerSuper}%` }}
              />
            </div>
            {playerSuper >= 100 && (
              <span className="text-[9px] font-mono font-bold text-yellow-300 animate-pulse">
                [L / SPACE] READY!
              </span>
            )}
          </div>
        </div>

        {/* ========================================= */}
        {/* CENTER: ROUND TIMER & CONTROLS            */}
        {/* ========================================= */}
        <div className="flex flex-col items-center justify-center px-1 sm:px-2">
          {/* Authentic Arcade Timer */}
          <div className="relative w-12 sm:w-16 h-12 sm:h-16 rounded-2xl bg-black/80 border-2 border-[#fca47a] shadow-[0_0_20px_rgba(252,164,122,0.4)] flex items-center justify-center">
            <span
              className={`font-bebas text-3xl sm:text-4xl tracking-wider ${
                roundState.roundTimer <= 10 ? 'text-red-500 animate-ping' : 'text-yellow-400'
              }`}
            >
              {roundState.roundTimer}
            </span>
          </div>

          {/* Quick Audio & Pause Buttons */}
          <div className="mt-2 flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={onToggleMute}
              className="p-1 rounded-lg bg-black/60 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all text-xs"
              title={isMuted ? 'Unmute (N)' : 'Mute (N)'}
            >
              {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
            <button
              type="button"
              onClick={onPause}
              className="p-1 rounded-lg bg-black/60 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all text-xs"
              title="Pause (ESC)"
            >
              <Pause size={13} />
            </button>
          </div>
        </div>

        {/* ========================================= */}
        {/* CPU OPPONENT (RIGHT)                      */}
        {/* ========================================= */}
        <div className="space-y-1.5 text-right">
          <div className="flex items-center justify-end gap-2">
            {/* Round Win Stars */}
            <div className="mr-auto flex items-center gap-1">
              {[1, 2].map((r) => (
                <div
                  key={r}
                  className={`w-3.5 h-3.5 rounded-full border border-yellow-400 flex items-center justify-center transition-all ${
                    roundState.cpuRoundsWon >= r
                      ? 'bg-yellow-400 shadow-[0_0_8px_#facc15]'
                      : 'bg-black/50'
                  }`}
                >
                  {roundState.cpuRoundsWon >= r && (
                    <span className="text-[9px] font-bold text-black leading-none">★</span>
                  )}
                </div>
              ))}
            </div>

            <div className="leading-tight">
              <span className="font-bebas text-lg sm:text-2xl text-white tracking-wider block">
                {cpuChar.name}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#fca47a]">
                CPU // {cpuChar.game}
              </span>
            </div>
            <span className="text-xl sm:text-2xl filter drop-shadow">{cpuChar.portrait}</span>
          </div>

          {/* Health Bar */}
          <div className="relative h-4 sm:h-5 w-full bg-red-950/80 rounded-md overflow-hidden border border-white/20 shadow-inner flex justify-end">
            <div
              className="h-full bg-gradient-to-l from-emerald-500 via-teal-400 to-yellow-400 transition-all duration-150 ease-out"
              style={{ width: `${cpuHpPct}%` }}
            />
          </div>

          {/* Super Meter */}
          <div className="flex items-center justify-end gap-1.5">
            {cpuSuper >= 100 && (
              <span className="text-[9px] font-mono font-bold text-rose-400 animate-pulse">
                SUPER READY!
              </span>
            )}
            <div className="relative h-2 flex-1 bg-black/60 rounded-full overflow-hidden border border-rose-500/40 flex justify-end">
              <div
                className={`h-full transition-all duration-200 ${
                  cpuSuper >= 100 ? 'bg-gradient-to-l from-rose-500 to-orange-400 animate-pulse' : 'bg-rose-500'
                }`}
                style={{ width: `${cpuSuper}%` }}
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-rose-400 flex items-center gap-0.5">
              RAGE
              <Zap size={11} className={cpuSuper >= 100 ? 'animate-bounce text-yellow-300' : ''} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
