import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiCamera, FiCheckCircle, FiAlertCircle, FiLock, FiUser, FiMail } from 'react-icons/fi';
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
    if (changePass && form.password !== form.password_confirmation) {
      toast('Passwords do not match.', 'error');
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
    <>
      {/* Profile View Mode */}
      <motion.div 
        className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
            Profile Information
          </h3>
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-blue-100 shadow-lg hover:shadow-xl"
          >
            <FiEdit2 className="w-4 h-4" />
            Edit Profile
          </button>
        </div>
      </div>

        {/* Profile Content */}
        <div className="p-6">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm">
                {preview ? (
                  <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full ${c.avatar} flex items-center justify-center text-white text-3xl font-bold`}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                {form.name || 'Your Name'}
                <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">Active</span>
              </h2>
              <div className="mt-2 space-y-1.5">
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <FiMail className="w-4 h-4 text-slate-400" />
                  {user?.email}
                </p>
                {form.phone && (
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <FiPhone className="w-4 h-4 text-slate-400" />
                    {form.phone}
                  </p>
                )}
                {form.location && (
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <FiMapPin className="w-4 h-4 text-slate-400" />
                    {form.location}
                  </p>
                )}
              </div>
            </div>
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

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => !submitting && setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Edit Profile</h3>
                  <p className="text-xs text-slate-400">Update your personal information</p>
                </div>
                <button
                  onClick={() => !submitting && setShowEditModal(false)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition text-slate-400 hover:text-slate-600"
                >
                  <FiX className="w-5 h-5" />
                </button>
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