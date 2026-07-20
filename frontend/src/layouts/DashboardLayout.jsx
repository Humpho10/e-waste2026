import { useEffect, useState } from 'react';
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
import { setIntentionalLogout, storageUrl } from '../api/axios';
import ThemeToggle from '../components/ThemeToggle';
import QuickSearch from '../components/QuickSearch';
//import { storageUrl } from '../lib/urls';

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const { notifCount, msgCount } = useBadge();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Instant logout — clear client-side session right away instead of
  // waiting on the network round trip; revoke the token in the background.
  // The token clear is deferred one tick so the revoke request still goes
  // out authenticated (it reads localStorage when axios builds it) — doing
  // it synchronously here would race the request and 401 it, which the
  // global interceptor would then mistake for a real expired session.
  // intentionalLogout stays true for a fixed grace window rather than
  // resetting as soon as the logout call itself resolves — queryClient.clear()
  // below also forces an immediate (token-less) refetch of whatever's still
  // mounted (e.g. badge counts), and that request's own 401 would otherwise
  // race the reset and trigger the same false "session expired" redirect.
  const handleLogout = () => {
    setIntentionalLogout(true);
    setLoggingOut(true);
    logoutUser().catch(() => {});
    setTimeout(() => {
      logout();
      queryClient.clear();
      navigate('/');
    }, 0);
    setTimeout(() => setIntentionalLogout(false), 1000);
  };

  const currentLabel = navItems.find(n => location.pathname === n.path)?.label || 'Dashboard';

  const avatarUrl = storageUrl(user?.avatar);

  // Icon-only rail applies to the desktop collapse toggle only — the
  // mobile drawer always shows the expanded sidebar.
  const isRail = collapsed && !mobileOpen;

  const getBadgeCount = (badge) => {
    if (badge === 'notif') return notifCount;
    if (badge === 'msg')   return msgCount;
    return 0;
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
        />
      )}

      {/* Sidebar — off-canvas drawer on mobile, fixed rail on md+ */}
      <aside className={`
        ${collapsed ? 'md:w-[70px]' : 'md:w-[240px]'} w-[240px]
        bg-slate-900 flex flex-col fixed h-full z-40
        transition-all duration-200 ease-in-out border-r border-slate-800
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>

        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-slate-800 shrink-0 ${isRail ? 'justify-center px-3' : 'px-5 gap-3'}`}>
          <Link to="/" className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <FaRecycle className="text-white text-sm" />
            </div>
            {!isRail && (
              <div>
                <p className="text-white font-bold text-sm leading-tight">E-Waste Mart</p>
                <p className="text-slate-500 text-xs dark:text-gray-400">My Dashboard</p>
              </div>
            )}
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white transition shrink-0"
          >
            <FiChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* User card with avatar */}
        {!isRail ? (
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
                {!isRail && (
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
                        title={isRail ? label : ''}
                        className={`
                          flex items-center rounded-xl text-sm transition-all duration-150 relative
                          ${isRail ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5'}
                          ${active
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white dark:text-gray-500'
                          }
                        `}
                      >
                        <span className="text-base shrink-0 relative">
                          <Icon className="w-5 h-5" />
                          {isRail && badgeCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                              {badgeCount > 9 ? '9+' : badgeCount}
                            </span>
                          )}
                        </span>
                        {!isRail && <span className="font-medium flex-1">{label}</span>}
                        {!isRail && badgeCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold shrink-0">
                            {badgeCount > 9 ? '9+' : badgeCount}
                          </span>
                        )}
                        {!isRail && active && badgeCount === 0 && (
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
            title={isRail ? 'Back to Site' : ''}
            className={`flex items-center rounded-xl text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-all ${isRail ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5'}`}
          >
            <FiHome className="w-5 h-5" />
            {!isRail && <span className="font-medium">Back to Site</span>}
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className={`flex items-center rounded-xl text-sm text-slate-400 hover:bg-red-900/40 hover:text-red-400 transition-all w-full ${isRail ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5'}`}
          >
            <FiLogOut className="w-5 h-5" />
            {!isRail && <span className="font-medium">{loggingOut ? 'Logging out...' : 'Logout'}</span>}
          </button>
        </div>

        {/* Collapse toggle — desktop only, the mobile drawer uses the back button instead */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-3 top-20 w-6 h-6 bg-slate-700 hover:bg-blue-600 border border-slate-600 rounded-full items-center justify-center text-white transition-colors shadow-lg"
        >
          <span className="text-xs">{collapsed ? <FiChevronRight className="w-3 h-3" /> : <FiChevronLeft className="w-3 h-3" />}</span>
        </button>
      </aside>

      {/* Main — min-w-0 lets this flex item shrink to the viewport so wide
          content scrolls inside its own container instead of the page. */}
      <div className={`flex-1 flex flex-col min-h-screen min-w-0 ${collapsed ? 'md:ml-[70px]' : 'md:ml-[240px]'} transition-all duration-200`}>

        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2 px-3 sm:px-6 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition shrink-0"
            >
              <FiMenu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-gray-400 dark:text-gray-500">Dashboard</span>
              <span className="hidden sm:inline text-gray-300 dark:text-gray-600">/</span>
              <span className="font-semibold text-gray-700 dark:text-gray-200 truncate">{currentLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
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

            <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-slate-700" />

            {/* User pill – links to profile with avatar */}
            <Link
              to="/dashboard/profile"
              className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl px-1.5 sm:px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
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

        <main className="flex-1 p-4 sm:p-6">{children}</main>

        <footer className="border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
          <p className="text-xs text-gray-400 dark:text-gray-500">© 2026 E-Waste Mart</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Buy · Sell · Recycle</p>
        </footer>
      </div>
    </div>
  );
}