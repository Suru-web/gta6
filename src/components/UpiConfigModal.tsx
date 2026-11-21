'use client';

import React, { useState } from 'react';
import { X, Save, RotateCcw, Upload, QrCode, Sparkles } from 'lucide-react';
import { UpiConfig } from '@/types/donation';
import { SITE_CONFIG } from '@/config/site';
import { sounds } from '@/lib/sounds';

interface UpiConfigModalProps {
  isOpen: boolean;
  currentConfig: UpiConfig;
  onClose: () => void;
  onSave: (newConfig: UpiConfig) => void;
}

export const UpiConfigModal: React.FC<UpiConfigModalProps> = ({
  isOpen,
  currentConfig,
  onClose,
  onSave,
}) => {
  const [upiId, setUpiId] = useState(currentConfig.upiId);
  const [payeeName, setPayeeName] = useState(currentConfig.payeeName);
  const [customQrUrl, setCustomQrUrl] = useState<string | undefined>(currentConfig.customQrUrl);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomQrUrl(reader.result as string);
        sounds.playCoin();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playMissionPassed();
    onSave({
      upiId: upiId.trim() || SITE_CONFIG.defaultUpiId,
      payeeName: payeeName.trim() || SITE_CONFIG.defaultPayeeName,
      note: SITE_CONFIG.defaultNote,
      customQrUrl: customQrUrl || undefined,
    });
    onClose();
  };

  const handleReset = () => {
    sounds.playClick();
    setUpiId(SITE_CONFIG.defaultUpiId);
    setPayeeName(SITE_CONFIG.defaultPayeeName);
    setCustomQrUrl(undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl border border-cyan-500/50 bg-[#12082b] p-6 sm:p-8 shadow-[0_0_50px_rgba(0,240,255,0.25)] animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-300">
            <QrCode size={14} />
            <span>UPI SETTINGS</span>
          </div>
          <h3 className="mt-2 font-bebas text-3xl uppercase tracking-wider text-white">
            CONFIGURE YOUR PAYMENT QR
          </h3>
          <p className="mt-1 text-xs text-slate-300">
            Enter your real UPI ID or upload your static UPI QR code image.
          </p>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Your Real UPI ID
            </label>
            <input
              type="text"
              required
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
              className="mt-1 w-full rounded-xl border border-cyan-500/40 bg-black/40 px-4 py-2.5 text-sm text-cyan-300 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Payee Name
            </label>
            <input
              type="text"
              required
              value={payeeName}
              onChange={(e) => setPayeeName(e.target.value)}
              placeholder="e.g. Suraj (GTA 6 Fund)"
              className="mt-1 w-full rounded-xl border border-cyan-500/40 bg-black/40 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Upload Static QR Code */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Upload Custom UPI QR Image (Optional)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-pink-500/40 bg-pink-950/20 px-4 py-3 text-xs font-semibold text-pink-300 hover:bg-pink-900/30 transition-colors">
                <Upload size={16} />
                <span>{customQrUrl ? 'Change Image' : 'Select QR Image (.png, .jpg)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {customQrUrl && (
                <button
                  type="button"
                  onClick={() => setCustomQrUrl(undefined)}
                  className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-3 text-xs text-rose-300 hover:bg-rose-900/40"
                >
                  Remove
                </button>
              )}
            </div>
            {customQrUrl && (
              <p className="mt-1 text-[11px] text-emerald-400">
                ✓ Custom QR code loaded! It will replace the auto-generated QR code.
              </p>
            )}
          </div>

          <div className="rounded-xl bg-purple-950/40 p-3 text-[11px] text-slate-400">
            <span className="font-bold text-slate-200 block mb-0.5">Permanent deployment tip:</span>
            You can also edit <code className="text-pink-400 font-mono">src/config/site.ts</code> before pushing to Vercel so your UPI ID is baked in forever!
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-950/40 px-4 py-2.5 text-xs font-bold uppercase text-slate-300 hover:text-white"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>

            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all active:scale-95"
            >
              <Save size={16} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
