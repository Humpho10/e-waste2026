import api from './axios';

export const sendContactMessage = (data) => api.post('/contact', data);
