import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Checkout from './Checkout';
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

test('renders checkout form when authenticated with items in cart', () => {
  const initialState = {
    auth: {
      isAuthenticated: true,
      user: { first_name: 'Тест' }
    },
    cart: {
      items: [
        {
          id: 1,
          product: { id: 1, name: 'Тестовый товар' },
          quantity: 2,
          price: 100
        }
      ],
      total: 200,
      count: 2
    }
  };
  
  renderWithProviders(<Checkout />, initialState);
  
  const checkoutTitle = screen.getByText('Оформление заказа');
  const stepIndicator = screen.getByText('1');
  const addressLabel = screen.getByText('Адрес доставки *');
  
  expect(checkoutTitle).toBeInTheDocument();
  expect(stepIndicator).toBeInTheDocument();
  expect(addressLabel).toBeInTheDocument();
});

test('shows step indicator with correct active step', () => {
  const initialState = {
    auth: {
      isAuthenticated: true,
      user: { first_name: 'Тест' }
    },
    cart: {
      items: [{ id: 1, product: { name: 'Test' }, quantity: 1, price: 100 }],
      total: 100,
      count: 1
    }
  };
  
  renderWithProviders(<Checkout />, initialState);
  
  const step1 = screen.getByText('1');
  const step2 = screen.getByText('2');
  const step3 = screen.getByText('3');
  
  expect(step1).toBeInTheDocument();
  expect(step2).toBeInTheDocument();
  expect(step3).toBeInTheDocument();
});