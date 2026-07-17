import axios from 'axios';
console.log('API URL:', import.meta.env.VITE_API_URL);

// Don't set a default Content-Type here. Axios already adds
// "application/json" automatically for plain object payloads. Forcing it
// as a blanket default instead makes axios's FormData detection think
// every request wants JSON — including multipart FormData uploads (product
// images, avatars) — so it JSON-stringifies the FormData and silently
// drops any File objects inside it instead of sending real multipart data.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Accept': 'application/json',
  }
});

// The backend's public origin (no trailing /api), for building URLs to
// storage/uploaded files — e.g. "https://host/backend/public/api" ->
// "https://host/backend/public". Derived from the same env var as the API
// client so there's one place to change per environment.
export const STORAGE_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
export const storageUrl = (path) => path ? `${STORAGE_BASE_URL}/storage/${path}` : null;

// Automatically attach the token to every request if it exists
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Set by the app while an intentional, user-initiated logout is in
// progress (see AdminLayout's goodbye-screen flow). While true, the 401
// handler below stays quiet instead of hard-redirecting to /login —
// otherwise a background poll (badge counts, notifications, etc.) that
// happens to fire after the server has already revoked the token, but
// before our own delayed redirect runs, would hijack navigation straight
// to the login page instead of the intended destination.
let intentionalLogout = false;
export function setIntentionalLogout(value) {
  intentionalLogout = value;
}

// Automatically handle 401 (token expired or invalid)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('permissions');
      if (!intentionalLogout) {
        sessionStorage.setItem('authNotice', 'expired');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;