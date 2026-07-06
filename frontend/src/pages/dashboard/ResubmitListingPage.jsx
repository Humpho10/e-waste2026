import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../layouts/DashboardLayout';
import { myListings, resubmitProduct } from '../../api/products';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext'; // 👈 Import useAuth

export default function ResubmitListingPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { toast }  = useToast();
  const { permissions } = useAuth(); // 👈 Get permissions
  const queryClient = useQueryClient();

  // 👈 Check if user has permission to create/resubmit
  const canResubmit = permissions?.includes('product-create') || false;

  const [formSeeded, setFormSeeded] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', condition: '', price: '', specification: '',
  });

  const [existingImages, setExistingImages] = useState([]);
  const [removedImageIds, setRemovedImageIds] = useState([]);
  const [newImages, setNewImages]   = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);

  // Shares a cache entry with MyListingsPage's status="all" view.
  const { data: listings, isLoading: loading } = useQuery({
    queryKey: ['my-listings', 'all'],
    queryFn: () => myListings().then(res => res.data.products || []),
    enabled: canResubmit,
  });

  const product = listings?.find(p => p.product_id == id);

  // Seed the editable form once the listing is found — render-time pattern
  // (not a useEffect) for the same reason as ProfileForm.jsx: TanStack
  // Query v5 has no onSuccess on useQuery, and setState-in-effect trips the
  // project's react-hooks/set-state-in-effect lint rule.
  if (product && !formSeeded) {
    setForm({
      title:         product.title         || '',
      description:   product.description   || '',
      condition:     product.condition      || '',
      price:         product.price          || '',
      specification: product.specification  || '',
    });
    setExistingImages(product.images || []);
    setFormSeeded(true);
  }

  // Redirect / toast side effects only — no local setState here, so this
  // stays safe inside a useEffect.
  useEffect(() => {
    if (!canResubmit) {
      toast('You do not have permission to resubmit listings.', 'error');
      navigate('/dashboard/listings');
      return;
    }
    if (loading) return;
    if (!product) {
      toast('Listing not found', 'error');
      navigate('/dashboard/listings');
      return;
    }
    if (product.status !== 'rejected') {
      toast('Only rejected listings can be resubmitted', 'warning');
      navigate('/dashboard/listings');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, canResubmit, loading, product]);

  const remainingSlots = 5 - (existingImages.length - removedImageIds.length) - newImages.length;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, remainingSlots);
    const updated = [...newImages, ...files].slice(0, remainingSlots + newImages.length);
    setNewImages(updated);
    setNewPreviews(updated.map(f => URL.createObjectURL(f)));
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const toggleRemoveExisting = (imgId) => {
    setRemovedImageIds(prev =>
      prev.includes(imgId) ? prev.filter(id => id !== imgId) : [...prev, imgId]
    );
  };

  const resubmitMutation = useMutation({
    mutationFn: (data) => resubmitProduct(id, data),
    onSuccess: () => {
      toast('Listing resubmitted successfully — no additional fee required', 'success');
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      navigate('/dashboard/listings');
    },
    onError: (err) => {
      const errors = err.response?.data?.errors;
      toast(errors ? Object.values(errors).flat().join(' · ') : err.response?.data?.message || 'Failed to resubmit', 'error');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canResubmit) {
      toast('You do not have permission to resubmit.', 'error');
      return;
    }
    const data = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      if (val !== '' && val !== null) data.append(key, val);
    });
    newImages.forEach((img, i) => data.append(`images[${i}]`, img));
    removedImageIds.forEach((id, i) => data.append(`remove_images[${i}]`, id));

    resubmitMutation.mutate(data);
  };

  const submitting = resubmitMutation.isPending;
  if (loading) return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 dark:bg-slate-800 rounded w-48" />
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-8 space-y-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-24" />
              <div className="h-10 bg-gray-100 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );

  // 👈 If no permission after loading, show access denied
  if (!canResubmit) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Access Denied</h2>
          <p className="text-gray-500 dark:text-gray-400">You don't have permission to resubmit listings.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!product) return null;

  const visibleExisting = existingImages.filter(img => !removedImageIds.includes(img.productImage_id));

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard/listings')}
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 text-sm mb-4 transition"
          >
            ← Back to listings
          </button>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Resubmit Listing</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Correct the issues and resubmit for approval. No additional fee required.
          </p>
        </div>

        {/* Rejection reason */}
        {product.rejection_reason && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 rounded-2xl p-5 mb-6 flex gap-3">
            <span className="text-2xl shrink-0">❌</span>
            <div>
              <p className="font-semibold text-red-700 dark:text-red-400 text-sm mb-1">Reason for rejection</p>
              <p className="text-red-600 dark:text-red-400 text-sm leading-relaxed">{product.rejection_reason}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Details */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 space-y-5">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide">Listing Details</h3>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text" required value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-slate-800/60"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                required rows={4} value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-slate-800/60 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                  Condition <span className="text-red-400">*</span>
                </label>
                <select
                  required value={form.condition}
                  onChange={e => setForm({ ...form, condition: e.target.value })}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-slate-800/60"
                >
                  <option value="">Select condition</option>
                  {['New', 'Good', 'Fair', 'Poor'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                  Price (UGX) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number" required min="0" value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-slate-800/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                Specifications <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
              </label>
              <textarea
                rows={3} value={form.specification}
                onChange={e => setForm({ ...form, specification: e.target.value })}
                className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-slate-800/60 resize-none"
              />
            </div>
          </div>

          {/* Images */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide mb-1">Photos</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              {visibleExisting.length + newImages.length} / 5 photos · Remove old photos or add new ones
            </p>

            {/* Existing images */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Current photos</p>
                <div className="grid grid-cols-5 gap-2">
                  {existingImages.map(img => {
                    const isRemoved = removedImageIds.includes(img.productImage_id);
                    return (
                      <div key={img.productImage_id} className="relative group aspect-square rounded-xl overflow-hidden">
                        <img
                          src={`http://localhost:8000/storage/${img.image_path}`}
                          alt=""
                          className={`w-full h-full object-cover transition ${isRemoved ? 'opacity-30 grayscale' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => toggleRemoveExisting(img.productImage_id)}
                          className={`absolute inset-0 flex items-center justify-center transition
                            ${isRemoved
                              ? 'bg-red-500/20'
                              : 'bg-black/0 group-hover:bg-black/40 opacity-0 group-hover:opacity-100'
                            }`}
                        >
                          <span className="bg-white dark:bg-slate-900 text-xs px-2 py-1 rounded-full font-medium">
                            {isRemoved ? 'Removed — Undo' : 'Remove'}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upload new */}
            {remainingSlots > 0 && (
              <label className="block border-2 border-dashed border-gray-200 dark:border-slate-700 hover:border-blue-400 rounded-2xl p-6 text-center cursor-pointer transition mb-4">
                <input
                  type="file" multiple accept="image/jpeg,image/png,image/jpg"
                  className="hidden" onChange={handleImageChange}
                />
                <span className="text-3xl block mb-2">📸</span>
                <p className="font-medium text-gray-700 dark:text-gray-200 text-sm">Click to add new photos</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining</p>
              </label>
            )}

            {/* New image previews */}
            {newPreviews.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">New photos to add</p>
                <div className="grid grid-cols-5 gap-2">
                  {newPreviews.map((src, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeNewImage(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                      <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                        New
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info banner */}
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 rounded-2xl px-5 py-4 flex gap-3">
            <span className="text-blue-500 dark:text-blue-400 shrink-0 text-lg">ℹ️</span>
            <div>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">No additional fee required</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                Since you already paid the listing fee, resubmitting is free.
                Your listing will go back to the reviewer for re-approval.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard/listings')}
              className="flex-1 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 py-3 rounded-xl text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Resubmitting...
                </span>
              ) : '🚀 Resubmit for Approval'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}