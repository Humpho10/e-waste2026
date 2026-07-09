import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import { getPermissions, createPermission, deletePermission } from '../../api/admin';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import Bi from '../../components/BsIcon';

const PERMISSION_COLORS = {
  'admin': {
    bg: 'bg-gradient-to-br from-violet-500 to-purple-600',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-800',
    icon: 'shield-fill',
    light: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800',
    text: 'text-violet-700 dark:text-violet-300',
  },
  'user': {
    bg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    icon: 'person-fill',
    light: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
  },
  'role': {
    bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    icon: 'person-badge-fill',
    light: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
  },
  'permission': {
    bg: 'bg-gradient-to-br from-orange-500 to-red-600',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    icon: 'key-fill',
    light: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-300',
  },
  'product': {
    bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    icon: 'box-seam-fill',
    light: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  'category': {
    bg: 'bg-gradient-to-br from-teal-500 to-cyan-600',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    icon: 'grid-fill',
    light: 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800',
    text: 'text-teal-700 dark:text-teal-300',
  },
  'pm': {
    bg: 'bg-gradient-to-br from-green-500 to-emerald-600',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
    icon: 'clipboard-check-fill',
    light: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-300',
  },
  'audit': {
    bg: 'bg-gradient-to-br from-gray-500 to-slate-600',
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border-gray-200 dark:border-gray-800',
    icon: 'clock-history',
    light: 'bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
  },
  'message': {
    bg: 'bg-gradient-to-br from-pink-500 to-rose-600',
    badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    icon: 'envelope-fill',
    light: 'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800',
    text: 'text-pink-700 dark:text-pink-300',
  },
  'notification': {
    bg: 'bg-gradient-to-br from-rose-500 to-red-600',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    icon: 'bell-fill',
    light: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800',
    text: 'text-rose-700 dark:text-rose-300',
  },
  'default': {
    bg: 'bg-gradient-to-br from-slate-400 to-slate-600',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    icon: 'lock-fill',
    light: 'bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
  },
};

const ALL_GROUPS = ['admin', 'user', 'role', 'permission', 'product', 'category', 'pm', 'audit', 'message', 'notification'];

const getPermissionStyle = (permName) => {
  const group = permName.split('-')[0];
  return PERMISSION_COLORS[group] || PERMISSION_COLORS['default'];
};

const getGroupStyle = (group) => {
  return PERMISSION_COLORS[group] || PERMISSION_COLORS['default'];
};
import { useConfirm } from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext'; // 👈 Import useAuth

function PermissionsPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewGroup, setViewGroup] = useState(null);
  const [form, setForm] = useState({ name: '', group: '' });
  const [error, setError] = useState('');

  const { permissions: userPermissions } = useAuth();
  const { toast } = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const canCreatePermission = userPermissions?.includes('permission-create') || false;
  const canDeletePermission = userPermissions?.includes('permission-delete') || false;

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
      setForm({ name: '', group: '' });
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
    const permName = form.group ? `${form.group}-${form.name}` : form.name;
    createMutation.mutate({ name: permName });
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

  const searchQuery = search.trim().toLowerCase();

  const allGrouped = useMemo(() => {
    return permissions.reduce((acc, p) => {
      const group = p.name.split('-')[0];
      if (!acc[group]) acc[group] = [];
      acc[group].push(p);
      return acc;
    }, {});
  }, [permissions]);

  const filteredPermissions = useMemo(() => {
    if (!searchQuery) return [];
    return permissions.filter(p => p.name.toLowerCase().includes(searchQuery));
  }, [permissions, searchQuery]);

  const groupEntries = Object.entries(allGrouped);

  const openCreateModal = (group = null) => {
    setError('');
    setForm({ name: '', group: group || '' });
    setShowModal(true);
  };

  const openGroupModal = (group) => {
    setViewGroup(group);
  };

  return (
    <AdminLayout>
      <div className="scale-95 origin-top-left">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Bi name="key-fill" className="text-white" size={18} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Permissions</h1>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-xs ml-1">
                {groupEntries.length} groups · {permissions.length} total permissions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bi name="search" size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="border border-gray-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none w-44"
                />
              </div>
              {canCreatePermission && (
                <button
                  onClick={() => openCreateModal()}
                  className="group relative inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-md hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-200"
                >
                  <Bi name="plus-lg" size={12} />
                  Add
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-10 h-10 rounded-full border-4 border-orange-200 border-t-orange-600 animate-spin" />
            <p className="mt-3 text-gray-500 dark:text-gray-400 text-xs">Loading...</p>
          </div>
        ) : permissions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
              <Bi name="key" className="text-gray-400" size={22} />
            </div>
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">No permissions</h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">Create your first permission</p>
            {canCreatePermission && (
              <button
                onClick={() => openCreateModal()}
                className="inline-flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
              >
                <Bi name="plus-lg" size={12} />
                Add Permission
              </button>
            )}
          </div>
        ) : (
          <>
            {searchQuery && (
              <div className="mb-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className="px-4 py-2.5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bi name="search" size={13} className="text-orange-600" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-200">"{search}"</span>
                      <span className="text-xs text-gray-400">({filteredPermissions.length})</span>
                    </div>
                    <button
                      onClick={() => setSearch('')}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  {filteredPermissions.length === 0 ? (
                    <p className="text-center text-gray-400 dark:text-gray-500 text-xs py-4">No matches found</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {filteredPermissions.map((p) => {
                        const style = getPermissionStyle(p.name);
                        return (
                          <div
                            key={p.id}
                            className="group relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-gray-50 dark:bg-slate-800 hover:shadow-sm transition-all duration-150 cursor-default"
                          >
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold ${style.badge}`}>
                              <Bi name={style.icon} size={10} />
                            </span>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{p.name}</span>
                            {canDeletePermission && (
                              <button
                                onClick={() => handleDelete(p.id, p.name)}
                                className="ml-1 opacity-0 group-hover:opacity-100 w-4 h-4 rounded flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                              >
                                <Bi name="x-lg" size={8} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!searchQuery && (
              <>
                <div className="mb-4 overflow-x-auto pb-1.5 -mx-3 px-3">
                  <div className="flex gap-2 min-w-max">
                    {ALL_GROUPS.map((group) => {
                      const style = getGroupStyle(group);
                      const count = allGrouped[group]?.length || 0;
                      const isActive = viewGroup === group;
                      return (
                        <button
                          key={group}
                          onClick={() => count > 0 ? openGroupModal(group) : null}
                          className={`relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-150 text-left ${
                            isActive
                              ? `${style.light} border-${group === 'default' ? 'slate' : group}-300 dark:border-${group === 'default' ? 'slate' : group}-700`
                              : count > 0
                                ? 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700'
                                : 'bg-gray-50 dark:bg-slate-900 border-gray-100 dark:border-slate-800 opacity-40 cursor-not-allowed'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-md ${style.bg} flex items-center justify-center`}>
                            <Bi name={style.icon} className="text-white" size={11} />
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase">{group}</p>
                            <p className={`text-sm font-bold ${isActive ? style.text : 'text-gray-700 dark:text-gray-200'}`}>{count}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  {groupEntries.map(([group, perms]) => {
                    const style = getGroupStyle(group);
                    return (
                      <div
                        key={group}
                        className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                      >
                        <div className={`px-4 py-2.5 bg-gradient-to-r ${style.bg} text-white`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                                <Bi name={style.icon} size={15} />
                              </div>
                              <div>
                                <h3 className="font-bold text-sm">{group}</h3>
                                <p className="text-[10px] opacity-70">{perms.length} permissions</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => openGroupModal(group)}
                                className="px-2 py-1 rounded text-[10px] font-medium bg-white/20 backdrop-blur hover:bg-white/30 transition-colors flex items-center gap-1"
                              >
                                <Bi name="eye-fill" size={9} />
                                View
                              </button>
                              <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-white/20">
                                {perms.length}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="flex flex-wrap gap-1.5">
                            {perms.slice(0, 10).map((p, i) => {
                              const permStyle = getPermissionStyle(p.name);
                              return (
                                <div
                                  key={p.id}
                                  className="group/perm relative inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg border bg-gray-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all duration-150 cursor-default"
                                >
                                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold ${permStyle.badge}`}>
                                    <Bi name={permStyle.icon} size={10} />
                                  </span>
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{p.name}</span>
                                  {canDeletePermission && (
                                    <button
                                      onClick={() => handleDelete(p.id, p.name)}
                                      className="ml-0.5 opacity-0 group-hover/perm:opacity-100 w-4 h-4 rounded flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                                    >
                                      <Bi name="x-lg" size={8} />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                            {perms.length > 10 && (
                              <button
                                onClick={() => openGroupModal(group)}
                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-slate-600 text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-slate-500 hover:text-gray-500 dark:hover:text-gray-400 transition-colors text-xs"
                              >
                                <Bi name="three-dots" size={10} />
                                +{perms.length - 10}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-slate-900 dark:to-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                  <Bi name="plus-circle-fill" className="text-orange-600 dark:text-orange-400" size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Add Permission</h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">New system permission</p>
                </div>
              </div>
            </div>

            <div className="px-4 py-4">
              {error && (
                <div className="mb-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <Bi name="exclamation-triangle-fill" size={12} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Group</label>
                  <select
                    value={form.group}
                    onChange={e => setForm({ ...form, group: e.target.value })}
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select group</option>
                    {ALL_GROUPS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    required
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. view"
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                  {form.group && (
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                      Full: <span className="text-orange-600 dark:text-orange-400 font-medium">{form.group}-{form.name || '...'}</span>
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={submitting || !form.group || !form.name}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white py-2 rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {submitting ? (
                      <>
                        <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Bi name="plus-lg" size={12} />
                        Create
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {viewGroup && allGrouped[viewGroup] && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
            <div className={`px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r ${getGroupStyle(viewGroup).bg} text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                    <Bi name={getGroupStyle(viewGroup).icon} size={17} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{viewGroup}</h3>
                    <p className="text-[10px] opacity-70">{allGrouped[viewGroup].length} permissions</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewGroup(null)}
                  className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <Bi name="x-lg" size={13} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <div className="flex flex-wrap gap-1.5">
                {allGrouped[viewGroup].map((p) => {
                  const permStyle = getPermissionStyle(p.name);
                  return (
                    <div
                      key={p.id}
                      className="group/perms relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-gray-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all"
                    >
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold ${permStyle.badge}`}>
                        <Bi name={permStyle.icon} size={10} />
                      </span>
                      <div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-200 block">{p.name}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">{p.guard_name}</span>
                      </div>
                      {canDeletePermission && (
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="ml-1 opacity-0 group-hover/perms:opacity-100 w-5 h-5 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                        >
                          <Bi name="trash3" size={10} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-3 py-2.5 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900 flex gap-2">
              <button
                onClick={() => { setViewGroup(null); openCreateModal(viewGroup); }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white py-1.5 rounded-lg text-xs font-medium transition-all"
              >
                <Bi name="plus-lg" size={11} />
                Add to {viewGroup}
              </button>
              <button
                onClick={() => setViewGroup(null)}
                className="px-4 py-1.5 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default PermissionsPage;