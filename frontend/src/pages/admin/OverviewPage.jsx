import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import { getStats } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import { useCountUp } from '../../hooks/useCountUp';
import { useTheme } from '../../context/ThemeContext';
import Bi from '../../components/BsIcon';
import HighchartsChart from '../../components/HighchartsChart';

// Brand-consistent palette used across every chart on this page.
const CHART_COLORS = ['#2563eb', '#f97316', '#14b8a6', '#a855f7', '#22c55e', '#eab308'];

function StatCard({ icon, label, value, tone, to, delay, trend, sparklineOptions }) {
  const animated = useCountUp(value ?? 0);
  return (
    <Link
      to={to}
      style={{ animationDelay: delay }}
      className="animate-fade-in-up relative overflow-hidden bg-white dark:bg-slate-900 rounded-xl p-3.5 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col gap-2 hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tone.bg} ${tone.text} group-hover:scale-110 transition-transform duration-200`}>
          <Bi name={icon} size={15} />
        </div>
        {trend !== undefined && (
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            trend >= 0
              ? 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
          }`}>
            <Bi name={trend >= 0 ? 'graph-up-arrow' : 'graph-down-arrow'} size={10} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        {value === undefined || value === null ? (
          <div className="h-6 w-14 bg-gray-100 dark:bg-slate-800 rounded-lg animate-pulse mt-1" />
        ) : (
          <p className="text-xl font-bold text-gray-800 dark:text-gray-100 tabular-nums">
            {animated.toLocaleString()}
          </p>
        )}
      </div>
      {/* Bottom accent — a real Highcharts sparkline where we have history, else a quiet brand-colored bar */}
      <div className="-mx-3.5 -mb-3.5 mt-0.5">
        {sparklineOptions ? (
          <HighchartsChart options={sparklineOptions} height={26} />
        ) : (
          <div className="h-1 w-full" style={{ background: tone.hex, opacity: 0.35 }} />
        )}
      </div>
    </Link>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-t border-gray-50 dark:border-slate-800 animate-pulse">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-slate-800" />
          <div className="h-3 w-28 bg-gray-100 dark:bg-slate-800 rounded" />
        </div>
      </td>
      <td className="px-4 py-3"><div className="h-3 w-36 bg-gray-100 dark:bg-slate-800 rounded" /></td>
      <td className="px-4 py-3"><div className="h-5 w-20 bg-gray-100 dark:bg-slate-800 rounded-full" /></td>
      <td className="px-4 py-3"><div className="h-3 w-20 bg-gray-100 dark:bg-slate-800 rounded" /></td>
    </tr>
  );
}

function RoleBadge({ role }) {
  const colors = {
    'Super-Admin':     'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400',
    'Admin':           'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400',
    'Product-Manager': 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400',
  };
  const name = role || 'User';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[name] || 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300'}`}>
      {name}
    </span>
  );
}

// One radial Highcharts solid-gauge dial — used for the listing pipeline so
// each status reads as a real, glanceable "% of total listings" ring.
function PipelineGauge({ label, value, target, color, isDark }) {
  const pct = target > 0 ? Math.round((value / target) * 100) : 0;

  const options = useMemo(() => ({
    chart: { type: 'solidgauge' },
    pane: {
      center: ['50%', '62%'],
      size: '105%',
      startAngle: -110,
      endAngle: 110,
      background: {
        backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
        innerRadius: '72%',
        outerRadius: '100%',
        shape: 'arc',
        borderWidth: 0,
      },
    },
    xAxis: undefined,
    yAxis: {
      min: 0,
      max: 100,
      lineWidth: 0,
      tickWidth: 0,
      minorTickInterval: null,
      tickAmount: 0,
      labels: { enabled: false },
    },
    plotOptions: {
      solidgauge: {
        dataLabels: {
          y: -6,
          borderWidth: 0,
          useHTML: true,
          format: `<div style="text-align:center"><span style="font-size:20px;font-weight:800;line-height:1;color:${isDark ? '#f1f5f9' : '#1f2937'}">${pct}%</span></div>`,
        },
      },
    },
    tooltip: { enabled: false },
    series: [{ name: label, data: [{ y: pct, color }], radius: '100%', innerRadius: '72%' }],
  }), [pct, color, label, isDark]);

  return (
    <div className="animate-fade-in-up flex flex-col items-center">
      <HighchartsChart options={options} height={136} />
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 -mt-2">{label}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        {value.toLocaleString()} · <span className="text-gray-500 dark:text-gray-400">Target: {target.toLocaleString()}</span>
      </p>
    </div>
  );
}

const activityIcon = (action) => {
  if (action === 'created') return { icon: 'plus-circle-fill', tone: 'text-green-500 bg-green-50 dark:bg-green-950/40' };
  if (action === 'deleted') return { icon: 'x-circle-fill', tone: 'text-red-500 bg-red-50 dark:bg-red-950/40 dark:text-red-400' };
  return { icon: 'activity', tone: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' };
};

export default function OverviewPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const { data: stats, isLoading: loading, isError, error, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => getStats().then(res => res.data),
    refetchInterval: 60_000, // keep the "live" dashboard reasonably fresh
  });

  const weekTrend = stats && stats.new_users_prev_week > 0
    ? Math.round(((stats.new_users_this_week - stats.new_users_prev_week) / stats.new_users_prev_week) * 100)
    : (stats?.new_users_this_week > 0 ? 100 : 0);

  const listingStats = stats?.listing_stats;
  const roleDistribution = stats?.role_distribution || [];
  const categoryBreakdown = stats?.category_breakdown || [];
  const userGrowth = stats?.user_growth || [];

  // Real cumulative signup curve (sum of the 14-day daily counts) — used
  // as the Total Users sparkline so the card never shows fabricated data.
  const growthSparkline = useMemo(() => userGrowth.reduce((acc, d) => {
    acc.push((acc[acc.length - 1] || 0) + d.users);
    return acc;
  }, []), [userGrowth]);

  const sparklineOptions = useMemo(() => {
    if (growthSparkline.length < 2) return null;
    return {
      chart: { type: 'areaspline', margin: [2, 0, 2, 0] },
      xAxis: { visible: false },
      yAxis: { visible: false, title: { text: null } },
      tooltip: { enabled: false },
      legend: { enabled: false },
      plotOptions: {
        series: {
          animation: false,
          enableMouseTracking: false,
          marker: { enabled: false },
          lineWidth: 2,
          fillOpacity: 0.25,
          states: { hover: { enabled: false } },
        },
      },
      series: [{ data: growthSparkline, color: '#2563eb' }],
    };
  }, [growthSparkline]);

  // ── Highcharts configs for the "real" charts on this page ─────────
  const userGrowthOptions = useMemo(() => ({
    chart: { type: 'areaspline' },
    xAxis: { categories: userGrowth.map(d => d.date), tickInterval: 2 },
    yAxis: { allowDecimals: false, title: { text: null } },
    tooltip: { shared: true, valueSuffix: ' signups' },
    legend: { enabled: false },
    plotOptions: {
      areaspline: {
        fillOpacity: 0.25,
        marker: { enabled: false, symbol: 'circle', states: { hover: { enabled: true, radius: 5 } } },
        lineWidth: 2.5,
      },
    },
    series: [{ name: 'Signups', data: userGrowth.map(d => d.users), color: '#2563eb' }],
  }), [userGrowth]);

  const roleTotal = roleDistribution.reduce((s, r) => s + r.value, 0);

  const roleDonutOptions = useMemo(() => ({
    chart: { type: 'pie' },
    tooltip: { pointFormat: '<b>{point.y}</b> users ({point.percentage:.0f}%)' },
    legend: { enabled: false },
    plotOptions: {
      pie: {
        innerSize: '70%',
        dataLabels: { enabled: false },
        borderWidth: 3,
        borderColor: isDark ? '#0f172a' : '#ffffff',
        states: { hover: { halo: { size: 6 } } },
      },
    },
    series: [{
      name: 'Users',
      data: roleDistribution.map((r, i) => ({ name: r.name, y: r.value, color: CHART_COLORS[i % CHART_COLORS.length] })),
    }],
  }), [roleDistribution, isDark]);

  const categoryBarOptions = useMemo(() => ({
    chart: { type: 'bar' },
    xAxis: { categories: categoryBreakdown.map(c => c.name) },
    yAxis: { allowDecimals: false, title: { text: null } },
    legend: { enabled: false },
    tooltip: { pointFormat: '<b>{point.y}</b> listings' },
    plotOptions: {
      bar: {
        borderRadius: 6,
        colorByPoint: true,
        dataLabels: { enabled: true, style: { fontWeight: '600', textOutline: 'none' } },
      },
    },
    series: [{ name: 'Listings', data: categoryBreakdown.map(c => c.count) }],
  }), [categoryBreakdown]);

  const statCards = [
    { icon: 'people-fill',        label: 'Total Users',     value: stats?.total_users,       tone: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400', hex: '#2563eb' },     to: '/admin/users',       trend: weekTrend, sparklineOptions },
    { icon: 'person-badge-fill',  label: 'Total Admins',     value: stats?.total_admins,      tone: { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-600 dark:text-orange-400', hex: '#f97316' }, to: '/admin/admins' },
    { icon: 'kanban-fill',        label: 'Product Managers', value: stats?.total_managers,    tone: { bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-600 dark:text-teal-400', hex: '#14b8a6' },     to: '/admin/product-managers' },
    { icon: 'shield-lock-fill',   label: 'Roles',            value: stats?.total_roles,       tone: { bg: 'bg-green-50 dark:bg-green-950/40', text: 'text-green-600 dark:text-green-400', hex: '#22c55e' },   to: '/admin/roles' },
    { icon: 'sliders',            label: 'Permissions',      value: stats?.total_permissions, tone: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400', hex: '#a855f7' }, to: '/admin/permissions' },
  ];

  const quickActions = [
    { label: 'Create Admin',     to: '/admin/admins',      icon: 'person-check-fill', style: 'bg-blue-600 hover:bg-blue-700 text-white'              },
    { label: 'Create User',      to: '/admin/users',       icon: 'plus-circle-fill',  style: 'bg-gray-800 hover:bg-gray-900 text-white'              },
    { label: 'Manage Roles',     to: '/admin/roles',       icon: 'shield-lock-fill',  style: 'bg-purple-600 hover:bg-purple-700 text-white'          },
    { label: 'View Permissions', to: '/admin/permissions', icon: 'key-fill',          style: 'border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200' },
    { label: 'Audit Trail',      to: '/admin/audit',       icon: 'list-ul',           style: 'border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200' },
    { label: 'Settings',         to: '/admin/settings',    icon: 'gear-fill',         style: 'border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200' },
  ];

  return (
    <AdminLayout>
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-[#0b2545] rounded-2xl p-6 md:p-8 shadow-xl shadow-blue-900/30 dark:shadow-black/40 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* decorative glow accents */}
        <div className="absolute -top-20 -right-14 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 w-56 h-56 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Live badge */}
        <div className="absolute top-5 right-5 md:top-6 md:right-6 flex items-center gap-1.5 text-[11px] font-medium text-white/90 bg-white/10 border border-white/10 backdrop-blur px-2.5 py-1 rounded-full z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-dot" />
          Live
        </div>

        <div className="relative z-[1]">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} <span>👋</span>
          </h2>
          <p className="text-blue-100/90 text-sm mt-1.5 max-w-md">
            {listingStats?.pending > 0
              ? `${listingStats.pending} listing${listingStats.pending === 1 ? '' : 's'} across the platform ${listingStats.pending === 1 ? 'is' : 'are'} waiting for review by your Admins and Product Managers.`
              : 'All listings are reviewed — the queue is clear.'}
          </p>
          <p className="mt-4 inline-flex items-center gap-2 text-blue-100/70 text-xs">
            <Bi name="info-circle-fill" size={13} />
            Listing review is handled by Admins &amp; Product Managers — this overview shows platform-wide totals only.
          </p>
        </div>

        <div className="relative z-[1] flex flex-wrap gap-3 md:shrink-0">
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl px-5 py-3 text-center min-w-[110px]">
            <Bi name="box-seam-fill" size={17} className="text-white/80 mx-auto mb-1" />
            <p className="text-xl font-bold text-white tabular-nums">{listingStats?.total ?? 0}</p>
            <p className="text-[10px] text-blue-100/80 uppercase tracking-wide font-medium">Total Listings</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl px-5 py-3 text-center min-w-[110px]">
            <Bi name="hourglass-split" size={17} className="text-white/80 mx-auto mb-1" />
            <p className="text-xl font-bold text-white tabular-nums">{listingStats?.pending ?? 0}</p>
            <p className="text-[10px] text-blue-100/80 uppercase tracking-wide font-medium">Pending</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl px-5 py-3 text-center min-w-[110px]">
            <Bi name="person-plus-fill" size={17} className="text-white/80 mx-auto mb-1" />
            <p className="text-xl font-bold text-white tabular-nums">{stats?.new_users_this_week ?? 0}</p>
            <p className="text-[10px] text-blue-100/80 uppercase tracking-wide font-medium">New Users 7D</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
          {error?.response?.data?.message || 'Failed to load stats'} — <button onClick={() => refetch()} className="underline">Retry</button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {statCards.map((card, i) => (
          <StatCard key={card.label} {...card} delay={`${i * 60}ms`} />
        ))}
      </div>

      {/* Charts row: user growth trend + role distribution donut (real Highcharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="animate-fade-in-up lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide flex items-center gap-2">
              <Bi name="bar-chart-line-fill" size={16} className="text-blue-500 dark:text-blue-400" /> User Growth
            </h3>
            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-slate-800 px-2.5 py-1 rounded-full">Last 14 days</span>
          </div>
          {loading ? (
            <div className="h-56 bg-gray-50 dark:bg-slate-800/60 rounded-xl animate-pulse" />
          ) : (
            <HighchartsChart options={userGrowthOptions} height={220} />
          )}
        </div>

        <div className="animate-fade-in-up stagger-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 flex flex-col">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide flex items-center gap-2 mb-4">
            <Bi name="pie-chart-fill" size={16} className="text-purple-500 dark:text-purple-400" /> Users by Role
          </h3>
          {loading ? (
            <div className="h-56 bg-gray-50 dark:bg-slate-800/60 rounded-xl animate-pulse" />
          ) : roleDistribution.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-16">No role data yet</p>
          ) : (
            <>
              <div className="relative flex justify-center">
                <HighchartsChart options={roleDonutOptions} height={170} className="w-full max-w-[190px]" />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">{roleTotal}</span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">Total Users</span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {roleDistribution.map((entry, i) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {entry.name}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500 font-medium">
                      {entry.value} · {roleTotal > 0 ? Math.round((entry.value / roleTotal) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Listing pipeline (solid-gauge dials) + category breakdown (Highcharts bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="animate-fade-in-up stagger-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide flex items-center gap-2 mb-2">
            <Bi name="box-seam-fill" size={16} className="text-blue-500 dark:text-blue-400" /> Listing Pipeline
          </h3>
          {loading || !listingStats ? (
            <div className="grid grid-cols-3 gap-2">
              {Array(3).fill(0).map((_, i) => <div key={i} className="h-28 bg-gray-50 dark:bg-slate-800/60 rounded animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              <PipelineGauge label="Approved" value={listingStats.approved} target={listingStats.total} color="#22c55e" isDark={isDark} />
              <PipelineGauge label="Pending" value={listingStats.pending} target={listingStats.total} color="#eab308" isDark={isDark} />
              <PipelineGauge label="Rejected" value={listingStats.rejected} target={listingStats.total} color="#ef4444" isDark={isDark} />
            </div>
          )}
          <div className="pt-3 mt-1 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5"><Bi name="check-circle-fill" size={13} /> Total listings</span>
            <span className="font-bold text-gray-800 dark:text-gray-100">{(listingStats?.total ?? 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="lg:col-span-2 animate-fade-in-up stagger-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide flex items-center gap-2 mb-2">
            <Bi name="tags-fill" size={16} className="text-orange-500 dark:text-orange-400" /> Busiest Categories
          </h3>
          {loading ? (
            <div className="h-52 bg-gray-50 dark:bg-slate-800/60 rounded-xl animate-pulse" />
          ) : categoryBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-16">No category data yet</p>
          ) : (
            <HighchartsChart options={categoryBarOptions} height={Math.max(210, categoryBreakdown.length * 42)} />
          )}
        </div>
      </div>

      {/* Quick Actions + Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Quick Actions */}
        <div className="animate-fade-in-up stagger-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
            <Bi name="lightning-charge-fill" size={16} className="text-amber-500 dark:text-amber-400" /> Quick Actions
          </h3>
          <div className="space-y-2">
            {quickActions.map(({ label, to, style, icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center justify-center gap-2 w-full text-center py-2.5 rounded-xl text-sm font-medium transition hover:-translate-y-0.5 ${style}`}
              >
                <Bi name={icon} size={15} /> {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="lg:col-span-2 animate-fade-in-up stagger-5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide flex items-center gap-2">
              <Bi name="people-fill" size={16} className="text-blue-500 dark:text-blue-400" /> Recent Users
            </h3>
            <Link to="/admin/users" className="text-blue-600 dark:text-blue-400 text-xs hover:underline font-medium flex items-center gap-1">
              View all <Bi name="arrow-right" size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800/60">
              <tr>
                {['Name', 'Email', 'Role', 'Joined'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
              ) : stats?.recent_users?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                    No users yet
                  </td>
                </tr>
              ) : (
                stats?.recent_users?.map(u => (
                  <tr key={u.id} className="border-t border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800 dark:text-gray-100 text-sm">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">{u.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.roles?.[0]?.name} />
                    </td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString('en-UG', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Recent Activity + System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 animate-fade-in-up bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide flex items-center gap-2 mb-4">
            <Bi name="activity" size={16} className="text-blue-500 dark:text-blue-400" /> Recent Activity
          </h3>
          {loading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => <div key={i} className="h-10 bg-gray-50 dark:bg-slate-800/60 rounded-xl animate-pulse" />)}
            </div>
          ) : stats?.recent_activity?.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No recent activity</p>
          ) : (
            <ul className="space-y-1">
              {stats?.recent_activity?.map(entry => {
                const { icon, tone } = activityIcon(entry.action);
                return (
                  <li key={entry.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-slate-800 last:border-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tone}`}>
                      <Bi name={icon} size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-200 truncate">
                        <span className="font-semibold">{entry.user}</span> {entry.action} a record in <span className="font-medium">{entry.table}</span>
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 shrink-0">
                      <Bi name="clock-history" size={11} />
                      {new Date(entry.created_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'short' })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* System Info Bar — background is a fixed dark gradient in both themes, so its own text stays fixed too */}
        <div className="animate-fade-in-up bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white flex flex-col justify-between">
          <div>
            <h3 className="text-xs uppercase tracking-wide text-gray-400 flex items-center gap-2 mb-4 dark:text-gray-500">
              <Bi name="hdd-network-fill" size={15} /> System Status
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Active Users</span>
                <span className="font-semibold text-emerald-400">{loading ? '...' : (stats?.total_users ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">E-Waste Listings</span>
                <span className="font-semibold">{loading ? '...' : (listingStats?.total ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Pending Approvals</span>
                <span className={`font-semibold ${(listingStats?.pending ?? 0) > 0 ? 'text-amber-400' : ''}`}>{loading ? '...' : (listingStats?.pending ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Recycling Partners</span>
                <span className="font-semibold">{loading ? '...' : (stats?.total_managers ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">CO₂ Offset</span>
                <span className="font-semibold text-green-400 flex items-center gap-1.5">
                  <Bi name="tree-fill" size={12} /> {loading ? '...' : `${stats?.co2_offset ?? 0}`} kg
                </span>
              </div>
            </div>
          </div>
          <Link
            to="/admin/settings"
            className="mt-5 bg-white text-gray-900 hover:bg-gray-100 px-4 py-2.5 rounded-xl text-sm font-semibold transition text-center flex items-center justify-center gap-2 dark:bg-slate-900 dark:text-gray-100"
          >
            <Bi name="gear-fill" size={15} /> Settings
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
