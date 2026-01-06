import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProductById, fetchProducts } from '../../store/productsSlice';
import { addToCart, addToLocalCart, clearCartError } from '../../store/cartSlice';
import ProductCard from '../ProductCard/ProductCard';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentProduct, items: allProducts, loading, error } = useSelector(state => state.products);
  const { isAuthenticated } = useSelector(state => state.auth);
  const { loading: cartLoading, error: cartError } = useSelector(state => state.cart);
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [showCartError, setShowCartError] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    // Fetch related products when current product is loaded
    if (currentProduct?.category) {
      dispatch(fetchProducts({ category: currentProduct.category.id }));
    }
  }, [dispatch, currentProduct]);

  // Handle cart errors
  useEffect(() => {
    if (cartError && (cartError.type === 'STOCK_UNAVAILABLE' || cartError.type === 'INSUFFICIENT_STOCK')) {
      setShowCartError(true);
      // Auto-hide error after 4 seconds
      const timer = setTimeout(() => {
        setShowCartError(false);
        dispatch(clearCartError());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [cartError, dispatch]);

  const handleAddToCart = async () => {
    if (!currentProduct) return;

    try {
      if (isAuthenticated) {
        await dispatch(addToCart({ 
          productId: currentProduct.id, 
          quantity,
          product: currentProduct
        })).unwrap();
        // Show success message
        console.log('Product added to cart successfully');
      } else {
        dispatch(addToLocalCart({ 
          product: currentProduct, 
          quantity 
        }));
        // Check if there was an error (handled by useEffect)
        if (!cartError) {
          console.log('Product added to local cart successfully');
        }
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

  const getRelatedProducts = () => {
    if (!currentProduct || !allProducts) return [];
    
    return allProducts
      .filter(product => 
        product.category.id === currentProduct.category.id && 
        product.id !== currentProduct.id
      )
      .slice(0, 4); // Show max 4 related products
  };

  const renderNutritionalInfo = () => {
    if (!currentProduct?.nutritional_info?.per_100g) return null;

    const nutrition = currentProduct.nutritional_info.per_100g;
    
    return (
      <div className="nutritional-info">
        <h4>Пищевая ценность на 100г</h4>
        <div className="nutrition-grid">
          <div className="nutrition-item">
            <span className="nutrition-label">Калории:</span>
            <span className="nutrition-value">{nutrition.calories} ккал</span>
          </div>
          <div className="nutrition-item">
            <span className="nutrition-label">Белки:</span>
            <span className="nutrition-value">{nutrition.proteins} г</span>
          </div>
          <div className="nutrition-item">
            <span className="nutrition-label">Жиры:</span>
            <span className="nutrition-value">{nutrition.fats} г</span>
          </div>
          <div className="nutrition-item">
            <span className="nutrition-label">Углеводы:</span>
            <span className="nutrition-value">{nutrition.carbohydrates} г</span>
          </div>
          <div className="nutrition-item">
            <span className="nutrition-label">Клетчатка:</span>
            <span className="nutrition-value">{nutrition.fiber} г</span>
          </div>
          <div className="nutrition-item">
            <span className="nutrition-label">Сахар:</span>
            <span className="nutrition-value">{nutrition.sugar} г</span>
          </div>
        </div>
      </div>
    );
  };

  const renderAllergens = () => {
    const allergens = currentProduct?.nutritional_info?.allergens;
    if (!allergens || allergens.length === 0) return null;

    return (
      <div className="allergens-info">
        <h4>Аллергены</h4>
        <div className="allergens-list">
          {allergens.map((allergen, index) => (
            <span key={index} className="allergen-badge">
              {allergen}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderDietaryInfo = () => {
    const dietary = currentProduct?.nutritional_info?.dietary_info;
    if (!dietary) return null;

    const dietaryFeatures = [];
    if (dietary.is_vegetarian) dietaryFeatures.push('Вегетарианский');
    if (dietary.is_vegan) dietaryFeatures.push('Веганский');
    if (dietary.is_gluten_free) dietaryFeatures.push('Без глютена');
    if (dietary.is_lactose_free) dietaryFeatures.push('Без лактозы');
    if (dietary.is_organic) dietaryFeatures.push('Органический');

    if (dietaryFeatures.length === 0) return null;

    return (
      <div className="dietary-info">
        <h4>Особенности</h4>
        <div className="dietary-features">
          {dietaryFeatures.map((feature, index) => (
            <span key={index} className="dietary-badge">
              ✓ {feature}
            </span>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="product-detail-loading">
        <div className="spinner"></div>
        <p>Загрузка товара...</p>
      </div>
    );
  }

  if (error || !currentProduct) {
    return (
      <div className="product-detail-error">
        <h2>Товар не найден</h2>
        <p>Запрашиваемый товар не существует или был удален.</p>
        <button onClick={() => navigate('/')} className="back-btn">
          Вернуться к каталогу
        </button>
      </div>
    );
  }

  const relatedProducts = getRelatedProducts();
  const primaryImage = currentProduct.images?.find(img => img.is_primary) || currentProduct.images?.[0];

  return (
    <div className="product-detail">
      {/* Back to Catalog Link */}
      <div className="back-to-catalog">
        <Link to="/" className="back-link">
          ← Вернуться в каталог товаров
        </Link>
      </div>

      {/* Breadcrumbs */}
      <nav className="breadcrumbs">
        <Link to="/">Главная</Link>
        <span>/</span>
        <Link to={`/?category=${currentProduct.category.id}`}>
          {currentProduct.category.name}
        </Link>
        <span>/</span>
        <span>{currentProduct.name}</span>
      </nav>

      {/* Product Main Info */}
      <div className="product-main">
        <div className="product-images">
          <div className="main-image">
            {currentProduct.images && currentProduct.images.length > 0 ? (
              <img 
                src={currentProduct.images[selectedImage]?.image || primaryImage?.image} 
                alt={currentProduct.images[selectedImage]?.alt_text || currentProduct.name}
              />
            ) : (
              <div className="image-placeholder">
                <span>📦</span>
                <p>Изображение недоступно</p>
              </div>
            )}
          </div>
          
          {currentProduct.images && currentProduct.images.length > 1 && (
            <div className="image-thumbnails">
              {currentProduct.images.map((image, index) => (
                <button
                  key={index}
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={image.image} alt={image.alt_text} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <h1>{currentProduct.name}</h1>
          
          {currentProduct.manufacturer && (
            <div className="product-manufacturer">
              <span className="manufacturer-label">Производитель:</span>
              <span className="manufacturer-name">{currentProduct.manufacturer}</span>
            </div>
          )}
          
          <div className="product-badges">
            {currentProduct.is_gluten_free && (
              <span className="badge gluten-free">Без глютена</span>
            )}
            {currentProduct.is_low_protein && (
              <span className="badge low-protein">Низкобелковый</span>
            )}
          </div>

          <div className="product-price">
            {formatPrice(currentProduct.price)}
          </div>

          <div className="product-stock">
            {currentProduct.stock_quantity > 0 ? (
              <span className="in-stock">✓ В наличии ({currentProduct.stock_quantity} шт.)</span>
            ) : (
              <span className="out-of-stock">✗ Нет в наличии</span>
            )}
          </div>

          <div className="purchase-controls">
            <div className="quantity-selector">
              <label>Количество:</label>
              <div className="quantity-controls">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max={currentProduct.stock_quantity}
                />
                <button 
                  onClick={() => setQuantity(Math.min(currentProduct.stock_quantity, quantity + 1))}
                  disabled={quantity >= currentProduct.stock_quantity}
                >
                  +
                </button>
              </div>
            </div>

            {/* Stock error message */}
            {showCartError && cartError && (
              <div className="stock-error-message">
                {cartError.message}
              </div>
            )}

            <button 
              className="add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={cartLoading || currentProduct.stock_quantity === 0}
            >
              {cartLoading ? 'Добавление...' : 'Добавить в корзину'}
            </button>
          </div>

          <div className="product-summary">
            <p>{currentProduct.description}</p>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="product-tabs">
        <div className="tab-buttons">
          <button 
            className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            Описание
          </button>
          <button 
            className={`tab-btn ${activeTab === 'nutrition' ? 'active' : ''}`}
            onClick={() => setActiveTab('nutrition')}
          >
            Состав и пищевая ценность
          </button>
          <button 
            className={`tab-btn ${activeTab === 'storage' ? 'active' : ''}`}
            onClick={() => setActiveTab('storage')}
          >
            Хранение
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'description' && (
            <div className="tab-panel">
              <p>{currentProduct.description}</p>
              {renderDietaryInfo()}
              {renderAllergens()}
            </div>
          )}
          
          {activeTab === 'nutrition' && (
            <div className="tab-panel">
              {currentProduct.composition && (
                <div className="composition-info">
                  <h4>Состав</h4>
                  <p className="composition-text">{currentProduct.composition}</p>
                </div>
              )}
              {renderNutritionalInfo()}
            </div>
          )}
          
          {activeTab === 'storage' && (
            <div className="tab-panel">
              {currentProduct.storage_conditions ? (
                <div className="storage-info">
                  <h4>Условия хранения</h4>
                  <p className="storage-text">{currentProduct.storage_conditions}</p>
                </div>
              ) : currentProduct.nutritional_info?.storage_info ? (
                <div className="storage-info">
                  <h4>Условия хранения</h4>
                  <p><strong>Температура:</strong> {currentProduct.nutritional_info.storage_info.temperature}</p>
                  <p><strong>Срок годности:</strong> {currentProduct.nutritional_info.storage_info.shelf_life_days} дней</p>
                  <p><strong>Условия:</strong> {currentProduct.nutritional_info.storage_info.storage_conditions}</p>
                </div>
              ) : (
                <p>Информация о хранении не указана.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="related-products">
          <h2>Похожие товары</h2>
          <div className="related-products-grid">
            {relatedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;