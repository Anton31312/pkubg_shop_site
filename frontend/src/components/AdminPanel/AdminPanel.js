import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import ProductManagement from '../Admin/ProductManagement';
import CategoryManagement from '../Admin/CategoryManagement';
import ArticleManagement from './ArticleManagement';
import AnalyticsDashboard from './AnalyticsDashboard';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState('products');

  // Check if user has admin or manager role
  const hasAdminAccess = user && (user.role === 'admin' || user.role === 'manager');

  if (!isAuthenticated) {
    return (
      <div className="admin-panel">
        <div className="access-denied">
          <h2>Требуется авторизация</h2>
          <p>Для доступа к панели администратора необходимо войти в систему.</p>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="admin-panel">
        <div className="access-denied">
          <h2>Доступ запрещен</h2>
          <p>У вас нет прав для доступа к панели администратора.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <header className="admin-header">
          <h1>Панель администратора</h1>
          <p className="admin-subtitle">Управление магазином Pkubg</p>
        </header>

        <nav className="admin-tabs">
          <button
            className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <span className="tab-icon">📦</span>
            Товары
          </button>
          <button
            className={`tab-button ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <span className="tab-icon">🏷️</span>
            Категории
          </button>
          <button
            className={`tab-button ${activeTab === 'articles' ? 'active' : ''}`}
            onClick={() => setActiveTab('articles')}
          >
            <span className="tab-icon">📝</span>
            Статьи
          </button>
          {user.role === 'admin' && (
            <button
              className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <span className="tab-icon">📊</span>
              Аналитика
            </button>
          )}
        </nav>

        <div className="admin-content">
          {activeTab === 'products' && <ProductManagement />}
          {activeTab === 'categories' && <CategoryManagement />}
          {activeTab === 'articles' && <ArticleManagement />}
          {activeTab === 'analytics' && user.role === 'admin' && <AnalyticsDashboard />}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;