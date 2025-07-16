import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ventaRapidaService, type VentaRapida as VentaRapidaType, type EstadisticasVentaRapida } from '../../services/ventaRapidaService';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';

type VentaRapida = VentaRapidaType;
type Estadisticas = EstadisticasVentaRapida;

const HistorialVentasRapidas: React.FC = () => {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile } = useResponsive();
  const [ventas, setVentas] = useState<VentaRapida[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVenta, setSelectedVenta] = useState<VentaRapida | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Filtros
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [filtroActivo, setFiltroActivo] = useState(false);

  // Estadísticas por período
  const [estadisticasDiarias, setEstadisticasDiarias] = useState<Estadisticas | null>(null);
  const [estadisticasMensuales, setEstadisticasMensuales] = useState<Estadisticas | null>(null);
  const [estadisticasAnuales, setEstadisticasAnuales] = useState<Estadisticas | null>(null);

  useEffect(() => {
    cargarHistorial();
    cargarEstadisticas();
  }, []);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const response = await ventaRapidaService.obtenerHistorial();
      
      if (response.data) {
        setVentas(response.data);
      } else {
        setError(response.mensaje || 'Error al cargar el historial');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await ventaRapidaService.obtenerEstadisticas();
      
      if (response.data) {
        setEstadisticas(response.data);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  const aplicarFiltros = async () => {
    try {
      setLoading(true);
      let response;

      if (fechaInicio && fechaFin) {
        response = await ventaRapidaService.obtenerVentasPorFecha(fechaInicio, fechaFin);
      } else if (metodoPago) {
        response = await ventaRapidaService.obtenerVentasPorMetodoPago(metodoPago);
      } else {
        response = await ventaRapidaService.obtenerHistorial();
      }

      if (response.data) {
        setVentas(response.data);
        setFiltroActivo(true);
      } else {
        setError(response.mensaje || 'Error al aplicar filtros');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setFechaInicio('');
    setFechaFin('');
    setMetodoPago('');
    setFiltroActivo(false);
    cargarHistorial();
  };

  const cargarEstadisticasDiarias = async () => {
    if (!fechaInicio) return;
    
    try {
      const response = await ventaRapidaService.obtenerEstadisticasDiarias(fechaInicio);
      if (response.data) {
        setEstadisticasDiarias(response.data);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas diarias:', err);
    }
  };

  const cargarEstadisticasMensuales = async () => {
    const fecha = new Date();
    try {
      const response = await ventaRapidaService.obtenerEstadisticasMensuales(fecha.getFullYear(), fecha.getMonth() + 1);
      if (response.data) {
        setEstadisticasMensuales(response.data);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas mensuales:', err);
    }
  };

  const cargarEstadisticasAnuales = async () => {
    const fecha = new Date();
    try {
      const response = await ventaRapidaService.obtenerEstadisticasAnuales(fecha.getFullYear());
      if (response.data) {
        setEstadisticasAnuales(response.data);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas anuales:', err);
    }
  };

  const verDetalleVenta = (venta: VentaRapida) => {
    setSelectedVenta(venta);
    setDialogOpen(true);
  };

  const getMetodoPagoColor = (metodo: string | undefined | null) => {
    if (!metodo) return '#6b7280';
    
    switch (metodo.toUpperCase()) {
      case 'EFECTIVO':
        return '#10b981';
      case 'TARJETA':
        return '#3b82f6';
      case 'TRANSFERENCIA':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(monto);
  };

  const cerrarSesionConToast = () => {
    cerrarSesion();
    toast.success('Sesión cerrada correctamente');
  };

  if (loading && ventas.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#64748b'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p>Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      <NavbarAdmin 
        onCerrarSesion={cerrarSesionConToast}
        empresaNombre={datosUsuario?.empresaNombre}
        nombreAdministrador={datosUsuario?.nombre}
      />

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        paddingTop: (isMobile || window.innerWidth < 768) ? '10.5rem' : '5rem',
        paddingBottom: '2rem',
        paddingLeft: '1rem',
        paddingRight: '1rem'
      }}>
        {/* Encabezado */}
        <div style={{
          marginBottom: '2rem',
          textAlign: isMobile ? 'center' : 'left'
        }}>
          <h1 style={{
            fontSize: isMobile ? '1.75rem' : '2.5rem',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            📊 Historial de Caja Rápida
          </h1>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            color: '#64748b',
            lineHeight: '1.6'
          }}>
            Consulta y analiza todas las ventas realizadas desde la caja rápida
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '2rem'
          }}>
            {error}
          </div>
        )}

        {/* Estadísticas Generales */}
        {estadisticas && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: isMobile ? '1rem' : '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: isMobile ? '1rem' : '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '0.5rem',
                flexDirection: isMobile ? 'column' : 'row',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                <span style={{ 
                  fontSize: isMobile ? '1.5rem' : '2rem', 
                  marginRight: isMobile ? '0' : '1rem',
                  marginBottom: isMobile ? '0.5rem' : '0'
                }}>💰</span>
                <div>
                  <div style={{ 
                    color: '#64748b', 
                    fontSize: isMobile ? '0.75rem' : '0.875rem' 
                  }}>Total Ventas</div>
                  <div style={{ 
                    fontSize: isMobile ? '1.25rem' : '1.5rem', 
                    fontWeight: '700', 
                    color: '#1e293b' 
                  }}>
                    {formatearMoneda(estadisticas.totalVentas)}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: isMobile ? '1rem' : '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '0.5rem',
                flexDirection: isMobile ? 'column' : 'row',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                <span style={{ 
                  fontSize: isMobile ? '1.5rem' : '2rem', 
                  marginRight: isMobile ? '0' : '1rem',
                  marginBottom: isMobile ? '0.5rem' : '0'
                }}>🛒</span>
                <div>
                  <div style={{ 
                    color: '#64748b', 
                    fontSize: isMobile ? '0.75rem' : '0.875rem' 
                  }}>Transacciones</div>
                  <div style={{ 
                    fontSize: isMobile ? '1.25rem' : '1.5rem', 
                    fontWeight: '700', 
                    color: '#1e293b' 
                  }}>
                    {estadisticas.totalTransacciones}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: isMobile ? '1rem' : '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '0.5rem',
                flexDirection: isMobile ? 'column' : 'row',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                <span style={{ 
                  fontSize: isMobile ? '1.5rem' : '2rem', 
                  marginRight: isMobile ? '0' : '1rem',
                  marginBottom: isMobile ? '0.5rem' : '0'
                }}>📦</span>
                <div>
                  <div style={{ 
                    color: '#64748b', 
                    fontSize: isMobile ? '0.75rem' : '0.875rem' 
                  }}>Productos Vendidos</div>
                  <div style={{ 
                    fontSize: isMobile ? '1.25rem' : '1.5rem', 
                    fontWeight: '700', 
                    color: '#1e293b' 
                  }}>
                    {estadisticas.totalProductos}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: isMobile ? '1rem' : '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '0.5rem',
                flexDirection: isMobile ? 'column' : 'row',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                <span style={{ 
                  fontSize: isMobile ? '1.5rem' : '2rem', 
                  marginRight: isMobile ? '0' : '1rem',
                  marginBottom: isMobile ? '0.5rem' : '0'
                }}>📊</span>
                <div>
                  <div style={{ 
                    color: '#64748b', 
                    fontSize: isMobile ? '0.75rem' : '0.875rem' 
                  }}>Cantidad Ventas</div>
                  <div style={{ 
                    fontSize: isMobile ? '1.25rem' : '1.5rem', 
                    fontWeight: '700', 
                    color: '#1e293b' 
                  }}>
                    {estadisticas.cantidadVentas}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: isMobile ? '1rem' : '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '1rem'
          }}>
            🔍 Filtros
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: isMobile ? '0.75rem' : '1rem',
            alignItems: 'end'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#374151'
              }}>
                Fecha Inicio
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#374151'
              }}>
                Fecha Fin
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#374151'
              }}>
                Método de Pago
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none',
                  background: 'white'
                }}
              >
                <option value="">Todos</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="TRANSFERENCIA">Transferencia</option>
              </select>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: isMobile ? '0.25rem' : '0.5rem',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <button
                onClick={aplicarFiltros}
                disabled={!fechaInicio && !fechaFin && !metodoPago}
                style={{
                  padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
                  background: !fechaInicio && !fechaFin && !metodoPago ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  fontWeight: '600',
                  cursor: !fechaInicio && !fechaFin && !metodoPago ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                Aplicar
              </button>
              
              {filtroActivo && (
                <button
                  onClick={limpiarFiltros}
                  style={{
                    padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.5rem',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            borderBottom: isMobile ? 'none' : '1px solid #e2e8f0'
          }}>
            {[
              { label: 'Historial Completo', value: 0 },
              { label: 'Estadísticas Diarias', value: 1 },
              { label: 'Estadísticas Mensuales', value: 2 },
              { label: 'Estadísticas Anuales', value: 3 }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setTabValue(tab.value)}
                style={{
                  flex: 1,
                  padding: isMobile ? '0.75rem' : '1rem',
                  background: tabValue === tab.value ? '#3b82f6' : 'transparent',
                  color: tabValue === tab.value ? 'white' : '#64748b',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  borderTopLeftRadius: isMobile ? '0' : (tab.value === 0 ? '1rem' : '0'),
                  borderTopRightRadius: isMobile ? '0' : (tab.value === 3 ? '1rem' : '0'),
                  borderBottom: isMobile ? '1px solid #e2e8f0' : 'none',
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '1.5rem' }}>
            {tabValue === 0 && (
              <div>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      border: '4px solid #e2e8f0',
                      borderTop: '4px solid #3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 1rem'
                    }} />
                    <p>Cargando ventas...</p>
                  </div>
                ) : (
                  <div style={{
                    overflowX: 'auto'
                  }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse'
                    }}>
                      <thead>
                        <tr style={{
                          background: '#f8fafc',
                          borderBottom: '2px solid #e2e8f0'
                        }}>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Comprobante</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Cliente</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Fecha</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Método Pago</th>
                          <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Total</th>
                          <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ventas.map((venta) => (
                          <tr key={venta.id} style={{
                            borderBottom: '1px solid #e2e8f0',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <td style={{ padding: '1rem' }}>{venta.numeroComprobante}</td>
                            <td style={{ padding: '1rem' }}>{venta.clienteNombre}</td>
                            <td style={{ padding: '1rem' }}>{formatearFecha(venta.fechaVenta)}</td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: 'white',
                                background: getMetodoPagoColor(venta.metodoPago)
                              }}>
                                {venta.metodoPago}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>
                              {formatearMoneda(venta.total)}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                              <button
                                onClick={() => verDetalleVenta(venta)}
                                style={{
                                  background: '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.375rem',
                                  padding: '0.5rem',
                                  cursor: 'pointer',
                                  fontSize: '0.875rem'
                                }}
                              >
                                👁️ Ver
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {ventas.length === 0 && (
                      <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        color: '#64748b'
                      }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                        <h3 style={{ marginBottom: '0.5rem' }}>No hay ventas registradas</h3>
                        <p>Realiza algunas ventas desde la caja rápida para ver el historial aquí.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {tabValue === 1 && (
              <div>
                <button
                  onClick={cargarEstadisticasDiarias}
                  disabled={!fechaInicio}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: !fechaInicio ? '#9ca3af' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: !fechaInicio ? 'not-allowed' : 'pointer',
                    marginBottom: '1rem'
                  }}
                >
                  Cargar Estadísticas del Día
                </button>
                
                {estadisticasDiarias && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                  }}>
                    <div style={{
                      background: '#f0f9ff',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #bae6fd'
                    }}>
                      <div style={{ color: '#0369a1', fontSize: '0.875rem' }}>Total del Día</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                        {formatearMoneda(estadisticasDiarias.totalVentas)}
                      </div>
                    </div>
                    <div style={{
                      background: '#f0fdf4',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #bbf7d0'
                    }}>
                      <div style={{ color: '#166534', fontSize: '0.875rem' }}>Transacciones</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                        {estadisticasDiarias.totalTransacciones}
                      </div>
                    </div>
                    <div style={{
                      background: '#fef3c7',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #fde68a'
                    }}>
                      <div style={{ color: '#92400e', fontSize: '0.875rem' }}>Productos</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                        {estadisticasDiarias.totalProductos}
                      </div>
                    </div>
                    <div style={{
                      background: '#f3e8ff',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #d8b4fe'
                    }}>
                      <div style={{ color: '#7c3aed', fontSize: '0.875rem' }}>Cantidad Ventas</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                        {estadisticasDiarias.cantidadVentas}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {tabValue === 2 && (
              <div>
                <button
                  onClick={cargarEstadisticasMensuales}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginBottom: '1rem'
                  }}
                >
                  Cargar Estadísticas del Mes
                </button>
                
                {estadisticasMensuales && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                  }}>
                    <div style={{
                      background: '#f0f9ff',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #bae6fd'
                    }}>
                      <div style={{ color: '#0369a1', fontSize: '0.875rem' }}>Total del Mes</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                        {formatearMoneda(estadisticasMensuales.totalVentas)}
                      </div>
                    </div>
                    <div style={{
                      background: '#f0fdf4',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #bbf7d0'
                    }}>
                      <div style={{ color: '#166534', fontSize: '0.875rem' }}>Transacciones</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                        {estadisticasMensuales.totalTransacciones}
                      </div>
                    </div>
                    <div style={{
                      background: '#fef3c7',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #fde68a'
                    }}>
                      <div style={{ color: '#92400e', fontSize: '0.875rem' }}>Productos</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                        {estadisticasMensuales.totalProductos}
                      </div>
                    </div>
                    <div style={{
                      background: '#f3e8ff',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #d8b4fe'
                    }}>
                      <div style={{ color: '#7c3aed', fontSize: '0.875rem' }}>Cantidad Ventas</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                        {estadisticasMensuales.cantidadVentas}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {tabValue === 3 && (
              <div>
                <button
                  onClick={cargarEstadisticasAnuales}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginBottom: '1rem'
                  }}
                >
                  Cargar Estadísticas del Año
                </button>
                
                {estadisticasAnuales && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                  }}>
                    <div style={{
                      background: '#f0f9ff',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #bae6fd'
                    }}>
                      <div style={{ color: '#0369a1', fontSize: '0.875rem' }}>Total del Año</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                        {formatearMoneda(estadisticasAnuales.totalVentas)}
                      </div>
                    </div>
                    <div style={{
                      background: '#f0fdf4',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #bbf7d0'
                    }}>
                      <div style={{ color: '#166534', fontSize: '0.875rem' }}>Transacciones</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                        {estadisticasAnuales.totalTransacciones}
                      </div>
                    </div>
                    <div style={{
                      background: '#fef3c7',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #fde68a'
                    }}>
                      <div style={{ color: '#92400e', fontSize: '0.875rem' }}>Productos</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                        {estadisticasAnuales.totalProductos}
                      </div>
                    </div>
                    <div style={{
                      background: '#f3e8ff',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #d8b4fe'
                    }}>
                      <div style={{ color: '#7c3aed', fontSize: '0.875rem' }}>Cantidad Ventas</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                        {estadisticasAnuales.cantidadVentas}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal de detalle de venta */}
        {dialogOpen && selectedVenta && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>
                  Detalle de Venta - {selectedVenta.numeroComprobante}
                </h3>
                <button
                  onClick={() => setDialogOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Cliente</div>
                  <div style={{ fontWeight: '600' }}>{selectedVenta.clienteNombre}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Fecha</div>
                  <div style={{ fontWeight: '600' }}>{formatearFecha(selectedVenta.fechaVenta)}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Método de Pago</div>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'white',
                    background: getMetodoPagoColor(selectedVenta.metodoPago)
                  }}>
                    {selectedVenta.metodoPago}
                  </span>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Total</div>
                  <div style={{ fontWeight: '600', fontSize: '1.125rem' }}>
                    {formatearMoneda(selectedVenta.total)}
                  </div>
                </div>
              </div>

              <div style={{
                borderTop: '1px solid #e2e8f0',
                paddingTop: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  marginBottom: '1rem'
                }}>
                  Productos
                </h4>
                
                <div style={{
                  overflowX: 'auto'
                }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse'
                  }}>
                    <thead>
                      <tr style={{
                        background: '#f8fafc',
                        borderBottom: '2px solid #e2e8f0'
                      }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Producto</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Cantidad</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Precio Unit.</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedVenta.detalles.map((detalle) => (
                        <tr key={detalle.id} style={{
                          borderBottom: '1px solid #e2e8f0'
                        }}>
                          <td style={{ padding: '0.75rem' }}>{detalle.productoNombre}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>{detalle.cantidad}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            {formatearMoneda(detalle.precioUnitario)}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>
                            {formatearMoneda(detalle.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedVenta.observaciones && (
                <div style={{
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '1.5rem'
                }}>
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}>
                    Observaciones
                  </h4>
                  <p style={{ color: '#64748b' }}>
                    {selectedVenta.observaciones}
                  </p>
                </div>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '2rem'
              }}>
                <button
                  onClick={() => setDialogOpen(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
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

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default HistorialVentasRapidas; 