import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSubdominio } from '../hooks/useSubdominio';
import api from '../services/api';

interface RecuperarPasswordForm {
  email: string;
}

export default function RecuperarPasswordCliente() {
  const { empresa, cargando: cargandoEmpresa, subdominio } = useSubdominio();
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RecuperarPasswordForm>();

  const manejarSolicitud = async (datos: RecuperarPasswordForm) => {
    const subdominioFinal = subdominio || 'minegocio';
    
    if (!subdominioFinal) {
      toast.error('No se pudo identificar la tienda');
      return;
    }

    setCargando(true);
    try {
      await api.solicitarRecuperacionPasswordCliente(subdominioFinal, datos.email);
      
      setEnviado(true);
      toast.success('Si el email existe en nuestra base de datos, recibirás un enlace de recuperación');
      
    } catch (error: any) {
      console.error('Error al solicitar recuperación:', error);
      
      // Por seguridad, siempre mostramos el mismo mensaje
      setEnviado(true);
      toast.success('Si el email existe en nuestra base de datos, recibirás un enlace de recuperación');
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

  if (enviado) {
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
            animation: 'slideInUp 0.8s ease-out',
            textAlign: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%)`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              fontSize: '2rem',
              color: 'white',
              fontWeight: 'bold'
            }}>
              ✓
            </div>
            
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: brandColors.text,
              marginBottom: '1rem'
            }}>
              Email Enviado
            </h1>
            
            <p style={{
              fontSize: '1rem',
              color: '#64748b',
              lineHeight: '1.6',
              marginBottom: '2rem'
            }}>
              Si el email existe en nuestra base de datos, recibirás un enlace de recuperación en tu bandeja de entrada.
            </p>
            
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '2rem'
            }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#64748b',
                margin: 0
              }}>
                💡 <strong>Consejo:</strong> Revisa también tu carpeta de spam si no encuentras el email.
              </p>
            </div>
            
            <Link to="/login" style={{
              display: 'inline-block',
              width: '100%',
              padding: '0.875rem',
              background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%)`,
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '1rem',
              fontWeight: '600',
              textDecoration: 'none',
              textAlign: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              Volver al login
            </Link>
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
        `}</style>
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
              Recuperar Contraseña
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#64748b',
              margin: '0.5rem 0 0 0'
            }}>
              Ingresa tu email para recibir un enlace de recuperación
            </p>
          </div>

          <form onSubmit={handleSubmit(manejarSolicitud)}>
            <div style={{ marginBottom: '2rem' }}>
              <label htmlFor="email" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: brandColors.text,
                marginBottom: '0.5rem'
              }}>
                Email
              </label>
              <input
                type="email"
                id="email"
                {...register('email', {
                  required: 'El email es obligatorio',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido'
                  }
                })}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  fontSize: '1rem',
                  border: errors.email ? '2px solid #ef4444' : '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  backgroundColor: 'white',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                placeholder="tu@email.com"
                disabled={cargando}
              />
              {errors.email && (
                <p style={{
                  color: '#ef4444',
                  fontSize: '0.875rem',
                  margin: '0.5rem 0 0 0'
                }}>
                  {errors.email.message}
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
              {cargando ? 'Enviando...' : 'Enviar enlace de recuperación'}
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