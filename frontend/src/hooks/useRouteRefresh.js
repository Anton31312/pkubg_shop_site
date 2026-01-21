import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Хук для автоматического обновления компонентов при смене роута
 * @param {Function} refreshCallback - Функция, которая будет вызвана при смене роута
 * @param {Array} dependencies - Зависимости для useEffect
 */
const useRouteRefresh = (refreshCallback, dependencies = []) => {
  const location = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Увеличиваем ключ обновления при смене роута
    setRefreshKey(prev => prev + 1);
    
    // Вызываем callback с небольшой задержкой
    const timeoutId = setTimeout(() => {
      if (refreshCallback && typeof refreshCallback === 'function') {
        refreshCallback(location.pathname);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, ...dependencies]);

  // Слушаем кастомное событие смены роута
  useEffect(() => {
    const handleRouteChange = (event) => {
      setRefreshKey(prev => prev + 1);
      if (refreshCallback && typeof refreshCallback === 'function') {
        refreshCallback(event.detail?.pathname || location.pathname);
      }
    };

    window.addEventListener('routeChanged', handleRouteChange);
    return () => window.removeEventListener('routeChanged', handleRouteChange);
  }, [refreshCallback, location.pathname, ...dependencies]);

  return refreshKey;
};

export default useRouteRefresh;