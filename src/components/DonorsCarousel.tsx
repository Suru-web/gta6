'use client';

import React, { useState } from 'react';
import { Donation } from '@/types/donation';
import { ChevronLeft, ChevronRight, Trophy, Flame, Clock, Sparkles } from 'lucide-react';
import { sounds } from '@/lib/sounds';

interface DonorsCarouselProps {
  donations: Donation[];
}

export const DonorsCarousel: React.FC<DonorsCarouselProps> = ({ donations }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'top' | 'recent'>('all');
  const [currentPage, setCurrentPage] = useState(0);

  // Sorting based on active tab
  const getFilteredDonations = () => {
    if (!donations || donations.length === 0) return [];
    const list = [...donations];
    if (activeTab === 'top') {
      return list.sort((a, b) => b.amount - a.amount);
    }
    if (activeTab === 'recent') {
      return list.sort((a, b) => b.timestamp - a.timestamp);
    }
    return list;
  };

  const filtered = getFilteredDonations();
  const itemsPerPage = 3;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const handlePrev = () => {
    sounds.playClick();
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : Math.max(0, totalPages - 1)));
  };

  const handleNext = () => {
    sounds.playClick();
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  const currentItems = filtered.slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage
  );

  const [now, setNow] = useState<number | null>(null);

  React.useEffect(() => {
    setNow(Date.now());
  }, []);

  const formatTime = (ts: number) => {
    if (!ts || !now) return 'recently';
    const diffMin = Math.floor((now - ts) / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}d ago`;
  };

  return (
    <section id="hall-of-fame" className="relative py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-pink-500/20 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-950/30 px-3.5 py-1 text-xs font-semibold text-amber-300">
              <Trophy size={14} className="text-amber-400" />
              <span>THE HALL OF LEGENDS</span>
            </div>
            <h2 className="mt-2 font-bebas text-4xl sm:text-5xl uppercase tracking-wider text-white">
              WHO PAID HOW MUCH
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-300">
              Every patron is forever inscribed in the Vice City archives.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('all');
                setCurrentPage(0);
              }}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold uppercase transition-all ${
                activeTab === 'all'
                  ? 'border border-pink-500 bg-pink-950/60 text-white shadow-[0_0_12px_rgba(255,0,127,0.3)]'
                  : 'border border-purple-500/20 bg-purple-950/20 text-slate-400 hover:text-white'
              }`}
            >
              All Legends ({donations.length})
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('top');
                setCurrentPage(0);
              }}
              className={`inline-flex items-center gap-1 rounded-xl px-3.5 py-2 text-xs font-bold uppercase transition-all ${
                activeTab === 'top'
                  ? 'border border-amber-500 bg-amber-950/60 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                  : 'border border-purple-500/20 bg-purple-950/20 text-slate-400 hover:text-white'
              }`}
            >
              <Flame size={13} className="text-amber-400" />
              <span>Top Chads</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('recent');
                setCurrentPage(0);
              }}
              className={`inline-flex items-center gap-1 rounded-xl px-3.5 py-2 text-xs font-bold uppercase transition-all ${
                activeTab === 'recent'
                  ? 'border border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                  : 'border border-purple-500/20 bg-purple-950/20 text-slate-400 hover:text-white'
              }`}
            >
              <Clock size={13} className="text-cyan-400" />
              <span>Recent</span>
            </button>
          </div>
        </div>

        {/* CAROUSEL CONTROLS & CARDS */}
        <div className="relative mt-8">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-purple-500/20 bg-purple-950/20 p-12 text-center text-slate-400">
              No donors recorded yet. Be the first Gigachad to fund the mission!
            </div>
          ) : (
            <>
              {/* Carousel Viewport */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {currentItems.map((item) => (
                  <div
                    key={item.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-pink-500/30 bg-[#140a2b]/90 p-5 backdrop-blur-xl shadow-lg transition-all hover:-translate-y-1 hover:border-pink-500/60 hover:shadow-[0_0_25px_rgba(255,0,127,0.25)]"
                  >
                    {/* Top row: badge & amount */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-950/40 px-2.5 py-1 text-xs font-medium text-purple-200">
                          <span>{item.badge}</span>
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-bebas text-3xl font-extrabold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                            ₹{item.amount}
                          </span>
                        </div>
                      </div>

                      {/* Donor Name */}
                      <h3 className="mt-3 font-bebas text-2xl font-bold tracking-wide text-white group-hover:text-pink-300 transition-colors">
                        {item.name}
                      </h3>

                      {/* Message / Roast */}
                      <p className="mt-2 text-xs text-slate-300 italic leading-relaxed">
                        &ldquo;{item.message}&rdquo;
                      </p>
                    </div>

                    {/* Bottom row: Time stamp */}
                    <div className="mt-4 flex items-center justify-between border-t border-purple-500/20 pt-3 text-[11px] text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Sparkles size={11} className="text-amber-400" />
                        <span>Vice City Backer</span>
                      </span>
                      <span>{formatTime(item.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Carousel Arrows & Indicator Dots */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-between">
                  <button
                    onClick={handlePrev}
                    aria-label="Previous Page"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-pink-500/30 bg-purple-950/40 text-slate-200 hover:border-pink-500 hover:text-pink-400 transition-colors active:scale-95"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {/* Dots */}
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          sounds.playClick();
                          setCurrentPage(idx);
                        }}
                        aria-label={`Go to page ${idx + 1}`}
                        className={`h-2.5 rounded-full transition-all ${
                          currentPage === idx
                            ? 'w-8 bg-pink-500 shadow-[0_0_10px_rgba(255,0,127,0.8)]'
                            : 'w-2.5 bg-purple-950 hover:bg-purple-800'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleNext}
                    aria-label="Next Page"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-pink-500/30 bg-purple-950/40 text-slate-200 hover:border-pink-500 hover:text-pink-400 transition-colors active:scale-95"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};
