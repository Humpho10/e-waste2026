import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import WorkspaceLayout from '../../layouts/WorkspaceLayout';
import { getPMProducts, approvePMProduct, rejectPMProduct } from '../../api/productManager';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext'; // 👈 Import useAuth

const statusConfig = {
  pending:  { label: 'Pending',  color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700',   dot: 'bg-green-400'  },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700',       dot: 'bg-red-400'    },
};

// ── Flexible image URL helper ──────────────────────────────
const getImageUrl = (image) => {
  if (!image) return null;
  if (typeof image === 'string') return image;
  const path = image.image_path || image.path || image.url || '';
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `http://localhost:8000/storage/${path}`;
};

// ── Product Detail Modal ───────────────────────────────────
function ProductDetailModal({ product, onClose, onApprove, onReject, canApprove, canReject }) {
  const [activeImg, setActiveImg] = useState(0);
  const images = product.images || [];

  useEffect(() => {
    if (product.images?.length > 0) {
      console.log('Images:', product.images);
      console.log('First image URL:', getImageUrl(product.images[0]));
    }
  }, [product]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">{product.title}</h3>
            <p className="text-gray-400 text-xs mt-0.5">
              Submitted by {product.seller?.name} · {new Date(product.created_at).toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Images */}
            <div>
              <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center relative group mb-2">
                {images.length > 0 ? (
                  <>
                    <img
                      src={getImageUrl(images[activeImg]) || ''}
                      alt="Product"
                      className="w-full h-full object-cover"
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => setActiveImg(p => (p - 1 + images.length) % images.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >‹</button>
                        <button
                          onClick={() => setActiveImg(p => (p + 1) % images.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >›</button>
                        <span className="absolute top-2 right-2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">
                          {activeImg + 1}/{images.length}
                        </span>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {images.map((_, i) => (
                            <button key={i} onClick={() => setActiveImg(i)}
                              className={`w-2 h-2 rounded-full transition ${activeImg === i ? 'bg-white' : 'bg-white/50'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <span className="text-5xl opacity-20">📦</span>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition shrink-0 ${activeImg === i ? 'border-teal-500' : 'border-gray-200 opacity-60'}`}>
                      <img src={getImageUrl(img) || ''} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-3">
              {[
                { label: 'Category',  value: product.category?.name                         },
                { label: 'Condition', value: product.condition                               },
                { label: 'Price',     value: `UGX ${Number(product.price).toLocaleString()}` },
                { label: 'Seller',    value: product.seller?.name                            },
                { label: 'Phone',     value: product.seller?.phone || 'Not provided'         },
                { label: 'Location',  value: product.seller?.location || 'Not provided'      },
                { label: 'Submitted', value: new Date(product.created_at).toLocaleString()   },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500 font-medium">{label}</span>
                  <span className="text-sm font-semibold text-gray-800">{value}</span>
                </div>
              ))}
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3">{product.description}</p>
              </div>
              {product.specification && (
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Specifications</p>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3">{product.specification}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
          {product.status === 'pending' && (
            <>
              {/* 👇 Approve button only if user has product-approve permission */}
              {canApprove && (
                <button
                  onClick={() => onApprove(product)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                >
                  ✓ Approve Listing
                </button>
              )}
              {/* 👇 Reject button only if user has product-reject permission */}
              {canReject && (
                <button
                  onClick={() => onReject(product)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold transition"
                >
                  ✕ Reject Listing
                </button>
              )}
              {!canApprove && !canReject && (
                <div className="flex-1 bg-gray-50 border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm font-medium text-center">
                  No actions available
                </div>
              )}
            </>
          )}
          {product.status === 'approved' && (
            <div className="flex-1 bg-green-50 border border-green-200 text-green-700 py-2.5 rounded-xl text-sm font-semibold text-center">
              ✓ This listing is approved and live
            </div>
          )}
          {product.status === 'rejected' && (
            <div className="flex-1 bg-red-50 border border-red-200 text-red-600 py-2.5 rounded-xl text-sm font-semibold text-center">
              ✕ This listing has been rejected
            </div>
          )}
          <button onClick={onClose} className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-6 py-2.5 rounded-xl text-sm transition">
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg">Reject Listing</h3>
              <p className="text-red-200 text-xs mt-0.5 truncate max-w-xs">{product.title}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">✕</button>
          </div>
        </div>
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reason for rejection</label>
              <textarea
                value={reason} required rows={4}
                onChange={e => setReason(e.target.value)}
                placeholder="Explain clearly why this listing is being rejected so the seller can correct it..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-gray-50 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{reason.length} characters (min 10)</p>
            </div>
            <div className="flex gap-3">
              <button
                type="submit" disabled={submitting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition"
              >
                {submitting ? 'Rejecting...' : 'Reject & Notify Seller'}
              </button>
              <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Main Products Page ─────────────────────────────────────
export default function WorkspaceProductsPage() {
  const [searchParams]              = useSearchParams();
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [status, setStatus]         = useState(searchParams.get('status') || 'all');
  const [search, setSearch]         = useState('');
  const [viewProduct, setViewProduct]   = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [approving, setApproving]       = useState(null);

  // 👇 Get permissions and toast
  const { permissions } = useAuth();
  const { toast } = useToast();

  // 👇 Permission checks
  const canApprove = permissions?.includes('product-approve') || false;
  const canReject = permissions?.includes('product-reject') || false;

  const fetchProducts = () => {
    setLoading(true);
    getPMProducts(status !== 'all' ? { status } : {})
      .then(res => setProducts(res.data.products || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, [status]);

  const handleApprove = async (product) => {
    if (!window.confirm(`Approve "${product.title}"?`)) return;
    setApproving(product.product_id);
    try {
      await approvePMProduct(product.product_id);
      setProducts(prev =>
        prev.map(p => p.product_id === product.product_id ? { ...p, status: 'approved' } : p)
      );
      toast(`"${product.title}" has been approved and is now live`, 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to approve', 'error');
    } finally {
      setApproving(null);
    }
  };

  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.seller?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <WorkspaceLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Listings</h2>
          <p className="text-gray-500 text-sm mt-1">
            Listings in your assigned categories — {products.length} found
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {['all', 'pending', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize
              ${status === s
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-300'
              }`}
          >
            {s === 'all' ? 'All Listings' : s}
          </button>
        ))}
        <div className="relative ml-auto">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text" placeholder="Search listings..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white w-52"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex gap-4 px-6 py-4 border-b border-gray-50 items-center">
              <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-48" />
                <div className="h-3 bg-gray-100 rounded w-32" />
              </div>
              <div className="h-5 w-20 bg-gray-100 rounded-full" />
              <div className="h-8 w-24 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="font-bold text-gray-700 mb-2">No listings found</h3>
          <p className="text-gray-400 text-sm">
            {status !== 'all'
              ? `No ${status} listings in your categories.`
              : 'No listings have been submitted in your categories yet.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Listing', 'Seller', 'Category', 'Price', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => {
                const cfg = statusConfig[product.status] || statusConfig.pending;
                return (
                  <tr key={product.product_id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                          {product.images?.[0] ? (
                            <img src={getImageUrl(product.images[0]) || ''} alt="" className="w-full h-full object-cover" />
                          ) : <span className="text-lg">📦</span>}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 max-w-[160px] truncate">{product.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(product.created_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 font-medium">{product.seller?.name}</p>
                      <p className="text-xs text-gray-400">{product.seller?.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {product.category?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      UGX {Number(product.price).toLocaleString()}
                    </td>
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
                          className="text-xs bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg font-medium transition"
                        >
                          👁 View
                        </button>
                        {/* 👇 Approve button – only if permission and pending */}
                        {product.status === 'pending' && canApprove && (
                          <button
                            onClick={() => handleApprove(product)}
                            disabled={approving === product.product_id}
                            className="text-xs bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-50"
                          >
                            {approving === product.product_id ? '...' : '✓'}
                          </button>
                        )}
                        {/* 👇 Reject button – only if permission and pending */}
                        {product.status === 'pending' && canReject && (
                          <button
                            onClick={() => setRejectTarget(product)}
                            className="text-xs bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg font-medium transition"
                          >
                            ✕
                          </button>
                        )}
                        {product.status === 'approved' && (
                          <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-lg">✓ Approved</span>
                        )}
                        {product.status === 'rejected' && (
                          <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded-lg">✕ Rejected</span>
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

      {viewProduct && (
        <ProductDetailModal
          product={viewProduct}
          onClose={() => setViewProduct(null)}
          onApprove={(p) => { setViewProduct(null); handleApprove(p); }}
          onReject={(p) => { setViewProduct(null); setRejectTarget(p); }}
          canApprove={canApprove} // 👈 Pass down
          canReject={canReject}   // 👈 Pass down
        />
      )}

      {rejectTarget && (
        <RejectModal
          product={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onRejected={(productId) => {
            setProducts(prev =>
              prev.map(p => p.product_id === productId ? { ...p, status: 'rejected' } : p)
            );
          }}
          toast={toast}
        />
      )}
    </WorkspaceLayout>
  );
}