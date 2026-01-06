import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/apiConfig';
import { addNotification } from './notificationSlice';

// Async thunks for authentication
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/auth/login/', { email, password });
      localStorage.setItem('token', response.data.access);
      
      dispatch(addNotification({
        type: 'success',
        message: 'Вы успешно вошли в систему'
      }));
      
      return response.data;
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Ошибка входа в систему'
      }));
      return rejectWithValue(error);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register/', userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await api.post('/auth/logout/');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      dispatch(addNotification({
        type: 'info',
        message: 'Вы вышли из системы'
      }));
      
      return {};
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return rejectWithValue(error);
    }
  }
);

export const verifyToken = createAsyncThunk(
  'auth/verifyToken',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      // Try to get user profile to verify token
      const response = await api.get('/auth/profile/');
      return response.data;
    } catch (error) {
      // Token is invalid, clear everything
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      dispatch(addNotification({
        type: 'warning',
        message: 'Сессия истекла. Пожалуйста, войдите снова.'
      }));
      
      return rejectWithValue(error);
    }
  }
);

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        return { user: null, token: null };
      }

      // Parse user data
      const user = JSON.parse(userData);
      
      // Verify token is still valid
      await dispatch(verifyToken()).unwrap();
      
      return { user, token };
    } catch (error) {
      return { user: null, token: null };
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true, // Start with loading true to check token
    error: null,
    initialized: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.access;
        state.isAuthenticated = true;
        state.error = null;
        
        // Persist user data to localStorage
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })
      // Verify Token
      .addCase(verifyToken.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(verifyToken.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      // Initialize Auth
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
        state.initialized = false;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        if (action.payload.user && action.payload.token) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;