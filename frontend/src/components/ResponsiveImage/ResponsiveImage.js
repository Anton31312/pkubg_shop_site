import React, { useState } from 'react';
import { generateResponsiveSrcSet, generateResponsiveSizes } from '../../utils/responsive';
import './ResponsiveImage.css';

const ResponsiveImage = ({
  src,
  alt,
  className = '',
  sizes,
  srcSet,
  loading = 'lazy',
  aspectRatio,
  objectFit = 'cover',
  placeholder,
  onLoad,
  onError,
  ...props
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleLoad = (e) => {
    setImageLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setImageError(true);
    if (onError) onError(e);
  };

  const imageClasses = [
    'responsive-image',
    className,
    imageLoaded ? 'loaded' : 'loading',
    imageError ? 'error' : ''
  ].filter(Boolean).join(' ');

  const imageStyle = {
    aspectRatio: aspectRatio,
    objectFit: objectFit,
    ...props.style
  };

  // Generate responsive attributes if not provided
  const responsiveSrcSet = srcSet || (src ? generateResponsiveSrcSet(src) : undefined);
  const responsiveSizes = sizes || generateResponsiveSizes();

  if (imageError && placeholder) {
    return (
      <div className={`${imageClasses} placeholder`} style={imageStyle}>
        {typeof placeholder === 'string' ? (
          <span className="placeholder-text">{placeholder}</span>
        ) : (
          placeholder
        )}
      </div>
    );
  }

  return (
    <div className="responsive-image-container" style={{ aspectRatio }}>
      {!imageLoaded && !imageError && (
        <div className="image-skeleton">
          <div className="skeleton-shimmer"></div>
        </div>
      )}
      
      <img
        src={src}
        srcSet={responsiveSrcSet}
        sizes={responsiveSizes}
        alt={alt}
        className={imageClasses}
        style={imageStyle}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
};

export default ResponsiveImage;