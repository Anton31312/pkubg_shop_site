import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import apiService from '../../services/apiService';
import './HomePage.css';

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [latestArticles, setLatestArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Автоматическое переключение слайдов каждые 5 секунд
    const totalSlides = Math.ceil(categories.length / 10) || 1;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % totalSlides);
    }, 5000);

    return () => clearInterval(interval);
  }, [categories.length]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Загружаем категории продуктов и последние статьи параллельно
      const [categoriesResponse, articlesResponse] = await Promise.all([
        apiService.get('/products/categories/'),
        apiService.get('/articles/articles/', { params: { page_size: 3 } })
      ]);

      setCategories(categoriesResponse.data.results || categoriesResponse.data);
      setLatestArticles(articlesResponse.data.results || articlesResponse.data);
    } catch (error) {
      console.error('Error fetching homepage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    const totalSlides = Math.ceil(categories.length / 10) || 1;
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    const totalSlides = Math.ceil(categories.length / 10) || 1;
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
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
      <div className="homepage-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Добро пожаловать в PKUBG</h1>
            <h2>Ваш путь к здоровому образу жизни</h2>
            <p>
              Мы предлагаем широкий ассортимент качественных продуктов для здорового питания, 
              биологически активных добавок и товаров для поддержания активного образа жизни. 
              Наша миссия — помочь вам достичь оптимального здоровья и благополучия.
            </p>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">1000+</span>
                <span className="stat-label">Довольных клиентов</span>
              </div>
              <div className="stat">
                <span className="stat-number">500+</span>
                <span className="stat-label">Качественных товаров</span>
              </div>
              <div className="stat">
                <span className="stat-number">5</span>
                <span className="stat-label">Лет опыта</span>
              </div>
            </div>
            <div className="hero-actions">
              <Link to="/products" className="cta-button primary">
                Перейти в каталог
              </Link>
              <Link to="/about" className="cta-button secondary">
                Узнать больше
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <img src="/logo.png" alt="PKUBG - Здоровое питание" />
          </div>
        </div>
      </section>

      {/* Categories Slider */}
      <section className="categories-section">
        <div className="section-header">
          <h2>Категории товаров</h2>
          <p>Выберите интересующую вас категорию для быстрого перехода в каталог</p>
        </div>

        {categories.length > 0 && (
          <div className="categories-slider">
            {Math.ceil(categories.length / 10) > 1 && (
              <button 
                className="slider-btn prev" 
                onClick={prevSlide}
                aria-label="Предыдущие категории"
              >
                ‹
              </button>
            )}

            <div className="slider-container">
              <div 
                className="slider-track"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {Array.from({ length: Math.ceil(categories.length / 10) }, (_, slideIndex) => (
                  <div key={slideIndex} className="category-slide">
                    {categories
                      .slice(slideIndex * 10, (slideIndex + 1) * 10)
                      .map((category) => (
                        <Link 
                          key={category.id}
                          to={`/products?category=${category.id}`}
                          className="category-card"
                        >
                          <div className="category-icon">
                            {getCategoryIcon(category.name)}
                          </div>
                          <h3>{category.name}</h3>
                          <p>{category.description || 'Качественные товары в этой категории'}</p>
                          <span className="category-link">Перейти →</span>
                        </Link>
                      ))}
                  </div>
                ))}
              </div>
            </div>

            {Math.ceil(categories.length / 10) > 1 && (
              <button 
                className="slider-btn next" 
                onClick={nextSlide}
                aria-label="Следующие категории"
              >
                ›
              </button>
            )}

            {Math.ceil(categories.length / 10) > 1 && (
              <div className="slider-dots">
                {Array.from({ length: Math.ceil(categories.length / 10) }, (_, index) => (
                  <button
                    key={index}
                    className={`dot ${index === currentSlide ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(index)}
                    aria-label={`Перейти к слайду ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Latest Articles */}
      <section className="articles-section">
        <div className="section-header">
          <h2>Актуальные статьи</h2>
          <p>Полезная информация о здоровом образе жизни и правильном питании</p>
        </div>

        <div className="articles-grid">
          {latestArticles.length > 0 ? (
            latestArticles.map(article => (
              <article key={article.id} className="article-preview">
                {article.featured_image && (
                  <div className="article-image">
                    <img src={article.featured_image} alt={article.title} />
                  </div>
                )}
                
                <div className="article-content">
                  <div className="article-meta">
                    {article.category_name && (
                      <span className="article-category">
                        {article.category_name}
                      </span>
                    )}
                    <span className="article-date">
                      {formatDate(article.created_at)}
                    </span>
                  </div>

                  <h3 className="article-title">
                    <Link to={`/articles/${article.slug}`}>
                      {article.title}
                    </Link>
                  </h3>

                  <p className="article-excerpt">
                    {article.excerpt}
                  </p>

                  <div className="article-tags">
                    {article.tags.slice(0, 3).map(tag => (
                      <span key={tag.id} className="article-tag">
                        {tag.name}
                      </span>
                    ))}
                  </div>

                  <Link 
                    to={`/articles/${article.slug}`}
                    className="read-more"
                  >
                    Читать далее →
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className="no-articles">
              <p>Статьи скоро появятся</p>
            </div>
          )}
        </div>

        <div className="articles-footer">
          <Link to="/articles" className="view-all-articles">
            Все статьи →
          </Link>
        </div>
      </section>


    </div>
  );
};

// Функция для получения иконки категории
const getCategoryIcon = (categoryName) => {
  const name = categoryName.toLowerCase();
  
  if (name.includes('витамин') || name.includes('добавк')) return '💊';
  if (name.includes('спорт') || name.includes('фитнес')) return '🏋️';
  if (name.includes('еда') || name.includes('питан')) return '🥗';
  if (name.includes('красот') || name.includes('уход')) return '💄';
  if (name.includes('здоров')) return '❤️';
  if (name.includes('чай') || name.includes('напит')) return '🍵';
  if (name.includes('орган')) return '🌱';
  
  return '🛍️'; // Иконка по умолчанию
};

export default HomePage;