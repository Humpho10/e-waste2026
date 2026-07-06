import api from './axios';

// Public
export const browseProducts  = (params) => api.get('/products', { params });
export const getProduct      = (slug, hashId) => api.get(`/products/${slug}-${hashId}`); // CHANGED
export const getCategories   = () => api.get('/categories');

// Seller
export const createProduct = (data) => api.post('/products', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateProduct   = (hashId, data) => api.post(`/products/${hashId}/update`, data); // CHANGED
export const deleteProduct   = (hashId) => api.delete(`/products/${hashId}`); // CHANGED
export const myListings      = (params) => api.get('/products/my/listings', { params });

export const resubmitProduct = (hashId, data) => api.post(`/products/${hashId}/resubmit`, data, { // CHANGED
  headers: { 'Content-Type': 'multipart/form-data' }
});

// Messages
export const sendMessage     = (hashId, data) => api.post(`/products/${hashId}/messages`, data); // CHANGED
export const getMessages     = (hashId) => api.get(`/products/${hashId}/messages`); // CHANGED

export const getUserProfile    = () => api.get('/profile');
export const updateUserProfile = (data) => api.post('/profile', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// ── Homepage stats & photo search ──────────────────────────
export const getStats = () => api.get('/stats');

// TODO: build matching Laravel route/controller for image search
export const searchByImage = () =>
  Promise.reject(new Error('Image search not implemented yet'));