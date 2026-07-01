import { useEffect, useState } from 'react';
import ManagerLayout from '../../layouts/ManagerLayout';
import { getProductManagers, createProductManager, getManagerCategories } from '../../api/manager';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext'; // 👈 Import useAuth

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gray-100" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-gray-100 rounded w-32" />
          <div className="h-3 bg-gray-100 rounded w-44" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-5 w-20 bg-gray-100 rounded-full" />
        <div className="h-5 w-20 bg-gray-100 rounded-full" />
      </div>
    </div>
  );
}

function PMCard({ pm, onRefresh }) {
  const initials = pm.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-100 transition-all p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {initials}
        </div>
        <div className="flex-1 overflow-hidden">
          <h3 className="font-bold text-gray-800 truncate">{pm.name}</h3>
          <p className="text-xs text-gray-400 truncate mt-0.5">{pm.email}</p>
          {pm.phone && <p className="text-xs text-gray-400 mt-0.5">📞 {pm.phone}</p>}
          {pm.location && <p className="text-xs text-gray-400 mt-0.5">📍 {pm.location}</p>}
        </div>
        <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${pm.is_active ? 'bg-green-400' : 'bg-gray-300'}`} />
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">Assigned Categories</p>
        {pm.assignments?.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {pm.assignments.map(a => (
              <span key={a.id} className="bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">
                {a.category?.name}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-gray-300 italic">No categories assigned</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <span className="text-xs text-gray-400">
          Joined {new Date(pm.created_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pm.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
          {pm.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  );
}

// ---------- Create PM Modal ----------
function CreatePMModal({ onClose, onCreated }) {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    phone: '', location: '', category_id: [],
  });
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    getManagerCategories().then(res => setCategories(res.data.categories));
  }, []);

  const toggleCategory = (id) => {
    setForm(prev => ({
      ...prev,
      category_id: prev.category_id.includes(id)
        ? prev.category_id.filter(c => c !== id)
        : [...prev.category_id, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.category_id.length === 0) {
      setError('Please assign at least one category.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await createProductManager(form);
      toast('Product Manager created successfully', 'success');
      onCreated();
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to create';
      setError(errorMsg);
      toast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg">Create Product Manager</h3>
              <p className="text-orange-200 text-xs mt-0.5">They will receive a notification with login details</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition">✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5 flex gap-2">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Full Name', name: 'name',     type: 'text',     placeholder: 'e.g. David Omondi',   required: true  },
                { label: 'Email',     name: 'email',    type: 'email',    placeholder: 'pm@ewaste.org',        required: true  },
                { label: 'Password',  name: 'password', type: 'password', placeholder: 'Min. 8 characters',   required: true  },
                { label: 'Phone',     name: 'phone',    type: 'tel',      placeholder: '0700 000 000',         required: false },
              ].map(({ label, name, type, placeholder, required }) => (
                <div key={name}>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">{label} {required && <span className="text-red-400">*</span>}</label>
                  <input
                    type={type} value={form[name]} required={required}
                    placeholder={placeholder}
                    onChange={e => setForm({ ...form, [name]: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 placeholder-gray-300"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Location</label>
              <input
                type="text" value={form.location}
                placeholder="e.g. Kampala, Uganda"
                onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 placeholder-gray-300"
              />
            </div>

            {/* Categories */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Assign Categories <span className="text-red-400">*</span>
                <span className="text-gray-400 font-normal ml-1">({form.category_id.length} selected)</span>
              </label>
              <div className="flex flex-wrap gap-2 border border-gray-200 rounded-xl p-3 bg-gray-50 max-h-36 overflow-y-auto">
                {categories.map(cat => (
                  <label
                    key={cat.category_id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs cursor-pointer border transition
                      ${form.category_id.includes(cat.category_id)
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                      }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={form.category_id.includes(cat.category_id)}
                      onChange={() => toggleCategory(cat.category_id)}
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit" disabled={submitting}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : 'Create Product Manager'}
              </button>
              <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl text-sm font-medium transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ---------- Main Page ----------
export default function ProductManagersPage() {
  const [pms, setPms]           = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch]     = useState('');

  // 👇 Get permissions from auth context
  const { permissions } = useAuth();

  // 👇 Check if user has permission to create PMs
  const canCreatePM = permissions?.includes('pm-create') || false;

  const fetchPMs = () => {
    setLoading(true);
    getProductManagers()
      .then(res => setPms(res.data.product_managers))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPMs(); }, []);

  const filtered = pms.filter(pm =>
    pm.name.toLowerCase().includes(search.toLowerCase()) ||
    pm.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ManagerLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Product Managers</h2>
          <p className="text-gray-500 text-sm mt-1">
            {pms.length} product manager{pms.length !== 1 ? 's' : ''} on the platform
          </p>
        </div>
        {/* 👇 "Create Product Manager" button only appears if user has pm-create permission */}
        {canCreatePM && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
          >
            <span>+</span> Create Product Manager
          </button>
        )}
      </div>

      {pms.length > 0 && (
        <div className="mb-6 max-w-sm">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text" placeholder="Search product managers..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : pms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-3xl mx-auto mb-4">🧑‍💼</div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">No product managers yet</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
            Create product managers and assign them to categories to help review listings.
          </p>
          {/* 👇 "Create First Product Manager" button only appears if user has pm-create permission */}
          {canCreatePM && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition"
            >
              + Create First Product Manager
            </button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="mb-1">No results for "{search}"</p>
          <button onClick={() => setSearch('')} className="text-orange-500 text-sm hover:underline">Clear search</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(pm => <PMCard key={pm.id} pm={pm} onRefresh={fetchPMs} />)}
        </div>
      )}

      {showModal && (
        <CreatePMModal onClose={() => setShowModal(false)} onCreated={fetchPMs} />
      )}
    </ManagerLayout>
  );
}