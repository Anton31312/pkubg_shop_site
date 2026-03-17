import React from "react";
import { useLegalInfo } from "../../contexts/LegalInfoContext";
import "./Footer.css";

const Footer = () => {
  const { legalInfo, loading } = useLegalInfo();

  // Скелетон пока грузится
  if (loading) {
    return (
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-loading">Загрузка...</div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">

          {/* ═══ О продавце ═══ */}
          <div className="footer-block footer-block--legal">
            <h4>О продавце</h4>

            <p>
              {legalInfo.business_type}
              <br />
              <strong>{legalInfo.full_name}</strong>
            </p>

            <p>
              ОГРНИП: <strong>{legalInfo.ogrnip}</strong>
              <br />
              ИНН: <strong>{legalInfo.inn}</strong>
            </p>

            <p>
              Адрес:
              <br />
              {legalInfo.postal_code && `${legalInfo.postal_code}, `}
              {legalInfo.legal_address}
            </p>

            <p>
              Email:{" "}
              <a href={`mailto:${legalInfo.email}`} className="footer-link">
                {legalInfo.email}
              </a>
              <br />
              Телефон:{" "}
              <a
                href={`tel:${legalInfo.phone.replace(/[^\d+]/g, '')}`}
                className="footer-link"
              >
                {legalInfo.phone}
              </a>
            </p>

            {legalInfo.working_hours && (
              <p className="footer-schedule">
                Режим работы: {legalInfo.working_hours}
              </p>
            )}
          </div>

          {/* ═══ Документы ═══ */}
          <div className="footer-block">
            <h4>Документы</h4>
            <ul>
              <li>
                <a href="/privacy-policy" className="footer-link">
                  Политика конфиденциальности
                </a>
              </li>
              <li>
                <a href="/offer" className="footer-link">
                  Публичная оферта
                </a>
              </li>
              <li>
                <a href="/terms" className="footer-link">
                  Пользовательское соглашение
                </a>
              </li>
              <li>
                <a href="/personal-data-consent" className="footer-link">
                  Согласие на обработку персональных данных
                </a>
              </li>
              <li>
                <a href="/cookie-policy" className="footer-link">
                  Политика использования файлов cookie
                </a>
              </li>
            </ul>
          </div>

          {/* ═══ Покупателям ═══ */}
          <div className="footer-block">
            <h4>Покупателям</h4>
            <ul>
              <li><a href="/delivery" className="footer-link">Доставка и оплата</a></li>
              <li><a href="/returns" className="footer-link">Возврат и обмен товара</a></li>
              <li><a href="/contacts" className="footer-link">Контакты</a></li>
            </ul>
          </div>

          {/* ═══ Соцсети ═══ */}
          <div className="footer-block">
            <h4>Мы в соцсетях</h4>
            <div className="footer-social">
              {legalInfo.telegram_url && (
                <a
                  href={legalInfo.telegram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link telegram"
                  title="Telegram"
                >
                  <img src="/telegram.webp" alt="Telegram" className="social-icon"
                    onError={(e) => { e.target.style.display = 'none'; }} />
                </a>
              )}

              {legalInfo.ozon_url && (
                <a
                  href={legalInfo.ozon_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link ozon"
                  title="Ozon"
                >
                  <img src="/ozon.png" alt="Ozon" className="social-icon"
                    onError={(e) => { e.target.style.display = 'none'; }} />
                </a>
              )}

              {legalInfo.vk_url && (
                <a
                  href={legalInfo.vk_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link vk"
                  title="ВКонтакте"
                >
                  <img src="/vk.png" alt="VK" className="social-icon"
                    onError={(e) => { e.target.style.display = 'none'; }} />
                </a>
              )}
            </div>

            {legalInfo.site_description && (
              <div className="footer-about">
                <p>{legalInfo.site_description}</p>
              </div>
            )}
          </div>
        </div>

        {/* ═══ Нижняя полоса ═══ */}
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <p>
              © {new Date().getFullYear()} {legalInfo.short_name || legalInfo.site_name}. Все права защищены.
            </p>
            <p className="footer-disclaimer">
              Информация на сайте не является медицинской рекомендацией.
              Перед&nbsp;употреблением проконсультируйтесь со&nbsp;специалистом.
            </p>
          </div>
          <div className="footer-bottom-right">
            <p className="footer-dev">
              Разработка: FedAS prod.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;