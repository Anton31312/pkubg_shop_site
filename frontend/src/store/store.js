import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import productsReducer from './productsSlice';
import cartReducer from './cartSlice';
import notificationReducer from './notificationSlice';
import articlesReducer from './articlesSlice';
import pheReducer from './pheSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    cart: cartReducer,
    notifications: notificationReducer,
    articles: articlesReducer,
    phe: pheReducer,
  },
});