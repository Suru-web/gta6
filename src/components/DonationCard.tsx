'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { SITE_CONFIG } from '@/config/site';
import { UpiConfig } from '@/types/donation';
import { Copy, Check, Smartphone, Heart } from 'lucide-react';
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

  const activeAmount = isCustom
    ? Math.max(1, Math.min(100000, Number(customAmount) || 1))
    : selectedAmount;

  // Build UPI intent link
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiConfig.upiId)}&pn=${encodeURIComponent(
    upiConfig.payeeName
  )}&am=${activeAmount}&cu=INR&tn=${encodeURIComponent(`GTA6 Fund - ₹${activeAmount}`)}`;

  const handleCopyUpi = () => {
    sounds.playClick();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(upiConfig.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const soundMap = [4, 2, 3, 1, 0, 0];

  const handleSelectAmount = (amt: number, soundIdx?: number) => {
    sounds.playDonateSound(soundIdx);
    setIsCustom(false);
    setSelectedAmount(amt);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsCustom(true);
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(val);
    if (val) {
      sounds.playDonateSound();
    }
  };

  const currentOption = SITE_CONFIG.suggestedAmounts.find((a) => a.amount === activeAmount);

  return (
    <section id="donate-section" className="relative px-4 py-3 sm:py-4">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border-2 border-[#fca47a] bg-[#1a1030]/95 p-4 sm:p-7 brutal-shadow-peach backdrop-blur-md">
          {/* Card Header */}
          <div className="text-center">
            <span className="rounded-md bg-[#e86b97] px-3 py-0.5 font-sans text-xs font-black uppercase text-white tracking-wider">
              DONATE VIA UPI • ₹1, ₹100, OR ANY CUSTOM AMOUNT
            </span>
            <h2 className="mt-1 font-bebas text-3xl sm:text-4xl uppercase tracking-wider text-white">
              SELECT YOUR SACRIFICE & SCAN
            </h2>
          </div>

          {/* Amount Selector Buttons */}
          <div className="mt-6 grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {SITE_CONFIG.suggestedAmounts.map((item, idx) => {
              const isSelected = !isCustom && selectedAmount === item.amount;
              const soundIdx = soundMap[idx] ?? (idx % 5);
              return (
                <button
                  key={item.amount}
                  onClick={() => handleSelectAmount(item.amount, soundIdx)}
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3 transition-all ${
                    isSelected
                      ? 'border-[#fca47a] bg-[#fca47a] text-black brutal-shadow-rose scale-105'
                      : 'border-white/10 bg-[#251842]/60 text-slate-200 hover:border-[#e86b97] hover:bg-[#251842]'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-bebas text-2xl font-black tracking-wide leading-none mt-1">
                    ₹{item.amount}
                  </span>
                  <span
                    className={`text-[9px] uppercase font-bold tracking-wider truncate max-w-full ${
                      isSelected ? 'text-black' : 'text-[#fca47a]'
                    }`}
                  >
                    {item.tag}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Amount for generous helpers (₹1 to any amount > 100) */}
          <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-2 rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-200">Custom Helper Amount:</span>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-[#fca47a]">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={customAmount}
                  onChange={handleCustomChange}
                  placeholder="e.g. 250, 500, 1000+"
                  className="w-28 rounded-lg border border-[#fca47a]/50 bg-black/70 pl-6 pr-2 py-1 text-xs font-bold text-white placeholder-slate-500 focus:border-[#fca47a] focus:outline-none"
                />
              </div>
              <span className="text-[11px] text-[#fca47a] font-medium">
                (Donate any random amount above 100!)
              </span>
            </div>

            <div className="text-center sm:text-right font-bold text-xs italic">
              {isCustom ? (
                activeAmount >= 10000 ? (
                  <span className="text-amber-300 animate-pulse">
                    🚀 HEIST OF THE CENTURY: Bro is literally buying the entire PS5!
                  </span>
                ) : activeAmount >= 1000 ? (
                  <span className="text-[#fca47a]">
                    👑 VICE CITY GODFATHER: Lucia & Jason salute your infinite generosity!
                  </span>
                ) : activeAmount > 100 ? (
                  <span className="text-[#fca47a]">
                    🐳 ULTRA WHALE TIER: Above and beyond ₹100! Respect +99999!
                  </span>
                ) : (
                  <span className="text-slate-300">
                    Custom sacrifice of ₹{activeAmount} prepared!
                  </span>
                )
              ) : (
                currentOption && (
                  <span className="text-[#fca47a]">
                    {currentOption.meme}
                  </span>
                )
              )}
            </div>
          </div>

          {/* THE CLEAN QR CODE & PAYMENT SECTION */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6 rounded-2xl border-2 border-white/10 bg-[#110b20] p-5 sm:p-6">
            {/* The QR Container */}
            <div className="flex flex-col items-center shrink-0">
              <div className="rounded-2xl border-2 border-[#e86b97] bg-white p-3 brutal-shadow-rose">
                {upiConfig.customQrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={upiConfig.customQrUrl}
                    alt="Custom UPI QR"
                    className="h-44 w-44 object-contain"
                  />
                ) : (
                  <QRCodeSVG
                    value={upiUrl}
                    size={176}
                    level="H"
                    includeMargin={false}
                  />
                )}
              </div>
              <div className="mt-2 text-center">
                <span className="inline-block rounded-full bg-[#251842] px-2.5 py-0.5 text-[11px] font-bold text-[#fca47a] border border-[#fca47a]/40">
                  Scan to Pay ₹{activeAmount}
                </span>
              </div>
            </div>

            {/* Details & Actions */}
            <div className="flex-1 space-y-3.5 text-center sm:text-left w-full">
              {/* UPI ID */}
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 block">
                  UPI ID (Click to Copy)
                </span>
                <div className="mt-1 flex items-center justify-center sm:justify-start gap-2">
                  <code className="rounded-xl border border-white/20 bg-[#251842] px-3 py-1.5 font-mono text-sm sm:text-base font-bold text-[#fca47a]">
                    {upiConfig.upiId}
                  </code>
                  <button
                    onClick={handleCopyUpi}
                    className="inline-flex items-center gap-1 rounded-xl border-2 border-[#e86b97] bg-[#e86b97]/20 px-3 py-1.5 text-xs font-black text-[#e86b97] hover:bg-[#e86b97] hover:text-white transition-all"
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
                <div className="mt-1 text-[11px] text-slate-400">
                  Payee: <strong className="text-slate-200">{upiConfig.payeeName}</strong>
                  {' • '}
                  <button onClick={onOpenSettings} className="text-[#fca47a] hover:underline">
                    Edit UPI / Upload QR
                  </button>
                </div>
              </div>

              {/* Direct UPI Mobile Link */}
              <div>
                <a
                  href={upiUrl}
                  onClick={() => sounds.playCoin()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#fca47a] bg-[#fca47a] px-5 py-2.5 font-sans text-xs sm:text-sm font-black uppercase text-black brutal-shadow-white transition-all active:scale-95 hover:bg-[#ffb78e]"
                >
                  <Smartphone size={16} />
                  <span>Open UPI App (Pay ₹{activeAmount})</span>
                </a>
              </div>

              {/* THE "I PAID" BUTTON */}
              <div className="pt-2 border-t border-white/10">
                <button
                  onClick={() => {
                    sounds.playMissionPassed();
                    onOpenPaymentModal(activeAmount);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#e86b97] bg-gradient-to-r from-[#e86b97] via-[#d95886] to-[#c52233] px-5 py-3 font-sans text-xs sm:text-sm font-black uppercase tracking-wider text-white brutal-shadow-peach transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Heart size={16} className="fill-white" />
                  <span>I Paid! Put Me on the Wall of Legends 🚀</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
