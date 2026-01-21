import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import api from '../../utils/api';
import useRouteRefresh from '../../hooks/useRouteRefresh';
import './UserProfile.css';

const UserProfile = () => {
  const { isAuthenticated } = useSelector(state => state.auth);
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    birth_date: '',
    dietary_preferences: {}
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Для автоподбора адресов
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const addressInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Используем хук для автоматического обновления при смене роута
  const refreshCallback = useCallback(() => {
    console.log('UserProfile: Refreshing due to route change');
    if (isAuthenticated) {
      fetchProfile();
      fetchOrders();
    }
  }, [isAuthenticated]);

  const refreshKey = useRouteRefresh(refreshCallback);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
      fetchOrders();
    }
  }, [isAuthenticated, refreshKey]); // Добавляем refreshKey как зависимость

  // Закрытие списка подсказок при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        addressInputRef.current &&
        !addressInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile/');
      const profileData = response.data;
      
      // Форматируем дату рождения для input[type="date"]
      if (profileData.birth_date) {
        profileData.birth_date = profileData.birth_date.split('T')[0];
      }
      
      setProfile(profileData);
      
      // Если адрес есть, считаем его валидным
      if (profileData.address) {
        setSelectedAddress({ value: profileData.address });
      }
    } catch (error) {
      setError('Ошибка загрузки профиля');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
      setOrders([]);
    }
  };

  // Функция для получения подсказок адресов от Dadata через наш бэкенд
  const fetchAddressSuggestions = async (query) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await api.post('/address-suggestions/', {
        query: query
      });

      const suggestions = response.data.suggestions || [];
      setAddressSuggestions(suggestions);
      
      if (suggestions.length > 0) {
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Ошибка получения подсказок адресов:', error);
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const validateAddressStructure = (address) => {
    if (!address || !address.trim()) {
      return false;
    }

    const parts = address.split(',').map(part => part.trim()).filter(part => part.length > 0);
    
    if (parts.length < 4) {
      return false;
    }

    const [country, city, street, house, apartment] = parts;

    if (!country || !/[а-яёa-z]/i.test(country)) {
      return false;
    }

    if (!city || !/[а-яёa-z]/i.test(city)) {
      return false;
    }

    if (!street || !/[а-яёa-z]/i.test(street)) {
      return false;
    }

    if (!house || !/\d/.test(house)) {
      return false;
    }

    if (apartment && !/[а-яёa-z\d]/i.test(apartment)) {
      return false;
    }

    return true;
  };

  const isAddressValid = () => {
    if (!profile.address.trim()) {
      return true; // Пустой адрес допустим
    }
    
    if (selectedAddress !== null) {
      return true;
    }
    
    return validateAddressStructure(profile.address);
  };

  const getAddressValidationMessage = () => {
    if (!profile.address.trim()) {
      return 'Начните вводить адрес, и мы предложим варианты';
    }

    if (selectedAddress) {
      return '✓ Адрес подтвержден';
    }

    const address = profile.address.trim();
    const parts = address.split(',').map(part => part.trim()).filter(part => part.length > 0);

    if (parts.length < 4) {
      return `Укажите адрес в формате: Страна, Город, Улица, Дом${parts.length < 2 ? '' : ', Квартира (необязательно)'}`;
    }

    const [country, city, street, house] = parts;

    if (!country || !/[а-яёa-z]/i.test(country)) {
      return 'Укажите корректную страну';
    }

    if (!city || !/[а-яёa-z]/i.test(city)) {
      return 'Укажите корректный город';
    }

    if (!street || !/[а-яёa-z]/i.test(street)) {
      return 'Укажите корректную улицу';
    }

    if (!house || !/\d/.test(house)) {
      return 'Укажите корректный номер дома';
    }

    return '✓ Адрес корректен';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setProfile(prev => ({
      ...prev,
      address: value
    }));
    setSelectedAddress(null);
    
    // Очищаем предыдущий таймер
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Устанавливаем новый таймер с задержкой 300ms
    debounceTimerRef.current = setTimeout(() => {
      fetchAddressSuggestions(value);
    }, 300);
  };

  const handleAddressSelect = (suggestion) => {
    setProfile(prev => ({
      ...prev,
      address: suggestion.value
    }));
    setSelectedAddress(suggestion);
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация адреса
    if (profile.address.trim() && !isAddressValid()) {
      setError('Пожалуйста, проверьте корректность введенного адреса или выберите из предложенных вариантов');
      return;
    }
    
    setUpdating(true);
    setError(null);
    setSuccess(false);

    try {
      // Подготавливаем данные для отправки
      const profileData = { ...profile };
      
      // Если дата рождения пустая, отправляем null
      if (!profileData.birth_date) {
        profileData.birth_date = null;
      }

      console.log('Отправляем данные профиля:', profileData);
      
      const response = await api.put('/auth/profile/', profileData);
      console.log('Ответ сервера:', response.data);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      setError(error.response?.data?.error || 'Ошибка обновления профиля');
    } finally {
      setUpdating(false);
    }
  };

  const getOrderStatusText = (status) => {
    const statusMap = {
      'pending': 'Ожидает обработки',
      'confirmed': 'Подтвержден',
      'processing': 'В обработке',
      'shipped': 'Отправлен',
      'delivered': 'Доставлен',
      'cancelled': 'Отменен'
    };
    return statusMap[status] || status;
  };

  const getPaymentStatusText = (status) => {
    const statusMap = {
      'pending': 'Ожидает оплаты',
      'paid': 'Оплачен',
      'failed': 'Ошибка оплаты',
      'refunded': 'Возвращен'
    };
    return statusMap[status] || status;
  };

  if (!isAuthenticated) {
    return (
      <div className="user-profile">
        <div className="auth-required">
          <h2>Требуется авторизация</h2>
          <p>Для доступа к личному кабинету необходимо войти в систему.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="user-profile">
        <div className="loading">Загрузка профиля...</div>
      </div>
    );
  }

  return (
    <div className="user-profile" key={refreshKey}>
      <div className="profile-container">
        <h1>Личный кабинет</h1>
        
        <div className="profile-sections">
          {/* Profile Information Section */}
          <section className="profile-section">
            <h2>Персональные данные</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">Профиль успешно обновлен!</div>}
            
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_name">Имя</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={profile.first_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="last_name">Фамилия</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={profile.last_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profile.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Телефон</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profile.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="form-group address-autocomplete">
                <label htmlFor="address">Адрес</label>
                <div className="address-input-wrapper">
                  <textarea
                    ref={addressInputRef}
                    id="address"
                    name="address"
                    value={profile.address}
                    onChange={handleAddressChange}
                    onFocus={() => {
                      if (addressSuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    placeholder="Россия, Москва, ул. Ленина, д. 10, кв. 5"
                    rows="3"
                    className={profile.address && !isAddressValid() ? 'invalid' : ''}
                  />
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div ref={suggestionsRef} className="address-suggestions">
                      {addressSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="suggestion-item"
                          onClick={() => handleAddressSelect(suggestion)}
                        >
                          <div className="suggestion-value">{suggestion.value}</div>
                          {suggestion.data.postal_code && (
                            <div className="suggestion-postal">Индекс: {suggestion.data.postal_code}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <small className={`form-hint ${isAddressValid() ? 'success' : profile.address ? 'error' : ''}`}>
                  {getAddressValidationMessage()}
                </small>
              </div>
              
              <div className="form-group">
                <label htmlFor="birth_date">Дата рождения</label>
                <input
                  type="date"
                  id="birth_date"
                  name="birth_date"
                  value={profile.birth_date}
                  onChange={handleInputChange}
                />
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={updating}
              >
                {updating ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </form>
          </section>

          {/* Orders History Section */}
          <section className="profile-section">
            <h2>История заказов</h2>
            {orders.length === 0 ? (
              <div className="no-orders">
                <p>У вас пока нет заказов.</p>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map(order => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div className="order-number">
                        <strong>Заказ #{order.order_number}</strong>
                      </div>
                      <div className="order-date">
                        {new Date(order.created_at).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                    
                    <div className="order-details">
                      <div className="order-status">
                        <span className={`status-badge status-${order.status}`}>
                          {getOrderStatusText(order.status)}
                        </span>
                        <span className={`payment-badge payment-${order.payment_status}`}>
                          {getPaymentStatusText(order.payment_status)}
                        </span>
                      </div>
                      
                      <div className="order-total">
                        <strong>{order.total_amount} ₽</strong>
                      </div>
                    </div>
                    
                    <div className="order-items">
                      <h4>Товары:</h4>
                      {order.items && order.items.map(item => (
                        <div key={item.id} className="order-item">
                          <span className="item-name">{item.product.name}</span>
                          <span className="item-quantity">x{item.quantity}</span>
                          <span className="item-price">{item.price} ₽</span>
                        </div>
                      ))}
                    </div>
                    
                    {order.delivery_tracking && (
                      <div className="tracking-info">
                        <strong>Трек-номер:</strong> {order.delivery_tracking}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;