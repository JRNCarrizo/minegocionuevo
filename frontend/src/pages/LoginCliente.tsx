import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSubdominio } from '../hooks/useSubdominio';
import api from '../services/api';

interface LoginClienteForm {
  email: string;
  password: string;
}

export default function LoginCliente() {
  const { empresa, cargando: cargandoEmpresa, subdominio } = useSubdominio();
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginClienteForm>();

  const manejarLogin = async (datos: LoginClienteForm) => {
    const subdominioFinal = subdominio || 'minegocio';
    
    if (!subdominioFinal) {
      toast.error('No se pudo identificar la tienda');
      return;
    }

    setCargando(true);
    try {
      const response = await api.loginCliente(subdominioFinal, {
        email: datos.email,
        password: datos.password
      });
      
      if (response.token) {
        // Guardar el token en localStorage
        localStorage.setItem('clienteToken', response.token);
        localStorage.setItem('clienteInfo', JSON.stringify(response.cliente));
        
        console.log('Login exitoso para:', response.cliente.email);
        
        toast.success('¡Bienvenido!');
        navigate('/');
      } else {
        console.error('No se recibió token en la respuesta');
        toast.error('Error: No se recibió token de autenticación');
      }
    } catch (error: unknown) {
      console.error('Error en login de cliente:', error);
      
      // Manejo más detallado de errores
      let mensaje = 'Error al iniciar sesión. Verifica tus credenciales.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string; mensaje?: string } } };
        if (axiosError.response?.data?.error === 'EMAIL_NO_VERIFICADO') {
          mensaje = 'Debes verificar tu email antes de poder iniciar sesión. Revisa tu bandeja de entrada.';
        } else if (axiosError.response?.data?.error) {
          mensaje = axiosError.response.data.error;
        } else if (axiosError.response?.data?.mensaje) {
          mensaje = axiosError.response.data.mensaje;
        }
      }
      
      toast.error(mensaje);
    } finally {
      setCargando(false);
    }
  };









  if (cargandoEmpresa) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p>Cargando tienda...</p>
        </div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Tienda no encontrada</h1>
          <p style={{ marginBottom: '2rem', opacity: 0.9 }}>
            No se pudo encontrar la tienda solicitada.
          </p>
          <Link to="/" style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: 'white',
            color: '#3b82f6',
            textDecoration: 'none',
            borderRadius: '0.5rem',
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}>
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  // Colores personalizables por empresa (por defecto usamos los colores de la marca)
  const brandColors = {
    primary: empresa.colorPrimario || '#667eea',
    secondary: empresa.colorSecundario || '#764ba2',
    accent: empresa.colorPrimario || '#3b82f6'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%)`,
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'auto'
    }}>
      {/* Botón catálogo arriba a la derecha solo texto blanco */}
      <div style={{
        position: 'absolute',
        top: '2rem',
        right: '2rem',
        zIndex: 10
      }}>
        <Link to="/catalogo" style={{
          background: 'none',
          color: 'white',
          textDecoration: 'underline',
          border: 'none',
          fontWeight: '600',
          fontSize: '1.1rem',
          padding: 0,
          boxShadow: 'none',
          cursor: 'pointer',
          transition: 'color 0.2s ease'
        }}
        onMouseOver={e => {
          e.currentTarget.style.color = brandColors.primary;
        }}
        onMouseOut={e => {
          e.currentTarget.style.color = 'white';
        }}>
          Ir al catálogo
        </Link>
      </div>
      
      {/* Patrón de fondo */}
      <div style={{
        background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.3
      }} />
      
      {/* Círculos decorativos */}
      <div style={{
        position: 'absolute',
        top: '15%',
        right: '15%',
        width: '150px',
        height: '150px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '15%',
        left: '15%',
        width: '100px',
        height: '100px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite reverse'
      }} />

      {/* Contenido principal */}
      <main style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem 1rem',
        position: 'relative',
        zIndex: 1,
        width: '100%'
      }}>
        <div style={{
          maxWidth: '450px',
          width: '100%'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '1.5rem',
            padding: '3rem 2.5rem',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            animation: 'slideInUp 0.8s ease-out'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              {/* Logo de la empresa */}
              <div style={{
                width: '120px',
                height: '120px',
                background: 'transparent',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
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
                  <span style={{ fontSize: '3rem', color: brandColors.primary }}>
                    🏢
                  </span>
                )}
              </div>
              
              <h2 style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '0.5rem'
              }}>
                Iniciar Sesión
              </h2>
              <p style={{
                color: '#64748b',
                fontSize: '1rem',
                lineHeight: '1.5'
              }}>
                Accede a tu cuenta en {empresa.nombre}
              </p>
            </div>

                                                                {/* Botón de Google PRIMERO y destacado */}
             <button
               type="button"
               onClick={() => {
                 const subdominioFinal = subdominio || 'minegocio';
                 if (!subdominioFinal) {
                   toast.error('No se pudo identificar la tienda');
                   return;
                 }
                 
                 // Obtener el dominio base para el login con Google
                 const getBaseDomain = () => {
                   const hostname = window.location.hostname;
                   
                   // Si estamos en localhost, usar localhost
                   if (hostname === 'localhost' || hostname === '127.0.0.1') {
                     return 'http://localhost:5173';
                   }
                   
                   // Para producción, siempre usar el dominio principal
                   return 'https://negocio360.org';
                 };
                 
                 const baseDomain = getBaseDomain();
                 
                 // Redirigir al dominio principal para el login con Google
                 const loginUrl = `${baseDomain}/google-login?subdominio=${subdominioFinal}`;
                 console.log('=== DEBUG LOGIN CLIENTE ===');
                 console.log('Hostname actual:', window.location.hostname);
                 console.log('Subdominio actual:', subdominioFinal);
                 console.log('Dominio base:', baseDomain);
                 console.log('URL de redirección:', loginUrl);
                 console.log('URL completa actual:', window.location.href);
                 console.log('==========================');
                 
                 // Redirigir al dominio principal
                 console.log('Redirigiendo a:', loginUrl);
                 window.location.href = loginUrl;
               }}
               disabled={cargando}
               style={{
                 width: '100%',
                 padding: '1rem',
                 fontSize: '1.125rem',
                 fontWeight: 600,
                 borderRadius: '0.75rem',
                 marginBottom: '1.5rem',
                 boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                 border: '2px solid #4285f4',
                 background: 'white',
                 color: '#4285f4',
                 cursor: cargando ? 'not-allowed' : 'pointer',
                 transition: 'all 0.2s ease',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 gap: '0.75rem'
               }}
               onMouseOver={(e) => {
                 if (!cargando) {
                   e.currentTarget.style.background = '#4285f4';
                   e.currentTarget.style.color = 'white';
                   e.currentTarget.style.transform = 'translateY(-2px)';
                 }
               }}
               onMouseOut={(e) => {
                 if (!cargando) {
                   e.currentTarget.style.background = 'white';
                   e.currentTarget.style.color = '#4285f4';
                   e.currentTarget.style.transform = 'translateY(0)';
                 }
               }}
             >
               <svg width="20" height="20" viewBox="0 0 24 24">
                 <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                 <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                 <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                 <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
               </svg>
               Continuar con Google
             </button>

            {/* Separador */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '1.5rem 0',
              color: '#64748b',
              fontSize: '0.875rem'
            }}>
              <div style={{
                flex: 1,
                height: '1px',
                background: '#e2e8f0'
              }} />
              <span style={{
                padding: '0 1rem',
                background: 'rgba(255, 255, 255, 0.95)'
              }}>
                continúa con
              </span>
              <div style={{
                flex: 1,
                height: '1px',
                background: '#e2e8f0'
              }} />
            </div>

            {/* Formulario tradicional */}
            <form onSubmit={handleSubmit(manejarLogin)}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="email" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: errors.email ? '2px solid #ef4444' : '2px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    backgroundColor: 'white',
                    outline: 'none'
                  }}
                  placeholder="tu@email.com"
                  {...register('email', { 
                    required: 'El email es obligatorio',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido'
                    }
                  })}
                />
                {errors.email && (
                  <p style={{
                    color: '#ef4444',
                    fontSize: '0.875rem',
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>⚠️</span>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label htmlFor="password" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: errors.password ? '2px solid #ef4444' : '2px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    backgroundColor: 'white',
                    outline: 'none'
                  }}
                  placeholder="Tu contraseña"
                  {...register('password', { 
                    required: 'La contraseña es obligatoria',
                    minLength: {
                      value: 6,
                      message: 'La contraseña debe tener al menos 6 caracteres'
                    }
                  })}
                />
                {errors.password && (
                  <p style={{
                    color: '#ef4444',
                    fontSize: '0.875rem',
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>⚠️</span>
                    {errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={cargando}
                style={{
                  width: '100%',
                  padding: '1rem 2rem',
                  background: cargando ? '#9ca3af' : `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%)`,
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: cargando ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: cargando ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)',
                  opacity: cargando ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseOver={(e) => {
                  if (!cargando) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!cargando) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                  }
                }}
              >
                {cargando ? (
                  <>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <Link to="/recuperar-password" style={{
                  fontSize: '0.875rem',
                  color: brandColors.accent,
                  textDecoration: 'none',
                  transition: 'color 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.color = brandColors.accent}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <div style={{
                textAlign: 'center',
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: '#64748b',
                  display: 'block',
                  marginBottom: '1rem'
                }}>
                  ¿No tienes cuenta?
                </span>
                <Link to="/registro" style={{
                  display: 'inline-block',
                  width: '100%',
                  padding: '0.875rem 2rem',
                  background: 'white',
                  color: brandColors.accent,
                  border: `2px solid ${brandColors.accent}`,
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  textAlign: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = brandColors.accent;
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = brandColors.accent;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  Crear cuenta
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>

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
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        input:focus {
          border-color: ${brandColors.accent} !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
        }
        
        @media (max-width: 480px) {
          .login-card {
            padding: 2rem 1.5rem !important;
          }
          
          .login-title {
            font-size: 1.75rem !important;
          }
        }
      `}</style>
    </div>
  );
}
