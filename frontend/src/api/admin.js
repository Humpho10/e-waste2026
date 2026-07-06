import api from './axios';

// Stats
export const getStats          = ()          => api.get('/admin/stats');

// Users
export const getUsers          = (params)    => api.get('/admin/users', { params });
export const createUser        = (data)      => api.post('/admin/users', data);
export const updateUser        = (id, data)  => api.put(`/admin/users/${id}`, data);
export const deleteUser        = (id)        => api.delete(`/admin/users/${id}`);

// Admins
export const getAdmins         = ()          => api.get('/admin/admins');
export const createAdmin       = (data)      => api.post('/admin/admins', data);
export const deleteAdmin       = (id)        => api.delete(`/admin/admins/${id}`);

// Roles
export const getRoles          = ()          => api.get('/admin/roles');
export const createRole        = (data)      => api.post('/admin/roles', data);
export const updateRole        = (id, data)  => api.put(`/admin/roles/${id}`, data);
export const deleteRole        = (id)        => api.delete(`/admin/roles/${id}`);

// Permissions
export const getPermissions    = ()          => api.get('/admin/permissions');
export const createPermission  = (data)      => api.post('/admin/permissions', data);
export const deletePermission  = (id)        => api.delete(`/admin/permissions/${id}`);

// Audit
export const getAuditTrail     = (params)    => api.get('/admin/audit', { params });
export const exportAuditTrail  = (params)    => api.get('/admin/audit/export', { params, responseType: 'blob' });

// Messages (platform-wide oversight — read-only for Super Admin)
export const getAdminMessages       = (params)    => api.get('/admin/messages', { params });
export const getAdminMessageThread  = (productId) => api.get(`/admin/messages/${productId}`);

// System settings
export const getSettings    = ()     => api.get('/admin/settings');
export const updateSettings = (data) => api.put('/admin/settings', data);

export const getAdminProfile    = ()     => api.get('/admin/profile');
export const updateAdminProfile = (data) => api.post('/admin/profile', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});