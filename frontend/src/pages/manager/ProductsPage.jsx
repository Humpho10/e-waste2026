import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BiBox, BiSearch, BiEye, BiCheck, BiX, BiChevronLeft, BiChevronRight,
  BiInbox, BiImage, BiCheckCircle, BiXCircle,
} from '../../components/bi';
import ManagerLayout from '../../layouts/ManagerLayout';
import { getManagerProducts, approveProduct, rejectProduct, getManagerStats } from '../../api/manager';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';

const statusConfig = {
  pending:  { label: 'Pending',  color: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-400' },
  approved: { label: 'Approved', color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',   dot: 'bg-green-400'  },
  rejected: { label: 'Rejected', color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',       dot: 'bg-red-400'    },
};

function ImageThumb({ src, alt, className }) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-300 dark:text-gray-600 ${className}`}>
        <BiImage size={16} />
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} onError={() => setErrored(true)} />;
}

// ---------- Approve Confirm Modal ----------
function ApproveModal({ product, onClose, onApproved }) {
  const { toast } = useToast();

  const approveMutation = useMutation({
    mutationFn: () => approveProduct(product.product_id),
    onSuccess: () => {
      toast(`"${product.title}" has been approved and is now live`, 'success');
      onApproved(product.product_id);
      onClose();
    },
    onError: (err) => {
      toast(err.response?.data?.message || 'Failed to approve', 'error');
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden dark:bg-slate-900">
        <div className="p-6">
          <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-4 dark:bg-green-950/40 dark:text-green-400">
            <BiCheckCircle size={20} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1 dark:text-gray-100">Approve "{product.title}"?</h3>
          <p className="text-sm text-gray-500 mb-6 dark:text-gray-400">It will immediately go live on the marketplace and the seller will be notified.</p>
          <div className="flex gap-3">
            <button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition"
            >
              {approveMutation.isPending ? 'Approving...' : 'Yes, approve'}
            </button>
            <button
              onClick={onClose}
              disabled={approveMutation.isPending}
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

// ---------- Reject Modal ----------
function RejectModal({ product, onClose, onRejected, toast }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (reason.length < 10) {
      setError('Please provide a more detailed reason (min 10 characters).');
      return;
    }
    setSubmitting(true);
    try {
      await rejectProduct(product.product_id, { rejection_reason: reason });
      onRejected(product.product_id);
      onClose();
      toast(`"${product.title}" has been rejected and seller notified`, 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reject';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg flex items-center gap-2"><BiXCircle size={18} /> Reject Listing</h3>
              <p className="text-red-200 text-xs mt-0.5 truncate max-w-xs">{product.title}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition">
              <BiX size={16} />
            </button>
          </div>
        </div>
        <div className="p-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                Reason for rejection
              </label>
              <textarea
                value={reason}
                required
                onChange={e => setReason(e.target.value)}
                rows={4}
                placeholder="Explain clearly why this listing is being rejected so the seller can correct it..."
                className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-gray-50 dark:bg-slate-800/60 resize-none"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{reason.length} characters (min 10)</p>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition"
              >
                {submitting ? 'Rejecting...' : 'Reject & Notify Seller'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl text-sm transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ---------- Product Detail Modal ----------
function ProductDetailModal({ product, onClose, onApprove, onReject, canApprove, canReject }) {
  const [activeImg, setActiveImg] = useState(0);
  const images = product.images || [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">{product.title}</h3>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">
              Submitted by {product.seller?.name} · {new Date(product.created_at).toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition dark:bg-slate-800 dark:text-gray-400">
            <BiX size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Images */}
            <div>
              <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 flex items-center justify-center relative group mb-2">
                {images.length > 0 ? (
                  <ImageThumb src={images[activeImg]?.image_url} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <BiImage size={48} className="text-gray-200" />
                )}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImg(p => (p - 1 + images.length) % images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    ><BiChevronLeft size={16} /></button>
                    <button
                      onClick={() => setActiveImg(p => (p + 1) % images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    ><BiChevronRight size={16} /></button>
                    <span className="absolute top-2 right-2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">
                      {activeImg + 1}/{images.length}
                    </span>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition ${activeImg === i ? 'border-blue-500' : 'border-gray-200 dark:border-slate-700 opacity-60'}`}
                    >
                      <ImageThumb src={img.image_url} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-4">
              {[
                { label: 'Category',    value: product.category?.name },
                { label: 'Condition',   value: product.condition },
                { label: 'Price',       value: `UGX ${Number(product.price).toLocaleString()}` },
                { label: 'Seller',      value: product.seller?.name },
                { label: 'Phone',       value: product.seller?.phone || 'Not provided' },
                { label: 'Location',    value: product.seller?.location || 'Not provided' },
                { label: 'Submitted',   value: new Date(product.created_at).toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{value}</span>
                </div>
              ))}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Description</p>
                <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed bg-gray-50 dark:bg-slate-800/60 rounded-xl p-3">{product.description}</p>
              </div>
              {product.specification && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Specifications</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed bg-gray-50 dark:bg-slate-800/60 rounded-xl p-3">{product.specification}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0 dark:border-slate-800">
          {product.status === 'pending' && (
            <>
              {canApprove && (
                <button
                  onClick={() => onApprove(product)}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                >
                  <BiCheck size={16} /> Approve Listing
                </button>
              )}
              {canReject && (
                <button
                  onClick={() => onReject(product)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                >
                  <BiX size={16} /> Reject Listing
                </button>
              )}
              {!canApprove && !canReject && (
                <div className="flex-1 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 py-2.5 rounded-xl text-sm font-medium text-center">
                  No actions available
                </div>
              )}
            </>
          )}
          {product.status === 'approved' && (
            <div className="flex-1 flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 py-2.5 rounded-xl text-sm font-semibold text-center dark:bg-green-950/40 dark:border-green-800/50 dark:text-green-400">
              <BiCheckCircle size={16} /> This listing is approved and live
            </div>
          )}
          {product.status === 'rejected' && (
            <div className="flex-1 flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 py-2.5 rounded-xl text-sm font-semibold text-center dark:bg-red-950/40 dark:border-red-800/50 dark:text-red-400">
              <BiXCircle size={16} /> This listing has been rejected
            </div>
          )}
          <button
            onClick={onClose}
            className="border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 px-6 py-2.5 rounded-xl text-sm transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Main Page ----------
export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [search, setSearch] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);

  const { permissions } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canApprove = permissions?.includes('product-approve') || false;
  const canReject = permissions?.includes('product-reject') || false;

  const { data: products = [], isLoading: loading } = useQuery({
    queryKey: ['manager-products', status],
    queryFn: () => getManagerProducts(status !== 'all' ? { status } : {}).then(res => res.data.products),
  });

  // Shared with the Overview page — reuses the cache if already fetched.
  const { data: stats } = useQuery({
    queryKey: ['manager-stats'],
    queryFn: () => getManagerStats().then(res => res.data.stats),
  });

  const setProductStatus = (productId, newStatus) => {
    queryClient.setQueryData(['manager-products', status], (old = []) =>
      old.map(p => p.product_id === productId ? { ...p, status: newStatus } : p)
    );
    queryClient.invalidateQueries({ queryKey: ['manager-stats'] });
  };

  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.seller?.name.toLowerCase().includes(search.toLowerCase())
  );

  const filters = [
    { key: 'all',      label: 'All Listings', count: stats?.total_products },
    { key: 'pending',  label: 'Pending',      count: stats?.pending_products },
    { key: 'approved', label: 'Approved',     count: stats?.approved_products },
    { key: 'rejected', label: 'Rejected',     count: stats?.rejected_products },
  ];

  return (
    <ManagerLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 dark:text-gray-100">
            <BiBox className="text-orange-500 dark:text-orange-400" size={22} /> Listings
          </h2>
          <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">{products.length} listings found</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition
              ${status === f.key
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-orange-300'
              }`}
          >
            {f.label}
            {typeof f.count === 'number' && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${status === f.key ? 'bg-white/20' : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400'}`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
        <div className="relative ml-auto">
          <BiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search listings..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-slate-900 w-52"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-pulse">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex gap-4 px-6 py-4 border-b border-gray-50 items-center">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-48" />
                <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-32" />
              </div>
              <div className="h-5 w-20 bg-gray-100 dark:bg-slate-800 rounded-full" />
              <div className="h-5 w-24 bg-gray-100 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center dark:bg-slate-900 dark:border-slate-700">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4 dark:bg-orange-950/40">
            <BiInbox size={28} className="text-orange-400" />
          </div>
          <h3 className="font-bold text-gray-700 mb-2 dark:text-gray-200">No listings found</h3>
          <p className="text-gray-400 text-sm dark:text-gray-500">
            {status !== 'all' ? `No ${status} listings at the moment.` : 'No listings have been submitted yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-800">
              <tr>
                {['Image', 'Listing', 'Seller', 'Category', 'Price', 'Condition', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => {
                const cfg = statusConfig[product.status] || statusConfig.pending;
                const firstImage = product.images?.[0];
                return (
                  <tr key={product.product_id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <ImageThumb
                        src={firstImage?.image_url}
                        alt={product.title}
                        className="w-10 h-10 rounded-xl overflow-hidden shrink-0 object-cover"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 dark:text-gray-100 max-w-[180px] truncate">{product.title}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {new Date(product.created_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'short' })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 dark:text-gray-200 font-medium">{product.seller?.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{product.seller?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                        {product.category?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">
                      UGX {Number(product.price).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{product.condition}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => setViewProduct(product)}
                          title="View details"
                          className="w-8 h-8 flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 rounded-lg transition dark:bg-slate-800/60 dark:border-slate-700 dark:text-gray-400"
                        >
                          <BiEye size={14} />
                        </button>

                        {product.status === 'pending' && canApprove && (
                          <button
                            onClick={() => setApproveTarget(product)}
                            title="Approve"
                            className="w-8 h-8 flex items-center justify-center bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 rounded-lg transition dark:bg-green-950/40 dark:text-green-400 dark:border-green-800/50"
                          >
                            <BiCheck size={14} />
                          </button>
                        )}

                        {product.status === 'pending' && canReject && (
                          <button
                            onClick={() => setRejectTarget(product)}
                            title="Reject"
                            className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 rounded-lg transition dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/50"
                          >
                            <BiX size={14} />
                          </button>
                        )}

                        {product.status === 'approved' && (
                          <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-lg flex items-center gap-1 dark:text-green-400 dark:bg-green-950/40">
                            <BiCheckCircle size={12} /> Approved
                          </span>
                        )}
                        {product.status === 'rejected' && (
                          <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded-lg flex items-center gap-1 dark:text-red-400 dark:bg-red-950/40">
                            <BiXCircle size={12} /> Rejected
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {approveTarget && (
        <ApproveModal
          product={approveTarget}
          onClose={() => setApproveTarget(null)}
          onApproved={(productId) => setProductStatus(productId, 'approved')}
        />
      )}

      {rejectTarget && (
        <RejectModal
          product={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onRejected={(productId) => setProductStatus(productId, 'rejected')}
          toast={toast}
        />
      )}

      {viewProduct && (
        <ProductDetailModal
          product={viewProduct}
          onClose={() => setViewProduct(null)}
          onApprove={(p) => { setViewProduct(null); setApproveTarget(p); }}
          onReject={(p) => { setViewProduct(null); setRejectTarget(p); }}
          canApprove={canApprove}
          canReject={canReject}
        />
      )}
    </ManagerLayout>
  );
}
