'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { TickerMarquee } from '@/components/TickerMarquee';
import { HeroSection } from '@/components/HeroSection';
import { DonationCard } from '@/components/DonationCard';
import { MemeReasonsGrid } from '@/components/MemeReasonsGrid';
import { DonorsCarousel } from '@/components/DonorsCarousel';
import { CheatCodeBox } from '@/components/CheatCodeBox';
import { PaymentModal } from '@/components/PaymentModal';
import { ThankYouModal } from '@/components/ThankYouModal';
import { Footer } from '@/components/Footer';
import { Donation, SiteStats, UpiConfig } from '@/types/donation';
import { SITE_CONFIG } from '@/config/site';
import initialSeed from '@/data/seed-donations.json';
import { Swords, ArrowLeft } from 'lucide-react';

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

export default function SideQuestPage() {
  const [donations, setDonations] = useState<Donation[]>(initialSeed as Donation[]);
  const [stats, setStats] = useState<SiteStats>(defaultStats);
  const [upiConfig, setUpiConfig] = useState<UpiConfig>({
    upiId: SITE_CONFIG.defaultUpiId,
    payeeName: SITE_CONFIG.defaultPayeeName,
    note: SITE_CONFIG.defaultNote,
  });

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPayAmount, setSelectedPayAmount] = useState<number>(69);
  const [isThankYouOpen, setIsThankYouOpen] = useState(false);
  const [latestDonation, setLatestDonation] = useState<Donation | null>(null);
  const [totalVisits, setTotalVisits] = useState<number>(0);

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

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        if (data.success && data.config) {
          setUpiConfig(data.config);
        }
      } catch {
        // fallback
      }
    }
    loadConfig();
  }, []);

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
      console.warn('Could not fetch donations:', err);
    }
  }, []);

  useEffect(() => {
    fetchDonations();
    const interval = setInterval(fetchDonations, 4000);
    return () => clearInterval(interval);
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
      
      {/* Return to Arena Banner */}
      <div className="bg-black/90 border-b border-white/10 px-4 py-2 flex items-center justify-between text-xs font-mono">
        <Link
          href="/"
          className="text-[#fca47a] hover:text-white flex items-center gap-1.5 transition-colors font-bold"
        >
          <ArrowLeft size={14} />
          <span>RETURN TO GTA LEGENDS ARENA (FIGHTING GAME)</span>
        </Link>
        <span className="text-[#a19bb5] hidden sm:inline">
          SIDE QUEST: THE ORIGINAL CROWDFUNDING EXPERIMENT
        </span>
      </div>

      <Navbar
        stats={stats}
        totalVisits={totalVisits}
        onScrollToLegends={() => scrollTo('hall-of-fame')}
      />

      <TickerMarquee donations={donations} />

      <main className="flex-1 space-y-4">
        <HeroSection
          stats={stats}
          totalVisits={totalVisits}
          onScrollToDonate={() => scrollTo('donate-section')}
        />

        <DonationCard
          upiConfig={upiConfig}
          onOpenPaymentModal={(amount) => {
            setSelectedPayAmount(amount);
            setIsPaymentModalOpen(true);
          }}
        />

        <MemeReasonsGrid />

        <DonorsCarousel donations={donations} />

        <CheatCodeBox />
      </main>

      <Footer onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        initialAmount={selectedPayAmount}
        onSuccess={handleDonationSuccess}
      />

      <ThankYouModal
        isOpen={isThankYouOpen}
        onClose={() => setIsThankYouOpen(false)}
        donation={latestDonation}
        onViewHallOfFame={() => scrollTo('hall-of-fame')}
      />
    </div>
  );
}
