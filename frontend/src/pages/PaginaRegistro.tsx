import { useState, useEffect } from 'react';
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
  direccionEmpresa: yup.string().max(200).optional(),
  ciudadEmpresa: yup.string().max(100).optional(),
  codigoPostalEmpresa: yup.string().max(20).optional(),
  paisEmpresa: yup.string().max(100).optional(),
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

export default function PaginaRegistro() {
  const [cargando, setCargando] = useState(false);
  const [subdominioVerificado, setSubdominioVerificado] = useState<boolean | null>(null);
  const [verificandoSubdominio, setVerificandoSubdominio] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [datosGoogle, setDatosGoogle] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    watch,
    setValue
  } = useForm<RegistroEmpresaDTO>({
    resolver: yupResolver(esquemaValidacion),
    mode: 'onChange',
    defaultValues: {
      nombreEmpresa: '',
      subdominio: '',
      emailEmpresa: '',
      telefonoEmpresa: '',
      direccionEmpresa: '',
      ciudadEmpresa: '',
      codigoPostalEmpresa: '',
      paisEmpresa: '',
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

  const subdominioActual = watch('subdominio');

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

  // Manejar cambios en el subdominio
  const manejarCambioSubdominio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');
    setValue('subdominio', valor);
  };
    
  useEffect(() => {
    if (subdominioActual) {
      // Verificar después de un pequeño retraso para evitar muchas llamadas
      const timeoutId = setTimeout(() => {
        verificarSubdominio(subdominioActual);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      setSubdominioVerificado(null);
    }
  }, [subdominioActual]);

  const limpiarCampoEmail = (e: React.FocusEvent<HTMLInputElement>) => {
    // Limpiar el campo cuando se hace foco en él
    if (e.target.value && e.target.value.includes('@')) {
      // Si ya tiene un email válido, no hacer nada
      return;
    }
    // Si no tiene un email válido, limpiar el campo
    e.target.value = '';
  };

  const enviarFormulario = async (datos: RegistroEmpresaDTO) => {
    if (subdominioVerificado === false) {
      toast.error('El subdominio no está disponible');
      return;
    }

    setCargando(true);
    try {
      const respuesta = await apiService.registrarEmpresa(datos);
      setRegistroExitoso(true);
      toast.success(respuesta.mensaje || '¡Registro exitoso!');
    } catch (error: any) {
      console.error('Error en el registro:', error);
      const mensajeError = error.response?.data?.mensaje || 'Error al registrar la empresa. Por favor, inténtelo de nuevo.';
      toast.error(mensajeError);
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
              Tu empresa ha sido registrada correctamente. Se ha enviado un email de verificación a tu dirección de correo.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-blue-800 font-semibold mb-2">📧 Verifica tu email</h3>
              <p className="text-blue-700 text-sm">
                Para activar tu cuenta y comenzar a usar MiNegocio, debes verificar tu email haciendo clic en el enlace que se envió a tu bandeja de entrada.
              </p>
            </div>
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
    <div className="h-pantalla-minimo pagina-con-navbar" style={{ backgroundColor: '#f8fafc' }}>
      {/* Navegación */}
      <nav className="navbar" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid var(--color-borde)'
      }}>
        <div className="contenedor">
          <div className="navbar-contenido">
            <Link to="/" className="logo">
              MiNegocio
            </Link>
            <Link to="/login" className="boton boton-secundario">
              ¿Ya tienes cuenta?
            </Link>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <div className="contenedor" style={{ paddingTop: '5rem', paddingBottom: '2rem' }}>
        <div className="contenedor-medio">
          <div className="texto-centro mb-8">
            <h1 className="titulo-2 mb-4">Crea tu Cuenta</h1>
            {datosGoogle && (
              <div style={{
                background: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '2rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuando con Google
              </div>
            )}
            <p className="texto-grande texto-gris">
              Empieza gratis y hace crecer tu negocio con todas las herramientas que necesitas
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
                  <p className="texto-pequeno texto-gris mb-2">
                    Será la URL de tu tienda online
                  </p>
                  <div className="flex items-centro">
                    <input
                      type="text"
                      id="subdominio"
                      className={`campo ${errors.subdominio ? 'campo-error' : ''}`}
                      placeholder="mi-negocio"
                      {...register('subdominio', { onChange: manejarCambioSubdominio })}
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
                      .negocio360.org
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
                    type="text"
                    id="emailEmpresa"
                    className={`campo ${errors.emailEmpresa ? 'campo-error' : ''}`}
                    placeholder="contacto@minegocio.com"
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-lpignore="true"
                    data-form-type="other"
                    onFocus={limpiarCampoEmail}
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

                <div className="mb-4">
                  <p className="texto-pequeno texto-gris">
                    📍 <strong>Información de ubicación (opcional):</strong> Si tienes una tienda física, completa estos datos. Si solo tienes tienda online, puedes dejarlos vacíos.
                  </p>
                </div>

                <div className="grupo-campo">
                  <label htmlFor="direccionEmpresa" className="etiqueta">
                    Dirección de la Empresa
                  </label>
                  <input
                    type="text"
                    id="direccionEmpresa"
                    className={`campo ${errors.direccionEmpresa ? 'campo-error' : ''}`}
                    placeholder="Calle Principal, 123"
                    {...register('direccionEmpresa')}
                  />
                  {errors.direccionEmpresa && (
                    <p className="mensaje-error">{errors.direccionEmpresa.message}</p>
                  )}
                </div>

                <div className="grid grid-3">
                  <div className="grupo-campo">
                    <label htmlFor="ciudadEmpresa" className="etiqueta">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      id="ciudadEmpresa"
                      className={`campo ${errors.ciudadEmpresa ? 'campo-error' : ''}`}
                      placeholder="Madrid"
                      {...register('ciudadEmpresa')}
                    />
                    {errors.ciudadEmpresa && (
                      <p className="mensaje-error">{errors.ciudadEmpresa.message}</p>
                    )}
                  </div>

                  <div className="grupo-campo">
                    <label htmlFor="codigoPostalEmpresa" className="etiqueta">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      id="codigoPostalEmpresa"
                      className={`campo ${errors.codigoPostalEmpresa ? 'campo-error' : ''}`}
                      placeholder="28001"
                      {...register('codigoPostalEmpresa')}
                    />
                    {errors.codigoPostalEmpresa && (
                      <p className="mensaje-error">{errors.codigoPostalEmpresa.message}</p>
                    )}
                  </div>

                  <div className="grupo-campo">
                    <label htmlFor="paisEmpresa" className="etiqueta">
                      País
                    </label>
                    <input
                      type="text"
                      id="paisEmpresa"
                      className={`campo ${errors.paisEmpresa ? 'campo-error' : ''}`}
                      placeholder="España"
                      {...register('paisEmpresa')}
                    />
                    {errors.paisEmpresa && (
                      <p className="mensaje-error">{errors.paisEmpresa.message}</p>
                    )}
                  </div>
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
                      Nombre/s *
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
                      Apellido/s *
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
                    type="text"
                    id="emailAdministrador"
                    className={`campo ${errors.emailAdministrador ? 'campo-error' : ''}`}
                    placeholder="admin@minegocio.com"
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-lpignore="true"
                    data-form-type="other"
                    onFocus={limpiarCampoEmail}
                    {...register('emailAdministrador')}
                  />
                  {errors.emailAdministrador && (
                    <p className="mensaje-error">{errors.emailAdministrador.message}</p>
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
                  <label htmlFor="confirmarPasswordAdministrador" className="etiqueta">
                    Confirmar Contraseña *
                  </label>
                  <input
                    type="password"
                    id="confirmarPasswordAdministrador"
                    className={`campo ${errors.confirmarPasswordAdministrador ? 'campo-error' : ''}`}
                    placeholder="Repite la contraseña"
                    {...register('confirmarPasswordAdministrador')}
                  />
                  {errors.confirmarPasswordAdministrador && (
                    <p className="mensaje-error">{errors.confirmarPasswordAdministrador.message}</p>
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
