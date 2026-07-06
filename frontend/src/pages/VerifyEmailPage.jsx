import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { verifyEmail } from '../api/auth';
import { BrandPanel } from './LoginPage';
import { Recycle, CheckCircle, X } from '../components/icons';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { isLoading, isError, error } = useQuery({
    queryKey: ['verify-email', token],
    queryFn: () => verifyEmail(token).then(res => res.data),
    enabled: !!token,
    retry: false,
  });

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-slate-800/60">
      <BrandPanel subtitle="Confirm your email to unlock your E-Waste Mart account." />

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2">
              <Recycle width={26} height={26} className="text-blue-600 dark:text-blue-400" />
              <span className="text-2xl font-bold text-[#0b2545] dark:text-blue-300">E-Waste Mart</span>
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-slate-800 text-center">
            {!token && (
              <>
                <div className="grid place-items-center w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 mx-auto mb-4">
                  <X width={28} height={28} />
                </div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Missing verification link</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                  This page needs a verification token. Please use the link from your email.
                </p>
                <Link to="/login" className="btn-lift inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
                  Back to sign in
                </Link>
              </>
            )}

            {token && isLoading && (
              <>
                <div className="grid place-items-center w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mx-auto mb-4 animate-pulse">
                  <Recycle width={28} height={28} />
                </div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Verifying your email…</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Just a moment.</p>
              </>
            )}

            {token && isError && (
              <>
                <div className="grid place-items-center w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 mx-auto mb-4">
                  <X width={28} height={28} />
                </div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Verification failed</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                  {error?.response?.data?.message || 'This link is invalid or has expired. Please request a new one from your dashboard.'}
                </p>
                <Link to="/login" className="btn-lift inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
                  Back to sign in
                </Link>
              </>
            )}

            {token && !isLoading && !isError && (
              <>
                <div className="grid place-items-center w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 mx-auto mb-4">
                  <CheckCircle width={28} height={28} />
                </div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Email verified!</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                  Your account is confirmed. You can now create listings.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="btn-lift inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold"
                >
                  Sign in now
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
