import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import apiService from '../../services/apiService';
import './Articles.css';

const ArticleDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useSelector(state => state.auth);
  const isAdminOrManager = user && ['admin', 'manager'].includes(user.role);

  useEffect(() => {
    fetchArticle();
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/articles/articles/${slug}/`);
      setArticle(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Статья не найдена');
      } else {
        setError('Ошибка при загрузке статьи');
      }
      console.error('Error fetching article:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToggle = async () => {
    try {
      const endpoint = article.is_published ? 'unpublish' : 'publish';
      await apiService.post(`/articles/api/articles/${article.slug}/${endpoint}/`);
      setArticle(prev => ({
        ...prev,
        is_published: !prev.is_published
      }));
    } catch (err) {
      console.error('Error toggling publish status:', err);
      alert('Ошибка при изменении статуса публикации');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить эту статью?')) {
      return;
    }

    try {
      await apiService.delete(`/articles/api/articles/${article.slug}/`);
      navigate('/articles');
    } catch (err) {
      console.error('Error deleting article:', err);
      alert('Ошибка при удалении статьи');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="article-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка статьи...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="article-error">
        <h2>Ошибка</h2>
        <p>{error}</p>
        <Link to="/articles" className="back-link">
          ← Вернуться к статьям
        </Link>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="article-detail-container">
      <div className="article-navigation">
        <Link to="/articles" className="back-link">
          ← Все статьи
        </Link>
        
        {isAdminOrManager && (
          <div className="article-admin-actions">
            <Link 
              to={`/articles/${article.slug}/edit`}
              className="edit-button"
            >
              Редактировать
            </Link>
            
            <button
              onClick={handlePublishToggle}
              className={`publish-button ${article.is_published ? 'unpublish' : 'publish'}`}
            >
              {article.is_published ? 'Снять с публикации' : 'Опубликовать'}
            </button>
            
            <button
              onClick={handleDelete}
              className="delete-button"
            >
              Удалить
            </button>
          </div>
        )}
      </div>

      <article className="article-detail">
        {!article.is_published && (
          <div className="unpublished-notice">
            <strong>Внимание:</strong> Эта статья не опубликована и видна только администраторам и менеджерам.
          </div>
        )}

        <header className="article-header">
          <div className="article-meta">
            {article.category && (
              <span className="article-category">
                {article.category.name}
              </span>
            )}
            <span className="article-date">
              {formatDate(article.created_at)}
            </span>
            {article.updated_at !== article.created_at && (
              <span className="article-updated">
                Обновлено: {formatDate(article.updated_at)}
              </span>
            )}
          </div>

          <h1 className="article-title">{article.title}</h1>

          <div className="article-author-info">
            <span className="article-author">
              Автор: {article.author_name}
            </span>
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className="article-tags">
              {article.tags.map(tag => (
                <span key={tag.id} className="article-tag">
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </header>

        {article.featured_image && (
          <div className="article-featured-image">
            <img src={article.featured_image} alt={article.title} />
          </div>
        )}

        <div className="article-excerpt">
          <p><strong>{article.excerpt}</strong></p>
        </div>

        <div 
          className="article-content"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        <footer className="article-footer">
          <div className="article-share">
            <h4>Поделиться статьей:</h4>
            <div className="share-buttons">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: article.title,
                      text: article.excerpt,
                      url: window.location.href
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Ссылка скопирована в буфер обмена');
                  }
                }}
                className="share-button"
              >
                Поделиться
              </button>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
};

export default ArticleDetail;