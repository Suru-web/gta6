'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Donation } from '@/types/donation';
import { X, Sparkles, Share2, Award, Heart, CheckCircle2 } from 'lucide-react';
import { sounds } from '@/lib/sounds';

interface ThankYouModalProps {
  isOpen: boolean;
  donation: Donation | null;
  onClose: () => void;
  onViewHallOfFame: () => void;
}

export const ThankYouModal: React.FC<ThankYouModalProps> = ({
  isOpen,
  donation,
  onClose,
  onViewHallOfFame,
}) => {
  useEffect(() => {
    if (isOpen) {
      sounds.playMissionPassed();

      // Launch multi-burst celebration confetti
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        colors: ['#ff007f', '#00f0ff', '#ffb703', '#ffffff', '#a855f7'],
      };

      function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }, [isOpen]);

  if (!isOpen || !donation) return null;

  // Custom praise based on amount
  let memeTier = {
    title: 'HONEST WORK HERO 🚜',
    quote: 'It ain’t much, but it’s honest work. Every single rupee is sacred!',
    memeAvatar: '🚜',
  };

  if (donation.amount >= 100) {
    memeTier = {
      title: 'THE ABSOLUTE GODFATHER OF LEONIDA 👑',
      quote: 'YOU ARE AN ABSOLUTE GOD! Leonardo DiCaprio is toasting his glass directly to you!',
      memeAvatar: '🥂',
    };
  } else if (donation.amount >= 69) {
    memeTier = {
      title: 'CERTIFIED MAN OF CULTURE 🕶️',
      quote: 'Nice. Your culture score is off the charts. Gigachad salute!',
      memeAvatar: '🕶️',
    };
  } else if (donation.amount >= 25) {
    memeTier = {
      title: 'GROVE STREET ROYALTY 🚲',
      quote: 'Carl Johnson and Tommy Vercetti both nod in utmost respect.',
      memeAvatar: '🤝',
    };
  }

  const shareText = encodeURIComponent(
    `I just funded ₹${donation.amount} to help a brother out to play GTA 6! 🌴🎮 Check it out and be a legend: ${
      typeof window !== 'undefined' ? window.location.href : 'https://gta6-help.vercel.app'
    }`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/[0.12] bg-[#120b22] p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center">
        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* GTA MISSION PASSED BANNER */}
        <div className="mx-auto inline-block rounded-xl border border-[#fca47a]/30 bg-[#fca47a]/10 px-5 py-2">
          <span className="font-bebas text-2xl sm:text-3xl font-extrabold tracking-widest text-[#fca47a] drop-shadow">
            ★ MISSION PASSED! RESPECT +99999 ★
          </span>
        </div>

        {/* Big Thank You Header */}
        <div className="mt-4">
          <div className="text-5xl sm:text-6xl mb-2 animate-bounce">
            {memeTier.memeAvatar}
          </div>
          <h2 className="font-bebas text-4xl sm:text-5xl uppercase tracking-wider text-white">
            THANK YOU, <span className="gta-gradient">{donation.name}</span>!
          </h2>
          <p className="font-bebas text-2xl text-[#fca47a] tracking-wide mt-1">
            YOU ARE ABSOLUTELY GREAT! 👑
          </p>
        </div>

        {/* Meme Quote Box */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#e86b97]/30 bg-[#e86b97]/15 px-2.5 py-0.5 text-xs font-semibold text-[#e86b97] mb-2">
            <Sparkles size={12} className="text-[#fca47a]" />
            {memeTier.title}
          </div>
          <p className="text-sm font-medium text-slate-200 italic">
            &ldquo;{memeTier.quote}&rdquo;
          </p>
        </div>

        {/* Donation Receipt Pill */}
        <div className="mt-5 flex items-center justify-around rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Contribution</span>
            <span className="font-bebas text-2xl font-bold text-[#fca47a]">₹{donation.amount}</span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Badge Earned</span>
            <span className="font-medium text-slate-200">{donation.badge}</span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
              <CheckCircle2 size={12} /> Live
            </span>
          </div>
        </div>

        {donation.message && (
          <div className="mt-3 text-xs text-slate-400 italic">
            Your note: &ldquo;{donation.message}&rdquo;
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onViewHallOfFame();
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e86b97] to-[#fca47a] hover:opacity-95 py-3 text-xs font-extrabold uppercase tracking-wider text-black transition-all active:scale-95"
          >
            <Award size={16} />
            <span>View My Card in Hall of Fame</span>
          </button>

          <a
            href={`https://twitter.com/intent/tweet?text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => sounds.playClick()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-200 hover:bg-white/10 transition-all active:scale-95"
          >
            <Share2 size={16} />
            <span>Flex on X</span>
          </a>
        </div>
      </div>
    </div>
  );
};
