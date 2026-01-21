import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../store/authSlice';
import { apiHelpers } from '../../utils/apiConfig';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { count } = useSelector(state => state.cart);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Fetch pending orders count for admin/manager
  useEffect(() => {
    const fetchPendingOrders = async () => {
      if (isAuthenticated && (user?.role === 'admin' || user?.role === 'manager')) {
        try {
          const response = await apiHelpers.get('/orders/admin/all/', {
            page: 1,
            page_size: 100
          });
          
          // Count orders that are not shipped or delivered
          const pendingStatuses = ['pending', 'paid', 'processing'];
          const pendingCount = response.data.orders.filter(
            order => pendingStatuses.includes(order.status)
          ).length;
          
          setPendingOrdersCount(pendingCount);
        } catch (error) {
          console.error('Error fetching pending orders:', error);
          setPendingOrdersCount(0);
        }
      }
    };

    fetchPendingOrders();
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchPendingOrders, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [navigate]);

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1023) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo">
            <img src="/logo.png" alt="Pkubg Logo" className="logo-image" />
            <div className="logo-text">
              <h1>Pkubg</h1>
              <span>Здоровое питание</span>
            </div>
          </Link>
        </div>

        <nav className="header-nav">
          <Link to="/" className="nav-link">Главная</Link>
          <Link to="/products" className="nav-link">Каталог</Link>
          <Link to="/articles" className="nav-link">Статьи</Link>
          <Link to="/about" className="nav-link">О нас</Link>
        </nav>

        <div className="header-right">
          {/* Show orders icon for admin/manager, cart for customers */}
          {isAuthenticated && (user?.role === 'admin' || user?.role === 'manager') ? (
            <Link to="/orders/manage" className="cart-link" onClick={closeMobileMenu}>
              <div className="cart-icon orders-icon">
                📋
                {pendingOrdersCount > 0 && <span className="cart-count">{pendingOrdersCount}</span>}
              </div>
            </Link>
          ) : (
            <Link to="/cart" className="cart-link" onClick={closeMobileMenu}>
              <div className="cart-icon">
                🛒
                {count > 0 && <span className="cart-count">{count}</span>}
              </div>
            </Link>
          )}

          <button 
            className="mobile-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label="Открыть меню"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>

          <div className="auth-section">
            {isAuthenticated ? (
              <div className="user-menu">
                <Link to="/profile" className="user-link" onClick={closeMobileMenu}>
                  👤 {user?.first_name || 'Профиль'}
                </Link>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <Link to="/products/manage" className="admin-link" onClick={closeMobileMenu}>
                    📦 Товары
                  </Link>
                )}
                {user?.role === 'admin' && (
                  <Link to="/admin" className="admin-link" onClick={closeMobileMenu}>
                    ⚙️ Админ
                  </Link>
                )}
                <button onClick={handleLogout} className="logout-button">
                  Выйти
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="auth-link" onClick={closeMobileMenu}>Вход</Link>
                <Link to="/register" className="auth-link register" onClick={closeMobileMenu}>Регистрация</Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile Menu */}
        <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-content">
            <nav className="mobile-nav">
              <Link to="/" className="nav-link" onClick={closeMobileMenu}>Главная</Link>
              <Link to="/products" className="nav-link" onClick={closeMobileMenu}>Каталог</Link>
              <Link to="/articles" className="nav-link" onClick={closeMobileMenu}>Статьи</Link>
              <Link to="/about" className="nav-link" onClick={closeMobileMenu}>О нас</Link>
            </nav>

            {isAuthenticated ? (
              <div className="mobile-auth">
                <Link to="/profile" className="auth-link" onClick={closeMobileMenu}>
                  👤 {user?.first_name || 'Профиль'}
                </Link>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <Link to="/products/manage" className="auth-link" onClick={closeMobileMenu}>
                    📦 Управление товарами
                  </Link>
                )}
                {user?.role === 'admin' && (
                  <Link to="/admin" className="auth-link" onClick={closeMobileMenu}>
                    ⚙️ Админ панель
                  </Link>
                )}
                <button onClick={handleLogout} className="auth-link" style={{border: 'none', background: 'none', cursor: 'pointer'}}>
                  Выйти
                </button>
              </div>
            ) : (
              <div className="mobile-auth">
                <Link to="/login" className="auth-link" onClick={closeMobileMenu}>Вход</Link>
                <Link to="/register" className="auth-link register" onClick={closeMobileMenu}>Регистрация</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;