import api from './axios';

// Stats
export const getManagerStats = () => api.get('/manager/stats');
export const getManagerTrends = () => api.get('/manager/stats/trends');

// Users
export const getManagerUsers = (params) => api.get('/manager/users', { params });
export const listUsers = (params) => api.get('/manager/users', { params });
export const activateUser = (id) => api.patch(`/manager/users/${id}/activate`);
export const deactivateUser = (id) => api.patch(`/manager/users/${id}/deactivate`);

// Product Managers
export const getProductManagers = () => api.get('/manager/product-managers');
export const createProductManager = (data) => api.post('/manager/product-managers', data);
export const updateProductManager = (id, data) => api.put(`/manager/product-managers/${id}`, data);
export const deleteProductManager = (id) => api.delete(`/manager/product-managers/${id}`);

// Assignments
export const assignCategory = (data) => api.post('/manager/assignments', data);
export const removeAssignment = (id) => api.delete(`/manager/assignments/${id}`);

// Categories
export const getManagerCategories = () => api.get('/manager/categories');
export const createCategory = (data) => api.post('/manager/categories', data);
export const updateCategory = (id, data) => api.put(`/manager/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/manager/categories/${id}`);

// Subcategories
export const addSubcategory = (catId, data) => api.post(`/manager/categories/${catId}/subcategories`, data);
export const removeSubcategory = (id) => api.delete(`/manager/subcategories/${id}`);

// Products
export const getManagerProducts = (params) => api.get('/manager/products', { params });
export const viewManagerProduct = (id) => api.get(`/manager/products/${id}`);
export const approveProduct = (id) => api.patch(`/manager/products/${id}/approve`);
export const rejectProduct = (id, data) => api.patch(`/manager/products/${id}/reject`, data);

// Profile
export const getManagerProfile = () => api.get('/manager/profile');
export const updateManagerProfile = (data) => api.post('/manager/profile', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});