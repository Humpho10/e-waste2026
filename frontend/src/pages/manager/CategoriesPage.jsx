import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BiFolder, BiLayers, BiBox, BiSearch, BiPlus, BiEdit2, BiTrash2,
  BiX, BiAlertCircle, BiCpu, BiSmartphone, BiWifi, BiPrinter, BiZap,
} from '../../components/bi';
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
import { useAuth } from '../../context/AuthContext';

// Keyword-based icon picker — flexible for any category name an admin types in.
function categoryIcon(name = '') {
  const n = name.toLowerCase();
  if (n.includes('mobile') || n.includes('phone')) return BiSmartphone;
  if (n.includes('network') || n.includes('router') || n.includes('wifi')) return BiWifi;
  if (n.includes('appliance') || n.includes('printer')) return BiPrinter;
  if (n.includes('accessor') || n.includes('cable') || n.includes('power')) return BiZap;
  if (n.includes('electronic') || n.includes('computer') || n.includes('component')) return BiCpu;
  return BiBox;
}

function CategoryCard({ cat, canEdit, canDelete, onEdit, onDelete }) {
  const Icon = categoryIcon(cat.name);
  const subcats = cat.subcategories || [];
  const shown = subcats.slice(0, 3);
  const overflow = subcats.length - shown.length;
  const hasProducts = (cat.products_count ?? 0) > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-100 transition-all p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
            <Icon size={20} className="text-orange-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{cat.name}</h3>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <BiBox size={11} /> {cat.products_count ?? 0} listing{cat.products_count === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {(canEdit || canDelete) && (
          <div className="flex gap-1.5 shrink-0">
            {canEdit && (
              <button
                onClick={() => onEdit(cat)}
                title="Edit category"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
              >
                <BiEdit2 size={14} />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => !hasProducts && onDelete(cat)}
                disabled={hasProducts}
                title={hasProducts ? 'Move or remove its listings first' : 'Delete category'}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                  hasProducts
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                }`}
              >
                <BiTrash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-50">
        <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide flex items-center gap-1.5">
          <BiLayers size={12} /> Subcategories ({subcats.length})
        </p>
        {subcats.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {shown.map(s => (
              <span key={s.subcategory_id} className="bg-gray-50 text-gray-600 border border-gray-100 text-xs px-2 py-0.5 rounded-full">
                {s.sub_category_name}
              </span>
            ))}
            {overflow > 0 && (
              <span className="bg-orange-50 text-orange-600 text-xs px-2 py-0.5 rounded-full font-medium">
                +{overflow} more
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-300 italic">No subcategories yet</span>
        )}
      </div>
    </div>
  );
}

// ---------- Delete Confirmation Modal ----------
function DeleteConfirmModal({ cat, onClose, onConfirmed }) {
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: () => deleteCategory(cat.category_id),
    onSuccess: () => {
      toast('Category deleted successfully', 'success');
      onConfirmed();
      onClose();
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Could not delete — category may have products';
      toast(msg, 'warning');
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-6">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
            <BiTrash2 size={20} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Delete "{cat.name}"?</h3>
          <p className="text-sm text-gray-500 mb-6">
            This removes the category and all {cat.subcategories?.length || 0} of its subcategories. This can't be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Yes, delete'}
            </button>
            <button
              onClick={onClose}
              disabled={deleteMutation.isPending}
              className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl text-sm font-medium transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ name: '' });
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // --- Subcategory state ---
  const [subcategoryInput, setSubcategoryInput] = useState('');
  const [editingSubcats, setEditingSubcats] = useState([]);

  const { permissions } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canCreateCategory = permissions?.includes('category-create') || false;
  const canEditCategory = permissions?.includes('category-edit') || false;
  const canDeleteCategory = permissions?.includes('category-delete') || false;

  const { data: categories = [], isLoading: loading } = useQuery({
    queryKey: ['manager-categories'],
    queryFn: () => getManagerCategories().then(res => res.data.categories),
  });

  const invalidateCategories = () => queryClient.invalidateQueries({ queryKey: ['manager-categories'] });

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
  const saveMutation = useMutation({
    mutationFn: async ({ editing, form, editingSubcats }) => {
      let savedCategory;

      if (editing) {
        const res = await updateCategory(editing.category_id, form);
        savedCategory = res.data.category;

        const originalIds = editing.subcategories?.map((s) => s.subcategory_id) || [];
        const remainingIds = editingSubcats.filter((s) => !s.isNew).map((s) => s.id);
        const toRemove = originalIds.filter((id) => !remainingIds.includes(id));

        await Promise.all(toRemove.map((id) => removeSubcategory(id)));
      } else {
        const res = await createCategory(form);
        savedCategory = res.data.category;
      }

      const newSubcats = editingSubcats.filter((s) => s.isNew);
      await Promise.all(
        newSubcats.map((s) =>
          addSubcategory(savedCategory.category_id, { name: s.name })
        )
      );

      return { editing };
    },
    onSuccess: ({ editing }) => {
      toast(editing ? 'Category updated successfully' : 'Category created successfully', 'success');
      setShowModal(false);
      invalidateCategories();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Something went wrong';
      setError(msg);
      toast(msg, 'error');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    saveMutation.mutate({ editing, form, editingSubcats });
  };

  const submitting = saveMutation.isPending;

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalSubcategories = categories.reduce((sum, c) => sum + (c.subcategories?.length || 0), 0);
  const emptyCategories = categories.filter((c) => !(c.products_count > 0)).length;

  return (
    <ManagerLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BiFolder className="text-orange-500" size={22} /> Categories
          </h2>
          <p className="text-gray-500 text-sm mt-1">{categories.length} categories defined</p>
        </div>
        {canCreateCategory && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
          >
            <BiPlus size={16} /> Add Category
          </button>
        )}
      </div>

      {/* Summary row */}
      {categories.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <BiFolder size={16} className="text-orange-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800 leading-none">{categories.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Categories</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <BiLayers size={16} className="text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800 leading-none">{totalSubcategories}</p>
              <p className="text-xs text-gray-400 mt-0.5">Subcategories</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <BiBox size={16} className="text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800 leading-none">{emptyCategories}</p>
              <p className="text-xs text-gray-400 mt-0.5">Without listings</p>
            </div>
          </div>
        </div>
      )}

      {categories.length > 0 && (
        <div className="mb-6 max-w-sm">
          <div className="relative">
            <BiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-slate-900"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100" />
                <div className="h-4 bg-gray-100 rounded w-28" />
              </div>
              <div className="h-3 bg-gray-100 rounded w-20" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
            <BiFolder size={28} className="text-orange-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">No categories yet</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
            Add categories to organize listings and assign product managers to review them.
          </p>
          {canCreateCategory && (
            <button
              onClick={openCreate}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition"
            >
              + Add First Category
            </button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="mb-1">No categories match "{search}"</p>
          <button onClick={() => setSearch('')} className="text-orange-500 dark:text-orange-400 text-sm hover:underline">
            Clear
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat) => (
            <CategoryCard
              key={cat.category_id}
              cat={cat}
              canEdit={canEditCategory}
              canDelete={canDeleteCategory}
              onEdit={openEdit}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <BiFolder size={18} /> {editing ? 'Edit Category' : 'Add Category'}
                  </h3>
                  <p className="text-orange-200 text-xs mt-0.5">Categories group e-waste listings</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                >
                  <BiX size={16} />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 flex gap-2 items-start">
                  <BiAlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    required
                    placeholder="e.g. Computer Components"
                    onChange={(e) => setForm({ name: e.target.value })}
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 dark:bg-slate-800/60"
                  />
                </div>

                {/* -- Subcategories section -- */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <BiLayers size={14} /> Subcategories
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
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-700 dark:text-blue-400'
                            : 'bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        <span>{sub.name}</span>
                        {sub.isNew && <span className="text-blue-700 dark:text-blue-400 text-xs">new</span>}
                        <button
                          type="button"
                          onClick={() => removeSubcat(i)}
                          className="text-gray-400 dark:text-gray-500 hover:text-red-500 transition ml-1"
                        >
                          <BiX size={12} />
                        </button>
                      </div>
                    ))}
                    {editingSubcats.length === 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic">No subcategories yet</p>
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
                      className="flex-1 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <button
                      type="button"
                      onClick={addSubcat}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1"
                    >
                      <BiPlus size={14} /> Add
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
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
                    className="flex-1 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 py-2.5 rounded-xl text-sm transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <DeleteConfirmModal cat={deleting} onClose={() => setDeleting(null)} onConfirmed={invalidateCategories} />
      )}
    </ManagerLayout>
  );
}
