import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../services/api';
import NavbarAdmin from '../components/NavbarAdmin';
import { useUsuarioActual } from '../hooks/useUsuarioActual';
import { useResponsive } from '../hooks/useResponsive';
import type { Notificacion } from '../types';

export default function DashboardAdministrador() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile, isTablet, width } = useResponsive();
  const [isResponsiveReady, setIsResponsiveReady] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    productos: 0,
    clientes: 0,
    pedidos: 0,
    ventas: 0
  });
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);
  const [mostrarVentas, setMostrarVentas] = useState(() => {
    const guardado = localStorage.getItem('mostrarVentas');
    return guardado === null ? true : guardado === 'true';
  });
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargandoNotificaciones, setCargandoNotificaciones] = useState(true);
  const [notificacionesSeleccionadas, setNotificacionesSeleccionadas] = useState<number[]>([]);
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const [todasLasNotificaciones, setTodasLasNotificaciones] = useState<Notificacion[]>([]);
  const [cargandoTodas, setCargandoTodas] = useState(false);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      // Verificar si tenemos datos del usuario
      if (!datosUsuario?.empresaId) {
        return;
      }

      try {
        setCargandoEstadisticas(true);
        const empresaId = datosUsuario.empresaId;

        // Cargar productos reales
        console.log('Dashboard - Cargando productos para empresaId:', empresaId);
        const responseProductos = await ApiService.obtenerTodosLosProductos(empresaId);
        console.log('Dashboard - Respuesta completa de productos:', responseProductos);
        
        // La respuesta ahora es directamente un array de productos
        const cantidadProductos = Array.isArray(responseProductos) ? responseProductos.length : 0;
        console.log('Dashboard - Cantidad de productos:', cantidadProductos);

        // Cargar clientes reales
        const responseClientes = await ApiService.obtenerClientesPaginado(empresaId, 0, 1);
        const cantidadClientes = responseClientes.totalElements || 0;

        // Cargar pedidos reales
        const responsePedidos = await ApiService.obtenerPedidos(empresaId, 0, 1);
        const cantidadPedidos = responsePedidos.totalElements || 0;
        
        // Cargar ventas reales
        let totalVentas = 0;
        try {
          const responseVentas = await ApiService.obtenerEstadisticasVentas();
          totalVentas = responseVentas.data?.totalVentas || 0;
        } catch (error) {
          console.error('Error al cargar estadísticas de ventas:', error);
          totalVentas = 0;
        }
        
        setEstadisticas({
          productos: cantidadProductos,
          clientes: cantidadClientes,
          pedidos: cantidadPedidos,
          ventas: totalVentas
        });
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        // En caso de error, mantener los valores por defecto
        setEstadisticas({
          productos: 0,
          clientes: 0,
          pedidos: 0,
          ventas: 0
        });
      } finally {
        setCargandoEstadisticas(false);
      }
    };

    cargarEstadisticas();
  }, [datosUsuario?.empresaId]);

  // Manejar cuando el responsive está listo
  useEffect(() => {
    if (width > 0) {
      console.log('🔍 Dashboard - Responsive listo:', { width, isMobile, isTablet });
      setIsResponsiveReady(true);
    }
  }, [width, isMobile, isTablet]);

  // Cargar notificaciones recientes
  useEffect(() => {
    const cargarNotificaciones = async () => {
      if (!datosUsuario?.empresaId) {
        return;
      }

      try {
        setCargandoNotificaciones(true);
        const response = await ApiService.obtenerNotificacionesRecientes(datosUsuario.empresaId);
        if (response.data) {
          setNotificaciones(response.data);
        }
      } catch (error) {
        console.error('Error al cargar notificaciones:', error);
        setNotificaciones([]);
      } finally {
        setCargandoNotificaciones(false);
      }
    };

    cargarNotificaciones();
  }, [datosUsuario?.empresaId]);

  const cerrarSesionConToast = () => {
    cerrarSesion();
    toast.success('Sesión cerrada correctamente');
  };

  const tarjetasEstadisticas = [
    {
      titulo: 'Productos',
      valor: estadisticas.productos,
      icono: '📦',
      color: '#3b82f6',
      gradiente: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
    },
    {
      titulo: 'Clientes',
      valor: estadisticas.clientes,
      icono: '👥',
      color: '#10b981',
      gradiente: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    },
    {
      titulo: 'Pedidos',
      valor: estadisticas.pedidos,
      icono: '📋',
      color: '#f59e0b',
      gradiente: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    },
    {
      titulo: 'Ventas',
      valor: mostrarVentas ? `$${(estadisticas.ventas || 0).toLocaleString()}` : '****',
      icono: '💰',
      color: '#8b5cf6',
      gradiente: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      mostrarOjito: true
    }
  ];

  const accionesRapidas = [
    {
      titulo: 'Añadir Producto',
      descripcion: 'Añade un nuevo producto a tu inventario',
      icono: '➕',
      enlace: '/admin/productos/nuevo',
      color: '#059669'
    },
    {
      titulo: 'Historial de Ventas',
      descripcion: 'Consulta el historial de caja rápida',
      icono: '📊',
      enlace: '/admin/historial-ventas',
      color: '#8b5cf6'
    },
    {
      titulo: 'Control de Inventario',
      descripcion: 'Realiza conteo físico y control de stock',
      icono: '🔍',
      enlace: '/admin/control-inventario',
      color: '#dc2626'
    },
    {
      titulo: 'Configuración',
      descripcion: 'Personaliza tu tienda',
      icono: '⚙️',
      enlace: '/admin/configuracion',
      color: '#6b7280'
    }
  ];

  const alternarMostrarVentas = () => {
    setMostrarVentas(prev => {
      localStorage.setItem('mostrarVentas', (!prev).toString());
      return !prev;
    });
  };

  const formatearTiempoTranscurrido = (fecha: string) => {
    const ahora = new Date();
    const fechaNotificacion = new Date(fecha);
    const diferenciaMs = ahora.getTime() - fechaNotificacion.getTime();
    const segundos = Math.floor(diferenciaMs / 1000);
    
    if (segundos < 60) {
      return "Hace un momento";
    } else if (segundos < 3600) {
      const minutos = Math.floor(segundos / 60);
      return `Hace ${minutos} min${minutos > 1 ? 's' : ''}`;
    } else if (segundos < 86400) {
      const horas = Math.floor(segundos / 3600);
      return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    } else {
      const dias = Math.floor(segundos / 86400);
      return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    }
  };

  const toggleSeleccionNotificacion = (notificacionId: number) => {
    setNotificacionesSeleccionadas(prev => {
      if (prev.includes(notificacionId)) {
        return prev.filter(id => id !== notificacionId);
      } else {
        return [...prev, notificacionId];
      }
    });
  };

  const eliminarNotificacion = async (notificacionId: number) => {
    try {
      await ApiService.eliminarNotificacion(notificacionId, datosUsuario!.empresaId);
      setNotificaciones(prev => prev.filter(n => n.id !== notificacionId));
      setTodasLasNotificaciones(prev => prev.filter(n => n.id !== notificacionId));
      toast.success('Notificación eliminada');
    } catch (error) {
      console.log(error);
      toast.error('Error al eliminar la notificación');
    }
  };

  const eliminarNotificacionesSeleccionadas = async () => {
    if (notificacionesSeleccionadas.length === 0) return;
    
    try {
      await ApiService.eliminarNotificaciones(datosUsuario!.empresaId, notificacionesSeleccionadas);
      setNotificaciones(prev => prev.filter(n => !notificacionesSeleccionadas.includes(n.id)));
      setTodasLasNotificaciones(prev => prev.filter(n => !notificacionesSeleccionadas.includes(n.id)));
      setNotificacionesSeleccionadas([]);
      setModoSeleccion(false);
      toast.success(`${notificacionesSeleccionadas.length} notificación${notificacionesSeleccionadas.length > 1 ? 'es' : ''} eliminada${notificacionesSeleccionadas.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.log(error);
      toast.error('Error al eliminar las notificaciones');
    }
  };

  const limpiarNotificacionesAntiguas = async () => {
    try {
      const response = await ApiService.limpiarNotificacionesAntiguas(datosUsuario!.empresaId);
      
      // Mostrar mensaje específico basado en la respuesta
      if (response.data && response.data.cantidadEliminadas !== undefined) {
        const cantidad = response.data.cantidadEliminadas;
        if (cantidad > 0) {
          toast.success(`${cantidad} notificación${cantidad > 1 ? 'es' : ''} antigua${cantidad > 1 ? 's' : ''} eliminada${cantidad > 1 ? 's' : ''} exitosamente`);
        } else {
          toast.success('No se encontraron notificaciones antiguas para eliminar');
        }
      } else {
        toast.success('Limpieza completada');
      }
      
      // Recargar notificaciones después de limpiar
      const notificacionesResponse = await ApiService.obtenerNotificacionesRecientes(datosUsuario!.empresaId);
      if (notificacionesResponse.data) {
        setNotificaciones(notificacionesResponse.data);
      }
      
      // También limpiar la lista de todas las notificaciones si está cargada
      if (todasLasNotificaciones.length > 0) {
        const todasResponse = await ApiService.obtenerNotificaciones(datosUsuario!.empresaId, 0, 50);
        if (todasResponse.data) {
          setTodasLasNotificaciones(todasResponse.data.content || todasResponse.data);
        }
      }
    } catch (error) {
      console.error('Error al limpiar notificaciones antiguas:', error);
      toast.error('Error al limpiar notificaciones antiguas');
    }
  };

  const cargarTodasLasNotificaciones = async () => {
    if (todasLasNotificaciones.length > 0) {
      setMostrarTodas(true);
      return;
    }

    try {
      setCargandoTodas(true);
      const response = await ApiService.obtenerNotificaciones(datosUsuario!.empresaId, 0, 50);
      if (response.data) {
        setTodasLasNotificaciones(response.data.content || response.data);
        setMostrarTodas(true);
      }
    } catch (error) {
      console.error('Error al cargar todas las notificaciones:', error);
      toast.error('Error al cargar todas las notificaciones');
    } finally {
      setCargandoTodas(false);
    }
  };

  const ocultarNotificaciones = () => {
    setMostrarTodas(false);
  };

  // Mostrar pantalla de carga mientras el responsive se detecta
  if (!isResponsiveReady) {
    return (
      <div className="h-pantalla-minimo pagina-con-navbar" style={{ backgroundColor: 'var(--color-fondo)' }}>
        <NavbarAdmin 
          onCerrarSesion={cerrarSesionConToast}
          empresaNombre={datosUsuario?.empresaNombre}
          nombreAdministrador={datosUsuario?.nombre}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 80px)',
          paddingTop: '80px'
        }}>
          <div style={{
            textAlign: 'center',
            color: 'var(--color-texto-secundario)'
          }}>
            <div style={{
              border: '4px solid var(--color-borde)',
              borderTop: '4px solid var(--color-primario)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem auto'
            }}></div>
            <p>Cargando panel...</p>
          </div>
        </div>
      </div>
    );
  }

  console.log('🔍 Dashboard - Renderizando contenido principal con responsive:', { isMobile, isTablet, width });
  
  return (
    <div className="h-pantalla-minimo pagina-con-navbar" style={{ backgroundColor: 'var(--color-fondo)' }}>
      {/* Navegación */}
      <NavbarAdmin 
        onCerrarSesion={cerrarSesionConToast}
        empresaNombre={datosUsuario?.empresaNombre}
        nombreAdministrador={datosUsuario?.nombre}
      />

      {/* Contenido principal */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: isMobile ? '1rem 0.5rem' : isTablet ? '1.5rem 1rem' : '2rem 1rem',
        paddingTop: isMobile ? '120px' : '80px'
      }}>
        {/* Encabezado */}
        <div style={{
          marginBottom: '3rem',
          animation: 'slideInUp 0.6s ease-out'
        }}>
          <h1 style={{
            fontSize: isMobile ? '2rem' : isTablet ? '2.25rem' : '2.5rem',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textAlign: 'center'
          }}>
            Panel de Administración
          </h1>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            color: '#64748b',
            lineHeight: '1.6',
            textAlign: 'center'
          }}>
            Bienvenido{datosUsuario?.nombre ? ` ${datosUsuario.nombre}` : ''}. 
            Aquí tienes un resumen de {datosUsuario?.empresaNombre || 'tu negocio'}.
          </p>
        </div>

        {/* Accesos Directos */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
          gap: isMobile ? '0.75rem' : isTablet ? '1rem' : '1.5rem',
          marginBottom: isMobile ? '2rem' : '3rem'
        }}>
          {/* Card Productos */}
          <Link 
            to="/admin/productos"
            style={{
              background: 'white',
              borderRadius: isMobile ? '0.75rem' : '1rem',
              padding: isMobile ? '1rem' : '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e2e8f0',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.3s ease',
              display: 'block',
              animation: 'slideInUp 0.6s ease-out 0.1s both'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(59, 130, 246, 0.15)';
              e.currentTarget.style.borderColor = '#3b82f6';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              height: '100%'
            }}>
              <div style={{
                width: '4rem',
                height: '4rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                marginBottom: '1rem'
              }}>
                📦
              </div>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 0.5rem 0'
              }}>
                Productos
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#64748b',
                margin: 0
              }}>
                Gestionar catálogo
              </p>
            </div>
          </Link>

          {/* Card Clientes */}
          <Link 
            to="/admin/clientes"
            style={{
              background: 'white',
              borderRadius: isMobile ? '0.75rem' : '1rem',
              padding: isMobile ? '1rem' : '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e2e8f0',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.3s ease',
              display: 'block',
              animation: 'slideInUp 0.6s ease-out 0.2s both'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(16, 185, 129, 0.15)';
              e.currentTarget.style.borderColor = '#10b981';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              height: '100%'
            }}>
              <div style={{
                width: '4rem',
                height: '4rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                marginBottom: '1rem'
              }}>
                👥
              </div>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 0.5rem 0'
              }}>
                Clientes
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#64748b',
                margin: 0
              }}>
                Gestionar clientes
              </p>
            </div>
          </Link>

          {/* Card Pedidos */}
          <Link 
            to="/admin/pedidos"
            style={{
              background: 'white',
              borderRadius: isMobile ? '0.75rem' : '1rem',
              padding: isMobile ? '1rem' : '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e2e8f0',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.3s ease',
              display: 'block',
              animation: 'slideInUp 0.6s ease-out 0.3s both'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(245, 158, 11, 0.15)';
              e.currentTarget.style.borderColor = '#f59e0b';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              height: '100%'
            }}>
              <div style={{
                width: '4rem',
                height: '4rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                marginBottom: '1rem'
              }}>
                📋
              </div>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 0.5rem 0'
              }}>
                Pedidos
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#64748b',
                margin: 0
              }}>
                Gestionar pedidos
              </p>
            </div>
          </Link>

          {/* Card Venta Rápida */}
          <Link 
            to="/admin/caja-rapida"
            style={{
              background: 'white',
              borderRadius: isMobile ? '0.75rem' : '1rem',
              padding: isMobile ? '1rem' : '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e2e8f0',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.3s ease',
              display: 'block',
              animation: 'slideInUp 0.6s ease-out 0.4s both'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(139, 92, 246, 0.15)';
              e.currentTarget.style.borderColor = '#8b5cf6';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              height: '100%'
            }}>
              <div style={{
                width: '4rem',
                height: '4rem',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                marginBottom: '1rem'
              }}>
                💰
              </div>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 0.5rem 0'
              }}>
                Venta Rápida
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#64748b',
                margin: 0
              }}>
                Caja mostrador
              </p>
            </div>
          </Link>

          {/* Card Estadísticas */}
          <Link 
            to="/admin/estadisticas"
            style={{
              background: 'white',
              borderRadius: isMobile ? '0.75rem' : '1rem',
              padding: isMobile ? '1.5rem' : '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e2e8f0',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.3s ease',
              display: 'block',
              animation: 'slideInUp 0.6s ease-out 0.5s both'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(236, 72, 153, 0.15)';
              e.currentTarget.style.borderColor = '#ec4899';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              height: '100%'
            }}>
              <div style={{
                width: '4rem',
                height: '4rem',
                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)',
                marginBottom: '1rem'
              }}>
                📊
              </div>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 0.5rem 0'
              }}>
                Estadísticas
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#64748b',
                margin: 0
              }}>
                Ver reportes
              </p>
            </div>
          </Link>
        </div>

        {/* Funciones Avanzadas */}
        <div style={{
          marginBottom: '3rem',
          animation: 'slideInUp 0.6s ease-out 0.4s both'
        }}>
          <h2 style={{
            fontSize: '1.875rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            Funciones Avanzadas
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: isMobile ? '1rem' : '1.5rem'
          }}>
            {accionesRapidas.map((accion, index) => (
              <Link 
                key={index}
                to={accion.enlace}
                style={{
                  background: 'white',
                  borderRadius: isMobile ? '0.75rem' : '1rem',
                  padding: isMobile ? '1.5rem' : '2rem',
                  textDecoration: 'none',
                  color: 'inherit',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.3s ease',
                  display: 'block',
                  animation: `slideInUp 0.6s ease-out ${(index + 4) * 0.1}s both`
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = accion.color;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    background: `linear-gradient(135deg, ${accion.color} 0%, ${accion.color}dd 100%)`,
                    borderRadius: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    marginRight: '1rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}>
                    {accion.icono}
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: '0.25rem'
                    }}>
                      {accion.titulo}
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#64748b',
                      margin: 0,
                      lineHeight: '1.5'
                    }}>
                      {accion.descripcion}
                    </p>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: accion.color,
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  Ir a {accion.titulo.toLowerCase()} →
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Actividad reciente */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0',
          animation: 'slideInUp 0.6s ease-out 0.6s both'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: isMobile ? 'center' : 'space-between',
            alignItems: isMobile ? 'center' : 'center',
            marginBottom: '1.5rem',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '1rem' : '0'
          }}>
            <h2 style={{
              fontSize: isMobile ? '1.5rem' : '1.875rem',
              fontWeight: '600',
              color: '#1e293b',
              margin: 0,
              textAlign: isMobile ? 'center' : 'left'
            }}>
              Actividad Reciente
            </h2>
            {notificaciones.length > 0 && (
              <div style={{ 
                display: 'flex', 
                gap: isMobile ? '0.5rem' : '0.5rem', 
                alignItems: 'center',
                flexWrap: isMobile ? 'wrap' : 'nowrap',
                justifyContent: isMobile ? 'center' : 'flex-end',
                width: isMobile ? '100%' : 'auto'
              }}>
                {modoSeleccion ? (
                  <>
                    <button
                      onClick={eliminarNotificacionesSeleccionadas}
                      disabled={notificacionesSeleccionadas.length === 0}
                      style={{
                        background: notificacionesSeleccionadas.length > 0 ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : '#9ca3af',
                        color: 'white',
                        border: 'none',
                        padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        fontWeight: '500',
                        cursor: notificacionesSeleccionadas.length > 0 ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s ease',
                        minWidth: isMobile ? '80px' : 'auto',
                        textAlign: 'center'
                      }}
                      onMouseOver={(e) => {
                        if (notificacionesSeleccionadas.length > 0) {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                        }
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      Eliminar ({notificacionesSeleccionadas.length})
                    </button>
                    <button
                      onClick={() => {
                        setModoSeleccion(false);
                        setNotificacionesSeleccionadas([]);
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                        color: 'white',
                        border: 'none',
                        padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minWidth: isMobile ? '80px' : 'auto',
                        textAlign: 'center'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.3)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setModoSeleccion(true)}
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white',
                        border: 'none',
                        padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minWidth: isMobile ? '80px' : 'auto',
                        textAlign: 'center'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      Seleccionar
                    </button>
                    <button
                      onClick={limpiarNotificacionesAntiguas}
                      style={{
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        color: 'white',
                        border: 'none',
                        padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minWidth: isMobile ? '80px' : 'auto',
                        textAlign: 'center'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      Limpiar antiguas
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await ApiService.marcarTodasNotificacionesComoLeidas(datosUsuario!.empresaId);
                          setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
                          setTodasLasNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
                          toast.success('Todas las notificaciones marcadas como leídas');
                        } catch (error) {
                          console.log(error);
                          toast.error('Error al marcar notificaciones como leídas');
                        }
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        color: 'white',
                        border: 'none',
                        padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minWidth: isMobile ? '80px' : 'auto',
                        textAlign: 'center'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      Marcar como leídas
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          
          {cargandoNotificaciones ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '2rem'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #e2e8f0',
                borderTop: '4px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          ) : notificaciones.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#64748b'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
              <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No hay notificaciones recientes</p>
              <p style={{ fontSize: '0.875rem' }}>Las notificaciones aparecerán aquí cuando haya actividad en tu negocio</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(mostrarTodas ? todasLasNotificaciones : notificaciones.slice(0, 5)).map((notificacion, index) => (
                <div 
                  key={notificacion.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    background: notificacion.leida ? 'transparent' : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)',
                    border: notificacion.leida ? '1px solid #e2e8f0' : '1px solid rgba(59, 130, 246, 0.2)',
                    transition: 'all 0.2s ease',
                    cursor: modoSeleccion ? 'default' : 'pointer',
                    animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`,
                    position: 'relative'
                  }}
                  onClick={async (e) => {
                    console.log(e);
                    // Si estamos en modo selección, no marcar como leída
                    if (modoSeleccion) return;
                    
                    if (!notificacion.leida) {
                      try {
                        await ApiService.marcarNotificacionComoLeida(notificacion.id);
                        setNotificaciones(prev => 
                          prev.map(n => n.id === notificacion.id ? { ...n, leida: true } : n)
                        );
                        setTodasLasNotificaciones(prev => 
                          prev.map(n => n.id === notificacion.id ? { ...n, leida: true } : n)
                        );
                      } catch (error) {
                        console.error('Error al marcar notificación como leída:', error);
                      }
                    }
                  }}
                  onMouseOver={(e) => {
                    if (!modoSeleccion) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Checkbox para selección */}
                  {modoSeleccion && (
                    <div style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)' }}>
                      <input
                        type="checkbox"
                        checked={notificacionesSeleccionadas.includes(notificacion.id)}
                        onChange={() => toggleSeleccionNotificacion(notificacion.id)}
                        style={{
                          width: '1.25rem',
                          height: '1.25rem',
                          cursor: 'pointer',
                          accentColor: '#3b82f6'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  
                  {/* Botón de eliminar individual */}
                  {!modoSeleccion && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminarNotificacion(notificacion.id);
                      }}
                      style={{
                        position: 'absolute',
                        right: '0.5rem',
                        top: '0.5rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '50%',
                        width: '2rem',
                        height: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: '#ef4444',
                        transition: 'all 0.2s ease',
                        opacity: 0
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.opacity = '0';
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                      }}
                      title="Eliminar notificación"
                    >
                      ×
                    </button>
                  )}
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    marginLeft: modoSeleccion ? '2rem' : '0',
                    marginRight: !modoSeleccion ? '2rem' : '0',
                    flex: 1
                  }}>
                    <div style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      background: notificacion.color ? `linear-gradient(135deg, ${notificacion.color} 0%, ${notificacion.color}dd 100%)` : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      marginRight: '1rem',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}>
                      {notificacion.icono || '🔔'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#1e293b',
                        margin: 0,
                        marginBottom: '0.25rem'
                      }}>
                        {notificacion.titulo}
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#64748b',
                        margin: 0
                      }}>
                        {notificacion.descripcion}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {!notificacion.leida && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: '#3b82f6',
                        borderRadius: '50%',
                        flexShrink: 0
                      }} />
                    )}
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#64748b',
                      fontWeight: '500'
                    }}>
                      {formatearTiempoTranscurrido(notificacion.fechaCreacion)}
                    </span>
                  </div>
                </div>
              ))}
              
              {!mostrarTodas && notificaciones.length > 5 && (
                <div style={{
                  textAlign: 'center',
                  padding: '1rem'
                }}>
                  {cargandoTodas ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      color: '#3b82f6',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #e2e8f0',
                        borderTop: '2px solid #3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Cargando más notificaciones...
                    </div>
                  ) : (
                    <button
                      onClick={cargarTodasLasNotificaciones}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#3b82f6',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        transition: 'all 0.2s ease',
                        textDecoration: 'underline'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      Ver todas las notificaciones ({notificaciones.length} total)
                    </button>
                  )}
                </div>
              )}
              
              {mostrarTodas && (
                <div style={{
                  textAlign: 'center',
                  padding: '1rem',
                  borderTop: '1px solid #e2e8f0',
                  marginTop: '1rem'
                }}>
                  <button
                    onClick={ocultarNotificaciones}
                    style={{
                      background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    Mostrar menos (solo recientes)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
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
        
        @keyframes loading {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        @media (max-width: 768px) {
          .dashboard-title {
            font-size: 2rem !important;
          }
          
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
          
          .actions-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
