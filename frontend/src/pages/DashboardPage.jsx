import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiPlus,
  FiList,
  FiBell,
  FiArrowRight,
  FiTrendingUp,
  FiActivity,
  FiZap,
  FiRefreshCw,
  FiInbox,
  FiSmile
} from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../layouts/DashboardLayout';
import { myListings } from '../api/products';
import { getNotifications } from '../api/notifications';
import { useAuth } from '../context/AuthContext';

// ── StatCard with Neutral Colors (YOUR PREFERRED VERSION) ──
function StatCard({ icon, label, value, color, to, trend }) {
  const colorMap = {
    slate: {
      bg: 'bg-slate-50 dark:bg-slate-950',
      border: 'border-slate-200 dark:border-slate-700',
      text: 'text-slate-700 dark:text-gray-200',
      hover: 'hover:border-slate-300',
      shadow: 'shadow-slate-100',
      accent: 'bg-slate-100 dark:bg-slate-800',
      iconBg: 'bg-slate-100 dark:bg-slate-800',
      iconText: 'text-slate-700 dark:text-gray-200',
    },
    stone: {
      bg: 'bg-stone-50 dark:bg-slate-800/60',
      border: 'border-stone-200',
      text: 'text-stone-700',
      hover: 'hover:border-stone-300',
      shadow: 'shadow-stone-100',
      accent: 'bg-stone-100 dark:bg-slate-800',
      iconBg: 'bg-stone-100 dark:bg-slate-800',
      iconText: 'text-stone-700',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-800/50',
      text: 'text-amber-700 dark:text-amber-400',
      hover: 'hover:border-amber-300',
      shadow: 'shadow-amber-100',
      accent: 'bg-amber-100 dark:bg-amber-900/40',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      iconText: 'text-amber-700 dark:text-amber-400',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-200',
      text: 'text-emerald-700 dark:text-emerald-400',
      hover: 'hover:border-emerald-300',
      shadow: 'shadow-emerald-100',
      accent: 'bg-emerald-100 dark:bg-emerald-900/40',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      iconText: 'text-emerald-700 dark:text-emerald-400',
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      border: 'border-rose-200',
      text: 'text-rose-700',
      hover: 'hover:border-rose-300',
      shadow: 'shadow-rose-100',
      accent: 'bg-rose-100 dark:bg-rose-900/40',
      iconBg: 'bg-rose-100 dark:bg-rose-900/40',
      iconText: 'text-rose-700',
    },
  };

  const config = colorMap[color] || colorMap.slate;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Link 
        to={to} 
        className={`block bg-white dark:bg-slate-900 rounded-2xl p-6 border ${config.border} shadow-sm ${config.hover} transition-all duration-300 group`}
      >
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 rounded-2xl ${config.iconBg} flex items-center justify-center ${config.iconText} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
          {trend && (
            <motion.div 
              className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full dark:text-emerald-400 dark:bg-emerald-950/40"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <FiTrendingUp className="w-3 h-3" />
              {trend}
            </motion.div>
          )}
        </div>
        <div className="mt-4">
          <motion.p 
            className="text-3xl font-bold text-gray-800 dark:text-gray-100"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {value ?? '—'}
          </motion.p>
          <p className="text-sm text-gray-500 font-medium mt-0.5 dark:text-gray-400">{label}</p>
        </div>
        <div className="mt-3 flex items-center gap-1 text-xs text-gray-400 group-hover:text-gray-600 transition-colors dark:text-gray-500">
          View details <FiArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>
    </motion.div>
  );
}

// ── Status Config ──────────────────────────────────────────────
const statusConfig = {
  pending: {
    label: 'Pending Review',
    color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50',
    icon: FiClock
  },
  approved: {
    label: 'Approved',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400',
    icon: FiCheckCircle
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40',
    icon: FiXCircle
  },
  resubmitted: {
    label: 'Resubmitted',
    color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-gray-200 dark:border-slate-700',
    icon: FiRefreshCw
  },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

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
    total: listings.length,
    pending: listings.filter(l => l.status === 'pending').length,
    approved: listings.filter(l => l.status === 'approved').length,
    rejected: listings.filter(l => l.status === 'rejected').length,
  };

  const unread = notifications.filter(n => !n.is_read).length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Refined Header with subtle gradient */}
        <motion.div 
          className="relative mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-gradient-to-br from-slate-50 via-white to-stone-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-3xl p-8 border border-slate-200 shadow-sm dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3 dark:text-gray-100">
                  {greeting}, {user?.name?.split(' ')[0] || 'User'} 
                  <motion.span
                    className="text-amber-400"
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <FiSmile className="w-7 h-7" />
                  </motion.span>
                </h2>
                <p className="text-slate-500 text-sm mt-1 flex items-center gap-2 dark:text-gray-400">
                  <FiZap className="w-4 h-4 text-slate-400 dark:text-gray-500" />
                  Here's a summary of your marketplace activity
                </p>
              </div>
              
              {/* Subtle stats badge */}
              <div className="mt-3 sm:mt-0">
                <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-slate-700 dark:text-gray-200">Active</span>
                  </div>
                  <div className="w-px h-6 bg-slate-200" />
                  <span className="text-sm text-slate-600 dark:text-gray-300">
                    {stats.approved} listings live
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stat Cards with neutral colors (YOUR VERSION) */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatCard
            icon={<FiPackage className="w-6 h-6" />}
            label="Total Listings"
            value={stats.total}
            color="slate"
            to="/dashboard/listings"
          />
          <StatCard
            icon={<FiClock className="w-6 h-6" />}
            label="Pending Approval"
            value={stats.pending}
            color="amber"
            to="/dashboard/listings?status=pending"
          />
          <StatCard
            icon={<FiCheckCircle className="w-6 h-6" />}
            label="Approved"
            value={stats.approved}
            color="emerald"
            to="/dashboard/listings?status=approved"
          />
          <StatCard
            icon={<FiXCircle className="w-6 h-6" />}
            label="Rejected"
            value={stats.rejected}
            color="rose"
            to="/dashboard/listings?status=rejected"
          />
        </motion.div>

        <div>
          {/* Recent Listings */}
          <motion.div
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-700"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-gray-50/50 to-white dark:from-slate-800/50 dark:to-slate-900 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide flex items-center gap-2 dark:text-gray-100">
                  <FiList className="w-4 h-4 text-blue-500" />
                  Recent Listings
                </h3>
                {!loading && (
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full dark:bg-slate-800 dark:text-gray-300">
                    {listings.length} total
                  </span>
                )}
              </div>
              <Link 
                to="/dashboard/listings" 
                className="text-blue-600 text-xs hover:underline flex items-center gap-1 font-medium group dark:text-blue-400"
              >
                View all 
                <FiArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <div className="p-6 space-y-4">
                  {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="flex gap-4 items-center animate-pulse">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0 dark:bg-slate-800" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-100 rounded w-3/4 dark:bg-slate-800" />
                        <div className="h-3 bg-slate-100 rounded w-1/2 dark:bg-slate-800" />
                      </div>
                      <div className="h-6 w-20 bg-slate-100 rounded-full dark:bg-slate-800" />
                    </div>
                  ))}
                </div>
              ) : listings.length === 0 ? (
                <div className="p-16 text-center">
                  <FiInbox className="w-14 h-14 text-slate-300 mx-auto mb-4 animate-bounce" />
                  <p className="font-bold text-slate-700 text-lg mb-1 dark:text-gray-200">No listings yet</p>
                  <p className="text-slate-400 text-sm mb-6 dark:text-gray-500">Start selling by posting your first e-waste component</p>
                  <Link
                    to="/dashboard/create"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-100 hover:shadow-xl"
                  >
                    <FiPlus className="w-4 h-4" />
                    Post First Listing
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {listings.slice(0, 5).map((listing, index) => {
                    const cfg = statusConfig[listing.status] || statusConfig.pending;
                    const StatusIcon = cfg.icon;
                    return (
                      <motion.div 
                        key={listing.product_id} 
                        className="flex items-center gap-4 px-6 py-4 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent dark:hover:from-blue-950/30 transition-all group cursor-pointer"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ x: 4 }}
                      >
                        <div className={`w-12 h-12 rounded-2xl ${cfg.color.split(' ')[0]} flex items-center justify-center shrink-0 border ${cfg.color.split(' ')[2]} group-hover:scale-110 transition-transform`}>
                          <FiPackage className="w-6 h-6 text-slate-500 dark:text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 truncate text-sm group-hover:text-blue-600 transition-colors dark:text-gray-100">
                            {listing.title}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 dark:text-gray-500">
                            <span>UGX {Number(listing.price).toLocaleString()}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                            <span>{listing.condition}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                            <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                          </p>
                        </div>
                        <span className={`text-xs font-medium px-3 py-1 rounded-full border shrink-0 flex items-center gap-1 ${cfg.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Notifications Banner with neutral colors */}
        <AnimatePresence>
          {unread > 0 && (
            <motion.div 
              className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 rounded-2xl shadow-sm overflow-hidden dark:border-blue-800/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <FiBell className="w-7 h-7 text-blue-500 animate-pulse" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-sm">
                      {unread}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-800 text-sm">
                      You have <span className="text-blue-600 dark:text-blue-400">{unread}</span> unread notification{unread !== 1 ? 's' : ''}
                    </p>
                    <p className="text-blue-600 text-xs flex items-center gap-1 dark:text-blue-400">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                      Stay updated on your listings and messages
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="text-xs text-blue-600 hover:text-blue-800 font-medium dark:text-blue-400">
                    Mark all as read
                  </button>
                  <Link
                    to="/dashboard/notifications"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition shadow-lg shadow-blue-100 hover:shadow-xl flex items-center gap-2"
                  >
                    View All
                    <FiArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Activity Timeline */}
        {listings.length > 0 && (
          <motion.div 
            className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 dark:bg-slate-900 dark:border-slate-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2 mb-4 dark:text-gray-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <FiActivity className="w-4 h-4" />
              </div>
              Recent Activity
            </h3>
            <div className="space-y-2">
              {listings.slice(0, 3).map((listing) => {
                const cfg = statusConfig[listing.status] || statusConfig.pending;
                return (
                  <div key={listing.product_id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50/80 transition-colors">
                    <div className={`w-10 h-10 rounded-xl ${cfg.color.split(' ')[0]} flex items-center justify-center shrink-0`}>
                      <FiPackage className="w-5 h-5 text-slate-500 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate dark:text-gray-100">{listing.title}</p>
                      <p className="text-xs text-slate-400 dark:text-gray-500">{new Date(listing.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
              {unread > 0 && (
                <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50/80 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 dark:bg-blue-950/40">
                    <FiBell className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-gray-100">
                      {unread} new notification{unread > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-gray-500">Just now</p>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/50">
                    New
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Refined Footer */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-200 dark:bg-slate-950 dark:border-slate-700">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" />
            <p className="text-xs text-slate-400 dark:text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
