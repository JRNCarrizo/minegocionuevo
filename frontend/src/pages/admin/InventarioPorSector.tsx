import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';

interface Sector {
  id: number;
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
}

interface Usuario {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  rol: string;
}

interface InventarioPorSector {
  id: number;
  sector: Sector;
  usuarioAsignado1?: Usuario;
  usuarioAsignado2?: Usuario;
  estado: string;
  totalProductos: number;
  productosContados: number;
  porcentajeCompletado: number;
  fechaInicio: string;
}

export default function InventarioPorSector() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [usuariosAsignados, setUsuariosAsignados] = useState<Usuario[]>([]);
  const [inventariosActivos, setInventariosActivos] = useState<InventarioPorSector[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [sectorSeleccionado, setSectorSeleccionado] = useState<number | null>(null);
  const [creandoInventario, setCreandoInventario] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      // Aquí cargarías los datos desde la API
      // Por ahora simulamos datos
      setSectores([]);
      setUsuariosAsignados([]);
      setInventariosActivos([]);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  const crearInventarioPorSector = async () => {
    if (!sectorSeleccionado) {
      toast.error('Debe seleccionar un sector');
      return;
    }

    try {
      setCreandoInventario(true);
      // Aquí llamarías a la API para crear el inventario
      toast.success('Inventario por sector creado exitosamente');
      setMostrarModalCrear(false);
        setSectorSeleccionado(null);
      await cargarDatos();
    } catch (error) {
      console.error('Error creando inventario:', error);
      toast.error('Error al crear el inventario');
    } finally {
      setCreandoInventario(false);
    }
  };

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return '#f59e0b';
      case 'EN_PROGRESO': return '#3b82f6';
      case 'ESPERANDO_VERIFICACION': return '#8b5cf6';
      case 'CON_DIFERENCIAS': return '#ef4444';
      case 'COMPLETADO': return '#10b981';
      case 'CANCELADO': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const obtenerTextoEstado = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'Pendiente';
      case 'EN_PROGRESO': return 'En Progreso';
      case 'ESPERANDO_VERIFICACION': return 'Esperando Verificación';
      case 'CON_DIFERENCIAS': return 'Con Diferencias';
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
            borderTop: '4px solid #06b6d4',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280', margin: 0 }}>Cargando inventario por sector...</p>
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
            🏪 Inventario por Sector
              </h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: isMobile ? '1rem' : '1.2rem',
            margin: 0
          }}>
            Inventario específico de un sector con doble verificación
              </p>
            </div>
            
        {/* Botón para crear nuevo inventario */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
              <button
            onClick={() => setMostrarModalCrear(true)}
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '1rem 2rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            }}
          >
            ➕ Crear Nuevo Inventario por Sector
                </button>
        </div>

        {/* Inventarios activos */}
        {inventariosActivos.length > 0 ? (
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
              📊 Inventarios Activos por Sector
            </h3>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {inventariosActivos.map((inventario) => (
                <div
                  key={inventario.id}
                  style={{
                    background: '#f8fafc',
                    borderRadius: '0.5rem',
                    padding: '1.5rem',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <h4 style={{
                        margin: '0 0 0.25rem 0',
                        color: '#1e293b',
                        fontSize: '1.1rem',
                        fontWeight: 'bold'
                      }}>
                        {inventario.sector.nombre}
                      </h4>
                      <p style={{
                        margin: 0,
                        color: '#64748b',
                        fontSize: '0.9rem'
                      }}>
                        {inventario.sector.descripcion || 'Sin descripción'}
                      </p>
                  </div>
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

                  {/* Información del inventario */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#64748b',
                        marginBottom: '0.25rem'
                      }}>
                        Productos
                      </div>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#1e293b'
                      }}>
                        {inventario.productosContados} / {inventario.totalProductos}
                      </div>
                    </div>
                    <div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#64748b',
                        marginBottom: '0.25rem'
                      }}>
                        Progreso
                      </div>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#1e293b'
                      }}>
                        {inventario.porcentajeCompletado.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#64748b',
                        marginBottom: '0.25rem'
                      }}>
                        Asignados
                      </div>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#1e293b'
                      }}>
                        {inventario.usuarioAsignado1 && inventario.usuarioAsignado2 ? '2' : '0'}
                      </div>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div style={{
                    background: '#e2e8f0',
                    borderRadius: '0.25rem',
                    height: '0.5rem',
                    overflow: 'hidden',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      background: 'linear-gradient(90deg, #06b6d4 0%, #0891b2 100%)',
                      height: '100%',
                      width: `${inventario.porcentajeCompletado}%`,
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>

                  {/* Usuarios asignados */}
                  {inventario.usuarioAsignado1 && inventario.usuarioAsignado2 ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                      gap: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        background: 'white',
                        borderRadius: '0.25rem',
                        padding: '0.5rem',
                        fontSize: '0.9rem',
                        color: '#374151'
                      }}>
                        👤 {inventario.usuarioAsignado1.nombre} {inventario.usuarioAsignado1.apellidos}
                      </div>
                      <div style={{
                        background: 'white',
                        borderRadius: '0.25rem',
                        padding: '0.5rem',
                        fontSize: '0.9rem',
                        color: '#374151'
                      }}>
                        👤 {inventario.usuarioAsignado2.nombre} {inventario.usuarioAsignado2.apellidos}
                  </div>
                </div>
                  ) : (
                    <div style={{
                      background: '#fef3c7',
                      border: '1px solid #f59e0b',
                      borderRadius: '0.25rem',
                      padding: '0.75rem',
                      textAlign: 'center',
                      marginBottom: '1rem'
                    }}>
                      <p style={{
                        margin: 0,
                        color: '#92400e',
                        fontSize: '0.9rem'
                      }}>
                        ⚠️ Este inventario necesita asignación de usuarios
                      </p>
              </div>
            )}

                  {/* Acciones */}
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    justifyContent: 'flex-end'
                  }}>
                    {!inventario.usuarioAsignado1 || !inventario.usuarioAsignado2 ? (
                      <button
                        onClick={() => {
                          // Navegar a la página de asignación de usuarios
                          navigate(`/admin/asignar-usuarios-inventario/${inventario.id}`);
                        }}
                        style={{
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          padding: '0.5rem 1rem',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Asignar Usuarios
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          // Navegar al conteo del inventario
                          navigate(`/admin/conteo-inventario-sector/${inventario.id}`);
                        }}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          padding: '0.5rem 1rem',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Ver Conteo
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
              </div>
        ) : (
          /* Sin inventarios activos */
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '3rem 2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '1rem'
            }}>
              📋
            </div>
            <h3 style={{
              margin: '0 0 1rem 0',
              color: '#1e293b',
              fontSize: '1.3rem',
              fontWeight: 'bold'
            }}>
              No hay inventarios activos
            </h3>
            <p style={{
              color: '#64748b',
              lineHeight: '1.6',
              marginBottom: '1.5rem'
            }}>
              Crea un nuevo inventario por sector para comenzar el proceso de conteo con doble verificación.
            </p>
          </div>
        )}

        {/* Modal para crear nuevo inventario */}
        {mostrarModalCrear && (
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
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <h3 style={{
                margin: '0 0 1.5rem 0',
                color: '#1e293b',
                fontSize: '1.3rem',
                fontWeight: 'bold'
              }}>
                Crear Inventario por Sector
                </h3>
                
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  Seleccionar Sector:
                  </label>
                  <select
                  value={sectorSeleccionado || ''}
                  onChange={(e) => setSectorSeleccionado(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Seleccionar sector</option>
                  {sectores.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.nombre} {sector.descripcion && `- ${sector.descripcion}`}
                      </option>
                    ))}
                  </select>
                </div>

              <div style={{
                background: '#f0f9ff',
                border: '1px solid #0ea5e9',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <p style={{
                  margin: 0,
                  color: '#0c4a6e',
                  fontSize: '0.9rem',
                  lineHeight: '1.5'
                }}>
                  ℹ️ Después de crear el inventario, podrás asignar dos usuarios para realizar el conteo con doble verificación.
                </p>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                  <button
                  onClick={() => {
                    setMostrarModalCrear(false);
                    setSectorSeleccionado(null);
                  }}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                  >
                    Cancelar
                  </button>
                  <button
                  onClick={crearInventarioPorSector}
                  disabled={creandoInventario}
                  style={{
                    background: '#06b6d4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: creandoInventario ? 'not-allowed' : 'pointer',
                    opacity: creandoInventario ? 0.7 : 1
                  }}
                >
                  {creandoInventario ? 'Creando...' : 'Crear Inventario'}
                  </button>
              </div>
            </div>
          </div>
        )}

        {/* Botón de regreso */}
        <div style={{
          textAlign: 'center',
          marginTop: '2rem'
        }}>
          <button
            onClick={() => navigate('/admin/gestion-inventario')}
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
            ← Volver a Gestión de Inventario
          </button>
        </div>
      </div>
    </div>
  );
}