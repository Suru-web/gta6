'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Character, Difficulty, Arena } from '@/types/game';
import { Trophy, Skull, RotateCcw, Users, BarChart3, HeartHandshake, X } from 'lucide-react';
import { sounds } from '@/lib/sounds';

interface MatchResultModalProps {
  playerWon: boolean;
  playerChar: Character;
  cpuChar: Character;
  roundsWonPlayer: number;
  roundsWonCpu: number;
  damageDealtPlayer: number;
  maxCombo: number;
  durationSeconds: number;
  difficulty: Difficulty;
  arena: Arena;
  onRematch: () => void;
  onChooseFighter: () => void;
  onViewLeaderboard: () => void;
  onOpenSideQuest?: () => void;
  onClose?: () => void;
}

export const MatchResultModal: React.FC<MatchResultModalProps> = ({
  playerWon,
  playerChar,
  cpuChar,
  roundsWonPlayer,
  roundsWonCpu,
  damageDealtPlayer,
  maxCombo,
  durationSeconds,
  difficulty,
  arena,
  onRematch,
  onChooseFighter,
  onViewLeaderboard,
  onOpenSideQuest,
  onClose,
}) => {
  useEffect(() => {
    if (playerWon) {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#facc15', '#f59e0b', '#ec4899', '#06b6d4'],
      });
    }
  }, [playerWon]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 text-center border-2 shadow-2xl relative overflow-hidden ${
          playerWon
            ? 'border-yellow-400/80 bg-[#140e03]/95 shadow-[0_0_80px_rgba(250,204,21,0.4)]'
            : 'border-red-600/80 bg-[#160404]/95 shadow-[0_0_80px_rgba(220,38,38,0.4)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white transition-all z-10"
            title="Close"
          >
            <X size={18} />
          </button>
        )}

        {/* Top Banner Icon */}
        <div
          className={`inline-flex w-20 h-20 items-center justify-center rounded-3xl mb-3 border shadow-xl ${
            playerWon
              ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/40 animate-bounce'
              : 'bg-red-600/20 text-red-500 border-red-600/40'
          }`}
        >
          {playerWon ? <Trophy size={42} /> : <Skull size={42} />}
        </div>

        {/* Headline */}
        <h1
          className={`font-bebas text-5xl sm:text-6xl tracking-wider leading-none mb-1 ${
            playerWon ? 'text-yellow-400' : 'text-red-600'
          }`}
        >
          {playerWon ? 'VICTORY!' : 'WASTED'}
        </h1>
        <p className="text-xs sm:text-sm font-mono tracking-widest text-[#fca47a] uppercase mb-4">
          {playerWon
            ? 'RESPECT + 999,999 // MATCH RECORDED GLOBALLY'
            : 'MISSION FAILED // BETTER LUCK IN VICE CITY'}
        </p>

        {/* Scorecard Box */}
        <div className="rounded-2xl border border-white/10 bg-black/60 p-4 mb-5 text-left font-mono text-xs space-y-2">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <span className="text-[#a19bb5]">MATCHUP</span>
            <span className="font-bold text-white">
              {playerChar.name} ({roundsWonPlayer}) vs {cpuChar.name} ({roundsWonCpu})
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#a19bb5]">DAMAGE DEALT</span>
            <span className="font-bold text-emerald-400">{damageDealtPlayer} HP</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#a19bb5]">MAX COMBO</span>
            <span className="font-bold text-yellow-300">{maxCombo} HITS</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#a19bb5]">MATCH TIME</span>
            <span className="font-bold text-white">{Math.round(durationSeconds)}s</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-white/10">
            <span className="text-[#a19bb5]">ARENA & DIFFICULTY</span>
            <span className="font-bold text-[#fca47a] uppercase">
              {arena.city} &bull; {difficulty}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onRematch();
            }}
            className="rounded-xl bg-gradient-to-r from-[#fca47a] to-[#e86b97] py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#090514] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md"
          >
            <RotateCcw size={15} />
            <span>Rematch</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onChooseFighter();
            }}
            className="rounded-xl border border-white/15 bg-white/5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-white hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Users size={15} />
            <span>Change Fighters</span>
          </button>
        </div>

        {/* Global Rankings & Side Quest Links */}
        <div className="flex gap-2 justify-center">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onViewLeaderboard();
            }}
            className="flex-1 py-2 text-[11px] font-mono text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/30 rounded-xl transition-all flex items-center justify-center gap-1"
          >
            <BarChart3 size={13} />
            <span>Global Rankings</span>
          </button>

          {onOpenSideQuest && <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onOpenSideQuest();
            }}
            className="flex-1 py-2 text-[11px] font-mono text-yellow-300 bg-yellow-950/40 hover:bg-yellow-950/70 border border-yellow-500/30 rounded-xl transition-all flex items-center justify-center gap-1"
          >
            <HeartHandshake size={13} />
            <span>Side Quest (Fund)</span>
          </button>}
        </div>
      </div>
    </div>
  );
};
