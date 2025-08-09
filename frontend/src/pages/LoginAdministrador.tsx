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
      console.log('🎯 Roles en la respuesta:', response.roles);
      console.log('🎯 Tipo de roles:', typeof response.roles);
      console.log('🎯 Primer rol:', response.roles?.[0]);
      
      // Extraer información del usuario de la respuesta
      const user = {
        id: 1, // TODO: obtener del JWT o respuesta
        nombre: response.nombre || 'Usuario',
        apellidos: response.apellidos || '',
        email: response.email,
        rol: response.roles?.[0] || 'ADMIN',
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
      console.log('🎯 Rol del usuario:', user.rol);
      console.log('🎯 Comparación user.rol === SUPER_ADMIN:', user.rol === 'SUPER_ADMIN');
      
      // Verificar si es super admin y redirigir al panel correspondiente
      if (user.rol === 'SUPER_ADMIN') {
        console.log('🔵 Redirigiendo a Super Admin Dashboard');
        toast.success('¡Bienvenido Super Administrador!');
        navigate('/dashboard-super-admin');
      } else {
        console.log('🔵 Redirigiendo a Admin Dashboard');
        console.log('🔵 Rol actual:', user.rol);
        toast.success('¡Bienvenido de vuelta!');
        navigate('/admin/dashboard');
      }
    } catch (error: unknown) {
      console.error('Error en login:', error);
      
      // Mostrar mensaje de error específico
      let mensajeError = 'Error al iniciar sesión. Verifica tus credenciales.';
      let mostrarBotonReenvio = false;
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string; message?: string; codigo?: string } } };
        const codigoError = axiosError.response?.data?.codigo;
        
        if (codigoError === 'EMAIL_NO_VERIFICADO') {
          mensajeError = 'Debe verificar su email antes de iniciar sesión. Revise su bandeja de entrada.';
          mostrarBotonReenvio = true;
        } else {
          mensajeError = axiosError.response?.data?.error || 
                        axiosError.response?.data?.message || 
                        mensajeError;
        }
      }
      
      toast.error(mensajeError);
      
      // Mostrar botón de reenvío si es necesario
      if (mostrarBotonReenvio) {
        // Aquí podrías mostrar un modal o componente para reenviar el email
        console.log('Mostrar opción de reenvío de email');
      }
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
              color: '#64748b',
              fontSize: '1rem',
              lineHeight: '1.5'
            }}>
              Accede a tu panel de administración
            </p>
          </div>

          {/* Botón de Google PRIMERO, separado del formulario */}
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
              padding: '0.875rem',
              fontSize: '1.125rem',
              fontWeight: 600,
              borderRadius: '0.75rem',
              marginBottom: '2rem',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.08)',
              background: 'white',
              border: '2px solid #e5e7eb',
              color: '#374151',
              transition: 'all 0.2s ease',
              cursor: cargando ? 'not-allowed' : 'pointer',
              opacity: cargando ? 0.7 : 1
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
              o continúa con email
            </span>
            <div style={{
              flex: 1,
              height: '1px',
              background: '#e2e8f0'
            }} />
          </div>

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
                placeholder="admin@minegocio.com"
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
              className="boton-primario"
              style={{
                width: '100%',
                padding: '0.875rem',
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
            
            <div style={{ 
              textAlign: 'center', 
              marginTop: '0.75rem',
              padding: '12px',
              background: 'linear-gradient(to right, #f0f9ff, #e0f2fe)',
              borderRadius: '12px',
              border: '1px solid #e0f2fe'
            }}>
              <Link to="/admin/login-documento" style={{
                color: '#059669',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'color 0.2s ease',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#047857'}
              onMouseOut={(e) => e.currentTarget.style.color = '#059669'}>
                <span style={{ fontSize: '1.1rem' }}>👥</span>
                ¿Eres administrador asignado? Accede
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


