import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import './RouteRefresh.css';

/**
 * Компонент-обертка для принудительного обновления при смене роутов
 */
const RouteRefresh = ({ children }) => {
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    // Логируем смену роута
    console.log('Route changed:', location.pathname);
    
    // Очищаем состояние компонентов при смене роута
    const clearComponentStates = () => {
      // Очищаем все таймеры
      const highestTimeoutId = setTimeout(() => {}, 0);
      for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i);
      }
      
      // Очищаем все интервалы
      const highestIntervalId = setInterval(() => {}, 0);
      for (let i = 0; i < highestIntervalId; i++) {
        clearInterval(i);
      }
      
      // Принудительно обновляем размеры окна
      window.dispatchEvent(new Event('resize'));
      
      // Очищаем фокус с элементов
      if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }
    };

    // Прокручиваем наверх
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });

    // Очищаем состояния с небольшой задержкой
    const timeoutId = setTimeout(() => {
      clearComponentStates();
    }, 50);

    // Принудительно обновляем через 100ms
    const refreshTimeoutId = setTimeout(() => {
      // Триггерим событие обновления для всех компонентов
      window.dispatchEvent(new CustomEvent('routeChanged', {
        detail: { pathname: location.pathname }
      }));
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(refreshTimeoutId);
    };
  }, [location.pathname, dispatch]);

  // Используем key для принудительного пересоздания дочерних компонентов
  return (
    <div key={location.pathname} className="route-container">
      {children}
    </div>
  );
};

export default RouteRefresh;