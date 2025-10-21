import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
import { formatearFecha, formatearFechaCorta, formatearFechaConHora } from '../../utils/dateUtils';

interface PlanillaPedido {
  id: number;
  numeroPlanilla: string;
  observaciones?: string;
  transporte?: string;
  fechaPlanilla: string;
  totalProductos: number;
  fechaCreacion: string;
  fechaActualizacion: string;
  detalles: DetallePlanillaPedido[];
}

interface DetallePlanillaPedido {
  id: number;
  numeroPersonalizado?: string;
  descripcion: string;
  cantidad: number;
  observaciones?: string;
  fechaCreacion: string;
}

export default function CargaPedidos() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  
  const [planillas, setPlanillas] = useState<PlanillaPedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const datosCargadosRef = useRef(false);
  const [planillaSeleccionada, setPlanillaSeleccionada] = useState<PlanillaPedido | null>(null);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [diasExpandidos, setDiasExpandidos] = useState<Set<string>>(new Set());
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [mostrarModalSalidas, setMostrarModalSalidas] = useState(false);
  const [salidasPorFletero, setSalidasPorFletero] = useState<{[fecha: string]: {[fletero: string]: string[]}}>({});

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

      // Si es un string
      if (typeof fechaPlanilla === 'string') {
        console.log('🔍 [DEBUG] Procesando como string:', fechaPlanilla);
        // Si ya tiene formato de fecha (YYYY-MM-DD)
        if (fechaPlanilla.match(/^\d{4}-\d{2}-\d{2}$/)) {
          console.log('🔍 [DEBUG] Formato YYYY-MM-DD detectado');
          return fechaPlanilla;
        }
        // Si tiene formato ISO con T
        if (fechaPlanilla.includes('T')) {
          const partes = fechaPlanilla.split('T');
          if (partes.length >= 1) {
            console.log('🔍 [DEBUG] Formato ISO detectado, parte fecha:', partes[0]);
            return partes[0];
          }
        }
        // Si es otro formato, intentar parsear
        if (!Array.isArray(fechaPlanilla)) {
          const fechaObj = new Date(fechaPlanilla);
          if (!isNaN(fechaObj.getTime())) {
            const resultado = fechaObj.toISOString().split('T')[0];
            console.log('🔍 [DEBUG] Parseado como Date, resultado:', resultado);
            return resultado;
          }
        }
      }

      // Si es un objeto Date o timestamp
      if (fechaPlanilla instanceof Date || typeof fechaPlanilla === 'number') {
        const fechaObj = new Date(fechaPlanilla);
        if (!isNaN(fechaObj.getTime())) {
          return fechaObj.toISOString().split('T')[0];
        }
      }

      // Si es un array (formato [year, month, day, hour, minute, second])
      // Los arrays del backend representan fechas UTC
      if (Array.isArray(fechaPlanilla)) {
        console.log('🔍 [DEBUG] Procesando como array:', fechaPlanilla);
        const [year, month, day] = fechaPlanilla;
        // Crear fecha UTC y convertir a zona horaria local para obtener la fecha correcta
        const fechaUTC = new Date(Date.UTC(year, month - 1, day));
        const zonaHorariaLocal = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // Convertir a zona horaria local usando toLocaleDateString
        const fechaLocal = fechaUTC.toLocaleDateString('en-CA', { timeZone: zonaHorariaLocal }); // formato YYYY-MM-DD
        console.log('🔍 [DEBUG] Array procesado:', {
          year, month, day,
          fechaUTC: fechaUTC.toISOString(),
          zonaHorariaLocal,
          fechaLocal
        });
        return fechaLocal;
      }

      console.error('Formato de fecha no reconocido:', fechaPlanilla, 'tipo:', typeof fechaPlanilla);
      return 'Fecha inválida';
    } catch (error) {
      console.error('Error procesando fecha:', fechaPlanilla, error);
      return 'Fecha inválida';
    }
  };

  // Función helper para formatear fecha con hora desde arrays locales
  const formatearFechaConHoraLocal = (fechaArray: any): string => {
    try {
      if (fechaArray == null) {
        return 'N/A';
      }

      // Si es un array (formato [year, month, day, hour, minute, second])
      if (Array.isArray(fechaArray)) {
        const [year, month, day, hour = 0, minute = 0, second = 0] = fechaArray;
        
        // Crear fecha local (no UTC) para evitar conversión automática
        const fechaLocal = new Date(year, month - 1, day, hour, minute, second);
        
        if (isNaN(fechaLocal.getTime())) {
          return 'Fecha inválida';
        }
        
        // Mostrar en zona horaria local del usuario
        return fechaLocal.toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }

      // Para otros tipos, usar la función de dateUtils
      return formatearFechaConHora(fechaArray);
    } catch (error) {
      console.error('Error formateando fecha con hora:', error);
      return 'Fecha inválida';
    }
  };

  // Función helper para formatear fecha corta desde arrays locales
  const formatearFechaCortaLocal = (fechaArray: any): string => {
    try {
      if (fechaArray == null) {
        return 'N/A';
      }

      // Si es un array (formato [year, month, day, hour, minute, second])
      if (Array.isArray(fechaArray)) {
        const [year, month, day] = fechaArray;
        
        // Crear fecha local (no UTC) para evitar conversión automática
        const fechaLocal = new Date(year, month - 1, day);
        
        if (isNaN(fechaLocal.getTime())) {
          return 'Fecha inválida';
        }
        
        // Mostrar en zona horaria local del usuario
        return fechaLocal.toLocaleDateString('es-ES', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }

      // Para otros tipos, usar la función de dateUtils
      return formatearFechaCorta(fechaArray);
    } catch (error) {
      console.error('Error formateando fecha corta:', error);
      return 'Fecha inválida';
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    // Solo cargar datos una vez cuando el componente se monta
    if (!datosCargadosRef.current) {
      cargarDatos();
      datosCargadosRef.current = true;
    }
  }, []);

  // Inicializar el día actual como expandido
  useEffect(() => {
    const fechaActual = obtenerFechaActual();
    setDiasExpandidos(new Set()); // Inicializar vacío, el día actual se maneja en estaDiaExpandido
  }, []);

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
      const response = await ApiService.obtenerPlanillasPedidos();
      console.log('📦 Respuesta del servidor:', response);
      console.log('📋 Planillas obtenidas:', response.data);
      
      if (response && response.data) {
        setPlanillas(response.data);
      } else if (response && Array.isArray(response)) {
        setPlanillas(response);
      } else {
        console.warn('⚠️ Estructura de respuesta inesperada:', response);
        setPlanillas([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar planillas:', error);
      toast.error('Error al cargar las planillas');
    }
  };

  const eliminarPlanilla = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar esta planilla?')) {
      return;
    }

    try {
      await ApiService.eliminarPlanillaPedido(id);
      toast.success('Planilla eliminada exitosamente');
      await cargarPlanillas();
    } catch (error) {
      console.error('Error al eliminar planilla:', error);
      toast.error('Error al eliminar la planilla');
    }
  };

  const filtrarPlanillas = () => {
    let planillasFiltradas = planillas;

    if (filtroFecha) {
      planillasFiltradas = planillasFiltradas.filter(p => 
        obtenerFechaPlanillaString(p.fechaPlanilla) === filtroFecha
      );
    }

    if (filtroBusqueda) {
      planillasFiltradas = planillasFiltradas.filter(p => 
        p.numeroPlanilla.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
        (p.observaciones && p.observaciones.toLowerCase().includes(filtroBusqueda.toLowerCase())) ||
        (p.transporte && p.transporte.toLowerCase().includes(filtroBusqueda.toLowerCase()))
      );
    }

    return planillasFiltradas;
  };

  const agruparPlanillasPorFecha = () => {
    const planillasFiltradas = filtrarPlanillas();
    const grupos: { [fecha: string]: PlanillaPedido[] } = {};
    
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
        planillas: planillas.sort((a, b) => new Date(b.fechaPlanilla).getTime() - new Date(a.fechaPlanilla).getTime())
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
    
    return formato === 'corta' ? formatearFechaCortaLocal(fechaPlanilla) : formatearFecha(fechaPlanilla);
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

  const procesarSalidasPorFletero = (fecha: string) => {
    const planillasDelDia = filtrarPlanillas().filter(p => 
      obtenerFechaPlanillaString(p.fechaPlanilla) === fecha
    );
    
    const salidasPorFletero: {[fletero: string]: string[]} = {};
    
    planillasDelDia.forEach(planilla => {
      if (planilla.transporte) {
        if (!salidasPorFletero[planilla.transporte]) {
          salidasPorFletero[planilla.transporte] = [];
        }
        salidasPorFletero[planilla.transporte].push(planilla.numeroPlanilla);
      }
    });
    
    return salidasPorFletero;
  };

  const abrirModalSalidas = (fecha: string) => {
    const salidas = procesarSalidasPorFletero(fecha);
    setSalidasPorFletero({[fecha]: salidas});
    setMostrarModalSalidas(true);
  };

  const navegarAPlanilla = (numeroPlanilla: string, fecha: string) => {
    // Cerrar el modal
    setMostrarModalSalidas(false);
    
    // Buscar la planilla por número
    const planillaEncontrada = planillas.find(p => 
      p.numeroPlanilla === numeroPlanilla && 
      obtenerFechaPlanillaString(p.fechaPlanilla) === fecha
    );
    
    if (planillaEncontrada) {
      // Expandir el día si no está expandido
      setDiasExpandidos(prev => {
        const nuevo = new Set(prev);
        nuevo.add(fecha);
        return nuevo;
      });
      
      // Seleccionar la planilla
      setPlanillaSeleccionada(planillaEncontrada);
      
      // Scroll suave hacia la planilla después de un pequeño delay
      setTimeout(() => {
        const elementoPlanilla = document.querySelector(`[data-planilla-id="${planillaEncontrada.id}"]`);
        if (elementoPlanilla) {
          elementoPlanilla.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
          // Resaltar temporalmente la planilla
          elementoPlanilla.style.background = 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
          elementoPlanilla.style.borderColor = '#f59e0b';
          elementoPlanilla.style.transform = 'scale(1.02)';
          elementoPlanilla.style.boxShadow = '0 8px 25px rgba(245, 158, 11, 0.3)';
          
          setTimeout(() => {
            elementoPlanilla.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)';
            elementoPlanilla.style.borderColor = '#e2e8f0';
            elementoPlanilla.style.transform = 'scale(1)';
            elementoPlanilla.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
          }, 2000);
        }
      }, 300);
      
      toast.success(`Planilla ${numeroPlanilla} seleccionada`);
    } else {
      toast.error('No se pudo encontrar la planilla');
    }
  };

  // Manejar teclas globales para abrir modal con Enter
  const manejarTeclasGlobales = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      // Verificar que no esté en un input o textarea
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        navigate('/admin/crear-planilla');
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
        // Si el modal de detalles está abierto, solo cerrarlo
        if (planillaSeleccionada) {
          setPlanillaSeleccionada(null);
          return;
        }
        
        // Si no hay modal abierto, navegar a gestión de empresa
        navigate('/admin/gestion-empresa');
      }
    };

    document.addEventListener('keydown', manejarEscape);
    return () => {
      document.removeEventListener('keydown', manejarEscape);
    };
  }, [navigate, planillaSeleccionada]);

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

  const exportarPlanilla = async (planilla: PlanillaPedido) => {
    try {
      const response = await ApiService.exportarPlanillaPedido(planilla.id);
      
      const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fechaPlanillaStr = obtenerFechaPlanillaString(planilla.fechaPlanilla);
      link.download = `Planilla_${planilla.numeroPlanilla}_${fechaPlanillaStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Planilla exportada exitosamente');
    } catch (error) {
      console.error('Error al exportar planilla:', error);
      toast.error('Error al exportar la planilla');
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
          <p style={{ color: '#6b7280', margin: 0 }}>Cargando planillas de pedidos...</p>
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
        empresaNombre={datosUsuario?.empresaNombre}
        nombreAdministrador={datosUsuario?.nombre}
      />

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: isMobile ? '10rem 1rem 1rem 1rem' : '7rem 2rem 2rem 2rem'
      }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: isMobile ? '1.5rem' : '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                color: 'white'
              }}>
                📦
              </div>
              <div>
                <h1 style={{
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: 0
                }}>
                  Carga de Planillas
                </h1>
                <p style={{
                  color: '#64748b',
                  margin: 0,
                  fontSize: '0.875rem'
                }}>
                  Gestiona las planillas de pedidos realizados
                </p>
                <p style={{
                  color: '#059669',
                  margin: '0.25rem 0 0 0',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  💡 Presiona Enter para crear una nueva planilla
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/crear-planilla')}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
              }}
            >
              + Nueva Planilla
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: isMobile ? '1.5rem' : '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '1rem'
          }}>
            Filtros
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Fecha
              </label>
              <input
                type="date"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
                             <label style={{
                 display: 'block',
                 fontSize: '0.875rem',
                 fontWeight: '600',
                 color: '#374151',
                 marginBottom: '0.5rem'
               }}>
                 Buscar
               </label>
              <input
                type="text"
                                 placeholder="Buscar por número de planilla, observaciones, transportista o vehículo..."
                                 value={filtroBusqueda}
                 onChange={(e) => setFiltroBusqueda(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              />
              <p style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                margin: '0.25rem 0 0 0',
                fontStyle: 'italic'
              }}>
                💡 Puedes buscar por: número de planilla, observaciones, código de transportista, nombre de transportista, marca/modelo de vehículo o patente
              </p>
            </div>
          </div>
        </div>

        {/* Vista Organizada por Días */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: isMobile ? '1.5rem' : '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
                         <h3 style={{
               fontSize: '1.25rem',
               fontWeight: '600',
               color: '#1e293b',
               margin: 0
             }}>
               Planillas Organizadas por Día
               {(filtroFecha || filtroBusqueda) && (
                 <span style={{
                   fontSize: '0.875rem',
                   color: '#3b82f6',
                   fontWeight: '500',
                   marginLeft: '0.5rem'
                 }}>
                   (Filtros activos - Días expandidos automáticamente)
                 </span>
               )}
             </h3>
            <div style={{
              fontSize: '0.875rem',
              color: '#64748b',
              fontWeight: '500'
            }}>
              {gruposPorFecha.length} días • {gruposPorFecha.reduce((total, grupo) => total + grupo.planillas.length, 0)} planillas
            </div>
          </div>

          {gruposPorFecha.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
              <p>No se encontraron planillas</p>
              <button
                onClick={() => navigate('/admin/crear-planilla')}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '1rem'
                }}
              >
                Crear primera planilla
              </button>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2rem'
            }}>
              {gruposPorFecha.map((grupo) => (
                <div key={grupo.fecha}>
                  {/* Header del día */}
                  <div 
                    style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                      borderRadius: '16px',
                      padding: isMobile ? '16px' : '24px',
                      marginBottom: '1rem',
                      border: '2px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                    onClick={() => alternarExpansionDia(grupo.fecha)}
                    onMouseOver={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                      }
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: isMobile ? '12px' : '0'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <div style={{
                          fontSize: isMobile ? '1rem' : '1.25rem',
                          color: '#64748b',
                          transition: 'transform 0.2s ease',
                          transform: estaDiaExpandido(grupo.fecha) ? 'rotate(90deg)' : 'rotate(0deg)'
                        }}>
                          ▶️
                        </div>
                        <div>
                          <h4 style={{
                            fontSize: isMobile ? '1rem' : '1.125rem',
                            fontWeight: '700',
                            color: '#1e293b',
                            margin: 0,
                            textTransform: 'capitalize'
                          }}>
                            {formatearFechaGrupoConHoy(grupo.fecha)}
                          </h4>
                          <p style={{
                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                            color: '#64748b',
                            margin: '0.25rem 0 0 0'
                          }}>
                            {grupo.planillas.length} planilla{grupo.planillas.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: isMobile ? '8px' : '0.5rem',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{
                          background: '#10b981',
                          color: 'white',
                          borderRadius: '0.5rem',
                          padding: isMobile ? '6px 12px' : '0.5rem 1rem',
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          fontWeight: '600'
                        }}>
                          {grupo.planillas.length} planilla{grupo.planillas.length !== 1 ? 's' : ''}
                        </div>
                        <div style={{
                          background: '#3b82f6',
                          color: 'white',
                          borderRadius: '0.5rem',
                          padding: isMobile ? '6px 12px' : '0.5rem 1rem',
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          fontWeight: '600'
                        }}>
                          {grupo.planillas.reduce((total, p) => total + p.totalProductos, 0)} unidades
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirModalSalidas(grupo.fecha);
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            padding: isMobile ? '6px 12px' : '0.5rem 1rem',
                            fontSize: isMobile ? '0.75rem' : '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
                          }}
                          onMouseOver={(e) => {
                            if (!isMobile) {
                              e.currentTarget.style.transform = 'scale(1.05)';
                              e.currentTarget.style.boxShadow = '0 4px 8px rgba(245, 158, 11, 0.4)';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (!isMobile) {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(245, 158, 11, 0.3)';
                            }
                          }}
                        >
                          🚛 Ver Salidas
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Planillas del día - Solo se muestran si está expandido */}
                  {estaDiaExpandido(grupo.fecha) && (
                    <div style={{
                      display: 'grid',
                      gap: '1rem'
                    }}>
                      {grupo.planillas.map((planilla) => (
                        <div
                          key={planilla.id}
                          data-planilla-id={planilla.id}
                          style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                            border: '2px solid #e2e8f0',
                            borderRadius: '16px',
                            padding: isMobile ? '16px' : '24px',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                          }}
                          onMouseOver={(e) => {
                            if (!isMobile) {
                              e.currentTarget.style.borderColor = '#3b82f6';
                              e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.15)';
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
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '1rem',
                            flexDirection: isMobile ? 'column' : 'row',
                            gap: '1rem'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '0.5rem'
                              }}>
                                <div style={{
                                  background: '#3b82f6',
                                  color: 'white',
                                  borderRadius: '0.5rem',
                                  padding: '0.5rem 0.75rem',
                                  fontSize: '0.875rem',
                                  fontWeight: '700',
                                  minWidth: 'fit-content'
                                }}>
                                  #{planilla.numeroPlanilla}
                                </div>
                                <h4 style={{
                                  fontSize: '1.125rem',
                                  fontWeight: '600',
                                  color: '#1e293b',
                                  margin: 0
                                }}>
                                  Planilla de Pedidos
                                </h4>
                              </div>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: isMobile ? '8px' : '1rem',
                                fontSize: isMobile ? '0.75rem' : '0.875rem',
                                color: '#64748b',
                                flexWrap: 'wrap'
                              }}>
                                <span>📅 {formatearFechaConHoy(planilla.fechaPlanilla, 'corta')}</span>
                                <span>📦 <span style={{ 
                                  color: '#3b82f6', 
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
                              width: isMobile ? '100%' : 'auto',
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
                                  width: isMobile ? 'auto' : 'auto',
                                  minWidth: isMobile ? 'fit-content' : 'auto'
                                }}
                              >
                                📄 Exportar
                              </button>
                              <button
                                onClick={() => setPlanillaSeleccionada(planilla)}
                                style={{
                                  background: '#3b82f6',
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
                                  width: isMobile ? 'auto' : 'auto',
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
                                  width: isMobile ? 'auto' : 'auto',
                                  minWidth: isMobile ? 'fit-content' : 'auto'
                                }}
                              >
                                🗑️ Eliminar
                              </button>
                            </div>
                          </div>
                          
                          {(planilla.transporte || planilla.observaciones) && (
                            <div style={{
                              display: 'flex',
                              gap: '1rem',
                              marginBottom: '1rem',
                              flexWrap: 'wrap'
                            }}>
                              {planilla.transporte && (
                                <div style={{
                                  background: '#f0f9ff',
                                  borderRadius: '0.5rem',
                                  padding: '0.75rem',
                                  border: '1px solid #bae6fd',
                                  flex: '1',
                                  minWidth: '200px'
                                }}>
                                  <p style={{
                                    color: '#0369a1',
                                    fontSize: '0.875rem',
                                    margin: 0,
                                    fontStyle: 'italic'
                                  }}>
                                    🚛 {planilla.transporte}
                                  </p>
                                  {(() => {
                                    // Extraer patente del texto de transporte
                                    const patenteMatch = planilla.transporte?.match(/\(([^)]* - ([^)]+))\)/);
                                    if (patenteMatch && patenteMatch[2]) {
                                      return (
                                        <p style={{
                                          color: '#059669',
                                          fontSize: '0.75rem',
                                          margin: '0.25rem 0 0 0',
                                          fontWeight: '600'
                                        }}>
                                          🚗 Patente: {patenteMatch[2]}
                                        </p>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              )}
                              
                              {planilla.observaciones && (
                                <div style={{
                                  background: '#f8fafc',
                                  borderRadius: '0.5rem',
                                  padding: '0.75rem',
                                  border: '1px solid #e2e8f0',
                                  flex: '1',
                                  minWidth: '200px'
                                }}>
                                  <p style={{
                                    color: '#64748b',
                                    fontSize: '0.875rem',
                                    margin: 0,
                                    fontStyle: 'italic'
                                  }}>
                                    💬 {planilla.observaciones}
                                  </p>
                                </div>
                              )}
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
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Header del Modal */}
              <div style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                padding: '1.5rem 2rem',
                borderTopLeftRadius: '1rem',
                borderTopRightRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <span style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      fontSize: '1rem'
                    }}>
                      #{planillaSeleccionada.numeroPlanilla}
                    </span>
                    Planilla de Pedidos
                  </h2>
                  <p style={{
                    margin: '0.5rem 0 0 0',
                    opacity: 0.9,
                    fontSize: '0.875rem'
                  }}>
                    {formatearFecha(planillaSeleccionada.fechaPlanilla)}
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem'
                }}>
                  <button
                    onClick={() => exportarPlanilla(planillaSeleccionada)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    📄 Exportar
                  </button>
                  <button
                    onClick={() => setPlanillaSeleccionada(null)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.5rem',
                      fontSize: '1.25rem',
                      cursor: 'pointer',
                      width: '2.5rem',
                      height: '2.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Contenido del Modal */}
              <div style={{ 
                padding: isMobile ? '1rem' : '2rem',
                overflow: 'auto',
                flex: 1
              }}>
                {/* Información General */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '16px',
                  padding: isMobile ? '16px' : '24px',
                  marginBottom: '2rem',
                  border: '2px solid #e2e8f0'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: '0 0 1rem 0'
                  }}>
                    📋 Información General
                  </h3>
                                     <div style={{
                     display: 'grid',
                     gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                     gap: isMobile ? '12px' : '1rem'
                   }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        fontWeight: '600',
                        color: '#64748b',
                        marginBottom: '0.5rem'
                      }}>
                        📅 Fecha de Planilla
                      </label>
                      <div style={{
                        padding: isMobile ? '12px' : '0.75rem',
                        background: 'white',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        color: '#1e293b',
                        fontWeight: '500'
                      }}>
                        {formatearFecha(planillaSeleccionada.fechaPlanilla)}
                      </div>
                    </div>
                                         <div>
                       <label style={{
                         display: 'block',
                         fontSize: '0.875rem',
                         fontWeight: '600',
                         color: '#64748b',
                         marginBottom: '0.5rem'
                       }}>
                         📦 Total de Unidades
                       </label>
                       <div style={{
                         padding: '0.75rem',
                         background: 'white',
                         border: '1px solid #e2e8f0',
                         borderRadius: '0.5rem',
                         fontSize: '0.875rem',
                         color: '#1e293b',
                         fontWeight: '500'
                       }}>
                         <span style={{ 
                           color: '#3b82f6', 
                           fontWeight: '700',
                           fontSize: '1.1rem'
                         }}>
                           {planillaSeleccionada.totalProductos}
                         </span>
                       </div>
                     </div>
                     <div>
                       <label style={{
                         display: 'block',
                         fontSize: '0.875rem',
                         fontWeight: '600',
                         color: '#64748b',
                         marginBottom: '0.5rem'
                       }}>
                         🛒 Cantidad de Productos
                       </label>
                       <div style={{
                         padding: '0.75rem',
                         background: 'white',
                         border: '1px solid #e2e8f0',
                         borderRadius: '0.5rem',
                         fontSize: '0.875rem',
                         color: '#1e293b',
                         fontWeight: '500'
                       }}>
                         {planillaSeleccionada.detalles.length}
                       </div>
                     </div>
                    
                  </div>
                  
                  {(planillaSeleccionada.transporte || planillaSeleccionada.observaciones) && (
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{
                        display: 'flex',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}>
                        {planillaSeleccionada.transporte && (
                          <div style={{ flex: '1', minWidth: '250px' }}>
                            <label style={{
                              display: 'block',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: '#0369a1',
                              marginBottom: '0.5rem'
                            }}>
                              🚛 Transporte
                            </label>
                            <div style={{
                              padding: '0.75rem',
                              background: 'white',
                              border: '1px solid #bae6fd',
                              borderRadius: '0.5rem',
                              fontSize: '0.875rem',
                              color: '#1e293b',
                              fontStyle: 'italic'
                            }}>
                              {planillaSeleccionada.transporte}
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
                                      <p style={{
                                        color: '#059669',
                                        fontSize: '0.75rem',
                                        margin: 0,
                                        fontWeight: '600'
                                      }}>
                                        🚗 Patente: {patenteMatch[2]}
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        )}
                        
                        {planillaSeleccionada.observaciones && (
                          <div style={{ flex: '1', minWidth: '250px' }}>
                            <label style={{
                              display: 'block',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: '#64748b',
                              marginBottom: '0.5rem'
                            }}>
                              💬 Observaciones
                            </label>
                            <div style={{
                              padding: '0.75rem',
                              background: 'white',
                              border: '1px solid #e2e8f0',
                              borderRadius: '0.5rem',
                              fontSize: '0.875rem',
                              color: '#1e293b',
                              fontStyle: 'italic'
                            }}>
                              {planillaSeleccionada.observaciones}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Lista de Productos */}
                <div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: '0 0 1rem 0'
                  }}>
                    🛒 Productos de la Planilla
                  </h3>
                  <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    border: '2px solid #e2e8f0',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                      padding: isMobile ? '12px 16px' : '1rem 1.5rem',
                      borderBottom: '2px solid #e2e8f0',
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '40px 1fr 80px' : '50px 1fr 100px',
                      gap: isMobile ? '8px' : '1rem',
                      alignItems: 'center',
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      <div>#</div>
                      <div>Producto</div>
                      <div style={{ textAlign: 'center' }}>Cantidad</div>
                    </div>
                    
                    {planillaSeleccionada.detalles.map((detalle, index) => (
                      <div
                        key={index}
                        style={{
                          padding: isMobile ? '12px 16px' : '1rem 1.5rem',
                          borderBottom: index < planillaSeleccionada.detalles.length - 1 ? '2px solid #f1f5f9' : 'none',
                          display: 'grid',
                          gridTemplateColumns: isMobile ? '40px 1fr 80px' : '50px 1fr 100px',
                          gap: isMobile ? '8px' : '1rem',
                          alignItems: 'center',
                          background: index % 2 === 0 ? 'white' : '#f8fafc'
                        }}
                      >
                        <div style={{
                          background: '#3b82f6',
                          color: 'white',
                          borderRadius: '50%',
                          width: isMobile ? '1.5rem' : '2rem',
                          height: isMobile ? '1.5rem' : '2rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: isMobile ? '0.7rem' : '0.875rem',
                          fontWeight: '600'
                        }}>
                          {index + 1}
                        </div>
                        <div>
                          <div style={{
                            fontWeight: '600',
                            color: '#1e293b',
                            fontSize: '0.875rem'
                          }}>
                            {detalle.numeroPersonalizado && (
                              <span style={{ 
                                color: '#3b82f6', 
                                fontWeight: '700',
                                marginRight: '0.5rem'
                              }}>
                                {detalle.numeroPersonalizado}
                              </span>
                            )}
                            {detalle.descripcion}
                          </div>
                          {detalle.observaciones && (
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#64748b',
                              fontStyle: 'italic',
                              marginTop: '0.25rem'
                            }}>
                              {detalle.observaciones}
                            </div>
                          )}
                        </div>
                        <div style={{
                          textAlign: 'center',
                          fontSize: '1rem',
                          fontWeight: '700',
                          color: '#3b82f6'
                        }}>
                          {detalle.cantidad}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Ver Salidas */}
        {mostrarModalSalidas && (
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
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
              {/* Header */}
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#1e293b' }}>
                  🚛 Salidas por Fletero
                </h2>
                <button 
                  onClick={() => setMostrarModalSalidas(false)}
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.color = '#1e293b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                    e.currentTarget.style.color = '#64748b';
                  }}
                >
                  ×
                </button>
              </div>
              
              {/* Contenido */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.5rem'
              }}>
                {Object.entries(salidasPorFletero).map(([fecha, salidas]) => (
                  <div key={fecha} style={{ marginBottom: '2rem' }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#1e293b',
                      margin: '0 0 1rem 0',
                      padding: '0.75rem',
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0'
                    }}>
                      📅 {formatearFecha(fecha)}
                    </h3>
                    
                    {Object.keys(salidas).length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '2rem',
                        color: '#64748b',
                        fontStyle: 'italic',
                        background: '#f8fafc',
                        borderRadius: '0.75rem',
                        border: '2px dashed #cbd5e1'
                      }}>
                        No hay salidas registradas para este día
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: '1rem' }}>
                        {Object.entries(salidas).map(([fletero, planillas]) => (
                          <div key={fletero} style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                            border: '2px solid #e2e8f0',
                            borderRadius: '0.75rem',
                            padding: '1rem',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#3b82f6';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.15)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'none';
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '0.75rem'
                            }}>
                              <h4 style={{
                                margin: 0,
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: '#1e293b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}>
                                🚛 {fletero}
                              </h4>
                              <div style={{
                                background: '#10b981',
                                color: 'white',
                                borderRadius: '0.5rem',
                                padding: '0.25rem 0.75rem',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                              }}>
                                {planillas.length} planilla{planillas.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                            
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                              gap: '0.5rem'
                            }}>
                              {planillas.map((numeroPlanilla, index) => (
                                <button
                                  key={index}
                                  onClick={() => navegarAPlanilla(numeroPlanilla, fecha)}
                                  style={{
                                    background: '#3b82f6',
                                    color: 'white',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    textAlign: 'center',
                                    transition: 'all 0.2s ease',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#1d4ed8';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(29, 78, 216, 0.4)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#3b82f6';
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }}
                                  title={`Hacer clic para ir a la planilla ${numeroPlanilla}`}
                                >
                                  {numeroPlanilla}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{
                padding: '1.5rem',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <button 
                  onClick={() => setMostrarModalSalidas(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
