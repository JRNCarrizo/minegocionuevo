import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../services/api';

interface RecuperacionForm {
  email: string;
}

export default function RecuperarPassword() {
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RecuperacionForm>();

  const manejarRecuperacion = async (datos: RecuperacionForm) => {
    setCargando(true);
    try {
      await ApiService.solicitarRecuperacionPassword(datos.email);
      
      toast.success('Si el email está registrado, recibirás un enlace de recuperación en tu correo electrónico');
      
      // Redirigir al login después de un breve delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error: any) {
      console.error('Error al solicitar recuperación:', error);
      toast.error('Error al procesar la solicitud. Inténtalo de nuevo.');
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
              Recuperar Contraseña
            </h1>
            <p style={{
              fontSize: '1rem',
              color: '#64748b',
              lineHeight: '1.6'
            }}>
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
            </p>
          </div>

          <form onSubmit={handleSubmit(manejarRecuperacion)}>
            <div style={{ marginBottom: '2rem' }}>
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

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.875rem',
                fontSize: '1.125rem',
                fontWeight: 600,
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                transition: 'all 0.2s ease',
                cursor: cargando ? 'not-allowed' : 'pointer',
                opacity: cargando ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}
              disabled={cargando}
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
              {cargando ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link to="/login" style={{
                color: '#3b82f6',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'color 0.2s ease',
                fontSize: '0.875rem'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#2563eb'}
              onMouseOut={(e) => e.currentTarget.style.color = '#3b82f6'}>
                ← Volver al inicio de sesión
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