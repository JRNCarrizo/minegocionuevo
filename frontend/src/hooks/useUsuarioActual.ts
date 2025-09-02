import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface DatosUsuario {
  nombre: string;
  apellidos: string;
  email: string;
  empresaId: number;
  empresaNombre: string;
}

interface UseUsuarioActualReturn {
  datosUsuario: DatosUsuario | null;
  cargando: boolean;
  actualizarEmpresaNombre: (nuevoNombre: string) => void;
  cerrarSesion: () => void;
}

export function useUsuarioActual(): UseUsuarioActualReturn {
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
      
      // Formatear el nombre para mostrar en el navbar
      const nombreCompleto = user.nombre && user.apellidos 
        ? `${user.nombre} ${user.apellidos}`
        : user.nombre || 'Usuario';
      
      setDatosUsuario({
        nombre: nombreCompleto,
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

  const actualizarEmpresaNombre = (nuevoNombre: string) => {
    // Actualizar el estado local
    setDatosUsuario(prev => prev ? { ...prev, empresaNombre: nuevoNombre } : null);
    
    // Actualizar el localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        user.empresaNombre = nuevoNombre;
        localStorage.setItem('user', JSON.stringify(user));
        console.log('✅ Nombre de empresa actualizado en useUsuarioActual y localStorage:', nuevoNombre);
      } catch (error) {
        console.error('Error al actualizar localStorage:', error);
      }
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  return {
    datosUsuario,
    cargando,
    actualizarEmpresaNombre,
    cerrarSesion
  };
}
