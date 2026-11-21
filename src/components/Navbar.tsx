'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, Settings, Star, Trophy } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full border-b-2 border-[#e86b97]/40 bg-[#110b20]/95 backdrop-blur-md px-4 py-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        {/* Playful Brand Logo */}
        <div className="flex items-center gap-2">
          <span className="font-bebas text-3xl sm:text-4xl font-extrabold gta-gradient tracking-wide drop-shadow">
            GTA VI
          </span>
          <span className="hidden sm:inline-block rounded-md bg-[#fca47a] px-2 py-0.5 font-sans text-xs font-black uppercase text-black tracking-wider">
            LEONIDA BROKE FUND
          </span>
        </div>

        {/* Center: Wanted Stars */}
        <div className="flex items-center gap-1.5 rounded-full border border-[#e86b97]/30 bg-[#1c1233]/80 px-3 py-1">
          <span className="text-[11px] font-bold text-[#fca47a] uppercase tracking-wider mr-1 hidden xs:inline">
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
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border-2 border-[#fca47a] bg-[#fca47a]/10 px-3 py-1.5 text-xs font-black uppercase text-[#fca47a] hover:bg-[#fca47a] hover:text-black transition-all"
          >
            <Trophy size={14} />
            <span>Legends</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            aria-label="Toggle Sound"
            title={soundEnabled ? 'Sound is ON' : 'Sound is MUTED'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e86b97]/40 bg-[#1c1233] text-slate-200 hover:border-[#fca47a] hover:text-[#fca47a] transition-colors"
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
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#fca47a]/40 bg-[#1c1233] text-[#fca47a] hover:border-[#fca47a] hover:text-white transition-colors"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
