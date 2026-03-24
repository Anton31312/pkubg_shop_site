import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { addToCart, addToLocalCart, removeFromCart, updateCartItem } from '../../store/cartSlice';
import AdminProductActions from '../AdminToolbar/AdminProductActions';
import './ProductCard.css';

const ProductCard = ({ product, onUpdate }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);
  const { items: cartItems } = useSelector(state => state.cart);

  const [imageError, setImageError] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartError, setCartError] = useState(null);

  // Найти текущее количество этого товара в корзине
  const cartItem = cartItems?.find(
    item => item.product?.id === product.id || item.product_id === product.id
  );
  const quantityInCart = cartItem?.quantity || 0;

  // ═══ Добавление в корзину (первое нажатие) ═══
  const handleAddToCart = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (addingToCart) return;
    setAddingToCart(true);
    setCartError(null);

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
    } catch (err) {
      const message = err?.message || 'Ошибка добавления в корзину';
      setCartError(message);
      setTimeout(() => setCartError(null), 3000);
    } finally {
      setAddingToCart(false);
    }
  }, [dispatch, isAuthenticated, product, addingToCart]);

  // ═══ Увеличить количество ═══
  const handleIncrement = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (addingToCart) return;
    setAddingToCart(true);

    try {
      if (isAuthenticated && cartItem?.id) {
        await dispatch(updateCartItem({
          itemId: cartItem.id,
          quantity: quantityInCart + 1
        })).unwrap();
      } else {
        dispatch(addToLocalCart({ product, quantity: 1 }));
      }
    } catch (err) {
      const message = err?.message || 'Ошибка обновления корзины';
      setCartError(message);
      setTimeout(() => setCartError(null), 3000);
    } finally {
      setAddingToCart(false);
    }
  }, [dispatch, isAuthenticated, product, cartItem, quantityInCart, addingToCart]);

  // ═══ Уменьшить количество ═══
  const handleDecrement = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (addingToCart) return;
    setAddingToCart(true);

    try {
      if (quantityInCart <= 1) {
        // Удалить из корзины полностью
        if (isAuthenticated && cartItem?.id) {
          await dispatch(removeFromCart(cartItem.id)).unwrap();
        } else {
          // Для локальной корзины — убрать товар
          dispatch(addToLocalCart({ product, quantity: -quantityInCart }));
        }
      } else {
        // Уменьшить на 1
        if (isAuthenticated && cartItem?.id) {
          await dispatch(updateCartItem({
            itemId: cartItem.id,
            quantity: quantityInCart - 1
          })).unwrap();
        } else {
          dispatch(addToLocalCart({ product, quantity: -1 }));
        }
      }
    } catch (err) {
      const message = err?.message || 'Ошибка обновления корзины';
      setCartError(message);
      setTimeout(() => setCartError(null), 3000);
    } finally {
      setAddingToCart(false);
    }
  }, [dispatch, isAuthenticated, product, cartItem, quantityInCart, addingToCart]);

  // ═══ Форматирование цены ═══
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // ═══ Вычисляемые значения ═══
  const isOutOfStock = product.stock_quantity === 0;

  const primaryImage =
    product.images?.find(img => img.is_primary && img.image) ||
    product.images?.find(img => img.image) ||
    null;

  const showDiscount =
    product.old_price && product.old_price > product.price;

  const discountPercent = showDiscount
    ? Math.round(
        ((product.old_price - product.price) / product.old_price) * 100
      )
    : 0;

  // ═══ Рендер ═══
  return (
    <div className="product-card">

      {cartError && (
        <div className="stock-error-message" role="alert">
          {cartError}
        </div>
      )}

      <Link
        to={`/products/${product.id}`}
        className="product-link"
        aria-label={`Открыть ${product.name}`}
      >

        <div className="product-image-container">
          {primaryImage && !imageError ? (
            <img
              src={primaryImage.image}
              alt={primaryImage.alt_text || product.name}
              className="product-image"
              loading="lazy"
              onError={() => setImageError(true)}
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

          {showDiscount && (
            <div className="discount-flag">
              -{discountPercent}%
            </div>
          )}

          <div className="product-badges">
            {product.is_gluten_free && (
              <span className="badge gluten-free">Без глютена</span>
            )}
            {product.is_low_protein && (
              <span className="badge low-protein">Низкобелковый</span>
            )}
            {product.is_lactose_free && (
              <span className="badge lactose-free">Без лактозы</span>
            )}
            {product.is_egg_free && (
              <span className="badge egg-free">Без яиц</span>
            )}
          </div>
        </div>

        <div className="product-info">

          <div className="price-block">
            <span className="current-price">
              {formatPrice(product.price)}
            </span>

            {showDiscount && (
              <span className="old-price">
                {formatPrice(product.old_price)}
              </span>
            )}
          </div>

          {!isOutOfStock && product.stock_quantity < 10 && (
            <div className="stock-status low-stock">
              Осталось {product.stock_quantity} шт.
            </div>
          )}

          <h3 className="product-name">{product.name}</h3>

          {product.manufacturer && (
            <p className="product-manufacturer">
              {product.manufacturer}
            </p>
          )}

          {/* ═══ Кнопка / Счётчик ═══ */}
          {!isOutOfStock && (
            <>
              {quantityInCart === 0 ? (
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="add-to-cart-btn"
                  aria-label={`Добавить ${product.name} в корзину`}
                >
                  🛒 {addingToCart ? '...' : 'В корзину'}
                </button>
              ) : (
                <div 
                  className="quantity-counter"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                  <button
                    className="quantity-btn minus"
                    onClick={handleDecrement}
                    disabled={addingToCart}
                    aria-label="Уменьшить количество"
                  >
                    −
                  </button>
                  <span className="quantity-value">{quantityInCart}</span>
                  <button
                    className="quantity-btn plus"
                    onClick={handleIncrement}
                    disabled={addingToCart || quantityInCart >= product.stock_quantity}
                    aria-label="Увеличить количество"
                  >
                    +
                  </button>
                </div>
              )}
            </>
          )}

          {isOutOfStock && (
            <div className="out-of-stock-label">
              Нет в наличии
            </div>
          )}
        </div>
      </Link>

      <AdminProductActions product={product} onUpdate={onUpdate} />
    </div>
  );
};

export default ProductCard;