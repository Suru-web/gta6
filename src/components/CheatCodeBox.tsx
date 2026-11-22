'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, Sparkles, X, Volume2, Shield, Heart, 
  DollarSign, Star, Car, Skull, Trophy, Radio, 
  Flame, CheckCircle2, ChevronRight, Zap
} from 'lucide-react';
import { sounds } from '@/lib/sounds';
import confetti from 'canvas-confetti';
import { SITE_CONFIG } from '@/config/site';

interface CheatDefinition {
  code: string;
  aliases?: string[];
  title: string;
  effect: string;
  meme: string;
  type: string;
  sound: string;
  badge: string;
}

export const CheatCodeBox: React.FC = () => {
  const [code, setCode] = useState('');
  const [activeCheat, setActiveCheat] = useState<CheatDefinition | null>(null);
  const [logs, setLogs] = useState<string[]>([
    '> LEONIDA_KERNEL v4.20 initialized.',
    '> Memory patch engine ready.',
    '> Enter any classic GTA cheat or click a chip below.'
  ]);
  const overlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const quickCheats = [
    { code: 'HESOYAM', label: '💰 HESOYAM ($250k)' },
    { code: 'BAGUVIX', label: '🛡️ BAGUVIX (Godmode)' },
    { code: 'SEAWAYS', label: '🌊 SEAWAYS (Water Car)' },
    { code: 'LEAVEMEALONE', label: '⭐ 0 WANTED STARS' },
    { code: 'PANZER', label: '🚜 PANZER (Rhino Tank)' },
    { code: 'NUTTERTOOLS', label: '💣 NUTTERTOOLS (Weapons)' },
    { code: 'WASTED', label: '💀 WASTED' },
    { code: 'MISSIONPASSED', label: '🏆 MISSION PASSED' },
    { code: 'VERCETTI', label: '🌴 TOMMY VERCETTI' },
    { code: 'BIGSMOKE', label: '🍔 BIG SMOKE' },
  ];

  const triggerCheat = (cheatCodeStr: string) => {
    const clean = cheatCodeStr.trim().toUpperCase();
    if (!clean) return;

    // Match by code or alias
    const found = SITE_CONFIG.cheatCodes.find(
      (c) => c.code === clean || (c.aliases && c.aliases.includes(clean))
    ) as CheatDefinition | undefined;

    if (found) {
      // 1. Play authentic GTA cheat sound
      sounds.playCheatCode();

      // 2. Play secondary authentic sound based on cheat type
      if (found.type === 'hesoyam') {
        setTimeout(() => sounds.playCashRegister(), 220);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#fca47a', '#fbbf24']
        });
      } else if (found.type === 'stars') {
        setTimeout(() => sounds.playPoliceRadio(), 200);
      } else if (found.type === 'wasted') {
        sounds.playViceCityDeath();
      } else if (found.type === 'mission') {
        sounds.playViceCityMission();
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#fbbf24', '#f59e0b', '#e86b97', '#c084fc']
        });
      } else if (found.type === 'tommy') {
        setTimeout(() => sounds.playTommyVercetti(), 200);
      } else if (found.type === 'bigsmoke') {
        setTimeout(() => sounds.playBigSmoke(), 200);
      } else {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 }
        });
      }

      // 3. Set active cheat overlay
      setActiveCheat(found);
      setCode('');

      // 4. Update terminal logs
      setLogs((prev) => [
        ...prev.slice(-3),
        `> EXEC: "${clean}" matched -> ${found.badge}`,
        `> [ROCKSTAR_PATCH]: ${found.effect}`,
        `> [MEME_GATEWAY]: ${found.meme}`
      ]);

      // 5. Auto dismiss overlay after 8 seconds
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
      overlayTimerRef.current = setTimeout(() => {
        setActiveCheat(null);
      }, 8500);

    } else {
      sounds.playClick();
      setLogs((prev) => [
        ...prev.slice(-3),
        `> ERROR: Cheat "${clean}" not recognized in Vice City registry!`,
        `> HINT: Try HESOYAM, BAGUVIX, SEAWAYS, PANZER, or WASTED.`
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerCheat(code);
  };

  const handleDismiss = () => {
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    setActiveCheat(null);
  };

  const scrollToDonate = () => {
    handleDismiss();
    const el = document.getElementById('donate-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Close overlay on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeCheat) {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCheat]);

  return (
    <section className="relative py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4">
        {/* Terminal Card */}
        <div className="relative rounded-2xl border border-white/[0.1] bg-[#120b22]/85 p-5 sm:p-6 backdrop-blur-2xl shadow-2xl overflow-hidden">
          {/* Neon Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#fca47a] to-transparent opacity-80" />

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fca47a]/15 text-[#fca47a] border border-[#fca47a]/30">
                <Terminal size={15} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase tracking-wider text-[#fca47a] font-bold">
                    Leonida Developer Terminal
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE HOOKS
                  </span>
                </div>
                <p className="text-[11px] text-[#9e95b0]">
                  Enter classic GTA PC cheats or tap quick shortcuts for authentic Vice City audio & meme HUD.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#fca47a]/80 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.06]">
              <Volume2 size={13} />
              <span>SFX ACTIVE</span>
            </div>
          </div>

          {/* Quick Cheat Chips (Clickable) */}
          <div className="mb-4">
            <p className="text-[11px] uppercase tracking-wider text-[#6c637e] font-mono mb-2">
              ⚡ Quick Execute Chips (Tap to activate):
            </p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {quickCheats.map((qc) => (
                <button
                  key={qc.code}
                  type="button"
                  onClick={() => triggerCheat(qc.code)}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] hover:border-[#fca47a]/50 px-2.5 py-1.5 text-[11px] font-mono font-medium text-[#fdfbf7] transition-all hover:scale-105 active:scale-95"
                >
                  {qc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="TYPE CHEAT (e.g. HESOYAM, ASPIRINE, WASTED)..."
                className="w-full rounded-xl border border-white/[0.12] bg-black/60 px-4 py-2.5 font-mono text-xs sm:text-sm tracking-wider text-[#fdfbf7] placeholder-[#6c637e] focus:border-[#fca47a] focus:ring-1 focus:ring-[#fca47a] focus:outline-none transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#6c637e] pointer-events-none hidden sm:inline">
                PRESS ENTER
              </span>
            </div>
            <button
              type="submit"
              className="rounded-xl border border-white/[0.1] bg-gradient-to-r from-[#fca47a] to-[#e86b97] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#090514] hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#fca47a]/20 flex items-center gap-1.5 shrink-0"
            >
              <span>Execute</span>
              <ChevronRight size={14} />
            </button>
          </form>

          {/* Monospace Output Terminal Stream */}
          <div className="rounded-xl border border-white/[0.06] bg-black/80 p-3 sm:p-4 font-mono text-[11px] text-emerald-400/90 space-y-1 overflow-x-auto select-none">
            {logs.map((log, idx) => (
              <div 
                key={idx} 
                className={`transition-opacity ${idx === logs.length - 1 ? 'text-[#fca47a] font-semibold' : 'text-[#a19bb5]'}`}
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FULL-SCREEN AUTHENTIC GTA VICE CITY CHEAT ACTIVATED OVERLAY & MEME POPUP */}
      {/* ========================================================================= */}
      {activeCheat && (
        <div 
          className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-6 backdrop-blur-md transition-all duration-300 ${
            activeCheat.type === 'wasted' 
              ? 'bg-black/80 grayscale contrast-125' 
              : activeCheat.type === 'stars'
              ? 'bg-[#090514]/75 animate-police-siren'
              : activeCheat.type === 'hesoyam'
              ? 'bg-[#090514]/75 animate-money-glow'
              : 'bg-[#090514]/80'
          }`}
          onClick={handleDismiss}
        >
          {/* Top Authentic GTA HUD Banner */}
          <div 
            className="w-full max-w-2xl mt-2 sm:mt-6 animate-in slide-in-from-top-6 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative rounded-2xl border-2 border-[#fca47a] bg-[#120b22]/95 p-4 sm:p-5 shadow-[0_0_50px_rgba(252,164,122,0.4)] backdrop-blur-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[#fca47a] animate-pulse text-lg">★</span>
                  <span className="gta-hud-font text-2xl sm:text-3xl text-[#fca47a] tracking-widest font-black uppercase">
                    CHEAT ACTIVATED
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="rounded-full bg-white/10 p-1.5 text-white/70 hover:bg-white/20 hover:text-white transition-all"
                  title="Close overlay"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                  {activeCheat.badge}
                </span>
                <span className="text-xs sm:text-sm font-medium text-[#fdfbf7]/90 font-mono">
                  {activeCheat.title}
                </span>
              </div>
            </div>
          </div>

          {/* Center Dynamic Meme Display based on Cheat */}
          <div 
            className="my-auto w-full max-w-xl animate-in zoom-in-95 duration-300 px-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. HESOYAM / ASPIRINE */}
            {activeCheat.type === 'hesoyam' && (
              <div className="rounded-3xl border-2 border-emerald-500/70 bg-[#0c1a14]/95 p-6 text-center shadow-[0_0_60px_rgba(16,185,129,0.5)] backdrop-blur-xl">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 mb-3 border border-emerald-500/40">
                  <DollarSign size={36} className="animate-bounce" />
                </div>
                
                <div className="gta-hud-font text-5xl sm:text-6xl text-emerald-400 tracking-wider font-black mb-2 animate-pulse">
                  +$250,000
                </div>

                {/* GTA Health & Armor Bars */}
                <div className="space-y-2 max-w-xs mx-auto my-4 text-left font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] text-red-400 font-bold mb-1">
                      <span>HEALTH</span>
                      <span>100%</span>
                    </div>
                    <div className="h-3 w-full bg-red-950 rounded-full overflow-hidden border border-red-500/30">
                      <div className="h-full bg-red-500 w-full animate-in slide-in-from-left duration-500" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-blue-400 font-bold mb-1">
                      <span>ARMOR</span>
                      <span>100%</span>
                    </div>
                    <div className="h-3 w-full bg-blue-950 rounded-full overflow-hidden border border-blue-500/30">
                      <div className="h-full bg-blue-500 w-full animate-in slide-in-from-left duration-700" />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/60 p-3 text-xs text-[#a19bb5] font-mono mb-4">
                  <p className="text-white font-bold mb-1">⚠️ REALITY CHECK REPORT</p>
                  <p>Virtual Cash: <span className="text-emerald-400 font-bold">+$250,000.00</span></p>
                  <p>Real Bank Account: <span className="text-red-400 font-bold">₹0.00 💀</span></p>
                  <p className="text-[11px] text-[#fca47a] mt-1">
                    (Nice try homie! Rockstar cheats work in Vice City, but only UPI works in real life!)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={scrollToDonate}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 font-bold text-black uppercase tracking-wider hover:brightness-110 transition-all text-xs sm:text-sm shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                >
                  <Zap size={16} />
                  <span>Fix Real Life Balance: Drop ₹1 & Join Heist</span>
                </button>
              </div>
            )}

            {/* 2. STARS / LEAVEMEALONE / AEZAKMI */}
            {activeCheat.type === 'stars' && (
              <div className="rounded-3xl border-2 border-yellow-500/70 bg-[#1a140a]/95 p-6 text-center shadow-[0_0_60px_rgba(234,179,8,0.5)] backdrop-blur-xl">
                <div className="flex justify-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className="relative">
                      <Star size={32} className="text-yellow-400 fill-yellow-400 animate-pulse" />
                      <span className="absolute inset-0 flex items-center justify-center text-red-600 font-black text-2xl">
                        ✕
                      </span>
                    </div>
                  ))}
                </div>

                <div className="gta-hud-font text-4xl sm:text-5xl text-yellow-400 tracking-wider font-black mb-2">
                  WANTED LEVEL CLEARED
                </div>

                <div className="rounded-xl border border-white/10 bg-black/60 p-4 text-xs font-mono text-[#a19bb5] mb-4">
                  <div className="flex items-center justify-center gap-2 text-yellow-400 font-bold mb-1">
                    <Radio size={14} className="animate-spin" />
                    <span>LSPD / VICE CITY POLICE RADIO TRANSCRIPT</span>
                  </div>
                  <p className="italic text-white">
                    &quot;10-4 dispatch, all units stand down. We ran suspect&apos;s bank balance — he has ₹0.00. Not worth the paperwork or gas.&quot;
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full rounded-xl bg-yellow-400 py-3 font-bold text-black uppercase tracking-wider hover:bg-yellow-300 transition-all text-xs sm:text-sm"
                >
                  Return to Vice City Streets
                </button>
              </div>
            )}

            {/* 3. WASTED */}
            {activeCheat.type === 'wasted' && (
              <div className="text-center animate-wasted-banner">
                <h1 className="gta-hud-font text-7xl sm:text-9xl text-red-600 font-black tracking-widest drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] mb-4">
                  WASTED
                </h1>
                <div className="rounded-2xl border border-red-900 bg-black/90 p-5 max-w-md mx-auto text-xs font-mono text-[#a19bb5] mb-4">
                  <p className="text-red-400 font-bold text-sm uppercase mb-1">
                    CAUSE OF DEATH
                  </p>
                  <p className="text-white mb-2">
                    Waited 12 years for GTA 6. Heart collapsed upon seeing ₹0 in bank account.
                  </p>
                  <p className="text-[11px] text-red-300">
                    Hospital Bill: ₹100 deducted from negative balance.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={scrollToDonate}
                  className="rounded-xl bg-red-600 hover:bg-red-500 px-6 py-3 font-bold text-white uppercase tracking-wider transition-all text-xs sm:text-sm shadow-xl shadow-red-900/50"
                >
                  Respawn at Leonida Hospital & Donate ₹1
                </button>
              </div>
            )}

            {/* 4. MISSION PASSED */}
            {activeCheat.type === 'mission' && (
              <div className="rounded-3xl border-2 border-yellow-400/80 bg-[#161204]/95 p-6 text-center shadow-[0_0_70px_rgba(250,204,21,0.6)] backdrop-blur-xl">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400/20 text-yellow-400 mb-2 border border-yellow-400/40">
                  <Trophy size={36} className="animate-bounce" />
                </div>

                <div className="gta-hud-font text-5xl sm:text-6xl text-yellow-400 tracking-wider font-black mb-1">
                  MISSION PASSED!
                </div>
                <div className="gta-hud-font text-3xl sm:text-4xl text-[#fca47a] tracking-widest font-bold mb-3">
                  RESPECT + 999,999
                </div>

                <p className="text-xs sm:text-sm font-mono text-white mb-4">
                  You cracked the Leonida developer console! Authentic Vice City fanfare blasting through your speakers!
                </p>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full rounded-xl bg-gradient-to-r from-yellow-400 to-[#fca47a] py-3 font-bold text-black uppercase tracking-wider hover:brightness-110 transition-all text-xs sm:text-sm"
                >
                  Claim Vice City Crown 👑
                </button>
              </div>
            )}

            {/* 5. SEAWAYS */}
            {activeCheat.type === 'seaways' && (
              <div className="rounded-3xl border-2 border-cyan-400/70 bg-[#05151c]/95 p-6 text-center shadow-[0_0_60px_rgba(34,211,238,0.5)] backdrop-blur-xl">
                <div className="text-5xl mb-2 animate-bounce">
                  🚗🌊
                </div>
                <div className="gta-hud-font text-4xl sm:text-5xl text-cyan-400 tracking-wider font-black mb-2">
                  AMPHIBIOUS MODE ACTIVATED
                </div>
                <p className="text-xs sm:text-sm font-mono text-white mb-4">
                  Bro is literally driving his Maruti 800 across Biscayne Bay waters to avoid Mumbai toll plazas.
                </p>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full rounded-xl bg-cyan-400 py-3 font-bold text-black uppercase tracking-wider hover:bg-cyan-300 transition-all text-xs sm:text-sm"
                >
                  Float on 🌊
                </button>
              </div>
            )}

            {/* 6. PANZER */}
            {activeCheat.type === 'panzer' && (
              <div className="rounded-3xl border-2 border-orange-500/70 bg-[#1a0e05]/95 p-6 text-center shadow-[0_0_60px_rgba(249,115,22,0.5)] backdrop-blur-xl animate-gta-shake">
                <div className="text-5xl mb-2">
                  🚜💥
                </div>
                <div className="gta-hud-font text-4xl sm:text-5xl text-orange-400 tracking-wider font-black mb-2">
                  RHINO TANK AIR-DROPPED
                </div>
                <p className="text-xs sm:text-sm font-mono text-white mb-4">
                  A 60-Ton military tank has crushed your neighbor&apos;s scooter. Samosa and fuel money not included.
                </p>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full rounded-xl bg-orange-500 py-3 font-bold text-black uppercase tracking-wider hover:bg-orange-400 transition-all text-xs sm:text-sm"
                >
                  Fire Main Cannon 💣
                </button>
              </div>
            )}

            {/* 7. BIG SMOKE */}
            {activeCheat.type === 'bigsmoke' && (
              <div className="rounded-3xl border-2 border-yellow-500/70 bg-[#161205]/95 p-6 text-center shadow-[0_0_60px_rgba(234,179,8,0.5)] backdrop-blur-xl">
                <div className="text-5xl mb-2">
                  🍔🥤
                </div>
                <div className="gta-hud-font text-3xl sm:text-4xl text-yellow-400 tracking-wider font-black mb-2">
                  CLUCKIN&apos; BELL DRIVE-THRU
                </div>
                <div className="rounded-xl border border-white/10 bg-black/60 p-4 text-xs font-mono text-yellow-300 text-left mb-4 space-y-1">
                  <p>✔ 2 Number 9s</p>
                  <p>✔ A Number 9 Large</p>
                  <p>✔ A Number 6 with Extra Dip</p>
                  <p>✔ A Number 7</p>
                  <p>✔ 2 Number 45s (One with Cheese)</p>
                  <p>✔ And a Large Soda.</p>
                </div>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full rounded-xl bg-yellow-400 py-3 font-bold text-black uppercase tracking-wider hover:bg-yellow-300 transition-all text-xs sm:text-sm"
                >
                  Eat to Keep Strength Up
                </button>
              </div>
            )}

            {/* 8. TOMMY VERCETTI */}
            {activeCheat.type === 'tommy' && (
              <div className="rounded-3xl border-2 border-[#e86b97]/70 bg-[#17091b]/95 p-6 text-center shadow-[0_0_60px_rgba(232,107,151,0.5)] backdrop-blur-xl">
                <div className="text-5xl mb-2">
                  🌴🕶️
                </div>
                <div className="gta-hud-font text-3xl sm:text-4xl text-[#e86b97] tracking-wider font-black mb-2">
                  VICE CITY 1986
                </div>
                <p className="text-xs sm:text-sm font-mono text-white italic mb-4">
                  &quot;I poke my head out of the gutter for one freakin&apos; second, and fate shovels shit in my face!&quot;
                </p>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full rounded-xl bg-[#e86b97] py-3 font-bold text-black uppercase tracking-wider hover:brightness-110 transition-all text-xs sm:text-sm"
                >
                  Run Vice City 🕶️
                </button>
              </div>
            )}

            {/* 9. DEFAULT / ARMOR / WEAPONS */}
            {activeCheat.type !== 'hesoyam' && 
             activeCheat.type !== 'stars' && 
             activeCheat.type !== 'wasted' && 
             activeCheat.type !== 'mission' && 
             activeCheat.type !== 'seaways' && 
             activeCheat.type !== 'panzer' && 
             activeCheat.type !== 'bigsmoke' && 
             activeCheat.type !== 'tommy' && (
              <div className="rounded-3xl border-2 border-[#fca47a]/70 bg-[#160d26]/95 p-6 text-center shadow-[0_0_60px_rgba(252,164,122,0.4)] backdrop-blur-xl">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fca47a]/20 text-[#fca47a] mb-3 border border-[#fca47a]/40">
                  <Shield size={36} />
                </div>
                <div className="gta-hud-font text-3xl sm:text-4xl text-[#fca47a] tracking-wider font-black mb-2">
                  {activeCheat.title}
                </div>
                <p className="text-xs sm:text-sm font-mono text-white mb-4">
                  {activeCheat.meme}
                </p>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full rounded-xl bg-[#fca47a] py-3 font-bold text-black uppercase tracking-wider hover:bg-[#ffb78e] transition-all text-xs sm:text-sm"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          {/* Bottom Dismiss Hint */}
          <div className="mb-2 sm:mb-4 text-center">
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-full bg-white/10 hover:bg-white/20 px-4 py-1.5 text-xs font-mono text-white/80 transition-all backdrop-blur-md"
            >
              [ Click anywhere or press ESC to dismiss ]
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
