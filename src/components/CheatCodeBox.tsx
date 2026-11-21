'use client';

import React, { useState } from 'react';
import { Terminal, Sparkles, CheckCircle2 } from 'lucide-react';
import { sounds } from '@/lib/sounds';
import confetti from 'canvas-confetti';
import { SITE_CONFIG } from '@/config/site';

export const CheatCodeBox: React.FC = () => {
  const [code, setCode] = useState('');
  const [activeMessage, setActiveMessage] = useState<string | null>(null);

  const handleTestCheat = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    const found = SITE_CONFIG.cheatCodes.find((c) => c.code === clean);

    if (found) {
      sounds.playCheatCode();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.8 },
      });
      setActiveMessage(`CHEAT ACTIVATED: ${found.effect} (Doesn't bypass real UPI though!)`);
      setCode('');
    } else {
      sounds.playClick();
      setActiveMessage(`CHEAT CODE NOT RECOGNIZED. Try HESOYAM, BAGUVIX, or SEAWAYS!`);
    }

    setTimeout(() => {
      setActiveMessage(null);
    }, 6000);
  };

  return (
    <section className="relative py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="rounded-2xl border border-cyan-500/30 bg-[#0c051a] p-5 sm:p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <Terminal size={16} className="text-cyan-400" />
            <span className="font-mono text-xs uppercase tracking-wider text-cyan-300 font-bold">
              Vice City Cheat Terminal
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-3">
            Type classic GTA cheats (<code className="text-pink-400">HESOYAM</code>, <code className="text-pink-400">BAGUVIX</code>, <code className="text-pink-400">SEAWAYS</code>, <code className="text-pink-400">LEAVEMEALONE</code>) for secret effects.
          </p>

          <form onSubmit={handleTestCheat} className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ENTER CHEAT (e.g. HESOYAM)"
              className="flex-1 rounded-xl border border-cyan-500/40 bg-black/50 px-4 py-2 font-mono text-sm tracking-wider text-cyan-300 placeholder-slate-600 focus:border-pink-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl border border-cyan-400/50 bg-cyan-950/60 px-5 py-2 text-xs font-bold uppercase tracking-wider text-cyan-300 hover:bg-cyan-900/60 transition-colors"
            >
              Execute
            </button>
          </form>

          {activeMessage && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-pink-500/40 bg-pink-950/50 p-3 text-xs text-pink-200 animate-in fade-in">
              <Sparkles size={14} className="text-amber-400 shrink-0" />
              <span>{activeMessage}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
