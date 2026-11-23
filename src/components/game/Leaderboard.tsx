'use client';

import React, { useEffect, useState } from 'react';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import { LeaderboardResponse, FighterStatSummary } from '@/types/game';
import { sounds } from '@/lib/sounds';

interface LeaderboardProps {
  onFightNow?: () => void;
}

type RankingTab = 'strength' | 'victories' | 'winrate' | 'popular';
const tabs: { id: RankingTab; label: string }[] = [
  { id: 'strength', label: 'Overall strongest' },
  { id: 'victories', label: 'Most victories' },
  { id: 'winrate', label: 'Highest win rate' },
  { id: 'popular', label: 'Most popular' },
];

async function loadRankings(signal?: AbortSignal): Promise<LeaderboardResponse> {
  const res = await fetch('/api/game/rankings', { cache: 'no-store', signal });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error('Could not load rankings');
  return json;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onFightNow }) => {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [activeTab, setActiveTab] = useState<RankingTab>('strength');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchRankings = async () => {
    try {
      setData(await loadRankings());
      setHasError(false);
    } catch (error) {
      console.warn('Failed to fetch rankings:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void loadRankings(controller.signal).then((rankings) => {
      setData(rankings);
      setHasError(false);
    }).catch((error) => {
      if (!controller.signal.aborted) {
        console.warn('Failed to fetch rankings:', error);
        setHasError(true);
      }
    }).finally(() => {
      if (!controller.signal.aborted) setIsLoading(false);
    });
    return () => controller.abort();
  }, []);

  const lists: Record<RankingTab, FighterStatSummary[]> = {
    strength: data?.byStrength ?? [],
    victories: data?.byVictories ?? [],
    winrate: data?.byWinRate ?? [],
    popular: data?.byPopularity ?? [],
  };
  const list = lists[activeTab];

  return (
    <section id="global-rankings" className="arena-rankings">
      <div className="arena-rankings-inner mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rankings-header">
          <div>
            <p className="arena-eyebrow"><span className="arena-eyebrow-mark" aria-hidden="true" /> THE LEADERBOARD</p>
            <h2>The fight for the top<span>.</span></h2>
            <p className="rankings-description">Every completed match leaves its mark. See how the fighters stack up.</p>
          </div>
          {data && <p className="rankings-total"><strong>{String(data.totalMatches).padStart(2, '0')}</strong><span>matches<br />recorded</span></p>}
        </div>

        <div className="rankings-toolbar">
          <div className="rankings-tabs" aria-label="Rank fighters by">
            {tabs.map((tab) => (
              <button key={tab.id} type="button" aria-pressed={activeTab === tab.id} onClick={() => { sounds.playClick(); setActiveTab(tab.id); }}>
                {tab.label}
              </button>
            ))}
          </div>
          <button type="button" className="rankings-refresh" disabled={isLoading} onClick={() => { sounds.playClick(); setIsLoading(true); void fetchRankings(); }}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} aria-hidden="true" /> Refresh
          </button>
        </div>

        {hasError && <p className="rankings-message" role="status">Couldn’t update the rankings. Try refreshing in a moment.</p>}
        {!data && isLoading && <p className="rankings-message" role="status">Loading the rankings…</p>}
        {data && list.length === 0 && <p className="rankings-message">No rankings yet. Finish a match to get on the board.</p>}
        {list.length > 0 && (
          <div className="rankings-table-wrap">
            <table className="rankings-table">
              <thead><tr><th scope="col">Rank</th><th scope="col">Fighter</th><th scope="col">Picks</th><th scope="col">Wins</th><th scope="col">Losses</th><th scope="col">Win rate</th><th scope="col">Power score</th></tr></thead>
              <tbody>
                {list.map((fighter, index) => (
                  <tr key={fighter.characterId}>
                    <td className="rankings-rank">{String(index + 1).padStart(2, '0')}</td>
                    <td><div className="rankings-fighter"><span className="rankings-initial" aria-hidden="true">{fighter.characterName.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><div><strong>{fighter.characterName}</strong><small>{fighter.game}</small></div></div></td>
                    <td data-label="Picks">{fighter.picks}</td><td data-label="Wins">{fighter.wins}</td><td data-label="Losses">{fighter.losses}</td>
                    <td data-label="Win rate"><span className="rankings-rate">{fighter.winRate}%</span><span className="rankings-meter"><i style={{ width: `${Math.max(0, Math.min(100, fighter.winRate))}%` }} /></span></td>
                    <td className="rankings-score" data-label="Score">{fighter.score} <small>PTS</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {onFightNow && <div className="rankings-bottom"><p>Ready to change the rankings?</p><button type="button" onClick={() => { sounds.playClick(); onFightNow(); }}>Back to the arena <ArrowUpRight size={15} aria-hidden="true" /></button></div>}
      </div>
    </section>
  );
};
