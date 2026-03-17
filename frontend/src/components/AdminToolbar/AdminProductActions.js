import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './AdminProductActions.css';

const AdminProductActions = ({ product, onUpdate }) => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const hasManagementAccess =
    isAuthenticated && user && ['admin', 'manager'].includes(user.role);

  if (!hasManagementAccess) {
    return null;
  }

  // ✅ Каждый обработчик блокирует всплытие к <Link>
  const handleQuickEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/products/manage?edit=${product.id}`);
  };

  const handleToggleActive = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      await api.patch(`/products/products/${product.id}/`, {
        is_active: !product.is_active
      });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error toggling product status:', error);
      alert('Ошибка изменения статуса товара');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStock = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    const newStock = prompt(
      `Текущий остаток: ${product.stock_quantity}\nВведите новое количество:`,
      product.stock_quantity
    );

    if (newStock !== null && !isNaN(newStock) && Number(newStock) >= 0) {
      setLoading(true);
      try {
        await api.patch(`/products/products/${product.id}/`, {
          stock_quantity: parseInt(newStock, 10)
        });
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error('Error updating stock:', error);
        alert('Ошибка обновления остатка');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    if (window.confirm(`Удалить товар "${product.name}"?`)) {
      setLoading(true);
      try {
        await api.delete(`/products/products/${product.id}/`);
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Ошибка удаления товара');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    // ✅ Компактная панель, НЕ перекрывает всю карточку
    <div
      className="admin-product-actions"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <span className="admin-badge">
        {user.role === 'admin' ? 'А' : 'М'}
      </span>

      {/* ✅ Кнопки появляются при ховере на панель */}
      <div className="admin-actions-dropdown">
        <div className="admin-actions-buttons">
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

        <div className="admin-product-status">
          <span className={`status-dot ${product.is_active ? 'active' : 'inactive'}`} />
          <span className="status-stock">
            {product.stock_quantity} шт.
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminProductActions;