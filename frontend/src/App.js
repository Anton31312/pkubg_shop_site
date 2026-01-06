import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
    <ResponsiveLayout className="App">
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