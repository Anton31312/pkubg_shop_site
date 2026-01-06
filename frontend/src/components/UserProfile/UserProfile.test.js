import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import UserProfile from './UserProfile';
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
  renderWithProviders(<UserProfile />);
  
  const authMessage = screen.getByText('Требуется авторизация');
  expect(authMessage).toBeInTheDocument();
});

test('renders profile sections when authenticated', () => {
  const initialState = {
    auth: {
      isAuthenticated: true,
      user: { first_name: 'Тест', last_name: 'Пользователь' }
    }
  };
  
  renderWithProviders(<UserProfile />, initialState);
  
  const profileTitle = screen.getByText('Личный кабинет');
  const personalDataSection = screen.getByText('Персональные данные');
  const ordersSection = screen.getByText('История заказов');
  
  expect(profileTitle).toBeInTheDocument();
  expect(personalDataSection).toBeInTheDocument();
  expect(ordersSection).toBeInTheDocument();
});

test('shows no orders message when user has no orders', () => {
  const initialState = {
    auth: {
      isAuthenticated: true,
      user: { first_name: 'Тест' }
    }
  };
  
  renderWithProviders(<UserProfile />, initialState);
  
  // Wait for component to load and show no orders message
  setTimeout(() => {
    const noOrdersMessage = screen.queryByText('У вас пока нет заказов.');
    expect(noOrdersMessage).toBeInTheDocument();
  }, 100);
});