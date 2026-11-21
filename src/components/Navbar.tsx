'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX, Settings, Star, Flame, Trophy } from 'lucide-react';
import { sounds } from '@/lib/sounds';
import { SiteStats } from '@/types/donation';

interface NavbarProps {
  stats: SiteStats;
  onOpenSettings: () => void;
  onOpenHallOfFame?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ stats, onOpenSettings, onOpenHallOfFame }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    sounds.enabled = nextState;
    if (nextState) {
      sounds.playClick();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-pink-500/20 bg-[#090414]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-bebas text-3xl sm:text-4xl font-extrabold tracking-wider gta6-gradient">
              GTA VI
            </span>
            <div className="hidden xs:flex flex-col -space-y-1">
              <span className="font-bebas text-xs tracking-widest text-cyan-400 font-bold uppercase">
                Vice City Fund
              </span>
              <span className="font-sans text-[10px] text-pink-400 font-medium">
                Save a Brother
              </span>
            </div>
          </div>

          {/* Wanted Level Stars */}
          <div className="hidden sm:flex items-center gap-1 rounded-full border border-pink-500/30 bg-purple-950/40 px-2.5 py-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Wanted</span>
            {[1, 2, 3, 4, 5].map((starNum) => {
              const isActive = starNum <= stats.wantedLevel;
              return (
                <Star
                  key={starNum}
                  size={14}
                  className={`transition-all duration-300 ${
                    isActive
                      ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                      : 'text-slate-700 fill-slate-800'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Live Progress Pill & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Progress Pill */}
          <div className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/30 px-3 py-1 text-xs">
            <Flame size={14} className="text-pink-500 animate-pulse" />
            <span className="font-sans font-semibold text-slate-200">
              ₹{stats.totalRaised.toLocaleString('en-IN')}
            </span>
            <span className="text-slate-400 hidden md:inline">
              / ₹{stats.targetAmount.toLocaleString('en-IN')}
            </span>
            <span className="rounded-full bg-pink-500/20 px-1.5 py-0.5 text-[10px] font-bold text-pink-400">
              {stats.percentComplete}%
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            aria-label={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
            title={soundEnabled ? 'Sound is ON' : 'Sound is MUTED'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-purple-500/30 bg-purple-950/40 text-slate-300 transition-colors hover:border-pink-500 hover:text-pink-400"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-slate-500" />}
          </button>

          {/* Hall of Fame Shortcut */}
          {onOpenHallOfFame && (
            <button
              onClick={onOpenHallOfFame}
              title="Hall of Legends"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-950/30 px-2.5 py-1.5 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-900/40"
            >
              <Trophy size={14} />
              <span>Legends</span>
            </button>
          )}

          {/* UPI Settings / Config */}
          <button
            onClick={onOpenSettings}
            aria-label="UPI Settings"
            title="Configure UPI ID & QR Code"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-slate-300 transition-colors hover:border-cyan-400 hover:text-cyan-300"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
