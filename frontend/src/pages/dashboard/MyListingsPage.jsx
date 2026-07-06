import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiPackage,
  FiTag,
  FiCalendar,
  FiMapPin,
  FiAlertCircle,
  FiEye,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiList,
  FiGrid,
  FiSearch,
  FiInbox
} from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../layouts/DashboardLayout';
import { myListings, deleteProduct } from '../../api/products';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

const statusConfig = {
  pending: {
    label: 'Pending Review',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-400',
    icon: FiClock
  },
  approved: {
    label: 'Approved — Live',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-400',
    icon: FiCheckCircle
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-400',
    icon: FiXCircle
  },
  resubmitted: {
    label: 'Resubmitted',
    color: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-400',
    icon: FiRefreshCw
  },
};

export default function MyListingsPage() {
  const [searchParams]            = useSearchParams();
  const [status, setStatus]       = useState(searchParams.get('status') || 'all');
  const [deleting, setDeleting]   = useState(null);
  const [viewMode, setViewMode]   = useState('list');
  const [searchTerm, setSearchTerm] = useState('');

  const { permissions } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canEdit = permissions?.includes('product-edit') || false;
  const canDelete = permissions?.includes('product-delete') || false;
  const canResubmit = permissions?.includes('product-create') || false;
  const canCreate = permissions?.includes('product-create') || false;

  const { data: listings = [], isLoading: loading } = useQuery({
    queryKey: ['my-listings', status],
    queryFn: () => myListings(status !== 'all' ? { status } : {}).then(res => res.data.products || []),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteProduct(id),
    onSuccess: () => {
      toast('Listing deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    },
    onError: (err) => toast(err.response?.data?.message || 'Could not delete.', 'error'),
  });

  const handleDelete = async (hashId, title) => { // CHANGED: now uses hashId
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(hashId);
    try {
      await deleteProduct(hashId);
      toast('Listing deleted successfully', 'success');
      fetchListings();
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not delete.';
      toast(msg, 'error');
      await deleteMutation.mutateAsync(id);
    } finally {
      setDeleting(null);
    }
  };

  // Filter listings by search term
  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusCounts = {
    all: listings.length,
    pending: listings.filter(l => l.status === 'pending').length,
    approved: listings.filter(l => l.status === 'approved').length,
    rejected: listings.filter(l => l.status === 'rejected').length,
  };

  // Format Ugandan Shillings
  const formatUGX = (amount) => {
    return `UGX ${Number(amount).toLocaleString()}`;
  };

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                  My Listings
                  <span className="text-sm font-normal bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                    {filteredListings.length} items
                  </span>
                </h2>
                <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                  <FiPackage className="w-4 h-4 text-slate-400" />
                  Manage and track your marketplace listings
                </p>
              </div>
              
              {canCreate && (
                <Link
                  to="/dashboard/create"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl text-sm font-semibold transition shadow-blue-100 shadow-lg hover:shadow-xl"
                >
                  <FiPlus className="w-4 h-4" />
                  Post New Listing
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        {/* Filters and search */}
        <motion.div
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Status filters */}
            <div className="flex flex-wrap gap-2 flex-1">
              {['all', 'pending', 'approved', 'rejected'].map(s => {
                const count = statusCounts[s] || 0;
                const isActive = status === s;
                const config = s !== 'all' ? statusConfig[s] : null;
                
                return (
                  <motion.button
                    key={s}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStatus(s)}
                    className={`
                      relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                      ${isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
                      }
                    `}
                  >
                    <span className="flex items-center gap-2 capitalize">
                      {s !== 'all' && config && <config.icon className="w-3.5 h-3.5" />}
                      {s === 'all' ? 'All Listings' : s}
                      {count > 0 && (
                        <span className={`
                          text-xs px-2 py-0.5 rounded-full
                          ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}
                        `}>
                          {count}
                        </span>
                      )}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search listings..."
                className="w-full lg:w-48 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <FiList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <FiGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 flex gap-4 items-center animate-pulse">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-56" />
                    <div className="h-3 bg-slate-100 rounded w-32" />
                  </div>
                  <div className="h-6 w-24 bg-slate-100 rounded-full" />
                </div>
              ))}
            </motion.div>
          ) : filteredListings.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center"
            >
              <FiInbox className="w-14 h-14 text-slate-300 mx-auto mb-4" />
              <h3 className="font-bold text-slate-700 text-xl mb-2">
                {searchTerm ? 'No matching listings found' : 'No listings yet'}
              </h3>
              <p className="text-slate-400 text-sm mb-6">
                {searchTerm 
                  ? 'Try adjusting your search or filters'
                  : 'Post your first e-waste component to start selling'
                }
              </p>
              {canCreate && !searchTerm && (
                <Link
                  to="/dashboard/create"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl text-sm font-semibold transition shadow-blue-100 shadow-lg hover:shadow-xl"
                >
                  <FiPlus className="w-4 h-4" />
                  Post First Listing
                </Link>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Results count */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <span className="font-medium text-slate-700">{filteredListings.length}</span>
                  listing{filteredListings.length !== 1 ? 's' : ''} found
                  {searchTerm && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      "{searchTerm}"
                    </span>
                  )}
                </p>
              </div>

              {/* Listing items */}
              <div className={`space-y-3 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4 space-y-0' : ''}`}>
                {filteredListings.map((listing, index) => {
                  const cfg = statusConfig[listing.status] || statusConfig.pending;
                  const firstImage = listing.images?.[0];
                  const StatusIcon = cfg.icon;

                  return (
                    <motion.div
                      key={listing.product_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -2 }}
                      className={`bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 ${
                        viewMode === 'grid' ? 'p-4' : 'p-5 flex gap-4 items-start'
                      }`}
                    >
                      {/* Image */}
                      <div className={`${
                        viewMode === 'grid' ? 'aspect-video w-full rounded-xl overflow-hidden mb-3' : 'w-16 h-16 rounded-xl shrink-0 overflow-hidden'
                      } bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center text-3xl`}>
                        {firstImage ? (
                          <img
                            src={firstImage.image_url}
                            alt={listing.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '📦';
                            }}
                          />
                        ) : <FiPackage className="w-7 h-7 text-slate-400" />}
                      </div>

                      {/* Info */}
                      <div className={`flex-1 ${viewMode === 'grid' ? '' : 'min-w-0'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`font-bold text-slate-800 hover:text-blue-600 transition-colors ${
                            viewMode === 'grid' ? 'text-base' : 'truncate'
                          }`}>
                            {listing.title}
                          </h3>
                        </div>

                        <div className={`flex flex-wrap gap-2 mt-1.5 text-xs text-slate-400 ${
                          viewMode === 'grid' ? 'flex-col items-start' : 'items-center'
                        }`}>
                          <span className="flex items-center gap-1">
                            {formatUGX(listing.price)}
                          </span>
                          <span className="hidden sm:inline">·</span>
                          <span className="flex items-center gap-1">
                            <FiTag className="w-3 h-3" />
                            {listing.condition}
                          </span>
                          <span className="hidden sm:inline">·</span>
                          <span className="flex items-center gap-1">
                            <FiPackage className="w-3 h-3" />
                            {listing.category?.name}
                          </span>
                          <span className="hidden sm:inline">·</span>
                          <span className="flex items-center gap-1">
                            <FiCalendar className="w-3 h-3" />
                            {new Date(listing.created_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>

                        {listing.status === 'rejected' && listing.rejection_reason && (
                          <div className="mt-2 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                            <div className="flex items-start gap-2">
                              <FiAlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs text-rose-600 font-medium">Rejection reason:</p>
                                <p className="text-xs text-rose-500 mt-0.5">{listing.rejection_reason}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className={`flex flex-col items-end gap-2 shrink-0 ${
                        viewMode === 'grid' ? 'flex-row justify-between items-center w-full mt-3 pt-3 border-t border-slate-100' : ''
                      }`}>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border ${cfg.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </span>

                        <div className={`flex items-center gap-2 ${viewMode === 'grid' ? '' : 'flex-wrap justify-end'}`}>
                          {/* CHANGED: View link using slug and hash_id */}
                          <Link
                            to={`/dashboard/product/${listing.slug}-${listing.hash_id}`}
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium"
                          >
                            <FiEye className="w-3 h-3" />
                            View
                          </Link>

                          {/* CHANGED: Edit link using hash_id */}
                          {canEdit && ['pending', 'rejected'].includes(listing.status) && (
                            <Link
                              to={`/dashboard/edit/${listing.hash_id}`}
                              className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium"
                            >
                              <FiEdit className="w-3 h-3" />
                              Edit
                            </Link>
                          )}
                          
                          {/* CHANGED: Resubmit link using hash_id */}
                          {canResubmit && listing.status === 'rejected' && (
                            <Link
                              to={`/dashboard/resubmit/${listing.hash_id}`}
                              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-medium transition shadow-sm"
                            >
                              Resubmit
                            </Link>
                          )}
                          
                          {/* CHANGED: Delete using hash_id */}
                          {canDelete && listing.status !== 'approved' && (
                            <button
                              onClick={() => handleDelete(listing.hash_id, listing.title)}
                              disabled={deleting === listing.hash_id}
                              className="text-xs text-rose-400 hover:text-rose-600 hover:underline flex items-center gap-1 font-medium disabled:opacity-50"
                            >
                              <FiTrash2 className="w-3 h-3" />
                              {deleting === listing.hash_id ? '...' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer stats */}
        {!loading && filteredListings.length > 0 && (
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-full border border-slate-200">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs text-slate-500">
                  {statusCounts.approved} live
                </span>
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-400 rounded-full" />
                <span className="text-xs text-slate-500">
                  {statusCounts.pending} pending
                </span>
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-rose-400 rounded-full" />
                <span className="text-xs text-slate-500">
                  {statusCounts.rejected} rejected
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}