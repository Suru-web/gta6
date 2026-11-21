'use client';

import React from 'react';
import { sounds } from '@/lib/sounds';

export const MemeReasonsGrid: React.FC = () => {
  const cards = [
    {
      title: "12 YEARS OF WAITING ⏳",
      subtitle: "My Youth Is Fading",
      body: "GTA V launched in 2013. I was a child. I now have back pain, taxes, and zero console. Have mercy.",
      badge: "Pure Pain",
      border: "border-pink-500",
      shadow: "brutal-shadow-pink",
      icon: "⏳",
    },
    {
      title: "MY CURRENT LAPTOP 💻🔥",
      subtitle: "Pre-Historic Relic",
      body: "Intel Integrated Graphics. It sounds like an Apache attack helicopter if I open 3 tabs of Chrome.",
      badge: "Fire Hazard",
      border: "border-yellow-400",
      shadow: "brutal-shadow-yellow",
      icon: "🔥",
    },
    {
      title: "THE 480P TRAUMA 📺",
      subtitle: "Fate Worse Than Death",
      body: "If you don't donate, I'll be forced to watch some screaming 14-year-old YouTuber spoil the whole story.",
      badge: "Emergency",
      border: "border-cyan-400",
      shadow: "brutal-shadow-cyan",
      icon: "📺",
    },
    {
      title: "PEAK FINANCIAL ROI 📈",
      subtitle: "Warren Buffett Approved",
      body: "₹10 on chai = lasts 10 minutes. ₹10 donated to my GTA 6 fund = 150 hours of chaos in Vice City.",
      badge: "1000% Gain",
      border: "border-purple-400",
      shadow: "brutal-shadow-white",
      icon: "📈",
    },
  ];

  return (
    <section className="relative px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-6">
          <span className="rounded-md bg-yellow-400 px-3 py-1 font-sans text-xs font-black uppercase text-black tracking-wider">
            WHY YOUR ₹1 TO ₹100 MATTERS
          </span>
          <h2 className="mt-2 font-bebas text-3xl sm:text-5xl uppercase tracking-wider text-white">
            THE HARD COLD GAMER FACTS
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((c, idx) => (
            <div
              key={idx}
              onClick={() => sounds.playCoin()}
              className={`cursor-pointer rounded-2xl border-2 ${c.border} bg-[#140b2b] p-5 ${c.shadow} transition-transform hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl">{c.icon}</span>
                <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase text-pink-300">
                  {c.badge}
                </span>
              </div>
              <h3 className="mt-3 font-bebas text-2xl font-bold uppercase tracking-wide text-white">
                {c.title}
              </h3>
              <p className="mt-1 text-xs font-medium text-slate-300 leading-relaxed">
                {c.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
