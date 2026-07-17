import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import WorkspaceLayout from '../../layouts/WorkspaceLayout';
import { getPMStats } from '../../api/productManager';
import { useAuth } from '../../context/AuthContext';
import Chart from '../../components/Chart';
import { CHART_COLORS } from '../../lib/chartTheme';
import { storageUrl } from '../../lib/urls';

const ugx = (n) => `UGX ${Number(n || 0).toLocaleString()}`;

const toISO = (d) => d.toISOString().slice(0, 10);

// Build a {from, to} ISO range for each preset, relative to today.
function presetRange(preset) {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
  const start = (() => {
    switch (preset) {
      case 'week': {                       // Monday → today
        const day = (now.getDay() + 6) % 7; // 0 = Monday
        return new Date(y, m, d - day);
      }
      case 'month': return new Date(y, m, 1);
      case 'year':  return new Date(y, 0, 1);
      case 'all':   return new Date(2000, 0, 1);
      default:      return new Date(y, m, 1);
    }
  })();
  return { from: toISO(start), to: toISO(now) };
}

const PERIOD_PRESETS = [
  { key: 'week',  label: 'This week'  },
  { key: 'month', label: 'This month' },
  { key: 'year',  label: 'This year'  },
  { key: 'all',   label: 'All time'   },
];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return `${d}d ago`;
}

/* ── KPI card — links to `to`, or fires `onClick` when given instead ─ */
function StatCard({ icon, label, value, to, onClick, accent, sub, loading }) {
  const content = (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${accent.chip}`}>
          <i className={`bi ${icon}`} />
        </div>
        <i className={`bi ${onClick ? 'bi-eye' : 'bi-arrow-up-right'} text-gray-300 group-hover:text-gray-400 transition`} />
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse mb-1 dark:bg-slate-800" />
      ) : (
        <p className="text-2xl font-bold text-gray-800 mb-0.5 dark:text-gray-100">{value}</p>
      )}
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </>
  );
  const className = "group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 dark:bg-slate-900 dark:border-slate-800 text-left w-full";

  if (onClick) {
    return <button type="button" onClick={onClick} className={className}>{content}</button>;
  }
  return <Link to={to} className={className}>{content}</Link>;
}

/* ── My Categories modal — categories assigned to this PM by an admin ─ */
function CategoriesModal({ categories, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <i className="bi bi-folder2-open text-teal-600 dark:text-teal-400" /> My categories
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Assigned to you by an admin</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition shrink-0 dark:bg-slate-800 dark:text-gray-400">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {categories.length ? (
            <div className="space-y-2">
              {categories.map((c) => (
                <div key={c.name} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 dark:border-slate-800 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {c.approved} approved · {c.pending} pending · {c.rejected} rejected
                    </p>
                  </div>
                  <span className="text-sm font-bold text-teal-600 dark:text-teal-400 shrink-0">{c.total}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-300">
              <i className="bi bi-folder-x text-4xl mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">No categories assigned yet.</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 shrink-0">
          <Link
            to="/workspace/products"
            className="block text-center bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl text-sm font-semibold transition"
          >
            View all listings
          </Link>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, icon, action, children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center dark:border-slate-800">
        <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2 dark:text-gray-200">
          <i className={`bi ${icon} text-teal-600 dark:text-teal-400`} />
          {title}
        </h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function WorkspaceOverviewPage() {
  const { user } = useAuth();

  const [showCategories, setShowCategories] = useState(false);

  // Period selector state — preset or a custom {from, to} range.
  const [preset, setPreset]   = useState('month');
  const [custom, setCustom]   = useState({ from: '', to: '' });
  const range = preset === 'custom'
    ? custom
    : presetRange(preset);
  const rangeReady = !!(range.from && range.to);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['pm-stats', range.from, range.to],
    queryFn: () => getPMStats({ from: range.from, to: range.to }).then((res) => res.data),
    enabled: rangeReady,
  });

  const stats         = data?.stats ?? {};
  const byCategory    = data?.by_category ?? [];
  const recentPending = data?.recent_pending ?? [];
  const period        = data?.period ?? {};

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const noCategories = !isLoading && (stats.assigned_categories ?? 0) === 0;

  const kpis = [
    { icon: 'bi-folder2-open',   label: 'My Categories',  value: stats.assigned_categories, onClick: () => setShowCategories(true), accent: { chip: 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400' },      sub: 'Assigned to you' },
    { icon: 'bi-box-seam',       label: 'Total Listings', value: stats.total_products,      to: '/workspace/products',                accent: { chip: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' },  sub: 'In your categories' },
    { icon: 'bi-check2-circle',  label: 'Approved',       value: stats.approved_products,   to: '/workspace/products?status=approved', accent: { chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' }, sub: 'Live on marketplace' },
    { icon: 'bi-hourglass-split',label: 'Pending',        value: stats.pending_products,    to: '/workspace/products?status=pending',  accent: { chip: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' },   sub: 'Awaiting your review' },
    { icon: 'bi-x-circle',       label: 'Rejected',       value: stats.rejected_products,   to: '/workspace/products?status=rejected', accent: { chip: 'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400' },        sub: 'Sent back' },
  ];

  /* ── Chart option builders ──────────────────────────────── */
  const donutOptions = {
    chart: { type: 'pie', height: 250 },
    title: {
      text: `<div style="text-align:center"><div style="font-size:26px;font-weight:700;color:#0f172a">${stats.total_products ?? 0}</div><div style="font-size:11px;color:#94a3b8">listings</div></div>`,
      align: 'center', verticalAlign: 'middle', y: 0, useHTML: true,
    },
    tooltip: { pointFormat: '<b>{point.y}</b> ({point.percentage:.0f}%)' },
    plotOptions: {
      pie: {
        innerSize: '74%', borderWidth: 3, borderColor: '#fff', borderRadius: 5,
        dataLabels: { enabled: false },
      },
    },
    legend: { enabled: true, align: 'center', verticalAlign: 'bottom' },
    series: [{
      name: 'Listings', showInLegend: true,
      data: [
        { name: 'Approved', y: stats.approved_products || 0, color: CHART_COLORS.approved },
        { name: 'Pending',  y: stats.pending_products || 0,  color: CHART_COLORS.pending },
        { name: 'Rejected', y: stats.rejected_products || 0, color: CHART_COLORS.rejected },
      ],
    }],
  };

  // Period performance: number of listings submitted vs approved, by date.
  const perfSeries = period.series ?? [];
  const perfOptions = {
    chart: { height: 260 },
    xAxis: { categories: perfSeries.map((p) => p.label), crosshair: true },
    yAxis: { title: { text: null }, allowDecimals: false },
    legend: { enabled: true, align: 'center', verticalAlign: 'bottom' },
    tooltip: { shared: true },
    plotOptions: { column: { borderRadius: 3, borderWidth: 0 } },
    series: [
      {
        name: 'Listings submitted', type: 'column', color: CHART_COLORS.teal,
        data: perfSeries.map((p) => p.submitted),
      },
      {
        name: 'Listings approved', type: 'spline', color: CHART_COLORS.approved,
        data: perfSeries.map((p) => p.approved), marker: { enabled: false },
      },
    ],
  };

  const categoryOptions = {
    chart: { type: 'column', height: 300 },
    xAxis: { categories: byCategory.map((c) => c.name), labels: { autoRotation: [0, -25, -45] } },
    yAxis: { allowDecimals: false, reversedStacks: false },
    tooltip: { shared: true },
    plotOptions: { column: { stacking: 'normal', borderRadius: 3, borderWidth: 0, pointPadding: 0.08, groupPadding: 0.14 } },
    series: [
      { name: 'Approved', data: byCategory.map((c) => c.approved), color: CHART_COLORS.approved },
      { name: 'Pending',  data: byCategory.map((c) => c.pending),  color: CHART_COLORS.pending },
      { name: 'Rejected', data: byCategory.map((c) => c.rejected), color: CHART_COLORS.rejected },
    ],
  };

  return (
    <WorkspaceLayout>
      {/* ── Hero band ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-slate-800 p-6 md:p-7 mb-6 shadow-lg">
        <div className="absolute -right-8 -top-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute -right-16 top-16 w-40 h-40 rounded-full bg-white/5" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {greeting}, {user?.name?.split(' ')[0]} <i className="bi bi-emoji-smile inline-block" />
            </h2>
            <p className="text-teal-100 text-sm mt-1">
              You have <span className="font-semibold text-white">{stats.pending_products ?? 0}</span> listing(s) waiting for your review.
            </p>
            <Link
              to="/workspace/products?status=pending"
              className="inline-flex items-center gap-2 mt-4 bg-white text-teal-700 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-teal-50 transition shadow dark:bg-slate-900 dark:text-teal-400"
            >
              <i className="bi bi-clipboard-check" /> Review pending listings
            </Link>
          </div>
          {/* Hero mini-metrics */}
          <div className="flex gap-3">
            <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-4 text-center min-w-[104px] border border-white/10">
              <i className="bi bi-hourglass-split text-amber-300 text-xl" />
              <p className="text-2xl font-bold text-white mt-1">{stats.pending_products ?? 0}</p>
              <p className="text-[11px] text-teal-100 uppercase tracking-wide">Pending</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-4 text-center min-w-[104px] border border-white/10">
              <i className="bi bi-lightning-charge-fill text-yellow-300 text-xl" />
              <p className="text-2xl font-bold text-white mt-1">{stats.reviewed_this_week ?? 0}</p>
              <p className="text-[11px] text-teal-100 uppercase tracking-wide">Reviewed 7d</p>
            </div>
          </div>
        </div>
      </div>

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2 dark:bg-red-950/40 dark:border-red-800/50 dark:text-red-400">
          <i className="bi bi-exclamation-triangle" /> Failed to load stats —
          <button onClick={() => refetch()} className="underline font-medium">Retry</button>
        </div>
      )}

      {noCategories ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center dark:bg-slate-900 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 text-3xl flex items-center justify-center mx-auto mb-4 dark:bg-teal-950/40 dark:text-teal-400">
            <i className="bi bi-folder-x" />
          </div>
          <h3 className="font-bold text-gray-700 dark:text-gray-200">No categories assigned yet</h3>
          <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto dark:text-gray-500">
            Once a manager assigns categories to you, your listings, charts and review queue will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* ── KPI cards ─────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {kpis.map((k) => <StatCard key={k.label} {...k} loading={isLoading} />)}
          </div>

          {/* ── Performance panel (period accountability) ─── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2 dark:text-gray-200">
                  <i className="bi bi-graph-up-arrow text-teal-600 dark:text-teal-400" /> Performance
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 dark:text-gray-500">
                  {period.from && period.to ? `${period.from} → ${period.to}` : '—'} · listings submitted and approved in your categories
                </p>
              </div>
              {/* Period selector */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap bg-gray-50 p-1 rounded-xl border border-gray-100 dark:bg-slate-800/60 dark:border-slate-800">
                  {PERIOD_PRESETS.map((p) => (
                    <button key={p.key} onClick={() => setPreset(p.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${preset === p.key ? 'bg-white text-teal-700 shadow-sm dark:bg-slate-900 dark:text-teal-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'}`}>
                      {p.label}
                    </button>
                  ))}
                  <button onClick={() => setPreset('custom')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${preset === 'custom' ? 'bg-white text-teal-700 shadow-sm dark:bg-slate-900 dark:text-teal-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'}`}>
                    Custom
                  </button>
                </div>
                {preset === 'custom' && (
                  <div className="flex items-center gap-1.5">
                    <input type="date" value={custom.from} max={custom.to || undefined}
                      onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700" />
                    <span className="text-gray-400 text-xs dark:text-gray-500">→</span>
                    <input type="date" value={custom.to} min={custom.from || undefined}
                      onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700" />
                  </div>
                )}
              </div>
            </div>

            {/* Period KPI strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { icon: 'bi-inbox',              tint: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/40',   label: 'Submitted',        value: period.submitted ?? 0 },
                { icon: 'bi-check2-circle',      tint: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40', label: 'Approved',         value: period.approved ?? 0 },
                { icon: 'bi-x-circle',           tint: 'text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-950/40',         label: 'Rejected',         value: period.rejected ?? 0 },
                { icon: 'bi-lightning-charge',   tint: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40',     label: 'Reviewed by you',  value: period.reviewed ?? 0 },
              ].map((m) => (
                <div key={m.label} className="rounded-xl border border-gray-100 p-3 dark:border-slate-800">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${m.tint}`}><i className={`bi ${m.icon}`} /></div>
                  {isLoading
                    ? <div className="h-6 w-14 bg-gray-100 rounded animate-pulse dark:bg-slate-800" />
                    : <p className="text-lg font-bold text-gray-800 leading-tight break-words dark:text-gray-100">{m.value}</p>}
                  <p className="text-xs text-gray-500 mt-0.5 dark:text-gray-400">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Period chart */}
            {isLoading ? (
              <div className="h-[260px] bg-gray-50 rounded-xl animate-pulse dark:bg-slate-800/60" />
            ) : perfSeries.length ? (
              <Chart options={perfOptions} />
            ) : (
              <div className="h-[260px] flex flex-col items-center justify-center text-gray-300">
                <i className="bi bi-calendar-x text-4xl mb-2" />
                <p className="text-sm">No activity in this period</p>
              </div>
            )}
          </div>

          {/* ── Charts: status + category ─────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <ChartCard title="Listings by status" icon="bi-pie-chart-fill">
              {isLoading
                ? <div className="h-[250px] bg-gray-50 rounded-xl animate-pulse dark:bg-slate-800/60" />
                : <Chart options={donutOptions} />}
            </ChartCard>
            <ChartCard
              title="Listings by category"
              icon="bi-bar-chart-line-fill"
              className="lg:col-span-2"
              action={<Link to="/workspace/products" className="text-teal-600 text-xs hover:underline font-medium dark:text-teal-400">View all →</Link>}
            >
              {isLoading ? (
                <div className="h-[300px] bg-gray-50 rounded-xl animate-pulse dark:bg-slate-800/60" />
              ) : byCategory.length ? (
                <Chart options={categoryOptions} />
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-gray-300">
                  <i className="bi bi-inboxes text-4xl mb-2" />
                  <p className="text-sm">No listings yet</p>
                </div>
              )}
            </ChartCard>
          </div>

          {/* ── Review queue ──────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col dark:bg-slate-900 dark:border-slate-800">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center dark:border-slate-800">
                <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2 dark:text-gray-200">
                  <i className="bi bi-clipboard-check text-teal-600 dark:text-teal-400" /> Review queue
                </h3>
                {stats.pending_products > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full dark:bg-amber-900/40 dark:text-amber-400">
                    {stats.pending_products} waiting
                  </span>
                )}
              </div>

              <div className="divide-y divide-gray-50 flex-1">
                {isLoading ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                      <div className="w-11 h-11 rounded-lg bg-gray-100 shrink-0 dark:bg-slate-800" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-3/4 bg-gray-100 rounded dark:bg-slate-800" />
                        <div className="h-2.5 w-1/2 bg-gray-100 rounded dark:bg-slate-800" />
                      </div>
                    </div>
                  ))
                ) : recentPending.length ? (
                  recentPending.map((p) => (
                    <Link
                      key={p.product_id}
                      to="/workspace/products?status=pending"
                      className="flex items-center gap-3 px-5 py-3 hover:bg-teal-50/40 transition group"
                    >
                      <div className="w-11 h-11 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-gray-300 dark:bg-slate-800">
                        {p.image
                          ? <img src={storageUrl(p.image)} alt="" className="w-full h-full object-cover" />
                          : <i className="bi bi-image" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700 truncate group-hover:text-teal-700 dark:text-gray-200">{p.title}</p>
                        <p className="text-xs text-gray-400 truncate dark:text-gray-500">
                          {p.category} · {ugx(p.price)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] text-gray-400 flex items-center gap-1 justify-end dark:text-gray-500">
                          <i className="bi bi-clock" />{timeAgo(p.created_at)}
                        </span>
                        <span className="text-[11px] text-teal-600 font-medium opacity-0 group-hover:opacity-100 transition dark:text-teal-400">
                          Review →
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-12 text-gray-300">
                    <i className="bi bi-check2-all text-4xl mb-2 text-emerald-300" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">All caught up — nothing pending!</p>
                  </div>
                )}
              </div>

              {recentPending.length > 0 && (
                <Link
                  to="/workspace/products?status=pending"
                  className="block text-center text-teal-600 text-xs font-semibold py-3 border-t border-gray-50 hover:bg-teal-50/40 transition dark:text-teal-400"
                >
                  Go to review queue →
                </Link>
              )}
            </div>
        </>
      )}

      {showCategories && (
        <CategoriesModal categories={byCategory} onClose={() => setShowCategories(false)} />
      )}
    </WorkspaceLayout>
  );
}
