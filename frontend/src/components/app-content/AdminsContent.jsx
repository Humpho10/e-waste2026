// src/components/app-content/AdminsContent.jsx
import { useEffect, useState } from 'react';
import { getAdmins, createAdmin, deleteAdmin } from '../../api/admin';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';

export default function AdminsContent() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const { permissions } = useAuth();
  const { toast } = useToast();

  const canCreateAdmin = permissions?.includes('admin-create') || false;
  const canDeleteAdmin = permissions?.includes('admin-delete') || false;

  const fetchAdmins = () => {
    setLoading(true);
    getAdmins()
      .then(res => setAdmins(res.data.admins))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name} as Admin? This cannot be undone.`)) return;
    try {
      await deleteAdmin(id);
      fetchAdmins();
      toast('Admin removed successfully', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not delete admin';
      toast(msg, 'error');
    }
  };

  const filtered = admins.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Admins</h2>
          <p className="text-gray-500 text-sm mt-1">
            {admins.length} admin{admins.length !== 1 ? 's' : ''} on the platform
          </p>
        </div>
        {canCreateAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
          >
            <span>+</span> Create Admin
          </button>
        )}
      </div>

      {admins.length > 0 && (
        <div className="mb-6 max-w-sm">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text" placeholder="Search admins..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
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
          ))}
        </div>
      ) : admins.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl mx-auto mb-4">👤</div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">No admins yet</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
            Create the first admin account. Admins manage marketplace operations and product managers.
          </p>
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
          <button onClick={() => setSearch('')} className="text-blue-600 text-sm hover:underline">Clear search</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(admin => {
            const initials = admin.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            return (
              <div key={admin.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all p-6 group">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-bold text-gray-800 truncate">{admin.name}</h3>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{admin.email}</p>
                    {admin.phone && <p className="text-xs text-gray-400 mt-0.5">📞 {admin.phone}</p>}
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${admin.is_active ? 'bg-green-400' : 'bg-gray-300'}`} />
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-semibold">Admin</span>
                  {admin.location && <span className="text-xs text-gray-400">📍 {admin.location}</span>}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="text-xs text-gray-400">
                    Joined {new Date(admin.created_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {canDeleteAdmin && (
                    <button
                      onClick={() => handleDelete(admin.id, admin.name)}
                      className="text-xs text-gray-300 hover:text-red-500 transition font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg">Create New Admin</h3>
                  <p className="text-blue-200 text-xs mt-0.5">They will receive login credentials via email</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">✕</button>
              </div>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password'),
              };
              try {
                await createAdmin(data);
                toast('Admin created successfully', 'success');
                setShowModal(false);
                fetchAdmins();
              } catch (err) {
                toast(err.response?.data?.message || 'Failed to create admin', 'error');
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                <input type="text" name="name" required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <input type="email" name="email" required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <input type="password" name="password" required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold">Create Admin</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}