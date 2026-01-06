import React from 'react';
import './Loading.css';

const Loading = ({ 
  size = 'medium', 
  text = 'Загрузка...', 
  overlay = false,
  fullScreen = false 
}) => {
  const sizeClass = `loading-spinner--${size}`;
  const containerClass = `loading-container ${overlay ? 'loading-container--overlay' : ''} ${fullScreen ? 'loading-container--fullscreen' : ''}`;

  return (
    <div className={containerClass}>
      <div className="loading-content">
        <div className={`loading-spinner ${sizeClass}`}>
          <div className="loading-spinner-inner"></div>
        </div>
        {text && <p className="loading-text">{text}</p>}
      </div>
    </div>
  );
};

export default Loading;