import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import { getProductManagersOverview } from '../../api/admin';
import Bi from '../../components/BsIcon';

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-32" />
          <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-44" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-gray-100 dark:bg-slate-800 rounded-full" />
        <div className="h-5 w-16 bg-gray-100 dark:bg-slate-800 rounded-full" />
      </div>
    </div>
  );
}

function ProductManagerCard({ pm }) {
  const initials = pm.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const categories = (pm.assignments || []).map(a => a.category?.name).filter(Boolean);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-teal-100 dark:hover:border-teal-900/50 transition-all duration-200 p-6 group">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {initials}
        </div>
        <div className="flex-1 overflow-hidden">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate">{pm.name}</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{pm.email}</p>
          {pm.phone && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">📞 {pm.phone}</p>
          )}
        </div>
        <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${pm.is_active ? 'bg-green-400' : 'bg-gray-300'}`} title={pm.is_active ? 'Active' : 'Inactive'} />
      </div>

      <div className="mb-4">
        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
          <Bi name="tags-fill" size={11} /> Assigned Categories
        </p>
        {categories.length === 0 ? (
          <span className="text-gray-400 dark:text-gray-500 text-sm italic">Unassigned</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {categories.map(name => (
              <span key={name} className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 text-xs px-2.5 py-1 rounded-full font-semibold">
                {name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-800">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          Joined {new Date(pm.created_at).toLocaleDateString('en-UG', {
            day: 'numeric', month: 'short', year: 'numeric'
          })}
        </span>
        {pm.location && (
          <span className="text-xs text-gray-400 dark:text-gray-500">📍 {pm.location}</span>
        )}
      </div>
    </div>
  );
}

export default function ProductManagersPage() {
  const [search, setSearch] = useState('');

  const { data: productManagers = [], isLoading: loading } = useQuery({
    queryKey: ['admin-product-managers'],
    queryFn: () => getProductManagersOverview().then(res => res.data.product_managers),
  });

  const q = search.trim().toLowerCase();
  const filtered = q
    ? productManagers.filter(pm =>
        pm.name.toLowerCase().includes(q) ||
        pm.email.toLowerCase().includes(q) ||
        (pm.assignments || []).some(a => a.category?.name?.toLowerCase().includes(q))
      )
    : productManagers;

  return (
    <AdminLayout>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Product Managers</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {productManagers.length} product manager{productManagers.length !== 1 ? 's' : ''} on the platform — view only
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 px-3 py-1.5 rounded-full">
          <Bi name="eye-fill" size={12} />
          Managed by Admins — Super Admin has read-only visibility
        </span>
      </div>

      {/* Search bar */}
      {productManagers.length > 0 && (
        <div className="mb-6">
          <div className="relative max-w-sm">
            <Bi name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, email, or category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-900 dark:text-gray-100"
            />
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : productManagers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-3xl mx-auto mb-4">
            📦
          </div>
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">No product managers yet</h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm max-w-xs mx-auto">
            Admins create Product Manager accounts and assign them categories from their own dashboard.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <p className="text-lg mb-1">No results for "{search}"</p>
          <button onClick={() => setSearch('')} className="text-teal-600 dark:text-teal-400 text-sm hover:underline">
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(pm => (
            <ProductManagerCard key={pm.id} pm={pm} />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
