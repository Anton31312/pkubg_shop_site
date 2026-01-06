import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Header from './Header';
import authReducer from '../../store/authSlice';
import cartReducer from '../../store/cartSlice';

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      cart: cartReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        ...initialState.auth
      },
      cart: {
        items: [],
        total: 0,
        count: 0,
        loading: false,
        error: null,
        ...initialState.cart
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

test('renders header with logo', () => {
  renderWithProviders(<Header />);
  const logoElement = screen.getByText(/Pkubg/i);
  expect(logoElement).toBeInTheDocument();
});

test('renders navigation links', () => {
  renderWithProviders(<Header />);
  const catalogLink = screen.getByText(/Каталог/i);
  const articlesLink = screen.getByText(/Статьи/i);
  expect(catalogLink).toBeInTheDocument();
  expect(articlesLink).toBeInTheDocument();
});

test('shows login/register when not authenticated', () => {
  renderWithProviders(<Header />);
  const loginLink = screen.getByText(/Вход/i);
  const registerLink = screen.getByText(/Регистрация/i);
  expect(loginLink).toBeInTheDocument();
  expect(registerLink).toBeInTheDocument();
});

test('shows user menu when authenticated', () => {
  const initialState = {
    auth: {
      isAuthenticated: true,
      user: { first_name: 'Тест' }
    }
  };
  renderWithProviders(<Header />, initialState);
  const userLink = screen.getByText(/Тест/i);
  const logoutButton = screen.getByText(/Выйти/i);
  expect(userLink).toBeInTheDocument();
  expect(logoutButton).toBeInTheDocument();
});

test('displays cart count when items in cart', () => {
  const initialState = {
    cart: {
      count: 3
    }
  };
  renderWithProviders(<Header />, initialState);
  const cartCount = screen.getByText('3');
  expect(cartCount).toBeInTheDocument();
});