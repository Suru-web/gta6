'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { TickerMarquee } from '@/components/TickerMarquee';
import { HeroSection } from '@/components/HeroSection';
import { BeggarMemeBox } from '@/components/BeggarMemeBox';
import { DonationCard } from '@/components/DonationCard';
import { DonorsCarousel } from '@/components/DonorsCarousel';
import { CheatCodeBox } from '@/components/CheatCodeBox';
import { PaymentModal } from '@/components/PaymentModal';
import { ThankYouModal } from '@/components/ThankYouModal';
import { UpiConfigModal } from '@/components/UpiConfigModal';
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load custom UPI settings from localStorage on client
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('gta6_upi_config');
      if (savedConfig) {
        setUpiConfig(JSON.parse(savedConfig));
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch real-time donations from API
  const fetchDonations = useCallback(async () => {
    try {
      const res = await fetch('/api/donations');
      const data = await res.json();
      if (data.success && Array.isArray(data.donations)) {
        // Merge with any client-local donations that might not have reached serverless storage
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
          // Recompute stats with merged
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

  // Handler for successful donation submission
  const handleDonationSuccess = (newDonation: Donation) => {
    setLatestDonation(newDonation);
    setIsPaymentModalOpen(false);
    setIsThankYouOpen(true);

    // Optimistically update list & stats
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

  // Handler for saving UPI settings
  const handleSaveUpiConfig = (newConfig: UpiConfig) => {
    setUpiConfig(newConfig);
    try {
      localStorage.setItem('gta6_upi_config', JSON.stringify(newConfig));
    } catch {
      // ignore
    }
  };

  // Scroll helpers
  const scrollTo = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between">
      {/* Top Navbar */}
      <Navbar
        stats={stats}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHallOfFame={() => scrollTo('hall-of-fame')}
      />

      {/* Infinite Top Marquee of Donors */}
      <TickerMarquee donations={donations} />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          stats={stats}
          onScrollToDonate={() => scrollTo('donate-section')}
          onScrollToMemes={() => scrollTo('beggar-vault')}
        />

        {/* The Beggar Meme Box (Please memes & reasons) */}
        <BeggarMemeBox onScrollToDonate={() => scrollTo('donate-section')} />

        {/* The Donation & UPI QR Card */}
        <DonationCard
          upiConfig={upiConfig}
          onOpenPaymentModal={(amt) => {
            setSelectedPayAmount(amt);
            setIsPaymentModalOpen(true);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Hall of Fame Carousel: Who Paid How Much */}
        <DonorsCarousel donations={donations} />

        {/* Cheat Code Terminal Easter Egg */}
        <CheatCodeBox />
      </main>

      {/* Footer */}
      <Footer
        onScrollToTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* MODALS */}
      {/* Payment Confirmation Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        initialAmount={selectedPayAmount}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handleDonationSuccess}
      />

      {/* Thank You / You Are Great Meme Modal */}
      <ThankYouModal
        isOpen={isThankYouOpen}
        donation={latestDonation}
        onClose={() => setIsThankYouOpen(false)}
        onViewHallOfFame={() => {
          setIsThankYouOpen(false);
          scrollTo('hall-of-fame');
        }}
      />

      {/* UPI / QR Config Modal */}
      <UpiConfigModal
        isOpen={isSettingsOpen}
        currentConfig={upiConfig}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveUpiConfig}
      />
    </div>
  );
}
