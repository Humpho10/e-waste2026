// src/components/PermissionRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * PermissionRoute – Restricts access based on user role and/or permissions
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The page/component to render
 * @param {string[]} [props.allowedRoles] - Role names allowed in; if set, the user's role must be one of these
 * @param {string[]} props.requiredPermissions - Array of permission names; user needs at least one
 * @param {boolean} [props.requireAll=false] - If true, user must have ALL permissions; default: any
 */
function PermissionRoute({
  children,
  allowedRoles = null,
  requiredPermissions = [],
  requireAll = false
}) {
  const { token, loading, permissions, role } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 dark:text-gray-500">
        Loading...
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!token) {
    return <Navigate to="/login" />;
  }

  // Section is restricted to specific roles (e.g. "/manager" is Admin-only)
  // — permissions alone can't express this since many permissions (like
  // product-list or message-view) are intentionally shared across roles.
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" state={{ from: location.pathname }} replace />;
  }

  // No specific permissions required → role check (if any) was enough
  if (requiredPermissions.length === 0) {
    return children;
  }

  // Check permissions
  const hasPermission = requireAll
    ? requiredPermissions.every(p => permissions?.includes(p))
    : requiredPermissions.some(p => permissions?.includes(p));

  // If no permission, send to an explicit denial page rather than
  // silently landing somewhere that could look like it worked.
  if (!hasPermission) {
    return <Navigate to="/unauthorized" state={{ from: location.pathname }} replace />;
  }

  // All good → render children
  return children;
}

export default PermissionRoute;