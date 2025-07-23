// Configuración centralizada de URLs de API
export const API_CONFIG = {
  // URLs de desarrollo
  DEVELOPMENT: {
    BASE_URL: 'http://localhost:8080/api',
    SUPER_ADMIN_URL: 'http://localhost:8080/api/super-admin',
  },
  
  // URLs de producción
  PRODUCTION: {
    BASE_URL: 'https://negocio360-backend.onrender.com/api',
    SUPER_ADMIN_URL: 'https://negocio360-backend.onrender.com/api/super-admin',
  },
  
  // Función para obtener la URL base según el entorno
  getBaseUrl(): string {
    // Si estamos en desarrollo local (localhost o subdominios de localhost), usar localhost:8080
    if (window.location.hostname === 'localhost' || window.location.hostname.endsWith('.localhost')) {
      return this.DEVELOPMENT.BASE_URL;
    }
    
    // Si hay una variable de entorno configurada, usarla
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    
    // Por defecto, usar producción
    return this.PRODUCTION.BASE_URL;
  },
  
  // Función para obtener la URL de super admin según el entorno
  getSuperAdminUrl(): string {
    // Si estamos en desarrollo local (localhost o subdominios de localhost), usar localhost:8080
    if (window.location.hostname === 'localhost' || window.location.hostname.endsWith('.localhost')) {
      return this.DEVELOPMENT.SUPER_ADMIN_URL;
    }
    
    // Si hay una variable de entorno configurada, usarla
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL.replace('/api', '/api/super-admin');
    }
    
    // Por defecto, usar producción
    return this.PRODUCTION.SUPER_ADMIN_URL;
  }
};

// Log para debug
console.log('🌐 API Config - Base URL:', API_CONFIG.getBaseUrl());
console.log('🌐 API Config - Super Admin URL:', API_CONFIG.getSuperAdminUrl());
console.log('🌐 API Config - Hostname:', window.location.hostname);
console.log('🌐 API Config - Environment:', import.meta.env.MODE); 