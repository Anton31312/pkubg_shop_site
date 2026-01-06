import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchProducts, fetchCategories, fetchManufacturers, setFilters, clearCurrentProduct } from '../../store/productsSlice';
import ProductCard from '../ProductCard/ProductCard';
import ProductFilters from './ProductFilters';
import AdminToolbar from '../AdminToolbar/AdminToolbar';
import ResponsiveGrid from '../ResponsiveGrid';
import useResponsive from '../../hooks/useResponsive';
import './ProductCatalog.css';

const ProductCatalog = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, categories, manufacturers, filters, loading, error } = useSelector(state => state.products);
  const { isMobile, isTablet } = useResponsive();
  const [showFilters, setShowFilters] = useState(!isMobile);

  useEffect(() => {
    // Clear any previous product details
    dispatch(clearCurrentProduct());
    
    // Load categories and manufacturers on component mount
    dispatch(fetchCategories());
    dispatch(fetchManufacturers());
    
    // Set filters from URL params
    const urlFilters = {
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      manufacturer: searchParams.get('manufacturer') || '',
      isGlutenFree: searchParams.get('gluten_free') === 'true',
      isLowProtein: searchParams.get('low_protein') === 'true',
      minPrice: searchParams.get('min_price') || '',
      maxPrice: searchParams.get('max_price') || '',
    };
    
    dispatch(setFilters(urlFilters));
  }, [dispatch, searchParams]);

  useEffect(() => {
    // Fetch products when filters change
    const searchFilters = {
      search: filters.search || '',
      category: filters.category || '',
      manufacturer: filters.manufacturer || '',
      is_gluten_free: filters.isGlutenFree || false,
      is_low_protein: filters.isLowProtein || false,
      min_price: filters.minPrice || '',
      max_price: filters.maxPrice || '',
    };

    dispatch(fetchProducts({ 
      search: filters.search || '', 
      category: filters.category || '', 
      filters: searchFilters 
    }));
  }, [dispatch, filters]);

  const handleFilterChange = (newFilters) => {
    dispatch(setFilters(newFilters));
    
    // Update URL params
    const params = new URLSearchParams();
    Object.entries({ ...filters, ...newFilters }).forEach(([key, value]) => {
      if (value && value !== '' && value !== false) {
        const paramKey = key === 'isGlutenFree' ? 'gluten_free' : 
                        key === 'isLowProtein' ? 'low_protein' :
                        key === 'minPrice' ? 'min_price' :
                        key === 'maxPrice' ? 'max_price' : key;
        params.set(paramKey, value);
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
    <div className="product-catalog">
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
              
              <ResponsiveGrid
                columns={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
                gap="lg"
                minItemWidth="280px"
                className="products-grid"
              >
                {items.length > 0 ? (
                  items.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onUpdate={() => {
                        // Refresh products when admin makes changes
                        dispatch(fetchProducts({ 
                          search: filters.search, 
                          category: filters.category, 
                          filters: {
                            search: filters.search,
                            category: filters.category,
                            manufacturer: filters.manufacturer,
                            is_gluten_free: filters.isGlutenFree,
                            is_low_protein: filters.isLowProtein,
                            min_price: filters.minPrice,
                            max_price: filters.maxPrice,
                          }
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
              </ResponsiveGrid>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCatalog;