import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DatosUsuario {
  nombre: string;
  apellidos: string;
  email: string;
  empresaId: number;
  empresaNombre: string;
}

interface UsuarioContextType {
  datosUsuario: DatosUsuario | null;
  cargando: boolean;
  actualizarEmpresaNombre: (nuevoNombre: string) => void;
  cerrarSesion: () => void;
}

const UsuarioContext = createContext<UsuarioContextType | undefined>(undefined);

export function UsuarioProvider({ children }: { children: ReactNode }) {
  const [datosUsuario, setDatosUsuario] = useState<DatosUsuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      setCargando(false);
      return;
    }

    try {
      const user = JSON.parse(userStr);
      
      console.log('=== DEBUG USUARIO CONTEXT ===');
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
    } finally {
      setCargando(false);
    }
  }, []);

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
        console.log('✅ Nombre de empresa actualizado en contexto y localStorage:', nuevoNombre);
      } catch (error) {
        console.error('Error al actualizar localStorage:', error);
      }
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setDatosUsuario(null);
  };

  return (
    <UsuarioContext.Provider value={{
      datosUsuario,
      cargando,
      actualizarEmpresaNombre,
      cerrarSesion
    }}>
      {children}
    </UsuarioContext.Provider>
  );
}

export function useUsuario() {
  const context = useContext(UsuarioContext);
  if (context === undefined) {
    throw new Error('useUsuario debe ser usado dentro de un UsuarioProvider');
  }
  return context;
} 