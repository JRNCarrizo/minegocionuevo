import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { FaCheckCircle, FaExclamationTriangle, FaSpinner, FaEnvelope } from 'react-icons/fa';

const VerificarEmailAdmin: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState<'verificando' | 'exitoso' | 'error'>('verificando');
  const [mensaje, setMensaje] = useState('Verificando tu email...');

  useEffect(() => {
    const verificarToken = async () => {
      try {
        const token = searchParams.get('token');
        
        if (!token) {
          setEstado('error');
          setMensaje('Token de verificación no encontrado');
          return;
        }

        console.log('=== VERIFICACIÓN EMAIL ADMIN ===');
        console.log('Token:', token);

        const response = await api.verificarTokenAdmin(token);
        
        console.log('Respuesta:', response);
        
        setEstado('exitoso');
        setMensaje('¡Email verificado exitosamente! Redirigiendo a configuración de empresa...');
        
        // Redirigir después de 3 segundos
        setTimeout(() => {
          navigate('/configurar-empresa');
        }, 3000);
        
      } catch (error: any) {
        console.error('Error verificando email:', error);
        setEstado('error');
        
        if (error.response?.data?.error) {
          setMensaje(error.response.data.error);
        } else {
          setMensaje('Error al verificar el email. Por favor, intenta nuevamente.');
        }
      }
    };

    verificarToken();
  }, [searchParams, navigate]);

  const renderContenido = () => {
    switch (estado) {
      case 'verificando':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)'
            }}>
              <FaSpinner style={{ 
                fontSize: '2rem', 
                color: 'white',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1e293b',
              margin: '0 0 0.5rem 0'
            }}>
              Verificando tu email
            </h2>
            <p style={{
              color: '#64748b',
              fontSize: '1rem',
              margin: 0,
              lineHeight: '1.5'
            }}>
              {mensaje}
            </p>
          </div>
        );
      
      case 'exitoso':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
            }}>
              <FaCheckCircle style={{ 
                fontSize: '2rem', 
                color: 'white'
              }} />
            </div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1e293b',
              margin: '0 0 0.5rem 0'
            }}>
              ¡Email verificado!
            </h2>
            <p style={{
              color: '#64748b',
              fontSize: '1rem',
              margin: '0 0 1rem 0',
              lineHeight: '1.5'
            }}>
              {mensaje}
            </p>
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '0.75rem',
              marginTop: '1rem'
            }}>
              <p style={{
                color: '#166534',
                fontSize: '0.875rem',
                margin: 0,
                fontWeight: '500'
              }}>
                Redirigiendo automáticamente...
              </p>
            </div>
          </div>
        );
      
      case 'error':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)'
            }}>
              <FaExclamationTriangle style={{ 
                fontSize: '2rem', 
                color: 'white'
              }} />
            </div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1e293b',
              margin: '0 0 0.5rem 0'
            }}>
              Error de verificación
            </h2>
            <p style={{
              color: '#64748b',
              fontSize: '1rem',
              margin: '0 0 1.5rem 0',
              lineHeight: '1.5'
            }}>
              {mensaje}
            </p>
            <button
              onClick={() => navigate('/registro')}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
              }}
            >
              Volver al registro
            </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '2rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
          }}>
            <FaEnvelope style={{ 
              fontSize: '1.5rem', 
              color: 'white'
            }} />
          </div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 0.5rem 0'
          }}>
            Verificación de Email
          </h1>
          <p style={{
            color: '#64748b',
            fontSize: '0.875rem',
            margin: 0
          }}>
            Confirmando tu cuenta de administrador
          </p>
        </div>

        {renderContenido()}
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VerificarEmailAdmin; 