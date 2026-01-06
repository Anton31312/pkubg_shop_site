import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import './ProductManagement.css';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    is_gluten_free: false,
    is_low_protein: false,
    stock_quantity: '',
    nutritional_info: {},
    is_active: true
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products/');
      setProducts(response.data.results || response.data);
    } catch (error) {
      setError('Ошибка загрузки товаров');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories/');
      // Handle both paginated and non-paginated responses
      const categoriesData = response.data.results || response.data;
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
      setCategories([]); // Ensure categories is always an array
    }
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
    setError(null);

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}/`, formData);
      } else {
        await api.post('/products/', formData);
      }
      
      fetchProducts();
      resetForm();
    } catch (error) {
      setError(editingProduct ? 'Ошибка обновления товара' : 'Ошибка создания товара');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category.id,
      is_gluten_free: product.is_gluten_free,
      is_low_protein: product.is_low_protein,
      stock_quantity: product.stock_quantity,
      nutritional_info: product.nutritional_info || {},
      is_active: product.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      try {
        await api.delete(`/products/${productId}/`);
        fetchProducts();
      } catch (error) {
        setError('Ошибка удаления товара');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      is_gluten_free: false,
      is_low_protein: false,
      stock_quantity: '',
      nutritional_info: {},
      is_active: true
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="loading">Загрузка товаров...</div>;
  }

  return (
    <div className="product-management">
      <div className="management-header">
        <h2>Управление товарами</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          + Добавить товар
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="product-form-overlay">
          <div className="product-form-modal">
            <div className="form-header">
              <h3>{editingProduct ? 'Редактировать товар' : 'Добавить товар'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="product-form">
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
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="category">Категория *</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Выберите категорию</option>
                    {Array.isArray(categories) && categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
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
                />
              </div>

              <div className="form-row">
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
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_gluten_free"
                      checked={formData.is_gluten_free}
                      onChange={handleInputChange}
                    />
                    Безглютеновый продукт
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_low_protein"
                      checked={formData.is_low_protein}
                      onChange={handleInputChange}
                    />
                    Низкобелковый продукт
                  </label>
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                  Активный товар
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Обновить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="products-table">
        <table>
          <thead>
            <tr>
              <th>Название</th>
              <th>Категория</th>
              <th>Цена</th>
              <th>Остаток</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>
                  <div className="product-info">
                    <strong>{product.name}</strong>
                    <div className="product-badges">
                      {product.is_gluten_free && <span className="badge gluten-free">Без глютена</span>}
                      {product.is_low_protein && <span className="badge low-protein">Низкобелковый</span>}
                    </div>
                  </div>
                </td>
                <td>{product.category?.name || 'Без категории'}</td>
                <td>{product.price} ₽</td>
                <td>
                  <span className={`stock ${product.stock_quantity === 0 ? 'out-of-stock' : ''}`}>
                    {product.stock_quantity}
                  </span>
                </td>
                <td>
                  <span className={`status ${product.is_active ? 'active' : 'inactive'}`}>
                    {product.is_active ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <button 
                      className="btn btn-sm btn-edit"
                      onClick={() => handleEdit(product)}
                    >
                      Редактировать
                    </button>
                    <button 
                      className="btn btn-sm btn-delete"
                      onClick={() => handleDelete(product.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {products.length === 0 && (
          <div className="no-products">
            <p>Товары не найдены. Добавьте первый товар.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagement;