import { useState, useEffect } from 'react';
import type { Empresa } from '../types';
import apiService from '../services/api';

interface UseSubdominioReturn {
  subdominio: string | null;
  empresa: Empresa | null;
  esSubdominioPrincipal: boolean;
  cargando: boolean;
  error: string | null;
}

export const useSubdominio = (): UseSubdominioReturn => {
  const [subdominio, setSubdominio] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectarSubdominio = () => {
      const hostname = window.location.hostname;
      
      // MODO DESARROLLO: Forzar subdominio para pruebas
      const subdominioDesarrollo = localStorage.getItem('subdominio-desarrollo');
      if (subdominioDesarrollo) {
        console.log('Usando subdominio de desarrollo:', subdominioDesarrollo);
        setSubdominio(subdominioDesarrollo);
        return subdominioDesarrollo;
      }
      
      // Lista de dominios principales (desarrollo y producción)
      const dominiosPrincipales = [
        'localhost',
        '127.0.0.1',
        'minegocio.com', // dominio de producción
        'app.minegocio.com' // app principal
      ];

      console.log('Hostname detectado:', hostname);

      // Verificar si es exactamente un dominio principal
      if (dominiosPrincipales.includes(hostname)) {
        console.log('Es dominio principal');
        setSubdominio(null);
        setCargando(false);
        return null;
      }

      // Verificar si es un subdominio
      const partes = hostname.split('.');
      console.log('Partes del hostname:', partes);
      
      if (partes.length >= 2) {
        // Si es algo como "empresa.localhost" o "empresa.minegocio.com"
        const posibleSubdominio = partes[0];
        const dominio = partes.slice(1).join('.');
        
        console.log('Posible subdominio:', posibleSubdominio);
        console.log('Dominio base:', dominio);
        
        // Verificar si el dominio base es uno de los principales
        if (dominiosPrincipales.includes(dominio)) {
          console.log('Subdominio detectado:', posibleSubdominio);
          setSubdominio(posibleSubdominio);
          return posibleSubdominio;
        }
      }

      console.log('No es dominio principal ni subdominio válido');
      setSubdominio(null);
      setCargando(false);
      return null;
    };

    const subdominioDetectado = detectarSubdominio();

    if (subdominioDetectado) {
      // Obtener información de la empresa por subdominio
      obtenerEmpresaPorSubdominio(subdominioDetectado);
    }
  }, []);

  const obtenerEmpresaPorSubdominio = async (subdominioParam: string) => {
    try {
      setCargando(true);
      setError(null);
      
      const response = await apiService.obtenerEmpresaPorSubdominio(subdominioParam);
      setEmpresa(response.data || null);
    } catch (err) {
      console.error('Error al obtener empresa por subdominio:', err);
      setError('No se pudo cargar la información de la empresa');
      setEmpresa(null);
    } finally {
      setCargando(false);
    }
  };

  const esSubdominioPrincipal = subdominio === null;
  
  console.log('Hook useSubdominio return:', {
    subdominio,
    empresa: empresa?.nombre,
    esSubdominioPrincipal,
    cargando,
    error
  });

  return {
    subdominio,
    empresa,
    esSubdominioPrincipal,
    cargando,
    error
  };
};
