import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../api/auth';
import { BrandPanel } from './LoginPage';
import ThemeToggle from '../components/ThemeToggle';
import { Recycle, ArrowLeft, Eye, EyeOff, CheckCircle } from '../components/icons';
import { usePlatformName } from '../hooks/useSiteSettings';

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const platformName = usePlatformName();
  const [step, setStep]       = useState('email'); // 'email' | 'code' | 'done'
  const [email, setEmail]     = useState('');
  const [otp, setOtp]         = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [info, setInfo]       = useState('');
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const deadlineRef = useRef(0);

  // Countdown while on the code step.
  useEffect(() => {
    if (step !== 'code') return;
    const tick = () => setSecondsLeft(Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [step]);

  const startCountdown = (seconds) => {
    deadlineRef.current = Date.now() + (seconds || 300) * 1000;
    setSecondsLeft(seconds || 300);
  };

  const sendCode = async (isResend = false) => {
    setError(''); setInfo('');
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      startCountdown(res.data?.expires_in);
      setStep('code');
      if (isResend) setInfo('A new code has been sent.');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e) => { e.preventDefault(); sendCode(false); };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await resetPassword({ email, otp, password, password_confirmation: confirm });
      setStep('done');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset your password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-slate-800/60">
      <BrandPanel subtitle="Reset your password with a one-time code and get back to trading." />

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-6">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
              <ArrowLeft width={16} height={16} /> Back to sign in
            </Link>
            <ThemeToggle className="lg:hidden" />
          </div>

          <div className="text-center mb-8 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2">
              <Recycle width={26} height={26} className="text-blue-600 dark:text-blue-400" />
              <span className="text-2xl font-bold text-[#0b2545] dark:text-blue-300">{platformName}</span>
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-slate-800">
            {error && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-lg mb-5">{error}</div>
            )}
            {info && (
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 text-sm px-4 py-3 rounded-lg mb-5">{info}</div>
            )}

            {/* ── Step 1: email ─────────────────────────────── */}
            {step === 'email' && (
              <>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Forgot your password?</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                  Enter your account email and we’ll send you a verification code.
                </p>
                <form onSubmit={handleEmailSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Email address</label>
                    <input
                      type="email" required value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button type="submit" disabled={loading}
                    className="btn-lift w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none">
                    {loading ? 'Sending…' : 'Send code'}
                  </button>
                </form>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                  Remembered it?{' '}
                  <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Sign in</Link>
                </p>
              </>
            )}

            {/* ── Step 2: code + new password ───────────────── */}
            {step === 'code' && (
              <>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Enter your code</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                  We sent a 6-digit code to <span className="font-medium text-gray-700 dark:text-gray-200">{email}</span>.
                </p>
                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Verification code</label>
                    <input
                      type="text" inputMode="numeric" autoComplete="one-time-code" required
                      value={otp} maxLength={6}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className={secondsLeft > 0 ? 'text-gray-400 dark:text-gray-500' : 'text-red-500 dark:text-red-400 font-medium'}>
                        {secondsLeft > 0 ? `Code expires in ${fmt(secondsLeft)}` : 'Code expired'}
                      </span>
                      <button type="button" onClick={() => sendCode(true)} disabled={loading}
                        className="text-blue-600 dark:text-blue-400 font-medium hover:underline disabled:opacity-50">
                        Resend code
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">New password</label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'} required value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button type="button" onClick={() => setShowPw(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                        {showPw ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Confirm new password</label>
                    <input
                      type={showPw ? 'text' : 'password'} required value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat password"
                      className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${confirm && password !== confirm ? 'border-red-400 bg-red-50 dark:bg-red-950/40' : 'border-gray-200 dark:border-slate-700'}`}
                    />
                    {confirm && password !== confirm && <p className="text-red-500 dark:text-red-400 text-xs mt-1">Passwords do not match.</p>}
                  </div>

                  <button type="submit" disabled={loading || otp.length < 6}
                    className="btn-lift w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none mt-1">
                    {loading ? 'Resetting…' : 'Reset password'}
                  </button>
                </form>

                <button onClick={() => { setStep('email'); setOtp(''); setError(''); setInfo(''); }}
                  className="block mx-auto mt-5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                  Use a different email
                </button>
              </>
            )}

            {/* ── Step 3: done ──────────────────────────────── */}
            {step === 'done' && (
              <div className="text-center">
                <div className="grid place-items-center w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 mx-auto mb-4">
                  <CheckCircle width={28} height={28} />
                </div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Password reset!</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                  Your password has been updated. Redirecting you to sign in…
                </p>
                <Link to="/login"
                  className="btn-lift inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
                  Sign in now
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}