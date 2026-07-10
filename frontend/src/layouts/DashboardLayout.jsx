import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiHome, 
  FiGrid, 
  FiSearch, 
  FiPackage, 
  FiPlus, 
  FiMessageCircle, 
  FiBell, 
  FiUser,
  FiLogOut,
  FiMenu,
  FiChevronLeft,
  FiChevronRight,
  FiSun,
  FiMoon,
  FiMail,
  FiMapPin,
  FiShield,
  FiTrendingUp,
  FiList,
  FiTag,
  FiDollarSign,
  FiSettings,
  FiHelpCircle,
  FiStar
} from 'react-icons/fi';
import { FaRecycle, FaShoppingBag } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useBadge } from '../context/BadgeContext';
import { logoutUser } from '../api/auth';
import { storageUrl } from '../api/axios';
import ThemeToggle from '../components/ThemeToggle';
import QuickSearch from '../components/QuickSearch';

const navItems = [
  { path: '/dashboard',               icon: FiGrid, label: 'Overview',       group: 'main',  badge: null },
  { path: '/dashboard/browse',        icon: FiSearch, label: 'Browse',         group: 'main',  badge: null },
  { path: '/dashboard/listings',      icon: FiPackage, label: 'My Listings',    group: 'sell',  badge: null },
  { path: '/dashboard/create',        icon: FiPlus, label: 'Post a Listing', group: 'sell',  badge: null },
  { path: '/dashboard/messages',      icon: FiMessageCircle, label: 'Messages',       group: 'comms', badge: 'msg' },
  { path: '/dashboard/notifications', icon: FiBell, label: 'Notifications',  group: 'comms', badge: 'notif' },
  { path: '/dashboard/profile',       icon: FiUser, label: 'Profile',        group: 'comms', badge: null },
];

const groups = [
  { key: 'main',  label: 'Marketplace' },
  { key: 'sell',  label: 'Selling'     },
  { key: 'comms', label: 'Account'     },
];

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const location         = useLocation();
  const navigate         = useNavigate();
  const queryClient      = useQueryClient();
  const [collapsed, setCollapsed]   = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const { notifCount, msgCount } = useBadge();

  // Instant logout — clear client-side session right away instead of
  // waiting on the network round trip; revoke the token in the background.
  const handleLogout = () => {
    setLoggingOut(true);
    logout();
    queryClient.clear();
    navigate('/');
    logoutUser().catch(() => {});
  };

  const currentLabel = navItems.find(n => location.pathname === n.path)?.label || 'Dashboard';

  const avatarUrl = storageUrl(user?.avatar);

  const getBadgeCount = (badge) => {
    if (badge === 'notif') return notifCount;
    if (badge === 'msg')   return msgCount;
    return 0;
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* Sidebar */}
      <aside className={`
        ${collapsed ? 'w-[70px]' : 'w-[240px]'}
        bg-slate-900 flex flex-col fixed h-full z-20
        transition-all duration-200 ease-in-out border-r border-slate-800
      `}>

        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-slate-800 shrink-0 ${collapsed ? 'justify-center px-3' : 'px-5 gap-3'}`}>
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <FaRecycle className="text-white text-sm" />
            </div>
            {!collapsed && (
              <div>
                <p className="text-white font-bold text-sm leading-tight">E-Waste Mart</p>
                <p className="text-slate-500 text-xs dark:text-gray-400">My Dashboard</p>
              </div>
            )}
          </Link>
        </div>

        {/* User card with avatar */}
        {!collapsed ? (
          <div className="mx-3 mt-4 mb-2 bg-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-slate-400 text-xs truncate dark:text-gray-500">{user?.email}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
          </div>
        ) : (
          <div className="flex justify-center mt-4 mb-2">
            <div className="w-9 h-9 rounded-xl overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4">
          {groups.map(group => {
            const items = navItems.filter(n => n.group === group.key);
            return (
              <div key={group.key}>
                {!collapsed && (
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest px-3 mb-1 dark:text-gray-400">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {items.map(({ path, icon: Icon, label, badge }) => {
                    const active = location.pathname === path;
                    const badgeCount = getBadgeCount(badge);
                    return (
                      <Link
                        key={path}
                        to={path}
                        title={collapsed ? label : ''}
                        className={`
                          flex items-center rounded-xl text-sm transition-all duration-150 relative
                          ${collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5'}
                          ${active
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white dark:text-gray-500'
                          }
                        `}
                      >
                        <span className="text-base shrink-0 relative">
                          <Icon className="w-5 h-5" />
                          {collapsed && badgeCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                              {badgeCount > 9 ? '9+' : badgeCount}
                            </span>
                          )}
                        </span>
                        {!collapsed && <span className="font-medium flex-1">{label}</span>}
                        {!collapsed && badgeCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold shrink-0">
                            {badgeCount > 9 ? '9+' : badgeCount}
                          </span>
                        )}
                        {!collapsed && active && badgeCount === 0 && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-300 shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-2 py-3 border-t border-slate-800 space-y-0.5 shrink-0">
          <Link
            to="/"
            title={collapsed ? 'Back to Site' : ''}
            className={`flex items-center rounded-xl text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-all ${collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5'}`}
          >
            <FiHome className="w-5 h-5" />
            {!collapsed && <span className="font-medium">Back to Site</span>}
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className={`flex items-center rounded-xl text-sm text-slate-400 hover:bg-red-900/40 hover:text-red-400 transition-all w-full ${collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5'}`}
          >
            <FiLogOut className="w-5 h-5" />
            {!collapsed && <span className="font-medium">{loggingOut ? 'Logging out...' : 'Logout'}</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-slate-700 hover:bg-blue-600 border border-slate-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
        >
          <span className="text-xs">{collapsed ? <FiChevronRight className="w-3 h-3" /> : <FiChevronLeft className="w-3 h-3" />}</span>
        </button>
      </aside>

      {/* Main */}
      <div className={`flex-1 flex flex-col min-h-screen ${collapsed ? 'ml-[70px]' : 'ml-[240px]'} transition-all duration-200`}>

        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400 dark:text-gray-500">Dashboard</span>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="font-semibold text-gray-700 dark:text-gray-200">{currentLabel}</span>
          </div>
          <div className="flex items-center gap-3">
            <QuickSearch items={navItems} placeholder="Quick search..." />

            <ThemeToggle />

            <Link
              to="/dashboard/create"
              className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
            >
              <FiPlus className="w-4 h-4" /> Post Listing
            </Link>

            {/* Messages icon with badge */}
            <Link
              to="/dashboard/messages"
              className="relative w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
            >
              <FiMessageCircle className="w-5 h-5" />
              {msgCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold shadow">
                  {msgCount > 9 ? '9+' : msgCount}
                </span>
              )}
            </Link>

            {/* Notification bell with badge */}
            <Link
              to="/dashboard/notifications"
              className="relative w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
            >
              <FiBell className="w-5 h-5" />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold shadow">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </Link>

            <div className="w-px h-6 bg-gray-200 dark:bg-slate-700" />

            {/* User pill – links to profile with avatar */}
            <Link
              to="/dashboard/profile"
              className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
            >
              <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 leading-none">{user?.name?.split(' ')[0]}</p>
                <p className="text-xs text-blue-500 dark:text-blue-400">Buyer / Seller</p>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>

        <footer className="border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-gray-500">© 2026 E-Waste Mart</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Buy · Sell · Recycle</p>
        </footer>
      </div>
    </div>
  );
}