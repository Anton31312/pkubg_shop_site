import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, clearError } from '../../store/authSlice';
import './AuthForms.css';

const RegisterForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    phone: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Clear errors when component mounts
    dispatch(clearError());
  }, [dispatch]);

  const validateForm = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Некорректный email';
    }

    if (!formData.password) {
      errors.password = 'Пароль обязателен';
    } else if (formData.password.length < 8) {
      errors.password = 'Пароль должен содержать минимум 8 символов';
    }

    if (!formData.password2) {
      errors.password2 = 'Подтверждение пароля обязательно';
    } else if (formData.password !== formData.password2) {
      errors.password2 = 'Пароли не совпадают';
    }

    if (!formData.first_name) {
      errors.first_name = 'Имя обязательно';
    }

    if (!formData.last_name) {
      errors.last_name = 'Фамилия обязательна';
    }

    if (formData.phone && !/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Некорректный номер телефона';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Map password2 to password_confirm for backend compatibility
    const registrationData = {
      ...formData,
      password_confirm: formData.password2
    };
    delete registrationData.password2;
    
    dispatch(registerUser(registrationData));
  };

  const getFieldError = (fieldName) => {
    return validationErrors[fieldName] || error?.[fieldName]?.[0];
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Регистрация</h2>
          <p>Создайте аккаунт для совершения покупок</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error?.detail && (
            <div className="error-message">
              {error.detail}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">Имя *</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                placeholder="Ваше имя"
                className={getFieldError('first_name') ? 'error' : ''}
              />
              {getFieldError('first_name') && (
                <span className="field-error">{getFieldError('first_name')}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Фамилия *</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                placeholder="Ваша фамилия"
                className={getFieldError('last_name') ? 'error' : ''}
              />
              {getFieldError('last_name') && (
                <span className="field-error">{getFieldError('last_name')}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Введите ваш email"
              className={getFieldError('email') ? 'error' : ''}
            />
            {getFieldError('email') && (
              <span className="field-error">{getFieldError('email')}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Телефон</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+7 (999) 123-45-67"
              className={getFieldError('phone') ? 'error' : ''}
            />
            {getFieldError('phone') && (
              <span className="field-error">{getFieldError('phone')}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль *</label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Минимум 8 символов"
                className={getFieldError('password') ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {getFieldError('password') && (
              <span className="field-error">{getFieldError('password')}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password2">Подтверждение пароля *</label>
            <div className="password-input-container">
              <input
                type={showPassword2 ? 'text' : 'password'}
                id="password2"
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                required
                placeholder="Повторите пароль"
                className={getFieldError('password2') ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword2(!showPassword2)}
              >
                {showPassword2 ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {getFieldError('password2') && (
              <span className="field-error">{getFieldError('password2')}</span>
            )}
          </div>

          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Уже есть аккаунт? 
            <Link to="/login" className="auth-link">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;