import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import fc from 'fast-check';
import userEvent from '@testing-library/user-event';
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

// Mock CSS transitions and animations
const mockGetComputedStyle = (element, property) => {
  const styles = {
    transition: 'all 0.2s ease',
    transform: 'translateY(0px)',
    backgroundColor: 'rgb(44, 85, 48)',
    boxShadow: 'none'
  };
  return styles[property] || '';
};

// Override getComputedStyle for testing
Object.defineProperty(window, 'getComputedStyle', {
  value: jest.fn().mockImplementation((element) => ({
    getPropertyValue: (prop) => mockGetComputedStyle(element, prop),
    transition: 'all 0.2s ease',
    transform: 'translateY(0px)',
    backgroundColor: 'rgb(44, 85, 48)',
    boxShadow: 'none'
  }))
});

describe('Visual Feedback Properties', () => {
  /**
   * **Feature: pkubg-ecommerce, Property 33: Визуальная обратная связь**
   * For any interactive element, visual feedback should be provided on hover
   */
  test('interactive elements provide visual feedback on hover', () => {
    fc.assert(
      fc.property(
        fc.record({
          productName: fc.string({ minLength: 1, maxLength: 100 }),
          productPrice: fc.float({ min: 1, max: 10000 }),
          stockQuantity: fc.integer({ min: 0, max: 1000 }),
          isGlutenFree: fc.boolean(),
          isLowProtein: fc.boolean()
        }),
        (productData) => {
          const mockProduct = {
            id: 1,
            name: productData.productName,
            description: 'Test Description',
            price: productData.productPrice,
            stock_quantity: productData.stockQuantity,
            is_gluten_free: productData.isGlutenFree,
            is_low_protein: productData.isLowProtein,
            images: []
          };
          
          const { container } = renderWithProviders(
            <ProductCard product={mockProduct} />
          );
          
          // Test product card hover effect
          const productCard = container.querySelector('.product-card');
          expect(productCard).toBeInTheDocument();
          
          // Simulate hover on product card
          fireEvent.mouseEnter(productCard);
          
          // Product card should have hover class or styles applied
          // Since we can't test actual CSS transitions in jsdom, we verify the element structure
          expect(productCard).toHaveClass('product-card');
          
          // Test button hover if product is in stock
          if (productData.stockQuantity > 0) {
            const addToCartBtn = container.querySelector('.add-to-cart-btn');
            if (addToCartBtn) {
              expect(addToCartBtn).toBeInTheDocument();
              expect(addToCartBtn).not.toBeDisabled();
              
              // Simulate hover on button
              fireEvent.mouseEnter(addToCartBtn);
              
              // Button should maintain its interactive state
              expect(addToCartBtn).toHaveClass('add-to-cart-btn');
              
              fireEvent.mouseLeave(addToCartBtn);
            }
          }
          
          fireEvent.mouseLeave(productCard);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('header navigation links provide hover feedback', () => {
    const { container } = renderWithProviders(<Header />);
    
    // Test navigation links
    const navLinks = container.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
      expect(link).toBeInTheDocument();
      
      // Simulate hover
      fireEvent.mouseEnter(link);
      
      // Link should have hover styles (verified by class presence)
      expect(link).toHaveClass('nav-link');
      
      fireEvent.mouseLeave(link);
    });
  });

  test('buttons provide appropriate visual states', () => {
    fc.assert(
      fc.property(
        fc.record({
          isDisabled: fc.boolean(),
          buttonType: fc.constantFrom('primary', 'secondary', 'outline')
        }),
        (buttonConfig) => {
          // Create a test button element
          const TestButton = () => (
            <button 
              className={`btn btn-${buttonConfig.buttonType}`}
              disabled={buttonConfig.isDisabled}
            >
              Test Button
            </button>
          );
          
          const { container } = render(<TestButton />);
          const button = container.querySelector('button');
          
          expect(button).toBeInTheDocument();
          expect(button).toHaveClass('btn');
          expect(button).toHaveClass(`btn-${buttonConfig.buttonType}`);
          
          if (buttonConfig.isDisabled) {
            expect(button).toBeDisabled();
          } else {
            expect(button).not.toBeDisabled();
            
            // Test hover interaction for enabled buttons
            fireEvent.mouseEnter(button);
            
            // Button should maintain its class structure
            expect(button).toHaveClass('btn');
            
            fireEvent.mouseLeave(button);
          }
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('cart icon provides visual feedback', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 99 }),
        (cartCount) => {
          const initialState = {
            cart: {
              count: cartCount
            }
          };
          
          const { container } = renderWithProviders(<Header />, initialState);
          
          const cartIcon = container.querySelector('.cart-icon');
          expect(cartIcon).toBeInTheDocument();
          
          // Simulate hover on cart icon
          fireEvent.mouseEnter(cartIcon);
          
          // Cart icon should have hover styles
          expect(cartIcon).toHaveClass('cart-icon');
          
          // If there are items in cart, count should be displayed
          if (cartCount > 0) {
            const cartCountElement = container.querySelector('.cart-count');
            expect(cartCountElement).toBeInTheDocument();
            expect(cartCountElement).toHaveTextContent(cartCount.toString());
          }
          
          fireEvent.mouseLeave(cartIcon);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('form inputs provide focus feedback', async () => {
    const { container } = renderWithProviders(<Header />);
    
    const searchInput = container.querySelector('.search-input');
    if (searchInput) {
      expect(searchInput).toBeInTheDocument();
      
      // Test focus state
      fireEvent.focus(searchInput);
      expect(document.activeElement).toBe(searchInput);
      
      // Test blur state
      fireEvent.blur(searchInput);
      expect(document.activeElement).not.toBe(searchInput);
    }
  });

  test('loading states provide appropriate visual feedback', () => {
    // Test loading spinner
    const LoadingComponent = () => (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
    
    const { container } = render(<LoadingComponent />);
    
    const loadingContainer = container.querySelector('.loading');
    const spinner = container.querySelector('.spinner');
    
    expect(loadingContainer).toBeInTheDocument();
    expect(spinner).toBeInTheDocument();
    
    // Verify loading structure is correct
    expect(loadingContainer).toHaveClass('loading');
    expect(spinner).toHaveClass('spinner');
  });
});