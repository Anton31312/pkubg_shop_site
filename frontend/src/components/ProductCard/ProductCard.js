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
          <h3 className="product-name">{product.name}</h3>
          
          {product.manufacturer && (
            <p className="product-manufacturer">
              {product.manufacturer}
            </p>
          )}
          
          <p className="product-description">
            {product.description?.length > 100 
              ? `${product.description.substring(0, 100)}...`
              : product.description
            }
          </p>

          {product.nutritional_info && Object.keys(product.nutritional_info).length > 0 && (
            <div className="nutritional-preview">
              {product.nutritional_info.calories && (
                <span className="nutrition-item">
                  {product.nutritional_info.calories} ккал
                </span>
              )}
              {product.nutritional_info.protein && (
                <span className="nutrition-item">
                  Белки: {product.nutritional_info.protein}г
                </span>
              )}
            </div>
          )}

          <div className="product-footer">
            <div className="price-section">
              <span className="price">{formatPrice(product.price)}</span>
              {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
                <span className="stock-warning">
                  Осталось: {product.stock_quantity}
                </span>
              )}
            </div>

            {!isOutOfStock && (
              <button 
                onClick={handleAddToCart}
                disabled={loading}
                className="add-to-cart-btn"
              >
                {loading ? '...' : 'В корзину'}
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;