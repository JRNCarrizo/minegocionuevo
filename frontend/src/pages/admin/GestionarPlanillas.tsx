import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';

interface PlanillaPedido {
  id: number;
  numeroPlanilla: string;
  fechaPlanilla: string;
  transporte: string;
  observaciones: string;
  totalProductos: number;
  fechaCreacion: string;
  detalles: DetallePlanillaPedido[];
}

interface DetallePlanillaPedido {
  id: number;
  productoId: number;
  descripcion: string;
  cantidad: number;
  observaciones?: string;
}

export default function GestionarPlanillas() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile, isTablet } = useResponsive();
  const navigate = useNavigate();
  
  const [planillas, setPlanillas] = useState<PlanillaPedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [planillaSeleccionada, setPlanillaSeleccionada] = useState<PlanillaPedido | null>(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  useEffect(() => {
    cargarPlanillas();
  }, []);

  const cargarPlanillas = async () => {
    try {
      setCargando(true);
      const response = await ApiService.obtenerPlanillasPedidos();
      if (response.success) {
        setPlanillas(response.data);
      } else {
        toast.error('Error al cargar las planillas');
      }
    } catch (error) {
      console.error('Error al cargar planillas:', error);
      toast.error('Error al cargar las planillas');
    } finally {
      setCargando(false);
    }
  };

  const verDetalle = async (planilla: PlanillaPedido) => {
    try {
      const response = await ApiService.obtenerPlanillaPedidoPorId(planilla.id);
      if (response.success) {
        setPlanillaSeleccionada(response.data);
        setMostrarDetalle(true);
      } else {
        toast.error('Error al cargar el detalle de la planilla');
      }
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      toast.error('Error al cargar el detalle de la planilla');
    }
  };

  const exportarPlanilla = async (planilla: PlanillaPedido) => {
    try {
      toast.loading('Exportando planilla...');
      
      const blob = await ApiService.exportarPlanillaPedido(planilla.id);
      
      // Crear URL y descargar archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Planilla_${planilla.numeroPlanilla}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.dismiss();
      toast.success('Planilla exportada exitosamente');
      
    } catch (error) {
      console.error('Error al exportar planilla:', error);
      toast.dismiss();
      toast.error('Error al exportar la planilla');
    }
  };

  const cerrarSesionConToast = () => {
    cerrarSesion();
    toast.success('Sesión cerrada correctamente');
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const extraerPatente = (transporte: string) => {
    // Buscar patente en el formato: "Código - Nombre (Modelo - PATENTE)"
    const match = transporte.match(/\([^)]*-\s*([A-Z0-9]+)\)/);
    return match ? match[1] : null;
  };

  if (cargando) {
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
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>📋</div>
          <div style={{ fontSize: '1.125rem', color: '#374151' }}>Cargando planillas...</div>
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
        datosUsuario={datosUsuario} 
        cerrarSesion={cerrarSesionConToast}
        mostrarNotificaciones={false}
      />
      
      <div style={{
        padding: isMobile ? '1rem' : '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: isMobile ? '1.5rem' : '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <h1 style={{
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: '700',
              color: '#1f2937',
              margin: 0
            }}>
              📋 Gestionar Planillas
            </h1>
            <button
              onClick={() => navigate('/admin/crear-planilla')}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              ➕ Nueva Planilla
            </button>
          </div>
          
          <p style={{
            color: '#6b7280',
            margin: 0,
            fontSize: '1rem'
          }}>
            Gestiona y visualiza todas las planillas de pedidos creadas
          </p>
        </div>

        {/* Lista de Planillas */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: isMobile ? '1rem' : '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          {planillas.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No hay planillas</h3>
              <p>No se han creado planillas aún.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '1rem'
            }}>
              {planillas.map((planilla) => {
                const patente = extraerPatente(planilla.transporte);
                
                return (
                  <div
                    key={planilla.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          marginBottom: '0.5rem'
                        }}>
                          <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: '#1f2937',
                            margin: 0
                          }}>
                            Planilla #{planilla.numeroPlanilla}
                          </h3>
                          <span style={{
                            background: '#f3f4f6',
                            color: '#374151',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}>
                            {formatearFecha(planilla.fechaPlanilla)}
                          </span>
                        </div>
                        
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                          gap: '1rem',
                          marginBottom: '1rem'
                        }}>
                          <div>
                            <div style={{
                              fontSize: '0.875rem',
                              color: '#6b7280',
                              marginBottom: '0.25rem'
                            }}>
                              Transportista
                            </div>
                            <div style={{
                              fontSize: '1rem',
                              color: '#1f2937',
                              fontWeight: '500'
                            }}>
                              {planilla.transporte}
                              {patente && (
                                <span style={{
                                  marginLeft: '0.5rem',
                                  background: '#dbeafe',
                                  color: '#1e40af',
                                  padding: '0.125rem 0.5rem',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.75rem',
                                  fontWeight: '600'
                                }}>
                                  🚛 {patente}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <div style={{
                              fontSize: '0.875rem',
                              color: '#6b7280',
                              marginBottom: '0.25rem'
                            }}>
                              Productos
                            </div>
                            <div style={{
                              fontSize: '1rem',
                              color: '#1f2937',
                              fontWeight: '500'
                            }}>
                              {planilla.totalProductos} productos
                            </div>
                          </div>
                        </div>
                        
                        {planilla.observaciones && (
                          <div>
                            <div style={{
                              fontSize: '0.875rem',
                              color: '#6b7280',
                              marginBottom: '0.25rem'
                            }}>
                              Observaciones
                            </div>
                            <div style={{
                              fontSize: '0.875rem',
                              color: '#374151',
                              fontStyle: 'italic'
                            }}>
                              {planilla.observaciones}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginLeft: '1rem'
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            verDetalle(planilla);
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          👁️ Ver
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            exportarPlanilla(planilla);
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          📊 Exportar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalle */}
      {mostrarDetalle && planillaSeleccionada && (
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
            padding: '2rem',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1f2937',
                margin: 0
              }}>
                Detalle de Planilla #{planillaSeleccionada.numeroPlanilla}
              </h2>
              <button
                onClick={() => setMostrarDetalle(false)}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  color: '#6b7280'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{
              display: 'grid',
              gap: '1.5rem'
            }}>
              <div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '1rem'
                }}>
                  Información General
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      marginBottom: '0.25rem'
                    }}>
                      Fecha
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      color: '#1f2937',
                      fontWeight: '500'
                    }}>
                      {formatearFecha(planillaSeleccionada.fechaPlanilla)}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      marginBottom: '0.25rem'
                    }}>
                      Total Productos
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      color: '#1f2937',
                      fontWeight: '500'
                    }}>
                      {planillaSeleccionada.totalProductos}
                    </div>
                  </div>
                  
                  <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      marginBottom: '0.25rem'
                    }}>
                      Transportista
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      color: '#1f2937',
                      fontWeight: '500'
                    }}>
                      {planillaSeleccionada.transporte}
                      {extraerPatente(planillaSeleccionada.transporte) && (
                        <span style={{
                          marginLeft: '0.5rem',
                          background: '#dbeafe',
                          color: '#1e40af',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: '600'
                        }}>
                          🚛 {extraerPatente(planillaSeleccionada.transporte)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {planillaSeleccionada.observaciones && (
                    <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        marginBottom: '0.25rem'
                      }}>
                        Observaciones
                      </div>
                      <div style={{
                        fontSize: '1rem',
                        color: '#374151',
                        fontStyle: 'italic'
                      }}>
                        {planillaSeleccionada.observaciones}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '1rem'
                }}>
                  Productos
                </h3>
                <div style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  overflow: 'hidden'
                }}>
                  {planillaSeleccionada.detalles.map((detalle, index) => (
                    <div
                      key={detalle.id}
                      style={{
                        padding: '1rem',
                        borderBottom: index < planillaSeleccionada.detalles.length - 1 ? '1px solid #e5e7eb' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{
                          fontSize: '1rem',
                          fontWeight: '500',
                          color: '#1f2937',
                          marginBottom: '0.25rem'
                        }}>
                          {detalle.descripcion}
                        </div>
                        {detalle.observaciones && (
                          <div style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            fontStyle: 'italic'
                          }}>
                            {detalle.observaciones}
                          </div>
                        )}
                      </div>
                      <div style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#1f2937'
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
  );
}
