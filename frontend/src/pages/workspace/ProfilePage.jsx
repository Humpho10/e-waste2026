import { useEffect, useState, useRef } from 'react';
import WorkspaceLayout from '../../layouts/WorkspaceLayout';
import { getPMProfile, updatePMProfile } from '../../api/productManager';
import { useAuth } from '../../context/AuthContext';

export default function ProfilePage() {
  const { user, login, token } = useAuth();
  const fileRef = useRef();

  const [form, setForm] = useState({
    name: '', phone: '', location: '',
    password: '', password_confirmation: '',
  });
  const [avatar,      setAvatar]      = useState(null);
  const [preview,     setPreview]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [success,     setSuccess]     = useState('');
  const [error,       setError]       = useState('');
  const [changePass,  setChangePass]  = useState(false);

  useEffect(() => {
    getPMProfile()
      .then(res => {
        const u = res.data.user;
        setForm(f => ({
          ...f,
          name:     u.name     || '',
          phone:    u.phone    || '',
          location: u.location || '',
        }));
        if (u.avatar) {
          setPreview(`http://localhost:8000/storage/${u.avatar}`);
        }
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
    setError('');
    setSuccess('');

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
      if (avatar) {
        data.append('avatar', avatar);
      }

      const res = await updatePMProfile(data);
      // Update auth context with new user data
      login(res.data.user, token, 'Product-Manager');
      setSuccess('Profile updated successfully!');
      setChangePass(false);
      setForm(f => ({ ...f, password: '', password_confirmation: '' }));
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        setError(Object.values(errors).flat().join(' · '));
      } else {
        setError(err.response?.data?.message || 'Failed to update profile.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const avatarUrl = preview;

  return (
    <WorkspaceLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
          <p className="text-gray-500 text-sm mt-1">Update your personal information and password</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 animate-pulse space-y-4">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gray-100" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded w-32" />
                <div className="h-3 bg-gray-100 rounded w-48" />
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>

            {/* Avatar section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Profile Photo</h3>
              <div className="flex items-center gap-6">
                {/* Avatar preview */}
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed border-gray-200 hover:border-teal-400 transition relative group shrink-0"
                >
                  {avatarUrl ? (
                    <>
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <span className="text-white text-xs font-medium">Change</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-teal-50 flex flex-col items-center justify-center">
                      <span className="text-2xl">📷</span>
                      <span className="text-xs text-teal-600 mt-1">Upload</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <div>
                  <p className="font-semibold text-gray-800">{form.name}</p>
                  <p className="text-sm text-gray-400">{user?.email}</p>
                  <p className="text-xs text-teal-600 font-medium mt-1">Product Manager</p>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="mt-2 text-xs text-teal-600 hover:underline"
                  >
                    Click photo or button to change
                  </button>
                </div>
              </div>
            </div>

            {/* Personal info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Personal Information</h3>

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
                  <span>✅</span><span>{success}</span>
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
                  <span>⚠️</span><span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                {[
                  { label: 'Full Name', name: 'name',     type: 'text', placeholder: 'Your full name'    },
                  { label: 'Phone',     name: 'phone',    type: 'tel',  placeholder: '0700 000 000'       },
                  { label: 'Location',  name: 'location', type: 'text', placeholder: 'e.g. Kampala'       },
                ].map(({ label, name, type, placeholder }) => (
                  <div key={name}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                    <input
                      type={type}
                      value={form[name]}
                      onChange={e => setForm({ ...form, [name]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50"
                    />
                  </div>
                ))}

                {/* Email — read only */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                </div>
              </div>
            </div>

            {/* Password section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Password</h3>
                <button
                  type="button"
                  onClick={() => setChangePass(!changePass)}
                  className="text-sm text-teal-600 hover:underline font-medium"
                >
                  {changePass ? 'Cancel' : 'Change password'}
                </button>
              </div>

              {!changePass ? (
                <p className="text-sm text-gray-400">
                  ••••••••••••  <span className="text-xs">(hidden for security)</span>
                </p>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: 'New Password',     name: 'password',              placeholder: 'Min. 8 characters' },
                    { label: 'Confirm Password', name: 'password_confirmation', placeholder: 'Repeat new password' },
                  ].map(({ label, name, placeholder }) => (
                    <div key={name}>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                      <input
                        type="password"
                        value={form[name]}
                        onChange={e => setForm({ ...form, [name]: e.target.value })}
                        placeholder={placeholder}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-50"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : 'Save Changes'}
            </button>
          </form>
        )}
      </div>
    </WorkspaceLayout>
  );
}