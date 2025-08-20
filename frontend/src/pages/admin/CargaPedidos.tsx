import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
import { formatearFecha, formatearFechaCorta, formatearFechaConHora } from '../../utils/dateUtils';
import TimeZoneInfo from '../../components/TimeZoneInfo';

interface PlanillaPedido {
  id: number;
  numeroPlanilla: string;
  observaciones?: string;
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
  const [planillaSeleccionada, setPlanillaSeleccionada] = useState<PlanillaPedido | null>(null);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [diasExpandidos, setDiasExpandidos] = useState<Set<string>>(new Set());
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);

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
        p.fechaPlanilla.split('T')[0] === filtroFecha
      );
    }

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
    const grupos: { [fecha: string]: PlanillaPedido[] } = {};
    
    planillasFiltradas.forEach(planilla => {
      // Extraer solo la parte de la fecha (YYYY-MM-DD) del LocalDateTime
      const fecha = planilla.fechaPlanilla.split('T')[0];
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
    return hoy.toISOString().split('T')[0];
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
        navigate('/admin/gestion-empresa');
      }
    };

    document.addEventListener('keydown', manejarEscape);
    return () => {
      document.removeEventListener('keydown', manejarEscape);
    };
  }, [navigate]);

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
      link.download = `Planilla_${planilla.numeroPlanilla}_${planilla.fechaPlanilla}.xlsx`;
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
        padding: isMobile ? '6rem 1rem 1rem 1rem' : '7rem 2rem 2rem 2rem'
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
                  Carga de Pedidos
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
                <div style={{ marginTop: '8px' }}>
                  <TimeZoneInfo showDetails={true} />
                </div>
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
                                 placeholder="Buscar por número de planilla o observaciones..."
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
                      borderRadius: '0.75rem',
                      padding: '1rem 1.5rem',
                      marginBottom: '1rem',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => alternarExpansionDia(grupo.fecha)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <div style={{
                          fontSize: '1.25rem',
                          color: '#64748b',
                          transition: 'transform 0.2s ease',
                          transform: estaDiaExpandido(grupo.fecha) ? 'rotate(90deg)' : 'rotate(0deg)'
                        }}>
                          ▶️
                        </div>
                        <div>
                          <h4 style={{
                            fontSize: '1.125rem',
                            fontWeight: '700',
                            color: '#1e293b',
                            margin: 0,
                            textTransform: 'capitalize'
                          }}>
                            {formatearFecha(grupo.fecha)}
                          </h4>
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#64748b',
                            margin: '0.25rem 0 0 0'
                          }}>
                            {grupo.planillas.length} planilla{grupo.planillas.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center'
                      }}>
                        <div style={{
                          background: '#10b981',
                          color: 'white',
                          borderRadius: '0.5rem',
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          fontWeight: '600'
                        }}>
                          {grupo.planillas.length} planilla{grupo.planillas.length !== 1 ? 's' : ''}
                        </div>
                                                 <div style={{
                           background: '#3b82f6',
                           color: 'white',
                           borderRadius: '0.5rem',
                           padding: '0.5rem 1rem',
                           fontSize: '0.875rem',
                           fontWeight: '600'
                         }}>
                           {grupo.planillas.reduce((total, p) => total + p.totalProductos, 0)} unidades
                         </div>
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
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.75rem',
                            padding: '1.5rem',
                            transition: 'all 0.3s ease',
                            background: 'white'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = '#3b82f6';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.1)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.boxShadow = 'none';
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
                                gap: '1rem',
                                fontSize: '0.875rem',
                                color: '#64748b',
                                flexWrap: 'wrap'
                              }}>
                                <span>📅 {formatearFechaCorta(planilla.fechaPlanilla)}</span>
                                                                 <span>📦 <span style={{ 
                                   color: '#3b82f6', 
                                   fontWeight: '700'
                                 }}>
                                   {planilla.totalProductos}
                                 </span> unidades</span>
                                 <span>🛒 {planilla.detalles.length} productos</span>
                                <span>⏰ {formatearFechaConHora(planilla.fechaCreacion)}</span>
                              </div>
                            </div>
                            <div style={{
                              display: 'flex',
                              gap: '0.5rem',
                              flexDirection: isMobile ? 'column' : 'row'
                            }}>
                              <button
                                onClick={() => exportarPlanilla(planilla)}
                                style={{
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.5rem',
                                  padding: '0.5rem 1rem',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
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
                                  padding: '0.5rem 1rem',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
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
                                  padding: '0.5rem 1rem',
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
                          
                          {planilla.observaciones && (
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
                                💬 {planilla.observaciones}
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
                padding: '2rem',
                overflow: 'auto',
                flex: 1
              }}>
                {/* Información General */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  border: '1px solid #e2e8f0'
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
                     gap: '1rem'
                   }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#64748b',
                        marginBottom: '0.5rem'
                      }}>
                        📅 Fecha de Planilla
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
                  
                  {planillaSeleccionada.observaciones && (
                    <div style={{ marginTop: '1rem' }}>
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
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                      padding: '1rem 1.5rem',
                      borderBottom: '1px solid #e2e8f0',
                      display: 'grid',
                      gridTemplateColumns: '50px 1fr 100px',
                      gap: '1rem',
                      alignItems: 'center',
                      fontSize: '0.875rem',
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
                          padding: '1rem 1.5rem',
                          borderBottom: index < planillaSeleccionada.detalles.length - 1 ? '1px solid #f1f5f9' : 'none',
                          display: 'grid',
                          gridTemplateColumns: '50px 1fr 100px',
                          gap: '1rem',
                          alignItems: 'center',
                          background: index % 2 === 0 ? 'white' : '#f8fafc'
                        }}
                      >
                        <div style={{
                          background: '#3b82f6',
                          color: 'white',
                          borderRadius: '50%',
                          width: '2rem',
                          height: '2rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.875rem',
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
      </div>
    </div>
  );
}
