'use client';

import React from 'react';
import { Sparkles, Heart, ArrowUp, ShieldAlert } from 'lucide-react';
import { sounds } from '@/lib/sounds';

interface FooterProps {
  onScrollToTop: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onScrollToTop }) => {
  return (
    <footer className="relative mt-16 border-t border-[#e86b97]/30 bg-[#0d071a] py-10 text-slate-400">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Tagline */}
          <div className="text-center md:text-left space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-bebas text-3xl font-bold tracking-wider gta-gradient">
                GTA VI
              </span>
              <span className="font-sans text-xs font-bold text-[#fca47a] uppercase tracking-widest">
                Leonida Fund
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Helping a fellow gamer achieve salvation since 2026. Target: ₹69,900 for PS5 Pro + GTA VI.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sounds.playClick();
                onScrollToTop();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#fca47a]/40 bg-[#fca47a]/10 px-3.5 py-2 text-xs font-bold text-[#fca47a] hover:bg-[#fca47a] hover:text-black transition-colors"
            >
              <ArrowUp size={14} />
              <span>Back to Top</span>
            </button>
          </div>
        </div>

        {/* Satirical Disclaimer Box */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-[#1c1233]/60 p-4 text-center md:text-left text-[11px] text-slate-400 flex flex-col md:flex-row items-center gap-3">
          <ShieldAlert size={18} className="text-[#e86b97] shrink-0" />
          <p>
            <strong className="text-slate-300">LEGAL & ETHICAL SATIRE DISCLAIMER:</strong> This website is an independent community crowdfund created with humor and love for gaming. Not affiliated with Rockstar Games, Take-Two Interactive, or Sony Interactive Entertainment. All trademarks, characters (Lucia, Jason), and artwork belong to Rockstar Games.
          </p>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between border-t border-white/5 pt-5 text-[11px] text-slate-500 gap-2">
          <span>Official Vice City Sunset Theme • Lucia & Jason Approved 🌴</span>
          <div className="flex items-center gap-3">
            <a
              href="https://buymeacoffee.com/anonymous9909"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#ffdd00] hover:underline transition-colors"
            >
              ☕ Buy Me a Coffee
            </a>
            <span>•</span>
            <a href="/admin" className="text-slate-500 hover:text-[#fca47a] transition-colors">
              Admin Portal
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
