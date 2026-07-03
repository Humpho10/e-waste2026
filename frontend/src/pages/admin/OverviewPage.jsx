import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { getStats } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';

function StatCard({ icon, label, value, color, bg, to }) {
  return (
    <Link
      to={to}
      className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md hover:border-gray-200 transition group"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${bg}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        {value === undefined || value === null ? (
          <div className="h-8 w-16 bg-gray-100 dark:bg-slate-800 rounded-lg animate-pulse mt-1" />
        ) : (
          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 transition">
            {value}
          </p>
        )}
      </div>
    </Link>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-t border-gray-50 animate-pulse">
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
    'Super-Admin':     'bg-purple-100 text-purple-700',
    'Admin':           'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400',
    'Product-Manager': 'bg-teal-100 text-teal-700',
  };
  const name = role || 'User';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[name] || 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300'}`}>
      {name}
    </span>
  );
}

export default function OverviewPage() {
  const { user } = useAuth();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    getStats()
      .then(res => setStats(res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { icon: '👥', label: 'Total Users',       value: stats?.total_users,       bg: 'bg-blue-50 dark:bg-blue-950/40',   to: '/admin/users'       },
    { icon: '👤', label: 'Total Admins',       value: stats?.total_admins,      bg: 'bg-orange-50 dark:bg-orange-950/40', to: '/admin/admins'      },
    { icon: '🧑‍💼', label: 'Product Managers',  value: stats?.total_managers,    bg: 'bg-teal-50',   to: '/admin/users'       },
    { icon: '🛡️', label: 'Roles',              value: stats?.total_roles,       bg: 'bg-green-50 dark:bg-green-950/40',  to: '/admin/roles'       },
    { icon: '🔑', label: 'Permissions',        value: stats?.total_permissions, bg: 'bg-purple-50', to: '/admin/permissions' },
  ];

  const quickActions = [
    { label: '+ Create Admin',   to: '/admin/admins',      style: 'bg-blue-600 hover:bg-blue-700 text-white'              },
    { label: '+ Create User',    to: '/admin/users',       style: 'bg-gray-800 hover:bg-gray-900 text-white'              },
    { label: 'Manage Roles',     to: '/admin/roles',       style: 'bg-purple-600 hover:bg-purple-700 text-white'          },
    { label: 'View Permissions', to: '/admin/permissions', style: 'border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200' },
    { label: 'Audit Trail',      to: '/admin/audit',       style: 'border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200' },
    { label: 'Settings',         to: '/admin/settings',    style: 'border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200' },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Here's what's happening on E-Waste Mart today.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
          {error} — <button onClick={() => window.location.reload()} className="underline">Retry</button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map(card => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Quick Actions + Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 text-sm uppercase tracking-wide">Quick Actions</h3>
          <div className="space-y-2">
            {quickActions.map(({ label, to, style }) => (
              <Link
                key={to}
                to={to}
                className={`block w-full text-center py-2.5 rounded-xl text-sm font-medium transition ${style}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide">Recent Users</h3>
            <Link to="/admin/users" className="text-blue-600 dark:text-blue-400 text-xs hover:underline font-medium">
              View all →
            </Link>
          </div>
          <table className="w-full text-sm">
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
                  <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
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

      {/* System Info Bar */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
        <div className="flex flex-wrap gap-8 justify-between items-center">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Platform</p>
            <p className="font-bold">E-Waste Mart</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Backend</p>
            <p className="font-bold">Laravel 11</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Auth</p>
            <p className="font-bold">Sanctum</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Roles</p>
            <p className="font-bold">Spatie</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Environment</p>
            <p className="font-bold text-green-400">● Development</p>
          </div>
          <Link
            to="/admin/settings"
            className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition"
          >
            Settings →
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}