import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/apiConfig';

// Async thunks for cart
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      if (!auth.isAuthenticated) {
        return { items: [], total: 0, count: 0 };
      }
      
      const response = await api.get('/orders/cart/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity = 1, product }, { rejectWithValue, getState, dispatch }) => {
    try {
      const response = await api.post('/orders/cart/add/', 
        { product_id: productId, quantity }
      );
      
      // Refresh cart data after adding
      dispatch(fetchCart());
      
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        // Handle server-side stock validation errors
        const serverError = error.response.data;
        if (serverError.type === 'STOCK_UNAVAILABLE' || serverError.type === 'INSUFFICIENT_STOCK') {
          return rejectWithValue(serverError);
        }
        return rejectWithValue({
          message: serverError.error || 'Ошибка при добавлении товара в корзину',
          type: 'SERVER_ERROR'
        });
      }
      return rejectWithValue({
        message: 'Ошибка сети. Проверьте подключение к интернету.',
        type: 'NETWORK_ERROR'
      });
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ itemId, quantity }, { rejectWithValue, getState, dispatch }) => {
    try {
      const { auth } = getState();
      const response = await api.put('/orders/cart/update/', 
        { item_id: itemId, quantity }
      );
      
      // Refresh cart data after update
      dispatch(fetchCart());
      
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        // Handle server-side stock validation errors
        const serverError = error.response.data;
        if (serverError.type === 'STOCK_UNAVAILABLE' || serverError.type === 'INSUFFICIENT_STOCK') {
          return rejectWithValue(serverError);
        }
        return rejectWithValue({
          message: serverError.error || 'Ошибка при обновлении корзины',
          type: 'SERVER_ERROR'
        });
      }
      return rejectWithValue({
        message: 'Ошибка сети. Проверьте подключение к интернету.',
        type: 'NETWORK_ERROR'
      });
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (itemId, { rejectWithValue, getState, dispatch }) => {
    try {
      const { auth } = getState();
      const response = await api.delete(`/orders/cart/remove/${itemId}/`);
      
      // Refresh cart data after removal
      dispatch(fetchCart());
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateLocalCartItemAsync = createAsyncThunk(
  'cart/updateLocalCartItemAsync',
  async ({ itemId, quantity }, { rejectWithValue, getState }) => {
    const { cart } = getState();
    const item = cart.items.find(item => item.id === itemId);
    
    if (!item) {
      return rejectWithValue({
        message: 'Товар не найден в корзине',
        type: 'ITEM_NOT_FOUND'
      });
    }
    
    // Check stock availability
    if (quantity > item.product.stock_quantity) {
      return rejectWithValue({
        message: `На складе осталось только ${item.product.stock_quantity} шт. товара`,
        type: 'INSUFFICIENT_STOCK',
        availableQuantity: item.product.stock_quantity
      });
    }
    
    return { itemId, quantity };
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    total: 0,
    count: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      state.count = 0;
    },
    clearCartError: (state) => {
      state.error = null;
    },
    // Local cart management for non-authenticated users
    addToLocalCart: (state, action) => {
      const { product, quantity = 1 } = action.payload;
      const existingItem = state.items.find(item => item.product.id === product.id);
      
      // Check stock availability
      const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
      const totalRequestedQuantity = currentQuantityInCart + quantity;
      
      if (totalRequestedQuantity > product.stock_quantity) {
        const availableQuantity = product.stock_quantity - currentQuantityInCart;
        if (availableQuantity <= 0) {
          state.error = {
            message: 'Товар закончился на складе',
            type: 'STOCK_UNAVAILABLE'
          };
          return;
        } else {
          state.error = {
            message: `На складе осталось только ${availableQuantity} шт. товара`,
            type: 'INSUFFICIENT_STOCK',
            availableQuantity
          };
          return;
        }
      }
      
      // Clear any previous errors
      state.error = null;
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({ 
          id: Date.now(), 
          product, 
          quantity,
          price: product.price 
        });
      }
      
      state.count = state.items.reduce((sum, item) => sum + item.quantity, 0);
      state.total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },
    updateLocalCartItem: (state, action) => {
      const { itemId, quantity } = action.payload;
      const item = state.items.find(item => item.id === itemId);
      
      if (item) {
        // Check stock availability
        if (quantity > item.product.stock_quantity) {
          // Don't update the item, just set error for UI to handle
          state.error = {
            message: `На складе осталось только ${item.product.stock_quantity} шт. товара`,
            type: 'INSUFFICIENT_STOCK',
            availableQuantity: item.product.stock_quantity,
            itemId: itemId // Add itemId to identify which item has error
          };
          return;
        }
        
        // Clear any previous errors
        state.error = null;
        
        item.quantity = quantity;
        state.count = state.items.reduce((sum, item) => sum + item.quantity, 0);
        state.total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      }
    },
    removeFromLocalCart: (state, action) => {
      const itemId = action.payload;
      state.items = state.items.filter(item => item.id !== itemId);
      state.count = state.items.reduce((sum, item) => sum + item.quantity, 0);
      state.total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.total = action.payload.total || 0;
        state.count = action.payload.count || 0;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        // Update totals from server response
        if (action.payload.total !== undefined) {
          state.total = action.payload.total;
        }
        if (action.payload.count !== undefined) {
          state.count = action.payload.count;
        }
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update cart item
      .addCase(updateCartItem.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.loading = false;
        // Update totals from server response
        if (action.payload.total !== undefined) {
          state.total = action.payload.total;
        }
        if (action.payload.count !== undefined) {
          state.count = action.payload.count;
        }
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update local cart item async
      .addCase(updateLocalCartItemAsync.fulfilled, (state, action) => {
        const { itemId, quantity } = action.payload;
        const item = state.items.find(item => item.id === itemId);
        if (item) {
          item.quantity = quantity;
          state.count = state.items.reduce((sum, item) => sum + item.quantity, 0);
          state.total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        }
      })
      // Remove from cart
      .addCase(removeFromCart.fulfilled, (state, action) => {
        // Update totals from server response
        if (action.payload.total !== undefined) {
          state.total = action.payload.total;
        }
        if (action.payload.count !== undefined) {
          state.count = action.payload.count;
        }
      });
  },
});

export const { 
  clearCart, 
  clearCartError,
  addToLocalCart, 
  updateLocalCartItem, 
  removeFromLocalCart 
} = cartSlice.actions;
export default cartSlice.reducer;