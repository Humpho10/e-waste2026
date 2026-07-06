import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import WorkspaceLayout from '../../layouts/WorkspaceLayout';
import { getPMStats } from '../../api/productManager';
import { useAuth } from '../../context/AuthContext';

function StatCard({ icon, label, value, bg, to, sub }) {
  return (
    <Link to={to} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-100 transition group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 ${bg}`}>
        {icon}
      </div>
      {value === undefined || value === null ? (
        <div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse mb-1" />
      ) : (
        <p className="text-3xl font-bold text-gray-800 mb-1">{value}</p>
      )}
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </Link>
  );
}

export default function WorkspaceOverviewPage() {
  const { user } = useAuth();

  const { data: stats, isLoading: loading, isError, refetch } = useQuery({
    queryKey: ['pm-stats'],
    queryFn: () => getPMStats().then(res => res.data.stats),
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const statCards = [
    { icon: '📂', label: 'My Categories',    value: stats?.assigned_categories, bg: 'bg-teal-50',   to: '/workspace/products',                sub: 'Categories assigned to you'  },
    { icon: '📦', label: 'Total Listings',   value: stats?.total_products,      bg: 'bg-blue-50',   to: '/workspace/products',                sub: 'In your categories'          },
    { icon: '⏳', label: 'Pending Review',   value: stats?.pending_products,    bg: 'bg-yellow-50', to: '/workspace/products?status=pending',  sub: 'Awaiting your review'        },
    { icon: '✅', label: 'Approved',         value: stats?.approved_products,   bg: 'bg-green-50',  to: '/workspace/products?status=approved', sub: 'Approved by you'             },
    { icon: '❌', label: 'Rejected',         value: stats?.rejected_products,   bg: 'bg-red-50',    to: '/workspace/products?status=rejected', sub: 'Sent back for correction'    },
  ];

  return (
    <WorkspaceLayout>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Here's an overview of listings in your assigned categories.
        </p>
      </div>

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
          Failed to load stats — <button onClick={() => refetch()} className="underline">Retry</button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map(card => <StatCard key={card.label} {...card} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: '⏳ Review Pending',    to: '/workspace/products?status=pending',  style: 'bg-teal-600 hover:bg-teal-700 text-white'              },
              { label: '📦 All Listings',      to: '/workspace/products',                 style: 'bg-slate-800 hover:bg-slate-900 text-white'            },
              { label: '💬 Messages',          to: '/workspace/messages',                 style: 'border border-gray-200 hover:bg-gray-50 text-gray-700' },
              { label: '🔔 Notifications',     to: '/workspace/notifications',            style: 'border border-gray-200 hover:bg-gray-50 text-gray-700' },
            ].map(({ label, to, style }) => (
              <Link key={to} to={to} className={`block w-full text-center py-2.5 rounded-xl text-sm font-medium transition ${style}`}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Listings in My Categories</h3>
            <Link to="/workspace/products" className="text-teal-600 text-xs hover:underline font-medium">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="p-6 space-y-4 animate-pulse">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-3 w-16 bg-gray-100 rounded" />
                  <div className="flex-1 h-3 bg-gray-100 rounded-full" />
                  <div className="h-3 w-8 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {[
                { label: 'Approved',  value: stats?.approved_products, total: stats?.total_products, color: 'bg-green-500'  },
                { label: 'Pending',   value: stats?.pending_products,  total: stats?.total_products, color: 'bg-yellow-400' },
                { label: 'Rejected',  value: stats?.rejected_products, total: stats?.total_products, color: 'bg-red-400'    },
              ].map(({ label, value, total, color }) => {
                const pct = total > 0 ? Math.round(((value || 0) / total) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-600 font-medium">{label}</span>
                      <span className="text-gray-400">{value ?? 0} listings ({pct}%)</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {!stats?.total_products && (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-3xl mb-2">📭</p>
                  <p className="text-sm">No listings in your categories yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </WorkspaceLayout>
  );
}