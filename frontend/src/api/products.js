import api from './axios';

// Public
export const browseProducts  = (params) => api.get('/products', { params });
export const getProduct      = (id)      => api.get(`/products/${id}`);
export const getCategories   = ()        => api.get('/categories');

// Seller
export const createProduct = (data) => api.post('/products', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateProduct   = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct   = (id)       => api.delete(`/products/${id}`);
export const myListings      = (params)   => api.get('/products/my/listings', { params });

export const resubmitProduct = (id, data) => api.post(`/products/${id}/resubmit`, data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Messages
export const sendMessage     = (id, data) => api.post(`/products/${id}/messages`, data);
export const getMessages     = (id)       => api.get(`/products/${id}/messages`);

export const getUserProfile    = ()     => api.get('/profile');
export const updateUserProfile = (data) => api.post('/profile', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// ── Homepage stats & photo search ──────────────────────────
// TODO: build matching Laravel routes/controllers for these.
// Until then, HomePage's .catch() fallback (SAMPLE_CATEGORIES/
// SAMPLE_PRODUCTS/statsError) will handle these gracefully.


// ── Homepage stats & photo search ──────────────────────────
export const getStats = () => api.get('/stats');

// TODO: build matching Laravel route/controller for image search
export const searchByImage = () =>
  Promise.reject(new Error('Image search not implemented yet'));