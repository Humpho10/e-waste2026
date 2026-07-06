import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getCategories, createProduct } from '../../api/products';
import { resendVerification } from '../../api/auth';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext'; // 👈 Import useAuth

const steps = [
  { id: 1, label: 'Category',    icon: '📂' },
  { id: 2, label: 'Details',     icon: '📝' },
  { id: 3, label: 'Images',      icon: '🖼️' },
  { id: 4, label: 'Review',      icon: '✅' },
];

export default function CreateListingPage() {
  const navigate = useNavigate();
  const [step, setStep]             = useState(1);
  const [error, setError]           = useState('');
  const [images, setImages]         = useState([]);
  const [previews, setPreviews]     = useState([]);

  // 👇 Get permissions and toast
  const { permissions, user } = useAuth();
  const { toast } = useToast();

  // 👇 Check if user has permission to create listings
  const canCreate = permissions?.includes('product-create') || false;
  const isVerified = !!user?.email_verified_at;

  const resendMutation = useMutation({
    mutationFn: resendVerification,
    onSuccess: () => toast('Verification email sent. Check your inbox.', 'success'),
    onError: (err) => toast(err.response?.data?.message || 'Could not send verification email.', 'error'),
  });

  const [form, setForm] = useState({
    category_id:    '',
    subcategory_id: '',
    title:          '',
    description:    '',
    condition:      '',
    price:          '',
    specification:  '',
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then(res => res.data.categories),
  });

  // Derived from categories + the selected category_id — no effect needed.
  const subcategories = categories.find(c => c.category_id == form.category_id)?.subcategories || [];

  const handleImageChange = (e) => {
    const existing = images.length;
    const remaining = 5 - existing;
    const newFiles = Array.from(e.target.files).slice(0, remaining);
    const updated = [...images, ...newFiles].slice(0, 5);
    setImages(updated);
    setPreviews(updated.map(f => URL.createObjectURL(f)));
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const createMutation = useMutation({
    mutationFn: (data) => createProduct(data),
    onSuccess: () => {
      toast('Listing submitted for approval successfully', 'success');
      navigate('/dashboard/listings');
    },
    onError: (err) => {
      const errors = err.response?.data?.errors;
      const errorMsg = errors
        ? Object.values(errors).flat().join(' · ')
        : err.response?.data?.message || 'Failed to submit listing.';
      setError(errorMsg);
      toast(errorMsg || 'Failed to submit listing', 'error');
      setStep(2);
    },
  });

  const handleSubmit = () => {
    setError('');
    const data = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      if (val) data.append(key, val);
    });
    images.forEach((img, i) => {
      data.append(`images[${i}]`, img);
    });
    createMutation.mutate(data);
  };

  const submitting = createMutation.isPending;

  const canNext = () => {
    if (step === 1) return form.category_id && form.subcategory_id;
    if (step === 2) return form.title && form.description && form.condition && form.price;
    return true;
  };

  const selectedCategory = categories.find(c => c.category_id == form.category_id);
  const selectedSub      = subcategories.find(s => s.subcategory_id == form.subcategory_id);

  // 👇 If user doesn't have permission to create, show an error message
  if (!canCreate) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-500">You don't have permission to create listings.</p>
        </div>
      </DashboardLayout>
    );
  }

  // 👇 Block listing creation until the user has verified their email
  if (!isVerified) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify your email first</h2>
          <p className="text-gray-500 mb-6">
            You need to verify your email address before you can create a listing. Check your inbox for the verification link.
          </p>
          <button
            onClick={() => resendMutation.mutate()}
            disabled={resendMutation.isPending}
            className="btn-lift bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
          >
            {resendMutation.isPending ? 'Sending…' : 'Resend verification email'}
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Post a Listing</h2>
          <p className="text-gray-500 text-sm mt-1">
            Fill in the details below. Your listing will be reviewed before going live.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition
                  ${step === s.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : step > s.id ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-400'}
                `}>
                  {step > s.id ? '✓' : s.icon}
                </div>
                <span className={`text-xs mt-1.5 font-medium ${step >= s.id ? 'text-gray-700' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 rounded ${step > s.id ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6 flex gap-2">
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        {/* Step content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">

          {/* Step 1 — Category */}
          {step === 1 && (
            <div>
              <h3 className="font-bold text-gray-800 text-lg mb-1">Choose a Category</h3>
              <p className="text-gray-500 text-sm mb-6">Select the category that best describes your item</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {categories.map(cat => (
                  <button
                    key={cat.category_id}
                    type="button"
                    onClick={() => setForm({ ...form, category_id: cat.category_id, subcategory_id: '' })}
                    className={`p-4 rounded-xl border-2 text-left transition
                      ${form.category_id == cat.category_id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                      }`}
                  >
                    <span className="text-2xl block mb-1">
                      {{'Electronics':'💻','Mobile Devices':'📱','Accessories':'🔌','Networking':'🌐','Appliances':'🖨️','Other':'📦'}[cat.name] || '📦'}
                    </span>
                    <span className={`text-sm font-medium ${form.category_id == cat.category_id ? 'text-blue-700' : 'text-gray-700'}`}>
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Subcategory */}
              {subcategories.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subcategory</label>
                  <div className="flex flex-wrap gap-2">
                    {subcategories.map(sub => (
                      <button
                        key={sub.subcategory_id}
                        type="button"
                        onClick={() => setForm({ ...form, subcategory_id: sub.subcategory_id })}
                        className={`px-3 py-1.5 rounded-full text-sm border transition
                          ${form.subcategory_id == sub.subcategory_id
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                          }`}
                      >
                        {sub.sub_category_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Details */}
          {step === 2 && (
            <div>
              <h3 className="font-bold text-gray-800 text-lg mb-1">Listing Details</h3>
              <p className="text-gray-500 text-sm mb-6">Provide accurate details to help buyers find your item</p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title <span className="text-red-400">*</span></label>
                  <input
                    type="text" value={form.title} required
                    placeholder="e.g. Dell Laptop Screen 15.6 inch HD"
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description <span className="text-red-400">*</span></label>
                  <textarea
                    value={form.description} required rows={4}
                    placeholder="Describe the item — what it is, where it came from, any defects..."
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Condition <span className="text-red-400">*</span></label>
                    <select
                      value={form.condition} required
                      onChange={e => setForm({ ...form, condition: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    >
                      <option value="">Select condition</option>
                      {['New', 'Good', 'Fair', 'Poor'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Price (UGX) <span className="text-red-400">*</span></label>
                    <input
                      type="number" value={form.price} required min="0"
                      placeholder="e.g. 45000"
                      onChange={e => setForm({ ...form, price: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Specifications <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea
                    value={form.specification} rows={3}
                    placeholder="Technical details, dimensions, compatibility, part numbers..."
                    onChange={e => setForm({ ...form, specification: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Images */}
          {step === 3 && (
            <div>
              <h3 className="font-bold text-gray-800 text-lg mb-1">Add Photos</h3>
              <p className="text-gray-500 text-sm mb-6">
                Upload up to 5 photos. Clear photos get more buyer interest.
              </p>

              {/* Upload area */}
              <label className="block border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-2xl p-8 text-center cursor-pointer transition mb-6">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/jpg"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <span className="text-4xl block mb-3">📸</span>
                <p className="font-semibold text-gray-700 mb-1">Click to upload photos</p>
                <p className="text-xs text-gray-400">JPEG, PNG up to 2MB each · Max 5 photos</p>
              </label>

              {/* Previews */}
              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {previews.map((src, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden aspect-square">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {previews.length === 0 && (
                <p className="text-center text-gray-400 text-sm">
                  No photos added yet — you can skip this step and add photos later
                </p>
              )}
            </div>
          )}

          {/* Step 4 — Review */}
          {step === 4 && (
            <div>
              <h3 className="font-bold text-gray-800 text-lg mb-1">Review Your Listing</h3>
              <p className="text-gray-500 text-sm mb-6">
                Check everything before submitting for approval
              </p>

              <div className="space-y-4">
                {[
                  { label: 'Category',    value: selectedCategory?.name },
                  { label: 'Subcategory', value: selectedSub?.sub_category_name },
                  { label: 'Title',       value: form.title },
                  { label: 'Condition',   value: form.condition },
                  { label: 'Price',       value: form.price ? `UGX ${Number(form.price).toLocaleString()}` : '' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-3 border-b border-gray-50">
                    <span className="text-sm text-gray-500 font-medium">{label}</span>
                    <span className="text-sm font-semibold text-gray-800">{value || '—'}</span>
                  </div>
                ))}

                <div className="py-3 border-b border-gray-50">
                  <p className="text-sm text-gray-500 font-medium mb-2">Description</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{form.description}</p>
                </div>

                <div className="py-3">
                  <p className="text-sm text-gray-500 font-medium mb-2">Photos</p>
                  {previews.length > 0 ? (
                    <div className="flex gap-2">
                      {previews.map((src, i) => (
                        <img key={i} src={src} alt="" className="w-14 h-14 rounded-xl object-cover border border-gray-200" />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No photos added</p>
                  )}
                </div>
              </div>

              {/* Approval notice */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex gap-3">
                <span className="text-blue-500 shrink-0">ℹ️</span>
                <p className="text-xs text-blue-700">
                  Your listing will be reviewed by our team before going live on the marketplace. You'll receive a notification once it's approved or if changes are needed.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl text-sm font-medium transition"
            >
              ← Back
            </button>
          )}
          {step < 4 ? (
            <button
              type="button"
              disabled={!canNext()}
              onClick={() => setStep(step + 1)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : '🚀 Submit for Approval'}
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}