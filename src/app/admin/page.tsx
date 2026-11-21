'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Lock,
  LogOut,
  Save,
  Trash2,
  ArrowLeft,
  ShieldCheck,
  QrCode,
  Upload,
  CheckCircle2,
  AlertCircle,
  Eye,
  BarChart3,
  TrendingUp,
  Users,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldAlert,
  X,
  Copy,
  Check,
  Database,
  ImageIcon,
} from 'lucide-react';
import { UpiConfig, Donation, SiteStats } from '@/types/donation';

interface StorageStatus {
  isRedisConfigured: boolean;
  isRedisConnected: boolean;
  storageMode: 'cloud_redis' | 'ephemeral_serverless';
  donationsCount: number;
  totalVisits: number;
  region: string;
}

interface AdminAnalytics {
  totalVisits: number;
  uniqueVisitors: number;
  totalPaidDonors: number;
  totalRaised: number;
  conversionRate: number;
  avgDonation: number;
  highestDonation: number;
  tierBreakdown: Record<string, { count: number; total: number; label: string }>;
  dailyVisits: Record<string, number>;
  lastVisited: number;
}

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
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [storageStatus, setStorageStatus] = useState<StorageStatus | null>(null);
  const [showPrivacyGuide, setShowPrivacyGuide] = useState<boolean>(true);
  const [showRedisGuide, setShowRedisGuide] = useState<boolean>(false);
  const [previewScreenshot, setPreviewScreenshot] = useState<string | null>(null);
  const [previewScreenshotDonor, setPreviewScreenshotDonor] = useState<Donation | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  // Check session validity with server
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/admin/me');
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem('gta6_admin_auth');
        }
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  const loadAdminData = useCallback(async () => {
    try {
      const t = Date.now();
      // 1. Fetch current UPI config
      const configRes = await fetch(`/api/admin/config?_t=${t}`, { cache: 'no-store' });
      const configData = await configRes.json();
      if (configData.success && configData.config) {
        setUpiConfig(configData.config);
      }

      // 2. Fetch donations & stats
      const donRes = await fetch(`/api/donations?_t=${t}`, { cache: 'no-store' });
      const donData = await donRes.json();
      if (donData.success) {
        setDonations(donData.donations || []);
        setStats(donData.stats || null);
      }

      // 3. Fetch detailed visitor & conversion analytics
      const analyticsRes = await fetch(`/api/admin/analytics?_t=${t}`, { cache: 'no-store' });
      const analyticsData = await analyticsRes.json();
      if (analyticsData.success && analyticsData.analytics) {
        setAnalytics(analyticsData.analytics);
      }

      // 4. Fetch database & cloud storage diagnostic status
      const statusRes = await fetch(`/api/admin/status?_t=${t}`, { cache: 'no-store' });
      const statusData = await statusRes.json();
      if (statusData.success && statusData.status) {
        setStorageStatus(statusData.status);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
      const interval = setInterval(loadAdminData, 5000);
      return () => clearInterval(interval);
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
        setIsAuthenticated(true);
        localStorage.setItem('gta6_admin_auth', 'true');
        loadAdminData();
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch {
      setLoginError('Login request failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      // ignore
    }
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
        },
        body: JSON.stringify(upiConfig),
      });

      const data = await res.json();
      if (data.success) {
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

        {/* Cloud Storage & Cross-Device Sync Status Banner */}
        <div
          className={`rounded-2xl border-2 p-4 transition-all ${
            storageStatus?.isRedisConnected
              ? 'border-emerald-500/30 bg-emerald-950/20'
              : 'border-amber-500/40 bg-amber-950/30'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full shrink-0 mt-1 sm:mt-0 ${
                  storageStatus?.isRedisConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-white">
                    {storageStatus?.isRedisConnected
                      ? 'Live Cloud Database Active'
                      : 'Storage Alert: Temporary Serverless Memory'}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      storageStatus?.isRedisConnected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {storageStatus?.isRedisConnected ? 'Upstash Redis Connected' : 'No Redis Connected'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {storageStatus?.isRedisConnected
                    ? 'All devices (mobile, desktop, admin) and serverless instances are synchronized in real-time via Upstash Redis.'
                    : 'Without Upstash Redis connected in Vercel, data is stored in temporary lambda memory. Backers paying on desktop won’t reflect on mobile until Redis is connected.'}
                </p>
              </div>
            </div>

            {!storageStatus?.isRedisConnected && (
              <button
                type="button"
                onClick={() => setShowRedisGuide(!showRedisGuide)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-400/20 shrink-0"
              >
                <Database size={13} />
                <span>{showRedisGuide ? 'Hide Setup Guide' : 'How to Connect Redis (100% Free)'}</span>
                {showRedisGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>

          {showRedisGuide && !storageStatus?.isRedisConnected && (
            <div className="mt-3 pt-3 border-t border-amber-500/20 text-xs text-slate-300 space-y-2">
              <p className="font-bold text-white">
                Why mobile showed ₹0 while desktop showed ₹10:
              </p>
              <p className="text-slate-400 text-[11px]">
                Vercel runs serverless functions across isolated containers. When Upstash Redis is missing, each container keeps data only in its own temporary local memory.
              </p>
              <div className="rounded-xl bg-black/60 p-3.5 border border-white/10 space-y-2">
                <span className="font-bold text-[#fca47a] block text-xs uppercase tracking-wider">
                  30-Second 1-Click Setup in Vercel (Free Forever):
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300">
                  <li>
                    Open your{' '}
                    <a
                      href="https://vercel.com/dashboard"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#fca47a] underline font-semibold hover:text-white"
                    >
                      Vercel Dashboard
                    </a>{' '}
                    and click on your <strong className="text-white">gta6</strong> project.
                  </li>
                  <li>
                    Click the <strong className="text-white">Storage</strong> tab in the project navigation.
                  </li>
                  <li>
                    Click <strong className="text-white">Connect Database</strong> &rarr; Select{' '}
                    <strong className="text-white">Upstash (Redis)</strong> &rarr; Click <strong className="text-white">Create</strong>.
                  </li>
                  <li>
                    That’s it! Vercel automatically links <code className="text-[#fca47a]">UPSTASH_REDIS_REST_URL</code> and triggers a redeployment. Cross-device sync will be active instantly.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

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

        {/* Visitor & Conversion Intelligence */}
        <section className="rounded-3xl border-2 border-white/10 bg-[#1c1233] p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4 gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 size={20} className="text-[#e86b97]" />
              <h2 className="font-bebas text-3xl uppercase tracking-wider text-white">
                ANALYTICS & CONVERSION INTELLIGENCE
              </h2>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              <TrendingUp size={13} className="text-emerald-400" />
              <span>Real-time Funnel</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Total Visits */}
            <div className="rounded-2xl border border-white/10 bg-[#120b22] p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Visits</span>
              <span className="font-bebas text-3xl font-extrabold text-[#fca47a]">
                {analytics?.totalVisits?.toLocaleString('en-IN') ?? '0'}
              </span>
              <span className="text-[10px] text-slate-500 block">Public Site Hits</span>
            </div>

            {/* Unique Visitors */}
            <div className="rounded-2xl border border-white/10 bg-[#120b22] p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Unique Visitors</span>
              <span className="font-bebas text-3xl font-extrabold text-[#fdfbf7]">
                {analytics?.uniqueVisitors?.toLocaleString('en-IN') ?? '0'}
              </span>
              <span className="text-[10px] text-slate-500 block">Distinct Users</span>
            </div>

            {/* Backers Paid */}
            <div className="rounded-2xl border border-white/10 bg-[#120b22] p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Backers Paid</span>
              <span className="font-bebas text-3xl font-extrabold text-emerald-400">
                {analytics?.totalPaidDonors ?? donations.length}
              </span>
              <span className="text-[10px] text-slate-500 block">Recorded Donors</span>
            </div>

            {/* Conversion Rate */}
            <div className="rounded-2xl border border-white/10 bg-[#120b22] p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Conversion Rate</span>
              <span className="font-bebas text-3xl font-extrabold text-[#e86b97]">
                {analytics?.conversionRate ?? 0}%
              </span>
              <span className="text-[10px] text-slate-500 block">Visits to Paid</span>
            </div>

            {/* Average Donation */}
            <div className="rounded-2xl border border-white/10 bg-[#120b22] p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Avg Donation</span>
              <span className="font-bebas text-3xl font-extrabold text-[#c084fc]">
                ₹{analytics?.avgDonation ?? 0}
              </span>
              <span className="text-[10px] text-slate-500 block">Per Backer</span>
            </div>

            {/* Top Whale */}
            <div className="rounded-2xl border border-white/10 bg-[#120b22] p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Top Whale</span>
              <span className="font-bebas text-3xl font-extrabold text-amber-300">
                ₹{analytics?.highestDonation ?? 0}
              </span>
              <span className="text-[10px] text-slate-500 block">Biggest Donor</span>
            </div>
          </div>

          {/* Tier Distribution Breakdown */}
          {analytics?.tierBreakdown && (
            <div className="mt-5 rounded-2xl border border-white/5 bg-[#120b22] p-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wider">
                  Contribution Breakdown by Tier (Who Paid How Much)
                </span>
                <span className="text-slate-500">Live Breakdown</span>
              </div>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {Object.entries(analytics.tierBreakdown).map(([tierKey, tier]) => (
                  <div key={tierKey} className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-center">
                    <span className="text-[10px] font-semibold text-slate-400 block truncate">{tier.label}</span>
                    <span className="font-bebas text-xl font-bold text-[#fdfbf7] block mt-0.5">
                      {tier.count} <span className="text-xs font-normal text-slate-500">donors</span>
                    </span>
                    <span className="text-[11px] font-bold text-[#fca47a] block">₹{tier.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

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

          {/* PRIVACY WORKAROUND CALLOUT FOR BANKING NAME */}
          <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-950/20 p-4 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-[#fca47a] shrink-0" />
                <span className="font-bold text-white uppercase tracking-wider text-xs">
                  How to hide your personal banking name on UPI
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivacyGuide(!showPrivacyGuide)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#fca47a] hover:text-white"
              >
                <span>{showPrivacyGuide ? 'Hide Guide' : 'Show Workarounds'}</span>
                {showPrivacyGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {showPrivacyGuide && (
              <div className="mt-3 pt-3 border-t border-amber-400/20 space-y-3 text-slate-300">
                <p>
                  <strong className="text-white">Why personal banking names appear:</strong> In India, NPCI rules force banking apps (Google Pay, PhonePe, Paytm) to fetch and show the account holder&apos;s legal PAN/bank name for any personal P2P UPI handle.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-1">
                    <span className="font-bold text-[#fca47a] block text-[11px] uppercase">
                      Option 1 (Recommended & 100% Free)
                    </span>
                    <strong className="text-white block text-xs">Google Pay / PhonePe Business</strong>
                    <p className="text-[11px] text-slate-400">
                      Download Google Pay for Business or PhonePe Business. Register in 2 minutes as an Individual / Freelancer / Creator (zero GST required). Name your business <strong className="text-slate-200">&ldquo;GTA 6 Fund&rdquo;</strong>.
                    </p>
                    <p className="text-[10px] text-emerald-400 font-semibold pt-1">
                      ✓ NPCI will display ONLY &ldquo;GTA 6 Fund&rdquo; to donors!
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-1">
                    <span className="font-bold text-[#fca47a] block text-[11px] uppercase">
                      Option 2 (Instant QR Upload)
                    </span>
                    <strong className="text-white block text-xs">Upload Merchant QR</strong>
                    <p className="text-[11px] text-slate-400">
                      Take a screenshot or download the QR code from your Business app and upload it via <strong className="text-slate-200">&ldquo;Upload Static UPI QR Code&rdquo;</strong> below.
                    </p>
                    <p className="text-[10px] text-emerald-400 font-semibold pt-1">
                      ✓ All site visitors will scan your branded merchant QR!
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-1">
                    <span className="font-bold text-[#fca47a] block text-[11px] uppercase">
                      Option 3 (Gateway / Tip Links)
                    </span>
                    <strong className="text-white block text-xs">Payment Link Gateways</strong>
                    <p className="text-[11px] text-slate-400">
                      Create an account on Razorpay Payment Pages, Instamojo, or Saweria. Enter your campaign title. Donors pay through the gateway without ever seeing your bank VPA.
                    </p>
                    <p className="text-[10px] text-emerald-400 font-semibold pt-1">
                      ✓ Full anonymity with automated bank settlements!
                    </p>
                  </div>
                </div>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4 gap-2">
            <div>
              <h2 className="font-bebas text-3xl uppercase tracking-wider text-white">
                ALL DONATIONS ({donations.length})
              </h2>
              <p className="text-xs text-slate-400">
                Inspect 12-digit UTR references, view payment screenshot receipts, and delete fraudulent entries.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                🛡️ Verified Entries Only
              </span>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Donor & Date</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">12-Digit UTR</th>
                  <th className="py-2.5 px-3">Payment Receipt</th>
                  <th className="py-2.5 px-3">Badge</th>
                  <th className="py-2.5 px-3">Message</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {donations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="text-3xl">🎮</span>
                        <p className="font-bold text-sm text-slate-200">No Donations Recorded Yet</p>
                        <p className="text-xs text-slate-500 max-w-sm">
                          When backers contribute and submit their 12-digit UPI reference with a screenshot, their records will appear here live.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  donations.map((d) => (
                    <tr key={d.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-white">
                        <div className="font-semibold text-white">{d.name}</div>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {new Date(d.timestamp).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bebas text-lg font-bold text-emerald-400">
                        ₹{d.amount}
                      </td>
                      <td className="py-2.5 px-3">
                        {d.utrNumber ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] text-[#fca47a] bg-black/60 px-2 py-0.5 rounded border border-white/10 font-bold">
                              {d.utrNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyUtr(d.utrNumber!)}
                              title="Copy UTR to clipboard"
                              className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                            >
                              {copiedUtr === d.utrNumber ? (
                                <Check size={12} className="text-emerald-400" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">No UTR</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {d.screenshotUrl ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewScreenshot(d.screenshotUrl!);
                              setPreviewScreenshotDonor(d);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#e86b97]/40 bg-[#e86b97]/15 px-2.5 py-1 text-[11px] font-bold text-[#fca47a] hover:bg-[#e86b97]/30 transition-all"
                          >
                            <Eye size={12} />
                            <span>View Receipt</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">No receipt</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{d.badge}</td>
                      <td className="py-2.5 px-3 text-slate-400 italic max-w-xs truncate">
                        {d.message}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteDonation(d.id)}
                          title="Delete donation"
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-950/30 px-2.5 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-900/50 transition-colors"
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Screenshot / Receipt Lightbox Modal */}
        {previewScreenshot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-lg rounded-3xl border-2 border-[#e86b97] bg-[#160d29] p-5 brutal-shadow-rose">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="font-bebas text-2xl uppercase tracking-wider text-white">
                    PAYMENT RECEIPT VERIFICATION
                  </h3>
                  <p className="text-xs text-slate-400">
                    {previewScreenshotDonor
                      ? `${previewScreenshotDonor.name} • ₹${previewScreenshotDonor.amount}`
                      : 'Donor Screenshot'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewScreenshot(null);
                    setPreviewScreenshotDonor(null);
                  }}
                  className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-4 flex flex-col items-center">
                <div className="relative max-h-[58vh] w-full overflow-auto rounded-2xl border border-white/20 bg-black/80 flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewScreenshot}
                    alt="Payment Receipt"
                    className="max-h-[52vh] w-auto object-contain rounded-lg shadow-2xl"
                  />
                </div>

                {previewScreenshotDonor?.utrNumber && (
                  <div className="mt-4 w-full flex items-center justify-between rounded-xl border border-white/10 bg-black/60 p-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        12-Digit UPI Ref / UTR
                      </span>
                      <span className="font-mono text-sm font-bold text-[#fca47a] tracking-wider">
                        {previewScreenshotDonor.utrNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyUtr(previewScreenshotDonor.utrNumber!)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-white/10"
                    >
                      {copiedUtr === previewScreenshotDonor.utrNumber ? (
                        <>
                          <Check size={13} className="text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy UTR</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div className="mt-3 w-full rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-2.5 text-[11px] text-emerald-300">
                  💡 Cross-check this 12-digit UTR in your PhonePe / GPay / Jupiter transaction history or SMS to confirm funds arrived.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
