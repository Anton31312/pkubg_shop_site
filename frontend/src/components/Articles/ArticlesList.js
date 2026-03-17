import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import apiService from '../../services/apiService';
import './Articles.css';

const ArticlesList = () => {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const { user } = useSelector(state => state.auth);
  const isAdminOrManager = user && ['admin', 'manager'].includes(user.role);

  // ═══ Загрузка категорий — один раз ═══
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await apiService.get('/articles/categories/');
        setCategories(response.data.results || response.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    loadCategories();
  }, []);

  // ═══ Загрузка статей ═══
  const fetchArticles = useCallback(async () => {
    try {
      if (articles.length === 0) {
        setInitialLoading(true);
      } else {
        setUpdating(true);
      }

      const params = { /* ... */ };
      const response = await apiService.get('/articles/articles/', { params });
      setArticles(response.data.results || response.data);
      setTotalPages(Math.ceil((response.data.count || 1) / 20));
      setError(null);
    } catch (err) {
      setError('Ошибка при загрузке статей');
    } finally {
      setInitialLoading(false);
      setUpdating(false);
    }
  }, [selectedCategory, appliedSearch, currentPage]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // ═══ Поиск — только по сабмиту ═══
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setAppliedSearch(searchQuery);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (initialLoading) {
    return (
      <div className="articles-loading" role="status" aria-live="polite">
        <div className="loading-spinner" aria-hidden="true"></div>
        <p>Загрузка статей...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="articles-error">
        <h2>Ошибка</h2>
        <p>{error}</p>
        <button onClick={fetchArticles} className="retry-button">
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="articles-container">
      <div className="articles-header">
        <h1>Статьи</h1>
        {isAdminOrManager && (
          <Link to="/articles/create" className="create-article-btn">
            Создать статью
          </Link>
        )}
      </div>

      <div className="articles-filters">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Поиск статей..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            Найти
          </button>
        </form>

        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="category-filter"
        >
          <option value="">Все категории</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className={`articles-grid ${updating ? 'articles-grid--updating' : ''}`}>
        {articles.length === 0 ? (
          <div className="no-articles">
            <h3>Статьи не найдены</h3>
            <p>Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          articles.map(article => (
            <article key={article.id} className="article-card">
              {article.featured_image && (
                <div className="article-image">
                  <img src={article.featured_image} alt={article.title} />
                </div>
              )}

              <div className="article-card-body">
                <div className="article-card-footer">
                  <span className="article-category">
                    {article.category_name || 'Без категории'}
                  </span>
                  <span className="article-date">
                    {formatDate(article.created_at)}
                  </span>
                </div>

                <h2 className="article-title">
                  <Link to={`/articles/${article.slug}`}>
                    {article.title}
                  </Link>
                </h2>

                <p className="article-excerpt">
                  {article.excerpt}
                </p>

                {article.tags?.length > 0 && (
                  <div className="article-tags">
                    {article.tags.map(tag => (
                      <span key={tag.id} className="article-tag">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="article-card-meta">
                  <span className="article-author">
                    Автор: {article.author_name}
                  </span>

                  {isAdminOrManager && (
                    <div className="article-actions">
                      <Link
                        to={`/articles/${article.slug}/edit`}
                        className="edit-link"
                      >
                        Редактировать
                      </Link>
                      {!article.is_published && (
                        <span className="unpublished-badge">
                          Не опубликовано
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Предыдущая
          </button>

          <span className="pagination-info">
            Страница {currentPage} из {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Следующая
          </button>
        </div>
      )}
    </div>
  );
};

export default ArticlesList;