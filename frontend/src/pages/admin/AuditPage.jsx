import { useEffect, useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import Bi from '../../components/BsIcon';
import { getAuditTrail, exportAuditTrail } from '../../api/admin';

const ACTION_STYLES = {
  created:                 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400',
  updated:                 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
  deleted:                 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400',
  approved_by_management:  'bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400',
  rejected_by_management:  'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400',
};

const ACTION_ICONS = {
  created:                 'plus-circle-fill',
  updated:                 'pencil-fill',
  deleted:                 'trash-fill',
  approved_by_management:  'check-circle-fill',
  rejected_by_management:  'x-circle-fill',
};

function actionStyle(action) {
  return ACTION_STYLES[action] || 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300';
}

function actionIcon(action) {
  return ACTION_ICONS[action] || 'activity';
}

function actionLabel(action = '') {
  return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const TABLE_LABELS = {
  products: 'Products',
  categories: 'Categories',
  subcategories: 'Subcategories',
  sub_categories: 'Subcategories',
  users: 'Users',
  product_manager_assignments: 'PM Assignments',
};

function tableLabel(name = '') {
  return TABLE_LABELS[name] || name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Small debounce hook so the search box doesn't fire a request per keystroke.
function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function DiffValue({ label, value, tone }) {
  const isEmpty = value === null || value === undefined || (typeof value === 'object' && Object.keys(value).length === 0);
  return (
    <div className="flex-1 min-w-0">
      <p className={`text-[11px] font-semibold uppercase tracking-wide mb-1.5 ${tone}`}>{label}</p>
      {isEmpty ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">— none —</p>
      ) : (
        <pre className="text-xs bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300">
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </div>
  );
}

function AuditDetailModal({ entry, onClose }) {
  if (!entry) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${actionStyle(entry.action)}`}>
                <Bi name={actionIcon(entry.action)} size={15} />
              </span>
              {actionLabel(entry.action)}
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {tableLabel(entry.table)} · Record #{entry.record_id} · {new Date(entry.created_at).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0">
            <Bi name="x-lg" size={16} />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800/60 rounded-lg px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
              {entry.user.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{entry.user}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{entry.email || 'No email on record'}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <DiffValue label="Before" value={entry.old_value} tone="text-red-500 dark:text-red-400" />
            <DiffValue label="After" value={entry.new_value} tone="text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="px-6 py-3 border-t border-gray-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const EMPTY_FILTERS = { action: 'all', table: 'all', dateFrom: '', dateTo: '', sort: 'desc' };

export default function AuditPage() {
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [selected, setSelected] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  // Any filter change resets pagination back to page 1.
  useEffect(() => { setPage(1); }, [search, filters.action, filters.table, filters.dateFrom, filters.dateTo, filters.sort, perPage]);

  const queryParams = useMemo(() => ({
    search: search || undefined,
    action: filters.action !== 'all' ? filters.action : undefined,
    table: filters.table !== 'all' ? filters.table : undefined,
    date_from: filters.dateFrom || undefined,
    date_to: filters.dateTo || undefined,
    sort: filters.sort,
    page,
    per_page: perPage,
  }), [search, filters, page, perPage]);

  const { data, isLoading: loading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['audit-trail', queryParams],
    queryFn: () => getAuditTrail(queryParams).then(res => res.data),
    placeholderData: keepPreviousData,
  });

  const audit         = data?.audit || [];
  const meta           = data?.meta || { current_page: 1, last_page: 1, per_page: perPage, total: 0 };
  const actionOptions  = data?.filter_options?.actions || [];
  const tableOptions   = data?.filter_options?.tables || [];

  const hasActiveFilters = Boolean(search) || filters.action !== 'all' || filters.table !== 'all' || filters.dateFrom || filters.dateTo;

  const clearFilters = () => {
    setSearchInput('');
    setFilters(EMPTY_FILTERS);
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError('');
    try {
      const res = await exportAuditTrail(queryParams);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setExportError('Export failed — please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Bi name="file-earmark-text-fill" size={20} className="text-blue-600 dark:text-blue-400" />
            Audit Trail
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {meta.total.toLocaleString()} recorded event{meta.total === 1 ? '' : 's'} across the platform
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || loading}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition"
        >
          <Bi name={exporting ? 'arrow-repeat' : 'download'} size={15} className={exporting ? 'animate-spin' : ''} />
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {exportError && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
          {exportError}
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 mb-5">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Bi name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search user, email, action, table, or record ID..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filters.action}
            onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
            className="border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All actions</option>
            {actionOptions.map(a => <option key={a} value={a}>{actionLabel(a)}</option>)}
          </select>

          <select
            value={filters.table}
            onChange={e => setFilters(f => ({ ...f, table: e.target.value }))}
            className="border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All tables</option>
            {tableOptions.map(t => <option key={t} value={t}>{tableLabel(t)}</option>)}
          </select>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
            title="From date"
            className="border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400 dark:text-gray-500 text-sm">to</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
            title="To date"
            className="border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={() => setFilters(f => ({ ...f, sort: f.sort === 'desc' ? 'asc' : 'desc' }))}
            title="Toggle sort order"
            className="inline-flex items-center gap-1.5 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
          >
            <Bi name={filters.sort === 'desc' ? 'sort-down' : 'sort-up'} size={14} />
            {filters.sort === 'desc' ? 'Newest' : 'Oldest'}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-sm text-red-500 dark:text-red-400 hover:underline px-2"
            >
              <Bi name="x-circle-fill" size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
          {error?.response?.data?.message || 'Failed to load the audit trail'} — <button onClick={() => refetch()} className="underline">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-800">
            <tr>
              {['#', 'User', 'Action', 'Table', 'Record', 'Date', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <tr key={i} className="border-t border-gray-50 dark:border-slate-800 animate-pulse">
                  <td className="px-4 py-3"><div className="h-3 w-4 bg-gray-100 dark:bg-slate-800 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-5 w-32 bg-gray-100 dark:bg-slate-800 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-5 w-20 bg-gray-100 dark:bg-slate-800 rounded-full" /></td>
                  <td className="px-4 py-3"><div className="h-3 w-20 bg-gray-100 dark:bg-slate-800 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-3 w-10 bg-gray-100 dark:bg-slate-800 rounded" /></td>
                  <td className="px-4 py-3"><div className="h-3 w-24 bg-gray-100 dark:bg-slate-800 rounded" /></td>
                  <td className="px-4 py-3" />
                </tr>
              ))
            ) : audit.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <Bi name="inbox" size={28} className="mx-auto mb-2 opacity-50" />
                  <p>No activity matches these filters</p>
                </td>
              </tr>
            ) : (
              audit.map((entry, i) => (
                <tr
                  key={entry.id}
                  onClick={() => setSelected(entry)}
                  className="border-t border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500">{(meta.current_page - 1) * meta.per_page + i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                        {entry.user.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{entry.user}</p>
                        {entry.email && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{entry.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${actionStyle(entry.action)}`}>
                      <Bi name={actionIcon(entry.action)} size={11} />
                      {actionLabel(entry.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{tableLabel(entry.table)}</td>
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500">#{entry.record_id}</td>
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-blue-600 dark:text-blue-400 text-xs font-medium inline-flex items-center gap-1">
                      View <Bi name="arrow-right" size={11} />
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && audit.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>
                Showing {(meta.current_page - 1) * meta.per_page + 1}–{Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total.toLocaleString()}
              </span>
              {isFetching && <Bi name="arrow-repeat" size={12} className="animate-spin text-blue-500" />}
              <select
                value={perPage}
                onChange={e => setPerPage(Number(e.target.value))}
                className="ml-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <Bi name="chevron-left" size={11} />
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400 px-2">
                Page {meta.current_page} of {meta.last_page}
              </span>
              <button
                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                disabled={meta.current_page >= meta.last_page}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <Bi name="chevron-right" size={11} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AuditDetailModal entry={selected} onClose={() => setSelected(null)} />
    </AdminLayout>
  );
}
