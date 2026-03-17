import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { addToCart, addToLocalCart } from '../../store/cartSlice';
import AdminProductActions from '../AdminToolbar/AdminProductActions';
import './ProductCard.css';

const ProductCard = ({ product, onUpdate }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);

  const [imageError, setImageError] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartError, setCartError] = useState(null);

  // ═══ Добавление в корзину ═══
  const handleAddToCart = useCallback(async (e) => {
    // Блокируем переход по Link
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

      {/* ── Ошибка добавления в корзину (локальная) ── */}
      {cartError && (
        <div className="stock-error-message" role="alert">
          {cartError}
        </div>
      )}

      {/* ── Основная ссылка — вся карточка кликабельна ── */}
      <Link
        to={`/products/${product.id}`}
        className="product-link"
        aria-label={`Открыть ${product.name}`}
      >

        {/* ── Изображение ── */}
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

          {/* Оверлей "Нет в наличии" — не блокирует клики */}
          {isOutOfStock && (
            <div className="out-of-stock-overlay">
              Нет в наличии
            </div>
          )}

          {/* Скидка */}
          {showDiscount && (
            <div className="discount-flag">
              -{discountPercent}%
            </div>
          )}

          {/* Бейджи — не блокируют клики */}
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

        {/* ── Информация о товаре ── */}
        <div className="product-info">

          {/* Цена */}
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

          {/* Остаток (мало) */}
          {!isOutOfStock && product.stock_quantity < 10 && (
            <div className="stock-status low-stock">
              Осталось {product.stock_quantity} шт.
            </div>
          )}

          {/* Название */}
          <h3 className="product-name">{product.name}</h3>

          {/* Производитель */}
          {product.manufacturer && (
            <p className="product-manufacturer">
              {product.manufacturer}
            </p>
          )}

          {/* Кнопка "В корзину" */}
          {!isOutOfStock && (
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="add-to-cart-btn"
              aria-label={`Добавить ${product.name} в корзину`}
            >
              🛒 {addingToCart ? 'Добавление...' : 'В корзину'}
            </button>
          )}

          {/* Кнопка для товара не в наличии */}
          {isOutOfStock && (
            <div className="out-of-stock-label">
              Нет в наличии
            </div>
          )}
        </div>
      </Link>

      {/* ── Админ-панель — ПОСЛЕ Link, компактная в углу ── */}
      {/* Не перекрывает карточку, только маленький бейдж + dropdown */}
      <AdminProductActions product={product} onUpdate={onUpdate} />
    </div>
  );
};

export default ProductCard;