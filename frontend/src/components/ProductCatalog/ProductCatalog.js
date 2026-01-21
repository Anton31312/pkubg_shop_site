import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchProducts, fetchCategories, fetchManufacturers, setFilters, clearCurrentProduct } from '../../store/productsSlice';
import ProductCard from '../ProductCard/ProductCard';
import ProductFilters from './ProductFilters';
import AdminToolbar from '../AdminToolbar/AdminToolbar';
import useResponsive from '../../hooks/useResponsive';
import useRouteRefresh from '../../hooks/useRouteRefresh';
import './ProductCatalog.css';

const ProductCatalog = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, categories, manufacturers, filters, loading, error } = useSelector(state => state.products);
  const { isMobile } = useResponsive();
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [isInitialized, setIsInitialized] = useState(false);

  // Используем хук для автоматического обновления при смене роута
  const refreshCallback = useCallback(() => {
    console.log('ProductCatalog: Refreshing due to route change');
    dispatch(clearCurrentProduct());
    dispatch(fetchCategories());
    dispatch(fetchManufacturers());
  }, [dispatch]);

  const refreshKey = useRouteRefresh(refreshCallback);

  useEffect(() => {
    // Clear any previous product details
    dispatch(clearCurrentProduct());
    
    // Load categories and manufacturers on component mount
    dispatch(fetchCategories());
    dispatch(fetchManufacturers());
    
    // Set filters from URL params
    const dietaryType = searchParams.get('dietary_type');
    const manufacturersParam = searchParams.get('manufacturers');
    const categoriesParam = searchParams.get('categories');
    const urlFilters = {
      search: searchParams.get('search') || '',
      categories: categoriesParam ? categoriesParam.split(',').map(Number) : [],
      manufacturers: manufacturersParam ? manufacturersParam.split(',') : [],
      isGlutenFree: searchParams.get('gluten_free') === 'true' || dietaryType === 'gluten_free',
      isLowProtein: searchParams.get('low_protein') === 'true' || dietaryType === 'low_protein',
      minPrice: searchParams.get('min_price') || '',
      maxPrice: searchParams.get('max_price') || '',
    };
    
    console.log('Setting filters from URL:', urlFilters);
    dispatch(setFilters(urlFilters));
    setIsInitialized(true);
  }, [dispatch, searchParams, refreshKey]); // Добавляем refreshKey как зависимость

  useEffect(() => {
    // Only fetch products after initialization
    if (!isInitialized) return;
    
    // Fetch products when filters change
    console.log('Current filters:', filters);
    
    const searchFilters = {};
    
    if (filters.search) searchFilters.search = filters.search;
    if (filters.categories && filters.categories.length > 0) {
      searchFilters.category = filters.categories.join(',');
    }
    if (filters.manufacturers && filters.manufacturers.length > 0) {
      searchFilters.manufacturer = filters.manufacturers.join(',');
    }
    if (filters.isGlutenFree === true) searchFilters.is_gluten_free = true;
    if (filters.isLowProtein === true) searchFilters.is_low_protein = true;
    if (filters.minPrice) searchFilters.min_price = filters.minPrice;
    if (filters.maxPrice) searchFilters.max_price = filters.maxPrice;

    console.log('Search filters being sent:', searchFilters);

    dispatch(fetchProducts({ 
      search: filters.search || '', 
      category: '', 
      filters: searchFilters 
    }));
  }, [dispatch, filters, isInitialized]);

  const handleFilterChange = (newFilters) => {
    dispatch(setFilters(newFilters));
    
    // Update URL params
    const params = new URLSearchParams();
    const updatedFilters = { ...filters, ...newFilters };
    
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value && value !== '' && value !== false) {
        if (key === 'categories' && Array.isArray(value) && value.length > 0) {
          params.set('categories', value.join(','));
        } else if (key === 'manufacturers' && Array.isArray(value) && value.length > 0) {
          params.set('manufacturers', value.join(','));
        } else if (key === 'isGlutenFree') {
          params.set('gluten_free', value);
        } else if (key === 'isLowProtein') {
          params.set('low_protein', value);
        } else if (key === 'minPrice') {
          params.set('min_price', value);
        } else if (key === 'maxPrice') {
          params.set('max_price', value);
        } else if (key !== 'categories' && key !== 'manufacturers') {
          params.set(key, value);
        }
      }
    });
    setSearchParams(params);
  };

  const handleSearchChange = (searchTerm) => {
    handleFilterChange({ search: searchTerm });
  };

  if (error) {
    return (
      <div className="catalog-error">
        <h3>Ошибка загрузки товаров</h3>
        <p>{error.message || 'Попробуйте обновить страницу'}</p>
      </div>
    );
  }

  return (
    <div className="product-catalog" key={refreshKey}>
      {/* Admin Toolbar - показывается только для администраторов */}
      <AdminToolbar />
      
      <div className="catalog-header">
        <h2>Каталог товаров</h2>
        <div className="catalog-controls">
          <div className="search-section">
            <input
              type="text"
              placeholder="Поиск товаров..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="catalog-search"
            />
          </div>
          <button 
            className="filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            🔧 Фильтры {showFilters ? '▲' : '▼'}
          </button>
        </div>
      </div>

      <div className="catalog-content">
        <ProductFilters
          categories={categories}
          manufacturers={manufacturers}
          filters={filters}
          onFilterChange={handleFilterChange}
          isVisible={showFilters}
        />

        <div className="products-section">
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Загрузка товаров...</p>
            </div>
          ) : (
            <>
              <div className="products-info">
                <span>Найдено товаров: {items.length}</span>
              </div>
              
              <div className="products-grid">
                {items.length > 0 ? (
                  items.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onUpdate={() => {
                        // Refresh products when admin makes changes
                        const refreshFilters = {
                          search: filters.search,
                          is_gluten_free: filters.isGlutenFree,
                          is_low_protein: filters.isLowProtein,
                          min_price: filters.minPrice,
                          max_price: filters.maxPrice,
                        };
                        
                        if (filters.categories && filters.categories.length > 0) {
                          refreshFilters.category = filters.categories.join(',');
                        }
                        
                        if (filters.manufacturers && filters.manufacturers.length > 0) {
                          refreshFilters.manufacturer = filters.manufacturers.join(',');
                        }
                        
                        dispatch(fetchProducts({ 
                          search: filters.search, 
                          category: '', 
                          filters: refreshFilters
                        }));
                      }}
                    />
                  ))
                ) : (
                  <div className="no-products">
                    <h3>Товары не найдены</h3>
                    <p>Попробуйте изменить параметры поиска или фильтры</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCatalog;