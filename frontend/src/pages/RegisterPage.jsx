import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast'; // adjust path if needed
import GoogleAuthButton from '../components/GoogleAuthButton';
import { BrandPanel } from './LoginPage';
import { Recycle, Eye, EyeOff, ArrowLeft, CheckCircle } from '../components/icons';

const REDIRECT_MAP = {
  'Super-Admin': '/admin',
  'Admin': '/manager',
  'Product-Manager': '/workspace',
  'User': '/dashboard',
};

function passwordStrength(pw = '') {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s; // 0..4
}
const STRENGTH = [
  { label: '', color: '' },
  { label: 'Weak',   color: 'bg-red-400' },
  { label: 'Fair',   color: 'bg-amber-400' },
  { label: 'Good',   color: 'bg-blue-500' },
  { label: 'Strong', color: 'bg-green-500' },
];

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', phone: '', location: '', email: '', password: '', password_confirmation: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState(null);

  const strength = useMemo(() => passwordStrength(form.password), [form.password]);
  const mismatch = form.password_confirmation && form.password !== form.password_confirmation;

  // Shared finish handler for both email/password and Google signup.
  const finish = (data) => {
    const role = data.role ?? data.user?.roles?.[0]?.name ?? 'User';
    login(data.user, data.token, role, data.permissions || []);
    toast('Account created successfully! Welcome to E-Waste Mart', 'success');
    navigate(REDIRECT_MAP[role] || '/app');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (mismatch) { setErrors({ password_confirmation: ['Passwords do not match.'] }); return; }
    setLoading(true);
    try {
      const res = await registerUser(form);
      // No auto-login — the account needs email verification before signing in.
      setRegisteredEmail(res.data.email || form.email);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        const errorMsg = err.response?.data?.message || 'Registration failed.';
        setErrors({ general: errorMsg });
        toast(errorMsg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (f) => errors[f]?.[0];
  const set = (name) => (e) => setForm({ ...form, [name]: e.target.value });

  const inputCls = (name) =>
    `w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      fieldError(name) ? 'border-red-400 bg-red-50' : 'border-gray-200'
    }`;

  // 👇 Account created — wait for email verification before signing in.
  if (registeredEmail) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        <BrandPanel subtitle="Create your free account and start trading e-waste components today." />
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <div className="text-center mb-8 lg:hidden">
              <Link to="/" className="inline-flex items-center gap-2">
                <Recycle width={26} height={26} className="text-blue-600" />
                <span className="text-2xl font-bold text-[#0b2545]">E-Waste Mart</span>
              </Link>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
              <div className="grid place-items-center w-14 h-14 rounded-2xl bg-green-50 text-green-600 mx-auto mb-4">
                <CheckCircle width={28} height={28} />
              </div>
              <h1 className="text-xl font-bold text-gray-800 mb-2">Check your email</h1>
              <p className="text-gray-500 text-sm mb-6">
                We've sent a verification link to <span className="font-medium text-gray-700">{registeredEmail}</span>.
                Click it to confirm your account, then sign in below.
              </p>
              <Link to="/login" className="btn-lift inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
                Go to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <BrandPanel subtitle="Create your free account and start trading e-waste components today." />

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Back to browsing — no account needed to explore listings */}
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 mb-6 transition">
            <ArrowLeft width={16} height={16} /> Back to browsing
          </Link>

          <div className="text-center mb-8 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2">
              <Recycle width={26} height={26} className="text-blue-600" />
              <span className="text-2xl font-bold text-[#0b2545]">E-Waste Mart</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Create your account</h1>
            <p className="text-gray-500 text-sm mb-6">Join the marketplace — it's free</p>

            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
                {errors.general}
              </div>
            )}

            <GoogleAuthButton
              label="Sign up with Google"
              onStart={() => setLoading(true)}
              onSuccess={finish}
              onError={(m) => { setErrors({ general: m }); toast(m, 'error'); setLoading(false); }}
            />

            <div className="flex items-center gap-3 my-6">
              <span className="h-px bg-gray-200 flex-1" />
              <span className="text-xs text-gray-400">or with your email</span>
              <span className="h-px bg-gray-200 flex-1" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input type="text" required value={form.name} onChange={set('name')}
                  placeholder="John Mukasa" className={inputCls('name')} />
                {fieldError('name') && <p className="text-red-500 text-xs mt-1">{fieldError('name')}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input type="tel" required value={form.phone} onChange={set('phone')}
                    placeholder="0700 000 000" className={inputCls('phone')} />
                  {fieldError('phone') && <p className="text-red-500 text-xs mt-1">{fieldError('phone')}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                  <input type="text" required value={form.location} onChange={set('location')}
                    placeholder="Kampala" className={inputCls('location')} />
                  {fieldError('location') && <p className="text-red-500 text-xs mt-1">{fieldError('location')}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input type="email" required value={form.email} onChange={set('email')}
                  placeholder="you@example.com" className={inputCls('email')} />
                {fieldError('email') && <p className="text-red-500 text-xs mt-1">{fieldError('email')}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} required value={form.password} onChange={set('password')}
                    placeholder="Min. 8 characters" className={`${inputCls('password')} pr-11`} />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
                  </button>
                </div>
                {form.password && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <span key={i} className={`h-1 flex-1 rounded-full ${i <= strength ? STRENGTH[strength].color : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 w-12">{STRENGTH[strength].label}</span>
                  </div>
                )}
                {fieldError('password') && <p className="text-red-500 text-xs mt-1">{fieldError('password')}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input type={showPw2 ? 'text' : 'password'} required value={form.password_confirmation}
                    onChange={set('password_confirmation')} placeholder="Repeat password"
                    className={`w-full border rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      mismatch || fieldError('password_confirmation') ? 'border-red-400 bg-red-50' : 'border-gray-200'
                    }`} />
                  <button type="button" onClick={() => setShowPw2(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw2 ? <EyeOff width={18} height={18} /> : <Eye width={18} height={18} />}
                  </button>
                </div>
                {(mismatch || fieldError('password_confirmation')) && (
                  <p className="text-red-500 text-xs mt-1">{fieldError('password_confirmation') || 'Passwords do not match.'}</p>
                )}
              </div>

              <button type="submit" disabled={loading}
                className="btn-lift w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none mt-1">
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}