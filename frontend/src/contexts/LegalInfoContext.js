import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

const LegalInfoContext = createContext(null);

// Значения по умолчанию (пока данные не загрузились)
const DEFAULT_LEGAL_INFO = {
  business_type: 'Индивидуальный предприниматель',
  full_name: '...',
  short_name: 'ИП ...',
  ogrnip: '...',
  inn: '...',
  legal_address: '...',
  postal_code: '',
  email: 'contact@pkubg.ru',
  phone: '+7 (999) 999-99-99',
  working_hours: 'Пн–Пт 09:00–18:00 (МСК)',
  bank_name: '',
  bik: '',
  checking_account: '',
  correspondent_account: '',
  site_name: 'PKUBG',
  site_url: 'https://pkubg.ru',
  site_description: '',
  telegram_url: '',
  vk_url: '',
  ozon_url: '',
  updated_date_formatted: '',
};

export const LegalInfoProvider = ({ children }) => {
  const [legalInfo, setLegalInfo] = useState(DEFAULT_LEGAL_INFO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLegalInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get('/legal-info/');
      setLegalInfo(response.data);
    } catch (err) {
      console.error('Failed to load legal info:', err);
      setError('Не удалось загрузить юридическую информацию');
      // Оставляем DEFAULT — сайт продолжит работать
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLegalInfo();
  }, [fetchLegalInfo]);

  // Функция обновления (для админки)
  const updateLegalInfo = useCallback(async (data) => {
    const response = await apiService.put('/legal-info/update/', data);
    setLegalInfo(response.data);
    return response.data;
  }, []);

  const value = {
    legalInfo,
    loading,
    error,
    updateLegalInfo,
    refreshLegalInfo: fetchLegalInfo,
  };

  return (
    <LegalInfoContext.Provider value={value}>
      {children}
    </LegalInfoContext.Provider>
  );
};

// Хук для использования в компонентах
export const useLegalInfo = () => {
  const context = useContext(LegalInfoContext);
  if (!context) {
    throw new Error('useLegalInfo must be used within LegalInfoProvider');
  }
  return context;
};

export default LegalInfoContext;