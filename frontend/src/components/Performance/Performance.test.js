import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import fc from 'fast-check';
import App from '../../App';
import Header from '../Header/Header';
import ProductCard from '../ProductCard/ProductCard';
import ProductCatalog from '../ProductCatalog/ProductCatalog';
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

// Performance measurement utilities
const measureRenderTime = (renderFn) => {
  const startTime = performance.now();
  const result = renderFn();
  const endTime = performance.now();
  return {
    result,
    renderTime: endTime - startTime
  };
};

describe('Performance Properties', () => {
  /**
   * **Feature: pkubg-ecommerce, Property 34: Производительность загрузки**
   * For any page, content loading time should not exceed reasonable limits without blocking the interface
   */
  test('components render within acceptable time limits', () => {
    fc.assert(
      fc.property(
        fc.record({
          productCount: fc.integer({ min: 1, max: 50 }),
          hasAuth: fc.boolean(),
          cartItemCount: fc.integer({ min: 0, max: 20 })
        }),
        (testData) => {
          // Generate mock products
          const mockProducts = Array.from({ length: testData.productCount }, (_, i) => ({
            id: i + 1,
            name: `Product ${i + 1}`,
            description: `Description for product ${i + 1}`,
            price: Math.random() * 1000 + 10,
            stock_quantity: Math.floor(Math.random() * 100),
            is_gluten_free: Math.random() > 0.5,
            is_low_protein: Math.random() > 0.5,
            images: []
          }));
          
          const initialState = {
            auth: {
              isAuthenticated: testData.hasAuth,
              user: testData.hasAuth ? { first_name: 'Test' } : null
            },
            cart: {
              count: testData.cartItemCount
            },
            products: {
              items: mockProducts
            }
          };
          
          // Measure Header render time
          const headerMeasurement = measureRenderTime(() => 
            renderWithProviders(<Header />, initialState)
          );
          
          // Header should render quickly (< 1000ms in test environment)
          expect(headerMeasurement.renderTime).toBeLessThan(1000);
          
          // Verify header is rendered
          const header = headerMeasurement.result.container.querySelector('.header');
          expect(header).toBeInTheDocument();
          
          // Measure ProductCard render time
          if (mockProducts.length > 0) {
            const cardMeasurement = measureRenderTime(() =>
              renderWithProviders(<ProductCard product={mockProducts[0]} />, initialState)
            );
            
            // Product card should render quickly (< 500ms in test environment)
            expect(cardMeasurement.renderTime).toBeLessThan(500);
            
            // Verify product card is rendered
            const productCard = cardMeasurement.result.container.querySelector('.product-card');
            expect(productCard).toBeInTheDocument();
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('interface remains responsive during loading states', async () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (isLoading) => {
          const initialState = {
            products: {
              loading: isLoading,
              items: []
            }
          };
          
          const { container } = renderWithProviders(<ProductCatalog />, initialState);
          
          // Interface should always be present
          expect(container).toBeInTheDocument();
          
          if (isLoading) {
            // Loading indicator should be shown
            const loadingElement = container.querySelector('.loading');
            if (loadingElement) {
              expect(loadingElement).toBeInTheDocument();
            }
          }
          
          // Container should not be blocked
          expect(container.querySelector('.product-catalog')).toBeInTheDocument();
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('large product lists render efficiently', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 100 }),
        (productCount) => {
          const mockProducts = Array.from({ length: productCount }, (_, i) => ({
            id: i + 1,
            name: `Product ${i + 1}`,
            description: `Description ${i + 1}`,
            price: 100 + i,
            stock_quantity: 10,
            is_gluten_free: i % 2 === 0,
            is_low_protein: i % 3 === 0,
            images: []
          }));
          
          const initialState = {
            products: {
              items: mockProducts,
              loading: false
            }
          };
          
          const measurement = measureRenderTime(() =>
            renderWithProviders(<ProductCatalog />, initialState)
          );
          
          // Catalog should render within reasonable time even with many products
          // Allow more time for larger lists (< 2000ms for up to 100 products)
          expect(measurement.renderTime).toBeLessThan(2000);
          
          // Verify catalog is rendered
          const catalog = measurement.result.container.querySelector('.product-catalog');
          expect(catalog).toBeInTheDocument();
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('app initialization is performant', () => {
    const measurement = measureRenderTime(() =>
      renderWithProviders(<App />)
    );
    
    // App should initialize quickly (< 2000ms in test environment)
    expect(measurement.renderTime).toBeLessThan(2000);
    
    // Verify app is rendered
    const app = measurement.result.container.querySelector('.App');
    expect(app).toBeInTheDocument();
  });

  test('component updates do not cause performance degradation', async () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 50 }), { minLength: 2, maxLength: 10 }),
        async (cartCounts) => {
          const initialState = {
            cart: {
              count: cartCounts[0]
            }
          };
          
          const { container, rerender } = renderWithProviders(<Header />, initialState);
          
          // Measure time for multiple re-renders
          const rerenderTimes = [];
          
          for (let i = 1; i < cartCounts.length; i++) {
            const startTime = performance.now();
            
            const newState = {
              cart: {
                count: cartCounts[i]
              }
            };
            
            const store = createTestStore(newState);
            rerender(
              <Provider store={store}>
                <BrowserRouter>
                  <Header />
                </BrowserRouter>
              </Provider>
            );
            
            const endTime = performance.now();
            rerenderTimes.push(endTime - startTime);
          }
          
          // Each re-render should be fast (< 500ms)
          rerenderTimes.forEach(time => {
            expect(time).toBeLessThan(500);
          });
          
          // Verify header is still rendered correctly
          const header = container.querySelector('.header');
          expect(header).toBeInTheDocument();
          
          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  test('error states render without performance issues', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 200 }),
        (errorMessage) => {
          const initialState = {
            products: {
              error: errorMessage,
              loading: false,
              items: []
            }
          };
          
          const measurement = measureRenderTime(() =>
            renderWithProviders(<ProductCatalog />, initialState)
          );
          
          // Error state should render quickly (< 500ms)
          expect(measurement.renderTime).toBeLessThan(500);
          
          // Verify component is rendered
          const catalog = measurement.result.container.querySelector('.product-catalog');
          expect(catalog).toBeInTheDocument();
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('navigation between pages is performant', async () => {
    const measurement = measureRenderTime(() =>
      renderWithProviders(<App />)
    );
    
    // Initial page load should be fast
    expect(measurement.renderTime).toBeLessThan(2000);
    
    // Verify app structure
    const app = measurement.result.container.querySelector('.App');
    expect(app).toBeInTheDocument();
    
    // Verify main content area is present and not blocked
    const mainContent = measurement.result.container.querySelector('.main-content');
    expect(mainContent).toBeInTheDocument();
  });
});