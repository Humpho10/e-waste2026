import { Link, useLocation } from 'react-router-dom';
import { FiShieldOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

// Reached whenever PermissionRoute blocks access to a page the current
// role doesn't have permission for — e.g. a buyer hitting an /admin URL
// directly. Keeps the denial explicit instead of silently landing
// somewhere that looks like it might have worked.
export default function UnauthorizedPage() {
  const { role, redirectPath, token } = useAuth();
  const location = useLocation();
  const attemptedPath = location.state?.from;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 flex items-center justify-center mx-auto mb-6">
          <FiShieldOff className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Access Denied</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          {attemptedPath ? (
            <>You don't have permission to view <span className="font-mono text-gray-700 dark:text-gray-300">{attemptedPath}</span>.</>
          ) : (
            <>You don't have permission to view this page.</>
          )}
          {role && <> Your account is signed in as <span className="font-semibold text-gray-700 dark:text-gray-300">{role}</span>, which doesn't include access to this area.</>}
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          {token ? (
            <Link
              to={redirectPath()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
            >
              Go to your dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
            >
              Sign in
            </Link>
          )}
          <Link
            to="/"
            className="border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-100 dark:hover:bg-slate-800 transition"
          >
            Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
