import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearCart } from '../../store/cartSlice';
import api from '../../utils/api';
import './Checkout.css';

const Checkout = () => {
  const { items, total, count } = useSelector(state => state.cart);
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [orderData, setOrderData] = useState({
    shipping_address: '',
    delivery_method: 'cdek',
    payment_method: 'yookassa',
    notes: ''
  });

  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [selectedDeliveryPoint, setSelectedDeliveryPoint] = useState(null);
  const [deliveryCost, setDeliveryCost] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (count === 0) {
      navigate('/cart');
      return;
    }
  }, [isAuthenticated, count, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const searchDeliveryPoints = async () => {
    if (!orderData.shipping_address.trim()) {
      setError('Введите адрес для поиска пунктов выдачи');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/integrations/cdek/delivery-points/', {
        address: orderData.shipping_address
      });
      setDeliveryOptions(response.data.points || []);
      
      if (response.data.points && response.data.points.length > 0) {
        setStep(2);
      } else {
        setError('Пункты выдачи не найдены для указанного адреса');
      }
    } catch (error) {
      setError('Ошибка поиска пунктов выдачи');
    } finally {
      setLoading(false);
    }
  };

  const selectDeliveryPoint = (point) => {
    setSelectedDeliveryPoint(point);
    setDeliveryCost(point.cost || 0);
    setStep(3);
  };

  const calculateTotal = () => {
    return total + deliveryCost;
  };

  const createOrder = async () => {
    setLoading(true);
    setError(null);

    try {
      const orderPayload = {
        ...orderData,
        delivery_point_id: selectedDeliveryPoint?.id,
        delivery_cost: deliveryCost,
        total_amount: calculateTotal()
      };

      const response = await api.post('/orders/create/', orderPayload);
      
      // Clear cart after successful order creation
      dispatch(clearCart());
      
      // Redirect to payment
      if (response.data.payment_url) {
        window.location.href = response.data.payment_url;
      } else {
        navigate('/profile', { 
          state: { message: 'Заказ успешно создан!' }
        });
      }
    } catch (error) {
      setError('Ошибка создания заказа');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="checkout-step">
      <h3>Шаг 1: Адрес доставки</h3>
      
      <div className="form-group">
        <label htmlFor="shipping_address">Адрес доставки *</label>
        <textarea
          id="shipping_address"
          name="shipping_address"
          value={orderData.shipping_address}
          onChange={handleInputChange}
          placeholder="Введите полный адрес для поиска ближайших пунктов выдачи СДЭК"
          rows="3"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="notes">Комментарий к заказу</label>
        <textarea
          id="notes"
          name="notes"
          value={orderData.notes}
          onChange={handleInputChange}
          placeholder="Дополнительные пожелания или комментарии"
          rows="2"
        />
      </div>

      <button 
        className="btn btn-primary"
        onClick={searchDeliveryPoints}
        disabled={loading || !orderData.shipping_address.trim()}
      >
        {loading ? 'Поиск...' : 'Найти пункты выдачи'}
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="checkout-step">
      <h3>Шаг 2: Выбор пункта выдачи</h3>
      
      <div className="delivery-points">
        {deliveryOptions.map(point => (
          <div key={point.id} className="delivery-point">
            <div className="point-info">
              <h4>{point.name}</h4>
              <p className="point-address">{point.address}</p>
              <div className="point-details">
                <span className="point-hours">Часы работы: {point.work_time}</span>
                {point.cost && (
                  <span className="point-cost">Стоимость: {point.cost} ₽</span>
                )}
              </div>
            </div>
            <button 
              className="btn btn-select"
              onClick={() => selectDeliveryPoint(point)}
            >
              Выбрать
            </button>
          </div>
        ))}
      </div>

      <button 
        className="btn btn-secondary"
        onClick={() => setStep(1)}
      >
        ← Назад
      </button>
    </div>
  );

  const renderStep3 = () => (
    <div className="checkout-step">
      <h3>Шаг 3: Подтверждение заказа</h3>
      
      <div className="order-summary">
        <div className="summary-section">
          <h4>Товары в заказе</h4>
          <div className="order-items">
            {items.map(item => (
              <div key={item.id} className="order-item">
                <span className="item-name">{item.product.name}</span>
                <span className="item-quantity">x{item.quantity}</span>
                <span className="item-price">{item.price * item.quantity} ₽</span>
              </div>
            ))}
          </div>
        </div>

        <div className="summary-section">
          <h4>Доставка</h4>
          <div className="delivery-info">
            <p><strong>Пункт выдачи:</strong> {selectedDeliveryPoint?.name}</p>
            <p><strong>Адрес:</strong> {selectedDeliveryPoint?.address}</p>
            <p><strong>Стоимость доставки:</strong> {deliveryCost} ₽</p>
          </div>
        </div>

        <div className="summary-section">
          <h4>Адрес</h4>
          <p>{orderData.shipping_address}</p>
          {orderData.notes && (
            <p><strong>Комментарий:</strong> {orderData.notes}</p>
          )}
        </div>

        <div className="total-section">
          <div className="total-line">
            <span>Товары:</span>
            <span>{total} ₽</span>
          </div>
          <div className="total-line">
            <span>Доставка:</span>
            <span>{deliveryCost} ₽</span>
          </div>
          <div className="total-line total-final">
            <span>Итого:</span>
            <span>{calculateTotal()} ₽</span>
          </div>
        </div>
      </div>

      <div className="checkout-actions">
        <button 
          className="btn btn-secondary"
          onClick={() => setStep(2)}
        >
          ← Назад
        </button>
        <button 
          className="btn btn-primary btn-large"
          onClick={createOrder}
          disabled={loading}
        >
          {loading ? 'Создание заказа...' : 'Оформить заказ'}
        </button>
      </div>
    </div>
  );

  if (!isAuthenticated || count === 0) {
    return null;
  }

  return (
    <div className="checkout">
      <div className="checkout-container">
        <header className="checkout-header">
          <h1>Оформление заказа</h1>
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
          </div>
        </header>

        {error && <div className="error-message">{error}</div>}

        <div className="checkout-content">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
};

export default Checkout;