import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { getUsers, createUser, updateUser, deleteUser, getRoles } from '../../api/admin';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext'; // 👈 Import useAuth

function UsersPage() {
  const [users, setUsers]       = useState([]);
  const [roles, setRoles]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState({ name: '', email: '', password: '', role: '' });
  const [error, setError]       = useState('');

  // 👇 Get permissions from auth context
  const { permissions } = useAuth();

  // 👇 Get toast function
  const { toast } = useToast();

  // 👇 Check if user has the required permissions
  const canCreateUser = permissions?.includes('user-create') || false;
  const canEditUser = permissions?.includes('user-edit') || false;
  const canDeleteUser = permissions?.includes('user-delete') || false;

  const fetchUsers = () => {
    getUsers().then(res => setUsers(res.data.users)).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
    getRoles().then(res => setRoles(res.data.roles));
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await updateUser(editing.id, form);
        toast('User updated successfully', 'success');
      } else {
        await createUser(form);
        toast('User created successfully', 'success');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong.';
      setError(msg);
      toast(msg, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(id);
      toast('User deleted successfully', 'success');
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not delete user.';
      toast(msg, 'error');
      alert(msg);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Users</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage all platform users</p>
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
        <div className="text-gray-400 dark:text-gray-500">Loading users...</div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-800">
              <tr>
                {['#', 'Name', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 dark:hover:bg-slate-800">
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 flex items-center justify-center font-bold text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800 dark:text-gray-100">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                      {user.roles?.[0]?.name || 'No role'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {/* 👇 "Edit" button only appears if user has user-edit permission */}
                      {canEditUser && (
                        <button
                          onClick={() => openEdit(user)}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                        >
                          Edit
                        </button>
                      )}
                      {/* 👇 "Delete" button only appears if user has user-delete permission */}
                      {canDeleteUser && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-500 dark:text-red-400 hover:underline text-xs"
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
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
              {editing ? 'Edit User' : 'Add New User'}
            </h3>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm px-4 py-2 rounded mb-4">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Name</label>
                <input
                  type="text" value={form.name} required
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email</label>
                <input
                  type="email" value={form.email} required
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              {!editing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Password</label>
                  <input
                    type="password" value={form.password} required
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="flex-1 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 py-2 rounded-lg text-sm"
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