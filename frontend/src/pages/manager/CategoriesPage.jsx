import { useEffect, useState } from 'react';
import ManagerLayout from '../../layouts/ManagerLayout';
import {
  getManagerCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  removeSubcategory,
} from '../../api/manager';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext'; // 👈 Import useAuth

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  // --- Subcategory state ---
  const [subcategoryInput, setSubcategoryInput] = useState('');
  const [editingSubcats, setEditingSubcats] = useState([]);

  // 👇 Get permissions from auth context
  const { permissions } = useAuth();

  // 👇 Get toast function
  const { toast } = useToast();

  // 👇 Check if user has the required permissions
  const canCreateCategory = permissions?.includes('category-create') || false;
  const canEditCategory = permissions?.includes('category-edit') || false;
  const canDeleteCategory = permissions?.includes('category-delete') || false;

  const fetchCategories = () => {
    setLoading(true);
    getManagerCategories()
      .then(res => setCategories(res.data.categories))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // --- Open / close modal ---
  const openCreate = () => {
    setEditing(null);
    setForm({ name: '' });
    setEditingSubcats([]);
    setSubcategoryInput('');
    setError('');
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name });
    setEditingSubcats(
      cat.subcategories?.map((s) => ({
        id: s.subcategory_id,
        name: s.sub_category_name,
        isNew: false,
      })) || []
    );
    setSubcategoryInput('');
    setError('');
    setShowModal(true);
  };

  // --- Subcategory helpers ---
  const addSubcat = () => {
    if (!subcategoryInput.trim()) return;
    setEditingSubcats((prev) => [
      ...prev,
      { id: null, name: subcategoryInput.trim(), isNew: true },
    ]);
    setSubcategoryInput('');
  };

  const removeSubcat = (index) => {
    setEditingSubcats((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Submit category (with subcategories) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      let savedCategory;

      if (editing) {
        // 1. Update category name
        const res = await updateCategory(editing.category_id, form);
        savedCategory = res.data.category;

        // 2. Remove subcategories that were deleted
        const originalIds = editing.subcategories?.map((s) => s.subcategory_id) || [];
        const remainingIds = editingSubcats.filter((s) => !s.isNew).map((s) => s.id);
        const toRemove = originalIds.filter((id) => !remainingIds.includes(id));

        await Promise.all(toRemove.map((id) => removeSubcategory(id)));

        toast('Category updated successfully', 'success');
      } else {
        // 1. Create new category
        const res = await createCategory(form);
        savedCategory = res.data.category;

        toast('Category created successfully', 'success');
      }

      // 3. Add new subcategories (for both create and edit)
      const newSubcats = editingSubcats.filter((s) => s.isNew);
      await Promise.all(
        newSubcats.map((s) =>
          addSubcategory(savedCategory.category_id, { name: s.name })
        )
      );

      setShowModal(false);
      fetchCategories();
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Delete category ---
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"? This cannot be undone.`)) return;
    try {
      await deleteCategory(id);
      fetchCategories();
      toast('Category deleted successfully', 'success');
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not delete — category may have products';
      toast(msg, 'warning');
    }
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const catIcons = {
    Electronics: '💻',
    'Mobile Devices': '📱',
    Accessories: '🔌',
    Networking: '🌐',
    Appliances: '🖨️',
    Other: '📦',
  };

  return (
    <ManagerLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Categories</h2>
          <p className="text-gray-500 text-sm mt-1">{categories.length} categories defined</p>
        </div>
        {/* 👇 "Add Category" button only appears if user has category-create permission */}
        {canCreateCategory && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
          >
            <span>+</span> Add Category
          </button>
        )}
      </div>

      {categories.length > 0 && (
        <div className="mb-6 max-w-sm">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100" />
                  <div className="h-4 bg-gray-100 rounded w-28" />
                </div>
                <div className="h-3 bg-gray-100 rounded w-20" />
              </div>
            ))}
        </div>
      ) : filtered.length === 0 && search ? (
        <div className="text-center py-12 text-gray-400">
          <p className="mb-1">No categories match "{search}"</p>
          <button onClick={() => setSearch('')} className="text-orange-500 text-sm hover:underline">
            Clear
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat) => (
            <div
              key={cat.category_id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-100 transition-all p-6 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-xl">
                    {catIcons[cat.name] || '📦'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{cat.name}</h3>
                    <p className="text-xs text-gray-400">{cat.products_count ?? 0} listings</p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  {/* 👇 "Edit" button only appears if user has category-edit permission */}
                  {canEditCategory && (
                    <button onClick={() => openEdit(cat)} className="text-xs text-blue-500 hover:underline">
                      Edit
                    </button>
                  )}
                  {/* 👇 "Delete" button only appears if user has category-delete permission */}
                  {canDeleteCategory && (
                    <button
                      onClick={() => handleDelete(cat.category_id, cat.name)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg">
                    {editing ? 'Edit Category' : 'Add Category'}
                  </h3>
                  <p className="text-orange-200 text-xs mt-0.5">Categories group e-waste listings</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 flex gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    required
                    placeholder="e.g. Computer Components"
                    onChange={(e) => setForm({ name: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                  />
                </div>

                {/* -- Subcategories section -- */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subcategories
                    <span className="text-gray-400 font-normal ml-1">
                      ({editingSubcats.length})
                    </span>
                  </label>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {editingSubcats.map((sub, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                          sub.isNew
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      >
                        <span>{sub.name}</span>
                        {sub.isNew && <span className="text-blue-400 text-xs">new</span>}
                        <button
                          type="button"
                          onClick={() => removeSubcat(i)}
                          className="text-gray-400 hover:text-red-500 transition ml-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {editingSubcats.length === 0 && (
                      <p className="text-xs text-gray-300 italic">No subcategories yet</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={subcategoryInput}
                      onChange={(e) => setSubcategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSubcat();
                        }
                      }}
                      placeholder="Add subcategory name..."
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <button
                      type="button"
                      onClick={addSubcat}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-xl text-sm font-medium transition"
                    >
                      + Add
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Press Enter or click Add. Click × to remove.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition"
                  >
                    {submitting
                      ? 'Saving...'
                      : editing
                      ? 'Save Changes'
                      : 'Add Category'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl text-sm transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </ManagerLayout>
  );
}