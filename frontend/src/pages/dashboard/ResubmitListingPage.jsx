import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiAlertCircle,
  FiSave,
  FiX,
  FiUpload,
  FiCamera,
  FiTrash2,
  FiRefreshCw,
  FiCheckCircle,
  FiInfo,
  FiTag,
  FiFileText,
  FiDollarSign,
  FiImage,
  FiList
} from 'react-icons/fi';
import DashboardLayout from '../../layouts/DashboardLayout';
import { myListings, resubmitProduct } from '../../api/products';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';

// Format Ugandan Shillings
const formatUGX = (amount) => {
  if (!amount) return '';
  return `UGX ${Number(amount).toLocaleString()}`;
};

export default function ResubmitListingPage() {
  const { hashId } = useParams();
  const navigate   = useNavigate();
  const { toast }  = useToast();
  const { permissions } = useAuth();

  const canResubmit = permissions?.includes('product-create') || false;

  const [product, setProduct]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', condition: '', price: '', specification: '',
  });

  const [existingImages, setExistingImages] = useState([]);
  const [removedImageIds, setRemovedImageIds] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);

  useEffect(() => {
    // 👈 If user doesn't have permission, redirect immediately
    if (!canResubmit) {
      toast('You do not have permission to resubmit listings.', 'error');
      navigate('/dashboard/listings');
      return;
    }

    myListings()
      .then(res => {
        const found = res.data.products?.find(p => p.hash_id == hashId);
        if (!found) {
          toast('Listing not found', 'error');
          navigate('/dashboard/listings');
          return;
        }
        if (found.status !== 'rejected') {
          toast('Only rejected listings can be resubmitted', 'warning');
          navigate('/dashboard/listings');
          return;
        }
        setProduct(found);
        setForm({
          title:         found.title         || '',
          description:   found.description   || '',
          condition:     found.condition      || '',
          price:         found.price          || '',
          specification: found.specification  || '',
        });
        setExistingImages(found.images || []);
      })
      .finally(() => setLoading(false));
  }, [hashId, canResubmit]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canResubmit) {
      toast('You do not have permission to resubmit.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val !== '' && val !== null) data.append(key, val);
      });
      newImages.forEach((img, i) => data.append(`images[${i}]`, img));
      removedImageIds.forEach((id, i) => data.append(`remove_images[${i}]`, id));

      await resubmitProduct(hashId, data);
      toast('Listing resubmitted successfully — no additional fee required', 'success');
      navigate('/dashboard/listings');
    } catch (err) {
      const errors = err.response?.data?.errors;
      toast(errors ? Object.values(errors).flat().join(' · ') : err.response?.data?.message || 'Failed to resubmit', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 animate-pulse">
        <div className="h-8 bg-slate-100 rounded w-48 mb-6" />
        <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 bg-slate-100 rounded w-24" />
              <div className="h-12 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );

  if (!canResubmit) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
            <p className="text-slate-500">You don't have permission to resubmit listings.</p>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  if (!product) return null;

  const visibleExisting = existingImages.filter(img => !removedImageIds.includes(img.productImage_id));
  const totalImages = visibleExisting.length + newImages.length;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header with gradient */}
        <motion.div 
          className="relative mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-gradient-to-br from-slate-50 via-white to-stone-50 rounded-3xl p-8 border border-slate-200 shadow-sm">
            <button
              onClick={() => navigate('/dashboard/listings')}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-4 transition group"
            >
              <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to listings
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-200">
                <FiRefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  Resubmit Listing
                  <span className="text-sm font-normal bg-amber-50 text-amber-600 px-3 py-1 rounded-full flex items-center gap-1">
                    <FiRefreshCw className="w-3 h-3" />
                    Resubmit
                  </span>
                </h2>
                <p className="text-slate-500 text-sm flex items-center gap-2">
                  <FiInfo className="w-4 h-4 text-slate-400" />
                  Correct the issues and resubmit for approval. No additional fee required.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Rejection reason */}
        {product.rejection_reason && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-6 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-500 shrink-0">
              <FiAlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-rose-700 text-sm mb-0.5">Reason for rejection</p>
              <p className="text-rose-600 text-sm leading-relaxed">{product.rejection_reason}</p>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Details Section */}
          <motion.div 
            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
              Listing Details
            </h3>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <FiFileText className="w-4 h-4 text-slate-400" />
                  Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <FiFileText className="w-4 h-4 text-slate-400" />
                  Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                    <FiTag className="w-4 h-4 text-slate-400" />
                    Condition <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={form.condition}
                    onChange={e => setForm({ ...form, condition: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
                  >
                    <option value="">Select condition</option>
                    {['New', 'Good', 'Fair', 'Poor'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                    <FiTag className="w-4 h-4 text-slate-400" />
                    Price (UGX) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
                  />
                  {form.price && (
                    <p className="text-xs text-slate-500 mt-1.5">
                      {formatUGX(form.price)}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <FiList className="w-4 h-4 text-slate-400" />
                  Specifications <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={form.specification}
                  onChange={e => setForm({ ...form, specification: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors resize-none"
                />
              </div>
            </div>
          </motion.div>

          {/* Images Section */}
          <motion.div 
            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
              Photos
            </h3>
            
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-700">{totalImages}</span> / 5 photos
              </p>
              <p className="text-xs text-slate-400">
                {removedImageIds.length > 0 && `${removedImageIds.length} marked for removal`}
                {removedImageIds.length > 0 && newImages.length > 0 && ' · '}
                {newImages.length > 0 && `${newImages.length} new`}
              </p>
            </div>

            {/* Existing images */}
            {existingImages.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-medium text-slate-500 mb-2">Current photos</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {existingImages.map(img => {
                    const isRemoved = removedImageIds.includes(img.productImage_id);
                    return (
                      <motion.div
                        key={img.productImage_id}
                        whileHover={{ scale: 1.02 }}
                        className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                          isRemoved ? 'border-rose-300 opacity-50' : 'border-slate-200'
                        }`}
                      >
                        <img
                          src={`http://localhost:8000/storage/${img.image_path}`}
                          alt=""
                          className={`w-full h-full object-cover transition ${isRemoved ? 'grayscale' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => toggleRemoveExisting(img.productImage_id)}
                          className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
                            isRemoved
                              ? 'bg-rose-500/20'
                              : 'bg-black/0 group-hover:bg-black/40 opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <span className={`text-xs font-medium px-3 py-1.5 rounded-full shadow-lg ${
                            isRemoved
                              ? 'bg-white text-rose-600'
                              : 'bg-white text-slate-600'
                          }`}>
                            {isRemoved ? '↩️ Undo' : '🗑️ Remove'}
                          </span>
                        </button>
                        {isRemoved && (
                          <span className="absolute top-2 right-2 text-xs bg-rose-500 text-white px-2 py-0.5 rounded-full">
                            Removed
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upload new */}
            {remainingSlots > 0 && (
              <motion.label
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="block border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 mb-4"
              >
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/jpg"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <FiUpload className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                <p className="font-medium text-slate-700 text-sm">Click to add new photos</p>
                <p className="text-xs text-slate-400 mt-1">
                  {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining
                </p>
              </motion.label>
            )}

            {/* New image previews */}
            {newPreviews.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">New photos to add</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {newPreviews.map((src, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="relative group aspect-square rounded-xl overflow-hidden border-2 border-emerald-300"
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeNewImage(i)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-500 text-white text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                      <span className="absolute bottom-2 left-2 bg-emerald-500 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                        New
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {totalImages === 0 && (
              <div className="text-center py-4">
                <FiImage className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No photos added yet</p>
              </div>
            )}
          </motion.div>

          {/* Info banner */}
          <motion.div 
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl px-5 py-4 flex items-start gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-500 shrink-0">
              <FiInfo className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-700">No additional fee required</p>
              <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
                Since you already paid the listing fee, resubmitting is free.
                Your listing will go back to the reviewer for re-approval.
              </p>
            </div>
          </motion.div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard/listings')}
              className="flex-1 border-2 border-slate-200 text-slate-600 hover:bg-slate-50 py-3.5 rounded-xl text-sm font-medium transition"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 shadow-blue-100 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {submitting ? (
                <>
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                  Resubmitting...
                </>
              ) : (
                <>
                  <FiCheckCircle className="w-4 h-4" />
                  Resubmit for Approval
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}