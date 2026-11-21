'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { SiteStats } from '@/types/donation';
import { Dices, Calendar, Sparkles } from 'lucide-react';
import { sounds } from '@/lib/sounds';

interface HeroSectionProps {
  stats: SiteStats;
  onScrollToDonate: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ stats, onScrollToDonate }) => {
  const [reasonIdx, setReasonIdx] = useState(0);

  const reasons = [
    "Even a ₹1 donation prevents a gamer from crying in a corner while everyone else is already playing.",
    "My current laptop sounds like a Boeing 747 preparing for takeoff if I open 3 Chrome tabs.",
    "Rockstar took 12 years and the game is already out! If I don't play soon, my ghost will haunt Los Santos forever.",
    "You spend ₹40 on cold drinks that last 5 minutes. That same ₹40 funds 150 hours of Vice City.",
    "Do you really want me to watch some 14-year-old YouTuber scream through the ending in 480p?",
    "Skip one cutting tapri chai today. Fund one grand heist with Lucia & Jason tomorrow.",
    "I haven't felt pure unadulterated joy since the GTA San Andreas jetpack cheat code.",
    "1 UPI transaction = 1 slap to console scalpers worldwide."
  ];

  const handleNextReason = () => {
    sounds.playDiceRoll();
    setReasonIdx((prev) => (prev + 1) % reasons.length);
  };

  let currentTierText = "Can barely afford the power cord & 2 samosas";
  if (stats.totalRaised >= stats.targetAmount) {
    currentTierText = "ULTIMATE VICTORY! PS5 Pro + GTA VI Steelbook Pre-Order Unlocked!";
  } else if (stats.totalRaised >= 55000) {
    currentTierText = "PS5 Console Secured! Final stretch for the steelbook!";
  } else if (stats.totalRaised >= 25000) {
    currentTierText = "Halfway to Vice City! Smelling the ocean asphalt";
  } else if (stats.totalRaised >= 5000) {
    currentTierText = "Can afford a used DualSense controller for emotional support";
  } else if (stats.totalRaised >= 1000) {
    currentTierText = "HDMI cable & energy drink supply secured";
  }

  return (
    <section className="relative overflow-hidden pt-10 pb-8 sm:pt-16 sm:pb-12">
      {/* Cinematic Full-Bleed Background Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden opacity-30">
        <Image
          src="/gta6-hero.jpg"
          alt="GTA VI Lucia and Jason artwork"
          fill
          priority
          className="object-cover object-top filter brightness-90 contrast-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#090514]/70 via-[#090514]/85 to-[#090514]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
        {/* Campaign Header Label */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#fca47a] backdrop-blur-md mb-4">
          <Sparkles size={12} className="text-[#e86b97]" />
          <span>LEONIDA RESCUE PROTOCOL // 2026</span>
        </div>

        {/* Cinematic Main Title */}
        <h1 className="font-bebas text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tight leading-[0.95] text-[#fdfbf7]">
          HELP A BROTHER OUT
          <span className="block title-gradient mt-1">
            TO PLAY GTA VI
          </span>
        </h1>

        {/* Editorial Subtitle */}
        <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-[#a19bb5] leading-relaxed font-normal">
          Rockstar waited <strong className="text-[#fdfbf7] font-semibold">12+ years</strong>. My wallet has <strong className="text-[#fca47a] font-semibold">₹0.00</strong>.
          Contribute <strong className="text-[#e86b97] font-semibold">₹1, ₹100, or any custom amount</strong> via UPI to save a fellow gamer from experiencing Vice City through 480p YouTube playthroughs.
        </p>

        {/* EDITORIAL IN-GAME DIALOGUE (REPLACING THE CARTOON BUBBLE) */}
        <div className="mx-auto mt-6 max-w-xl">
          <div className="relative rounded-2xl border border-white/[0.08] bg-[#120b22]/70 p-4 text-left backdrop-blur-xl shadow-lg transition-all hover:border-white/[0.15]">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 text-[10px] font-bold uppercase tracking-wider text-[#a19bb5]">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#fca47a]" />
                <span>Vice City Dispatch #{reasonIdx + 1}</span>
              </div>
              <button
                onClick={handleNextReason}
                className="inline-flex items-center gap-1.5 text-[#fca47a] hover:text-[#fdfbf7] transition-colors font-medium active:scale-95"
              >
                <Dices size={13} />
                <span>Next Reason</span>
              </button>
            </div>
            <p className="mt-2.5 text-xs sm:text-sm text-[#fdfbf7] italic leading-relaxed">
              &ldquo;{reasons[reasonIdx]}&rdquo;
            </p>
          </div>
        </div>

        {/* REFINED FUNDRAISING PROGRESS */}
        <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-white/[0.08] bg-[#120b22]/85 p-5 text-left backdrop-blur-xl shadow-xl">
          {/* Header row: Raised, Target, Deadline */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#a19bb5] block">
                Total Raised
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-bebas text-3xl sm:text-4xl font-extrabold text-[#fdfbf7] tracking-wide">
                  ₹{stats.totalRaised.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-medium text-[#a19bb5]">
                  of ₹{stats.targetAmount.toLocaleString('en-IN')} target
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-right flex items-center gap-1.5">
                <Calendar size={12} className="text-[#fca47a]" />
                <span className="text-[11px] font-semibold text-[#fca47a]">
                  Deadline: Nov 30
                </span>
              </div>
              <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-right">
                <span className="text-[11px] font-semibold text-[#fdfbf7]">
                  {stats.totalDonors} Backers
                </span>
              </div>
            </div>
          </div>

          {/* Minimalist Progress Indicator */}
          <div className="mt-3.5">
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/[0.06] p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#e86b97] via-[#fca47a] to-[#c084fc] transition-all duration-700 ease-out shadow-[0_0_12px_rgba(232,107,151,0.5)]"
                style={{ width: `${Math.max(3, Math.min(100, stats.percentComplete))}%` }}
              />
            </div>
          </div>

          {/* Tier and Remaining summary */}
          <div className="mt-2.5 flex items-center justify-between text-xs text-[#a19bb5]">
            <span className="font-medium text-[#fca47a] truncate max-w-[70%]">
              {currentTierText}
            </span>
            <span className="font-semibold text-[#fdfbf7] shrink-0">
              {stats.percentComplete}% ({stats.remainingAmount > 0 ? `₹${stats.remainingAmount.toLocaleString('en-IN')} to go` : 'Goal Reached!'})
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
