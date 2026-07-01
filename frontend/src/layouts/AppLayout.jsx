// src/layouts/AppLayout.jsx
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AppLayout() {
  const { user, role, permissions, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper: Format permission name for display
  const formatName = (permission) => {
    return permission
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get current page title from path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/app') return 'Dashboard';
    const segment = path.split('/').pop();
    if (segment) {
      return formatName(segment);
    }
    return 'Dashboard';
  };

  // Helper: Get emoji for permission
  const getEmoji = (permission) => {
    const lower = permission.toLowerCase();
    if (lower.includes('transaction') || lower.includes('payment')) return '💰';
    if (lower.includes('message')) return '💬';
    if (lower.includes('notification')) return '🔔';
    if (lower.includes('user')) return '👥';
    if (lower.includes('admin')) return '🛡️';
    if (lower.includes('role') || lower.includes('permission')) return '🔑';
    if (lower.includes('product') || lower.includes('inventory')) return '📦';
    if (lower.includes('category')) return '🏷️';
    if (lower.includes('report') || lower.includes('analytics')) return '📊';
    if (lower.includes('audit')) return '📋';
    if (lower.includes('order')) return '🛒';
    if (lower.includes('support')) return '🎫';
    return '📌';
  };

  // Generate sidebar menu items from permissions
  const menuItems = [
    ...(permissions.includes('dashboard-view') ? [{
      name: 'Dashboard',
      path: '/app',
      icon: '📊',
      permission: 'dashboard-view'
    }] : []),
    ...permissions
      .filter(p => p !== 'dashboard-view')
      .map(p => ({
        name: formatName(p),
        path: `/app/${p}`,
        icon: getEmoji(p),
        permission: p,
      }))
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-800">
          <Link to="/app" className="text-xl font-bold text-white flex items-center gap-2">
            <span>♻️</span> E-Waste Mart
          </Link>
          <p className="text-xs text-gray-400 mt-1 truncate">{role || 'User'}</p>
        </div>

        <div className="px-4 py-4 border-b border-gray-800">
          <p className="font-medium text-sm truncate">{user?.name || 'User'}</p>
          <p className="text-xs text-gray-400 mt-0.5">{permissions?.length || 0} permissions</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.permission}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                location.pathname === item.path
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </Link>
          ))}
          {menuItems.length === 0 && (
            <div className="text-gray-500 text-xs px-3 py-2 text-center">
              No menu items available
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition"
          >
            <span className="text-lg">🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">
            {getPageTitle()}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet /> {/* 👈 This renders child routes */}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;