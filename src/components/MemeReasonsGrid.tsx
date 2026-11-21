'use client';

import React from 'react';
import { sounds } from '@/lib/sounds';

export const MemeReasonsGrid: React.FC = () => {
  const cards = [
    {
      title: "12 Years in Exile",
      tagline: "2013 to 2026",
      body: "GTA V dropped when I was doing school homework. I now have back pain, taxes, and no console. Have mercy on an aging gamer.",
      tag: "Timeline",
    },
    {
      title: "Prehistoric Hardware",
      tagline: "Thermal Warning",
      body: "My laptop runs on Intel integrated graphics. It sounds like an Apache attack helicopter whenever three Chrome tabs open.",
      tag: "Hardware",
    },
    {
      title: "The 480p Trauma",
      tagline: "A Fate Worse Than Death",
      body: "Without a console, I will be forced to watch screaming 14-year-olds with clickbait thumbnails spoil the entire campaign.",
      tag: "Deterrence",
    },
    {
      title: "Unrivaled ROI",
      tagline: "Asset Valuation",
      body: "₹10 on tapri chai evaporates in 10 minutes. ₹10 donated here produces 150+ hours of chaos across Leonida alongside Lucia & Jason.",
      tag: "Economics",
    },
  ];

  return (
    <section className="relative px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#fca47a] block">
            Campaign Dossier // Intel
          </span>
          <h2 className="mt-1 font-bebas text-3xl sm:text-4xl uppercase tracking-wider text-[#fdfbf7]">
            THE CASE FOR SPONSORSHIP
          </h2>
          <p className="mt-1 text-xs text-[#a19bb5] max-w-lg mx-auto">
            A sober assessment of why this mission cannot afford to fail.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((c, idx) => (
            <div
              key={idx}
              onClick={() => sounds.playCoin()}
              className="cursor-pointer rounded-2xl border border-white/[0.08] bg-[#120b22]/70 p-5 backdrop-blur-xl transition-all hover:border-white/[0.18] hover:bg-[#160e29]/90 group"
            >
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#a19bb5]">
                <span>{c.tag}</span>
                <span className="text-[#fca47a]">{c.tagline}</span>
              </div>
              <h3 className="mt-2.5 font-bebas text-2xl font-bold uppercase tracking-wide text-[#fdfbf7] group-hover:text-[#fca47a] transition-colors">
                {c.title}
              </h3>
              <p className="mt-1 text-xs text-[#a19bb5] leading-relaxed">
                {c.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
