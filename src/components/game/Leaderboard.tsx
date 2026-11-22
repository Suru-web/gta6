'use client';

import React, { useState, useEffect } from 'react';
import { LeaderboardResponse, FighterStatSummary } from '@/types/game';
import { Trophy, Flame, Target, Users, RefreshCw, Award, Swords } from 'lucide-react';
import { sounds } from '@/lib/sounds';

interface LeaderboardProps {
  onFightNow?: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onFightNow }) => {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'strength' | 'victories' | 'winrate' | 'popular'>('strength');
  const [isLoading, setIsLoading] = useState(true);

  const fetchRankings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/game/rankings?_t=${Date.now()}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.warn('Failed to fetch rankings:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  const getActiveList = (): FighterStatSummary[] => {
    if (!data) return [];
    if (activeTab === 'strength') return data.byStrength;
    if (activeTab === 'victories') return data.byVictories;
    if (activeTab === 'winrate') return data.byWinRate;
    return data.byPopularity;
  };

  const list = getActiveList();

  return (
    <section id="global-rankings" className="relative px-4 py-10 sm:py-16">
      <div className="max-w-5xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-3 py-1 rounded-full mb-2">
            <Trophy size={13} />
            <span>GLOBAL COMMUNITY FIGHT STATS</span>
          </div>

          <h2 className="font-bebas text-4xl sm:text-6xl text-white tracking-wider">
            WHO IS THE STRONGEST GTA LEGEND?
          </h2>
          <p className="text-xs sm:text-sm text-[#a19bb5] font-mono max-w-xl mx-auto">
            Real statistics aggregated from every completed match played by visitors across the globe.
          </p>

          {data && (
            <div className="mt-2 text-[11px] font-mono text-[#fca47a]">
              Total Matches Recorded: <strong className="text-white">{data.totalMatches}</strong>
            </div>
          )}
        </div>

        {/* Tab Switcher & Refresh Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap gap-1.5 bg-black/60 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setActiveTab('strength');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono uppercase font-bold rounded-xl transition-all ${
                activeTab === 'strength'
                  ? 'bg-gradient-to-r from-[#fca47a] to-[#e86b97] text-[#090514] shadow'
                  : 'text-[#a19bb5] hover:text-white'
              }`}
            >
              <Award size={14} />
              <span>Overall Strongest</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setActiveTab('victories');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono uppercase font-bold rounded-xl transition-all ${
                activeTab === 'victories'
                  ? 'bg-yellow-400 text-black shadow'
                  : 'text-[#a19bb5] hover:text-white'
              }`}
            >
              <Trophy size={14} />
              <span>Most Victorious</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setActiveTab('winrate');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono uppercase font-bold rounded-xl transition-all ${
                activeTab === 'winrate'
                  ? 'bg-emerald-500 text-black shadow'
                  : 'text-[#a19bb5] hover:text-white'
              }`}
            >
              <Target size={14} />
              <span>Highest Win Rate</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setActiveTab('popular');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono uppercase font-bold rounded-xl transition-all ${
                activeTab === 'popular'
                  ? 'bg-cyan-400 text-black shadow'
                  : 'text-[#a19bb5] hover:text-white'
              }`}
            >
              <Users size={14} />
              <span>Most Popular</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              fetchRankings();
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-[#a19bb5] hover:text-white bg-white/5 border border-white/10 rounded-xl transition-all"
            title="Refresh Leaderboard"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Leaderboard Table / Cards */}
        <div className="bg-[#120b22]/90 border border-white/[0.08] rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-black/40 text-[11px] text-[#a19bb5] uppercase">
                  <th className="py-3.5 px-4 w-12 text-center">Rank</th>
                  <th className="py-3.5 px-4">Fighter</th>
                  <th className="py-3.5 px-4 text-center">Picks</th>
                  <th className="py-3.5 px-4 text-center">Wins</th>
                  <th className="py-3.5 px-4 text-center">Losses</th>
                  <th className="py-3.5 px-4 text-center">Win Rate</th>
                  <th className="py-3.5 px-4 text-right">Power Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {list.map((fighter, idx) => {
                  const rank = idx + 1;
                  const isTop1 = rank === 1;
                  const isTop3 = rank <= 3;

                  return (
                    <tr
                      key={fighter.characterId}
                      className={`hover:bg-white/[0.03] transition-colors ${
                        isTop1 ? 'bg-yellow-400/[0.04]' : ''
                      }`}
                    >
                      {/* Rank Column */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold ${
                            rank === 1
                              ? 'bg-yellow-400 text-black shadow-[0_0_10px_#facc15]'
                              : rank === 2
                              ? 'bg-zinc-300 text-black'
                              : rank === 3
                              ? 'bg-amber-700 text-white'
                              : 'text-[#6c637e]'
                          }`}
                        >
                          {rank}
                        </span>
                      </td>

                      {/* Character Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl filter drop-shadow">
                            {fighter.characterId === 'tommy-vercetti'
                              ? '🌴'
                              : fighter.characterId === 'carl-johnson'
                              ? '👑'
                              : fighter.characterId === 'trevor-philips'
                              ? '💀'
                              : fighter.characterId === 'claude'
                              ? '🕶️'
                              : fighter.characterId === 'niko-bellic'
                              ? '🦅'
                              : fighter.characterId === 'michael-de-santa'
                              ? '💼'
                              : fighter.characterId === 'franklin-clinton'
                              ? '🎯'
                              : fighter.characterId === 'lucia-caminos'
                              ? '🌺'
                              : fighter.characterId === 'jason-duval'
                              ? '🔥'
                              : fighter.characterId === 'toni-cipriani'
                              ? '🍝'
                              : fighter.characterId === 'victor-vance'
                              ? '⭐'
                              : fighter.characterId === 'johnny-klebitz'
                              ? '🏍️'
                              : fighter.characterId === 'luis-lopez'
                              ? '🍸'
                              : '🗡️'}
                          </span>
                          <div>
                            <div className="font-bebas text-lg text-white tracking-wider flex items-center gap-1.5">
                              <span>{fighter.characterName}</span>
                              {isTop1 && (
                                <span className="bg-yellow-400/20 text-yellow-300 text-[9px] font-mono px-1.5 py-0.2 rounded font-bold">
                                  #1 APEX
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#a19bb5]">
                              {fighter.game}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Picks */}
                      <td className="py-3 px-4 text-center font-bold text-white">
                        {fighter.picks}
                      </td>

                      {/* Wins */}
                      <td className="py-3 px-4 text-center font-bold text-emerald-400">
                        {fighter.wins}
                      </td>

                      {/* Losses */}
                      <td className="py-3 px-4 text-center text-[#6c637e]">
                        {fighter.losses}
                      </td>

                      {/* Win Rate */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`font-bold ${
                              fighter.winRate >= 60
                                ? 'text-emerald-400'
                                : fighter.winRate >= 45
                                ? 'text-yellow-400'
                                : 'text-[#a19bb5]'
                            }`}
                          >
                            {fighter.winRate}%
                          </span>
                          <div className="w-16 h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10 mt-1">
                            <div
                              className="h-full bg-emerald-400"
                              style={{ width: `${fighter.winRate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Composite Power Score */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-[#fca47a] text-sm">
                          {fighter.score} PTS
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Call to Action: Settle the Score */}
        {onFightNow && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onFightNow();
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#fca47a] to-[#e86b97] px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-[#090514] hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-[#fca47a]/20"
            >
              <Swords size={16} />
              <span>Settle The Score: Fight As Your Favorite Legend</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
