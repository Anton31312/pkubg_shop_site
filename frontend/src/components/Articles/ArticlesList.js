import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import apiService from '../../services/apiService';
import './Articles.css';

const ArticlesList = () => {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { user } = useSelector(state => state.auth);
  const isAdminOrManager = user && ['admin', 'manager'].includes(user.role);

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, [selectedCategory, searchQuery, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        ...(selectedCategory && { category: selectedCategory }),
        ...(searchQuery && { search: searchQuery })
      };

      const response = await apiService.get('/articles/articles/', { params });
      setArticles(response.data.results || response.data);
      setTotalPages(Math.ceil((response.data.count || response.data.length) / 20));
    } catch (err) {
      setError('Ошибка при загрузке статей');
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
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

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchArticles();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="articles-loading">
        <div className="loading-spinner"></div>
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

      <div className="articles-grid">
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
              
              <div className="article-content">
                <div className="article-meta">
                  <span className="article-category">
                    {article.category_name}
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

                <div className="article-tags">
                  {article.tags.map(tag => (
                    <span key={tag.id} className="article-tag">
                      {tag.name}
                    </span>
                  ))}
                </div>

                <div className="article-footer">
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