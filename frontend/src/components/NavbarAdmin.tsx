import { Link } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../hooks/useTheme';

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
  const { isDarkMode, toggleTheme } = useTheme();
  return (
    <nav style={{
      background: 'var(--color-navbar)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--color-borde)',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      boxShadow: '0 4px 6px -1px var(--color-sombra)'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: isMobile ? '0.5rem 1rem' : '0.125rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: isMobile ? 'auto' : '3rem',
        flexDirection: isMobile ? 'row' : 'row',
        gap: isMobile ? '0.5rem' : '0'
      }}>
        {isMobile ? (
          // Layout compacto para móvil - Todo en una sola línea
          <>
            {/* Logo más pequeño */}
            <Link to="/admin/dashboard" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '700',
              color: 'var(--color-texto-principal)',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <img 
                src="/images/n360cio-logo.png" 
                alt="N360CIO Logo" 
                style={{
                  width: '32px',
                  height: '32px',
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  e.currentTarget.src = '/images/logo.png';
                  e.currentTarget.alt = 'Logo';
                }}
              />
            </Link>

            {/* Nombre de empresa (si cabe) */}
            {empresaNombre && (
              <span style={{
                color: '#3b82f6',
                fontWeight: '600',
                padding: '0.125rem 0.375rem',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                flexShrink: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>{empresaNombre}</span>
            )}

            {/* Espaciador flexible */}
            <div style={{ flex: 1, minWidth: '0.5rem' }}></div>

            {/* Controles del lado derecho */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              flexShrink: 0
            }}>
              {/* Inicial del usuario */}
              {nombreAdministrador && (
                <div style={{
                  width: '1.75rem',
                  height: '1.75rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  color: 'white',
                  fontWeight: '600'
                }}>
                  {nombreAdministrador.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Botón de cambio de tema más pequeño */}
              <button 
                onClick={toggleTheme}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '1.75rem',
                  height: '1.75rem',
                  background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                  color: isDarkMode ? '#3b82f6' : '#f59e0b',
                  border: isDarkMode ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(251, 191, 36, 0.2)',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '0.875rem'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.boxShadow = isDarkMode 
                    ? '0 2px 8px rgba(59, 130, 246, 0.3)' 
                    : '0 2px 8px rgba(251, 191, 36, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              
              {/* Botón de salir más compacto */}
              <button 
                onClick={onCerrarSesion}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.125rem',
                  padding: '0.375rem 0.5rem',
                  background: 'var(--color-card)',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  borderRadius: '0.25rem',
                  fontSize: '0.6875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '60px',
                  justifyContent: 'center'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'var(--color-card)';
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                title="Cerrar sesión"
              >
                <span style={{ fontSize: '0.75rem' }}>🚪</span>
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
                color: 'var(--color-texto-principal)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
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

            {/* Usuario, botón de tema y cerrar sesión */}
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
                    color: 'var(--color-texto-principal)',
                    fontWeight: '500'
                  }}>{nombreAdministrador}</span>
                </div>
              )}
              
              {/* Botón de cambio de tema */}
              <button 
                onClick={toggleTheme}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2.75rem',
                  height: '2.75rem',
                  background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                  color: isDarkMode ? '#3b82f6' : '#f59e0b',
                  border: isDarkMode ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(251, 191, 36, 0.2)',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '1.25rem'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.boxShadow = isDarkMode 
                    ? '0 4px 12px rgba(59, 130, 246, 0.3)' 
                    : '0 4px 12px rgba(251, 191, 36, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              
              <button 
                onClick={onCerrarSesion}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--color-card)',
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
                  e.currentTarget.style.background = 'var(--color-card)';
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
