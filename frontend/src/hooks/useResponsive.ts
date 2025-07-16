import { useState, useEffect } from 'react';

// Definir los breakpoints
export const breakpoints = {
  xs: 480,
  sm: 768,
  md: 1024,
  lg: 1200,
  xl: 1400,
} as const;

export type Breakpoint = keyof typeof breakpoints;

// Hook para obtener el breakpoint actual
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('lg');
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      setWidth(currentWidth);

      if (currentWidth < breakpoints.xs) {
        setBreakpoint('xs');
      } else if (currentWidth < breakpoints.sm) {
        setBreakpoint('sm');
      } else if (currentWidth < breakpoints.md) {
        setBreakpoint('md');
      } else if (currentWidth < breakpoints.lg) {
        setBreakpoint('lg');
      } else {
        setBreakpoint('xl');
      }
    };

    // Establecer el breakpoint inicial
    handleResize();

    // Agregar event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { breakpoint, width };
};

// Hook para verificar si estamos en un breakpoint específico o menor
export const useIsBreakpoint = (targetBreakpoint: Breakpoint) => {
  const { breakpoint } = useBreakpoint();
  const targetWidth = breakpoints[targetBreakpoint];
  const currentWidth = breakpoints[breakpoint];

  return currentWidth <= targetWidth;
};

// Hook para verificar si estamos en un breakpoint específico o mayor
export const useIsBreakpointUp = (targetBreakpoint: Breakpoint) => {
  const { breakpoint } = useBreakpoint();
  const targetWidth = breakpoints[targetBreakpoint];
  const currentWidth = breakpoints[breakpoint];

  return currentWidth >= targetWidth;
};

// Hook para obtener el tamaño de pantalla
export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState({
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setScreenSize({
        width,
        height,
        isMobile: width < breakpoints.sm,
        isTablet: width >= breakpoints.sm && width < breakpoints.lg,
        isDesktop: width >= breakpoints.lg,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
};

// Hook para orientación del dispositivo
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
};

// Hook para detectar si el dispositivo tiene touch
export const useIsTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouch;
};

// Hook para detectar si el usuario prefiere movimiento reducido
export const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// Hook para detectar si el dispositivo está en modo oscuro
export const usePrefersDarkMode = () => {
  const [prefersDark, setPrefersDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setPrefersDark(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersDark;
};

// Utilidades para obtener clases CSS responsivas
export const getResponsiveClasses = (breakpoint: Breakpoint) => {
  const classes = {
    container: 'container',
    grid: `grid grid-${breakpoint === 'xs' ? '1' : breakpoint === 'sm' ? '2' : breakpoint === 'md' ? '3' : '4'}`,
    text: 'text-responsive',
    button: 'btn-responsive',
    card: 'card-responsive',
  };

  return classes;
};

// Hook principal que combina toda la información de responsividad
export const useResponsive = () => {
  const breakpoint = useBreakpoint();
  const screenSize = useScreenSize();
  const orientation = useOrientation();
  const isTouch = useIsTouchDevice();
  const prefersReducedMotion = usePrefersReducedMotion();
  const prefersDark = usePrefersDarkMode();

  return {
    breakpoint: breakpoint.breakpoint,
    width: breakpoint.width,
    screenSize,
    orientation,
    isTouch,
    prefersReducedMotion,
    prefersDark,
    isMobile: screenSize.isMobile,
    isTablet: screenSize.isTablet,
    isDesktop: screenSize.isDesktop,
    classes: getResponsiveClasses(breakpoint.breakpoint),
  };
}; 