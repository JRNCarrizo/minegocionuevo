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

        // Por ahora mantenemos los otros valores como mock hasta que implementemos sus endpoints
        setEstadisticas({
          productos: cantidadProductos,
          clientes: 128, // TODO: Conectar con API real
          pedidos: 234,  // TODO: Conectar con API real
          ventas: 15650  // TODO: Conectar con API real
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
      color: '#3b82f6'
    },
    {
      titulo: 'Clientes',
      valor: estadisticas.clientes,
      icono: '👥',
      color: '#10b981'
    },
    {
      titulo: 'Pedidos',
      valor: estadisticas.pedidos,
      icono: '📋',
      color: '#f59e0b'
    },
    {
      titulo: 'Ventas',
      valor: `€${estadisticas.ventas.toLocaleString()}`,
      icono: '💰',
      color: '#8b5cf6'
    }
  ];

  const accionesRapidas = [
    {
      titulo: 'Gestionar Productos',
      descripcion: 'Administra tu catálogo de productos',
      icono: '📦',
      enlace: '/admin/productos'
    },
    {
      titulo: 'Añadir Producto',
      descripcion: 'Añade un nuevo producto a tu inventario',
      icono: '➕',
      enlace: '/admin/productos/nuevo'
    },
    {
      titulo: 'Ver Pedidos',
      descripcion: 'Gestiona los pedidos pendientes',
      icono: '�',
      enlace: '/admin/pedidos'
    },
    {
      titulo: 'Gestionar Clientes',
      descripcion: 'Administra tu base de clientes',
      icono: '👤',
      enlace: '/admin/clientes'
    },
    {
      titulo: 'Configuración',
      descripcion: 'Personaliza tu tienda',
      icono: '⚙️',
      enlace: '/admin/configuracion'
    }
  ];

  return (
    <div className="h-pantalla-minimo" style={{ backgroundColor: '#f8fafc' }}>
      {/* Navegación */}
      <NavbarAdmin 
        onCerrarSesion={cerrarSesionConToast}
        empresaNombre={datosUsuario?.empresaNombre}
        nombreAdministrador={datosUsuario?.nombre}
      />

      {/* Contenido principal */}
      <div className="contenedor py-8">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="titulo-2 mb-2">Panel de Administración</h1>
          <p className="texto-gris">
            Bienvenido{datosUsuario?.nombre ? ` ${datosUsuario.nombre}` : ''}. 
            Aquí tienes un resumen de {datosUsuario?.empresaNombre || 'tu negocio'}.
          </p>
        </div>

        {/* Menú de navegación rápida */}
        <div className="mb-8">
          <div className="flex items-centro gap-4 flex-wrap">
            <Link 
              to="/admin/productos" 
              className="boton boton-primario"
              style={{ 
                background: '#3b82f6',
                fontSize: '1.1rem',
                padding: '12px 24px'
              }}
            >
              📦 Productos
            </Link>
            <Link to="/admin/pedidos" className="boton boton-secundario">
              📋 Pedidos
            </Link>
            <Link to="/admin/clientes" className="boton boton-secundario">
              👥 Clientes
            </Link>
            <Link to="/admin/configuracion" className="boton boton-secundario">
              ⚙️ Configuración
            </Link>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-2 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          {tarjetasEstadisticas.map((tarjeta, index) => (
            <div key={index} className="tarjeta animacion-entrada" 
                 style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-centro entre">
                <div>
                  <h3 className="texto-pequeno texto-gris mb-1">{tarjeta.titulo}</h3>
                  <p className="titulo-2" style={{ color: tarjeta.color }}>
                    {cargandoEstadisticas ? '...' : tarjeta.valor}
                  </p>
                </div>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  backgroundColor: tarjeta.color,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  {tarjeta.icono}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Acciones rápidas */}
        <div className="mb-8">
          <h2 className="titulo-3 mb-6">Acciones Rápidas</h2>
          <div className="grid grid-2">
            {accionesRapidas.map((accion, index) => (
              <Link 
                key={index}
                to={accion.enlace}
                className="tarjeta animacion-entrada"
                style={{ 
                  textDecoration: 'none',
                  color: 'inherit',
                  animationDelay: `${(index + 4) * 0.1}s`,
                  transition: 'transform 0.2s',
                  display: 'block'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div className="flex items-centro mb-4">
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    backgroundColor: 'var(--color-primario)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    marginRight: '1rem'
                  }}>
                    {accion.icono}
                  </div>
                  <div>
                    <h3 className="titulo-3 mb-1">{accion.titulo}</h3>
                    <p className="texto-pequeno texto-gris">{accion.descripcion}</p>
                  </div>
                </div>
                <div className="flex items-centro">
                  <span className="texto-pequeno" style={{ color: 'var(--color-primario)' }}>
                    Ir a {accion.titulo.toLowerCase()} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="tarjeta">
          <h2 className="titulo-3 mb-6">Actividad Reciente</h2>
          <div className="space-y-4">
            <div className="flex items-centro entre py-3" style={{ borderBottom: '1px solid var(--color-borde)' }}>
              <div className="flex items-centro">
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  backgroundColor: '#10b981',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  marginRight: '0.75rem',
                  color: 'white'
                }}>
                  ✓
                </div>
                <div>
                  <p className="texto-medio">Nuevo pedido recibido</p>
                  <p className="texto-pequeno texto-gris">Cliente: María García - €45.99</p>
                </div>
              </div>
              <span className="texto-pequeno texto-gris">Hace 5 min</span>
            </div>

            <div className="flex items-centro entre py-3" style={{ borderBottom: '1px solid var(--color-borde)' }}>
              <div className="flex items-centro">
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  backgroundColor: '#3b82f6',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  marginRight: '0.75rem',
                  color: 'white'
                }}>
                  📦
                </div>
                <div>
                  <p className="texto-medio">Producto actualizado</p>
                  <p className="texto-pequeno texto-gris">Camiseta Básica - Stock actualizado</p>
                </div>
              </div>
              <span className="texto-pequeno texto-gris">Hace 1 hora</span>
            </div>

            <div className="flex items-centro entre py-3">
              <div className="flex items-centro">
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  backgroundColor: '#f59e0b',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  marginRight: '0.75rem',
                  color: 'white'
                }}>
                  👤
                </div>
                <div>
                  <p className="texto-medio">Nuevo cliente registrado</p>
                  <p className="texto-pequeno texto-gris">Juan Pérez - juan@email.com</p>
                </div>
              </div>
              <span className="texto-pequeno texto-gris">Hace 2 horas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
