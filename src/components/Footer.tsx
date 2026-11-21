'use client';

import React from 'react';
import { Sparkles, Heart, ArrowUp, ShieldAlert } from 'lucide-react';
import { sounds } from '@/lib/sounds';

interface FooterProps {
  onScrollToTop: () => void;
  onOpenSettings: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onScrollToTop, onOpenSettings }) => {
  return (
    <footer className="relative mt-20 border-t border-pink-500/20 bg-[#06020d] py-12 text-slate-400">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Tagline */}
          <div className="text-center md:text-left space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-bebas text-3xl font-bold tracking-wider gta6-gradient">
                GTA VI
              </span>
              <span className="font-sans text-xs font-bold text-cyan-400 uppercase tracking-widest">
                Vice City Fund
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-md">
              Helping a fellow gamer achieve digital salvation since 2026. Target: ₹69,900 for PS5 Pro + GTA VI.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSettings}
              className="rounded-xl border border-purple-500/30 bg-purple-950/30 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-pink-500 hover:text-pink-300 transition-colors"
            >
              Configure UPI / QR
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                onScrollToTop();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-pink-500/40 bg-pink-950/40 px-3.5 py-2 text-xs font-semibold text-pink-300 hover:bg-pink-900/60 transition-colors"
            >
              <ArrowUp size={14} />
              <span>Back to Top</span>
            </button>
          </div>
        </div>

        {/* Satirical Disclaimer Box */}
        <div className="mt-8 rounded-2xl border border-purple-500/20 bg-purple-950/20 p-4 text-center md:text-left text-[11px] text-slate-500 flex flex-col md:flex-row items-center gap-3">
          <ShieldAlert size={18} className="text-pink-500 shrink-0" />
          <p>
            <strong className="text-slate-400">LEGAL & ETHICAL SATIRE DISCLAIMER:</strong> This website is an independent community crowdfund created with utmost humor and love for gaming. It is not affiliated, endorsed, or sponsored by Rockstar Games, Take-Two Interactive, or Sony Interactive Entertainment. All trademarks, characters, and references belong to their respective owners. Every rupee donated is voluntarily given by legends who understand the struggle.
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between border-t border-purple-500/10 pt-6 text-[11px] text-slate-500 gap-2">
          <span>Made with pure Vice City neon energy & ❤️</span>
          <span>Deployable on Vercel with 1-click persistence</span>
        </div>
      </div>
    </footer>
  );
};
