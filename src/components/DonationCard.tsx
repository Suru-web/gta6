'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { SITE_CONFIG } from '@/config/site';
import { UpiConfig } from '@/types/donation';
import { Copy, Check, Smartphone, CheckCircle, ArrowRight } from 'lucide-react';
import { sounds } from '@/lib/sounds';

interface DonationCardProps {
  upiConfig: UpiConfig;
  onOpenPaymentModal: (selectedAmount: number) => void;
}

export const DonationCard: React.FC<DonationCardProps> = ({
  upiConfig,
  onOpenPaymentModal,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(69);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const activeAmount = isCustom
    ? Math.max(1, Math.min(100000, Number(customAmount) || 1))
    : selectedAmount;

  // Build standard UPI intent URI
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
    <section id="donate-section" className="relative px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-white/[0.08] bg-[#120b22]/90 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
          {/* Header */}
          <div className="text-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#fca47a] block">
              Direct Contribution // UPI Supported
            </span>
            <h2 className="mt-1 font-bebas text-3xl sm:text-4xl uppercase tracking-wider text-[#fdfbf7]">
              SELECT YOUR CONTRIBUTION
            </h2>
            <p className="mt-1 text-xs text-[#a19bb5]">
              Every single rupee directly funds the console hardware & steelbook pre-order.
            </p>
          </div>

          {/* Preset Contribution Chips */}
          <div className="mt-6 grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {SITE_CONFIG.suggestedAmounts.map((item, idx) => {
              const isSelected = !isCustom && selectedAmount === item.amount;
              const soundIdx = soundMap[idx] ?? (idx % 5);
              return (
                <button
                  key={item.amount}
                  onClick={() => handleSelectAmount(item.amount, soundIdx)}
                  className={`flex flex-col items-center justify-center rounded-2xl py-3 px-2 transition-all ${
                    isSelected
                      ? 'bg-[#fca47a] text-[#090514] font-bold shadow-md scale-[1.03]'
                      : 'border border-white/[0.08] bg-white/[0.03] text-[#fdfbf7] hover:border-white/20 hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="text-xl mb-0.5">{item.icon}</span>
                  <span className="font-bebas text-2xl font-bold tracking-wide leading-none">
                    ₹{item.amount}
                  </span>
                  <span
                    className={`text-[9px] uppercase font-bold tracking-wider truncate max-w-full mt-1 ${
                      isSelected ? 'text-[#090514]' : 'text-[#a19bb5]'
                    }`}
                  >
                    {item.tag}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Helper Amount Field */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/40 px-4 py-2.5 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-[#fdfbf7]">Custom amount:</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[#fca47a]">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={customAmount}
                  onChange={handleCustomChange}
                  placeholder="e.g. 250, 500, 1000+"
                  className="w-28 rounded-lg border border-white/20 bg-black/60 pl-6 pr-2 py-1 text-xs font-semibold text-[#fdfbf7] placeholder-[#6c637e] focus:border-[#fca47a] focus:outline-none"
                />
              </div>
              <span className="text-[11px] text-[#a19bb5]">
                (Any amount above ₹100 welcome)
              </span>
            </div>

            <div className="text-center sm:text-right font-medium text-xs text-[#fca47a] italic">
              {isCustom ? (
                activeAmount >= 10000 ? (
                  <span>🚀 Heist of the century: Console secured in one hit!</span>
                ) : activeAmount >= 1000 ? (
                  <span>👑 Vice City Godfather tier contribution!</span>
                ) : activeAmount > 100 ? (
                  <span>🐳 Ultra Whale status unlocked!</span>
                ) : (
                  <span>Custom contribution: ₹{activeAmount}</span>
                )
              ) : (
                currentOption && <span>{currentOption.meme}</span>
              )}
            </div>
          </div>

          {/* The QR Code & Payment Details */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6 rounded-2xl border border-white/[0.06] bg-[#0c0718] p-5 sm:p-6">
            {/* Scannable QR Code */}
            <div className="flex flex-col items-center shrink-0">
              <div className="rounded-2xl bg-white p-3 shadow-xl">
                {upiConfig.customQrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={upiConfig.customQrUrl}
                    alt="Custom UPI QR"
                    className="h-40 w-40 object-contain"
                  />
                ) : (
                  <QRCodeSVG
                    value={upiUrl}
                    size={160}
                    level="H"
                    includeMargin={false}
                  />
                )}
              </div>
              <span className="mt-2 text-[11px] font-semibold text-[#a19bb5]">
                Scan to pay <strong className="text-[#fdfbf7]">₹{activeAmount}</strong>
              </span>
            </div>

            {/* Details & Actions */}
            <div className="flex-1 space-y-3.5 text-center sm:text-left w-full">
              {/* UPI ID */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#a19bb5] block">
                  UPI ID (Click to Copy)
                </span>
                <div className="mt-1 flex items-center justify-center sm:justify-start gap-2">
                  <code className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 font-mono text-sm font-semibold text-[#fca47a]">
                    {upiConfig.upiId}
                  </code>
                  <button
                    onClick={handleCopyUpi}
                    className="inline-flex items-center gap-1 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[#fdfbf7] hover:border-white/30 transition-all active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check size={13} className="text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-1 text-[11px] text-[#a19bb5]">
                  Payee: <strong className="text-[#fdfbf7]">{upiConfig.payeeName}</strong>
                </div>
              </div>

              {/* Direct UPI Mobile Link */}
              <div>
                <a
                  href={upiUrl}
                  onClick={() => sounds.playCoin()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-[#fca47a] px-4 py-2.5 font-sans text-xs sm:text-sm font-bold text-[#090514] transition-all hover:bg-[#ffb78e] active:scale-95 shadow-md"
                >
                  <Smartphone size={15} />
                  <span>Open UPI App (Pay ₹{activeAmount})</span>
                </a>
              </div>

              {/* Post-Payment Claim Clout */}
              <div className="pt-2 border-t border-white/[0.06]">
                <button
                  onClick={() => {
                    sounds.playMissionPassed();
                    onOpenPaymentModal(activeAmount);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e86b97] to-[#c084fc] px-4 py-3 font-sans text-xs sm:text-sm font-bold tracking-wide text-white transition-all hover:opacity-95 active:scale-95 shadow-md"
                >
                  <CheckCircle size={15} />
                  <span>I Paid! Put Me on the Wall of Legends</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
