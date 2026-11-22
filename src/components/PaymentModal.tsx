'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, Sparkles, ShieldCheck, Upload, Image as ImageIcon, AlertTriangle, Smartphone, Coffee } from 'lucide-react';
import { SITE_CONFIG, getBadgeForAmount } from '@/config/site';
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
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'buymeacoffee'>('upi');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(initialAmount || 1);
  const [message, setMessage] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [screenshotName, setScreenshotName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync amount when initialAmount changes
  useEffect(() => {
    if (initialAmount) {
      setAmount(initialAmount);
    }
  }, [initialAmount]);

  if (!isOpen) return null;

  const autoBadge = getBadgeForAmount(amount);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, or WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size should be under 5MB');
      return;
    }

    setScreenshotName(file.name);
    setErrorMsg('');

    // Read and compress image client-side to keep payload lightweight
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL('image/jpeg', 0.75);
          setScreenshotUrl(compressed);
        } else {
          setScreenshotUrl(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUtr = utrNumber.trim();
    if (paymentMethod === 'upi') {
      if (!cleanUtr || cleanUtr.length !== 12 || !/^\d{12}$/.test(cleanUtr)) {
        setErrorMsg('Please enter a valid 12-digit numeric UPI Transaction ID (UTR) from your receipt.');
        return;
      }
    } else {
      if (cleanUtr && !/^[A-Za-z0-9\-_#]{3,35}$/.test(cleanUtr)) {
        setErrorMsg('Please enter a valid Buy Me a Coffee name or order reference (alphanumeric).');
        return;
      }
    }

    const finalRef = cleanUtr || (paymentMethod === 'buymeacoffee' ? `BMC-${Date.now().toString(36).toUpperCase()}` : undefined);

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'Anonymous Legend',
          amount: Math.max(1, Number(amount) || 1),
          message: message.trim() || (paymentMethod === 'buymeacoffee' ? 'International Coffee sent! ☕🎮' : 'Respect +1 for the GTA 6 fund! 🎮'),
          badge: autoBadge,
          utrNumber: finalRef,
          screenshotUrl,
        }),
      });

      const data = await res.json();
      if (data.success && data.donation) {
        onSuccess(data.donation);
      } else {
        setErrorMsg(data.error || 'Failed to record donation. Please check your transaction details.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setErrorMsg('Network error. Please try again.');
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
          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Payment Source
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition-all ${
                  paymentMethod === 'upi'
                    ? 'bg-[#fca47a] text-black shadow-md'
                    : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'
                }`}
              >
                <Smartphone size={13} />
                <span>UPI (India)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('buymeacoffee')}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition-all ${
                  paymentMethod === 'buymeacoffee'
                    ? 'bg-[#ffdd00] text-black shadow-md'
                    : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'
                }`}
              >
                <Coffee size={13} />
                <span>Buy Me a Coffee</span>
              </button>
            </div>
          </div>

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
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Amount Contributed {paymentMethod === 'upi' ? '(₹)' : '(₹ Equivalent, e.g. $1 ≈ ₹85)'}
              </label>
            </div>
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

          {/* Auto-Assigned Honor Badge */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#fca47a]" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Unlocked Honor Badge
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Auto-assigned based on your ₹{amount || 0} contribution
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#e86b97]/50 bg-[#e86b97]/20 px-3.5 py-1.5 text-xs font-black text-[#fca47a] shadow-md animate-in fade-in">
              <span>{autoBadge}</span>
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

          {/* Reference / UTR Number */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                {paymentMethod === 'upi' ? 'UPI Reference / UTR Number' : 'Buy Me a Coffee Name / Order ID'}{' '}
                <span className={paymentMethod === 'upi' ? 'text-[#fca47a] font-bold' : 'text-slate-400 font-normal lowercase'}>
                  {paymentMethod === 'upi' ? '*' : '(optional)'}
                </span>
              </label>
              <span className="text-[10px] text-slate-500">
                {paymentMethod === 'upi' ? '12 Digits Required' : 'Order or Supporter Name'}
              </span>
            </div>
            <input
              type="text"
              maxLength={paymentMethod === 'upi' ? 12 : 35}
              required={paymentMethod === 'upi'}
              value={utrNumber}
              onChange={(e) => {
                if (paymentMethod === 'upi') {
                  setUtrNumber(e.target.value.replace(/[^0-9]/g, ''));
                } else {
                  setUtrNumber(e.target.value);
                }
              }}
              placeholder={paymentMethod === 'upi' ? 'e.g. 432109876543 (from receipt)' : 'e.g. BMC-9821 or Supporter Name'}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-mono tracking-wider text-[#fca47a] placeholder-slate-600 focus:border-[#fca47a] focus:ring-1 focus:ring-[#fca47a] focus:outline-none transition-colors"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              {paymentMethod === 'upi'
                ? 'Found on your Google Pay / PhonePe / Paytm payment screen.'
                : 'Enter your Buy Me a Coffee supporter name or order ID from email receipt.'}
            </span>
          </div>

          {/* Screenshot Upload (Proof of Payment) */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Payment Screenshot / Receipt <span className="text-[#a19bb5] font-normal lowercase">(optional)</span>
              </label>
              {screenshotUrl && <span className="text-[10px] text-emerald-400 font-semibold">✓ Attached</span>}
            </div>

            <div className="mt-1.5 flex items-center gap-3">
              <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.03] px-4 py-3 text-xs font-semibold text-slate-300 hover:border-[#e86b97] hover:bg-white/[0.06] transition-all">
                <Upload size={15} className="text-[#e86b97]" />
                <span className="truncate max-w-[200px]">
                  {screenshotName ? screenshotName : 'Upload UPI Screenshot (Optional)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="hidden"
                />
              </label>

              {screenshotUrl && (
                <div className="relative h-12 w-12 rounded-lg border border-white/20 overflow-hidden shrink-0 bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={screenshotUrl} alt="Receipt preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Screenshots verify authentic payments and block fake/troll entries.
            </span>
          </div>

          {/* Trust Banner */}
          <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-[11px] text-slate-400">
            <ShieldCheck size={16} className="text-[#fca47a] shrink-0" />
            <span>Verified entries join the live Wall of Legends and broadcast feed.</span>
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
