import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CartItem.css';

const CartItem = ({ item, onUpdateQuantity, onRemove, loading }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [tempQuantity, setTempQuantity] = useState(null); // For input field temporary value

  // Clear temp quantity when item quantity changes (after successful update)
  useEffect(() => {
    setTempQuantity(null);
  }, [item.quantity]);

  // Check if product is out of stock
  const isOutOfStock = item.product.stock_quantity === 0;
  const hasLimitedStock = item.product.stock_quantity > 0 && item.product.stock_quantity < 10;

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1 || isUpdating) return;
    
    // Don't allow increasing quantity if out of stock or exceeds available stock
    if (newQuantity > item.quantity && newQuantity > item.product.stock_quantity) {
      return;
    }
    
    setIsUpdating(true);
    setTempQuantity(null); // Clear temp value
    
    try {
      await onUpdateQuantity(item.id, newQuantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsUpdating(true);
    try {
      await onRemove(item.id);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const itemTotal = (item.price || item.product.price) * item.quantity;
  const primaryImage = item.product.images?.find(img => img.is_primary) || item.product.images?.[0];

  return (
    <div className={`cart-item ${isUpdating ? 'updating' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}>
      <div className="item-image">
        <Link to={`/products/${item.product.id}`}>
          {primaryImage ? (
            <img 
              src={primaryImage.image} 
              alt={primaryImage.alt_text || item.product.name}
            />
          ) : (
            <div className="image-placeholder">📦</div>
          )}
        </Link>
      </div>

      <div className="item-details">
        <Link to={`/products/${item.product.id}`} className="item-name">
          {item.product.name}
        </Link>
        
        <div className="item-features">
          {item.product.is_gluten_free && (
            <span className="feature-badge gluten-free">Без глютена</span>
          )}
          {item.product.is_low_protein && (
            <span className="feature-badge low-protein">Низкобелковый</span>
          )}
        </div>

        <div className="item-price">
          {formatPrice(item.price || item.product.price)} за единицу
        </div>

        {/* Stock status */}
        <div className="item-stock-status">
          {isOutOfStock ? (
            <span className="stock-badge out-of-stock">Нет в наличии</span>
          ) : hasLimitedStock ? (
            <span className="stock-badge limited-stock">
              Осталось: {item.product.stock_quantity} шт.
            </span>
          ) : (
            <span className="stock-badge in-stock">В наличии</span>
          )}
        </div>
      </div>

      <div className="item-controls">
        <div className="quantity-controls">
          <button 
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={item.quantity <= 1 || isUpdating}
            className="quantity-btn"
          >
            −
          </button>
          
          <input
            type="number"
            value={tempQuantity !== null ? tempQuantity : item.quantity}
            onChange={(e) => {
              const newQuantity = parseInt(e.target.value) || 1;
              setTempQuantity(newQuantity);
            }}
            onBlur={() => {
              if (tempQuantity !== null && tempQuantity !== item.quantity) {
                handleQuantityChange(tempQuantity);
              }
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && tempQuantity !== null && tempQuantity !== item.quantity) {
                handleQuantityChange(tempQuantity);
              }
            }}
            min="1"
            max="99"
            disabled={isUpdating}
            className="quantity-input"
          />
          
          <button 
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={isUpdating || item.quantity >= 99 || item.quantity >= item.product.stock_quantity}
            className="quantity-btn"
            title={item.quantity >= item.product.stock_quantity ? 'Нет в наличии' : 'Увеличить количество'}
          >
            +
          </button>
        </div>

        <div className="item-total">
          {formatPrice(itemTotal)}
        </div>

        <button 
          onClick={handleRemove}
          disabled={isUpdating}
          className="remove-btn"
          title="Удалить из корзины"
        >
          🗑️
        </button>
      </div>

      {isUpdating && (
        <div className="updating-overlay">
          <div className="mini-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default CartItem;