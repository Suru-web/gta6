'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, Settings, Star, Flame, Trophy } from 'lucide-react';
import { sounds } from '@/lib/sounds';
import { SiteStats } from '@/types/donation';

interface NavbarProps {
  stats: SiteStats;
  onOpenSettings: () => void;
  onScrollToLegends: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ stats, onOpenSettings, onScrollToLegends }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    sounds.enabled = nextState;
    if (nextState) sounds.playClick();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-pink-500 bg-[#0b071a]/95 backdrop-blur-md px-4 py-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        {/* Playful Brand Logo */}
        <div className="flex items-center gap-2">
          <span className="font-bebas text-3xl sm:text-4xl font-extrabold gta-gradient tracking-wide">
            GTA VI
          </span>
          <span className="hidden sm:inline-block rounded-md bg-yellow-400 px-2 py-0.5 font-sans text-xs font-black uppercase text-black tracking-wider">
            BROKE GAMER FUND
          </span>
        </div>

        {/* Center: Funny Wanted Stars */}
        <div className="flex items-center gap-1.5 rounded-full border border-pink-500/40 bg-purple-950/60 px-3 py-1">
          <span className="text-[11px] font-bold text-pink-400 uppercase tracking-wider mr-1 hidden xs:inline">
            Wanted
          </span>
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={15}
              className={`transition-all ${
                s <= stats.wantedLevel
                  ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse'
                  : 'fill-slate-800 text-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Hall of Legends Button */}
          <button
            onClick={() => {
              sounds.playClick();
              onScrollToLegends();
            }}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border-2 border-amber-400 bg-amber-400/10 px-3 py-1.5 text-xs font-black uppercase text-amber-300 hover:bg-amber-400 hover:text-black transition-all"
          >
            <Trophy size={14} />
            <span>Legends</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            aria-label="Toggle Sound"
            title={soundEnabled ? 'Sound is ON' : 'Sound is MUTED'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-pink-500/40 bg-purple-950/60 text-slate-200 hover:border-pink-400 hover:text-pink-400 transition-colors"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-slate-500" />}
          </button>

          {/* UPI Settings */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenSettings();
            }}
            aria-label="UPI Settings"
            title="Change UPI ID or QR"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-950/40 text-cyan-300 hover:border-cyan-400 hover:text-white transition-colors"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
