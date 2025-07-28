import { Link, useLocation } from 'react-router-dom';
import CartIcon from './CartIcon';
import { FaInstagram, FaFacebook, FaShoppingCart } from 'react-icons/fa';
import { useResponsive } from '../hooks/useResponsive';

interface NavbarClienteProps {
  empresa: {
    nombre: string;
    descripcion?: string;
    logoUrl?: string;
    colorPrimario?: string;
    colorSecundario?: string;
    colorAcento?: string;
    colorFondo?: string;
    colorTexto?: string;
    imagenFondoUrl?: string;
    instagramUrl?: string;
    facebookUrl?: string;
  };
  clienteInfo?: {
    nombre: string;
    email: string;
  } | null;
  onCerrarSesion: () => void;
  onShowCart: () => void;
}

export default function NavbarCliente({ 
  empresa, 
  clienteInfo, 
  onCerrarSesion, 
  onShowCart 
}: NavbarClienteProps) {
  const location = useLocation();
  const estaEnCuenta = location.pathname === '/cuenta';
  const { isMobile, isTablet, isDesktop } = useResponsive();
  // Aplicar colores personalizados
  const colorPrimario = empresa.colorPrimario || '#667eea';
  const colorSecundario = empresa.colorSecundario || '#764ba2';
  
  return (
    <header style={{
      background: `linear-gradient(135deg, ${colorPrimario} 0%, ${colorSecundario} 100%)`,
      boxShadow: `0 4px 20px ${colorPrimario}30`,
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: isMobile ? '0 16px' : '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isMobile ? 'space-between' : 'space-between',
        height: isMobile ? 'auto' : '70px',
        flexDirection: isMobile ? 'column' : 'row',
        paddingTop: isMobile ? '12px' : '0',
        paddingBottom: isMobile ? '12px' : '0',
        gap: isMobile ? '12px' : '0'
      }}>
        {/* Logo y nombre de empresa con inicial del cliente en móvil */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMobile ? 'space-between' : 'flex-start',
          width: isMobile ? '100%' : 'auto',
          gap: isMobile ? '8px' : '12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '8px' : '12px',
            justifyContent: 'center'
          }}>
            {estaEnCuenta ? (
              <Link to="/" style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '8px' : '12px',
                textDecoration: 'none',
                color: 'white',
                fontWeight: '700',
                fontSize: isMobile ? '16px' : '18px',
                transition: 'transform 0.2s ease',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              title="Volver al catálogo"
              >
                <div style={{
                  width: isMobile ? '40px' : '50px',
                  height: isMobile ? '40px' : '50px',
                  background: 'transparent',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? '20px' : '24px',
                  overflow: 'hidden'
                }}>
                  {empresa.logoUrl ? (
                    <img
                      src={empresa.logoUrl}
                      alt={`Logo de ${empresa.nombre}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        borderRadius: '50%'
                      }}
                    />
                  ) : (
                    '🛍️'
                  )}
                </div>
                <span style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: 'white',
                  fontFamily: "'Playfair Display', serif",
                  letterSpacing: '0.5px'
                }}>
                  {empresa.nombre}
                </span>
              </Link>
            ) : (
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textDecoration: 'none',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '18px',
                  transition: 'transform 0.2s ease',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                title="Volver arriba"
                >
                <div style={{
                  width: isMobile ? '40px' : '50px',
                  height: isMobile ? '40px' : '50px',
                  background: 'transparent',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? '20px' : '24px',
                  overflow: 'hidden'
                }}>
                  {empresa.logoUrl ? (
                    <img
                      src={empresa.logoUrl}
                      alt={`Logo de ${empresa.nombre}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        borderRadius: '50%'
                      }}
                    />
                  ) : (
                    '🛍️'
                  )}
                </div>
                <span style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: 'white'
                }}>
                  {empresa.nombre}
                </span>
              </button>
            )}
          </div>

          {/* Inicial del cliente en móvil - ahora en la misma línea a la derecha */}
          {isMobile && clienteInfo && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              fontSize: '16px',
              fontWeight: '700',
              color: 'white',
              flexShrink: 0
            }}>
              {clienteInfo.nombre.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Navegación y controles */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '10px' : '20px',
          marginTop: isMobile ? '8px' : '0',
          justifyContent: isMobile ? 'center' : 'flex-end',
          width: isMobile ? '100%' : 'auto',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
        }}>

          {/* Enlaces de navegación */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>

            

          </div>

          {/* Redes sociales - solo en desktop */}
          {!isMobile && (empresa.instagramUrl || empresa.facebookUrl) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {empresa.instagramUrl && (
                <a
                  href={empresa.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '18px',
                    padding: '6px',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease',
                    background: 'rgba(255,255,255,0.1)',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title="Síguenos en Instagram"
                >
                  <FaInstagram size={16} />
                </a>
              )}
              
              {empresa.facebookUrl && (
                <a
                  href={empresa.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '18px',
                    padding: '6px',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease',
                    background: 'rgba(255,255,255,0.1)',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title="Síguenos en Facebook"
                >
                  <FaFacebook size={16} />
                </a>
              )}
              

            </div>
          )}

          {/* Información del cliente */}
          {clienteInfo ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '8px' : '12px',
              flexDirection: isMobile ? 'row' : 'row',
              justifyContent: isMobile ? 'center' : 'flex-start'
            }}>
              <Link to="/cuenta" style={{
                color: 'white',
                textDecoration: 'none',
                fontSize: isMobile ? '12px' : '14px',
                fontWeight: '600',
                padding: isMobile ? '6px 10px' : '8px 12px',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                background: 'rgba(255,255,255,0.1)'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                👤 Mi Cuenta
              </Link>
              
              {/* Saludo del cliente - solo en desktop */}
              {!isMobile && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}>
                    {clienteInfo.nombre.charAt(0).toUpperCase()}
                  </div>
                  <span>¡Hola, {clienteInfo.nombre}!</span>
                </div>
              )}
              
              <button 
                onClick={onCerrarSesion}
                style={{
                  background: 'rgba(220, 53, 69, 0.8)',
                  color: 'white',
                  border: 'none',
                  padding: isMobile ? '6px 10px' : '8px 12px',
                  borderRadius: '8px',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(220, 53, 69, 1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(220, 53, 69, 0.8)'}
              >
                <span>🚪</span>
                <span>Salir</span>
              </button>
            </div>
          ) : (
            <Link to="/login" style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: '600',
              padding: isMobile ? '8px 12px' : '10px 16px',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              justifyContent: isMobile ? 'center' : 'flex-start'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              <span>🔑</span>
              <span>Iniciar Sesión</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
} 