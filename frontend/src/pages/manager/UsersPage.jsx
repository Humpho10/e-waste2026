import { useEffect, useState } from 'react';
import ManagerLayout from '../../layouts/ManagerLayout';
import { listUsers, deactivateUser, activateUser } from '../../api/manager';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-t border-gray-50">
      <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800" /><div className="h-3 w-24 bg-gray-100 dark:bg-slate-800 rounded" /></div></td>
      <td className="px-4 py-3"><div className="h-3 w-32 bg-gray-100 dark:bg-slate-800 rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-20 bg-gray-100 dark:bg-slate-800 rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-16 bg-gray-100 dark:bg-slate-800 rounded" /></td>
      <td className="px-4 py-3"><div className="h-5 w-16 bg-gray-100 dark:bg-slate-800 rounded-full" /></td>
      <td className="px-4 py-3"><div className="flex gap-2"><div className="h-5 w-16 bg-gray-100 dark:bg-slate-800 rounded" /><div className="h-5 w-16 bg-gray-100 dark:bg-slate-800 rounded" /></div></td>
    </tr>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const { permissions } = useAuth();
  const { toast } = useToast();

  const canActivate = permissions?.includes('user-activate') || false;
  const canDeactivate = permissions?.includes('user-deactivate') || false;

  const fetchUsers = () => {
    setLoading(true);
    listUsers()
      .then(res => setUsers(res.data.users))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (id, currentStatus, name) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${name}?`)) return;
    setActionLoading(id);
    try {
      if (currentStatus) {
        await deactivateUser(id);
        toast(`${name} has been deactivated`, 'success');
      } else {
        await activateUser(id);
        toast(`${name} has been activated`, 'success');
      }
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to ${action} user`;
      toast(msg, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ManagerLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Users</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {users.length} regular user{users.length !== 1 ? 's' : ''} on the platform
          </p>
        </div>
        <div className="relative max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-slate-900"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-800">
              <tr>
                {['Name', 'Email', 'Phone', 'Location', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 p-16 text-center">
          <div className="text-5xl mb-4">👤</div>
          <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2">No users found</h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            {users.length === 0 ? 'No regular users have registered yet.' : `No results match "${search}"`}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-800">
              <tr>
                {['Name', 'Email', 'Phone', 'Location', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id} className="border-t border-gray-50 hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800 dark:text-gray-100">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{user.email}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{user.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{user.location || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                      user.is_active
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-400' : 'bg-gray-400'}`} />
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {canActivate && !user.is_active && (
                        <button
                          onClick={() => handleToggleStatus(user.id, false, user.name)}
                          disabled={actionLoading === user.id}
                          className="text-xs bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 hover:bg-green-100 border border-green-200 dark:border-green-800/50 px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-50"
                        >
                          {actionLoading === user.id ? '...' : 'Activate'}
                        </button>
                      )}
                      {canDeactivate && user.is_active && (
                        <button
                          onClick={() => handleToggleStatus(user.id, true, user.name)}
                          disabled={actionLoading === user.id}
                          className="text-xs bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 hover:bg-red-100 border border-red-200 dark:border-red-800/50 px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-50"
                        >
                          {actionLoading === user.id ? '...' : 'Deactivate'}
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
    </ManagerLayout>
  );
}