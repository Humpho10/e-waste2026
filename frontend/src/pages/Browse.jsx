import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCategories, getProducts } from '../api/products';
import ProductCard from '../components/ProductCard';

const CONDITIONS = ['Excellent', 'Good', 'Fair', 'For Parts Only'];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // local form state, mirrors URL params
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('category_id') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const page = Number(searchParams.get('page') || 1);

  useEffect(() => {
    getCategories().then((res) => setCategories(res.data.categories));
  }, []);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = Object.fromEntries(
      Object.entries({
        q: searchParams.get('q'),
        category_id: searchParams.get('category_id'),
        condition: searchParams.get('condition'),
        min_price: searchParams.get('min_price'),
        max_price: searchParams.get('max_price'),
        sort: searchParams.get('sort') || 'newest',
        page: searchParams.get('page') || 1,
      }).filter(([, v]) => v)
    );
    getProducts(params)
      .then((res) => setResult(res.data))
      .finally(() => setLoading(false));
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const applyFilters = (e) => {
    e?.preventDefault();
    const next = {};
    if (q) next.q = q;
    if (categoryId) next.category_id = categoryId;
    if (condition) next.condition = condition;
    if (minPrice) next.min_price = minPrice;
    if (maxPrice) next.max_price = maxPrice;
    if (sort !== 'newest') next.sort = sort;
    setSearchParams(next);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setQ(''); setCategoryId(''); setCondition(''); setMinPrice(''); setMaxPrice(''); setSort('newest');
    setSearchParams({});
  };

  const goToPage = (p) => {
    const next = Object.fromEntries(searchParams);
    next.page = p;
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeFilterCount = [categoryId, condition, minPrice, maxPrice].filter(Boolean).length;

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Search bar */}
        <form onSubmit={applyFilters} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for a part…"
              className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="flex items-center gap-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 rounded-lg px-4 py-2.5 transition-colors"
          >
            <SlidersHorizontal size={15} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-blue-500 text-white text-[11px] font-semibold rounded-full w-4.5 h-4.5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg px-5 py-2.5 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Filter panel */}
        {filtersOpen && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any condition</option>
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Min price (UGX)</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Max price (UGX)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="No limit"
                className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2 sm:col-span-4 flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
              >
                <X size={13} /> Clear all filters
              </button>
              <button
                onClick={applyFilters}
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg px-4 py-1.5 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Result header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">
            {loading ? 'Searching…' : `${result?.total ?? 0} item${result?.total === 1 ? '' : 's'} found`}
          </p>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); }}
            onBlur={applyFilters}
            className="text-sm border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest first</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-white border border-slate-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : result?.data?.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl py-20 text-center">
            <p className="text-slate-500 text-sm mb-1">No matching listings.</p>
            <p className="text-slate-400 text-xs">Try a different search or clear your filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {result.data.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {/* Pagination */}
            {result.last_page > 1 && (
              <div className="flex items-center justify-center gap-1 mt-8">
                <button
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                  className="p-2 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-white transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: result.last_page }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToPage(i + 1)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      page === i + 1
                        ? 'bg-blue-500 text-white'
                        : 'border border-slate-300 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={page >= result.last_page}
                  onClick={() => goToPage(page + 1)}
                  className="p-2 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-white transition-colors"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
