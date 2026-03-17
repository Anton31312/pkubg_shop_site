import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import apiService from '../../services/apiService';
import './Articles.css';

const ArticleForm = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const isEdit = Boolean(slug);
  const [isDirty, setIsDirty] = useState(false);

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

  const CYRILLIC_MAP = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
    'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
    'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch',
    'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '',
    'э': 'e', 'ю': 'yu', 'я': 'ya'
  };

  useEffect(() => {
    if (!isAdminOrManager) {
      navigate('/articles');
      return;
    }

    const controller = new AbortController();

    const loadData = async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          apiService.get('/articles/categories/', {
            signal: controller.signal
          }),
          apiService.get('/articles/tags/', {
            signal: controller.signal
          })
        ]);

        setCategories(catRes.data.results || catRes.data);
        setTags(tagRes.data.results || tagRes.data);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Error loading form data:', err);
      }

      if (isEdit) {
        try {
          const response = await apiService.get(
            `/articles/articles/${slug}/`,
            { signal: controller.signal }
          );
          const article = response.data;

          setFormData({
            title: article.title,
            slug: article.slug,
            content: article.content || '',
            excerpt: article.excerpt || '',
            category_id: article.category?.id || '',
            tag_ids: article.tags?.map(tag => tag.id) || [],
            is_published: article.is_published || false
          });
        } catch (err) {
          if (err.name === 'AbortError') return;
          setError('Ошибка при загрузке статьи');
        }
      }
    };

    loadData();

    return () => controller.abort(); // Cleanup!
  }, [slug, isEdit, isAdminOrManager, navigate]);

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
      .replace(/[а-яё]/g, (char) => CYRILLIC_MAP[char] || '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-'); // убрать двойные дефисы
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Отслеживание изменений
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setIsDirty(true);
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'title' && !isEdit && !slugGenerated) {
      const newSlug = generateSlug(value);
      setFormData(prev => ({ ...prev, slug: newSlug }));
    }
  };

  const handleSlugChange = (e) => {
    setIsDirty(true);
    setFormData(prev => ({ ...prev, slug: e.target.value }));
    setSlugGenerated(true);
  };

  const handleTagChange = (tagId) => {
    setIsDirty(true);
    setFormData(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter(id => id !== tagId)
        : [...prev.tag_ids, tagId]
    }));
  };

  // Кнопка «Отмена» с подтверждением
  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('У вас есть несохранённые изменения. Уйти без сохранения?')) {
        navigate('/articles');
      }
    } else {
      navigate('/articles');
    }
  };

  // При успешном сохранении — сбросить флаг
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

      setIsDirty(false);  // ← сбросить перед навигацией
      navigate('/articles');
    } catch (err) {
      // обработка ошибок...
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
        <div className="error-message" role="alert">
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
            onClick={handleCancel}
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