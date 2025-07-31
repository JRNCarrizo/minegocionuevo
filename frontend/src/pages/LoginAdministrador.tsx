import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../services/api';
import GoogleLoginButton from '../components/GoogleLoginButton';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginAdministrador() {
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>();

  const manejarLogin = async (datos: LoginForm) => {
    setCargando(true);
    try {
      console.log('Intentando login con:', datos.email);
      
      // Llamada real al backend
      const response = await ApiService.login({
        usuario: datos.email,
        contrasena: datos.password
      });
      
      console.log('Respuesta del backend:', response);
      
      // Extraer información del usuario de la respuesta
      const user = {
        id: 1, // TODO: obtener del JWT o respuesta
        nombre: response.nombre || 'Usuario',
        apellidos: response.apellidos || '',
        email: response.email,
        rol: response.roles[0],
        empresaId: response.empresaId,
        empresaNombre: response.empresaNombre,
        empresaSubdominio: response.empresaSubdominio
      };
      
      // Guardar token y usuario
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('Usuario guardado en localStorage:', user);
      console.log('Token guardado en localStorage:', response.token);
      console.log('Token verificado:', localStorage.getItem('token'));
      
      // Verificar si es super admin y redirigir al panel correspondiente
      if (user.rol === 'SUPER_ADMIN') {
        console.log('🔵 Redirigiendo a Super Admin Dashboard');
        toast.success('¡Bienvenido Super Administrador!');
        navigate('/dashboard-super-admin');
      } else {
        console.log('🔵 Redirigiendo a Admin Dashboard');
        toast.success('¡Bienvenido de vuelta!');
        navigate('/admin/dashboard');
      }
    } catch (error: unknown) {
      console.error('Error en login:', error);
      
      // Mostrar mensaje de error específico
      let mensajeError = 'Error al iniciar sesión. Verifica tus credenciales.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string; message?: string } } };
        mensajeError = axiosError.response?.data?.error || 
                      axiosError.response?.data?.message || 
                      mensajeError;
      }
      
      toast.error(mensajeError);
    } finally {
      setCargando(false);
    }
  };

  const manejarLoginGoogle = async (googleUser: { email: string; name: string; picture?: string; sub: string }) => {
    setCargando(true);
    try {
      console.log('Intentando login con Google:', googleUser.email);
      
      // Llamada al backend para login con Google
      const response = await ApiService.loginConGoogle(googleUser);
      
      console.log('Respuesta del backend (Google):', response);
      
      // Verificar si es un usuario nuevo
      if (response.usuarioNuevo) {
        console.log('🔵 Usuario nuevo detectado, redirigiendo al registro');
        
        // Guardar datos de Google en localStorage para el registro
        localStorage.setItem('googleUserData', JSON.stringify(response.datosGoogle));
        
        toast.success('¡Bienvenido! Completa tu información para crear tu empresa');
        navigate('/registro', { 
          state: { 
            googleUser: response.datosGoogle,
            fromGoogle: true 
          } 
        });
        return;
      }
      
      // Extraer información del usuario de la respuesta
      const user = {
        id: 1, // TODO: obtener del JWT o respuesta
        nombre: response.nombre || googleUser.name,
        apellidos: response.apellidos || '',
        email: response.email || googleUser.email,
        rol: response.roles[0],
        empresaId: response.empresaId,
        empresaNombre: response.empresaNombre,
        empresaSubdominio: response.empresaSubdominio
      };
      
      // Guardar token y usuario
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('Usuario guardado en localStorage (Google):', user);
      
      // Verificar si es super admin y redirigir al panel correspondiente
      if (user.rol === 'SUPER_ADMIN') {
        console.log('🔵 Redirigiendo a Super Admin Dashboard (Google)');
        toast.success('¡Bienvenido Super Administrador!');
        navigate('/dashboard-super-admin');
      } else {
        console.log('🔵 Redirigiendo a Admin Dashboard (Google)');
        toast.success('¡Bienvenido de vuelta!');
        navigate('/admin/dashboard');
      }
    } catch (error: unknown) {
      console.error('Error en login con Google:', error);
      
      // Mostrar mensaje de error específico
      let mensajeError = 'Error al iniciar sesión con Google.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string; message?: string } } };
        mensajeError = axiosError.response?.data?.error || 
                      axiosError.response?.data?.message || 
                      mensajeError;
      }
      
      toast.error(mensajeError);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      backgroundAttachment: 'fixed',
      backgroundSize: 'cover',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
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
        top: '10%',
        right: '10%',
        width: '200px',
        height: '200px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '10%',
        width: '150px',
        height: '150px',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite reverse'
      }} />

      <div style={{
        maxWidth: '450px',
        width: '100%',
        position: 'relative',
        zIndex: 1
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
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <img 
                src="/images/logo.png" 
                alt="Negocio360 Logo" 
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'contain',
                  marginBottom: '1rem'
                }}
              />
              <Link to="/" style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                color: '#1e293b',
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'block'
              }}>
                Negocio360
              </Link>
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '0.5rem'
            }}>
              Iniciar Sesión
            </h1>
            <p style={{
              fontSize: '1rem',
              color: '#64748b',
              lineHeight: '1.6'
            }}>
              Accede a tu panel de administración
            </p>
          </div>

          {/* Botón de Google PRIMERO y destacado */}
          <GoogleLoginButton
            onSuccess={manejarLoginGoogle}
            onError={(error) => {
              console.error('Error en Google login:', error);
              toast.error('Error al iniciar sesión con Google');
            }}
            buttonText="Continuar con Google"
            variant="outline"
            disabled={cargando}
            className="boton-primario"
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.125rem',
              fontWeight: 600,
              borderRadius: '0.75rem',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
              border: '2px solid #4285f4'
            }}
          />

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
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                {...register('email', {
                  required: 'El correo electrónico es obligatorio',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Ingresa un correo electrónico válido'
                  }
                })}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  border: errors.email ? '2px solid #ef4444' : '2px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  backgroundColor: 'white',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                placeholder="tu@email.com"
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

            <div style={{ marginBottom: '1.5rem' }}>
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
                {...register('password', {
                  required: 'La contraseña es obligatoria'
                })}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  border: errors.password ? '2px solid #ef4444' : '2px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  backgroundColor: 'white',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                placeholder="••••••••"
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
              className="boton-primario"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1.125rem',
                fontWeight: 600,
                borderRadius: '0.75rem',
                marginBottom: '1rem',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.08)',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                transition: 'background 0.2s ease',
                cursor: cargando ? 'not-allowed' : 'pointer',
                opacity: cargando ? 0.7 : 1
              }}
              disabled={cargando}
            >
              {cargando ? 'Ingresando...' : 'Iniciar sesión'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link to="/recuperar" style={{
                color: '#3b82f6',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'color 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#2563eb'}
              onMouseOut={(e) => e.currentTarget.style.color = '#3b82f6'}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <span style={{
                fontSize: '0.875rem',
                color: '#64748b'
              }}>
                ¿No tienes cuenta?{' '}
                <Link to="/registro" style={{
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontWeight: '600',
                  transition: 'color 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.color = '#3b82f6'}>
                  Regístrate gratis
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>

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
          border-color: #3b82f6 !important;
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
