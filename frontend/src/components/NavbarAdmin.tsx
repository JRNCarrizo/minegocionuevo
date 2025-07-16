import { Link } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';

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
  const { isMobile, isTablet, isDesktop } = useResponsive();
  return (
    <nav style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid #e2e8f0',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: isMobile ? '0.75rem 1rem' : '0 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: isMobile ? 'auto' : '4rem',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '0.75rem' : '0'
      }}>
        {isMobile ? (
          // Layout para móvil
          <>
            {/* Primera línea: Logo centrado y inicial del usuario a la derecha */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              paddingBottom: '0.5rem'
            }}>
              {/* Logo centrado */}
              <div style={{ flex: 1 }}></div>
              <Link to="/admin/dashboard" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textDecoration: 'none',
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#1e293b',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span style={{
                  fontSize: '1.5rem',
                  color: '#3b82f6'
                }}>🏢</span>
                <span style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>MiNegocio</span>
              </Link>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                {nombreAdministrador && (
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
                )}
              </div>
            </div>

            {/* Segunda línea: Nombre de empresa y botón de salir */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%'
            }}>
              {empresaNombre && (
                <span style={{
                  color: '#3b82f6',
                  fontWeight: '600',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>{empresaNombre}</span>
              )}
              
              <button 
                onClick={onCerrarSesion}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.5rem 0.75rem',
                  background: 'white',
                  color: '#ef4444',
                  border: '2px solid #ef4444',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '80px',
                  justifyContent: 'center'
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
                title="Cerrar sesión"
              >
                <span style={{ fontSize: '0.875rem' }}>🚪</span>
                <span style={{ fontWeight: '600' }}>Salir</span>
              </button>
            </div>
          </>
        ) : (
          // Layout para desktop/tablet (sin cambios)
          <>
            {/* Logo y nombre de empresa */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: 'auto'
            }}>
              <Link to="/admin/dashboard" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                textDecoration: 'none',
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1e293b',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span style={{
                  fontSize: '1.75rem',
                  color: '#3b82f6'
                }}>🏢</span>
                <span style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>MiNegocio</span>
                {empresaNombre && (
                  <span style={{
                    color: '#3b82f6',
                    fontWeight: '600',
                    padding: '0.25rem 0.75rem',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    marginLeft: '0.75rem'
                  }}>{empresaNombre}</span>
                )}
              </Link>
            </div>

            {/* Usuario y cerrar sesión */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              justifyContent: 'flex-end',
              width: 'auto'
            }}>
              {nombreAdministrador && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  borderRadius: '0.5rem',
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
                    color: '#1e293b',
                    fontWeight: '500'
                  }}>{nombreAdministrador}</span>
                </div>
              )}
              
              <button 
                onClick={onCerrarSesion}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: 'white',
                  color: '#ef4444',
                  border: '2px solid #ef4444',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  justifyContent: 'center'
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
                title="Cerrar sesión"
              >
                <span style={{ fontSize: '1rem' }}>🚪</span>
                <span style={{ fontWeight: '600' }}>Salir</span>
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
