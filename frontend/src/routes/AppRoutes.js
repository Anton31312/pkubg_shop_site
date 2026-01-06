import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import Loading from '../components/Loading/Loading';

// Lazy load components for better performance
const HomePage = React.lazy(() => import('../components/HomePage/HomePage'));
const ProductCatalog = React.lazy(() => import('../components/ProductCatalog/ProductCatalog'));
const ShoppingCart = React.lazy(() => import('../components/ShoppingCart/ShoppingCart'));
const LoginForm = React.lazy(() => import('../components/Auth/LoginForm'));
const RegisterForm = React.lazy(() => import('../components/Auth/RegisterForm'));
const UserProfile = React.lazy(() => import('../components/UserProfile/UserProfile'));
const AdminPanel = React.lazy(() => import('../components/AdminPanel/AdminPanel'));
const Checkout = React.lazy(() => import('../components/Checkout/Checkout'));

const ProductDetail = React.lazy(() => import('../components/ProductDetail/ProductDetail'));
const ProductManagement = React.lazy(() => import('../components/ProductManagement/ProductManagement'));
const ArticlesList = React.lazy(() => import('../components/Articles/ArticlesList'));
const ArticleDetail = React.lazy(() => import('../components/Articles/ArticleDetail'));
const ArticleForm = React.lazy(() => import('../components/Articles/ArticleForm'));
const AboutPage = React.lazy(() => import('../components/AboutPage/AboutPage'));
const ContactPage = () => <div>Contact Page (Coming Soon)</div>;
const NotFoundPage = () => (
  <div style={{ textAlign: 'center', padding: '50px' }}>
    <h2>Страница не найдена</h2>
    <p>Запрашиваемая страница не существует.</p>
  </div>
);

const AppRoutes = () => {
  const { isAuthenticated } = useSelector(state => state.auth);

  return (
    <Suspense fallback={<Loading fullScreen text="Загрузка страницы..." />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductCatalog />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/articles" element={<ArticlesList />} />
        <Route path="/articles/:slug" element={<ArticleDetail />} />
        <Route path="/about" element={<AboutPage />} />
        
        {/* Article management routes - require admin or manager role */}
        <Route 
          path="/articles/create" 
          element={
            <ProtectedRoute requiredRole={['manager', 'admin']}>
              <ArticleForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/articles/:slug/edit" 
          element={
            <ProtectedRoute requiredRole={['manager', 'admin']}>
              <ArticleForm />
            </ProtectedRoute>
          } 
        />
        <Route path="/contact" element={<ContactPage />} />
        
        {/* Authentication routes - redirect if already logged in */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginForm />
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <RegisterForm />
          } 
        />
        
        {/* Protected routes - require authentication */}
        <Route 
          path="/cart" 
          element={
            <ProtectedRoute>
              <ShoppingCart />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/checkout" 
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin routes - require admin role */}
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminPanel />
            </ProtectedRoute>
          } 
        />
        
        {/* Manager routes - require manager or admin role */}
        <Route 
          path="/manage/*" 
          element={
            <ProtectedRoute requiredRole={['manager', 'admin']}>
              <AdminPanel />
            </ProtectedRoute>
          } 
        />
        
        {/* Product Management - separate interface for managers and admins */}
        <Route 
          path="/products/manage" 
          element={
            <ProtectedRoute requiredRole={['manager', 'admin']}>
              <ProductManagement />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirect old URLs */}
        <Route path="/catalog" element={<Navigate to="/products" replace />} />
        <Route path="/shop" element={<Navigate to="/products" replace />} />
        
        {/* 404 page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;