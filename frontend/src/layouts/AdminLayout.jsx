import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBadge } from '../context/BadgeContext';
import { logoutUser } from '../api/auth';
import { setIntentionalLogout } from '../api/axios';
import ThemeToggle from '../components/ThemeToggle';
import Bi from '../components/BsIcon';

// 🔥 Define nav items with required permissions — icon is a Bootstrap Icons
// glyph name (see https://icons.getbootstrap.com), rendered via <Bi name=.../>
const allNavItems = [
  { path: '/admin',              icon: 'speedometer2',          label: 'Overview',     group: 'main',   badge: null,   permission: 'dashboard-view' },
  { path: '/admin/admins',       icon: 'person-check-fill',     label: 'Admins',       group: 'main',   badge: null,   permission: 'admin-list' },
  { path: '/admin/product-managers', icon: 'kanban-fill',       label: 'Product Managers', group: 'main', badge: null, permission: 'pm-list' },
  { path: '/admin/users',        icon: 'people-fill',           label: 'All Users',    group: 'main',   badge: null,   permission: 'user-list' },
  { path: '/admin/roles',        icon: 'shield-lock-fill',      label: 'Roles',        group: 'access', badge: null,   permission: 'role-list' },
  { path: '/admin/permissions',  icon: 'key-fill',              label: 'Permissions',  group: 'access', badge: null,   permission: 'permission-list' },
  { path: '/admin/audit',        icon: 'file-earmark-text-fill',label: 'Audit Trail',  group: 'system', badge: null,   permission: 'audit-list' },
  { path: '/admin/settings',     icon: 'gear-fill',             label: 'Settings',     group: 'system', badge: null,   permission: 'dashboard-view' },
  { path: '/admin/profile',      icon: 'person-circle',         label: 'Profile',      group: 'system', badge: null,   permission: null }, // always visible
  { path: '/admin/my-messages',  icon: 'chat-square-text-fill', label: 'My Messages',  group: 'system', badge: 'msg',   permission: 'message-view' },
  { path: '/admin/messages',     icon: 'chat-dots-fill',        label: 'All Messages', group: 'system', badge: null,   permission: 'message-view' },
  { path: '/admin/notifications',icon: 'bell-fill',             label: 'Notifications',group: 'system', badge: 'notif', permission: 'notification-view' },
];

const groups = [
  { key: 'main',   label: 'Management' },
  { key: 'access', label: 'Access Control' },
  { key: 'system', label: 'System' },
];

export default function AdminLayout({ children }) {
  const { user, logout, permissions } = useAuth(); // 🔥 Get permissions
  const location         = useLocation();
  const navigate         = useNavigate();
  const queryClient      = useQueryClient();
  const [collapsed, setCollapsed]   = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const { notifCount, msgCount } = useBadge();

  // The "logging out" message pops immediately, then the session actually
  // ends exactly 2 seconds later — long enough to register on screen,
  // never long enough to feel slow. The network call itself never blocks
  // this: it fires right away in the background and is flagged as an
  // intentional logout so the axios 401 interceptor doesn't race our own
  // redirect while it's in flight.
  const handleLogout = () => {
    setIntentionalLogout(true);
    setLoggingOut(true);
    logoutUser().catch(() => {});

    setTimeout(() => {
      navigate('/');
      logout();
      queryClient.clear(); // wipe cached data so it doesn't leak into the next session
      setIntentionalLogout(false);
    }, 2000);
  };

  // 🔥 Filter nav items based on permissions
  const navItems = allNavItems.filter(item => {
    // If no permission required, always show
    if (!item.permission) return true;
    // Check if user has this permission
    return permissions?.includes(item.permission);
  });

  const currentItem  = navItems.find(n => location.pathname === n.path);
  const currentLabel = currentItem?.label || 'Admin Panel';

  const avatarUrl = user?.avatar ? `http://localhost:8000/storage/${user.avatar}` : null;

  const getBadgeCount = (badge) => {
    if (badge === 'notif') return notifCount;
    if (badge === 'msg')   return msgCount;
    return 0;
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className={`
        ${collapsed ? 'w-[70px]' : 'w-[240px]'}
        bg-slate-900 flex flex-col fixed h-full z-20
        transition-all duration-200 ease-in-out
        border-r border-slate-800
      `}>

        {/* Logo */}
        <div className={`
          flex items-center h-16 border-b border-slate-800 shrink-0
          ${collapsed ? 'justify-center px-3' : 'px-5 gap-3'}
        `}>
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/40">
            <Bi name="recycle" className="text-white" size={16} />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-white font-bold text-sm leading-tight truncate">E-Waste Mart</p>
              <p className="text-slate-500 text-xs dark:text-gray-400">Super Admin</p>
            </div>
          )}
        </div>

        {/* User card with avatar */}
        {!collapsed ? (
          <div className="mx-3 mt-4 mb-2 bg-slate-800/80 border border-slate-700/50 rounded-2xl p-3 flex items-center gap-3 shadow-inner shadow-black/20">
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
            <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" title="Online" />
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
            if (items.length === 0) return null; // Hide empty groups
            return (
              <div key={group.key}>
                {!collapsed && (
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest px-3 mb-1 dark:text-gray-400">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {items.map(({ path, icon, label, badge }) => {
                    const active = location.pathname === path;
                    const badgeCount = getBadgeCount(badge);
                    return (
                      <Link
                        key={path}
                        to={path}
                        title={collapsed ? label : ''}
                        className={`
                          flex items-center rounded-2xl text-sm transition-all duration-150 relative group
                          ${collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5'}
                          ${active
                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-900/30'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-0.5 dark:text-gray-500'
                          }
                        `}
                      >
                        <span className={`
                          shrink-0 relative flex items-center justify-center transition-transform duration-150
                          ${active ? 'w-7 h-7 rounded-lg bg-white/15' : 'group-hover:scale-110'}
                        `}>
                          <Bi name={icon} size={active ? 15 : 17} />
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

        {/* Bottom actions */}
        <div className="px-2 py-3 border-t border-slate-800 space-y-0.5 shrink-0">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title={collapsed ? 'Logout' : ''}
            className={`
              flex items-center rounded-xl text-sm text-slate-400
              hover:bg-red-900/40 hover:text-red-400 transition-all duration-150 w-full
              ${collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5'}
            `}
          >
            <Bi name="box-arrow-right" size={17} className="shrink-0" />
            {!collapsed && <span className="font-medium">{loggingOut ? 'Logging out...' : 'Logout'}</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-slate-700 hover:bg-blue-600 border border-slate-600 rounded-full flex items-center justify-center text-white transition-colors duration-150 shadow-lg"
        >
          <Bi name={collapsed ? 'chevron-right' : 'chevron-left'} size={13} />
        </button>
      </aside>

      {/* ── Main area ───────────────────────────────────── */}
      <div className={`
        flex-1 flex flex-col min-h-screen
        ${collapsed ? 'ml-[70px]' : 'ml-[240px]'}
        transition-all duration-200 ease-in-out
      `}>

        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400 dark:text-gray-500">Admin</span>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="font-semibold text-gray-700 dark:text-gray-200">{currentLabel}</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <Link
              to="/admin/messages"
              className="relative w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:scale-105 transition-all"
            >
              <Bi name="chat-dots-fill" size={16} />
              {msgCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold shadow">
                  {msgCount > 9 ? '9+' : msgCount}
                </span>
              )}
            </Link>

            <Link
              to="/admin/notifications"
              className="relative w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:scale-105 transition-all"
            >
              <Bi name="bell-fill" size={16} />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold shadow">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </Link>

            <div className="w-px h-6 bg-gray-200 dark:bg-slate-700" />

            <Link
              to="/admin/profile"
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
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 leading-none">
                  {user?.name?.split(' ')[0]}
                </p>
                <p className="text-xs text-blue-500 dark:text-blue-400">Super Admin</p>
              </div>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-gray-500">© 2026 E-Waste Mart</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Super Admin Console</p>
        </footer>
      </div>

      {/* Signing-out overlay — brief, no goodbye copy, gone the instant the token is revoked */}
      {loggingOut && (
        <div className="fixed inset-0 z-[200] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-xl shadow-2xl px-6 py-4">
            <span className="w-5 h-5 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin shrink-0" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Super Admin logging out…</p>
          </div>
        </div>
      )}
    </div>
  );
}
