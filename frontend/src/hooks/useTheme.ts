import { useState, useEffect } from 'react';

export const useTheme = (userId?: number) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Si hay un userId, usar preferencia específica del usuario
    if (userId) {
      const savedTheme = localStorage.getItem(`theme_user_${userId}`);
      if (savedTheme) {
        return savedTheme === 'dark';
      }
    }
    
    // Fallback: verificar preferencia global
    const globalTheme = localStorage.getItem('theme');
    if (globalTheme) {
      return globalTheme === 'dark';
    }
    
    // Si no hay preferencia guardada, usar la preferencia del sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Aplicar el tema al documento
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    
    // Guardar la preferencia específica del usuario si hay userId
    if (userId) {
      localStorage.setItem(`theme_user_${userId}`, isDarkMode ? 'dark' : 'light');
    } else {
      // Fallback: guardar globalmente
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode, userId]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return {
    isDarkMode,
    toggleTheme
  };
};
