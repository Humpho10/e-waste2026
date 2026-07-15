import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  BiUsers, BiSearch, BiUserCheck, BiUserX, BiUser, BiMail, BiPhone, BiMapPin,
  BiChevronLeft, BiChevronRight,
} from '../../components/bi';
import ManagerLayout from '../../layouts/ManagerLayout';
import { listUsers, deactivateUser, activateUser } from '../../api/manager';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';

// Debounces a fast-changing value (e.g. search input) so we don't fire a
// network request on every keystroke.
function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-t border-gray-50 dark:border-slate-800">
      <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800" /><div className="h-3 w-24 bg-gray-100 dark:bg-slate-800 rounded" /></div></td>
      <td className="px-4 py-3"><div className="h-3 w-32 bg-gray-100 dark:bg-slate-800 rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-20 bg-gray-100 dark:bg-slate-800 rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-16 bg-gray-100 dark:bg-slate-800 rounded" /></td>
      <td className="px-4 py-3"><div className="h-5 w-16 bg-gray-100 dark:bg-slate-800 rounded-full" /></td>
      <td className="px-4 py-3"><div className="flex gap-2"><div className="h-5 w-16 bg-gray-100 dark:bg-slate-800 rounded" /><div className="h-5 w-16 bg-gray-100 dark:bg-slate-800 rounded" /></div></td>
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
      toast(`${user.name} has been ${activating ? 'activated' : 'deactivated'}. An email notification has been sent.`, 'success');
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden dark:bg-slate-900">
        <div className="p-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${activating ? 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400' : 'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400'}`}>
            {activating ? <BiUserCheck size={20} /> : <BiUserX size={20} />}
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1 dark:text-gray-100">
            {activating ? 'Activate' : 'Deactivate'} {user.name}?
          </h3>
          <p className="text-sm text-gray-500 mb-6 dark:text-gray-400">
            {activating
              ? 'They will regain access to their account and be able to log in again. They will receive an email letting them know.'
              : "They'll be signed out and won't be able to log in until reactivated. They will receive an email letting them know."}
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
              className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl text-sm font-medium transition dark:border-slate-700 dark:text-gray-300"
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
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [toggleTarget, setToggleTarget] = useState(null);

  const { permissions } = useAuth();
  const queryClient = useQueryClient();

  const canActivate = permissions?.includes('user-activate') || false;
  const canDeactivate = permissions?.includes('user-deactivate') || false;

  // Any search change resets pagination back to page 1.
  useEffect(() => { setPage(1); }, [search, perPage]);

  const queryParams = useMemo(() => ({
    search: search || undefined,
    page,
    per_page: perPage,
  }), [search, page, perPage]);

  const { data, isLoading: loading, isFetching } = useQuery({
    queryKey: ['manager-users', queryParams],
    queryFn: () => listUsers(queryParams).then(res => res.data),
    placeholderData: keepPreviousData,
  });

  const users  = data?.users || [];
  const meta   = data?.meta || { current_page: 1, last_page: 1, per_page: perPage, total: 0 };
  const counts = data?.counts || { active: 0, inactive: 0 };

  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ['manager-users'] });

  return (
    <ManagerLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 dark:text-gray-100">
            <BiUsers className="text-orange-500 dark:text-orange-400" size={22} /> Users
          </h2>
          <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">
            {meta.total} regular user{meta.total !== 1 ? 's' : ''} on the platform
          </p>
        </div>
        <div className="relative max-w-sm">
          <BiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-slate-900"
          />
        </div>
      </div>

      {/* Summary row */}
      {meta.total > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 dark:bg-slate-900 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 dark:bg-orange-950/40">
              <BiUsers size={16} className="text-orange-500 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800 leading-none dark:text-gray-100">{meta.total}</p>
              <p className="text-xs text-gray-400 mt-0.5 dark:text-gray-500">Total</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 dark:bg-slate-900 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0 dark:bg-green-950/40">
              <BiUserCheck size={16} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800 leading-none dark:text-gray-100">{counts.active}</p>
              <p className="text-xs text-gray-400 mt-0.5 dark:text-gray-500">Active</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 dark:bg-slate-900 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 dark:bg-slate-800">
              <BiUserX size={16} className="text-gray-400 dark:text-gray-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800 leading-none dark:text-gray-100">{counts.inactive}</p>
              <p className="text-xs text-gray-400 mt-0.5 dark:text-gray-500">Inactive</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
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
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center dark:bg-slate-900 dark:border-slate-700">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4 dark:bg-orange-950/40">
            <BiUser size={28} className="text-orange-400" />
          </div>
          <h3 className="font-bold text-gray-700 mb-2 dark:text-gray-200">No users found</h3>
          <p className="text-gray-400 text-sm dark:text-gray-500">
            {meta.total === 0 && !search ? 'No regular users have registered yet.' : `No results match "${search}"`}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-800">
              <tr>
                {['Name', 'Email', 'Phone', 'Location', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-t border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold dark:bg-blue-900/40">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800 dark:text-gray-100">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    <span className="flex items-center gap-1.5"><BiMail size={12} className="text-gray-300" /> {user.email}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs dark:text-gray-400">
                    {user.phone ? <span className="flex items-center gap-1.5"><BiPhone size={11} className="text-gray-300" /> {user.phone}</span> : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs dark:text-gray-400">
                    {user.location ? <span className="flex items-center gap-1.5"><BiMapPin size={11} className="text-gray-300" /> {user.location}</span> : '—'}
                  </td>
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
                          onClick={() => setToggleTarget(user)}
                          className="flex items-center gap-1.5 text-xs bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg font-medium transition dark:bg-green-950/40 dark:text-green-400 dark:border-green-800/50"
                        >
                          <BiUserCheck size={13} /> Activate
                        </button>
                      )}
                      {canDeactivate && user.is_active && (
                        <button
                          onClick={() => setToggleTarget(user)}
                          className="flex items-center gap-1.5 text-xs bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg font-medium transition dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/50"
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

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>
                Showing {(meta.current_page - 1) * meta.per_page + 1}–{Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total}
              </span>
              {isFetching && <span className="w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />}
              <select
                value={perPage}
                onChange={e => setPerPage(Number(e.target.value))}
                className="ml-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={meta.current_page <= 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <BiChevronLeft size={13} />
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400 px-2">
                Page {meta.current_page} of {meta.last_page}
              </span>
              <button
                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                disabled={meta.current_page >= meta.last_page}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <BiChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {toggleTarget && (
        <ToggleStatusModal user={toggleTarget} onClose={() => setToggleTarget(null)} onConfirmed={invalidateUsers} />
      )}
    </ManagerLayout>
  );
}
