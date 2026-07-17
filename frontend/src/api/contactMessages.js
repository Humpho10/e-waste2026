import api from './axios';

export const getContactMessages = (params) => api.get('/manager/contact-messages', { params });
export const getContactMessage  = (id)      => api.get(`/manager/contact-messages/${id}`);
export const replyToContactMessage = (id, replyMessage) =>
  api.post(`/manager/contact-messages/${id}/reply`, { reply_message: replyMessage });
