import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import productsReducer from './productsSlice';
import cartReducer from './cartSlice';
import notificationReducer from './notificationSlice';
import articlesReducer from './articlesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    cart: cartReducer,
    notifications: notificationReducer,
    articles: articlesReducer,
  },
});