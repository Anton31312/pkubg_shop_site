import React from 'react';
import './ProductFilters.css';

const ProductFilters = ({ categories = [], manufacturers = [], filters, onFilterChange, isVisible }) => {
  const handleInputChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  const handleCheckboxChange = (field, checked) => {
    onFilterChange({ [field]: checked });
  };

  const handleCategoryToggle = (categoryId) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(c => c !== categoryId)
      : [...currentCategories, categoryId];
    
    onFilterChange({ categories: newCategories });
  };

  const handleManufacturerToggle = (manufacturer) => {
    const currentManufacturers = filters.manufacturers || [];
    const newManufacturers = currentManufacturers.includes(manufacturer)
      ? currentManufacturers.filter(m => m !== manufacturer)
      : [...currentManufacturers, manufacturer];
    
    onFilterChange({ manufacturers: newManufacturers });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      categories: [],
      manufacturers: [],
      isGlutenFree: false,
      isLowProtein: false,
      minPrice: '',
      maxPrice: '',
    });
  };

  // Organize categories into parent-child hierarchy
  const organizeCategories = (categories) => {
    const parentCategories = categories.filter(cat => !cat.parent);
    const childCategories = categories.filter(cat => cat.parent);
    
    return parentCategories.map(parent => ({
      ...parent,
      children: childCategories.filter(child => child.parent === parent.id)
    }));
  };

  const hierarchicalCategories = organizeCategories(categories);

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
        <div className="checkbox-group">
          {hierarchicalCategories.map(parent => (
            <React.Fragment key={parent.id}>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.categories?.includes(parent.id) || false}
                  onChange={() => handleCategoryToggle(parent.id)}
                />
                <span className="checkmark"></span>
                {parent.name}
              </label>
              {parent.children && parent.children.length > 0 && (
                <div className="subcategories">
                  {parent.children.map(child => (
                    <label key={child.id} className="checkbox-label subcategory">
                      <input
                        type="checkbox"
                        checked={filters.categories?.includes(child.id) || false}
                        onChange={() => handleCategoryToggle(child.id)}
                      />
                      <span className="checkmark"></span>
                      {child.name}
                    </label>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
          {(!categories || categories.length === 0) && (
            <p className="no-categories">Категории не найдены</p>
          )}
        </div>
      </div>

      <div className="filter-group">
        <label>Производитель</label>
        <div className="checkbox-group">
          {Array.isArray(manufacturers) && manufacturers.map((manufacturer, index) => (
            <label key={index} className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.manufacturers?.includes(manufacturer) || false}
                onChange={() => handleManufacturerToggle(manufacturer)}
              />
              <span className="checkmark"></span>
              {manufacturer}
            </label>
          ))}
          {(!manufacturers || manufacturers.length === 0) && (
            <p className="no-manufacturers">Производители не найдены</p>
          )}
        </div>
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