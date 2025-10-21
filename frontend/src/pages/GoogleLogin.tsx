import { useEffect, useState, useRef } from 'react';
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
  const hasStarted = useRef(false);

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
        
        // Si no hay subdominio, estamos en el dominio principal (registro de empresa)
        if (!subdominioParam) {
          // Guardar datos de Google para el registro de empresa
          localStorage.setItem('googleUserData', JSON.stringify({
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            sub: userInfo.sub
          }));
          
          // Redirigir a la etapa 2 del registro de empresa
          navigate('/configurar-empresa');
          return;
        }

        // Si hay subdominio, es login de cliente (código existente)
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
          
          // Redirigir inmediatamente
          console.log('Redirigiendo a:', subdominioUrl);
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
    console.log('Has started:', hasStarted.current);
    console.log('URL completa:', window.location.href);
    
    // Iniciar automáticamente el flujo de Google solo una vez
    if (subdominioParam && !hasStarted.current) {
      console.log('Iniciando flujo de Google automáticamente para cliente...');
      hasStarted.current = true;
      
      // Pequeño delay para que la página se cargue completamente
      setTimeout(() => {
        console.log('Ejecutando login()...');
        login();
      }, 100);
    } else if (!subdominioParam && !hasStarted.current) {
      console.log('Iniciando flujo de Google automáticamente para registro de empresa...');
      hasStarted.current = true;
      
      // Pequeño delay para que la página se cargue completamente
      setTimeout(() => {
        console.log('Ejecutando login()...');
        login();
      }, 100);
    }
  }, [searchParams]);

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

        {/* Mensaje sobre popups */}
        <div style={{
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          color: '#92400e'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>
            💡 Si aparece una ventana emergente bloqueada:
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Haz clic en "Permitir" en la notificación del navegador</li>
            <li>O haz clic en el ícono de escudo en la barra de direcciones</li>
            <li>Luego recarga la página</li>
          </ul>
        </div>

        {/* Botón de respaldo para redirección directa */}
        <button
          onClick={() => {
            console.log('Usando redirección directa...');
            // Usar redirección directa en lugar de popup
            const clientId = '517609256268-6iphhaug4u1rhfldegttms507nrh7fuq.apps.googleusercontent.com';
            const redirectUri = encodeURIComponent(window.location.origin + '/google-callback');
            const scope = encodeURIComponent('email profile');
            const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
            window.location.href = url;
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
            background: '#10b981',
            color: 'white',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}
        >
          🔄 Continuar sin popup
        </button>

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