'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { SiteStats } from '@/types/donation';
import { Dices } from 'lucide-react';
import { sounds } from '@/lib/sounds';

interface HeroSectionProps {
  stats: SiteStats;
  onScrollToDonate: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ stats, onScrollToDonate }) => {
  const [reasonIdx, setReasonIdx] = useState(0);

  const reasons = [
    "Bro please, even a ₹1 donation prevents a gamer from crying in a corner on launch day. 🥺🙏",
    "My current laptop sounds like a Boeing 747 preparing for takeoff if I open 3 Chrome tabs. 💻🔥",
    "Rockstar took 12 years. If I don't play on day one, my ghost will haunt Los Santos forever. 👻",
    "You spend ₹40 on cold drinks that last 5 mins. Give that to me and it lasts 150 hours of Vice City! 🥤",
    "Do you really want me to watch some 14-year-old on YouTube play the whole story mode with screaming facecam? 📺",
    "Skip one cutting tapri chai today. Fund one grand heist with Lucia & Jason tomorrow. ☕🚲",
    "I haven't felt pure unadulterated joy since the GTA San Andreas jetpack cheat code. 🚀",
    "1 UPI transaction = 1 slap to console scalpers worldwide. 💸"
  ];

  const handleNextReason = () => {
    sounds.playCoin();
    setReasonIdx((prev) => (prev + 1) % reasons.length);
  };

  let currentTierText = "Tier 0: Can barely afford the power cable & 2 samosas 😭";
  if (stats.totalRaised >= stats.targetAmount) {
    currentTierText = "🏆 ULTIMATE VICTORY! PS5 PRO + GTA 6 SECURED! RESPECT 99999!";
  } else if (stats.totalRaised >= 55000) {
    currentTierText = "🔥 Tier 4: PS5 console secured! Just need the game steelbook!";
  } else if (stats.totalRaised >= 25000) {
    currentTierText = "🏖️ Tier 3: Halfway to Vice City! Smelling the ocean breeze!";
  } else if (stats.totalRaised >= 5000) {
    currentTierText = "🎮 Tier 2: Can buy a used DualSense controller for emotional support!";
  } else if (stats.totalRaised >= 1000) {
    currentTierText = "⚡ Tier 1: HDMI cable + 4 Red Bulls in the bag!";
  }

  return (
    <section className="relative px-4 pt-4 pb-2 sm:pt-6 overflow-hidden">
      {/* Official GTA VI Artwork Backdrop */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden opacity-35">
        <Image
          src="/gta6-hero.jpg"
          alt="GTA 6 Lucia and Jason"
          fill
          priority
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#110b20]/60 via-[#110b20]/80 to-[#110b20]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Main Title */}
        <h1 className="font-bebas text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-wide leading-none">
          <span className="text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">HELP A BROTHER OUT</span>
          <span className="block gta-gradient mt-0.5 sm:mt-1 drop-shadow-[0_2px_16px_rgba(232,107,151,0.5)]">
            TO PLAY GTA 6 🌴
          </span>
        </h1>

        {/* Tagline */}
        <p className="mx-auto mt-2 max-w-2xl text-xs sm:text-sm font-medium text-slate-200 drop-shadow">
          Rockstar waited <strong className="text-[#fca47a] font-bold">12+ years</strong>. My wallet has <strong className="text-[#ffb703] font-bold">₹0.00</strong>.
          Spare <strong className="text-[#e86b97] font-bold">₹1, ₹100, or any custom amount</strong> via UPI to save a fellow gamer from watching 480p YouTube walkthroughs!
        </p>

        {/* HILARIOUS BEGGING MASCOT SPEECH BUBBLE */}
        <div className="mx-auto mt-3 max-w-xl">
          <div className="relative rounded-2xl border-2 border-[#fca47a] bg-[#1c1233]/90 p-3 sm:p-3.5 text-left brutal-shadow-peach backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl shrink-0 select-none animate-bounce">
                🥺
              </span>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-[#fca47a] px-2 py-0.5 text-[9px] font-black uppercase text-black">
                    Desperate Plea #{reasonIdx + 1}
                  </span>
                  <button
                    onClick={handleNextReason}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#fca47a] hover:text-white transition-colors"
                  >
                    <Dices size={13} />
                    <span>Next Excuse 🎲</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-100 italic">
                  &ldquo;{reasons[reasonIdx]}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CHUNKY RETRO PROGRESS BAR */}
        <div className="mx-auto mt-3 max-w-2xl rounded-2xl border-2 border-[#e86b97] bg-[#1c1233]/95 p-3 sm:p-4 brutal-shadow-rose text-left backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-bebas text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
                ₹{stats.totalRaised.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                raised of ₹{stats.targetAmount.toLocaleString('en-IN')} goal
              </span>
            </div>

            <div className="rounded-xl border border-[#fca47a]/40 bg-[#251842] px-2.5 py-0.5 text-right">
              <span className="font-bebas text-base sm:text-lg font-bold text-[#fca47a]">
                {stats.totalDonors} Legends
              </span>
            </div>
          </div>

          {/* Bar */}
          <div className="relative mt-2 h-5 w-full overflow-hidden rounded-full border-2 border-white/20 bg-black/60 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#e86b97] via-[#fca47a] to-[#ffb703] transition-all duration-700"
              style={{ width: `${Math.max(4, Math.min(100, stats.percentComplete))}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center font-sans text-[11px] font-black text-white drop-shadow">
              {stats.percentComplete}% FUNDED
            </span>
          </div>

          {/* Funny Tier Status */}
          <div className="mt-1.5 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-[#fca47a]">
              {currentTierText}
            </span>
            <span className="text-slate-400 hidden sm:inline">
              ₹{stats.remainingAmount.toLocaleString('en-IN')} to go
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
