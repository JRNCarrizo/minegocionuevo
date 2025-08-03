import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useResponsive } from '../../hooks/useResponsive';
import { useUsuario } from '../../contexts/UsuarioContext';
import type { Empresa, ApiError } from '../../types';

interface ConfiguracionEmpresa {
  nombre: string;
  descripcion: string;
  textoBienvenida: string;
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
  colorTituloPrincipal: string;
  colorCardFiltros: string;
  imagenFondo: File | null;
  imagenFondoUrl: string;
  moneda: string;
  idioma: string;
  notificacionesPedidos: boolean;
  notificacionesStock: boolean;
  stockMinimo: number;
  mostrarPrecios: boolean;
  mostrarStock: boolean;
  permitirResenas: boolean;
  mostrarCategorias: boolean;
  transferenciaBancariaHabilitada: boolean;
  banco: string;
  tipoCuenta: string;
  numeroCuenta: string;
  cbu: string;
  alias: string;
  titular: string;
  instagramUrl: string;
  facebookUrl: string;
}

const ColorPicker = ({ 
  label, 
  value, 
  onChange, 
  name
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
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
    </div>
  </div>
);

const getContrastColor = (hexColor: string) => {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
};

const InputField = ({ 
  icon, 
  label, 
  type = "text", 
  name, 
  value, 
  onChange, 
  required = false,
  placeholder = "",
  description = ""
}: {
  icon: string;
  label: string;
  type?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  required?: boolean;
  placeholder?: string;
  description?: string;
}) => (
  <div className="grupo-campo">
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
          className="campo"
          style={{ paddingLeft: '2.5rem', minHeight: '100px', resize: 'vertical' }}
          placeholder={placeholder}
        />
      ) : type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className="campo"
          style={{ paddingLeft: '2.5rem' }}
        >
          {name === 'pais' && (
            <>
              <option value="">Seleccionar país</option>
              <option value="Argentina">Argentina</option>
              <option value="Chile">Chile</option>
              <option value="Uruguay">Uruguay</option>
              <option value="Paraguay">Paraguay</option>
              <option value="Bolivia">Bolivia</option>
              <option value="Perú">Perú</option>
              <option value="Ecuador">Ecuador</option>
              <option value="Colombia">Colombia</option>
              <option value="Venezuela">Venezuela</option>
              <option value="Brasil">Brasil</option>
              <option value="México">México</option>
              <option value="Estados Unidos">Estados Unidos</option>
              <option value="España">España</option>
              <option value="Otro">Otro</option>
            </>
          )}
          {name === 'moneda' && (
            <>
              <option value="ARS">Peso Argentino (ARS)</option>
              <option value="USD">Dólar Estadounidense (USD)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="CLP">Peso Chileno (CLP)</option>
              <option value="UYU">Peso Uruguayo (UYU)</option>
              <option value="PYG">Guaraní Paraguayo (PYG)</option>
              <option value="BOB">Boliviano (BOB)</option>
              <option value="PEN">Sol Peruano (PEN)</option>
            </>
          )}
          {name === 'idioma' && (
            <>
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
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
          className="campo"
          style={{ paddingLeft: '2.5rem' }}
          placeholder={placeholder}
        />
      )}
    </div>
    {description && (
      <p className="texto-pequeno texto-gris" style={{ marginTop: '0.25rem' }}>{description}</p>
    )}
  </div>
);

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
  <div className="grupo-campo">
    <label className="flex items-centro" style={{ gap: '0.75rem', cursor: 'pointer' }}>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        style={{
          width: '1.25rem',
          height: '1.25rem',
          accentColor: 'var(--color-primario)',
          cursor: 'pointer'
        }}
      />
      <div>
        <div className="etiqueta" style={{ marginBottom: '0.25rem' }}>{label}</div>
        {description && (
          <div className="texto-pequeno texto-gris">{description}</div>
        )}
      </div>
    </label>
  </div>
);

const TabButton = ({ 
  icon, 
  label, 
  isActive, 
  onClick 
}: {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1rem',
      border: 'none',
      borderRadius: 'var(--radio-borde)',
      background: isActive ? 'var(--color-primario)' : 'transparent',
      color: isActive ? 'white' : 'var(--color-texto)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontWeight: isActive ? '600' : '500',
      fontSize: '0.875rem',
      borderBottom: isActive ? '3px solid var(--color-secundario)' : '3px solid transparent'
    }}
    onMouseOver={(e) => {
      if (!isActive) {
        e.currentTarget.style.background = 'var(--color-fondo-hover)';
      }
    }}
    onMouseOut={(e) => {
      if (!isActive) {
        e.currentTarget.style.background = 'transparent';
      }
    }}
  >
    <span style={{ fontSize: '1.125rem' }}>{icon}</span>
    <span>{label}</span>
  </button>
);

export default function ConfiguracionEmpresa() {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const { datosUsuario, actualizarEmpresaNombre, cerrarSesion } = useUsuario();
  const [activeTab, setActiveTab] = useState(0);
  const [configuracion, setConfiguracion] = useState<ConfiguracionEmpresa>({
    nombre: '',
    descripcion: '',
    textoBienvenida: '',
    subdominio: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    pais: '',
    logo: null,
    colorPrimario: '#3b82f6',
    colorSecundario: '#64748b',
    colorAcento: '#f59e0b',
    colorFondo: '#ffffff',
    colorTexto: '#1f2937',
    colorTituloPrincipal: '#1f2937',
    colorCardFiltros: '#ffffff',
    imagenFondo: null,
    imagenFondoUrl: '',
    moneda: 'ARS',
    idioma: 'es',
    notificacionesPedidos: true,
    notificacionesStock: true,
    stockMinimo: 5,
    mostrarPrecios: true,
    mostrarStock: true,
    permitirResenas: true,
    mostrarCategorias: true,
    transferenciaBancariaHabilitada: false,
    banco: '',
    tipoCuenta: '',
    numeroCuenta: '',
    cbu: '',
    alias: '',
    titular: '',
    instagramUrl: '',
    facebookUrl: ''
  });

  const [empresaId, setEmpresaId] = useState<number | null>(null);
  const [logoActual, setLogoActual] = useState<string>('');
  const [imagenFondoActual, setImagenFondoActual] = useState<string>('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [verificandoSubdominio, setVerificandoSubdominio] = useState(false);
  const [subdominioDisponible, setSubdominioDisponible] = useState<boolean | null>(null);
  const [configuracionOriginal, setConfiguracionOriginal] = useState<ConfiguracionEmpresa | null>(null);
  const [subdominioOriginal, setSubdominioOriginal] = useState<string>('');

  // Definición de las pestañas
  const tabs = [
    { icon: '🏢', label: 'Información Básica', id: 0 },
    { icon: '🎨', label: 'Apariencia', id: 1 },
    { icon: '🛍️', label: 'Catálogo', id: 2 },
    { icon: '💳', label: 'Pagos', id: 3 },
    { icon: '🔔', label: 'Notificaciones', id: 4 },
    { icon: '📱', label: 'Redes Sociales', id: 5 }
  ];

  // Preview del tema de colores
  const previewTema = useMemo(() => ({
    primario: configuracion.colorPrimario,
    secundario: configuracion.colorSecundario,
    acento: configuracion.colorAcento,
    fondo: configuracion.colorFondo,
    texto: configuracion.colorTexto,
    tituloPrincipal: configuracion.colorTituloPrincipal,
    cardFiltros: configuracion.colorCardFiltros
  }), [configuracion]);

  const cargarConfiguracion = useCallback(async (mostrarToast = true) => {
    try {
      setCargando(true);
      
      console.log('Cargando configuración de la empresa del administrador...');
      
      const response = await ApiService.obtenerEmpresaAdmin();
      
      if (!response.data) {
        toast.error('No se encontraron datos de la empresa');
        return;
      }
      
      const empresa: Empresa = response.data;
      
      console.log('=== DEBUG CONFIGURACIÓN EMPRESA ===');
      console.log('Datos de la empresa obtenidos:', empresa);
      console.log('Texto de bienvenida recibido:', empresa.textoBienvenida);
      console.log('Descripción recibida:', empresa.descripcion);
      console.log('Colores recibidos:');
      console.log('  - Primario:', empresa.colorPrimario);
      console.log('  - Secundario:', empresa.colorSecundario);
      console.log('  - Acento:', empresa.colorAcento);
      console.log('  - Fondo:', empresa.colorFondo);
      console.log('  - Texto:', empresa.colorTexto);
      console.log('  - Imagen Fondo:', empresa.imagenFondoUrl);
      console.log('=== FIN DEBUG ===');
      
      const nuevaConfiguracion: ConfiguracionEmpresa = {
        nombre: empresa.nombre || '',
        descripcion: empresa.descripcion || '',
        textoBienvenida: empresa.textoBienvenida || '',
        subdominio: empresa.subdominio || '',
        email: empresa.email || '',
        telefono: empresa.telefono || '',
        direccion: empresa.direccion || '',
        ciudad: empresa.ciudad || '',
        codigoPostal: empresa.codigoPostal || '',
        pais: empresa.pais || '',
        logo: null,
        colorPrimario: empresa.colorPrimario || '#2563eb',
        colorSecundario: empresa.colorSecundario || '#64748b',
        colorAcento: empresa.colorAcento || '#f59e0b',
        colorFondo: empresa.colorFondo || '#ffffff',
        colorTexto: empresa.colorTexto || '#1f2937',
        colorTituloPrincipal: empresa.colorTituloPrincipal || '#1f2937',
        colorCardFiltros: empresa.colorCardFiltros || '#ffffff',
        imagenFondo: null,
        imagenFondoUrl: empresa.imagenFondoUrl || '',
        moneda: empresa.moneda || 'ARS',
        idioma: empresa.idioma || 'es',
        notificacionesPedidos: empresa.notificacionesPedidos !== undefined ? empresa.notificacionesPedidos : true,
        notificacionesStock: empresa.notificacionesStock !== undefined ? empresa.notificacionesStock : true,
        stockMinimo: empresa.stockMinimo || 5,
        mostrarPrecios: empresa.mostrarPrecios !== undefined ? empresa.mostrarPrecios : true,
        mostrarStock: empresa.mostrarStock !== undefined ? empresa.mostrarStock : true,
        permitirResenas: empresa.permitirResenas !== undefined ? empresa.permitirResenas : true,
        mostrarCategorias: empresa.mostrarCategorias !== undefined ? empresa.mostrarCategorias : true,
        transferenciaBancariaHabilitada: empresa.transferenciaBancariaHabilitada !== undefined ? empresa.transferenciaBancariaHabilitada : false,
        banco: empresa.banco || '',
        tipoCuenta: empresa.tipoCuenta || '',
        numeroCuenta: empresa.numeroCuenta || '',
        cbu: empresa.cbu || '',
        alias: empresa.alias || '',
        titular: empresa.titular || '',
        instagramUrl: empresa.instagramUrl || '',
        facebookUrl: empresa.facebookUrl || ''
      };
      
      setConfiguracion(nuevaConfiguracion);
      setConfiguracionOriginal(nuevaConfiguracion);
      setSubdominioOriginal(empresa.subdominio || '');
      setEmpresaId(empresa.id);
      
      if (empresa.logoUrl) {
        setLogoActual(empresa.logoUrl);
      }
      
      if (empresa.imagenFondoUrl) {
        setImagenFondoActual(empresa.imagenFondoUrl);
      }
      
      if (mostrarToast) {
        toast.success('Configuración cargada exitosamente');
      }
      
      console.log('Configuración actualizada:', nuevaConfiguracion);
      
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      if (mostrarToast) {
        toast.error('Error al cargar la configuración');
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarConfiguracion();
  }, [cargarConfiguracion]);

  const manejarCambio = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setConfiguracion(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const manejarLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setConfiguracion(prev => ({ ...prev, logo: file }));
    }
  };

  const manejarImagenFondo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setConfiguracion(prev => ({ ...prev, imagenFondo: file }));
    }
  };

  const verificarSubdominio = useCallback(async (subdominio: string) => {
    if (!subdominio.trim()) return;
    
    // Si el subdominio es igual al original, no verificar disponibilidad
    if (subdominioOriginal && subdominio === subdominioOriginal) {
      setSubdominioDisponible(true);
      return;
    }
    
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
  }, [subdominioOriginal]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (configuracion.subdominio) {
        verificarSubdominio(configuracion.subdominio);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [configuracion.subdominio, verificarSubdominio]);

  const guardarConfiguracion = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const datosEmpresa: any = {
        nombre: configuracion.nombre,
        descripcion: configuracion.descripcion,
        textoBienvenida: configuracion.textoBienvenida,
        subdominio: configuracion.subdominio,
        email: configuracion.email,
        telefono: configuracion.telefono,
        direccion: configuracion.direccion,
        ciudad: configuracion.ciudad,
        codigoPostal: configuracion.codigoPostal,
        pais: configuracion.pais,
        colorPrimario: configuracion.colorPrimario,
        colorSecundario: configuracion.colorSecundario,
        colorAcento: configuracion.colorAcento,
        colorFondo: configuracion.colorFondo,
        colorTexto: configuracion.colorTexto,
        colorTituloPrincipal: configuracion.colorTituloPrincipal,
        colorCardFiltros: configuracion.colorCardFiltros,
        moneda: configuracion.moneda,
        idioma: configuracion.idioma,
        notificacionesPedidos: configuracion.notificacionesPedidos,
        notificacionesStock: configuracion.notificacionesStock,
        stockMinimo: configuracion.stockMinimo,
        mostrarPrecios: configuracion.mostrarPrecios,
        mostrarStock: configuracion.mostrarStock,
        permitirResenas: configuracion.permitirResenas,
        mostrarCategorias: configuracion.mostrarCategorias,
        transferenciaBancariaHabilitada: configuracion.transferenciaBancariaHabilitada,
        banco: configuracion.banco,
        tipoCuenta: configuracion.tipoCuenta,
        numeroCuenta: configuracion.numeroCuenta,
        cbu: configuracion.cbu,
        alias: configuracion.alias,
        titular: configuracion.titular,
        instagramUrl: configuracion.instagramUrl,
        facebookUrl: configuracion.facebookUrl
      };

      if (configuracion.logo) {
        const logoResponse = await ApiService.subirLogoEmpresa(configuracion.logo);
        datosEmpresa.logoUrl = logoResponse.data?.logoUrl || '';
      }

      if (configuracion.imagenFondo) {
        const fondoResponse = await ApiService.subirFondoEmpresa(configuracion.imagenFondo);
        datosEmpresa.imagenFondoUrl = fondoResponse.data?.fondoUrl || '';
      }

      await ApiService.actualizarEmpresaAdmin(datosEmpresa);

      toast.success('Configuración guardada exitosamente');
      // Navegar automáticamente al dashboard después de guardar exitosamente
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1500); // Esperar 1.5 segundos para que el usuario vea el mensaje de éxito
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setGuardando(false);
    }
  };

  const manejarCancelar = () => {
    navigate('/admin/dashboard');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Información Básica
        return (
          <div className="space-y-6">
            <div className="grid grid-2" style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: isMobile ? '1rem' : '1.5rem'
            }}>
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
                <p className="texto-pequeno texto-gris" style={{ marginBottom: '0.5rem' }}>
                  Este será la URL de tu tienda online. Por ejemplo: si escribes "miempresa", tu tienda estará disponible en miempresa.negocio360.org
                </p>
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
                    .negocio360.org
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

            <div className="grid grid-2" style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: isMobile ? '1rem' : '1.5rem'
            }}>
              <InputField
                icon="📧"
                label="Email de Contacto"
                type="email"
                name="email"
                value={configuracion.email}
                onChange={manejarCambio}
                required
                placeholder="contacto@tuempresa.com"
                description="Este email se usará para recibir notificaciones de pedidos, consultas de clientes y comunicaciones importantes de la plataforma."
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

            <div className="grid grid-3" style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: isMobile ? '1rem' : '1.5rem'
            }}>
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
        );

      case 1: // Apariencia
        return (
          <div className="space-y-6">
            {/* Logo de la empresa */}
            <div className="grupo-campo">
              <label className="etiqueta">Logo de la Empresa</label>
              <div className="flex items-centro" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                <div className="flex items-centro" style={{ gap: '0.5rem' }}>
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
                      🖼️ Seleccionar Logo
                    </label>
                  </div>
                  {configuracion.logo && (
                    <button
                      type="button"
                      onClick={() => setConfiguracion(prev => ({ ...prev, logo: null }))}
                      className="boton boton-outline"
                      style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                      ❌ Limpiar
                    </button>
                  )}
                </div>
                
                {/* Vista previa del logo */}
                <div className="flex items-centro" style={{ gap: '0.5rem' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    border: '2px dashed var(--color-borde)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--color-fondo-hover)',
                    overflow: 'hidden',
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundImage: configuracion.logo ? 
                      `url(${URL.createObjectURL(configuracion.logo)})` : 
                      logoActual ? `url(${logoActual})` : 'none'
                  }}>
                    {!configuracion.logo && !logoActual && (
                      <span style={{ fontSize: '1.5rem', color: 'var(--color-texto-secundario)' }}>
                        🏢
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col" style={{ gap: '0.25rem' }}>
                    {configuracion.logo && (
                      <span className="texto-pequeno texto-verde">
                        ✅ Nueva: {configuracion.logo.name}
                      </span>
                    )}
                    {logoActual && !configuracion.logo && (
                      <span className="texto-pequeno texto-gris">
                        📋 Logo guardado
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="texto-pequeno texto-gris" style={{ marginTop: '0.5rem' }}>
                El logo aparecerá en la tarjeta de presentación de la empresa en el catálogo público. 
                Formatos recomendados: PNG, JPG. Tamaño máximo: 2MB.
              </p>
            </div>

            {/* Título de bienvenida */}
            <InputField
              icon="👋"
              label="Título de Bienvenida"
              name="textoBienvenida"
              value={configuracion.textoBienvenida}
              onChange={manejarCambio}
              placeholder="¡Bienvenidos a [nombre de la empresa]!"
            />

            {/* Texto secundario */}
            <InputField
              icon="📝"
              label="Texto Secundario"
              type="textarea"
              name="descripcion"
              value={configuracion.descripcion}
              onChange={manejarCambio}
              placeholder="Eslogan, contenido adicional o descripción breve..."
            />

            {/* Imagen de fondo */}
            <div className="grupo-campo">
              <label className="etiqueta">Imagen de Fondo de la Card</label>
              <div className="flex items-centro" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                <div className="flex items-centro" style={{ gap: '0.5rem' }}>
                  <div className="relative">
                    <input
                      type="file"
                      name="imagenFondo"
                      onChange={manejarImagenFondo}
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="imagen-fondo-input"
                    />
                    <label
                      htmlFor="imagen-fondo-input"
                      className="boton boton-secundario"
                      style={{ cursor: 'pointer' }}
                    >
                      🖼️ Seleccionar Imagen de Fondo
                    </label>
                  </div>
                  {configuracion.imagenFondo && (
                    <button
                      type="button"
                      onClick={() => setConfiguracion(prev => ({ ...prev, imagenFondo: null }))}
                      className="boton boton-outline"
                      style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                      ❌ Limpiar
                    </button>
                  )}
                </div>
                
                {/* Vista previa de la imagen de fondo */}
                <div className="flex items-centro" style={{ gap: '0.5rem' }}>
                  <div style={{
                    width: '120px',
                    height: '80px',
                    border: '2px dashed var(--color-borde)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--color-fondo-hover)',
                    overflow: 'hidden',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundImage: configuracion.imagenFondoUrl ? 
                      `url(${configuracion.imagenFondoUrl})` : 'none'
                  }}>
                    {!configuracion.imagenFondoUrl && (
                      <span style={{ fontSize: '1.5rem', color: 'var(--color-texto-secundario)' }}>
                        🖼️
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col" style={{ gap: '0.25rem' }}>
                    {configuracion.imagenFondo && (
                      <span className="texto-pequeno texto-verde">
                        ✅ Nueva: {configuracion.imagenFondo.name}
                      </span>
                    )}
                    {configuracion.imagenFondoUrl && !configuracion.imagenFondo && (
                      <span className="texto-pequeno texto-gris">
                        📋 Imagen guardada
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="texto-pequeno texto-gris" style={{ marginTop: '0.5rem' }}>
                Esta imagen aparecerá como fondo de la tarjeta de presentación de tu empresa en el catálogo público.
              </p>
            </div>

            {/* Configuración de colores con vista previa */}
            <div className="grupo-campo">
              <label className="etiqueta">Configuración de Colores</label>
              <div className="grid grid-3" style={{ 
                gap: isMobile ? '1rem' : '2rem',
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr 1fr'
              }}>
                {/* Selectores de Color - Lado Izquierdo */}
                <div className="space-y-6">
                  <ColorPicker
                    label="Color Primario (Navbar mezclado)"
                    name="colorPrimario"
                    value={configuracion.colorPrimario}
                    onChange={manejarCambio}
                  />
                  <ColorPicker
                    label="Color Secundario (Navbar mezclado)"
                    name="colorSecundario"
                    value={configuracion.colorSecundario}
                    onChange={manejarCambio}
                  />
                  <ColorPicker
                    label="Color de Card Productos"
                    name="colorAcento"
                    value={configuracion.colorAcento}
                    onChange={manejarCambio}
                  />
                  <ColorPicker
                    label="Color de Fondo General"
                    name="colorFondo"
                    value={configuracion.colorFondo}
                    onChange={manejarCambio}
                  />
                </div>

                {/* Mini Pantalla de Referencia - Centro */}
                <div className="space-y-4">
                  <h4 className="etiqueta" style={{ 
                    marginBottom: '1rem',
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    textAlign: 'center'
                  }}>
                    Vista Previa - Mini Pantalla
                  </h4>
                  <div 
                    className="tarjeta"
                    style={{ 
                      backgroundColor: previewTema.fondo,
                      padding: isMobile ? '0.75rem' : '1rem',
                      borderRadius: '12px',
                      border: '2px solid var(--color-borde)',
                      maxWidth: isMobile ? '100%' : '320px',
                      margin: '0 auto'
                    }}
                  >
                    {/* Mini Navbar con colores mezclados */}
                    <div 
                      style={{ 
                        background: `linear-gradient(135deg, ${previewTema.primario} 0%, ${previewTema.secundario} 100%)`,
                        color: getContrastColor(previewTema.primario),
                        padding: '0.5rem 1rem',
                        borderRadius: '8px 8px 0 0',
                        marginBottom: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                    >
                      <span>🏢 {configuracion.nombre || 'Mi Empresa'}</span>
                      <span>👤 Admin</span>
                    </div>

                    {/* Card de Presentación con imagen de fondo */}
                    <div 
                      style={{ 
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        border: `1px solid ${previewTema.secundario}20`,
                        position: 'relative',
                        overflow: 'hidden',
                        backgroundImage: configuracion.imagenFondo
                          ? `url(${URL.createObjectURL(configuracion.imagenFondo)})`
                          : configuracion.imagenFondoUrl
                            ? `url(${configuracion.imagenFondoUrl})`
                            : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        minHeight: '80px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}
                    >
                      {/* Overlay para mejorar legibilidad */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        zIndex: 1
                      }}></div>
                      
                      {/* Contenido de la card de presentación */}
                      <div style={{ 
                        position: 'relative', 
                        zIndex: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center'
                      }}>
                        {/* Logo */}
                        <div style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '0.5rem',
                          fontSize: '1.2rem'
                        }}>
                          🏢
                        </div>
                        
                        {/* Título de bienvenida */}
                        <div 
                          style={{ 
                            color: previewTema.tituloPrincipal,
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            marginBottom: '0.25rem',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                          }}
                        >
                          {configuracion.textoBienvenida || '¡Bienvenidos!'}
                        </div>
                        
                        {/* Descripción */}
                        <div 
                          style={{ 
                            color: previewTema.tituloPrincipal,
                            fontSize: '0.6rem',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                            lineHeight: '1.2'
                          }}
                        >
                          {configuracion.descripcion || 'Descripción de la empresa'}
                        </div>
                      </div>
                    </div>

                    {/* Mini Card de Filtros */}
                    <div 
                      style={{ 
                        backgroundColor: previewTema.cardFiltros,
                        padding: '0.5rem',
                        borderRadius: '6px',
                        marginBottom: '0.75rem',
                        border: `1px solid ${previewTema.secundario}20`,
                        fontSize: '0.6rem'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.25rem',
                        marginBottom: '0.25rem'
                      }}>
                        <span style={{ fontSize: '0.7rem' }}>🔍</span>
                        <span style={{ fontWeight: '600', color: previewTema.texto }}>Filtros</span>
                      </div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '0.25rem',
                        fontSize: '0.5rem'
                      }}>
                        <div style={{ 
                          background: '#fff', 
                          padding: '0.2rem', 
                          borderRadius: '3px',
                          border: '1px solid #e2e8f0',
                          color: previewTema.texto
                        }}>
                          Categoría
                        </div>
                        <div style={{ 
                          background: '#fff', 
                          padding: '0.2rem', 
                          borderRadius: '3px',
                          border: '1px solid #e2e8f0',
                          color: previewTema.texto
                        }}>
                          Marca
                        </div>
                      </div>
                    </div>

                    {/* Mini Cards de Productos */}
                    <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: '1fr 1fr' }}>
                      {/* Card Producto 1 */}
                      <div 
                        style={{ 
                          backgroundColor: previewTema.acento,
                          color: getContrastColor(previewTema.acento),
                          padding: '0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.7rem',
                          textAlign: 'center',
                          border: `1px solid ${previewTema.secundario}20`
                        }}
                      >
                        <div style={{ 
                          width: '100%', 
                          height: '40px', 
                          backgroundColor: previewTema.secundario,
                          borderRadius: '4px',
                          marginBottom: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem'
                        }}>
                          📱
                        </div>
                        <div style={{ 
                          fontWeight: '600', 
                          marginBottom: '0.25rem',
                          color: previewTema.texto
                        }}>
                          Producto 1
                        </div>
                        <div style={{ 
                          fontSize: '0.6rem', 
                          opacity: '0.8',
                          color: previewTema.texto
                        }}>
                          $99.99
                        </div>
                      </div>

                      {/* Card Producto 2 */}
                      <div 
                        style={{ 
                          backgroundColor: previewTema.acento,
                          color: getContrastColor(previewTema.acento),
                          padding: '0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.7rem',
                          textAlign: 'center',
                          border: `1px solid ${previewTema.secundario}20`
                        }}
                      >
                        <div style={{ 
                          width: '100%', 
                          height: '40px', 
                          backgroundColor: previewTema.secundario,
                          borderRadius: '4px',
                          marginBottom: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem'
                        }}>
                          💻
                        </div>
                        <div style={{ 
                          fontWeight: '600', 
                          marginBottom: '0.25rem',
                          color: previewTema.texto
                        }}>
                          Producto 2
                        </div>
                        <div style={{ 
                          fontSize: '0.6rem', 
                          opacity: '0.8',
                          color: previewTema.texto
                        }}>
                          $149.99
                        </div>
                      </div>
                    </div>

                    {/* Mini Botones */}
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                      <button 
                        style={{ 
                          background: `linear-gradient(135deg, ${previewTema.primario} 0%, ${previewTema.secundario} 100%)`,
                          color: getContrastColor(previewTema.primario),
                          border: 'none',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Primario
                      </button>
                      <button 
                        style={{ 
                          backgroundColor: 'transparent',
                          color: previewTema.secundario,
                          border: `1px solid ${previewTema.secundario}`,
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Secundario
                      </button>
                    </div>

                    {/* Mini Texto */}
                    <p 
                      style={{ 
                        color: previewTema.texto,
                        fontSize: '0.7rem',
                        marginTop: '0.75rem',
                        marginBottom: '0',
                        lineHeight: '1.3'
                      }}
                    >
                      Este es un ejemplo de texto con el color seleccionado para textos principales.
                    </p>
                  </div>

                  {/* Leyenda de Colores */}
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-texto-secundario)', textAlign: 'center' }}>
                    <div style={{ marginBottom: '0.5rem', fontWeight: '600' }}>Referencia de Colores:</div>
                    <div style={{ display: 'grid', gap: '0.25rem', gridTemplateColumns: '1fr 1fr' }}>
                      <div>🔵 <strong>Primario:</strong> Navbar (mezclado)</div>
                      <div>🟢 <strong>Secundario:</strong> Navbar (mezclado)</div>
                      <div>🟡 <strong>Card Productos:</strong> Fondo de productos</div>
                      <div>⚪ <strong>Fondo:</strong> Fondo general de la página</div>
                      <div>⚫ <strong>Textos:</strong> Nombres y precios de productos</div>
                      <div>🟣 <strong>Título Principal:</strong> Títulos del catálogo</div>
                      <div>🟠 <strong>Card Filtros:</strong> Fondo de filtros de búsqueda</div>
                    </div>
                  </div>
                </div>

                {/* Selectores de Color - Lado Derecho */}
                <div className="space-y-6">
                  <ColorPicker
                    label="Color de Textos Principales (Nombres y precios)"
                    name="colorTexto"
                    value={configuracion.colorTexto}
                    onChange={manejarCambio}
                  />
                  <ColorPicker
                    label="Color de Título Principal"
                    name="colorTituloPrincipal"
                    value={configuracion.colorTituloPrincipal}
                    onChange={manejarCambio}
                  />
                  <ColorPicker
                    label="Color de Card de Filtros"
                    name="colorCardFiltros"
                    value={configuracion.colorCardFiltros}
                    onChange={manejarCambio}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Catálogo
        return (
          <div className="space-y-6">
            <div className="grid grid-2" style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: isMobile ? '1rem' : '1.5rem'
            }}>
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
              <h4 className="etiqueta" style={{ 
                marginBottom: '1rem',
                fontSize: isMobile ? '0.875rem' : '1rem',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                Opciones de Visualización
              </h4>
              <div className="grid grid-2" style={{ 
                gap: isMobile ? '0.75rem' : '1rem',
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)'
              }}>
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
        );

      case 3: // Pagos
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <CheckboxField
                label="Habilitar pago por transferencia bancaria"
                name="transferenciaBancariaHabilitada"
                checked={configuracion.transferenciaBancariaHabilitada}
                onChange={manejarCambio}
                description="Los clientes podrán pagar mediante transferencia bancaria"
              />
            </div>

            {configuracion.transferenciaBancariaHabilitada && (
              <div className="space-y-4">
                <h4 className="etiqueta" style={{ 
                  marginBottom: '1rem',
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  textAlign: isMobile ? 'center' : 'left'
                }}>
                  Datos Bancarios
                </h4>
                
                <div className="grid grid-2" style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                  gap: isMobile ? '1rem' : '1.5rem'
                }}>
                  <InputField
                    icon="🏦"
                    label="Banco"
                    name="banco"
                    value={configuracion.banco}
                    onChange={manejarCambio}
                    placeholder="Ej: Banco Galicia"
                    description="Nombre del banco"
                  />
                  <InputField
                    icon="📋"
                    label="Tipo de Cuenta"
                    name="tipoCuenta"
                    value={configuracion.tipoCuenta}
                    onChange={manejarCambio}
                    placeholder="Ej: Cuenta Corriente"
                    description="Tipo de cuenta bancaria"
                  />
                </div>

                <div className="grid grid-2" style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                  gap: isMobile ? '1rem' : '1.5rem'
                }}>
                  <InputField
                    icon="🔢"
                    label="Número de Cuenta"
                    name="numeroCuenta"
                    value={configuracion.numeroCuenta}
                    onChange={manejarCambio}
                    placeholder="Ej: 1234567890"
                    description="Número de cuenta bancaria"
                  />
                  <InputField
                    icon="🏷️"
                    label="Titular"
                    name="titular"
                    value={configuracion.titular}
                    onChange={manejarCambio}
                    placeholder="Ej: Tu Empresa S.A."
                    description="Nombre del titular de la cuenta"
                  />
                </div>

                <div className="grid grid-2" style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                  gap: isMobile ? '1rem' : '1.5rem'
                }}>
                  <InputField
                    icon="🔗"
                    label="CBU"
                    name="cbu"
                    value={configuracion.cbu}
                    onChange={manejarCambio}
                    placeholder="Ej: 0070123456789012345678"
                    description="Clave Bancaria Uniforme"
                  />
                  <InputField
                    icon="🏷️"
                    label="Alias"
                    name="alias"
                    value={configuracion.alias}
                    onChange={manejarCambio}
                    placeholder="Ej: TU.EMPRESA.GALICIA"
                    description="Alias de la cuenta bancaria"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" style={{
                  backgroundColor: 'var(--color-fondo-hover)',
                  border: '1px solid var(--color-borde)',
                  borderRadius: 'var(--radio-borde)',
                  padding: '1rem'
                }}>
                  <div className="flex items-start" style={{ gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>💡</span>
                    <div>
                      <h5 className="font-semibold text-blue-800" style={{ 
                        fontWeight: '600',
                        color: 'var(--color-texto)',
                        marginBottom: '0.5rem'
                      }}>
                        Información Importante
                      </h5>
                      <p className="text-sm text-blue-700" style={{ 
                        fontSize: '0.875rem',
                        color: 'var(--color-texto-secundario)',
                        lineHeight: '1.5'
                      }}>
                        Estos datos bancarios serán mostrados a los clientes cuando seleccionen 
                        el método de pago por transferencia. Asegúrate de que la información 
                        sea correcta y esté actualizada.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 4: // Notificaciones
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="etiqueta" style={{ 
                marginBottom: '1rem',
                fontSize: isMobile ? '0.875rem' : '1rem',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                Configuración de Notificaciones
              </h4>
              <div className="grid grid-2" style={{ 
                gap: isMobile ? '0.75rem' : '1rem',
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)'
              }}>
                <CheckboxField
                  label="Notificaciones de pedidos"
                  name="notificacionesPedidos"
                  checked={configuracion.notificacionesPedidos}
                  onChange={manejarCambio}
                  description="Recibir notificaciones cuando se realicen nuevos pedidos"
                />
                <CheckboxField
                  label="Notificaciones de stock"
                  name="notificacionesStock"
                  checked={configuracion.notificacionesStock}
                  onChange={manejarCambio}
                  description="Recibir alertas cuando el stock esté bajo"
                />
              </div>
            </div>

            <div className="grupo-campo">
              <label className="etiqueta">Stock Mínimo</label>
              <p className="texto-pequeno texto-gris" style={{ marginBottom: '0.5rem' }}>
                Cantidad mínima de productos antes de recibir una alerta de stock bajo
              </p>
              <input
                type="number"
                name="stockMinimo"
                value={configuracion.stockMinimo}
                onChange={manejarCambio}
                min="1"
                className="campo"
                style={{ maxWidth: '200px' }}
              />
            </div>
          </div>
        );

      case 5: // Redes Sociales
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="etiqueta" style={{ 
                marginBottom: '1rem',
                fontSize: isMobile ? '0.875rem' : '1rem',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                Enlaces de Redes Sociales
              </h4>
              <p className="texto-pequeno texto-gris">
                Estos enlaces aparecerán en el catálogo público para que los clientes puedan seguirte en redes sociales.
              </p>
            </div>

            <div className="grid grid-2" style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: isMobile ? '1rem' : '1.5rem'
            }}>
              <InputField
                icon="📷"
                label="Instagram"
                name="instagramUrl"
                value={configuracion.instagramUrl}
                onChange={manejarCambio}
                placeholder="https://instagram.com/tuempresa"
              />
              <InputField
                icon="📘"
                label="Facebook"
                name="facebookUrl"
                value={configuracion.facebookUrl}
                onChange={manejarCambio}
                placeholder="https://facebook.com/tuempresa"
              />
            </div>
          </div>
        );

             default:
         return null;
     }
   };

  if (cargando) {
    return (
      <div className="h-pantalla-minimo pagina-con-navbar" style={{ backgroundColor: 'var(--color-fondo)' }}>
        <NavbarAdmin 
          onCerrarSesion={cerrarSesion}
          empresaNombre={datosUsuario?.empresaNombre}
          nombreAdministrador={datosUsuario?.nombre}
        />
        <div className="contenedor" style={{ 
          paddingTop: (isMobile || window.innerWidth < 768) ? '10.5rem' : '5rem', 
          paddingBottom: '2rem',
          paddingLeft: '1rem',
          paddingRight: '1rem'
        }}>
          <div className="tarjeta text-center py-12">
            <div className="spinner mx-auto mb-4"></div>
            <p className="texto-gris">Cargando configuración...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-pantalla-minimo pagina-con-navbar" style={{ backgroundColor: 'var(--color-fondo)' }}>
      {/* Navegación */}
      <NavbarAdmin 
        onCerrarSesion={cerrarSesion}
        empresaNombre={datosUsuario?.empresaNombre}
        nombreAdministrador={datosUsuario?.nombre}
      />

      {/* Contenido principal */}
      <div className="contenedor" style={{ 
        paddingTop: (isMobile || window.innerWidth < 768) ? '10.5rem' : '5rem', 
        paddingBottom: '2rem',
        paddingLeft: '1rem',
        paddingRight: '1rem'
      }}>
        {/* Header */}
        <div className="mb-8" style={{ textAlign: isMobile ? 'center' : 'left' }}>
          <h1 className="titulo-2 mb-2" style={{ 
            fontSize: isMobile ? '1.75rem' : '2rem',
            marginBottom: isMobile ? '0.5rem' : '0.5rem'
          }}>
            Configuración de la Empresa
          </h1>
          <p className="texto-gris" style={{ 
            fontSize: isMobile ? '1rem' : '1.125rem'
          }}>
            Personaliza la información y apariencia de tu tienda online.
          </p>
        </div>

        <form onSubmit={guardarConfiguracion}>
          {/* Sistema de Pestañas */}
          <div className="mb-6" style={{ marginBottom: isMobile ? '1.5rem' : '1.5rem' }}>
            <div className="flex flex-wrap gap-2" style={{ 
              gap: isMobile ? '0.5rem' : '0.5rem',
              flexWrap: 'wrap',
              justifyContent: isMobile ? 'center' : 'flex-start'
            }}>
              {tabs.map((tab) => (
                <TabButton
                  key={tab.id}
                  icon={tab.icon}
                  label={tab.label}
                  isActive={activeTab === tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    // No mostrar toast al cambiar de pestaña
                  }}
                />
              ))}
            </div>
          </div>

          {/* Contenido de la Pestaña Activa */}
          <div className="tarjeta" style={{
            background: 'white',
            borderRadius: 'var(--radio-borde)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--color-borde)',
            overflow: 'hidden'
          }}>
            <div className="p-6" style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
              {renderTabContent()}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-4" style={{ 
            justifyContent: 'center', 
            paddingTop: '2rem',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '0.75rem' : '1rem'
          }}>
            <button
              type="submit"
              disabled={guardando}
              className="boton boton-primario"
              style={{ 
                opacity: guardando ? 0.7 : 1,
                minWidth: isMobile ? '100%' : '200px',
                padding: isMobile ? '0.75rem 1.5rem' : '0.75rem 2rem',
                fontSize: isMobile ? '0.875rem' : '1rem'
              }}
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
            <button
              type="button"
              onClick={manejarCancelar}
              className="boton boton-secundario"
              style={{ 
                minWidth: isMobile ? '100%' : '150px',
                padding: isMobile ? '0.75rem 1.5rem' : '0.75rem 2rem',
                fontSize: isMobile ? '0.875rem' : '1rem'
              }}
            >
              <span className="mr-2">❌</span>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 