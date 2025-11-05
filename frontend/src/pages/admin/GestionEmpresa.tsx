import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
import { usePermissions } from '../../hooks/usePermissions';
import { useTheme } from '../../hooks/useTheme';

interface Empresa {
  id: number;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  sitioWeb?: string;
  logo?: string;
  subdominio: string;
  activo?: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export default function GestionEmpresa() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile, isTablet } = useResponsive();
  const { hasPermission } = usePermissions();
  const { isDarkMode } = useTheme(datosUsuario?.id);
  const navigate = useNavigate();
  
  // Estado para navegación por teclado
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(0);
  const [mostrarInstrucciones, setMostrarInstrucciones] = useState(false);
  
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [cargando, setCargando] = useState(true);

  // Referencia para el contenedor principal
  const containerRef = useRef<HTMLDivElement>(null);

  // Función para obtener estilos de indicador de selección más visible con colores específicos
  const obtenerEstilosIndicador = (esSeleccionada: boolean, cardIndex: number) => {
    if (!esSeleccionada) return { display: 'none' };
    
    // Definir colores específicos para cada card
    const coloresCards = {
              0: '#3b82f6', // Carga de Planillas - Azul
      1: '#ef4444', // Roturas y Pérdidas - Rojo
      2: '#059669', // Ingresos - Verde
      3: '#f59e0b', // Gestión de Retornos - Amarillo/Naranja
      4: '#06b6d4', // Gestión de Sectores - Cian
      5: '#8b5cf6', // Gestión de Transportistas - Púrpura
      6: '#7c3aed', // Gestión de Inventario - Púrpura Oscuro
      7: '#10b981'  // Movimientos del Día - Verde
    };
    
    const color = coloresCards[cardIndex as keyof typeof coloresCards] || '#3b82f6';
    
    return {
      position: 'absolute' as const,
      top: '-4px',
      left: '-4px',
      right: '-4px',
      bottom: '-4px',
      border: `3px solid ${color}`,
      borderRadius: '1rem',
      pointerEvents: 'none' as const,
      zIndex: 10,
      opacity: 1,
      boxShadow: `0 0 20px ${color}40`
    };
  };

  // Función para obtener estilos de la card con efecto de escala cuando está seleccionada
  const obtenerEstilosCard = (index: number, esSeleccionada: boolean) => {
    const baseStyles = {
      background: 'var(--color-card)',
      borderRadius: '1rem',
      padding: isMobile ? '1.5rem' : '2rem',
      boxShadow: '0 4px 6px -1px var(--color-sombra)',
      border: '1px solid var(--color-borde)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`,
      position: 'relative' as const
    };

    if (esSeleccionada) {
      return {
        ...baseStyles,
        transform: 'scale(1.05)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
        zIndex: 5
      };
    }

    return baseStyles;
  };

  // Función para manejar la navegación por teclado
  const manejarNavegacionTeclado = (event: KeyboardEvent) => {
    const totalCards = cardsGestion.length;
    
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        setIndiceSeleccionado(prev => (prev + 1) % totalCards);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        setIndiceSeleccionado(prev => (prev - 1 + totalCards) % totalCards);
        break;
      case 'Enter':
        event.preventDefault();
        const cardSeleccionada = cardsGestion[indiceSeleccionado];
        if (cardSeleccionada && cardSeleccionada.enlace) {
          navigate(cardSeleccionada.enlace);
        } else if (cardSeleccionada) {
          toast.success(`Funcionalidad de ${cardSeleccionada.titulo} en desarrollo`);
        }
        break;
      case 'Escape':
        event.preventDefault();
        navigate('/admin');
        break;
      case '?':
        event.preventDefault();
        setMostrarInstrucciones(prev => !prev);
        break;
    }
  };

  // Efecto para agregar y remover event listeners
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Solo manejar navegación si estamos en la página principal de gestión de empresa
      const currentPath = window.location.pathname;
      if (currentPath !== '/admin/gestion-empresa') {
        return;
      }
      
      // Solo manejar navegación si no estamos en un input o textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }
      
      manejarNavegacionTeclado(event);
    };

    window.addEventListener('keydown', handleKeyDown, true); // Usar capture phase
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [indiceSeleccionado, navigate]);

  // Efecto para hacer scroll a la card seleccionada
  useEffect(() => {
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll('[data-card-index]');
      const cardSeleccionada = cards[indiceSeleccionado] as HTMLElement;
      
      if (cardSeleccionada) {
        cardSeleccionada.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }
  }, [indiceSeleccionado]);

  useEffect(() => {
    // Verificar si el token existe
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ Token no encontrado en localStorage, redirigiendo al login');
      navigate('/admin/login');
      return;
    }
    
    // Si tenemos token, intentar cargar la empresa
    console.log('✅ Token encontrado, cargando empresa...');
    cargarEmpresa();
  }, [navigate]);

  // Manejar tecla Escape para volver al panel principal de admin
  // SOLO cuando estamos en esta página específica, no en subpáginas
  useEffect(() => {
    const manejarEscape = (e: KeyboardEvent) => {
      // Solo manejar Escape si estamos en la página principal de gestión de empresa
      // y no en una subpágina como sectores o stock general
      const currentPath = window.location.pathname;
      if (e.key === 'Escape' && currentPath === '/admin/gestion-empresa') {
        console.log('🔍 GestionEmpresa - Escape detected, navigating to /admin');
        e.preventDefault();
        e.stopPropagation();
        navigate('/admin');
      }
    };

    document.addEventListener('keydown', manejarEscape, true); // Usar capture phase
    return () => {
      document.removeEventListener('keydown', manejarEscape, true);
    };
  }, [navigate]);

  const cargarEmpresa = async () => {
    try {
      setCargando(true);
      console.log('🔍 Intentando cargar empresa...');
      console.log('📧 Usuario actual:', datosUsuario);
      console.log('🌐 URL base de API:', import.meta.env.VITE_API_URL || 'No configurada');
      console.log('🔑 Token en localStorage:', localStorage.getItem('token') ? 'Presente' : 'Ausente');
      console.log('👤 User en localStorage:', localStorage.getItem('user') ? 'Presente' : 'Ausente');
      
      const response = await ApiService.obtenerEmpresaAdmin();
      console.log('✅ Respuesta del servidor:', response);
      
      if (response.data) {
        setEmpresa(response.data);
        console.log('🏢 Empresa cargada:', response.data);
      } else {
        console.log('⚠️ No se encontraron datos de empresa en la respuesta');
      }
    } catch (error: any) {
      console.error('❌ Error al cargar empresa:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      
      // Si es un error 401, redirigir al login
      if (error.response?.status === 401) {
        console.log('🔐 Error 401 - Token expirado, redirigiendo al login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/admin/login');
        return;
      }
      
      toast.error('Error al cargar la información de la empresa');
    } finally {
      setCargando(false);
    }
  };

  const cardsGestion = [
    {
      titulo: 'Carga de Planillas',
      descripcion: 'Gestiona los pedidos realizados',
      icono: '📦',
      color: '#3b82f6',
      enlace: '/admin/carga-pedidos',
      gradiente: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      permiso: 'CARGA_PLANILLAS'
    },
    {
      titulo: 'Roturas y Pérdidas',
      descripcion: 'Registra productos dañados, vencidos o en malas condiciones',
      icono: '💔',
      color: '#ef4444',
      enlace: '/admin/roturas-perdidas',
      gradiente: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      permiso: 'ROTURAS_PERDIDAS'
    },
    {
      titulo: 'Ingresos',
      descripcion: 'Registra la entrada de nueva mercadería al inventario',
      icono: '📥',
      color: '#059669',
      enlace: '/admin/ingresos',
      gradiente: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      permiso: 'INGRESOS'
    },
    {
      titulo: 'Gestión de Retornos',
      descripcion: 'Gestiona las devoluciones y productos no entregados',
      icono: '🔄',
      color: '#f59e0b',
      enlace: '/admin/descarga-devoluciones',
      gradiente: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      permiso: 'GESTION_RETORNOS'
    },
    {
      titulo: 'Gestión de Sectores',
      descripcion: 'Administra los sectores de almacenamiento de tu empresa',
      icono: '🏢',
      color: '#06b6d4',
      enlace: '/admin/sectores',
      gradiente: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      permiso: 'GESTION_SECTORES'
    },
    {
      titulo: 'Gestión de Transportistas',
      descripcion: 'Administra transportistas y sus vehículos',
      icono: '🚛',
      color: '#8b5cf6',
      enlace: '/admin/transportistas',
      gradiente: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      permiso: 'GESTION_TRANSPORTISTAS'
    },
    {
      titulo: 'Inventario Completo',
      descripcion: 'Inventario completo con doble verificación por sector',
      icono: '📋',
      color: '#7c3aed',
      enlace: '/admin/inventario-completo',
      gradiente: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
      permiso: 'INVENTARIO_COMPLETO'
    },
    {
      titulo: 'Movimientos del Día',
      descripcion: 'Estadísticas generales de movimientos diarios',
      icono: '📊',
      color: '#10b981',
      enlace: '/admin/movimientos-dia',
      gradiente: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      permiso: 'MOVIMIENTOS_DIA'
    }
  ];

  if (cargando) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--gradiente-fondo)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'var(--color-card)',
          borderRadius: '1rem',
          paddingTop: '2rem',
          paddingBottom: '2rem',
          paddingLeft: '2rem',
          paddingRight: '2rem',
          boxShadow: '0 20px 40px var(--color-sombra-fuerte)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '4px solid var(--color-borde)',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: 'var(--color-texto-secundario)', margin: 0 }}>Cargando información de la empresa...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--gradiente-fondo)'
    }}>
      <NavbarAdmin
        onCerrarSesion={cerrarSesion}
        empresaNombre={empresa?.nombre}
        nombreAdministrador={datosUsuario?.nombre}
      />

      <div 
        ref={containerRef}
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          paddingTop: isMobile ? '8rem' : '9rem',
          paddingBottom: isMobile ? '1rem' : '2rem',
          paddingLeft: isMobile ? '1rem' : '2rem',
          paddingRight: isMobile ? '1rem' : '2rem'
        }}
      >
        {/* Instrucciones de navegación por teclado */}
        {mostrarInstrucciones && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--color-card)',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 25px 50px var(--color-sombra-fuerte)',
            border: '2px solid #3b82f6',
            zIndex: 1000,
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-texto-principal)' }}>🎮 Navegación por Teclado</h3>
            <div style={{ textAlign: 'left', lineHeight: '1.8' }}>
              <p><strong>← → ↑ ↓</strong> Navegar entre cards</p>
              <p><strong>Enter</strong> Acceder a la sección seleccionada</p>
              <p><strong>?</strong> Mostrar/ocultar estas instrucciones</p>
              <p><strong>Esc</strong> Volver al panel principal</p>
            </div>
            <button
              onClick={() => setMostrarInstrucciones(false)}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Indicador de navegación por teclado */}
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'rgba(59, 130, 246, 0.9)',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '2rem',
          fontSize: '0.875rem',
          cursor: 'pointer',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
        }}
        onClick={() => setMostrarInstrucciones(true)}
        >
          <span>🎮</span>
          <span>Navegación por teclado</span>
        </div>
        {/* Header */}
        <div style={{
          background: 'var(--color-card)',
          borderRadius: '1rem',
          paddingTop: isMobile ? '1.5rem' : '2rem',
          paddingBottom: isMobile ? '1.5rem' : '2rem',
          paddingLeft: isMobile ? '1.5rem' : '2rem',
          paddingRight: isMobile ? '1.5rem' : '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px var(--color-sombra)',
          border: '1px solid var(--color-borde)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            justifyContent: isMobile ? 'center' : 'flex-start',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: 'white'
            }}>
              🏢
            </div>
            <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
              <h1 style={{
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: '700',
                color: 'var(--color-texto-principal)',
                margin: 0
              }}>
                Gestión de Empresa
              </h1>
              <p style={{
                color: 'var(--color-texto-secundario)',
                margin: 0,
                fontSize: '0.875rem'
              }}>
                Administra el inventario y operaciones de {empresa?.nombre}
              </p>
            </div>
          </div>
        </div>

        {/* Cards de Gestión */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: isMobile ? '1rem' : '1.5rem'
        }}>
                     {cardsGestion.map((card, index) => {
               const tieneAcceso = hasPermission(card.permiso);
               
               const cardContent = (
                 <div style={{ position: 'relative' }}>
                   {/* Candadito si no tiene acceso */}
                   {!tieneAcceso && (
                     <div style={{
                       position: 'absolute',
                       top: isMobile ? '0.5rem' : '1rem',
                       right: isMobile ? '0.5rem' : '1rem',
                       background: 'rgba(239, 68, 68, 0.9)',
                       color: 'white',
                       borderRadius: '50%',
                       width: isMobile ? '1.5rem' : '2rem',
                       height: isMobile ? '1.5rem' : '2rem',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       fontSize: isMobile ? '0.75rem' : '0.875rem',
                       zIndex: 10,
                       boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                     }}>
                       🔒
                     </div>
                   )}
                   
                   <div style={{
                     display: 'flex',
                     alignItems: 'center',
                     marginBottom: '1.5rem'
                   }}>
                     <div style={{
                       width: '3rem',
                       height: '3rem',
                       background: tieneAcceso ? card.gradiente : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                       borderRadius: '1rem',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center',
                       fontSize: '1.5rem',
                       marginRight: '1rem',
                       boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                       opacity: tieneAcceso ? 1 : 0.6
                     }}>
                       {card.icono}
                     </div>
                     <div>
                       <h3 style={{
                         fontSize: '1.25rem',
                         fontWeight: '600',
                         color: tieneAcceso ? 'var(--color-texto-principal)' : 'var(--color-texto-terciario)',
                         marginBottom: '0.25rem'
                       }}>
                         {card.titulo}
                       </h3>
                       <p style={{
                         fontSize: '0.875rem',
                         color: tieneAcceso ? 'var(--color-texto-secundario)' : 'var(--color-texto-terciario)',
                         margin: 0,
                         lineHeight: '1.5'
                       }}>
                         {tieneAcceso ? card.descripcion : 'Sin acceso'}
                       </p>
                     </div>
                   </div>
                   <div style={{
                     display: 'flex',
                     alignItems: 'center',
                     color: tieneAcceso ? card.color : '#9ca3af',
                     fontSize: '0.875rem',
                     fontWeight: '600'
                   }}>
                     {tieneAcceso ? `Ir a ${card.titulo.toLowerCase()} →` : 'Sin acceso'}
                   </div>
                 </div>
               );

               if (tieneAcceso) {
                 return (
                   <div
                     key={index}
                     data-card-index={index.toString()}
                     style={obtenerEstilosCard(index, indiceSeleccionado === index)}
                     onMouseOver={(e) => {
                       // Solo aplicar hover si no está seleccionada por teclado
                       if (indiceSeleccionado !== index) {
                         e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                         e.currentTarget.style.boxShadow = '0 20px 40px var(--color-sombra-fuerte)';
                         e.currentTarget.style.borderColor = card.color;
                       }
                     }}
                     onMouseOut={(e) => {
                       // Solo resetear si no está seleccionada por teclado
                       if (indiceSeleccionado !== index) {
                         e.currentTarget.style.transform = 'translateY(0) scale(1)';
                         e.currentTarget.style.boxShadow = '0 4px 6px -1px var(--color-sombra)';
                         e.currentTarget.style.borderColor = 'var(--color-borde)';
                       }
                     }}
                     onClick={() => {
                       setIndiceSeleccionado(index);
                       if (card.enlace) {
                         navigate(card.enlace);
                       } else {
                         toast.success(`Funcionalidad de ${card.titulo} en desarrollo`);
                       }
                     }}
                   >
                     {/* Indicador de selección por teclado */}
                     <div style={obtenerEstilosIndicador(indiceSeleccionado === index, index)} />
                     {cardContent}
                   </div>
                 );
               } else {
                 return (
                   <div
                     key={index}
                     data-card-index={index.toString()}
                     style={{
                       ...obtenerEstilosCard(index, indiceSeleccionado === index),
                       cursor: 'not-allowed',
                       opacity: 0.7
                     }}
                     onMouseOver={(e) => {
                       if (indiceSeleccionado !== index) {
                         e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
                         e.currentTarget.style.boxShadow = '0 8px 16px var(--color-sombra-fuerte)';
                       }
                     }}
                     onMouseOut={(e) => {
                       if (indiceSeleccionado !== index) {
                         e.currentTarget.style.transform = 'translateY(0) scale(1)';
                         e.currentTarget.style.boxShadow = '0 4px 6px -1px var(--color-sombra)';
                       }
                     }}
                     onClick={(e) => {
                       e.preventDefault();
                       toast.error('No tienes permisos para acceder a esta sección');
                     }}
                   >
                     {/* Indicador de selección por teclado */}
                     <div style={obtenerEstilosIndicador(indiceSeleccionado === index, index)} />
                     {cardContent}
                   </div>
                 );
               }
             })}
        </div>

        {/* Información de la Empresa (Reducida) */}
        <div style={{
          background: 'var(--color-card)',
          borderRadius: '1rem',
          paddingTop: isMobile ? '1.5rem' : '2rem',
          paddingBottom: isMobile ? '1.5rem' : '2rem',
          paddingLeft: isMobile ? '1.5rem' : '2rem',
          paddingRight: isMobile ? '1.5rem' : '2rem',
          marginTop: '2rem',
          boxShadow: '0 4px 6px -1px var(--color-sombra)',
          border: '1px solid var(--color-borde)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: 'var(--color-texto-principal)',
            marginBottom: '1.5rem',
            borderBottom: '2px solid var(--color-borde)',
            paddingBottom: '1rem'
          }}>
            Información de la Empresa
          </h2>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'var(--color-texto-principal)',
              marginBottom: '0.5rem'
            }}>
              Nombre de la Empresa
            </label>
            <div style={{
              paddingTop: '0.75rem',
              paddingBottom: '0.75rem',
              paddingLeft: '0.75rem',
              paddingRight: '0.75rem',
              background: 'var(--color-fondo-secundario)',
              border: '2px solid var(--color-borde)',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              color: 'var(--color-texto-principal)'
            }}>
              {empresa?.nombre || 'No especificado'}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
