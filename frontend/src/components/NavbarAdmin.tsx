import { Link } from 'react-router-dom';

interface NavbarAdminProps {
  onCerrarSesion: () => void;
  empresaNombre?: string;
  nombreAdministrador?: string;
}

export default function NavbarAdmin({ 
  onCerrarSesion, 
  empresaNombre, 
  nombreAdministrador
}: NavbarAdminProps) {
  return (
    <nav className="navbar-admin">
      <div className="navbar-admin-contenedor">
        {/* Logo y nombre de empresa */}
        <div className="navbar-admin-logo">
          <Link to="/admin/dashboard" className="navbar-admin-brand">
            <span className="navbar-admin-brand-icon">🏢</span>
            <span className="navbar-admin-brand-text">MiNegocio</span>
            {empresaNombre && (
              <span className="navbar-admin-empresa">{empresaNombre}</span>
            )}
          </Link>
        </div>

        {/* Usuario y cerrar sesión */}
        <div className="navbar-admin-user">
          {nombreAdministrador && (
            <div className="navbar-admin-user-info">
              <div className="navbar-admin-user-avatar">
                {nombreAdministrador.charAt(0).toUpperCase()}
              </div>
              <span className="navbar-admin-user-name">{nombreAdministrador}</span>
            </div>
          )}
          
          <button 
            onClick={onCerrarSesion}
            className="navbar-admin-logout"
            title="Cerrar sesión"
          >
            <span className="navbar-admin-logout-icon">🚪</span>
            <span className="navbar-admin-logout-text">Salir</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
