import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast'; // adjust path if needed
import GoogleAuthButton from '../components/GoogleAuthButton';
import { Recycle, Eye, EyeOff, Shield, Tag, Chat, ArrowLeft } from '../components/icons';

const REDIRECT_MAP = {
  'Super-Admin': '/admin',
  'Admin': '/manager',
  'Product-Manager': '/workspace',
  'User': '/dashboard',
};

// Shared left-hand brand panel (reused on Register).
export function BrandPanel({ subtitle = 'Buy & sell used electronic components across Uganda.' }) {
  return (
    <div className="hidden lg:flex flex-col justify-between text-white p-10 w-[42%] relative overflow-hidden bg-[#0b2545]">
      {/* E-waste photo background — file lives at frontend/public/hero.webp */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero.webp')" }}
        aria-hidden="true"
      />
      {/* Dark overlay keeps the white text readable over the busy photo */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#0b2545]/95 via-[#0b2545]/85 to-blue-900/75"
        aria-hidden="true"
      />

      {/* Content sits above the background */}
      <div className="relative z-10 flex flex-1 flex-col justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Recycle width={24} height={24} className="text-blue-300" />
          <span className="text-xl font-bold">E-Waste Mart</span>
        </Link>

        <div>
          <h2 className="text-3xl font-extrabold leading-snug mb-3 drop-shadow">Give Old Electronics a Second Life</h2>
          <p className="text-blue-100/90 text-sm mb-8 max-w-sm">{subtitle}</p>
          <ul className="space-y-4 text-sm">
            {[
              { Icon: Shield, t: 'Verified Listings', d: 'Every component reviewed for quality' },
              { Icon: Tag,    t: 'Fair Pricing',      d: 'Transparent & competitive prices' },
              { Icon: Chat,   t: 'Direct Contact',    d: 'Message sellers instantly' },
            ].map(({ Icon, t, d }) => (
              <li key={t} className="flex items-start gap-3">
                <span className="grid place-items-center w-9 h-9 rounded-lg bg-white/15 backdrop-blur-sm shrink-0"><Icon width={18} height={18} /></span>
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="text-blue-100/80 text-xs">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-blue-100/60 text-xs">© 2026 E-Waste Mart — Circular economy in Uganda</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  // Shared finish handler for both email/password and Google auth.
  const finish = (data) => {
    const role = data.role ?? data.user?.roles?.[0]?.name ?? 'User';
    login(data.user, data.token, role, data.permissions || []);
    navigate(REDIRECT_MAP[role] || '/app');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginUser(form);
      finish(res.data);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Invalid email or password.';
      setError(errorMsg);
      toast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <BrandPanel />

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Back to browsing — no account needed to explore listings */}
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 mb-6 transition">
            <ArrowLeft width={16} height={16} /> Back to browsing
          </Link>

          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2">
              <Recycle width={26} height={26} className="text-blue-600" />
              <span className="text-2xl font-bold text-[#0b2545]">E-Waste Mart</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Welcome back</h1>
            <p className="text-gray-500 text-sm mb-6">Sign in to continue to your account</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
                {error}
              </div>
            )}

            <GoogleAuthButton
              label="Continue with Google"
              onStart={() => setLoading(true)}
              onSuccess={finish}
              onError={(m) => { setError(m); toast(m, 'error'); setLoading(false); }}
            />

            <div className="flex items-center gap-3 my-6">
              <span className="h-px bg-gray-200 flex-1" />
              <span className="text-xs text-gray-400">or sign in with email</span>
              <span className="h-px bg-gray-200 flex-1" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input
                  type="email" required value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">Forgot?</Link>
                </div>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} required value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="btn-lift w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none">
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 font-semibold hover:underline">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}