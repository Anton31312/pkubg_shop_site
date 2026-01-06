// Responsive utility functions

export const breakpoints = {
  xs: 320,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1200,
  '2xl': 1400,
  '3xl': 1600
};

export const getScreenSize = (width = window.innerWidth) => {
  if (width < breakpoints.sm) return 'xs';
  if (width < breakpoints.md) return 'sm';
  if (width < breakpoints.lg) return 'md';
  if (width < breakpoints.xl) return 'lg';
  if (width < breakpoints['2xl']) return 'xl';
  return '2xl';
};

export const isMobile = (width = window.innerWidth) => {
  return width < breakpoints.md;
};

export const isTablet = (width = window.innerWidth) => {
  return width >= breakpoints.md && width < breakpoints.lg;
};

export const isDesktop = (width = window.innerWidth) => {
  return width >= breakpoints.lg;
};

export const getOrientation = (width = window.innerWidth, height = window.innerHeight) => {
  return width > height ? 'landscape' : 'portrait';
};

// Generate responsive classes
export const generateResponsiveClasses = (baseClass, modifiers = {}) => {
  const classes = [baseClass];
  
  Object.entries(modifiers).forEach(([breakpoint, modifier]) => {
    if (modifier) {
      classes.push(`${baseClass}-${breakpoint}-${modifier}`);
    }
  });
  
  return classes.join(' ');
};

// Media query helpers
export const mediaQueries = {
  xs: `(max-width: ${breakpoints.sm - 1}px)`,
  sm: `(min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.md - 1}px)`,
  md: `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  lg: `(min-width: ${breakpoints.lg}px) and (max-width: ${breakpoints.xl - 1}px)`,
  xl: `(min-width: ${breakpoints.xl}px) and (max-width: ${breakpoints['2xl'] - 1}px)`,
  '2xl': `(min-width: ${breakpoints['2xl']}px)`,
  
  // Utility queries
  mobile: `(max-width: ${breakpoints.md - 1}px)`,
  tablet: `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  desktop: `(min-width: ${breakpoints.lg}px)`,
  
  // Orientation queries
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  
  // Special queries
  touch: '(hover: none) and (pointer: coarse)',
  mouse: '(hover: hover) and (pointer: fine)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
  darkMode: '(prefers-color-scheme: dark)',
  highContrast: '(prefers-contrast: high)'
};

// Check if media query matches
export const matchesMediaQuery = (query) => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(query).matches;
};

// Get container width based on screen size
export const getContainerWidth = (screenSize) => {
  const containerWidths = {
    xs: '100%',
    sm: '540px',
    md: '720px',
    lg: '960px',
    xl: '1140px',
    '2xl': '1320px'
  };
  
  return containerWidths[screenSize] || containerWidths.xl;
};

// Calculate responsive font size
export const getResponsiveFontSize = (baseSize, screenSize) => {
  const scaleFactor = {
    xs: 0.8,
    sm: 0.9,
    md: 1,
    lg: 1,
    xl: 1,
    '2xl': 1.1
  };
  
  return `${baseSize * (scaleFactor[screenSize] || 1)}rem`;
};

// Calculate responsive spacing
export const getResponsiveSpacing = (baseSpacing, screenSize) => {
  const spacingScale = {
    xs: 0.75,
    sm: 0.875,
    md: 1,
    lg: 1,
    xl: 1,
    '2xl': 1.125
  };
  
  return `${baseSpacing * (spacingScale[screenSize] || 1)}rem`;
};

// Responsive grid columns calculator
export const getResponsiveColumns = (screenSize, maxColumns = 4) => {
  const columnMap = {
    xs: 1,
    sm: Math.min(2, maxColumns),
    md: Math.min(3, maxColumns),
    lg: Math.min(4, maxColumns),
    xl: maxColumns,
    '2xl': maxColumns
  };
  
  return columnMap[screenSize] || maxColumns;
};

// Touch-friendly size adjustments
export const getTouchFriendlySize = (baseSize, isTouchDevice = false) => {
  if (!isTouchDevice) return baseSize;
  
  const minTouchSize = 44; // 44px minimum for touch targets
  const size = parseInt(baseSize);
  
  return Math.max(size, minTouchSize) + 'px';
};

// Viewport units with fallback
export const getViewportUnit = (value, unit = 'vw', fallback = '100%') => {
  if (typeof window === 'undefined') return fallback;
  
  try {
    // Test if viewport units are supported
    const testElement = document.createElement('div');
    testElement.style.width = `1${unit}`;
    
    if (testElement.style.width === `1${unit}`) {
      return `${value}${unit}`;
    }
  } catch (e) {
    // Fallback for unsupported browsers
  }
  
  return fallback;
};

// Safe area insets for devices with notches
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined') return { top: 0, right: 0, bottom: 0, left: 0 };
  
  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)')) || 0,
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)')) || 0,
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)')) || 0
  };
};

// Responsive image srcSet generator
export const generateResponsiveSrcSet = (baseSrc, sizes = [320, 480, 768, 1024, 1200]) => {
  const extension = baseSrc.split('.').pop();
  const baseName = baseSrc.replace(`.${extension}`, '');
  
  return sizes
    .map(size => `${baseName}-${size}w.${extension} ${size}w`)
    .join(', ');
};

// Responsive sizes attribute generator
export const generateResponsiveSizes = (breakpointSizes = {}) => {
  const defaultSizes = {
    xs: '100vw',
    sm: '100vw',
    md: '50vw',
    lg: '33vw',
    xl: '25vw'
  };
  
  const sizes = { ...defaultSizes, ...breakpointSizes };
  
  return Object.entries(sizes)
    .map(([breakpoint, size]) => {
      const minWidth = breakpoints[breakpoint];
      return minWidth ? `(min-width: ${minWidth}px) ${size}` : size;
    })
    .join(', ');
};

export default {
  breakpoints,
  getScreenSize,
  isMobile,
  isTablet,
  isDesktop,
  getOrientation,
  generateResponsiveClasses,
  mediaQueries,
  matchesMediaQuery,
  getContainerWidth,
  getResponsiveFontSize,
  getResponsiveSpacing,
  getResponsiveColumns,
  getTouchFriendlySize,
  getViewportUnit,
  getSafeAreaInsets,
  generateResponsiveSrcSet,
  generateResponsiveSizes
};