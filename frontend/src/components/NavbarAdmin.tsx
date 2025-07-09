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
    <nav style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 0',
          minHeight: '4rem'
        }}>
          {mostrarVolver ? (
            <Link 
              to={urlVolver} 
              style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1e293b',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={{
                fontSize: '1.25rem',
                color: '#3b82f6',
                transition: 'transform 0.2s ease'
              }}>
                ←
              </span>
              <span style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                miNegocio
              </span>
              {empresaNombre && (
                <span style={{
                  color: '#3b82f6',
                  fontWeight: '600',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  {empresaNombre}
                </span>
              )}
              <span style={{
                color: '#64748b',
                fontWeight: '500',
                fontSize: '0.875rem',
                marginLeft: '0.5rem'
              }}>
                - Admin
              </span>
            </Link>
          ) : (
            <Link 
              to="/admin" 
              style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1e293b',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                miNegocio
              </span>
              {empresaNombre && (
                <span style={{
                  color: '#3b82f6',
                  fontWeight: '600',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  {empresaNombre}
                </span>
              )}
              <span style={{
                color: '#64748b',
                fontWeight: '500',
                fontSize: '0.875rem',
                marginLeft: '0.5rem'
              }}>
                - Admin
              </span>
            </Link>
          )}
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem'
          }}>
            {nombreAdministrador && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                borderRadius: '0.75rem',
                border: '1px solid rgba(59, 130, 246, 0.1)'
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  color: 'white',
                  fontWeight: '600'
                }}>
                  {nombreAdministrador.charAt(0).toUpperCase()}
                </div>
                <span style={{
                  fontSize: '0.875rem',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  {nombreAdministrador}
                </span>
              </div>
            )}
            
            <button 
              onClick={onCerrarSesion}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#ef4444',
                border: '2px solid #ef4444',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#ef4444';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16,17 21,12 16,7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
