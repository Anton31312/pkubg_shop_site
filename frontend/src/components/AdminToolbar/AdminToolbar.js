import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './AdminToolbar.css';

const AdminToolbar = () => {
  const { user, isAuthenticated, loading, initialized } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [shouldRender, setShouldRender] = useState(false);

  // Use effect to delay rendering until we're sure user data is stable
  useEffect(() => {
    if (initialized && !loading && user && user.role && isAuthenticated) {
      // Small delay to ensure state is stable
      const timer = setTimeout(() => {
        setShouldRender(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setShouldRender(false);
    }
  }, [initialized, loading, user, isAuthenticated]);

  // Don't render while auth is initializing or if user data is incomplete
  if (!shouldRender || !initialized || loading || !user || !user.role) {
    return null;
  }

  // Check if user has admin role only
  const hasManagementAccess = isAuthenticated && user && user.role === 'admin';

  if (!hasManagementAccess) {
    return null; // Don't render anything for regular users
  }
  
  // Get role display text - only admin will see this
  const getRoleText = () => {
    return 'Администратор';
  };
  
  const getRoleShortText = () => {
    return 'Админ';
  };

  const handleManageProducts = () => {
    navigate('/products/manage');
  };

  const handleManageCategories = () => {
    navigate('/admin');
  };

  return (
    <>
      <div className="admin-toolbar">
        <div className="toolbar-content">
          <div className="toolbar-title">
            <span className="admin-icon">⚙️</span>
            <span>Панель управления</span>
            <span className="user-role">{getRoleText()}</span>
          </div>
          
          <div className="toolbar-actions">
            <button 
              className="toolbar-btn secondary"
              onClick={handleManageProducts}
              title="Полное управление товарами"
            >
              <span className="btn-icon">📦</span>
              Управление товарами
            </button>
            
            <button 
              className="toolbar-btn secondary"
              onClick={handleManageCategories}
              title="Управление категориями"
            >
              <span className="btn-icon">🏷️</span>
              Категории
            </button>
            
            {getRoleShortText() && (
              <div className="toolbar-stats">
                <div className="stat-item">
                  <span className="stat-label">Роль:</span>
                  <span className="stat-value">{getRoleShortText()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


    </>
  );
};

export default AdminToolbar;