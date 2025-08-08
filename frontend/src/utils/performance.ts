// ===========================================
// UTILIDADES DE OPTIMIZACIÓN DE RENDIMIENTO
// ===========================================

/**
 * Lazy loading para componentes pesados
 */
export const lazyLoad = (importFunc: () => Promise<any>, fallback?: React.ComponentType) => {
  const LazyComponent = React.lazy(importFunc);
  
  return (props: any) => (
    <React.Suspense fallback={fallback || <div>Cargando...</div>}>
      <LazyComponent {...props} />
    </React.Suspense>
  );
};

/**
 * Debounce para funciones que se ejecutan frecuentemente
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle para funciones que se ejecutan frecuentemente
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Memoización simple para funciones costosas
 */
export const memoize = <T extends (...args: any[]) => any>(func: T): T => {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

/**
 * Optimización de imágenes
 */
export const optimizeImage = (url: string, width: number = 800): string => {
  if (!url) return '';
  
  // Si es una URL de Cloudinary, optimizar
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
  }
  
  return url;
};

/**
 * Preload de recursos críticos
 */
export const preloadResource = (href: string, as: string = 'fetch') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
};

/**
 * Lazy loading de imágenes
 */
export const lazyLoadImage = (src: string, alt: string, className?: string) => {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
};

/**
 * Optimización de listas grandes
 */
export const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

/**
 * Virtualización para listas muy grandes
 */
export const useVirtualization = (items: any[], itemHeight: number, containerHeight: number) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleStartIndex = Math.floor(scrollTop / itemHeight);
  const visibleEndIndex = Math.min(
    visibleStartIndex + Math.ceil(containerHeight / itemHeight),
    items.length
  );
  
  const visibleItems = items.slice(visibleStartIndex, visibleEndIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStartIndex * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent) => setScrollTop(e.currentTarget.scrollTop)
  };
};

/**
 * Optimización de re-renders con React.memo
 */
export const withMemo = <P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) => {
  return React.memo(Component, propsAreEqual);
};

/**
 * Hook para optimizar el rendimiento de componentes
 */
export const usePerformanceOptimization = () => {
  const [isVisible, setIsVisible] = React.useState(false);
  const elementRef = React.useRef<HTMLElement>(null);
  
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return { isVisible, elementRef };
};

/**
 * Optimización de formularios
 */
export const useFormOptimization = () => {
  const [isDirty, setIsDirty] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const handleChange = React.useCallback(() => {
    setIsDirty(true);
  }, []);
  
  const handleSubmit = React.useCallback(async (submitFn: () => Promise<void>) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await submitFn();
    } finally {
      setIsSubmitting(false);
      setIsDirty(false);
    }
  }, [isSubmitting]);
  
  return {
    isDirty,
    isSubmitting,
    handleChange,
    handleSubmit
  };
};

/**
 * Configuración de Service Worker para cache
 */
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered: ', registration);
    } catch (registrationError) {
      console.log('SW registration failed: ', registrationError);
    }
  }
};

/**
 * Optimización de bundle splitting
 */
export const loadComponent = (componentPath: string) => {
  return React.lazy(() => import(componentPath));
};

/**
 * Configuración de performance monitoring
 */
export const initPerformanceMonitoring = () => {
  if (typeof window !== 'undefined') {
    // Monitor de Core Web Vitals
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log(`${entry.name}: ${entry.startTime}ms`);
        }
      });
      
      observer.observe({ entryTypes: ['navigation', 'resource', 'paint'] });
    }
  }
};

export default {
  lazyLoad,
  debounce,
  throttle,
  memoize,
  optimizeImage,
  preloadResource,
  lazyLoadImage,
  chunkArray,
  useVirtualization,
  withMemo,
  usePerformanceOptimization,
  useFormOptimization,
  registerServiceWorker,
  loadComponent,
  initPerformanceMonitoring
};
