'use client';

import React, { useState, useEffect } from 'react';
import { Donation } from '@/types/donation';
import { Trophy, Flame, Clock, Sparkles } from 'lucide-react';
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
    <section id="hall-of-fame" className="relative px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b-2 border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-yellow-400" />
              <h2 className="font-bebas text-3xl sm:text-4xl uppercase tracking-wider text-white">
                WALL OF LEGENDS ({donations.length})
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Who paid how much for the cause. Inscribed in Vice City forever.
            </p>
          </div>

          {/* Simple Tabs */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('all');
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-black uppercase transition-all ${
                activeTab === 'all'
                  ? 'bg-pink-500 text-white brutal-shadow-white'
                  : 'bg-purple-950/40 text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('top');
              }}
              className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-black uppercase transition-all ${
                activeTab === 'top'
                  ? 'bg-yellow-400 text-black brutal-shadow-white'
                  : 'bg-purple-950/40 text-slate-400 hover:text-white'
              }`}
            >
              <Flame size={12} />
              <span>Top Chads</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('recent');
              }}
              className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-black uppercase transition-all ${
                activeTab === 'recent'
                  ? 'bg-cyan-400 text-black brutal-shadow-white'
                  : 'bg-purple-950/40 text-slate-400 hover:text-white'
              }`}
            >
              <Clock size={12} />
              <span>Recent</span>
            </button>
          </div>
        </div>

        {/* The Grid of Donor Cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {displayed.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border-2 border-white/10 bg-[#140b2b] p-4 transition-transform hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    {item.badge}
                  </span>
                  <span className="font-bebas text-2xl font-black text-emerald-400">
                    ₹{item.amount}
                  </span>
                </div>

                <h3 className="mt-2 font-bebas text-xl font-bold tracking-wide text-white">
                  {item.name}
                </h3>

                <p className="mt-1 text-xs text-slate-300 italic line-clamp-2">
                  &ldquo;{item.message}&rdquo;
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-slate-500 font-semibold">
                <span>Vice City Backer</span>
                <span>{formatTime(item.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* View More / View Less */}
        {filtered.length > 6 && (
          <div className="mt-5 text-center">
            <button
              onClick={() => {
                sounds.playClick();
                setShowAll(!showAll);
              }}
              className="rounded-xl border-2 border-white/20 bg-purple-950/40 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-200 hover:border-pink-500 hover:text-pink-400 transition-colors"
            >
              {showAll ? '▲ Show Less' : `▼ View All ${filtered.length} Legends`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
