import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiMapPin,
  FiTag,
  FiPackage,
  FiUser,
  FiPhone,
  FiMail,
  FiMessageCircle,
  FiSend,
  FiCheckCircle,
  FiAlertCircle,
  FiHeart,
  FiShare2,
  FiEye,
  FiCalendar,
  FiDollarSign
} from 'react-icons/fi';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getProduct } from '../../api/products';
import { sendMessage } from '../../api/messages';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

// Format Ugandan Shillings
const formatUGX = (amount) => {
  if (!amount) return '';
  return `UGX ${Number(amount).toLocaleString()}`;
};

export default function ProductDetailPage() {
  // Route param is a single "slug-hashId" string; split on the LAST hyphen
  // so the slug itself may contain hyphens (e.g. "dell-laptop-AbC123xyz").
  const { slugId } = useParams();
  const lastDash = slugId?.lastIndexOf('-') ?? -1;
  const slug   = lastDash > -1 ? slugId.slice(0, lastDash) : (slugId || '');
  const hashId = lastDash > -1 ? slugId.slice(lastDash + 1) : '';
  const { user, permissions } = useAuth();
  const navigate   = useNavigate();
  const [product, setProduct]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [message, setMessage]     = useState('');
  const [sending, setSending]     = useState(false);
  const [sent, setSent]           = useState(false);
  const [msgError, setMsgError]   = useState('');

  const { toast } = useToast();

  const canSendMessage = permissions?.includes('message-send') || false;

  useEffect(() => {
    getProduct(slug, hashId)
      .then(res => setProduct(res.data.product))
      .finally(() => setLoading(false));
  }, [slug, hashId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !canSendMessage) return;
    setSending(true);
    setMsgError('');
    try {
      await sendMessage({
        product_id:   product.product_id,
        message_text: message,
      });
      setSent(true);
      toast('Message sent to seller', 'success');
      setMessage('');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to send message.';
      setMsgError(errorMsg);
      toast(errorMsg, 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-slate-100 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-6 bg-slate-100 rounded w-3/4" />
            <div className="h-10 bg-slate-100 rounded w-1/3" />
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-2/3" />
            <div className="h-24 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );

  if (!product) return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto text-center py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="font-bold text-slate-700 text-xl mb-2">Listing not found</h3>
          <p className="text-slate-400 text-sm mb-6">The product you're looking for doesn't exist or has been removed</p>
          <button 
            onClick={() => navigate(-1)} 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl text-sm font-semibold transition shadow-blue-100 shadow-lg hover:shadow-xl"
          >
            <FiArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </motion.div>
      </div>
    </DashboardLayout>
  );

  const isSeller = user?.id === product.seller_id;
  const images = product.images || [];

  const showMessageSection = !isSeller && canSendMessage;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-6 transition group"
        >
          <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to listings
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

          {/* Images Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-slate-100 to-blue-50 border border-slate-200 shadow-sm group">
              {images.length > 0 ? (
                <>
                  <img
                    src={images[activeImg]?.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<span class="text-6xl opacity-30">📦</span>';
                    }}
                  />
                  
                  {/* Image counter */}
                  {images.length > 1 && (
                    <span className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <FiEye className="w-3 h-3" />
                      {activeImg + 1} / {images.length}
                    </span>
                  )}

                  {/* Navigation arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImg(prev => (prev - 1 + images.length) % images.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => setActiveImg(prev => (prev + 1) % images.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                      >
                        ›
                      </button>
                    </>
                  )}

                  {/* Dot indicators */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImg(i)}
                          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                            activeImg === i ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">
                  📦
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-thin">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 shrink-0 ${
                      activeImg === i 
                        ? 'border-blue-500 shadow-md shadow-blue-100 scale-105' 
                        : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '📦';
                      }}
                    />
                    {activeImg === i && (
                      <div className="absolute inset-0 bg-blue-500/10" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-5"
          >
            {/* Category badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-100">
                <FiTag className="w-3 h-3" />
                {product.category?.name}
              </span>
              {product.subCategory && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full">
                  {product.subCategory.sub_category_name}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-slate-800 leading-tight">
              {product.title}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-4">
              <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                {formatUGX(product.price)}
              </p>
              <span className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-200">
                Available
              </span>
            </div>

            {/* Condition */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs px-3 py-1.5 rounded-full font-medium">
                <FiPackage className="w-3 h-3" />
                Condition: {product.condition}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs px-3 py-1.5 rounded-full font-medium">
                <FiCalendar className="w-3 h-3" />
                Listed: {new Date(product.created_at).toLocaleDateString()}
              </span>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
                Description
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
                {product.description}
              </p>
            </div>

            {/* Specifications */}
            {product.specification && (
              <div>
                <h3 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
                  Specifications
                </h3>
                <div className="bg-gradient-to-r from-slate-50 to-white rounded-xl p-4 border border-slate-100">
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {product.specification}
                  </p>
                </div>
              </div>
            )}



            {/* Seller Info */}
            <div className="bg-gradient-to-r from-slate-50 to-white rounded-2xl p-5 border border-slate-200">
              <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                <FiUser className="w-4 h-4 text-slate-400" />
                Seller Information
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-blue-200">
                  {product.seller?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{product.seller?.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <FiMapPin className="w-3 h-3" />
                      {product.seller?.location || 'Uganda'}
                    </p>
                    {product.seller?.phone && (
                      <>
                        <span className="w-px h-3 bg-slate-200" />
                        <a href={`tel:${product.seller.phone}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <FiPhone className="w-3 h-3" />
                          {product.seller.phone}
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Message Section */}
        {showMessageSection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6"
          >
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FiMessageCircle className="w-5 h-5 text-blue-500" />
              Message the Seller
            </h3>

            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <FiCheckCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-emerald-700">Message sent!</p>
                    <p className="text-emerald-600 text-sm">The seller will get back to you soon.</p>
                  </div>
                  <button
                    onClick={() => setSent(false)}
                    className="text-emerald-600 text-sm hover:underline font-medium"
                  >
                    Send another
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSendMessage}
                  className="space-y-4"
                >
                  {msgError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-rose-50 border border-rose-200 text-rose-600 text-sm px-4 py-3 rounded-xl flex items-start gap-2"
                    >
                      <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{msgError}</span>
                    </motion.div>
                  )}
                  <div className="relative">
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      rows={4}
                      required
                      placeholder={`Hi, I'm interested in "${product.title}". Is it still available?`}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors resize-none"
                    />
                    <span className="absolute bottom-3 right-3 text-xs text-slate-400">
                      {message.length}/500
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition shadow-blue-100 shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {sending ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <FiSend className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {!isSeller && !canSendMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-50 rounded-2xl border border-slate-200 p-6 text-center"
          >
            <FiAlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">You don't have permission to send messages.</p>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}