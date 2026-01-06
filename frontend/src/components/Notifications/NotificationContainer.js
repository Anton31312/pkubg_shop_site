import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeNotification } from '../../store/notificationSlice';
import './NotificationContainer.css';

const NotificationContainer = () => {
  const notifications = useSelector(state => state.notifications.notifications);
  const dispatch = useDispatch();

  const handleClose = (id) => {
    dispatch(removeNotification(id));
  };

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={() => handleClose(notification.id)}
        />
      ))}
    </div>
  );
};

const Notification = ({ notification, onClose }) => {
  const { type, message, duration } = notification;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={`notification notification--${type}`}>
      <div className="notification-icon">
        {getIcon()}
      </div>
      <div className="notification-message">
        {message}
      </div>
      <button 
        className="notification-close"
        onClick={onClose}
        aria-label="Закрыть уведомление"
      >
        ×
      </button>
    </div>
  );
};

export default NotificationContainer;