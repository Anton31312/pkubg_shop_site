import React, { useState, useEffect } from 'react';
import ProductForm from './ProductForm';
import ProductList from './ProductList';
import ProductImageUpload from './ProductImageUpload';
import api from '../../utils/api';
import { generateSlug } from '../../utils/transliterate';
import './ProductManagement.css';

const ProductManagement = () => {
  // User role checking is handled by ProtectedRoute component
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products/products/');
      setProducts(response.data.results || response.data);
    } catch (error) {
      setError('Ошибка загрузки товаров');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('ProductManagement: Fetching categories...');
      const response = await api.get('/products/categories/');
      console.log('ProductManagement: Categories response:', response.data);
      
      // Handle both paginated and non-paginated responses
      const categoriesData = response.data.results || response.data;
      console.log('ProductManagement: Categories data:', categoriesData);
      console.log('ProductManagement: Is array?', Array.isArray(categoriesData));
      
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]); // Ensure categories is always an array
    }
  };

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      try {
        await api.delete(`/products/products/${productId}/`);
        await fetchProducts();
      } catch (error) {
        setError('Ошибка удаления товара');
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      console.log('ProductManagement: Submitting form data:', formData);
      
      // Ensure proper data types and required fields
      const submitData = {
        ...formData,
        category: parseInt(formData.category),
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        // Ensure slug is present and limited to 50 characters
        slug: formData.slug || generateSlug(formData.name)
      };
      
      console.log('ProductManagement: Processed submit data:', submitData);
      
      if (selectedProduct) {
        await api.put(`/products/products/${selectedProduct.id}/`, submitData);
      } else {
        await api.post('/products/products/', submitData);
      }
      await fetchProducts();
      setShowForm(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('ProductManagement: Submit error:', error);
      console.error('ProductManagement: Error response:', error.response?.data);
      throw error; // Let the form handle the error
    }
  };

  const handleImageUpload = (product) => {
    setSelectedProduct(product);
    setShowImageUpload(true);
  };

  const handleImageUploadComplete = () => {
    setShowImageUpload(false);
    setSelectedProduct(null);
    fetchProducts(); // Refresh to show new images
  };

  const handleToggleActive = async (product) => {
    try {
      await api.patch(`/products/products/${product.id}/toggle_active/`);
      await fetchProducts(); // Refresh the list
      
      // Show success message
      const message = product.is_active ? 'Товар скрыт' : 'Товар показан';
      // You can add a toast notification here if you have one
      console.log(message);
    } catch (error) {
      setError('Ошибка изменения статуса товара');
      console.error('Error toggling product status:', error);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || product.category?.id.toString() === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && product.is_active) ||
                         (filterStatus === 'inactive' && !product.is_active);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <div className="product-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка товаров...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-management">
      <div className="product-management-header">
        <div className="header-content">
          <h1>Управление товарами</h1>
          <p className="header-subtitle">
            Добавляйте, редактируйте и управляйте товарами в каталоге
          </p>
        </div>
        <button 
          className="btn btn-primary create-btn"
          onClick={handleCreateProduct}
        >
          <span className="btn-icon">+</span>
          Добавить товар
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
          <button 
            className="error-close"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

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
            {Array.isArray(categories) && categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
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

      <ProductList
        products={filteredProducts}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        onImageUpload={handleImageUpload}
        onToggleActive={handleToggleActive}
      />

      {showForm && (
        <ProductForm
          product={selectedProduct}
          categories={categories}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {showImageUpload && selectedProduct && (
        <ProductImageUpload
          product={selectedProduct}
          onComplete={handleImageUploadComplete}
          onCancel={() => {
            setShowImageUpload(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default ProductManagement;