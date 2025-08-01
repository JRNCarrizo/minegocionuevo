import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';

export default function VerificarEmailCliente() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificado, setVerificado] = useState<boolean | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setError('Token de verificación no encontrado');
      setCargando(false);
      return;
    }

    verificarEmail(token);
  }, [searchParams]);

  const verificarEmail = async (token: string) => {
    try {
      const response = await api.verificarEmailCliente(token);
      
      if (response.exito) {
        setVerificado(true);
        toast.success('¡Email verificado exitosamente!');
        
        // Redirigir después de 5 segundos
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      } else {
        setVerificado(false);
        setError(response.mensaje || 'Error al verificar el email');
      }
    } catch (error: any) {
      setVerificado(false);
      setError('Error al verificar el email. Por favor, intenta nuevamente.');
      console.error('Error verificando email:', error);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '1.5rem',
          padding: '3rem 2.5rem',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 2rem'
          }} />
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '1rem'
          }}>
            Verificando tu email...
          </h2>
          <p style={{
            color: '#64748b',
            fontSize: '1.1rem'
          }}>
            Por favor espera mientras verificamos tu cuenta.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '1.5rem',
          padding: '3rem 2.5rem',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: '#ef4444',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '1rem'
          }}>
            Error de Verificación
          </h2>
          
          <p style={{
            color: '#64748b',
            fontSize: '1.1rem',
            marginBottom: '2rem',
            lineHeight: '1.6'
          }}>
            {error}
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '0.875rem 2rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                borderRadius: '0.75rem',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Ir al Login
            </button>
            
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '0.875rem 2rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                borderRadius: '0.75rem',
                background: 'transparent',
                color: '#ef4444',
                border: '2px solid #ef4444',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (verificado) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
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
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '10%',
          width: '150px',
          height: '150px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse'
        }} />

        <div style={{
          maxWidth: '500px',
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
            <div style={{ textAlign: 'center' }}>
              {/* Ícono de éxito */}
              <div style={{
                width: '100px',
                height: '100px',
                margin: '0 auto 2rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
                animation: 'bounceIn 0.8s ease-out'
              }}>
                <svg
                  width="50"
                  height="50"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  style={{ animation: 'checkmark 0.5s ease-out 0.3s both' }}
                >
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <h2 style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '1rem'
              }}>
                ¡Verificación Exitosa!
              </h2>

              <p style={{
                fontSize: '1.2rem',
                color: '#64748b',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                Tu cuenta ha sido verificada correctamente.
                <br />
                <span style={{ fontWeight: '600', color: '#10b981' }}>
                  ¡Ya puedes iniciar sesión en tu tienda!
                </span>
              </p>

              {/* Contador de redirección */}
              <div style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                borderRadius: '1rem',
                padding: '1.5rem',
                marginBottom: '2rem',
                border: '2px solid #e2e8f0'
              }}>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0 0 0.5rem 0'
                }}>
                  Serás redirigido automáticamente en:
                </p>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#10b981',
                  fontFamily: 'monospace'
                }}>
                  5 segundos
                </div>
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    padding: '0.875rem 2rem',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                  }}
                >
                  Ir al Login
                </button>

                <button
                  onClick={() => navigate('/')}
                  style={{
                    padding: '0.875rem 2rem',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    borderRadius: '0.75rem',
                    background: 'transparent',
                    color: '#10b981',
                    border: '2px solid #10b981',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#10b981';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#10b981';
                  }}
                >
                  Inicio
                </button>
              </div>
            </div>
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

          @keyframes bounceIn {
            0% {
              opacity: 0;
              transform: scale(0.3);
            }
            50% {
              opacity: 1;
              transform: scale(1.05);
            }
            70% {
              transform: scale(0.9);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes checkmark {
            0% {
              opacity: 0;
              transform: scale(0);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return null;
} 