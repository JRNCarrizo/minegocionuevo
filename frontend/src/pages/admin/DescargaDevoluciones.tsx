import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
import { formatearFecha, formatearFechaCorta, formatearFechaConHora } from '../../utils/dateUtils';

interface PlanillaDevolucion {
  id: number;
  numeroPlanilla: string;
  fechaPlanilla: string;
  observaciones?: string;
  transporte?: string;
  totalProductos: number;
  fechaCreacion: string;
  fechaActualizacion: string;
  detalles: DetallePlanillaDevolucion[];
  estado: string;
  usuarioVerificacion?: string;
  fechaVerificacion?: string;
}

interface DetallePlanillaDevolucion {
  id: number;
  productoId?: number;
  numeroPersonalizado?: string;
  descripcion: string;
  cantidad: number;
  observaciones?: string;
  estadoProducto?: string;
  fechaCreacion: string;
}

export default function DescargaDevoluciones() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  
  console.log('🔍 [DEBUG] DescargaDevoluciones - Componente renderizado');
  console.log('🔍 [DEBUG] datosUsuario:', datosUsuario);
  
  const [planillas, setPlanillas] = useState<PlanillaDevolucion[]>([]);
  const [cargando, setCargando] = useState(true);
  const datosCargadosRef = useRef(false);
  const [planillaSeleccionada, setPlanillaSeleccionada] = useState<PlanillaDevolucion | null>(null);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [diasExpandidos, setDiasExpandidos] = useState<Set<string>>(new Set());
  const [productosPerdidos, setProductosPerdidos] = useState<any[]>([]);
  const [cargandoProductosPerdidos, setCargandoProductosPerdidos] = useState(false);
  const [modalProductosPerdidos, setModalProductosPerdidos] = useState<string | null>(null);
  const [modalResumenProductos, setModalResumenProductos] = useState<string | null>(null);
  const [resumenProductos, setResumenProductos] = useState<any[]>([]);
  const [cargandoResumen, setCargandoResumen] = useState(false);
  const [fechaResumenAnterior, setFechaResumenAnterior] = useState<string | null>(null);

  // Función para obtener el color del estado
  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE_VERIFICACION':
        return '#f59e0b'; // Amarillo
      case 'VERIFICADO':
        return '#10b981'; // Verde
      default:
        return '#6b7280'; // Gris
    }
  };

  // Función para obtener el texto del estado
  const obtenerTextoEstado = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE_VERIFICACION':
        return 'Pendiente de Verificación';
      case 'VERIFICADO':
        return 'Verificado';
      default:
        return estado;
    }
  };

  // Función helper para convertir fechaPlanilla a string de fecha
  const obtenerFechaPlanillaString = (fechaPlanilla: any): string => {
    console.log('🔍 [DEBUG] obtenerFechaPlanillaString - Input:', {
      fechaPlanilla,
      tipo: typeof fechaPlanilla,
      esArray: Array.isArray(fechaPlanilla)
    });
    
    try {
      // Si es null o undefined
      if (fechaPlanilla == null) {
        return 'Fecha no disponible';
      }

      const zonaHorariaLocal = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Si es un string
      if (typeof fechaPlanilla === 'string') {
        // Si ya tiene formato de fecha (YYYY-MM-DD)
        if (fechaPlanilla.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return fechaPlanilla;
        }
        // Si tiene formato ISO con T
        if (fechaPlanilla.includes('T')) {
          const partes = fechaPlanilla.split('T');
          if (partes.length >= 1) {
            // Convertir de UTC a zona horaria local
            const fechaUTC = new Date(fechaPlanilla);
            if (!isNaN(fechaUTC.getTime())) {
              return fechaUTC.toLocaleDateString('en-CA', { timeZone: zonaHorariaLocal });
            }
            return partes[0];
          }
        }
        // Si es otro formato, intentar parsear
        if (!Array.isArray(fechaPlanilla)) {
          const fechaObj = new Date(fechaPlanilla);
          if (!isNaN(fechaObj.getTime())) {
            return fechaObj.toLocaleDateString('en-CA', { timeZone: zonaHorariaLocal });
          }
        }
      }

      // Si es un objeto Date o timestamp
      if (fechaPlanilla instanceof Date || typeof fechaPlanilla === 'number') {
        const fechaObj = new Date(fechaPlanilla);
        if (!isNaN(fechaObj.getTime())) {
          return fechaObj.toLocaleDateString('en-CA', { timeZone: zonaHorariaLocal });
        }
      }

      // Si es un array (formato [year, month, day, hour, minute, second])
      // Los arrays del backend representan fechas UTC
      if (Array.isArray(fechaPlanilla)) {
        const [year, month, day] = fechaPlanilla;
        // Crear fecha UTC y convertir a zona horaria local para obtener la fecha correcta
        const fechaUTC = new Date(Date.UTC(year, month - 1, day));
        
        // Convertir a zona horaria local usando toLocaleDateString
        const fechaLocal = fechaUTC.toLocaleDateString('en-CA', { timeZone: zonaHorariaLocal }); // formato YYYY-MM-DD
        return fechaLocal;
      }

      console.error('Formato de fecha no reconocido:', fechaPlanilla, 'tipo:', typeof fechaPlanilla);
      return 'Fecha inválida';
    } catch (error) {
      console.error('Error procesando fecha:', fechaPlanilla, error);
      return 'Fecha inválida';
    }
  };

  useEffect(() => {
    console.log('🔍 [DEBUG] useEffect principal ejecutado');
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('🔍 [DEBUG] No hay token, redirigiendo a login');
      navigate('/admin/login');
      return;
    }
    
    // Solo cargar datos una vez cuando el componente se monta
    if (!datosCargadosRef.current) {
      console.log('🔍 [DEBUG] Cargando datos por primera vez');
      cargarDatos();
      datosCargadosRef.current = true;
    } else {
      console.log('🔍 [DEBUG] Datos ya cargados, saltando carga');
    }
  }, []);

  // Manejar teclas globales para abrir modal con Enter
  const manejarTeclasGlobales = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      // Verificar que no esté en un input o textarea
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        navigate('/admin/crear-devolucion');
      }
    }
  };

  // Agregar y remover event listener para teclas globales
  useEffect(() => {
    document.addEventListener('keydown', manejarTeclasGlobales);
    return () => {
      document.removeEventListener('keydown', manejarTeclasGlobales);
    };
  }, [navigate]);

  // Manejar tecla Escape para cerrar modales o volver a la vista principal
  useEffect(() => {
    const manejarEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Si hay un modal de productos perdidos abierto, cerrarlo
        if (modalProductosPerdidos) {
          setModalProductosPerdidos(null);
          return;
        }
        
        // Si hay una planilla seleccionada (modal de detalle), cerrarla
        if (planillaSeleccionada) {
          setPlanillaSeleccionada(null);
          return;
        }
        
        // Si no hay modales abiertos, volver a la vista principal
        navigate('/admin/gestion-empresa');
      }
    };

    document.addEventListener('keydown', manejarEscape);
    return () => {
      document.removeEventListener('keydown', manejarEscape);
    };
  }, [navigate, modalProductosPerdidos, planillaSeleccionada]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      await cargarPlanillas();
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  const cargarPlanillas = async () => {
    try {
      console.log('🔍 Cargando planillas...');
      const response = await ApiService.obtenerPlanillasDevolucion();
      console.log('🔍 Respuesta del backend:', response);
      console.log('🔍 Tipo de respuesta:', typeof response);
      console.log('🔍 Es array?', Array.isArray(response));
      
      // El backend retorna directamente el array de planillas
      if (response && Array.isArray(response)) {
        setPlanillas(response);
        console.log('🔍 Planillas cargadas:', response.length);
        console.log('🔍 Primera planilla:', response[0]);
      } else if (response && response.data && Array.isArray(response.data)) {
        setPlanillas(response.data);
        console.log('🔍 Planillas cargadas desde response.data:', response.data.length);
      } else {
        console.log('🔍 No se encontraron planillas, estableciendo array vacío');
        setPlanillas([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar planillas:', error);
      toast.error('Error al cargar las planillas');
      setPlanillas([]);
    }
  };

  const abrirModalCrear = () => {
    navigate('/admin/crear-devolucion');
  };

  const filtrarPlanillas = () => {
    let planillasFiltradas = planillas;

    // Filtrar por fecha
    if (filtroFecha) {
      planillasFiltradas = planillasFiltradas.filter(p => 
        obtenerFechaPlanillaString(p.fechaPlanilla) === filtroFecha
      );
    }

    // Filtrar por búsqueda
    if (filtroBusqueda) {
      planillasFiltradas = planillasFiltradas.filter(p => {
        const busqueda = filtroBusqueda.toLowerCase();
        
        // Buscar en número de planilla y observaciones
        const coincideBasico = p.numeroPlanilla.toLowerCase().includes(busqueda) ||
                              (p.observaciones && p.observaciones.toLowerCase().includes(busqueda));
        
        // Buscar en detalles de productos (nombre, código personalizado, código de barras)
        const coincideEnProductos = p.detalles && p.detalles.some(detalle => 
          detalle.descripcion.toLowerCase().includes(busqueda) ||
          (detalle.numeroPersonalizado && detalle.numeroPersonalizado.toLowerCase().includes(busqueda))
        );
        
        return coincideBasico || coincideEnProductos;
      });
    }

    return planillasFiltradas;
  };

  const agruparPlanillasPorFecha = () => {
    const planillasFiltradas = filtrarPlanillas();
    const grupos: { [fecha: string]: PlanillaDevolucion[] } = {};
    
    planillasFiltradas.forEach(planilla => {
      // Extraer solo la parte de la fecha (YYYY-MM-DD) del LocalDateTime
      const fecha = obtenerFechaPlanillaString(planilla.fechaPlanilla);
      if (!grupos[fecha]) {
        grupos[fecha] = [];
      }
      grupos[fecha].push(planilla);
    });
    
    return Object.entries(grupos)
      .sort(([fechaA], [fechaB]) => new Date(fechaB).getTime() - new Date(fechaA).getTime())
      .map(([fecha, planillas]) => ({
        fecha,
        planillas: planillas.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())
      }));
  };

  const gruposPorFecha = agruparPlanillasPorFecha();

  const obtenerFechaActual = () => {
    const hoy = new Date();
    const zonaHorariaLocal = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fechaActual = hoy.toLocaleDateString('en-CA', { timeZone: zonaHorariaLocal }); // formato YYYY-MM-DD
    console.log('🔍 [DEBUG] obtenerFechaActual:', {
      hoy: hoy.toISOString(),
      zonaHorariaLocal,
      fechaActual
    });
    return fechaActual;
  };

  const formatearFechaConHoy = (fechaPlanilla: any, formato: 'corta' | 'completa' = 'corta') => {
    const fechaPlanillaString = obtenerFechaPlanillaString(fechaPlanilla);
    const fechaActual = obtenerFechaActual();
    const esHoy = fechaPlanillaString === fechaActual;
    
    console.log('🔍 [DEBUG] formatearFechaConHoy:', {
      fechaPlanilla,
      fechaPlanillaString,
      fechaActual,
      esHoy,
      formato
    });
    
    if (esHoy) {
      return 'Hoy';
    }
    
    return formato === 'corta' ? formatearFechaCorta(fechaPlanilla) : formatearFecha(fechaPlanilla);
  };

  const formatearFechaGrupoConHoy = (fecha: string) => {
    const fechaActual = obtenerFechaActual();
    const esHoy = fecha === fechaActual;
    console.log('🔍 [DEBUG] formatearFechaGrupoConHoy:', {
      fecha,
      fechaActual,
      esHoy
    });
    return esHoy ? 'Hoy' : formatearFecha(fecha);
  };

  // Función helper para formatear solo fecha de productos perdidos (sin hora)
  const formatearFechaProductosPerdidos = (fechaString: any): string => {
    try {
      if (fechaString == null) {
        return 'N/A';
      }

      // Si es un array (formato [year, month, day, hour, minute, second])
      if (Array.isArray(fechaString)) {
        const [year, month, day] = fechaString;
        
        // Crear fecha local solo con año, mes y día
        const fechaLocal = new Date(year, month - 1, day);
        
        if (isNaN(fechaLocal.getTime())) {
          return 'Fecha inválida';
        }
        
        // Mostrar solo fecha sin hora
        return fechaLocal.toLocaleDateString('es-AR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      }

      // Si es un string ISO, extraer solo la fecha
      if (typeof fechaString === 'string' && fechaString.includes('T')) {
        const fechaParte = fechaString.split('T')[0]; // Solo la parte de fecha
        const [year, month, day] = fechaParte.split('-').map(Number);
        
        // Crear fecha local solo con año, mes y día
        const fechaLocal = new Date(year, month - 1, day);
        
        if (isNaN(fechaLocal.getTime())) {
          return 'Fecha inválida';
        }
        
        // Mostrar solo fecha sin hora
        return fechaLocal.toLocaleDateString('es-AR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      }

      // Para otros tipos, usar formatearFecha que solo muestra fecha
      return formatearFecha(fechaString);
    } catch (error) {
      console.error('Error formateando fecha de productos perdidos:', error);
      return 'Fecha inválida';
    }
  };

  const estaDiaExpandido = (fecha: string) => {
    const fechaActual = obtenerFechaActual();
    
    // Si hay filtros activos, expandir automáticamente los días que tienen planillas filtradas
    if (filtroFecha || filtroBusqueda) {
      return true;
    }
    
    // Si es el día actual, está expandido por defecto pero puede cerrarse
    if (fecha === fechaActual) {
      return !diasExpandidos.has(fecha); // Si está en el set, significa que se cerró manualmente
    }
    return diasExpandidos.has(fecha);
  };

  const alternarExpansionDia = (fecha: string) => {
    setDiasExpandidos(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(fecha)) {
        nuevo.delete(fecha);
      } else {
        nuevo.add(fecha);
      }
      return nuevo;
    });
  };

  const exportarPlanilla = async (planilla: PlanillaDevolucion) => {
    try {
      const blob = await ApiService.exportarPlanillaDevolucion(planilla.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Planilla_${planilla.numeroPlanilla}_${planilla.fechaPlanilla}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Planilla exportada exitosamente');
    } catch (error) {
      console.error('Error al exportar planilla:', error);
      toast.error('Error al exportar la planilla');
    }
  };

  const verificarPlanilla = (planilla: PlanillaDevolucion) => {
    console.log('🔍 [DEBUG] Verificando planilla:', planilla);
    console.log('🔍 [DEBUG] Estado de la planilla:', planilla.estado);
    console.log('🔍 [DEBUG] ID de la planilla:', planilla.id);
    
    if (planilla.estado === 'PENDIENTE_VERIFICACION') {
      const ruta = `/admin/verificar-devolucion/${planilla.id}`;
      console.log('🔍 [DEBUG] Navegando a:', ruta);
      // Navegar a la página de verificación
      navigate(ruta);
    } else {
      console.log('🔍 [DEBUG] Planilla ya verificada, mostrando error');
      toast.error('Esta planilla ya ha sido verificada');
    }
  };

  const obtenerProductosPerdidos = async (fecha: string) => {
    try {
      setCargandoProductosPerdidos(true);
      const productos = await ApiService.obtenerProductosPerdidos(fecha);
      // Filtrar solo productos de devoluciones
      const productosDevoluciones = productos.filter(p => p.tipo === 'DEVOLUCION');
      setProductosPerdidos(productosDevoluciones);
      setModalProductosPerdidos(fecha);
    } catch (error) {
      console.error('Error al obtener productos perdidos:', error);
      toast.error('Error al obtener productos perdidos');
    } finally {
      setCargandoProductosPerdidos(false);
    }
  };

  const obtenerResumenProductos = async (fecha: string) => {
    try {
      setCargandoResumen(true);
      // Obtener todas las planillas del día
      const planillasDelDia = planillas.filter(p => {
        const fechaPlanilla = obtenerFechaPlanillaString(p.fechaPlanilla);
        return fechaPlanilla === fecha;
      });

      // Agrupar productos por descripción y manejar estados correctamente
      const productosAgrupados = new Map();
      
      planillasDelDia.forEach(planilla => {
        planilla.detalles.forEach(detalle => {
          const key = detalle.descripcion;
          const estado = detalle.estadoProducto || 'BUEN_ESTADO';
          
          if (productosAgrupados.has(key)) {
            const producto = productosAgrupados.get(key);
            producto.planillas.add(planilla.numeroPlanilla);
            
            // Solo sumar productos en buen estado (que ingresan al stock)
            if (estado === 'BUEN_ESTADO') {
              producto.cantidadBuenEstado += detalle.cantidad;
              producto.cantidadTotal += detalle.cantidad;
            } else {
              // Los productos rotos/mal estado no suman al stock
              producto.cantidadRotoMalEstado += detalle.cantidad;
              producto.cantidadTotal += 0; // No suman al stock
            }
            
            // Actualizar contadores por estado
            if (!producto.estados) {
              producto.estados = {};
            }
            producto.estados[estado] = (producto.estados[estado] || 0) + detalle.cantidad;
          } else {
            productosAgrupados.set(key, {
              descripcion: detalle.descripcion,
              numeroPersonalizado: detalle.numeroPersonalizado,
              cantidadBuenEstado: estado === 'BUEN_ESTADO' ? detalle.cantidad : 0,
              cantidadRotoMalEstado: estado !== 'BUEN_ESTADO' ? detalle.cantidad : 0,
              cantidadTotal: estado === 'BUEN_ESTADO' ? detalle.cantidad : 0,
              planillas: new Set([planilla.numeroPlanilla]),
              estados: {
                [estado]: detalle.cantidad
              }
            });
          }
        });
      });

      // Convertir a array y ordenar por cantidad total (solo productos en buen estado)
      const resumen = Array.from(productosAgrupados.values()).map(item => ({
        ...item,
        planillas: Array.from(item.planillas).sort()
      })).sort((a, b) => b.cantidadTotal - a.cantidadTotal);

      setResumenProductos(resumen);
      setModalResumenProductos(fecha);
    } catch (error) {
      console.error('Error al obtener resumen de productos:', error);
      toast.error('Error al obtener resumen de productos');
    } finally {
      setCargandoResumen(false);
    }
  };

  const eliminarPlanilla = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta planilla? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await ApiService.eliminarPlanillaDevolucion(id);
      toast.success('Planilla eliminada exitosamente');
      cargarPlanillas();
    } catch (error) {
      console.error('Error al eliminar planilla:', error);
      toast.error('Error al eliminar la planilla');
    }
  };

  if (cargando || !datosUsuario) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280', margin: 0 }}>Cargando planillas...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <NavbarAdmin
        onCerrarSesion={cerrarSesion}
        empresaNombre={datosUsuario.empresaNombre}
        nombreAdministrador={datosUsuario.nombre}
      />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: isMobile ? '8rem 1rem 1rem 1rem' : '7rem 2rem 2rem 2rem'
      }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: isMobile ? '16px' : '24px',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          border: '2px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            gap: '1rem'
          }}>
            <div>
              <h1 style={{
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: '700',
                color: '#1e293b',
                margin: '0 0 0.5rem 0'
              }}>
                🔄 Gestión de Retornos
              </h1>
              <p style={{
                color: '#64748b',
                margin: 0,
                fontSize: '1rem'
              }}>
                Gestiona las devoluciones y productos no entregados
              </p>
            </div>
            
                         <button
               onClick={abrirModalCrear}
               style={{
                 background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                 color: 'white',
                 border: 'none',
                 borderRadius: '12px',
                 padding: isMobile ? '12px 16px' : '0.75rem 1.5rem',
                 fontSize: isMobile ? '0.8rem' : '1rem',
                 fontWeight: '600',
                 cursor: 'pointer',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '0.5rem',
                 boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                 transition: 'all 0.2s ease',
                 justifyContent: 'center'
               }}
               onMouseEnter={(e) => {
                 if (!isMobile) {
                   e.currentTarget.style.transform = 'translateY(-2px)';
                   e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.4)';
                 }
               }}
               onMouseLeave={(e) => {
                 if (!isMobile) {
                   e.currentTarget.style.transform = 'translateY(0)';
                   e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
                 }
               }}
             >
               ➕ Crear Devolución
             </button>
          </div>

          {/* Filtros */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '2rem',
            flexWrap: isMobile ? 'wrap' : 'nowrap'
          }}>
            <div style={{ flex: 1, minWidth: isMobile ? '100%' : '200px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                📅 Filtrar por fecha
              </label>
                             <input
                 type="date"
                 value={filtroFecha}
                 onChange={(e) => setFiltroFecha(e.target.value)}
                 style={{
                   width: '100%',
                   padding: isMobile ? '12px' : '0.75rem',
                   border: '2px solid #d1d5db',
                   borderRadius: '8px',
                   fontSize: isMobile ? '0.75rem' : '1rem',
                   background: 'white'
                 }}
               />
            </div>
            
            <div style={{ flex: 1, minWidth: isMobile ? '100%' : '200px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                🔍 Buscar
              </label>
                             <input
                 type="text"
                 placeholder="Buscar por número de planilla, observaciones, nombre de producto o código..."
                 value={filtroBusqueda}
                 onChange={(e) => setFiltroBusqueda(e.target.value)}
                 style={{
                   width: '100%',
                   padding: isMobile ? '12px' : '0.75rem',
                   border: '2px solid #d1d5db',
                   borderRadius: '8px',
                   fontSize: isMobile ? '0.75rem' : '1rem',
                   background: 'white'
                 }}
               />
            </div>
          </div>


        </div>

                 {/* Lista de planillas */}
         <div style={{
           background: 'white',
           borderRadius: '16px',
           padding: isMobile ? '16px' : '24px',
           boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
           border: '2px solid #e2e8f0'
         }}>
          {planillas.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#64748b'
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem'
              }}>
                📋
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                No hay planillas de devolución
              </h3>
              <p style={{
                fontSize: '1rem',
                marginBottom: '2rem'
              }}>
                Comienza creando tu primera planilla de devolución
              </p>
              <button
                onClick={abrirModalCrear}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  padding: '1rem 2rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  margin: '0 auto'
                }}
              >
                ➕ Crear Primera Devolución
              </button>
            </div>
          ) : (
            <div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '2rem'
              }}>
                📋 Planillas de Devolución ({planillas.length})
              </h2>
              
              {gruposPorFecha.map((grupo) => (
                <div key={grupo.fecha} style={{ marginBottom: '2rem' }}>
                   <div style={{
                     background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                     color: 'white',
                     padding: isMobile ? '12px 16px' : '24px',
                     borderRadius: '16px',
                     marginBottom: '1rem',
                     boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                   }}>
                     {/* Header del día */}
                     <div
                       onClick={() => alternarExpansionDia(grupo.fecha)}
                       style={{
                         cursor: 'pointer',
                         display: 'flex',
                         justifyContent: 'space-between',
                         alignItems: 'center',
                         flexDirection: 'row',
                         gap: '0.5rem',
                         marginBottom: isMobile ? '8px' : '0'
                       }}
                     >
                       <div style={{
                         display: 'flex',
                         alignItems: 'center',
                         gap: isMobile ? '6px' : '1rem',
                         flex: 1
                       }}>
                         <span style={{ fontSize: isMobile ? '1.125rem' : '1.25rem' }}>📅</span>
                         <div style={{ flex: 1 }}>
                           <div style={{ 
                             fontWeight: '600', 
                             fontSize: isMobile ? '1rem' : '1.125rem',
                             lineHeight: '1.2'
                           }}>
                             {formatearFechaGrupoConHoy(grupo.fecha)}
                           </div>
                           <div style={{ 
                             fontSize: isMobile ? '0.875rem' : '0.875rem', 
                             opacity: 0.9,
                             lineHeight: '1.2'
                           }}>
                             {grupo.planillas.length} planillas • {grupo.planillas.reduce((total, p) => total + p.totalProductos, 0)} productos
                           </div>
                         </div>
                       </div>
                       <span style={{ 
                         fontSize: isMobile ? '1.25rem' : '1.5rem',
                         flexShrink: 0
                       }}>
                         {estaDiaExpandido(grupo.fecha) ? '▼' : '▶'}
                       </span>
                     </div>
                     
                     {/* Botones para ver productos perdidos y resumen */}
                     <div style={{
                       display: 'flex',
                       justifyContent: 'flex-end',
                       gap: '0.5rem',
                       marginTop: isMobile ? '6px' : '0',
                       flexWrap: 'wrap'
                     }}>
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           obtenerResumenProductos(grupo.fecha);
                         }}
                         disabled={cargandoResumen}
                         style={{
                           padding: '0.5rem 1rem',
                           background: 'rgba(255, 255, 255, 0.2)',
                           color: 'white',
                           border: '1px solid rgba(255, 255, 255, 0.3)',
                           borderRadius: '0.5rem',
                           fontSize: '0.875rem',
                           fontWeight: '600',
                           cursor: cargandoResumen ? 'not-allowed' : 'pointer',
                           opacity: cargandoResumen ? 0.6 : 1,
                           transition: 'all 0.2s ease',
                           display: 'flex',
                           alignItems: 'center',
                           gap: '0.5rem'
                         }}
                         onMouseOver={(e) => {
                           if (!cargandoResumen) {
                             e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                             e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                           }
                         }}
                         onMouseOut={(e) => {
                           if (!cargandoResumen) {
                             e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                             e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                           }
                         }}
                       >
                         {cargandoResumen ? '⏳' : '📊'} Ver Resumen
                       </button>
                       
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           obtenerProductosPerdidos(grupo.fecha);
                         }}
                         disabled={cargandoProductosPerdidos}
                         style={{
                           padding: '0.5rem 1rem',
                           background: 'rgba(255, 255, 255, 0.2)',
                           color: 'white',
                           border: '1px solid rgba(255, 255, 255, 0.3)',
                           borderRadius: '0.5rem',
                           fontSize: '0.875rem',
                           fontWeight: '600',
                           cursor: cargandoProductosPerdidos ? 'not-allowed' : 'pointer',
                           opacity: cargandoProductosPerdidos ? 0.6 : 1,
                           transition: 'all 0.2s ease',
                           display: 'flex',
                           alignItems: 'center',
                           gap: '0.5rem'
                         }}
                         onMouseOver={(e) => {
                           if (!cargandoProductosPerdidos) {
                             e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                             e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                           }
                         }}
                         onMouseOut={(e) => {
                           if (!cargandoProductosPerdidos) {
                             e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                             e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                           }
                         }}
                       >
                         {cargandoProductosPerdidos ? '⏳' : '💔'} Ver Productos Perdidos
                       </button>
                     </div>
                   </div>
                   
                   {estaDiaExpandido(grupo.fecha) && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem'
                    }}>
                      {grupo.planillas.map((planilla) => (
                        <div key={planilla.id} style={{
                          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                          borderRadius: '16px',
                          border: '2px solid #e2e8f0',
                          padding: isMobile ? '16px' : '24px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          if (!isMobile) {
                            e.currentTarget.style.borderColor = '#f59e0b';
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,158,11,0.15)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isMobile) {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }
                        }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '1rem',
                            flexWrap: isMobile ? 'wrap' : 'nowrap',
                            gap: '1rem'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.5rem'
                              }}>
                                <span style={{
                                  background: '#f59e0b',
                                  color: 'white',
                                  padding: isMobile ? '0.5rem 1rem' : '0.25rem 0.75rem',
                                  borderRadius: '1rem',
                                  fontSize: isMobile ? '0.875rem' : '0.75rem',
                                  fontWeight: '600'
                                }}>
                                  📋 {planilla.numeroPlanilla}
                                </span>
                                <span style={{
                                  background: '#059669',
                                  color: 'white',
                                  padding: isMobile ? '0.5rem 1rem' : '0.25rem 0.75rem',
                                  borderRadius: '1rem',
                                  fontSize: isMobile ? '0.875rem' : '0.75rem',
                                  fontWeight: '600'
                                }}>
                                  {formatearFechaConHoy(planilla.fechaPlanilla, 'corta')}
                                </span>
                              </div>
                              
                              <div style={{
                                display: 'flex',
                                flexDirection: isMobile ? 'column' : 'row',
                                flexWrap: 'wrap',
                                gap: isMobile ? '8px' : '1rem',
                                fontSize: isMobile ? '1rem' : '0.875rem',
                                color: '#64748b'
                              }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  fontSize: isMobile ? '1rem' : '0.875rem'
                                }}>
                                  📦 <span style={{
                                    color: '#059669', 
                                    fontWeight: '700'
                                  }}>
                                    {planilla.totalProductos}
                                  </span> unidades
                                </div>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  fontSize: isMobile ? '1rem' : '0.875rem'
                                }}>
                                  🛒 {planilla.detalles.length} productos
                                </div>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  fontSize: isMobile ? '1rem' : '0.875rem'
                                }}>
                                  ⏰ {formatearFechaConHora(planilla.fechaPlanilla)}
                                </div>
                                <span style={{
                                  background: obtenerColorEstado(planilla.estado),
                                  color: 'white',
                                  padding: isMobile ? '0.375rem 0.75rem' : '0.125rem 0.5rem',
                                  borderRadius: '0.5rem',
                                  fontSize: isMobile ? '0.875rem' : '0.75rem',
                                  fontWeight: '600',
                                  display: 'inline-block',
                                  width: 'fit-content'
                                }}>
                                  {obtenerTextoEstado(planilla.estado)}
                                </span>
                              </div>
                            </div>
                            <div style={{
                              display: 'flex',
                              gap: isMobile ? '8px' : '0.5rem',
                              flexDirection: 'row',
                              flexWrap: 'wrap',
                              width: isMobile ? '100%' : 'auto'
                            }}>
                              <button
                                onClick={() => exportarPlanilla(planilla)}
                                style={{
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.75rem',
                                  padding: isMobile ? '12px 16px' : '0.5rem 1rem',
                                  fontSize: isMobile ? '0.875rem' : '0.75rem',
                                  fontWeight: isMobile ? '600' : '500',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  justifyContent: 'center',
                                  width: isMobile ? 'calc(50% - 4px)' : 'auto',
                                  minHeight: isMobile ? '44px' : 'auto',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                📄 Exportar
                              </button>
                              
                              <button
                                onClick={() => setPlanillaSeleccionada(planilla)}
                                style={{
                                  background: '#059669',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.75rem',
                                  padding: isMobile ? '12px 16px' : '0.5rem 1rem',
                                  fontSize: isMobile ? '0.875rem' : '0.75rem',
                                  fontWeight: isMobile ? '600' : '500',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  justifyContent: 'center',
                                  width: isMobile ? 'calc(50% - 4px)' : 'auto',
                                  minHeight: isMobile ? '44px' : 'auto',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                👁️ Ver
                              </button>
                              
                              {planilla.estado === 'PENDIENTE_VERIFICACION' && (
                                <button
                                  onClick={() => verificarPlanilla(planilla)}
                                  style={{
                                    background: '#f59e0b',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.75rem',
                                    padding: isMobile ? '12px 16px' : '0.5rem 1rem',
                                    fontSize: isMobile ? '0.875rem' : '0.75rem',
                                    fontWeight: isMobile ? '600' : '500',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    justifyContent: 'center',
                                    width: isMobile ? 'calc(50% - 4px)' : 'auto',
                                    minHeight: isMobile ? '44px' : 'auto',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  ✅ Verificar
                                </button>
                              )}
                              
                              <button
                                onClick={() => eliminarPlanilla(planilla.id)}
                                style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.75rem',
                                  padding: isMobile ? '12px 16px' : '0.5rem 1rem',
                                  fontSize: isMobile ? '0.875rem' : '0.75rem',
                                  fontWeight: isMobile ? '600' : '500',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  justifyContent: 'center',
                                  width: isMobile ? 'calc(50% - 4px)' : 'auto',
                                  minHeight: isMobile ? '44px' : 'auto',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                🗑️ Eliminar
                              </button>
                            </div>
                          </div>
                          
                          {(planilla.observaciones || planilla.transporte) && (
                            <div style={{
                              background: '#f8fafc',
                              borderRadius: '0.5rem',
                              padding: '0.75rem',
                              marginBottom: '1rem',
                              border: '1px solid #e2e8f0'
                            }}>
                              <p style={{
                                color: '#64748b',
                                fontSize: '0.875rem',
                                margin: 0,
                                fontStyle: 'italic'
                              }}>
                                {planilla.transporte && (
                                  <div style={{ marginRight: '1rem' }}>
                                    <span style={{ display: 'block' }}>
                                      🚛 {planilla.transporte}
                                    </span>
                                    {(() => {
                                      // Extraer patente del texto de transporte
                                      const patenteMatch = planilla.transporte?.match(/\(([^)]* - ([^)]+))\)/);
                                      if (patenteMatch && patenteMatch[2]) {
                                        return (
                                          <span style={{
                                            color: '#059669',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            display: 'block',
                                            marginTop: '0.25rem'
                                          }}>
                                            🚗 Patente: {patenteMatch[2]}
                                          </span>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                )}
                                {planilla.observaciones && (
                                  <span>
                                    💬 {planilla.observaciones}
                                  </span>
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Detalles de Planilla */}
      {planillaSeleccionada && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}
        onClick={() => {
          setPlanillaSeleccionada(null);
          // Si había un resumen abierto anteriormente, volver a abrirlo
          if (fechaResumenAnterior) {
            setModalResumenProductos(fechaResumenAnterior);
            setFechaResumenAnterior(null);
          }
        }}
        >
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '2rem'
            }}>
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 0.5rem 0'
                }}>
                  📋 Detalles de la Planilla
                </h2>
                                 <p style={{
                   color: '#64748b',
                   margin: 0
                 }}>
                   {planillaSeleccionada.numeroPlanilla} • {formatearFecha(planillaSeleccionada.fechaPlanilla)}
                 </p>
              </div>
              <button
                onClick={() => {
                  setPlanillaSeleccionada(null);
                  // Si había un resumen abierto anteriormente, volver a abrirlo
                  if (fechaResumenAnterior) {
                    setModalResumenProductos(fechaResumenAnterior);
                    setFechaResumenAnterior(null);
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '0.5rem'
                }}
              >
                ✕
              </button>
            </div>

            {/* Información de la planilla */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              <div>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#64748b',
                  display: 'block',
                  marginBottom: '0.25rem'
                }}>
                  Número de Planilla
                </label>
                <p style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: 0
                }}>
                  {planillaSeleccionada.numeroPlanilla}
                </p>
              </div>
              <div>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#64748b',
                  display: 'block',
                  marginBottom: '0.25rem'
                }}>
                  Fecha de Planilla
                </label>
                                 <p style={{
                   fontSize: '1rem',
                   color: '#1e293b',
                   margin: 0
                 }}>
                   {formatearFecha(planillaSeleccionada.fechaPlanilla)}
                 </p>
              </div>
              <div>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#64748b',
                  display: 'block',
                  marginBottom: '0.25rem'
                }}>
                  Total de Unidades
                </label>
                <p style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#059669',
                  margin: 0
                }}>
                  {planillaSeleccionada.totalProductos}
                </p>
              </div>
              <div>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#64748b',
                  display: 'block',
                  marginBottom: '0.25rem'
                }}>
                  Productos Diferentes
                </label>
                <p style={{
                  fontSize: '1rem',
                  color: '#1e293b',
                  margin: 0
                }}>
                  {planillaSeleccionada.detalles.length}
                </p>
              </div>
                                           {(planillaSeleccionada.observaciones || planillaSeleccionada.transporte) && (
                <div style={{ marginTop: '1rem' }}>
                  <label style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#64748b',
                    display: 'block',
                    marginBottom: '0.25rem'
                  }}>
                    Información Adicional
                  </label>
                  <div style={{
                    fontSize: '1rem',
                    color: '#1e293b',
                    margin: 0,
                    fontStyle: 'italic'
                  }}>
                    {planillaSeleccionada.transporte && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        🚛 <strong>Transporte:</strong> {planillaSeleccionada.transporte}
                        {(() => {
                          // Extraer patente del texto de transporte
                          const patenteMatch = planillaSeleccionada.transporte?.match(/\(([^)]* - ([^)]+))\)/);
                          if (patenteMatch && patenteMatch[2]) {
                            return (
                              <div style={{
                                marginTop: '0.5rem',
                                padding: '0.5rem',
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: '0.375rem'
                              }}>
                                <span style={{
                                  color: '#059669',
                                  fontSize: '0.75rem',
                                  fontWeight: '600'
                                }}>
                                  🚗 Patente: {patenteMatch[2]}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}
                    {planillaSeleccionada.observaciones && (
                      <div>
                        💬 <strong>Observaciones:</strong> {planillaSeleccionada.observaciones}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Lista de productos */}
            <div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 1rem 0'
              }}>
                📦 Productos de la Planilla
              </h3>
              <div style={{
                background: 'white',
                borderRadius: '0.75rem',
                border: '1px solid #e2e8f0',
                overflow: 'hidden'
              }}>
                {planillaSeleccionada.detalles.map((detalle, index) => (
                  <div
                    key={detalle.id}
                    style={{
                      padding: '1rem',
                      borderBottom: index < planillaSeleccionada.detalles.length - 1 ? '1px solid #f1f5f9' : 'none',
                      background: index % 2 === 0 ? 'white' : '#f8fafc'
                    }}
                  >
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
                      gap: '1rem',
                      alignItems: 'center'
                    }}>
                      <div>
                        {detalle.numeroPersonalizado && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#2563eb',
                            fontWeight: '600',
                            marginBottom: '0.25rem'
                          }}>
                            Código: {detalle.numeroPersonalizado}
                          </div>
                        )}
                        <div style={{
                          fontWeight: '600',
                          color: '#1e293b',
                          fontSize: '0.875rem',
                          marginBottom: '0.25rem'
                        }}>
                          {detalle.descripcion}
                        </div>
                      </div>
                      <div>
                        <div style={{
                          textAlign: isMobile ? 'left' : 'right'
                        }}>
                          <div style={{
                            fontSize: '1.25rem',
                            fontWeight: '700',
                            color: '#059669'
                          }}>
                            {detalle.cantidad}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#64748b'
                          }}>
                            unidades
                          </div>
                          {detalle.estadoProducto && (
                            <div style={{
                              marginTop: '0.25rem',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              color: 'white',
                              background: detalle.estadoProducto === 'BUEN_ESTADO' ? '#10b981' :
                                         detalle.estadoProducto === 'ROTO' ? '#ef4444' :
                                         detalle.estadoProducto === 'MAL_ESTADO' ? '#f59e0b' :
                                         detalle.estadoProducto === 'DEFECTUOSO' ? '#dc2626' : '#6b7280',
                              textAlign: 'center'
                            }}>
                              {detalle.estadoProducto === 'BUEN_ESTADO' ? 'Buen Estado' :
                               detalle.estadoProducto === 'ROTO' ? 'Roto' :
                               detalle.estadoProducto === 'MAL_ESTADO' ? 'Mal Estado' :
                               detalle.estadoProducto === 'DEFECTUOSO' ? 'Defectuoso' : detalle.estadoProducto}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {detalle.observaciones && (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.5rem',
                        background: '#f8fafc',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        color: '#64748b',
                        fontStyle: 'italic'
                      }}>
                        💬 {detalle.observaciones}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de acción */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '2rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => exportarPlanilla(planillaSeleccionada)}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                📄 Exportar Planilla
              </button>
              <button
                onClick={() => {
                  setPlanillaSeleccionada(null);
                  // Si había un resumen abierto anteriormente, volver a abrirlo
                  if (fechaResumenAnterior) {
                    setModalResumenProductos(fechaResumenAnterior);
                    setFechaResumenAnterior(null);
                  }
                }}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Productos Perdidos */}
      {modalProductosPerdidos && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: isMobile ? '1rem' : '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            width: '100%',
            maxWidth: isMobile ? '100%' : '800px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            animation: 'modalSlideIn 0.3s ease-out'
          }}>
            {/* Header del modal */}
            <div style={{
              padding: isMobile ? '1rem' : '1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
              color: 'white',
              borderRadius: '1rem 1rem 0 0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{ fontSize: isMobile ? '1.5rem' : '2rem' }}>🔄</div>
                <div>
                  <h2 style={{
                    margin: 0,
                    fontSize: isMobile ? '1.125rem' : '1.25rem',
                    fontWeight: '700'
                  }}>
                    Productos Perdidos en Devoluciones - {formatearFecha(modalProductosPerdidos)}
                  </h2>
                  <p style={{
                    margin: 0,
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    opacity: 0.9
                  }}>
                    Productos en mal estado, rotos o defectuosos de devoluciones
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalProductosPerdidos(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '1.5rem',
                  width: '2.5rem',
                  height: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                ×
              </button>
            </div>

            {/* Contenido del modal */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: isMobile ? '1rem' : '1.5rem'
            }}>
              {productosPerdidos.length > 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  {productosPerdidos.map((producto, index) => (
                    <div key={index} style={{
                      background: '#fffbeb',
                      border: '1px solid #fbbf24',
                      borderRadius: '0.75rem',
                      padding: isMobile ? '1rem' : '1.25rem',
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '0.75rem'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: isMobile ? '1rem' : '1.125rem',
                            fontWeight: '600',
                            color: '#1e293b',
                            marginBottom: '0.25rem'
                          }}>
                            {producto.nombre}
                          </div>
                          <div style={{
                            fontSize: isMobile ? '0.875rem' : '1rem',
                            color: '#64748b',
                            marginBottom: '0.5rem'
                          }}>
                            Código: {producto.numeroPersonalizado || 'N/A'}
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: '0.25rem'
                        }}>
                          <div style={{
                            fontSize: isMobile ? '1.25rem' : '1.5rem',
                            fontWeight: '700',
                            color: '#dc2626'
                          }}>
                            -{producto.cantidad}
                          </div>
                          <div style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.375rem',
                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                            fontWeight: '600',
                            color: 'white',
                            background: producto.estado === 'ROTO' ? '#ef4444' :
                                       producto.estado === 'MAL_ESTADO' ? '#f59e0b' :
                                       producto.estado === 'DEFECTUOSO' ? '#dc2626' : '#6b7280'
                          }}>
                            {producto.estadoDescripcion}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: isMobile ? '0.8rem' : '0.875rem',
                        color: '#64748b'
                      }}>
                        <div>
                          <span style={{ fontWeight: '600' }}>Planilla:</span> {producto.numeroDocumento}
                        </div>
                        <div>
                          {formatearFechaProductosPerdidos(producto.fechaCreacion)}
                        </div>
                      </div>
                      
                      {producto.observaciones && (
                        <div style={{
                          marginTop: '0.75rem',
                          padding: '0.75rem',
                          background: '#fef3c7',
                          borderRadius: '0.5rem',
                          fontSize: isMobile ? '0.8rem' : '0.875rem',
                          color: '#92400e'
                        }}>
                          <span style={{ fontWeight: '600' }}>Observaciones:</span> {producto.observaciones}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: isMobile ? '2rem' : '3rem',
                  color: '#64748b'
                }}>
                  <div style={{ fontSize: isMobile ? '3rem' : '4rem', marginBottom: '1rem' }}>
                    ✅
                  </div>
                  <h3 style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: isMobile ? '1.125rem' : '1.25rem',
                    fontWeight: '600'
                  }}>
                    ¡Excelente!
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: isMobile ? '1rem' : '1.125rem'
                  }}>
                    No se registraron productos perdidos en devoluciones para esta fecha
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de resumen de productos */}
      {modalResumenProductos && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
          animation: 'modalSlideIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: isMobile ? '95%' : '800px',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: isMobile ? '20px' : '24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '600',
                color: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📊 Resumen de Productos - {formatearFechaGrupoConHoy(modalResumenProductos)}
              </h2>
              <button
                onClick={() => setModalResumenProductos(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.color = '#1e293b';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{
              padding: isMobile ? '16px' : '24px',
              overflow: 'auto',
              flex: 1
            }}>
              {resumenProductos.length > 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  {resumenProductos.map((producto, index) => (
                    <div key={index} style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.75rem',
                      padding: isMobile ? '1rem' : '1.25rem',
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '0.75rem'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: isMobile ? '1rem' : '1.125rem',
                            fontWeight: '600',
                            color: '#1e293b',
                            marginBottom: '0.25rem'
                          }}>
                            {producto.descripcion}
                          </div>
                          {producto.numeroPersonalizado && (
                            <div style={{
                              fontSize: isMobile ? '0.875rem' : '1rem',
                              color: '#64748b',
                              marginBottom: '0.5rem'
                            }}>
                              Código: {producto.numeroPersonalizado}
                            </div>
                          )}
                        </div>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: '0.25rem'
                        }}>
                          <div style={{
                            fontSize: isMobile ? '1.25rem' : '1.5rem',
                            fontWeight: '700',
                            color: '#059669'
                          }}>
                            +{producto.cantidadTotal}
                          </div>
                          <div style={{
                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                            color: '#64748b',
                            textAlign: 'right'
                          }}>
                            Ingresado al stock
                          </div>
                        </div>
                      </div>
                      
                      <div style={{
                        fontSize: isMobile ? '0.8rem' : '0.875rem',
                        color: '#64748b',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{ fontWeight: '600' }}>Planillas:</span>{' '}
                        {producto.planillas.map((numeroPlanilla, index) => (
                          <span key={numeroPlanilla}>
                            <button
                              onClick={() => {
                                // Buscar la planilla por número y abrir el modal de detalles
                                const planilla = planillas.find(p => p.numeroPlanilla === numeroPlanilla);
                                if (planilla) {
                                  // Recordar la fecha del resumen para volver a abrirlo después
                                  setFechaResumenAnterior(modalResumenProductos);
                                  // Cerrar el modal del resumen primero
                                  setModalResumenProductos(null);
                                  // Abrir el modal de detalles
                                  setPlanillaSeleccionada(planilla);
                                }
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#f59e0b',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                fontSize: isMobile ? '0.8rem' : '0.875rem',
                                fontWeight: '600',
                                padding: '0',
                                margin: '0'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.color = '#d97706';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.color = '#f59e0b';
                              }}
                            >
                              {numeroPlanilla}
                            </button>
                            {index < producto.planillas.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                      
                      {/* Desglose por estados */}
                      {producto.estados && Object.keys(producto.estados).length > 0 && (
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                          marginTop: '0.5rem'
                        }}>
                          {Object.entries(producto.estados).map(([estado, cantidad]) => {
                            const colorEstado = estado === 'BUEN_ESTADO' ? '#10b981' :
                                             estado === 'ROTO' ? '#ef4444' :
                                             estado === 'MAL_ESTADO' ? '#f59e0b' :
                                             estado === 'DEFECTUOSO' ? '#8b5cf6' : '#6b7280';
                            
                            const textoEstado = estado === 'BUEN_ESTADO' ? 'Bueno' :
                                              estado === 'ROTO' ? 'Roto' :
                                              estado === 'MAL_ESTADO' ? 'Mal Estado' :
                                              estado === 'DEFECTUOSO' ? 'Defectuoso' : estado;
                            
                            return (
                              <span
                                key={estado}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '0.375rem',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  color: 'white',
                                  background: colorEstado
                                }}
                              >
                                {textoEstado}: {cantidad}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: isMobile ? '2rem' : '3rem',
                  color: '#64748b'
                }}>
                  <div style={{ fontSize: isMobile ? '3rem' : '4rem', marginBottom: '1rem' }}>
                    📦
                  </div>
                  <h3 style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: isMobile ? '1.125rem' : '1.25rem',
                    fontWeight: '600'
                  }}>
                    No hay productos
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: isMobile ? '1rem' : '1.125rem'
                  }}>
                    No se encontraron productos en las devoluciones de esta fecha
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
