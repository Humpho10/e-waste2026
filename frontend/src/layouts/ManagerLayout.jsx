import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBadge } from '../context/BadgeContext'; // 👈 For badge counts
import { logoutUser } from '../api/auth';

const navItems = [
  { path: '/manager',                   icon: '📊', label: 'Overview',          group: 'main',  badge: null   },
  { path: '/manager/product-managers',  icon: '🧑‍💼', label: 'Product Managers',  group: 'main',  badge: null   },
  { path: '/manager/categories',        icon: '📂', label: 'Categories',         group: 'main',  badge: null   },
  { path: '/manager/products',          icon: '📦', label: 'Listings',           group: 'main',  badge: null   },
  { path: '/manager/users',             icon: '👥', label: 'Users',              group: 'main',  badge: null   },
  { path: '/manager/profile',           icon: '👤', label: 'Profile',            group: 'main',  badge: null   },
  { path: '/manager/messages',          icon: '💬', label: 'Messages',           group: 'comms', badge: 'msg'  }, // 👈 Added
  { path: '/manager/notifications',     icon: '🔔', label: 'Notifications',      group: 'comms', badge: 'notif' }, // 👈 Added
];

const groups = [
  { key: 'main',  label: 'Management' },
  { key: 'comms', label: 'Communications' },
];

export default function ManagerLayout({ children }) {
  const { user, logout } = useAuth();
  const location         = useLocation();
  const navigate         = useNavigate();
  const [collapsed, setCollapsed]   = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // 👇 Get badge counts from context
  const { notifCount, msgCount } = useBadge();

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logoutUser(); } catch {}
    logout();
    navigate('/');
  };

  const currentLabel = navItems.find(n => location.pathname === n.path)?.label || 'Manager Panel';

  // 👇 Avatar helper
  const avatarUrl = user?.avatar ? `http://localhost:8000/storage/${user.avatar}` : null;

  // 👇 Helper to get badge count for a nav item
  const getBadgeCount = (badge) => {
    if (badge === 'notif') return notifCount;
    if (badge === 'msg')   return msgCount;
    return 0;
  };

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* Sidebar */}
      <aside className={`
        ${collapsed ? 'w-[70px]' : 'w-[240px]'}
        bg-slate-900 flex flex-col fixed h-full z-20
        transition-all duration-200 ease-in-out
        border-r border-slate-800
      `}>

        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-slate-800 shrink-0 ${collapsed ? 'justify-center px-3' : 'px-5 gap-3'}`}>
          <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
            <span className="text-white text-sm">♻️</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-white font-bold text-sm leading-tight truncate">E-Waste Mart</p>
              <p className="text-slate-500 text-xs">Admin Panel</p>
            </div>
          )}
        </div>

        {/* 👇 User card with avatar */}
        {!collapsed ? (
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
              <p className="text-slate-400 text-xs truncate">{user?.email}</p>
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
                {!collapsed && (
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest px-3 mb-1">
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
                          flex items-center rounded-xl text-sm transition-all duration-150 relative
                          ${collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5'}
                          ${active
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-900/30'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          }
                        `}
                      >
                        <span className="text-base shrink-0 relative">
                          {icon}
                          {/* Badge on icon when collapsed */}
                          {collapsed && badgeCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                              {badgeCount > 9 ? '9+' : badgeCount}
                            </span>
                          )}
                        </span>
                        {!collapsed && <span className="font-medium flex-1">{label}</span>}
                        {/* Badge count when expanded */}
                        {!collapsed && badgeCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold shrink-0">
                            {badgeCount > 9 ? '9+' : badgeCount}
                          </span>
                        )}
                        {!collapsed && active && badgeCount === 0 && (
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
          <Link
            to="/"
            title={collapsed ? 'Back to Site' : ''}
            className={`flex items-center rounded-xl text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-150 ${collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5'}`}
          >
            <span>🏠</span>
            {!collapsed && <span className="font-medium">Back to Site</span>}
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title={collapsed ? 'Logout' : ''}
            className={`flex items-center rounded-xl text-sm text-slate-400 hover:bg-red-900/40 hover:text-red-400 transition-all duration-150 w-full ${collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5'}`}
          >
            <span>🚪</span>
            {!collapsed && <span className="font-medium">{loggingOut ? 'Logging out...' : 'Logout'}</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-slate-700 hover:bg-orange-500 border border-slate-600 rounded-full flex items-center justify-center text-white transition-colors duration-150 shadow-lg"
        >
          <span className="text-xs">{collapsed ? '›' : '‹'}</span>
        </button>
      </aside>

      {/* Main */}
      <div className={`flex-1 flex flex-col min-h-screen ${collapsed ? 'ml-[70px]' : 'ml-[240px]'} transition-all duration-200`}>

        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Manager</span>
            <span className="text-gray-300">/</span>
            <span className="font-semibold text-gray-700">{currentLabel}</span>
          </div>
          <div className="flex items-center gap-3">

            {/* 👇 Messages icon with badge */}
            <Link
              to="/manager/messages"
              className="relative w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
            >
              <span className="text-base">💬</span>
              {msgCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold shadow">
                  {msgCount > 9 ? '9+' : msgCount}
                </span>
              )}
            </Link>

            {/* 👇 Notification bell with badge */}
            <Link
              to="/manager/notifications"
              className="relative w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
            >
              <span className="text-base">🔔</span>
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold shadow">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </Link>

            <div className="w-px h-6 bg-gray-200" />

            {/* 👇 User pill – links to profile with avatar */}
            <Link
              to="/manager/profile"
              className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 hover:bg-gray-100 transition"
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
                <p className="text-xs font-semibold text-gray-700 leading-none">{user?.name?.split(' ')[0]}</p>
                <p className="text-xs text-orange-500">Admin</p>
              </div>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">{children}</main>

        {/* Footer */}
        <footer className="border-t border-gray-100 bg-white px-6 py-3 flex items-center justify-between">
          <p className="text-xs text-gray-400">© 2026 E-Waste Mart</p>
          <p className="text-xs text-gray-400">Admin Dashboard</p>
        </footer>
      </div>
    </div>
  );
}