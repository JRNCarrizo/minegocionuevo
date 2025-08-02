import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiService from '../services/api';

// Esquema de validación para la Etapa 2
const esquemaValidacionEtapa2 = yup.object({
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
  paisEmpresa: yup.string().max(100).optional()
});

interface FormularioEtapa2 {
  nombreEmpresa: string;
  subdominio: string;
  emailEmpresa: string;
  telefonoEmpresa: string;
  direccionEmpresa: string;
  ciudadEmpresa: string;
  codigoPostalEmpresa: string;
  paisEmpresa: string;
}



export default function ConfigurarEmpresa() {
  const [cargando, setCargando] = useState(false);
  const [subdominioVerificado, setSubdominioVerificado] = useState<boolean | null>(null);
  const [verificandoSubdominio, setVerificandoSubdominio] = useState(false);
  const [datosGoogle, setDatosGoogle] = useState<any>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<FormularioEtapa2>({
    resolver: yupResolver(esquemaValidacionEtapa2),
    mode: 'onChange',
    defaultValues: {
      nombreEmpresa: '',
      subdominio: '',
      emailEmpresa: '',
      telefonoEmpresa: '',
      direccionEmpresa: '',
      ciudadEmpresa: '',
      codigoPostalEmpresa: '',
      paisEmpresa: ''
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
        setValue('emailEmpresa', parsedData.email);
        
        // Limpiar datos de Google del localStorage
        localStorage.removeItem('googleUserData');
        
        toast.success('Datos de Google cargados automáticamente');
      } catch (error) {
        console.error('Error parsing Google data:', error);
      }
    }
  }, [setValue]);

  const subdominioActual = watch('subdominio');

  // Verificar disponibilidad del subdominio
  useEffect(() => {
    const verificarSubdominio = async () => {
      if (subdominioActual && subdominioActual.length >= 3) {
        setVerificandoSubdominio(true);
        try {
          const response = await apiService.verificarSubdominio(subdominioActual);
          setSubdominioVerificado(response.disponible);
        } catch (error) {
          setSubdominioVerificado(false);
        } finally {
          setVerificandoSubdominio(false);
        }
      } else {
        setSubdominioVerificado(null);
      }
    };

    const timeoutId = setTimeout(verificarSubdominio, 500);
    return () => clearTimeout(timeoutId);
  }, [subdominioActual]);

  const enviarFormulario = async (datos: FormularioEtapa2) => {
    if (!subdominioVerificado) {
      toast.error('El subdominio no está disponible');
      return;
    }

    setCargando(true);
    
    try {
      // Crear la empresa
      const response = await apiService.crearEmpresa({
        nombre: datos.nombreEmpresa,
        subdominio: datos.subdominio,
        email: datos.emailEmpresa,
        telefono: datos.telefonoEmpresa,
        direccion: datos.direccionEmpresa,
        ciudad: datos.ciudadEmpresa,
        codigoPostal: datos.codigoPostalEmpresa,
        pais: datos.paisEmpresa
      });

      toast.success('¡Empresa configurada exitosamente!');
      navigate('/admin/dashboard');
      
    } catch (error: any) {
      console.error('Error al configurar empresa:', error);
      
      if (error.response?.status === 409) {
        // Mostrar el mensaje específico del backend
        const mensajeError = error.response?.data?.error || 'Este recurso ya está en uso';
        toast.error(mensajeError);
      } else if (error.response?.status === 400) {
        toast.error('Datos de empresa inválidos. Por favor, verifica la información.');
      } else {
        toast.error(error.response?.data?.error || 'Error al configurar la empresa');
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
        maxWidth: '800px',
        margin: '1rem'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>2</span>
          </div>
          <h1 style={{
            fontSize: window.innerWidth < 768 ? '2rem' : '2.5rem',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 0.5rem 0'
          }}>
            Configurar Empresa
          </h1>
          <p style={{
            color: '#64748b',
            fontSize: window.innerWidth < 768 ? '1rem' : '1.1rem',
            margin: 0
          }}>
            Paso 2 de 2: Información de tu Empresa
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
              background: '#e2e8f0',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              ✓
            </div>
            <div style={{
              width: '60px',
              height: '3px',
              background: '#10b981'
            }}></div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
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
          {/* Información básica de la empresa */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '2px solid #e2e8f0'
          }}>
            <h3 style={{
              fontSize: window.innerWidth < 768 ? '1.1rem' : '1.2rem',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0 0 1rem 0'
            }}>
              Información Básica
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', 
              gap: '1rem' 
            }}>
              {/* Nombre de la empresa */}
              <div>
                <label htmlFor="nombreEmpresa" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Nombre de la Empresa *
                </label>
                <input
                  id="nombreEmpresa"
                  type="text"
                  {...register('nombreEmpresa')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: errors.nombreEmpresa ? '2px solid #ef4444' : '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease'
                  }}
                  placeholder="Mi Empresa"
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = errors.nombreEmpresa ? '#ef4444' : '#e2e8f0'}
                />
                {errors.nombreEmpresa && (
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#ef4444' }}>
                    {errors.nombreEmpresa.message}
                  </p>
                )}
              </div>


            </div>

                         {/* Subdominio */}
             <div style={{ marginTop: '1rem' }}>
               <label htmlFor="subdominio" style={{
                 display: 'block',
                 fontSize: '0.875rem',
                 fontWeight: '600',
                 color: '#374151',
                 marginBottom: '0.5rem'
               }}>
                 Subdominio *
               </label>
               <p style={{
                 fontSize: '0.75rem',
                 color: '#64748b',
                 margin: '0 0 0.5rem 0',
                 lineHeight: '1.4'
               }}>
                 Este será la URL de tu tienda online. Por ejemplo: si escribes "miempresa", tu tienda estará disponible en miempresa.negocio360.org
               </p>
               <div style={{ 
                 display: 'flex', 
                 alignItems: 'center', 
                 gap: window.innerWidth < 768 ? '0.25rem' : '0.5rem',
                 flexWrap: window.innerWidth < 768 ? 'wrap' : 'nowrap'
               }}>
                 <input
                   id="subdominio"
                   type="text"
                   {...register('subdominio')}
                   style={{
                     flex: window.innerWidth < 768 ? '0 0 calc(100% - 120px)' : 1,
                     padding: '0.75rem',
                     border: errors.subdominio ? '2px solid #ef4444' : '2px solid #e2e8f0',
                     borderRadius: '8px',
                     fontSize: '0.875rem',
                     transition: 'all 0.2s ease',
                     minWidth: window.innerWidth < 768 ? '120px' : 'auto'
                   }}
                   placeholder="miempresa"
                   onFocus={(e) => e.target.style.borderColor = '#10b981'}
                   onBlur={(e) => e.target.style.borderColor = errors.subdominio ? '#ef4444' : '#e2e8f0'}
                 />
                 <span style={{
                   color: '#64748b',
                   fontSize: window.innerWidth < 768 ? '0.75rem' : '0.875rem',
                   whiteSpace: 'nowrap',
                   flexShrink: 0
                 }}>
                   .negocio360.org
                 </span>
               </div>
              {errors.subdominio && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#ef4444' }}>
                  {errors.subdominio.message}
                </p>
              )}
              {verificandoSubdominio && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#3b82f6' }}>
                  Verificando disponibilidad...
                </p>
              )}
              {subdominioVerificado === true && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#10b981' }}>
                  ✓ Subdominio disponible
                </p>
              )}
              {subdominioVerificado === false && (
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#ef4444' }}>
                  ✗ Subdominio no disponible
                </p>
              )}
            </div>
          </div>

          {/* Información de contacto */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '2px solid #e2e8f0'
          }}>
            <h3 style={{
              fontSize: window.innerWidth < 768 ? '1.1rem' : '1.2rem',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0 0 1rem 0'
            }}>
              Información de Contacto
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', 
              gap: '1rem' 
            }}>
                             {/* Email de la empresa */}
               <div>
                 <label htmlFor="emailEmpresa" style={{
                   display: 'block',
                   fontSize: '0.875rem',
                   fontWeight: '600',
                   color: '#374151',
                   marginBottom: '0.5rem'
                 }}>
                   Email de la Empresa *
                 </label>
                 <p style={{
                   fontSize: '0.75rem',
                   color: '#64748b',
                   margin: '0 0 0.5rem 0',
                   lineHeight: '1.4'
                 }}>
                   Este email se usará para recibir notificaciones de pedidos, consultas de clientes y comunicaciones importantes de la plataforma.
                 </p>
                 <input
                   id="emailEmpresa"
                   type="email"
                   {...register('emailEmpresa')}
                   style={{
                     width: '100%',
                     padding: '0.75rem',
                     border: errors.emailEmpresa ? '2px solid #ef4444' : '2px solid #e2e8f0',
                     borderRadius: '8px',
                     fontSize: '0.875rem',
                     transition: 'all 0.2s ease'
                   }}
                   placeholder="contacto@miempresa.com"
                   onFocus={(e) => e.target.style.borderColor = '#10b981'}
                   onBlur={(e) => e.target.style.borderColor = errors.emailEmpresa ? '#ef4444' : '#e2e8f0'}
                 />
                 {errors.emailEmpresa && (
                   <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#ef4444' }}>
                     {errors.emailEmpresa.message}
                   </p>
                 )}
               </div>

              {/* Teléfono */}
              <div>
                <label htmlFor="telefonoEmpresa" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Teléfono (opcional)
                </label>
                <input
                  id="telefonoEmpresa"
                  type="tel"
                  {...register('telefonoEmpresa')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease'
                  }}
                  placeholder="+1234567890"
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '2px solid #e2e8f0'
          }}>
            <h3 style={{
              fontSize: window.innerWidth < 768 ? '1.1rem' : '1.2rem',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0 0 1rem 0'
            }}>
              Dirección (opcional)
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Dirección */}
              <div>
                <label htmlFor="direccionEmpresa" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Dirección
                </label>
                <input
                  id="direccionEmpresa"
                  type="text"
                  {...register('direccionEmpresa')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s ease'
                  }}
                  placeholder="Calle y número"
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: window.innerWidth < 768 ? '1fr' : window.innerWidth < 1024 ? '1fr 1fr' : '1fr 1fr 1fr', 
                gap: '1rem' 
              }}>
                {/* Ciudad */}
                <div>
                  <label htmlFor="ciudadEmpresa" style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Ciudad
                  </label>
                  <input
                    id="ciudadEmpresa"
                    type="text"
                    {...register('ciudadEmpresa')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease'
                    }}
                    placeholder="Ciudad"
                    onFocus={(e) => e.target.style.borderColor = '#10b981'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                {/* Código Postal */}
                <div>
                  <label htmlFor="codigoPostalEmpresa" style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Código Postal
                  </label>
                  <input
                    id="codigoPostalEmpresa"
                    type="text"
                    {...register('codigoPostalEmpresa')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease'
                    }}
                    placeholder="CP"
                    onFocus={(e) => e.target.style.borderColor = '#10b981'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                {/* País */}
                <div>
                  <label htmlFor="paisEmpresa" style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    País
                  </label>
                  <input
                    id="paisEmpresa"
                    type="text"
                    {...register('paisEmpresa')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease'
                    }}
                    placeholder="País"
                    onFocus={(e) => e.target.style.borderColor = '#10b981'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>
            </div>
          </div>



          {/* Botón de envío */}
          <button
            type="submit"
            disabled={cargando || !subdominioVerificado}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: window.innerWidth < 768 ? '0.875rem' : '1rem',
              fontSize: window.innerWidth < 768 ? '0.875rem' : '1rem',
              fontWeight: '600',
              cursor: (cargando || !subdominioVerificado) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: (cargando || !subdominioVerificado) ? 0.7 : 1
            }}
            onMouseOver={(e) => {
              if (!cargando && subdominioVerificado) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {cargando ? 'Configurando empresa...' : 'Finalizar Configuración'}
          </button>
        </form>
      </div>
    </div>
  );
} 