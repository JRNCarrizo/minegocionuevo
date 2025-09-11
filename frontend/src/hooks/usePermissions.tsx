import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import ApiService from '../services/api';
import { useUsuarioActual } from './useUsuarioActual';

interface PermissionsContextType {
  permissions: Record<string, boolean>;
  hasPermission: (permission: string) => boolean;
  loading: boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

interface PermissionsProviderProps {
  children: ReactNode;
}

export const PermissionsProvider = ({ children }: PermissionsProviderProps) => {
  console.log('🔍 [PERMISSIONS] PermissionsProvider renderizando...');
  
  // SIEMPRE llamar useUsuarioActual (regla de Hooks)
  const { datosUsuario } = useUsuarioActual();
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  
  // Solo usar useUsuarioActual si no estamos en páginas públicas
  // Las páginas administrativas (/admin/*) NO son públicas
  const esPaginaPublica = (window.location.pathname === '/' && !window.location.pathname.includes('/admin')) || 
                         (window.location.pathname.includes('/registro') && !window.location.pathname.includes('/admin')) ||
                         (window.location.pathname.includes('/login') && !window.location.pathname.includes('/admin')) ||
                         window.location.pathname.includes('/recuperar') ||
                         window.location.pathname.includes('/reset') ||
                         window.location.pathname.includes('/verificar-email') ||
                         window.location.pathname.includes('/publico');
  
  const [loading, setLoading] = useState(!esPaginaPublica);

  // Cargar permisos cuando cambien los datos del usuario
  useEffect(() => {
    console.log('🔍 [PERMISSIONS] useEffect datosUsuario cambió:', datosUsuario);
    console.log('🔍 [PERMISSIONS] Es página pública:', esPaginaPublica);
    
    // No cargar permisos en páginas públicas
    if (esPaginaPublica) {
      console.log('🔍 [PERMISSIONS] Página pública, no cargando permisos');
      setLoading(false);
      return;
    }
    
    // Solo procesar datosUsuario si no es página pública
    if (datosUsuario && !esPaginaPublica) {
      console.log('🔍 [PERMISSIONS] Cargando permisos para usuario:', datosUsuario.rol);
      
      // Si es administrador o super admin, no necesitamos cargar permisos del backend
      if (datosUsuario.rol === 'ADMINISTRADOR' || datosUsuario.rol === 'SUPER_ADMIN') {
        console.log('🔍 [PERMISSIONS] Usuario es', datosUsuario.rol, ', estableciendo permisos completos inmediatamente');
        const allPermissions: Record<string, boolean> = {
          PRODUCTOS: true,
          CLIENTES: true,
          PEDIDOS: true,
          CAJA_RAPIDA: true,
          ESTADISTICAS: true,
          CONFIGURACION: true,
          GESTION_ADMINISTRADORES: true,
          GESTION_EMPRESA: true,
          CONSUMO_SUSCRIPCIONES: true,
          CARGA_PLANILLAS: true,
          ROTURAS_PERDIDAS: true,
          INGRESOS: true,
          GESTION_RETORNOS: true,
          GESTION_SECTORES: true,
          GESTION_TRANSPORTISTAS: true,
          MOVIMIENTOS_DIA: true
        };
        setPermissions(allPermissions);
        setLoading(false);
        return;
      }
      
      // Solo cargar permisos del backend para usuarios ASIGNADO
      console.log('🔍 [PERMISSIONS] Usuario es ASIGNADO, llamando a loadPermissions()');
      loadPermissions();
    } else {
      console.log('🔍 [PERMISSIONS] No hay usuario, limpiando permisos');
      setPermissions({});
      setLoading(false);
    }
  }, [datosUsuario]);

  const loadPermissions = async () => {
    console.log('🔍 [PERMISSIONS] Cargando permisos para usuario ASIGNADO:', datosUsuario);
    console.log('🔍 [PERMISSIONS] Usuario ID:', datosUsuario?.id);
    console.log('🔍 [PERMISSIONS] Usuario Rol:', datosUsuario?.rol);
    
    if (datosUsuario?.id === undefined || datosUsuario?.id === null || datosUsuario.rol !== 'ASIGNADO') {
      console.log('🔍 [PERMISSIONS] No es usuario ASIGNADO válido, saliendo. ID:', datosUsuario?.id, 'Rol:', datosUsuario?.rol);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 [PERMISSIONS] Usuario es ASIGNADO, cargando permisos desde backend');
      console.log('🔍 [PERMISSIONS] Llamando a ApiService.obtenerPermisosUsuario con ID:', datosUsuario.id);
      
      const response = await ApiService.obtenerPermisosUsuario(datosUsuario.id);
      console.log('🔍 [PERMISSIONS] Respuesta completa del backend:', response);
      console.log('🔍 [PERMISSIONS] response.permisos:', response.permisos);
      console.log('🔍 [PERMISSIONS] response.permisos.permisos:', response.permisos?.permisos);
      
      const permisosObtenidos = response.permisos?.permisos || {};
      console.log('🔍 [PERMISSIONS] Permisos obtenidos del backend:', permisosObtenidos);
      console.log('🔍 [PERMISSIONS] Tipo de permisos obtenidos:', typeof permisosObtenidos);
      console.log('🔍 [PERMISSIONS] Claves de permisos obtenidos:', Object.keys(permisosObtenidos));
      console.log('🔍 [PERMISSIONS] Valores de permisos obtenidos:', Object.values(permisosObtenidos));
      
      setPermissions(permisosObtenidos);
      console.log('🔍 [PERMISSIONS] Permisos establecidos en el estado:', permisosObtenidos);
      
    } catch (error) {
      console.error('❌ [PERMISSIONS] Error cargando permisos para ASIGNADO:', error);
      console.error('❌ [PERMISSIONS] Error details:', error);
      console.error('❌ [PERMISSIONS] Error response:', error.response);
      console.error('❌ [PERMISSIONS] Error status:', error.response?.status);
      console.error('❌ [PERMISSIONS] Error data:', error.response?.data);
      // En caso de error, no dar permisos
      setPermissions({});
    } finally {
      setLoading(false);
      console.log('🔍 [PERMISSIONS] Loading establecido en false');
    }
  };

  const refreshPermissions = async () => {
    await loadPermissions();
  };

  const hasPermission = (permission: string): boolean => {
    console.log('🔍 [PERMISSIONS] Verificando permiso:', permission, 'para usuario:', datosUsuario?.rol);
    console.log('🔍 [PERMISSIONS] Usuario completo:', datosUsuario);
    console.log('🔍 [PERMISSIONS] Permisos actuales:', permissions);
    console.log('🔍 [PERMISSIONS] Loading:', loading);
    console.log('🔍 [PERMISSIONS] Es página pública:', esPaginaPublica);
    
    // En páginas públicas, no verificar permisos
    if (esPaginaPublica) {
      console.log('🔍 [PERMISSIONS] Página pública, permitiendo acceso');
      return true;
    }
    
    // Si no hay usuario cargado aún, verificar localStorage directamente SOLO para administradores
    if (!datosUsuario || !datosUsuario.rol) {
      console.log('🔍 [PERMISSIONS] Usuario no cargado aún, verificando localStorage...');
      
      // Verificar localStorage directamente SOLO para administradores
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          console.log('🔍 [PERMISSIONS] Usuario en localStorage:', user);
          
          // SOLO administradores tienen acceso inmediato
          if (user.rol === 'ADMINISTRADOR' || user.rol === 'SUPER_ADMIN') {
            console.log('🔍 [PERMISSIONS] Usuario es', user.rol, 'en localStorage, permitiendo acceso inmediato');
            return true;
          } else {
            // Para usuarios ASIGNADO, denegar acceso hasta que se carguen los permisos
            console.log('🔍 [PERMISSIONS] Usuario es', user.rol, 'en localStorage, denegando acceso hasta cargar permisos');
            return false;
          }
        }
      } catch (error) {
        console.error('Error leyendo localStorage:', error);
      }
      
      console.log('🔍 [PERMISSIONS] Usuario no cargado aún, denegando acceso');
      return false;
    }
    
    // Los administradores y super admins tienen todos los permisos inmediatamente
    if (datosUsuario.rol === 'ADMINISTRADOR' || datosUsuario.rol === 'SUPER_ADMIN') {
      console.log('🔍 [PERMISSIONS] Usuario es', datosUsuario.rol, ', permitiendo acceso inmediato');
      return true; // Los administradores tienen todos los permisos
    }
    
    // Para usuarios ASIGNADO, verificar si aún se están cargando los permisos
    if (loading) {
      console.log('🔍 [PERMISSIONS] Permisos aún cargando, denegando acceso temporalmente');
      return false;
    }
    
    const tienePermiso = permissions[permission] === true;
    console.log('🔍 [PERMISSIONS] Resultado:', tienePermiso);
    return tienePermiso;
  };

  const value: PermissionsContextType = {
    permissions,
    hasPermission,
    loading,
    refreshPermissions
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = (): PermissionsContextType => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions debe ser usado dentro de un PermissionsProvider');
  }
  return context;
};