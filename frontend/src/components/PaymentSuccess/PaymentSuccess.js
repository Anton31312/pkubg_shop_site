import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get('payment');

  useEffect(() => {
    // Можно добавить аналитику или другие действия при успешной оплате
    if (paymentStatus === 'success') {
      console.log('Payment successful');
    }
  }, [paymentStatus]);

  if (paymentStatus === 'failed') {
    return (
      <div className="payment-result">
        <div className="payment-result-container">
          <div className="payment-icon error">❌</div>
          <h1>Оплата не прошла</h1>
          <p className="payment-message">
            К сожалению, произошла ошибка при обработке платежа.
          </p>
          <p className="payment-hint">
            Пожалуйста, попробуйте еще раз или свяжитесь с нашей службой поддержки.
          </p>
          <div className="payment-actions">
            <Link to="/cart" className="btn btn-primary">
              Вернуться в корзину
            </Link>
            <Link to="/profile" className="btn btn-secondary">
              Мои заказы
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result">
      <div className="payment-result-container">
        <div className="payment-icon success">✅</div>
        <h1>Оплата прошла успешно!</h1>
        <p className="payment-message">
          Спасибо за ваш заказ! Мы получили оплату и начали обработку заказа.
        </p>
        <p className="payment-hint">
          Информация о заказе отправлена на вашу электронную почту.
          Вы можете отслеживать статус заказа в личном кабинете.
        </p>
        <div className="payment-actions">
          <Link to="/profile" className="btn btn-primary">
            Мои заказы
          </Link>
          <Link to="/" className="btn btn-secondary">
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
