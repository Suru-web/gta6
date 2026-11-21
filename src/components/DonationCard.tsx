'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { SITE_CONFIG } from '@/config/site';
import { UpiConfig } from '@/types/donation';
import { Copy, Check, QrCode, Smartphone, Sparkles, Heart } from 'lucide-react';
import { sounds } from '@/lib/sounds';

interface DonationCardProps {
  upiConfig: UpiConfig;
  onOpenPaymentModal: (selectedAmount: number) => void;
  onOpenSettings: () => void;
}

export const DonationCard: React.FC<DonationCardProps> = ({
  upiConfig,
  onOpenPaymentModal,
  onOpenSettings,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(69);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const activeAmount = isCustom ? Math.max(1, Math.min(100, Number(customAmount) || 1)) : selectedAmount;

  // Build standard UPI intent string
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiConfig.upiId)}&pn=${encodeURIComponent(
    upiConfig.payeeName
  )}&am=${activeAmount}&cu=INR&tn=${encodeURIComponent(
    `GTA6 Fund - ₹${activeAmount}`
  )}`;

  const handleCopyUpi = () => {
    sounds.playClick();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(upiConfig.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSelectAmount = (amt: number) => {
    sounds.playCoin();
    setIsCustom(false);
    setSelectedAmount(amt);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsCustom(true);
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(val);
  };

  const currentOption = SITE_CONFIG.suggestedAmounts.find((a) => a.amount === activeAmount);

  return (
    <section id="donate-section" className="relative py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-3xl border border-pink-500/40 bg-gradient-to-b from-[#180a33] to-[#0d051c] p-6 sm:p-10 backdrop-blur-2xl shadow-[0_0_50px_rgba(255,0,127,0.15)]">
          {/* Card Header */}
          <div className="text-center">
            <span className="font-bebas text-xs tracking-widest text-cyan-400 font-bold uppercase">
              Step 1: Choose Your Amount & Scan UPI
            </span>
            <h2 className="mt-1 font-bebas text-4xl sm:text-5xl uppercase tracking-wider text-white">
              SELECT YOUR DONATION (₹1 TO ₹100)
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Every single rupee directly fuels the PS5 & GTA VI Steelbook fund.
            </p>
          </div>

          {/* Amount Selector Chips */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {SITE_CONFIG.suggestedAmounts.map((item) => {
              const isSelected = !isCustom && selectedAmount === item.amount;
              return (
                <button
                  key={item.amount}
                  onClick={() => handleSelectAmount(item.amount)}
                  className={`relative flex flex-col items-center justify-center rounded-2xl border p-3.5 transition-all ${
                    isSelected
                      ? 'border-pink-500 bg-pink-950/60 shadow-[0_0_20px_rgba(255,0,127,0.4)] scale-105'
                      : 'border-purple-500/20 bg-purple-950/20 hover:border-pink-500/40 hover:bg-purple-900/30 text-slate-300'
                  }`}
                >
                  <span className="text-2xl mb-1">{item.icon}</span>
                  <span className="font-bebas text-2xl font-bold tracking-wider text-white">
                    ₹{item.amount}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-pink-400">
                    {item.tag}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Amount Field (₹1 - ₹100) */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-purple-500/20 bg-purple-950/30 p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-300">Or type custom amount:</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-pink-400">₹</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={customAmount}
                  onChange={handleCustomChange}
                  placeholder="e.g. 42"
                  className="w-28 rounded-lg border border-pink-500/40 bg-black/40 pl-7 pr-3 py-1.5 text-sm font-bold text-white placeholder-slate-500 focus:border-pink-400 focus:outline-none"
                />
              </div>
              <span className="text-xs text-slate-400">(Max ₹100 as requested)</span>
            </div>

            {/* Current Tier Perk / Meme */}
            {currentOption && (
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <Sparkles size={14} />
                <span className="font-medium italic">{currentOption.meme}</span>
              </div>
            )}
          </div>

          {/* DYNAMIC QR CODE & UPI SECTION */}
          <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-8 rounded-2xl border border-pink-500/30 bg-[#0e061f] p-6 sm:p-8">
            {/* The QR Container */}
            <div className="flex flex-col items-center">
              <div className="relative rounded-2xl border-2 border-pink-500/60 bg-white p-4 shadow-[0_0_30px_rgba(255,0,127,0.3)]">
                {upiConfig.customQrUrl ? (
                  // Custom uploaded QR code
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={upiConfig.customQrUrl}
                    alt="Custom UPI QR Code"
                    className="h-48 w-48 object-contain"
                  />
                ) : (
                  // Dynamic UPI QR with amount prefilled
                  <QRCodeSVG
                    value={upiUrl}
                    size={192}
                    level="H"
                    includeMargin={false}
                    imageSettings={{
                      src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ff007f'><path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/></svg>",
                      x: undefined,
                      y: undefined,
                      height: 32,
                      width: 32,
                      excavate: true,
                    }}
                  />
                )}
              </div>

              {/* Amount badge on QR */}
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-pink-500/40 bg-pink-950/60 px-3 py-1 text-xs font-bold text-pink-300">
                <QrCode size={13} />
                <span>Scan with GPay / PhonePe / Paytm: ₹{activeAmount}</span>
              </div>
            </div>

            {/* Payment Details & Buttons */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 block">
                  UPI ID (Click to Copy)
                </span>
                <div className="mt-1 flex items-center justify-center md:justify-start gap-2">
                  <code className="rounded-lg border border-purple-500/30 bg-purple-950/40 px-3 py-1.5 font-mono text-sm sm:text-base font-bold text-cyan-300">
                    {upiConfig.upiId}
                  </code>
                  <button
                    onClick={handleCopyUpi}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-pink-500/40 bg-pink-950/40 px-3 py-1.5 text-xs font-semibold text-pink-300 hover:bg-pink-900/60 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-1 flex items-center justify-center md:justify-start gap-2 text-xs text-slate-400">
                  <span>Payee: <strong className="text-slate-200">{upiConfig.payeeName}</strong></span>
                  <span>•</span>
                  <button
                    onClick={onOpenSettings}
                    className="text-pink-400 hover:underline"
                  >
                    Change UPI ID / QR
                  </button>
                </div>
              </div>

              {/* Direct UPI Intent Link for Mobile */}
              <div>
                <a
                  href={upiUrl}
                  onClick={() => sounds.playCoin()}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-cyan-400/50 bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 font-sans text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all hover:scale-102 hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] active:scale-95"
                >
                  <Smartphone size={18} />
                  <span>Open UPI App (Pay ₹{activeAmount})</span>
                </a>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Directly launches Google Pay, PhonePe, Paytm, or BHIM on your device.
                </p>
              </div>

              {/* THE "I HAVE PAID" TRIGGER BUTTON */}
              <div className="pt-2 border-t border-purple-500/20">
                <button
                  onClick={() => {
                    sounds.playMissionPassed();
                    onOpenPaymentModal(activeAmount);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 px-6 py-3.5 font-sans text-sm font-black uppercase tracking-wider text-white shadow-[0_0_30px_rgba(255,0,127,0.5)] transition-all hover:scale-102 hover:shadow-[0_0_40px_rgba(255,0,127,0.7)] active:scale-95 animate-pulse"
                >
                  <Heart size={18} className="fill-white" />
                  <span>I Paid! Claim My Clout on Hall of Fame 🚀</span>
                </button>
                <p className="mt-1 text-center md:text-left text-[11px] text-pink-300/80">
                  Paid? Click above to enter your name (optional) and get your thank-you meme!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
