import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearCart } from '../../store/cartSlice';
import api from '../../utils/api';
import './Checkout.css';

const Checkout = () => {
  const { items, total, count } = useSelector(state => state.cart);
  const { isAuthenticated } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [orderData, setOrderData] = useState({
    shipping_address: '',
    shipping_contact: '',
    notes: ''
  });

  // Для автоподбора адресов
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const addressInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (count === 0) {
      navigate('/cart');
      return;
    }

    // Загружаем данные профиля для подтягивания телефона
    fetchUserProfile();
  }, [isAuthenticated, count, navigate]);

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

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/profile/');
      const profile = response.data;
      
      // Подтягиваем номер телефона и адрес из профиля, если они есть
      setOrderData(prev => ({
        ...prev,
        shipping_contact: profile.phone || '',
        shipping_address: profile.address || ''
      }));

      // Если адрес есть, считаем его валидным
      if (profile.address) {
        setSelectedAddress({ value: profile.address });
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
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
      console.log('Fetching address suggestions for:', query);
      
      const response = await api.post('/address-suggestions/', {
        query: query
      });

      console.log('API Response:', response.data);
      console.log('Received suggestions:', response.data.suggestions?.length || 0);
      
      const suggestions = response.data.suggestions || [];
      setAddressSuggestions(suggestions);
      
      if (suggestions.length > 0) {
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Ошибка получения подсказок адресов:', error);
      console.error('Error details:', error.response?.data);
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setOrderData(prev => ({
      ...prev,
      shipping_address: value
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
    setOrderData(prev => ({
      ...prev,
      shipping_address: suggestion.value
    }));
    setSelectedAddress(suggestion);
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const isAddressValid = () => {
    if (!orderData.shipping_address.trim()) {
      return false;
    }
    
    // Если адрес выбран из Dadata, считаем его валидным
    if (selectedAddress !== null) {
      return true;
    }
    
    // Проверяем структуру адреса через запятую
    return validateAddressStructure(orderData.shipping_address);
  };

  const validateAddressStructure = (address) => {
    if (!address || !address.trim()) {
      return false;
    }

    // Разбиваем адрес по запятым и очищаем от лишних пробелов
    const parts = address.split(',').map(part => part.trim()).filter(part => part.length > 0);
    
    // Минимум должно быть: страна, город, улица, дом
    if (parts.length < 4) {
      return false;
    }

    // Проверяем каждую часть
    const [country, city, street, house, apartment] = parts;

    // Страна - должна содержать буквы
    if (!country || !/[а-яёa-z]/i.test(country)) {
      return false;
    }

    // Город - должен содержать буквы
    if (!city || !/[а-яёa-z]/i.test(city)) {
      return false;
    }

    // Улица - должна содержать буквы
    if (!street || !/[а-яёa-z]/i.test(street)) {
      return false;
    }

    // Дом - должен содержать цифры
    if (!house || !/\d/.test(house)) {
      return false;
    }

    // Квартира необязательна, но если указана, должна содержать цифры или буквы
    if (apartment && !/[а-яёa-z\d]/i.test(apartment)) {
      return false;
    }

    return true;
  };

  const getAddressValidationMessage = () => {
    if (!orderData.shipping_address.trim()) {
      return 'Начните вводить адрес, и мы предложим варианты';
    }

    if (selectedAddress) {
      return '✓ Адрес подтвержден';
    }

    const address = orderData.shipping_address.trim();
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
    setOrderData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!orderData.shipping_address.trim()) {
      setError('Пожалуйста, укажите адрес доставки');
      return;
    }

    if (!isAddressValid()) {
      if (selectedAddress === null && !validateAddressStructure(orderData.shipping_address)) {
        setError('Пожалуйста, выберите адрес из предложенных вариантов или укажите адрес в формате: Страна, Город, Улица, Дом, Квартира');
      } else {
        setError('Пожалуйста, проверьте корректность введенного адреса');
      }
      return;
    }

    if (!orderData.shipping_contact.trim()) {
      setError('Пожалуйста, укажите номер телефона');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Сохраняем номер телефона в профиль пользователя, если он был заполнен
      try {
        await api.put('/auth/profile/', {
          phone: orderData.shipping_contact,
          address: orderData.shipping_address
        });
      } catch (profileError) {
        console.error('Ошибка обновления профиля:', profileError);
        // Продолжаем оформление заказа даже если не удалось обновить профиль
      }

      // Создаем заказ
      const orderResponse = await api.post('/orders/create/', {
        shipping_address: orderData.shipping_address,
        notes: orderData.notes,
        delivery_method: 'courier'
      });

      const orderId = orderResponse.data.order_id;

      // Создаем платеж через RoboKassa
      const paymentResponse = await api.post('/integrations/payment/create/', {
        order_id: orderId,
        success_url: `${window.location.origin}/payment-result?payment=success`,
        fail_url: `${window.location.origin}/payment-result?payment=failed`
      });

      // Очищаем корзину
      dispatch(clearCart());

      // Перенаправляем на страницу оплаты RoboKassa
      window.location.href = paymentResponse.data.payment_url;

    } catch (err) {
      console.error('Checkout error:', err);
      setError(
        err.response?.data?.error || 
        'Произошла ошибка при оформлении заказа. Попробуйте еще раз.'
      );
      setLoading(false);
    }
  };

  if (!isAuthenticated || count === 0) {
    return null;
  }

  return (
    <div className="checkout">
      <div className="checkout-container">
        <header className="checkout-header">
          <h1>Оформление заказа</h1>
        </header>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="checkout-content">
          <div className="checkout-main">
            <form onSubmit={handleSubmit} className="checkout-form">
              <div className="form-section">
                <h3>Информация о доставке</h3>
                
                <div className="form-group address-autocomplete">
                  <label htmlFor="shipping_address">
                    Адрес доставки <span className="required">*</span>
                  </label>
                  <div className="address-input-wrapper">
                    <textarea
                      ref={addressInputRef}
                      id="shipping_address"
                      name="shipping_address"
                      value={orderData.shipping_address}
                      onChange={handleAddressChange}
                      onFocus={() => {
                        if (addressSuggestions.length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                      placeholder="Россия, Москва, ул. Ленина, д. 10, кв. 5"
                      rows="3"
                      required
                      disabled={loading}
                      className={!isAddressValid() && orderData.shipping_address ? 'invalid' : ''}
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
                  <small className={`form-hint ${isAddressValid() ? 'success' : orderData.shipping_address ? 'error' : ''}`}>
                    {getAddressValidationMessage()}
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="shipping_contact">
                    Номер телефона <span className="required">*</span>
                  </label>
                  <textarea
                    id="shipping_contact"
                    name="shipping_contact"
                    value={orderData.shipping_contact}
                    onChange={handleInputChange}
                    placeholder="Укажите номер телефона для связи"
                    rows="3"
                    required
                    disabled={loading}
                  />
                  <small className="form-hint">
                    Пример: +79841235544
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">
                    Комментарий к заказу
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={orderData.notes}
                    onChange={handleInputChange}
                    placeholder="Дополнительные пожелания или комментарии (необязательно)"
                    rows="2"
                    disabled={loading}
                  />
                  <small className="form-hint">
                    Например: позвонить за час до доставки, оставить у двери и т.д.
                  </small>
                </div>
              </div>

              <div className="form-section">
                <h3>Способ оплаты</h3>
                <div className="payment-method-info">
                  <div className="payment-icon">💳</div>
                  <div className="payment-details">
                    <strong>Онлайн-оплата через RoboKassa</strong>
                    <p>Безопасная оплата банковской картой или другими способами</p>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-large"
                disabled={loading || !orderData.shipping_address.trim()}
              >
                {loading ? 'Обработка...' : 'Перейти к оплате'}
              </button>
            </form>
          </div>

          <div className="checkout-sidebar">
            <div className="order-summary">
              <h3>Ваш заказ</h3>
              
              <div className="order-items">
                {items.map(item => (
                  <div key={item.id} className="order-item">
                    <div className="item-info">
                      <span className="item-name">{item.product.name}</span>
                      <span className="item-quantity">× {item.quantity}</span>
                    </div>
                    <span className="item-price">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="order-totals">
                <div className="total-line">
                  <span>Товары ({count}):</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="total-line">
                  <span>Доставка:</span>
                  <span className="delivery-note">Бесплатно</span>
                </div>
                <div className="total-line total-final">
                  <span>Итого:</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {total >= 2000 && (
                <div className="free-delivery-badge">
                  ✅ Бесплатная доставка
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
