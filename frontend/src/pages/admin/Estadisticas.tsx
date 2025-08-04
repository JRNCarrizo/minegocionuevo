import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';

interface Estadisticas {
  totalVentas: number;
  totalTransacciones: number;
  totalProductos: number;
  cantidadVentas: number;
  totalPedidos: number;
  totalClientes: number;
  totalProductosCatalogo: number;
  totalUnidadesVendidas: number;
}

interface ProductoEstadisticas {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  imagenUrl: string;
  ventasPedidos: number;
  ventasRapidas: number;
  totalVentas: number;
}

interface EstadisticasProductos {
  topMasVendidos: ProductoEstadisticas[];
  topMenosVendidos: ProductoEstadisticas[];
}

export default function Estadisticas() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile, isTablet } = useResponsive();
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    totalVentas: 0,
    totalTransacciones: 0,
    totalProductos: 0,
    cantidadVentas: 0,
    totalPedidos: 0,
    totalClientes: 0,
    totalProductosCatalogo: 0,
    totalUnidadesVendidas: 0
  });
  const [estadisticasProductos, setEstadisticasProductos] = useState<EstadisticasProductos>({
    topMasVendidos: [],
    topMenosVendidos: []
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      console.log('🔍 Datos usuario:', datosUsuario);
      console.log('🔍 Empresa ID:', datosUsuario?.empresaId);
      
      if (!datosUsuario?.empresaId) {
        console.log('❌ No hay empresa ID, no se pueden cargar estadísticas');
        return;
      }

      try {
        setCargando(true);
        const empresaId = datosUsuario.empresaId;

        // Cargar estadísticas de ventas rápidas
        console.log('🔍 Token actual:', localStorage.getItem('token'));
        const responseVentas = await ApiService.obtenerEstadisticasVentas();
        const statsVentas = responseVentas.data || {};
        console.log('🔍 Estadísticas recibidas del backend:', statsVentas);
        console.log('🔍 Total unidades vendidas:', statsVentas.totalUnidadesVendidas);

        // Cargar estadísticas de pedidos
        const responsePedidos = await ApiService.obtenerPedidos(empresaId, 0, 1);
        const totalPedidos = responsePedidos.totalElements || 0;

        // Cargar estadísticas de clientes
        const responseClientes = await ApiService.obtenerClientesPaginado(empresaId, 0, 1);
        const totalClientes = responseClientes.totalElements || 0;

        // Cargar estadísticas de productos
        const responseProductos = await ApiService.obtenerTodosLosProductos(empresaId);
        const totalProductosCatalogo = Array.isArray(responseProductos) ? responseProductos.length : 0;

        // Cargar estadísticas de top productos
        const responseEstadisticasProductos = await ApiService.obtenerEstadisticasProductos();
        const statsProductos = responseEstadisticasProductos.data || {};

        setEstadisticas({
          totalVentas: statsVentas.totalVentas || 0,
          totalTransacciones: statsVentas.totalTransacciones || 0,
          totalProductos: statsVentas.totalProductos || 0,
          cantidadVentas: statsVentas.cantidadVentas || 0,
          totalPedidos: totalPedidos,
          totalClientes: totalClientes,
          totalProductosCatalogo: totalProductosCatalogo,
          totalUnidadesVendidas: statsVentas.totalUnidadesVendidas || 0
        });

        setEstadisticasProductos({
          topMasVendidos: statsProductos.topMasVendidos || [],
          topMenosVendidos: statsProductos.topMenosVendidos || []
        });
      } catch (error: any) {
        console.error('Error al cargar estadísticas:', error);
        console.error('🔍 Detalles del error:', {
          message: error?.message,
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          data: error?.response?.data
        });
        
        if (error?.response?.status === 403) {
          toast.error('Error de autorización. Por favor, inicia sesión nuevamente.');
        } else {
          toast.error('Error al cargar las estadísticas');
        }
      } finally {
        setCargando(false);
      }
    };

    cargarEstadisticas();
  }, [datosUsuario?.empresaId]);

  const cerrarSesionConToast = () => {
    cerrarSesion();
    toast.success('Sesión cerrada correctamente');
  };

  const tarjetasEstadisticas = [
    {
      titulo: 'Ganancias Totales',
      valor: `$${estadisticas.totalVentas.toLocaleString()}`,
      icono: '💰',
      color: '#10b981',
      gradiente: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      descripcion: 'Total de ventas'
    },
    {
      titulo: 'Transacciones',
      valor: estadisticas.totalTransacciones,
      icono: '🔄',
      color: '#3b82f6',
      gradiente: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      descripcion: 'Total de transacciones'
    },
    {
      titulo: 'Unidades Vendidas',
      valor: estadisticas.totalUnidadesVendidas,
      icono: '📦',
      color: '#f59e0b',
      gradiente: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      descripcion: 'Total de unidades vendidas'
    },
    {
      titulo: 'Ventas Rápidas',
      valor: estadisticas.cantidadVentas,
      icono: '💳',
      color: '#8b5cf6',
      gradiente: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      descripcion: 'Número de ventas'
    },
    {
      titulo: 'Pedidos',
      valor: estadisticas.totalPedidos,
      icono: '📋',
      color: '#ec4899',
      gradiente: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      descripcion: 'Pedidos recibidos'
    },
    {
      titulo: 'Clientes',
      valor: estadisticas.totalClientes,
      icono: '👥',
      color: '#06b6d4',
      gradiente: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      descripcion: 'Clientes registrados'
    },
    {
      titulo: 'Productos en Catálogo',
      valor: estadisticas.totalProductosCatalogo,
      icono: '🏪',
      color: '#84cc16',
      gradiente: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
      descripcion: 'Productos disponibles'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative'
    }}>
      <NavbarAdmin 
        onCerrarSesion={cerrarSesionConToast}
        empresaNombre={datosUsuario?.empresaNombre}
        nombreAdministrador={datosUsuario?.nombre}
      />
      
      <div className="stats-container" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: isMobile ? '1rem 0.5rem' : isTablet ? '1.5rem 1rem' : '2rem 1rem',
        paddingTop: isMobile ? '120px' : '80px'
      }}>
        {/* Encabezado */}
        <div style={{
          marginBottom: '3rem',
          animation: 'slideInUp 0.6s ease-out'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <Link 
              to="/admin"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.5rem',
                cursor: 'pointer',
                textDecoration: 'none',
                color: 'white',
                fontSize: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.5rem',
                height: '2.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ←
            </Link>
            <h1 style={{
              fontSize: isMobile ? '2rem' : isTablet ? '2.25rem' : '2.5rem',
              fontWeight: '700',
              color: 'white',
              margin: 0
            }}>
              Estadísticas
            </h1>
          </div>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            color: 'rgba(255, 255, 255, 0.9)',
            lineHeight: '1.6',
            margin: 0
          }}>
            Resumen completo de las métricas de {datosUsuario?.empresaNombre || 'tu negocio'}.
          </p>
        </div>

        {/* Grid de estadísticas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: isMobile ? '0.75rem' : '1rem',
          marginBottom: '2rem'
        }}>
          {tarjetasEstadisticas.map((tarjeta, index) => (
            <div 
              key={index} 
              style={{
                background: 'white',
                borderRadius: isMobile ? '0.75rem' : '1rem',
                padding: isMobile ? '1rem' : '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e2e8f0',
                animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`,
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  color: '#64748b',
                  margin: 0,
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {tarjeta.titulo}
                </h3>
                              <div style={{
                width: isMobile ? '2.5rem' : '3rem',
                height: isMobile ? '2.5rem' : '3rem',
                background: tarjeta.gradiente,
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                flexShrink: 0
              }}>
                  {tarjeta.icono}
                </div>
              </div>
              
              <div style={{
                fontSize: isMobile ? '1.75rem' : isTablet ? '2rem' : '2.5rem',
                fontWeight: '800',
                color: tarjeta.color,
                margin: '0 0 0.5rem 0',
                lineHeight: '1'
              }}>
                {cargando ? (
                  <div style={{
                    width: '120px',
                    height: '50px',
                    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'loading 1.5s infinite',
                    borderRadius: '0.5rem'
                  }} />
                ) : (
                  tarjeta.valor
                )}
              </div>
              
              <p style={{
                fontSize: '0.875rem',
                color: '#64748b',
                margin: 0,
                fontWeight: '500'
              }}>
                {tarjeta.descripcion}
              </p>
            </div>
          ))}
        </div>

        {/* Sección de Top Productos */}
        <div className="stats-grid" style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '1rem' : '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Top 3 Más Vendidos */}
          <div style={{
            background: 'white',
            borderRadius: isMobile ? '0.75rem' : '1rem',
            padding: isMobile ? '1rem' : '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e2e8f0',
            animation: 'slideInUp 0.6s ease-out 0.9s both'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}>
                🏆
              </div>
              <h2 style={{
                fontSize: isMobile ? '1.125rem' : '1.25rem',
                fontWeight: '700',
                color: '#1f2937',
                margin: 0
              }}>
                Top 3 Más Vendidos
              </h2>
            </div>
            
            {cargando ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{
                  width: '100%',
                  height: '200px',
                  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'loading 1.5s infinite',
                  borderRadius: '0.5rem'
                }} />
              </div>
            ) : estadisticasProductos.topMasVendidos.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {estadisticasProductos.topMasVendidos.map((producto, index) => (
                  <div key={producto.id} className="product-card" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '0.5rem' : '0.75rem',
                    padding: isMobile ? '0.75rem' : '1rem',
                    background: '#f8fafc',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    flexWrap: isMobile ? 'wrap' : 'nowrap'
                  }}>
                    <div style={{
                      width: isMobile ? '2rem' : '2.5rem',
                      height: isMobile ? '2rem' : '2.5rem',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isMobile ? '0.75rem' : '1rem',
                      fontWeight: '700',
                      color: 'white',
                      flexShrink: 0
                    }}>
                      #{index + 1}
                    </div>
                    <div style={{ 
                      flex: 1, 
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}>
                      <h3 style={{
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: '1.2'
                      }}>
                        {producto.nombre}
                      </h3>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        flexWrap: 'wrap'
                      }}>
                        <span className="product-badge" style={{
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          color: '#6b7280',
                          background: '#e5e7eb',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '0.25rem',
                          fontWeight: '500'
                        }}>
                          {producto.totalVentas} vendidas
                        </span>
                        <span className="product-badge" style={{
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          color: '#6b7280',
                          background: '#dbeafe',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '0.25rem',
                          fontWeight: '500'
                        }}>
                          Stock: {producto.stock}
                        </span>
                      </div>
                    </div>
                    <div style={{
                      textAlign: 'right',
                      flexShrink: 0,
                      marginLeft: 'auto'
                    }}>
                      <div style={{
                        fontSize: isMobile ? '1rem' : '1.125rem',
                        fontWeight: '700',
                        color: '#10b981'
                      }}>
                        ${producto.precio?.toLocaleString() || '0'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                <p>No hay productos vendidos aún</p>
              </div>
            )}
          </div>

          {/* Top 3 Menos Vendidos */}
          <div style={{
            background: 'white',
            borderRadius: isMobile ? '0.75rem' : '1rem',
            padding: isMobile ? '1rem' : '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e2e8f0',
            animation: 'slideInUp 0.6s ease-out 1.0s both'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}>
                ⚠️
              </div>
              <h2 style={{
                fontSize: isMobile ? '1.125rem' : '1.25rem',
                fontWeight: '700',
                color: '#1f2937',
                margin: 0
              }}>
                Productos que Necesitan Atención
              </h2>
            </div>
            
            {cargando ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{
                  width: '100%',
                  height: '200px',
                  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'loading 1.5s infinite',
                  borderRadius: '0.5rem'
                }} />
              </div>
            ) : estadisticasProductos.topMenosVendidos.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {estadisticasProductos.topMenosVendidos.map((producto, index) => (
                  <div key={producto.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '0.5rem' : '0.75rem',
                    padding: isMobile ? '0.75rem' : '1rem',
                    background: '#fef3c7',
                    borderRadius: '0.75rem',
                    border: '1px solid #fbbf24',
                    flexWrap: isMobile ? 'wrap' : 'nowrap'
                  }}>
                    <div style={{
                      width: isMobile ? '2rem' : '2.5rem',
                      height: isMobile ? '2rem' : '2.5rem',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isMobile ? '0.75rem' : '1rem',
                      fontWeight: '700',
                      color: 'white',
                      flexShrink: 0
                    }}>
                      #{index + 1}
                    </div>
                    <div className="product-info" style={{ 
                      flex: 1, 
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}>
                      <h3 style={{
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: '1.2'
                      }}>
                        {producto.nombre}
                      </h3>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        flexWrap: 'wrap'
                      }}>
                        <span className="product-badge" style={{
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          color: '#6b7280',
                          background: '#fef3c7',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '0.25rem',
                          fontWeight: '500'
                        }}>
                          {producto.totalVentas} vendidas
                        </span>
                        <span className="product-badge" style={{
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          color: '#6b7280',
                          background: '#fef3c7',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '0.25rem',
                          fontWeight: '500'
                        }}>
                          Stock: {producto.stock}
                        </span>
                      </div>
                    </div>
                    <div className="product-price" style={{
                      textAlign: 'right',
                      flexShrink: 0,
                      marginLeft: 'auto'
                    }}>
                      <div style={{
                        fontSize: isMobile ? '1rem' : '1.125rem',
                        fontWeight: '700',
                        color: '#f59e0b'
                      }}>
                        ${producto.precio?.toLocaleString() || '0'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <p>Todos los productos tienen ventas</p>
              </div>
            )}
          </div>
        </div>

        {/* Información adicional */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: isMobile ? '0.75rem' : '1rem',
          padding: isMobile ? '1.5rem' : '2rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'slideInUp 0.6s ease-out 1.1s both'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '600',
            color: 'white',
            margin: '0 0 1rem 0',
            textAlign: isMobile ? 'center' : 'left'
          }}>
            📊 Información de Métricas
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: isMobile ? '0.75rem' : '1rem'
          }}>
            <div style={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: isMobile ? '0.875rem' : '1rem',
              lineHeight: '1.5'
            }}>
              <strong>Ganancias Totales:</strong> Representa el monto total generado por todas las ventas realizadas.
            </div>
            <div style={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: isMobile ? '0.875rem' : '1rem',
              lineHeight: '1.5'
            }}>
              <strong>Transacciones:</strong> Número total de operaciones de venta completadas.
            </div>
            <div style={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: isMobile ? '0.875rem' : '1rem',
              lineHeight: '1.5'
            }}>
              <strong>Productos Vendidos:</strong> Cantidad total de unidades vendidas en todas las transacciones.
            </div>
            <div style={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: isMobile ? '0.875rem' : '1rem',
              lineHeight: '1.5'
            }}>
              <strong>Ventas Rápidas:</strong> Número de ventas realizadas a través del sistema de caja rápida.
            </div>
            <div style={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: isMobile ? '0.875rem' : '1rem',
              lineHeight: '1.5'
            }}>
              <strong>Top Más Vendidos:</strong> Los 3 productos con mayor cantidad de unidades vendidas.
            </div>
            <div style={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: isMobile ? '0.875rem' : '1rem',
              lineHeight: '1.5'
            }}>
              <strong>Productos que Necesitan Atención:</strong> Los 3 productos con menor cantidad de ventas.
            </div>
          </div>
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
        
        /* Estilos adicionales para mejorar responsividad */
        @media (max-width: 768px) {
          .stats-container {
            overflow-x: hidden;
            width: 100%;
          }
          
          .product-card {
            min-width: 0;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          
          .product-info {
            flex: 1;
            min-width: 0;
          }
          
          .product-price {
            flex-shrink: 0;
          }
        }
        
        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
          
          .product-card {
            padding: 0.75rem !important;
            gap: 0.5rem !important;
          }
          
          .product-badge {
            font-size: 0.75rem !important;
            padding: 0.125rem 0.25rem !important;
          }
        }
      `}</style>
    </div>
  );
} 