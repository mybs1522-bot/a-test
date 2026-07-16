import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock, LogOut, RefreshCw, Search, ChevronDown, ChevronUp,
  CheckCircle2, Clock, Mail, ArrowUpDown, X,
  Shield, Eye, EyeOff, DollarSign, TrendingUp, AlertCircle,
  Users,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// ── Auth ──
const ADMIN_USER = 'adminrob';
const ADMIN_PASS = 'Robbin#15';
const SESSION_KEY = 'admin_auth_v1';

// ── Supabase ──
const supabaseUrl = 'https://hsxwsqfrjfbqlbjlrnpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzeHdzcWZyamZicWxiamxybnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMDI5NTAsImV4cCI6MjA5OTc3ODk1MH0.iEgGWAMeT9zh5c0_kZkjmI9fQdTJjTucJX5uX047kEE';
const supabase = createClient(supabaseUrl, supabaseKey);

// ── Types ──
interface PaymentLog {
  id: string;
  email: string;
  funnel_type: string;
  status: string;
  amount: number;
  currency: string;
  error_message: string | null;
  created_at: string;
  checkout_completed: boolean;
  render_upsell_completed: boolean;
  full_upsell_completed: boolean;
  books_upsell_completed: boolean;
  books_downsell_completed: boolean;
  total_amount_paid: number;
}

// ── Funnel config ──
const FUNNELS: Record<string, { label: string }> = {
  'checkout':         { label: 'Initial Checkout' },
  'render-upsell':    { label: 'Render Upsell' },
  'full-upsell':      { label: 'Full Upsell' },
  'books-upsell':     { label: 'Books Upsell' },
  'books-downsell':   { label: 'Books Downsell' },
};

const STATUS_CONFIG: Record<string, { label: string }> = {
  'success': { label: 'Success' },
  'failed':  { label: 'Failed' },
  'pending': { label: 'Pending' },
};

const fmtDate = (s: string | null) => {
  if (!s) return '—';
  return new Date(s).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

const fmtTimeAgo = (s: string) => {
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const fmtMoney = (amount: number) => `$${amount.toFixed(2)}`;

// ─────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────
const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      if (user === ADMIN_USER && pass === ADMIN_PASS) {
        sessionStorage.setItem(SESSION_KEY, '1');
        onLogin();
      } else {
        setError('Invalid username or password.');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4">
            <Shield size={32} className="text-black" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Admin Portal</h1>
          <p className="text-gray-400 text-sm mt-2">Payment Analytics Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Username</label>
              <input
                type="text"
                value={user}
                onChange={e => setUser(e.target.value)}
                placeholder="Username"
                autoComplete="username"
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-black text-sm placeholder-gray-400 focus:outline-none focus:border-black transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-3 bg-gray-100 border border-gray-200 rounded-xl text-black text-sm placeholder-gray-400 focus:outline-none focus:border-black transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <X size={14} className="text-red-500 shrink-0" />
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-black text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2"><RefreshCw size={16} className="animate-spin" /> Signing in…</span>
              ) : (
                <span className="flex items-center gap-2"><Lock size={16} /> Sign In</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────
// BADGES
// ─────────────────────────────────────
const FunnelBadge: React.FC<{ funnel: string }> = ({ funnel }) => {
  const label = FUNNELS[funnel]?.label || funnel;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-700">
      {label}
    </span>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config = STATUS_CONFIG[status];
  const label = config?.label || status;
  const isSuccess = status === 'success';
  const isFailed = status === 'failed';
  
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
      isSuccess 
        ? 'border-green-500 bg-green-50 text-green-700' 
        : isFailed 
          ? 'border-red-500 bg-red-50 text-red-700'
          : 'border-gray-200 bg-gray-50 text-gray-700'
    }`}>
      {label}
    </span>
  );
};

// ─────────────────────────────────────
// TIER STATUS INDICATOR
// ─────────────────────────────────────
const TierStatus: React.FC<{ log: PaymentLog }> = ({ log }) => {
  const tiers = [
    { key: 'checkout_completed', label: 'Checkout' },
    { key: 'render_upsell_completed', label: 'Render' },
    { key: 'full_upsell_completed', label: 'Full' },
    { key: 'books_upsell_completed', label: 'Books' },
    { key: 'books_downsell_completed', label: 'Downsell' },
  ];

  return (
    <div className="flex items-center gap-1">
      {tiers.map((tier) => {
        const completed = log[tier.key as keyof PaymentLog] as boolean;
        return (
          <div
            key={tier.key}
            className={`w-2.5 h-2.5 rounded-full ${completed ? 'bg-green-500' : 'bg-gray-200'}`}
            title={`${tier.label}: ${completed ? 'Completed' : 'Not completed'}`}
          />
        );
      })}
      <span className="text-[10px] text-gray-400 ml-1">
        {tiers.filter(t => log[t.key as keyof PaymentLog] as boolean).length}/5
      </span>
    </div>
  );
};

// ─────────────────────────────────────
// PAYMENT DETAIL DRAWER
// ─────────────────────────────────────
const PaymentDrawer: React.FC<{ log: PaymentLog; onClose: () => void }> = ({ log, onClose }) => (
  <div className="fixed inset-0 z-50 flex justify-end" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
      {/* Header */}
      <div className="bg-black px-6 py-5 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Payment Details</p>
          <h3 className="text-white font-bold text-lg">{log.email}</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
          <X size={20} />
        </button>
      </div>

      <div className="p-6 space-y-6 flex-1">
        {/* Payment Info */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Payment Information</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-sm text-gray-600">Amount</span>
              <span className="text-sm font-bold text-black">{fmtMoney(log.amount)}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-sm text-gray-600">Status</span>
              <StatusBadge status={log.status} />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-sm text-gray-600">Funnel</span>
              <FunnelBadge funnel={log.funnel_type} />
            </div>
          </div>
        </div>

        {/* Tier Progress */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Tier Completion</p>
          <div className="space-y-2">
            {[
              { label: 'Initial Checkout', completed: log.checkout_completed },
              { label: 'Render Upsell', completed: log.render_upsell_completed },
              { label: 'Full Upsell', completed: log.full_upsell_completed },
              { label: 'Books Upsell', completed: log.books_upsell_completed },
              { label: 'Books Downsell', completed: log.books_downsell_completed },
            ].map((tier) => (
              <div key={tier.label} className={`flex items-center gap-3 p-3 rounded-xl border ${tier.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${tier.completed ? 'bg-green-500' : 'bg-gray-200'}`}>
                  {tier.completed ? <CheckCircle2 size={12} className="text-white" strokeWidth={3} /> : <span className="w-2 h-2 rounded-full bg-gray-400" />}
                </div>
                <span className={`text-sm font-semibold ${tier.completed ? 'text-green-800' : 'text-gray-500'}`}>{tier.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-green-500 text-white rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">Total Amount Paid</p>
          <p className="text-3xl font-bold">{fmtMoney(log.total_amount_paid)}</p>
        </div>

        {/* Error Message */}
        {log.error_message && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-red-500" />
              <p className="text-sm font-bold text-red-700">Error Message</p>
            </div>
            <p className="text-sm text-red-600">{log.error_message}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="border-t border-gray-200 pt-4 space-y-1">
          <p className="text-[11px] text-gray-400"><span className="font-bold">Payment time:</span> {fmtDate(log.created_at)}</p>
          <p className="text-[11px] text-gray-400"><span className="font-bold">Payment ID:</span> {log.id}</p>
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────
const Dashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [filtered, setFiltered] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [funnelFilter, setFunnelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<keyof PaymentLog>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedLog, setSelectedLog] = useState<PaymentLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase.rpc('get_payment_logs_admin', { p_auth_pass: 'Robbin#15' });
      if (err) throw err;
      setLogs(data ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load payment logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Filter + sort
  useEffect(() => {
    let rows = [...logs];
    if (funnelFilter !== 'all') rows = rows.filter(l => l.funnel_type === funnelFilter);
    if (statusFilter !== 'all') rows = rows.filter(l => l.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(l => l.email.toLowerCase().includes(q));
    }
    rows.sort((a, b) => {
      const av = (a[sortField] as string) ?? '';
      const bv = (b[sortField] as string) ?? '';
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    setFiltered(rows);
  }, [logs, search, funnelFilter, statusFilter, sortField, sortDir]);

  const toggleSort = (field: keyof PaymentLog) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  // Stats
  const totalRevenue = logs.filter(l => l.status === 'success').reduce((sum, l) => sum + l.amount, 0);
  const successCount = logs.filter(l => l.status === 'success').length;
  const failedCount = logs.filter(l => l.status === 'failed').length;
  const uniqueUsers = new Set(logs.map(l => l.email)).size;

  const statsByFunnel = Object.keys(FUNNELS).map(key => ({
    label: FUNNELS[key].label,
    key,
    count: logs.filter(l => l.funnel_type === key).length,
    revenue: logs.filter(l => l.funnel_type === key && l.status === 'success').reduce((sum, l) => sum + l.amount, 0),
  }));

  const SortIcon: React.FC<{ field: keyof PaymentLog }> = ({ field }) =>
    sortField === field
      ? sortDir === 'asc' ? <ChevronUp size={13} className="text-black" /> : <ChevronDown size={13} className="text-black" />
      : <ArrowUpDown size={12} className="text-gray-300" />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top Bar ── */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <p className="text-black font-bold text-sm leading-none">Payment Admin</p>
            <p className="text-gray-400 text-[10px] font-medium">Analytics Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 text-gray-500 hover:text-black text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => { sessionStorage.removeItem(SESSION_KEY); onLogout(); }}
            className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
          >
            <LogOut size={12} /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* ── Stats Overview ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-black text-white rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={18} className="text-white/80" />
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Total Revenue</p>
            </div>
            <p className="text-3xl font-bold">{fmtMoney(totalRevenue)}</p>
          </div>
          <div className="bg-green-500 text-white rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={18} />
              <p className="text-green-100 text-xs font-bold uppercase tracking-widest">Successful</p>
            </div>
            <p className="text-3xl font-bold">{successCount}</p>
          </div>
          <div className="bg-white border border-gray-200 text-black rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={18} className="text-red-500" />
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Failed</p>
            </div>
            <p className="text-3xl font-bold">{failedCount}</p>
          </div>
          <div className="bg-white border border-gray-200 text-black rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
              <Users size={18} className="text-gray-400" />
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Unique Users</p>
            </div>
            <p className="text-3xl font-bold">{uniqueUsers}</p>
          </div>
        </div>

        {/* ── Funnel Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {statsByFunnel.map(s => (
            <button
              key={s.key}
              onClick={() => setFunnelFilter(funnelFilter === s.key ? 'all' : s.key)}
              className={`rounded-2xl p-4 border text-left transition-all hover:shadow-md ${funnelFilter === s.key ? 'bg-black text-white border-black' : 'bg-white border-gray-200 text-black'}`}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-gray-400">{s.label}</p>
              <p className="text-xl font-bold">{s.count}</p>
              <p className="text-[10px] text-gray-400">{fmtMoney(s.revenue)}</p>
            </button>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-black focus:outline-none focus:border-black transition-colors"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
            {(funnelFilter !== 'all' || statusFilter !== 'all') && (
              <button onClick={() => { setFunnelFilter('all'); setStatusFilter('all'); }} className="text-black hover:text-gray-600 font-bold flex items-center gap-1 text-sm">
                <X size={12} /> Clear filters
              </button>
            )}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-5 text-red-700 text-sm font-medium flex items-center gap-2">
            <X size={16} className="text-red-500 shrink-0" /> {error}
          </div>
        )}

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="py-24 flex flex-col items-center gap-4 text-gray-400">
              <RefreshCw size={28} className="animate-spin text-black" />
              <p className="text-sm font-medium">Loading payment logs…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center">
              <DollarSign size={36} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400 font-semibold">No payment logs found</p>
              <p className="text-gray-300 text-sm">Try changing your search or filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {[
                      { label: 'Email', field: 'email' as keyof PaymentLog },
                      { label: 'Funnel', field: 'funnel_type' as keyof PaymentLog },
                      { label: 'Status', field: 'status' as keyof PaymentLog },
                      { label: 'Amount', field: 'amount' as keyof PaymentLog },
                      { label: 'Tiers', field: null },
                      { label: 'Time', field: 'created_at' as keyof PaymentLog },
                    ].map(({ label, field }) => (
                      <th
                        key={label}
                        onClick={field ? () => toggleSort(field) : undefined}
                        className={`text-left px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap ${field ? 'cursor-pointer hover:text-black select-none' : ''}`}
                      >
                        <span className="flex items-center gap-1">
                          {label}
                          {field && <SortIcon field={field} />}
                        </span>
                      </th>
                    ))}
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(log => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-4">
                        <p className="font-bold text-black text-sm">{log.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <FunnelBadge funnel={log.funnel_type} />
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="px-5 py-4 font-bold text-black">
                        {fmtMoney(log.amount)}
                      </td>
                      <td className="px-5 py-4">
                        <TierStatus log={log} />
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-gray-600 text-xs">{fmtDate(log.created_at)}</p>
                        <p className="text-gray-400 text-[10px]">{fmtTimeAgo(log.created_at)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <ChevronDown size={14} className="text-gray-300 group-hover:text-black -rotate-90 transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-gray-300 mt-6 font-medium">
          Payment Analytics · {logs.length} total transactions · Last refreshed {new Date().toLocaleTimeString()}
        </p>
      </div>

      {/* Payment Drawer */}
      {selectedLog && <PaymentDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
};

// ─────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────
const AdminPage: React.FC = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;
  return <Dashboard onLogout={() => setAuthed(false)} />;
};

export default AdminPage;
