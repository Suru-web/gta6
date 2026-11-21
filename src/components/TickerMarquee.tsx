'use client';

import React from 'react';
import { Donation } from '@/types/donation';

interface TickerMarqueeProps {
  donations: Donation[];
}

export const TickerMarquee: React.FC<TickerMarqueeProps> = ({ donations }) => {
  if (!donations || donations.length === 0) return null;

  // Duplicate for smooth loop
  const displayItems = [...donations, ...donations];

  return (
    <div className="relative w-full overflow-hidden border-b border-white/[0.06] bg-[#0c071a]/90 py-2.5">
      {/* Side Vignette Fades */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-[#090514] to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-[#090514] to-transparent" />

      <div className="animate-marquee flex items-center gap-8 text-xs">
        {displayItems.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className="inline-flex items-center gap-2.5 whitespace-nowrap text-[#a19bb5]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#e86b97] shrink-0" />
            <span className="font-semibold text-[#fdfbf7]">{item.name}</span>
            <span className="font-bebas text-sm font-bold text-[#fca47a] tracking-wider">
              ₹{item.amount}
            </span>
            {item.message && (
              <span className="text-[#847b98] italic font-normal max-w-[260px] truncate">
                &ldquo;{item.message}&rdquo;
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
