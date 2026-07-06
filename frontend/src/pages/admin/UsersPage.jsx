import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import { getUsers, createUser, updateUser, deleteUser, getRoles } from '../../api/admin';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext'; // 👈 Import useAuth

function UsersPage() {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState({ name: '', email: '', password: '', role: '' });
  const [error, setError]       = useState('');

  // 👇 Get permissions from auth context
  const { permissions } = useAuth();

  // 👇 Get toast function
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 👇 Check if user has the required permissions
  const canCreateUser = permissions?.includes('user-create') || false;
  const canEditUser = permissions?.includes('user-edit') || false;
  const canDeleteUser = permissions?.includes('user-delete') || false;

  const { data: users = [], isLoading: loading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => getUsers().then(res => res.data.users),
  });

  // Shared with RolesPage.jsx — same /admin/roles endpoint.
  const { data: roles = [] } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => getRoles().then(res => res.data.roles),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', role: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.roles?.[0]?.name || '' });
    setError('');
    setShowModal(true);
  };

  const saveMutation = useMutation({
    mutationFn: ({ editing, form }) => editing ? updateUser(editing.id, form) : createUser(form),
    onSuccess: (_res, { editing }) => {
      toast(editing ? 'User updated successfully' : 'User created successfully', 'success');
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
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
    saveMutation.mutate({ editing, form });
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteUser(id),
    onSuccess: () => {
      toast('User deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Could not delete user.';
      toast(msg, 'error');
      alert(msg);
    },
  });

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    deleteMutation.mutate(id);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Users</h2>
          <p className="text-gray-500 text-sm mt-1">Manage all platform users</p>
        </div>
        {/* 👇 "Add User" button only appears if user has user-create permission */}
        {canCreateUser && (
          <button
            onClick={openCreate}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add User
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-gray-400">Loading users...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['#', 'Name', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                      {user.roles?.[0]?.name || 'No role'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {/* 👇 "Edit" button only appears if user has user-edit permission */}
                      {canEditUser && (
                        <button
                          onClick={() => openEdit(user)}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Edit
                        </button>
                      )}
                      {/* 👇 "Delete" button only appears if user has user-delete permission */}
                      {canDeleteUser && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-500 hover:underline text-xs"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {editing ? 'Edit User' : 'Add New User'}
            </h3>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded mb-4">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text" value={form.name} required
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email" value={form.email} required
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              {!editing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password" value={form.password} required
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">No role</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium"
                >
                  {editing ? 'Save Changes' : 'Create User'}
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

export default UsersPage;