import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import { getRoles, createRole, updateRole, deleteRole, getPermissions } from '../../api/admin';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext'; // 👈 Import useAuth

function RolesPage() {
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState({ name: '', permissions: [] });
  const [error, setError]           = useState('');

  // 👇 Get permissions from auth context
  const { permissions: userPermissions } = useAuth();

  // 👇 Get toast function
  const { toast } = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  // 👇 Check if user has the required permissions
  const canCreateRole = userPermissions?.includes('role-create') || false;
  const canEditRole = userPermissions?.includes('role-edit') || false;
  const canDeleteRole = userPermissions?.includes('role-delete') || false;

  const systemRoles = ['Super-Admin', 'Admin', 'Product-Manager'];

  // Shared with UsersPage.jsx — same /admin/roles endpoint.
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => getRoles().then(res => res.data.roles),
  });

  // Shared with PermissionsPage.jsx — same /admin/permissions endpoint.
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: () => getPermissions().then(res => res.data.permissions),
  });

  const loading = rolesLoading || permissionsLoading;

  const saveMutation = useMutation({
    mutationFn: ({ editing, form }) => editing ? updateRole(editing.id, form) : createRole(form),
    onSuccess: (_res, { editing }) => {
      toast(editing ? 'Role updated successfully' : 'Role created successfully', 'success');
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Something went wrong.';
      setError(msg);
      toast(msg, 'error');
    },
  });

  const submitting = saveMutation.isPending;

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteRole(id),
    onSuccess: () => {
      toast('Role deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Could not delete.';
      toast(msg, 'error');
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', permissions: [] });
    setError('');
    setShowModal(true);
  };

  const openEdit = (role) => {
    setEditing(role);
    setForm({
      name: role.name,
      permissions: role.permissions?.map(p => p.name) || [],
    });
    setError('');
    setShowModal(true);
  };

  const togglePermission = (permName) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permName)
        ? prev.permissions.filter(p => p !== permName)
        : [...prev.permissions, permName],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    saveMutation.mutate({ editing, form });
  };

  const handleDelete = async (id, name) => {
    const ok = await confirm(`Delete role "${name}"?`, {
      title: 'Delete role?',
      tone: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    deleteMutation.mutate(id);
  };

  // Group permissions by prefix for easier reading
  const groupedPermissions = permissions.reduce((acc, p) => {
    const group = p.name.split('-')[0];
    if (!acc[group]) acc[group] = [];
    acc[group].push(p);
    return acc;
  }, {});

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Roles</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage roles and their permissions</p>
        </div>
        {/* 👇 "Create Role" button only appears if user has role-create permission */}
        {canCreateRole && (
          <button
            onClick={openCreate}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Create Role
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-gray-400 dark:text-gray-500">Loading roles...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map(role => (
            <div key={role.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
              {/* Role Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-lg">
                    🛡️
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">{role.name}</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {role.permissions?.length || 0} permissions
                      {role.users_count !== undefined && ` · ${role.users_count} users`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {/* 👇 "Edit" button only appears if user has role-edit permission */}
                  {canEditRole && (
                    <button
                      onClick={() => openEdit(role)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Edit
                    </button>
                  )}
                  {/* 👇 "Delete" button only appears if user has role-delete permission AND role is not a system role */}
                  {canDeleteRole && !systemRoles.includes(role.name) && (
                    <button
                      onClick={() => handleDelete(role.id, role.name)}
                      className="text-xs text-red-500 dark:text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                  {systemRoles.includes(role.name) && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">System role</span>
                  )}
                </div>
              </div>

              {/* Permissions */}
              <div className="flex flex-wrap gap-2">
                {role.permissions?.length > 0 ? (
                  role.permissions.map(p => (
                    <span
                      key={p.id}
                      className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full"
                    >
                      {p.name}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 dark:text-gray-500 text-sm italic">No permissions assigned</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                {editing ? `Edit Role — ${editing.name}` : 'Create New Role'}
              </h3>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              {error && (
                <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm px-4 py-2 rounded mb-4">{error}</div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Role Name */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Role Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    required
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Content-Editor"
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Use hyphens for spaces e.g. Product-Manager</p>
                </div>

                {/* Permissions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Assign Permissions
                    </label>
                    <div className="flex gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, permissions: permissions.map(p => p.name) })}
                        className="text-green-600 dark:text-green-400 hover:underline"
                      >
                        Select all
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, permissions: [] })}
                        className="text-red-500 dark:text-red-400 hover:underline"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>

                  {/* Grouped permissions */}
                  <div className="space-y-4 border border-gray-100 dark:border-slate-800 rounded-lg p-4 bg-gray-50 dark:bg-slate-800/60 max-h-64 overflow-y-auto">
                    {Object.entries(groupedPermissions).map(([group, perms]) => (
                      <div key={group}>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">{group}</p>
                        <div className="flex flex-wrap gap-2">
                          {perms.map(p => (
                            <label
                              key={p.id}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs cursor-pointer border transition
                                ${form.permissions.includes(p.name)
                                  ? 'bg-green-600 text-white border-green-600'
                                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-green-400'
                                }`}
                            >
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={form.permissions.includes(p.name)}
                                onChange={() => togglePermission(p.name)}
                              />
                              {p.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {form.permissions.length} permission{form.permissions.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editing ? 'Save Changes' : 'Create Role'}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 py-2 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default RolesPage;
