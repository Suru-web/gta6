'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Lock, LogOut, Save, Trash2, ArrowLeft, ShieldCheck, QrCode, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { UpiConfig, Donation, SiteStats } from '@/types/donation';
import { sounds } from '@/lib/sounds';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin state
  const [upiConfig, setUpiConfig] = useState<UpiConfig>({
    upiId: 'suraj@upi',
    payeeName: 'GTA 6 Recovery Fund',
    note: 'GTA6 Fund',
    customQrUrl: undefined,
  });
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check existing session from localStorage or cookie
  useEffect(() => {
    try {
      const isAuth = localStorage.getItem('gta6_admin_auth') === 'true';
      if (isAuth) {
        setIsAuthenticated(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const loadAdminData = useCallback(async () => {
    try {
      // 1. Fetch current UPI config
      const configRes = await fetch('/api/admin/config');
      const configData = await configRes.json();
      if (configData.success && configData.config) {
        setUpiConfig(configData.config);
      }

      // 2. Fetch donations & stats
      const donRes = await fetch('/api/donations');
      const donData = await donRes.json();
      if (donData.success) {
        setDonations(donData.donations || []);
        setStats(donData.stats || null);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated, loadAdminData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (data.success) {
        sounds.playMissionPassed();
        setIsAuthenticated(true);
        localStorage.setItem('gta6_admin_auth', 'true');
        loadAdminData();
      } else {
        sounds.playClick();
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch {
      setLoginError('Login request failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sounds.playClick();
    setIsAuthenticated(false);
    localStorage.removeItem('gta6_admin_auth');
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer gta6_admin_secret_token_99999',
        },
        body: JSON.stringify(upiConfig),
      });

      const data = await res.json();
      if (data.success) {
        sounds.playMissionPassed();
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Save config error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        sounds.playCoin();
        setUpiConfig((prev) => ({ ...prev, customQrUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteDonation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this donation from the board?')) return;
    try {
      const res = await fetch(`/api/donations?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        sounds.playClick();
        setDonations(data.donations || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // 1. LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="retro-grid min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border-2 border-[#e86b97] bg-[#1c1233] p-8 brutal-shadow-rose backdrop-blur-xl">
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#e86b97]/20 border border-[#e86b97]/40 text-[#fca47a] mb-3">
              <Lock size={28} />
            </div>
            <h1 className="font-bebas text-4xl uppercase tracking-wider text-white">
              GTA VI ADMIN PORTAL
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Restricted Access • Authorized Personnel Only
            </p>
          </div>

          {loginError && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/50 bg-rose-950/40 p-3 text-xs text-rose-300">
              <AlertCircle size={16} className="shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="mt-1 w-full rounded-xl border border-white/20 bg-black/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#fca47a] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="mt-1 w-full rounded-xl border border-white/20 bg-black/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#fca47a] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#fca47a] bg-[#fca47a] py-3 text-sm font-black uppercase tracking-wider text-black brutal-shadow-white transition-all hover:bg-[#ffb78e] active:scale-95 disabled:opacity-50"
            >
              <ShieldCheck size={18} />
              <span>{isLoggingIn ? 'Authenticating...' : 'Enter Admin Console'}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to Public Website</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 2. ADMIN DASHBOARD SCREEN
  return (
    <div className="retro-grid min-h-screen text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Top Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border-2 border-[#e86b97] bg-[#1c1233] p-4 brutal-shadow-rose">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bebas text-3xl font-extrabold gta-gradient tracking-wide">
                GTA VI
              </span>
              <span className="rounded bg-[#fca47a] px-2 py-0.5 text-[10px] font-black uppercase text-black">
                ADMIN CONSOLE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Logged in as <strong className="text-white">suraj</strong> (Full Control)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 transition-colors"
            >
              <span>View Live Website ➔</span>
            </a>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/60 transition-colors"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Live Metrics */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border-2 border-white/10 bg-[#1c1233] p-4">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">Total Raised</span>
              <span className="font-bebas text-3xl font-bold text-emerald-400">
                ₹{stats.totalRaised.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="rounded-2xl border-2 border-white/10 bg-[#1c1233] p-4">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">Target Goal</span>
              <span className="font-bebas text-3xl font-bold text-white">
                ₹{stats.targetAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="rounded-2xl border-2 border-white/10 bg-[#1c1233] p-4">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">Legends / Donors</span>
              <span className="font-bebas text-3xl font-bold text-[#fca47a]">
                {stats.totalDonors}
              </span>
            </div>
            <div className="rounded-2xl border-2 border-white/10 bg-[#1c1233] p-4">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">Funded</span>
              <span className="font-bebas text-3xl font-bold text-[#e86b97]">
                {stats.percentComplete}%
              </span>
            </div>
          </div>
        )}

        {/* UPI & QR Configuration Section */}
        <section className="rounded-3xl border-2 border-[#fca47a] bg-[#1c1233] p-6 brutal-shadow-peach">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <QrCode size={20} className="text-[#fca47a]" />
                <h2 className="font-bebas text-3xl uppercase tracking-wider text-white">
                  CONFIGURE UPI & QR CODE
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Changes saved here will immediately appear for all visitors on the main website.
              </p>
            </div>

            {saveSuccess && (
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-950 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/40 animate-in fade-in">
                <CheckCircle2 size={14} />
                <span>Saved & Live!</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveConfig} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-4">
                {/* UPI ID */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Your Real UPI ID (Target for all donations)
                  </label>
                  <input
                    type="text"
                    required
                    value={upiConfig.upiId}
                    onChange={(e) => setUpiConfig({ ...upiConfig, upiId: e.target.value })}
                    placeholder="e.g. suraj@okhdfcbank or 9876543210@paytm"
                    className="mt-1 w-full rounded-xl border border-white/20 bg-black/60 px-4 py-2.5 text-sm font-mono text-[#fca47a] focus:border-[#fca47a] focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400">
                    When visitors scan or click &ldquo;Pay via UPI&rdquo;, funds go to this ID.
                  </span>
                </div>

                {/* Payee Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Payee Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={upiConfig.payeeName}
                    onChange={(e) => setUpiConfig({ ...upiConfig, payeeName: e.target.value })}
                    placeholder="e.g. Suraj (GTA 6 Fund)"
                    className="mt-1 w-full rounded-xl border border-white/20 bg-black/60 px-4 py-2.5 text-sm text-white focus:border-[#fca47a] focus:outline-none"
                  />
                </div>

                {/* Custom QR Image Upload */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Upload Static UPI QR Code Image (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#e86b97]/50 bg-[#e86b97]/10 px-4 py-3 text-xs font-bold text-[#fca47a] hover:bg-[#e86b97]/20 transition-colors">
                      <Upload size={16} />
                      <span>{upiConfig.customQrUrl ? 'Change QR Image' : 'Upload QR Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrUpload}
                        className="hidden"
                      />
                    </label>

                    {upiConfig.customQrUrl && (
                      <button
                        type="button"
                        onClick={() => setUpiConfig({ ...upiConfig, customQrUrl: undefined })}
                        className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-3 text-xs font-bold text-rose-300 hover:bg-rose-900/60"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    If omitted, the site automatically generates an interactive high-res QR code for any amount!
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-[#fca47a] bg-[#fca47a] px-6 py-3 text-xs font-black uppercase tracking-wider text-black brutal-shadow-white transition-all hover:bg-[#ffb78e] active:scale-95 disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>{isSaving ? 'Updating...' : 'Save UPI Settings'}</span>
                </button>
              </div>

              {/* Live Preview Box */}
              <div className="rounded-2xl border-2 border-white/10 bg-[#110b20] p-5 flex flex-col items-center text-center">
                <span className="text-[11px] font-bold uppercase text-slate-400 mb-2">
                  Live Public QR Preview
                </span>
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
                      value={`upi://pay?pa=${encodeURIComponent(upiConfig.upiId)}&pn=${encodeURIComponent(
                        upiConfig.payeeName
                      )}&am=69&cu=INR&tn=GTA6%20Fund`}
                      size={176}
                      level="H"
                    />
                  )}
                </div>
                <div className="mt-2 text-xs font-bold text-[#fca47a]">
                  <code>{upiConfig.upiId}</code>
                </div>
                <span className="text-[10px] text-slate-500">
                  Matches what visitors will scan on the homepage
                </span>
              </div>
            </div>
          </form>
        </section>

        {/* Manage Donations / Backers */}
        <section className="rounded-3xl border-2 border-white/10 bg-[#1c1233] p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="font-bebas text-3xl uppercase tracking-wider text-white">
                ALL DONATIONS ({donations.length})
              </h2>
              <p className="text-xs text-slate-400">
                View, monitor, and remove test or invalid entries.
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Donor</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Badge</th>
                  <th className="py-2.5 px-3">Message</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {donations.map((d) => (
                  <tr key={d.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">{d.name}</td>
                    <td className="py-2.5 px-3 font-bebas text-lg font-bold text-emerald-400">
                      ₹{d.amount}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{d.badge}</td>
                    <td className="py-2.5 px-3 text-slate-400 italic max-w-xs truncate">
                      {d.message}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleDeleteDonation(d.id)}
                        title="Delete donation"
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-950/30 px-2.5 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-900/50"
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
