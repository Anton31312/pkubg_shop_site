import { apiHelpers } from '../utils/api';

/**
 * Centralized API service layer following RESTful principles
 * Provides consistent interface for all backend interactions
 */

// Authentication services
export const authService = {
  login: (credentials) => apiHelpers.post('/auth/login/', credentials),
  register: (userData) => apiHelpers.post('/auth/register/', userData),
  logout: () => apiHelpers.post('/auth/logout/'),
  refreshToken: (refreshToken) => apiHelpers.post('/auth/refresh/', { refresh: refreshToken }),
  getProfile: () => apiHelpers.get('/auth/profile/'),
  updateProfile: (profileData) => apiHelpers.put('/auth/profile/', profileData),
};

// Product services
export const productService = {
  getProducts: (params = {}) => apiHelpers.get('/products/', params),
  getProduct: (id) => apiHelpers.get(`/products/${id}/`),
  createProduct: (productData) => apiHelpers.post('/products/', productData),
  updateProduct: (id, productData) => apiHelpers.put(`/products/${id}/`, productData),
  deleteProduct: (id) => apiHelpers.delete(`/products/${id}/`),
  getCategories: () => apiHelpers.get('/products/categories/'),
  uploadProductImage: (productId, imageFile, onProgress) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('product_id', productId);
    return apiHelpers.upload('/products/images/', formData, onProgress);
  },
};

// Cart services
export const cartService = {
  getCart: () => apiHelpers.get('/cart/'),
  addToCart: (productId, quantity = 1) => apiHelpers.post('/cart/add/', { 
    product_id: productId, 
    quantity 
  }),
  updateCartItem: (itemId, quantity) => apiHelpers.put('/cart/update/', { 
    item_id: itemId, 
    quantity 
  }),
  removeFromCart: (itemId) => apiHelpers.delete('/cart/remove/', { item_id: itemId }),
  clearCart: () => apiHelpers.delete('/cart/clear/'),
};

// Order services
export const orderService = {
  getOrders: (params = {}) => apiHelpers.get('/orders/', params),
  getOrder: (id) => apiHelpers.get(`/orders/${id}/`),
  createOrder: (orderData) => apiHelpers.post('/orders/create/', orderData),
  updateOrderStatus: (id, status) => apiHelpers.patch(`/orders/${id}/`, { status }),
  cancelOrder: (id) => apiHelpers.patch(`/orders/${id}/cancel/`),
};

// Article services
export const articleService = {
  getArticles: (params = {}) => apiHelpers.get('/articles/articles/', params),
  getArticle: (slug) => apiHelpers.get(`/articles/articles/${slug}/`),
  createArticle: (articleData) => apiHelpers.post('/articles/articles/', articleData),
  updateArticle: (slug, articleData) => apiHelpers.put(`/articles/articles/${slug}/`, articleData),
  deleteArticle: (id) => apiHelpers.delete(`/articles/articles/${id}/`),
  publishArticle: (id) => apiHelpers.post(`/articles/articles/${id}/publish/`),
  unpublishArticle: (id) => apiHelpers.post(`/articles/articles/${id}/unpublish/`),
  getCategories: () => apiHelpers.get('/articles/categories/'),
  getTags: () => apiHelpers.get('/articles/tags/'),
};

// Analytics services
export const analyticsService = {
  getCartStats: () => apiHelpers.get('/analytics/cart-stats/'),
  getOrderStats: (params = {}) => apiHelpers.get('/analytics/order-stats/', params),
  getProductStats: (params = {}) => apiHelpers.get('/analytics/product-stats/', params),
  getUserStats: (params = {}) => apiHelpers.get('/analytics/user-stats/', params),
};

// Payment services (Ю.Касса integration)
export const paymentService = {
  createPayment: (orderData) => apiHelpers.post('/payments/create/', orderData),
  getPaymentStatus: (paymentId) => apiHelpers.get(`/payments/${paymentId}/status/`),
  processWebhook: (webhookData) => apiHelpers.post('/payments/webhook/', webhookData),
};

// Delivery services (СДЭК integration)
export const deliveryService = {
  calculateDelivery: (deliveryData) => apiHelpers.post('/delivery/calculate/', deliveryData),
  getPickupPoints: (address) => apiHelpers.get('/delivery/pickup-points/', { address }),
  createDeliveryOrder: (orderData) => apiHelpers.post('/delivery/create/', orderData),
  trackDelivery: (trackingNumber) => apiHelpers.get(`/delivery/track/${trackingNumber}/`),
};

// File upload service
export const fileService = {
  uploadImage: (file, folder = 'general', onProgress = null) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);
    return apiHelpers.upload('/files/upload/', formData, onProgress);
  },
  deleteFile: (fileId) => apiHelpers.delete(`/files/${fileId}/`),
};

// Search service
export const searchService = {
  searchProducts: (query, filters = {}) => apiHelpers.get('/search/products/', { 
    q: query, 
    ...filters 
  }),
  searchArticles: (query, filters = {}) => apiHelpers.get('/search/articles/', { 
    q: query, 
    ...filters 
  }),
  getSearchSuggestions: (query) => apiHelpers.get('/search/suggestions/', { q: query }),
};

// Export all services as a single object for convenience
const apiService = {
  auth: authService,
  products: productService,
  cart: cartService,
  orders: orderService,
  articles: articleService,
  analytics: analyticsService,
  payments: paymentService,
  delivery: deliveryService,
  files: fileService,
  search: searchService,
  
  // Direct API methods for backward compatibility
  get: apiHelpers.get,
  post: apiHelpers.post,
  put: apiHelpers.put,
  patch: apiHelpers.patch,
  delete: apiHelpers.delete,
  upload: apiHelpers.upload,
};

export default apiService;