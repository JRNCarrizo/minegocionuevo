import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

interface GoogleLoginButtonProps {
  onSuccess: (userData: GoogleUser) => void;
  onError?: (error: any) => void;
  buttonText?: string;
  variant?: 'default' | 'outline' | 'minimal';
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function GoogleLoginButton({
  onSuccess,
  onError,
  buttonText = 'Continuar con Google',
  variant = 'default',
  disabled = false,
  className = '',
  style = {},
}: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (response) => {
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
        
        // Llamar al callback de éxito con los datos del usuario
        onSuccess({
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          sub: userInfo.sub
        });
        
      } catch (error) {
        console.error('Error al procesar login de Google:', error);
        toast.error('Error al procesar el login con Google');
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Error en login de Google:', error);
      toast.error('Error al iniciar sesión con Google');
      onError?.(error);
      setIsLoading(false);
    },
    // Configurar para usar el dominio principal en producción
    flow: 'implicit'
  });

  const getButtonStyles = () => {
    const baseStyles = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      padding: '0.875rem 1.5rem',
      borderRadius: '0.75rem',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      border: 'none',
      outline: 'none',
      width: '100%',
      opacity: disabled || isLoading ? 0.7 : 1
    };

    switch (variant) {
      case 'outline':
        return {
          ...baseStyles,
          background: 'transparent',
          border: '2px solid #4285f4',
          color: '#4285f4',
          '&:hover': {
            background: '#4285f4',
            color: 'white',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(66, 133, 244, 0.3)'
          }
        };
      case 'minimal':
        return {
          ...baseStyles,
          background: 'transparent',
          color: '#4285f4',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          '&:hover': {
            background: 'rgba(66, 133, 244, 0.1)',
            transform: 'translateY(-1px)'
          }
        };
      default:
        return {
          ...baseStyles,
          background: '#4285f4',
          color: 'white',
          boxShadow: '0 2px 8px rgba(66, 133, 244, 0.3)',
          '&:hover': {
            background: '#3367d6',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(66, 133, 244, 0.4)'
          }
        };
    }
  };

  return (
    <button
      onClick={() => !disabled && !isLoading && login()}
      disabled={disabled || isLoading}
      style={{ ...getButtonStyles(), ...style }}
      className={className}
      onMouseOver={(e) => {
        if (!disabled && !isLoading) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(66, 133, 244, 0.4)';
        }
      }}
      onMouseOut={(e) => {
        if (!disabled && !isLoading) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(66, 133, 244, 0.3)';
        }
      }}
    >
      {isLoading ? (
        <>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderTop: '2px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Procesando...
        </>
      ) : (
        <>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {buttonText}
        </>
      )}
    </button>
  );
} 