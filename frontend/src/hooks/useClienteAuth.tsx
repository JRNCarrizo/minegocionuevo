import { useState, useEffect } from 'react';
import { getCookie, deleteCookie } from '../utils/cookies';
import toast from 'react-hot-toast';

export const useClienteAuth = () => {
  const [clienteInfo, setClienteInfo] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = () => {
    let token = getCookie('clienteToken');
    let cliente = getCookie('clienteInfo');
    
    if (!token) {
      token = localStorage.getItem('clienteToken');
    }
    if (!cliente) {
      cliente = localStorage.getItem('clienteInfo');
    }
    
    const authenticated = !!(token && cliente);
    setIsAuthenticated(authenticated);
    
    if (authenticated && cliente) {
      try {
        setClienteInfo(JSON.parse(cliente));
      } catch (error) {
        console.error('Error parsing cliente info:', error);
        setClienteInfo(null);
        setIsAuthenticated(false);
      }
    } else {
      setClienteInfo(null);
    }
    
    return authenticated;
  };

  const cerrarSesion = () => {
    // Limpiar localStorage
    localStorage.removeItem('clienteToken');
    localStorage.removeItem('clienteInfo');
    
    // Limpiar cookies
    deleteCookie('clienteToken');
    deleteCookie('clienteInfo');
    
    // Actualizar estado
    setClienteInfo(null);
    setIsAuthenticated(false);
    
    toast.success('Sesión cerrada correctamente');
  };

  // Verificar autenticación al montar el hook
  useEffect(() => {
    checkAuth();
  }, []);

  // Escuchar cambios en localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    clienteInfo,
    isAuthenticated,
    checkAuth,
    cerrarSesion
  };
}; 