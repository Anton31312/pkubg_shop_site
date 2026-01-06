import React from 'react';
import './AboutPage.css';

const AboutPage = () => {
  return (
    <div className="about-page">
      <div className="about-container">
        <header className="about-header">
          <h1 className="about-title">
            Интернет-магазин низкобелковых и безглютеновых продуктов питания
          </h1>
        </header>

        <div className="about-content">
          <div className="about-intro">
            <p className="intro-text">
              Магазин «Pkubg» — ваш надежный помощник в мире специального питания. 
              Мы создали место, где вы можете найти безопасные продукты при соблюдении 
              безглютеновой, низкобелковой и других лечебных диет.
            </p>
          </div>

          <div className="about-section">
            <p className="section-text">
              Наш ассортимент учитывает потребности людей с целиакией, фенилкетонурией (ФКУ), 
              сахарным диабетом, пищевыми аллергиями и аутизмом. Мы тщательно отбираем 
              поставщиков и предлагаем продукцию проверенных производителей, таких как 
              Dr.Schar, Flavis, Balviten, «МакМастер» и других.
            </p>
          </div>

          <div className="about-features">
            <h2 className="features-title">Для вашего удобства и безопасности:</h2>
            <ul className="features-list">
              <li className="feature-item">
                <div className="feature-icon">🏷️</div>
                <div className="feature-content">
                  <strong>Четкая маркировка на каждом ценнике:</strong> «без глютена», 
                  «без молока», «низкий белок».
                </div>
              </li>
              <li className="feature-item">
                <div className="feature-icon">🔬</div>
                <div className="feature-content">
                  <strong>Строгий контроль:</strong> вся продукция проверяется на содержание 
                  глютена в аккредитованной лаборатории.
                </div>
              </li>
            </ul>
          </div>

          <div className="about-mission">
            <p className="mission-text">
              Наша цель — сделать вашу жизнь проще, а приготовление полезной еды — 
              приятным и безопасным занятием.
            </p>
          </div>

          <div className="about-brands">
            <h3 className="brands-title">Наши проверенные партнеры:</h3>
            <div className="brands-grid">
              <div className="brand-item">Dr.Schar</div>
              <div className="brand-item">Flavis</div>
              <div className="brand-item">Balviten</div>
              <div className="brand-item">МакМастер</div>
            </div>
          </div>

          <div className="about-conditions">
            <h3 className="conditions-title">Мы помогаем людям с:</h3>
            <div className="conditions-grid">
              <div className="condition-item">
                <div className="condition-icon">🌾</div>
                <span>Целиакия</span>
              </div>
              <div className="condition-item">
                <div className="condition-icon">🧬</div>
                <span>Фенилкетонурия (ФКУ)</span>
              </div>
              <div className="condition-item">
                <div className="condition-icon">🩺</div>
                <span>Сахарный диабет</span>
              </div>
              <div className="condition-item">
                <div className="condition-icon">🚫</div>
                <span>Пищевые аллергии</span>
              </div>
              <div className="condition-item">
                <div className="condition-icon">🧩</div>
                <span>Аутизм</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;