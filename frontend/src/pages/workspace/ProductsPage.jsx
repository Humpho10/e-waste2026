import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import WorkspaceLayout from '../../layouts/WorkspaceLayout';
import { getPMProducts, approvePMProduct, rejectPMProduct } from '../../api/productManager';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { storageUrl } from '../../lib/urls';

// Debounce a fast-changing value (e.g. search input) so we don't fire a
// server request on every keystroke.
function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const statusConfig = {
  pending:  { label: 'Pending',  color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400', dot: 'bg-yellow-400', icon: 'bi-hourglass-split' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',   dot: 'bg-green-400',  icon: 'bi-check-circle'    },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',       dot: 'bg-red-400',    icon: 'bi-x-circle'        },
};

const ugx = (n) => `UGX ${Number(n || 0).toLocaleString()}`;

// ── Flexible image URL helper ──────────────────────────────
const getImageUrl = (image) => {
  if (!image) return null;
  if (typeof image === 'string') return storageUrl(image);
  return storageUrl(image.image_path || image.path || image.url || '');
};

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || statusConfig.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
      <i className={`bi ${cfg.icon}`} />
      {cfg.label}
    </span>
  );
}

// ── Product Detail Modal ───────────────────────────────────
function ProductDetailModal({ product, onClose, onApprove, onReject, canApprove, canReject }) {
  const [activeImg, setActiveImg] = useState(0);
  const images = product.images || [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden dark:bg-slate-900">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 dark:border-slate-800">
          <div className="min-w-0">
            <h3 className="font-bold text-gray-800 text-lg truncate dark:text-gray-100">{product.title}</h3>
            <p className="text-gray-400 text-xs mt-0.5 dark:text-gray-500">
              Submitted by {product.seller?.name} · {new Date(product.created_at).toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition shrink-0 dark:bg-slate-800 dark:text-gray-400">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Images */}
            <div>
              <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 flex items-center justify-center relative group mb-2">
                {images.length > 0 ? (
                  <>
                    <img src={getImageUrl(images[activeImg]) || ''} alt="Product" className="w-full h-full object-cover" />
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => setActiveImg(p => (p - 1 + images.length) % images.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        ><i className="bi bi-chevron-left" /></button>
                        <button
                          onClick={() => setActiveImg(p => (p + 1) % images.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        ><i className="bi bi-chevron-right" /></button>
                        <span className="absolute top-2 right-2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">
                          {activeImg + 1}/{images.length}
                        </span>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {images.map((_, i) => (
                            <button key={i} onClick={() => setActiveImg(i)}
                              className={`w-2 h-2 rounded-full transition ${activeImg === i ? 'bg-white dark:bg-slate-900' : 'bg-white/50'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <i className="bi bi-box-seam text-5xl text-gray-300" />
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition shrink-0 ${activeImg === i ? 'border-teal-500' : 'border-gray-200 dark:border-slate-700 opacity-60'}`}>
                      <img src={getImageUrl(img) || ''} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-3">
              {[
                { label: 'Category',  value: product.category?.name                    },
                { label: 'Condition', value: product.condition                          },
                { label: 'Price',     value: ugx(product.price)                         },
                { label: 'Seller',    value: product.seller?.name                       },
                { label: 'Phone',     value: product.seller?.phone || 'Not provided'    },
                { label: 'Location',  value: product.seller?.location || 'Not provided' },
                { label: 'Submitted', value: new Date(product.created_at).toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b border-gray-50 gap-4">
                  <span className="text-sm text-gray-500 font-medium shrink-0 dark:text-gray-400">{label}</span>
                  <span className="text-sm font-semibold text-gray-800 text-right dark:text-gray-100">{value}</span>
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
              {product.status === 'rejected' && product.rejection_reason && (
                <div>
                  <p className="text-sm text-red-500 font-medium mb-1 dark:text-red-400">Rejection reason</p>
                  <p className="text-sm text-red-700 leading-relaxed bg-red-50 border border-red-100 rounded-xl p-3 dark:text-red-400 dark:bg-red-950/40">{product.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
          {product.status === 'pending' && (
            <>
              {canApprove && (
                <button onClick={() => onApprove(product)}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold transition">
                  <i className="bi bi-check-circle" /> Approve listing
                </button>
              )}
              {canReject && (
                <button onClick={() => onReject(product)}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold transition">
                  <i className="bi bi-x-circle" /> Reject listing
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
            <div className="flex-1 inline-flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 py-2.5 rounded-xl text-sm font-semibold text-center dark:bg-green-950/40 dark:border-green-800/50 dark:text-green-400">
              <i className="bi bi-check-circle-fill" /> This listing is approved and live
            </div>
          )}
          {product.status === 'rejected' && (
            <div className="flex-1 inline-flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 py-2.5 rounded-xl text-sm font-semibold text-center dark:bg-red-950/40 dark:border-red-800/50 dark:text-red-400">
              <i className="bi bi-x-circle-fill" /> This listing has been rejected
            </div>
          )}
          <button onClick={onClose} className="border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 px-6 py-2.5 rounded-xl text-sm transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reject Modal ───────────────────────────────────────────
function RejectModal({ product, onClose, onRejected, toast }) {
  const [reason, setReason]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (reason.length < 10) { setError('Please provide a more detailed reason (min 10 characters).'); return; }
    setSubmitting(true);
    try {
      await rejectPMProduct(product.product_id, { rejection_reason: reason });
      onRejected(product.product_id);
      onClose();
      toast(`"${product.title}" has been rejected and seller notified`, 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reject.';
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
            <div className="min-w-0">
              <h3 className="text-white font-bold text-lg flex items-center gap-2"><i className="bi bi-x-octagon" /> Reject listing</h3>
              <p className="text-red-100 text-xs mt-0.5 truncate max-w-xs">{product.title}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white shrink-0">
              <i className="bi bi-x-lg" />
            </button>
          </div>
        </div>
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2 dark:bg-red-950/40 dark:border-red-800/50 dark:text-red-400">
              <i className="bi bi-exclamation-triangle" /> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Reason for rejection</label>
              <textarea
                value={reason} required rows={4}
                onChange={e => setReason(e.target.value)}
                placeholder="Explain clearly why this listing is being rejected so the seller can correct it..."
                className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-gray-50 dark:bg-slate-800/60 resize-none"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{reason.length} characters (min 10)</p>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition">
                {submitting ? <><i className="bi bi-arrow-repeat animate-spin" /> Rejecting...</> : <><i className="bi bi-send" /> Reject &amp; notify seller</>}
              </button>
              <button type="button" onClick={onClose} className="flex-1 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl text-sm transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Row action buttons (shared by table + grid) ────────────
function RowActions({ product, canApprove, canReject, approving, onView, onApprove, onReject }) {
  return (
    <div className="flex gap-2 items-center">
      <button onClick={() => onView(product)}
        className="inline-flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg font-medium transition dark:bg-slate-800/60 dark:border-slate-700 dark:text-gray-300">
        <i className="bi bi-eye" /> View
      </button>
      {product.status === 'pending' && canApprove && (
        <button onClick={() => onApprove(product)} disabled={approving === product.product_id} title="Approve"
          className="inline-flex items-center justify-center text-xs bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 w-8 h-8 rounded-lg font-medium transition disabled:opacity-50 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800/50">
          <i className={`bi ${approving === product.product_id ? 'bi-arrow-repeat animate-spin' : 'bi-check-lg'}`} />
        </button>
      )}
      {product.status === 'pending' && canReject && (
        <button onClick={() => onReject(product)} title="Reject"
          className="inline-flex items-center justify-center text-xs bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 w-8 h-8 rounded-lg font-medium transition dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/50">
          <i className="bi bi-x-lg" />
        </button>
      )}
    </div>
  );
}

// ── Main Products Page ─────────────────────────────────────
const PER_PAGE_OPTIONS = [10, 25, 50];

export default function WorkspaceProductsPage() {
  const [searchParams]                  = useSearchParams();
  const [status, setStatus]             = useState(searchParams.get('status') || 'all');
  const [searchInput, setSearchInput]   = useState('');
  const search                          = useDebouncedValue(searchInput);
  const [page, setPage]                 = useState(1);
  const [perPage, setPerPage]           = useState(10);
  // Phones get the card grid by default — a 6-column table behind a
  // horizontal scroll is a poor primary view on a small screen. The
  // toggle still lets the user switch either way.
  const [view, setView]                 = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'grid' : 'table'
  );
  const [viewProduct, setViewProduct]   = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [approving, setApproving]       = useState(null);

  const { permissions } = useAuth();
  const { toast } = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const canApprove = permissions?.includes('product-approve') || false;
  const canReject  = permissions?.includes('product-reject')  || false;

  // Reset to page 1 whenever the filters that reshape the result set change.
  useEffect(() => { setPage(1); }, [status, search, perPage]);

  const queryParams = useMemo(() => ({
    status: status !== 'all' ? status : undefined,
    search: search || undefined,
    page,
    per_page: perPage,
  }), [status, search, page, perPage]);

  const { data, isLoading: loading, isFetching } = useQuery({
    queryKey: ['pm-products', queryParams],
    queryFn: () => getPMProducts(queryParams).then(res => res.data),
    placeholderData: keepPreviousData,
  });

  const products = data?.products ?? [];
  const meta     = data?.meta ?? { current_page: 1, last_page: 1, per_page: perPage, total: 0 };
  const counts   = data?.counts ?? { all: 0, pending: 0, approved: 0, rejected: 0 };

  const refreshProducts = () => queryClient.invalidateQueries({ queryKey: ['pm-products'] });

  const approveMutation = useMutation({
    mutationFn: (productId) => approvePMProduct(productId),
    onSuccess: refreshProducts,
  });

  const handleApprove = async (product) => {
    const ok = await confirm(`This will publish "${product.title}" on the marketplace.`, {
      title: 'Approve listing?',
      tone: 'success',
      confirmLabel: 'Approve',
    });
    if (!ok) return;
    setApproving(product.product_id);
    try {
      await approveMutation.mutateAsync(product.product_id);
      toast(`"${product.title}" has been approved and is now live`, 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to approve', 'error');
    } finally {
      setApproving(null);
    }
  };

  const tabs = [
    { key: 'all',      label: 'All',      icon: 'bi-grid-3x3-gap' },
    { key: 'pending',  label: 'Pending',  icon: 'bi-hourglass-split' },
    { key: 'approved', label: 'Approved', icon: 'bi-check-circle' },
    { key: 'rejected', label: 'Rejected', icon: 'bi-x-circle' },
  ];

  const actionProps = {
    canApprove, canReject, approving,
    onView: setViewProduct,
    onApprove: handleApprove,
    onReject: setRejectTarget,
  };

  return (
    <WorkspaceLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Listings</h2>
          <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">
            {counts.all} listing{counts.all === 1 ? '' : 's'} in your assigned categories
            {isFetching && !loading && <i className="bi bi-arrow-repeat animate-spin ml-2 text-gray-300 dark:text-gray-600" />}
            {counts.pending > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-medium dark:text-amber-400">
                <i className="bi bi-hourglass-split" /> {counts.pending} awaiting review
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-6 flex flex-col lg:flex-row lg:items-center gap-3 dark:bg-slate-900 dark:border-slate-800">
        {/* Segmented status tabs with counts */}
        <div className="flex flex-wrap gap-1 bg-gray-50 p-1 rounded-xl dark:bg-slate-800/60">
          {tabs.map(t => {
            const active = status === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setStatus(t.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition
                  ${active ? 'bg-white text-teal-700 shadow-sm dark:bg-slate-900 dark:text-teal-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'}`}
              >
                <i className={`bi ${t.icon}`} />
                {t.label}
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${active ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400' : 'bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-gray-400'}`}>
                  {counts[t.key]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 lg:ml-auto">
          {/* Search */}
          <div className="relative flex-1 lg:flex-none">
            <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm dark:text-gray-500" />
            <input
              type="text" placeholder="Search title, seller or category..."
              value={searchInput} onChange={e => setSearchInput(e.target.value)}
              className="w-full lg:w-72 pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:border-slate-700 dark:bg-slate-900"
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} title="Clear"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 dark:bg-slate-800 dark:text-gray-400">
                <i className="bi bi-x-lg text-[10px]" />
              </button>
            )}
          </div>

          {/* View toggle */}
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 shrink-0 dark:bg-slate-800/60 dark:border-slate-800">
            {[
              { key: 'table', icon: 'bi-list-ul', label: 'Table view' },
              { key: 'grid',  icon: 'bi-grid-3x3-gap-fill', label: 'Grid view' },
            ].map(v => (
              <button key={v.key} onClick={() => setView(v.key)} title={v.label}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition
                  ${view === v.key ? 'bg-white text-teal-700 shadow-sm dark:bg-slate-900 dark:text-teal-400' : 'text-gray-400 hover:text-gray-700 dark:text-gray-500'}`}>
                <i className={`bi ${v.icon}`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse dark:bg-slate-900 dark:border-slate-800">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="flex gap-4 px-6 py-4 border-b border-gray-50 items-center">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-48" />
                <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-32" />
              </div>
              <div className="h-5 w-20 bg-gray-100 dark:bg-slate-800 rounded-full" />
              <div className="h-8 w-24 bg-gray-100 dark:bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center dark:bg-slate-900 dark:border-slate-700">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-300 text-3xl flex items-center justify-center mx-auto mb-4 dark:bg-slate-800/60">
            <i className={`bi ${search ? 'bi-search' : 'bi-inbox'}`} />
          </div>
          <h3 className="font-bold text-gray-700 mb-2 dark:text-gray-200">No listings found</h3>
          <p className="text-gray-400 text-sm dark:text-gray-500">
            {search
              ? <>Nothing matches “{search}”. <button onClick={() => setSearchInput('')} className="text-teal-600 underline dark:text-teal-400">Clear search</button></>
              : status !== 'all'
                ? `No ${status} listings in your categories.`
                : 'No listings have been submitted in your categories yet.'}
          </p>
        </div>
      ) : (
        <>
        {view === 'grid' ? (
        /* ── Grid view ───────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map(product => (
            <div key={product.product_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition flex flex-col dark:bg-slate-900 dark:border-slate-800">
              <div className="relative aspect-video bg-gray-50 flex items-center justify-center overflow-hidden dark:bg-slate-800/60">
                {product.images?.[0]
                  ? <img src={getImageUrl(product.images[0]) || ''} alt="" className="w-full h-full object-cover" />
                  : <i className="bi bi-box-seam text-4xl text-gray-300" />}
                <div className="absolute top-2 left-2"><StatusBadge status={product.status} /></div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-800 truncate dark:text-gray-100">{product.title}</h3>
                </div>
                <div className="flex items-center gap-2 mt-1 mb-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full dark:bg-slate-800 dark:text-gray-300">{product.category?.name}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">· {product.condition}</span>
                </div>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{ugx(product.price)}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 dark:text-gray-500">
                  <i className="bi bi-person" /> {product.seller?.name}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-50">
                  <RowActions product={product} {...actionProps} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Table view ──────────────────────────────────── */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-800">
              <tr>
                {['Listing', 'Seller', 'Category', 'Price', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.product_id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center text-gray-300 dark:bg-slate-800">
                        {product.images?.[0]
                          ? <img src={getImageUrl(product.images[0]) || ''} alt="" className="w-full h-full object-cover" />
                          : <i className="bi bi-box-seam" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 max-w-[180px] truncate dark:text-gray-100">{product.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 dark:text-gray-500">
                          {new Date(product.created_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700 font-medium dark:text-gray-200">{product.seller?.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{product.seller?.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full dark:bg-slate-800 dark:text-gray-300">{product.category?.name}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">{ugx(product.price)}</td>
                  <td className="px-4 py-3"><StatusBadge status={product.status} /></td>
                  <td className="px-4 py-3"><RowActions product={product} {...actionProps} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
        )}

        {/* ── Pagination ────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 px-1">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>
              Showing {meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1}–{Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total.toLocaleString()}
            </span>
            <select
              value={perPage}
              onChange={e => setPerPage(Number(e.target.value))}
              className="ml-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {PER_PAGE_OPTIONS.map(n => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={meta.current_page <= 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <i className="bi bi-chevron-left" />
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400 px-2">
              Page {meta.current_page} of {meta.last_page}
            </span>
            <button
              onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
              disabled={meta.current_page >= meta.last_page}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>
        </>
      )}

      {viewProduct && (
        <ProductDetailModal
          product={viewProduct}
          onClose={() => setViewProduct(null)}
          onApprove={(p) => { setViewProduct(null); handleApprove(p); }}
          onReject={(p) => { setViewProduct(null); setRejectTarget(p); }}
          canApprove={canApprove}
          canReject={canReject}
        />
      )}

      {rejectTarget && (
        <RejectModal
          product={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onRejected={refreshProducts}
          toast={toast}
        />
      )}
    </WorkspaceLayout>
  );
}
