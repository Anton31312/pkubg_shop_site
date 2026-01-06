import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import ProductCard from './ProductCard';
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

const mockProduct = {
  id: 1,
  name: 'Тестовый товар',
  description: 'Описание тестового товара',
  price: 100,
  stock_quantity: 5,
  is_gluten_free: true,
  is_low_protein: false,
  images: [
    {
      image: '/test-image.jpg',
      alt_text: 'Тестовое изображение',
      is_primary: true
    }
  ],
  nutritional_info: {
    calories: 200,
    protein: 5
  }
};

test('renders product information', () => {
  renderWithProviders(<ProductCard product={mockProduct} />);
  
  const productName = screen.getByText('Тестовый товар');
  const productPrice = screen.getByText(/100/);
  const glutenFreeBadge = screen.getByText('Без глютена');
  
  expect(productName).toBeInTheDocument();
  expect(productPrice).toBeInTheDocument();
  expect(glutenFreeBadge).toBeInTheDocument();
});

test('shows add to cart button when in stock', () => {
  renderWithProviders(<ProductCard product={mockProduct} />);
  
  const addToCartButton = screen.getByText('В корзину');
  expect(addToCartButton).toBeInTheDocument();
});

test('hides add to cart button when out of stock', () => {
  const outOfStockProduct = { ...mockProduct, stock_quantity: 0 };
  renderWithProviders(<ProductCard product={outOfStockProduct} />);
  
  const addToCartButton = screen.queryByText('В корзину');
  const outOfStockOverlay = screen.getByText('Нет в наличии');
  
  expect(addToCartButton).not.toBeInTheDocument();
  expect(outOfStockOverlay).toBeInTheDocument();
});

test('shows stock warning when low stock', () => {
  const lowStockProduct = { ...mockProduct, stock_quantity: 3 };
  renderWithProviders(<ProductCard product={lowStockProduct} />);
  
  const stockWarning = screen.getByText('Осталось: 3');
  expect(stockWarning).toBeInTheDocument();
});

test('displays nutritional information', () => {
  renderWithProviders(<ProductCard product={mockProduct} />);
  
  const calories = screen.getByText('200 ккал');
  const protein = screen.getByText('Белки: 5г');
  
  expect(calories).toBeInTheDocument();
  expect(protein).toBeInTheDocument();
});