// Performance optimization utilities

/**
 * Debounce function to limit the rate of function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute immediately on first call
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

/**
 * Throttle function to limit function execution frequency
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Lazy load images with intersection observer
 * @param {string} selector - CSS selector for images to lazy load
 * @param {Object} options - Intersection observer options
 */
export const lazyLoadImages = (selector = 'img[data-src]', options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        img.classList.add('fade-in');
        observer.unobserve(img);
      }
    });
  }, defaultOptions);

  const images = document.querySelectorAll(selector);
  images.forEach(img => imageObserver.observe(img));

  return imageObserver;
};

/**
 * Preload critical resources
 * @param {Array} resources - Array of resource URLs to preload
 * @param {string} type - Resource type (image, script, style, etc.)
 */
export const preloadResources = (resources, type = 'image') => {
  resources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    link.as = type;
    document.head.appendChild(link);
  });
};

/**
 * Measure and log performance metrics
 * @param {string} name - Performance mark name
 * @param {Function} callback - Function to measure
 * @returns {Promise} Result of the callback function
 */
export const measurePerformance = async (name, callback) => {
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  const measureName = `${name}-duration`;

  performance.mark(startMark);
  
  try {
    const result = await callback();
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);
    
    const measure = performance.getEntriesByName(measureName)[0];
    console.log(`${name} took ${measure.duration.toFixed(2)}ms`);
    
    return result;
  } catch (error) {
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);
    throw error;
  }
};

/**
 * Check if user prefers reduced motion
 * @returns {boolean} True if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get device performance tier based on hardware capabilities
 * @returns {string} Performance tier: 'high', 'medium', or 'low'
 */
export const getPerformanceTier = () => {
  // Check for hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 1;
  
  // Check for device memory (if available)
  const memory = navigator.deviceMemory || 1;
  
  // Check for connection speed
  const connection = navigator.connection;
  const effectiveType = connection?.effectiveType || '4g';
  
  // Simple heuristic for performance tier
  if (cores >= 8 && memory >= 8 && effectiveType === '4g') {
    return 'high';
  } else if (cores >= 4 && memory >= 4) {
    return 'medium';
  } else {
    return 'low';
  }
};

/**
 * Optimize images based on device capabilities
 * @param {string} baseUrl - Base image URL
 * @param {Object} options - Optimization options
 * @returns {string} Optimized image URL
 */
export const optimizeImageUrl = (baseUrl, options = {}) => {
  const {
    width = 800,
    height = 600,
    quality = 80,
    format = 'webp'
  } = options;
  
  const performanceTier = getPerformanceTier();
  
  // Adjust quality based on performance tier
  let adjustedQuality = quality;
  if (performanceTier === 'low') {
    adjustedQuality = Math.max(50, quality - 20);
  } else if (performanceTier === 'medium') {
    adjustedQuality = Math.max(60, quality - 10);
  }
  
  // Check for WebP support
  const supportsWebP = document.createElement('canvas')
    .toDataURL('image/webp')
    .indexOf('data:image/webp') === 0;
  
  const finalFormat = supportsWebP ? format : 'jpg';
  
  // Return optimized URL (this would typically integrate with an image service)
  return `${baseUrl}?w=${width}&h=${height}&q=${adjustedQuality}&f=${finalFormat}`;
};

/**
 * Batch DOM updates to avoid layout thrashing
 * @param {Function} callback - Function containing DOM updates
 */
export const batchDOMUpdates = (callback) => {
  requestAnimationFrame(() => {
    callback();
  });
};

/**
 * Virtual scrolling helper for large lists
 * @param {Array} items - Array of items to render
 * @param {number} itemHeight - Height of each item
 * @param {number} containerHeight - Height of the container
 * @param {number} scrollTop - Current scroll position
 * @returns {Object} Visible items and positioning info
 */
export const calculateVirtualScrolling = (items, itemHeight, containerHeight, scrollTop) => {
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(startIndex, endIndex).map((item, index) => ({
    ...item,
    index: startIndex + index,
    top: (startIndex + index) * itemHeight
  }));
  
  return {
    visibleItems,
    totalHeight,
    startIndex,
    endIndex
  };
};

/**
 * Web Vitals measurement utilities
 */
export const measureWebVitals = () => {
  // Measure Largest Contentful Paint (LCP)
  const measureLCP = () => {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });
  };

  // Measure First Input Delay (FID)
  const measureFID = () => {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        console.log('FID:', entry.processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });
  };

  // Measure Cumulative Layout Shift (CLS)
  const measureCLS = () => {
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      console.log('CLS:', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  };

  // Only measure if the APIs are available
  if ('PerformanceObserver' in window) {
    measureLCP();
    measureFID();
    measureCLS();
  }
};

/**
 * Resource hints for better loading performance
 */
export const addResourceHints = () => {
  // DNS prefetch for external domains
  const dnsPrefetch = (domain) => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  };

  // Preconnect to critical origins
  const preconnect = (origin) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    document.head.appendChild(link);
  };

  // Add common resource hints
  dnsPrefetch('//fonts.googleapis.com');
  dnsPrefetch('//fonts.gstatic.com');
  preconnect('//api.example.com');
};

// Initialize performance optimizations
export const initPerformanceOptimizations = () => {
  // Add resource hints
  addResourceHints();
  
  // Start measuring web vitals
  measureWebVitals();
  
  // Initialize lazy loading for images
  lazyLoadImages();
  
  // Log performance tier
  console.log('Device performance tier:', getPerformanceTier());
};