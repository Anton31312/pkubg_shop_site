import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-copyright">
            <span>FedAS prod.</span>
          </div>
          
          <div className="footer-social">
            <a 
              href="https://t.me/+LCpNz3Mzk1llNmQy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link telegram"
              title="Telegram"
            >
              <img 
                src="/telegram.webp" 
                alt="Telegram" 
                className="social-icon"
                onError={(e) => {
                  e.target.style.display = 'none';
                  console.error('Failed to load Telegram icon');
                }}
              />
            </a>
            
            <a 
              href="https://www.ozon.ru/seller/glutenfree-1661700/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link ozon"
              title="Ozon"
            >
              <img 
                src="/ozon.png" 
                alt="Ozon" 
                className="social-icon"
                onError={(e) => {
                  e.target.style.display = 'none';
                  console.error('Failed to load Ozon icon');
                }}
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;