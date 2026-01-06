import React, { useState, useEffect } from 'react';
import { generateSlug } from '../../utils/transliterate';
import './ProductForm.css';

const ProductForm = ({ product, categories, onSubmit, onCancel }) => {
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    category: '',
    manufacturer: '',
    composition: '',
    storage_conditions: '',
    is_gluten_free: false,
    is_low_protein: false,
    stock_quantity: '',
    is_active: true,
    nutritional_info: {
      per_100g: {
        calories: 0,
        proteins: 0.0,
        fats: 0.0,
        carbohydrates: 0.0,
        fiber: 0.0,
        sugar: 0.0,
        salt: 0.0,
        sodium: 0.0
      },
      allergens: [],
      dietary_info: {
        is_vegetarian: false,
        is_vegan: false,
        is_gluten_free: false,
        is_lactose_free: false,
        is_sugar_free: false,
        is_organic: false
      }
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNutritionDetails, setShowNutritionDetails] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        price: product.price || '',
        category: product.category?.id || '',
        manufacturer: product.manufacturer || '',
        composition: product.composition || '',
        storage_conditions: product.storage_conditions || '',
        is_gluten_free: product.is_gluten_free || false,
        is_low_protein: product.is_low_protein || false,
        stock_quantity: product.stock_quantity || '',
        is_active: product.is_active !== undefined ? product.is_active : true,
        nutritional_info: product.nutritional_info || formData.nutritional_info
      });
    }
  }, [product]);



  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'name' && !product) {
      // Auto-generate slug for new products
      setFormData(prev => ({
        ...prev,
        [name]: value,
        slug: generateSlug(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleNutritionChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      nutritional_info: {
        ...prev.nutritional_info,
        [section]: {
          ...prev.nutritional_info[section],
          [field]: value
        }
      }
    }));
  };

  const handleAllergenChange = (allergen, checked) => {
    setFormData(prev => ({
      ...prev,
      nutritional_info: {
        ...prev.nutritional_info,
        allergens: checked
          ? [...prev.nutritional_info.allergens, allergen]
          : prev.nutritional_info.allergens.filter(a => a !== allergen)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);



    try {
      await onSubmit(formData);
    } catch (error) {
      setError(error.response?.data?.message || 'Ошибка сохранения товара');
    } finally {
      setLoading(false);
    }
  };

  const allergenOptions = [
    'глютен', 'молоко', 'яйца', 'орехи', 'соя', 'рыба', 'моллюски', 'кунжут'
  ];

  return (
    <div className="product-form-overlay">
      <div className="product-form-modal">
        <div className="form-header">
          <h2>{product ? 'Редактировать товар' : 'Добавить новый товар'}</h2>
          <button className="close-btn" onClick={onCancel} disabled={loading}>
            ×
          </button>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-section">
            <h3>Основная информация</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Название товара *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="slug">URL (slug) *</label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  placeholder="url-friendly-name"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Описание *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                required
                disabled={loading}
                placeholder="Подробное описание товара..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="manufacturer">Производитель</label>
              <input
                type="text"
                id="manufacturer"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="Название компании-производителя"
              />
            </div>

            <div className="form-group">
              <label htmlFor="composition">Состав</label>
              <textarea
                id="composition"
                name="composition"
                value={formData.composition}
                onChange={handleInputChange}
                rows="4"
                disabled={loading}
                placeholder="Укажите состав продукта, включая все ингредиенты в порядке убывания их массовой доли"
              />
            </div>

            <div className="form-group">
              <label htmlFor="storage_conditions">Условия хранения</label>
              <textarea
                id="storage_conditions"
                name="storage_conditions"
                value={formData.storage_conditions}
                onChange={handleInputChange}
                rows="3"
                disabled={loading}
                placeholder="Например: Хранить в сухом прохладном месте при температуре не выше +25°C. Беречь от прямых солнечных лучей."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Категория *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                >
                  <option value="">Выберите категорию</option>
                  {Array.isArray(categories) && categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="price">Цена (₽) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="stock_quantity">Количество на складе *</label>
                <input
                  type="number"
                  id="stock_quantity"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  min="0"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Характеристики продукта</h3>
            
            <div className="checkbox-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_gluten_free"
                  checked={formData.is_gluten_free}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <span className="checkmark"></span>
                Безглютеновый продукт
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_low_protein"
                  checked={formData.is_low_protein}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <span className="checkmark"></span>
                Низкобелковый продукт
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <span className="checkmark"></span>
                Активный товар
              </label>
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h3>Пищевая ценность</h3>
              <button
                type="button"
                className="toggle-btn"
                onClick={() => setShowNutritionDetails(!showNutritionDetails)}
              >
                {showNutritionDetails ? 'Скрыть детали' : 'Показать детали'}
              </button>
            </div>

            {showNutritionDetails && (
              <div className="nutrition-details">
                <h4>На 100г продукта</h4>
                <div className="nutrition-grid">
                  <div className="form-group">
                    <label>Калории (ккал)</label>
                    <input
                      type="number"
                      value={formData.nutritional_info.per_100g.calories}
                      onChange={(e) => handleNutritionChange('per_100g', 'calories', Number(e.target.value))}
                      min="0"
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Белки (г)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.nutritional_info.per_100g.proteins}
                      onChange={(e) => handleNutritionChange('per_100g', 'proteins', Number(e.target.value))}
                      min="0"
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Жиры (г)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.nutritional_info.per_100g.fats}
                      onChange={(e) => handleNutritionChange('per_100g', 'fats', Number(e.target.value))}
                      min="0"
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label>Углеводы (г)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.nutritional_info.per_100g.carbohydrates}
                      onChange={(e) => handleNutritionChange('per_100g', 'carbohydrates', Number(e.target.value))}
                      min="0"
                      disabled={loading}
                    />
                  </div>
                </div>

                <h4>Аллергены</h4>
                <div className="allergen-grid">
                  {allergenOptions.map(allergen => (
                    <label key={allergen} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.nutritional_info.allergens.includes(allergen)}
                        onChange={(e) => handleAllergenChange(allergen, e.target.checked)}
                        disabled={loading}
                      />
                      <span className="checkmark"></span>
                      {allergen}
                    </label>
                  ))}
                </div>

                <h4>Диетические характеристики</h4>
                <div className="dietary-grid">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.nutritional_info.dietary_info.is_vegetarian}
                      onChange={(e) => handleNutritionChange('dietary_info', 'is_vegetarian', e.target.checked)}
                      disabled={loading}
                    />
                    <span className="checkmark"></span>
                    Vegetarian
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.nutritional_info.dietary_info.is_vegan}
                      onChange={(e) => handleNutritionChange('dietary_info', 'is_vegan', e.target.checked)}
                      disabled={loading}
                    />
                    <span className="checkmark"></span>
                    Vegan
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.nutritional_info.dietary_info.is_organic}
                      onChange={(e) => handleNutritionChange('dietary_info', 'is_organic', e.target.checked)}
                      disabled={loading}
                    />
                    <span className="checkmark"></span>
                    Organic
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onCancel}
              disabled={loading}
            >
              Отмена
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner small"></span>
                  Сохранение...
                </>
              ) : (
                product ? 'Обновить товар' : 'Создать товар'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;