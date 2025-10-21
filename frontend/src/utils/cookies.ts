// Utilidades para manejar cookies que se comparten entre subdominios

export const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  
  // Configurar para que se comparta entre subdominios
  let domain = '';
  const hostname = window.location.hostname;
  
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    // En desarrollo, no usar dominio para localhost
    domain = '';
  } else if (hostname.includes('negocio360.org')) {
    // En producción, usar el dominio principal con punto
    domain = '.negocio360.org';
  } else {
    // Para otros dominios, extraer el dominio base
    const parts = hostname.split('.');
    if (parts.length > 1) {
      domain = '.' + parts.slice(-2).join('.');
    }
  }
  
  const cookieString = domain 
    ? `${name}=${value};expires=${expires.toUTCString()};path=/;domain=${domain};SameSite=Lax`
    : `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  
  console.log('Setting cookie:', cookieString);
  document.cookie = cookieString;
};

export const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  
  return null;
};

export const deleteCookie = (name: string) => {
  const hostname = window.location.hostname;
  let domain = '';
  
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    domain = '';
  } else if (hostname.includes('negocio360.org')) {
    domain = '.negocio360.org';
  } else {
    const parts = hostname.split('.');
    if (parts.length > 1) {
      domain = '.' + parts.slice(-2).join('.');
    }
  }
  
  // Limpiar cookie con dominio específico
  if (domain) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${domain}`;
  }
  
  // También limpiar cookie sin dominio (por si acaso)
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
}; 