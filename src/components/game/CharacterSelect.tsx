'use client';

import React, { useState } from 'react';
import { Character, Arena, Difficulty } from '@/types/game';
import { GTA_ROSTER, DEFAULT_PLAYER_CHARACTER, DEFAULT_CPU_CHARACTER } from '@/config/roster';
import { ARENAS, DEFAULT_ARENA } from '@/config/arenas';
import { Swords, Shield, Heart, Zap, FastForward, Trophy, MapPin, ChevronRight } from 'lucide-react';
import { sounds } from '@/lib/sounds';

interface CharacterSelectProps {
  onStartFight: (config: {
    playerChar: Character;
    cpuChar: Character;
    arena: Arena;
    difficulty: Difficulty;
  }) => void;
  onBackToTitle?: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  onStartFight,
  onBackToTitle,
}) => {
  const [activeTab, setActiveTab] = useState<'p1' | 'cpu'>('p1');
  const [selectedPlayer, setSelectedPlayer] = useState<Character>(DEFAULT_PLAYER_CHARACTER);
  const [selectedCpu, setSelectedCpu] = useState<Character>(DEFAULT_CPU_CHARACTER);
  const [selectedArena, setSelectedArena] = useState<Arena>(DEFAULT_ARENA);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  const activeChar = activeTab === 'p1' ? selectedPlayer : selectedCpu;

  const handleSelectChar = (char: Character) => {
    sounds.playClick();
    if (activeTab === 'p1') {
      setSelectedPlayer(char);
    } else {
      setSelectedCpu(char);
    }
  };

  const handleStart = () => {
    sounds.playCheatCode();
    onStartFight({
      playerChar: selectedPlayer,
      cpuChar: selectedCpu,
      arena: selectedArena,
      difficulty,
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="text-center mb-6">
        <span className="text-[11px] font-mono uppercase tracking-widest text-[#fca47a] bg-[#fca47a]/10 border border-[#fca47a]/20 px-3 py-1 rounded-full">
          ARCADE MODE // BEST OF 3 ROUNDS
        </span>
        <h1 className="mt-2 font-bebas text-4xl sm:text-6xl text-white tracking-wider">
          CHOOSE YOUR FIGHTER
        </h1>
        <p className="text-xs sm:text-sm text-[#a19bb5] font-mono">
          Pick your GTA legend, select your CPU rival, and settle who rules the streets.
        </p>

        {/* 1P vs CPU Selection Mode Toggle */}
        <div className="mt-4 inline-flex rounded-2xl border border-white/10 bg-black/60 p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('p1');
            }}
            className={`flex items-center gap-2 rounded-xl px-5 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ${
              activeTab === 'p1'
                ? 'bg-gradient-to-r from-[#fca47a] to-[#e86b97] text-[#090514] shadow-md'
                : 'text-[#a19bb5] hover:text-white'
            }`}
          >
            <span>1P: {selectedPlayer.name}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('cpu');
            }}
            className={`flex items-center gap-2 rounded-xl px-5 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ${
              activeTab === 'cpu'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-[#a19bb5] hover:text-white'
            }`}
          >
            <span>CPU: {selectedCpu.name}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Roster Grid + Character Stats Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: 14 Character Grid (7 cols on lg) */}
        <div className="lg:col-span-7 bg-[#120b22]/90 border border-white/[0.08] rounded-3xl p-4 sm:p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bebas text-xl text-white tracking-wider">
              {activeTab === 'p1' ? 'SELECT PLAYER 1' : 'SELECT CPU OPPONENT'}
            </span>
            <span className="text-[11px] font-mono text-[#fca47a]">
              14 LEGENDS AVAILABLE
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-3">
            {GTA_ROSTER.map((char) => {
              const isP1 = selectedPlayer.id === char.id;
              const isCpu = selectedCpu.id === char.id;
              const isCurrentFocus = activeChar.id === char.id;

              return (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => handleSelectChar(char)}
                  className={`relative group rounded-2xl p-2 flex flex-col items-center justify-center transition-all ${
                    isCurrentFocus
                      ? 'border-2 scale-105 shadow-lg shadow-black/50 z-10'
                      : 'border border-white/10 hover:border-white/30 bg-black/40 hover:bg-white/5'
                  }`}
                  style={{
                    borderColor: isCurrentFocus ? char.themeColor : undefined,
                    backgroundColor: isCurrentFocus ? 'rgba(0,0,0,0.7)' : undefined,
                  }}
                >
                  {/* Badges for P1 and CPU */}
                  <div className="absolute top-1 left-1 flex gap-0.5 z-10">
                    {isP1 && (
                      <span className="bg-[#fca47a] text-black text-[8px] font-black px-1 rounded">
                        1P
                      </span>
                    )}
                    {isCpu && (
                      <span className="bg-rose-500 text-white text-[8px] font-black px-1 rounded">
                        CPU
                      </span>
                    )}
                  </div>

                  <span className="text-3xl sm:text-4xl filter drop-shadow my-1 group-hover:scale-110 transition-transform">
                    {char.portrait}
                  </span>

                  <span className="text-[10px] sm:text-xs font-bold text-white tracking-tight truncate max-w-full">
                    {char.name.split(' ')[0]}
                  </span>
                  <span className="text-[8px] font-mono text-[#a19bb5] truncate max-w-full">
                    {char.game.replace('GTA: ', '').replace('GTA ', '')}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Arena & Difficulty Selection Strip */}
          <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Arena Picker */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#a19bb5] block mb-1.5 flex items-center gap-1">
                <MapPin size={13} className="text-[#fca47a]" />
                FIGHTING ARENA
              </label>
              <select
                value={selectedArena.id}
                onChange={(e) => {
                  sounds.playClick();
                  const found = ARENAS.find((a) => a.id === e.target.value);
                  if (found) setSelectedArena(found);
                }}
                className="w-full rounded-xl border border-white/12 bg-black/70 px-3 py-2 text-xs font-mono text-white focus:border-[#fca47a] focus:outline-none"
              >
                {ARENAS.map((a) => (
                  <option key={a.id} value={a.id} className="bg-[#120b22] text-white">
                    {a.name} ({a.timeOfDay})
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Toggle */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-[#a19bb5] block mb-1.5 flex items-center gap-1">
                <Swords size={13} className="text-rose-400" />
                CPU DIFFICULTY
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setDifficulty(d);
                    }}
                    className={`py-2 text-[10px] font-mono uppercase font-bold rounded-lg transition-all ${
                      difficulty === d
                        ? d === 'hard'
                          ? 'bg-rose-600 text-white shadow-md'
                          : d === 'normal'
                          ? 'bg-yellow-500 text-black shadow-md'
                          : 'bg-emerald-600 text-white shadow-md'
                        : 'bg-white/5 text-[#a19bb5] hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Character Profile & Signature Move (5 cols on lg) */}
        <div className="lg:col-span-5 bg-[#120b22]/90 border border-white/[0.08] rounded-3xl p-5 sm:p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-lg border"
              style={{
                borderColor: activeChar.themeColor,
                backgroundColor: `${activeChar.themeColor}15`,
              }}
            >
              {activeChar.portrait}
            </div>
            <div>
              <h2 className="font-bebas text-3xl text-white tracking-wider leading-none">
                {activeChar.name}
              </h2>
              <span className="text-xs font-mono text-[#fca47a] block mt-0.5">
                {activeChar.tagline} &bull; {activeChar.game}
              </span>
            </div>
          </div>

          {/* Quote */}
          <blockquote className="rounded-xl border border-white/5 bg-black/40 p-3 text-xs italic text-[#a19bb5] font-mono mb-4">
            &quot;{activeChar.quote}&quot;
          </blockquote>

          {/* Stats Radar / Progress Bars */}
          <div className="space-y-2 mb-4 font-mono text-xs">
            <div>
              <div className="flex justify-between text-[11px] text-[#a19bb5] mb-1">
                <span className="flex items-center gap-1">
                  <Heart size={12} className="text-red-400" /> HEALTH
                </span>
                <span className="text-white font-bold">{activeChar.stats.health}</span>
              </div>
              <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${(activeChar.stats.health / 130) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-[#a19bb5] mb-1">
                <span className="flex items-center gap-1">
                  <Swords size={12} className="text-amber-400" /> STRENGTH
                </span>
                <span className="text-white font-bold">{activeChar.stats.strength}</span>
              </div>
              <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-amber-400"
                  style={{ width: `${(activeChar.stats.strength / 130) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-[#a19bb5] mb-1">
                <span className="flex items-center gap-1">
                  <FastForward size={12} className="text-emerald-400" /> SPEED
                </span>
                <span className="text-white font-bold">{activeChar.stats.speed}</span>
              </div>
              <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-emerald-400"
                  style={{ width: `${(activeChar.stats.speed / 130) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-[#a19bb5] mb-1">
                <span className="flex items-center gap-1">
                  <Shield size={12} className="text-blue-400" /> DEFENCE
                </span>
                <span className="text-white font-bold">{activeChar.stats.defence}</span>
              </div>
              <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-blue-400"
                  style={{ width: `${(activeChar.stats.defence / 130) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Signature Special Attack Card */}
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-950/20 p-3.5 mb-5">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bebas text-lg text-yellow-300 tracking-wider flex items-center gap-1">
                <Zap size={14} className="animate-bounce" />
                {activeChar.specialMove.name}
              </span>
              <span className="text-[9px] font-mono bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded font-bold">
                {activeChar.specialMove.command}
              </span>
            </div>
            <p className="text-[11px] text-[#a19bb5] font-mono leading-relaxed">
              {activeChar.specialMove.description}
            </p>
          </div>

          {/* Big Action: START FIGHTING */}
          <button
            type="button"
            onClick={handleStart}
            className="w-full rounded-2xl bg-gradient-to-r from-[#fca47a] via-[#e86b97] to-[#9333ea] py-4 text-base sm:text-lg font-bebas tracking-widest text-[#090514] font-black uppercase hover:brightness-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(252,164,122,0.4)] flex items-center justify-center gap-2"
          >
            <Swords size={20} />
            <span>START FIGHTING // {selectedPlayer.name} VS {selectedCpu.name}</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
