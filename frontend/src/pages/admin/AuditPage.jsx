import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { getAuditTrail } from '../../api/admin';

function AuditPage() {
  const [audit, setAudit]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    getAuditTrail().then(res => setAudit(res.data.audit)).finally(() => setLoading(false));
  }, []);

  const filtered = audit.filter(a =>
    a.user.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    a.action.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Audit Trail</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Recent platform activity</p>
        </div>
        <input
          type="text" placeholder="Search by user or action..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
        />
      </div>

      {loading ? (
        <div className="text-gray-400 dark:text-gray-500">Loading audit trail...</div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-800">
              <tr>
                {['#', 'User', 'Email', 'Action', 'Last Used', 'Login Time'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400 dark:text-gray-500">No activity found</td>
                </tr>
              ) : (
                filtered.map((entry, i) => (
                  <tr key={entry.id} className="border-t border-gray-50 hover:bg-gray-50 dark:hover:bg-slate-800">
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 flex items-center justify-center text-xs font-bold">
                          {entry.user.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800 dark:text-gray-100">{entry.user}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{entry.email}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-100 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs">
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs">
                      {entry.last_used ? new Date(entry.last_used).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs">
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