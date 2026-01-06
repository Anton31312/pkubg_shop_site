import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import api from '../../utils/api';
import './UserProfile.css';

const UserProfile = () => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
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

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
      fetchOrders();
    }
  }, [isAuthenticated]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile/');
      setProfile(response.data);
    } catch (error) {
      setError('Ошибка загрузки профиля');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/');
      setOrders(response.data.results || response.data);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(false);

    try {
      await api.put('/auth/profile/', profile);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      setError('Ошибка обновления профиля');
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
    <div className="user-profile">
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
              
              <div className="form-group">
                <label htmlFor="address">Адрес</label>
                <textarea
                  id="address"
                  name="address"
                  value={profile.address}
                  onChange={handleInputChange}
                  rows="3"
                />
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