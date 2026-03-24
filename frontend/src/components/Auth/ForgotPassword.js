import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import './AuthForms.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/auth/password-reset/', { email });
      setSent(true);
    } catch (err) {
      const message = err.response?.data?.detail 
        || err.response?.data?.email?.[0] 
        || 'Ошибка отправки. Попробуйте позже.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>📧 Письмо отправлено</h2>
            <p>
              Мы отправили инструкции по восстановлению пароля на <strong>{email}</strong>.
              Проверьте почту, включая папку «Спам».
            </p>
          </div>
          <div className="auth-footer">
            <p>
              <Link to="/login" className="auth-link">
                ← Вернуться к входу
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Восстановление пароля</h2>
          <p>Введите email, указанный при регистрации. Мы отправим ссылку для сброса пароля.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">{error}</div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Введите ваш email"
            />
          </div>

          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Отправка...' : 'Отправить ссылку'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Вспомнили пароль?{' '}
            <Link to="/login" className="auth-link">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;