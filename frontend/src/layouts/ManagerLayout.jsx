import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BiGrid, BiBriefcase, BiFolder, BiBox, BiUsers, BiUser,
  BiMessageSquare, BiBell, BiLogOut, BiChevronLeft, BiChevronRight,
  BiList, BiX,
} from '../components/bi';
import { useAuth } from '../context/AuthContext';
import { useBadge } from '../context/BadgeContext'; // 👈 For badge counts
import { logoutUser } from '../api/auth';
import { storageUrl } from '../api/axios';
import ThemeToggle from '../components/ThemeToggle';
import QuickSearch from '../components/QuickSearch';
import { Recycle } from '../components/icons';
import { storageUrl } from '../lib/urls';

const navItems = [
  { path: '/manager',                   icon: BiGrid,          label: 'Overview',          group: 'main',  badge: null   },
  { path: '/manager/product-managers',  icon: BiBriefcase,     label: 'Product Managers',  group: 'main',  badge: null   },
  { path: '/manager/categories',        icon: BiFolder,        label: 'Categories',         group: 'main',  badge: null   },
  { path: '/manager/products',          icon: BiBox,           label: 'Listings',           group: 'main',  badge: null   },
  { path: '/manager/users',             icon: BiUsers,         label: 'Users',              group: 'main',  badge: null   },
  { path: '/manager/profile',           icon: BiUser,          label: 'Profile',            group: 'main',  badge: null   },
  { path: '/manager/messages',          icon: BiMessageSquare, label: 'Messages',           group: 'comms', badge: 'msg'  }, // 👈 Added
  { path: '/manager/notifications',     icon: BiBell,          label: 'Notifications',      group: 'comms', badge: 'notif' }, // 👈 Added
];

const groups = [
  { key: 'main',  label: 'Management' },
  { key: 'comms', label: 'Communications' },
];

export default function ManagerLayout({ children }) {
  const { user, logout } = useAuth();
  const location         = useLocation();
  const navigate         = useNavigate();
  const queryClient      = useQueryClient();
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // 👇 Get badge counts from context
  const { notifCount, msgCount } = useBadge();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Instant logout — clear client-side session right away instead of
  // waiting on the network round trip; revoke the token in the background.
  const handleLogout = () => {
    setLoggingOut(true);
    logout();
    queryClient.clear(); // wipe cached data so it doesn't leak into the next session
    navigate('/');
    logoutUser().catch(() => {});
  };

  const currentLabel = navItems.find(n => location.pathname === n.path)?.label || 'Manager Panel';

  // 👇 Avatar helper
  const avatarUrl = storageUrl(user?.avatar);

  // Icon-only rail applies to the desktop collapse toggle only — the
  // mobile drawer always shows the expanded sidebar.
  const isRail = collapsed && !mobileOpen;

  // 👇 Helper to get badge count for a nav item
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
        transition-all duration-200 ease-in-out
        border-r border-slate-800
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>

        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-slate-800 shrink-0 ${isRail ? 'justify-center px-3' : 'px-5 gap-3'}`}>
          <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
            <Recycle width={16} height={16} className="text-white" />
          </div>
          {!isRail && (
            <div className="overflow-hidden flex-1">
              <p className="text-white font-bold text-sm leading-tight truncate">E-Waste Mart</p>
              <p className="text-slate-500 text-xs dark:text-gray-400">Admin Panel</p>
            </div>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white transition shrink-0"
          >
            <BiX size={16} />
          </button>
        </div>

        {/* 👇 User card with avatar */}
        {!isRail ? (
          <div className="mx-3 mt-4 mb-2 bg-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold">
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
                <div className="w-full h-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold">
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
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-900/30'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white dark:text-gray-500'
                          }
                        `}
                      >
                        <span className="shrink-0 relative flex items-center">
                          <Icon size={18} />
                          {/* Badge on icon when collapsed */}
                          {isRail && badgeCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                              {badgeCount > 9 ? '9+' : badgeCount}
                            </span>
                          )}
                        </span>
                        {!isRail && <span className="font-medium flex-1">{label}</span>}
                        {/* Badge count when expanded */}
                        {!isRail && badgeCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold shrink-0">
                            {badgeCount > 9 ? '9+' : badgeCount}
                          </span>
                        )}
                        {!isRail && active && badgeCount === 0 && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-300 shrink-0" />
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
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title={isRail ? 'Logout' : ''}
            className={`flex items-center rounded-xl text-sm text-slate-400 hover:bg-red-900/40 hover:text-red-400 transition-all duration-150 w-full ${isRail ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5'}`}
          >
            <BiLogOut size={18} />
            {!isRail && <span className="font-medium">{loggingOut ? 'Logging out...' : 'Logout'}</span>}
          </button>
        </div>

        {/* Collapse toggle — desktop only, the mobile drawer uses the X button instead */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-3 top-20 w-6 h-6 bg-slate-700 hover:bg-orange-500 border border-slate-600 rounded-full items-center justify-center text-white transition-colors duration-150 shadow-lg"
        >
          {collapsed ? <BiChevronRight size={14} /> : <BiChevronLeft size={14} />}
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
              <BiList size={20} />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-gray-400 dark:text-gray-500">Manager</span>
              <span className="hidden sm:inline text-gray-300 dark:text-gray-600">/</span>
              <span className="font-semibold text-gray-700 dark:text-gray-200 truncate">{currentLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <QuickSearch items={navItems} placeholder="Quick search..." />

            <ThemeToggle />

            {/* 👇 Messages icon with badge */}
            <Link
              to="/manager/messages"
              className="relative w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
            >
              <BiMessageSquare size={17} />
              {msgCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold shadow">
                  {msgCount > 9 ? '9+' : msgCount}
                </span>
              )}
            </Link>

            {/* 👇 Notification bell with badge */}
            <Link
              to="/manager/notifications"
              className="relative w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
            >
              <BiBell size={17} />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold shadow">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </Link>

            <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-slate-700" />

            {/* 👇 User pill – links to profile with avatar */}
            <Link
              to="/manager/profile"
              className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl px-1.5 sm:px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
            >
              <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 leading-none">{user?.name?.split(' ')[0]}</p>
                <p className="text-xs text-orange-500 dark:text-orange-400">Admin</p>
              </div>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6">{children}</main>

        {/* Footer */}
        <footer className="border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
          <p className="text-xs text-gray-400 dark:text-gray-500">© 2026 E-Waste Mart</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Admin Dashboard</p>
        </footer>
      </div>
    </div>
  );
}