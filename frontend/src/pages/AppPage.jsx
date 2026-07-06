// src/pages/AppPage.jsx
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function AppPage() {
  const { user, role, permissions } = useAuth();
  const navigate = useNavigate();

  // Helper: Get color for widget
  const getColor = (permission) => {
    const colors = [
      'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50',
      'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800/50',
      'bg-purple-50 border-purple-200',
      'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800/50',
      'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/50',
      'bg-indigo-50 border-indigo-200',
      'bg-pink-50 border-pink-200',
      'bg-orange-50 dark:bg-orange-950/40 border-orange-200',
      'bg-teal-50 border-teal-200',
      'bg-cyan-50 border-cyan-200',
    ];
    const index = permission.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
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
    if (lower.includes('shipping')) return '🚚';
    if (lower.includes('review')) return '⭐';
    if (lower.includes('setting')) return '⚙️';
    return '📌';
  };

  // Helper: Format permission name to readable title
  const formatTitle = (permission) => {
    return permission
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // 🔥 Map permission to a display name (optional)
  const getActionLabel = (permission) => {
    const labels = {
      'product-list': 'View Products',
      'product-create': 'Create Product',
      'product-edit': 'Edit Product',
      'product-delete': 'Delete Product',
      'product-approve': 'Approve Products',
      'product-reject': 'Reject Products',
      'category-list': 'View Categories',
      'category-create': 'Create Category',
      'category-edit': 'Edit Category',
      'category-delete': 'Delete Category',
      'message-view': 'View Messages',
      'message-send': 'Send Message',
      'notification-view': 'View Notifications',
      'notification-mark-read': 'Mark Notifications Read',
      'dashboard-view': 'Dashboard',
      'user-list': 'View Users',
      'admin-list': 'View Admins',
      'role-list': 'View Roles',
      'permission-list': 'View Permissions',
      'audit-list': 'View Audit Trail',
      'pm-list': 'View Product Managers',
    };
    return labels[permission] || 'Manage';
  };

  const handleWidgetClick = (permission) => {
    // Navigate to /app/<permission>
    navigate(`/app/${permission}`);
  };

  const hasPermissions = permissions && permissions.length > 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-sm text-gray-500 dark:text-gray-400">Role: {role || 'User'}</span>
          <span className="w-1 h-1 bg-gray-300 rounded-full" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {permissions?.length || 0} permissions
          </span>
        </div>
      </div>

      {/* No permissions */}
      {!hasPermissions && (
        <div className="bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800/50 rounded-xl p-6 text-center">
          <p className="text-yellow-700 dark:text-yellow-400">
            You don't have any permissions assigned yet. Contact your administrator.
          </p>
        </div>
      )}

      {/* Permission Widgets - Fully Dynamic + Clickable */}
      {hasPermissions && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {permissions.map((permission) => {
            const emoji = getEmoji(permission);
            const color = getColor(permission);
            const title = formatTitle(permission);
            const actionLabel = getActionLabel(permission);

            return (
              <div
                key={permission}
                onClick={() => handleWidgetClick(permission)}
                className={`${color} border rounded-xl p-6 shadow-sm hover:shadow-md transition cursor-pointer hover:scale-[1.02]`}
              >
                <div className="text-3xl mb-3">{emoji}</div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                  Click to {actionLabel.toLowerCase()}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-2">{permission}</p>
                <div className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                  Go to {actionLabel} →
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AppPage;