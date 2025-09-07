import React, { useState, useEffect } from 'react';
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
}

interface DetallePlanillaDevolucion {
  id: number;
  productoId?: number;
  codigoPersonalizado?: string;
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
  
  const [planillas, setPlanillas] = useState<PlanillaDevolucion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [planillaSeleccionada, setPlanillaSeleccionada] = useState<PlanillaDevolucion | null>(null);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [diasExpandidos, setDiasExpandidos] = useState<Set<string>>(new Set());

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
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    if (datosUsuario) {
      cargarDatos();
    }
  }, [navigate, datosUsuario]);

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

  // Manejar tecla Escape para volver a la vista principal
  useEffect(() => {
    const manejarEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/admin/gestion-empresa');
      }
    };

    document.addEventListener('keydown', manejarEscape);
    return () => {
      document.removeEventListener('keydown', manejarEscape);
    };
  }, [navigate]);

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
      planillasFiltradas = planillasFiltradas.filter(p =>
        p.numeroPlanilla.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
        (p.observaciones && p.observaciones.toLowerCase().includes(filtroBusqueda.toLowerCase()))
      );
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
                 placeholder="Buscar por número de planilla o observaciones..."
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
                                     <div
                     onClick={() => alternarExpansionDia(grupo.fecha)}
                     style={{
                       background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                       color: 'white',
                       padding: isMobile ? '16px' : '24px',
                       borderRadius: '16px',
                       cursor: 'pointer',
                       display: 'flex',
                       justifyContent: 'space-between',
                       alignItems: 'center',
                       flexDirection: isMobile ? 'column' : 'row',
                       gap: isMobile ? '12px' : '0',
                       marginBottom: '1rem',
                       boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                     }}
                   >
                                         <div style={{
                       display: 'flex',
                       alignItems: 'center',
                       gap: isMobile ? '8px' : '1rem'
                     }}>
                       <span style={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>📅</span>
                       <div>
                         <div style={{ fontWeight: '600', fontSize: isMobile ? '1rem' : '1.125rem' }}>
                           {formatearFechaGrupoConHoy(grupo.fecha)}
                         </div>
                         <div style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', opacity: 0.9 }}>
                           {grupo.planillas.length} planillas • {grupo.planillas.reduce((total, p) => total + p.totalProductos, 0)} productos
                         </div>
                       </div>
                     </div>
                                         <span style={{ fontSize: '1.5rem' }}>
                       {estaDiaExpandido(grupo.fecha) ? '▼' : '▶'}
                     </span>
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
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '1rem',
                                  fontSize: '0.75rem',
                                  fontWeight: '600'
                                }}>
                                  📋 {planilla.numeroPlanilla}
                                </span>
                                <span style={{
                                  background: '#059669',
                                  color: 'white',
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '1rem',
                                  fontSize: '0.75rem',
                                  fontWeight: '600'
                                }}>
                                  {formatearFechaConHoy(planilla.fechaPlanilla, 'corta')}
                                </span>
                              </div>
                              
                              <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: isMobile ? '8px' : '1rem',
                                fontSize: isMobile ? '0.75rem' : '0.875rem',
                                color: '#64748b'
                              }}>
                                <span>📦 <span style={{
                                  color: '#059669', 
                                  fontWeight: '700'
                                }}>
                                  {planilla.totalProductos}
                                </span> unidades</span>
                                <span>🛒 {planilla.detalles.length} productos</span>
                                <span>⏰ {formatearFechaConHora(planilla.fechaPlanilla)}</span>
                              </div>
                            </div>
                            <div style={{
                              display: 'flex',
                              gap: isMobile ? '6px' : '0.5rem',
                              flexDirection: 'row',
                              flexWrap: 'wrap'
                            }}>
                                                             <button
                                 onClick={() => exportarPlanilla(planilla)}
                                 style={{
                                   background: '#10b981',
                                   color: 'white',
                                   border: 'none',
                                   borderRadius: '0.5rem',
                                   padding: isMobile ? '6px 10px' : '0.5rem 1rem',
                                   fontSize: isMobile ? '0.65rem' : '0.75rem',
                                   cursor: 'pointer',
                                   display: 'flex',
                                   alignItems: 'center',
                                   gap: '0.25rem',
                                   justifyContent: 'center',
                                   minWidth: isMobile ? 'fit-content' : 'auto'
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
                                   borderRadius: '0.5rem',
                                   padding: isMobile ? '6px 10px' : '0.5rem 1rem',
                                   fontSize: isMobile ? '0.65rem' : '0.75rem',
                                   cursor: 'pointer',
                                   display: 'flex',
                                   alignItems: 'center',
                                   gap: '0.25rem',
                                   justifyContent: 'center',
                                   minWidth: isMobile ? 'fit-content' : 'auto'
                                 }}
                               >
                                 👁️ Ver
                               </button>
                               <button
                                 onClick={() => eliminarPlanilla(planilla.id)}
                                 style={{
                                   background: '#ef4444',
                                   color: 'white',
                                   border: 'none',
                                   borderRadius: '0.5rem',
                                   padding: isMobile ? '6px 10px' : '0.5rem 1rem',
                                   fontSize: isMobile ? '0.65rem' : '0.75rem',
                                   cursor: 'pointer',
                                   display: 'flex',
                                   alignItems: 'center',
                                   gap: '0.25rem',
                                   justifyContent: 'center',
                                   minWidth: isMobile ? 'fit-content' : 'auto'
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
        onClick={() => setPlanillaSeleccionada(null)}
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
                onClick={() => setPlanillaSeleccionada(null)}
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
                        <div style={{
                          fontWeight: '600',
                          color: '#1e293b',
                          fontSize: '0.875rem',
                          marginBottom: '0.25rem'
                        }}>
                          {detalle.descripcion}
                        </div>
                        {detalle.codigoPersonalizado && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#64748b'
                          }}>
                            Código: {detalle.codigoPersonalizado}
                          </div>
                        )}
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
                onClick={() => setPlanillaSeleccionada(null)}
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
    </div>
  );
}
