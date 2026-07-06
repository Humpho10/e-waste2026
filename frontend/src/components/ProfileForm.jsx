import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiLock,
  FiUnlock,
  FiSave,
  FiCamera,
  FiEdit2,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiX,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiCamera, FiCheckCircle, FiAlertCircle, FiLock, FiUser, FiMail } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function ProfileForm({ getProfile, updateProfile, accentColor = 'blue' }) {
  const { user, login, token, role } = useAuth();
  const fileRef = useRef();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '', phone: '', location: '',
    password: '', password_confirmation: '',
  });
  const [avatar,     setAvatar]     = useState(null);
  const [preview,    setPreview]    = useState(null);
  const [success,    setSuccess]    = useState('');
  const [error,      setError]      = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePass, setChangePass] = useState(false);
  const [profileSeeded, setProfileSeeded] = useState(false);

  const { toast } = useToast();

  const colors = {
    blue: { 
      ring: 'focus:ring-blue-500', 
      btn: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800', 
      text: 'text-blue-600', 
      avatar: 'bg-gradient-to-br from-blue-500 to-blue-600',
      light: 'bg-blue-50',
      border: 'border-blue-200',
      shadow: 'shadow-blue-100'
    },
    teal: { 
      ring: 'focus:ring-teal-500', 
      btn: 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800', 
      text: 'text-teal-600', 
      avatar: 'bg-gradient-to-br from-teal-500 to-teal-600',
      light: 'bg-teal-50',
      border: 'border-teal-200',
      shadow: 'shadow-teal-100'
    },
    orange: { 
      ring: 'focus:ring-orange-400', 
      btn: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700', 
      text: 'text-orange-500', 
      avatar: 'bg-gradient-to-br from-orange-500 to-orange-600',
      light: 'bg-orange-50',
      border: 'border-orange-200',
      shadow: 'shadow-orange-100'
    },
  };
  const c = colors[accentColor] || colors.blue;

  const { data: profile, isLoading: loading } = useQuery({
    queryKey: ['profile', role],
    queryFn: () => getProfile().then(res => res.data.user),
  });

  // Seed local editable form state once the profile loads. This runs during
  // render (React's documented "adjusting state" pattern) rather than in a
  // useEffect, since TanStack Query v5 dropped the onSuccess option on
  // useQuery and an effect-based setState here would cause an extra render.
  if (profile && !profileSeeded) {
    setForm(f => ({ ...f, name: profile.name || '', phone: profile.phone || '', location: profile.location || '' }));
    if (profile.avatar) setPreview(`http://localhost:8000/storage/${profile.avatar}`);
    setProfileSeeded(true);
  }

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
  const updateMutation = useMutation({
    mutationFn: (data) => updateProfile(data),
    onSuccess: (res) => {
      login(res.data.user, token, role);
      queryClient.setQueryData(['profile', role], res.data.user);
      setSuccess('Profile updated successfully!');
      // 👇 Success toast
      toast('Profile updated successfully', 'success');
      setChangePass(false);
      setShowEditModal(false);
      setForm(f => ({ ...f, password: '', password_confirmation: '' }));
    },
    onError: (err) => {
      const errors = err.response?.data?.errors;
      const errorMsg = errors ? Object.values(errors).flat().join(' · ') : err.response?.data?.message || 'Failed to update.';
      setError(errorMsg);
      // 👇 Error toast
      toast(errorMsg || 'Failed to update profile', 'error');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (changePass && form.password !== form.password_confirmation) {
      setError('Passwords do not match.');
      return;
    }
    const data = new FormData();
    data.append('name',     form.name);
    data.append('phone',    form.phone);
    data.append('location', form.location);
    if (changePass && form.password) {
      data.append('password',              form.password);
      data.append('password_confirmation', form.password_confirmation);
    }
    if (avatar) data.append('avatar', avatar);

    updateMutation.mutate(data);
  };

  const submitting = updateMutation.isPending;
  if (loading) return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 animate-pulse">
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 rounded-2xl bg-slate-100" />
        <div className="space-y-3 flex-1">
          <div className="h-5 bg-slate-100 rounded w-40" />
          <div className="h-4 bg-slate-100 rounded w-56" />
          <div className="h-3 bg-slate-100 rounded w-32" />
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
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-1.5">
          <FiCamera size={14} /> Profile Photo
        </h3>
        <div className="flex items-center gap-6">
          <div
            onClick={() => fileRef.current?.click()}
            className="w-20 h-20 rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed border-gray-200 hover:border-gray-400 transition relative group shrink-0"
          >
            {preview ? (
              <>
                <img src={preview} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <FiCamera size={20} className="text-white" />
                </div>
              </>
            ) : (
              <div className={`w-full h-full ${c.avatar} flex items-center justify-center text-white text-2xl font-bold relative`}>
                {user?.name?.charAt(0).toUpperCase()}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <FiCamera size={20} className="text-white" />
                </div>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/jpg" className="hidden" onChange={handleAvatarChange} />
          <div>
            <p className="font-bold text-gray-800 text-lg">{form.name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <button type="button" onClick={() => fileRef.current?.click()} className={`mt-1 text-xs ${c.text} hover:underline flex items-center gap-1`}>
              <FiCamera size={12} /> Click to change photo
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
      {/* Personal info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-1.5">
          <FiUser size={14} /> Personal Information
        </h3>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4 flex gap-2 items-start">
            <FiCheckCircle size={16} className="shrink-0 mt-0.5" /><span>{success}</span>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 flex gap-2 items-start">
            <FiAlertCircle size={16} className="shrink-0 mt-0.5" /><span>{error}</span>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
            <div className="text-center">
              <p className="text-xs text-slate-400">Member Since</p>
              <p className="text-sm font-semibold text-slate-700">
                {user?.created_at ? new Date(user.created_at).getFullYear() : '2024'}
              </p>
            </div>
            <div className="text-center border-x border-slate-100">
              <p className="text-xs text-slate-400">Role</p>
              <p className="text-sm font-semibold text-slate-700 capitalize">{role || 'User'}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">Status</p>
              <p className="text-sm font-semibold text-emerald-600 flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Verified
              </p>
            </div>
          ))}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <FiMail size={12} /> Email Address
            </label>
            <input type="email" value={user?.email || ''} disabled
              className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-100 text-gray-400 cursor-not-allowed" />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
        </div>
      </motion.div>

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
      {/* Password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide flex items-center gap-1.5">
            <FiLock size={14} /> Password
          </h3>
          <button type="button" onClick={() => setChangePass(!changePass)} className={`text-sm ${c.text} hover:underline font-medium`}>
            {changePass ? 'Cancel' : 'Change password'}
          </button>
        </div>
        {!changePass ? (
          <p className="text-sm text-gray-400">•••••••••••• <span className="text-xs">(hidden for security)</span></p>
        ) : (
          <div className="space-y-4">
            {[
              { label: 'New Password',     name: 'password',              placeholder: 'Min. 8 characters'  },
              { label: 'Confirm Password', name: 'password_confirmation', placeholder: 'Repeat new password' },
            ].map(({ label, name, placeholder }) => (
              <div key={name}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                <input
                  type="password" value={form[name]}
                  onChange={e => setForm({ ...form, [name]: e.target.value })}
                  placeholder={placeholder}
                  className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${c.ring} bg-gray-50`}
                />
              </div>

              {/* Modal Body - Non-scrollable */}
              <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Avatar - Compact */}
                  <div className="flex items-center gap-4">
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="relative group cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-200 group-hover:border-blue-400 transition-all duration-300">
                        {preview ? (
                          <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full ${c.avatar} flex items-center justify-center text-white text-xl font-bold`}>
                            {user?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm">
                        <FiCamera className="w-3 h-3" />
                      </div>
                    </div>
                    <input 
                      ref={fileRef} 
                      type="file" 
                      accept="image/jpeg,image/png,image/jpg" 
                      className="hidden" 
                      onChange={handleAvatarChange} 
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{form.name || 'Your Name'}</p>
                      <button 
                        type="button" 
                        onClick={() => fileRef.current?.click()} 
                        className={`text-xs ${c.text} hover:underline font-medium`}
                      >
                        Change photo
                      </button>
                    </div>
                  </div>

                  {/* Form Fields - Compact */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          placeholder="Your full name"
                          className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={e => setForm({ ...form, phone: e.target.value })}
                          placeholder="0700 000 000"
                          className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Location
                      </label>
                      <div className="relative">
                        <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          value={form.location}
                          onChange={e => setForm({ ...form, location: e.target.value })}
                          placeholder="e.g. Kampala, Uganda"
                          className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
                        />
                      </div>
                    </div>

                    {/* Password Toggle - Compact */}
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setChangePass(!changePass)}
                        className={`text-xs ${c.text} hover:underline font-medium flex items-center gap-1`}
                      >
                        {changePass ? (
                          <>
                            <FiUnlock className="w-3.5 h-3.5" />
                            Cancel password change
                          </>
                        ) : (
                          <>
                            <FiLock className="w-3.5 h-3.5" />
                            Change password
                          </>
                        )}
                      </button>

                      <AnimatePresence>
                        {changePass && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 mt-3 overflow-hidden"
                          >
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                New Password
                              </label>
                              <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  value={form.password}
                                  onChange={e => setForm({ ...form, password: e.target.value })}
                                  placeholder="Min. 8 characters"
                                  className="w-full border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Confirm Password
                              </label>
                              <div className="relative">
                                <FiCheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                  type={showConfirmPassword ? 'text' : 'password'}
                                  value={form.password_confirmation}
                                  onChange={e => setForm({ ...form, password_confirmation: e.target.value })}
                                  placeholder="Repeat new password"
                                  className="w-full border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                  {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => !submitting && setShowEditModal(false)}
                      className="flex-1 border-2 border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 rounded-xl text-sm font-medium transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`flex-1 ${c.btn} text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm`}
                    >
                      {submitting ? (
                        <>
                          <FiRefreshCw className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FiSave className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}