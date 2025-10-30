import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../services/api';
import NavbarAdmin from '../components/NavbarAdmin';
import { useUsuarioActual } from '../hooks/useUsuarioActual';
import { useResponsive } from '../hooks/useResponsive';
import { usePermissions } from '../hooks/usePermissions';
import { useTheme } from '../hooks/useTheme';
import type { Notificacion, Cliente, Pedido } from '../types';

export default function DashboardAdministrador() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile, isTablet, width } = useResponsive();
  const { hasPermission } = usePermissions();
  const { isDarkMode } = useTheme(datosUsuario?.id);
  const navigate = useNavigate();
  
  // TODOS los hooks deben ir antes del return condicional
  const [isResponsiveReady, setIsResponsiveReady] = useState(false);
  
  // Estado para navegación por teclado
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(0);
  const [mostrarInstrucciones, setMostrarInstrucciones] = useState(false);
  
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
  
  // Estados para contadores de elementos nuevos
  const [clientesNuevos, setClientesNuevos] = useState(0);
  const [pedidosNuevos, setPedidosNuevos] = useState(0);
  
  // Estado para información de suscripción
  const [suscripcion, setSuscripcion] = useState<any>(null);
  const [cargandoSuscripcion, setCargandoSuscripcion] = useState(true);

  // Referencia para el contenedor principal
  const containerRef = useRef<HTMLDivElement>(null);
  
  // TODOS los useEffect deben ir antes del return condicional
  // Efecto para agregar y remover event listeners
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Solo manejar navegación si no estamos en un input o textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }
      
      manejarNavegacionTeclado(event);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [indiceSeleccionado]);

  // Efecto para hacer scroll a la card seleccionada
  useEffect(() => {
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll('[data-card-index]');
      const cardSeleccionada = cards[indiceSeleccionado] as HTMLElement;
      if (cardSeleccionada) {
        cardSeleccionada.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        });
      }
    }
  }, [indiceSeleccionado]);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      // Verificar si tenemos datos del usuario
      if (!datosUsuario?.empresaId) {
        console.log('🔍 Dashboard - No hay empresaId, saltando carga de estadísticas');
        setCargandoEstadisticas(false);
        return;
      }

      try {
        console.log('🔍 Dashboard - Cargando estadísticas para empresa:', datosUsuario.empresaId);
        console.log('🔍 Dashboard - Usuario rol:', datosUsuario.rol);
        
        // Inicializar estadísticas con valores por defecto
        let estadisticasTemp = {
          productos: 0,
          clientes: 0,
          pedidos: 0,
          ventas: 0
        };

        // Solo cargar productos si tiene permiso
        if (hasPermission('PRODUCTOS')) {
          try {
            const productosRes = await ApiService.obtenerProductos(datosUsuario.empresaId);
            estadisticasTemp.productos = Array.isArray(productosRes) ? productosRes.length : (productosRes?.content?.length || 0);
            console.log('🔍 Dashboard - Productos cargados:', estadisticasTemp.productos);
          } catch (error) {
            console.error('Error cargando productos:', error);
            estadisticasTemp.productos = 0;
          }
        } else {
          console.log('🔍 Dashboard - Usuario no tiene permiso para PRODUCTOS');
        }

        // Solo cargar clientes si tiene permiso
        if (hasPermission('CLIENTES')) {
          try {
            const clientesRes = await ApiService.obtenerClientes(datosUsuario.empresaId);
            estadisticasTemp.clientes = clientesRes?.totalElements || 0;
            console.log('🔍 Dashboard - Clientes cargados:', estadisticasTemp.clientes);
          } catch (error) {
            console.error('Error cargando clientes:', error);
            estadisticasTemp.clientes = 0;
          }
        } else {
          console.log('🔍 Dashboard - Usuario no tiene permiso para CLIENTES');
        }

        // Solo cargar pedidos si tiene permiso
        if (hasPermission('PEDIDOS')) {
          try {
            const pedidosRes = await ApiService.obtenerPedidos(datosUsuario.empresaId);
            estadisticasTemp.pedidos = pedidosRes?.totalElements || 0;
            console.log('🔍 Dashboard - Pedidos cargados:', estadisticasTemp.pedidos);
          } catch (error) {
            console.error('Error cargando pedidos:', error);
            estadisticasTemp.pedidos = 0;
          }
        } else {
          console.log('🔍 Dashboard - Usuario no tiene permiso para PEDIDOS');
        }

        console.log('🔍 Dashboard - Estadísticas finales:', estadisticasTemp);
        setEstadisticas(estadisticasTemp);
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
        // No mostrar toast de error para usuarios sin permisos
        if (datosUsuario?.rol === 'ADMINISTRADOR') {
          toast.error('Error al cargar estadísticas');
        }
      } finally {
        setCargandoEstadisticas(false);
      }
    };

    cargarEstadisticas();
  }, [datosUsuario?.empresaId, datosUsuario?.rol]);

  // Cargar información de suscripción
  useEffect(() => {
    const cargarSuscripcion = async () => {
      try {
        if (datosUsuario?.empresaId) {
          const response = await ApiService.getMiSuscripcion();
          setSuscripcion(response);
        }
      } catch (error) {
        console.error('Error cargando suscripción:', error);
      } finally {
        setCargandoSuscripcion(false);
      }
    };

    cargarSuscripcion();
  }, [datosUsuario?.empresaId]);

  // Manejar cuando el responsive está listo
  useEffect(() => {
    if (width > 0) {
      console.log('🔍 Dashboard - Responsive listo:', { width, isMobile, isTablet });
      setIsResponsiveReady(true);
    }
  }, [width, isMobile, isTablet]);

  // Función para cargar contadores de elementos nuevos
  const cargarContadoresNuevos = async () => {
    if (!datosUsuario?.empresaId) {
      console.log('🔍 [CONTADORES] No hay empresaId, saltando carga de contadores');
      return;
    }

    try {
      const empresaId = datosUsuario.empresaId;
      console.log('🔍 [CONTADORES] Cargando contadores para empresa:', empresaId);
      console.log('🔍 [CONTADORES] Usuario rol:', datosUsuario.rol);
      
      // Obtener IDs de elementos vistos desde localStorage
      const clientesVistos = JSON.parse(localStorage.getItem(`clientesVistos_${empresaId}`) || '[]');
      const pedidosVistos = JSON.parse(localStorage.getItem(`pedidosVistos_${empresaId}`) || '[]');
      
      console.log('🔍 [CONTADORES] Clientes vistos:', clientesVistos);
      console.log('🔍 [CONTADORES] Pedidos vistos:', pedidosVistos);
      
      // Solo cargar contadores si el usuario tiene permisos para esas secciones
      // Cargar clientes nuevos (no vistos) - solo si tiene permiso
      if (hasPermission('CLIENTES')) {
        try {
          const responseClientes = await ApiService.obtenerClientesPaginado(empresaId, 0, 1000);
          console.log('🔍 [CONTADORES] Respuesta clientes:', responseClientes);
          const clientesNuevos = responseClientes.content?.filter((cliente: Cliente) => 
            !clientesVistos.includes(cliente.id)
          ).length || 0;
          console.log('🔍 [CONTADORES] Clientes nuevos:', clientesNuevos);
          setClientesNuevos(clientesNuevos);
        } catch (error) {
          console.error('Error al cargar clientes nuevos:', error);
          setClientesNuevos(0);
        }
      } else {
        console.log('🔍 [CONTADORES] Usuario no tiene permiso para CLIENTES, saltando contador');
        setClientesNuevos(0);
      }
      
      // Cargar pedidos nuevos (no vistos) - solo si tiene permiso
      if (hasPermission('PEDIDOS')) {
        try {
          const responsePedidos = await ApiService.obtenerPedidos(empresaId, 0, 1000);
          console.log('🔍 [CONTADORES] Respuesta pedidos:', responsePedidos);
          const pedidosNuevos = responsePedidos.content?.filter((pedido: Pedido) => 
            !pedidosVistos.includes(pedido.id)
          ).length || 0;
          console.log('🔍 [CONTADORES] Pedidos nuevos:', pedidosNuevos);
          setPedidosNuevos(pedidosNuevos);
        } catch (error) {
          console.error('Error al cargar pedidos nuevos:', error);
          setPedidosNuevos(0);
        }
      } else {
        console.log('🔍 [CONTADORES] Usuario no tiene permiso para PEDIDOS, saltando contador');
        setPedidosNuevos(0);
      }
    } catch (error) {
      console.error('Error al cargar contadores nuevos:', error);
    }
  };

  // Cargar contadores de elementos nuevos cuando cambie el usuario
  useEffect(() => {
    if (datosUsuario?.empresaId) {
      cargarContadoresNuevos();
    }
  }, [datosUsuario?.empresaId]);

  // Recargar contadores cuando la página vuelva a estar visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && datosUsuario?.empresaId) {
        cargarContadoresNuevos();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [datosUsuario?.empresaId]);

  
  // Log temporal para debug
  console.log('🔍 [DASHBOARD] Usuario actual:', datosUsuario);
  console.log('🔍 [DASHBOARD] hasPermission PRODUCTOS:', hasPermission('PRODUCTOS'));
  console.log('🔍 [DASHBOARD] Contadores - Clientes nuevos:', clientesNuevos, 'Pedidos nuevos:', pedidosNuevos);

  // Función para obtener todas las cards navegables
  const obtenerCardsNavegables = () => {
    const cardsEstadisticas = [
      { tipo: 'estadistica', enlace: '/admin/productos', titulo: 'Productos' },
      { tipo: 'estadistica', enlace: '/admin/clientes', titulo: 'Clientes' },
      { tipo: 'estadistica', enlace: '/admin/pedidos', titulo: 'Pedidos' },
      { tipo: 'estadistica', enlace: '/admin/caja-rapida', titulo: 'Venta Rápida' },
      { tipo: 'estadistica', enlace: '/admin/estadisticas', titulo: 'Estadísticas' }
    ];
    
    const cardsAcciones = accionesRapidas.map(accion => ({
      tipo: 'accion' as const,
      enlace: accion.enlace,
      titulo: accion.titulo
    }));
    
    return [...cardsEstadisticas, ...cardsAcciones];
  };

  // Función para manejar la navegación por teclado
  const manejarNavegacionTeclado = (event: KeyboardEvent) => {
    const cards = obtenerCardsNavegables();
    const totalCards = cards.length;
    
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
        const cardSeleccionada = cards[indiceSeleccionado];
        if (cardSeleccionada) {
          navigate(cardSeleccionada.enlace);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setMostrarInstrucciones(false);
        break;
      case '?':
        event.preventDefault();
        setMostrarInstrucciones(prev => !prev);
        break;
    }
  };


  // Función para obtener estilos de card basados en la selección (manteniendo estilos originales)
  const obtenerEstilosCard = (index: number, esSeleccionada: boolean) => {
    const baseStyles = {
      background: 'white',
      borderRadius: isMobile ? '0.75rem' : '1rem',
      padding: isMobile ? '1.5rem' : '2rem',
      textDecoration: 'none',
      color: 'inherit',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      border: '1px solid #e2e8f0',
      transition: 'all 0.3s ease',
      display: 'block',
      position: 'relative' as const,
      outline: 'none'
    };

    return baseStyles;
  };

  // Función para obtener estilos de indicador de selección sutil con colores específicos
  const obtenerEstilosIndicador = (esSeleccionada: boolean, cardIndex: number) => {
    if (!esSeleccionada) return { display: 'none' };
    
    // Definir colores específicos para cada card
    const coloresCards = {
      0: '#3b82f6', // Productos - Azul
      1: '#10b981', // Clientes - Verde
      2: '#f59e0b', // Pedidos - Amarillo/Naranja
      3: '#8b5cf6', // Venta Rápida - Púrpura
      4: '#ec4899', // Estadísticas - Rosa
      5: '#059669', // Añadir Producto - Verde oscuro
      6: '#8b5cf6', // Historial de Ventas - Púrpura
      7: '#dc2626', // Control de Inventario - Rojo
      8: '#3b82f6', // Consumo y Suscripciones - Azul
      9: '#059669', // Gestión de Administradores - Verde oscuro
      10: '#f59e0b', // Gestión de Empresa - Amarillo/Naranja
      11: '#6b7280' // Configuración - Gris
    };
    
    const color = coloresCards[cardIndex as keyof typeof coloresCards] || '#3b82f6';
    
    return {
      position: 'absolute' as const,
      top: '-2px',
      left: '-2px',
      right: '-2px',
      bottom: '-2px',
      border: `2px solid ${color}`,
      borderRadius: isMobile ? '0.875rem' : '1.125rem',
      pointerEvents: 'none' as const,
      zIndex: 10,
      opacity: 0.8
    };
  };


  // Cargar información de suscripción
  useEffect(() => {
    const cargarSuscripcion = async () => {
      try {
        setCargandoSuscripcion(true);
        const data = await ApiService.getMiSuscripcion();
        setSuscripcion(data);
        console.log('✅ Suscripción cargada:', data);
      } catch (error) {
        console.error('❌ Error cargando suscripción:', error);
        setSuscripcion(null);
      } finally {
        setCargandoSuscripcion(false);
      }
    };

    if (datosUsuario?.empresaId) {
      cargarSuscripcion();
    }
  }, [datosUsuario?.empresaId]);

  // Manejar cuando el responsive está listo
  useEffect(() => {
    if (width > 0) {
      console.log('🔍 Dashboard - Responsive listo:', { width, isMobile, isTablet });
      setIsResponsiveReady(true);
    }
  }, [width, isMobile, isTablet]);

  // Cargar contadores de elementos nuevos cuando cambie el usuario
  useEffect(() => {
    if (datosUsuario?.empresaId) {
      cargarContadoresNuevos();
    }
  }, [datosUsuario?.empresaId]);

  // Recargar contadores cuando la página vuelva a estar visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && datosUsuario?.empresaId) {
        cargarContadoresNuevos();
      }
    };

    const handleFocus = () => {
      if (datosUsuario?.empresaId) {
        cargarContadoresNuevos();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [datosUsuario?.empresaId]);

  // Cargar notificaciones recientes
  useEffect(() => {
    const cargarNotificaciones = async () => {
      if (!datosUsuario?.empresaId) {
        setCargandoNotificaciones(false);
        return;
      }

      try {
        setCargandoNotificaciones(true);
        console.log('🔍 [NOTIFICACIONES] Cargando notificaciones para empresa:', datosUsuario.empresaId);
        console.log('🔍 [NOTIFICACIONES] Usuario rol:', datosUsuario.rol);
        
        const response = await ApiService.obtenerNotificacionesRecientes(datosUsuario.empresaId);
        if (response.data) {
          setNotificaciones(response.data);
        } else if (Array.isArray(response)) {
          setNotificaciones(response);
        }
        console.log('🔍 [NOTIFICACIONES] Notificaciones cargadas exitosamente');
      } catch (error) {
        console.error('Error al cargar notificaciones:', error);
        setNotificaciones([]);
        // No mostrar toast de error para usuarios sin permisos
        if (datosUsuario?.rol === 'ADMINISTRADOR') {
          toast.error('Error al cargar notificaciones');
        }
      } finally {
        setCargandoNotificaciones(false);
      }
    };

    cargarNotificaciones();
  }, [datosUsuario?.empresaId, datosUsuario?.rol]);

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
      titulo: 'Configura tu tienda',
      descripcion: 'Tu tienda online',
      icono: '⚙️',
      enlace: '/admin/configuracion',
      color: '#6b7280',
      permiso: 'CONFIGURACION'
    },
    {
      titulo: 'Gestión de Administradores',
      descripcion: 'Asigna y gestiona administradores de la empresa',
      icono: '👥',
      enlace: '/admin/administradores',
      color: '#059669',
      permiso: 'GESTION_ADMINISTRADORES'
    },
    {
      titulo: 'Gestión de Empresa',
      descripcion: 'Administra la información y configuración de tu empresa',
      icono: '🏢',
      enlace: '/admin/gestion-empresa',
      color: '#f59e0b',
      permiso: 'GESTION_EMPRESA'
    },
    {
      titulo: 'Consumo y Suscripciones',
      descripcion: 'Monitorea uso de recursos y gestiona tu suscripción',
      icono: '📊',
      enlace: '/admin/consumo-suscripciones',
      color: '#3b82f6',
      permiso: 'CONSUMO_SUSCRIPCIONES'
    }
  ];

  const alternarMostrarVentas = () => {
    setMostrarVentas(prev => {
      localStorage.setItem('mostrarVentas', (!prev).toString());
      return !prev;
    });
  };

  // Función para renderizar una card con o sin acceso
  const renderCard = (config: {
    enlace: string;
    titulo: string;
    descripcion: string;
    icono: string;
    color: string;
    gradiente: string;
    permiso: string;
    cardIndex: number;
    animationDelay: string;
    onClick?: () => void;
    contadorNuevos?: number;
  }) => {
    const tieneAcceso = hasPermission(config.permiso);
    
    const cardContent = (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        height: '100%',
        position: 'relative'
      }}>
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
        
        {/* Contador de elementos nuevos */}
        {tieneAcceso && config.contadorNuevos !== undefined && config.contadorNuevos > 0 && (
          <div style={{
            position: 'absolute',
            top: isMobile ? '0.5rem' : '1rem',
            right: isMobile ? '0.5rem' : '1rem',
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: isMobile ? '1.5rem' : '2rem',
            height: isMobile ? '1.5rem' : '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            fontWeight: '600',
            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
            animation: 'pulse 2s infinite',
            zIndex: 10
          }}>
            {config.contadorNuevos > 99 ? '99+' : config.contadorNuevos}
          </div>
        )}
        
        <div style={{
          width: '4rem',
          height: '4rem',
          background: tieneAcceso ? config.gradiente : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
          borderRadius: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          boxShadow: tieneAcceso ? `0 4px 12px ${config.color}30` : '0 4px 12px rgba(156, 163, 175, 0.3)',
          marginBottom: '1rem',
          opacity: tieneAcceso ? 1 : 0.6
        }}>
          {config.icono}
        </div>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: tieneAcceso 
            ? 'var(--color-texto-principal)' 
            : 'var(--color-texto-terciario)',
          margin: '0 0 0.5rem 0'
        }}>
          {config.titulo}
        </h3>
        <p style={{
          fontSize: '0.875rem',
          color: tieneAcceso 
            ? 'var(--color-texto-secundario)' 
            : 'var(--color-texto-terciario)',
          margin: 0
        }}>
          {tieneAcceso ? config.descripcion : 'Sin acceso'}
        </p>
      </div>
    );

    if (tieneAcceso) {
      return (
        <Link 
          to={config.enlace}
          data-card-index={config.cardIndex.toString()}
          style={{
            background: 'var(--color-card)',
            borderRadius: isMobile ? '0.75rem' : '1rem',
            padding: isMobile ? '1rem' : '2rem',
            boxShadow: '0 4px 6px -1px var(--color-sombra), 0 2px 4px -1px var(--color-sombra)',
            border: '1px solid var(--color-borde)',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'all 0.3s ease',
            display: 'block',
            animation: `slideInUp 0.6s ease-out ${config.animationDelay} both`,
            position: 'relative'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = `0 20px 40px ${config.color}15`;
            e.currentTarget.style.borderColor = config.color;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px var(--color-sombra), 0 2px 4px -1px var(--color-sombra)';
            e.currentTarget.style.borderColor = 'var(--color-borde)';
          }}
          onClick={() => {
            if (config.onClick) config.onClick();
            setIndiceSeleccionado(config.cardIndex);
          }}
        >
          {/* Indicador de selección por teclado */}
          <div style={obtenerEstilosIndicador(indiceSeleccionado === config.cardIndex, config.cardIndex)} />
          {cardContent}
        </Link>
      );
    } else {
      return (
        <div 
          data-card-index={config.cardIndex.toString()}
          style={{
            background: 'var(--color-card)',
            borderRadius: isMobile ? '0.75rem' : '1rem',
            padding: isMobile ? '1rem' : '2rem',
            boxShadow: '0 4px 6px -1px var(--color-sombra), 0 2px 4px -1px var(--color-sombra)',
            border: '1px solid var(--color-borde)',
            transition: 'all 0.3s ease',
            display: 'block',
            animation: `slideInUp 0.6s ease-out ${config.animationDelay} both`,
            position: 'relative',
            cursor: 'not-allowed',
            opacity: 0.7
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 16px var(--color-sombra-fuerte)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px var(--color-sombra), 0 2px 4px -1px var(--color-sombra)';
          }}
          onClick={(e) => {
            e.preventDefault();
            toast.error('No tienes permisos para acceder a esta sección');
          }}
        >
          {/* Indicador de selección por teclado */}
          <div style={obtenerEstilosIndicador(indiceSeleccionado === config.cardIndex, config.cardIndex)} />
          {cardContent}
        </div>
      );
    }
  };

  const formatearTiempoTranscurrido = (fecha: any) => {
    console.log('🔍 Formateando tiempo transcurrido:', fecha, 'tipo:', typeof fecha);
    
    if (!fecha) return 'Fecha no disponible';
    
    try {
      let fechaNotificacion: Date;
      
      // Si es un string
      if (typeof fecha === 'string') {
        if (fecha.trim() === '') return 'Fecha no disponible';
        fechaNotificacion = new Date(fecha);
      } 
      // Si es un número (timestamp)
      else if (typeof fecha === 'number') {
        fechaNotificacion = new Date(fecha);
      }
      // Si es un objeto Date
      else if (fecha instanceof Date) {
        fechaNotificacion = fecha;
      }
      // Si es un array (formato [año, mes, día, hora, minuto, segundo, nanosegundos])
      else if (Array.isArray(fecha)) {
        const [year, month, day, hour, minute, second, nanosecond] = fecha;
        fechaNotificacion = new Date(year, month - 1, day, hour, minute, second);
      }
      // Si es un objeto con propiedades de fecha
      else if (typeof fecha === 'object' && fecha !== null) {
        if (fecha.timestamp) {
          fechaNotificacion = new Date(fecha.timestamp);
        } else if (fecha.date) {
          fechaNotificacion = new Date(fecha.date);
        } else if (fecha.fechaCreacion) {
          fechaNotificacion = new Date(fecha.fechaCreacion);
        } else {
          fechaNotificacion = new Date(fecha);
        }
      }
      // Otros casos
      else {
        fechaNotificacion = new Date(fecha);
      }
      
      // Verificar si la fecha es válida
      if (isNaN(fechaNotificacion.getTime())) {
        console.error('❌ Fecha inválida para tiempo transcurrido:', fecha, 'fechaNotificacion:', fechaNotificacion);
        return 'Fecha inválida';
      }
      
      console.log('✅ Fecha parseada para tiempo transcurrido:', fechaNotificacion);
      
      const ahora = new Date();
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
    } catch (error) {
      console.error('❌ Error formateando tiempo transcurrido:', fecha, error);
      return 'Fecha inválida';
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
      } else if (Array.isArray(notificacionesResponse)) {
        setNotificaciones(notificacionesResponse);
      }
      
      // También limpiar la lista de todas las notificaciones si está cargada
      if (todasLasNotificaciones.length > 0) {
        const todasResponse = await ApiService.obtenerNotificaciones(datosUsuario!.empresaId, 0, 50);
        if (todasResponse.data) {
          setTodasLasNotificaciones(todasResponse.data.content || todasResponse.data);
        } else if (Array.isArray(todasResponse)) {
          setTodasLasNotificaciones(todasResponse);
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
      } else if (Array.isArray(response)) {
        setTodasLasNotificaciones(response);
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

  // Función para limpiar contador de clientes nuevos
  const limpiarContadorClientes = async () => {
    if (!datosUsuario?.empresaId || !hasPermission('CLIENTES')) return;
    
    try {
      const empresaId = datosUsuario.empresaId;
      const response = await ApiService.obtenerClientesPaginado(empresaId, 0, 1000);
      const todosLosIds = response.content?.map((cliente: Cliente) => cliente.id) || [];
      localStorage.setItem(`clientesVistos_${empresaId}`, JSON.stringify(todosLosIds));
      setClientesNuevos(0);
    } catch (error) {
      console.error('Error al limpiar contador de clientes:', error);
    }
  };

  // Función para limpiar contador de pedidos nuevos
  const limpiarContadorPedidos = async () => {
    if (!datosUsuario?.empresaId || !hasPermission('PEDIDOS')) return;
    
    try {
      const empresaId = datosUsuario.empresaId;
      const response = await ApiService.obtenerPedidos(empresaId, 0, 1000);
      const todosLosIds = response.content?.map((pedido: Pedido) => pedido.id) || [];
      localStorage.setItem(`pedidosVistos_${empresaId}`, JSON.stringify(todosLosIds));
      setPedidosNuevos(0);
    } catch (error) {
      console.error('Error al limpiar contador de pedidos:', error);
    }
  };

  // Función para agregar un nuevo cliente al contador
  const agregarClienteNuevo = (clienteId: number) => {
    if (!datosUsuario?.empresaId || !hasPermission('CLIENTES')) return;
    
    const empresaId = datosUsuario.empresaId;
    const clientesVistos = JSON.parse(localStorage.getItem(`clientesVistos_${empresaId}`) || '[]');
    if (!clientesVistos.includes(clienteId)) {
      setClientesNuevos(prev => prev + 1);
    }
  };

  // Función para agregar un nuevo pedido al contador
  const agregarPedidoNuevo = (pedidoId: number) => {
    if (!datosUsuario?.empresaId || !hasPermission('PEDIDOS')) return;
    
    const empresaId = datosUsuario.empresaId;
    const pedidosVistos = JSON.parse(localStorage.getItem(`pedidosVistos_${empresaId}`) || '[]');
    if (!pedidosVistos.includes(pedidoId)) {
      setPedidosNuevos(prev => prev + 1);
    }
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
  console.log('🔍 Dashboard - Datos usuario:', datosUsuario);
  console.log('🔍 Dashboard - Logo URL:', datosUsuario?.empresaLogoUrl);
  
  return (
    <div className="h-pantalla-minimo pagina-con-navbar" style={{ 
      backgroundColor: 'var(--color-fondo)',
      background: 'var(--gradiente-fondo)'
    }}>
      {/* Navegación */}
      <NavbarAdmin 
        onCerrarSesion={cerrarSesionConToast}
        empresaNombre={datosUsuario?.empresaNombre}
        nombreAdministrador={datosUsuario?.nombre}
      />

      {/* Contenido principal */}
      <div 
        ref={containerRef}
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: isMobile ? '1rem 0.5rem' : isTablet ? '1.5rem 1rem' : '2rem 1rem',
          paddingTop: isMobile ? '120px' : '80px',
          minHeight: '100vh',
          background: 'var(--gradiente-fondo)'
        }}
      >
        {/* Instrucciones de navegación por teclado */}
        {mostrarInstrucciones && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            border: '2px solid #3b82f6',
            zIndex: 1000,
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>🎮 Navegación por Teclado</h3>
            <div style={{ textAlign: 'left', lineHeight: '1.8' }}>
              <p><strong>← → ↑ ↓</strong> Navegar entre cards</p>
              <p><strong>Enter</strong> Acceder a la sección seleccionada</p>
              <p><strong>?</strong> Mostrar/ocultar estas instrucciones</p>
              <p><strong>Esc</strong> Cerrar instrucciones</p>
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
        {/* Encabezado */}
        <div style={{
          marginBottom: '3rem',
          animation: 'slideInUp 0.6s ease-out'
        }}>
          <h1 style={{
            fontSize: isMobile ? '2rem' : isTablet ? '2.25rem' : '2.5rem',
            fontWeight: '700',
            color: 'var(--color-texto-principal)',
            marginBottom: '0.5rem',
            background: 'var(--gradiente-titulo)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textAlign: 'center'
          }}>
            Panel de Administración
          </h1>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            color: 'var(--color-texto-secundario)',
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
          {renderCard({
            enlace: '/admin/productos',
            titulo: 'Productos',
            descripcion: 'Gestionar productos',
            icono: '📦',
            color: '#3b82f6',
            gradiente: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            permiso: 'PRODUCTOS',
            cardIndex: 0,
            animationDelay: '0.1s'
          })}

          {/* Card Clientes */}
          {renderCard({
            enlace: '/admin/clientes',
            titulo: 'Clientes',
            descripcion: 'Gestionar clientes',
            icono: '👥',
            color: '#10b981',
            gradiente: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            permiso: 'CLIENTES',
            cardIndex: 1,
            animationDelay: '0.2s',
            onClick: limpiarContadorClientes,
            contadorNuevos: clientesNuevos
          })}

          {/* Card Pedidos */}
          {renderCard({
            enlace: '/admin/pedidos',
            titulo: 'Pedidos',
            descripcion: 'Gestionar pedidos',
            icono: '📋',
            color: '#f59e0b',
            gradiente: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            permiso: 'PEDIDOS',
            cardIndex: 2,
            animationDelay: '0.3s',
            onClick: limpiarContadorPedidos,
            contadorNuevos: pedidosNuevos
          })}

          {/* Card Venta Rápida */}
          {renderCard({
            enlace: '/admin/caja-rapida',
            titulo: 'Venta Rápida',
            descripcion: 'Caja mostrador',
            icono: '💰',
            color: '#8b5cf6',
            gradiente: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            permiso: 'CAJA_RAPIDA',
            cardIndex: 3,
            animationDelay: '0.4s'
          })}

          {/* Card Estadísticas */}
          {renderCard({
            enlace: '/admin/estadisticas',
            titulo: 'Estadísticas',
            descripcion: 'Ver reportes',
            icono: '📊',
            color: '#ec4899',
            gradiente: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
            permiso: 'ESTADISTICAS',
            cardIndex: 4,
            animationDelay: '0.5s'
          })}
        </div>



        {/* Funciones Avanzadas */}
            <div style={{
          marginBottom: '3rem',
          animation: 'slideInUp 0.6s ease-out 0.3s both'
        }}>
          <h2 style={{
            fontSize: '1.875rem',
                fontWeight: '600',
                color: 'var(--color-texto-principal)',
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
            {accionesRapidas.map((accion, index) => {
              const cardIndex = index + 5; // Las acciones rápidas empiezan en el índice 5
              const tieneAcceso = hasPermission(accion.permiso || '');
              
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
                      background: tieneAcceso ? `linear-gradient(135deg, ${accion.color} 0%, ${accion.color}dd 100%)` : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                      fontSize: '1.5rem',
                      marginRight: '1rem',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      opacity: tieneAcceso ? 1 : 0.6
                    }}>
                      {accion.icono}
              </div>
                    <div>
              <h3 style={{
                        fontSize: '1.25rem',
                fontWeight: '600',
                        color: tieneAcceso ? 'var(--color-texto-principal)' : 'var(--color-texto-terciario)',
                        marginBottom: '0.25rem'
              }}>
                        {accion.titulo}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                        color: tieneAcceso ? 'var(--color-texto-secundario)' : 'var(--color-texto-terciario)',
                        margin: 0,
                        lineHeight: '1.5'
              }}>
                        {tieneAcceso ? accion.descripcion : 'Sin acceso'}
              </p>
            </div>
                  </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
                    color: tieneAcceso ? accion.color : '#9ca3af',
                fontSize: '0.875rem',
                    fontWeight: '600'
              }}>
                    {tieneAcceso ? `Ir a ${accion.titulo.toLowerCase()} →` : 'Sin acceso'}
            </div>
                </div>
              );

              if (tieneAcceso) {
                return (
          <Link 
                    key={index}
                    to={accion.enlace}
                    data-card-index={cardIndex.toString()}
            style={{
              background: 'var(--color-card)',
              borderRadius: isMobile ? '0.75rem' : '1rem',
              padding: isMobile ? '1.5rem' : '2rem',
              textDecoration: 'none',
              color: 'inherit',
                      boxShadow: '0 4px 6px -1px var(--color-sombra), 0 2px 4px -1px var(--color-sombra)',
                      border: '1px solid var(--color-borde)',
              transition: 'all 0.3s ease',
              display: 'block',
                      animation: `slideInUp 0.6s ease-out ${(index + 4) * 0.1}s both`,
              position: 'relative'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 20px 40px var(--color-sombra-fuerte)';
                      e.currentTarget.style.borderColor = accion.color;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px var(--color-sombra), 0 2px 4px -1px var(--color-sombra)';
              e.currentTarget.style.borderColor = 'var(--color-borde)';
            }}
                    onClick={() => setIndiceSeleccionado(cardIndex)}
          >
            {/* Indicador de selección por teclado */}
                    <div style={obtenerEstilosIndicador(indiceSeleccionado === cardIndex, cardIndex)} />
                    {cardContent}
          </Link>
                );
              } else {
              return (
                  <div 
                  key={index}
                  data-card-index={cardIndex.toString()}
                  style={{
                    background: 'var(--color-card)',
                    borderRadius: isMobile ? '0.75rem' : '1rem',
                    padding: isMobile ? '1.5rem' : '2rem',
                    boxShadow: '0 4px 6px -1px var(--color-sombra), 0 2px 4px -1px var(--color-sombra)',
                    border: '1px solid var(--color-borde)',
                    transition: 'all 0.3s ease',
                    display: 'block',
                    animation: `slideInUp 0.6s ease-out ${(index + 4) * 0.1}s both`,
                      position: 'relative',
                      cursor: 'not-allowed',
                      opacity: 0.7
                  }}
                  onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px var(--color-sombra-fuerte)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px var(--color-sombra), 0 2px 4px -1px var(--color-sombra)';
                  }}
                    onClick={(e) => {
                      e.preventDefault();
                      toast.error('No tienes permisos para acceder a esta sección');
                    }}
                >
                  {/* Indicador de selección por teclado */}
                  <div style={obtenerEstilosIndicador(indiceSeleccionado === cardIndex, cardIndex)} />
                    {cardContent}
                    </div>
                );
              }
            })}
          </div>
        </div>



        {/* Actividad reciente */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0',
          animation: 'slideInUp 0.6s ease-out 0.5s both'
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
            {Array.isArray(notificaciones) && notificaciones.length > 0 && (
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
          ) : !Array.isArray(notificaciones) || notificaciones.length === 0 ? (
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.75rem' : '1rem' }}>
              {(mostrarTodas ? todasLasNotificaciones : (Array.isArray(notificaciones) ? notificaciones.slice(0, 5) : [])).map((notificacion, index) => (
                <div 
                  key={notificacion.id}
                  style={{
                    display: 'flex',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    justifyContent: 'space-between',
                    padding: isMobile ? '0.75rem' : '1rem',
                    borderRadius: '0.75rem',
                    background: notificacion.leida ? 'transparent' : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)',
                    border: notificacion.leida ? '1px solid #e2e8f0' : '1px solid rgba(59, 130, 246, 0.2)',
                    transition: 'all 0.2s ease',
                    cursor: modoSeleccion ? 'default' : 'pointer',
                    animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`,
                    position: 'relative',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '0.75rem' : '0'
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
                    <div style={{ 
                      position: isMobile ? 'static' : 'absolute', 
                      left: isMobile ? 'auto' : '0.5rem', 
                      top: isMobile ? 'auto' : '50%', 
                      transform: isMobile ? 'none' : 'translateY(-50%)',
                      marginBottom: isMobile ? '0.5rem' : '0'
                    }}>
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
                        position: isMobile ? 'static' : 'absolute',
                        right: isMobile ? 'auto' : '0.5rem',
                        top: isMobile ? 'auto' : '0.5rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '50%',
                        width: isMobile ? '1.75rem' : '2rem',
                        height: isMobile ? '1.75rem' : '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: '#ef4444',
                        transition: 'all 0.2s ease',
                        opacity: isMobile ? '1' : '0',
                        alignSelf: isMobile ? 'flex-end' : 'auto',
                        marginBottom: isMobile ? '0.5rem' : '0'
                      }}
                      onMouseOver={(e) => {
                        if (!isMobile) {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isMobile) {
                          e.currentTarget.style.opacity = '0';
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        }
                      }}
                      title="Eliminar notificación"
                    >
                      ×
                    </button>
                  )}
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: isMobile ? 'flex-start' : 'center',
                    marginLeft: modoSeleccion && !isMobile ? '2rem' : '0',
                    marginRight: !modoSeleccion && !isMobile ? '2rem' : '0',
                    flex: 1,
                    flexDirection: isMobile ? 'row' : 'row',
                    gap: isMobile ? '0.75rem' : '1rem'
                  }}>
                    <div style={{
                      width: isMobile ? '2rem' : '2.5rem',
                      height: isMobile ? '2rem' : '2.5rem',
                      background: notificacion.color ? `linear-gradient(135deg, ${notificacion.color} 0%, ${notificacion.color}dd 100%)` : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      marginRight: isMobile ? '0' : '1rem',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      flexShrink: 0
                    }}>
                      {notificacion.icono || '🔔'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        fontWeight: '600',
                        color: '#1e293b',
                        margin: 0,
                        marginBottom: '0.25rem',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word'
                      }}>
                        {notificacion.titulo}
                      </p>
                      <p style={{
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        color: '#64748b',
                        margin: 0,
                        lineHeight: '1.4',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word'
                      }}>
                        {notificacion.descripcion}
                      </p>
                    </div>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    alignSelf: isMobile ? 'flex-start' : 'center',
                    marginTop: isMobile ? '0.5rem' : '0'
                  }}>
                    {!notificacion.leida && (
                      <div style={{
                        width: isMobile ? '6px' : '8px',
                        height: isMobile ? '6px' : '8px',
                        background: '#3b82f6',
                        borderRadius: '50%',
                        flexShrink: 0
                      }} />
                    )}
                    <span style={{
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      color: '#64748b',
                      fontWeight: '500'
                    }}>
                      {formatearTiempoTranscurrido(notificacion.fechaCreacion)}
                    </span>
                  </div>
                </div>
              ))}
              
              {!mostrarTodas && Array.isArray(notificaciones) && notificaciones.length > 5 && (
                <div style={{
                  textAlign: 'center',
                  padding: isMobile ? '0.75rem' : '1rem'
                }}>
                  {cargandoTodas ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      color: '#3b82f6',
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      fontWeight: '500'
                    }}>
                      <div style={{
                        width: isMobile ? '14px' : '16px',
                        height: isMobile ? '14px' : '16px',
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
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        padding: isMobile ? '0.5rem 0.75rem' : '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        transition: 'all 0.2s ease',
                        textDecoration: 'underline',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        maxWidth: '100%'
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
                      Ver todas las notificaciones ({Array.isArray(notificaciones) ? notificaciones.length : 0} total)
                    </button>
                  )}
                </div>
              )}
              
              {mostrarTodas && (
                <div style={{
                  textAlign: 'center',
                  padding: isMobile ? '0.75rem' : '1rem',
                  borderTop: '1px solid #e2e8f0',
                  marginTop: '1rem'
                }}>
                  <button
                    onClick={ocultarNotificaciones}
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
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      maxWidth: '100%'
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
        
        @media (max-width: 480px) {
          .dashboard-title {
            font-size: 1.5rem !important;
          }
          
          .notification-container {
            padding: 0.5rem !important;
          }
          
          .notification-item {
            padding: 0.5rem !important;
            gap: 0.5rem !important;
          }
          
          .notification-icon {
            width: 1.75rem !important;
            height: 1.75rem !important;
            font-size: 0.75rem !important;
          }
          
          .notification-title {
            font-size: 0.8rem !important;
          }
          
          .notification-description {
            font-size: 0.7rem !important;
          }
          
          .notification-time {
            font-size: 0.65rem !important;
          }
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 0 4px 8px rgba(239, 68, 68, 0.5);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
          }
        }
      `}</style>
    </div>
  );
}
