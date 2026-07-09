import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import { getRoles, createRole, updateRole, deleteRole, getPermissions } from '../../api/admin';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import Bi from '../../components/BsIcon';

const ROLE_COLORS = {
  'Super-Admin': { bg: 'bg-gradient-to-br from-purple-500 to-indigo-600', text: 'text-white', icon: 'shield-fill' },
  'Admin': { bg: 'bg-gradient-to-br from-blue-500 to-cyan-600', text: 'text-white', icon: 'shield-check-fill' },
  'Product-Manager': { bg: 'bg-gradient-to-br from-emerald-500 to-teal-600', text: 'text-white', icon: 'bag-check-fill' },
  'default': { bg: 'bg-gradient-to-br from-slate-400 to-slate-500', text: 'text-white', icon: 'person-badge-fill' },
};

const PERMISSION_COLORS = {
  'admin': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  'user': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'role': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  'permission': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  'product': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  'category': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  'pm': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
  'audit': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border-gray-200 dark:border-gray-800',
  'message': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-800',
  'notification': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  'default': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
};

const PERMISSION_ICONS = {
  'admin': 'shield-fill',
  'user': 'person-fill',
  'role': 'person-badge-fill',
  'permission': 'key-fill',
  'product': 'box-seam-fill',
  'category': 'grid-fill',
  'pm': 'clipboard-check-fill',
  'audit': 'clock-history',
  'message': 'envelope-fill',
  'notification': 'bell-fill',
  'default': 'lock-fill',
};

const getGroupIcon = (permName) => {
  const group = permName.split('-')[0];
  return PERMISSION_ICONS[group] || PERMISSION_ICONS['default'];
};
import { useConfirm } from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext'; // 👈 Import useAuth

function RolesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewingRole, setViewingRole] = useState(null);
  const [form, setForm] = useState({ name: '', permissions: [] });
  const [error, setError] = useState('');
  const [permissionSearch, setPermissionSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');

  const { permissions: userPermissions } = useAuth();
  const { toast } = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const canCreateRole = userPermissions?.includes('role-create') || false;
  const canEditRole = userPermissions?.includes('role-edit') || false;
  const canDeleteRole = userPermissions?.includes('role-delete') || false;

  const systemRoles = ['Super-Admin', 'Admin', 'Product-Manager'];

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => getRoles().then(res => res.data.roles),
  });

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
    setPermissionSearch('');
    setShowModal(true);
  };

  const openEdit = (role) => {
    setEditing(role);
    setForm({
      name: role.name,
      permissions: role.permissions?.map(p => p.name) || [],
    });
    setError('');
    setPermissionSearch('');
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

  const groupedPermissions = useMemo(() => {
    return permissions.reduce((acc, p) => {
      const group = p.name.split('-')[0];
      if (!acc[group]) acc[group] = [];
      acc[group].push(p);
      return acc;
    }, {});
  }, [permissions]);

  const filteredGroupedPermissions = useMemo(() => {
    if (!permissionSearch.trim()) return groupedPermissions;
    const search = permissionSearch.toLowerCase();
    const filtered = {};
    Object.entries(groupedPermissions).forEach(([group, perms]) => {
      const matchingPerms = perms.filter(p => p.name.toLowerCase().includes(search));
      if (matchingPerms.length > 0) {
        filtered[group] = matchingPerms;
      }
    });
    return filtered;
  }, [groupedPermissions, permissionSearch]);

  const filteredRoles = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(r => r.name.toLowerCase().includes(q));
  }, [roles, roleSearch]);

  const getRoleStyle = (roleName) => ROLE_COLORS[roleName] || ROLE_COLORS['default'];
  const getPermissionStyle = (permName) => {
    const group = permName.split('-')[0];
    return PERMISSION_COLORS[group] || PERMISSION_COLORS['default'];
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Bi name="shield-lock-fill" className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles & Permissions</h1>
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm ml-1">Manage system roles and control access permissions</p>
          </div>
          {canCreateRole && (
            <button
              onClick={openCreate}
              className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <Bi name="plus-lg" size={16} />
              Create Role
            </button>
          )}
        </div>
      </div>

      {!loading && roles.length > 0 && (
        <div className="mb-6">
          <div className="relative max-w-sm">
            <Bi name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={roleSearch}
              onChange={e => setRoleSearch(e.target.value)}
              placeholder="Search roles..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-900 dark:text-gray-100"
            />
            {roleSearch && (
              <button
                type="button"
                onClick={() => setRoleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Clear search"
              >
                <Bi name="x-lg" size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">Loading roles...</p>
        </div>
      ) : roles.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Bi name="shield-exclamation" className="text-gray-400" size={28} />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">No roles found</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Get started by creating your first role</p>
          {canCreateRole && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
            >
              <Bi name="plus-lg" size={16} />
              Create Role
            </button>
          )}
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <p className="text-lg mb-1">No roles match "{roleSearch}"</p>
          <button onClick={() => setRoleSearch('')} className="text-violet-600 dark:text-violet-400 text-sm hover:underline">
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredRoles.map(role => {
            const roleStyle = getRoleStyle(role.name);
            const isSystem = systemRoles.includes(role.name);
            return (
              <div
                key={role.id}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-violet-500/10 hover:border-violet-200 dark:hover:border-violet-800/50 transition-all duration-300 overflow-hidden"
              >
                <div className={`${roleStyle.bg} ${roleStyle.text} p-5`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                        <Bi name={roleStyle.icon} size={22} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{role.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-medium opacity-80">
                            {role.permissions?.length || 0} permissions
                          </span>
                          {role.users_count !== undefined && (
                            <>
                              <span className="text-xs opacity-60">·</span>
                              <span className="text-xs font-medium opacity-80">
                                {role.users_count} {role.users_count === 1 ? 'user' : 'users'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {isSystem && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-white/20 backdrop-blur px-2.5 py-1 rounded-full">
                        <Bi name="lock-fill" size={10} />
                        System
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap gap-1.5 mb-4 min-h-[32px]">
                    {role.permissions && role.permissions.length > 0 ? (
                      role.permissions.slice(0, 6).map(p => (
                        <span
                          key={p.id}
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border ${getPermissionStyle(p.name)}`}
                        >
                          <Bi name="check2" size={10} />
                          {p.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-sm italic">No permissions assigned</span>
                    )}
                    {role.permissions && role.permissions.length > 6 && (
                      <span className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                        +{role.permissions.length - 6} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
                    <button
                      onClick={() => setViewingRole(role)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 py-2 rounded-lg transition-colors"
                    >
                      <Bi name="eye-fill" size={14} />
                      View
                    </button>
                    {canEditRole && (
                      <button
                        onClick={() => openEdit(role)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 py-2 rounded-lg transition-colors"
                      >
                        <Bi name="pencil" size={14} />
                        Edit
                      </button>
                    )}
                    {canDeleteRole && !isSystem && (
                      <button
                        onClick={() => handleDelete(role.id, role.name)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 py-2 rounded-lg transition-colors"
                      >
                        <Bi name="trash3" size={14} />
                        Delete
                      </button>
                    )}
                    {isSystem && (
                      <div className="flex-1 text-center">
                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">Protected role</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${editing ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-violet-100 dark:bg-violet-900/40'}`}>
                  <Bi name={editing ? 'pencil-square' : 'shield-plus'} className={`${editing ? 'text-blue-600 dark:text-blue-400' : 'text-violet-600 dark:text-violet-400'}`} size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {editing ? `Edit Role — ${editing.name}` : 'Create New Role'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {editing ? 'Modify role details and permissions' : 'Define a new role and assign permissions'}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 overflow-y-auto flex-1">
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                  <Bi name="exclamation-triangle-fill" size={16} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    <span className="flex items-center gap-2">
                      <Bi name="person-badge" size={14} />
                      Role Name
                    </span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    required
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Content-Editor"
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all outline-none"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 flex items-center gap-1">
                    <Bi name="info-circle" size={11} />
                    Use hyphens for spaces (e.g., Product-Manager)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    <span className="flex items-center gap-2">
                      <Bi name="key-fill" size={14} />
                      Permissions
                      <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                        ({form.permissions.length} selected)
                      </span>
                    </span>
                  </label>

                  <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                      <Bi name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={permissionSearch}
                        onChange={e => setPermissionSearch(e.target.value)}
                        placeholder="Search permissions..."
                        className="w-full border border-gray-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, permissions: permissions.map(p => p.name) })}
                      className="px-3 py-2 text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, permissions: [] })}
                      className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="border border-gray-100 dark:border-slate-800 rounded-xl bg-gray-50/50 dark:bg-slate-800/30 max-h-72 overflow-y-auto">
                    {Object.keys(filteredGroupedPermissions).length === 0 ? (
                      <div className="p-6 text-center">
                        <Bi name="search" size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No permissions match your search</p>
                      </div>
                    ) : (
                      <div className="p-4 space-y-4">
                        {Object.entries(filteredGroupedPermissions).map(([group, perms]) => (
                          <div key={group}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider">
                                {group}
                              </span>
                              <span className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {perms.filter(p => form.permissions.includes(p.name)).length}/{perms.length}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {perms.map(p => (
                                <label
                                  key={p.id}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border transition-all duration-150 ${
                                    form.permissions.includes(p.name)
                                      ? 'bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-500/30'
                                      : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-600'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={form.permissions.includes(p.name)}
                                    onChange={() => togglePermission(p.name)}
                                  />
                                  <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                                    form.permissions.includes(p.name)
                                      ? 'border-white/50 bg-white/20'
                                      : 'border-gray-300 dark:border-slate-600'
                                  }`}>
                                    {form.permissions.includes(p.name) && <Bi name="check2" size={10} />}
                                  </span>
                                  {p.name}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900 flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Bi name={editing ? 'check-lg' : 'plus-lg'} size={16} />
                    {editing ? 'Save Changes' : 'Create Role'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingRole && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
            <div className={`px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r ${getRoleStyle(viewingRole.name).bg} ${getRoleStyle(viewingRole.name).text}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                  <Bi name={getRoleStyle(viewingRole.name).icon} size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{viewingRole.name}</h3>
                  <p className="text-xs opacity-80">
                    {viewingRole.permissions?.length || 0} permissions assigned
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 overflow-y-auto flex-1">
              {viewingRole.permissions && viewingRole.permissions.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {viewingRole.permissions.map(p => (
                    <div
                      key={p.id}
                      className={`inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border ${getPermissionStyle(p.name)}`}
                    >
                      <Bi name={getGroupIcon(p.name)} size={14} />
                      <span className="text-sm font-medium">{p.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bi name="shield-exclamation" size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No permissions assigned to this role</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900">
              <button
                onClick={() => setViewingRole(null)}
                className="w-full inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                <Bi name="x-lg" size={16} />
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default RolesPage;
