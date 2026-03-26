import axios from 'axios';
import config from '../config/config';

// Create axios instance
const api = axios.create({
  baseURL: config.api.baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: config.api.timeout,
});

// Request interceptor — добавляет токен и metadata
api.interceptors.request.use(
  (reqConfig) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }
    
    reqConfig.metadata = { startTime: new Date() };
    
    return reqConfig;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (response.config.metadata) {
      const duration = new Date() - response.config.metadata.startTime;
      if (duration > 2000) {
        console.warn(`Slow API request: ${response.config.url} took ${duration}ms`);
      }
    }
    return response;
  },
  (error) => {
    const { response, request } = error;

    if (response) {
      const { status } = response;

      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      // Пробрасываем оригинальную ошибку с данными сервера
      return Promise.reject(error);

    } else if (request) {
      console.error('Network error:', error.message);
      return Promise.reject({
        response: {
          data: {
            message: 'Ошибка сети. Проверьте подключение к интернету.',
            type: 'NETWORK_ERROR'
          }
        }
      });
    } else {
      console.error('Request setup error:', error.message);
      return Promise.reject(error);
    }
  }
);

// Helper functions
export const apiHelpers = {
  get: (url, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return api.get(fullUrl);
  },
  post: (url, data = {}) => api.post(url, data),
  put: (url, data = {}) => api.put(url, data),
  patch: (url, data = {}) => api.patch(url, data),
  delete: (url, data = null) => data ? api.delete(url, { data }) : api.delete(url),
  upload: (url, formData, onProgress = null) => {
    return api.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    });
  },
};

export default api;