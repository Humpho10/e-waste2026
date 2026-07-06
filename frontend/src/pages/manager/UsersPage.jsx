import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BiUsers, BiSearch, BiUserCheck, BiUserX, BiUser, BiMail, BiPhone, BiMapPin,
} from '../../components/bi';
import ManagerLayout from '../../layouts/ManagerLayout';
import { listUsers, deactivateUser, activateUser } from '../../api/manager';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-t border-gray-50">
      <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-gray-100" /><div className="h-3 w-24 bg-gray-100 rounded" /></div></td>
      <td className="px-4 py-3"><div className="h-3 w-32 bg-gray-100 rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-20 bg-gray-100 rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-16 bg-gray-100 rounded" /></td>
      <td className="px-4 py-3"><div className="h-5 w-16 bg-gray-100 rounded-full" /></td>
      <td className="px-4 py-3"><div className="flex gap-2"><div className="h-5 w-16 bg-gray-100 rounded" /><div className="h-5 w-16 bg-gray-100 rounded" /></div></td>
    </tr>
  );
}

// ---------- Confirm Toggle Modal ----------
function ToggleStatusModal({ user, onClose, onConfirmed }) {
  const { toast } = useToast();
  const activating = !user.is_active;

  const mutation = useMutation({
    mutationFn: () => activating ? activateUser(user.id) : deactivateUser(user.id),
    onSuccess: () => {
      toast(`${user.name} has been ${activating ? 'activated' : 'deactivated'}`, 'success');
      onConfirmed();
      onClose();
    },
    onError: (err) => {
      toast(err.response?.data?.message || `Failed to ${activating ? 'activate' : 'deactivate'} user`, 'error');
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${activating ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
            {activating ? <BiUserCheck size={20} /> : <BiUserX size={20} />}
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">
            {activating ? 'Activate' : 'Deactivate'} {user.name}?
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {activating
              ? 'They will regain access to their account and be able to log in again.'
              : "They'll be signed out and won't be able to log in until reactivated."}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className={`flex-1 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition ${
                activating ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {mutation.isPending ? 'Working...' : `Yes, ${activating ? 'activate' : 'deactivate'}`}
            </button>
            <button
              onClick={onClose}
              disabled={mutation.isPending}
              className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl text-sm font-medium transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [toggleTarget, setToggleTarget] = useState(null);

  const { permissions } = useAuth();
  const queryClient = useQueryClient();

  const canActivate = permissions?.includes('user-activate') || false;
  const canDeactivate = permissions?.includes('user-deactivate') || false;

  const { data: users = [], isLoading: loading } = useQuery({
    queryKey: ['manager-users'],
    queryFn: () => listUsers().then(res => res.data.users),
  });

  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ['manager-users'] });

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = users.filter(u => u.is_active).length;
  const inactiveCount = users.length - activeCount;

  return (
    <ManagerLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BiUsers className="text-orange-500" size={22} /> Users
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {users.length} regular user{users.length !== 1 ? 's' : ''} on the platform
          </p>
        </div>
        <div className="relative max-w-sm">
          <BiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          />
        </div>
      </div>

      {/* Summary row */}
      {users.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <BiUsers size={16} className="text-orange-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800 leading-none">{users.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Total</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <BiUserCheck size={16} className="text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800 leading-none">{activeCount}</p>
              <p className="text-xs text-gray-400 mt-0.5">Active</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <BiUserX size={16} className="text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800 leading-none">{inactiveCount}</p>
              <p className="text-xs text-gray-400 mt-0.5">Inactive</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Name', 'Email', 'Phone', 'Location', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
            <BiUser size={28} className="text-orange-400" />
          </div>
          <h3 className="font-bold text-gray-700 mb-2">No users found</h3>
          <p className="text-gray-400 text-sm">
            {users.length === 0 ? 'No regular users have registered yet.' : `No results match "${search}"`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Name', 'Email', 'Phone', 'Location', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className="flex items-center gap-1.5"><BiMail size={12} className="text-gray-300" /> {user.email}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {user.phone ? <span className="flex items-center gap-1.5"><BiPhone size={11} className="text-gray-300" /> {user.phone}</span> : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {user.location ? <span className="flex items-center gap-1.5"><BiMapPin size={11} className="text-gray-300" /> {user.location}</span> : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                      user.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-400' : 'bg-gray-400'}`} />
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {canActivate && !user.is_active && (
                        <button
                          onClick={() => setToggleTarget(user)}
                          className="flex items-center gap-1.5 text-xs bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg font-medium transition"
                        >
                          <BiUserCheck size={13} /> Activate
                        </button>
                      )}
                      {canDeactivate && user.is_active && (
                        <button
                          onClick={() => setToggleTarget(user)}
                          className="flex items-center gap-1.5 text-xs bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg font-medium transition"
                        >
                          <BiUserX size={13} /> Deactivate
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

      {toggleTarget && (
        <ToggleStatusModal user={toggleTarget} onClose={() => setToggleTarget(null)} onConfirmed={invalidateUsers} />
      )}
    </ManagerLayout>
  );
}
