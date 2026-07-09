import { useQuery } from '@tanstack/react-query';
import { getPublicSettings } from '../api/products';
import { useAuth } from '../context/AuthContext';
import MaintenanceNotice from './MaintenanceNotice';

// Staff can always reach the storefront (useful for verifying the fix before
// flipping maintenance mode back off) — only anonymous/regular visitors see
// the maintenance notice.
const STAFF_ROLES = ['Super-Admin', 'Admin', 'Product-Manager'];

/**
 * Wraps a public page (e.g. the homepage) and swaps it for a maintenance
 * notice whenever the Super Admin has flipped "Maintenance Mode" on in
 * /admin/settings. Reads the public, unauthenticated settings endpoint so
 * this works for logged-out visitors too.
 */
export default function MaintenanceGate({ children }) {
  const { token, role } = useAuth();
  const isStaff = Boolean(token) && STAFF_ROLES.includes(role);

  const { data, isLoading } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => getPublicSettings().then(res => res.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  if (isLoading || !data?.maintenance_mode || isStaff) {
    return children;
  }

  return (
    <MaintenanceNotice
      platformName={data.platform_name}
      message={data.maintenance_message}
      supportEmail={data.support_email}
    />
  );
}
