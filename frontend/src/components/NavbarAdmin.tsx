import { Link } from 'react-router-dom';

interface NavbarAdminProps {
  onCerrarSesion: () => void;
  empresaNombre?: string;
  nombreAdministrador?: string;
  mostrarVolver?: boolean;
  urlVolver?: string;
}

export default function NavbarAdmin({ 
  onCerrarSesion, 
  empresaNombre, 
  nombreAdministrador,
  mostrarVolver = false,
  urlVolver = '/admin'
}: NavbarAdminProps) {
  return (
    <nav className="navbar">
      <div className="contenedor">
        <div className="navbar-contenido">
          {mostrarVolver ? (
            <Link to={urlVolver} className="logo">
              ← miNegocio{empresaNombre ? (
                <span style={{ 
                  color: '#3b82f6', 
                  fontWeight: '600',
                  marginLeft: '8px',
                  padding: '2px 8px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '6px',
                  fontSize: '0.9em'
                }}>
                  {empresaNombre}
                </span>
              ) : ''} - Admin
            </Link>
          ) : (
            <Link to="/admin" className="logo">
              miNegocio{empresaNombre ? (
                <span style={{ 
                  color: '#3b82f6', 
                  fontWeight: '600',
                  marginLeft: '8px',
                  padding: '2px 8px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '6px',
                  fontSize: '0.9em'
                }}>
                  {empresaNombre}
                </span>
              ) : ''} - Admin
            </Link>
          )}
          <div className="flex items-centro gap-4">
            {nombreAdministrador && (
              <span className="texto-gris" style={{ fontSize: '0.9rem' }}>
                👤 {nombreAdministrador}
              </span>
            )}
            <button 
              onClick={onCerrarSesion}
              className="boton boton-secundario"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
