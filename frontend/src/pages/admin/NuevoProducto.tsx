import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom';
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

type PestanaNuevoProducto = 'basica' | 'inventario' | 'precio' | 'imagenes';

const ORDEN_PESTANAS: PestanaNuevoProducto[] = ['basica', 'inventario', 'precio', 'imagenes'];

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
  const [searchParams] = useSearchParams();
  const routeParams = useParams<{ id?: string }>();
  const productoIdEdicion = routeParams.id ? parseInt(routeParams.id, 10) : NaN;
  const esEdicion = Number.isFinite(productoIdEdicion) && productoIdEdicion > 0;
  
  // Detectar si viene desde "Crear Ingreso"
  const vieneDesdeIngreso = !esEdicion && searchParams.get('desde') === 'ingreso';

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
    costo: '',
    margenGanancia: '',
    ivaPorcentaje: '',
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
  const [pestanaActiva, setPestanaActiva] = useState<PestanaNuevoProducto>('basica');
  const [errores, setErrores] = useState<{[key: string]: string}>({});
  const [mostrarNuevaCategoria, setMostrarNuevaCategoria] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [marcas, setMarcas] = useState<string[]>([]);
  const [marcasFiltradas, setMarcasFiltradas] = useState<string[]>([]);
  const [mostrarSugerenciasMarca, setMostrarSugerenciasMarca] = useState(false);
  const [sectoresAlmacenamiento, setSectoresAlmacenamiento] = useState<string[]>([]);
  const [sectoresFiltrados, setSectoresFiltrados] = useState<string[]>([]);
  const [mostrarSugerenciasSector, setMostrarSugerenciasSector] = useState(false);
  const [sectorSeleccionadoIndex, setSectorSeleccionadoIndex] = useState(-1);
  const [codigosPersonalizados, setCodigosPersonalizados] = useState<string[]>([]);
  const [codigosFiltrados, setCodigosFiltrados] = useState<string[]>([]);
  const [mostrarSugerenciasCodigo, setMostrarSugerenciasCodigo] = useState(false);
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [cargandoProducto, setCargandoProducto] = useState(esEdicion);
  const [sectorOriginal, setSectorOriginal] = useState('');
  const [activoProducto, setActivoProducto] = useState(true);
  const [destacadoProducto, setDestacadoProducto] = useState(false);

  const idVistaCodigoBarras = esEdicion ? 'barcode-preview-editar' : 'barcode-preview-nuevo';

  // Refs para navegación con Enter
  const nombreRef = useRef<HTMLInputElement>(null);
  const marcaRef = useRef<HTMLInputElement>(null);
  const codigoPersonalizadoRef = useRef<HTMLInputElement>(null);
  const codigoBarrasRef = useRef<HTMLInputElement>(null);
  const categoriaRef = useRef<HTMLSelectElement>(null);
  const descripcionRef = useRef<HTMLTextAreaElement>(null);
  const precioRef = useRef<HTMLInputElement>(null);
  const costoRef = useRef<HTMLInputElement>(null);
  const margenGananciaRef = useRef<HTMLInputElement>(null);
  const unidadRef = useRef<HTMLInputElement>(null);
  const stockRef = useRef<HTMLInputElement>(null);
  const stockMinimoRef = useRef<HTMLInputElement>(null);
  const botonSubmitRef = useRef<HTMLButtonElement>(null);
  const evitarScrollCambieNumero = (e: React.WheelEvent<HTMLInputElement>) => {
    // Cuando el input number está enfocado, la rueda cambia el valor.
    // Blureamos para que el scroll de la página no modifique el número.
    e.currentTarget.blur();
  };
  const sectorAlmacenamientoRef = useRef<HTMLInputElement>(null);

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
      // Cargar sectores desde la gestión de sectores usando ApiService
      const response = await ApiService.obtenerSectores(empresaId);
      if (response.data) {
        // Extraer solo los nombres de los sectores activos
        const sectoresActivos = (response.data || [])
          .filter((sector: any) => sector.activo)
          .map((sector: any) => sector.nombre);
        setSectoresAlmacenamiento(sectoresActivos);
        console.log('✅ Sectores cargados:', sectoresActivos);
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

  const irPestana = useCallback((p: PestanaNuevoProducto) => {
    setPestanaActiva(p);
    setTimeout(() => {
      document.querySelector('.tarjeta-formulario')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, []);

  const irSiguientePestana = useCallback(() => {
    setPestanaActiva(prev => {
      const i = ORDEN_PESTANAS.indexOf(prev);
      return ORDEN_PESTANAS[Math.min(i + 1, ORDEN_PESTANAS.length - 1)];
    });
  }, []);

  const manejarEscape = useCallback(() => {
    navigate('/admin/productos');
  }, [navigate]);

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
    
    // Resetear índice de selección
    setSectorSeleccionadoIndex(-1);
    
    // Filtrar sectores que coincidan con lo que está escribiendo
    if (value.trim()) {
      const filtrados = sectoresAlmacenamiento.filter(sector =>
        sector.toLowerCase().includes(value.toLowerCase())
      );
      setSectoresFiltrados(filtrados);
      setMostrarSugerenciasSector(filtrados.length > 0);
    } else {
      setSectoresFiltrados([]);
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
    setSectorSeleccionadoIndex(-1);
  }, []);

  const crearNuevoSector = useCallback(async (nombreSector: string) => {
    try {
      const response = await fetch(`/api/empresas/${empresaId}/sectores`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: nombreSector,
          descripcion: `Sector creado automáticamente desde formulario de producto`,
          ubicacion: '',
          activo: true
        })
      });
      
      if (response.ok) {
        // Agregar el nuevo sector a la lista local
        setSectoresAlmacenamiento(prev => [...prev, nombreSector]);
        toast.success(`Sector "${nombreSector}" creado exitosamente`);
        return true;
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al crear sector');
        return false;
      }
    } catch (error) {
      console.error('Error al crear sector:', error);
      toast.error('Error al crear sector');
      return false;
    }
  }, [empresaId]);

  const manejarTecladoSector = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mostrarSugerenciasSector) {
      const totalOpciones = sectoresFiltrados.length + 
        (formulario.sectorAlmacenamiento.trim() && 
         !sectoresFiltrados.includes(formulario.sectorAlmacenamiento.trim()) ? 1 : 0);

      if (totalOpciones > 0) {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setSectorSeleccionadoIndex(prev => 
              prev < totalOpciones - 1 ? prev + 1 : 0
            );
            break;
          case 'ArrowUp':
            e.preventDefault();
            setSectorSeleccionadoIndex(prev => 
              prev > 0 ? prev - 1 : totalOpciones - 1
            );
            break;
          case 'Enter':
            e.preventDefault();
            if (sectorSeleccionadoIndex >= 0 && sectorSeleccionadoIndex < sectoresFiltrados.length) {
              seleccionarSector(sectoresFiltrados[sectorSeleccionadoIndex]);
            } else if (sectorSeleccionadoIndex === sectoresFiltrados.length && 
                       formulario.sectorAlmacenamiento.trim() && 
                       !sectoresFiltrados.includes(formulario.sectorAlmacenamiento.trim())) {
              // Crear nuevo sector
              crearNuevoSector(formulario.sectorAlmacenamiento.trim()).then(success => {
                if (success) {
                  seleccionarSector(formulario.sectorAlmacenamiento.trim());
                }
              });
            }
            break;
          case 'Escape':
            setMostrarSugerenciasSector(false);
            setSectorSeleccionadoIndex(-1);
            break;
        }
        return;
      }
    }

    // Si no hay sugerencias o no se está mostrando sugerencias, manejar navegación normal
    if (e.key === 'Enter') {
      e.preventDefault();
      irSiguientePestana();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      manejarEscape();
    }
  }, [mostrarSugerenciasSector, sectoresFiltrados, sectorSeleccionadoIndex, seleccionarSector, crearNuevoSector, formulario.sectorAlmacenamiento, irSiguientePestana, manejarEscape]);

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

  const cargarProductoParaEdicion = useCallback(async () => {
    if (!esEdicion || !empresaId) {
      setCargandoProducto(false);
      return;
    }
    try {
      setCargandoProducto(true);
      const response = await ApiService.obtenerProducto(empresaId, productoIdEdicion, true);
      if (!response?.data) {
        toast.error('Producto no encontrado');
        navigate('/admin/productos');
        return;
      }
      const producto = response.data as Record<string, unknown>;
      const precioNum = typeof producto.precio === 'number' ? producto.precio : parseFloat(String(producto.precio ?? ''));
      const precioStr = Number.isFinite(precioNum) ? String(precioNum) : '';
      const stockNum = typeof producto.stock === 'number' ? producto.stock : Number(producto.stock ?? '');
      const smRaw = producto.stockMinimo;
      const smNum = smRaw != null && smRaw !== '' ? Number(smRaw) : 5;

      setFormulario({
        nombre: String(producto.nombre ?? ''),
        marca: String(producto.marca ?? ''),
        descripcion: String(producto.descripcion ?? ''),
        precio: precioStr,
        costo: '',
        margenGanancia: '',
        ivaPorcentaje: '',
        stock: Number.isFinite(stockNum) ? String(stockNum) : '',
        stockMinimo: Number.isFinite(smNum) ? String(smNum) : '5',
        unidad: String(producto.unidad ?? ''),
        categoria: String(producto.categoria ?? ''),
        sectorAlmacenamiento: String(producto.sectorAlmacenamiento ?? ''),
        codigoPersonalizado: String(producto.codigoPersonalizado ?? ''),
        codigoBarras: String(producto.codigoBarras ?? ''),
        imagenes: Array.isArray(producto.imagenes) ? (producto.imagenes as string[]) : [],
      });
      setSectorOriginal(String(producto.sectorAlmacenamiento ?? ''));
      setActivoProducto(producto.activo !== false);
      setDestacadoProducto(Boolean(producto.destacado));
      const cat = String(producto.categoria ?? '');
      if (cat) {
        setCategorias(prev => (prev.includes(cat) ? prev : [...prev, cat]));
      }
    } catch (err) {
      console.error('Error al cargar producto:', err);
      toast.error('Error al cargar el producto');
      navigate('/admin/productos');
    } finally {
      setCargandoProducto(false);
    }
  }, [esEdicion, empresaId, productoIdEdicion, navigate]);

  useEffect(() => {
    cargarCategorias();
    cargarMarcas();
    cargarSectoresAlmacenamiento();
    cargarCodigosPersonalizados();
  }, [cargarCategorias, cargarMarcas, cargarSectoresAlmacenamiento, cargarCodigosPersonalizados]);

  useEffect(() => {
    if (esEdicion) {
      cargarProductoParaEdicion();
    }
  }, [esEdicion, cargarProductoParaEdicion]);

  useEffect(() => {
    if (cargandoProducto) return;
    nombreRef.current?.focus();
  }, [cargandoProducto]);

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

  const redondear2 = (n: number) => Math.round(n * 100) / 100;

  const manejarCambioCosto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormulario(prev => {
      const next = { ...prev, costo: value };
      const cStr = value.trim().replace(',', '.');
      if (cStr === '' || cStr === '-') {
        return next;
      }
      const c = parseFloat(cStr);
      if (Number.isNaN(c)) {
        return next;
      }
      const mStr = prev.margenGanancia.trim().replace(',', '.');
      const m = parseFloat(mStr);
      // Margen negativo suele ser un valor arrastrado (p. ej. precio < costo → -90 %); si aplicamos la fórmula, el precio queda muy por debajo del costo (10000 → 1000)
      if (prev.margenGanancia.trim() !== '' && !Number.isNaN(m) && m >= 0) {
        next.precio = redondear2(c * (1 + m / 100)).toFixed(2);
        return next;
      }
      if (prev.margenGanancia.trim() !== '' && !Number.isNaN(m) && m < 0) {
        next.margenGanancia = '';
        next.precio = value;
        return next;
      }
      const pStr = prev.precio.trim().replace(',', '.');
      const p = parseFloat(pStr);
      const tienePrecioVentaReal = prev.precio.trim() !== '' && !Number.isNaN(p) && p > 0;
      const costoPrevN = parseFloat(prev.costo.trim().replace(',', '.'));
      const precioPrevN = parseFloat(prev.precio.trim().replace(',', '.'));
      // Si el precio venía igual al costo (p. ej. al tipear 1000 → 10000), seguir espejando; si no, recalcular margen respecto al precio fijado a mano
      const costoYPrecioIguales =
        !Number.isNaN(costoPrevN) &&
        !Number.isNaN(precioPrevN) &&
        costoPrevN === precioPrevN;
      if (tienePrecioVentaReal && c > 0 && !costoYPrecioIguales) {
        const margenPct = ((p / c) - 1) * 100;
        if (Number.isFinite(margenPct)) {
          next.margenGanancia = String(redondear2(margenPct));
        }
        return next;
      }
      next.precio = value;
      return next;
    });
    setErrores(er => {
      const n = { ...er };
      delete n.costo;
      return n;
    });
  }, []);

  const manejarCambioMargen = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormulario(prev => {
      const next = { ...prev, margenGanancia: value };
      const cStr = prev.costo.trim().replace(',', '.');
      const c = parseFloat(cStr);
      if (prev.costo.trim() === '' || Number.isNaN(c)) {
        return next;
      }
      if (value.trim() === '') {
        next.precio = prev.costo;
        return next;
      }
      const mStr = value.trim().replace(',', '.');
      const m = parseFloat(mStr);
      if (Number.isNaN(m)) {
        return next;
      }
      next.precio = redondear2(c * (1 + m / 100)).toFixed(2);
      return next;
    });
    setErrores(er => {
      const n = { ...er };
      delete n.margenGanancia;
      return n;
    });
  }, []);

  const manejarCambioPrecioVenta = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormulario(prev => {
      const next = { ...prev, precio: value };
      const cStr = prev.costo.trim().replace(',', '.');
      const c = parseFloat(cStr);
      if (prev.costo.trim() === '' || Number.isNaN(c) || c <= 0) {
        return next;
      }
      const pStr = value.trim().replace(',', '.');
      if (pStr === '' || pStr === '-') {
        return next;
      }
      const p = parseFloat(pStr);
      if (Number.isNaN(p)) {
        return next;
      }
      const margenPct = ((p / c) - 1) * 100;
      if (Number.isFinite(margenPct)) {
        next.margenGanancia = String(redondear2(margenPct));
      }
      return next;
    });
    setErrores(er => {
      const n = { ...er };
      delete n.precio;
      return n;
    });
  }, []);

  const obtenerErroresValidacion = (): {[key: string]: string} => {
    const nuevosErrores: {[key: string]: string} = {};

    if (!formulario.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre del producto es obligatorio';
    }
    if (!formulario.categoria) {
      nuevosErrores.categoria = 'Selecciona una categoría';
    }

    const stockStr = formulario.stock.trim();
    if (stockStr !== '' && (isNaN(Number(stockStr)) || Number(stockStr) < 0)) {
      nuevosErrores.stock = 'El stock debe ser un número válido mayor o igual a 0';
    }
    const smStr = formulario.stockMinimo.trim();
    if (smStr !== '' && (isNaN(Number(smStr)) || Number(smStr) < 0)) {
      nuevosErrores.stockMinimo = 'El stock mínimo debe ser un número válido mayor o igual a 0';
    }

    const precioStr = formulario.precio.trim().replace(',', '.');
    if (precioStr !== '' && (isNaN(Number(precioStr)) || Number(precioStr) < 0)) {
      nuevosErrores.precio = 'El precio debe ser un número válido mayor o igual a 0';
    }

    const costoStr = formulario.costo.trim().replace(',', '.');
    if (costoStr !== '' && (isNaN(Number(costoStr)) || Number(costoStr) < 0)) {
      nuevosErrores.costo = 'El costo debe ser un número válido mayor o igual a 0';
    }
    const margenStr = formulario.margenGanancia.trim().replace(',', '.');
    if (margenStr !== '' && isNaN(Number(margenStr))) {
      nuevosErrores.margenGanancia = 'El margen debe ser un número válido';
    }
    const ivaStr = formulario.ivaPorcentaje.trim().replace(',', '.');
    if (ivaStr !== '' && (isNaN(Number(ivaStr)) || Number(ivaStr) < 0)) {
      nuevosErrores.ivaPorcentaje = 'El IVA % debe ser un número válido';
    }

    return nuevosErrores;
  };

  // Navegación entre campos con Enter
  const manejarEnterCampo = (e: React.KeyboardEvent, siguienteCampo: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      switch (siguienteCampo) {
        case 'marca':
          marcaRef.current?.focus();
          break;
        case 'codigoPersonalizado':
          codigoPersonalizadoRef.current?.focus();
          break;
        case 'codigoBarras':
          codigoBarrasRef.current?.focus();
          break;
        case 'categoria':
          categoriaRef.current?.focus();
          break;
        case 'descripcion':
          descripcionRef.current?.focus();
          break;
        case 'precio':
          precioRef.current?.focus();
          break;
        case 'unidad':
          unidadRef.current?.focus();
          break;
        case 'stock':
          stockRef.current?.focus();
          break;
        case 'stockMinimo':
          stockMinimoRef.current?.focus();
          break;
        case 'sectorAlmacenamiento':
          sectorAlmacenamientoRef.current?.focus();
          break;
        case 'costo':
          costoRef.current?.focus();
          break;
        case 'margenGanancia':
          margenGananciaRef.current?.focus();
          break;
        case 'siguientePestana':
          irSiguientePestana();
          break;
        case 'enviar':
          // Si estamos en el último campo, enviar el formulario
          enviarFormulario(e as any);
          break;
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      manejarEscape();
    }
  };

  // Manejador de teclado específico para el campo de categoría
  const manejarTeclasCategoria = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Si el select está cerrado, expandirlo
      if (!categoriaRef.current?.matches(':focus')) {
        if (categoriaRef.current) {
          categoriaRef.current.focus();
          // Simular click para abrir las opciones
          categoriaRef.current.click();
        }
      } else {
        // Si el select está abierto y hay una opción seleccionada, confirmar y pasar al siguiente campo
        if (categoriaRef.current) {
          categoriaRef.current.blur();
          // Pasar al siguiente campo
          setTimeout(() => {
            if (descripcionRef.current) {
              descripcionRef.current.focus();
            }
          }, 50);
        }
      }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      // Permitir navegación normal con flechas
      return; // No prevenir el comportamiento por defecto
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // Si el select está abierto, cerrarlo
      if (categoriaRef.current?.matches(':focus')) {
        categoriaRef.current.blur();
      } else {
        // Si está cerrado, usar el comportamiento de Escape general
        manejarEscape();
      }
    }
  };

  const manejarTecladoGlobal = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      manejarEscape();
    }

    // En la pestaña de imágenes suele no haber un input enfocado (dropzone),
    // entonces Enter no dispara el submit del form. Si no estamos escribiendo en un campo,
    // usamos Enter para guardar (crear/editar) sin cortar el flujo.
    if (e.key === 'Enter' && pestanaActiva === 'imagenes') {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const esCampoEditable =
        tag === 'input' || tag === 'textarea' || tag === 'select' || (target?.isContentEditable ?? false);

      if (!esCampoEditable) {
        e.preventDefault();
        botonSubmitRef.current?.click();
      }
    }
  };

  const enviarFormulario = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const erroresEnvio = obtenerErroresValidacion();
    if (Object.keys(erroresEnvio).length > 0) {
      setErrores(erroresEnvio);
      toast.error('Por favor, corrige los errores en el formulario');
      if (erroresEnvio.nombre || erroresEnvio.categoria) {
        irPestana('basica');
      } else if (erroresEnvio.stock || erroresEnvio.stockMinimo) {
        irPestana('inventario');
      } else if (erroresEnvio.precio || erroresEnvio.costo || erroresEnvio.margenGanancia || erroresEnvio.ivaPorcentaje) {
        irPestana('precio');
      }
      return;
    }

    setCargando(true);
    
    try {
      if (!empresaId) {
        toast.error('Error: No se encontró la empresa asociada');
        return;
      }

      if (!esEdicion) {
        console.log('🔍 Verificando límites antes de crear producto...');
        const canProceed = await LimitService.checkLimitsBeforeAction('addProduct');
        if (!canProceed) {
          console.log('❌ Límite de productos alcanzado');
          return;
        }
        console.log('✅ Límites verificados, procediendo a crear producto...');
      }

      const stockVal = formulario.stock.trim() === '' ? 0 : Number(formulario.stock);
      const stockMinVal = formulario.stockMinimo.trim() === '' ? 5 : Number(formulario.stockMinimo);
      const precioRaw = formulario.precio.trim().replace(',', '.');
      const precioVal = precioRaw === '' ? 0 : Number(precioRaw);

      const datosProducto = {
        nombre: formulario.nombre.trim(),
        descripcion: formulario.descripcion.trim() || undefined,
        precio: precioVal,
        stock: stockVal,
        stockMinimo: stockMinVal,
        categoria: formulario.categoria || undefined,
        marca: formulario.marca.trim() || undefined,
        unidad: formulario.unidad.trim() || undefined,
        sectorAlmacenamiento: formulario.sectorAlmacenamiento.trim() || undefined,
        codigoPersonalizado: formulario.codigoPersonalizado.trim() || undefined,
        codigoBarras: formulario.codigoBarras.trim() || undefined,
        activo: esEdicion ? activoProducto : true,
        destacado: esEdicion ? destacadoProducto : false,
        imagenes: formulario.imagenes
      };

      if (esEdicion) {
        const response = await ApiService.actualizarProducto(empresaId, productoIdEdicion, datosProducto);
        if (response?.data) {
          const sectorNuevo = formulario.sectorAlmacenamiento.trim();
          if (sectorOriginal !== sectorNuevo && sectorNuevo !== '') {
            try {
              const migracionResponse = await fetch(
                `/api/empresas/${empresaId}/productos/${productoIdEdicion}/migrar-sector`,
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ sectorDestino: sectorNuevo })
                }
              );
              if (migracionResponse.ok) {
                toast.success('Producto actualizado y stock migrado al nuevo sector');
              } else {
                toast('Producto actualizado; revisá la migración de stock al sector', { icon: '⚠️' });
              }
            } catch {
              toast('Producto actualizado; hubo un problema al migrar el stock', { icon: '⚠️' });
            }
          } else {
            toast.success('Producto actualizado correctamente');
          }
          navigate('/admin/productos');
        } else {
          toast.error('Respuesta inesperada del servidor');
        }
      } else {
        console.log('Creando producto:', datosProducto);
        const response = await ApiService.crearProducto(empresaId, datosProducto);
        if (response && (response.data || ('id' in response && response.id))) {
          toast.success('✅ Producto creado exitosamente');
          if (vieneDesdeIngreso) {
            const producto = response.data || response;
            navigate(`/admin/crear-ingreso?producto=${encodeURIComponent(JSON.stringify(producto))}`);
          } else {
            navigate('/admin/productos');
          }
        } else {
          toast.error('Error: No se recibió respuesta del servidor');
        }
      }
    } catch (error: unknown) {
      console.error(esEdicion ? 'Error al actualizar producto:' : 'Error al crear producto:', error);
      
      let mensajeError = esEdicion ? 'Error al actualizar el producto' : 'Error al crear el producto';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown; statusText?: string } };
        
        if (axiosError.response?.status === 403) {
          mensajeError = esEdicion
            ? 'No tienes permisos para modificar productos'
            : 'No tienes permisos para crear productos';
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


  if (esEdicion && cargandoProducto) {
    return (
      <div className="pagina-crear-producto">
        <NavbarAdmin
          onCerrarSesion={cerrarSesion}
          empresaNombre={datosUsuario?.empresaNombre}
          nombreAdministrador={datosUsuario?.nombre}
        />
        <div
          className="contenedor-principal"
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: '6rem'
          }}
        >
          <div style={{ textAlign: 'center', color: '#64748b' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '4px solid #e2e8f0',
                borderTop: '4px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }}
            />
            <p style={{ margin: 0, fontSize: '1rem' }}>Cargando producto…</p>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

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
        <div className="contenido-formulario" onKeyDown={manejarTecladoGlobal}>
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
                {esEdicion ? 'Editar producto' : 'Crear Nuevo Producto'}
              </h1>
              <p className="subtitulo-formulario">
                {esEdicion
                  ? 'Modificá los datos del producto con las mismas pestañas que en la creación. Solo la información básica obligatoria debe estar completa para guardar.'
                  : (
                    <>
                      Completa la información del producto para añadirlo a tu catálogo. Solo la pestaña{' '}
                      <strong>Información básica</strong> es obligatoria; inventario, precio e imágenes son opcionales.
                    </>
                  )}
              </p>
            </div>

            {/* Pestañas */}
            <div className="pestanas-nuevo-producto" role="tablist" aria-label="Secciones del producto">
              {([
                { id: 'basica' as const, label: 'Información básica', short: 'Básica' },
                { id: 'inventario' as const, label: 'Gestión de inventario', short: 'Inventario' },
                { id: 'precio' as const, label: 'Precio e impuestos', short: 'Precio' },
                { id: 'imagenes' as const, label: 'Imágenes', short: 'Imágenes' },
              ]).map(({ id, label, short }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={pestanaActiva === id}
                  className={`pestana-btn ${pestanaActiva === id ? 'activa' : ''}`}
                  onClick={() => irPestana(id)}
                  title={label}
                >
                  {short}
                </button>
              ))}
            </div>
          </div>

          {/* Formulario */}
          <div className="tarjeta-formulario">
            <form onSubmit={enviarFormulario}>
              {/* Pestaña: Información básica */}
              {pestanaActiva === 'basica' && (
                <div className="paso-contenido">
                  <div className="paso-header">
                    <h2 className="paso-titulo">📝 Información Básica del Producto</h2>
                    <p className="paso-descripcion">
                      Define los datos principales que identifican tu producto
                    </p>
                  </div>

                  <div className="campos-formulario">
                    <div className="campo-grupo" style={{ position: 'relative' }}>
                      <label htmlFor="nombre" className="campo-label">
                        Nombre del Producto <span className="campo-requerido">*</span>
                      </label>
                      <input
                        ref={nombreRef}
                        type="text"
                        id="nombre"
                        name="nombre"
                        value={formulario.nombre}
                        onChange={manejarCambio}
                        onKeyDown={(e) => manejarEnterCampo(e, 'marca')}
                        className={`campo-input ${errores.nombre ? 'campo-error' : ''}`}
                        placeholder="Ej: Camiseta Básica de Algodón"
                      />
                      {errores.nombre && <div className="campo-mensaje-error">{errores.nombre}</div>}
                    </div>

                    <div className="campos-fila">
                      <div className="campo-grupo" style={{ position: 'relative' }}>
                        <label htmlFor="marca" className="campo-label">
                          Marca
                        </label>
                        <input
                          ref={marcaRef}
                          type="text"
                          id="marca"
                          name="marca"
                          value={formulario.marca}
                          onChange={manejarCambioMarca}
                          onKeyDown={(e) => manejarEnterCampo(e, 'codigoPersonalizado')}
                          className={`campo-input ${errores.marca ? 'campo-error' : ''}`}
                          placeholder="Ej: Nike, Apple, Samsung..."
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
                        {errores.marca && <div className="campo-mensaje-error">{errores.marca}</div>}
                      </div>
                      <div className="campo-grupo" style={{ position: 'relative' }}>
                        <label htmlFor="codigoPersonalizado" className="campo-label">
                          Código Personalizado <span className="campo-opcional">(Opcional)</span>
                        </label>
                        <input
                          ref={codigoPersonalizadoRef}
                          type="text"
                          id="codigoPersonalizado"
                          name="codigoPersonalizado"
                          value={formulario.codigoPersonalizado}
                          onChange={manejarCambioCodigoPersonalizado}
                          onKeyDown={(e) => manejarEnterCampo(e, 'codigoBarras')}
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
                            ref={codigoBarrasRef}
                            type="text"
                            id="codigoBarras"
                            value={formulario.codigoBarras}
                            onChange={manejarCambio}
                            onKeyDown={(e) => manejarEnterCampo(e, 'categoria')}
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
                              id={idVistaCodigoBarras}
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
                              <button type="button" onClick={() => descargarCodigoBarras(idVistaCodigoBarras)} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease' }}>💾 Descargar</button>
                              <button type="button" onClick={() => imprimirCodigoBarras(idVistaCodigoBarras)} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease' }}>🖨️ Imprimir</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="campo-grupo" style={{ position: 'relative' }}>
                      <label htmlFor="categoria" className="campo-label">
                        Categoría <span className="campo-requerido">*</span>
                      </label>
                      <select
                        ref={categoriaRef}
                        id="categoria"
                        name="categoria"
                        value={formulario.categoria}
                        onChange={manejarCambioSelect}
                        onKeyDown={manejarTeclasCategoria}
                        className={`campo-input ${errores.categoria ? 'campo-error' : ''}`}
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
                              manejarNuevaCategoria(e);
                            }
                          }}
                          onBlur={manejarNuevaCategoria}
                          autoFocus
                        />
                      )}
                      {errores.categoria && <div className="campo-mensaje-error">{errores.categoria}</div>}
                    </div>

                    <div className="campo-grupo" style={{ position: 'relative' }}>
                      <label htmlFor="descripcion" className="campo-label">
                        Descripción
                      </label>
                      <textarea
                        ref={descripcionRef}
                        id="descripcion"
                        name="descripcion"
                        value={formulario.descripcion}
                        onChange={manejarCambio}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            irSiguientePestana();
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            manejarEscape();
                          }
                        }}
                        className={`campo-input ${errores.descripcion ? 'campo-error' : ''}`}
                        placeholder="Describe las características, beneficios y detalles del producto..."
                        rows={4}
                      />
                      {errores.descripcion && <div className="campo-mensaje-error">{errores.descripcion}</div>}
                    </div>

                    {esEdicion && (
                      <div
                        className="campos-fila"
                        style={{ alignItems: 'center', marginTop: '0.25rem' }}
                      >
                        <label
                          className="campo-label"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: 0 }}
                        >
                          <input
                            type="checkbox"
                            checked={activoProducto}
                            onChange={(e) => setActivoProducto(e.target.checked)}
                          />
                          Producto activo
                        </label>
                        <label
                          className="campo-label"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: 0 }}
                        >
                          <input
                            type="checkbox"
                            checked={destacadoProducto}
                            onChange={(e) => setDestacadoProducto(e.target.checked)}
                          />
                          Producto destacado
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pestaña: Inventario */}
              {pestanaActiva === 'inventario' && (
                <div className="paso-contenido">
                  <div className="paso-header">
                    <h2 className="paso-titulo">📊 Gestión de Inventario</h2>
                    <p className="paso-descripcion">
                      Configura stock, unidad de medida y sector. Si lo dejás vacío, se usará stock 0 y stock mínimo 5.
                    </p>
                  </div>

                  <div className="campos-formulario">
                    <div className="campos-fila">
                      <div className="campo-grupo" style={{ position: 'relative' }}>
                        <label htmlFor="stock" className="campo-label">
                          Stock actual <span className="campo-opcional">(opcional, por defecto 0)</span>
                        </label>
                        <input
                          ref={stockRef}
                          type="number"
                          id="stock"
                          name="stock"
                          value={formulario.stock}
                          onChange={manejarCambio}
                          onWheel={evitarScrollCambieNumero}
                          onKeyDown={(e) => manejarEnterCampo(e, 'stockMinimo')}
                          className={`campo-input ${errores.stock ? 'campo-error' : ''}`}
                          placeholder="0"
                          min="0"
                        />
                        {errores.stock && <div className="campo-mensaje-error">{errores.stock}</div>}
                      </div>
                      <div className="campo-grupo" style={{ position: 'relative' }}>
                        <label htmlFor="stockMinimo" className="campo-label">
                          Stock mínimo <span className="campo-opcional">(opcional, por defecto 5)</span>
                        </label>
                        <input
                          ref={stockMinimoRef}
                          type="number"
                          id="stockMinimo"
                          name="stockMinimo"
                          value={formulario.stockMinimo}
                          onChange={manejarCambio}
                          onWheel={evitarScrollCambieNumero}
                          onKeyDown={(e) => manejarEnterCampo(e, 'unidad')}
                          className={`campo-input ${errores.stockMinimo ? 'campo-error' : ''}`}
                          placeholder="5"
                          min="0"
                        />
                        {errores.stockMinimo && <div className="campo-mensaje-error">{errores.stockMinimo}</div>}
                      </div>
                    </div>

                    <div className="campo-grupo" style={{ position: 'relative' }}>
                      <label htmlFor="unidad" className="campo-label">
                        Unidad <span className="campo-opcional">(opcional)</span>
                      </label>
                      <input
                        ref={unidadRef}
                        type="text"
                        id="unidad"
                        name="unidad"
                        value={formulario.unidad}
                        onChange={manejarCambio}
                        onKeyDown={(e) => manejarEnterCampo(e, 'sectorAlmacenamiento')}
                        className={`campo-input ${errores.unidad ? 'campo-error' : ''}`}
                        placeholder="Ej: kg, litro, unidad, par..."
                      />
                      {errores.unidad && <div className="campo-mensaje-error">{errores.unidad}</div>}
                    </div>

                    <div className="campo-grupo" style={{ position: 'relative' }}>
                      <label htmlFor="sectorAlmacenamiento" className="campo-label">
                        Sector de Almacenamiento <span className="campo-opcional">(Opcional)</span>
                      </label>
                      <input
                        ref={sectorAlmacenamientoRef}
                        type="text"
                        id="sectorAlmacenamiento"
                        name="sectorAlmacenamiento"
                        value={formulario.sectorAlmacenamiento}
                        onChange={manejarCambioSectorAlmacenamiento}
                        onKeyDown={manejarTecladoSector}
                        onBlur={() => {
                          // Pequeño delay para permitir que el click en las sugerencias funcione
                          setTimeout(() => {
                            setMostrarSugerenciasSector(false);
                            setSectorSeleccionadoIndex(-1);
                          }, 150);
                        }}
                        className="campo-input"
                        placeholder="Escribe el nombre del sector o selecciona uno existente"
                        autoComplete="off"
                      />
                      {mostrarSugerenciasSector && sectoresFiltrados && sectoresFiltrados.length > 0 && (
                        <div className="sugerencias-marca">
                          {sectoresFiltrados.map((sector, index) => (
                            <div
                              key={index}
                              className={`sugerencia-marca ${index === sectorSeleccionadoIndex ? 'sugerencia-seleccionada' : ''}`}
                              onClick={() => seleccionarSector(sector)}
                              onMouseEnter={() => setSectorSeleccionadoIndex(index)}
                            >
                              <span className="icono-sector">🏢</span>
                              <span className="texto-sector">{sector}</span>
                              <span className="badge-existente">Existente</span>
                            </div>
                          ))}
                          {formulario.sectorAlmacenamiento.trim() && 
                           !sectoresFiltrados.includes(formulario.sectorAlmacenamiento.trim()) && (
                            <div
                              className={`sugerencia-marca sugerencia-nueva ${sectoresFiltrados.length === sectorSeleccionadoIndex ? 'sugerencia-seleccionada' : ''}`}
                              onClick={() => {
                                crearNuevoSector(formulario.sectorAlmacenamiento.trim()).then(success => {
                                  if (success) {
                                    seleccionarSector(formulario.sectorAlmacenamiento.trim());
                                  }
                                });
                              }}
                              onMouseEnter={() => setSectorSeleccionadoIndex(sectoresFiltrados.length)}
                            >
                              <span className="icono-sector">➕</span>
                              <span className="texto-sector">Crear sector "{formulario.sectorAlmacenamiento.trim()}"</span>
                              <span className="badge-nuevo">Nuevo</span>
                            </div>
                          )}
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
                          <p>Asigna este producto a un sector específico de tu empresa. Puedes seleccionar sectores existentes o crear nuevos directamente desde aquí.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pestaña: Precio e impuestos */}
              {pestanaActiva === 'precio' && (
                <div className="paso-contenido">
                  <div className="paso-header">
                    <h2 className="paso-titulo">💰 Precio e impuestos</h2>
                    <p className="paso-descripcion">
                      El <strong>precio de venta</strong> es lo que se guarda en el catálogo. Costo, margen y precio se actualizan entre sí al escribir; si el costo es mayor que 0, el margen se recalcula cuando cambiás el precio de venta. El IVA % es solo referencia en pantalla.
                    </p>
                  </div>

                  <div className="campos-formulario">
                    <div className="campos-fila">
                      <div className="campo-grupo" style={{ position: 'relative' }}>
                        <label htmlFor="costo" className="campo-label">
                          Costo <span className="campo-opcional">(no se guarda en el servidor)</span>
                        </label>
                        <input
                          ref={costoRef}
                          type="number"
                          id="costo"
                          name="costo"
                          value={formulario.costo}
                          onChange={manejarCambioCosto}
                          onKeyDown={(e) => manejarEnterCampo(e, 'margenGanancia')}
                          className={`campo-input ${errores.costo ? 'campo-error' : ''}`}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                        {errores.costo && <div className="campo-mensaje-error">{errores.costo}</div>}
                      </div>
                      <div className="campo-grupo" style={{ position: 'relative' }}>
                        <label htmlFor="margenGanancia" className="campo-label">
                          Margen de ganancia %
                        </label>
                        <input
                          ref={margenGananciaRef}
                          type="number"
                          id="margenGanancia"
                          name="margenGanancia"
                          value={formulario.margenGanancia}
                          onChange={manejarCambioMargen}
                          onKeyDown={(e) => manejarEnterCampo(e, 'precio')}
                          className={`campo-input ${errores.margenGanancia ? 'campo-error' : ''}`}
                          placeholder="Ej: 30"
                          step="0.01"
                        />
                        {errores.margenGanancia && <div className="campo-mensaje-error">{errores.margenGanancia}</div>}
                      </div>
                    </div>

                    <div className="campo-grupo" style={{ position: 'relative' }}>
                      <label htmlFor="precio" className="campo-label">
                        Precio de venta <span className="campo-opcional">(opcional, por defecto 0)</span>
                      </label>
                      <input
                        ref={precioRef}
                        type="number"
                        id="precio"
                        name="precio"
                        value={formulario.precio}
                        onChange={manejarCambioPrecioVenta}
                        onKeyDown={(e) => manejarEnterCampo(e, 'siguientePestana')}
                        className={`campo-input ${errores.precio ? 'campo-error' : ''}`}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                      {errores.precio && <div className="campo-mensaje-error">{errores.precio}</div>}
                    </div>

                    <div className="campo-grupo" style={{ position: 'relative' }}>
                      <label htmlFor="ivaPorcentaje" className="campo-label">
                        IVA / impuesto % <span className="campo-opcional">(referencia, no se guarda)</span>
                      </label>
                      <input
                        type="number"
                        id="ivaPorcentaje"
                        name="ivaPorcentaje"
                        value={formulario.ivaPorcentaje}
                        onChange={manejarCambio}
                        className={`campo-input ${errores.ivaPorcentaje ? 'campo-error' : ''}`}
                        placeholder="Ej: 21"
                        min="0"
                        step="0.01"
                      />
                      {errores.ivaPorcentaje && <div className="campo-mensaje-error">{errores.ivaPorcentaje}</div>}
                    </div>

                    {(() => {
                      const p = parseFloat(formulario.precio.trim().replace(',', '.'));
                      const iva = parseFloat(formulario.ivaPorcentaje.trim().replace(',', '.'));
                      if (
                        formulario.precio.trim() !== '' &&
                        formulario.ivaPorcentaje.trim() !== '' &&
                        !Number.isNaN(p) &&
                        !Number.isNaN(iva) &&
                        iva >= 0
                      ) {
                        const conIva = (p * (1 + iva / 100)).toFixed(2);
                        return (
                          <p className="texto-referencia-iva">
                            Referencia: precio + {iva}% IVA ≈ <strong>{conIva}</strong> (solo informativo)
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}

              {/* Pestaña: Imágenes */}
              {pestanaActiva === 'imagenes' && (
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
                </div>
              )}

              <div className="barra-crear-producto">
                <button
                  ref={botonSubmitRef}
                  type="submit"
                  disabled={cargando}
                  className="boton-crear boton-crear-ancho"
                >
                  {cargando ? (
                    <>
                      <span className="spinner-mini"></span>
                      {esEdicion ? 'Guardando…' : 'Creando producto…'}
                    </>
                  ) : (
                    <>
                      <span className="icono-boton">✅</span>
                      {esEdicion ? 'Guardar cambios' : 'Crear producto'}
                    </>
                  )}
                </button>
              </div>
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
          max-width: 520px;
          margin: 0 auto;
        }

        .pestanas-nuevo-producto {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1.25rem;
          padding: 0 0.5rem;
        }

        .pestana-btn {
          border: 2px solid #e2e8f0;
          background: #fff;
          color: #475569;
          font-weight: 600;
          font-size: 0.875rem;
          padding: 0.6rem 1rem;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pestana-btn:hover {
          border-color: #93c5fd;
          color: #1d4ed8;
        }

        .pestana-btn.activa {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
        }

        .barra-crear-producto {
          padding: 1.25rem 2rem 2rem;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .boton-crear-ancho {
          width: 100%;
          justify-content: center;
        }

        .texto-referencia-iva {
          font-size: 0.9rem;
          color: #64748b;
          margin: 0;
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
