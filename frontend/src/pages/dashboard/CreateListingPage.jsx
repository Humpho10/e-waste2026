import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getCategories, createProduct, getPublicSettings } from '../../api/products';
import { 
  FiChevronRight, 
  FiChevronLeft, 
  FiCheck, 
  FiX,
  FiUpload,
  FiImage,
  FiTag,
  FiFileText,
  FiGrid,
  FiList,
  FiArrowRight,
  FiArrowLeft,
  FiCamera,
  FiTrash2,
  FiEye,
  FiAlertCircle,
  FiMonitor,
  FiSmartphone,
  FiZap,
  FiGlobe,
  FiPrinter,
  FiPackage,
  FiStar,
  FiThumbsUp,
  FiBarChart2,
  FiTool
} from '../../components/feathericons';

const steps = [
  { id: 1, label: 'Category', icon: FiGrid, description: 'Choose where your item belongs' },
  { id: 2, label: 'Details', icon: FiFileText, description: 'Tell buyers about your item' },
  { id: 3, label: 'Images', icon: FiImage, description: 'Show what you\'re selling' },
  { id: 4, label: 'Review', icon: FiEye, description: 'Double-check everything' },
];

const conditions = [
  { value: 'New', label: 'Brand New', icon: FiStar, color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
  { value: 'Good', label: 'Very Good', icon: FiThumbsUp, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  { value: 'Fair', label: 'Fair', icon: FiBarChart2, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' },
  { value: 'Poor', label: 'Needs Repair', icon: FiTool, color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
];

const categoryIcons = {
  'Electronics': FiMonitor,
  'Mobile Devices': FiSmartphone,
  'Accessories': FiZap,
  'Networking': FiGlobe,
  'Appliances': FiPrinter,
  'Other': FiPackage
};

// Format Ugandan Shillings
const formatUGX = (amount) => {
  if (!amount) return '';
  return `UGX ${Number(amount).toLocaleString()}`;
};

export default function CreateListingPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const [form, setForm] = useState({
    category_id: '',
    subcategory_id: '',
    title: '',
    description: '',
    condition: '',
    price: '',
    specification: '',
  });

  // Same cache key as LoginPage/HomePage/MaintenanceGate — reflects the
  // Super Admin's configured photo limit instead of a hardcoded number.
  const { data: siteSettings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => getPublicSettings().then(res => res.data),
    staleTime: 30_000,
  });
  const maxImages = siteSettings?.max_images_per_listing ?? 5;

  // Load categories
  useEffect(() => {
    getCategories()
      .then(res => setCategories(res.data.categories))
      .catch(() => toast.error('Failed to load categories'));
  }, []);

  // Update subcategories when category changes
  useEffect(() => {
    if (form.category_id) {
      const cat = categories.find(c => c.category_id == form.category_id);
      setSubcategories(cat?.subcategories || []);
      setForm(prev => ({ ...prev, subcategory_id: '' }));
    }
  }, [form.category_id, categories]);

  // Image handling with react-dropzone
  const onDrop = (acceptedFiles) => {
    const remaining = maxImages - images.length;
    const newFiles = acceptedFiles.slice(0, remaining);

    if (newFiles.length === 0) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    const updatedImages = [...images, ...newFiles];
    setImages(updatedImages);
    setImagePreviews(updatedImages.map(f => URL.createObjectURL(f)));
    toast.success(`${newFiles.length} image(s) added`);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxSize: 2 * 1024 * 1024, // 2MB
    maxFiles: maxImages,
    disabled: images.length >= maxImages,
  });

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    toast.success('Image removed');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val) data.append(key, val);
      });
      images.forEach((img, i) => {
        data.append(`images[${i}]`, img);
      });

      await createProduct(data);
      toast.success('Your listing has been submitted for review!');
      navigate('/dashboard/listings');
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        const errorMessages = Object.values(errors).flat().join(' · ');
        toast.error(errorMessages);
      } else {
        toast.error(err.response?.data?.message || 'Failed to submit listing.');
      }

      setStep(2);
    } finally {
      setSubmitting(false);
    }
  };

  const canNext = () => {
    if (step === 1) return form.category_id && form.subcategory_id;
    if (step === 2) return form.title && form.description && form.condition && form.price;
    if (step === 3) return images.length >= maxImages;
    return true;
  };

  const selectedCategory = categories.find(c => c.category_id == form.category_id);
  const selectedSub = subcategories.find(s => s.subcategory_id == form.subcategory_id);

  const progress = ((step - 1) / (steps.length - 1)) * 100;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Header with progress */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Create Listing</h2>
              <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">
                Fill in the details below. Your listing will be reviewed before going live.
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="px-4 py-2 bg-blue-50 rounded-xl border border-blue-100 dark:bg-blue-950/40">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  Step {step} of {steps.length}
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6 relative">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-slate-700">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center mb-8 gap-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <motion.button
                onClick={() => {
                  if (step > s.id) setStep(s.id);
                }}
                className={`flex flex-col items-center group relative ${
                  step > s.id ? 'cursor-pointer' : 'cursor-default'
                }`}
                whileHover={step > s.id ? { scale: 1.05 } : {}}
              >
                <div className={`
                  w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold transition-all duration-300
                  ${step === s.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-100' 
                    : step > s.id 
                      ? 'bg-green-500 text-white shadow-lg shadow-green-200' 
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-500'}
                `}>
                  {step > s.id ? <FiCheck className="w-6 h-6" /> : <s.icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs mt-2 font-medium transition-colors ${
                  step >= s.id ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {s.label}
                </span>
                <span className="text-[10px] text-gray-400 hidden sm:block mt-0.5 dark:text-gray-500">
                  {s.description}
                </span>
              </motion.button>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-500 ${
                  step > s.id ? 'bg-green-400' : 'bg-gray-200 dark:bg-slate-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Animated content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 dark:bg-slate-900 dark:border-slate-800"
          >
            {/* Step content */}
            {step === 1 && (
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-1 dark:text-gray-100">Choose a Category</h3>
                <p className="text-gray-500 text-sm mb-6 dark:text-gray-400">Select the category that best describes your item</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {categories.map(cat => {
                    const isSelected = form.category_id == cat.category_id;
                    const CatIcon = categoryIcons[cat.name] || FiPackage;
                    return (
                      <motion.button
                        key={cat.category_id}
                        type="button"
                        onClick={() => setForm({ ...form, category_id: cat.category_id })}
                        className={`p-4 rounded-2xl border-2 text-left transition-all duration-200
                          ${isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100 dark:bg-blue-950/40'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-md hover:shadow-blue-50 bg-white dark:border-slate-700 dark:bg-slate-900'
                          }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="block mb-2">
                          <CatIcon className="w-7 h-7" />
                        </span>
                        <span className={`text-sm font-medium ${
                          isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'
                        }`}>
                          {cat.name}
                        </span>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="mt-1"
                          >
                            <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full dark:bg-blue-900/40 dark:text-blue-400">
                              Selected
                            </span>
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Subcategory */}
                {subcategories.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-3 dark:text-gray-200">
                      Subcategory <span className="text-red-400">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {subcategories.map(sub => {
                        const isSelected = form.subcategory_id == sub.subcategory_id;
                        return (
                          <motion.button
                            key={sub.subcategory_id}
                            type="button"
                            onClick={() => setForm({ ...form, subcategory_id: sub.subcategory_id })}
                            className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-200
                              ${isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:shadow-md dark:bg-slate-900 dark:text-gray-300 dark:border-slate-700'
                              }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {sub.sub_category_name}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Step 2 — Details */}
            {step === 2 && (
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-1 dark:text-gray-100">Listing Details</h3>
                <p className="text-gray-500 text-sm mb-6 dark:text-gray-400">Provide accurate details to help buyers find your item</p>

                <div className="space-y-5">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 dark:text-gray-200">
                      Title <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <FiTag className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        value={form.title}
                        placeholder="e.g. Dell Laptop Screen 15.6 inch HD"
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors dark:border-slate-700 dark:bg-slate-800/60"
                      />
                      <span className="absolute right-4 top-3.5 text-xs text-gray-400 dark:text-gray-500">
                        {form.title.length}/100
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 dark:text-gray-200">
                      Description <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <FiFileText className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500" />
                      <textarea
                        value={form.description}
                        rows={4}
                        placeholder="Describe the item — what it is, where it came from, any defects..."
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors resize-none dark:border-slate-700 dark:bg-slate-800/60"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Condition */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 dark:text-gray-200">
                        Condition <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {conditions.map(c => {
                          const isSelected = form.condition === c.value;
                          const CondIcon = c.icon;
                          return (
                            <motion.button
                              key={c.value}
                              type="button"
                              onClick={() => setForm({ ...form, condition: c.value })}
                              className={`p-3 rounded-xl border-2 text-center transition-all duration-200
                                ${isSelected
                                  ? `${c.color} border-current shadow-md`
                                  : 'border-gray-200 hover:border-gray-400 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/60'
                                }`}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <span className="flex justify-center mb-1"><CondIcon className="w-6 h-6" /></span>
                              <span className="text-xs font-medium">{c.label}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 dark:text-gray-200">
                        Price (UGX) <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={form.price}
                          min="0"
                          placeholder="e.g. 45000"
                          onChange={e => setForm({ ...form, price: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors dark:border-slate-700 dark:bg-slate-800/60"
                        />
                      </div>
                      {form.price && (
                        <p className="text-xs text-gray-500 mt-1.5 dark:text-gray-400">
                          {formatUGX(form.price)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Specifications */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 dark:text-gray-200">
                      Specifications <span className="text-gray-400 font-normal dark:text-gray-500">(optional)</span>
                    </label>
                    <div className="relative">
                      <FiList className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500" />
                      <textarea
                        value={form.specification}
                        rows={3}
                        placeholder="Technical details, dimensions, compatibility, part numbers..."
                        onChange={e => setForm({ ...form, specification: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors resize-none dark:border-slate-700 dark:bg-slate-800/60"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — Images */}
            {step === 3 && (
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-1 dark:text-gray-100">Add Photos</h3>
                <p className="text-gray-500 text-sm mb-6 dark:text-gray-400">
                  Upload {maxImages} photo{maxImages === 1 ? '' : 's'} to continue. Clear photos get more buyer interest.
                  <span className="block text-xs text-blue-600 mt-1 dark:text-blue-400">
                    {images.length}/{maxImages} images uploaded
                  </span>
                </p>

                {/* Dropzone */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
                    ${isDragActive
                      ? 'border-blue-500 bg-blue-50 shadow-inner dark:bg-blue-950/40'
                      : images.length >= maxImages
                        ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-60 dark:border-slate-600 dark:bg-slate-800/60'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30 dark:border-slate-600'
                    }`}
                >
                  <input {...getInputProps()} />
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: isDragActive ? 1.05 : 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 dark:bg-blue-950/40">
                        {isDragActive ? (
                          <FiUpload className="w-8 h-8 text-blue-500" />
                        ) : (
                          <FiCamera className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                      <p className="font-semibold text-gray-700 mb-1 dark:text-gray-200">
                        {isDragActive ? 'Drop your images here' : 'Click or drag to upload'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        JPEG, PNG, WebP · Up to 2MB each
                      </p>
                      <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">
                        {images.length}/{maxImages} images used
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Image previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                    {imagePreviews.map((src, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative group rounded-2xl overflow-hidden aspect-square bg-gray-100 dark:bg-slate-800"
                      >
                        <img 
                          src={src} 
                          alt={`Preview ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition transform hover:scale-110"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {i === 0 && (
                          <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                            Main
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}

                {images.length < maxImages && (
                  <div className="mt-6 p-4 bg-amber-50 rounded-xl text-center dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      {images.length === 0
                        ? `Add ${maxImages} photo${maxImages === 1 ? '' : 's'} to continue — photos are required to submit your listing.`
                        : `Add ${maxImages - images.length} more photo${maxImages - images.length === 1 ? '' : 's'} to continue (${maxImages} required).`}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4 — Review */}
            {step === 4 && (
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-1 dark:text-gray-100">Review Your Listing</h3>
                <p className="text-gray-500 text-sm mb-6 dark:text-gray-400">
                  Check everything before submitting for approval
                </p>

                <div className="space-y-4 bg-gray-50 rounded-2xl p-4 sm:p-6 dark:bg-slate-800/60">
                  {[
                    { label: 'Category', value: selectedCategory?.name, icon: FiGrid },
                    { label: 'Subcategory', value: selectedSub?.sub_category_name, icon: FiTag },
                    { label: 'Title', value: form.title, icon: FiFileText },
                    { label: 'Condition', value: form.condition, icon: FiTag },
                    { label: 'Price', value: form.price ? formatUGX(form.price) : '', icon: FiTag },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-start justify-between py-3 border-b border-gray-200/60 last:border-0">
                      <span className="flex items-center gap-2 text-sm text-gray-500 font-medium dark:text-gray-400">
                        <Icon className="w-4 h-4" />
                        {label}
                      </span>
                      <span className="text-sm font-semibold text-gray-800 text-right max-w-[60%] dark:text-gray-100">
                        {value || '—'}
                      </span>
                    </div>
                  ))}

                  {form.description && (
                    <div className="py-3 border-b border-gray-200/60">
                      <p className="text-sm text-gray-500 font-medium mb-2 flex items-center gap-2 dark:text-gray-400">
                        <FiFileText className="w-4 h-4" /> Description
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed dark:text-gray-200">
                        {form.description}
                      </p>
                    </div>
                  )}

                  {imagePreviews.length > 0 && (
                    <div className="py-3">
                      <p className="text-sm text-gray-500 font-medium mb-2 flex items-center gap-2 dark:text-gray-400">
                        <FiImage className="w-4 h-4" /> Photos ({imagePreviews.length})
                      </p>
                      <div className="flex gap-2">
                        {imagePreviews.slice(0, maxImages).map((src, i) => (
                          <img 
                            key={i} 
                            src={src} 
                            alt={`Preview ${i + 1}`}
                            className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-sm"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Approval notice */}
                <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 rounded-2xl px-4 py-4 flex gap-3 dark:border-blue-800/50">
                  <FiAlertCircle className="text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Review Process
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      Your listing will be reviewed by our team before going live. 
                      You'll receive a notification once it's approved or if changes are needed.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          {step > 1 && (
            <motion.button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-3.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 group dark:border-slate-700 dark:text-gray-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
              Back
            </motion.button>
          )}
          
          {step < 4 ? (
            <motion.button
              type="button"
              disabled={!canNext()}
              onClick={() => setStep(step + 1)}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 group disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Continue
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          ) : (
            <motion.button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <FiCheck className="w-5 h-5" />
                  Submit for Approval
                </>
              )}
            </motion.button>
          )}
        </div>

        {/* Mobile step indicator */}
        <div className="mt-4 sm:hidden text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Step {step} of {steps.length} · {steps[step - 1].label}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}