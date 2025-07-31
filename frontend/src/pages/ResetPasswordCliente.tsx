import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSubdominio } from '../hooks/useSubdominio';
import api from '../services/api';

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordCliente() {
  const { empresa, cargando: cargandoEmpresa, subdominio } = useSubdominio();
  const [cargando, setCargando] = useState(false);
  const [tokenValido, setTokenValido] = useState(false);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<ResetPasswordForm>();

  const password = watch('password');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      toast.error('Token de recuperación no válido');
      navigate('/login');
      return;
    }

    // Si no hay subdominio detectado, intentar detectarlo manualmente (como en LoginCliente)
    let subdominioFinal = subdominio;
    if (!subdominioFinal) {
      const hostname = window.location.hostname;
      const partes = hostname.split('.');
      if (partes.length >= 2) {
        subdominioFinal = partes[0];
        console.log('Subdominio detectado manualmente:', subdominioFinal);
      }
    }

    if (!subdominioFinal) {
      toast.error('No se pudo identificar la tienda');
      navigate('/login');
      return;
    }

    // Validar el token
    validarToken(token, subdominioFinal);
  }, [searchParams, navigate, subdominio, empresa, cargandoEmpresa]);

  const validarToken = async (token: string, subdominioParam: string) => {
    try {
      // Validar el token con el backend
      const response = await api.validarTokenRecuperacionCliente(subdominioParam, token);
      
      if (response.valido) {
        setTokenValido(true);
        setEmail(response.email);
      } else {
        toast.error('Token de recuperación inválido o expirado');
        navigate('/login');
      }
    } catch (error: any) {
      console.error('Error al validar token:', error);
      
      if (error.response?.status === 404) {
        toast.error('Tienda no encontrada');
      } else if (error.response?.status === 400) {
        toast.error('Token de recuperación inválido o expirado');
      } else {
        toast.error('Error al validar el token. Inténtalo de nuevo.');
      }
      
      navigate('/login');
    }
  };

  const manejarCambioPassword = async (datos: ResetPasswordForm) => {
    // Si no hay subdominio detectado, intentar detectarlo manualmente
    let subdominioFinal = subdominio;
    if (!subdominioFinal) {
      const hostname = window.location.hostname;
      const partes = hostname.split('.');
      if (partes.length >= 2) {
        subdominioFinal = partes[0];
      }
    }

    if (!subdominioFinal) {
      toast.error('No se pudo identificar la tienda');
      return;
    }

    const token = searchParams.get('token');
    if (!token) {
      toast.error('Token de recuperación no válido');
      return;
    }

    setCargando(true);
    try {
      // Usar el endpoint específico para cambiar contraseña con token
      await api.cambiarPasswordConTokenCliente(subdominioFinal, {
        token: token,
        password: datos.password
      });
      
      toast.success('Contraseña actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña');
      
      // Redirigir al login después de un breve delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      toast.error('Error al cambiar la contraseña. Inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  // Colores de la empresa
  const brandColors = {
    primary: empresa?.colorPrimario || '#3b82f6',
    secondary: empresa?.colorSecundario || '#64748b',
    accent: empresa?.colorAcento || '#f59e0b',
    background: empresa?.colorFondo || '#ffffff',
    text: empresa?.colorTexto || '#1f2937'
  };

  if (cargandoEmpresa) {
    return (
      <div className="pagina-cargando">
        <div className="spinner"></div>
        <p>Cargando tienda...</p>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="pagina-error">
        <h1>Tienda no encontrada</h1>
        <p>No se pudo encontrar la tienda solicitada.</p>
        <Link to="/" className="boton boton-primario">
          Volver al inicio
        </Link>
      </div>
    );
  }

  if (!tokenValido) {
    return (
      <div className="pagina-cargando">
        <div className="spinner"></div>
        <p>Validando enlace de recuperación...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%)`,
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
              {empresa.logoUrl ? (
                <img 
                  src={empresa.logoUrl} 
                  alt={`${empresa.nombre} Logo`} 
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'contain',
                    marginBottom: '1rem'
                  }}
                />
              ) : (
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%)`,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  fontSize: '2rem',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {empresa.nombre.charAt(0).toUpperCase()}
                </div>
              )}
              <Link to="/" style={{
                textDecoration: 'none',
                color: brandColors.text
              }}>
                <h1 style={{
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  margin: 0,
                  color: brandColors.text
                }}>
                  {empresa.nombre}
                </h1>
              </Link>
            </div>
            
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              margin: 0,
              color: brandColors.text
            }}>
              Cambiar Contraseña
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#64748b',
              margin: '0.5rem 0 0 0'
            }}>
              Ingresa tu nueva contraseña
            </p>
          </div>

          <form onSubmit={handleSubmit(manejarCambioPassword)}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="password" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: brandColors.text,
                marginBottom: '0.5rem'
              }}>
                Nueva Contraseña
              </label>
              <input
                type="password"
                id="password"
                {...register('password', {
                  required: 'La contraseña es obligatoria',
                  minLength: {
                    value: 6,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                  }
                })}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  fontSize: '1rem',
                  border: errors.password ? '2px solid #ef4444' : '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  backgroundColor: 'white',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                placeholder="Tu nueva contraseña"
                disabled={cargando}
              />
              {errors.password && (
                <p style={{
                  color: '#ef4444',
                  fontSize: '0.875rem',
                  margin: '0.5rem 0 0 0'
                }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="confirmPassword" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: brandColors.text,
                marginBottom: '0.5rem'
              }}>
                Confirmar Contraseña
              </label>
              <input
                type="password"
                id="confirmPassword"
                {...register('confirmPassword', {
                  required: 'Debes confirmar la contraseña',
                  validate: value => value === password || 'Las contraseñas no coinciden'
                })}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  fontSize: '1rem',
                  border: errors.confirmPassword ? '2px solid #ef4444' : '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  backgroundColor: 'white',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                placeholder="Confirma tu nueva contraseña"
                disabled={cargando}
              />
              {errors.confirmPassword && (
                <p style={{
                  color: '#ef4444',
                  fontSize: '0.875rem',
                  margin: '0.5rem 0 0 0'
                }}>
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.875rem',
                fontSize: '1.125rem',
                fontWeight: '600',
                borderRadius: '0.75rem',
                marginBottom: '1rem',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.08)',
                background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%)`,
                color: 'white',
                border: 'none',
                transition: 'all 0.2s ease',
                cursor: cargando ? 'not-allowed' : 'pointer',
                opacity: cargando ? 0.7 : 1
              }}
              disabled={cargando}
            >
              {cargando ? 'Cambiando contraseña...' : 'Cambiar Contraseña'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link to="/login" style={{
                color: brandColors.primary,
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'color 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = brandColors.accent}
              onMouseOut={(e) => e.currentTarget.style.color = brandColors.primary}>
                ← Volver al login
              </Link>
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
        
        input:focus {
          border-color: ${brandColors.primary} !important;
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