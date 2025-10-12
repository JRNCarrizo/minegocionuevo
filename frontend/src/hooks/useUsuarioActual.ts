import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface DatosUsuario {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  empresaId: number;
  empresaNombre: string;
  rol: 'ADMINISTRADOR' | 'ASIGNADO';
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
    
    console.log('=== DEBUG USUARIO ACTUAL ===');
    console.log('Token encontrado:', !!token);
    console.log('User encontrado:', !!userStr);
    console.log('Ruta actual:', window.location.pathname);
    console.log('Timestamp:', new Date().toISOString());
    
    // Solo redirigir si no estamos en una página de login o registro
    const esPaginaLogin = window.location.pathname.includes('/login') || 
                         window.location.pathname.includes('/recuperar') ||
                         window.location.pathname.includes('/reset') ||
                         window.location.pathname.includes('/verificar-email') ||
                         window.location.pathname.includes('/registro');
    
    // También considerar la página principal como no protegida
    const esPaginaPrincipal = window.location.pathname === '/';
    
    // Páginas de cliente que no requieren token de admin
    const esPaginaCliente = window.location.pathname.includes('/cuenta') ||
                           window.location.pathname.includes('/producto/') ||
                           window.location.pathname.includes('/carrito') ||
                           window.location.pathname.includes('/confirmacion-registro');
    
    if (!token || !userStr) {
      if (!esPaginaLogin && !esPaginaPrincipal && !esPaginaCliente) {
        console.log('🚨 [USUARIO] No hay token o user, redirigiendo al login desde:', window.location.pathname);
        navigate('/admin/login');
      } else {
        console.log('✅ [USUARIO] En página de login/principal/cliente, no redirigiendo');
      }
      setCargando(false);
      return;
    }

    try {
      const user = JSON.parse(userStr);
      
      // Extraer el ID del JWT token si no está en localStorage
      let userId = user.id;
      if (!userId && token) {
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          userId = tokenPayload.userId;
          console.log('🔍 [USUARIO] ID extraído del JWT token:', userId);
          
          // Verificar si el token está expirado
          const currentTime = Math.floor(Date.now() / 1000);
          const tokenExp = tokenPayload.exp;
          console.log('🔍 [USUARIO] Token exp:', tokenExp);
          console.log('🔍 [USUARIO] Tiempo actual:', currentTime);
          console.log('🔍 [USUARIO] Token expirado?', currentTime > tokenExp);
          
          if (currentTime > tokenExp) {
            console.log('🚨 [USUARIO] Token expirado, limpiando sesión y redirigiendo desde:', window.location.pathname);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/admin/login');
            return;
          }
        } catch (tokenError) {
          console.error('Error al decodificar JWT token:', tokenError);
          console.log('🚨 [USUARIO] Token inválido, limpiando sesión y redirigiendo desde:', window.location.pathname);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/admin/login');
          return;
        }
      }
      
      console.log('=== DEBUG USUARIO ACTUAL ===');
      console.log('Datos del usuario en localStorage:', user);
      console.log('ID del localStorage:', user.id);
      console.log('ID del JWT token:', userId);
      console.log('ID final a usar:', userId);
      console.log('Nombre:', user.nombre);
      console.log('Apellidos:', user.apellidos);
      console.log('Rol:', user.rol);
      console.log('EmpresaNombre:', user.empresaNombre);
      
      // Formatear el nombre para mostrar en el navbar
      const nombreCompleto = user.nombre && user.apellidos 
        ? `${user.nombre} ${user.apellidos}`
        : user.nombre || 'Usuario';
      
      setDatosUsuario({
        id: userId,
        nombre: nombreCompleto,
        apellidos: user.apellidos || '',
        email: user.email || '',
        empresaId: user.empresaId || 0,
        empresaNombre: user.empresaNombre || 'Tu Empresa',
        rol: user.rol || 'ASIGNADO'
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
