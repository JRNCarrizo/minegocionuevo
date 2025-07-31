import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'
import { CartProvider } from './hooks/useCart'

// Client ID de Google OAuth
const GOOGLE_CLIENT_ID = '517609256268-6iphhaug4u1rhfldegttms507nrh7fuq.apps.googleusercontent.com'

// Función para obtener el dominio base (sin subdominio)
const getBaseDomain = () => {
  const hostname = window.location.hostname;
  
  // Si estamos en localhost, usar localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return window.location.origin;
  }
  
  // Para producción, siempre usar el dominio principal
  return 'https://negocio360.org';
};

// Configurar OAuth para usar el dominio base
const oauthConfig = {
  clientId: GOOGLE_CLIENT_ID,
  // Usar el dominio base para OAuth
  redirectUri: getBaseDomain()
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <CartProvider>
        <App />
      </CartProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
