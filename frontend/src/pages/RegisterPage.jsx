import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';
// 👇 Import toast hook
import { useToast } from '../components/Toast'; // adjust path if needed

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ name: '', phone: '', location: '', email: '', password: '', password_confirmation: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  // 👇 Get toast function
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const res = await registerUser(form);
      login(res.data.user, res.data.token, 'user');
      // 👇 Success toast
      toast('Account created successfully! Welcome to E-Waste Mart', 'success');
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        const errorMsg = err.response?.data?.message || 'Registration failed.';
        setErrors({ general: errorMsg });
        // 👇 Error toast
        toast(errorMsg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (f) => errors[f]?.[0];

  const fields = [
    { label: 'Full Name',     name: 'name',                  type: 'text',     placeholder: 'John Mukasa'        },
    { label: 'Phone Number',  name: 'phone',                 type: 'tel',      placeholder: '0700 000 000'       },
    { label: 'Location',      name: 'location',              type: 'text',     placeholder: 'Kampala, Uganda'    },
    { label: 'Email Address', name: 'email',                 type: 'email',    placeholder: 'you@example.com'    },
    { label: 'Password',      name: 'password',              type: 'password', placeholder: 'Min. 8 characters'  },
    { label: 'Confirm Password', name: 'password_confirmation', type: 'password', placeholder: 'Repeat password' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">♻️</span>
            <span className="text-2xl font-bold text-blue-700">E-Waste Mart</span>
          </Link>
          <p className="text-gray-500 text-sm mt-2">Create your free account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-50">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ label, name, type, placeholder }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                <input
                  type={type} required value={form[name]}
                  onChange={e => setForm({ ...form, [name]: e.target.value })}
                  placeholder={placeholder}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldError(name) ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                />
                {fieldError(name) && (
                  <p className="text-red-500 text-xs mt-1">{fieldError(name)}</p>
                )}
              </div>
            ))}

            <button
              type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}