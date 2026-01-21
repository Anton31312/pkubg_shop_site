import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { fetchCart } from './store/cartSlice';
import { initializeAuth } from './store/authSlice';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import AppRoutes from './routes/AppRoutes';
import NotificationContainer from './components/Notifications/NotificationContainer';
import ResponsiveLayout from './components/ResponsiveLayout';
import './App.css';

function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, loading, initialized } = useSelector(state => state.auth);

  useEffect(() => {
    // Initialize authentication on app start
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    // Load cart when user is authenticated
    if (isAuthenticated && initialized) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated, initialized]);

  // Обновление при каждом изменении роута
  useEffect(() => {
    // Принудительное обновление состояния при смене страницы
    console.log('Route changed to:', location.pathname);
    
    // Очищаем кэш и обновляем данные
    if (isAuthenticated && initialized) {
      // Обновляем корзину при каждом переходе
      dispatch(fetchCart());
    }
    
    // Прокручиваем страницу наверх при переходе
    window.scrollTo(0, 0);
    
    // Принудительное обновление DOM
    setTimeout(() => {
      // Триггерим перерисовку компонентов
      window.dispatchEvent(new Event('resize'));
    }, 100);
    
  }, [location.pathname, dispatch, isAuthenticated, initialized]);

  // Show loading screen while initializing auth
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
    <ResponsiveLayout className="App" key={location.pathname}>
      <Header />
      <NotificationContainer />
      <main className="main-content">
        <AppRoutes />
      </main>
      <Footer />
    </ResponsiveLayout>
  );
}

export default App;