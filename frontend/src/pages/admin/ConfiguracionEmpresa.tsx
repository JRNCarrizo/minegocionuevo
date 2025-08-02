import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useResponsive } from '../../hooks/useResponsive';
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
  preview = false 
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
  className = "",
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
  className?: string;
  description?: string;
}) => (
  <div className={`grupo-campo ${className}`}>
    <label className="etiqueta">
      {label} {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
    </label>
    {description && (
      <p className="texto-pequeno texto-gris" style={{ marginBottom: '0.5rem' }}>
        {description}
      </p>
    )}
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
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
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
    instagramUrl: '',
    facebookUrl: ''
  });

  const [empresaId, setEmpresaId] = useState<number | null>(null);
  
  // Estado para el logo actual de la empresa
  const [logoActual, setLogoActual] = useState<string>('');
  // Estado para la imagen de fondo actual de la empresa
  const [imagenFondoActual, setImagenFondoActual] = useState<string>('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [verificandoSubdominio, setVerificandoSubdominio] = useState(false);
  const [subdominioDisponible, setSubdominioDisponible] = useState<boolean | null>(null);
  
  // Estado para detectar cambios sin guardar
  const [configuracionOriginal, setConfiguracionOriginal] = useState<ConfiguracionEmpresa | null>(null);
  const [empresaNombre, setEmpresaNombre] = useState<string>('');
  const [nombreAdministrador, setNombreAdministrador] = useState<string>('');

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
      
      const nuevaConfiguracion = {
        ...configuracion,
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
        colorPrimario: empresa.colorPrimario || '#2563eb',
        colorSecundario: empresa.colorSecundario || '#64748b',
        colorAcento: empresa.colorAcento || '#f59e0b',
        colorFondo: empresa.colorFondo || '#ffffff',
        colorTexto: empresa.colorTexto || '#1f2937',
        colorTituloPrincipal: empresa.colorTituloPrincipal || '#1f2937',
        colorCardFiltros: empresa.colorCardFiltros || '#ffffff',
        imagenFondoUrl: empresa.imagenFondoUrl || '',
        moneda: empresa.moneda || 'ARS',
        instagramUrl: empresa.instagramUrl || '',
        facebookUrl: empresa.facebookUrl || ''
      };
      
      setConfiguracion(nuevaConfiguracion);
      // Guardar la configuración original para detectar cambios
      setConfiguracionOriginal({ ...nuevaConfiguracion });
      
      // Cargar el logo actual si existe
      if (empresa.logoUrl) {
        setLogoActual(empresa.logoUrl);
      } else {
        setLogoActual('');
      }
      
      // Cargar la imagen de fondo actual si existe
      if (empresa.imagenFondoUrl) {
        setImagenFondoActual(empresa.imagenFondoUrl);
      } else {
        setImagenFondoActual('');
      }
      
      if (mostrarToast) {
        toast.success('Configuración cargada correctamente');
      }
    } catch (error) {
      console.error('Error al cargar la configuración:', error);
      toast.error('Error al cargar la configuración de la empresa');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    // Obtener datos del usuario logueado
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setEmpresaNombre(user.empresaNombre || '');
        setNombreAdministrador(user.nombre || '');
        setEmpresaId(user.empresaId || null); // Asignar el ID de la empresa
      } catch (error) {
        console.error('Error al parsear datos del usuario:', error);
        // Si hay error, redirigir al login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/admin/login';
      }
    }
    
    cargarConfiguracion(false); // No mostrar toast al cargar la página
  }, [cargarConfiguracion]);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/admin/login';
  };

  const manejarCambio = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    console.log('🔄 Campo cambiado:', name, 'Valor:', value);
    
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

  const manejarImagenFondo = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('🖼️ Imagen de fondo seleccionada:', file.name);
      
      setConfiguracion(prev => ({
        ...prev,
        imagenFondo: file,
        // Crear URL temporal para vista previa inmediata
        imagenFondoUrl: URL.createObjectURL(file)
      }));
    }
  }, []);

  // Función para detectar si hay cambios sin guardar
  const hayCambiosSinGuardar = useCallback(() => {
    if (!configuracionOriginal) return false;
    
    // Comparar campos principales
    const camposPrincipales = [
      'nombre', 'descripcion', 'textoBienvenida', 'subdominio', 'email', 'telefono',
      'colorPrimario', 'colorSecundario', 'colorAcento', 'colorFondo', 'colorTexto',
      'colorTituloPrincipal', 'colorCardFiltros', 'moneda', 'instagramUrl', 'facebookUrl'
    ];
    
    for (const campo of camposPrincipales) {
      const valorActual = configuracion[campo as keyof ConfiguracionEmpresa];
      const valorOriginal = configuracionOriginal[campo as keyof ConfiguracionEmpresa];
      
      if (valorActual !== valorOriginal) {
        console.log('🔍 Cambio detectado en:', campo);
        console.log('  - Actual:', valorActual);
        console.log('  - Original:', valorOriginal);
        return true;
      }
    }
    
    // Verificar si hay un nuevo logo seleccionado
    if (configuracion.logo) {
      console.log('🔍 Cambio detectado: nuevo logo seleccionado');
      return true;
    }
    
    // Verificar si hay una nueva imagen de fondo seleccionada
    if (configuracion.imagenFondo) {
      console.log('🔍 Cambio detectado: nueva imagen de fondo seleccionada');
      return true;
    }
    
    console.log('🔍 No se detectaron cambios');
    return false;
  }, [configuracion, configuracionOriginal]);

  // Función para manejar el cancelar con confirmación
  const manejarCancelar = useCallback(() => {
    if (hayCambiosSinGuardar()) {
      const confirmar = window.confirm('¿Estás seguro de que quieres cancelar? Los cambios no guardados se perderán.');
      if (confirmar) {
        navigate('/admin/dashboard');
      }
    } else {
      navigate('/admin/dashboard');
    }
  }, [hayCambiosSinGuardar, navigate]);

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
    
    console.log('=== DEBUG GUARDAR CONFIGURACIÓN ===');
    console.log('Iniciando guardado de configuración...');
    
    if (!validarFormulario()) {
      console.log('❌ Validación del formulario falló');
      return;
    }

    console.log('✅ Validación del formulario exitosa');
    setGuardando(true);
    
    try {
      // PASO 1: Subir logo si hay uno nuevo
      let logoUrl = logoActual || '';
      if (configuracion.logo) {
        console.log('=== PASO 1: Subiendo logo ===');
        try {
          const logoResponse = await ApiService.subirLogoEmpresa(configuracion.logo);
          logoUrl = logoResponse.data?.logoUrl || '';
          console.log('✅ Logo subido exitosamente:', logoUrl);
        } catch (error: unknown) {
          console.error('❌ Error al subir logo:', error);
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.error || 'Error al subir el logo';
          toast.error(errorMessage);
          setGuardando(false);
          return;
        }
      }

      // PASO 2: Subir imagen de fondo si hay una nueva
      let imagenFondoUrl = configuracion.imagenFondoUrl || '';
      if (configuracion.imagenFondo) {
        console.log('=== PASO 2: Subiendo imagen de fondo ===');
        try {
          const fondoResponse = await ApiService.subirFondoEmpresa(configuracion.imagenFondo);
          imagenFondoUrl = fondoResponse.data?.fondoUrl || '';
          console.log('✅ Imagen de fondo subida exitosamente:', imagenFondoUrl);
          
          // ACTUALIZAR EL ESTADO CON LA URL REAL
          setConfiguracion(prev => ({
            ...prev,
            imagenFondoUrl: imagenFondoUrl,
            imagenFondo: null // Limpiar el archivo temporal
          }));
          
          // También actualizar la imagen actual
          setImagenFondoActual(imagenFondoUrl);
        } catch (error: unknown) {
          console.error('❌ Error al subir imagen de fondo:', error);
          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.error || 'Error al subir la imagen de fondo';
          toast.error(errorMessage);
          setGuardando(false);
          return;
        }
      }

      // PASO 3: Preparar datos de personalización
      const datosPersonalizacion = {
        logoUrl,
        descripcion: configuracion.descripcion,
        colorPrimario: configuracion.colorPrimario,
        colorSecundario: configuracion.colorSecundario,
        colorAcento: configuracion.colorAcento,
        colorFondo: configuracion.colorFondo,
        colorTexto: configuracion.colorTexto,
        colorTituloPrincipal: configuracion.colorTituloPrincipal,
        colorCardFiltros: configuracion.colorCardFiltros,
        imagenFondoUrl,
        instagramUrl: configuracion.instagramUrl,
        facebookUrl: configuracion.facebookUrl
      };
      console.log('📋 Datos de personalización a enviar:', datosPersonalizacion);
      console.log('📝 Descripción a enviar:', configuracion.descripcion);

      if (!empresaId) {
        toast.error('Error: No se pudo identificar la empresa');
        setGuardando(false);
        return;
      }

      // PASO 4: Guardar configuración completa de la empresa
      console.log('📋 Enviando configuración completa de la empresa...');
      console.log('📝 Descripción a enviar:', configuracion.descripcion);
      
      const datosEmpresa = {
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
        logoUrl,
        colorPrimario: configuracion.colorPrimario,
        colorSecundario: configuracion.colorSecundario,
        colorAcento: configuracion.colorAcento,
        colorFondo: configuracion.colorFondo,
        colorTexto: configuracion.colorTexto,
        colorTituloPrincipal: configuracion.colorTituloPrincipal,
        colorCardFiltros: configuracion.colorCardFiltros,
        imagenFondoUrl,
        moneda: configuracion.moneda,
        instagramUrl: configuracion.instagramUrl,
        facebookUrl: configuracion.facebookUrl
      };
      
      console.log('📋 Datos completos de la empresa a enviar:', datosEmpresa);
      console.log('👋 Texto de bienvenida a enviar:', configuracion.textoBienvenida);
      console.log('👋 Texto de bienvenida es null?:', configuracion.textoBienvenida === null);
      console.log('👋 Texto de bienvenida es undefined?:', configuracion.textoBienvenida === undefined);
      console.log('👋 Texto de bienvenida está vacío?:', configuracion.textoBienvenida === '');
      console.log('👋 Longitud del texto de bienvenida:', configuracion.textoBienvenida?.length);
      
      const response = await ApiService.actualizarEmpresaAdmin(datosEmpresa);
      console.log('✅ Respuesta del servidor:', response);
      toast.success('Configuración guardada correctamente');
      cargarConfiguracion(false);
    } catch (error: unknown) {
      console.error('❌ Error al guardar configuración:', error);
      const apiError = error as ApiError;
      const errorMessage = apiError.response?.data?.error || apiError.response?.data?.mensaje || apiError.message || 'Error al guardar la configuración';
      toast.error(errorMessage);
    } finally {
      setGuardando(false);
      console.log('=== FIN DEBUG GUARDAR CONFIGURACIÓN ===');
    }
  };

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

  if (cargando) {
    return (
      <div className="h-pantalla-minimo pagina-con-navbar" style={{ backgroundColor: 'var(--color-fondo)' }}>
        <NavbarAdmin 
          onCerrarSesion={cerrarSesion}
          empresaNombre={empresaNombre}
          nombreAdministrador={nombreAdministrador}
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
        empresaNombre={empresaNombre}
        nombreAdministrador={nombreAdministrador}
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

        <form onSubmit={guardarConfiguracion} className="space-y-8">
          {/* ============================================
              1. INFORMACIÓN BÁSICA Y CONTACTO
          ============================================ */}
          <div className="tarjeta">
            <div className="p-6 border-bottom" style={{ 
              borderBottom: '1px solid var(--color-borde)', 
              backgroundColor: 'var(--color-fondo-hover)',
              padding: isMobile ? '1rem' : '1.5rem'
            }}>
              <div className="flex items-centro" style={{ 
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '0.5rem' : '0.75rem',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                <span style={{ fontSize: isMobile ? '2rem' : '1.5rem', marginRight: isMobile ? '0' : '0.75rem' }}>🏢</span>
                <div>
                  <h3 className="titulo-3" style={{ 
                    marginBottom: '0.25rem',
                    fontSize: isMobile ? '1.25rem' : '1.5rem'
                  }}>
                    Información Básica y Contacto
                  </h3>
                  <p className="texto-gris" style={{ fontSize: '0.875rem', margin: 0 }}>
                    Configura los datos principales de tu empresa e información de contacto
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6" style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
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

          {/* ============================================
              2. REDES SOCIALES
          ============================================ */}
          <div className="tarjeta">
            <div className="p-6 border-bottom" style={{ 
              borderBottom: '1px solid var(--color-borde)', 
              backgroundColor: 'var(--color-fondo-hover)',
              padding: isMobile ? '1rem' : '1.5rem'
            }}>
              <div className="flex items-centro" style={{ 
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '0.5rem' : '0.75rem',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                <span style={{ fontSize: isMobile ? '2rem' : '1.5rem', marginRight: isMobile ? '0' : '0.75rem' }}>📱</span>
                <div>
                  <h3 className="titulo-3" style={{ 
                    marginBottom: '0.25rem',
                    fontSize: isMobile ? '1.25rem' : '1.5rem'
                  }}>
                    Redes Sociales
                  </h3>
                  <p className="texto-gris" style={{ fontSize: '0.875rem', margin: 0 }}>
                    Conecta con tus clientes a través de tus redes sociales
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6" style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
              <p className="texto-gris" style={{ 
                marginBottom: '1rem',
                fontSize: isMobile ? '0.875rem' : '1rem',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                Agrega los enlaces a tus redes sociales para que aparezcan en el catálogo público de tu tienda.
              </p>
              
              <div className="grid grid-2" style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gap: isMobile ? '1rem' : '1.5rem'
              }}>
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

          {/* ============================================
              3. CARD DE PRESENTACIÓN
          ============================================ */}
          <div className="tarjeta">
            <div className="p-6 border-bottom" style={{ 
              borderBottom: '1px solid var(--color-borde)', 
              backgroundColor: 'var(--color-fondo-hover)',
              padding: isMobile ? '1rem' : '1.5rem'
            }}>
              <div className="flex items-centro" style={{ 
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '0.5rem' : '0.75rem',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                <span style={{ fontSize: isMobile ? '2rem' : '1.5rem', marginRight: isMobile ? '0' : '0.75rem' }}>🎨</span>
                <div>
                  <h3 className="titulo-3" style={{ 
                    marginBottom: '0.25rem',
                    fontSize: isMobile ? '1.25rem' : '1.5rem'
                  }}>
                    Card de Presentación
                  </h3>
                  <p className="texto-gris" style={{ fontSize: '0.875rem', margin: 0 }}>
                    Personaliza el logo, título de bienvenida y descripción que aparecerán en el catálogo público
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6" style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
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
              <p className="texto-pequeno texto-gris" style={{ marginTop: '-0.5rem', marginBottom: '1rem' }}>
                💡 <strong>Guía:</strong> Este será el título principal que aparecerá en la tarjeta de presentación de tu tienda.
              </p>

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
              <p className="texto-pequeno texto-gris" style={{ marginTop: '-0.5rem', marginBottom: '1rem' }}>
                💡 <strong>Guía:</strong> Este texto aparecerá debajo del título de bienvenida en la tarjeta de presentación. Puede ser un eslogan, contenido adicional o descripción breve de tu negocio.
              </p>

              {/* Imagen de fondo para la card de presentación */}
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
                  La imagen aparecerá como fondo en la tarjeta de presentación de la empresa (logo, título y descripción) del catálogo público. 
                  Formatos recomendados: JPG, PNG. Tamaño máximo: 2MB.
                </p>
              </div>
            </div>
          </div>

          {/* ============================================
              4. PERSONALIZACIÓN DE COLORES
          ============================================ */}
          <div className="tarjeta">
            <div className="p-6 border-bottom" style={{ 
              borderBottom: '1px solid var(--color-borde)', 
              backgroundColor: 'var(--color-fondo-hover)',
              padding: isMobile ? '1rem' : '1.5rem'
            }}>
              <div className="flex items-centro" style={{ 
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '0.5rem' : '0.75rem',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                <span style={{ fontSize: isMobile ? '2rem' : '1.5rem', marginRight: isMobile ? '0' : '0.75rem' }}>🎨</span>
                <h3 className="titulo-3" style={{ 
                  marginBottom: '0',
                  fontSize: isMobile ? '1.25rem' : '1.5rem'
                }}>
                  Personalización de Colores
                </h3>
              </div>
            </div>
            <div className="p-6" style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
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
                          : imagenFondoActual
                            ? `url(${imagenFondoActual})`
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

          {/* Configuración de Notificaciones */}
          <div className="tarjeta">
            <div className="p-6 border-bottom" style={{ 
              borderBottom: '1px solid var(--color-borde)', 
              backgroundColor: 'var(--color-fondo-hover)',
              padding: isMobile ? '1rem' : '1.5rem'
            }}>
              <div className="flex items-centro" style={{ 
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '0.5rem' : '0.75rem',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                <span style={{ fontSize: isMobile ? '2rem' : '1.5rem', marginRight: isMobile ? '0' : '0.75rem' }}>🔔</span>
                <h3 className="titulo-3" style={{ 
                  marginBottom: '0',
                  fontSize: isMobile ? '1.25rem' : '1.5rem'
                }}>
                  Notificaciones
                </h3>
              </div>
            </div>
            <div className="p-6 space-y-6" style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
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

          {/* Configuración del Catálogo */}
          <div className="tarjeta">
            <div className="p-6 border-bottom" style={{ 
              borderBottom: '1px solid var(--color-borde)', 
              backgroundColor: 'var(--color-fondo-hover)',
              padding: isMobile ? '1rem' : '1.5rem'
            }}>
              <div className="flex items-centro" style={{ 
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '0.5rem' : '0.75rem',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                <span style={{ fontSize: isMobile ? '2rem' : '1.5rem', marginRight: isMobile ? '0' : '0.75rem' }}>🛍️</span>
                <h3 className="titulo-3" style={{ 
                  marginBottom: '0',
                  fontSize: isMobile ? '1.25rem' : '1.5rem'
                }}>
                  Configuración del Catálogo
                </h3>
              </div>
            </div>
            <div className="p-6 space-y-6" style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
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
