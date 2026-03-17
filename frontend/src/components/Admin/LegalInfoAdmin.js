import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLegalInfo } from '../../contexts/LegalInfoContext';
import './LegalInfoAdmin.css';

const LegalInfoAdmin = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const { legalInfo, loading: contextLoading, updateLegalInfo } = useLegalInfo();

  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Проверка доступа
  const isAdmin = user && user.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
  }, [isAdmin, navigate]);

  // Заполнить форму данными из контекста
  useEffect(() => {
    if (legalInfo) {
      setFormData({ ...legalInfo });
    }
  }, [legalInfo]);

  // Защита от ухода без сохранения
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await updateLegalInfo(formData);
      setIsDirty(false);
      setMessage({ type: 'success', text: 'Данные успешно сохранены!' });
    } catch (err) {
      const errorData = err.response?.data;
      let errorText = 'Ошибка при сохранении данных';

      if (errorData && typeof errorData === 'object') {
        errorText = Object.entries(errorData)
          .map(([field, msgs]) =>
            `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`
          )
          .join('\n');
      }

      setMessage({ type: 'error', text: errorText });
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) return null;

  if (contextLoading) {
    return (
      <div className="legal-admin-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка данных...</p>
      </div>
    );
  }

  return (
    <div className="legal-admin-page">
      <div className="legal-admin-container">

        <header className="legal-admin-header">
          <h1>Юридическая информация</h1>
          <p className="legal-admin-subtitle">
            Эти данные используются в футере, юридических документах
            (оферта, политика конфиденциальности и др.) и на странице контактов.
          </p>
        </header>

        {message && (
          <div
            className={`legal-admin-message ${message.type}`}
            role="alert"
          >
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="legal-admin-form">

          {/* ═══ Данные ИП ═══ */}
          <fieldset className="legal-fieldset">
            <legend>Данные предпринимателя</legend>

            <div className="legal-form-group">
              <label htmlFor="business_type">Организационно-правовая форма</label>
              <input
                type="text"
                id="business_type"
                name="business_type"
                value={formData.business_type || ''}
                onChange={handleChange}
                placeholder="Индивидуальный предприниматель"
              />
            </div>

            <div className="legal-form-group">
              <label htmlFor="full_name">ФИО *</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name || ''}
                onChange={handleChange}
                required
                placeholder="Фамилия Имя Отчество"
              />
            </div>

            <div className="legal-form-group">
              <label htmlFor="short_name">
                Сокращённое наименование
                <span className="hint">Автогенерируется, если пусто</span>
              </label>
              <input
                type="text"
                id="short_name"
                name="short_name"
                value={formData.short_name || ''}
                onChange={handleChange}
                placeholder="ИП Фамилия И.О."
              />
            </div>

            <div className="legal-form-row">
              <div className="legal-form-group">
                <label htmlFor="ogrnip">ОГРНИП *</label>
                <input
                  type="text"
                  id="ogrnip"
                  name="ogrnip"
                  value={formData.ogrnip || ''}
                  onChange={handleChange}
                  required
                  maxLength={15}
                  placeholder="000000000000000"
                />
              </div>

              <div className="legal-form-group">
                <label htmlFor="inn">ИНН *</label>
                <input
                  type="text"
                  id="inn"
                  name="inn"
                  value={formData.inn || ''}
                  onChange={handleChange}
                  required
                  maxLength={12}
                  placeholder="000000000000"
                />
              </div>
            </div>
          </fieldset>

          {/* ═══ Адрес ═══ */}
          <fieldset className="legal-fieldset">
            <legend>Адрес</legend>

            <div className="legal-form-group">
              <label htmlFor="postal_code">Индекс</label>
              <input
                type="text"
                id="postal_code"
                name="postal_code"
                value={formData.postal_code || ''}
                onChange={handleChange}
                maxLength={6}
                placeholder="000000"
              />
            </div>

            <div className="legal-form-group">
              <label htmlFor="legal_address">Юридический адрес *</label>
              <textarea
                id="legal_address"
                name="legal_address"
                value={formData.legal_address || ''}
                onChange={handleChange}
                required
                rows={2}
                placeholder="г. Город, ул. Улица, д. 00, кв. 00"
              />
            </div>
          </fieldset>

          {/* ═══ Контакты ═══ */}
          <fieldset className="legal-fieldset">
            <legend>Контакты</legend>

            <div className="legal-form-row">
              <div className="legal-form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  required
                  placeholder="contact@pkubg.ru"
                />
              </div>

              <div className="legal-form-group">
                <label htmlFor="phone">Телефон *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  required
                  placeholder="+7 (999) 999-99-99"
                />
              </div>
            </div>

            <div className="legal-form-group">
              <label htmlFor="working_hours">Режим работы</label>
              <input
                type="text"
                id="working_hours"
                name="working_hours"
                value={formData.working_hours || ''}
                onChange={handleChange}
                placeholder="Пн–Пт 09:00–18:00 (МСК)"
              />
            </div>
          </fieldset>

          {/* ═══ Банковские реквизиты ═══ */}
          <fieldset className="legal-fieldset">
            <legend>Банковские реквизиты</legend>

            <div className="legal-form-group">
              <label htmlFor="bank_name">Наименование банка</label>
              <input
                type="text"
                id="bank_name"
                name="bank_name"
                value={formData.bank_name || ''}
                onChange={handleChange}
                placeholder="ПАО Сбербанк"
              />
            </div>

            <div className="legal-form-row">
              <div className="legal-form-group">
                <label htmlFor="bik">БИК</label>
                <input
                  type="text"
                  id="bik"
                  name="bik"
                  value={formData.bik || ''}
                  onChange={handleChange}
                  maxLength={9}
                  placeholder="000000000"
                />
              </div>

              <div className="legal-form-group">
                <label htmlFor="checking_account">Расчётный счёт</label>
                <input
                  type="text"
                  id="checking_account"
                  name="checking_account"
                  value={formData.checking_account || ''}
                  onChange={handleChange}
                  maxLength={20}
                  placeholder="00000000000000000000"
                />
              </div>
            </div>

            <div className="legal-form-group">
              <label htmlFor="correspondent_account">Корреспондентский счёт</label>
              <input
                type="text"
                id="correspondent_account"
                name="correspondent_account"
                value={formData.correspondent_account || ''}
                onChange={handleChange}
                maxLength={20}
                placeholder="00000000000000000000"
              />
            </div>
          </fieldset>

          {/* ═══ Сайт и бренд ═══ */}
          <fieldset className="legal-fieldset">
            <legend>Сайт и бренд</legend>

            <div className="legal-form-row">
              <div className="legal-form-group">
                <label htmlFor="site_name">Название магазина</label>
                <input
                  type="text"
                  id="site_name"
                  name="site_name"
                  value={formData.site_name || ''}
                  onChange={handleChange}
                  placeholder="PKUBG"
                />
              </div>

              <div className="legal-form-group">
                <label htmlFor="site_url">URL сайта</label>
                <input
                  type="url"
                  id="site_url"
                  name="site_url"
                  value={formData.site_url || ''}
                  onChange={handleChange}
                  placeholder="https://pkubg.ru"
                />
              </div>
            </div>

            <div className="legal-form-group">
              <label htmlFor="site_description">Описание магазина</label>
              <textarea
                id="site_description"
                name="site_description"
                value={formData.site_description || ''}
                onChange={handleChange}
                rows={2}
                placeholder="Интернет-магазин низкобелковой и безглютеновой продукции"
              />
            </div>
          </fieldset>

          {/* ═══ Социальные сети ═══ */}
          <fieldset className="legal-fieldset">
            <legend>Социальные сети</legend>

            <div className="legal-form-group">
              <label htmlFor="telegram_url">Telegram</label>
              <input
                type="url"
                id="telegram_url"
                name="telegram_url"
                value={formData.telegram_url || ''}
                onChange={handleChange}
                placeholder="https://t.me/..."
              />
            </div>

            <div className="legal-form-group">
              <label htmlFor="vk_url">ВКонтакте</label>
              <input
                type="url"
                id="vk_url"
                name="vk_url"
                value={formData.vk_url || ''}
                onChange={handleChange}
                placeholder="https://vk.com/..."
              />
            </div>

            <div className="legal-form-group">
              <label htmlFor="ozon_url">Ozon</label>
              <input
                type="url"
                id="ozon_url"
                name="ozon_url"
                value={formData.ozon_url || ''}
                onChange={handleChange}
                placeholder="https://www.ozon.ru/..."
              />
            </div>
          </fieldset>

          {/* ═══ Кнопки ═══ */}
          <div className="legal-admin-actions">
            <button
              type="submit"
              className="legal-save-btn"
              disabled={saving || !isDirty}
            >
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>

            {isDirty && (
              <span className="unsaved-indicator">
                ● Есть несохранённые изменения
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LegalInfoAdmin;