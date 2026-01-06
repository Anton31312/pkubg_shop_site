import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './AdminProductActions.css';

const AdminProductActions = ({ product, onUpdate }) => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Check if user has admin or manager role
  const hasManagementAccess = isAuthenticated && user && ['admin', 'manager'].includes(user.role);

  if (!hasManagementAccess) {
    return null; // Don't render anything for regular users
  }

  const handleQuickEdit = () => {
    navigate(`/products/manage?edit=${product.id}`);
  };

  const handleToggleActive = async () => {
    setLoading(true);
    try {
      await api.patch(`/products/products/${product.id}/`, {
        is_active: !product.is_active
      });
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error toggling product status:', error);
      alert('Ошибка изменения статуса товара');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStock = async () => {
    const newStock = prompt(
      `Текущий остаток: ${product.stock_quantity}\nВведите новое количество:`,
      product.stock_quantity
    );
    
    if (newStock !== null && !isNaN(newStock) && newStock >= 0) {
      setLoading(true);
      try {
        await api.patch(`/products/products/${product.id}/`, {
          stock_quantity: parseInt(newStock)
        });
        if (onUpdate) {
          onUpdate();
        }
      } catch (error) {
        console.error('Error updating stock:', error);
        alert('Ошибка обновления остатка');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Вы уверены, что хотите удалить товар "${product.name}"?`)) {
      setLoading(true);
      try {
        await api.delete(`/products/products/${product.id}/`);
        if (onUpdate) {
          onUpdate();
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Ошибка удаления товара');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="admin-product-actions">
      <div className="actions-overlay">
        <div className="actions-content">
          <div className="actions-header">
            <span className="admin-badge">
              {user.role === 'admin' ? 'Админ' : 'Менеджер'}
            </span>
          </div>
          
          <div className="quick-actions">
            <button
              className="action-btn edit-btn"
              onClick={handleQuickEdit}
              disabled={loading}
              title="Редактировать товар"
            >
              ✏️
            </button>
            
            <button
              className={`action-btn toggle-btn ${product.is_active ? 'active' : 'inactive'}`}
              onClick={handleToggleActive}
              disabled={loading}
              title={product.is_active ? 'Деактивировать' : 'Активировать'}
            >
              {product.is_active ? '👁️' : '🚫'}
            </button>
            
            <button
              className="action-btn stock-btn"
              onClick={handleQuickStock}
              disabled={loading}
              title="Изменить остаток"
            >
              📦
            </button>
            
            <button
              className="action-btn delete-btn"
              onClick={handleDelete}
              disabled={loading}
              title="Удалить товар"
            >
              🗑️
            </button>
          </div>
          
          <div className="product-status">
            <div className="status-item">
              <span className="status-label">Статус:</span>
              <span className={`status-value ${product.is_active ? 'active' : 'inactive'}`}>
                {product.is_active ? 'Активен' : 'Неактивен'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Остаток:</span>
              <span className={`status-value ${product.stock_quantity === 0 ? 'out-of-stock' : product.stock_quantity < 10 ? 'low-stock' : 'in-stock'}`}>
                {product.stock_quantity}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductActions;