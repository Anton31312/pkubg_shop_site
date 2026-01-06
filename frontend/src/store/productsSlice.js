import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/apiConfig';

// Async thunks for products
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ search = '', category = '', filters = {} } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`/products/products/?${params.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/products/products/${productId}/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/products/categories/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchManufacturers = createAsyncThunk(
  'products/fetchManufacturers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/products/products/manufacturers/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    categories: [],
    manufacturers: [],
    currentProduct: null,
    filters: {
      search: '',
      category: '',
      manufacturer: '',
      isGlutenFree: false,
      isLowProtein: false,
      minPrice: '',
      maxPrice: '',
    },
    loading: false,
    error: null,
    pagination: {
      count: 0,
      next: null,
      previous: null,
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        search: '',
        category: '',
        manufacturer: '',
        isGlutenFree: false,
        isLowProtein: false,
        minPrice: '',
        maxPrice: '',
      };
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.results || action.payload;
        state.pagination = {
          count: action.payload.count || action.payload.length,
          next: action.payload.next || null,
          previous: action.payload.previous || null,
        };
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch product by ID
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        // Categories loading doesn't need to set main loading state
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = Array.isArray(action.payload) ? action.payload : action.payload.results || [];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.categories = [];
        console.error('Failed to fetch categories:', action.payload);
      })
      // Fetch manufacturers
      .addCase(fetchManufacturers.pending, (state) => {
        // Manufacturers loading doesn't need to set main loading state
      })
      .addCase(fetchManufacturers.fulfilled, (state, action) => {
        state.manufacturers = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchManufacturers.rejected, (state, action) => {
        state.manufacturers = [];
        console.error('Failed to fetch manufacturers:', action.payload);
      });
  },
});

export const { setFilters, clearFilters, clearCurrentProduct } = productsSlice.actions;
export default productsSlice.reducer;