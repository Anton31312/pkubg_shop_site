/**
 * Frontend configuration
 * Centralized configuration for the React application
 */

const config = {
  // API Configuration
  api: {
    baseURL: process.env.REACT_APP_API_URL || '/api',
    timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000,
    retryAttempts: parseInt(process.env.REACT_APP_API_RETRY_ATTEMPTS) || 3,
    retryDelay: parseInt(process.env.REACT_APP_API_RETRY_DELAY) || 1000,
  },

  // Authentication Configuration
  auth: {
    tokenKey: 'token',
    userKey: 'user',
    refreshTokenKey: 'refreshToken',
    tokenExpirationBuffer: 5 * 60 * 1000, // 5 minutes in milliseconds
  },

  // Application Configuration
  app: {
    name: 'Pkubg E-commerce',
    version: process.env.REACT_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    debug: process.env.NODE_ENV === 'development',
  },

  // UI Configuration
  ui: {
    itemsPerPage: 20,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    notificationDuration: 5000,
    loadingDelay: 300, // Delay before showing loading spinner
  },

  // Feature Flags
  features: {
    enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
    enablePWA: process.env.REACT_APP_ENABLE_PWA === 'true',
    enableOfflineMode: process.env.REACT_APP_ENABLE_OFFLINE === 'true',
    enableDarkMode: process.env.REACT_APP_ENABLE_DARK_MODE === 'true',
  },

  // External Services
  services: {
    yookassa: {
      enabled: process.env.REACT_APP_YOOKASSA_ENABLED === 'true',
      shopId: process.env.REACT_APP_YOOKASSA_SHOP_ID,
      testMode: process.env.REACT_APP_YOOKASSA_TEST_MODE === 'true',
    },
    cdek: {
      enabled: process.env.REACT_APP_CDEK_ENABLED === 'true',
      testMode: process.env.REACT_APP_CDEK_TEST_MODE === 'true',
    },
  },

  // Performance Configuration
  performance: {
    enableLazyLoading: true,
    enableImageOptimization: true,
    enableCodeSplitting: true,
    chunkSize: 244 * 1024, // 244KB
  },

  // Security Configuration
  security: {
    enableCSP: true,
    enableXSSProtection: true,
    enableClickjacking: true,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  // Cache Configuration
  cache: {
    enableServiceWorker: process.env.NODE_ENV === 'production',
    cacheVersion: 'v1',
    staticCacheDuration: 24 * 60 * 60 * 1000, // 24 hours
    apiCacheDuration: 5 * 60 * 1000, // 5 minutes
  },

  // Validation Rules
  validation: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+]?[1-9][\d]{0,15}$/,
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
    },
  },

  // Routes Configuration
  routes: {
    public: ['/', '/products', '/articles', '/about', '/contact'],
    auth: ['/login', '/register'],
    protected: ['/cart', '/profile', '/checkout'],
    admin: ['/admin'],
    manager: ['/manage'],
  },

  // Error Messages
  errors: {
    network: 'Ошибка сети. Проверьте подключение к интернету.',
    unauthorized: 'Необходимо войти в систему.',
    forbidden: 'Недостаточно прав доступа.',
    notFound: 'Запрашиваемый ресурс не найден.',
    serverError: 'Ошибка сервера. Попробуйте позже.',
    validation: 'Проверьте правильность введенных данных.',
    timeout: 'Превышено время ожидания запроса.',
  },
};

// Environment-specific overrides
if (config.app.environment === 'production') {
  config.api.timeout = 15000;
  config.ui.notificationDuration = 3000;
  config.performance.enableLazyLoading = true;
}

if (config.app.environment === 'development') {
  config.ui.notificationDuration = 10000;
  config.security.maxLoginAttempts = 10;
}

export default config;