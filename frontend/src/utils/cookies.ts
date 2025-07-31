// Utilidades para manejar cookies que se comparten entre subdominios

export const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  
  // Configurar para que se comparta entre subdominios
  const domain = window.location.hostname.includes('localhost') 
    ? 'localhost' 
    : '.negocio360.org'; // El punto al inicio permite compartir entre subdominios
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;domain=${domain}`;
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
  const domain = window.location.hostname.includes('localhost') 
    ? 'localhost' 
    : '.negocio360.org';
  
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${domain}`;
}; 