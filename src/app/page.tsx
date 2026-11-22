'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { TickerMarquee } from '@/components/TickerMarquee';
import { GameContainer } from '@/components/game/GameContainer';
import { Leaderboard } from '@/components/game/Leaderboard';
import { SideQuestPanel } from '@/components/SideQuestPanel';
import { DonationCard } from '@/components/DonationCard';
import { DonorsCarousel } from '@/components/DonorsCarousel';
import { CheatCodeBox } from '@/components/CheatCodeBox';
import { AboutSection } from '@/components/AboutSection';
import { PaymentModal } from '@/components/PaymentModal';
import { ThankYouModal } from '@/components/ThankYouModal';
import { Footer } from '@/components/Footer';
import { Donation, SiteStats, UpiConfig } from '@/types/donation';
import { SITE_CONFIG } from '@/config/site';
import initialSeed from '@/data/seed-donations.json';
import { useRouter } from 'next/navigation';

const defaultStats: SiteStats = {
  targetAmount: SITE_CONFIG.targetAmount,
  totalRaised: (initialSeed as Donation[]).reduce((sum, d) => sum + d.amount, 0),
  totalDonors: initialSeed.length,
  percentComplete: Number(
    (
      ((initialSeed as Donation[]).reduce((sum, d) => sum + d.amount, 0) /
        SITE_CONFIG.targetAmount) *
      100
    ).toFixed(1)
  ),
  wantedLevel: 1,
  remainingAmount:
    SITE_CONFIG.targetAmount - (initialSeed as Donation[]).reduce((sum, d) => sum + d.amount, 0),
};

export default function HomePage() {
  const router = useRouter();
  const [donations, setDonations] = useState<Donation[]>(initialSeed as Donation[]);
  const [stats, setStats] = useState<SiteStats>(defaultStats);
  const [upiConfig, setUpiConfig] = useState<UpiConfig>({
    upiId: SITE_CONFIG.defaultUpiId,
    payeeName: SITE_CONFIG.defaultPayeeName,
    note: SITE_CONFIG.defaultNote,
  });

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPayAmount, setSelectedPayAmount] = useState<number>(69);
  const [isThankYouOpen, setIsThankYouOpen] = useState(false);
  const [latestDonation, setLatestDonation] = useState<Donation | null>(null);
  const [totalVisits, setTotalVisits] = useState<number>(0);

  // Track visit and fetch total visits
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
          // ignore
        }

        const res = await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorId }),
        });
        const data = await res.json();
        if (data.success && typeof data.totalVisits === 'number') {
          setTotalVisits(data.totalVisits);
        }
      } catch {
        // fallback
      }
    }
    trackVisit();
  }, []);

  // Fetch active UPI config from server
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        if (data.success && data.config) {
          setUpiConfig(data.config);
        }
      } catch {
        // fallback to default
      }
    }
    loadConfig();
  }, []);

  // Fetch real-time donations from API
  const fetchDonations = useCallback(async () => {
    try {
      const res = await fetch(`/api/donations?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.donations)) {
        setDonations(data.donations);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.warn('Could not fetch donations from API:', err);
    }
  }, []);

  useEffect(() => {
    fetchDonations();
    const interval = setInterval(fetchDonations, 4000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchDonations();
      }
    };

    window.addEventListener('focus', fetchDonations);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchDonations);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchDonations]);

  const handleDonationSuccess = (newDonation: Donation) => {
    setLatestDonation(newDonation);
    setIsPaymentModalOpen(false);
    setIsThankYouOpen(true);

    const updated = [newDonation, ...donations.filter((d) => d.id !== newDonation.id)];
    setDonations(updated);

    const newTotal = updated.reduce((s, d) => s + (Number(d.amount) || 0), 0);
    setStats({
      targetAmount: SITE_CONFIG.targetAmount,
      totalRaised: newTotal,
      totalDonors: updated.length,
      percentComplete: Math.min(
        100,
        Number(((newTotal / SITE_CONFIG.targetAmount) * 100).toFixed(1))
      ),
      wantedLevel:
        newTotal >= SITE_CONFIG.targetAmount
          ? 5
          : newTotal >= SITE_CONFIG.targetAmount * 0.75
          ? 4
          : newTotal >= SITE_CONFIG.targetAmount * 0.5
          ? 3
          : newTotal >= SITE_CONFIG.targetAmount * 0.25
          ? 2
          : 1,
      remainingAmount: Math.max(0, SITE_CONFIG.targetAmount - newTotal),
    });
  };

  const scrollTo = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="retro-grid min-h-screen flex flex-col justify-between selection:bg-yellow-400 selection:text-black">
      
      {/* Top Navigation Bar */}
      <Navbar
        stats={stats}
        totalVisits={totalVisits}
        onScrollToFight={() => scrollTo('game-arena')}
        onScrollToRankings={() => scrollTo('global-rankings')}
        onScrollToQuest={() => scrollTo('side-quest')}
        onScrollToLegends={() => scrollTo('hall-of-fame')}
        onScrollToAbout={() => scrollTo('about-section')}
      />

      {/* Real-Time Ticker Marquee */}
      <TickerMarquee donations={donations} />

      <main className="flex-1 space-y-6">
        
        {/* ======================================================== */}
        {/* 1. HERO & FIGHTING GAME: GTA LEGENDS ARENA (MAIN EVENT)   */}
        {/* ======================================================== */}
        <section id="game-arena">
          <GameContainer
            onOpenSideQuest={() => scrollTo('side-quest')}
            onScrollToLeaderboard={() => scrollTo('global-rankings')}
          />
        </section>

        {/* ======================================================== */}
        {/* 2. GLOBAL GTA FIGHTER RANKINGS (THE LEADERBOARD)         */}
        {/* ======================================================== */}
        <Leaderboard onFightNow={() => scrollTo('game-arena')} />

        {/* ======================================================== */}
        {/* 3. SIDE QUEST COMPACT DASHBOARD (HELP ME GET GTA VI)     */}
        {/* ======================================================== */}
        <SideQuestPanel
          stats={stats}
          donations={donations}
          onOpenDonate={() => scrollTo('donate-section')}
          onOpenFullQuest={() => router.push('/side-quest')}
        />

        {/* ======================================================== */}
        {/* 4. DONATION CHECKOUT CARD (UPI QR & BUY ME A COFFEE)     */}
        {/* ======================================================== */}
        <DonationCard
          upiConfig={upiConfig}
          onOpenPaymentModal={(amount) => {
            setSelectedPayAmount(amount);
            setIsPaymentModalOpen(true);
          }}
        />

        {/* ======================================================== */}
        {/* 5. WALL OF LEGENDS (BACKERS CAROUSEL)                    */}
        {/* ======================================================== */}
        <DonorsCarousel donations={donations} />

        {/* ======================================================== */}
        {/* 6. LEONIDA DEVELOPER TERMINAL (CLASSIC ROCKSTAR CHEATS)  */}
        {/* ======================================================== */}
        <CheatCodeBox />

        {/* ======================================================== */}
        {/* 7. ABOUT THE PROJECT (HOW IT WORKS)                      */}
        {/* ======================================================== */}
        <AboutSection />

      </main>

      {/* Footer */}
      <Footer onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

      {/* Payment Proof Submission Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        initialAmount={selectedPayAmount}
        onSuccess={handleDonationSuccess}
      />

      {/* Celebration Modal */}
      <ThankYouModal
        isOpen={isThankYouOpen}
        onClose={() => setIsThankYouOpen(false)}
        donation={latestDonation}
        onViewHallOfFame={() => scrollTo('hall-of-fame')}
      />
    </div>
  );
}
