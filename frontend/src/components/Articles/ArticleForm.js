import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import apiService from '../../services/apiService';
import './Articles.css';

const ArticleForm = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const isEdit = Boolean(slug);

  const { user } = useSelector(state => state.auth);
  const isAdminOrManager = user && ['admin', 'manager'].includes(user.role);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    category_id: '',
    tag_ids: [],
    is_published: false
  });

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [slugGenerated, setSlugGenerated] = useState(false);

  useEffect(() => {
    if (!isAdminOrManager) {
      navigate('/articles');
      return;
    }

    fetchCategories();
    fetchTags();

    if (isEdit) {
      fetchArticle();
    }
  }, [slug, isAdminOrManager, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchArticle = async () => {
    try {
      const response = await apiService.get(`/articles/articles/${slug}/`);
      const article = response.data;
      
      setFormData({
        title: article.title,
        slug: article.slug,
        content: article.content,
        excerpt: article.excerpt,
        category_id: article.category?.id || '',
        tag_ids: article.tags.map(tag => tag.id),
        is_published: article.is_published
      });
    } catch (err) {
      setError('Ошибка при загрузке статьи');
      console.error('Error fetching article:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiService.get('/articles/categories/');
      setCategories(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await apiService.get('/articles/tags/');
      setTags(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  const generateSlug = (title) => {
    return title
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

    // Автогенерация slug при изменении заголовка
    if (name === 'title' && !isEdit && !slugGenerated) {
      const newSlug = generateSlug(value);
      setFormData(prev => ({
        ...prev,
        slug: newSlug
      }));
    }
  };

  const handleSlugChange = (e) => {
    setFormData(prev => ({
      ...prev,
      slug: e.target.value
    }));
    setSlugGenerated(true);
  };

  const handleTagChange = (tagId) => {
    setFormData(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter(id => id !== tagId)
        : [...prev.tag_ids, tagId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        category_id: formData.category_id || null,
        tag_ids: formData.tag_ids
      };

      if (isEdit) {
        await apiService.put(`/articles/articles/${slug}/`, submitData);
      } else {
        await apiService.post('/articles/articles/', submitData);
      }

      navigate('/articles');
    } catch (err) {
      if (err.response?.data) {
        const errors = err.response.data;
        if (typeof errors === 'object') {
          const errorMessages = Object.entries(errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          setError(errorMessages);
        } else {
          setError(errors);
        }
      } else {
        setError('Ошибка при сохранении статьи');
      }
      console.error('Error saving article:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdminOrManager) {
    return null;
  }

  return (
    <div className="article-form-container">
      <div className="article-form-header">
        <h1>{isEdit ? 'Редактировать статью' : 'Создать статью'}</h1>
      </div>

      {error && (
        <div className="error-message">
          <pre>{error}</pre>
        </div>
      )}

      <form onSubmit={handleSubmit} className="article-form">
        <div className="form-group">
          <label htmlFor="title">Заголовок *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="slug">URL (slug) *</label>
          <input
            type="text"
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleSlugChange}
            required
            className="form-input"
            placeholder="url-friendly-name"
          />
          <small className="form-help">
            Используется в URL статьи. Только латинские буквы, цифры и дефисы.
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="excerpt">Краткое описание *</label>
          <textarea
            id="excerpt"
            name="excerpt"
            value={formData.excerpt}
            onChange={handleInputChange}
            required
            rows="3"
            maxLength="500"
            className="form-textarea"
            placeholder="Краткое описание статьи (до 500 символов)"
          />
          <small className="form-help">
            {formData.excerpt.length}/500 символов
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="content">Содержание *</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            required
            rows="15"
            className="form-textarea content-editor"
            placeholder="Содержание статьи (поддерживается HTML)"
          />
          <small className="form-help">
            Поддерживается HTML разметка для форматирования текста.
          </small>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category_id">Категория</label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="">Выберите категорию</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Теги</label>
          <div className="tags-grid">
            {tags.map(tag => (
              <label key={tag.id} className="tag-checkbox">
                <input
                  type="checkbox"
                  checked={formData.tag_ids.includes(tag.id)}
                  onChange={() => handleTagChange(tag.id)}
                />
                <span className="tag-label">{tag.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_published"
              checked={formData.is_published}
              onChange={handleInputChange}
            />
            <span>Опубликовать статью</span>
          </label>
          <small className="form-help">
            Неопубликованные статьи видны только администраторам и менеджерам.
          </small>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/articles')}
            className="cancel-button"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Сохранение...' : (isEdit ? 'Обновить' : 'Создать')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ArticleForm;