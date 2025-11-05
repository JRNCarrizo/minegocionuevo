import { useState, useEffect, useCallback } from 'react';

export const useTheme = (userId?: number) => {
  // Función para obtener el tema desde localStorage (prioriza usuario específico, luego global)
  const getThemeFromStorage = useCallback(() => {
    // Si hay un userId, PRIORIZAR preferencia específica del usuario
    if (userId) {
      const savedTheme = localStorage.getItem(`theme_user_${userId}`);
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme === 'dark';
      }
    }
    
    // Si no hay preferencia específica del usuario, usar preferencia global
    const globalTheme = localStorage.getItem('theme');
    if (globalTheme === 'dark' || globalTheme === 'light') {
      return globalTheme === 'dark';
    }
    
    // Si no hay preferencia guardada, usar la preferencia del sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, [userId]);

  // Inicializar estado con el tema desde localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Si hay userId, leer preferencia específica del usuario primero
    if (userId) {
      const userTheme = localStorage.getItem(`theme_user_${userId}`);
      if (userTheme === 'dark' || userTheme === 'light') {
        return userTheme === 'dark';
      }
    }
    
    // Si no hay preferencia del usuario, leer preferencia global
    const globalTheme = localStorage.getItem('theme');
    if (globalTheme === 'dark' || globalTheme === 'light') {
      return globalTheme === 'dark';
    }
    
    // Fallback: preferencia del sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Sincronizar cuando cambia el userId
  useEffect(() => {
    // Si hay userId, usar preferencia específica del usuario
    if (userId) {
      const userTheme = localStorage.getItem(`theme_user_${userId}`);
      if (userTheme === 'dark' || userTheme === 'light') {
        setIsDarkMode(userTheme === 'dark');
        return;
      }
    }
    
    // Si no hay preferencia del usuario, usar preferencia global
    const globalTheme = localStorage.getItem('theme');
    if (globalTheme === 'dark' || globalTheme === 'light') {
      setIsDarkMode(globalTheme === 'dark');
      return;
    }
    
    // Si no hay ninguna preferencia, usar preferencia del sistema
    setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, [userId]);

  // Aplicar el tema al documento y guardar preferencias
  useEffect(() => {
    // Aplicar el tema al documento inmediatamente
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    
    // Si hay userId, guardar PRIMERO en preferencia específica del usuario
    if (userId) {
      localStorage.setItem(`theme_user_${userId}`, isDarkMode ? 'dark' : 'light');
    }
    
    // También guardar en preferencia global (para usuarios sin ID o como fallback)
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode, userId]);

  // Aplicar tema inmediatamente al montar el componente (evitar flash)
  // NOTA: El script en index.html ya aplicó el tema, pero este useEffect asegura sincronización
  useEffect(() => {
    // Leer directamente desde localStorage (prioriza usuario si hay userId)
    let theme = false;
    
    if (userId) {
      const userTheme = localStorage.getItem(`theme_user_${userId}`);
      if (userTheme === 'dark' || userTheme === 'light') {
        theme = userTheme === 'dark';
      }
    }
    
    // Si no hay preferencia del usuario, usar preferencia global
    if (!theme && userId) {
      const globalTheme = localStorage.getItem('theme');
      if (globalTheme === 'dark' || globalTheme === 'light') {
        theme = globalTheme === 'dark';
      }
    }
    
    // Si no hay userId o no hay preferencias, leer global
    if (!theme) {
      const globalTheme = localStorage.getItem('theme');
      if (globalTheme === 'dark' || globalTheme === 'light') {
        theme = globalTheme === 'dark';
      } else {
        // Si no hay preferencia guardada, usar preferencia del sistema
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    }
    
    // Sincronizar estado con localStorage (el script en HTML ya aplicó las clases)
    setIsDarkMode(theme);
  }, []); // Solo al montar - eslint-disable-line react-hooks/exhaustive-deps

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      // Guardar inmediatamente en localStorage
      // Si hay userId, guardar en preferencia del usuario (prioridad)
      if (userId) {
        localStorage.setItem(`theme_user_${userId}`, newValue ? 'dark' : 'light');
      }
      // También guardar en global (para usuarios sin ID)
      localStorage.setItem('theme', newValue ? 'dark' : 'light');
      return newValue;
    });
  };

  return {
    isDarkMode,
    toggleTheme
  };
};
