import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import api from '../services/api';
import { setCookie } from '../utils/cookies';

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

export default function GoogleLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [autoLoginTriggered, setAutoLoginTriggered] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      console.log('Google OAuth response:', response);
      try {
        setIsLoading(true);
        
        // Obtener información del usuario usando el access_token
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${response.access_token}`,
          },
        });
        
        if (!userInfoResponse.ok) {
          throw new Error('Error al obtener información del usuario');
        }
        
        const userInfo = await userInfoResponse.json();
        
        console.log('Google login exitoso:', userInfo);
        
        // Obtener el subdominio directamente del query param
        const subdominioParam = searchParams.get('subdominio');
        if (!subdominioParam) {
          toast.error('No se pudo identificar la tienda');
          return;
        }

        // Llamada al backend para login con Google
        const loginResponse = await api.loginClienteConGoogle(subdominioParam, {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          sub: userInfo.sub
        });
        
        if (loginResponse.token) {
          // Guardar el token en cookies (se comparte entre subdominios)
          setCookie('clienteToken', loginResponse.token, 7);
          setCookie('clienteInfo', JSON.stringify(loginResponse.cliente), 7);
          
          // También guardar en localStorage como respaldo
          localStorage.setItem('clienteToken', loginResponse.token);
          localStorage.setItem('clienteInfo', JSON.stringify(loginResponse.cliente));
          
          console.log('=== DEBUG TOKEN GUARDADO ===');
          console.log('Token guardado en cookies:', 'SÍ');
          console.log('Token guardado en localStorage:', localStorage.getItem('clienteToken') ? 'SÍ' : 'NO');
          console.log('Cliente info guardado:', loginResponse.cliente);
          console.log('==========================');
          
          console.log('Login exitoso con Google para:', loginResponse.cliente.email);
          
          toast.success('¡Bienvenido!');
          
          // Redirigir al subdominio después del login exitoso
          const getSubdominioUrl = () => {
            const hostname = window.location.hostname;
            const port = window.location.port;
            
            // Si estamos en localhost (desarrollo)
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
              return `http://${subdominioParam}.localhost:${port || '5173'}`;
            }
            
            // Si estamos en producción (negocio360.org)
            if (hostname === 'negocio360.org') {
              return `https://${subdominioParam}.negocio360.org`;
            }
            
            // Para cualquier otro caso, usar el mismo hostname pero con subdominio
            return `https://${subdominioParam}.${hostname}`;
          };
          
          const subdominioUrl = getSubdominioUrl();
          console.log('=== DEBUG REDIRECCIÓN ===');
          console.log('Hostname actual:', window.location.hostname);
          console.log('Port actual:', window.location.port);
          console.log('Subdominio del query param:', subdominioParam);
          console.log('URL de redirección:', subdominioUrl);
          console.log('========================');
          window.location.href = subdominioUrl;
        } else {
          console.error('No se recibió token en la respuesta (Google)');
          toast.error('Error: No se recibió token de autenticación');
        }
        
      } catch (error: any) {
        console.error('Error al procesar login de Google:', error);
        
        let mensaje = 'Error al procesar el login con Google';
        
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { data?: { error?: string; mensaje?: string } } };
          if (axiosError.response?.data?.error) {
            mensaje = axiosError.response.data.error;
          } else if (axiosError.response?.data?.mensaje) {
            mensaje = axiosError.response.data.mensaje;
          }
        }
        
        toast.error(mensaje);
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Error en login de Google:', error);
      toast.error('Error al iniciar sesión con Google');
      setIsLoading(false);
    }
  });

  useEffect(() => {
    // Obtener el subdominio de los parámetros de URL
    const subdominioParam = searchParams.get('subdominio');
    
    console.log('GoogleLogin - Subdominio:', subdominioParam);
    console.log('Estado actual - autoLoginTriggered:', autoLoginTriggered);
    
    // Iniciar automáticamente el flujo de Google si tenemos el subdominio y no se ha iniciado ya
    if (subdominioParam && !autoLoginTriggered) {
      console.log('Iniciando flujo de Google automáticamente...');
      setAutoLoginTriggered(true);
      // Pequeño delay para que la página se cargue completamente
      const timer = setTimeout(() => {
        console.log('Ejecutando login()...');
        login();
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams, autoLoginTriggered]);

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
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '1.5rem',
        padding: '3rem 2.5rem',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>
            Iniciando sesión con Google
          </h1>
          <p style={{
            color: '#6b7280',
            fontSize: '1rem'
          }}>
            Redirigiendo a Google para autenticación...
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{
            fontSize: '1.1rem',
            color: '#374151',
            fontWeight: '500'
          }}>
            Conectando con Google...
          </span>
        </div>

        {/* Botón de respaldo por si el inicio automático falla */}
        {autoLoginTriggered && !isLoading && (
          <button
            onClick={() => {
              console.log('Botón de respaldo clickeado');
              login();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1.5rem',
              borderRadius: '0.75rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: 'none',
              outline: 'none',
              width: '100%',
              background: '#4285f4',
              color: 'white',
              boxShadow: '0 4px 12px rgba(66, 133, 244, 0.3)'
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
        )}

        {!searchParams.get('subdominio') && (
          <p style={{
            color: '#ef4444',
            fontSize: '0.875rem',
            marginTop: '1rem'
          }}>
            Error: No se pudo identificar la tienda
          </p>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 