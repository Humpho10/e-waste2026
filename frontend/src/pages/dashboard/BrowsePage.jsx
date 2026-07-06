import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../../layouts/DashboardLayout';
import { browseProducts, getCategories } from '../../api/products';

function ProductCard({ product }) {
  const navigate = useNavigate();
  const firstImage = product.images?.[0];

  return (
    <div
      onClick={() => navigate(`/dashboard/product/${product.product_id}`)}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 cursor-pointer transition group"
    >
      <div className="aspect-video rounded-t-2xl overflow-hidden bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
        {firstImage ? (
          <img
            src={firstImage.image_url}
            alt={product.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<span class="text-4xl opacity-30">📦</span>';
            }}
          />
        ) : (
          <span className="text-4xl opacity-30">📦</span>
        )}
      </div>
      <div className="p-4">
        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
          {product.category?.name}
        </span>
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mt-2 group-hover:text-blue-600 transition line-clamp-2">
          {product.title}
        </h3>
        <p className="text-blue-700 dark:text-blue-400 font-bold mt-1">UGX {Number(product.price).toLocaleString()}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{product.condition}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">📍 {product.seller?.location || 'Uganda'}</span>
        </div>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch]       = useState(searchParams.get('search') || '');
  const [appliedSearch, setAppliedSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory]   = useState(searchParams.get('category_id') || '');
  const [condition, setCondition] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then(res => res.data.categories),
  });

  const { data: products = [], isLoading: loading } = useQuery({
    queryKey: ['browse-products', appliedSearch, category, condition],
    queryFn: () => {
      const params = {};
      if (appliedSearch) params.search      = appliedSearch;
      if (category)      params.category_id = category;
      if (condition)     params.condition   = condition;
      return browseProducts(params).then(res => res.data.data || []);
    },
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setAppliedSearch(search);
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Browse Listings</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Find e-waste components from sellers across Uganda</p>
      </div>

      {/* Search + filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 mb-6 flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search listings..."
            className="flex-1 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
            🔍
          </button>
        </form>

        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.category_id} value={c.category_id}>{c.name}</option>
          ))}
        </select>

        <select
          value={condition}
          onChange={e => setCondition(e.target.value)}
          className="border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Conditions</option>
          {['New', 'Good', 'Fair', 'Poor'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {(search || category || condition) && (
          <button
            onClick={() => { setSearch(''); setCategory(''); setCondition(''); }}
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 px-3"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
              <div className="aspect-video bg-gray-100 dark:bg-slate-800" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-16" />
                <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-full" />
                <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 p-16 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2">No listings found</h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{products.length} listing{products.length !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => <ProductCard key={p.product_id} product={p} />)}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}