import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const { user } = useSelector(state => state.auth);
  const [analytics, setAnalytics] = useState({
    cartStats: null,
    productStats: null,
    orderStats: null,
    userStats: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    fetchAnalytics();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let cartStats = null;
      let productStats = null;
      let articleStats = null;
      
      // Fetch cart statistics
      try {
        const cartResponse = await api.get('/analytics/cart-statistics/');
        cartStats = cartResponse.data;
      } catch (err) {
        console.log('Cart analytics not available:', err);
        // Provide fallback data
        cartStats = {
          total_carts: 0,
          total_items: 0,
          total_value: 0
        };
      }
      
      // Fetch product statistics
      try {
        const productsResponse = await api.get('/products/products/');
        const products = Array.isArray(productsResponse.data.results) 
          ? productsResponse.data.results 
          : Array.isArray(productsResponse.data) 
            ? productsResponse.data 
            : [];
        
        const categoriesResponse = await api.get('/products/categories/');
        const categories = Array.isArray(categoriesResponse.data.results) 
          ? categoriesResponse.data.results 
          : Array.isArray(categoriesResponse.data) 
            ? categoriesResponse.data 
            : [];
        
        productStats = {
          total: products.length,
          active: products.filter(p => p.is_active).length,
          inactive: products.filter(p => !p.is_active).length,
          outOfStock: products.filter(p => p.stock_quantity === 0).length,
          lowStock: products.filter(p => p.stock_quantity > 0 && p.stock_quantity < 10).length,
          totalCategories: categories.length
        };
      } catch (err) {
        console.log('Product statistics not available:', err);
        productStats = {
          total: 0,
          active: 0,
          inactive: 0,
          outOfStock: 0,
          lowStock: 0,
          totalCategories: 0
        };
      }

      // Fetch articles if available
      try {
        const articlesResponse = await api.get('/articles/articles/');
        const articles = Array.isArray(articlesResponse.data.results) 
          ? articlesResponse.data.results 
          : Array.isArray(articlesResponse.data) 
            ? articlesResponse.data 
            : [];
        
        articleStats = {
          total: articles.length,
          published: articles.filter(a => a.is_published).length,
          drafts: articles.filter(a => !a.is_published).length
        };
      } catch (err) {
        console.log('Articles not available:', err);
        articleStats = null;
      }

      setAnalytics({
        cartStats,
        productStats,
        articleStats,
        userStats: null
      });
      
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Ошибка загрузки аналитики. Проверьте подключение к серверу.');
      
      // Set fallback data
      setAnalytics({
        cartStats: { total_carts: 0, total_items: 0, total_value: 0 },
        productStats: { total: 0, active: 0, inactive: 0, outOfStock: 0, lowStock: 0, totalCategories: 0 },
        articleStats: null,
        userStats: null
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('ru-RU').format(number);
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'good': return '#28a745';
      case 'warning': return '#ffc107';
      case 'danger': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStockStatus = () => {
    if (!analytics.productStats) return 'good';
    
    const { outOfStock, lowStock, total } = analytics.productStats;
    const problemProducts = outOfStock + lowStock;
    const percentage = (problemProducts / total) * 100;
    
    if (percentage > 20) return 'danger';
    if (percentage > 10) return 'warning';
    return 'good';
  };

  if (loading && !analytics.cartStats) {
    return (
      <div className="analytics-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка аналитики...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <div className="header-content">
          <h2>Аналитика и статистика</h2>
          <p className="header-subtitle">
            Обзор ключевых показателей магазина
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="refresh-btn"
            onClick={fetchAnalytics}
            disabled={loading}
          >
            <span className={`refresh-icon ${loading ? 'spinning' : ''}`}>🔄</span>
            Обновить
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
          <button 
            className="error-close"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      <div className="analytics-grid">
        {/* Cart Statistics */}
        {analytics.cartStats && (
          <div className="analytics-card cart-stats">
            <div className="card-header">
              <h3>Корзины покупателей</h3>
              <span className="card-icon">🛒</span>
            </div>
            <div className="card-content">
              <div className="stat-row">
                <div className="stat-item">
                  <span className="stat-label">Активных корзин</span>
                  <span className="stat-value primary">
                    {formatNumber(analytics.cartStats.total_carts)}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Товаров в корзинах</span>
                  <span className="stat-value">
                    {formatNumber(analytics.cartStats.total_items)}
                  </span>
                </div>
              </div>
              <div className="stat-row">
                <div className="stat-item full-width">
                  <span className="stat-label">Общая стоимость</span>
                  <span className="stat-value success">
                    {formatCurrency(analytics.cartStats.total_value)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Statistics */}
        {analytics.productStats && (
          <div className="analytics-card product-stats">
            <div className="card-header">
              <h3>Товары</h3>
              <span className="card-icon">📦</span>
            </div>
            <div className="card-content">
              <div className="stat-row">
                <div className="stat-item">
                  <span className="stat-label">Всего товаров</span>
                  <span className="stat-value primary">
                    {formatNumber(analytics.productStats.total)}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Активных</span>
                  <span className="stat-value success">
                    {formatNumber(analytics.productStats.active)}
                  </span>
                </div>
              </div>
              <div className="stat-row">
                <div className="stat-item">
                  <span className="stat-label">Нет в наличии</span>
                  <span className="stat-value danger">
                    {formatNumber(analytics.productStats.outOfStock)}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Мало на складе</span>
                  <span className="stat-value warning">
                    {formatNumber(analytics.productStats.lowStock)}
                  </span>
                </div>
              </div>
              <div className="stat-row">
                <div className="stat-item">
                  <span className="stat-label">Категорий</span>
                  <span className="stat-value">
                    {formatNumber(analytics.productStats.totalCategories)}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Статус склада</span>
                  <span 
                    className="status-indicator"
                    style={{ color: getStockStatusColor(getStockStatus()) }}
                  >
                    {getStockStatus() === 'good' && '✅ Хорошо'}
                    {getStockStatus() === 'warning' && '⚠️ Внимание'}
                    {getStockStatus() === 'danger' && '🚨 Критично'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Article Statistics */}
        <div className="analytics-card article-stats">
          <div className="card-header">
            <h3>Статьи</h3>
            <span className="card-icon">📝</span>
          </div>
          <div className="card-content">
            {analytics.articleStats ? (
              <>
                <div className="stat-row">
                  <div className="stat-item">
                    <span className="stat-label">Всего статей</span>
                    <span className="stat-value primary">
                      {formatNumber(analytics.articleStats.total)}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Опубликованных</span>
                    <span className="stat-value success">
                      {formatNumber(analytics.articleStats.published)}
                    </span>
                  </div>
                </div>
                <div className="stat-row">
                  <div className="stat-item">
                    <span className="stat-label">Черновиков</span>
                    <span className="stat-value warning">
                      {formatNumber(analytics.articleStats.drafts)}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Процент публикации</span>
                    <span className="stat-value">
                      {analytics.articleStats.total > 0 
                        ? Math.round((analytics.articleStats.published / analytics.articleStats.total) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="stat-unavailable">
                <span className="unavailable-icon">📝</span>
                <span className="unavailable-text">Статистика статей недоступна</span>
                <span className="unavailable-desc">Функция будет добавлена позже</span>
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="analytics-card system-stats">
          <div className="card-header">
            <h3>Система</h3>
            <span className="card-icon">⚙️</span>
          </div>
          <div className="card-content">
            <div className="stat-row">
              <div className="stat-item">
                <span className="stat-label">Статус системы</span>
                <span className="stat-value success">🟢 Работает</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Последнее обновление</span>
                <span className="stat-value">
                  {new Date().toLocaleTimeString('ru-RU')}
                </span>
              </div>
            </div>
            <div className="stat-row">
              <div className="stat-item">
                <span className="stat-label">Автообновление</span>
                <span className="stat-value">
                  {refreshInterval ? '🔄 Включено' : '⏸️ Отключено'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Администратор</span>
                <span className="stat-value">
                  {user?.first_name || user?.username || 'Неизвестно'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Быстрые действия</h3>
        <div className="actions-grid">
          <button className="action-card" onClick={() => window.location.href = '/admin#products'}>
            <span className="action-icon">📦</span>
            <span className="action-title">Управление товарами</span>
            <span className="action-desc">Добавить, редактировать товары</span>
          </button>
          
          <button className="action-card" onClick={() => window.location.href = '/admin#articles'}>
            <span className="action-icon">📝</span>
            <span className="action-title">Создать статью</span>
            <span className="action-desc">Написать новую статью</span>
          </button>
          
          <button className="action-card" onClick={fetchAnalytics}>
            <span className="action-icon">📊</span>
            <span className="action-title">Обновить данные</span>
            <span className="action-desc">Получить актуальную статистику</span>
          </button>
          
          <button className="action-card" onClick={() => window.location.href = '/admin#categories'}>
            <span className="action-icon">🏷️</span>
            <span className="action-title">Категории</span>
            <span className="action-desc">Управление категориями</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;