import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiFilter,
  FiX,
  FiGrid,
  FiList,
  FiMapPin,
  FiTag,
  FiPackage,
  FiChevronDown,
  FiRefreshCw,
  FiStar
} from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../../layouts/DashboardLayout';
import { browseProducts, getCategories } from '../../api/products';

function ProductCard({ product, index }) {
  const navigate = useNavigate();
  const firstImage = product.images?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      onClick={() => navigate(`/dashboard/product/${product.slug}-${product.hash_id}`)}
      className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 cursor-pointer transition-all duration-300 overflow-hidden"
    >
      {/* Image Container with gradient overlay */}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-100 to-blue-50">
        {firstImage ? (
          <>
            <img
              src={firstImage.image_url}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<span class="text-5xl opacity-30">📦</span>';
              }}
            />
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-30">
            <FiPackage className="w-12 h-12" />
          </div>
        )}
        
        {/* Category badge on image */}
        {product.category?.name && (
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm text-blue-600 text-xs font-medium px-3 py-1 rounded-full shadow-sm border border-white/50">
              {product.category.name}
            </span>
          </div>
        )}
        
        {/* Condition badge */}
        {product.condition && (
          <div className="absolute top-3 right-3">
            <span className="bg-slate-800/80 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full shadow-sm">
              {product.condition}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-800 text-sm group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[40px]">
          {product.title}
        </h3>
        
        <div className="mt-2 flex items-center justify-between">
          <p className="text-blue-700 font-bold text-lg">
            UGX {Number(product.price).toLocaleString()}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1">
            <FiMapPin className="w-3 h-3" />
            <span>{product.seller?.location || 'Uganda'}</span>
          </div>
          <div className="flex items-center gap-1">
            {product.seller?.rating_count > 0 ? (
              <>
                <FiStar className="w-3 h-3 text-amber-400" fill="currentColor" />
                <span className="text-slate-500 font-medium">{Number(product.seller.rating_average).toFixed(1)}</span>
                <span className="text-slate-300">({product.seller.rating_count})</span>
              </>
            ) : (
              <>
                <FiPackage className="w-3 h-3" />
                <span>Available</span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function BrowsePage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState(searchParams.get('search') || '');
  const [appliedSearch, setAppliedSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory]   = useState(searchParams.get('category_id') || '');
  const [condition, setCondition] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

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

  const clearFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setCategory('');
    setCondition('');
  };

  const hasActiveFilters = search || category || condition;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header with gradient */}
        <motion.div 
          className="relative mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-gradient-to-br from-slate-50 via-white to-stone-50 rounded-3xl p-8 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                  Browse Listings
                  <span className="text-sm font-normal bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                    {products.length} items
                  </span>
                </h2>
                <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                  <FiTag className="w-4 h-4 text-slate-400" />
                  Find e-waste components from sellers across Uganda
                </p>
              </div>
              
              {/* View toggle */}
              <div className="mt-3 sm:mt-0 flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <FiGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <FiList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search + filters */}
        <motion.div 
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search listings..."
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </form>

            {/* Filter dropdown toggle for mobile */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              <FiFilter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* Desktop filters */}
            <div className="hidden lg:flex items-center gap-3 flex-wrap">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white min-w-[150px]"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.category_id} value={c.category_id}>{c.name}</option>
                ))}
              </select>

              <select
                value={condition}
                onChange={e => setCondition(e.target.value)}
                className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white min-w-[130px]"
              >
                <option value="">All Conditions</option>
                {['New', 'Good', 'Fair', 'Poor'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition"
                >
                  <FiX className="w-4 h-4" />
                  Clear filters
                </button>
              )}
            </div>

            {/* Search button */}
            <button
              type="submit"
              onClick={handleSearch}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition shadow-blue-100 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <FiSearch className="w-4 h-4" />
              Search
            </button>
          </div>

          {/* Mobile filters */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden mt-3 pt-3 border-t border-slate-100 space-y-3"
              >
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c.category_id} value={c.category_id}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
                >
                  <option value="">All Conditions</option>
                  {['New', 'Good', 'Fair', 'Poor'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full flex items-center justify-center gap-1 text-sm text-slate-400 hover:text-slate-600 py-2 hover:bg-slate-50 rounded-xl transition"
                  >
                    <FiX className="w-4 h-4" />
                    Clear all filters
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                  <div className="aspect-video bg-slate-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-slate-100 rounded w-16" />
                    <div className="h-4 bg-slate-100 rounded w-full" />
                    <div className="h-4 bg-slate-100 rounded w-24" />
                    <div className="flex justify-between pt-2">
                      <div className="h-3 bg-slate-100 rounded w-16" />
                      <div className="h-3 bg-slate-100 rounded w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : products.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center"
            >
              <FiSearch className="w-14 h-14 text-slate-300 mx-auto mb-4" />
              <h3 className="font-bold text-slate-700 text-xl mb-2">No listings found</h3>
              <p className="text-slate-400 text-sm mb-6">Try adjusting your search or filters to find what you're looking for</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-semibold transition shadow-sm"
                >
                  <FiRefreshCw className="w-4 h-4" />
                  Clear all filters
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Results header */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <span className="font-medium text-slate-700">{products.length}</span>
                  listing{products.length !== 1 ? 's' : ''} found
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Showing {Math.min(products.length, 20)} items</span>
                </div>
              </div>

              {/* Product grid */}
              <div className={`grid gap-4 ${
                viewMode === 'grid' 
                  ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {products.map((p, index) => (
                  <ProductCard key={p.product_id} product={p} index={index} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        {products.length > 0 && (
          <motion.div 
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-200">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <p className="text-xs text-slate-400">
                Showing {Math.min(products.length, 20)} of {products.length} listings
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}