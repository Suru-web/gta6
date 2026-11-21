'use client';

import React, { useState } from 'react';
import { SITE_CONFIG } from '@/config/site';
import { Dices, Sparkles, MessageCircleHeart, HeartCrack } from 'lucide-react';
import { sounds } from '@/lib/sounds';

interface BeggarMemeBoxProps {
  onScrollToDonate: () => void;
}

export const BeggarMemeBox: React.FC<BeggarMemeBoxProps> = ({ onScrollToDonate }) => {
  const [currentReasonIdx, setCurrentReasonIdx] = useState(0);
  const [activeMemeIdx, setActiveMemeIdx] = useState(0);

  const memes = [
    {
      title: "PLEASE BROTHER 🥺",
      caption: "Me looking at you through the screen with teary cat eyes",
      dialogue: "Bro please, just ₹1 to ₹100. It's less than one tapri chai, but it's one giant leap for gamerkind.",
      badge: "Desperation Level: 9000",
      icon: "🥺",
      imgColor: "from-pink-500/20 to-purple-500/20"
    },
    {
      title: "THE HARD TRUTH ☕",
      caption: "Your Daily Life vs My Lifelong Dream",
      dialogue: "You spend ₹40 on cold drinks that last 5 minutes. If you give that to me, it lasts 150 hours of Vice City story mode!",
      badge: "Financial Advice",
      icon: "🧠",
      imgColor: "from-cyan-500/20 to-blue-500/20"
    },
    {
      title: "BERNIE WAS RIGHT 🧤",
      caption: "I am once again asking for your UPI support",
      dialogue: "Rockstar dropped the trailer 2 years ago and I still haven't bought the console. Have mercy on a struggling gamer.",
      badge: "Historic Moment",
      icon: "📜",
      imgColor: "from-amber-500/20 to-rose-500/20"
    },
    {
      title: "GIGACHAD LAW 👑",
      caption: "Real Chads Support Gamers in Need",
      dialogue: "A true homie never leaves another homie behind on launch day. Donate ₹10 and walk away like a king.",
      badge: "Honor Code",
      icon: "👑",
      imgColor: "from-purple-500/20 to-pink-500/20"
    }
  ];

  const handleNextReason = () => {
    sounds.playDiceRoll();
    setCurrentReasonIdx((prev) => (prev + 1) % SITE_CONFIG.beggingReasons.length);
  };

  return (
    <section id="beggar-vault" className="relative py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-purple-950/40 px-3.5 py-1 text-xs font-semibold text-pink-300">
            <HeartCrack size={14} className="text-rose-400" />
            <span>THE HUMBLE MEME VAULT</span>
          </div>
          <h2 className="mt-2 font-bebas text-4xl sm:text-6xl uppercase tracking-wider text-white">
            PLEASE... I&apos;M ON MY BENDED KNEES 🥺
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm sm:text-base text-slate-300">
            Rockstar took 12 years. If I miss this launch, my gaming soul will be lost forever. Here are the unadulterated facts:
          </p>
        </div>

        {/* Interactive Meme Tab Slider */}
        <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {memes.map((m, idx) => {
            const isSelected = activeMemeIdx === idx;
            return (
              <button
                key={idx}
                onClick={() => {
                  sounds.playClick();
                  setActiveMemeIdx(idx);
                }}
                className={`rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? 'border-pink-500 bg-purple-900/60 shadow-[0_0_15px_rgba(255,0,127,0.3)] scale-[1.02]'
                    : 'border-purple-500/20 bg-[#120826]/60 hover:border-pink-500/40 text-slate-400'
                }`}
              >
                <div className="text-2xl mb-1">{m.icon}</div>
                <div className={`font-bebas text-base uppercase font-bold tracking-wide ${isSelected ? 'text-pink-300' : 'text-slate-200'}`}>
                  {m.title}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-1">{m.caption}</div>
              </button>
            );
          })}
        </div>

        {/* Selected Meme Display Card */}
        <div className="mt-4 rounded-2xl border border-pink-500/30 bg-[#150a2e]/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1 space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/20 px-3 py-0.5 text-xs font-semibold text-pink-300">
                <Sparkles size={12} className="text-amber-400" />
                {memes[activeMemeIdx].badge}
              </div>
              <h3 className="font-bebas text-3xl sm:text-4xl text-white tracking-wide">
                &ldquo;{memes[activeMemeIdx].dialogue}&rdquo;
              </h3>
              <p className="text-sm text-slate-300 italic">
                - Message from the founder, chief beggar & aspiring Vice City criminal
              </p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => {
                  sounds.playClick();
                  onScrollToDonate();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-pink-600 hover:bg-pink-500 px-6 py-3 font-sans text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(255,0,127,0.4)] transition-all active:scale-95"
              >
                <MessageCircleHeart size={18} />
                <span>Fine, Take My ₹1 - ₹100</span>
              </button>
              <span className="text-[11px] text-slate-400">
                100% of funds go strictly to PS5 + GTA 6
              </span>
            </div>
          </div>
        </div>

        {/* DESPERATE REASON GENERATOR */}
        <div className="mt-8 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-purple-950/60 to-cyan-950/40 p-5 sm:p-6 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                Desperate Reason #{currentReasonIdx + 1} of {SITE_CONFIG.beggingReasons.length}
              </span>
              <p className="text-sm sm:text-base font-medium text-slate-200">
                &ldquo;{SITE_CONFIG.beggingReasons[currentReasonIdx]}&rdquo;
              </p>
            </div>

            <button
              onClick={handleNextReason}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-900/30 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-cyan-300 hover:bg-cyan-800/40 transition-all active:scale-95 shadow-sm"
            >
              <Dices size={16} className="text-cyan-400" />
              <span>Next Reason 🎲</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
