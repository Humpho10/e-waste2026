import api from './axios';

export const getConversations = ()       => api.get('/messages');
export const getProductMessages = (id)   => api.get(`/messages/${id}`);
export const sendMessage      = (data)   => api.post('/messages', data);
export const markMessageRead  = (id)     => api.patch(`/messages/${id}/read`);
export const unreadCount      = ()       => api.get('/messages/unread-count');