import { useState, useEffect } from 'react';

const useResponsive = () => {
  const [screenInfo, setScreenInfo] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    orientation: 'portrait',
    screenSize: 'xl'
  });

  useEffect(() => {
    const updateScreenInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      let screenSize = 'xl';
      let isMobile = false;
      let isTablet = false;
      let isDesktop = true;
      
      if (width < 480) {
        screenSize = 'xs';
        isMobile = true;
        isTablet = false;
        isDesktop = false;
      } else if (width < 768) {
        screenSize = 'sm';
        isMobile = true;
        isTablet = false;
        isDesktop = false;
      } else if (width < 1024) {
        screenSize = 'md';
        isMobile = false;
        isTablet = true;
        isDesktop = false;
      } else if (width < 1200) {
        screenSize = 'lg';
        isMobile = false;
        isTablet = false;
        isDesktop = true;
      } else {
        screenSize = 'xl';
        isMobile = false;
        isTablet = false;
        isDesktop = true;
      }
      
      const orientation = width > height ? 'landscape' : 'portrait';
      
      setScreenInfo({
        width,
        height,
        isMobile,
        isTablet,
        isDesktop,
        orientation,
        screenSize
      });
    };

    updateScreenInfo();
    
    const handleResize = () => {
      // Debounce resize events
      clearTimeout(window.resizeTimeout);
      window.resizeTimeout = setTimeout(updateScreenInfo, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      // Delay to ensure orientation change is complete
      setTimeout(updateScreenInfo, 100);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', updateScreenInfo);
      clearTimeout(window.resizeTimeout);
    };
  }, []);

  return screenInfo;
};

export default useResponsive;