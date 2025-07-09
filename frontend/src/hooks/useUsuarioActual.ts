import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface DatosUsuario {
  nombre: string;
  apellidos: string;
  email: string;
  empresaId: number;
  empresaNombre: string;
}

export function useUsuarioActual() {
  const navigate = useNavigate();
  const [datosUsuario, setDatosUsuario] = useState<DatosUsuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      navigate('/admin/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      
      console.log('=== DEBUG USUARIO ACTUAL ===');
      console.log('Datos del usuario en localStorage:', user);
      console.log('Nombre:', user.nombre);
      console.log('Apellidos:', user.apellidos);
      console.log('EmpresaNombre:', user.empresaNombre);
      
      setDatosUsuario({
        nombre: user.nombre || '',
        apellidos: user.apellidos || '',
        email: user.email || '',
        empresaId: user.empresaId || 0,
        empresaNombre: user.empresaNombre || 'Tu Empresa'
      });
    } catch (error) {
      console.error('Error al parsear datos del usuario:', error);
      navigate('/admin/login');
    } finally {
      setCargando(false);
    }
  }, [navigate]);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  return {
    datosUsuario,
    cargando,
    cerrarSesion
  };
}
