import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  BiUsers, BiBriefcase, BiBox, BiClock, BiCheckCircle, BiXCircle,
  BiPlus, BiFolderPlus, BiInbox, BiList, BiSunrise, BiSun, BiMoon,
} from '../../components/bi';
import ManagerLayout from '../../layouts/ManagerLayout';
import { getManagerStats, getManagerTrends } from '../../api/manager';
import { useAuth } from '../../context/AuthContext';

function StatCard({ icon: Icon, label, value, iconBg, iconColor, to, sub }) {
  return (
    <Link
      to={to}
      className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md hover:border-orange-100 transition group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg}`}>
          <Icon size={22} className={iconColor} />
        </div>
      </div>
      {value === undefined || value === null ? (
        <div className="h-8 w-16 bg-gray-100 dark:bg-slate-800 rounded-lg animate-pulse mb-1" />
      ) : (
        <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">{value}</p>
      )}
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </Link>
  );
}

const STATUS_COLORS = {
  Approved: '#22c55e',
  Pending:  '#eab308',
  Rejected: '#ef4444',
};

const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default function ManagerOverviewPage() {
  const { user } = useAuth();

  const { data: stats, isLoading: loading, isError, refetch } = useQuery({
    queryKey: ['manager-stats'],
    queryFn: () => getManagerStats().then(res => res.data.stats),
  });

  const { data: trends = [], isLoading: trendsLoading } = useQuery({
    queryKey: ['manager-trends'],
    queryFn: () => getManagerTrends().then(res => res.data.trends),
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const GreetingIcon = hour < 12 ? BiSunrise : hour < 17 ? BiSun : BiMoon;

  const statCards = [
    { icon: BiUsers,      label: 'Regular Users',    value: stats?.total_users,           iconBg: 'bg-blue-50',   iconColor: 'text-blue-600',   to: '/manager/users',                     sub: 'Registered buyers & sellers' },
    { icon: BiBriefcase,  label: 'Product Managers', value: stats?.total_product_managers, iconBg: 'bg-orange-50', iconColor: 'text-orange-600', to: '/manager/product-managers',          sub: 'Managing listings'           },
    { icon: BiBox,        label: 'Total Listings',   value: stats?.total_products,         iconBg: 'bg-purple-50', iconColor: 'text-purple-600', to: '/manager/products',                  sub: 'All time'                    },
    { icon: BiClock,      label: 'Pending Review',   value: stats?.pending_products,       iconBg: 'bg-yellow-50', iconColor: 'text-yellow-600', to: '/manager/products?status=pending',   sub: 'Awaiting approval'           },
    { icon: BiCheckCircle,label: 'Approved',         value: stats?.approved_products,      iconBg: 'bg-green-50',  iconColor: 'text-green-600',  to: '/manager/products?status=approved',  sub: 'Live on marketplace'         },
    { icon: BiXCircle,    label: 'Rejected',         value: stats?.rejected_products,       iconBg: 'bg-red-50',    iconColor: 'text-red-600',    to: '/manager/products?status=rejected',  sub: 'Needs correction'            },
  ];

  const statusBreakdown = [
    { name: 'Approved', value: stats?.approved_products ?? 0 },
    { name: 'Pending',  value: stats?.pending_products ?? 0 },
    { name: 'Rejected', value: stats?.rejected_products ?? 0 },
  ];
  const statusTotal = statusBreakdown.reduce((sum, s) => sum + s.value, 0);

  return (
    <ManagerLayout>
      {/* Header */}
      <div className="mb-8 flex items-center gap-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            {greeting}, {user?.name?.split(' ')[0]}
            <GreetingIcon size={20} className="text-orange-400" />
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Here's your marketplace overview for today.
          </p>
        </div>
      </div>

      {isError && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
          Failed to load stats — <button onClick={() => refetch()} className="underline">Retry</button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map(card => <StatCard key={card.label} {...card} />)}
      </div>

      {/* Quick actions + Activity trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Quick actions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'Create Product Manager', icon: BiPlus,        to: '/manager/product-managers',        style: 'bg-orange-500 hover:bg-orange-600 text-white'           },
              { label: 'Add Category',           icon: BiFolderPlus,  to: '/manager/categories',               style: 'bg-slate-800 hover:bg-slate-900 text-white'              },
              { label: 'Review Pending Listings',icon: BiClock,       to: '/manager/products?status=pending',  style: 'bg-yellow-500 hover:bg-yellow-600 text-white'            },
              { label: 'View All Listings',      icon: BiList,        to: '/manager/products',                 style: 'border border-gray-200 hover:bg-gray-50 text-gray-700'  },
              { label: 'Manage Users',           icon: BiUsers,       to: '/manager/users',                    style: 'border border-gray-200 hover:bg-gray-50 text-gray-700'  },
            ].map(({ label, icon: Icon, to, style }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center justify-center gap-2 w-full text-center py-2.5 rounded-xl text-sm font-medium transition ${style}`}
              >
                <Icon size={16} /> {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Activity trend chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Activity — Last 30 Days</h3>
            <p className="text-xs text-gray-400 mt-0.5">New listings and new user signups per day</p>
          </div>

          <div className="p-4">
            {trendsLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-300 text-sm">Loading chart…</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="listingsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtDate}
                    interval={4}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#f1f5f9' }}
                    tickLine={false}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    labelFormatter={fmtDate}
                    contentStyle={{ borderRadius: 12, border: '1px solid #f1f5f9', fontSize: 13 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="listings" name="New listings" stroke="#7c3aed" fill="url(#listingsGradient)" strokeWidth={2} />
                  <Area type="monotone" dataKey="users" name="New users" stroke="#f97316" fill="url(#usersGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Listings by status */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Listings by Status</h3>
          <Link to="/manager/products" className="text-orange-500 text-xs hover:underline font-medium">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="p-6 flex items-center justify-center h-56">
            <div className="w-40 h-40 rounded-full border-8 border-gray-100 animate-pulse" />
          </div>
        ) : statusTotal === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <BiInbox size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No listings yet</p>
          </div>
        ) : (
          <div className="p-6 flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-64 h-64 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {statusBreakdown.map(entry => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #f1f5f9', fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-3xl font-bold text-gray-800">{statusTotal}</p>
                <p className="text-xs text-gray-400">Total listings</p>
              </div>
            </div>

            <div className="flex-1 w-full space-y-4">
              {statusBreakdown.map(({ name, value }) => {
                const pct = statusTotal > 0 ? Math.round((value / statusTotal) * 100) : 0;
                return (
                  <div key={name}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="flex items-center gap-2 text-gray-600 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[name] }} />
                        {name}
                      </span>
                      <span className="text-gray-400">{value} listings ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: STATUS_COLORS[name] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}
