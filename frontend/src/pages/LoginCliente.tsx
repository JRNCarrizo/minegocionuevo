import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSubdominio } from '../hooks/useSubdominio';
import api from '../services/api';

interface LoginClienteForm {
  email: string;
  password: string;
}

export default function LoginCliente() {
  const { empresa, cargando: cargandoEmpresa, subdominio } = useSubdominio();
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginClienteForm>();

  const manejarLogin = async (datos: LoginClienteForm) => {
    const subdominioFinal = subdominio || 'minegocio';
    
    if (!subdominioFinal) {
      toast.error('No se pudo identificar la tienda');
      return;
    }

    setCargando(true);
    try {
      const response = await api.loginCliente(subdominioFinal, {
        email: datos.email,
        password: datos.password
      });
      
      if (response.token) {
        // Guardar el token en localStorage
        localStorage.setItem('clienteToken', response.token);
        localStorage.setItem('clienteInfo', JSON.stringify(response.cliente));
        
        console.log('Login exitoso para:', response.cliente.email);
        
        toast.success('¡Bienvenido!');
        navigate('/');
      } else {
        console.error('No se recibió token en la respuesta');
        toast.error('Error: No se recibió token de autenticación');
      }
    } catch (error: unknown) {
      console.error('Error en login de cliente:', error);
      
      // Manejo más detallado de errores
      let mensaje = 'Error al iniciar sesión. Verifica tus credenciales.';
      
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
      setCargando(false);
    }
  };

  if (cargandoEmpresa) {
    return (
      <div className="pagina-cargando">
        <div className="spinner"></div>
        <p>Cargando...</p>
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

  return (
    <div className="login-cliente">
      {/* Header de la tienda */}
      <header className="header-tienda">
        <div className="contenedor">
          <div className="info-empresa">
            {empresa.logoUrl && (
              <img 
                src={empresa.logoUrl} 
                alt={`Logo de ${empresa.nombre}`}
                className="logo-empresa"
              />
            )}
            <div>
              <h1 className="nombre-empresa">{empresa.nombre}</h1>
            </div>
          </div>
          
          <nav className="nav-tienda">
            <Link to="/" className="nav-link">Catálogo</Link>
            <Link to="/carrito" className="nav-link">Carrito</Link>
          </nav>
        </div>
      </header>

      <main className="contenedor">
        <div className="formulario-login-cliente">
          <div className="tarjeta-login">
            <div className="cabecera-login">
              <h2>Iniciar Sesión</h2>
              <p>Accede a tu cuenta en {empresa.nombre}</p>
            </div>

            <form onSubmit={handleSubmit(manejarLogin)}>
              <div className="grupo-campo">
                <label htmlFor="email" className="etiqueta">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className={`campo ${errors.email ? 'campo-error' : ''}`}
                  placeholder="tu@email.com"
                  {...register('email', { 
                    required: 'El email es obligatorio',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido'
                    }
                  })}
                />
                {errors.email && (
                  <p className="mensaje-error">{errors.email.message}</p>
                )}
              </div>

              <div className="grupo-campo">
                <label htmlFor="password" className="etiqueta">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  className={`campo ${errors.password ? 'campo-error' : ''}`}
                  placeholder="Tu contraseña"
                  {...register('password', { 
                    required: 'La contraseña es obligatoria',
                    minLength: {
                      value: 6,
                      message: 'La contraseña debe tener al menos 6 caracteres'
                    }
                  })}
                />
                {errors.password && (
                  <p className="mensaje-error">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={cargando}
                className={`boton boton-primario boton-completo boton-grande ${
                  cargando ? 'opacidad-50 cursor-no-permitido' : ''
                }`}
              >
                {cargando ? (
                  <span className="flex items-centro centrado">
                    <span className="cargando" style={{ marginRight: '0.5rem' }}></span>
                    Iniciando sesión...
                  </span>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>

              <div className="enlaces-login">
                <Link to="/recuperar-password" className="enlace-secundario">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <div className="separador">
                <span>¿No tienes cuenta?</span>
              </div>

              <Link to="/registro" className="boton boton-secundario boton-completo">
                Crear cuenta
              </Link>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
