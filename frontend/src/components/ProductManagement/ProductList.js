import React, { useState } from 'react';
import './ProductList.css';

const ProductList = ({ products, onEdit, onDelete, onImageUpload, onToggleActive }) => {
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle nested values
    if (sortField === 'category') {
      aValue = a.category?.name || '';
      bValue = b.category?.name || '';
    }

    // Handle date fields
    if (sortField === 'created_at' || sortField === 'updated_at') {
      aValue = new Date(aValue || 0);
      bValue = new Date(bValue || 0);
    }
    // Handle different data types
    else if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return 'Не указано';
    }
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Неверная дата';
      }
      
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'dateString:', dateString);
      return 'Ошибка даты';
    }
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { status: 'out-of-stock', text: 'Нет в наличии' };
    if (quantity < 10) return { status: 'low-stock', text: 'Мало' };
    return { status: 'in-stock', text: 'В наличии' };
  };

  const SortButton = ({ field, children }) => (
    <button
      className={`sort-btn ${sortField === field ? 'active' : ''}`}
      onClick={() => handleSort(field)}
    >
      {children}
      <span className={`sort-icon ${sortField === field ? sortDirection : ''}`}>
        ↕️
      </span>
    </button>
  );

  if (products.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📦</div>
        <h3>Товары не найдены</h3>
        <p>Попробуйте изменить фильтры или добавьте новый товар</p>
      </div>
    );
  }

  return (
    <div className="product-list">
      <div className="list-controls">
        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            📋 Таблица
          </button>
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            ⊞ Сетка
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Изображение</th>
                <th>
                  <SortButton field="name">Название</SortButton>
                </th>
                <th>
                  <SortButton field="category">Категория</SortButton>
                </th>
                <th>
                  <SortButton field="price">Цена</SortButton>
                </th>
                <th>
                  <SortButton field="stock_quantity">Остаток</SortButton>
                </th>
                <th>
                  <SortButton field="is_active">Статус</SortButton>
                </th>
                <th>
                  <SortButton field="created_at">Создан</SortButton>
                </th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map(product => {
                const stockStatus = getStockStatus(product.stock_quantity);
                const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
                
                return (
                  <tr key={product.id} className={!product.is_active ? 'inactive' : ''}>
                    <td>
                      <div className="product-image">
                        {primaryImage ? (
                          <img 
                            src={primaryImage.image} 
                            alt={primaryImage.alt_text}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="image-placeholder" style={{ display: primaryImage ? 'none' : 'flex' }}>
                          📷
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="product-info">
                        <div className="product-name">{product.name}</div>
                        <div className="product-badges">
                          {product.is_gluten_free && (
                            <span className="badge gluten-free">Без глютена</span>
                          )}
                          {product.is_low_protein && (
                            <span className="badge low-protein">Низкобелковый</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="category-name">
                        {product.category?.name || 'Без категории'}
                      </span>
                    </td>
                    <td>
                      <span className="price">{formatPrice(product.price)}</span>
                    </td>
                    <td>
                      <span className={`stock-status ${stockStatus.status}`}>
                        <span className="stock-number">{product.stock_quantity}</span>
                        <span className="stock-text">{stockStatus.text}</span>
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${product.is_active ? 'active' : 'inactive'}`}>
                        {product.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td>
                      <span className="date">{formatDate(product.created_at || product.date_created)}</span>
                    </td>
                    <td>
                      <div className="actions">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => onEdit(product)}
                          title="Редактировать"
                        >
                          ✏️
                        </button>
                        <button
                          className="action-btn image-btn"
                          onClick={() => onImageUpload(product)}
                          title="Управление изображениями"
                        >
                          🖼️
                        </button>
                        <button
                          className={`action-btn toggle-btn ${product.is_active ? 'hide' : 'show'}`}
                          onClick={() => onToggleActive(product)}
                          title={product.is_active ? 'Скрыть товар' : 'Показать товар'}
                        >
                          {product.is_active ? '👁️‍🗨️' : '👁️'}
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => onDelete(product.id)}
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="products-grid">
          {sortedProducts.map(product => {
            const stockStatus = getStockStatus(product.stock_quantity);
            const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
            
            return (
              <div key={product.id} className={`product-card ${!product.is_active ? 'inactive' : ''}`}>
                <div className="card-image">
                  {primaryImage ? (
                    <img 
                      src={primaryImage.image} 
                      alt={primaryImage.alt_text}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="image-placeholder" style={{ display: primaryImage ? 'none' : 'flex' }}>
                    📷
                  </div>
                  <div className="card-overlay">
                    <div className="overlay-actions">
                      <button
                        className="overlay-btn"
                        onClick={() => onEdit(product)}
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      <button
                        className="overlay-btn"
                        onClick={() => onImageUpload(product)}
                        title="Управление изображениями"
                      >
                        🖼️
                      </button>
                      <button
                        className={`overlay-btn toggle ${product.is_active ? 'hide' : 'show'}`}
                        onClick={() => onToggleActive(product)}
                        title={product.is_active ? 'Скрыть товар' : 'Показать товар'}
                      >
                        {product.is_active ? '👁️‍🗨️' : '👁️'}
                      </button>
                      <button
                        className="overlay-btn delete"
                        onClick={() => onDelete(product.id)}
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="card-content">
                  <div className="card-header">
                    <h3 className="card-title">{product.name}</h3>
                    <span className={`status-badge ${product.is_active ? 'active' : 'inactive'}`}>
                      {product.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                  
                  <div className="card-info">
                    <div className="info-row">
                      <span className="label">Категория:</span>
                      <span className="value">{product.category?.name || 'Без категории'}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Цена:</span>
                      <span className="value price">{formatPrice(product.price)}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Остаток:</span>
                      <span className={`value stock-status ${stockStatus.status}`}>
                        {product.stock_quantity} ({stockStatus.text})
                      </span>
                    </div>
                  </div>
                  
                  <div className="card-badges">
                    {product.is_gluten_free && (
                      <span className="badge gluten-free">Без глютена</span>
                    )}
                    {product.is_low_protein && (
                      <span className="badge low-protein">Низкобелковый</span>
                    )}
                  </div>
                  
                  <div className="card-footer">
                    <span className="created-date">
                      Создан: {formatDate(product.created_at || product.date_created)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductList;