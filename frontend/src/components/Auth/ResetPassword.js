import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './AuthForms.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');
  const uid = searchParams.get('uid');

  const [formData, setFormData] = useState({
    password: '',
    password2: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }

    if (formData.password !== formData.password2) {
      setError('Пароли не совпадают');
      return;
    }

    if (!token || !uid) {
      setError('Недействительная ссылка для сброса пароля');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/password-reset/confirm/', {
        uid,
        token,
        new_password: formData.password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const message = err.response?.data?.detail
        || err.response?.data?.token?.[0]
        || err.response?.data?.new_password?.[0]
        || 'Ссылка устарела или недействительна. Запросите новую.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!token || !uid) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>❌ Недействительная ссылка</h2>
            <p>Ссылка для сброса пароля недействительна или устарела.</p>
          </div>
          <div className="auth-footer">
            <p>
              <Link to="/forgot-password" className="auth-link">
                Запросить новую ссылку
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>✅ Пароль изменён</h2>
            <p>Ваш пароль успешно изменён. Перенаправляем на страницу входа...</p>
          </div>
          <div className="auth-footer">
            <p>
              <Link to="/login" className="auth-link">
                Войти с новым паролем
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
          <h2>Новый пароль</h2>
          <p>Введите новый пароль для вашего аккаунта</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">{error}</div>
          )}

          <div className="form-group">
            <label htmlFor="password">Новый пароль</label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Минимум 8 символов"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password2">Подтверждение пароля</label>
            <input
              type="password"
              id="password2"
              name="password2"
              value={formData.password2}
              onChange={handleChange}
              required
              placeholder="Повторите пароль"
            />
          </div>

          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Сохранение...' : 'Сохранить пароль'}
          </button>
        </form>

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
};

export default ResetPassword;