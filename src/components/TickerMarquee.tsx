'use client';

import React from 'react';
import { Donation } from '@/types/donation';
import { Sparkles } from 'lucide-react';

interface TickerMarqueeProps {
  donations: Donation[];
}

export const TickerMarquee: React.FC<TickerMarqueeProps> = ({ donations }) => {
  if (!donations || donations.length === 0) return null;

  // Duplicate items to ensure smooth infinite loop
  const displayItems = [...donations, ...donations];

  return (
    <div className="relative w-full overflow-hidden border-b border-[#e86b97]/20 bg-[#160e29] py-2">
      {/* Side gradient masks for smooth fade */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-[#110b20] to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-[#110b20] to-transparent" />

      <div className="animate-marquee flex items-center gap-6 text-xs">
        {displayItems.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className="inline-flex items-center gap-2 rounded-full border border-[#e86b97]/30 bg-[#251842]/80 px-3 py-1 shadow-sm whitespace-nowrap"
          >
            <span className="text-sm">{item.badge.split(' ')[0] || '👑'}</span>
            <span className="font-semibold text-slate-200">{item.name}</span>
            <span className="font-bold text-[#fca47a]">₹{item.amount}</span>
            {item.message && (
              <span className="text-slate-300 max-w-[200px] truncate italic">
                &ldquo;{item.message}&rdquo;
              </span>
            )}
            <Sparkles size={11} className="text-[#fca47a] opacity-70" />
          </div>
        ))}
      </div>
    </div>
  );
};
