import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
import { formatearFecha, formatearFechaCorta, formatearFechaConHora, obtenerFechaActual, compararFechas } from '../../utils/dateUtils';
import ModalAgregarRoturaPerdida from '../../components/ModalAgregarRoturaPerdida';

interface RoturaPerdida {
  id: number;
  fecha: string;
  cantidad: number;
  observaciones?: string;
  descripcionProducto?: string;
  codigoPersonalizado?: string;
  nombreUsuario: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  productoId?: number;
  nombreProducto?: string;
  codigoProducto?: string;
  descripcionCompleta?: string;
  codigoCompleto?: string;
}

export default function RoturasPerdidas() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  
  const [roturasPerdidas, setRoturasPerdidas] = useState<RoturaPerdida[]>([]);
  const [cargando, setCargando] = useState(true);
  const datosCargadosRef = useRef(false);
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [diasExpandidos, setDiasExpandidos] = useState<Set<string>>(new Set());
  const [mostrarModalAgregar, setMostrarModalAgregar] = useState(false);
  
  // Estados para navegación por teclado
  const [modoNavegacion, setModoNavegacion] = useState(false);
  const [elementoSeleccionado, setElementoSeleccionado] = useState(-1); // -1: buscador, 0+: pestañas
  const [pestañaExpandida, setPestañaExpandida] = useState<string | null>(null);

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

  const cargarDatos = async () => {
    try {
      setCargando(true);
      await cargarRoturasPerdidas();
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  const cargarRoturasPerdidas = async () => {
    try {
      const response = await ApiService.obtenerRoturasPerdidas();
      
      if (response && response.data) {
        setRoturasPerdidas(response.data);
      } else {
        setRoturasPerdidas([]);
      }
    } catch (error) {
      console.error('Error al cargar roturas y pérdidas:', error);
      toast.error('Error al cargar las roturas y pérdidas');
    }
  };

  const eliminarRoturaPerdida = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar esta rotura/pérdida?')) {
      return;
    }

    try {
      await ApiService.eliminarRoturaPerdida(id);
      toast.success('Rotura/Pérdida eliminada exitosamente');
      
      // Recargar datos para actualizar el stock
      await cargarDatos();
    } catch (error) {
      console.error('Error al eliminar rotura/pérdida:', error);
      toast.error('Error al eliminar la rotura/pérdida');
    }
  };



  const exportarRoturasPerdidas = async (fechaInicio: string, fechaFin: string) => {
    try {
      if (!datosUsuario?.empresaId) {
        toast.error('Error: No se pudo obtener la información de la empresa');
        return;
      }

      const response = await fetch(`http://localhost:8080/api/empresas/${datosUsuario.empresaId}/roturas-perdidas/exportar?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Roturas_Perdidas_${fechaInicio}_${fechaFin}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success('Reporte exportado exitosamente');
      } else {
        toast.error('Error al exportar el reporte');
      }
    } catch (error) {
      console.error('Error al exportar roturas y pérdidas:', error);
      toast.error('Error al exportar el reporte');
    }
  };

  const exportarRoturasPerdidasDelDia = async () => {
    try {
      const response = await ApiService.exportarRoturasPerdidasDelDia();
      
      const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fechaActual = obtenerFechaActual();
      link.download = `Roturas_Perdidas_Dia_${fechaActual}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Reporte del día exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar roturas y pérdidas del día:', error);
      toast.error('Error al exportar el reporte del día');
    }
  };

  const exportarRoturasPerdidasPorFecha = async (fecha: string) => {
    try {
      // Extraer solo la fecha (YYYY-MM-DD) sin la hora
      const fechaSolo = fecha.split('T')[0];
      
      const response = await ApiService.exportarRoturasPerdidas(fechaSolo, fechaSolo);
      
      const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Roturas_Perdidas_${fechaSolo}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Reporte exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar roturas y pérdidas:', error);
      toast.error('Error al exportar el reporte');
    }
  };



  const estaDiaExpandido = (fecha: string) => {
    return diasExpandidos.has(fecha);
  };

  const toggleDiaExpandido = (fecha: string) => {
    const nuevosDiasExpandidos = new Set(diasExpandidos);
    if (nuevosDiasExpandidos.has(fecha)) {
      nuevosDiasExpandidos.delete(fecha);
    } else {
      nuevosDiasExpandidos.add(fecha);
    }
    setDiasExpandidos(nuevosDiasExpandidos);
  };

  // Manejar teclas globales para abrir modal con Enter
  const manejarTeclasGlobales = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      // Verificar que no esté en un input o textarea
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setMostrarModalAgregar(true);
      }
    }
  };

  // Agregar y remover event listener para teclas globales
  useEffect(() => {
    document.addEventListener('keydown', manejarTeclasGlobales);
    return () => {
      document.removeEventListener('keydown', manejarTeclasGlobales);
    };
  }, []);

  const roturasPerdidasFiltradas = roturasPerdidas.filter(roturaPerdida => {
    // Filtro por rango de fechas
    let cumpleFiltroFecha = true;
    
    // Extraer solo la fecha (YYYY-MM-DD) sin la hora para comparar correctamente
    const fechaRotura = roturaPerdida.fecha.split('T')[0];
    
    if (filtroFechaDesde && compararFechas(fechaRotura, filtroFechaDesde) < 0) {
      cumpleFiltroFecha = false;
    }
    if (filtroFechaHasta && compararFechas(fechaRotura, filtroFechaHasta) > 0) {
      cumpleFiltroFecha = false;
    }
    
    // Filtro por búsqueda
    const cumpleFiltroBusqueda = !filtroBusqueda || 
      roturaPerdida.descripcionCompleta?.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      roturaPerdida.codigoCompleto?.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      roturaPerdida.observaciones?.toLowerCase().includes(filtroBusqueda.toLowerCase());
    
    return cumpleFiltroFecha && cumpleFiltroBusqueda;
  });

  // Si hay búsqueda activa, mostrar todos los registros filtrados sin agrupar por fecha
  const mostrarVistaBúsqueda = filtroBusqueda.trim() !== '';
  
  const roturasPerdidasPorFecha = mostrarVistaBúsqueda 
    ? { 'búsqueda': roturasPerdidasFiltradas } // Agrupar todos en una sola "fecha" llamada "búsqueda"
    : roturasPerdidasFiltradas.reduce((acc, roturaPerdida) => {
        // Extraer solo la fecha (YYYY-MM-DD) sin la hora para agrupar
        const fecha = roturaPerdida.fecha.split('T')[0];

        if (!acc[fecha]) {
          acc[fecha] = [];
        }
        acc[fecha].push(roturaPerdida);
        return acc;
      }, {} as Record<string, RoturaPerdida[]>);

  const fechasOrdenadas = Object.keys(roturasPerdidasPorFecha).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Manejar navegación por teclado
  useEffect(() => {
    const manejarTeclado = (e: KeyboardEvent) => {
      // Si el modal está abierto, no manejar navegación
      if (mostrarModalAgregar) {
        if (e.key === 'Escape') {
          setMostrarModalAgregar(false);
        }
        return;
      }

      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          if (!modoNavegacion) {
            // Activar modo navegación y abrir modal
            setModoNavegacion(true);
            setElementoSeleccionado(-1);
            setMostrarModalAgregar(true);
          } else {
            // En modo navegación, manejar Enter según el elemento seleccionado
            if (elementoSeleccionado === -1) {
              // Buscador seleccionado, abrir modal
              setMostrarModalAgregar(true);
            } else if (elementoSeleccionado >= 0 && elementoSeleccionado < fechasOrdenadas.length) {
              // Pestaña seleccionada, expandir/contraer
              const fecha = fechasOrdenadas[elementoSeleccionado];
              if (pestañaExpandida === fecha) {
                setPestañaExpandida(null);
                setDiasExpandidos(prev => {
                  const nuevo = new Set(prev);
                  nuevo.delete(fecha);
                  return nuevo;
                });
              } else {
                setPestañaExpandida(fecha);
                setDiasExpandidos(prev => {
                  const nuevo = new Set(prev);
                  nuevo.add(fecha);
                  return nuevo;
                });
              }
            }
          }
          break;

        case 'ArrowDown':
          if (modoNavegacion) {
            e.preventDefault();
            setElementoSeleccionado(prev => 
              prev < fechasOrdenadas.length - 1 ? prev + 1 : 0
            );
          }
          break;

        case 'ArrowUp':
          if (modoNavegacion) {
            e.preventDefault();
            setElementoSeleccionado(prev => 
              prev > -1 ? prev - 1 : fechasOrdenadas.length - 1
            );
          }
          break;

        case 'Escape':
          e.preventDefault();
          if (modoNavegacion) {
            // Salir del modo navegación
            setModoNavegacion(false);
            setElementoSeleccionado(-1);
            setPestañaExpandida(null);
          } else {
            // Salir de la sección
            navigate('/admin/gestion-empresa');
          }
          break;
      }
    };

    document.addEventListener('keydown', manejarTeclado);
    return () => {
      document.removeEventListener('keydown', manejarTeclado);
    };
  }, [navigate, mostrarModalAgregar, modoNavegacion, elementoSeleccionado, pestañaExpandida, fechasOrdenadas]);

  if (cargando || !datosUsuario) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
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
          <p style={{ color: '#6b7280', margin: 0 }}>Cargando roturas y pérdidas...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc'
    }}>
      <NavbarAdmin
        onCerrarSesion={cerrarSesion}
        empresaNombre={datosUsuario?.empresaNombre}
        nombreAdministrador={datosUsuario?.nombre}
      />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: isMobile ? '8rem 1rem 1rem 1rem' : '7rem 2rem 2rem 2rem'
      }}>
        {/* Indicador de modo navegación */}
        {modoNavegacion && (
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span style={{ fontSize: '1.25rem' }}>⌨️</span>
              <div>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  margin: '0 0 0.25rem 0'
                }}>
                  Modo Navegación por Teclado
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  margin: 0,
                  opacity: 0.9
                }}>
                  Usa ↑↓ para navegar, Enter para seleccionar, ESC para salir
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setModoNavegacion(false);
                setElementoSeleccionado(-1);
                setPestañaExpandida(null);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            >
              Salir
            </button>
          </div>
        )}

        {/* Encabezado y filtros — mismo criterio que Carga de Planillas / Retornos */}
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
                💔 Roturas y Pérdidas
              </h1>
              <p style={{
                color: '#64748b',
                margin: 0,
                fontSize: '1rem'
              }}>
                Control diario de productos dañados o perdidos
              </p>
              <p style={{
                color: '#059669',
                margin: '0.35rem 0 0 0',
                fontSize: '0.8125rem',
                fontWeight: '500'
              }}>
                💡 Enter — agregar rotura o pérdida
              </p>
            </div>
            <button
              onClick={() => setMostrarModalAgregar(true)}
              style={{
                background: '#1e293b',
                color: 'white',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: isMobile ? '12px 16px' : '0.75rem 1.5rem',
                fontSize: isMobile ? '0.8rem' : '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background = '#334155';
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background = '#1e293b';
                }
              }}
            >
              ➕ Agregar Rotura/Pérdida
            </button>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            alignItems: isMobile ? 'stretch' : 'flex-end',
            gap: isMobile ? '1rem' : '0.75rem',
            marginTop: '1.25rem'
          }}>
            <div style={{
              flex: isMobile ? 'none' : '1 1 0',
              minWidth: isMobile ? '100%' : '160px',
              width: isMobile ? '100%' : undefined
            }}>
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
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                placeholder="Producto, código u observaciones..."
                title="Buscar por producto, código o observaciones"
                style={{
                  width: '100%',
                  padding: isMobile ? '12px' : '0.75rem',
                  border: modoNavegacion && elementoSeleccionado === -1 ? '3px solid #3b82f6' : '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: isMobile ? '0.75rem' : '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  background: modoNavegacion && elementoSeleccionado === -1 ? '#eff6ff' : 'white',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '0.75rem' : '0.5rem',
              alignItems: isMobile ? 'stretch' : 'flex-end',
              flexShrink: 0
            }}>
              <div style={{ width: isMobile ? '100%' : 'auto' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  📅 Desde
                </label>
                <input
                  type="date"
                  value={filtroFechaDesde}
                  onChange={(e) => setFiltroFechaDesde(e.target.value)}
                  style={{
                    width: isMobile ? '100%' : 'auto',
                    minWidth: isMobile ? undefined : '140px',
                    padding: isMobile ? '12px' : '0.75rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: isMobile ? '0.75rem' : '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    background: 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ width: isMobile ? '100%' : 'auto' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Hasta
                </label>
                <input
                  type="date"
                  value={filtroFechaHasta}
                  onChange={(e) => setFiltroFechaHasta(e.target.value)}
                  min={filtroFechaDesde}
                  style={{
                    width: isMobile ? '100%' : 'auto',
                    minWidth: isMobile ? undefined : '140px',
                    padding: isMobile ? '12px' : '0.75rem',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: isMobile ? '0.75rem' : '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    background: 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {(filtroBusqueda || filtroFechaDesde || filtroFechaHasta) && (
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: '0.35rem',
                alignItems: 'center',
                alignSelf: isMobile ? 'stretch' : 'flex-end',
                flexShrink: 0,
                paddingBottom: isMobile ? 0 : '2px'
              }}>
                {filtroBusqueda && (
                  <button
                    type="button"
                    onClick={() => setFiltroBusqueda('')}
                    style={{
                      padding: '0.35rem 0.6rem',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    ✕ Búsqueda
                  </button>
                )}
                {(filtroFechaDesde || filtroFechaHasta) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFiltroFechaDesde('');
                      setFiltroFechaHasta('');
                    }}
                    style={{
                      padding: '0.35rem 0.6rem',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    ✕ Fechas
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Lista de Roturas y Pérdidas */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: isMobile ? '16px' : '24px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          border: '2px solid #e2e8f0'
        }}>
          
          {/* Indicador de filtros aplicados */}
          {(filtroFechaDesde || filtroFechaHasta || filtroBusqueda) && (
            <div style={{
              background: '#f3f4f6',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              border: '1px solid #e5e7eb'
            }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#374151',
                margin: '0 0 0.5rem 0',
                fontWeight: '600'
              }}>
                🔍 Filtros aplicados:
              </p>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                {filtroFechaDesde && filtroFechaHasta && (
                  <p style={{ margin: '0.25rem 0' }}>
                    📅 Período: {formatearFechaCorta(filtroFechaDesde)} - {formatearFechaCorta(filtroFechaHasta)}
                  </p>
                )}
                {filtroFechaDesde && !filtroFechaHasta && (
                  <p style={{ margin: '0.25rem 0' }}>
                    📅 Desde: {formatearFechaCorta(filtroFechaDesde)}
                  </p>
                )}
                {!filtroFechaDesde && filtroFechaHasta && (
                  <p style={{ margin: '0.25rem 0' }}>
                    📅 Hasta: {formatearFechaCorta(filtroFechaHasta)}
                  </p>
                )}
                {filtroBusqueda && (
                  <p style={{ margin: '0.25rem 0' }}>
                    🔍 Búsqueda: "{filtroBusqueda}"
                  </p>
                )}
                <p style={{ margin: '0.5rem 0 0 0', fontWeight: '600' }}>
                  📊 Mostrando {roturasPerdidasFiltradas.length} de {roturasPerdidas.length} registros
                </p>
              </div>
            </div>
          )}
          {fechasOrdenadas.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: '#6b7280'
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem'
              }}>
                💔
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                margin: '0 0 0.5rem 0'
              }}>
                No hay roturas o pérdidas registradas
              </h3>
              <p style={{
                fontSize: '0.875rem',
                margin: 0
              }}>
                Comienza agregando la primera rotura o pérdida
              </p>
            </div>
          ) : (
                         <div>
                              {fechasOrdenadas.map(fecha => {
                  const roturasDelDia = roturasPerdidasPorFecha[fecha];
                  const fechaActual = obtenerFechaActual();
                  const esHoy = fecha === fechaActual;

                  const esBusqueda = fecha === 'búsqueda';
                  const totalUnidades = roturasDelDia.reduce((sum, rotura) => sum + rotura.cantidad, 0);
                 
                 // Si es búsqueda, mostrar directamente el contenido sin header expandible
                 if (esBusqueda) {
                   return (
                     <div key={fecha} style={{
                       marginBottom: '2rem',
                       border: '1px solid #e2e8f0',
                       borderRadius: '0.75rem',
                       overflow: 'hidden'
                     }}>
                       {/* Header de búsqueda */}
                       <div style={{
                         background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                         padding: '1rem 1.5rem',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'space-between'
                       }}>
                         <div style={{
                           display: 'flex',
                           alignItems: 'center',
                           gap: '1rem'
                         }}>
                           <span style={{
                             fontSize: '1.25rem',
                             color: 'white'
                           }}>
                             🔍
                           </span>
                           <div>
                             <h3 style={{
                               fontSize: '1.125rem',
                               fontWeight: '600',
                               color: 'white',
                               margin: 0
                             }}>
                               Resultados de búsqueda
                             </h3>
                             <p style={{
                               fontSize: '0.875rem',
                               color: 'rgba(255, 255, 255, 0.8)',
                               margin: '0.25rem 0 0 0'
                             }}>
                               {roturasDelDia.length} registro{roturasDelDia.length !== 1 ? 's' : ''} encontrado{roturasDelDia.length !== 1 ? 's' : ''} • {totalUnidades} unidad{totalUnidades !== 1 ? 'es' : ''} perdida{totalUnidades !== 1 ? 's' : ''}
                             </p>
                           </div>
                         </div>
                       </div>
                       
                       {/* Contenido de búsqueda - siempre visible */}
                       <div style={{
                         padding: '1.5rem'
                       }}>
                         {roturasDelDia.length === 0 ? (
                           <div style={{
                             textAlign: 'center',
                             padding: '2rem 1rem',
                             color: '#6b7280'
                           }}>
                             <p style={{
                               fontSize: '0.875rem',
                               margin: 0
                             }}>
                               No se encontraron registros para tu búsqueda
                             </p>
                           </div>
                         ) : (
                           roturasDelDia.map((roturaPerdida, index) => (
                           <div key={roturaPerdida.id} style={{
                             background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                             borderRadius: '16px',
                             padding: isMobile ? '16px' : '24px',
                             marginBottom: index < roturasDelDia.length - 1 ? '12px' : 0,
                             border: '2px solid #e2e8f0',
                             transition: 'all 0.2s ease',
                             boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                           }}
                           onMouseOver={(e) => {
                             if (!isMobile) {
                               e.currentTarget.style.borderColor = '#ef4444';
                               e.currentTarget.style.boxShadow = '0 4px 16px rgba(239,68,68,0.15)';
                               e.currentTarget.style.transform = 'translateY(-2px)';
                             }
                           }}
                           onMouseOut={(e) => {
                             if (!isMobile) {
                               e.currentTarget.style.borderColor = '#e2e8f0';
                               e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                               e.currentTarget.style.transform = 'translateY(0)';
                             }
                           }}>
                             <div style={{
                               display: 'flex',
                               justifyContent: 'space-between',
                               alignItems: 'flex-start',
                               marginBottom: '0.75rem'
                             }}>
                               <div style={{
                                 display: 'flex',
                                 alignItems: 'center',
                                 gap: '0.75rem'
                               }}>
                                 <div style={{
                                   width: '2rem',
                                   height: '2rem',
                                   background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                   borderRadius: '50%',
                                   display: 'flex',
                                   alignItems: 'center',
                                   justifyContent: 'center',
                                   fontSize: '0.875rem',
                                   color: 'white',
                                   fontWeight: '600'
                                 }}>
                                   {index + 1}
                                 </div>
                                                                   <div>
                                    <h4 style={{
                                      fontSize: '1rem',
                                      fontWeight: '600',
                                      color: '#1e293b',
                                      margin: '0 0 0.5rem 0'
                                    }}>
                                      {(roturaPerdida.codigoCompleto || roturaPerdida.codigoPersonalizado) ? (
                                        <>
                                          <span style={{ color: '#3b82f6', fontWeight: '700' }}>
                                            {roturaPerdida.codigoCompleto || roturaPerdida.codigoPersonalizado}
                                          </span>
                                          <br />
                                          {roturaPerdida.descripcionCompleta || roturaPerdida.descripcionProducto || 'Producto no especificado'}
                                        </>
                                      ) : (
                                        roturaPerdida.descripcionCompleta || roturaPerdida.descripcionProducto || 'Producto no especificado'
                                      )}
                                    </h4>
                                    <div style={{
                                      display: 'flex',
                                      gap: '1rem',
                                      flexWrap: 'wrap',
                                      alignItems: 'center'
                                    }}>
                                      <span style={{
                                        fontSize: '0.75rem',
                                        color: '#059669',
                                        fontWeight: '600',
                                        background: '#f0fdf4',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.375rem',
                                        border: '1px solid #bbf7d0'
                                      }}>
                                        📊 {roturaPerdida.cantidad} unidad{roturaPerdida.cantidad !== 1 ? 'es' : ''}
                                      </span>
                                      <span style={{
                                        fontSize: '0.75rem',
                                        color: '#059669',
                                        fontWeight: '600',
                                        background: '#f0fdf4',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.375rem',
                                        border: '1px solid #bbf7d0'
                                      }}>
                                        📅 {formatearFecha(roturaPerdida.fecha)}
                                      </span>
                                      <span style={{
                                        fontSize: '0.75rem',
                                        color: '#64748b',
                                        fontWeight: '500',
                                        background: '#f8fafc',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.375rem',
                                        border: '1px solid #e2e8f0'
                                      }}>
                                        👤 {roturaPerdida.nombreUsuario || 'Usuario no disponible'}
                                      </span>
                                    </div>
                                  </div>
                               </div>
                               
                               <div style={{
                                 display: 'flex',
                                 gap: isMobile ? '6px' : '0.5rem',
                                 flexWrap: 'wrap'
                               }}>
                                 <button
                                   onClick={() => eliminarRoturaPerdida(roturaPerdida.id)}
                                   style={{
                                     background: '#ef4444',
                                     color: 'white',
                                     border: 'none',
                                     borderRadius: '0.5rem',
                                     padding: isMobile ? '6px 10px' : '0.5rem',
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
                             
                                                            <div style={{
                                 display: 'grid',
                                 gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
                                 gap: isMobile ? '12px' : '0.75rem'
                               }}>
                               <div>
                                 <label style={{
                                   display: 'block',
                                   fontSize: isMobile ? '0.65rem' : '0.75rem',
                                   fontWeight: '600',
                                   color: '#64748b',
                                   marginBottom: '0.25rem'
                                 }}>
                                   📊 Cantidad Perdida
                                 </label>
                                 <div style={{
                                   padding: isMobile ? '6px 8px' : '0.375rem',
                                   background: 'white',
                                   border: '2px solid #e2e8f0',
                                   borderRadius: '8px',
                                   fontSize: isMobile ? '0.8rem' : '1rem',
                                   fontWeight: '600',
                                   color: '#ef4444'
                                 }}>
                                   {roturaPerdida.cantidad} unidad{roturaPerdida.cantidad !== 1 ? 'es' : ''}
                                 </div>
                               </div>
                               

                               
                               <div>
                                 <label style={{
                                   display: 'block',
                                   fontSize: isMobile ? '0.65rem' : '0.75rem',
                                   fontWeight: '600',
                                   color: '#64748b',
                                   marginBottom: '0.25rem'
                                 }}>
                                   🕒 Fecha de Registro
                                 </label>
                                 <div style={{
                                   padding: isMobile ? '6px 8px' : '0.375rem',
                                   background: 'white',
                                   border: '2px solid #e2e8f0',
                                   borderRadius: '8px',
                                   fontSize: isMobile ? '0.8rem' : '0.875rem',
                                   color: '#374151'
                                 }}>
                                   {formatearFechaConHora(roturaPerdida.fechaCreacion)}
                                 </div>
                               </div>
                             </div>
                             
                             {roturaPerdida.observaciones && (
                               <div style={{
                                 marginTop: isMobile ? '12px' : '0.75rem',
                                 padding: isMobile ? '12px' : '0.75rem',
                                 background: '#fef3c7',
                                 borderRadius: '8px',
                                 border: '2px solid #f59e0b'
                               }}>
                                 <p style={{
                                   fontSize: isMobile ? '0.75rem' : '0.875rem',
                                   color: '#92400e',
                                   margin: 0,
                                   fontStyle: 'italic'
                                 }}>
                                   💬 {roturaPerdida.observaciones}
                                 </p>
                               </div>
                             )}
                           </div>
                         ))
                         )}
                       </div>
                     </div>
                   );
                 }
                 
                 // Vista normal por días (cuando no hay búsqueda)
                 return (
                   <div key={fecha} style={{
                     marginBottom: '2rem',
                     border: '1px solid #e2e8f0',
                     borderRadius: '0.75rem',
                     overflow: 'hidden'
                   }}>
                     {/* Header del día */}
                     <div
                       onClick={() => toggleDiaExpandido(fecha)}
                       style={{
                         background: modoNavegacion && elementoSeleccionado === fechasOrdenadas.indexOf(fecha) 
                           ? (esHoy ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : '#dbeafe')
                           : (esHoy ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : '#f8fafc'),
                         padding: isMobile ? '16px' : '24px',
                         cursor: 'pointer',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'space-between',
                         flexDirection: isMobile ? 'column' : 'row',
                         gap: isMobile ? '12px' : '0',
                         borderBottom: estaDiaExpandido(fecha) ? '2px solid #e2e8f0' : 'none',
                         borderLeft: modoNavegacion && elementoSeleccionado === fechasOrdenadas.indexOf(fecha) ? '4px solid #3b82f6' : 'none',
                         transition: 'all 0.2s ease',
                         boxShadow: modoNavegacion && elementoSeleccionado === fechasOrdenadas.indexOf(fecha) 
                           ? '0 4px 16px rgba(59, 130, 246, 0.3)' 
                           : '0 2px 8px rgba(0,0,0,0.05)'
                       }}
                       onMouseOver={(e) => {
                         if (!isMobile) {
                           e.currentTarget.style.transform = 'translateY(-1px)';
                           e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                         }
                       }}
                       onMouseOut={(e) => {
                         if (!isMobile) {
                           e.currentTarget.style.transform = 'translateY(0)';
                           e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                         }
                       }}
                     >
                       <div style={{
                         display: 'flex',
                         alignItems: 'center',
                         gap: isMobile ? '8px' : '1rem'
                       }}>
                         <span style={{
                           fontSize: isMobile ? '1rem' : '1.25rem',
                           color: esHoy ? 'white' : '#374151'
                         }}>
                           {esHoy ? '📅' : '📆'}
                         </span>
                         <div>
                           <h3 style={{
                             fontSize: isMobile ? '1rem' : '1.125rem',
                             fontWeight: '600',
                             color: esHoy ? 'white' : '#1e293b',
                             margin: 0
                           }}>
                             {esHoy ? 'Hoy' : formatearFecha(fecha)}
                           </h3>
                           <p style={{
                             fontSize: isMobile ? '0.75rem' : '0.875rem',
                             color: esHoy ? 'rgba(255, 255, 255, 0.8)' : '#64748b',
                             margin: '0.25rem 0 0 0'
                           }}>
                             {roturasDelDia.length} producto{roturasDelDia.length !== 1 ? 's' : ''} • {totalUnidades} unidad{totalUnidades !== 1 ? 'es' : ''} perdida{totalUnidades !== 1 ? 's' : ''}
                           </p>
                         </div>
                       </div>
                       
                       <div style={{
                         display: 'flex',
                         alignItems: 'center',
                         gap: isMobile ? '8px' : '1rem'
                       }}>
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             exportarRoturasPerdidasPorFecha(fecha);
                           }}
                           style={{
                             background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                             color: 'white',
                             border: 'none',
                             borderRadius: '0.5rem',
                             padding: isMobile ? '6px 10px' : '0.5rem 1rem',
                             fontSize: isMobile ? '0.65rem' : '0.75rem',
                             fontWeight: '600',
                             cursor: 'pointer',
                             display: 'flex',
                             alignItems: 'center',
                             gap: '0.25rem',
                             boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
                           }}
                         >
                           📄 Exportar
                         </button>
                         <span style={{
                           fontSize: isMobile ? '1rem' : '1.25rem',
                           color: esHoy ? 'white' : '#374151',
                           transition: 'transform 0.2s',
                           transform: estaDiaExpandido(fecha) ? 'rotate(180deg)' : 'rotate(0deg)'
                         }}>
                           ▼
                         </span>
                       </div>
                     </div>
                     
                     {/* Contenido del día */}
                     {estaDiaExpandido(fecha) && (
                      <div style={{
                        padding: isMobile ? '16px' : '24px'
                      }}>
                        {roturasDelDia.length === 0 ? (
                          <div style={{
                            textAlign: 'center',
                            padding: '2rem 1rem',
                            color: '#6b7280'
                          }}>
                            <p style={{
                              fontSize: '0.875rem',
                              margin: 0
                            }}>
                              No hay roturas o pérdidas registradas para este día
                            </p>
                          </div>
                        ) : (
                          roturasDelDia.map((roturaPerdida, index) => (
                                                     <div key={roturaPerdida.id} style={{
                             background: '#f8fafc',
                             borderRadius: '0.75rem',
                             padding: '1rem',
                             marginBottom: index < roturasDelDia.length - 1 ? '0.75rem' : 0,
                             border: '1px solid #e2e8f0'
                           }}>
                                                         <div style={{
                               display: 'flex',
                               justifyContent: 'space-between',
                               alignItems: 'flex-start',
                               marginBottom: '0.75rem'
                             }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                              }}>
                                <div style={{
                                  width: '2rem',
                                  height: '2rem',
                                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.875rem',
                                  color: 'white',
                                  fontWeight: '600'
                                }}>
                                  {index + 1}
                                </div>
                                                                 <div>
                                   <h4 style={{
                                     fontSize: '1rem',
                                     fontWeight: '600',
                                     color: '#1e293b',
                                     margin: '0 0 0.25rem 0'
                                   }}>
                                     {(roturaPerdida.codigoCompleto || roturaPerdida.codigoPersonalizado) ? (
                                       <>
                                         <span style={{ color: '#3b82f6', fontWeight: '700' }}>
                                           {roturaPerdida.codigoCompleto || roturaPerdida.codigoPersonalizado}
                                         </span>
                                         <br />
                                         {roturaPerdida.descripcionCompleta || roturaPerdida.descripcionProducto || 'Producto no especificado'}
                                       </>
                                     ) : (
                                       roturaPerdida.descripcionCompleta || roturaPerdida.descripcionProducto || 'Producto no especificado'
                                     )}
                                   </h4>
                                 </div>
                              </div>
                              
                              <div style={{
                                display: 'flex',
                                gap: '0.5rem'
                              }}>
                                <button
                                  onClick={() => eliminarRoturaPerdida(roturaPerdida.id)}
                                  style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    padding: '0.5rem',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}
                                >
                                  🗑️ Eliminar
                                </button>
                              </div>
                            </div>
                            
                                                         <div style={{
                               display: 'grid',
                               gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
                               gap: '0.75rem'
                             }}>
                              <div style={{
                                display: 'flex',
                                gap: '1rem',
                                flexWrap: 'wrap',
                                alignItems: 'center'
                              }}>
                                <span style={{
                                  fontSize: '0.75rem',
                                  color: '#ef4444',
                                  fontWeight: '600',
                                  background: '#fef2f2',
                                  padding: '0.375rem 0.75rem',
                                  borderRadius: '0.5rem',
                                  border: '1px solid #fecaca'
                                }}>
                                  📊 {roturaPerdida.cantidad} unidad{roturaPerdida.cantidad !== 1 ? 'es' : ''}
                                </span>
                                <span style={{
                                  fontSize: '0.75rem',
                                  color: '#059669',
                                  fontWeight: '600',
                                  background: '#f0fdf4',
                                  padding: '0.375rem 0.75rem',
                                  borderRadius: '0.5rem',
                                  border: '1px solid #bbf7d0'
                                }}>
                                  🕒 {formatearFechaConHora(roturaPerdida.fechaCreacion)}
                                </span>
                                <span style={{
                                  fontSize: '0.75rem',
                                  color: '#64748b',
                                  fontWeight: '500',
                                  background: '#f8fafc',
                                  padding: '0.375rem 0.75rem',
                                  borderRadius: '0.5rem',
                                  border: '1px solid #e2e8f0'
                                }}>
                                  👤 {roturaPerdida.nombreUsuario || 'Usuario no disponible'}
                                </span>
                              </div>
                            </div>
                            
                                                         {roturaPerdida.observaciones && (
                               <div style={{
                                 marginTop: '0.75rem',
                                 padding: '0.75rem',
                                 background: '#fef3c7',
                                 borderRadius: '0.5rem',
                                 border: '1px solid #f59e0b'
                               }}>
                                <p style={{
                                  fontSize: '0.875rem',
                                  color: '#92400e',
                                  margin: 0,
                                  fontStyle: 'italic'
                                }}>
                                  💬 {roturaPerdida.observaciones}
                                </p>
                              </div>
                            )}
                          </div>
                        ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal para agregar rotura/pérdida */}
      <ModalAgregarRoturaPerdida
        isOpen={mostrarModalAgregar}
        onClose={() => setMostrarModalAgregar(false)}
        onRoturaPerdidaCreada={cargarRoturasPerdidas}
      />
    </div>
  );
}