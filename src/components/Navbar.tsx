'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, Shield, Trophy } from 'lucide-react';
import { sounds } from '@/lib/sounds';
import { SiteStats } from '@/types/donation';

interface NavbarProps {
  stats: SiteStats;
  onScrollToLegends: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ stats, onScrollToLegends }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    sounds.enabled = nextState;
    if (nextState) sounds.playClick();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#090514]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-baseline gap-1.5 group">
            <span className="font-bebas text-2xl sm:text-3xl font-extrabold tracking-wider text-[#fdfbf7] group-hover:text-[#fca47a] transition-colors">
              GTA <span className="title-gradient">VI</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#a19bb5] hidden sm:inline">
              Vice City Heist Fund
            </span>
          </a>

          {/* Status Badge */}
          <div className="hidden md:flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#fca47a] animate-pulse" />
            <span className="font-medium text-[#a19bb5]">Status:</span>
            <span className="font-semibold text-[#fdfbf7]">
              ₹{stats.totalRaised.toLocaleString('en-IN')}
            </span>
            <span className="text-[#6c637e]">/ ₹{stats.targetAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Legends Shortcut */}
          <button
            onClick={() => {
              sounds.playClick();
              onScrollToLegends();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[#fdfbf7] hover:border-[#e86b97]/40 hover:bg-[#e86b97]/10 transition-all active:scale-95"
          >
            <Trophy size={13} className="text-[#fca47a]" />
            <span>Legends ({stats.totalDonors})</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            aria-label="Toggle Sound"
            title={soundEnabled ? 'Sound is Enabled' : 'Sound is Muted'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-[#a19bb5] hover:text-[#fdfbf7] hover:border-white/20 transition-all active:scale-95"
          >
            {soundEnabled ? <Volume2 size={15} className="text-[#fca47a]" /> : <VolumeX size={15} className="text-[#6c637e]" />}
          </button>

          {/* Admin Portal Shortcut */}
          <a
            href="/admin"
            title="Admin Console"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-[#a19bb5] hover:text-[#e86b97] hover:border-[#e86b97]/40 transition-all active:scale-95"
          >
            <Shield size={14} />
          </a>
        </div>
      </div>
    </header>
  );
};
