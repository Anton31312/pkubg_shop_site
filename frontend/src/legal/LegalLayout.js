import React, { useEffect } from "react";
import "./LegalLayout.css";

const LegalLayout = ({ title, updatedDate, children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${title} — PKUBG`;
  }, [title]);

  return (
    <main className="legal-page">
      <div className="legal-container">
        <header className="legal-header">
          <h1 className="legal-title">{title}</h1>
          {updatedDate && (
            <p className="legal-date">
              Дата последнего обновления: {updatedDate}
            </p>
          )}
        </header>

        <article className="legal-content">{children}</article>

        <footer className="legal-footer">
          <a href="/" className="legal-back">
            ← Вернуться на главную
          </a>
          <button
            className="legal-print"
            onClick={() => window.print()}
          >
            🖨 Распечатать документ
          </button>
        </footer>
      </div>
    </main>
  );
};

export default LegalLayout;