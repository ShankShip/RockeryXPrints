// src/services/api.js
// Axios instance wired to the backend API
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});

// Recursively convert any http://res.cloudinary.com URLs to https://res.cloudinary.com
const convertHttpToHttps = (data) => {
    if (!data) return data;
    if (typeof data === 'string') {
        return data.replace(/^http:\/\/res\.cloudinary\.com/gi, 'https://res.cloudinary.com');
    }
    if (Array.isArray(data)) {
        return data.map(convertHttpToHttps);
    }
    if (typeof data === 'object' && data !== null) {
        const sanitized = {};
        for (const key of Object.keys(data)) {
            sanitized[key] = convertHttpToHttps(data[key]);
        }
        return sanitized;
    }
    return data;
};

api.interceptors.response.use(
    (response) => {
        if (response && response.data) {
            response.data = convertHttpToHttps(response.data);
        }
        return response;
    },
    (error) => Promise.reject(error)
);

// ─── Health check ─────────────────────────────────────────────────────────
export const checkHealthAPI = (timeoutMs = 120000) => api.get('/health', { timeout: timeoutMs });

// ─── Auth ──────────────────────────────────────────────────────────────────
export const registerUser = (data) => api.post('/users/register', data);
export const loginUser = (data) => api.post('/users/login', data);
export const logoutUser = () => api.get('/users/logout');
export const getCurrentUser = () => api.get('/users/current-user');
export const updateDetails = (data) => api.post('/users/update-details', data);
export const changePassword = (data) => api.post('/users/change-password', data);
export const updateAvatarAPI = (data) => api.post('/users/update-avatar', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const sendVerificationOtpAPI = () => api.post('/users/send-verification-otp');
export const verifyEmailOtpAPI = (otp) => api.post('/users/verify-otp', { otp });
export const sendPasswordChangeOtpAPI = () => api.post('/users/send-password-change-otp');
export const changePasswordWithOtpAPI = (otp, newPassword) => api.post('/users/change-password-with-otp', { otp, newPassword });

// ─── Cart ──────────────────────────────────────────────────────────────────
export const getUserCart = () => api.get('/users/cart');
export const addToCartAPI = (data) => api.post('/users/add-cart', data);
export const updateCartQuantityAPI = (productId, quantity) => api.post('/users/update-cart-qty', { productId, quantity });
export const removeFromCartAPI = (productId) => api.delete(`/users/remove-cart/${productId}`);

// ─── Products ──────────────────────────────────────────────────────────────
export const getCategories = (isAdmin = false) => isAdmin ? api.get('/prods/admin/categories') : api.get('/prods/categories');
export const getCollections = (isAdmin = false) => isAdmin ? api.get('/prods/admin/collections') : api.get('/prods/collections');
export const getProducts = (params) => api.get('/prods/products', { params });
export const getProductBySlug = (slug) => api.get(`/prods/products/${slug}`);
export const addCategoryAPI = (data) => api.post('/prods/add-category', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateCategoryAPI = (categoryId, data) => api.post(`/prods/update-category/${categoryId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteCategoryAPI = (categoryId) => api.delete(`/prods/delete-category/${categoryId}`);
export const addCollectionAPI = (data) => api.post('/prods/add-collection', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateCollectionAPI = (collectionId, data) => api.post(`/prods/update-collection/${collectionId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteCollectionAPI = (collectionId) => api.delete(`/prods/delete-collection/${collectionId}`);
export const addProductAPI = (data) => api.post('/prods/add-product', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateProductAPI = (productId, data) => api.post(`/prods/update-product/${productId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteProductAPI = (productId) => api.delete(`/prods/delete-product/${productId}`);

// ─── Reviews ───────────────────────────────────────────────────────────────
export const addOrUpdateReviewAPI = (productId, data) => api.post(`/prods/products/${productId}/reviews`, data);
export const getProductReviewsAPI = (productId) => api.get(`/prods/products/${productId}/reviews`);
export const deleteReviewAPI = (reviewId) => api.delete(`/prods/reviews/${reviewId}`);

// ─── Orders ────────────────────────────────────────────────────────────────
export const createOrder = (data) => api.post('/orders/create', data);
export const getOrders = () => api.get('/orders/get-orders');
export const getOrderByIdAPI = (orderId) => api.get(`/orders/${orderId}`);
export const cancelMyOrderAPI = (orderId) => api.patch(`/orders/cancel/${orderId}`);
export const getAllOrdersAPI = () => api.get('/orders/get-all-orders');
export const updateOrderStatusAPI = (orderId, data) => api.patch(`/orders/update-status/${orderId}`, data);

export default api;
