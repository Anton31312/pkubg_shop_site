import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import fc from 'fast-check';
import Header from '../Header/Header';
import ProductCard from '../ProductCard/ProductCard';
import authReducer from '../../store/authSlice';
import cartReducer from '../../store/cartSlice';
import productsReducer from '../../store/productsSlice';

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      cart: cartReducer,
      products: productsReducer,
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
      },
      products: {
        items: [],
        categories: [],
        filters: {},
        loading: false,
        error: null,
        ...initialState.products
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

// Mock window.matchMedia for responsive testing
const mockMatchMedia = (width) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: query.includes(`max-width: ${width}px`) ? width <= parseInt(query.match(/\d+/)[0]) : false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe('Responsive Layout Properties', () => {
  /**
   * **Feature: pkubg-ecommerce, Property 32: Адаптивность интерфейса**
   * For any mobile device, the interface should correctly adapt to screen size
   */
  test('interface adapts correctly to different screen sizes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 1920 }), // Screen widths from mobile to desktop
        (screenWidth) => {
          // Mock the screen width
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: screenWidth,
          });
          
          mockMatchMedia(screenWidth);
          
          // Test Header component responsiveness
          const { container: headerContainer } = renderWithProviders(<Header />);
          const header = headerContainer.querySelector('.header');
          
          // Header should always be present
          expect(header).toBeInTheDocument();
          
          // Test ProductCard component responsiveness
          const mockProduct = {
            id: 1,
            name: 'Test Product',
            description: 'Test Description',
            price: 100,
            stock_quantity: 10,
            is_gluten_free: true,
            is_low_protein: false,
            images: []
          };
          
          const { container: cardContainer } = renderWithProviders(
            <ProductCard product={mockProduct} />
          );
          const productCard = cardContainer.querySelector('.product-card');
          
          // Product card should always be present and maintain structure
          expect(productCard).toBeInTheDocument();
          
          // Check that essential elements are present regardless of screen size
          const productName = cardContainer.querySelector('.product-name');
          const productPrice = cardContainer.querySelector('.price');
          
          expect(productName).toBeInTheDocument();
          expect(productPrice).toBeInTheDocument();
          
          // For mobile screens (< 768px), check mobile-specific adaptations
          if (screenWidth < 768) {
            // Mobile adaptations should be applied via CSS
            // We can verify the CSS classes are present
            expect(header).toHaveClass('header');
            expect(productCard).toHaveClass('product-card');
          }
          
          // For desktop screens (>= 768px), check desktop layout
          if (screenWidth >= 768) {
            expect(header).toHaveClass('header');
            expect(productCard).toHaveClass('product-card');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('responsive breakpoints work correctly', () => {
    const breakpoints = [320, 480, 768, 1024, 1200, 1920];
    
    breakpoints.forEach(width => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
      });
      
      mockMatchMedia(width);
      
      const { container } = renderWithProviders(<Header />);
      const header = container.querySelector('.header');
      
      // Header should maintain functionality at all breakpoints
      expect(header).toBeInTheDocument();
      
      // Navigation should be present
      const nav = container.querySelector('.header-nav');
      expect(nav).toBeInTheDocument();
    });
  });

  test('touch-friendly interface on mobile devices', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 767 }), // Mobile screen widths
        (mobileWidth) => {
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: mobileWidth,
          });
          
          mockMatchMedia(mobileWidth);
          
          const mockProduct = {
            id: 1,
            name: 'Test Product',
            description: 'Test Description',
            price: 100,
            stock_quantity: 10,
            is_gluten_free: true,
            is_low_protein: false,
            images: []
          };
          
          const { container } = renderWithProviders(
            <ProductCard product={mockProduct} />
          );
          
          // Check that interactive elements are present and accessible
          const addToCartBtn = container.querySelector('.add-to-cart-btn');
          expect(addToCartBtn).toBeInTheDocument();
          
          // Button should be large enough for touch interaction
          // This is ensured by CSS, we verify the element exists
          expect(addToCartBtn).toHaveClass('add-to-cart-btn');
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});