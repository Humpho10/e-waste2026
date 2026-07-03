import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import { getAdmins, createAdmin, deleteAdmin } from '../../api/admin';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext'; // 👈 Import useAuth

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gray-100" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-gray-100 rounded w-32" />
          <div className="h-3 bg-gray-100 rounded w-44" />
        </div>
      </div>
      <div className="flex justify-between">
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
        <div className="h-3 w-20 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

function AdminCard({ admin, onDelete, canDelete }) {
  const initials = admin.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-200 p-6 group">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {initials}
        </div>
        <div className="flex-1 overflow-hidden">
          <h3 className="font-bold text-gray-800 truncate">{admin.name}</h3>
          <p className="text-xs text-gray-400 truncate mt-0.5">{admin.email}</p>
          {admin.phone && (
            <p className="text-xs text-gray-400 mt-0.5">📞 {admin.phone}</p>
          )}
        </div>
        <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${admin.is_active ? 'bg-green-400' : 'bg-gray-300'}`} />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-semibold">
          Admin
        </span>
        {admin.location && (
          <span className="text-xs text-gray-400">📍 {admin.location}</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <span className="text-xs text-gray-400">
          Joined {new Date(admin.created_at).toLocaleDateString('en-UG', {
            day: 'numeric', month: 'short', year: 'numeric'
          })}
        </span>
        {/* 👇 Only show "Remove" if user has admin-delete permission */}
        {canDelete && (
          <button
            onClick={() => onDelete(admin.id, admin.name)}
            className="text-xs text-gray-300 hover:text-red-500 transition font-medium"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- Create Admin Modal ----------
function CreateAdminModal({ onClose, onCreated }) {
  const [form, setForm]         = useState({ name: '', email: '', password: '' });
  const [error, setError]       = useState('');
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data) => createAdmin(data),
    onSuccess: () => {
      toast('Admin account created successfully', 'success');
      onCreated();
      onClose();
    },
    onError: (err) => {
      const msg = err.response?.data?.message ||
                  err.response?.data?.errors?.email?.[0] ||
                  'Failed to create admin';
      setError(msg);
      toast(msg, 'error');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    createMutation.mutate(form);
  };

  const submitting = createMutation.isPending;

  const fields = [
    { label: 'Full Name', name: 'name',     type: 'text',     placeholder: 'e.g. Sarah Nakato'        },
    { label: 'Email',     name: 'email',    type: 'email',    placeholder: 'admin@ewaste.org'          },
    { label: 'Password',  name: 'password', type: 'password', placeholder: 'Min. 8 characters'        },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg">Create New Admin</h3>
              <p className="text-blue-200 text-xs mt-0.5">
                They will receive login credentials via email
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5 flex items-start gap-2">
              <span className="shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ label, name, type, placeholder }) => (
              <div key={name}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {label}
                </label>
                <input
                  type={type}
                  value={form[name]}
                  required
                  placeholder={placeholder}
                  onChange={e => setForm({ ...form, [name]: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 placeholder-gray-300"
                />
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  'Create Admin'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl text-sm font-medium transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ---------- Main Page ----------
export default function AdminsPage() {
  const [showModal, setShowModal]   = useState(false);
  const [search, setSearch]         = useState('');

  // 👇 Get permissions from auth context
  const { permissions } = useAuth();

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 👇 Check if user has the required permissions
  const canCreateAdmin = permissions?.includes('admin-create') || false;
  const canDeleteAdmin = permissions?.includes('admin-delete') || false;

  const { data: admins = [], isLoading: loading } = useQuery({
    queryKey: ['admins'],
    queryFn: () => getAdmins().then(res => res.data.admins),
  });

  const invalidateAdmins = () => queryClient.invalidateQueries({ queryKey: ['admins'] });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdmin(id),
    onSuccess: () => {
      invalidateAdmins();
      toast('Admin removed successfully', 'success');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Could not delete admin';
      toast(msg, 'error');
    },
  });

  const handleDelete = (id, name) => {
    if (!window.confirm(`Remove ${name} as Admin? This cannot be undone.`)) return;
    deleteMutation.mutate(id);
  };

  const filtered = admins.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Admins</h2>
          <p className="text-gray-500 text-sm mt-1">
            {admins.length} admin{admins.length !== 1 ? 's' : ''} on the platform
          </p>
        </div>
        {/* 👇 "Create Admin" button only appears if user has admin-create permission */}
        {canCreateAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
          >
            <span className="text-lg leading-none">+</span>
            Create Admin
          </button>
        )}
      </div>

      {/* Search bar */}
      {admins.length > 0 && (
        <div className="mb-6">
          <div className="relative max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search admins..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : admins.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl mx-auto mb-4">
            👤
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">No admins yet</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
            Create the first admin account. Admins manage marketplace operations and product managers.
          </p>
          {/* 👇 Only show the "Create First Admin" button if user has permission */}
          {canCreateAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition"
            >
              + Create First Admin
            </button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-1">No results for "{search}"</p>
          <button onClick={() => setSearch('')} className="text-blue-600 text-sm hover:underline">
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(admin => (
            <AdminCard
              key={admin.id}
              admin={admin}
              onDelete={handleDelete}
              canDelete={canDeleteAdmin} // 👈 Pass permission to the card
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CreateAdminModal
          onClose={() => setShowModal(false)}
          onCreated={invalidateAdmins}
        />
      )}
    </AdminLayout>
  );
}