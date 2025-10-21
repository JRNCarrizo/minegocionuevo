import { Link, useLocation } from 'react-router-dom';

interface NavbarAdminPagesProps {
  onCerrarSesion: () => void;
  empresaNombre?: string;
  nombreAdministrador?: string;
}

export default function NavbarAdminPages({ 
  onCerrarSesion, 
  empresaNombre, 
  nombreAdministrador
}: NavbarAdminPagesProps) {
  const location = useLocation();

  const menuItems = [
    {
      path: '/admin/dashboard',
      label: 'Dashboard',
      icon: '📊',
      description: 'Vista general'
    },
    {
      path: '/admin/productos',
      label: 'Productos',
      icon: '📦',
      description: 'Gestionar productos'
    },
    {
      path: '/admin/pedidos',
      label: 'Pedidos',
      icon: '🛒',
      description: 'Ver pedidos'
    },
    {
      path: '/admin/clientes',
      label: 'Clientes',
      icon: '👥',
      description: 'Gestionar clientes'
    },
    {
      path: '/admin/historial-carga-productos',
      label: 'Historial Carga',
      icon: '📋',
      description: 'Historial de carga de productos'
    },
    {
      path: '/admin/administradores',
      label: 'Administradores',
      icon: '👤',
      description: 'Gestionar administradores'
    },
    {
      path: '/admin/gestion-empresa',
      label: 'Gestión Empresa',
      icon: '🏢',
      description: 'Gestión de empresa'
    },
    {
      path: '/admin/configuracion',
      label: 'Configuración',
      icon: '⚙️',
      description: 'Configurar empresa'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="navbar-admin-pages">
      <div className="navbar-admin-pages-contenedor">
        {/* Logo y nombre de empresa */}
        <div className="navbar-admin-pages-logo">
          <Link to="/admin/dashboard" className="navbar-admin-pages-brand">
            <img 
              src="/images/n360cio-logo.png" 
              alt="N360CIO Logo" 
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'contain'
              }}
              onError={(e) => {
                e.currentTarget.src = '/images/logo.png';
                e.currentTarget.alt = 'Logo';
              }}
            />
            {empresaNombre && (
              <span className="navbar-admin-pages-empresa">{empresaNombre}</span>
            )}
          </Link>
        </div>

        {/* Navegación principal */}
        <div className="navbar-admin-pages-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`navbar-admin-pages-link ${isActive(item.path) ? 'activo' : ''}`}
              title={item.description}
            >
              <span className="navbar-admin-pages-link-icon">{item.icon}</span>
              <span className="navbar-admin-pages-link-text">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Usuario y cerrar sesión */}
        <div className="navbar-admin-pages-user">
          {nombreAdministrador && (
            <div className="navbar-admin-pages-user-info">
              <div className="navbar-admin-pages-user-avatar">
                {nombreAdministrador.charAt(0).toUpperCase()}
              </div>
              <span className="navbar-admin-pages-user-name">{nombreAdministrador}</span>
            </div>
          )}
          
          <button 
            onClick={onCerrarSesion}
            className="navbar-admin-pages-logout"
            title="Cerrar sesión"
          >
            <span className="navbar-admin-pages-logout-icon">🚪</span>
            <span className="navbar-admin-pages-logout-text">Salir</span>
          </button>
        </div>
      </div>
    </nav>
  );
} 