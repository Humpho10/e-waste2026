import api from './axios';

// Public
export const browseProducts  = (params) => api.get('/products', { params });
export const getProduct      = (slug, hashId) => api.get(`/products/${slug}-${hashId}`);
export const getCategories   = ()        => api.get('/categories');

// Seller
// NOTE: don't set Content-Type here — the browser must generate its own
// "multipart/form-data; boundary=..." header for FormData bodies. Forcing
// a bare 'multipart/form-data' string (no boundary) makes the server
// unable to parse the file parts, so uploaded images silently vanish.
export const createProduct = (data) => api.post('/products', data);
export const updateProduct   = (hashId, data) => api.put(`/products/${hashId}`, data);
export const deleteProduct   = (hashId)       => api.delete(`/products/${hashId}`);
export const myListings      = (params)   => api.get('/products/my/listings', { params });

export const resubmitProduct = (hashId, data) => api.post(`/products/${hashId}/resubmit`, data);

// Messages
export const sendMessage     = (hashId, data) => api.post(`/products/${hashId}/messages`, data);
export const getMessages     = (hashId)       => api.get(`/products/${hashId}/messages`);

export const getUserProfile    = ()     => api.get('/profile');
export const updateUserProfile = (data) => api.post('/profile', data);

// ── Homepage stats & photo search ──────────────────────────
export const getStats = () => api.get('/stats');

// Public settings — powers the storefront maintenance banner/branding.
export const getPublicSettings = () => api.get('/settings/public');

// Sends the photo to POST /api/search/image (Hugging Face image
// classification on the backend), which returns matching labels + listings.
export const searchByImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post('/search/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};