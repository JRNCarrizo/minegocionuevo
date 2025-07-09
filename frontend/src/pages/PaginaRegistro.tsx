import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { RegistroEmpresaDTO } from '../types';
import apiService from '../services/api';

// Esquema de validación
const esquemaValidacion: yup.ObjectSchema<RegistroEmpresaDTO> = yup.object({
  nombreEmpresa: yup.string().required('El nombre de la empresa es obligatorio').max(100),
  subdominio: yup
    .string()
    .required('El subdominio es obligatorio')
    .min(3, 'El subdominio debe tener al menos 3 caracteres')
    .max(50, 'El subdominio no puede exceder 50 caracteres')
    .matches(/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/, 'El subdominio solo puede contener letras, números y guiones'),
  emailEmpresa: yup.string().email('Email inválido').required('El email de la empresa es obligatorio'),
  telefonoEmpresa: yup.string().max(20).optional(),
  descripcionEmpresa: yup.string().max(500).optional(),
  nombreAdministrador: yup.string().required('El nombre del administrador es obligatorio').max(100),
  apellidosAdministrador: yup.string().required('Los apellidos del administrador son obligatorios').max(100),
  emailAdministrador: yup.string().email('Email inválido').required('El email del administrador es obligatorio'),
  passwordAdministrador: yup.string().required('La contraseña es obligatoria').min(6, 'La contraseña debe tener al menos 6 caracteres'),
  telefonoAdministrador: yup.string().max(20).optional(),
  aceptaTerminos: yup.boolean().required().oneOf([true], 'Debe aceptar los términos y condiciones'),
  aceptaMarketing: yup.boolean().required()
});

export default function PaginaRegistro() {
  const [cargando, setCargando] = useState(false);
  const [subdominioVerificado, setSubdominioVerificado] = useState<boolean | null>(null);
  const [verificandoSubdominio, setVerificandoSubdominio] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors
  } = useForm<RegistroEmpresaDTO>({
    resolver: yupResolver(esquemaValidacion),
    mode: 'onChange',
    defaultValues: {
      nombreEmpresa: '',
      subdominio: '',
      emailEmpresa: '',
      telefonoEmpresa: '',
      descripcionEmpresa: '',
      nombreAdministrador: '',
      apellidosAdministrador: '',
      emailAdministrador: '',
      passwordAdministrador: '',
      telefonoAdministrador: '',
      aceptaTerminos: false,
      aceptaMarketing: false
    }
  });

  // Verificar disponibilidad del subdominio
  const verificarSubdominio = async (valor: string) => {
    if (!valor || valor.length < 3) {
      setSubdominioVerificado(null);
      return;
    }

    setVerificandoSubdominio(true);
    try {
      const response = await apiService.verificarSubdominio(valor);
      const disponible = response.disponible;
      setSubdominioVerificado(disponible);
      if (!disponible) {
        setError('subdominio', { message: 'Este subdominio ya está en uso' });
      } else {
        clearErrors('subdominio');
      }
    } catch (error) {
      console.error('Error verificando subdominio:', error);
      setSubdominioVerificado(null);
    } finally {
      setVerificandoSubdominio(false);
    }
  };

  const manejarCambioSubdominio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');
    e.target.value = valor;
    
    // Verificar después de un pequeño retraso
    setTimeout(() => verificarSubdominio(valor), 500);
  };

  const enviarFormulario = async (datos: RegistroEmpresaDTO) => {
    if (subdominioVerificado === false) {
      toast.error('El subdominio no está disponible');
      return;
    }

    setCargando(true);
    try {
      await apiService.registrarEmpresa(datos);
      setRegistroExitoso(true);
      toast.success('¡Empresa registrada exitosamente!');
    } catch (error) {
      console.error('Error en el registro:', error);
      toast.error('Error al registrar la empresa. Por favor, inténtelo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  if (registroExitoso) {
    return (
      <div className="h-pantalla flex centrado" style={{ backgroundColor: '#f8fafc' }}>
        <div className="contenedor-pequeno">
          <div className="tarjeta texto-centro animacion-entrada">
            <div style={{
              width: '4rem',
              height: '4rem',
              backgroundColor: 'var(--color-exito)',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              color: 'white'
            }}>
              ✓
            </div>
            <h1 className="titulo-2 mb-4">¡Registro Exitoso!</h1>
            <p className="texto-medio texto-gris mb-6">
              Tu empresa ha sido registrada correctamente. En breve recibirás un email con las instrucciones para activar tu cuenta.
            </p>
            <div className="flex flex-columna" style={{ gap: '1rem' }}>
              <Link to="/login" className="boton boton-primario">
                Ir al Panel de Administración
              </Link>
              <Link to="/" className="boton boton-secundario">
                Volver al Inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-pantalla-minimo" style={{ backgroundColor: '#f8fafc' }}>
      {/* Navegación */}
      <nav className="navbar">
        <div className="contenedor">
          <div className="navbar-contenido">
            <Link to="/" className="logo">
              miNegocio
            </Link>
            <Link to="/login" className="boton boton-secundario">
              ¿Ya tienes cuenta?
            </Link>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <div className="contenedor py-8">
        <div className="contenedor-medio">
          <div className="texto-centro mb-8">
            <h1 className="titulo-2 mb-4">Crea tu tienda online</h1>
            <p className="texto-grande texto-gris">
              Empieza gratis y haz crecer tu negocio con todas las herramientas que necesitas
            </p>
          </div>

          <div className="tarjeta animacion-entrada">
            <form onSubmit={handleSubmit(enviarFormulario)}>
              {/* Información de la empresa */}
              <div className="mb-8">
                <h2 className="titulo-3 mb-6" style={{ color: 'var(--color-primario)' }}>
                  📋 Información de la Empresa
                </h2>

                <div className="grupo-campo">
                  <label htmlFor="nombreEmpresa" className="etiqueta">
                    Nombre de la Empresa *
                  </label>
                  <input
                    type="text"
                    id="nombreEmpresa"
                    className={`campo ${errors.nombreEmpresa ? 'campo-error' : ''}`}
                    placeholder="Mi Negocio S.L."
                    {...register('nombreEmpresa')}
                  />
                  {errors.nombreEmpresa && (
                    <p className="mensaje-error">{errors.nombreEmpresa.message}</p>
                  )}
                </div>

                <div className="grupo-campo">
                  <label htmlFor="subdominio" className="etiqueta">
                    Subdominio *
                  </label>
                  <div className="flex items-centro">
                    <input
                      type="text"
                      id="subdominio"
                      className={`campo ${errors.subdominio ? 'campo-error' : ''}`}
                      placeholder="mi-negocio"
                      {...register('subdominio')}
                      onChange={manejarCambioSubdominio}
                      style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                    />
                    <div style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: '#f1f5f9',
                      border: '2px solid var(--color-borde)',
                      borderLeft: 'none',
                      borderTopRightRadius: 'var(--radio-borde)',
                      borderBottomRightRadius: 'var(--radio-borde)',
                      color: 'var(--color-texto-secundario)'
                    }}>
                      .minegocio.com
                    </div>
                  </div>
                  
                  {verificandoSubdominio && (
                    <p className="texto-pequeno mt-2" style={{ color: 'var(--color-advertencia)' }}>
                      🔄 Verificando disponibilidad...
                    </p>
                  )}
                  
                  {subdominioVerificado === true && (
                    <p className="texto-pequeno mt-2" style={{ color: 'var(--color-exito)' }}>
                      ✓ Subdominio disponible
                    </p>
                  )}
                  
                  {subdominioVerificado === false && (
                    <p className="texto-pequeno mt-2" style={{ color: 'var(--color-error)' }}>
                      ✗ Subdominio no disponible
                    </p>
                  )}
                  
                  {errors.subdominio && (
                    <p className="mensaje-error">{errors.subdominio.message}</p>
                  )}
                </div>

                <div className="grupo-campo">
                  <label htmlFor="emailEmpresa" className="etiqueta">
                    Email de la Empresa *
                  </label>
                  <input
                    type="email"
                    id="emailEmpresa"
                    className={`campo ${errors.emailEmpresa ? 'campo-error' : ''}`}
                    placeholder="contacto@minegocio.com"
                    {...register('emailEmpresa')}
                  />
                  {errors.emailEmpresa && (
                    <p className="mensaje-error">{errors.emailEmpresa.message}</p>
                  )}
                </div>

                <div className="grupo-campo">
                  <label htmlFor="telefonoEmpresa" className="etiqueta">
                    Teléfono de la Empresa
                  </label>
                  <input
                    type="tel"
                    id="telefonoEmpresa"
                    className={`campo ${errors.telefonoEmpresa ? 'campo-error' : ''}`}
                    placeholder="+34 123 456 789"
                    {...register('telefonoEmpresa')}
                  />
                  {errors.telefonoEmpresa && (
                    <p className="mensaje-error">{errors.telefonoEmpresa.message}</p>
                  )}
                </div>

                <div className="grupo-campo">
                  <label htmlFor="descripcionEmpresa" className="etiqueta">
                    Descripción de la Empresa
                  </label>
                  <textarea
                    id="descripcionEmpresa"
                    className={`campo ${errors.descripcionEmpresa ? 'campo-error' : ''}`}
                    placeholder="Descripción breve de tu empresa y sus productos/servicios"
                    rows={3}
                    {...register('descripcionEmpresa')}
                  />
                  {errors.descripcionEmpresa && (
                    <p className="mensaje-error">{errors.descripcionEmpresa.message}</p>
                  )}
                </div>
              </div>

              {/* Información del administrador */}
              <div className="mb-8">
                <h2 className="titulo-3 mb-6" style={{ color: 'var(--color-primario)' }}>
                  👤 Información del Administrador
                </h2>

                <div className="grid grid-2">
                  <div className="grupo-campo">
                    <label htmlFor="nombreAdministrador" className="etiqueta">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      id="nombreAdministrador"
                      className={`campo ${errors.nombreAdministrador ? 'campo-error' : ''}`}
                      placeholder="Juan"
                      {...register('nombreAdministrador')}
                    />
                    {errors.nombreAdministrador && (
                      <p className="mensaje-error">{errors.nombreAdministrador.message}</p>
                    )}
                  </div>

                  <div className="grupo-campo">
                    <label htmlFor="apellidosAdministrador" className="etiqueta">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      id="apellidosAdministrador"
                      className={`campo ${errors.apellidosAdministrador ? 'campo-error' : ''}`}
                      placeholder="Pérez García"
                      {...register('apellidosAdministrador')}
                    />
                    {errors.apellidosAdministrador && (
                      <p className="mensaje-error">{errors.apellidosAdministrador.message}</p>
                    )}
                  </div>
                </div>

                <div className="grupo-campo">
                  <label htmlFor="emailAdministrador" className="etiqueta">
                    Email del Administrador *
                  </label>
                  <input
                    type="email"
                    id="emailAdministrador"
                    className={`campo ${errors.emailAdministrador ? 'campo-error' : ''}`}
                    placeholder="admin@minegocio.com"
                    {...register('emailAdministrador')}
                  />
                  {errors.emailAdministrador && (
                    <p className="mensaje-error">{errors.emailAdministrador.message}</p>
                  )}
                </div>

                <div className="grupo-campo">
                  <label htmlFor="passwordAdministrador" className="etiqueta">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    id="passwordAdministrador"
                    className={`campo ${errors.passwordAdministrador ? 'campo-error' : ''}`}
                    placeholder="Mínimo 6 caracteres"
                    {...register('passwordAdministrador')}
                  />
                  {errors.passwordAdministrador && (
                    <p className="mensaje-error">{errors.passwordAdministrador.message}</p>
                  )}
                </div>

                <div className="grupo-campo">
                  <label htmlFor="telefonoAdministrador" className="etiqueta">
                    Teléfono del Administrador
                  </label>
                  <input
                    type="tel"
                    id="telefonoAdministrador"
                    className={`campo ${errors.telefonoAdministrador ? 'campo-error' : ''}`}
                    placeholder="+34 123 456 789"
                    {...register('telefonoAdministrador')}
                  />
                  {errors.telefonoAdministrador && (
                    <p className="mensaje-error">{errors.telefonoAdministrador.message}</p>
                  )}
                </div>
              </div>

              {/* Términos y condiciones */}
              <div className="mb-8">
                <h2 className="titulo-3 mb-6" style={{ color: 'var(--color-primario)' }}>
                  📄 Términos y Condiciones
                </h2>

                <div className="grupo-campo">
                  <label className="flex items-centro" style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      style={{ marginRight: '0.75rem' }}
                      {...register('aceptaTerminos')}
                    />
                    <span className="texto-medio">
                      Acepto los{' '}
                      <Link to="/terminos" style={{ color: 'var(--color-primario)' }}>
                        términos y condiciones
                      </Link>{' '}
                      y la{' '}
                      <Link to="/privacidad" style={{ color: 'var(--color-primario)' }}>
                        política de privacidad
                      </Link>
                      *
                    </span>
                  </label>
                  {errors.aceptaTerminos && (
                    <p className="mensaje-error">{errors.aceptaTerminos.message}</p>
                  )}
                </div>

                <div className="grupo-campo">
                  <label className="flex items-centro" style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      style={{ marginRight: '0.75rem' }}
                      {...register('aceptaMarketing')}
                    />
                    <span className="texto-medio">
                      Acepto recibir comunicaciones comerciales y promociones por email
                    </span>
                  </label>
                </div>
              </div>

              {/* Botón de envío */}
              <button
                type="submit"
                disabled={cargando || subdominioVerificado === false}
                className={`boton boton-primario boton-completo boton-grande ${
                  cargando || subdominioVerificado === false ? 'opacidad-50 cursor-no-permitido' : ''
                }`}
              >
                {cargando ? (
                  <span className="flex items-centro centrado">
                    <span className="cargando" style={{ marginRight: '0.5rem' }}></span>
                    Creando tu tienda...
                  </span>
                ) : (
                  'Crear mi tienda gratis 🚀'
                )}
              </button>

              <p className="texto-centro texto-pequeno texto-gris mt-4">
                Al crear tu cuenta, aceptas nuestros términos de uso y política de privacidad.
                Puedes cancelar en cualquier momento.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
