import React from "react";
import { Link } from "react-router-dom";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  return (
    <div className="notfound-container">

      <div className="cookie">🍪</div>

      <h1>404</h1>

      <h2>Упс! Страница убежала...</h2>

      <p>
        Похоже, наше безглютеновое печенье утащило эту страницу.
        Но не переживайте — у нас ещё много вкусного!
      </p>

      <div className="buttons">

        <Link to="/" className="btn">
          🏠 На главную
        </Link>

        <Link to="/catalog" className="btn secondary">
          🛒 Смотреть каталог
        </Link>

      </div>

    </div>
  );
}