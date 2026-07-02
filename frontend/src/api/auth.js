import api from './axios';

export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser    = (data) => api.post('/auth/login', data);
export const logoutUser   = ()     => api.post('/auth/logout');
export const getMe        = ()     => api.get('/auth/me');
export const googleAuth   = (credential) => api.post('/auth/google', { credential });

export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword  = (data)  => api.post('/auth/reset-password', data);