import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/apiConfig';
import { generateSlug } from '../../utils/transliterate';
import './AdminComponents.css';

const ProductManagement = () => {
  const { user } = useSelector(state => state.auth);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    category: '',
    is_gluten_free: false,
    is_low_protein: false,
    stock_quantity: 0,
    is_active: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Check if user has admin/manager permissions
  const hasPermission = user && ['admin', 'manager'].includes(user.role);

  useEffect(() => {
    if (hasPermission) {
      fetchProducts();
      fetchCategories();
    }
  }, [hasPermission]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products/products/');
      const productsData = response.data.results || response.data;
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await api.get('/products/categories/');
      const categoriesData = response.data.results || response.data;
      console.log('Categories data received:', categoriesData);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Auto-generate slug from name
    if (name === 'name' && value.trim()) {
      const slug = generateSlug(value);
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);
    
    // Create preview URLs
    const previews = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));
    setImagePreview(previews);
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    
    // Revoke URL to prevent memory leaks
    URL.revokeObjectURL(imagePreview[index].url);
    
    setSelectedImages(newImages);
    setImagePreview(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Debug: log the form data being sent
      console.log('Form data being sent:', formData);
      
      // Validate required fields
      if (!formData.name || !formData.description || !formData.price || !formData.category) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
      }
      
      // Prepare data for API
      const apiData = {
        ...formData,
        category: parseInt(formData.category), // Ensure category is integer
        price: parseFloat(formData.price), // Ensure price is number
        stock_quantity: parseInt(formData.stock_quantity) || 0
      };
      
      console.log('API data being sent:', apiData);
      
      let productResponse;
      if (editingProduct) {
        productResponse = await api.put(`/products/products/${editingProduct.slug}/`, apiData);
      } else {
        productResponse = await api.post('/products/products/', apiData);
      }
      
      console.log('Product response:', productResponse.data);
      
      // Upload images if any selected
      if (selectedImages.length > 0) {
        const productSlug = editingProduct ? editingProduct.slug : productResponse.data.slug;
        
        for (let i = 0; i < selectedImages.length; i++) {
          const formDataImage = new FormData();
          formDataImage.append('image', selectedImages[i]);
          formDataImage.append('alt_text', `${formData.name} - изображение ${i + 1}`);
          formDataImage.append('is_primary', i === 0); // First image is primary
          
          try {
            await api.post(`/products/products/${productSlug}/upload_image/`, formDataImage, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
          } catch (imageError) {
            console.error('Error uploading image:', imageError);
          }
        }
      }
      
      await fetchProducts();
      resetForm();
      alert('Продукт успешно сохранен!');
    } catch (error) {
      console.error('Error saving product:', error);
      if (error.response && error.response.data) {
        const errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data);
        alert(`Ошибка при сохранении продукта: ${errorMessage}`);
      } else {
        alert('Ошибка при сохранении продукта');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      category: product.category_detail ? product.category_detail.id : product.category,
      is_gluten_free: product.is_gluten_free,
      is_low_protein: product.is_low_protein,
      stock_quantity: product.stock_quantity,
      is_active: product.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (product) => {
    if (window.confirm(`Вы уверены, что хотите удалить продукт "${product.name}"?`)) {
      try {
        setLoading(true);
        await api.delete(`/products/products/${product.slug}/`);
        await fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Ошибка при удалении продукта');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: '',
      category: '',
      is_gluten_free: false,
      is_low_protein: false,
      stock_quantity: 0,
      is_active: true
    });
    setEditingProduct(null);
    setShowForm(false);
    setSelectedImages([]);
    setImagePreview([]);
    
    // Clean up preview URLs
    imagePreview.forEach(preview => URL.revokeObjectURL(preview.url));
  };

  const filteredProducts = Array.isArray(products) ? products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryId = product.category_detail ? product.category_detail.id : product.category;
    const matchesCategory = !filterCategory || categoryId.toString() === filterCategory;
    return matchesSearch && matchesCategory;
  }) : [];

  if (!hasPermission) {
    return (
      <div className="admin-container">
        <div className="access-denied">
          <h2>Доступ запрещен</h2>
          <p>У вас нет прав для управления продуктами.</p>
        </div>
      </div>
    );
  }

  // Ensure categories is always an array
  const safeCategories = Array.isArray(categories) ? categories : [];

  return (
    <div className="product-management">
      <div className="product-management-header">
        <div className="header-content">
          <h2>Управление товарами</h2>
          <p className="header-subtitle">
            Добавляйте, редактируйте и управляйте товарами в каталоге
          </p>
        </div>
        <button 
          className="btn btn-primary create-btn"
          onClick={() => setShowForm(!showForm)}
        >
          <span className="btn-icon">{showForm ? '×' : '+'}</span>
          {showForm ? 'Отменить' : 'Добавить товар'}
        </button>
      </div>

      <div className="filters-section">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Поиск товаров..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="">Все категории</option>
            {safeCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="products-stats">
        <div className="stat-item">
          <span className="stat-number">{filteredProducts.length}</span>
          <span className="stat-label">Товаров найдено</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {filteredProducts.filter(p => p.is_active).length}
          </span>
          <span className="stat-label">Активных</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {filteredProducts.filter(p => p.stock_quantity === 0).length}
          </span>
          <span className="stat-label">Нет в наличии</span>
        </div>
      </div>

      {showForm && !categoriesLoading && (
        <div className="modal-overlay">
          <div className="product-form-modal">
            <div className="modal-header">
              <h3>{editingProduct ? 'Редактировать товар' : 'Добавить новый товар'}</h3>
              <button 
                className="modal-close"
                onClick={resetForm}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="product-form">
            <div className="form-row">
              <div className="form-group">
                <label>Название *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Slug *</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Описание *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Цена *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Категория *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Выберите категорию</option>
                  {safeCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Количество на складе</label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Изображения продукта</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
              />
              <small className="form-help">Можно выбрать несколько изображений. Первое изображение будет основным.</small>
              
              {imagePreview.length > 0 && (
                <div className="image-preview-container">
                  <h4>Предварительный просмотр:</h4>
                  <div className="image-preview-grid">
                    {imagePreview.map((preview, index) => (
                      <div key={index} className="image-preview-item">
                        <img src={preview.url} alt={preview.name} className="preview-image" />
                        <div className="image-preview-info">
                          <span className="image-name">{preview.name}</span>
                          {index === 0 && <span className="primary-badge">Основное</span>}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="remove-image-btn"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  Без глютена
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
                  Низкобелковый
                </label>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                  Активный
                </label>
              </div>
            </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Сохранение...' : (editingProduct ? 'Обновить' : 'Создать')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка товаров...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>Товары не найдены</h3>
          <p>
            {products.length === 0 
              ? 'Пока нет ни одного товара. Создайте первый товар!' 
              : 'Попробуйте изменить параметры поиска или фильтры'
            }
          </p>
          {products.length === 0 && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              Создать первый товар
            </button>
          )}
        </div>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Изображение</th>
                <th>Название</th>
                <th>Категория</th>
                <th>Цена</th>
                <th>Остаток</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} className={!product.is_active ? 'inactive' : ''}>
                  <td>
                    <div className="product-image">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images.find(img => img.is_primary)?.image || product.images[0]?.image} 
                          alt={product.name}
                          className="product-thumbnail"
                        />
                      ) : (
                        <div className="image-placeholder">📷</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="product-info">
                      <div className="product-name">{product.name}</div>
                      <div className="product-badges">
                        {product.is_gluten_free && (
                          <span className="badge gluten-free">Без глютена</span>
                        )}
                        {product.is_low_protein && (
                          <span className="badge low-protein">Низкобелковый</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="category-name">
                      {product.category_detail ? product.category_detail.name : 'Без категории'}
                    </span>
                  </td>
                  <td>
                    <span className="price">{product.price} ₽</span>
                  </td>
                  <td>
                    <span className={`stock-status ${product.stock_quantity === 0 ? 'out-of-stock' : product.stock_quantity < 10 ? 'low-stock' : 'in-stock'}`}>
                      <span className="stock-number">{product.stock_quantity}</span>
                      <span className="stock-text">
                        {product.stock_quantity === 0 ? 'Нет в наличии' : 
                         product.stock_quantity < 10 ? 'Мало' : 'В наличии'}
                      </span>
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${product.is_active ? 'active' : 'inactive'}`}>
                      {product.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleEdit(product)}
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(product)}
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;