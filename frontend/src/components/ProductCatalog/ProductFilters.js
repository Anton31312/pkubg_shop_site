import React from 'react';
import './ProductFilters.css';

const ProductFilters = ({ categories = [], manufacturers = [], filters, onFilterChange, isVisible }) => {
  const handleInputChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  const handleCheckboxChange = (field, checked) => {
    onFilterChange({ [field]: checked });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      category: '',
      manufacturer: '',
      isGlutenFree: false,
      isLowProtein: false,
      minPrice: '',
      maxPrice: '',
    });
  };

  if (!isVisible) return null;

  return (
    <div className="product-filters">
      <div className="filters-header">
        <h3>Фильтры</h3>
        <button onClick={clearFilters} className="clear-filters">
          Очистить
        </button>
      </div>

      <div className="filter-group">
        <label>Категория</label>
        <select
          value={filters.category}
          onChange={(e) => handleInputChange('category', e.target.value)}
          className="filter-select"
        >
          <option value="">Все категории</option>
          {Array.isArray(categories) && categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Производитель</label>
        <select
          value={filters.manufacturer}
          onChange={(e) => handleInputChange('manufacturer', e.target.value)}
          className="filter-select"
        >
          <option value="">Все производители</option>
          {Array.isArray(manufacturers) && manufacturers.map((manufacturer, index) => (
            <option key={index} value={manufacturer}>
              {manufacturer}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Цена</label>
        <div className="price-range">
          <input
            type="number"
            placeholder="От"
            value={filters.minPrice}
            onChange={(e) => handleInputChange('minPrice', e.target.value)}
            className="price-input"
          />
          <span>—</span>
          <input
            type="number"
            placeholder="До"
            value={filters.maxPrice}
            onChange={(e) => handleInputChange('maxPrice', e.target.value)}
            className="price-input"
          />
        </div>
      </div>

      <div className="filter-group">
        <label>Особенности</label>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.isGlutenFree}
              onChange={(e) => handleCheckboxChange('isGlutenFree', e.target.checked)}
            />
            <span className="checkmark"></span>
            Без глютена
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.isLowProtein}
              onChange={(e) => handleCheckboxChange('isLowProtein', e.target.checked)}
            />
            <span className="checkmark"></span>
            Низкобелковый
          </label>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;