'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

  // Fetch active UPI config from server (configured by admin)
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
      const res = await fetch('/api/donations');
      const data = await res.json();
      if (data.success && Array.isArray(data.donations)) {
        let merged = [...data.donations];
        try {
          const localOnly = JSON.parse(localStorage.getItem('my_gta6_donations') || '[]');
          if (Array.isArray(localOnly) && localOnly.length > 0) {
            const existingIds = new Set(merged.map((d) => d.id));
            localOnly.forEach((localD: Donation) => {
              if (!existingIds.has(localD.id)) {
                merged = [localD, ...merged];
              }
            });
          }
        } catch {
          // ignore
        }

        setDonations(merged);
        if (data.stats) {
          const totalRaised = merged.reduce((s, d) => s + (Number(d.amount) || 0), 0);
          setStats({
            targetAmount: SITE_CONFIG.targetAmount,
            totalRaised,
            totalDonors: merged.length,
            percentComplete: Math.min(
              100,
              Number(((totalRaised / SITE_CONFIG.targetAmount) * 100).toFixed(1))
            ),
            wantedLevel:
              totalRaised >= SITE_CONFIG.targetAmount
                ? 5
                : totalRaised >= SITE_CONFIG.targetAmount * 0.75
                ? 4
                : totalRaised >= SITE_CONFIG.targetAmount * 0.5
                ? 3
                : totalRaised >= SITE_CONFIG.targetAmount * 0.25
                ? 2
                : 1,
            remainingAmount: Math.max(0, SITE_CONFIG.targetAmount - totalRaised),
          });
        }
      }
    } catch (err) {
      console.warn('Could not fetch donations from API:', err);
    }
  }, []);

  useEffect(() => {
    fetchDonations();
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
      {/* Top Navbar */}
      <Navbar
        stats={stats}
        onScrollToLegends={() => scrollTo('hall-of-fame')}
      />

      {/* Infinite Top Ticker */}
      <TickerMarquee donations={donations} />

      {/* Main Content */}
      <main className="flex-1 space-y-4">
        {/* Hero Section with Crying Beggar Mascot & Retro Progress Bar */}
        <HeroSection
          stats={stats}
          onScrollToDonate={() => scrollTo('donate-section')}
        />

        {/* The Direct UPI Donation Card with QR Code */}
        <DonationCard
          upiConfig={upiConfig}
          onOpenPaymentModal={(amt) => {
            setSelectedPayAmount(amt);
            setIsPaymentModalOpen(true);
          }}
        />

        {/* 4 Funny Meme Cards: The Hard Truth */}
        <MemeReasonsGrid />

        {/* Wall of Legends: Who Paid How Much */}
        <DonorsCarousel donations={donations} />

        {/* Cheat Code Terminal */}
        <CheatCodeBox />
      </main>

      {/* Footer */}
      <Footer
        onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        initialAmount={selectedPayAmount}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handleDonationSuccess}
      />

      <ThankYouModal
        isOpen={isThankYouOpen}
        donation={latestDonation}
        onClose={() => setIsThankYouOpen(false)}
        onViewHallOfFame={() => {
          setIsThankYouOpen(false);
          scrollTo('hall-of-fame');
        }}
      />
    </div>
  );
}
