import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
// 👇 Import toast hook
import { useToast } from '../components/Toast';

export default function ProfileForm({ getProfile, updateProfile, accentColor = 'blue' }) {
  const { user, login, token, role } = useAuth();
  const fileRef = useRef();

  const [form, setForm] = useState({
    name: '', phone: '', location: '',
    password: '', password_confirmation: '',
  });
  const [avatar,     setAvatar]     = useState(null);
  const [preview,    setPreview]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState('');
  const [error,      setError]      = useState('');
  const [changePass, setChangePass] = useState(false);

  // 👇 Get toast function
  const { toast } = useToast();

  const colors = {
    blue:   { ring: 'focus:ring-blue-500',   btn: 'bg-blue-600 hover:bg-blue-700',     text: 'text-blue-600 dark:text-blue-400',   avatar: 'bg-blue-600'   },
    teal:   { ring: 'focus:ring-teal-500',   btn: 'bg-teal-600 hover:bg-teal-700',     text: 'text-teal-600 dark:text-teal-400',   avatar: 'bg-teal-600'   },
    orange: { ring: 'focus:ring-orange-400', btn: 'bg-orange-500 hover:bg-orange-600', text: 'text-orange-500 dark:text-orange-400', avatar: 'bg-orange-500' },
  };
  const c = colors[accentColor] || colors.blue;

  useEffect(() => {
    getProfile()
      .then(res => {
        const u = res.data.user;
        setForm(f => ({ ...f, name: u.name || '', phone: u.phone || '', location: u.location || '' }));
        if (u.avatar) setPreview(`http://localhost:8000/storage/${u.avatar}`);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (changePass && form.password !== form.password_confirmation) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('name',     form.name);
      data.append('phone',    form.phone);
      data.append('location', form.location);
      if (changePass && form.password) {
        data.append('password',              form.password);
        data.append('password_confirmation', form.password_confirmation);
      }
      if (avatar) data.append('avatar', avatar);

      const res = await updateProfile(data);
      login(res.data.user, token, role);
      setSuccess('Profile updated successfully!');
      // 👇 Success toast
      toast('Profile updated successfully', 'success');
      setChangePass(false);
      setForm(f => ({ ...f, password: '', password_confirmation: '' }));
    } catch (err) {
      const errors = err.response?.data?.errors;
      const errorMsg = errors ? Object.values(errors).flat().join(' · ') : err.response?.data?.message || 'Failed to update.';
      setError(errorMsg);
      // 👇 Error toast
      toast(errorMsg || 'Failed to update profile', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-8 animate-pulse space-y-4">
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-slate-800" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-32" />
          <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-48" />
        </div>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Avatar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 text-sm uppercase tracking-wide">Profile Photo</h3>
        <div className="flex items-center gap-6">
          <div
            onClick={() => fileRef.current?.click()}
            className="w-20 h-20 rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed border-gray-200 dark:border-slate-700 hover:border-gray-400 transition relative group shrink-0"
          >
            {preview ? (
              <>
                <img src={preview} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <span className="text-white text-xs font-medium">Change</span>
                </div>
              </>
            ) : (
              <div className={`w-full h-full ${c.avatar} flex items-center justify-center text-white text-2xl font-bold`}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/jpg" className="hidden" onChange={handleAvatarChange} />
          <div>
            <p className="font-bold text-gray-800 dark:text-gray-100 text-lg">{form.name}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">{user?.email}</p>
            <button type="button" onClick={() => fileRef.current?.click()} className={`mt-1 text-xs ${c.text} hover:underline`}>
              Click to change photo
            </button>
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 text-sm uppercase tracking-wide">Personal Information</h3>

        {success && (
          <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400 text-sm px-4 py-3 rounded-xl mb-4 flex gap-2">
            <span>✅</span><span>{success}</span>
          </div>
        )}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-4 flex gap-2">
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {[
            { label: 'Full Name', name: 'name',     type: 'text', placeholder: 'Your full name'  },
            { label: 'Phone',     name: 'phone',    type: 'tel',  placeholder: '0700 000 000'     },
            { label: 'Location',  name: 'location', type: 'text', placeholder: 'e.g. Kampala'     },
          ].map(({ label, name, type, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">{label}</label>
              <input
                type={type} value={form[name]}
                onChange={e => setForm({ ...form, [name]: e.target.value })}
                placeholder={placeholder}
                className={`w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${c.ring} bg-gray-50 dark:bg-slate-800/60`}
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Email Address</label>
            <input type="email" value={user?.email || ''} disabled
              className="w-full border border-gray-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed" />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Email cannot be changed</p>
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide">Password</h3>
          <button type="button" onClick={() => setChangePass(!changePass)} className={`text-sm ${c.text} hover:underline font-medium`}>
            {changePass ? 'Cancel' : 'Change password'}
          </button>
        </div>
        {!changePass ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">•••••••••••• <span className="text-xs">(hidden for security)</span></p>
        ) : (
          <div className="space-y-4">
            {[
              { label: 'New Password',     name: 'password',              placeholder: 'Min. 8 characters'  },
              { label: 'Confirm Password', name: 'password_confirmation', placeholder: 'Repeat new password' },
            ].map(({ label, name, placeholder }) => (
              <div key={name}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">{label}</label>
                <input
                  type="password" value={form[name]}
                  onChange={e => setForm({ ...form, [name]: e.target.value })}
                  placeholder={placeholder}
                  className={`w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${c.ring} bg-gray-50 dark:bg-slate-800/60`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit" disabled={submitting}
        className={`w-full ${c.btn} text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50`}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Saving...
          </span>
        ) : 'Save Changes'}
      </button>
    </form>
  );
}