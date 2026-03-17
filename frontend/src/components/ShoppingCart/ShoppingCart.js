import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

import { 
  fetchCart, 
  updateCartItem, 
  removeFromCart, 
  updateLocalCartItem, 
  updateLocalCartItemAsync,
  removeFromLocalCart,
  clearCartError
} from '../../store/cartSlice';
import CartItem from './CartItem';
import './ShoppingCart.css';

const ShoppingCart = () => {
  const dispatch = useDispatch();
  const { items, total, count, loading, error } = useSelector(state => state.cart);
  const { isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);



  const handleUpdateQuantity = async (itemId, quantity) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
      return { success: true };
    }

    try {
      if (isAuthenticated) {
        await dispatch(updateCartItem({ itemId, quantity })).unwrap();
        return { success: true };
      } else {
        await dispatch(updateLocalCartItemAsync({ itemId, quantity })).unwrap();
        return { success: true };
      }
    } catch (error) {
      // Just log the error, don't show it to user
      console.log('Stock limit reached for item:', itemId);
      return { success: true }; // Always return success to avoid UI errors
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      if (isAuthenticated) {
        await dispatch(removeFromCart(itemId)).unwrap();
      } else {
        dispatch(removeFromLocalCart(itemId));
      }
    } catch (error) {
      console.error('Error removing cart item:', error);
      // Optionally show error message to user
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Don't show error for stock issues, only for real loading errors
  if (error && error.type !== 'STOCK_UNAVAILABLE' && error.type !== 'INSUFFICIENT_STOCK' && error.type !== 'SERVER_ERROR') {
    return (
      <div className="cart-error">
        <h3>Ошибка загрузки корзины</h3>
        <p>{error.message || 'Попробуйте обновить страницу'}</p>
      </div>
    );
  }

  return (
    <div className="shopping-cart">
      <div className="cart-header">
        <h2>Корзина покупок</h2>
        {count > 0 && (
          <span className="cart-count-badge">
            {count} {count === 1 ? 'товар' : count < 5 ? 'товара' : 'товаров'}
          </span>
        )}
      </div>

      {loading ? (
        <div className="cart-loading">
          <div className="spinner"></div>
          <p>Загрузка корзины...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h3>Корзина пуста</h3>
          <p>Добавьте товары из каталога, чтобы оформить заказ</p>
          <Link to="/catalog/" className="continue-shopping-btn">
            Перейти к покупкам
          </Link>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            {items.map(item => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveItem}
                loading={loading}
              />
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-card">
              <h3>Итого к оплате</h3>
              
              <div className="summary-details">
                <div className="summary-row">
                  <span>Товары ({count} {count === 1 ? 'товар' : count < 5 ? 'товара' : 'товаров'}):</span>
                  <span>{formatPrice(total)}</span>
                </div>
                
                <div className="summary-row">
                  <span>Доставка:</span>
                  <span className="delivery-note">Рассчитается при оформлении</span>
                </div>
                
                <div className="summary-row discount">
                  <span>Скидка:</span>
                  <span>—</span>
                </div>
              </div>
              
              <hr className="summary-divider" />
              
              <div className="summary-row total">
                <span>Итого:</span>
                <span className="total-amount">{formatPrice(total)}</span>
              </div>
              
              <div className="cart-actions">
                {isAuthenticated ? (
                  <Link to="/checkout" className="checkout-btn">
                    Оформить заказ
                  </Link>
                ) : (
                  <div className="auth-required">
                    <p>Для оформления заказа необходимо войти в систему</p>
                    <Link to="/login" className="login-btn">
                      Войти
                    </Link>
                    <Link to="/register" className="register-btn">
                      Регистрация
                    </Link>
                  </div>
                )}
                
                <Link to="/products" className="continue-shopping">
                  ← Продолжить покупки
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingCart;

// Будет реализовано позже
//<div className="savings-info">
              //   {total > 2000 && (
              //     <div className="free-delivery">
              //       ✅ Бесплатная доставка при заказе от 2000 ₽
              //     </div>
              //   )}
              //   {total < 2000 && (
              //     <div className="delivery-threshold">
              //       Добавьте товаров на {formatPrice(2000 - total)} для бесплатной доставки
              //     </div>
              //   )}
              // </div> 


