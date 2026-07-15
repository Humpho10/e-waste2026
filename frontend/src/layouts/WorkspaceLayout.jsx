import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBadge } from '../context/BadgeContext';
import { logoutUser } from '../api/auth';
import { storageUrl } from '../api/axios';
import ThemeToggle from '../components/ThemeToggle';
import { storageUrl } from '../lib/urls';

const navItems = [
  { path: '/workspace',               icon: 'bi-grid-1x2-fill', label: 'Overview',       group: 'main',  badge: null       },
  { path: '/workspace/products',      icon: 'bi-box-seam',      label: 'Listings',       group: 'main',  badge: null       },
  { path: '/workspace/messages',      icon: 'bi-chat-dots',     label: 'Messages',       group: 'comms', badge: 'msg'      },
  { path: '/workspace/notifications', icon: 'bi-bell',          label: 'Notifications',  group: 'comms', badge: 'notif'    },
  { path: '/workspace/profile',       icon: 'bi-person',        label: 'Profile',        group: 'comms', badge: null       },
];

const groups = [
  { key: 'main',  label: 'Work'            },
  { key: 'comms', label: 'Communications'  },
];

export default function WorkspaceLayout({ children }) {
  const { user, logout }              = useAuth();
  const { notifCount, msgCount }      = useBadge();
  const location                      = useLocation();
  const navigate                      = useNavigate();
  const queryClient                   = useQueryClient();
  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [loggingOut, setLoggingOut]   = useState(false);

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

  const currentLabel = navItems.find(n => location.pathname === n.path)?.label || 'Workspace';

  const getBadgeCount = (badge) => {
    if (badge === 'notif') return notifCount;
    if (badge === 'msg')   return msgCount;
    return 0;
  };

  const avatarUrl = storageUrl(user?.avatar);

  // The icon-only "rail" mode only applies to the desktop collapse toggle —
  // the mobile drawer is always shown fully expanded.
  const isRail = collapsed && !mobileOpen;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${collapsed ? 'md:w-[70px]' : 'md:w-[240px]'} w-[240px]
        bg-slate-900 flex flex-col fixed h-full z-40
        transition-all duration-200 ease-in-out border-r border-slate-800
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>

        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-slate-800 shrink-0 ${isRail ? 'justify-center px-3' : 'px-5 gap-3'}`}>
          <Link to="/" className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center shrink-0">
              <i className="bi bi-recycle text-white text-sm" />
            </div>
            {!isRail && (
              <div>
                <p className="text-white font-bold text-sm leading-tight">E-Waste Mart</p>
                <p className="text-slate-500 text-xs dark:text-gray-400">Product Manager</p>
              </div>
            )}
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white transition shrink-0"
          >
            <i className="bi bi-x-lg text-sm" />
          </button>
        </div>

        {/* User card */}
        {!isRail ? (
          <div className="mx-3 mt-4 mb-2 bg-slate-800 rounded-xl p-3 flex items-center gap-3">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-teal-600 flex items-center justify-center text-white text-sm font-bold">
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
                <div className="w-full h-full bg-teal-600 flex items-center justify-center text-white text-sm font-bold">
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
                  {items.map(({ path, icon, label, badge }) => {
                    const active     = location.pathname === path;
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
                            ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/30'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white dark:text-gray-500'
                          }
                        `}
                      >
                        <span className="text-base shrink-0 relative">
                          <i className={`bi ${icon}`} />
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
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-300 shrink-0" />
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
            className={`flex items-center rounded-xl text-sm text-slate-400 hover:bg-red-900/40 hover:text-red-400 transition-all w-full ${isRail ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5'}`}
          >
            <i className="bi bi-box-arrow-right text-base" />
            {!isRail && <span className="font-medium">{loggingOut ? 'Logging out...' : 'Logout'}</span>}
          </button>
        </div>

        {/* Collapse toggle — desktop only, the mobile drawer uses the X button instead */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-3 top-20 w-6 h-6 bg-slate-700 hover:bg-teal-600 border border-slate-600 rounded-full items-center justify-center text-white transition-colors shadow-lg"
        >
          <span className="text-xs">{collapsed ? '›' : '‹'}</span>
        </button>
      </aside>

      {/* Main */}
      {/* min-w-0 lets this flex item shrink to the viewport — without it,
          wide content (charts, tables) stretches the page and causes
          horizontal scrolling on phones. */}
      <div className={`flex-1 flex flex-col min-h-screen min-w-0 ${collapsed ? 'md:ml-[70px]' : 'md:ml-[240px]'} transition-all duration-200`}>

        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2 px-3 sm:px-6 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition shrink-0"
            >
              <i className="bi bi-list text-lg" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-gray-400 dark:text-gray-500">Workspace</span>
              <span className="hidden sm:inline text-gray-300 dark:text-gray-600">/</span>
              <span className="font-semibold text-gray-700 dark:text-gray-200 truncate">{currentLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <ThemeToggle />

            {/* Message bell */}
            <Link
              to="/workspace/messages"
              className="relative w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
            >
              <i className="bi bi-chat-dots text-base" />
              {msgCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold shadow">
                  {msgCount > 9 ? '9+' : msgCount}
                </span>
              )}
            </Link>

            {/* Notification bell */}
            <Link
              to="/workspace/notifications"
              className="relative w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
            >
              <i className="bi bi-bell text-base" />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold shadow">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </Link>

            <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-slate-700" />

            {/* User pill */}
            <Link
              to="/workspace/profile"
              className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl px-1.5 sm:px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
            >
              <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 leading-none">{user?.name?.split(' ')[0]}</p>
                <p className="text-xs text-teal-600 dark:text-teal-400">Product Manager</p>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>

        <footer className="border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
          <p className="text-xs text-gray-400 dark:text-gray-500">© 2026 E-Waste Mart</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Product Manager Workspace</p>
        </footer>
      </div>
    </div>
  );
}