'use client';

import React, { useState, useEffect } from 'react';
import { Donation } from '@/types/donation';
import { Trophy, Flame, Clock } from 'lucide-react';
import { sounds } from '@/lib/sounds';

interface DonorsCarouselProps {
  donations: Donation[];
}

export const DonorsCarousel: React.FC<DonorsCarouselProps> = ({ donations }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'top' | 'recent'>('all');
  const [showAll, setShowAll] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const getFiltered = () => {
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

  const filtered = getFiltered();
  const displayed = showAll ? filtered : filtered.slice(0, 6);

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
    <section id="hall-of-fame" className="relative px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-[#fca47a]" />
              <h2 className="font-bebas text-3xl sm:text-4xl uppercase tracking-wider text-[#fdfbf7]">
                WALL OF LEGENDS ({donations.length})
              </h2>
            </div>
            <p className="text-xs text-[#a19bb5] mt-0.5">
              Every patron is permanently inscribed in the Vice City archives.
            </p>
          </div>

          {/* Clean Segmented Tabs */}
          <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('all');
              }}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-white/[0.12] text-[#fdfbf7]'
                  : 'text-[#a19bb5] hover:text-[#fdfbf7]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('top');
              }}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === 'top'
                  ? 'bg-white/[0.12] text-[#fca47a]'
                  : 'text-[#a19bb5] hover:text-[#fdfbf7]'
              }`}
            >
              <Flame size={12} />
              <span>Top</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('recent');
              }}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                activeTab === 'recent'
                  ? 'bg-white/[0.12] text-[#e86b97]'
                  : 'text-[#a19bb5] hover:text-[#fdfbf7]'
              }`}
            >
              <Clock size={12} />
              <span>Recent</span>
            </button>
          </div>
        </div>

        {/* The Grid of Donor Cards */}
        {displayed.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#120b22]/50 p-8 text-center backdrop-blur-xl">
            <span className="text-3xl block mb-2">🌴</span>
            <h3 className="font-bebas text-2xl uppercase tracking-wider text-[#fdfbf7]">
              NO BACKERS YET — BE THE FIRST LEGEND
            </h3>
            <p className="mt-1 text-xs text-[#a19bb5] max-w-sm mx-auto">
              The Wall of Legends is clean and ready. Contribute any amount to join the archives!
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {displayed.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-white/[0.06] bg-[#120b22]/70 p-4 transition-all hover:border-white/[0.15] backdrop-blur-xl"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#a19bb5]">
                      {item.badge}
                    </span>
                    <span className="font-bebas text-xl font-bold text-[#fca47a]">
                      ₹{item.amount}
                    </span>
                  </div>

                  <h3 className="mt-2 font-bebas text-xl font-bold tracking-wide text-[#fdfbf7]">
                    {item.name}
                  </h3>

                  <p className="mt-1 text-xs text-[#a19bb5] italic line-clamp-2">
                    &ldquo;{item.message}&rdquo;
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/[0.05] pt-2 text-[10px] text-[#6c637e]">
                  <span>Vice City Backer</span>
                  <span>{formatTime(item.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View More / View Less */}
        {filtered.length > 6 && (
          <div className="mt-5 text-center">
            <button
              onClick={() => {
                sounds.playClick();
                setShowAll(!showAll);
              }}
              className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-[#a19bb5] hover:border-white/20 hover:text-[#fdfbf7] transition-all"
            >
              {showAll ? 'Show Fewer' : `View All ${filtered.length} Backers`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
