import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import NavbarAdmin from '../../components/NavbarAdmin';
import type { Empresa } from '../../types';

interface ConfiguracionEmpresa {
  nombre: string;
  descripcion: string;
  subdominio: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
  pais: string;
  logo: File | null;
  colorPrimario: string;
  colorSecundario: string;
  colorAcento: string;
  colorFondo: string;
  colorTexto: string;
  moneda: string;
  idioma: string;
  notificacionesPedidos: boolean;
  notificacionesStock: boolean;
  stockMinimo: number;
  // Configuración del catálogo
  mostrarPrecios: boolean;
  mostrarStock: boolean;
  permitirResenas: boolean;
  mostrarCategorias: boolean;
  // Redes sociales
  instagramUrl: string;
  facebookUrl: string;
}

// Componente para el selector de color mejorado
const ColorPicker = ({ 
  label, 
  value, 
  onChange, 
  name,
  preview = true 
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
  preview?: boolean;
}) => (
  <div className="grupo-campo">
    <label className="etiqueta">{label}</label>
    <div className="flex items-centro" style={{ gap: '0.75rem' }}>
      <div className="relative">
        <input
          type="color"
          name={name}
          value={value}
          onChange={onChange}
          className="campo"
          style={{ 
            width: '3rem',
            height: '3rem',
            padding: '0',
            border: `2px solid var(--color-borde)`,
            borderRadius: 'var(--radio-borde)',
            cursor: 'pointer'
          }}
        />
      </div>
      {preview && (
        <div style={{ flex: 1 }}>
          <div 
            className="campo"
            style={{ 
              backgroundColor: value,
              color: getContrastColor(value),
              textAlign: 'center',
              fontWeight: '600',
              fontSize: '0.875rem'
            }}
          >
            {value.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  </div>
);

// Función para obtener color de contraste
const getContrastColor = (hexColor: string) => {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
};

// Componente para campo de entrada con icono
const InputField = ({ 
  icon, 
  label, 
  type = "text", 
  name, 
  value, 
  onChange, 
  required = false,
  placeholder = "",
  className = ""
}: {
  icon: string;
  label: string;
  type?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) => (
  <div className={`grupo-campo ${className}`}>
    <label className="etiqueta">
      {label} {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
    </label>
    <div className="relative">
      <div className="absolute" style={{ top: '50%', left: '0.75rem', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <span style={{ color: 'var(--color-texto-secundario)', fontSize: '1.125rem' }}>{icon}</span>
      </div>
      {type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          rows={3}
          className="campo"
          style={{ paddingLeft: '2.5rem' }}
        />
      ) : type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className="campo"
          style={{ paddingLeft: '2.5rem', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '0.75rem' }}
        >
          {name === 'moneda' && (
            <>
              <option value="ARS">Peso Argentino ($)</option>
              <option value="USD">Dólar ($)</option>
              <option value="EUR">Euro (€)</option>
              <option value="GBP">Libra (£)</option>
            </>
          )}
          {name === 'idioma' && (
            <>
              <option value="es">Español</option>
              <option value="en">Inglés</option>
              <option value="fr">Francés</option>
            </>
          )}
          {name === 'pais' && (
            <>
              <option value="Argentina">Argentina</option>
              <option value="España">España</option>
              <option value="México">México</option>
              <option value="Colombia">Colombia</option>
              <option value="Chile">Chile</option>
            </>
          )}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className="campo"
          style={{ paddingLeft: '2.5rem' }}
        />
      )}
    </div>
  </div>
);

// Componente para checkbox con mejor diseño
const CheckboxField = ({ 
  label, 
  name, 
  checked, 
  onChange,
  description = ""
}: {
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  description?: string;
}) => (
  <div className="flex items-centro" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
    <input
      type="checkbox"
      id={name}
      name={name}
      checked={checked}
      onChange={onChange}
      style={{ marginTop: '0.25rem' }}
    />
    <div style={{ flex: 1 }}>
      <label htmlFor={name} className="etiqueta" style={{ marginBottom: '0.25rem' }}>
        {label}
      </label>
      {description && (
        <p className="texto-pequeno texto-gris">{description}</p>
      )}
    </div>
  </div>
);

export default function ConfiguracionEmpresa() {
  const [configuracion, setConfiguracion] = useState<ConfiguracionEmpresa>({
    nombre: '',
    descripcion: '',
    subdominio: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    pais: 'Argentina',
    logo: null,
    colorPrimario: '#2563eb',
    colorSecundario: '#64748b',
    colorAcento: '#f59e0b',
    colorFondo: '#ffffff',
    colorTexto: '#1f2937',
    moneda: 'ARS',
    idioma: 'es',
    notificacionesPedidos: true,
    notificacionesStock: true,
    stockMinimo: 5,
    mostrarPrecios: true,
    mostrarStock: true,
    permitirResenas: true,
    mostrarCategorias: true,
    instagramUrl: '',
    facebookUrl: ''
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [verificandoSubdominio, setVerificandoSubdominio] = useState(false);
  const [subdominioDisponible, setSubdominioDisponible] = useState<boolean | null>(null);
  const [empresaNombre, setEmpresaNombre] = useState<string>('');
  const [nombreAdministrador, setNombreAdministrador] = useState<string>('');

  useEffect(() => {
    // Obtener datos del usuario logueado
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setEmpresaNombre(user.empresaNombre || '');
        setNombreAdministrador(user.nombre || '');
      } catch {}
    }
    
    cargarConfiguracion(false); // No mostrar toast al cargar la página
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/admin/login';
  };

  const cargarConfiguracion = async (mostrarToast = true) => {
    try {
      setCargando(true);
      
      console.log('Cargando configuración de la empresa del administrador...');
      
      const response = await ApiService.obtenerEmpresaAdmin();
      
      if (!response.data) {
        toast.error('No se encontraron datos de la empresa');
        return;
      }
      
      const empresa: Empresa = response.data;
      
      console.log('Datos de la empresa obtenidos:', empresa);
      
      setConfiguracion(prev => ({
        ...prev,
        nombre: empresa.nombre || '',
        descripcion: empresa.descripcion || '',
        subdominio: empresa.subdominio || '',
        email: empresa.email || '',
        telefono: empresa.telefono || '',
        colorPrimario: empresa.colorPrimario || '#2563eb',
        colorSecundario: empresa.colorSecundario || '#64748b',
        moneda: empresa.moneda || 'ARS',
              instagramUrl: empresa.instagramUrl || '',
      facebookUrl: empresa.facebookUrl || ''
      }));
      
      if (mostrarToast) {
        toast.success('Configuración cargada correctamente');
      }
    } catch (error) {
      console.error('Error al cargar la configuración:', error);
      toast.error('Error al cargar la configuración de la empresa');
    } finally {
      setCargando(false);
    }
  };

  const manejarCambio = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setConfiguracion(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setConfiguracion(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Verificar subdominio si se está cambiando
      if (name === 'subdominio' && value.trim().length >= 3) {
        verificarDisponibilidadSubdominio(value.trim());
      } else if (name === 'subdominio') {
        setSubdominioDisponible(null);
      }
    }
  }, []);

  const verificarDisponibilidadSubdominio = useCallback(async (subdominio: string) => {
    if (subdominio.length < 3) return;
    
    setVerificandoSubdominio(true);
    try {
      const response = await ApiService.verificarSubdominio(subdominio);
      setSubdominioDisponible(response.disponible);
    } catch (error) {
      console.error('Error al verificar subdominio:', error);
      setSubdominioDisponible(false);
    } finally {
      setVerificandoSubdominio(false);
    }
  }, []);

  const manejarLogo = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setConfiguracion(prev => ({
        ...prev,
        logo: e.target.files![0]
      }));
    }
  }, []);

  const validarFormulario = useCallback(() => {
    if (!configuracion.nombre.trim()) {
      toast.error('El nombre de la empresa es obligatorio');
      return false;
    }
    if (!configuracion.subdominio.trim()) {
      toast.error('El subdominio es obligatorio');
      return false;
    }
    if (configuracion.subdominio.trim().length < 3) {
      toast.error('El subdominio debe tener al menos 3 caracteres');
      return false;
    }
    if (!configuracion.subdominio.trim().match(/^[a-z0-9-]+$/)) {
      toast.error('El subdominio solo puede contener letras minúsculas, números y guiones');
      return false;
    }
    if (subdominioDisponible === false) {
      toast.error('El subdominio no está disponible');
      return false;
    }
    if (!configuracion.email.trim() || !configuracion.email.includes('@')) {
      toast.error('El email debe ser válido');
      return false;
    }
    return true;
  }, [configuracion, subdominioDisponible]);

  const guardarConfiguracion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setGuardando(true);
    
    try {
      // Primero subir el logo si se seleccionó uno
      if (configuracion.logo) {
        try {
          const logoResponse = await ApiService.subirLogoEmpresa(configuracion.logo);
          console.log('Logo subido exitosamente:', logoResponse.data?.logoUrl);
        } catch (error: any) {
          console.error('Error al subir logo:', error);
          const errorMessage = error.response?.data?.error || 'Error al subir el logo';
          toast.error(errorMessage);
          setGuardando(false);
          return;
        }
      }

      const datosEmpresa = {
        nombre: configuracion.nombre,
        descripcion: configuracion.descripcion,
        subdominio: configuracion.subdominio,
        email: configuracion.email,
        telefono: configuracion.telefono,
        colorPrimario: configuracion.colorPrimario,
        colorSecundario: configuracion.colorSecundario,
        moneda: configuracion.moneda,
        instagramUrl: configuracion.instagramUrl,
        facebookUrl: configuracion.facebookUrl,
      };
      
      console.log('Guardando configuración:', datosEmpresa);
      
      const response = await ApiService.actualizarEmpresaAdmin(datosEmpresa);
      
      if (response.data) {
        toast.success('Configuración guardada exitosamente');
        // Limpiar el logo seleccionado después de guardar
        setConfiguracion(prev => ({ ...prev, logo: null }));
        cargarConfiguracion(false); // No mostrar toast al recargar
      } else {
        toast.error('Error al guardar la configuración');
      }
    } catch (error: any) {
      console.error('Error al guardar la configuración:', error);
      
      // Manejar errores específicos del backend
      if (error.response?.status === 400) {
        // Error de validación (subdominio en uso, email duplicado, etc.)
        const errorMessage = error.response.data?.error || 'Error de validación';
        toast.error(errorMessage);
      } else if (error.response?.status === 401) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else if (error.response?.status === 404) {
        toast.error('Empresa no encontrada');
      } else {
        toast.error('Error al guardar la configuración');
      }
    } finally {
      setGuardando(false);
    }
  };

  // Preview del tema de colores
  const previewTema = useMemo(() => ({
    primario: configuracion.colorPrimario,
    secundario: configuracion.colorSecundario,
    acento: configuracion.colorAcento,
    fondo: configuracion.colorFondo,
    texto: configuracion.colorTexto
  }), [configuracion]);

  if (cargando) {
    return (
      <div className="h-pantalla-minimo" style={{ backgroundColor: 'var(--color-fondo)' }}>
        <NavbarAdmin 
          onCerrarSesion={cerrarSesion}
          empresaNombre={empresaNombre}
          nombreAdministrador={nombreAdministrador}
        />
        <div className="contenedor py-8">
          <div className="tarjeta text-center py-12">
            <div className="spinner mx-auto mb-4"></div>
            <p className="texto-gris">Cargando configuración...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-pantalla-minimo" style={{ backgroundColor: 'var(--color-fondo)' }}>
      {/* Navegación */}
      <NavbarAdmin 
        onCerrarSesion={cerrarSesion}
        empresaNombre={empresaNombre}
        nombreAdministrador={nombreAdministrador}
      />

      {/* Contenido principal */}
      <div className="contenedor py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="titulo-2 mb-2">Configuración de la Empresa</h1>
          <p className="texto-gris">Personaliza la información y apariencia de tu tienda online.</p>
        </div>

        <form onSubmit={guardarConfiguracion} className="space-y-8">
          {/* Información Básica */}
          <div className="tarjeta">
            <div className="p-6 border-bottom" style={{ borderBottom: '1px solid var(--color-borde)', backgroundColor: 'var(--color-fondo-hover)' }}>
              <div className="flex items-centro">
                <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>🏢</span>
                <h3 className="titulo-3" style={{ marginBottom: '0' }}>Información Básica</h3>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-2">
                <InputField
                  icon="🏷️"
                  label="Nombre de la Empresa"
                  name="nombre"
                  value={configuracion.nombre}
                  onChange={manejarCambio}
                  required
                  placeholder="Ingresa el nombre de tu empresa"
                />
                <div className="grupo-campo">
                  <label className="etiqueta">
                    Subdominio <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <div className="flex">
                    <div className="relative" style={{ flex: 1 }}>
                      <div className="absolute" style={{ top: '50%', left: '0.75rem', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        <span style={{ color: 'var(--color-texto-secundario)', fontSize: '1.125rem' }}>🌐</span>
                      </div>
                      <input
                        type="text"
                        name="subdominio"
                        value={configuracion.subdominio}
                        onChange={manejarCambio}
                        required
                        className="campo"
                        style={{ paddingLeft: '2.5rem', borderTopRightRadius: '0', borderBottomRightRadius: '0' }}
                        placeholder="tu-empresa"
                      />
                    </div>
                    <span className="px-3 py-2 border border-l-0" style={{ 
                      borderColor: 'var(--color-borde)', 
                      borderRadius: '0 var(--radio-borde) var(--radio-borde) 0',
                      backgroundColor: 'var(--color-fondo-hover)',
                      color: 'var(--color-texto-secundario)',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      .minegocio.com
                    </span>
                  </div>
                  {verificandoSubdominio && (
                    <p className="texto-pequeno texto-gris mt-2">Verificando disponibilidad...</p>
                  )}
                  {subdominioDisponible !== null && (
                    <p className={`texto-pequeno ${subdominioDisponible ? 'texto-verde' : 'texto-rojo'} mt-2`}>
                      {subdominioDisponible ? '✅ Subdominio disponible' : '❌ Subdominio no disponible'}
                    </p>
                  )}
                </div>
              </div>

              <InputField
                icon="📝"
                label="Descripción"
                type="textarea"
                name="descripcion"
                value={configuracion.descripcion}
                onChange={manejarCambio}
                placeholder="Describe tu negocio, productos y servicios..."
              />

              <div className="grupo-campo">
                <label className="etiqueta">Logo de la Empresa</label>
                <div className="flex items-centro" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                  <div className="relative">
                    <input
                      type="file"
                      name="logo"
                      onChange={manejarLogo}
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="logo-input"
                    />
                    <label
                      htmlFor="logo-input"
                      className="boton boton-secundario"
                      style={{ cursor: 'pointer' }}
                    >
                      📁 Seleccionar Logo
                    </label>
                  </div>
                  
                  {/* Vista previa del logo */}
                  <div className="flex items-centro" style={{ gap: '0.5rem' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      border: '2px dashed var(--color-borde)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'var(--color-fondo-hover)',
                      overflow: 'hidden'
                    }}>
                      {configuracion.logo ? (
                        <img
                          src={URL.createObjectURL(configuracion.logo)}
                          alt="Vista previa del logo"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '1.5rem', color: 'var(--color-texto-secundario)' }}>
                          🏢
                        </span>
                      )}
                    </div>
                    {configuracion.logo && (
                      <span className="texto-pequeno texto-gris">
                        ✅ {configuracion.logo.name}
                      </span>
                    )}
                  </div>
                </div>
                <p className="texto-pequeno texto-gris" style={{ marginTop: '0.5rem' }}>
                  El logo aparecerá en el navbar, la tarjeta de presentación y el login de clientes. 
                  Formatos recomendados: PNG, JPG. Tamaño máximo: 2MB.
                </p>
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="tarjeta">
            <div className="p-6 border-bottom" style={{ borderBottom: '1px solid var(--color-borde)', backgroundColor: 'var(--color-fondo-hover)' }}>
              <div className="flex items-centro">
                <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>📞</span>
                <h3 className="titulo-3" style={{ marginBottom: '0' }}>Información de Contacto</h3>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-2">
                <InputField
                  icon="📧"
                  label="Email de Contacto"
                  type="email"
                  name="email"
                  value={configuracion.email}
                  onChange={manejarCambio}
                  required
                  placeholder="contacto@tuempresa.com"
                />
                <InputField
                  icon="📱"
                  label="Teléfono"
                  type="tel"
                  name="telefono"
                  value={configuracion.telefono}
                  onChange={manejarCambio}
                  placeholder="+54 11 1234-5678"
                />
              </div>

              <InputField
                icon="📍"
                label="Dirección"
                name="direccion"
                value={configuracion.direccion}
                onChange={manejarCambio}
                placeholder="Av. Corrientes 1234"
              />

              <div className="grid grid-3">
                <InputField
                  icon="🏙️"
                  label="Ciudad"
                  name="ciudad"
                  value={configuracion.ciudad}
                  onChange={manejarCambio}
                  placeholder="Buenos Aires"
                />
                <InputField
                  icon="📮"
                  label="Código Postal"
                  name="codigoPostal"
                  value={configuracion.codigoPostal}
                  onChange={manejarCambio}
                  placeholder="1001"
                />
                <InputField
                  icon="🌍"
                  label="País"
                  type="select"
                  name="pais"
                  value={configuracion.pais}
                  onChange={manejarCambio}
                />
              </div>
            </div>
          </div>

          {/* Redes Sociales */}
          <div className="tarjeta">
            <div className="p-6 border-bottom" style={{ borderBottom: '1px solid var(--color-borde)', backgroundColor: 'var(--color-fondo-hover)' }}>
              <div className="flex items-centro">
                <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>📱</span>
                <h3 className="titulo-3" style={{ marginBottom: '0' }}>Redes Sociales</h3>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <p className="texto-gris" style={{ marginBottom: '1rem' }}>
                Agrega los enlaces a tus redes sociales para que aparezcan en el catálogo público de tu tienda.
              </p>
              
              <div className="grid grid-2">
                <InputField
                  icon="📸"
                  label="Instagram"
                  type="url"
                  name="instagramUrl"
                  value={configuracion.instagramUrl}
                  onChange={manejarCambio}
                  placeholder="https://instagram.com/tuempresa"
                />
                <InputField
                  icon="👥"
                  label="Facebook"
                  type="url"
                  name="facebookUrl"
                  value={configuracion.facebookUrl}
                  onChange={manejarCambio}
                  placeholder="https://facebook.com/tuempresa"
                />
              </div>


            </div>
          </div>

          {/* Personalización de Colores */}
          <div className="tarjeta">
            <div className="p-6 border-bottom" style={{ borderBottom: '1px solid var(--color-borde)', backgroundColor: 'var(--color-fondo-hover)' }}>
              <div className="flex items-centro">
                <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>🎨</span>
                <h3 className="titulo-3" style={{ marginBottom: '0' }}>Personalización de Colores</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-2" style={{ gap: '2rem' }}>
                {/* Selectores de Color */}
                <div className="space-y-6">
                  <ColorPicker
                    label="Color Primario"
                    name="colorPrimario"
                    value={configuracion.colorPrimario}
                    onChange={manejarCambio}
                  />
                  <ColorPicker
                    label="Color Secundario"
                    name="colorSecundario"
                    value={configuracion.colorSecundario}
                    onChange={manejarCambio}
                  />
                  <ColorPicker
                    label="Color de Acento"
                    name="colorAcento"
                    value={configuracion.colorAcento}
                    onChange={manejarCambio}
                  />
                  <ColorPicker
                    label="Color de Fondo"
                    name="colorFondo"
                    value={configuracion.colorFondo}
                    onChange={manejarCambio}
                  />
                  <ColorPicker
                    label="Color de Texto"
                    name="colorTexto"
                    value={configuracion.colorTexto}
                    onChange={manejarCambio}
                  />
                </div>

                {/* Preview del Tema */}
                <div className="space-y-4">
                  <h4 className="etiqueta" style={{ marginBottom: '1rem' }}>Vista Previa del Tema</h4>
                  <div 
                    className="tarjeta"
                    style={{ backgroundColor: previewTema.fondo }}
                  >
                    <div 
                      className="boton boton-primario mb-3"
                      style={{ 
                        backgroundColor: previewTema.primario,
                        color: getContrastColor(previewTema.primario),
                        border: 'none'
                      }}
                    >
                      Botón Primario
                    </div>
                    <div 
                      className="boton boton-secundario mb-3"
                      style={{ 
                        backgroundColor: previewTema.secundario,
                        color: getContrastColor(previewTema.secundario),
                        borderColor: previewTema.secundario
                      }}
                    >
                      Botón Secundario
                    </div>
                    <div 
                      className="boton mb-3"
                      style={{ 
                        backgroundColor: previewTema.acento,
                        color: getContrastColor(previewTema.acento),
                        border: 'none'
                      }}
                    >
                      Elemento de Acento
                    </div>
                    <p 
                      className="texto-medio"
                      style={{ color: previewTema.texto }}
                    >
                      Este es un ejemplo de texto con el color seleccionado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Configuración del Catálogo */}
          <div className="tarjeta">
            <div className="p-6 border-bottom" style={{ borderBottom: '1px solid var(--color-borde)', backgroundColor: 'var(--color-fondo-hover)' }}>
              <div className="flex items-centro">
                <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>🛍️</span>
                <h3 className="titulo-3" style={{ marginBottom: '0' }}>Configuración del Catálogo</h3>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-2">
                <InputField
                  icon="💱"
                  label="Moneda"
                  type="select"
                  name="moneda"
                  value={configuracion.moneda}
                  onChange={manejarCambio}
                />
                <InputField
                  icon="🌐"
                  label="Idioma"
                  type="select"
                  name="idioma"
                  value={configuracion.idioma}
                  onChange={manejarCambio}
                />
              </div>

              <div className="space-y-4">
                <h4 className="etiqueta" style={{ marginBottom: '1rem' }}>Opciones de Visualización</h4>
                <div className="grid grid-2" style={{ gap: '1rem' }}>
                  <CheckboxField
                    label="Mostrar precios"
                    name="mostrarPrecios"
                    checked={configuracion.mostrarPrecios}
                    onChange={manejarCambio}
                    description="Los clientes podrán ver los precios de los productos"
                  />
                  <CheckboxField
                    label="Mostrar stock disponible"
                    name="mostrarStock"
                    checked={configuracion.mostrarStock}
                    onChange={manejarCambio}
                    description="Mostrar la cantidad disponible de cada producto"
                  />
                  <CheckboxField
                    label="Permitir reseñas"
                    name="permitirResenas"
                    checked={configuracion.permitirResenas}
                    onChange={manejarCambio}
                    description="Los clientes podrán dejar reseñas de los productos"
                  />
                  <CheckboxField
                    label="Mostrar categorías"
                    name="mostrarCategorias"
                    checked={configuracion.mostrarCategorias}
                    onChange={manejarCambio}
                    description="Organizar productos por categorías"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Configuración de Notificaciones */}
          <div className="tarjeta">
            <div className="p-6 border-bottom" style={{ borderBottom: '1px solid var(--color-borde)', backgroundColor: 'var(--color-fondo-hover)' }}>
              <div className="flex items-centro">
                <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>🔔</span>
                <h3 className="titulo-3" style={{ marginBottom: '0' }}>Notificaciones</h3>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <CheckboxField
                  label="Notificaciones de nuevos pedidos"
                  name="notificacionesPedidos"
                  checked={configuracion.notificacionesPedidos}
                  onChange={manejarCambio}
                  description="Recibir alertas cuando se realicen nuevos pedidos"
                />
                <CheckboxField
                  label="Alertas de stock bajo"
                  name="notificacionesStock"
                  checked={configuracion.notificacionesStock}
                  onChange={manejarCambio}
                  description="Recibir notificaciones cuando el stock esté bajo"
                />
              </div>

              <div className="grupo-campo">
                <label className="etiqueta">Stock mínimo para alertas</label>
                <div className="relative" style={{ maxWidth: '200px' }}>
                  <div className="absolute" style={{ top: '50%', left: '0.75rem', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <span style={{ color: 'var(--color-texto-secundario)', fontSize: '1.125rem' }}>📦</span>
                  </div>
                  <input
                    type="number"
                    name="stockMinimo"
                    value={configuracion.stockMinimo}
                    onChange={manejarCambio}
                    min="0"
                    className="campo"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={guardando}
              className="boton boton-primario boton-completo"
              style={{ opacity: guardando ? 0.7 : 1 }}
            >
              {guardando ? (
                <>
                  <div className="spinner mr-2" style={{ width: '1.25rem', height: '1.25rem' }}></div>
                  Guardando...
                </>
              ) : (
                <>
                  <span className="mr-2">💾</span>
                  Guardar Configuración
                </>
              )}
            </button>
            <Link
              to="/admin/dashboard"
              className="boton boton-secundario boton-completo text-center"
            >
              <span className="mr-2">❌</span>
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
