import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import './ProductImageUpload.css';

const ProductImageUpload = ({ product, onComplete, onCancel }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (product?.images) {
      setImages(product.images);
    }
  }, [product]);

  // Removed unused fetchProductImages function - images are loaded from props

  const handleFileSelect = async (files) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      if (file.type.startsWith('image/')) {
        await uploadImage(file);
      }
    }
  };

  const uploadImage = async (file) => {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('alt_text', `Изображение для ${product.name}`);
    formData.append('is_primary', images.length === 0 ? 'true' : 'false'); // Convert boolean to string

    console.log('Uploading image:', file.name);
    console.log('Product slug:', product.slug);
    console.log('Is primary:', images.length === 0);

    try {
      const response = await api.post(`/products/products/${product.slug}/upload_image/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Upload response:', response.data);
      console.log('Image URL:', response.data.image);
      
      setImages(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.error || 'Ошибка загрузки изображения');
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      // Update all images to set the selected one as primary
      const updatedImages = images.map(img => ({
        ...img,
        is_primary: img.id === imageId
      }));
      
      // Update on server
      await api.patch(`/products/images/${imageId}/`, { is_primary: true });
      
      // Update other images to not be primary
      const otherImages = images.filter(img => img.id !== imageId && img.is_primary);
      for (const img of otherImages) {
        await api.patch(`/products/images/${img.id}/`, { is_primary: false });
      }
      
      setImages(updatedImages);
    } catch (error) {
      setError('Ошибка установки основного изображения');
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (window.confirm('Удалить это изображение?')) {
      try {
        await api.delete(`/products/images/${imageId}/`);
        setImages(prev => prev.filter(img => img.id !== imageId));
      } catch (error) {
        setError('Ошибка удаления изображения');
      }
    }
  };

  const handleUpdateAltText = async (imageId, altText) => {
    try {
      await api.patch(`/products/images/${imageId}/`, { alt_text: altText });
      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, alt_text: altText } : img
      ));
    } catch (error) {
      setError('Ошибка обновления описания');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  return (
    <div className="image-upload-overlay">
      <div className="image-upload-modal">
        <div className="modal-header">
          <h2>Управление изображениями</h2>
          <p className="product-name">{product.name}</p>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className="upload-section">
          <div 
            className={`upload-area ${dragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="upload-content">
              <div className="upload-icon">📷</div>
              <p>Перетащите изображения сюда или</p>
              <label className="upload-btn">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  style={{ display: 'none' }}
                />
                Выберите файлы
              </label>
            </div>
            {uploading && (
              <div className="upload-progress">
                <div className="loading-spinner"></div>
                <p>Загрузка изображения...</p>
              </div>
            )}
          </div>
        </div>

        <div className="images-section">
          <h3>Изображения товара ({images.length})</h3>
          
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Загрузка изображений...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="empty-images">
              <p>У товара пока нет изображений</p>
            </div>
          ) : (
            <div className="images-grid">
              {images.map(image => (
                <div key={image.id} className="image-item">
                  <div className="image-container">
                    <img 
                      src={image.image} 
                      alt={image.alt_text}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="image-placeholder" style={{ display: 'none' }}>
                      Ошибка загрузки
                    </div>
                    
                    {image.is_primary && (
                      <div className="primary-badge">Основное</div>
                    )}
                    
                    <div className="image-overlay">
                      <div className="image-actions">
                        {!image.is_primary && (
                          <button
                            className="action-btn primary-btn"
                            onClick={() => handleSetPrimary(image.id)}
                            title="Сделать основным"
                          >
                            ⭐
                          </button>
                        )}
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteImage(image.id)}
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="image-info">
                    <input
                      type="text"
                      value={image.alt_text}
                      onChange={(e) => {
                        const newAltText = e.target.value;
                        setImages(prev => prev.map(img => 
                          img.id === image.id ? { ...img, alt_text: newAltText } : img
                        ));
                      }}
                      onBlur={(e) => handleUpdateAltText(image.id, e.target.value)}
                      placeholder="Описание изображения"
                      className="alt-text-input"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            Закрыть
          </button>
          <button className="btn btn-primary" onClick={onComplete}>
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductImageUpload;