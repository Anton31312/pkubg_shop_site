import React, { useState, useEffect } from 'react';
import './ResponsiveLayout.css';

const ResponsiveLayout = ({ children, className = '', ...props }) => {
  const [screenSize, setScreenSize] = useState('desktop');
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    const updateScreenInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Determine screen size
      if (width < 480) {
        setScreenSize('xs');
      } else if (width < 768) {
        setScreenSize('sm');
      } else if (width < 1024) {
        setScreenSize('md');
      } else if (width < 1200) {
        setScreenSize('lg');
      } else {
        setScreenSize('xl');
      }
      
      // Determine orientation
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    updateScreenInfo();
    window.addEventListener('resize', updateScreenInfo);
    window.addEventListener('orientationchange', updateScreenInfo);

    return () => {
      window.removeEventListener('resize', updateScreenInfo);
      window.removeEventListener('orientationchange', updateScreenInfo);
    };
  }, []);

  const layoutClasses = [
    'responsive-layout',
    `screen-${screenSize}`,
    `orientation-${orientation}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={layoutClasses} {...props}>
      {children}
    </div>
  );
};

export default ResponsiveLayout;