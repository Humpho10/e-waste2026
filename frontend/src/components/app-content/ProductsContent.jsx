// src/components/app-content/ProductsContent.jsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getManagerProducts, approveProduct, rejectProduct } from '../../api/manager';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';

const statusConfig = {
  pending:  { label: 'Pending',  color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700',   dot: 'bg-green-400'  },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700',       dot: 'bg-red-400'    },
};

export default function ProductsContent() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [search, setSearch] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [approving, setApproving] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);

  const { permissions } = useAuth();
  const { toast } = useToast();

  const canApprove = permissions?.includes('product-approve') || false;
  const canReject = permissions?.includes('product-reject') || false;

  const fetchProducts = () => {
    setLoading(true);
    getManagerProducts(status !== 'all' ? { status } : {})
      .then(res => setProducts(res.data.products))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, [status]);

  const handleApprove = async (product) => {
    if (!window.confirm(`Approve "${product.title}"?`)) return;
    setApproving(product.product_id);
    try {
      await approveProduct(product.product_id);
      setProducts(prev =>
        prev.map(p =>
          p.product_id === product.product_id
            ? { ...p, status: 'approved' }
            : p
        )
      );
      toast(`"${product.title}" has been approved and is now live`, 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to approve';
      toast(msg, 'error');
    } finally {
      setApproving(null);
    }
  };

  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.seller?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Listings</h2>
          <p className="text-gray-500 text-sm mt-1">{products.length} listings found</p>
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
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'
              }`}
          >
            {s === 'all' ? 'All Listings' : s}
          </button>
        ))}
        <div className="relative ml-auto">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search listings..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white w-52"
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
              <div className="h-5 w-24 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="font-bold text-gray-700 mb-2">No listings found</h3>
          <p className="text-gray-400 text-sm">
            {status !== 'all' ? `No ${status} listings at the moment.` : 'No listings have been submitted yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Listing', 'Seller', 'Category', 'Price', 'Condition', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => {
                const cfg = statusConfig[product.status] || statusConfig.pending;
                return (
                  <tr key={product.product_id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 max-w-[180px] truncate">{product.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(product.created_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'short' })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 font-medium">{product.seller?.name}</p>
                      <p className="text-xs text-gray-400">{product.seller?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {product.category?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      UGX {Number(product.price).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{product.condition}</td>
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
                        {product.status === 'pending' && canApprove && (
                          <button
                            onClick={() => handleApprove(product)}
                            disabled={approving === product.product_id}
                            className="text-xs bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-50"
                          >
                            {approving === product.product_id
                              ? <span className="flex items-center gap-1"><span className="w-3 h-3 border border-green-400 border-t-green-600 rounded-full animate-spin" /> Approving...</span>
                              : '✓ Approve'
                            }
                          </button>
                        )}
                        {product.status === 'pending' && canReject && (
                          <button
                            onClick={() => setRejectTarget(product)}
                            className="text-xs bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg font-medium transition"
                          >
                            ✕ Reject
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
    </>
  );
}