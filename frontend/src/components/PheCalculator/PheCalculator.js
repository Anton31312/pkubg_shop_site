import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  addPheItem,
  removePheItem,
  clearPheItems,
  setDailyLimit,
  togglePheCalculator,
  closePheCalculator,
} from '../../store/pheSlice';
import './PheCalculator.css';

const PheCalculator = () => {
  const dispatch = useDispatch();
  const { items, dailyLimit, isOpen } = useSelector(state => state.phe);

  const totalPhe = items.reduce((sum, item) => sum + item.phe, 0);
  const remaining = dailyLimit - totalPhe;
  const percentUsed = dailyLimit > 0 ? Math.min((totalPhe / dailyLimit) * 100, 100) : 0;

  const [newItem, setNewItem] = useState({ name: '', protein: '', weight: '' });
  const [selectedPreset, setSelectedPreset] = useState('');
  const [presetWeight, setPresetWeight] = useState('');

  const presets = [
    { name: 'Рис варёный', protein: 2.7 },
    { name: 'Картофель', protein: 2.0 },
    { name: 'Яблоко', protein: 0.3 },
    { name: 'Банан', protein: 1.1 },
    { name: 'Морковь', protein: 0.9 },
  ];

  const handleManualAdd = (e) => {
    e.preventDefault();
    if (newItem.name && newItem.protein && newItem.weight) {
      dispatch(addPheItem({
        name: newItem.name,
        proteinPer100g: parseFloat(newItem.protein),
        weight: parseFloat(newItem.weight),
      }));
      setNewItem({ name: '', protein: '', weight: '' });
    }
  };

  const handlePresetAdd = () => {
    const preset = presets.find(p => p.name === selectedPreset);
    if (preset && presetWeight) {
      dispatch(addPheItem({
        name: preset.name,
        proteinPer100g: preset.protein,
        weight: parseFloat(presetWeight),
      }));
      setSelectedPreset('');
      setPresetWeight('');
    }
  };

  // Кнопка — всегда видна
  if (!isOpen) {
    return (
      <button
        className="phe-calculator-toggle"
        onClick={() => dispatch(togglePheCalculator())}
        title="Калькулятор фенилаланина"
      >
        <span className="phe-icon">🧮</span>
        <span className="phe-label">ФА: {totalPhe} мг</span>
        {percentUsed > 80 && (
          <span className={`phe-indicator ${percentUsed >= 100 ? 'danger' : 'warning'}`} />
        )}
      </button>
    );
  }

  return (
    <div className="phe-calculator-overlay" onClick={() => dispatch(closePheCalculator())}>
      <div className="phe-calculator" onClick={(e) => e.stopPropagation()}>
        <div className="phe-header">
          <h2>🧮 Калькулятор фенилаланина</h2>
          <button className="phe-close" onClick={() => dispatch(closePheCalculator())}>×</button>
        </div>

        {/* Прогресс */}
        <div className="phe-progress-section">
          <div className="phe-stats">
            <div className="phe-stat">
              <span className="phe-stat-label">Употреблено</span>
              <span className="phe-stat-value">{totalPhe} мг</span>
            </div>
            <div className="phe-stat">
              <span className="phe-stat-label">Осталось</span>
              <span className={`phe-stat-value ${remaining < 0 ? 'exceeded' : ''}`}>
                {remaining} мг
              </span>
            </div>
            <div className="phe-stat">
              <span className="phe-stat-label">Норма</span>
              <div className="phe-limit-wrapper">
                <input
                  type="number"
                  value={dailyLimit}
                  onChange={(e) => dispatch(setDailyLimit(parseInt(e.target.value) || 0))}
                  className="phe-limit-input"
                />
                <span>мг</span>
              </div>
            </div>
          </div>

          <div className="phe-progress-bar">
            <div
              className={`phe-progress-fill ${percentUsed > 100 ? 'exceeded' : percentUsed > 80 ? 'warning' : ''}`}
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            />
          </div>
          <div className="phe-progress-label">{percentUsed.toFixed(0)}% от дневной нормы</div>
        </div>

        {/* Быстрое добавление */}
        <div className="phe-presets">
          <h3>Быстрое добавление</h3>
          <div className="phe-preset-form">
            <select value={selectedPreset} onChange={(e) => setSelectedPreset(e.target.value)}>
              <option value="">Выберите продукт...</option>
              {presets.map(p => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.protein}г белка/100г)
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Вес, г"
              value={presetWeight}
              onChange={(e) => setPresetWeight(e.target.value)}
            />
            <button onClick={handlePresetAdd} disabled={!selectedPreset || !presetWeight}>
              +
            </button>
          </div>
        </div>

        {/* Ручное добавление */}
        <div className="phe-manual-add">
          <h3>Свой продукт</h3>
          <form onSubmit={handleManualAdd} className="phe-manual-form">
            <input
              type="text"
              placeholder="Название"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            />
            <input
              type="number"
              step="0.1"
              placeholder="Белок/100г"
              value={newItem.protein}
              onChange={(e) => setNewItem({ ...newItem, protein: e.target.value })}
            />
            <input
              type="number"
              placeholder="Вес, г"
              value={newItem.weight}
              onChange={(e) => setNewItem({ ...newItem, weight: e.target.value })}
            />
            <button type="submit">+</button>
          </form>
        </div>

        {/* Список */}
        <div className="phe-items-section">
          <div className="phe-items-header">
            <h3>Сегодня ({items.length})</h3>
            {items.length > 0 && (
              <button className="phe-clear-btn" onClick={() => dispatch(clearPheItems())}>
                Очистить
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="phe-empty">Добавьте продукты для расчёта</p>
          ) : (
            <ul className="phe-items-list">
              {items.map(item => (
                <li key={item.id} className="phe-item">
                  <div className="phe-item-info">
                    <span className="phe-item-name">{item.name}</span>
                    <span className="phe-item-details">
                      {item.weight}г · {item.protein}г белка
                    </span>
                  </div>
                  <div className="phe-item-value">
                    <strong>{item.phe} мг</strong>
                    <button
                      className="phe-item-remove"
                      onClick={() => dispatch(removePheItem(item.id))}
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="phe-footer">
          <p className="phe-note">
            * Расчёт приблизительный (1г белка ≈ 50мг ФА).
            Данные сохраняются до конца дня.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PheCalculator;