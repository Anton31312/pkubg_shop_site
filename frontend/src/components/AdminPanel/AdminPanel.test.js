import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import AdminPanel from './AdminPanel';
import authReducer from '../../store/authSlice';

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        ...initialState.auth
      }
    }
  });
};

const renderWithProviders = (component, initialState = {}) => {
  const store = createTestStore(initialState);
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

test('shows auth required message when not authenticated', () => {
  renderWithProviders(<AdminPanel />);
  
  const authMessage = screen.getByText('Требуется авторизация');
  expect(authMessage).toBeInTheDocument();
});

test('shows access denied for regular users', () => {
  const initialState = {
    auth: {
      isAuthenticated: true,
      user: { role: 'customer' }
    }
  };
  
  renderWithProviders(<AdminPanel />, initialState);
  
  const accessDeniedMessage = screen.getByText('Доступ запрещен');
  expect(accessDeniedMessage).toBeInTheDocument();
});

test('renders admin panel for admin users', () => {
  const initialState = {
    auth: {
      isAuthenticated: true,
      user: { role: 'admin' }
    }
  };
  
  renderWithProviders(<AdminPanel />, initialState);
  
  const panelTitle = screen.getByText('Панель администратора');
  const productsTab = screen.getByText('Товары');
  const articlesTab = screen.getByText('Статьи');
  const analyticsTab = screen.getByText('Аналитика');
  
  expect(panelTitle).toBeInTheDocument();
  expect(productsTab).toBeInTheDocument();
  expect(articlesTab).toBeInTheDocument();
  expect(analyticsTab).toBeInTheDocument();
});

test('renders admin panel for manager users without analytics', () => {
  const initialState = {
    auth: {
      isAuthenticated: true,
      user: { role: 'manager' }
    }
  };
  
  renderWithProviders(<AdminPanel />, initialState);
  
  const panelTitle = screen.getByText('Панель администратора');
  const productsTab = screen.getByText('Товары');
  const articlesTab = screen.getByText('Статьи');
  
  expect(panelTitle).toBeInTheDocument();
  expect(productsTab).toBeInTheDocument();
  expect(articlesTab).toBeInTheDocument();
  
  // Analytics tab should not be visible for managers
  const analyticsTab = screen.queryByText('Аналитика');
  expect(analyticsTab).not.toBeInTheDocument();
});