import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import './ProductQuickAdd.css';

const ProductQuickAdd = ({ onClose, onSuccess }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock_quantity: '',
    is_gluten_free: false,
    is_low_protein: false,
    is_lactose_free: false,
    is_egg_free: false,
    is_active: true
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      console.log('Fetching categories...');
      
      const response = await api.get('/products/categories/');
      console.log('Categories response:', response.data);
      
      // Handle both paginated and non-paginated responses
      const categoriesData = response.data.results || response.data;
      console.log('Categories data:', categoriesData);
      console.log('Is array?', Array.isArray(categoriesData));
      console.log('Categories count:', categoriesData.length);
      
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]); // Ensure categories is always an array
      
      // More detailed error handling
      if (error.status === 401) {
        setError('Необходимо войти в систему для загрузки категорий');
      } else if (error.status === 403) {
        setError('Недостаточно прав для загрузки категорий');
      } else if (error.code === 'NETWORK_ERROR') {
        setError('Ошибка сети. Проверьте подключение.');
      } else {
        setError('Не удалось загрузить категории: ' + (error.message || 'Неизвестная ошибка'));
      }
    } finally {
      setCategoriesLoading(false);
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[а-я]/g, (char) => {
        const map = {
          'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
          'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
          'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
          'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
          'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        };
        return map[char] || char;
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        slug: generateSlug(formData.name),
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        category: parseInt(formData.category)
      };

      await api.post('/products/products/', submitData);
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || 'Ошибка создания товара');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quick-add-overlay">
      <div className="quick-add-modal">
        <div className="modal-header">
          <h3>Быстрое добавление товара</h3>
          <button className="close-btn" onClick={onClose} disabled={loading}>
            ×
          </button>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}



        <form onSubmit={handleSubmit} className="quick-add-form">
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
              placeholder="Введите название товара"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Краткое описание *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              disabled={loading}
              rows="3"
              placeholder="Краткое описание товара"
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
                disabled={loading || categoriesLoading}
              >
                <option value="">
                  {categoriesLoading ? 'Загрузка категорий...' : 'Выберите категорию'}
                </option>
                {Array.isArray(categories) && categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {categoriesLoading && (
                <div className="loading-text">Загрузка категорий...</div>
              )}
              {!categoriesLoading && categories.length === 0 && (
                <div className="error-text">Категории не найдены</div>
              )}
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
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="stock_quantity">Количество *</label>
              <input
                type="number"
                id="stock_quantity"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleInputChange}
                min="0"
                required
                disabled={loading}
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-checkboxes">
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
                name="is_lactose_free"
                checked={formData.is_lactose_free}
                onChange={handleInputChange}
                disabled={loading}
              />
              <span className="checkmark"></span>
              Без лактозы
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_egg_free"
                checked={formData.is_egg_free}
                onChange={handleInputChange}
                disabled={loading}
              />
              <span className="checkmark"></span>
              Без яиц
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

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
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
                  Создание...
                </>
              ) : (
                <>
                  <span className="btn-icon">✓</span>
                  Создать товар
                </>
              )}
            </button>
          </div>
        </form>

        <div className="quick-add-note">
          <p>💡 <strong>Совет:</strong> После создания товара вы сможете добавить изображения и расширенную информацию в разделе "Управление товарами"</p>
        </div>
      </div>
    </div>
  );
};

export default ProductQuickAdd;