import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { myListings } from '../api/products';
import { getNotifications } from '../api/notifications';
import { useAuth } from '../context/AuthContext';

function StatCard({ icon, label, value, color, to }) {
  return (
    <Link to={to} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-100 transition group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-0.5">{value ?? '—'}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
    </Link>
  );
}

const statusConfig = {
  pending:     { label: 'Pending',     color: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' },
  approved:    { label: 'Approved',    color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'   },
  rejected:    { label: 'Rejected',    color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'       },
  resubmitted: { label: 'Resubmitted', color: 'bg-blue-100 text-blue-700 dark:text-blue-400'     },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [listings, setListings]           = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    Promise.all([
      myListings(),
      getNotifications(),
    ]).then(([listRes, notifRes]) => {
      setListings(listRes.data.products || []);
      setNotifications(notifRes.data.notifications || []);
    }).finally(() => setLoading(false));
  }, []);

  const stats = {
    total:    listings.length,
    pending:  listings.filter(l => l.status === 'pending').length,
    approved: listings.filter(l => l.status === 'approved').length,
    rejected: listings.filter(l => l.status === 'rejected').length,
  };

  const unread = notifications.filter(n => !n.is_read).length;
  const hour   = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Here's a summary of your marketplace activity.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon="📦" label="Total Listings"   value={stats.total}    color="bg-blue-50 dark:bg-blue-950/40"   to="/dashboard/listings" />
        <StatCard icon="⏳" label="Pending Approval" value={stats.pending}  color="bg-yellow-50 dark:bg-yellow-950/40" to="/dashboard/listings?status=pending" />
        <StatCard icon="✅" label="Approved"          value={stats.approved} color="bg-green-50 dark:bg-green-950/40"  to="/dashboard/listings?status=approved" />
        <StatCard icon="❌" label="Rejected"          value={stats.rejected} color="bg-red-50 dark:bg-red-950/40"    to="/dashboard/listings?status=rejected" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick actions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: '+ Post a New Listing',  to: '/dashboard/create',        style: 'bg-blue-600 hover:bg-blue-700 text-white'              },
              { label: '🔍 Browse Marketplace', to: '/dashboard/browse',        style: 'bg-slate-800 hover:bg-slate-900 text-white'            },
              { label: '📦 My Listings',         to: '/dashboard/listings',      style: 'border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200' },
              { label: '💬 Messages',            to: '/dashboard/messages',      style: 'border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200' },
              { label: '👤 Edit Profile',        to: '/dashboard/profile',       style: 'border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200' },
            ].map(({ label, to, style }) => (
              <Link key={to} to={to} className={`block w-full text-center py-2.5 rounded-xl text-sm font-medium transition ${style}`}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent listings */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide">Recent Listings</h3>
            <Link to="/dashboard/listings" className="text-blue-600 dark:text-blue-400 text-xs hover:underline">View all →</Link>
          </div>

          {loading ? (
            <div className="p-4 space-y-3 animate-pulse">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-48" />
                    <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-24" />
                  </div>
                  <div className="h-5 w-16 bg-gray-100 dark:bg-slate-800 rounded-full" />
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">No listings yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">Start selling by posting your first e-waste component</p>
              <Link
                to="/dashboard/create"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition"
              >
                Post First Listing
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {listings.slice(0, 5).map(listing => {
                const cfg = statusConfig[listing.status] || statusConfig.pending;
                return (
                  <div key={listing.product_id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-xl shrink-0">
                      📦
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-medium text-gray-800 dark:text-gray-100 truncate text-sm">{listing.title}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        UGX {Number(listing.price).toLocaleString()} · {listing.condition}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Unread notifications banner */}
      {unread > 0 && (
        <div className="mt-6 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 rounded-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <p className="font-semibold text-blue-800 dark:text-blue-300 text-sm">
                You have {unread} unread notification{unread !== 1 ? 's' : ''}
              </p>
              <p className="text-blue-600 dark:text-blue-400 text-xs">Stay updated on your listings and messages</p>
            </div>
          </div>
          <Link
            to="/dashboard/notifications"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
          >
            View All
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
}