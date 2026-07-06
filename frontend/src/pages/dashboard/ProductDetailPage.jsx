import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getProduct } from '../../api/products';
import { sendMessage } from '../../api/messages';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

export default function ProductDetailPage() {
  const { id }     = useParams();
  const { user, permissions } = useAuth();
  const navigate   = useNavigate();
  const [activeImg, setActiveImg] = useState(0);
  const [message, setMessage]     = useState('');
  const [sent, setSent]           = useState(false);
  const [msgError, setMsgError]   = useState('');

  const { toast } = useToast();

  const canSendMessage = permissions?.includes('message-send') || false;

  const { data: product, isLoading: loading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id).then(res => res.data.product),
  });

  const sendMutation = useMutation({
    mutationFn: (text) => sendMessage({ product_id: product.product_id, message_text: text }),
    onSuccess: () => {
      setSent(true);
      toast('Message sent to seller', 'success');
      setMessage('');
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.message || 'Failed to send message.';
      setMsgError(errorMsg);
      toast(errorMsg, 'error');
    },
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !canSendMessage) return;
    setMsgError('');
    sendMutation.mutate(message);
  };

  const sending = sendMutation.isPending;

  if (loading) return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-100 dark:bg-slate-800 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-6 bg-gray-100 dark:bg-slate-800 rounded w-3/4" />
            <div className="h-8 bg-gray-100 dark:bg-slate-800 rounded w-1/3" />
            <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-full" />
            <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-2/3" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );

  if (!product) return (
    <DashboardLayout>
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2">Listing not found</h3>
        <button onClick={() => navigate(-1)} className="text-blue-600 dark:text-blue-400 hover:underline text-sm">Go back</button>
      </div>
    </DashboardLayout>
  );

  const isSeller = user?.id === product.seller_id;
  const images   = product.images || [];

  const showMessageSection = !isSeller && canSendMessage;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 text-sm mb-6 transition"
        >
          ← Back to listings
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

          {/* Images with carousel */}
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center mb-3 border border-gray-100 dark:border-slate-800 relative group">
              {images.length > 0 ? (
                <>
                  <img
                    src={images[activeImg]?.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<span class="text-6xl opacity-30">📦</span>';
                    }}
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImg(prev => (prev - 1 + images.length) % images.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-lg"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => setActiveImg(prev => (prev + 1) % images.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-lg"
                      >
                        ›
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveImg(i)}
                            className={`w-2 h-2 rounded-full transition ${activeImg === i ? 'bg-white dark:bg-slate-900' : 'bg-white/50'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  {images.length > 1 && (
                    <span className="absolute top-3 right-3 bg-black/40 text-white text-xs px-2 py-1 rounded-full">
                      {activeImg + 1} / {images.length}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-6xl opacity-30">📦</span>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition shrink-0 ${activeImg === i ? 'border-blue-500' : 'border-gray-200 dark:border-slate-700 opacity-60 hover:opacity-100'}`}
                  >
                    <img
                      src={img.image_url}  // 🔥 FIXED: use image_url instead of manual path
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '📦';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details - unchanged */}
          <div>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full">
              {product.category?.name}
            </span>

            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-3 mb-2">{product.title}</h1>

            <p className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-4">
              UGX {Number(product.price).toLocaleString()}
            </p>

            <div className="flex flex-wrap gap-2 mb-5">
              <span className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 text-xs px-3 py-1.5 rounded-full font-medium">
                Condition: {product.condition}
              </span>
              <span className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 text-xs px-3 py-1.5 rounded-full font-medium">
                {product.subCategory?.sub_category_name}
              </span>
            </div>

            <div className="mb-5">
              <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 text-sm">Description</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{product.description}</p>
            </div>

            {product.specification && (
              <div className="mb-5">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2 text-sm">Specifications</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed bg-gray-50 dark:bg-slate-800/60 rounded-xl p-3">
                  {product.specification}
                </p>
              </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-100">
              <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 text-sm uppercase tracking-wide">Seller Info</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                  {product.seller?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-100">{product.seller?.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">📍 {product.seller?.location || 'Uganda'}</p>
                </div>
              </div>
              {!isSeller && (
                <div className="space-y-1.5">
                  {product.seller?.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400 dark:text-gray-500">📞</span>
                      <a href={`tel:${product.seller.phone}`} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                        {product.seller.phone}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message seller - unchanged */}
        {showMessageSection ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Message the Seller</h3>

            {sent ? (
              <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/50 rounded-xl px-4 py-4 flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-semibold text-green-700 dark:text-green-400">Message sent!</p>
                  <p className="text-green-600 dark:text-green-400 text-sm">The seller will get back to you soon.</p>
                </div>
                <button
                  onClick={() => setSent(false)}
                  className="ml-auto text-green-600 dark:text-green-400 text-sm hover:underline"
                >
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-4">
                {msgError && (
                  <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl">
                    {msgError}
                  </div>
                )}
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                  required
                  placeholder={`Hi, I'm interested in "${product.title}". Is it still available?`}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                >
                  {sending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : '💬 Send Message'}
                </button>
              </form>
            )}
          </div>
        ) : !isSeller && !canSendMessage ? (
          <div className="bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">You don't have permission to send messages.</p>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}