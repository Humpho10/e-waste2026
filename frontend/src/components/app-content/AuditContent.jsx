// src/components/app-content/AuditContent.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditTrail } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';

export default function AuditContent() {
  const [filter, setFilter] = useState({ action: 'all', table: 'all' });

  const { permissions } = useAuth();

  // Distinct key from admin/AuditPage.jsx — this call passes filter params
  // to the endpoint, so it's a different query shape and shouldn't share cache.
  const { data: audit = [], isLoading: loading } = useQuery({
    queryKey: ['audit-trail', filter],
    queryFn: () => getAuditTrail(filter).then(res => res.data.audit),
  });

  const actionOptions = ['all', 'created', 'updated', 'deleted'];
  const tableOptions = ['all', 'users', 'products', 'categories', 'roles'];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Audit Trail</h2>
          <p className="text-gray-500 text-sm mt-1">Every action logged across the platform</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filter.action}
            onChange={e => setFilter(prev => ({ ...prev, action: e.target.value }))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {actionOptions.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
          </select>
          <select
            value={filter.table}
            onChange={e => setFilter(prev => ({ ...prev, table: e.target.value }))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {tableOptions.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading audit trail...</div>
      ) : audit.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="font-bold text-gray-700 mb-2">No entries found</h3>
          <p className="text-gray-400 text-sm">Actions will appear here as they happen.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['#', 'User', 'Action', 'Table', 'Record ID', 'Changed At'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {audit.map((entry, i) => (
                <tr key={entry.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{entry.user}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      entry.action === 'created' ? 'bg-green-100 text-green-700' :
                      entry.action === 'updated' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{entry.action}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{entry.table}</td>
                  <td className="px-4 py-3 text-gray-500">{entry.record_id}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(entry.created_at).toLocaleString('en-UG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}