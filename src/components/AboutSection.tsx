'use client';

import React from 'react';
import { Gamepad2, HeartHandshake, ShieldCheck, Terminal } from 'lucide-react';

export const AboutSection: React.FC<{ showSideQuest?: boolean }> = ({ showSideQuest = true }) => {
  return (
    <section id="about-section" className="relative px-4 py-12 sm:py-16">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-3xl border border-white/[0.08] bg-[#120b22]/90 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl">
          
          <div className="text-center mb-8">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#fca47a] bg-[#fca47a]/10 border border-[#fca47a]/20 px-3 py-1 rounded-full">
              ABOUT THE PROJECT
            </span>
            <h2 className="mt-2 font-bebas text-4xl sm:text-5xl text-white tracking-wider">
              {showSideQuest ? 'GTA LEGENDS ARENA & THE ₹1 SOCIAL EXPERIMENT' : 'GTA LEGENDS ARENA'}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#a19bb5] font-mono max-w-xl mx-auto">
              {showSideQuest ? 'How a meme experiment turned into an arcade fighting showdown and community fundraiser.' : 'A fan-made arcade fighting showdown across the GTA universe.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs text-[#a19bb5] leading-relaxed">
            
            {/* 1. The Fighting Game */}
            <div className="rounded-2xl border border-white/5 bg-black/40 p-5 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Gamepad2 size={16} className="text-[#fca47a]" />
                <span>The Fighting Engine</span>
              </div>
              <p>
                GTA Legends Arena is a fully playable browser-based 2D fighting game. 14 legendary GTA protagonists from Claude and Tommy Vercetti all the way to Lucia and Jason battle across iconic arenas with working hit detection, blocking, grabs, super combos, and state-machine CPU opponents.
              </p>
              <p>
                Every completed match is cryptographically signed and aggregated via our cloud database to answer the eternal question: <em>Who is truly the strongest GTA character?</em>
              </p>
            </div>

            {/* 2. The Side Quest Social Experiment */}
            {showSideQuest && <div className="rounded-2xl border border-white/5 bg-black/40 p-5 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <HeartHandshake size={16} className="text-yellow-400" />
                <span>The ₹1 / $1 Side Quest</span>
              </div>
              <p>
                Rockstar Games took 12+ years to announce GTA VI. Meanwhile, gaming hardware is expensive. Instead of accepting defeat, we launched a satirical crowdsourced campaign: <em>Can the internet buy a gamer GTA VI for ₹1?</em>
              </p>
              <p>
                Contributors from India (via instant UPI QR) and international backers (via Buy Me a Coffee) can immortalize their name on the live Wall of Legends and hear the victory fanfare.
              </p>
            </div>}

            {/* 3. Fair Play & Data Integrity */}
            <div className="rounded-2xl border border-white/5 bg-black/40 p-5 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>Data Integrity & Rankings</span>
              </div>
              <p>
                The global leaderboard only records matches that finish both rounds. Abandoned matches or repeated automated requests are rejected by our serverless validation layer. No artificial starter data is used.
              </p>
            </div>

            {/* 4. Cheat Codes & Easter Eggs */}
            <div className="rounded-2xl border border-white/5 bg-black/40 p-5 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Terminal size={16} className="text-cyan-400" />
                <span>Leonida Developer Terminal</span>
              </div>
              <p>
                Fans of classic Rockstar PC cheat codes (HESOYAM, BAGUVIX, SEAWAYS, WASTED, RESPECT) can enter them in the developer terminal below to trigger original audio sound effects, retro HUD popups, and satirical GTA reality checks.
              </p>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center font-mono text-[11px] text-[#6c637e]">
            A creative fan parody and community project. Grand Theft Auto and all related titles, logos, and characters are trademarks of Rockstar Games / Take-Two Interactive.
          </div>

        </div>
      </div>
    </section>
  );
};
