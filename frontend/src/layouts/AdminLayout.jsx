import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBadge } from '../context/BadgeContext';
import { logoutUser } from '../api/auth';
import { setIntentionalLogout } from '../api/axios';
import ThemeToggle from '../components/ThemeToggle';
import QuickSearch from '../components/QuickSearch';
import Bi from '../components/BsIcon';

// 🔥 Define nav items with required permissions — icon is a Bootstrap Icons
// glyph name (see https://icons.getbootstrap.com), rendered via <Bi name=.../>
const allNavItems = [
  { path: '/admin',              icon: 'speedometer2',          label: 'Overview',     group: 'main',   badge: null,   permission: 'dashboard-view' },
  { path: '/admin/admins',       icon: 'person-check-fill',     label: 'Admins',       group: 'main',   badge: null,   permission: 'admin-list' },
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
  const [showGoodbye, setShowGoodbye] = useState(false);
  const [byeName, setByeName] = useState(''); // snapshot of the user's first name for the goodbye card

  const { notifCount, msgCount } = useBadge();

  const handleLogout = async () => {
    // Flag this as a deliberate logout BEFORE anything else. The real
    // /logout call below revokes the token server-side immediately, but we
    // keep it in the client for ~2s so the goodbye card can stay on screen
    // without the route guard yanking us to /login. In that window,
    // background polling (badge counts, notifications) keeps using the
    // now-revoked token and gets 401s back — normally a global axios
    // interceptor would hard-redirect to /login via window.location the
    // instant that happens, hijacking our own transition. This flag tells
    // that interceptor to stand down while we handle the redirect ourselves.
    setIntentionalLogout(true);

    setByeName(user?.name?.split(' ')[0] || 'there'); // snapshot the name before the auth context is cleared
    setLoggingOut(true);
    setShowGoodbye(true); // show the goodbye screen right away — feels instant
    try { await logoutUser(); } catch {}

    // Give the goodbye message a moment to actually be read before the
    // session is torn down and we redirect away from the console.
    //
    // Navigate away from /admin first, then clear the auth context — if the
    // token were cleared while still on an /admin/* route, the route guard
    // would re-render mid-flight and could redirect to /login itself before
    // our own navigate('/') applies.
    setTimeout(() => {
      navigate('/');
      logout();
      queryClient.clear(); // wipe cached data so it doesn't leak into the next session
      setIntentionalLogout(false); // done — let the interceptor resume normal behavior
    }, 1900);
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
          <Link
            to="/"
            title={collapsed ? 'Back to Site' : ''}
            className={`
              flex items-center rounded-xl text-sm text-slate-400
              hover:bg-slate-800 hover:text-white transition-all duration-150
              ${collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5'}
            `}
          >
            <Bi name="house-door-fill" size={17} className="shrink-0" />
            {!collapsed && <span className="font-medium">Back to Site</span>}
          </Link>

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
            <QuickSearch
              items={navItems.map(item => ({ ...item, icon: <Bi name={item.icon} size={14} /> }))}
              placeholder="Quick search..."
            />

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
          <p className="text-xs text-gray-400 dark:text-gray-500">Laravel 11 · React · Sanctum · Spatie</p>
        </footer>
      </div>

      {/* Goodbye screen — shown for a beat before the session actually ends */}
      {showGoodbye && (
        <div className="fixed inset-0 z-[200] bg-slate-900/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="animate-fade-in-up bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center mx-auto mb-4">
              <Bi name="door-open-fill" size={28} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1.5">
              Goodbye, {byeName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              You've been securely signed out of the E-Waste Mart admin console. Thank you for keeping the platform running smoothly.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <Bi name="arrow-repeat" size={13} className="animate-spin" />
              Redirecting you to the homepage...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
