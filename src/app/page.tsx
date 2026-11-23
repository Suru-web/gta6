'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { GameContainer } from '@/components/game/GameContainer';
import { Leaderboard } from '@/components/game/Leaderboard';
import { Footer } from '@/components/Footer';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export default function HomePage() {
  const router = useRouter();
  const { sideQuestVisible } = useSiteSettings();
  const [totalVisits, setTotalVisits] = useState(0);

  useEffect(() => {
    document.title = 'GTA Legends Arena';
  }, []);

  useEffect(() => {
    async function trackVisit() {
      try {
        let visitorId = '';
        try {
          visitorId = localStorage.getItem('gta6_visitor_id') || '';
          if (!visitorId) {
            visitorId = `vis-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            localStorage.setItem('gta6_visitor_id', visitorId);
          }
        } catch {
          // Continue without a stored visitor identifier.
        }
        const response = await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorId }),
        });
        const data = await response.json();
        if (data.success && typeof data.totalVisits === 'number') setTotalVisits(data.totalVisits);
      } catch {
        // Visitor counts are optional.
      }
    }
    void trackVisit();
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const openSideQuest = sideQuestVisible === true ? () => router.push('/side-quest') : undefined;

  return (
    <div className="retro-grid min-h-screen flex flex-col justify-between selection:bg-yellow-400 selection:text-black">
      <Navbar
        totalVisits={totalVisits}
        onScrollToFight={() => scrollTo('game-arena')}
        onScrollToRankings={() => scrollTo('global-rankings')}
        onScrollToQuest={openSideQuest}
      />

      <main className="flex-1 space-y-6">
        <section id="game-arena">
          <GameContainer onOpenSideQuest={openSideQuest} onScrollToLeaderboard={() => scrollTo('global-rankings')} />
        </section>
        <Leaderboard onFightNow={() => scrollTo('game-arena')} />
      </main>

      <Footer showSideQuest={false} onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
    </div>
  );
}
