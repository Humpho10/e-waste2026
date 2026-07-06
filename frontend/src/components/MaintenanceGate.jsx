import { useQuery } from '@tanstack/react-query';
import { getPublicSettings } from '../api/products';
import { useAuth } from '../context/AuthContext';
import Bi from './BsIcon';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-900/20">
          <Bi name="cone-striped" size={36} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          {data.platform_name || 'E-Waste Mart'} is down for maintenance
        </h1>
        <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
          {data.maintenance_message || "We're performing scheduled maintenance and will be back shortly. Thanks for your patience."}
        </p>
        {data.support_email && (
          <a
            href={`mailto:${data.support_email}`}
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
          >
            <Bi name="envelope-fill" size={14} /> {data.support_email}
          </a>
        )}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
          <a href="/login" className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition">
            Staff sign-in <Bi name="arrow-right" size={11} />
          </a>
        </div>
      </div>
    </div>
  );
}
