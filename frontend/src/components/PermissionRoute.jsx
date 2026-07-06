// src/components/PermissionRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * PermissionRoute – Restricts access based on user permissions
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The page/component to render
 * @param {string[]} props.requiredPermissions - Array of permission names; user needs at least one
 * @param {string} [props.redirectTo='/dashboard'] - Where to redirect if unauthorized
 * @param {boolean} [props.requireAll=false] - If true, user must have ALL permissions; default: any
 */
function PermissionRoute({ 
  children, 
  requiredPermissions = [], 
  redirectTo = '/',
  requireAll = false 
}) {
  const { token, loading, permissions } = useAuth();

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

  // If no permission, redirect
  if (!hasPermission) {
    return <Navigate to={redirectTo} />;
  }

  // All good → render children
  return children;
}

export default PermissionRoute;