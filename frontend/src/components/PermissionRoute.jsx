// src/components/PermissionRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * PermissionRoute – Restricts access based on user permissions
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The page/component to render
 * @param {string[]} props.requiredPermissions - Array of permission names; user needs at least one
 * @param {boolean} [props.requireAll=false] - If true, user must have ALL permissions; default: any
 */
function PermissionRoute({
  children,
  requiredPermissions = [],
  requireAll = false
}) {
  const { token, loading, permissions } = useAuth();
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

  // No specific permissions required → just check authentication
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