// src/components/app-content/PermissionsContent.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPermissions, createPermission, deletePermission } from '../../api/admin';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';

export default function PermissionsContent() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '' });
  const [error, setError] = useState('');

  const { permissions: userPermissions } = useAuth();
  const { toast } = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const canCreatePermission = userPermissions?.includes('permission-create') || false;
  const canDeletePermission = userPermissions?.includes('permission-delete') || false;

  // Shared with admin/PermissionsPage.jsx and admin/RolesPage.jsx — same endpoint.
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

  const handleDelete = async (id, name) => {
    const ok = await confirm(`Delete permission "${name}"?`, {
      title: 'Delete permission?',
      tone: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    deleteMutation.mutate(id);
  };

  const filtered = permissions.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, p) => {
    const group = p.name.split('-')[0];
    if (!acc[group]) acc[group] = [];
    acc[group].push(p);
    return acc;
  }, {});

  if (!userPermissions?.includes('permission-list')) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Access Denied</h2>
        <p className="text-gray-500 dark:text-gray-400">You don't have permission to view permissions.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Permissions</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{permissions.length} permissions defined</p>
        </div>
        <div className="flex gap-3">
          <input
            type="text" placeholder="Search permissions..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-52"
          />
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
        <div className="text-gray-400 dark:text-gray-500">Loading permissions...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 p-16 text-center">
          <div className="text-5xl mb-4">🔑</div>
          <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2">No permissions found</h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Try adjusting your search.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, perms]) => (
            <div key={group} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
              <div className="px-6 py-3 bg-gray-50 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-800">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 uppercase text-sm">{group}</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">{perms.length} permissions</p>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {perms.map((p, i) => (
                    <tr key={p.id} className={`border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 ${i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-slate-800/30'}`}>
                      <td className="px-6 py-3 text-gray-400 dark:text-gray-500 w-12">{i + 1}</td>
                      <td className="px-4 py-3">
                        <span className="bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full text-xs font-medium">🔑 {p.name}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 dark:text-gray-500">{p.guard_name}</td>
                      <td className="px-4 py-3 text-right">
                        {canDeletePermission && (
                          <button onClick={() => handleDelete(p.id, p.name)} className="text-xs text-red-500 dark:text-red-400 hover:underline">Delete</button>
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Add New Permission</h3>
            {error && <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm px-4 py-2 rounded mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Permission Name</label>
                <input
                  type="text" value={form.name} required
                  onChange={e => setForm({ name: e.target.value })}
                  placeholder="e.g. report-view"
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Use lowercase with hyphens e.g. listing-approve</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Permission'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
