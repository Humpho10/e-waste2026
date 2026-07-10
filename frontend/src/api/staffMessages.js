import api from './axios';

// Internal staff chat — Super Admin <-> Admin / Product-Manager only.
// Completely separate from the buyer/seller messaging endpoints in
// api/messages.js; a Super Admin never touches those.
export const getStaffContacts      = (params) => api.get('/staff-messages/contacts', { params });
export const getStaffConversations = ()       => api.get('/staff-messages/conversations');
export const getStaffThread        = (userId) => api.get(`/staff-messages/${userId}`);
export const sendStaffMessage      = (data)   => api.post('/staff-messages', data);
export const getStaffUnreadCount   = ()       => api.get('/staff-messages/unread-count');
