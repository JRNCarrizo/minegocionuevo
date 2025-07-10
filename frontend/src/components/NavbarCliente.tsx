import { Link } from 'react-router-dom';
import CartIcon from './CartIcon';

interface NavbarClienteProps {
  empresa: {
    nombre: string;
    descripcion?: string;
    logoUrl?: string;
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
  return (
    <header style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '70px'
      }}>
        {/* Logo y nombre de empresa */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Link to="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: 'white',
            fontWeight: '700',
            fontSize: '18px',
            transition: 'transform 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{
              width: '40px',
              height: '40px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              {empresa.logoUrl ? '🏢' : '🛍️'}
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start'
            }}>
              <span style={{
                fontSize: '18px',
                fontWeight: '700',
                color: 'white'
              }}>
                {empresa.nombre}
              </span>
              {empresa.descripcion && (
                <span style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.8)',
                  fontWeight: '400'
                }}>
                  {empresa.descripcion.length > 30 ? empresa.descripcion.substring(0, 30) + '...' : empresa.descripcion}
                </span>
              )}
            </div>
          </Link>
        </div>

        {/* Navegación y controles */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          {/* Enlaces de navegación */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <Link to="/" style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              padding: '8px 12px',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              background: 'rgba(255,255,255,0.1)'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              🏠 Inicio
            </Link>
            
            {/* Carrito - solo mostrar si hay cliente logueado */}
            {clienteInfo && (
              <div style={{
                position: 'relative',
                cursor: 'pointer'
              }}>
                <CartIcon onClick={onShowCart} />
              </div>
            )}
          </div>

          {/* Información del cliente */}
          {clienteInfo ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Link to="/cuenta" style={{
                color: 'white',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600',
                padding: '8px 12px',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                background: 'rgba(255,255,255,0.1)'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                👤 Mi Cuenta
              </Link>
              
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
              
              <button 
                onClick={onCerrarSesion}
                style={{
                  background: 'rgba(220, 53, 69, 0.8)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
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
              fontSize: '14px',
              fontWeight: '600',
              padding: '10px 16px',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
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