import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../services/api';
import NavbarAdmin from '../components/NavbarAdmin';
import { useUsuarioActual } from '../hooks/useUsuarioActual';

export default function DashboardAdministrador() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const [estadisticas, setEstadisticas] = useState({
    productos: 0,
    clientes: 0,
    pedidos: 0,
    ventas: 0
  });
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);
  const [mostrarVentas, setMostrarVentas] = useState(() => {
    const guardado = localStorage.getItem('mostrarVentas');
    return guardado === null ? true : guardado === 'true';
  });

  useEffect(() => {
    const cargarEstadisticas = async () => {
      // Verificar si tenemos datos del usuario
      if (!datosUsuario?.empresaId) {
        return;
      }

      try {
        setCargandoEstadisticas(true);
        const empresaId = datosUsuario.empresaId;

        // Cargar productos reales
        console.log('Dashboard - Cargando productos para empresaId:', empresaId);
        const responseProductos = await ApiService.obtenerTodosLosProductos(empresaId);
        console.log('Dashboard - Respuesta completa de productos:', responseProductos);
        
        // La respuesta ahora es directamente un array de productos
        const cantidadProductos = Array.isArray(responseProductos) ? responseProductos.length : 0;
        console.log('Dashboard - Cantidad de productos:', cantidadProductos);

        // Cargar clientes reales
        const responseClientes = await ApiService.obtenerClientesPaginado(empresaId, 0, 1);
        const cantidadClientes = responseClientes.totalElements || 0;

        // Cargar pedidos reales
        const responsePedidos = await ApiService.obtenerPedidos(empresaId, 0, 1);
        const cantidadPedidos = responsePedidos.totalElements || 0;
        
        // Cargar ventas reales
        const responseVentas = await ApiService.obtenerEstadisticasVentas();
        const totalVentas = responseVentas.data?.totalVentas || 0;
        
        setEstadisticas({
          productos: cantidadProductos,
          clientes: cantidadClientes,
          pedidos: cantidadPedidos,
          ventas: totalVentas
        });
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        // En caso de error, mantener los valores por defecto
        setEstadisticas({
          productos: 0,
          clientes: 0,
          pedidos: 0,
          ventas: 0
        });
      } finally {
        setCargandoEstadisticas(false);
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
      titulo: 'Productos',
      valor: estadisticas.productos,
      icono: '📦',
      color: '#3b82f6',
      gradiente: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
    },
    {
      titulo: 'Clientes',
      valor: estadisticas.clientes,
      icono: '👥',
      color: '#10b981',
      gradiente: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    },
    {
      titulo: 'Pedidos',
      valor: estadisticas.pedidos,
      icono: '📋',
      color: '#f59e0b',
      gradiente: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    },
    {
      titulo: 'Ventas',
      valor: mostrarVentas ? `$${estadisticas.ventas.toLocaleString()}` : '****',
      icono: '💰',
      color: '#8b5cf6',
      gradiente: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      mostrarOjito: true
    }
  ];

  const accionesRapidas = [
    {
      titulo: 'Gestionar Productos',
      descripcion: 'Administra tu catálogo de productos',
      icono: '📦',
      enlace: '/admin/productos',
      color: '#3b82f6'
    },
    {
      titulo: 'Añadir Producto',
      descripcion: 'Añade un nuevo producto a tu inventario',
      icono: '➕',
      enlace: '/admin/productos/nuevo',
      color: '#10b981'
    },
    {
      titulo: 'Ver Pedidos',
      descripcion: 'Gestiona los pedidos pendientes',
      icono: '📋',
      enlace: '/admin/pedidos',
      color: '#f59e0b'
    },
    {
      titulo: 'Gestionar Clientes',
      descripcion: 'Administra tu base de clientes',
      icono: '👤',
      enlace: '/admin/clientes',
      color: '#8b5cf6'
    },
    {
      titulo: 'Configuración',
      descripcion: 'Personaliza tu tienda',
      icono: '⚙️',
      enlace: '/admin/configuracion',
      color: '#6b7280'
    }
  ];

  const alternarMostrarVentas = () => {
    setMostrarVentas(prev => {
      localStorage.setItem('mostrarVentas', (!prev).toString());
      return !prev;
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      {/* Navegación */}
      <NavbarAdmin 
        onCerrarSesion={cerrarSesionConToast}
        empresaNombre={datosUsuario?.empresaNombre}
        nombreAdministrador={datosUsuario?.nombre}
      />

      {/* Contenido principal */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        {/* Encabezado */}
        <div style={{
          marginBottom: '3rem',
          animation: 'slideInUp 0.6s ease-out'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Panel de Administración
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: '#64748b',
            lineHeight: '1.6'
          }}>
            Bienvenido{datosUsuario?.nombre ? ` ${datosUsuario.nombre}` : ''}. 
            Aquí tienes un resumen de {datosUsuario?.empresaNombre || 'tu negocio'}.
          </p>
        </div>

        {/* Menú de navegación rápida */}
        <div style={{
          marginBottom: '3rem',
          animation: 'slideInUp 0.6s ease-out 0.1s both'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <Link 
              to="/admin/productos" 
              style={{
                padding: '0.875rem 1.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              }}
            >
              📦 Productos
            </Link>
            <Link 
              to="/admin/pedidos" 
              style={{
                padding: '0.875rem 1.5rem',
                background: 'white',
                color: '#3b82f6',
                textDecoration: 'none',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                fontWeight: '600',
                border: '2px solid #3b82f6',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#3b82f6';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              📋 Pedidos
            </Link>
            <Link 
              to="/admin/clientes" 
              style={{
                padding: '0.875rem 1.5rem',
                background: 'white',
                color: '#3b82f6',
                textDecoration: 'none',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                fontWeight: '600',
                border: '2px solid #3b82f6',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#3b82f6';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              👥 Clientes
            </Link>
            <Link 
              to="/admin/configuracion" 
              style={{
                padding: '0.875rem 1.5rem',
                background: 'white',
                color: '#3b82f6',
                textDecoration: 'none',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                fontWeight: '600',
                border: '2px solid #3b82f6',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#3b82f6';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              ⚙️ Configuración
            </Link>
          </div>
        </div>

        {/* Estadísticas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          {tarjetasEstadisticas.map((tarjeta, index) => (
            <div 
              key={index} 
              style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease',
                animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`,
                gridColumn: tarjeta.titulo === 'Ventas' ? 'span 2' : 'span 1'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              }}
            >
              {tarjeta.titulo === 'Ventas' ? (
                // Diseño especial para la tarjeta de ventas
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {tarjeta.titulo}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '3rem', height: '3rem', background: tarjeta.gradiente, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', flexShrink: 0 }}>
                        {tarjeta.icono}
                      </div>
                      {/* Ojito para mostrar/ocultar monto */}
                      <button
                        onClick={alternarMostrarVentas}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1.5rem',
                          marginLeft: '4px',
                          color: mostrarVentas ? '#64748b' : '#d1d5db',
                          outline: 'none',
                          padding: 0
                        }}
                        title={mostrarVentas ? 'Ocultar monto' : 'Mostrar monto'}
                      >
                        {mostrarVentas ? '👁️' : '🙈'}
                      </button>
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ fontSize: 'clamp(2.2rem, 6vw, 3.2rem)', fontWeight: '800', color: tarjeta.color, margin: 0, lineHeight: '1', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                      {cargandoEstadisticas ? (
                        <div style={{ width: '80px', height: '50px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'loading 1.5s infinite', borderRadius: '0.5rem' }} />
                      ) : (
                        tarjeta.valor
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                // Diseño original para las otras tarjetas
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  minWidth: 0
                }}>
                  <div style={{
                    flex: 1,
                    minWidth: 0
                  }}>
                    <h3 style={{
                      fontSize: '0.875rem',
                      color: '#64748b',
                      marginBottom: '0.5rem',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {tarjeta.titulo}
                    </h3>
                    <p style={{
                      fontSize: '2rem',
                      fontWeight: '800',
                      color: tarjeta.color,
                      margin: 0,
                      lineHeight: '1'
                    }}>
                      {cargandoEstadisticas ? (
                        <div style={{
                          width: '60px',
                          height: '40px',
                          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                          backgroundSize: '200% 100%',
                          animation: 'loading 1.5s infinite',
                          borderRadius: '0.5rem'
                        }} />
                      ) : (
                        tarjeta.valor
                      )}
                    </p>
                  </div>
                  <div style={{
                    width: '4rem',
                    height: '4rem',
                    background: tarjeta.gradiente,
                    borderRadius: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    flexShrink: 0
                  }}>
                    {tarjeta.icono}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Acciones rápidas */}
        <div style={{
          marginBottom: '3rem',
          animation: 'slideInUp 0.6s ease-out 0.4s both'
        }}>
          <h2 style={{
            fontSize: '1.875rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '1.5rem'
          }}>
            Acciones Rápidas
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {accionesRapidas.map((accion, index) => (
              <Link 
                key={index}
                to={accion.enlace}
                style={{
                  background: 'white',
                  borderRadius: '1rem',
                  padding: '2rem',
                  textDecoration: 'none',
                  color: 'inherit',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.3s ease',
                  display: 'block',
                  animation: `slideInUp 0.6s ease-out ${(index + 4) * 0.1}s both`
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = accion.color;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    background: `linear-gradient(135deg, ${accion.color} 0%, ${accion.color}dd 100%)`,
                    borderRadius: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    marginRight: '1rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                  }}>
                    {accion.icono}
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: '0.25rem'
                    }}>
                      {accion.titulo}
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#64748b',
                      margin: 0,
                      lineHeight: '1.5'
                    }}>
                      {accion.descripcion}
                    </p>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: accion.color,
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  Ir a {accion.titulo.toLowerCase()} →
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Actividad reciente */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0',
          animation: 'slideInUp 0.6s ease-out 0.6s both'
        }}>
          <h2 style={{
            fontSize: '1.875rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '1.5rem'
          }}>
            Actividad Reciente
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 0',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  marginRight: '1rem',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}>
                  ✓
                </div>
                <div>
                  <p style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    Nuevo pedido recibido
                  </p>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    margin: 0
                  }}>
                    Cliente: María García - $45.99
                  </p>
                </div>
              </div>
              <span style={{
                fontSize: '0.875rem',
                color: '#64748b',
                fontWeight: '500'
              }}>
                Hace 5 min
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 0',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  marginRight: '1rem',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}>
                  📦
                </div>
                <div>
                  <p style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    Producto actualizado
                  </p>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    margin: 0
                  }}>
                    Camiseta Básica - Stock actualizado
                  </p>
                </div>
              </div>
              <span style={{
                fontSize: '0.875rem',
                color: '#64748b',
                fontWeight: '500'
              }}>
                Hace 1 hora
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  marginRight: '1rem',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}>
                  👤
                </div>
                <div>
                  <p style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    Nuevo cliente registrado
                  </p>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    margin: 0
                  }}>
                    Juan Pérez - juan@email.com
                  </p>
                </div>
              </div>
              <span style={{
                fontSize: '0.875rem',
                color: '#64748b',
                fontWeight: '500'
              }}>
                Hace 2 horas
              </span>
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
        
        @media (max-width: 768px) {
          .dashboard-title {
            font-size: 2rem !important;
          }
          
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
          
          .actions-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
