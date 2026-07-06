import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import { getPermissions, createPermission, deletePermission } from '../../api/admin';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext'; // 👈 Import useAuth

function PermissionsPage() {
  const [search, setSearch]           = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [form, setForm]               = useState({ name: '' });
  const [error, setError]             = useState('');

  // 👇 Get permissions from auth context
  const { permissions: userPermissions } = useAuth();

  // 👇 Get toast function
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 👇 Check if user has the required permissions
  const canCreatePermission = userPermissions?.includes('permission-create') || false;
  const canDeletePermission = userPermissions?.includes('permission-delete') || false;

  // Shared with RolesPage.jsx — same /admin/permissions endpoint.
  const { data: permissions = [], isLoading: loading } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: () => getPermissions().then(res => res.data.permissions),
  });

  const invalidatePermissions = () => queryClient.invalidateQueries({ queryKey: ['admin-permissions'] });

  const createMutation = useMutation({
    mutationFn: (data) => createPermission(data),
    onSuccess: () => {
      toast('Permission created successfully', 'success');
      setShowModal(false);
      setForm({ name: '' });
      invalidatePermissions();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Something went wrong.';
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

  const deleteMutation = useMutation({
    mutationFn: (id) => deletePermission(id),
    onSuccess: () => {
      toast('Permission deleted successfully', 'success');
      invalidatePermissions();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Could not delete.';
      toast(msg, 'error');
    },
  });

  const handleDelete = (id, name) => {
    if (!window.confirm(`Delete permission "${name}"?`)) return;
    deleteMutation.mutate(id);
  };

  const filtered = permissions.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group by prefix
  const grouped = filtered.reduce((acc, p) => {
    const group = p.name.split('-')[0];
    if (!acc[group]) acc[group] = [];
    acc[group].push(p);
    return acc;
  }, {});

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Permissions</h2>
          <p className="text-gray-500 text-sm mt-1">{permissions.length} permissions defined</p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search permissions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-52"
          />
          {/* 👇 "Add Permission" button only appears if user has permission-create */}
          {canCreatePermission && (
            <button
              onClick={() => { setShowModal(true); setError(''); setForm({ name: '' }); }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              + Add Permission
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading permissions...</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, perms]) => (
            <div key={group} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="font-bold text-gray-700 uppercase text-sm">{group}</h3>
                <p className="text-xs text-gray-400">{perms.length} permissions</p>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {perms.map((p, i) => (
                    <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                      <td className="px-6 py-3 text-gray-400 w-12">{i + 1}</td>
                      <td className="px-4 py-3">
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                          🔑 {p.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{p.guard_name}</td>
                      <td className="px-4 py-3 text-right">
                        {/* 👇 "Delete" button only appears if user has permission-delete */}
                        {canDeletePermission && (
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Add New Permission</h3>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded mb-4">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permission Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  required
                  onChange={e => setForm({ name: e.target.value })}
                  placeholder="e.g. report-view"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Use lowercase with hyphens e.g. listing-approve
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Permission'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-600 hover:bg-gray-50 py-2 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default PermissionsPage;