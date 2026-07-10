import api from './axios';

export const getConversations = ()             => api.get('/messages');
// productId is optional — omit it (or pass null/undefined) for a general
// staff thread with that person, not tied to any listing.
export const getProductMessages = (productId, otherId) =>
  api.get(`/messages/thread/${otherId}`, { params: productId ? { product_id: productId } : {} });
export const sendMessage      = (data)         => api.post('/messages', data); // data may include recipient_id and/or product_id
export const markMessageRead  = (id)     => api.patch(`/messages/${id}/read`);
export const unreadCount      = ()       => api.get('/messages/unread-count');