import { useState, useEffect, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import LimitService from '../../services/limitService';
import GestorImagenes from '../../components/GestorImagenes';
import BarcodeScanner from '../../components/BarcodeScanner';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
import '../../styles/gestor-imagenes.css';
import Barcode from 'react-barcode';

// Componente de campo de formulario optimizado con memo
const CampoFormulario = memo(({ 
  label, 
  name, 
  type = 'text', 
  placeholder, 
  required = false, 
  error,
  value,
  onChange,
  onSelectChange,
  onNuevaCategoria,
  mostrarNuevaCategoria,
  nuevaCategoria,
  setNuevaCategoria,
  categorias,
  mostrarSugerenciasMarca,
  marcasFiltradas,
  seleccionarMarca,
  ...props 
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSelectChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onNuevaCategoria: (e: React.KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => void;
  mostrarNuevaCategoria: boolean;
  nuevaCategoria: string;
  setNuevaCategoria: (value: string) => void;
  categorias: string[];
  mostrarSugerenciasMarca?: boolean;
  marcasFiltradas?: string[];
  seleccionarMarca?: (marca: string) => void;
  [key: string]: unknown;
}) => (
  <div className="campo-grupo" style={{ position: 'relative' }}>
    <label htmlFor={name} className="campo-label">
      {label} {required && <span className="campo-requerido">*</span>}
    </label>
    {type === 'textarea' ? (
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`campo-input ${error ? 'campo-error' : ''}`}
        placeholder={placeholder}
        {...props}
      />
    ) : type === 'select' ? (
      <>
        <select
          id={name}
          name={name}
          value={value}
          onChange={onSelectChange}
          className={`campo-input ${error ? 'campo-error' : ''}`}
          {...props}
        >
          <option value="">Selecciona una opción</option>
          {categorias.map(categoria => (
            <option key={categoria} value={categoria}>
              {categoria}
            </option>
          ))}
          <option value="__nueva__">+ Agregar nueva categoría</option>
        </select>
        {mostrarNuevaCategoria && (
          <input
            type="text"
            placeholder="Escribe el nombre de la nueva categoría"
            className="campo-input"
            value={nuevaCategoria}
            onChange={(e) => setNuevaCategoria(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onNuevaCategoria(e);
              }
            }}
            onBlur={onNuevaCategoria}
            autoFocus
          />
        )}
      </>
    ) : (
      <>
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className={`campo-input ${error ? 'campo-error' : ''}`}
          placeholder={placeholder}
          {...props}
        />
        {mostrarSugerenciasMarca && marcasFiltradas && seleccionarMarca && (
          <div className="sugerencias-marca">
            {marcasFiltradas.map((marca, index) => (
              <div
                key={index}
                className="sugerencia-marca"
                onClick={() => seleccionarMarca(marca)}
              >
                {marca}
              </div>
            ))}
          </div>
        )}
      </>
    )}
    {error && <div className="campo-mensaje-error">{error}</div>}
  </div>
));

export default function NuevoProducto() {
  const navigate = useNavigate();
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile } = useResponsive();

  // Función para reproducir el sonido "pi"
  const playBeepSound = () => {
    try {
      // Crear un contexto de audio
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // Crear un oscilador para generar el tono
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Configurar el tono (frecuencia de 800Hz para un "pi" agudo)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      // Configurar el volumen y la duración
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      // Conectar los nodos
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Reproducir el sonido
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.log('No se pudo reproducir el sonido:', error);
    }
  };
  
  // Usuario logueado
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const empresaId = user.empresaId;
  
  const [formulario, setFormulario] = useState({
    nombre: '',
    marca: '',
    descripcion: '',
    precio: '',
    stock: '',
    stockMinimo: '5',
    unidad: '',
    categoria: '',
    sectorAlmacenamiento: '',
    codigoPersonalizado: '',
    codigoBarras: '',
    imagenes: [] as string[]
  });
  const [cargando, setCargando] = useState(false);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [pasoActual, setPasoActual] = useState(1);
  const [errores, setErrores] = useState<{[key: string]: string}>({});
  const [mostrarNuevaCategoria, setMostrarNuevaCategoria] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [marcas, setMarcas] = useState<string[]>([]);
  const [marcasFiltradas, setMarcasFiltradas] = useState<string[]>([]);
  const [mostrarSugerenciasMarca, setMostrarSugerenciasMarca] = useState(false);
  const [sectoresAlmacenamiento, setSectoresAlmacenamiento] = useState<string[]>([]);
  const [sectoresFiltrados, setSectoresFiltrados] = useState<string[]>([]);
  const [mostrarSugerenciasSector, setMostrarSugerenciasSector] = useState(false);
  const [codigosPersonalizados, setCodigosPersonalizados] = useState<string[]>([]);
  const [codigosFiltrados, setCodigosFiltrados] = useState<string[]>([]);
  const [mostrarSugerenciasCodigo, setMostrarSugerenciasCodigo] = useState(false);
  const [mostrarScanner, setMostrarScanner] = useState(false);

  const cargarCategorias = useCallback(async () => {
    try {
      const response = await ApiService.obtenerCategorias(empresaId);
      if (response.data) {
        setCategorias(response.data);
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  }, [empresaId]);

  const cargarMarcas = useCallback(async () => {
    try {
      const response = await ApiService.obtenerMarcas(empresaId);
      if (response.data) {
        setMarcas(response.data);
      }
    } catch (error) {
      console.error('Error al cargar marcas:', error);
    }
  }, [empresaId]);

  const cargarSectoresAlmacenamiento = useCallback(async () => {
    try {
      const response = await ApiService.obtenerSectoresAlmacenamiento(empresaId);
      if (response.data) {
        setSectoresAlmacenamiento(response.data);
      }
    } catch (error) {
      console.error('Error al cargar sectores de almacenamiento:', error);
    }
  }, [empresaId]);

  const cargarCodigosPersonalizados = useCallback(async () => {
    try {
      const response = await ApiService.obtenerCodigosPersonalizados(empresaId);
      if (response.data) {
        setCodigosPersonalizados(response.data);
      }
    } catch (error) {
      console.error('Error al cargar códigos personalizados:', error);
    }
  }, [empresaId]);

  const manejarCambioMarca = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormulario(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    setErrores(prev => {
      const nuevosErrores = { ...prev };
      delete nuevosErrores[name];
      return nuevosErrores;
    });
    
    // Filtrar marcas que coincidan con lo que se está escribiendo
    if (value.trim()) {
      const filtradas = marcas.filter(marca => 
        marca.toLowerCase().includes(value.toLowerCase())
      );
      setMarcasFiltradas(filtradas);
      setMostrarSugerenciasMarca(filtradas.length > 0);
    } else {
      setMarcasFiltradas([]);
      setMostrarSugerenciasMarca(false);
    }
  }, [marcas]);

  const seleccionarMarca = useCallback((marca: string) => {
    setFormulario(prev => ({
      ...prev,
      marca
    }));
    setMarcasFiltradas([]);
    setMostrarSugerenciasMarca(false);
  }, []);

  const manejarCambioSectorAlmacenamiento = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { value } = e.target;
    setFormulario(prev => ({ ...prev, sectorAlmacenamiento: value }));
    
    // Filtrar sectores que coincidan con lo que está escribiendo
    if (value.trim()) {
      const filtrados = sectoresAlmacenamiento.filter(sector =>
        sector.toLowerCase().includes(value.toLowerCase())
      );
      setSectoresFiltrados(filtrados);
      setMostrarSugerenciasSector(filtrados.length > 0);
    } else {
      setMostrarSugerenciasSector(false);
    }
    
    // Limpiar error del campo
    setErrores(prev => {
      const nuevosErrores = { ...prev };
      delete nuevosErrores.sectorAlmacenamiento;
      return nuevosErrores;
    });
  }, [sectoresAlmacenamiento]);

  const seleccionarSector = useCallback((sector: string) => {
    setFormulario(prev => ({ ...prev, sectorAlmacenamiento: sector }));
    setMostrarSugerenciasSector(false);
  }, []);

  const manejarCambioCodigoPersonalizado = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { value } = e.target;
    setFormulario(prev => ({ ...prev, codigoPersonalizado: value }));
    
    // Filtrar códigos que coincidan con lo que está escribiendo
    if (value.trim()) {
      const filtrados = codigosPersonalizados.filter(codigo =>
        codigo.toLowerCase().includes(value.toLowerCase())
      );
      setCodigosFiltrados(filtrados);
      setMostrarSugerenciasCodigo(filtrados.length > 0);
    } else {
      setMostrarSugerenciasCodigo(false);
    }
    
    // Limpiar error del campo
    setErrores(prev => {
      const nuevosErrores = { ...prev };
      delete nuevosErrores.codigoPersonalizado;
      return nuevosErrores;
    });
  }, [codigosPersonalizados]);

  const seleccionarCodigo = useCallback((codigo: string) => {
    setFormulario(prev => ({ ...prev, codigoPersonalizado: codigo }));
    setMostrarSugerenciasCodigo(false);
  }, []);

  const manejarEscaneoBarras = useCallback((codigoBarras: string) => {
    // Reproducir sonido "pi"
    playBeepSound();
    setFormulario(prev => ({ ...prev, codigoBarras }));
    setMostrarScanner(false);
  }, []);

  const abrirScanner = useCallback(() => {
    setMostrarScanner(true);
  }, []);

  const generarCodigoBarras = useCallback(async () => {
    try {
      if (!empresaId) {
        toast.error('Error: No se encontró la empresa asociada');
        return;
      }
      const response = await ApiService.generarCodigoBarras(empresaId);
      if (
        response &&
        typeof response === 'object' &&
        'data' in response &&
        response.data &&
        typeof response.data === 'object' &&
        'codigoBarras' in response.data &&
        typeof (response.data as { codigoBarras?: string }).codigoBarras === 'string' &&
        (response.data as { codigoBarras?: string }).codigoBarras
      ) {
        setFormulario(prev => ({ ...prev, codigoBarras: (response.data as { codigoBarras: string }).codigoBarras }));
        toast.success('Código de barras generado exitosamente');
      }
    } catch (error) {
      console.error('Error al generar código de barras:', error);
      toast.error('Error al generar código de barras');
    }
  }, [empresaId]);

  useEffect(() => {
    cargarCategorias();
    cargarMarcas();
    cargarSectoresAlmacenamiento();
    cargarCodigosPersonalizados();
  }, [cargarCategorias, cargarMarcas, cargarSectoresAlmacenamiento, cargarCodigosPersonalizados]);

  const manejarCambio = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormulario(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    setErrores(prev => {
      const nuevosErrores = { ...prev };
      delete nuevosErrores[name];
      return nuevosErrores;
    });
  }, []);

  const manejarCambioSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (value === '__nueva__') {
      // Si selecciona "agregar nueva categoría", mostrar el input
      setMostrarNuevaCategoria(true);
      setNuevaCategoria('');
      return;
    }
    
    setMostrarNuevaCategoria(false);
    setFormulario(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo
    setErrores(prev => {
      const nuevosErrores = { ...prev };
      delete nuevosErrores[name];
      return nuevosErrores;
    });
  }, []);

  const manejarNuevaCategoria = useCallback((e: React.KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value.trim();
    
    if (value) {
      // Agregar la nueva categoría si no existe
      if (!categorias.includes(value)) {
        setCategorias(prev => [...prev, value]);
      }
      setFormulario(prev => ({ ...prev, categoria: value }));
      setMostrarNuevaCategoria(false);
    } else {
      setMostrarNuevaCategoria(false);
      setFormulario(prev => ({ ...prev, categoria: '' }));
    }
  }, [categorias]);

  const manejarCambioImagenes = useCallback((imagenes: string[]) => {
    setFormulario(prev => ({
      ...prev,
      imagenes
    }));
  }, []);

  const validarPaso = (paso: number): boolean => {
    const nuevosErrores: {[key: string]: string} = {};

    if (paso === 1) {
      if (!formulario.nombre.trim()) {
        nuevosErrores.nombre = 'El nombre del producto es obligatorio';
      }
      if (!formulario.precio || isNaN(Number(formulario.precio)) || Number(formulario.precio) <= 0) {
        nuevosErrores.precio = 'El precio debe ser un número válido mayor a 0';
      }
      if (!formulario.categoria) {
        nuevosErrores.categoria = 'Selecciona una categoría';
      }
    }

    if (paso === 2) {
      if (!formulario.stock || isNaN(Number(formulario.stock)) || Number(formulario.stock) < 0) {
        nuevosErrores.stock = 'El stock debe ser un número válido mayor o igual a 0';
      }
      if (!formulario.stockMinimo || isNaN(Number(formulario.stockMinimo)) || Number(formulario.stockMinimo) < 0) {
        nuevosErrores.stockMinimo = 'El stock mínimo debe ser un número válido mayor o igual a 0';
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const siguientePaso = () => {
    if (validarPaso(pasoActual)) {
      setPasoActual(pasoActual + 1);
    }
  };

  const pasoAnterior = () => {
    setPasoActual(pasoActual - 1);
  };

  const validarFormulario = () => {
    return validarPaso(1) && validarPaso(2);
  };

  const enviarFormulario = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      toast.error('Por favor, corrige los errores en el formulario');
      return;
    }

    setCargando(true);
    
    try {
      if (!empresaId) {
        toast.error('Error: No se encontró la empresa asociada');
        return;
      }

      // Verificar límites antes de crear el producto
      console.log('🔍 Verificando límites antes de crear producto...');
      const canProceed = await LimitService.checkLimitsBeforeAction('addProduct');
      
      if (!canProceed) {
        console.log('❌ Límite de productos alcanzado');
        setCargando(false);
        return;
      }

      console.log('✅ Límites verificados, procediendo a crear producto...');

      const datosProducto = {
        nombre: formulario.nombre.trim(),
        descripcion: formulario.descripcion.trim() || undefined,
        precio: Number(formulario.precio),
        stock: Number(formulario.stock),
        stockMinimo: Number(formulario.stockMinimo),
        categoria: formulario.categoria || undefined,
        marca: formulario.marca.trim() || undefined,
        unidad: formulario.unidad.trim() || undefined,
        sectorAlmacenamiento: formulario.sectorAlmacenamiento.trim() || undefined,
        codigoPersonalizado: formulario.codigoPersonalizado.trim() || undefined,
        codigoBarras: formulario.codigoBarras.trim() || undefined,
        activo: true,
        destacado: false,
        imagenes: formulario.imagenes
      };

      console.log('Creando producto:', datosProducto);
      
      const response = await ApiService.crearProducto(empresaId, datosProducto);
      
      if (response && (response.data || ('id' in response && response.id))) {
        toast.success('✅ Producto creado exitosamente');
        navigate('/admin/productos');
      } else {
        toast.error('Error: No se recibió respuesta del servidor');
      }
    } catch (error: unknown) {
      console.error('Error al crear producto:', error);
      
      let mensajeError = 'Error al crear el producto';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown; statusText?: string } };
        
        if (axiosError.response?.status === 403) {
          mensajeError = 'No tienes permisos para crear productos';
        } else if (axiosError.response?.status === 401) {
          mensajeError = 'Tu sesión ha expirado';
        } else if (axiosError.response?.status === 400) {
          mensajeError = 'Datos del producto inválidos';
        } else if (axiosError.response?.status === 500) {
          mensajeError = 'Error interno del servidor';
        } else {
          mensajeError = `Error ${axiosError.response?.status}: ${axiosError.response?.statusText}`;
        }
      }
      
      toast.error(mensajeError);
    } finally {
      setCargando(false);
    }
  };

  const descargarCodigoBarras = (elementId: string) => {
    console.log('🔍 Descargando código de barras...', elementId);
    
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('❌ Elemento no encontrado:', elementId);
      alert('No se pudo encontrar el código de barras');
      return;
    }
    
    const svg = element.querySelector('svg');
    if (!svg) {
      console.error('❌ SVG no encontrado en el elemento');
      alert('No se pudo generar el código de barras');
      return;
    }
    
    try {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      console.log('✅ SVG serializado correctamente');
      
      const canvas = document.createElement('canvas');
      const img = new window.Image();
      
      img.onload = function () {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const png = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = png;
            a.download = `codigo_barras_${formulario.codigoBarras || 'producto'}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            console.log('✅ Código de barras descargado exitosamente');
          }
        } catch (error) {
          console.error('❌ Error al generar PNG:', error);
          alert('Error al generar la imagen del código de barras');
        }
      };
      
      img.onerror = function() {
        console.error('❌ Error al cargar la imagen SVG');
        alert('Error al procesar el código de barras');
      };
      
      img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgString)));
    } catch (error) {
      console.error('❌ Error al serializar SVG:', error);
      alert('Error al procesar el código de barras');
    }
  };

  const imprimirCodigoBarras = (elementId: string) => {
    console.log('🔍 Imprimiendo código de barras...', elementId);
    
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('❌ Elemento no encontrado:', elementId);
      alert('No se pudo encontrar el código de barras');
      return;
    }
    
    const svg = element.querySelector('svg');
    if (!svg) {
      console.error('❌ SVG no encontrado en el elemento');
      alert('No se pudo generar el código de barras');
      return;
    }
    
    try {
      const w = window.open('', 'Imprimir código de barras');
      if (w) {
        w.document.write(`
          <html>
            <head>
              <title>Imprimir código de barras</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  font-family: Arial, sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                }
                .barcode-container {
                  text-align: center;
                  border: 1px solid #ccc;
                  padding: 20px;
                  border-radius: 8px;
                  background: white;
                }
                .barcode-title {
                  font-size: 18px;
                  font-weight: bold;
                  margin-bottom: 10px;
                  color: #333;
                }
                .barcode-code {
                  font-size: 14px;
                  color: #666;
                  margin-top: 10px;
                }
                svg {
                  max-width: 100%;
                  height: auto;
                }
              </style>
            </head>
            <body>
              <div class="barcode-container">
                <div class="barcode-title">Código de Barras del Producto</div>
                ${svg.outerHTML}
                <div class="barcode-code">Código: ${formulario.codigoBarras || 'N/A'}</div>
              </div>
            </body>
          </html>
        `);
        w.document.close();
        w.focus();
        
        setTimeout(() => {
          w.print();
          w.close();
          console.log('✅ Código de barras enviado a impresión');
        }, 500);
      } else {
        console.error('❌ No se pudo abrir la ventana de impresión');
        alert('No se pudo abrir la ventana de impresión. Verifica que el bloqueador de ventanas emergentes esté desactivado.');
      }
    } catch (error) {
      console.error('❌ Error al imprimir:', error);
      alert('Error al imprimir el código de barras');
    }
  };


  return (
    <div className="pagina-crear-producto">
      <NavbarAdmin
        onCerrarSesion={cerrarSesion}
        empresaNombre={datosUsuario?.empresaNombre}
        nombreAdministrador={datosUsuario?.nombre}
      />

      <div className="contenedor-principal" style={{ 
        paddingTop: (isMobile || window.innerWidth < 768) ? '10.5rem' : '5rem', 
        paddingBottom: '2rem',
        paddingLeft: '1rem',
        paddingRight: '1rem'
      }}>
        <div className="contenido-formulario">
          {/* Header del formulario */}
          <div className="header-formulario">
            <div className="header-info" style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'center'
              }}>
                📦
              </div>
              <h1 className="titulo-formulario" style={{ margin: 0 }}>
                Crear Nuevo Producto
              </h1>
              <p className="subtitulo-formulario">
                Completa la información del producto para añadirlo a tu catálogo
              </p>
            </div>
            
            {/* Indicador de pasos */}
            <div className="indicador-pasos">
              <div className={`paso ${pasoActual >= 1 ? 'activo' : ''}`}>
                <div className="paso-numero">1</div>
                <span className="paso-texto">Información Básica</span>
              </div>
              <div className={`paso ${pasoActual >= 2 ? 'activo' : ''}`}>
                <div className="paso-numero">2</div>
                <span className="paso-texto">Inventario</span>
              </div>
              <div className={`paso ${pasoActual >= 3 ? 'activo' : ''}`}>
                <div className="paso-numero">3</div>
                <span className="paso-texto">Imágenes</span>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="tarjeta-formulario">
            <form onSubmit={enviarFormulario}>
              {/* Paso 1: Información Básica */}
              {pasoActual === 1 && (
                <div className="paso-contenido">
                  <div className="paso-header">
                    <h2 className="paso-titulo">📝 Información Básica del Producto</h2>
                    <p className="paso-descripcion">
                      Define los datos principales que identifican tu producto
                    </p>
                  </div>

                  <div className="campos-formulario">
                    <CampoFormulario
                      label="Nombre del Producto"
                      name="nombre"
                      placeholder="Ej: Camiseta Básica de Algodón"
                      required
                      error={errores.nombre}
                      value={formulario.nombre}
                      onChange={manejarCambio}
                      onSelectChange={manejarCambioSelect}
                      onNuevaCategoria={manejarNuevaCategoria}
                      mostrarNuevaCategoria={mostrarNuevaCategoria}
                      nuevaCategoria={nuevaCategoria}
                      setNuevaCategoria={setNuevaCategoria}
                      categorias={categorias}
                    />

                    <div className="campos-fila">
                      <CampoFormulario
                        label="Marca"
                        name="marca"
                        placeholder="Ej: Nike, Apple, Samsung..."
                        error={errores.marca}
                        value={formulario.marca}
                        onChange={manejarCambioMarca}
                        onSelectChange={manejarCambioSelect}
                        onNuevaCategoria={manejarNuevaCategoria}
                        mostrarNuevaCategoria={mostrarNuevaCategoria}
                        nuevaCategoria={nuevaCategoria}
                        setNuevaCategoria={setNuevaCategoria}
                        categorias={categorias}
                        mostrarSugerenciasMarca={mostrarSugerenciasMarca}
                        marcasFiltradas={marcasFiltradas}
                        seleccionarMarca={seleccionarMarca}
                      />
                      <div className="campo-grupo" style={{ position: 'relative' }}>
                        <label htmlFor="codigoPersonalizado" className="campo-label">
                          Código Personalizado <span className="campo-opcional">(Opcional)</span>
                        </label>
                        <input
                          type="text"
                          id="codigoPersonalizado"
                          name="codigoPersonalizado"
                          value={formulario.codigoPersonalizado}
                          onChange={manejarCambioCodigoPersonalizado}
                          className="campo-input"
                          placeholder="Ej: 330, 420, EL001, ROP001"
                        />
                        {mostrarSugerenciasCodigo && codigosFiltrados && (
                          <div className="sugerencias-marca">
                            {codigosFiltrados.map((codigo, index) => (
                              <div
                                key={index}
                                className="sugerencia-marca"
                                onClick={() => seleccionarCodigo(codigo)}
                              >
                                {codigo}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="codigoBarras" style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#374151',
                          marginBottom: '8px'
                        }}>
                          Código de Barras
                        </label>
                        <div style={{
                          display: 'flex',
                          flexDirection: isMobile ? 'column' : 'row',
                          gap: '8px',
                          alignItems: isMobile ? 'stretch' : 'center',
                          width: '100%'
                        }}>
                          <input
                            type="text"
                            id="codigoBarras"
                            value={formulario.codigoBarras}
                            onChange={manejarCambio}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              padding: '12px 16px',
                              border: '2px solid #e2e8f0',
                              borderRadius: '8px',
                              fontSize: '16px',
                              transition: 'all 0.2s ease',
                              minHeight: '44px',
                              maxWidth: '100%'
                            }}
                            placeholder="Ej: 1234567890123"
                            onFocus={(e) => {
                              e.target.style.borderColor = '#3b82f6';
                              e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = '#e2e8f0';
                              e.target.style.boxShadow = 'none';
                            }}
                          />
                          <div style={{
                            display: 'flex',
                            flexDirection: isMobile ? 'row' : 'row',
                            gap: '8px',
                            marginTop: isMobile ? '8px' : 0
                          }}>
                            <button
                              type="button"
                              onClick={abrirScanner}
                              style={{
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '10px',
                                cursor: 'pointer',
                                fontSize: '18px',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '44px',
                                minHeight: '44px',
                                transition: 'all 0.2s ease'
                              }}
                              title="Escanear código de barras"
                            >
                              📷
                            </button>
                            <button
                              type="button"
                              onClick={generarCodigoBarras}
                              style={{
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '10px',
                                cursor: 'pointer',
                                fontSize: '18px',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '44px',
                                minHeight: '44px',
                                transition: 'all 0.2s ease'
                              }}
                              title="Generar código de barras automáticamente"
                            >
                              🔄
                            </button>
                          </div>
                        </div>
                        {formulario.codigoBarras && (
                          <div style={{
                            marginTop: '16px',
                            textAlign: 'center',
                            width: '100%',
                            maxWidth: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: isMobile ? '0 10px' : '0'
                          }}>
                            <div 
                              id="barcode-preview-nuevo"
                              style={{
                                display: 'flex',
                                justifyContent: 'center',
                                width: '100%',
                                maxWidth: isMobile ? 280 : 350,
                                margin: '0 auto'
                              }}
                            >
                              <Barcode
                                value={formulario.codigoBarras}
                                width={isMobile ? 1 : 2}
                                height={isMobile ? 50 : 80}
                                displayValue
                              />
                            </div>
                            <div style={{
                              marginTop: '10px',
                              display: 'flex',
                              gap: '8px',
                              justifyContent: 'center',
                              flexWrap: 'wrap',
                              width: '100%'
                            }}>
                              <button type="button" onClick={() => descargarCodigoBarras('barcode-preview-nuevo')} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease' }}>💾 Descargar</button>
                              <button type="button" onClick={() => imprimirCodigoBarras('barcode-preview-nuevo')} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease' }}>🖨️ Imprimir</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <CampoFormulario
                      label="Categoría"
                      name="categoria"
                      type="select"
                      required
                      error={errores.categoria}
                      value={formulario.categoria}
                      onChange={manejarCambio}
                      onSelectChange={manejarCambioSelect}
                      onNuevaCategoria={manejarNuevaCategoria}
                      mostrarNuevaCategoria={mostrarNuevaCategoria}
                      nuevaCategoria={nuevaCategoria}
                      setNuevaCategoria={setNuevaCategoria}
                      categorias={categorias}
                    />

                    <CampoFormulario
                      label="Descripción"
                      name="descripcion"
                      type="textarea"
                      placeholder="Describe las características, beneficios y detalles del producto..."
                      rows={4}
                      error={errores.descripcion}
                      value={formulario.descripcion}
                      onChange={manejarCambio}
                      onSelectChange={manejarCambioSelect}
                      onNuevaCategoria={manejarNuevaCategoria}
                      mostrarNuevaCategoria={mostrarNuevaCategoria}
                      nuevaCategoria={nuevaCategoria}
                      setNuevaCategoria={setNuevaCategoria}
                      categorias={categorias}
                    />

                    <div className="campos-fila">
                      <CampoFormulario
                        label="Precio"
                        name="precio"
                        type="number"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                        error={errores.precio}
                        value={formulario.precio}
                        onChange={manejarCambio}
                        onSelectChange={manejarCambioSelect}
                        onNuevaCategoria={manejarNuevaCategoria}
                        mostrarNuevaCategoria={mostrarNuevaCategoria}
                        nuevaCategoria={nuevaCategoria}
                        setNuevaCategoria={setNuevaCategoria}
                        categorias={categorias}
                      />
                      <CampoFormulario
                        label="Unidad"
                        name="unidad"
                        placeholder="Ej: kg, litro, unidad, par..."
                        error={errores.unidad}
                        value={formulario.unidad}
                        onChange={manejarCambio}
                        onSelectChange={manejarCambioSelect}
                        onNuevaCategoria={manejarNuevaCategoria}
                        mostrarNuevaCategoria={mostrarNuevaCategoria}
                        nuevaCategoria={nuevaCategoria}
                        setNuevaCategoria={setNuevaCategoria}
                        categorias={categorias}
                      />
                    </div>
                  </div>

                  <div className="botones-paso">
                    <button
                      type="button"
                      onClick={siguientePaso}
                      className="boton-siguiente"
                      disabled={!formulario.nombre || !formulario.precio || !formulario.categoria}
                    >
                      Siguiente Paso
                      <span className="icono-boton">→</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 2: Inventario */}
              {pasoActual === 2 && (
                <div className="paso-contenido">
                  <div className="paso-header">
                    <h2 className="paso-titulo">📊 Gestión de Inventario</h2>
                    <p className="paso-descripcion">
                      Configura el stock y las alertas de inventario
                    </p>
                  </div>

                  <div className="campos-formulario">
                    <div className="campos-fila">
                      <CampoFormulario
                        label="Stock Actual"
                        name="stock"
                        type="number"
                        placeholder="0"
                        min="0"
                        required
                        error={errores.stock}
                        value={formulario.stock}
                        onChange={manejarCambio}
                        onSelectChange={manejarCambioSelect}
                        onNuevaCategoria={manejarNuevaCategoria}
                        mostrarNuevaCategoria={mostrarNuevaCategoria}
                        nuevaCategoria={nuevaCategoria}
                        setNuevaCategoria={setNuevaCategoria}
                        categorias={categorias}
                      />
                      <CampoFormulario
                        label="Stock Mínimo"
                        name="stockMinimo"
                        type="number"
                        placeholder="5"
                        min="0"
                        error={errores.stockMinimo}
                        value={formulario.stockMinimo}
                        onChange={manejarCambio}
                        onSelectChange={manejarCambioSelect}
                        onNuevaCategoria={manejarNuevaCategoria}
                        mostrarNuevaCategoria={mostrarNuevaCategoria}
                        nuevaCategoria={nuevaCategoria}
                        setNuevaCategoria={setNuevaCategoria}
                        categorias={categorias}
                      />
                    </div>

                    <div className="campo-grupo" style={{ position: 'relative' }}>
                      <label htmlFor="sectorAlmacenamiento" className="campo-label">
                        Sector de Almacenamiento <span className="campo-opcional">(Opcional)</span>
                      </label>
                      <input
                        type="text"
                        id="sectorAlmacenamiento"
                        name="sectorAlmacenamiento"
                        value={formulario.sectorAlmacenamiento}
                        onChange={manejarCambioSectorAlmacenamiento}
                        className="campo-input"
                        placeholder="Ej: depósito2, habitación A33, góndola 4, estante 23"
                      />
                      {mostrarSugerenciasSector && sectoresFiltrados && (
                        <div className="sugerencias-marca">
                          {sectoresFiltrados.map((sector, index) => (
                            <div
                              key={index}
                              className="sugerencia-marca"
                              onClick={() => seleccionarSector(sector)}
                            >
                              {sector}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="info-inventario">
                      <div className="info-card">
                        <div className="info-icono">📈</div>
                        <div className="info-contenido">
                          <h4>Stock Mínimo</h4>
                          <p>Recibirás alertas cuando el stock baje de este nivel</p>
                        </div>
                      </div>
                      <div className="info-card">
                        <div className="info-icono">🏢</div>
                        <div className="info-contenido">
                          <h4>Sector de Almacenamiento</h4>
                          <p>Organiza tu inventario asignando ubicaciones específicas. Los sectores se guardan para reutilizarlos en futuras creaciones.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="botones-paso">
                    <button
                      type="button"
                      onClick={pasoAnterior}
                      className="boton-anterior"
                    >
                      <span className="icono-boton">←</span>
                      Paso Anterior
                    </button>
                    <button
                      type="button"
                      onClick={siguientePaso}
                      className="boton-siguiente"
                      disabled={!formulario.stock}
                    >
                      Siguiente Paso
                      <span className="icono-boton">→</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 3: Imágenes */}
              {pasoActual === 3 && (
                <div className="paso-contenido">
                  <div className="paso-header">
                    <h2 className="paso-titulo">🖼️ Imágenes del Producto</h2>
                    <p className="paso-descripcion">
                      Añade fotos de alta calidad para mostrar tu producto
                    </p>
                  </div>

                  <div className="campos-formulario">
                    <div className="seccion-imagenes">
                      <GestorImagenes
                        empresaId={empresaId}
                        imagenesIniciales={formulario.imagenes}
                        onChange={manejarCambioImagenes}
                        maxImagenes={5}
                        disabled={cargando}
                      />
                    </div>

                    <div className="info-imagenes">
                      <div className="info-card">
                        <div className="info-icono">💡</div>
                        <div className="info-contenido">
                          <h4>Consejos para las imágenes</h4>
                          <ul>
                            <li>Usa imágenes de alta resolución (mínimo 800x800px)</li>
                            <li>Fondo blanco o neutro para mejor presentación</li>
                            <li>Muestra el producto desde diferentes ángulos</li>
                            <li>Máximo 5 imágenes por producto</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="botones-paso">
                    <button
                      type="button"
                      onClick={pasoAnterior}
                      className="boton-anterior"
                    >
                      <span className="icono-boton">←</span>
                      Paso Anterior
                    </button>
                    <button
                      type="submit"
                      disabled={cargando}
                      className="boton-crear"
                    >
                      {cargando ? (
                        <>
                          <span className="spinner-mini"></span>
                          Creando Producto...
                        </>
                      ) : (
                        <>
                          <span className="icono-boton">✅</span>
                          Crear Producto
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Botón cancelar */}
          <div className="acciones-secundarias">
            <Link to="/admin/productos" className="boton-cancelar">
              <span className="icono-boton">❌</span>
              Cancelar
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .pagina-crear-producto {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        .contenedor-principal {
          max-width: 800px;
          margin: 0 auto;
          padding: 4rem 1rem 2rem 1rem;
        }

        .contenido-formulario {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .header-formulario {
          text-align: center;
          margin-bottom: 3rem;
          padding-top: 1rem;
        }

        .header-info {
          margin-bottom: 2rem;
        }

        .titulo-formulario {
          font-size: 2.5rem;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .icono-titulo {
          font-size: 2rem;
        }

        .subtitulo-formulario {
          font-size: 1.125rem;
          color: #64748b;
          max-width: 500px;
          margin: 0 auto;
        }

        .indicador-pasos {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-top: 2rem;
        }

        .paso {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          opacity: 0.5;
          transition: all 0.3s ease;
        }

        .paso.activo {
          opacity: 1;
        }

        .paso-numero {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          background: #e2e8f0;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .paso.activo .paso-numero {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .paso-texto {
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }

        .tarjeta-formulario {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }

        .paso-contenido {
          padding: 2rem;
        }

        .paso-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .paso-titulo {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .paso-descripcion {
          color: #64748b;
          font-size: 1rem;
        }

        .campos-formulario {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .campos-fila {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .campo-grupo {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .campo-label {
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .campo-requerido {
          color: #ef4444;
          font-weight: 700;
        }

        .campo-input {
          padding: 0.75rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 1rem;
          transition: all 0.2s ease;
          background: white;
        }

        .campo-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .campo-input.campo-error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .campo-mensaje-error {
          color: #ef4444;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .info-inventario,
        .info-imagenes {
          margin-top: 1rem;
        }

        .info-card {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 1.5rem;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .info-icono {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .info-contenido h4 {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .info-contenido p,
        .info-contenido ul {
          color: #64748b;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .info-contenido ul {
          margin-top: 0.5rem;
          padding-left: 1rem;
        }

        .info-contenido li {
          margin-bottom: 0.25rem;
        }

        .seccion-imagenes {
          border: 2px dashed #e2e8f0;
          border-radius: 0.75rem;
          padding: 1.5rem;
          background: #f8fafc;
        }

        .botones-paso {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e2e8f0;
        }

        .boton-siguiente,
        .boton-anterior,
        .boton-crear {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .boton-siguiente,
        .boton-crear {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .boton-siguiente:hover:not(:disabled),
        .boton-crear:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }

        .boton-siguiente:disabled,
        .boton-crear:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .boton-anterior {
          background: white;
          color: #64748b;
          border: 2px solid #e2e8f0;
        }

        .boton-anterior:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .icono-boton {
          font-size: 1.125rem;
        }

        .spinner-mini {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .acciones-secundarias {
          display: flex;
          justify-content: center;
        }

        .boton-cancelar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: white;
          color: #ef4444;
          border: 2px solid #ef4444;
          border-radius: 0.5rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .boton-cancelar:hover {
          background: #ef4444;
          color: white;
          transform: translateY(-1px);
        }

        .sugerencias-marca {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          max-height: 150px;
          overflow-y: auto;
          z-index: 10;
          margin-top: 2px;
        }

        .sugerencia-marca {
          padding: 8px 12px;
          cursor: pointer;
          font-size: 0.875rem;
          color: #374151;
          transition: background-color 0.2s ease;
          border-bottom: 1px solid #f3f4f6;
        }

        .sugerencia-marca:hover {
          background-color: #f8fafc;
        }

        @media (max-width: 768px) {
          .contenedor-principal {
            padding: 1rem;
          }

          .titulo-formulario {
            font-size: 2rem;
          }

          .indicador-pasos {
            flex-direction: column;
            gap: 1rem;
          }

          .campos-fila {
            grid-template-columns: 1fr;
          }

          .botones-paso {
            flex-direction: column;
            gap: 1rem;
          }

          .boton-siguiente,
          .boton-anterior,
          .boton-crear {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      {/* Componente de escáner de códigos de barras */}
      <BarcodeScanner
        isOpen={mostrarScanner}
        onScan={manejarEscaneoBarras}
        onClose={() => setMostrarScanner(false)}
      />
    </div>
  );
}
