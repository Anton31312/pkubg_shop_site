import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { fetchCart } from './store/cartSlice';
import { initializeAuth } from './store/authSlice';
import { LegalInfoProvider } from './contexts/LegalInfoContext';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import AppRoutes from './routes/AppRoutes';
import CookieBanner from './legal/CookieBanner';
import './App.css';
import PheCalculator from './components/PheCalculator/PheCalculator';

function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, loading, initialized } = useSelector(state => state.auth);

  // Инициализация авторизации
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Загрузка корзины после авторизации
  useEffect(() => {
    if (isAuthenticated && initialized) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated, initialized]);

  // Скролл наверх при смене страницы
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Экран загрузки пока инициализируется auth
  if (!initialized && loading) {
    return (
      <div className="App">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <LegalInfoProvider>
      <div className="App">
        <Header />
        <main className="main-content">
          <AppRoutes />
        </main>
        <Footer />
        <PheCalculator />
        <CookieBanner />
      </div>
    </LegalInfoProvider>
  );
}

export default App;