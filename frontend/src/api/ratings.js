import api from './axios';

// Logged-in buyer's own rating status for a seller: { can_rate, my_rating, summary }
export const getSellerRatingStatus = (sellerId) => api.get(`/sellers/${sellerId}/rating/me`);

// Submit / update a 1–5 star rating for a seller
export const rateSeller = (sellerId, rating) => api.post(`/sellers/${sellerId}/rating`, { rating });

// Public — top 5 most-rated sellers, for the homepage
export const getTopRatedSellers = () => api.get('/sellers/top-rated');
