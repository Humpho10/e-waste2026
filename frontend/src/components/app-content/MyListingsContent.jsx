// src/components/app-content/MyListingsContent.jsx
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { myListings, deleteProduct } from '../../api/products';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';
import { storageUrl } from '../../lib/urls';

const statusConfig = {
  pending:     { label: 'Pending Review', color: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-400' },
  approved:    { label: 'Approved — Live', color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',  dot: 'bg-green-400'  },
  rejected:    { label: 'Rejected',        color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',      dot: 'bg-red-400'    },
  resubmitted: { label: 'Resubmitted',     color: 'bg-blue-100 text-blue-700 dark:text-blue-400 dark:bg-blue-900/40',    dot: 'bg-blue-400'   },
};

export default function MyListingsContent() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [deleting, setDeleting] = useState(null);

  const { permissions } = useAuth();
  const { toast } = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const canEdit = permissions?.includes('product-edit') || false;
  const canDelete = permissions?.includes('product-delete') || false;
  const canResubmit = permissions?.includes('product-create') || false;
  const canCreate = permissions?.includes('product-create') || false;

  // Shared with dashboard/MyListingsPage.jsx and dashboard/ResubmitListingPage.jsx.
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

  const handleDelete = async (id, title) => {
    const ok = await confirm(`Delete "${title}"? This cannot be undone.`, {
      title: 'Delete listing?',
      tone: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    setDeleting(id);
    try {
      await deleteMutation.mutateAsync(id);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Listings</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{listings.length} listing{listings.length !== 1 ? 's' : ''}</p>
        </div>
        {canCreate && (
          <Link
            to="/dashboard/create"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            <span>+</span> Post New Listing
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'pending', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize
              ${status === s
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-blue-300'
              }`}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 flex gap-4 items-center">
              <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-slate-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-56" />
                <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-32" />
              </div>
              <div className="h-6 w-20 bg-gray-100 dark:bg-slate-800 rounded-full" />
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 p-16 text-center">
          <i className="bi bi-inbox text-5xl text-gray-300 dark:text-slate-600 mb-4 block" />
          <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2">No listings yet</h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">Post your first e-waste component to start selling</p>
          {canCreate && (
            <Link
              to="/dashboard/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition"
            >
<i className="bi bi-plus-lg" /> Post First Listing
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map(listing => {
            const cfg = statusConfig[listing.status] || statusConfig.pending;
            return (
              <div key={listing.product_id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all p-5 flex gap-4 items-start">
                <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                  {listing.images?.[0] ? (
                    <img
                      src={storageUrl(listing.images[0].image_path)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : <i className="bi bi-box-seam text-blue-400 dark:text-blue-500" />}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate">{listing.title}</h3>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                    <span>UGX {Number(listing.price).toLocaleString()}</span>
                    <span>·</span>
                    <span>{listing.condition}</span>
                    <span>·</span>
                    <span>{listing.category?.name}</span>
                    <span>·</span>
                    <span>{new Date(listing.created_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  {listing.status === 'rejected' && listing.rejection_reason && (
                    <div className="mt-2 bg-red-50 dark:bg-red-950/40 border border-red-100 rounded-lg px-3 py-2">
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium">Rejection reason:</p>
                      <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{listing.rejection_reason}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                  <div className="flex gap-2">
                    {canEdit && ['pending', 'rejected'].includes(listing.status) && (
                      <Link
                        to={`/dashboard/edit/${listing.product_id}`}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Edit
                      </Link>
                    )}
                    {canResubmit && listing.status === 'rejected' && (
                      <Link
                        to={`/dashboard/resubmit/${listing.product_id}`}
                        className="text-xs bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded-lg font-medium transition"
                      >
                        Resubmit
                      </Link>
                    )}
                    {canDelete && listing.status !== 'approved' && (
                      <button
                        onClick={() => handleDelete(listing.product_id, listing.title)}
                        disabled={deleting === listing.product_id}
                        className="text-xs text-red-500 dark:text-red-400 hover:underline disabled:opacity-50"
                      >
                        {deleting === listing.product_id ? '...' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
