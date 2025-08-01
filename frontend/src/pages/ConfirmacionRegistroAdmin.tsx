import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ConfirmacionRegistroAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [contador, setContador] = useState(10);

  const email = searchParams.get('email');

  useEffect(() => {
    if (contador > 0) {
      const timer = setTimeout(() => setContador(contador - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      navigate('/configurar-empresa');
    }
  }, [contador, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '3rem 2rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        {/* Ícono de éxito */}
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem',
          boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)'
        }}>
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
          >
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Título */}
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          color: '#1e293b',
          margin: '0 0 1rem 0'
        }}>
          ¡Cuenta Creada Exitosamente!
        </h1>

        {/* Mensaje principal */}
        <p style={{
          fontSize: '1.2rem',
          color: '#64748b',
          lineHeight: '1.6',
          margin: '0 0 2rem 0'
        }}>
          Tu cuenta de administrador ha sido creada.
          <br />
          Ahora necesitas verificar tu email para continuar con la configuración de tu empresa.
        </p>

        {/* Información del email */}
        {email && (
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            borderRadius: '12px',
            padding: '1.5rem',
            margin: '0 0 2rem 0',
            border: '2px solid #e2e8f0'
          }}>
            <p style={{
              fontSize: '1rem',
              color: '#374151',
              margin: '0 0 0.5rem 0',
              fontWeight: '600'
            }}>
              Email registrado:
            </p>
            <p style={{
              fontSize: '1.1rem',
              color: '#1e293b',
              margin: 0,
              fontWeight: '500'
            }}>
              {email}
            </p>
          </div>
        )}

        {/* Instrucciones */}
        <div style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          margin: '0 0 2rem 0',
          border: '2px solid #bfdbfe'
        }}>
          <h3 style={{
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#1e40af',
            margin: '0 0 1rem 0'
          }}>
            📧 Pasos para continuar:
          </h3>
          <ul style={{
            textAlign: 'left',
            margin: 0,
            paddingLeft: '1.5rem',
            color: '#374151',
            lineHeight: '1.8'
          }}>
            <li>Revisa tu bandeja de entrada</li>
            <li>Busca el email de verificación de Negocio360</li>
            <li>Haz clic en el enlace de verificación</li>
            <li>Serás redirigido automáticamente a configurar tu empresa</li>
          </ul>
        </div>

        {/* Advertencia sobre spam */}
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: '12px',
          padding: '1rem',
          margin: '0 0 2rem 0',
          border: '2px solid #fbbf24'
        }}>
          <p style={{
            fontSize: '0.9rem',
            color: '#92400e',
            margin: 0,
            fontWeight: '500'
          }}>
            ⚠️ <strong>Consejo:</strong> Si no encuentras el email, revisa tu carpeta de spam o correo no deseado.
          </p>
        </div>

        {/* Contador de redirección */}
        <div style={{
          background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          margin: '0 0 2rem 0',
          border: '2px solid #cbd5e1'
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
            color: '#3b82f6',
            fontFamily: 'monospace'
          }}>
            {contador} segundos
          </div>
        </div>

        {/* Botones */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => navigate('/configurar-empresa')}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Configurar Empresa
          </button>

          <button
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              color: '#64748b',
              border: '2px solid #cbd5e1',
              borderRadius: '10px',
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#94a3b8';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmacionRegistroAdmin; 