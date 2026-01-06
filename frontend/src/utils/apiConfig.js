import axios from 'axios';
import config from '../config/config';

// Create axios instance with RESTful configuration
const api = axios.create({
  baseURL: config.api.baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: config.api.timeout,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage instead of store to avoid circular dependency
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and standardize responses
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const endTime = new Date();
    const duration = endTime - response.config.metadata.startTime;
    
    // Log slow requests (> 2 seconds)
    if (duration > 2000) {
      console.warn(`Slow API request: ${response.config.url} took ${duration}ms`);
    }
    
    return response;
  },
  (error) => {
    // Enhanced error handling
    const { response, request, config } = error;
    
    if (response) {
      // Server responded with error status
      const { status, data } = response;
      
      switch (status) {
        case 401:
          // Unauthorized - token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
          
        case 403:
          // Forbidden - insufficient permissions
          console.error('Access denied:', data.message || 'Insufficient permissions');
          break;
          
        case 404:
          // Not found
          console.error('Resource not found:', config.url);
          break;
          
        case 422:
          // Validation error
          console.error('Validation error:', data.errors || data.message);
          break;
          
        case 500:
          // Server error
          console.error('Server error:', data.message || 'Internal server error');
          break;
          
        default:
          console.error(`API Error ${status}:`, data.message || 'Unknown error');
      }
      
      // Standardize error format
      const standardError = {
        status,
        message: data.message || data.detail || `HTTP ${status} Error`,
        errors: data.errors || null,
        code: data.code || null,
      };
      
      return Promise.reject(standardError);
    } else if (request) {
      // Network error
      const networkError = {
        status: 0,
        message: 'Network error - please check your connection',
        errors: null,
        code: 'NETWORK_ERROR',
      };
      
      console.error('Network error:', error.message);
      return Promise.reject(networkError);
    } else {
      // Request setup error
      const setupError = {
        status: 0,
        message: 'Request configuration error',
        errors: null,
        code: 'CONFIG_ERROR',
      };
      
      console.error('Request setup error:', error.message);
      return Promise.reject(setupError);
    }
  }
);

// Helper functions for common API patterns
export const apiHelpers = {
  // GET request with query parameters
  get: (url, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return api.get(fullUrl);
  },
  
  // POST request with data
  post: (url, data = {}) => {
    return api.post(url, data);
  },
  
  // PUT request for updates
  put: (url, data = {}) => {
    return api.put(url, data);
  },
  
  // PATCH request for partial updates
  patch: (url, data = {}) => {
    return api.patch(url, data);
  },
  
  // DELETE request
  delete: (url, data = null) => {
    return data ? api.delete(url, { data }) : api.delete(url);
  },
  
  // Upload file with progress tracking
  upload: (url, formData, onProgress = null) => {
    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
  },
};

export default api;