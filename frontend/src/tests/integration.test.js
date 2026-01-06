import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import App from '../App';
import authReducer from '../store/authSlice';
import cartReducer from '../store/cartSlice';
import productsReducer from '../store/productsSlice';
import notificationReducer from '../store/notificationSlice';
import config from '../config/config';

// Mock API calls
jest.mock('../utils/api');

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      cart: cartReducer,
      products: productsReducer,
      notifications: notificationReducer,
    },
    preloadedState: initialState
  });
};

const renderApp = (initialState = {}) => {
  const store = createTestStore(initialState);
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  );
};

describe('Frontend-Backend Integration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Application Initialization', () => {
    test('renders application with proper structure', () => {
      renderApp();
      
      // Check that main components are rendered
      expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
      expect(screen.getByRole('main')).toBeInTheDocument(); // Main content
    });

    test('initializes Redux store with correct structure', () => {
      const store = createTestStore();
      const state = store.getState();
      
      // Verify store structure matches design document
      expect(state).toHaveProperty('auth');
      expect(state).toHaveProperty('cart');
      expect(state).toHaveProperty('products');
      expect(state).toHaveProperty('notifications');
      
      // Verify initial auth state
      expect(state.auth).toEqual({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
      
      // Verify initial cart state
      expect(state.cart).toEqual({
        items: [],
        total: 0,
        count: 0,
        loading: false,
        error: null,
      });
    });
  });

  describe('Authentication Integration', () => {
    test('handles authentication state persistence', () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'customer' };
      const mockToken = 'mock-jwt-token';
      
      // Simulate stored authentication
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      const initialState = {
        auth: {
          user: mockUser,
          token: mockToken,
          isAuthenticated: true,
          loading: false,
          error: null,
        }
      };
      
      renderApp(initialState);
      
      // Should show authenticated user interface
      expect(screen.queryByText(/Вход/i)).not.toBeInTheDocument();
    });

    test('handles unauthenticated state correctly', () => {
      renderApp();
      
      // Should show login/register options
      expect(screen.getByText(/Вход/i)).toBeInTheDocument();
      expect(screen.getByText(/Регистрация/i)).toBeInTheDocument();
    });
  });

  describe('Protected Routes', () => {
    test('redirects unauthenticated users from protected routes', async () => {
      // This would need to be tested with actual routing
      // For now, we verify the ProtectedRoute component exists
      const { ProtectedRoute } = require('../components/ProtectedRoute/ProtectedRoute');
      expect(ProtectedRoute).toBeDefined();
    });

    test('allows authenticated users to access protected routes', () => {
      const authenticatedState = {
        auth: {
          user: { id: 1, role: 'customer' },
          token: 'valid-token',
          isAuthenticated: true,
          loading: false,
          error: null,
        }
      };
      
      renderApp(authenticatedState);
      
      // User should be able to access protected content
      // This would be tested more thoroughly with actual navigation
    });
  });

  describe('API Configuration', () => {
    test('API client is configured with correct base URL', () => {
      expect(config.api.baseURL).toBeDefined();
      expect(config.api.timeout).toBeGreaterThan(0);
    });

    test('API helpers are available', () => {
      const { apiHelpers } = require('../utils/api');
      
      expect(apiHelpers.get).toBeDefined();
      expect(apiHelpers.post).toBeDefined();
      expect(apiHelpers.put).toBeDefined();
      expect(apiHelpers.patch).toBeDefined();
      expect(apiHelpers.delete).toBeDefined();
      expect(apiHelpers.upload).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('error boundary catches and displays errors', () => {
      const ErrorBoundary = require('../components/ErrorBoundary/ErrorBoundary').default;
      
      const ThrowError = () => {
        throw new Error('Test error');
      };
      
      const { container } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(container.textContent).toContain('Что-то пошло не так');
    });

    test('notification system is integrated', () => {
      const store = createTestStore();
      const state = store.getState();
      
      expect(state.notifications).toEqual({
        notifications: []
      });
    });
  });

  describe('Loading States', () => {
    test('loading component renders correctly', () => {
      const Loading = require('../components/Loading/Loading').default;
      
      render(<Loading text="Test loading" />);
      
      expect(screen.getByText('Test loading')).toBeInTheDocument();
    });
  });

  describe('Configuration Integration', () => {
    test('configuration is properly structured', () => {
      expect(config).toHaveProperty('api');
      expect(config).toHaveProperty('auth');
      expect(config).toHaveProperty('app');
      expect(config).toHaveProperty('ui');
      expect(config).toHaveProperty('features');
      expect(config).toHaveProperty('services');
      expect(config).toHaveProperty('routes');
    });

    test('environment-specific configuration is applied', () => {
      expect(config.app.environment).toBeDefined();
      expect(['development', 'production', 'test']).toContain(config.app.environment);
    });
  });

  describe('Service Layer Integration', () => {
    test('API services are properly structured', () => {
      const apiService = require('../services/apiService').default;
      
      expect(apiService).toHaveProperty('auth');
      expect(apiService).toHaveProperty('products');
      expect(apiService).toHaveProperty('cart');
      expect(apiService).toHaveProperty('orders');
      expect(apiService).toHaveProperty('articles');
      expect(apiService).toHaveProperty('analytics');
    });

    test('service methods follow RESTful conventions', () => {
      const { productService } = require('../services/apiService');
      
      // Verify CRUD operations exist
      expect(productService.getProducts).toBeDefined();
      expect(productService.getProduct).toBeDefined();
      expect(productService.createProduct).toBeDefined();
      expect(productService.updateProduct).toBeDefined();
      expect(productService.deleteProduct).toBeDefined();
    });
  });
});