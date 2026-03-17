import React, { useState, useEffect } from "react";
import "./CookieBanner.css";

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      // Показываем баннер с небольшой задержкой
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    localStorage.setItem(
      "cookie_consent_date",
      new Date().toISOString()
    );
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie_consent", "declined");
    localStorage.setItem(
      "cookie_consent_date",
      new Date().toISOString()
    );
    setIsVisible(false);
    // Здесь можно отключить аналитические cookie
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <div className="cookie-banner-content">
        <div className="cookie-banner-text">
          <p>
            🍪 Мы используем файлы cookie для корректной работы сайта,
            аналитики и улучшения вашего опыта. Продолжая использовать
            сайт, вы соглашаетесь с{" "}
            <a href="/cookie-policy">
              Политикой использования файлов cookie
            </a>{" "}
            и{" "}
            <a href="/privacy-policy">
              Политикой конфиденциальности
            </a>.
          </p>
        </div>
        <div className="cookie-banner-actions">
          <button
            className="cookie-btn cookie-btn--accept"
            onClick={handleAccept}
          >
            Принять
          </button>
          <button
            className="cookie-btn cookie-btn--decline"
            onClick={handleDecline}
          >
            Только необходимые
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;