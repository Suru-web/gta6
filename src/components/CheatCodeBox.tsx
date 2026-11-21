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
    <section className="relative py-6 sm:py-8">
      <div className="mx-auto max-w-3xl px-4">
        <div className="rounded-2xl border border-white/[0.08] bg-[#120b22]/70 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-2">
            <Terminal size={15} className="text-[#fca47a]" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#fca47a] font-bold">
              Leonida Developer Terminal
            </span>
          </div>

          <p className="text-xs text-[#a19bb5] mb-3">
            Enter classic Rockstar cheats (<code className="text-[#fdfbf7] bg-white/[0.06] px-1.5 py-0.5 rounded">HESOYAM</code>, <code className="text-[#fdfbf7] bg-white/[0.06] px-1.5 py-0.5 rounded">BAGUVIX</code>, <code className="text-[#fdfbf7] bg-white/[0.06] px-1.5 py-0.5 rounded">SEAWAYS</code>) for secret effects.
          </p>

          <form onSubmit={handleTestCheat} className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ENTER CODE (e.g. HESOYAM)"
              className="flex-1 rounded-xl border border-white/[0.1] bg-black/50 px-4 py-2 font-mono text-xs tracking-wider text-[#fdfbf7] placeholder-[#6c637e] focus:border-[#fca47a] focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl border border-white/[0.1] bg-[#fca47a] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#090514] hover:bg-[#ffb78e] transition-all"
            >
              Execute
            </button>
          </form>

          {activeMessage && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#e86b97]/40 bg-[#e86b97]/15 p-3 text-xs text-[#fdfbf7] animate-in fade-in">
              <Sparkles size={14} className="text-[#fca47a] shrink-0" />
              <span>{activeMessage}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
