// Central place to build backend URLs so nothing hardcodes localhost.
// VITE_API_URL is e.g. "http://localhost:8000/api" in dev or
// "https://ewasteapi.nwtdemos.com/backend/public/api" in production —
// stripping the trailing /api yields the origin that serves /storage.
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const API_ORIGIN = apiUrl.replace(/\/api\/?$/, '');

// Public URL for a file on Laravel's public storage disk.
// Accepts a bare path ("products/abc.jpg"), a full URL, or null.
export const storageUrl = (path) => {
  if (!path) return null;
  const p = String(path);
  return p.startsWith('http') ? p : `${API_ORIGIN}/storage/${p}`;
};
