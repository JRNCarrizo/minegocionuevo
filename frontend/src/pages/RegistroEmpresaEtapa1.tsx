import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiService from '../services/api';

// Esquema de validación para la Etapa 1
const esquemaValidacionEtapa1 = yup.object({
  nombreAdministrador: yup.string().required('El nombre del administrador es obligatorio').max(100),
  apellidosAdministrador: yup.string().required('Los apellidos del administrador son obligatorios').max(100),
  emailAdministrador: yup.string().email('Email inválido').required('El email del administrador es obligatorio'),
  passwordAdministrador: yup.string().required('La contraseña es obligatoria').min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmarPasswordAdministrador: yup.string()
    .required('Debe confirmar la contraseña')
    .oneOf([yup.ref('passwordAdministrador')], 'Las contraseñas deben coincidir'),
  telefonoAdministrador: yup.string().max(20).optional(),
  aceptaTerminos: yup.boolean().required().oneOf([true], 'Debe aceptar los términos y condiciones'),
  aceptaMarketing: yup.boolean().required()
});

interface FormularioEtapa1 {
  nombreAdministrador: string;
  apellidosAdministrador: string;
  emailAdministrador: string;
  passwordAdministrador: string;
  confirmarPasswordAdministrador: string;
  telefonoAdministrador: string;
  aceptaTerminos: boolean;
  aceptaMarketing: boolean;
}

export default function RegistroEmpresaEtapa1() {
  const [cargando, setCargando] = useState(false);
  const [datosGoogle, setDatosGoogle] = useState<any>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<FormularioEtapa1>({
    resolver: yupResolver(esquemaValidacionEtapa1),
    mode: 'onChange',
    defaultValues: {
      nombreAdministrador: '',
      apellidosAdministrador: '',
      emailAdministrador: '',
      passwordAdministrador: '',
      confirmarPasswordAdministrador: '',
      telefonoAdministrador: '',
      aceptaTerminos: false,
      aceptaMarketing: false
    }
  });

  // Detectar datos de Google al cargar la página
  useEffect(() => {
    const googleData = localStorage.getItem('googleUserData');
    if (googleData) {
      try {
        const parsedData = JSON.parse(googleData);
        setDatosGoogle(parsedData);
        
        // Pre-llenar campos con datos de Google
        setValue('emailAdministrador', parsedData.email);
        setValue('nombreAdministrador', parsedData.name.split(' ')[0] || '');
        setValue('apellidosAdministrador', parsedData.name.split(' ').slice(1).join(' ') || '');
        
        // Limpiar datos de Google del localStorage
        localStorage.removeItem('googleUserData');
        
        toast.success('Datos de Google cargados automáticamente');
      } catch (error) {
        console.error('Error parsing Google data:', error);
      }
    }
  }, [setValue]);

  const enviarFormulario = async (datos: FormularioEtapa1) => {
    setCargando(true);
    
    try {
      // Crear solo el usuario administrador (sin empresa)
      const response = await apiService.registrarAdministrador({
        nombre: datos.nombreAdministrador,
        apellidos: datos.apellidosAdministrador,
        email: datos.emailAdministrador,
        password: datos.passwordAdministrador,
        telefono: datos.telefonoAdministrador,
        aceptaMarketing: datos.aceptaMarketing
      });

      if (response.requiereVerificacion) {
        toast.success('¡Cuenta creada exitosamente! Por favor, verifica tu email para continuar.');
        navigate(`/confirmacion-registro-admin?email=${encodeURIComponent(datos.emailAdministrador)}`);
      } else {
        toast.success('¡Cuenta creada exitosamente!');
        navigate('/configurar-empresa');
      }
      
    } catch (error: any) {
      console.error('Error en registro:', error);
      
      if (error.response?.status === 409) {
        toast.error('Este email ya está registrado. Puedes iniciar sesión directamente.');
      } else if (error.response?.status === 400) {
        toast.error('Datos de registro inválidos. Por favor, verifica la información ingresada.');
      } else {
        toast.error(error.response?.data?.error || 'Error al crear la cuenta');
      }
    } finally {
      setCargando(false);
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
        padding: window.innerWidth < 768 ? '1.5rem' : '3rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '600px',
        margin: '1rem'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>1</span>
          </div>
          <h1 style={{
            fontSize: window.innerWidth < 768 ? '2rem' : '2.5rem',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 0.5rem 0'
          }}>
            Crear Cuenta
          </h1>
          <p style={{
            color: '#64748b',
            fontSize: window.innerWidth < 768 ? '1rem' : '1.1rem',
            margin: 0
          }}>
            Paso 1 de 2: Información del Administrador
          </p>
        </div>

        {/* Indicador de progreso */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              1
            </div>
            <div style={{
              width: '60px',
              height: '3px',
              background: '#e2e8f0'
            }}></div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#e2e8f0',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              2
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(enviarFormulario)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Campos del formulario */}
                      <div style={{ 
              display: 'grid', 
              gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', 
              gap: '1rem' 
            }}>
            {/* Nombre */}
            <div>
              <label htmlFor="nombreAdministrador" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Nombre *
              </label>
              <input
                id="nombreAdministrador"
                type="text"
                {...register('nombreAdministrador')}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: errors.nombreAdministrador ? '2px solid #ef4444' : '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease'
                }}
                placeholder="Tu nombre"
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = errors.nombreAdministrador ? '#ef4444' : '#e2e8f0'}
              />
              {errors.nombreAdministrador && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#ef4444' }}>
                  {errors.nombreAdministrador.message}
                </p>
              )}
            </div>

            {/* Apellidos */}
            <div>
              <label htmlFor="apellidosAdministrador" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Apellidos *
              </label>
              <input
                id="apellidosAdministrador"
                type="text"
                {...register('apellidosAdministrador')}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: errors.apellidosAdministrador ? '2px solid #ef4444' : '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease'
                }}
                placeholder="Tus apellidos"
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = errors.apellidosAdministrador ? '#ef4444' : '#e2e8f0'}
              />
              {errors.apellidosAdministrador && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#ef4444' }}>
                  {errors.apellidosAdministrador.message}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="emailAdministrador" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Email *
            </label>
            <input
              id="emailAdministrador"
              type="email"
              {...register('emailAdministrador')}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: errors.emailAdministrador ? '2px solid #ef4444' : '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease'
              }}
              placeholder="tu@email.com"
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = errors.emailAdministrador ? '#ef4444' : '#e2e8f0'}
            />
            {errors.emailAdministrador && (
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#ef4444' }}>
                {errors.emailAdministrador.message}
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label htmlFor="telefonoAdministrador" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Teléfono (opcional)
            </label>
            <input
              id="telefonoAdministrador"
              type="tel"
              {...register('telefonoAdministrador')}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease'
              }}
              placeholder="+1234567890"
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Contraseña */}
          <div>
            <label htmlFor="passwordAdministrador" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Contraseña *
            </label>
            <input
              id="passwordAdministrador"
              type="password"
              {...register('passwordAdministrador')}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: errors.passwordAdministrador ? '2px solid #ef4444' : '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease'
              }}
              placeholder="Mínimo 6 caracteres"
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = errors.passwordAdministrador ? '#ef4444' : '#e2e8f0'}
            />
            {errors.passwordAdministrador && (
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#ef4444' }}>
                {errors.passwordAdministrador.message}
              </p>
            )}
          </div>

          {/* Confirmar Contraseña */}
          <div>
            <label htmlFor="confirmarPasswordAdministrador" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Confirmar Contraseña *
            </label>
            <input
              id="confirmarPasswordAdministrador"
              type="password"
              {...register('confirmarPasswordAdministrador')}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: errors.confirmarPasswordAdministrador ? '2px solid #ef4444' : '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease'
              }}
              placeholder="Confirma tu contraseña"
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = errors.confirmarPasswordAdministrador ? '#ef4444' : '#e2e8f0'}
            />
            {errors.confirmarPasswordAdministrador && (
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#ef4444' }}>
                {errors.confirmarPasswordAdministrador.message}
              </p>
            )}
          </div>

          {/* Checkboxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                {...register('aceptaTerminos')}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                Acepto los <Link to="/terminos" style={{ color: '#667eea', textDecoration: 'none' }}>términos y condiciones</Link> *
              </span>
            </label>
            {errors.aceptaTerminos && (
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#ef4444' }}>
                {errors.aceptaTerminos.message}
              </p>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                {...register('aceptaMarketing')}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                Acepto recibir comunicaciones de marketing y novedades
              </span>
            </label>
          </div>

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={cargando}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: window.innerWidth < 768 ? '0.875rem' : '1rem',
              fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem',
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
            {cargando ? 'Creando cuenta...' : 'Continuar al Paso 2'}
          </button>

          {/* Enlace al login */}
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              ¿Ya tienes una cuenta?{' '}
              <Link
                to="/login"
                style={{
                  color: '#667eea',
                  textDecoration: 'none',
                  fontWeight: '600'
                }}
                onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                Iniciar sesión
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 