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
    totalProductosCatalogo: 0
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      if (!datosUsuario?.empresaId) {
        return;
      }

      try {
        setCargando(true);
        const empresaId = datosUsuario.empresaId;

        // Cargar estadísticas de ventas rápidas
        const responseVentas = await ApiService.obtenerEstadisticasVentas();
        const statsVentas = responseVentas.data || {};

        // Cargar estadísticas de pedidos
        const responsePedidos = await ApiService.obtenerPedidos(empresaId, 0, 1);
        const totalPedidos = responsePedidos.totalElements || 0;

        // Cargar estadísticas de clientes
        const responseClientes = await ApiService.obtenerClientesPaginado(empresaId, 0, 1);
        const totalClientes = responseClientes.totalElements || 0;

        // Cargar estadísticas de productos
        const responseProductos = await ApiService.obtenerTodosLosProductos(empresaId);
        const totalProductosCatalogo = Array.isArray(responseProductos) ? responseProductos.length : 0;

        setEstadisticas({
          totalVentas: statsVentas.totalVentas || 0,
          totalTransacciones: statsVentas.totalTransacciones || 0,
          totalProductos: statsVentas.totalProductos || 0,
          cantidadVentas: statsVentas.cantidadVentas || 0,
          totalPedidos: totalPedidos,
          totalClientes: totalClientes,
          totalProductosCatalogo: totalProductosCatalogo
        });
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        toast.error('Error al cargar las estadísticas');
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
      descripcion: 'Total de ventas rápidas'
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
      titulo: 'Productos Vendidos',
      valor: estadisticas.totalProductos,
      icono: '📦',
      color: '#f59e0b',
      gradiente: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      descripcion: 'Unidades vendidas'
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
      
      <div style={{
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
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: isMobile ? '1rem' : '1.5rem',
          marginBottom: '3rem'
        }}>
          {tarjetasEstadisticas.map((tarjeta, index) => (
            <div 
              key={index} 
              style={{
                background: 'white',
                borderRadius: isMobile ? '0.75rem' : '1rem',
                padding: isMobile ? '1.5rem' : '2rem',
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
                  width: '3rem',
                  height: '3rem',
                  background: tarjeta.gradiente,
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  flexShrink: 0
                }}>
                  {tarjeta.icono}
                </div>
              </div>
              
              <div style={{
                fontSize: '2.5rem',
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

        {/* Información adicional */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '1rem',
          padding: '2rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'slideInUp 0.6s ease-out 0.8s both'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: 'white',
            margin: '0 0 1rem 0'
          }}>
            📊 Información de Métricas
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              <strong>Ganancias Totales:</strong> Representa el monto total generado por todas las ventas rápidas realizadas.
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              <strong>Transacciones:</strong> Número total de operaciones de venta completadas.
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              <strong>Productos Vendidos:</strong> Cantidad total de unidades vendidas en todas las transacciones.
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              <strong>Ventas Rápidas:</strong> Número de ventas realizadas a través del sistema de caja rápida.
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
      `}</style>
    </div>
  );
} 