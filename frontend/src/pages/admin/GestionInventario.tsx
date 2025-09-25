import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';

interface InventarioCompleto {
  id: number;
  fechaInicio: string;
  estado: string;
  totalSectores: number;
  sectoresCompletados: number;
  sectoresEnProgreso: number;
  sectoresPendientes: number;
  porcentajeCompletado: number;
}

interface InventarioPorSector {
  id: number;
  sector: {
    id: number;
    nombre: string;
  };
  fechaInicio: string;
  estado: string;
  totalProductos: number;
  productosContados: number;
  porcentajeCompletado: number;
}

export default function GestionInventario() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  
  const [inventariosCompletos, setInventariosCompletos] = useState<InventarioCompleto[]>([]);
  const [inventariosPorSector, setInventariosPorSector] = useState<InventarioPorSector[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarInventarios();
  }, []);

  const cargarInventarios = async () => {
    try {
      setCargando(true);
      // Aquí cargarías los inventarios desde la API
      // Por ahora simulamos datos
      setInventariosCompletos([]);
      setInventariosPorSector([]);
    } catch (error) {
      console.error('Error cargando inventarios:', error);
      toast.error('Error al cargar los inventarios');
    } finally {
      setCargando(false);
    }
  };

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return '#f59e0b';
      case 'EN_PROGRESO': return '#3b82f6';
      case 'COMPLETADO': return '#10b981';
      case 'CANCELADO': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const obtenerTextoEstado = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'Pendiente';
      case 'EN_PROGRESO': return 'En Progreso';
      case 'COMPLETADO': return 'Completado';
      case 'CANCELADO': return 'Cancelado';
      default: return estado;
    }
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
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #7c3aed',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280', margin: 0 }}>Cargando gestión de inventario...</p>
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
        empresaNombre={datosUsuario?.empresa?.nombre}
        nombreAdministrador={datosUsuario?.nombre}
      />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        paddingTop: isMobile ? '8rem' : '9rem',
        paddingBottom: isMobile ? '1rem' : '2rem',
        paddingLeft: isMobile ? '1rem' : '2rem',
        paddingRight: isMobile ? '1rem' : '2rem'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            color: 'white',
            fontSize: isMobile ? '1.8rem' : '2.5rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>
            📋 Gestión de Inventario
          </h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: isMobile ? '1rem' : '1.2rem',
            margin: 0
          }}>
            Inventario completo y por sector con doble verificación
          </p>
        </div>

        {/* Opciones principales */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Inventario Completo */}
          <div
            onClick={() => navigate('/admin/inventario-completo')}
            style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px'
            }}></div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <div style={{
                fontSize: '2.5rem',
                marginRight: '1rem'
              }}>
                🏢
              </div>
              <div>
                <h3 style={{
                  margin: 0,
                  color: '#1e293b',
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}>
                  Inventario Completo
                </h3>
                <p style={{
                  margin: 0,
                  color: '#64748b',
                  fontSize: '0.9rem'
                }}>
                  Todos los sectores
                </p>
              </div>
            </div>
            
            <p style={{
              color: '#64748b',
              lineHeight: '1.6',
              marginBottom: '1.5rem'
            }}>
              Realiza un inventario completo de todos los sectores de tu empresa con doble verificación por sector.
            </p>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{
                color: '#7c3aed',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}>
                Iniciar Inventario
              </span>
              <div style={{
                color: '#7c3aed',
                fontSize: '1.2rem'
              }}>
                →
              </div>
            </div>
          </div>

          {/* Inventario por Sector */}
          <div
            onClick={() => navigate('/admin/inventario-por-sector')}
            style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px'
            }}></div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <div style={{
                fontSize: '2.5rem',
                marginRight: '1rem'
              }}>
                🏪
              </div>
              <div>
                <h3 style={{
                  margin: 0,
                  color: '#1e293b',
                  fontSize: '1.5rem',
                  fontWeight: 'bold'
                }}>
                  Inventario por Sector
                </h3>
                <p style={{
                  margin: 0,
                  color: '#64748b',
                  fontSize: '0.9rem'
                }}>
                  Sector específico
                </p>
              </div>
            </div>
            
            <p style={{
              color: '#64748b',
              lineHeight: '1.6',
              marginBottom: '1.5rem'
            }}>
              Realiza un inventario específico de un sector con doble verificación.
            </p>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{
                color: '#06b6d4',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}>
                Seleccionar Sector
              </span>
              <div style={{
                color: '#06b6d4',
                fontSize: '1.2rem'
              }}>
                →
              </div>
            </div>
          </div>
        </div>

        {/* Inventarios Activos */}
        {(inventariosCompletos.length > 0 || inventariosPorSector.length > 0) && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{
              margin: '0 0 1.5rem 0',
              color: '#1e293b',
              fontSize: '1.3rem',
              fontWeight: 'bold'
            }}>
              📊 Inventarios Activos
            </h3>
            
            {inventariosCompletos.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{
                  margin: '0 0 1rem 0',
                  color: '#374151',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>
                  Inventarios Completos
                </h4>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {inventariosCompletos.map((inventario) => (
                    <div
                      key={inventario.id}
                      style={{
                        background: '#f8fafc',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{
                          fontWeight: '600',
                          color: '#1e293b'
                        }}>
                          Inventario #{inventario.id}
                        </span>
                        <span style={{
                          background: obtenerColorEstado(inventario.estado),
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.8rem',
                          fontWeight: '500'
                        }}>
                          {obtenerTextoEstado(inventario.estado)}
                        </span>
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '0.5rem',
                        fontSize: '0.9rem',
                        color: '#64748b'
                      }}>
                        <div>Sectores: {inventario.totalSectores}</div>
                        <div>Completados: {inventario.sectoresCompletados}</div>
                        <div>En Progreso: {inventario.sectoresEnProgreso}</div>
                        <div>Progreso: {inventario.porcentajeCompletado.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {inventariosPorSector.length > 0 && (
              <div>
                <h4 style={{
                  margin: '0 0 1rem 0',
                  color: '#374151',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>
                  Inventarios por Sector
                </h4>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {inventariosPorSector.map((inventario) => (
                    <div
                      key={inventario.id}
                      style={{
                        background: '#f8fafc',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{
                          fontWeight: '600',
                          color: '#1e293b'
                        }}>
                          {inventario.sector.nombre}
                        </span>
                        <span style={{
                          background: obtenerColorEstado(inventario.estado),
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.8rem',
                          fontWeight: '500'
                        }}>
                          {obtenerTextoEstado(inventario.estado)}
                        </span>
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '0.5rem',
                        fontSize: '0.9rem',
                        color: '#64748b'
                      }}>
                        <div>Productos: {inventario.totalProductos}</div>
                        <div>Contados: {inventario.productosContados}</div>
                        <div>Progreso: {inventario.porcentajeCompletado.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botón de regreso */}
        <div style={{
          textAlign: 'center',
          marginTop: '2rem'
        }}>
          <button
            onClick={() => navigate('/admin/gestion-empresa')}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            ← Volver a Gestión de Empresa
          </button>
        </div>
      </div>
    </div>
  );
}










