import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import RouteRefresh from '../components/RouteRefresh/RouteRefresh';
import Loading from '../components/Loading/Loading';
import NotFoundPage from "../NotFoundPage";

// Юридические документы (не lazy — маленькие, текстовые)
import PrivacyPolicy from "../legal/PrivacyPolicy";
import CookiePolicy from "../legal/CookiePolicy";
import PersonalDataConsent from "../legal/PersonalDataConsent";
import PublicOffer from "../legal/PublicOffer";
import TermsOfUse from "../legal/TermsOfUse";

// Lazy load
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
const OrderManagement = React.lazy(() => import('../components/OrderManagement/OrderManagement'));
const ArticlesList = React.lazy(() => import('../components/Articles/ArticlesList'));
const ArticleDetail = React.lazy(() => import('../components/Articles/ArticleDetail'));
const ArticleForm = React.lazy(() => import('../components/Articles/ArticleForm'));
const AboutPage = React.lazy(() => import('../components/AboutPage/AboutPage'));
const PaymentSuccess = React.lazy(() => import('../components/PaymentSuccess/PaymentSuccess'));
const LegalInfoAdmin = React.lazy(() => import('../components/Admin/LegalInfoAdmin'));

const ContactPage = () => <div>Contact Page (Coming Soon)</div>;

const AppRoutes = () => {
  const { isAuthenticated } = useSelector(state => state.auth);

  return (
    <RouteRefresh>
      <Suspense fallback={<Loading fullScreen text="Загрузка страницы..." />}>
        <Routes>

          {/* ═══ Публичные страницы ═══ */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductCatalog />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/articles" element={<ArticlesList />} />
          <Route path="/articles/:slug" element={<ArticleDetail />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* ═══ Юридические документы (публичные) ═══ */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfUse />} />
          <Route path="/offer" element={<PublicOffer />} />
          <Route path="/personal-data-consent" element={<PersonalDataConsent />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />

          {/* ═══ Управление статьями ═══ */}
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

          {/* ═══ Авторизация ═══ */}
          <Route
            path="/login"
            element={
              isAuthenticated
                ? <Navigate to="/products" replace />
                : <LoginForm />
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated
                ? <Navigate to="/products" replace />
                : <RegisterForm />
            }
          />

          {/* ═══ Защищённые (нужна авторизация) ═══ */}
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
          <Route
            path="/payment-result"
            element={
              <ProtectedRoute>
                <PaymentSuccess />
              </ProtectedRoute>
            }
          />

          {/* ═══ Админка ═══ */}
          <Route
            path="/settings/legal-info"
            element={
              <ProtectedRoute requiredRole="admin">
                <LegalInfoAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          {/* ═══ Менеджер ═══ */}
          <Route
            path="/manage/*"
            element={
              <ProtectedRoute requiredRole={['manager', 'admin']}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/manage"
            element={
              <ProtectedRoute requiredRole={['manager', 'admin']}>
                <ProductManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/manage"
            element={
              <ProtectedRoute requiredRole={['manager', 'admin']}>
                <OrderManagement />
              </ProtectedRoute>
            }
          />

          {/* ═══ Редиректы ═══ */}
          <Route path="/catalog" element={<Navigate to="/products" replace />} />
          <Route path="/shop" element={<Navigate to="/products" replace />} />

          {/* ═══ 404 ═══ */}
          <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </Suspense>
    </RouteRefresh>
  );
};

export default AppRoutes;