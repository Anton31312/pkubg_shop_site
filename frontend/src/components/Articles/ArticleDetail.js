import React, { useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
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
  const [actionLoading, setActionLoading] = useState(null);

  const { user } = useSelector(state => state.auth);
  const isAdminOrManager = user && ['admin', 'manager'].includes(user.role);
  const API_BASE = '/articles/articles';

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        // Лучше использовать toast-уведомление вместо alert
        alert('Ссылка скопирована в буфер обмена');
      }
    } catch (err) {
      // Пользователь отменил шаринг — это нормально, не ошибка
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  };

  const fetchArticle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get(`/articles/articles/${slug}/`);
      setArticle(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Статья не найдена');
      } else {
        setError('Ошибка при загрузке статьи');
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  useEffect(() => {
    if (article) {
      document.title = `${article.title} — PKUBG`;
    }
    return () => {
      document.title = 'PKUBG — интернет-магазин';
    };
  }, [article]);

  const handlePublishToggle = async () => {
    if (actionLoading) return;
    setActionLoading('publish');
    try {
      const endpoint = article.is_published ? 'unpublish' : 'publish';
      await apiService.post(`/articles/articles/${article.slug}/${endpoint}/`);
      setArticle(prev => ({ ...prev, is_published: !prev.is_published }));
    } catch (err) {
      console.error('Error toggling publish status:', err);
      alert('Ошибка при изменении статуса публикации');
    } finally {
      setActionLoading(null);
    }
  };


  const handleDelete = async () => {
    if (actionLoading) return;
    if (!window.confirm('Вы уверены, что хотите удалить эту статью?')) return;

    setActionLoading('delete');
    try {
      await apiService.delete(`/articles/articles/${article.slug}/`);
      navigate('/articles');
    } catch (err) {
      console.error('Error deleting article:', err);
      alert('Ошибка при удалении статьи');
      setActionLoading(null);
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

  const SANITIZE_CONFIG = {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'strong', 'em', 'b', 'i', 'u', 's',
      'a', 'img',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'figure', 'figcaption'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt',
      'title', 'class', 'width', 'height'
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
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
              disabled={actionLoading === 'publish'}
            >
              {actionLoading === 'publish'
                ? 'Обработка...'
                : article.is_published ? 'Снять с публикации' : 'Опубликовать'}
            </button>

            <button
              onClick={handleDelete}
              className="delete-button"
              aria-label={`Удалить статью "${article.title}"`}
              disabled={actionLoading === 'delete'}
            >
              {actionLoading === 'delete' ? 'Удаление...' : 'Удалить'}
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
          <div className="article-detail-meta">
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

        <div className="article-body"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
        />

        <footer className="article-detail-footer">
          <div className="article-share">
            <h4>Поделиться статьей:</h4>
            <div className="share-buttons">
              <button onClick={handleShare} className="share-button">
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