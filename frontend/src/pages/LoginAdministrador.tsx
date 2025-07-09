import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../services/api';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginAdministrador() {
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>();

  const manejarLogin = async (datos: LoginForm) => {
    setCargando(true);
    try {
      console.log('Intentando login con:', datos.email);
      
      // Llamada real al backend
      const response = await ApiService.login({
        usuario: datos.email,
        contrasena: datos.password
      });
      
      console.log('Respuesta del backend:', response);
      
      // Extraer información del usuario de la respuesta
      const user = {
        id: 1, // TODO: obtener del JWT o respuesta
        nombre: response.nombre || 'Usuario',
        apellidos: response.apellidos || '',
        email: response.email,
        rol: response.roles[0],
        empresaId: response.empresaId,
        empresaNombre: response.empresaNombre,
        empresaSubdominio: response.empresaSubdominio
      };
      
      // Guardar token y usuario
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('Usuario guardado en localStorage:', user);
      
      toast.success('¡Bienvenido de vuelta!');
      navigate('/admin/dashboard');
    } catch (error: unknown) {
      console.error('Error en login:', error);
      
      // Mostrar mensaje de error específico
      let mensajeError = 'Error al iniciar sesión. Verifica tus credenciales.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string; message?: string } } };
        mensajeError = axiosError.response?.data?.error || 
                      axiosError.response?.data?.message || 
                      mensajeError;
      }
      
      toast.error(mensajeError);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="h-pantalla flex centrado" style={{ backgroundColor: '#f8fafc' }}>
      <div className="contenedor-pequeno">
        <div className="tarjeta animacion-entrada">
          <div className="texto-centro mb-8">
            <Link to="/" className="logo mb-6" style={{ display: 'block' }}>
              miNegocio
            </Link>
            <h1 className="titulo-2 mb-2">Iniciar Sesión</h1>
            <p className="texto-gris">Accede a tu panel de administración</p>
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
                placeholder="admin@minegocio.com"
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

            <div className="texto-centro mt-6">
              <Link to="/recuperar-password" className="texto-pequeno" style={{ color: 'var(--color-primario)' }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <div className="texto-centro mt-4">
              <span className="texto-pequeno texto-gris">
                ¿No tienes cuenta?{' '}
                <Link to="/registro" style={{ color: 'var(--color-primario)' }}>
                  Regístrate gratis
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
