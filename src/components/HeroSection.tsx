'use client';

import React from 'react';
import { SiteStats } from '@/types/donation';
import { SITE_CONFIG } from '@/config/site';
import { Gamepad2, Sparkles, ChevronDown, CheckCircle2, HeartHandshake } from 'lucide-react';
import { sounds } from '@/lib/sounds';

interface HeroSectionProps {
  stats: SiteStats;
  onScrollToDonate: () => void;
  onScrollToMemes: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  stats,
  onScrollToDonate,
  onScrollToMemes,
}) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-20">
      {/* Background Palm Tree SVGs and Ambient Neon Glows */}
      <div className="pointer-events-none absolute -left-16 top-0 h-96 w-96 rounded-full bg-pink-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -right-16 top-10 h-96 w-96 rounded-full bg-cyan-600/15 blur-[120px]" />

      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
        {/* Vice City Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-950/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-pink-300 backdrop-blur-md mb-6 shadow-[0_0_20px_rgba(255,0,127,0.2)]">
          <Sparkles size={14} className="text-amber-400" />
          <span>VICE CITY EMERGENCY MISSION #69</span>
          <Sparkles size={14} className="text-amber-400" />
        </div>

        {/* Main Title */}
        <h1 className="font-bebas text-5xl tracking-wide uppercase sm:text-7xl lg:text-8xl leading-none">
          <span className="block text-slate-100 drop-shadow-md">HELP A BROTHER OUT</span>
          <span className="block gta6-gradient neon-glow-pink font-extrabold mt-1 sm:mt-2">
            TO PLAY GTA 6
          </span>
        </h1>

        {/* Tagline */}
        <p className="mx-auto mt-6 max-w-2xl text-base text-slate-300 sm:text-lg leading-relaxed">
          Rockstar made us wait <strong className="text-pink-400 font-bold">12+ years</strong>.
          Lucia and Jason are waiting in Vice City. My current bank balance is{' '}
          <strong className="text-cyan-300 font-bold">₹0.00</strong>.
          Spare anywhere from <strong className="text-amber-400 font-bold">₹1 to ₹100</strong> to rescue a brother from watching 480p YouTube playthroughs on launch day!
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => {
              sounds.playClick();
              onScrollToDonate();
            }}
            className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 px-6 py-3.5 font-sans text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_25px_rgba(255,0,127,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_35px_rgba(255,0,127,0.6)] active:scale-95"
          >
            <Gamepad2 size={18} className="transition-transform group-hover:rotate-12" />
            <span>Fund the Mission (₹1 - ₹100)</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onScrollToMemes();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-950/30 px-6 py-3.5 font-sans text-sm font-bold uppercase tracking-wider text-cyan-300 backdrop-blur-md transition-all hover:border-cyan-400 hover:bg-cyan-900/40 active:scale-95"
          >
            <HeartHandshake size={18} className="text-pink-400" />
            <span>Beggar Meme Vault 🥺</span>
          </button>
        </div>

        {/* THE MISSION PROGRESS BAR CARD */}
        <div className="mt-12 rounded-2xl border border-pink-500/30 bg-[#12082b]/80 p-5 sm:p-8 backdrop-blur-xl shadow-[0_0_30px_rgba(18,8,43,0.8)] text-left">
          {/* Progress Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-purple-500/20 pb-4">
            <div>
              <span className="font-bebas text-xs tracking-widest text-pink-400 uppercase font-bold">
                Operation: Console Recovery
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-bebas text-3xl sm:text-4xl font-bold text-white tracking-wider">
                  ₹{stats.totalRaised.toLocaleString('en-IN')}
                </span>
                <span className="text-sm font-medium text-slate-400">
                  raised of ₹{stats.targetAmount.toLocaleString('en-IN')} goal
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-cyan-400/30 bg-cyan-950/40 px-3.5 py-1.5 text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Remaining</span>
                <span className="font-bebas text-xl text-cyan-300 font-bold">
                  ₹{stats.remainingAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="rounded-xl border border-pink-400/30 bg-pink-950/40 px-3.5 py-1.5 text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Donors</span>
                <span className="font-bebas text-xl text-pink-400 font-bold">
                  {stats.totalDonors} Legends
                </span>
              </div>
            </div>
          </div>

          {/* Animated Bar */}
          <div className="mt-6">
            <div className="relative h-6 w-full overflow-hidden rounded-full border border-pink-500/30 bg-purple-950/60 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,0,127,0.6)]"
                style={{ width: `${Math.max(4, Math.min(100, stats.percentComplete))}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center font-sans text-xs font-black text-white drop-shadow">
                {stats.percentComplete}% COMPLETE
              </span>
            </div>
          </div>

          {/* Milestones Grid */}
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5 text-xs">
            {SITE_CONFIG.milestones.map((m, idx) => {
              const isPassed = stats.totalRaised >= m.amount;
              return (
                <div
                  key={idx}
                  className={`rounded-lg border p-2.5 transition-colors ${
                    isPassed
                      ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
                      : 'border-purple-500/20 bg-purple-950/20 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold">
                    {isPassed ? (
                      <CheckCircle2 size={13} className="text-emerald-400" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                    )}
                    <span>₹{m.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <p className="mt-1 font-medium truncate text-slate-200 text-[11px]">{m.title}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => {
              sounds.playClick();
              onScrollToDonate();
            }}
            className="flex flex-col items-center text-xs text-slate-400 hover:text-pink-400 transition-colors"
          >
            <span className="font-bebas tracking-wider text-sm">SELECT AMOUNT & SCAN UPI</span>
            <ChevronDown size={18} className="animate-bounce mt-1 text-pink-400" />
          </button>
        </div>
      </div>
    </section>
  );
};
