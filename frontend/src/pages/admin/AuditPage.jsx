import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import { getAuditTrail } from '../../api/admin';

function AuditPage() {
  const [search, setSearch]   = useState('');

  const { data: audit = [], isLoading: loading } = useQuery({
    queryKey: ['audit-trail'],
    queryFn: () => getAuditTrail().then(res => res.data.audit),
  });

  const filtered = audit.filter(a =>
    a.user.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    a.action.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Audit Trail</h2>
          <p className="text-gray-500 text-sm mt-1">Recent platform activity</p>
        </div>
        <input
          type="text" placeholder="Search by user or action..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
        />
      </div>

      {loading ? (
        <div className="text-gray-400">Loading audit trail...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['#', 'User', 'Email', 'Action', 'Last Used', 'Login Time'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">No activity found</td>
                </tr>
              ) : (
                filtered.map((entry, i) => (
                  <tr key={entry.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">
                          {entry.user.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">{entry.user}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{entry.email}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {entry.last_used ? new Date(entry.last_used).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

export default AuditPage;