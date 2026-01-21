import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { addToCart, addToLocalCart, clearCartError } from '../../store/cartSlice';
import AdminProductActions from '../AdminToolbar/AdminProductActions';
import './ProductCard.css';

const ProductCard = ({ product, onUpdate }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);
  const { loading, error } = useSelector(state => state.cart);
  const [imageError, setImageError] = React.useState(false);
  const [showError, setShowError] = React.useState(false);

  // Show error message when cart error occurs
  useEffect(() => {
    if (error && (error.type === 'STOCK_UNAVAILABLE' || error.type === 'INSUFFICIENT_STOCK')) {
      setShowError(true);
      // Auto-hide error after 3 seconds
      const timer = setTimeout(() => {
        setShowError(false);
        dispatch(clearCartError());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (isAuthenticated) {
        await dispatch(addToCart({ 
          productId: product.id, 
          quantity: 1, 
          product 
        })).unwrap();
      } else {
        dispatch(addToLocalCart({ product, quantity: 1 }));
      }
    } catch (error) {
      // Error is handled by useEffect above
      console.log('Stock check failed:', error.message);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isOutOfStock = product.stock_quantity === 0;
  const primaryImage = product.images?.find(img => img.is_primary && img.image) || 
                      product.images?.find(img => img.image) || 
                      null;
  
  // Calculate discount if applicable
  const oldPrice = product.old_price || product.price * 1.2;
  const showDiscount = product.old_price && product.old_price > product.price;
  const discountPercent = showDiscount ? Math.round(((oldPrice - product.price) / oldPrice) * 100) : 0;

  return (
    <div className="product-card">
      {/* Stock error message */}
      {showError && error && (
        <div className="stock-error-message">
          {error.message}
        </div>
      )}
      
      {/* Admin actions overlay */}
      <AdminProductActions product={product} onUpdate={onUpdate} />
      
      <Link to={`/products/${product.id}`} className="product-link">
        <div className="product-image-container">
          {primaryImage && !imageError ? (
            <img 
              src={primaryImage.image} 
              alt={primaryImage.alt_text || product.name}
              className="product-image"
              onError={() => setImageError(true)}
              onLoad={() => setImageError(false)}
            />
          ) : (
            <div className="product-image-placeholder">
              📦
            </div>
          )}
          
          {isOutOfStock && (
            <div className="out-of-stock-overlay">
              Нет в наличии
            </div>
          )}
          
          <div className="product-badges">
            {product.is_gluten_free && (
              <span className="badge gluten-free">Без глютена</span>
            )}
            {product.is_low_protein && (
              <span className="badge low-protein">Низкобелковый</span>
            )}
          </div>
        </div>

        <div className="product-info">
          <div className="price-header">
            <div className="price-block">
              <span className="current-price">{formatPrice(product.price)}</span>
              {showDiscount && (
                <div className="price-details">
                  <span className="old-price">{formatPrice(oldPrice)}</span>
                  <span className="discount-badge">-{discountPercent}%</span>
                </div>
              )}
              {!isOutOfStock && product.stock_quantity < 10 && (
                <div className="stock-status low-stock">
                  Осталось {product.stock_quantity} шт.
                </div>
              )}
            </div>
          </div>
          
          <h3 className="product-name">{product.name}</h3>
          
          {product.manufacturer && (
            <p className="product-manufacturer">
              {product.manufacturer}
            </p>
          )}

          {!isOutOfStock && (
            <button 
              onClick={handleAddToCart}
              disabled={loading}
              className="add-to-cart-btn"
            >
              🛒 {loading ? 'Добавление...' : 'В корзину'}
            </button>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;