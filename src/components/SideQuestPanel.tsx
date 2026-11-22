'use client';

import React from 'react';
import { SiteStats, Donation, UpiConfig } from '@/types/donation';
import { HeartHandshake, ArrowRight, ShieldCheck, Trophy, Sparkles, ExternalLink } from 'lucide-react';
import { sounds } from '@/lib/sounds';

interface SideQuestPanelProps {
  stats: SiteStats;
  donations: Donation[];
  onOpenDonate: () => void;
  onOpenFullQuest?: () => void;
}

export const SideQuestPanel: React.FC<SideQuestPanelProps> = ({
  stats,
  donations,
  onOpenDonate,
  onOpenFullQuest,
}) => {
  const verifiedDonors = donations.filter((d) => d.isVerified);
  const recentDonors = verifiedDonors.length > 0 ? verifiedDonors.slice(0, 3) : donations.slice(0, 3);

  return (
    <section id="side-quest" className="relative px-4 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto">
        <div className="relative rounded-3xl border border-yellow-500/30 bg-[#140f05]/90 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(234,179,8,0.15)] overflow-hidden">
          
          {/* Background subtle neon watermarks */}
          <div className="absolute -right-10 -bottom-10 text-9xl font-bebas text-yellow-500/[0.04] pointer-events-none select-none">
            GTA VI
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Left 7 cols: Side Quest Lore, Target, Progress Bar */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3.5 py-1 text-xs font-mono uppercase tracking-widest text-yellow-400 font-bold">
                <HeartHandshake size={14} />
                <span>SIDE QUEST // OPTIONAL GAMER RESCUE</span>
              </div>

              <div>
                <h3 className="font-bebas text-3xl sm:text-5xl text-white tracking-wider leading-none">
                  HELP A GAMER GET GTA VI
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-[#a19bb5] font-mono leading-relaxed">
                  &quot;Can the internet buy me GTA 6 for ₹1?&quot; Rockstar waited 12+ years. My wallet has ₹0.00. Help save a fellow gamer from experiencing Vice City through 480p YouTube playthroughs.
                </p>
              </div>

              {/* Progress & Target Stats */}
              <div className="rounded-2xl border border-white/10 bg-black/60 p-4 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-[10px] text-[#a19bb5] uppercase block">TOTAL RAISED</span>
                    <span className="font-bebas text-3xl text-white tracking-wide">
                      ₹{stats.totalRaised.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#a19bb5] uppercase block">TARGET</span>
                    <span className="font-bebas text-2xl text-yellow-400 tracking-wide">
                      ₹{stats.targetAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/15">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 via-amber-500 to-rose-500 transition-all duration-500"
                      style={{ width: `${Math.max(1, stats.percentComplete)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#a19bb5]">
                    <span>{stats.percentComplete}% Complete &bull; {stats.totalDonors} Backers</span>
                    <span>₹{stats.remainingAmount.toLocaleString('en-IN')} to go</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 cols: Wall of Legends Preview + Action CTA */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              
              {/* Mini Wall of Legends Preview */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[11px] text-[#a19bb5]">
                  <span className="flex items-center gap-1 font-bold text-yellow-400">
                    <Trophy size={13} />
                    WALL OF LEGENDS PREVIEW
                  </span>
                  <span>{stats.totalDonors} BACKERS</span>
                </div>

                <div className="mt-2 space-y-2">
                  {recentDonors.map((d) => (
                    <div key={d.id} className="flex items-center justify-between text-[11px]">
                      <div className="truncate max-w-[160px]">
                        <span className="font-bold text-white">{d.name}</span>
                        {d.badge && (
                          <span className="ml-1 text-[9px] text-[#fca47a]">{d.badge}</span>
                        )}
                      </div>
                      <span className="font-bold text-emerald-400">₹{d.amount}</span>
                    </div>
                  ))}
                  {recentDonors.length === 0 && (
                    <div className="text-[11px] text-[#6c637e] italic py-1">
                      Be the very first legend on the leaderboard!
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onOpenDonate();
                  }}
                  className="w-full rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 py-3.5 text-sm font-bold uppercase tracking-wider text-black hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-yellow-500/20 flex items-center justify-center gap-2"
                >
                  <HeartHandshake size={18} />
                  <span>SUPPORT THE MISSION (₹1 / $1)</span>
                  <ArrowRight size={16} />
                </button>

                <div className="flex items-center justify-center gap-3 text-[11px] font-mono text-[#a19bb5]">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <ShieldCheck size={12} /> Direct UPI (₹) & Worldwide ($)
                  </span>
                  {onOpenFullQuest && (
                    <button
                      type="button"
                      onClick={onOpenFullQuest}
                      className="text-yellow-400 hover:underline flex items-center gap-0.5"
                    >
                      <span>Full Quest Page</span>
                      <ExternalLink size={10} />
                    </button>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
