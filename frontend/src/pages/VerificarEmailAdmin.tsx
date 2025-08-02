import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

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
          <div className="text-center">
            <FaSpinner className="mx-auto text-4xl text-blue-500 animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Verificando tu email</h2>
            <p className="text-gray-600">{mensaje}</p>
          </div>
        );
      
      case 'exitoso':
        return (
          <div className="text-center">
            <FaCheckCircle className="mx-auto text-4xl text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">¡Email verificado!</h2>
            <p className="text-gray-600 mb-4">{mensaje}</p>
            <div className="text-sm text-gray-500">
              Redirigiendo automáticamente...
            </div>
          </div>
        );
      
      case 'error':
        return (
          <div className="text-center">
            <FaExclamationTriangle className="mx-auto text-4xl text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error de verificación</h2>
            <p className="text-gray-600 mb-4">{mensaje}</p>
            <button
              onClick={() => navigate('/registro')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {renderContenido()}
      </div>
    </div>
  );
};

export default VerificarEmailAdmin; 