import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/apiConfig';
import { generateSlug } from '../../utils/transliterate';
import './AdminComponents.css';

const CategoryManagement = () => {
  const { user } = useSelector(state => state.auth);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parent: '',
    is_active: true
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Check if user has admin/manager permissions
  const hasPermission = user && ['admin', 'manager'].includes(user.role);

  useEffect(() => {
    if (hasPermission) {
      fetchCategories();
    }
  }, [hasPermission]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products/categories/');
      const categoriesData = response.data.results || response.data;
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        parent: formData.parent || null
      };
      
      if (editingCategory) {
        await api.put(`/products/categories/${editingCategory.slug}/`, submitData);
      } else {
        await api.post('/products/categories/', submitData);
      }
      
      await fetchCategories();
      resetForm();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Ошибка при сохранении категории');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parent: category.parent || '',
      is_active: category.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (category) => {
    if (window.confirm(`Вы уверены, что хотите удалить категорию "${category.name}"?`)) {
      try {
        setLoading(true);
        await api.delete(`/products/categories/${category.slug}/`);
        await fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Ошибка при удалении категории');
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
      parent: '',
      is_active: true
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  const getParentCategories = () => {
    return Array.isArray(categories) ? categories.filter(cat => !cat.parent) : [];
  };



  const filteredCategories = Array.isArray(categories) ? categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  if (!hasPermission) {
    return (
      <div className="admin-container">
        <div className="access-denied">
          <h2>Доступ запрещен</h2>
          <p>У вас нет прав для управления категориями.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="category-management">
      <div className="category-management-header">
        <div className="header-content">
          <h2>Управление категориями</h2>
          <p className="header-subtitle">
            Создавайте и организуйте категории товаров
          </p>
        </div>
        <button 
          className="btn btn-primary create-btn"
          onClick={() => setShowForm(!showForm)}
        >
          <span className="btn-icon">{showForm ? '×' : '+'}</span>
          {showForm ? 'Отменить' : 'Добавить категорию'}
        </button>
      </div>

      <div className="filters-section">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Поиск категорий..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="categories-stats">
        <div className="stat-item">
          <span className="stat-number">{filteredCategories.length}</span>
          <span className="stat-label">Категорий найдено</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {filteredCategories.filter(c => c.is_active).length}
          </span>
          <span className="stat-label">Активных</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {filteredCategories.filter(c => !c.parent).length}
          </span>
          <span className="stat-label">Корневых</span>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="category-form-modal">
            <div className="modal-header">
              <h3>{editingCategory ? 'Редактировать категорию' : 'Создать категорию'}</h3>
              <button 
                className="modal-close"
                onClick={resetForm}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="category-form">
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
              <label>Описание</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Родительская категория</label>
                <select
                  name="parent"
                  value={formData.parent}
                  onChange={handleInputChange}
                >
                  <option value="">Нет (корневая категория)</option>
                  {getParentCategories()
                    .filter(cat => !editingCategory || cat.id !== editingCategory.id)
                    .map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                  Активная
                </label>
              </div>
            </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Сохранение...' : (editingCategory ? 'Обновить' : 'Создать')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка категорий...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏷️</div>
          <h3>Категории не найдены</h3>
          <p>
            {categories.length === 0 
              ? 'Пока нет ни одной категории. Создайте первую категорию!' 
              : 'Попробуйте изменить параметры поиска'
            }
          </p>
          {categories.length === 0 && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              Создать первую категорию
            </button>
          )}
        </div>
      ) : (
        <div className="categories-table-container">
          <table className="categories-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Slug</th>
                <th>Описание</th>
                <th>Родительская</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map(category => (
                <tr key={category.id} className={!category.is_active ? 'inactive' : ''}>
                  <td>
                    <div className="category-info">
                      <div className="category-name">{category.name}</div>
                    </div>
                  </td>
                  <td>
                    <span className="category-slug">/{category.slug}</span>
                  </td>
                  <td>
                    <span className="category-description">
                      {category.description || 'Нет описания'}
                    </span>
                  </td>
                  <td>
                    <span className="parent-category">
                      {category.parent ? 
                        categories.find(cat => cat.id === category.parent)?.name || 'Не найдена' : 
                        'Корневая'
                      }
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${category.is_active ? 'active' : 'inactive'}`}>
                      {category.is_active ? 'Активна' : 'Неактивна'}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleEdit(category)}
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(category)}
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

export default CategoryManagement;