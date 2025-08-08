import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useSubdominio } from '../hooks/useSubdominio';
import NavbarCliente from '../components/NavbarCliente';
import api from '../services/api';
import LimitService from '../services/limitService';

// Esquema de validación con Yup
const esquemaValidacion = yup.object({
  nombre: yup.string().required('El nombre es requerido').min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellidos: yup.string().required('Los apellidos son requeridos').min(2, 'Los apellidos deben tener al menos 2 caracteres'),
  email: yup.string().required('El email es requerido').email('Ingrese un email válido'),
  telefono: yup.string().required('El teléfono es requerido').min(8, 'El teléfono debe tener al menos 8 caracteres'),
  contraseña: yup.string().required('La contraseña es requerida').min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmarContraseña: yup.string()
    .required('Confirme la contraseña')
    .oneOf([yup.ref('contraseña')], 'Las contraseñas no coinciden')
});

interface FormularioRegistro {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  contraseña: string;
  confirmarContraseña: string;
}

const RegistroCliente: React.FC = () => {
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();
  const { empresa, subdominio, cargando: cargandoEmpresa } = useSubdominio();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormularioRegistro>({
    resolver: yupResolver(esquemaValidacion)
  });

  const enviarFormulario = async (datos: FormularioRegistro) => {
    setCargando(true);
    
    try {
      // Validar que tenemos un subdominio válido
      if (!subdominio) {
        toast.error('Error: No se pudo determinar la tienda');
        return;
      }

      // Verificar límites antes de crear el cliente
      console.log('🔍 Verificando límites antes de crear cliente...');
      const canProceed = await LimitService.checkLimitsBeforeAction('addClient');
      
      if (!canProceed) {
        console.log('❌ Límite de clientes alcanzado');
        setCargando(false);
        return;
      }

      console.log('✅ Límites verificados, procediendo a crear cliente...');

      // Crear el cliente usando el método del servicio
      const datosCliente = {
        nombre: datos.nombre,
        apellidos: datos.apellidos,
        email: datos.email,
        telefono: datos.telefono,
        password: datos.contraseña
      };
      
      const response = await api.registrarCliente(subdominio, datosCliente);

      if (response.requiereVerificacion) {
        toast.success('¡Cuenta creada exitosamente! Por favor, verifica tu email para activar tu cuenta.');
        reset();
        navigate(`/confirmacion-registro?email=${encodeURIComponent(datos.email)}`);
      } else {
        toast.success('¡Cuenta creada exitosamente!');
        reset();
        navigate('/login');
      }
      
    } catch (error: unknown) {
      console.error('Error en registro:', error);
      
      // Manejar errores específicos
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        
        if (axiosError.response?.status === 409) {
          const errorData = axiosError.response.data;
          
          if (errorData.emailNoVerificado) {
            toast.error('Este email ya está registrado pero no ha sido verificado. Revisa tu correo electrónico o solicita un nuevo enlace de verificación.');
          } else {
            toast.error('Este email ya está registrado y verificado. Puedes iniciar sesión directamente.');
          }
        } else if (axiosError.response?.status === 400) {
          toast.error('Datos de registro inválidos. Por favor, verifica la información ingresada.');
        } else if (axiosError.response?.status === 404) {
          toast.error('Tienda no encontrada.');
        } else {
          toast.error(axiosError.response?.data?.error || 'Error al crear la cuenta');
        }
      } else {
        const mensaje = error instanceof Error ? error.message : 'Error al crear la cuenta';
        toast.error(mensaje);
      }
    } finally {
      setCargando(false);
    }
  };

  if (cargandoEmpresa) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p>Cargando tienda...</p>
        </div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Tienda no encontrada</h1>
          <p style={{ marginBottom: '2rem', opacity: 0.9 }}>
            No se pudo encontrar la tienda solicitada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
    }}>
      {/* Navbar del cliente */}
      <NavbarCliente
        empresa={empresa}
        clienteInfo={null}
        onCerrarSesion={() => {}}
        onShowCart={() => {}}
      />

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
        minHeight: 'calc(100vh - 70px)'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '500px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#1e293b',
              margin: '0 0 0.5rem 0'
            }}>
              Crear Cuenta
            </h2>
            <p style={{
              color: '#64748b',
              fontSize: '1rem',
              margin: 0
            }}>
              Únete a {empresa.nombre}
            </p>
          </div>

          <form onSubmit={handleSubmit(enviarFormulario)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Campo Nombre */}
            <div>
              <label htmlFor="nombre" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Nombre
              </label>
              <input
                id="nombre"
                type="text"
                autoComplete="given-name"
                {...register('nombre')}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: errors.nombre ? '2px solid #ef4444' : '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease'
                }}
                placeholder="Ingrese su nombre"
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = errors.nombre ? '#ef4444' : '#e2e8f0'}
              />
              {errors.nombre && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#ef4444' }}>
                  {errors.nombre.message}
                </p>
              )}
            </div>

            {/* Campo Apellidos */}
            <div>
              <label htmlFor="apellidos" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Apellidos
              </label>
              <input
                id="apellidos"
                type="text"
                autoComplete="family-name"
                {...register('apellidos')}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: errors.apellidos ? '2px solid #ef4444' : '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease'
                }}
                placeholder="Ingrese sus apellidos"
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = errors.apellidos ? '#ef4444' : '#e2e8f0'}
              />
              {errors.apellidos && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#ef4444' }}>
                  {errors.apellidos.message}
                </p>
              )}
            </div>

            {/* Campo Email */}
            <div>
              <label htmlFor="email" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: errors.email ? '2px solid #ef4444' : '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease'
                }}
                placeholder="correo@ejemplo.com"
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = errors.email ? '#ef4444' : '#e2e8f0'}
              />
              {errors.email && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#ef4444' }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Campo Teléfono */}
            <div>
              <label htmlFor="telefono" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Teléfono
              </label>
              <input
                id="telefono"
                type="tel"
                autoComplete="tel"
                {...register('telefono')}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: errors.telefono ? '2px solid #ef4444' : '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease'
                }}
                placeholder="1234567890"
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = errors.telefono ? '#ef4444' : '#e2e8f0'}
              />
              {errors.telefono && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#ef4444' }}>
                  {errors.telefono.message}
                </p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div>
              <label htmlFor="contraseña" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Contraseña
              </label>
              <input
                id="contraseña"
                type="password"
                autoComplete="new-password"
                {...register('contraseña')}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: errors.contraseña ? '2px solid #ef4444' : '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease'
                }}
                placeholder="Mínimo 6 caracteres"
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = errors.contraseña ? '#ef4444' : '#e2e8f0'}
              />
              {errors.contraseña && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#ef4444' }}>
                  {errors.contraseña.message}
                </p>
              )}
            </div>

            {/* Campo Confirmar Contraseña */}
            <div>
              <label htmlFor="confirmarContraseña" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Confirmar Contraseña
              </label>
              <input
                id="confirmarContraseña"
                type="password"
                autoComplete="new-password"
                {...register('confirmarContraseña')}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: errors.confirmarContraseña ? '2px solid #ef4444' : '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease'
                }}
                placeholder="Confirme su contraseña"
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = errors.confirmarContraseña ? '#ef4444' : '#e2e8f0'}
              />
              {errors.confirmarContraseña && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#ef4444' }}>
                  {errors.confirmarContraseña.message}
                </p>
              )}
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={cargando}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.875rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: cargando ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: cargando ? 0.7 : 1
              }}
              onMouseOver={(e) => {
                if (!cargando) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {cargando ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>

            {/* Enlace al login */}
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                ¿Ya tienes una cuenta?{' '}
                <a
                  href="/login"
                  style={{
                    color: '#3b82f6',
                    textDecoration: 'none',
                    fontWeight: '600'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  Iniciar sesión
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistroCliente;
