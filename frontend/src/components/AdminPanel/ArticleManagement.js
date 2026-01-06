import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import './ArticleManagement.css';

const ArticleManagement = () => {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    category_id: '',
    tag_ids: [],
    is_published: false,
    featured_image: null
  });

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/articles/articles/');
      const articlesData = response.data.results || response.data;
      setArticles(Array.isArray(articlesData) ? articlesData : []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      if (error.response?.status === 404) {
        setError('API статей недоступно. Функция будет добавлена позже.');
      } else if (error.response?.status === 403) {
        setError('Недостаточно прав для просмотра статей');
      } else {
        setError('Ошибка загрузки статей. Проверьте подключение к серверу.');
      }
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/articles/categories/');
      const categoriesData = response.data.results || response.data;
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };



  const handleCreateArticle = () => {
    setSelectedArticle(null);
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      category_id: '',
      tag_ids: [],
      is_published: false,
      featured_image: null
    });
    setShowForm(true);
  };

  const handleEditArticle = (article) => {
    setSelectedArticle(article);
    setFormData({
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt,
      category_id: article.category?.id || '',
      tag_ids: article.tags?.map(tag => tag.id) || [],
      is_published: article.is_published,
      featured_image: null
    });
    setShowForm(true);
  };

  const handleDeleteArticle = async (articleId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту статью?')) {
      try {
        await api.delete(`/articles/articles/${articleId}/`);
        await fetchArticles();
      } catch (error) {
        setError('Ошибка удаления статьи');
        console.error('Error deleting article:', error);
      }
    }
  };

  const handleTogglePublish = async (article) => {
    try {
      const endpoint = article.is_published ? 'unpublish' : 'publish';
      await api.post(`/articles/articles/${article.id}/${endpoint}/`);
      await fetchArticles();
    } catch (error) {
      setError('Ошибка изменения статуса публикации');
      console.error('Error toggling publish status:', error);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'tag_ids') {
          formData[key].forEach(tagId => {
            submitData.append('tag_ids', tagId);
          });
        } else if (key === 'featured_image' && formData[key]) {
          submitData.append(key, formData[key]);
        } else if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });

      if (selectedArticle) {
        await api.put(`/articles/articles/${selectedArticle.id}/`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/articles/articles/', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      await fetchArticles();
      setShowForm(false);
      setSelectedArticle(null);
    } catch (error) {
      setError('Ошибка сохранения статьи');
      console.error('Error saving article:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from title
    if (field === 'title' && !selectedArticle) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9а-я]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'published' && article.is_published) ||
                         (filterStatus === 'draft' && !article.is_published);
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="article-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка статей...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="article-management">
      <div className="article-management-header">
        <div className="header-content">
          <h2>Управление статьями</h2>
          <p className="header-subtitle">
            Создавайте, редактируйте и публикуйте статьи
          </p>
        </div>
        <button 
          className="btn btn-primary create-btn"
          onClick={handleCreateArticle}
        >
          <span className="btn-icon">+</span>
          Создать статью
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
            placeholder="Поиск статей..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Все статьи</option>
            <option value="published">Опубликованные</option>
            <option value="draft">Черновики</option>
          </select>
        </div>
      </div>

      <div className="articles-stats">
        <div className="stat-item">
          <span className="stat-number">{filteredArticles.length}</span>
          <span className="stat-label">Статей найдено</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {filteredArticles.filter(a => a.is_published).length}
          </span>
          <span className="stat-label">Опубликованных</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {filteredArticles.filter(a => !a.is_published).length}
          </span>
          <span className="stat-label">Черновиков</span>
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>Статьи не найдены</h3>
          <p>
            {articles.length === 0 
              ? 'Пока нет ни одной статьи. Создайте первую статью!' 
              : 'Попробуйте изменить параметры поиска или фильтры'
            }
          </p>
          {articles.length === 0 && (
            <button 
              className="btn btn-primary"
              onClick={handleCreateArticle}
            >
              Создать первую статью
            </button>
          )}
        </div>
      ) : (
        <div className="articles-table-container">
          <table className="articles-table">
            <thead>
              <tr>
                <th>Заголовок</th>
                <th>Категория</th>
                <th>Автор</th>
                <th>Статус</th>
                <th>Дата создания</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.map(article => (
                <tr key={article.id} className={!article.is_published ? 'draft' : ''}>
                  <td>
                    <div className="article-info">
                      <div className="article-title">{article.title}</div>
                      <div className="article-excerpt">{article.excerpt}</div>
                    </div>
                  </td>
                  <td>
                    <span className="category-name">
                      {article.category_name || 'Без категории'}
                    </span>
                  </td>
                  <td>
                    <span className="author-name">{article.author_name}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${article.is_published ? 'published' : 'draft'}`}>
                      {article.is_published ? 'Опубликована' : 'Черновик'}
                    </span>
                  </td>
                  <td>
                    <span className="date">{formatDate(article.created_at)}</span>
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleEditArticle(article)}
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      <button
                        className={`action-btn toggle-btn ${article.is_published ? 'unpublish' : 'publish'}`}
                        onClick={() => handleTogglePublish(article)}
                        title={article.is_published ? 'Снять с публикации' : 'Опубликовать'}
                      >
                        {article.is_published ? '👁️‍🗨️' : '👁️'}
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteArticle(article.id)}
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

      {showForm && (
        <div className="modal-overlay">
          <div className="article-form-modal">
            <div className="modal-header">
              <h3>{selectedArticle ? 'Редактировать статью' : 'Создать статью'}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="article-form">
              <div className="form-group">
                <label>Заголовок</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Краткое описание</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  rows="3"
                  required
                />
              </div>

              <div className="form-group">
                <label>Содержание</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  rows="10"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Категория</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => handleInputChange('category_id', e.target.value)}
                  >
                    <option value="">Без категории</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Изображение</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleInputChange('featured_image', e.target.files[0])}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => handleInputChange('is_published', e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  Опубликовать статью
                </label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  {selectedArticle ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleManagement;