// Configuración centralizada de URLs de API
export const API_CONFIG = {
  // URLs de desarrollo
  DEVELOPMENT: {
    BASE_URL: 'http://localhost:8080/api',
    SUPER_ADMIN_URL: 'http://localhost:8080/api/super-admin',
  },
  
  // URLs de producción
  PRODUCTION: {
    BASE_URL: 'https://minegocio-backend-production.up.railway.app/api',
    SUPER_ADMIN_URL: 'https://minegocio-backend-production.up.railway.app/api/super-admin',
  },
  
  // Función para obtener la URL base según el entorno
  getBaseUrl(): string {
    // Si estamos en desarrollo local (localhost o subdominios de localhost), usar proxy de Vite
    if (window.location.hostname === 'localhost' || window.location.hostname.endsWith('.localhost') || window.location.hostname === '127.0.0.1') {
      return '/api'; // Usar proxy de Vite en desarrollo
    }
    
    // ✅ NUEVO: Si accedemos desde IP de red local (ej: 192.168.x.x), usar la misma IP para el backend
    if (window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.') || window.location.hostname.startsWith('172.')) {
      const port = '8080'; // Puerto del backend en desarrollo
      return `http://${window.location.hostname}:${port}/api`;
    }
    
    // Si estamos en modo desarrollo pero no en localhost, usar localhost:8080
    if (import.meta.env.MODE === 'development') {
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
    // Si estamos en desarrollo local (localhost o subdominios de localhost), usar proxy de Vite
    if (window.location.hostname === 'localhost' || window.location.hostname.endsWith('.localhost') || window.location.hostname === '127.0.0.1') {
      return '/api/super-admin'; // Usar proxy de Vite en desarrollo
    }
    
    // ✅ NUEVO: Si accedemos desde IP de red local, usar la misma IP para el backend
    if (window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.') || window.location.hostname.startsWith('172.')) {
      const port = '8080'; // Puerto del backend en desarrollo
      return `http://${window.location.hostname}:${port}/api/super-admin`;
    }
    
    // Si estamos en modo desarrollo pero no en localhost, usar localhost:8080
    if (import.meta.env.MODE === 'development') {
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
console.log('🌐 API Config - VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('🌐 API Config - Full URL:', window.location.href); 