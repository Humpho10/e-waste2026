import api from './axios';

export const getPMStats        = (params)   => api.get('/pm/stats', { params });
export const getPMProducts     = (params)   => api.get('/pm/products', { params });
export const getPMProduct      = (id)       => api.get(`/pm/products/${id}`);
export const approvePMProduct  = (id)       => api.patch(`/pm/products/${id}/approve`);
export const rejectPMProduct   = (id, data) => api.patch(`/pm/products/${id}/reject`, data);
export const getPMMessages     = ()         => api.get('/pm/messages');
export const getPMNotifications = ()        => api.get('/pm/notifications');
export const markPMNotifRead   = (id)       => api.patch(`/pm/notifications/${id}/read`);
export const markAllPMNotifsRead = ()       => api.patch('/pm/notifications/read-all');

export const getPMProfile    = ()     => api.get('/pm/profile');
// Don't force Content-Type here — see api/products.js for why.
export const updatePMProfile = (data) => api.post('/pm/profile', data);
export const getPMMessageCount = () => api.get('/messages/unread-count');