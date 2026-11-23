'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Volume2, VolumeX, Shield, Trophy, Eye, Swords, HeartHandshake } from 'lucide-react';
import { sounds } from '@/lib/sounds';
import { SiteStats } from '@/types/donation';

interface NavbarProps {
  stats?: SiteStats;
  totalVisits?: number;
  onScrollToLegends?: () => void;
  onScrollToFight?: () => void;
  onScrollToRankings?: () => void;
  onScrollToQuest?: () => void;
  onScrollToAbout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  totalVisits,
  onScrollToLegends,
  onScrollToFight,
  onScrollToRankings,
  onScrollToQuest,
  onScrollToAbout,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(() => sounds.enabled);

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    sounds.enabled = nextState;
    if (nextState) sounds.playClick();
    else sounds.stopAll();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#090514]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6">
        
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-baseline gap-2 group">
            <span className="font-bebas text-2xl sm:text-3xl font-extrabold tracking-wider text-[#fdfbf7] group-hover:text-[#fca47a] transition-colors">
              GTA <span className="title-gradient">LEGENDS</span> ARENA
            </span>
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#a19bb5] hidden lg:inline bg-white/5 border border-white/10 px-2 py-0.5 rounded">
              ARCADE FIGHTER
            </span>
          </Link>

          {/* Public Total Visits Counter */}
          {typeof totalVisits === 'number' && totalVisits > 0 && (
            <div className="hidden xl:flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-xs text-[#a19bb5]">
              <Eye size={12} className="text-[#fca47a]" />
              <span className="font-semibold text-[#fdfbf7]">{totalVisits.toLocaleString('en-IN')}</span>
              <span>Visits</span>
            </div>
          )}
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 font-mono text-xs">
          {onScrollToFight && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onScrollToFight();
              }}
              className="px-3 py-1.5 rounded-lg text-[#fdfbf7] hover:bg-white/5 hover:text-[#fca47a] transition-colors flex items-center gap-1.5"
            >
              <Swords size={13} className="text-[#fca47a]" />
              <span>Fight</span>
            </button>
          )}

          {onScrollToRankings && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onScrollToRankings();
              }}
              className="px-3 py-1.5 rounded-lg text-[#a19bb5] hover:bg-white/5 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Trophy size={13} className="text-yellow-400" />
              <span>Rankings</span>
            </button>
          )}

          {onScrollToQuest && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onScrollToQuest();
              }}
              className="px-3 py-1.5 rounded-lg text-[#a19bb5] hover:bg-white/5 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <HeartHandshake size={13} className="text-rose-400" />
              <span>Side Quest</span>
              {stats && <span className="bg-yellow-400/20 text-yellow-300 text-[9px] px-1.5 rounded">
                ₹{stats.totalRaised}
              </span>}
            </button>
          )}

          {onScrollToLegends && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onScrollToLegends();
              }}
              className="px-3 py-1.5 rounded-lg text-[#a19bb5] hover:bg-white/5 hover:text-white transition-colors"
            >
              <span>Legends ({stats?.totalDonors ?? 0})</span>
            </button>
          )}

          {onScrollToAbout && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onScrollToAbout();
              }}
              className="px-3 py-1.5 rounded-lg text-[#a19bb5] hover:bg-white/5 hover:text-white transition-colors"
            >
              <span>About</span>
            </button>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Side Quest Button */}
          {onScrollToQuest && (
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onScrollToQuest();
              }}
              className="arena-quest-link md:hidden flex items-center gap-1 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-xs font-mono text-yellow-400"
            >
              <HeartHandshake size={12} />
              <span>Side Quest</span>
            </button>
          )}

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
          <Link
            href="/admin"
            title="Admin Console"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-[#a19bb5] hover:text-[#e86b97] hover:border-[#e86b97]/40 transition-all active:scale-95"
          >
            <Shield size={14} />
          </Link>
        </div>
      </div>
      {(onScrollToFight || onScrollToRankings) && (
        <nav className="arena-mobile-nav md:hidden" aria-label="Main navigation">
          {onScrollToFight && <button type="button" onClick={() => { sounds.playClick(); onScrollToFight(); }}>Fight</button>}
          {onScrollToRankings && <button type="button" onClick={() => { sounds.playClick(); onScrollToRankings(); }}>Rankings</button>}
        </nav>
      )}
    </header>
  );
};
