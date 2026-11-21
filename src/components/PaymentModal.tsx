'use client';

import React, { useState } from 'react';
import { X, Send, Sparkles, ShieldCheck } from 'lucide-react';
import { SITE_CONFIG } from '@/config/site';
import { Donation } from '@/types/donation';
import { sounds } from '@/lib/sounds';

interface PaymentModalProps {
  isOpen: boolean;
  initialAmount: number;
  onClose: () => void;
  onSuccess: (newDonation: Donation) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  initialAmount,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(initialAmount || 69);
  const [message, setMessage] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('👑 Gigachad');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'Anonymous Legend',
          amount: Math.max(1, Number(amount) || 1),
          message: message.trim() || 'Respect +1 for the GTA 6 fund! 🎮',
          badge: selectedBadge,
        }),
      });

      const data = await res.json();
      if (data.success && data.donation) {
        // Also save to client localStorage so it's always preserved on their device
        try {
          const localSaved = JSON.parse(localStorage.getItem('my_gta6_donations') || '[]');
          localStorage.setItem('my_gta6_donations', JSON.stringify([data.donation, ...localSaved]));
        } catch {
          // ignore localStorage error
        }

        onSuccess(data.donation);
      } else {
        setErrorMsg(data.error || 'Failed to record donation. Please try again.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      // Fallback: create client-side donation object if offline
      const fallbackDonation: Donation = {
        id: `offline-${Date.now()}`,
        name: name.trim() || 'Anonymous Legend',
        amount: Math.max(1, Number(amount) || 1),
        message: message.trim() || 'Respect +1 for the GTA 6 fund! 🎮',
        badge: selectedBadge,
        timestamp: Date.now(),
      };
      onSuccess(fallbackDonation);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/[0.12] bg-[#120b22] p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
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

        {/* Modal Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#fca47a]/30 bg-[#fca47a]/10 px-3 py-1 text-xs font-semibold text-[#fca47a]">
            <Sparkles size={13} className="text-[#fca47a]" />
            <span>CONFIRM SPONSORSHIP</span>
          </div>
          <h3 className="mt-3 font-bebas text-3xl sm:text-4xl uppercase tracking-wider text-white">
            RECORD YOUR IMMORTALITY
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Tell us who you are so your name joins the live ticker and Wall of Legends.
          </p>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* The Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Name Field (Optional) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Your Name / Alias <span className="text-[#e86b97] font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tommy Vercetti, Sharmaji, LuciaFan69"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#e86b97] focus:ring-1 focus:ring-[#e86b97] focus:outline-none transition-colors"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Leave empty to display as &ldquo;Anonymous Legend&rdquo;</span>
          </div>

          {/* Amount Paid */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Amount Contributed (₹)
            </label>
            <div className="relative mt-1.5">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#e86b97]">₹</span>
              <input
                type="number"
                min="1"
                max="100000"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-8 pr-4 py-2.5 text-sm font-bold text-white focus:border-[#e86b97] focus:ring-1 focus:ring-[#e86b97] focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Badge Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Choose Honor Badge
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SITE_CONFIG.badges.map((b) => {
                const isSelected = selectedBadge === b.label;
                return (
                  <button
                    type="button"
                    key={b.id}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedBadge(b.label);
                    }}
                    className={`rounded-xl border p-2 text-xs font-medium transition-all text-left ${
                      isSelected
                        ? 'border-[#e86b97] bg-[#e86b97]/15 text-white'
                        : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-slate-200'
                    }`}
                  >
                    <span>{b.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message / Roast */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Message or Advice <span className="text-[#e86b97] font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              maxLength={150}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Don't crash the helicopter, get the steelbook bro!"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#e86b97] focus:ring-1 focus:ring-[#e86b97] focus:outline-none transition-colors"
            />
          </div>

          {/* Trust Banner */}
          <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-[11px] text-slate-400">
            <ShieldCheck size={16} className="text-[#fca47a] shrink-0" />
            <span>Honesty policy: Instantly adds your name to the community board. Rockstar salutes you!</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e86b97] to-[#fca47a] py-3.5 font-sans text-xs font-extrabold uppercase tracking-wider text-black shadow-lg hover:opacity-95 active:scale-[0.99] disabled:opacity-50 transition-all"
          >
            <Send size={15} />
            <span>{isSubmitting ? 'Recording Legend...' : 'Claim My Glory 👑'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
