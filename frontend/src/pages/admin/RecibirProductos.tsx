import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
import { API_CONFIG } from '../../config/api';
import toast from 'react-hot-toast';
import NavbarAdmin from '../../components/NavbarAdmin';
import './RecibirProductos.css';

interface StockDetallado {
  productoId: number;
  productoNombre: string;
  codigoPersonalizado?: string;
  ubicaciones: {
    ubicacion: string;
    cantidad: number;
    stockId: string;
  }[];
}

interface MovimientoPendiente {
  id: string;
  tipo: 'recibir' | 'enviar';
  productoId: number;
  stockId: string;
  ubicacion: string;
  cantidad: number;
  productoNombre: string;
  codigoPersonalizado?: string;
  /** true = línea revisada y lista para ejecutar el registro */
  confirmado: boolean;
  sectorDestinoId?: number;
  sectorDestinoNombre?: string;
}

const RecibirProductos: React.FC = () => {
  const { sectorId } = useParams<{ sectorId: string }>();
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();

  // Estados principales
  const [sector, setSector] = useState<any>(null);
  const [cargandoSector, setCargandoSector] = useState(true);
  const [stockDetallado, setStockDetallado] = useState<StockDetallado[]>([]);
  const [cargandoStock, setCargandoStock] = useState(true);
  const [modoOperacion, setModoOperacion] = useState<'recibir' | 'enviar'>('recibir');
  const [sectoresEmpresa, setSectoresEmpresa] = useState<any[]>([]);
  const [sectorDestinoId, setSectorDestinoId] = useState<number | ''>('');
  const [movimientos, setMovimientos] = useState<MovimientoPendiente[]>([]);
  const [guardando, setGuardando] = useState(false);

  // Estados para búsqueda y selección
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [productosFiltrados, setProductosFiltrados] = useState<StockDetallado[]>([]);
  const [productoSeleccionadoIndex, setProductoSeleccionadoIndex] = useState(-1);
  const [productoSeleccionado, setProductoSeleccionado] = useState<StockDetallado | null>(null);
  const [ubicacionesFiltradas, setUbicacionesFiltradas] = useState<any[]>([]);
  const [ubicacionSeleccionadaIndex, setUbicacionSeleccionadaIndex] = useState(-1);
  const [stockSeleccionado, setStockSeleccionado] = useState<any>(null);
  const [modoCantidad, setModoCantidad] = useState(false);
  const [cantidad, setCantidad] = useState('');
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [resultadoCalculo, setResultadoCalculo] = useState<number | null>(null);
  const [errorCalculo, setErrorCalculo] = useState<string | null>(null);
  /** Solo modo enviar: buscar producto → cantidad (reemplaza buscador) → destino → agregar */
  const [enviarPaso, setEnviarPaso] = useState<'buscar' | 'cantidad' | 'destino'>('buscar');

  // Referencias para focus
  const inputBusquedaRef = useRef<HTMLInputElement>(null);
  const recibirGridRef = useRef<HTMLDivElement>(null);
  const listaProductosRef = useRef<HTMLDivElement>(null);
  const listaUbicacionesRef = useRef<HTMLDivElement>(null);
  const inputCantidadRef = useRef<HTMLInputElement>(null);
  const selectDestinoRef = useRef<HTMLSelectElement>(null);
  const listaRecepcionesRef = useRef<HTMLDivElement>(null);

  // Función helper para hacer llamadas a la API
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const baseUrl = API_CONFIG.getBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/api') ? endpoint.substring(4) : endpoint;
    const url = `${baseUrl}${cleanEndpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
    
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  };

  // Función helper para calcular la cantidad total de stock disponible
  const calcularStockTotal = (producto: StockDetallado): number => {
    return producto.ubicaciones.reduce((total, ubicacion) => total + ubicacion.cantidad, 0);
  };

  // Función para evaluar expresiones matemáticas de forma segura
  const evaluarExpresion = (expresion: string): { resultado: number | null; error: string | null } => {
    try {
      // Limpiar la expresión de espacios
      const expresionLimpia = expresion.trim();
      
      // Verificar que la expresión no esté vacía
      if (!expresionLimpia) {
        return { resultado: null, error: 'Expresión vacía' };
      }

      // Verificar que solo contenga caracteres permitidos (números, operadores básicos, paréntesis)
      const caracteresPermitidos = /^[0-9+\-*/().\s]+$/;
      if (!caracteresPermitidos.test(expresionLimpia)) {
        return { resultado: null, error: 'Caracteres no permitidos. Solo números y operadores (+, -, *, /, paréntesis)' };
      }

      // Verificar que no contenga palabras clave peligrosas
      const palabrasPeligrosas = ['eval', 'function', 'constructor', 'prototype', 'window', 'document', 'global'];
      const expresionLower = expresionLimpia.toLowerCase();
      for (const palabra of palabrasPeligrosas) {
        if (expresionLower.includes(palabra)) {
          return { resultado: null, error: 'Expresión no permitida' };
        }
      }

      // Reemplazar 'x' por '*' para facilitar la escritura (ej: 3x60 -> 3*60)
      const expresionConMultiplicacion = expresionLimpia.replace(/x/gi, '*');

      // Evaluar la expresión usando Function constructor (más seguro que eval)
      const resultado = new Function('return ' + expresionConMultiplicacion)();
      
      // Verificar que el resultado sea un número válido
      if (typeof resultado !== 'number' || !isFinite(resultado)) {
        return { resultado: null, error: 'Resultado no es un número válido' };
      }

      // Verificar que el resultado sea un entero positivo
      if (resultado <= 0 || !Number.isInteger(resultado)) {
        return { resultado: null, error: 'El resultado debe ser un número entero positivo' };
      }

      return { resultado, error: null };
    } catch (error) {
      return { resultado: null, error: 'Expresión inválida' };
    }
  };

  const parseCantidadIngresada = (): { num: number; error: string | null } => {
    if (!cantidad.trim()) {
      return { num: 0, error: 'Indicá la cantidad' };
    }
    const contieneOperadores = /[+\-*/x()]/.test(cantidad);
    if (contieneOperadores) {
      const evaluacion = evaluarExpresion(cantidad);
      if (evaluacion.error) {
        return { num: 0, error: evaluacion.error };
      }
      return { num: evaluacion.resultado!, error: null };
    }
    const cantidadNum = parseInt(cantidad, 10);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      return { num: 0, error: 'Ingresá una cantidad válida' };
    }
    return { num: cantidadNum, error: null };
  };

  // Cargar información del sector
  const cargarSector = async () => {
    if (!datosUsuario?.empresaId) {
      toast.error('No se pudo obtener la información de la empresa');
      return;
    }
    
    try {
      setCargandoSector(true);
      const response = await apiCall(`/empresas/${datosUsuario.empresaId}/sectores/todos`);
      
      // Verificar que la respuesta sea un array o tenga la propiedad data
      const sectores = Array.isArray(response) ? response : (response?.data && Array.isArray(response.data) ? response.data : []);
      setSectoresEmpresa(sectores.filter((s: any) => s.activo !== false));
      const sectorEncontrado = sectores.find((s: any) => s.id === parseInt(sectorId!));
      if (sectorEncontrado) {
        setSector(sectorEncontrado);
      } else {
        toast.error('Sector no encontrado');
      }
    } catch (error) {
      console.error('Error cargando sector:', error);
      toast.error('Error al cargar información del sector');
    } finally {
      setCargandoSector(false);
    }
  };

  const cambiarModoOperacion = async (nuevo: 'recibir' | 'enviar') => {
    if (nuevo === modoOperacion) return;
    if (movimientos.length > 0) {
      const ok = window.confirm(
        'Hay líneas en la lista. Si cambiás de modo se vaciará la lista y se recargará el stock desde el servidor. ¿Continuar?'
      );
      if (!ok) return;
      try {
        await cargarStockDetallado();
      } catch {
        toast.error('No se pudo recargar el stock');
        return;
      }
      setMovimientos([]);
    }
    setModoOperacion(nuevo);
    setFiltroBusqueda('');
    setProductoSeleccionado(null);
    setUbicacionesFiltradas([]);
    setUbicacionSeleccionadaIndex(-1);
    setProductoSeleccionadoIndex(-1);
    setModoCantidad(false);
    setCantidad('');
    setStockSeleccionado(null);
    setSectorDestinoId('');
    setEnviarPaso('buscar');
  };

  // Cargar stock detallado
  const cargarStockDetallado = async () => {
    if (!datosUsuario?.empresaId) {
      toast.error('No se pudo obtener la información de la empresa');
      return;
    }

    try {
      setCargandoStock(true);
      const response = await apiCall(`/empresas/${datosUsuario.empresaId}/sectores/stock/detallado`);
      
      // Verificar que la respuesta sea un array
      const stockData = Array.isArray(response) ? response : (response?.data && Array.isArray(response.data) ? response.data : []);
      setStockDetallado(stockData);
    } catch (error) {
      console.error('Error cargando stock detallado:', error);
      toast.error('Error al cargar stock detallado');
    } finally {
      setCargandoStock(false);
    }
  };

  // Filtrar productos basado en la búsqueda
  useEffect(() => {
    if (!filtroBusqueda.trim()) {
      setProductosFiltrados([]);
      setProductoSeleccionadoIndex(-1);
      setMostrarOpciones(false);
      return;
    }

    console.log('🔍 [DEBUG] Total productos en stockDetallado:', stockDetallado.length);
    console.log('🔍 [DEBUG] Sector actual:', sector?.nombre);
    console.log('🔍 [DEBUG] Búsqueda:', filtroBusqueda);

    const filtrados = stockDetallado.filter(producto => {
      // Filtrar por código personalizado, código de barras o nombre (priorizando código personalizado)
      const matchCodigo = producto.codigoPersonalizado && producto.codigoPersonalizado.toLowerCase().includes(filtroBusqueda.toLowerCase());
      const matchNombre = producto.productoNombre.toLowerCase().includes(filtroBusqueda.toLowerCase());
      
      const coincideBusqueda = matchCodigo || matchNombre;
      
      if (!coincideBusqueda) return false;
      
      // Verificar que el producto tenga stock disponible en al menos una ubicación
      const tieneStockDisponible =
        modoOperacion === 'recibir'
          ? producto.ubicaciones.some(u => u.cantidad > 0 && u.ubicacion !== sector?.nombre)
          : producto.ubicaciones.some(u => u.cantidad > 0 && u.ubicacion === sector?.nombre);
      
      // Log para debug
      console.log('🔍 [DEBUG] Producto:', producto.productoNombre, {
        coincideBusqueda,
        tieneStockDisponible,
        ubicaciones: producto.ubicaciones.map(u => `${u.ubicacion}: ${u.cantidad}`)
      });
      
      return tieneStockDisponible;
    }).sort((a, b) => {
      const busqueda = filtroBusqueda.toLowerCase();
      
      // Prioridad 1: Coincidencia exacta en código personalizado
      const aCodigoExacto = a.codigoPersonalizado?.toLowerCase() === busqueda;
      const bCodigoExacto = b.codigoPersonalizado?.toLowerCase() === busqueda;
      if (aCodigoExacto && !bCodigoExacto) return -1;
      if (!aCodigoExacto && bCodigoExacto) return 1;
      
      // Prioridad 2: Coincidencia que empieza con el código personalizado
      const aCodigoInicio = a.codigoPersonalizado?.toLowerCase().startsWith(busqueda);
      const bCodigoInicio = b.codigoPersonalizado?.toLowerCase().startsWith(busqueda);
      if (aCodigoInicio && !bCodigoInicio) return -1;
      if (!aCodigoInicio && bCodigoInicio) return 1;
      
      // Prioridad 3: Coincidencia en código personalizado (contiene)
      const aTieneCodigo = a.codigoPersonalizado?.toLowerCase().includes(busqueda);
      const bTieneCodigo = b.codigoPersonalizado?.toLowerCase().includes(busqueda);
      if (aTieneCodigo && !bTieneCodigo) return -1;
      if (!aTieneCodigo && bTieneCodigo) return 1;
      
      // Prioridad 4: Coincidencia en nombre (orden alfabético)
      return a.productoNombre.localeCompare(b.productoNombre);
    });

    console.log('🔍 [DEBUG] Productos filtrados:', filtrados.length);
    console.log('🔍 [DEBUG] Productos filtrados:', filtrados.map(p => p.productoNombre));

    setProductosFiltrados(filtrados);
    setProductoSeleccionadoIndex(-1);
    
    // Mostrar opciones con animación si hay resultados
    if (filtrados.length > 0) {
      setMostrarOpciones(true);
    } else {
      setMostrarOpciones(false);
    }
  }, [filtroBusqueda, stockDetallado, modoOperacion, sector?.nombre]);

  // Estado para controlar el focus del buscador
  const [focusBuscador, setFocusBuscador] = useState(false);

  // Al volver al buscador: alinear el bloque de las 3 columnas al margen superior (navbar) y luego enfocar el input
  useEffect(() => {
    if (focusBuscador && !cargandoSector && !cargandoStock) {
      const grid = recibirGridRef.current;
      if (grid) {
        requestAnimationFrame(() => {
          grid.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
        });
      }
      if (inputBusquedaRef.current) {
        inputBusquedaRef.current.focus();
      }
      setFocusBuscador(false);
    }
  }, [focusBuscador, cargandoSector, cargandoStock]);


  // Auto-focus en el campo de cantidad cuando se activa
  useEffect(() => {
    if (modoCantidad && inputCantidadRef.current) {
      inputCantidadRef.current.focus();
      inputCantidadRef.current.select();
    }
  }, [modoCantidad]);

  // Calcular resultado en tiempo real cuando se escribe en el campo de cantidad
  useEffect(() => {
    if (!cantidad.trim()) {
      setResultadoCalculo(null);
      setErrorCalculo(null);
      return;
    }

    // Verificar si la cantidad contiene operadores matemáticos
    const contieneOperadores = /[+\-*/x()]/.test(cantidad);
    
    if (contieneOperadores) {
      const evaluacion = evaluarExpresion(cantidad);
      if (evaluacion.error) {
        setResultadoCalculo(null);
        setErrorCalculo(evaluacion.error);
      } else {
        setResultadoCalculo(evaluacion.resultado);
        setErrorCalculo(null);
      }
    } else {
      // Si no contiene operadores, limpiar el resultado
      setResultadoCalculo(null);
      setErrorCalculo(null);
    }
  }, [cantidad]);

  // Auto-scroll para la lista de productos
  useEffect(() => {
    if (productoSeleccionadoIndex >= 0 && listaProductosRef.current) {
      const container = listaProductosRef.current;
      const items = container.children;
      
      if (items[productoSeleccionadoIndex]) {
        const selectedItem = items[productoSeleccionadoIndex] as HTMLElement;
        const containerRect = container.getBoundingClientRect();
        const itemRect = selectedItem.getBoundingClientRect();
        
        // Calcular si el elemento está fuera de la vista
        if (itemRect.top < containerRect.top || itemRect.bottom > containerRect.bottom) {
          selectedItem.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }
      }
    }
  }, [productoSeleccionadoIndex]);

  // Auto-scroll para la lista de ubicaciones
  useEffect(() => {
    if (ubicacionSeleccionadaIndex >= 0 && listaUbicacionesRef.current) {
      const container = listaUbicacionesRef.current;
      const items = container.children;
      
      if (items[ubicacionSeleccionadaIndex]) {
        const selectedItem = items[ubicacionSeleccionadaIndex] as HTMLElement;
        const containerRect = container.getBoundingClientRect();
        const itemRect = selectedItem.getBoundingClientRect();
        
        // Calcular si el elemento está fuera de la vista
        if (itemRect.top < containerRect.top || itemRect.bottom > containerRect.bottom) {
          selectedItem.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }
      }
    }
  }, [ubicacionSeleccionadaIndex]);

  useEffect(() => {
    if (modoOperacion !== 'enviar' || !modoCantidad || !stockSeleccionado) return;
    if (enviarPaso !== 'cantidad') return;
    const t = window.setTimeout(() => {
      inputCantidadRef.current?.focus();
      inputCantidadRef.current?.select();
    }, 90);
    return () => window.clearTimeout(t);
  }, [modoOperacion, modoCantidad, stockSeleccionado, enviarPaso]);

  useEffect(() => {
    if (modoOperacion !== 'enviar' || enviarPaso !== 'destino') return;
    const t = window.setTimeout(() => {
      selectDestinoRef.current?.focus();
    }, 90);
    return () => window.clearTimeout(t);
  }, [modoOperacion, enviarPaso]);

  // Seleccionar producto
  const seleccionarProducto = (producto: StockDetallado) => {
    setProductoSeleccionado(producto);
    const ubicacionesConStock = producto.ubicaciones.filter(ubicacion => {
      const tieneStock = ubicacion.cantidad > 0;
      if (modoOperacion === 'recibir') {
        return tieneStock && ubicacion.ubicacion !== sector?.nombre;
      }
      return tieneStock && ubicacion.ubicacion === sector?.nombre;
    });
    
    console.log('🔍 [DEBUG] Ubicaciones filtradas:', ubicacionesConStock.map(u => `${u.ubicacion}: ${u.cantidad}`));
    console.log('🔍 [DEBUG] Modo:', modoOperacion, 'Sector actual:', sector?.nombre);
    
    if (ubicacionesConStock.length === 0) {
      toast.error(
        modoOperacion === 'enviar'
          ? `No hay stock en "${sector?.nombre || 'este depósito'}" para este producto`
          : 'No hay stock en otros depósitos para traer a este sector'
      );
      setProductoSeleccionado(null);
      setFiltroBusqueda('');
      setUbicacionesFiltradas([]);
      return;
    }

    setUbicacionesFiltradas(ubicacionesConStock);
    setUbicacionSeleccionadaIndex(ubicacionesConStock.length > 0 ? 0 : -1);
    setFiltroBusqueda(producto.productoNombre);
    if (ubicacionesConStock.length > 0) {
      setMostrarOpciones(true);
    }
  };

  // Seleccionar ubicación
  const seleccionarUbicacion = (ubicacion: any) => {
    setStockSeleccionado(ubicacion);
    setModoCantidad(true);
    setCantidad('');
    setSectorDestinoId('');
    setEnviarPaso(modoOperacion === 'enviar' ? 'cantidad' : 'buscar');
  };

  const avanzarCantidadEnviarAlDestino = () => {
    if (modoOperacion !== 'enviar' || enviarPaso !== 'cantidad') return;
    if (!stockSeleccionado) return;
    const { num, error } = parseCantidadIngresada();
    if (error) {
      toast.error(error);
      return;
    }
    if (num > stockSeleccionado.cantidad) {
      toast.error('La cantidad no puede ser mayor al stock disponible en el origen');
      return;
    }
    setEnviarPaso('destino');
    setSectorDestinoId('');
  };

  // Agregar línea a la lista (aún no registrada en servidor; confirmación aparte)
  const confirmarRecepcion = () => {
    if (!productoSeleccionado || !stockSeleccionado) {
      toast.error('Completá producto y origen');
      return;
    }

    if (modoOperacion === 'enviar') {
      if (enviarPaso !== 'destino') {
        toast.error('Completá cantidad y destino antes de agregar');
        return;
      }
      if (sectorDestinoId === '' || sectorDestinoId === Number(sectorId)) {
        toast.error('Elegí un sector destino distinto al actual');
        return;
      }
    }

    const { num: cantidadNum, error: errCant } = parseCantidadIngresada();
    if (errCant) {
      toast.error(errCant);
      return;
    }

    if (cantidadNum > stockSeleccionado.cantidad) {
      toast.error('La cantidad no puede ser mayor al stock disponible en el origen');
      return;
    }

    let destNombre: string | undefined;
    if (modoOperacion === 'enviar' && sectorDestinoId !== '') {
      destNombre = sectoresEmpresa.find((s: any) => s.id === sectorDestinoId)?.nombre;
    }

    const nuevaLinea: MovimientoPendiente = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `m-${Date.now()}-${Math.random()}`,
      tipo: modoOperacion,
      productoId: productoSeleccionado.productoId,
      stockId: stockSeleccionado.stockId,
      ubicacion: stockSeleccionado.ubicacion,
      cantidad: cantidadNum,
      productoNombre: productoSeleccionado.productoNombre,
      codigoPersonalizado: productoSeleccionado.codigoPersonalizado,
      confirmado: false,
      sectorDestinoId: modoOperacion === 'enviar' ? Number(sectorDestinoId) : undefined,
      sectorDestinoNombre: destNombre
    };

    setMovimientos(prev => [...prev, nuevaLinea]);
    
    setStockDetallado(prevStock => 
      prevStock.map(producto => {
        if (producto.productoId === productoSeleccionado.productoId) {
          return {
            ...producto,
            ubicaciones: producto.ubicaciones.map(ubicacion => {
              if (ubicacion.stockId === stockSeleccionado.stockId) {
                return {
                  ...ubicacion,
                  cantidad: Math.max(0, ubicacion.cantidad - cantidadNum)
                };
              }
              return ubicacion;
            })
          };
        }
        return producto;
      })
    );
    
    setProductoSeleccionado(null);
    setStockSeleccionado(null);
    setModoCantidad(false);
    setCantidad('');
    setFiltroBusqueda('');
    setUbicacionesFiltradas([]);
    setUbicacionSeleccionadaIndex(-1);
    setProductoSeleccionadoIndex(-1);
    setResultadoCalculo(null);
    setErrorCalculo(null);
    setSectorDestinoId('');
    setEnviarPaso('buscar');

    setTimeout(() => {
      setFocusBuscador(true);
    }, 100);

    toast.success('Línea agregada. Confirmala con el tilde para incluirla en el registro final.');
  };

  const toggleConfirmarLinea = (id: string) => {
    setMovimientos(prev =>
      prev.map(m => (m.id === id ? { ...m, confirmado: !m.confirmado } : m))
    );
  };

  // Función para hacer scroll automático al último producto agregado a la recepción
  const scrollToLastProduct = () => {
    if (listaRecepcionesRef.current && movimientos.length > 0) {
      const container = listaRecepcionesRef.current;
      const lastProductIndex = movimientos.length - 1;
      
      // Buscar el último elemento de producto en la lista
      const productElements = container.querySelectorAll('[data-product-index]');
      const lastProductElement = productElements[lastProductIndex] as HTMLElement;
      
      if (lastProductElement) {
        // Verificar si el contenedor tiene scroll disponible
        const hasScroll = container.scrollHeight > container.clientHeight;
        
        if (hasScroll) {
          // Calcular la posición del último elemento dentro del contenedor
          const containerHeight = container.clientHeight;
          const elementOffsetTop = lastProductElement.offsetTop;
          const elementHeight = lastProductElement.offsetHeight;
          const currentScrollTop = container.scrollTop;
          
          // Calcular si el elemento está visible en el área visible del contenedor
          const elementTop = elementOffsetTop - currentScrollTop;
          const elementBottom = elementTop + elementHeight;
          
          // Verificar si el elemento está completamente visible
          const isFullyVisible = elementTop >= 0 && elementBottom <= containerHeight;
          
          if (!isFullyVisible) {
            // Calcular la posición de scroll para que el último elemento quede visible
            const targetScrollTop = elementOffsetTop + elementHeight - containerHeight + 20; // 20px de margen
            
            // Hacer scroll solo dentro del contenedor, sin afectar la página
            container.scrollTo({
              top: Math.max(0, targetScrollTop),
              behavior: 'smooth'
            });
          }
        }
      }
    }
  };

  // Cancelar cantidad
  const cancelarCantidad = () => {
    if (modoOperacion === 'enviar') {
      setModoCantidad(false);
      setCantidad('');
      setStockSeleccionado(null);
      setProductoSeleccionado(null);
      setUbicacionesFiltradas([]);
      setUbicacionSeleccionadaIndex(-1);
      setFiltroBusqueda('');
      setSectorDestinoId('');
      setEnviarPaso('buscar');
    } else {
      setModoCantidad(false);
      setCantidad('');
      setStockSeleccionado(null);
      setUbicacionSeleccionadaIndex(0);
    }
    setResultadoCalculo(null);
    setErrorCalculo(null);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (modoCantidad) {
        if (modoOperacion === 'enviar') {
          if (event.key === 'Escape') {
            event.preventDefault();
            cancelarCantidad();
            return;
          }
          if (event.key === 'Enter') {
            event.preventDefault();
            if (enviarPaso === 'cantidad') {
              avanzarCantidadEnviarAlDestino();
            } else if (enviarPaso === 'destino') {
              confirmarRecepcion();
            }
            return;
          }
          return;
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          confirmarRecepcion();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          cancelarCantidad();
        }
        return;
      }

      if (productoSeleccionado && ubicacionesFiltradas.length > 0) {
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setUbicacionSeleccionadaIndex(prev =>
            prev <= 0 ? ubicacionesFiltradas.length - 1 : prev - 1
          );
        } else if (event.key === 'ArrowDown') {
          event.preventDefault();
          setUbicacionSeleccionadaIndex(prev =>
            prev >= ubicacionesFiltradas.length - 1 ? 0 : prev + 1
          );
        } else if (event.key === 'Enter') {
          event.preventDefault();
          if (ubicacionSeleccionadaIndex >= 0) {
            seleccionarUbicacion(ubicacionesFiltradas[ubicacionSeleccionadaIndex]);
          }
        } else if (event.key === 'Escape') {
          event.preventDefault();
          setProductoSeleccionado(null);
          setUbicacionesFiltradas([]);
          setUbicacionSeleccionadaIndex(-1);
        }
        return;
      }

      if (productosFiltrados.length > 0) {
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setProductoSeleccionadoIndex(prev =>
            prev <= 0 ? productosFiltrados.length - 1 : prev - 1
          );
        } else if (event.key === 'ArrowDown') {
          event.preventDefault();
          setProductoSeleccionadoIndex(prev =>
            prev >= productosFiltrados.length - 1 ? 0 : prev + 1
          );
        } else if (event.key === 'Enter') {
          event.preventDefault();
          if (productoSeleccionadoIndex >= 0) {
            seleccionarProducto(productosFiltrados[productoSeleccionadoIndex]);
          }
        } else if (event.key === 'Escape') {
          event.preventDefault();
          setFiltroBusqueda('');
          setProductosFiltrados([]);
          setProductoSeleccionadoIndex(-1);
        }
        return;
      }

      if (event.key === 'Enter' && !filtroBusqueda.trim()) {
        event.preventDefault();
        setFocusBuscador(true);
      }

      if (event.key === 'Escape' && !filtroBusqueda.trim() && productosFiltrados.length === 0 && !productoSeleccionado) {
        event.preventDefault();
        navigate('/admin/sectores');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    productosFiltrados,
    productoSeleccionadoIndex,
    productoSeleccionado,
    ubicacionesFiltradas,
    ubicacionSeleccionadaIndex,
    modoCantidad,
    modoOperacion,
    enviarPaso,
    cantidad,
    filtroBusqueda,
    navigate
  ]);

  const removerMovimiento = (id: string) => {
    const linea = movimientos.find(m => m.id === id);
    if (!linea) return;
    setStockDetallado(prevStock => 
      prevStock.map(producto => {
        if (producto.productoId === linea.productoId) {
          return {
            ...producto,
            ubicaciones: producto.ubicaciones.map(ubicacion => {
              if (ubicacion.stockId === linea.stockId) {
                return {
                  ...ubicacion,
                  cantidad: ubicacion.cantidad + linea.cantidad
                };
              }
              return ubicacion;
            })
          };
        }
        return producto;
      })
    );
    setMovimientos(prev => prev.filter(m => m.id !== id));
    toast.success('Línea quitada de la lista');
  };

  const registrarMovimientos = async () => {
    if (movimientos.length === 0) {
      toast.error('No hay movimientos en la lista');
      return;
    }
    if (!movimientos.every(m => m.confirmado)) {
      toast.error('Confirmá todas las líneas con el tilde antes de registrar');
      return;
    }

    if (!datosUsuario?.empresaId || !sectorId) {
      toast.error('Error: No se pudo obtener la información necesaria');
      return;
    }

    try {
      setGuardando(true);
      const sid = parseInt(sectorId, 10);
      const recibos = movimientos.filter(m => m.tipo === 'recibir');
      const envios = movimientos.filter(m => m.tipo === 'enviar');

      if (recibos.length > 0) {
        await apiCall(`/empresas/${datosUsuario.empresaId}/sectores/${sectorId}/recibir-productos`, {
          method: 'POST',
          body: JSON.stringify({
            recepciones: recibos.map(r => ({
              productoId: r.productoId,
              stockId: r.stockId,
              cantidad: r.cantidad
            }))
          })
        });
      }

      for (const e of envios) {
        if (!e.sectorDestinoId) {
          throw new Error('Falta sector destino en un envío');
        }
        await apiCall(`/empresas/${datosUsuario.empresaId}/sectores/transferir-stock`, {
          method: 'POST',
          body: JSON.stringify({
            productoId: e.productoId,
            sectorOrigenId: sid,
            sectorDestinoId: e.sectorDestinoId,
            cantidad: e.cantidad
          })
        });
      }

      toast.success('Movimientos registrados correctamente');
      // Volver a sectores de inmediato: no recargar stock aquí (provocaba pantalla "Cargando..." y lista vacía antes de salir)
      navigate('/admin/sectores', { replace: true });
    } catch (error) {
      console.error('Error al registrar movimientos:', error);
      toast.error('Error al registrar movimientos');
    } finally {
      setGuardando(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    if (datosUsuario?.empresaId) {
      cargarSector();
      cargarStockDetallado();
    }
  }, [datosUsuario]);

  useEffect(() => {
    if (movimientos.length > 0 && !modoCantidad) {
      if (movimientos.length > 3) {
        const timeoutId = setTimeout(() => {
          scrollToLastProduct();
        }, 200);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [movimientos.length, modoCantidad]);

  if (cargandoSector || cargandoStock || !datosUsuario) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280', margin: 0 }}>Cargando...</p>
        </div>
      </div>
    );
  }

  const ocultarBuscadorEnviar =
    modoOperacion === 'enviar' &&
    modoCantidad &&
    stockSeleccionado &&
    (enviarPaso === 'cantidad' || enviarPaso === 'destino');

  const sectoresDestinoLista = sectoresEmpresa.filter(
    (s: any) => s.id !== parseInt(sectorId || '0', 10)
  );
  const sizeListaDestino = Math.min(8, Math.max(2, sectoresDestinoLista.length || 2));

  return (
    <>
      <NavbarAdmin
        onCerrarSesion={cerrarSesion}
        empresaNombre={datosUsuario.empresaNombre}
        nombreAdministrador={datosUsuario.nombre}
      />
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          width: '100%',
          margin: '0 auto',
          padding: isMobile ? '8.5rem 1rem 2rem 1rem' : '7rem 2rem 2rem 2rem'
        }}>
          <header className="recibir-page-header">
            <div className="recibir-page-header__row">
              <button
                type="button"
                className="recibir-page-header__back"
                onClick={() => navigate('/admin/sectores')}
              >
                ← Volver
              </button>
              <div className="recibir-page-header__titles">
                <h1 className="recibir-page-header__title">Movimientos de stock</h1>
                <p className="recibir-page-header__meta">
                  Depósito: <strong>{sector?.nombre}</strong>
                  <span className="recibir-page-header__hint-inline">
                    {' · '}
                    {modoOperacion === 'recibir'
                      ? 'Traé stock desde otros depósitos o general hacia acá.'
                      : 'Enviá stock de acá hacia otro depósito.'}
                  </span>
                </p>
              </div>
              <div className="recibir-page-header__segment" role="group" aria-label="Tipo de operación">
                <button
                  type="button"
                  className={
                    'recibir-page-header__mode' +
                    (modoOperacion === 'recibir' ? ' recibir-page-header__mode--recibir-active' : '')
                  }
                  onClick={() => cambiarModoOperacion('recibir')}
                >
                  Recibir aquí
                </button>
                <button
                  type="button"
                  className={
                    'recibir-page-header__mode' +
                    (modoOperacion === 'enviar' ? ' recibir-page-header__mode--enviar-active' : '')
                  }
                  onClick={() => cambiarModoOperacion('enviar')}
                >
                  Enviar desde aquí
                </button>
              </div>
            </div>
          </header>

          <div
            ref={recibirGridRef}
            className="recibir-productos-container"
            style={{ scrollMarginTop: isMobile ? '8.5rem' : '6.75rem' }}
          >
            {/* Panel izquierdo - Búsqueda y selección */}
            <div className="panel-busqueda">
              <div className="card recibir-card">
                <div className="recibir-card__header">
                  <h2 className="recibir-card__title">Buscador avanzado</h2>
                  <p className="recibir-card__subtitle">Buscá por nombre o código y elegí origen</p>
                </div>
                <div className="recibir-card__body buscador-avanzado">
                {/* Campo de búsqueda y cantidad */}
                <div style={{ marginBottom: '1rem' }}>
                  {/* Enviar: solo cantidad (reemplaza al buscador) */}
                  {modoOperacion === 'enviar' && modoCantidad && stockSeleccionado && enviarPaso === 'cantidad' && (
                    <>
                      <div style={{
                        background: '#fff7ed',
                        padding: isMobile ? '1rem' : '0.75rem',
                        borderRadius: '8px',
                        border: '2px solid #fdba74',
                        marginBottom: '1rem',
                        fontSize: isMobile ? '0.875rem' : '0.875rem'
                      }}>
                        <div style={{ fontWeight: '600', marginBottom: '0.35rem' }}>
                          {productoSeleccionado?.codigoPersonalizado && (
                            <span style={{ color: '#ea580c', fontWeight: '700' }}>{productoSeleccionado.codigoPersonalizado} · </span>
                          )}
                          {productoSeleccionado?.productoNombre}
                        </div>
                        <div style={{ color: '#64748b' }}>Origen: {stockSeleccionado.ubicacion} · Disponible: {stockSeleccionado.cantidad}</div>
                      </div>
                      <label style={{
                        display: 'block',
                        fontSize: isMobile ? '1rem' : '0.875rem',
                        fontWeight: '600',
                        color: '#9a3412',
                        marginBottom: isMobile ? '0.75rem' : '0.5rem'
                      }}>
                        Cantidad a enviar
                      </label>
                      <input
                        ref={inputCantidadRef}
                        type="text"
                        inputMode="numeric"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        placeholder="Ej: 10, 3*5..."
                        autoComplete="off"
                        style={{
                          width: '100%',
                          padding: isMobile ? '1rem' : '0.85rem',
                          border: '2px solid #fdba74',
                          borderRadius: '8px',
                          fontSize: isMobile ? '1.15rem' : '1.1rem',
                          background: 'white',
                          minHeight: isMobile ? '52px' : '48px'
                        }}
                      />
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
                        Enter: siguiente paso · Esc: cancelar
                      </div>
                      {resultadoCalculo !== null && (
                        <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.35rem', fontWeight: 600 }}>
                          Resultado: {resultadoCalculo.toLocaleString()} u.
                        </div>
                      )}
                      {errorCalculo && (
                        <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.35rem' }}>{errorCalculo}</div>
                      )}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button type="button" onClick={avanzarCantidadEnviarAlDestino} style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                          Siguiente: destino
                        </button>
                        <button type="button" onClick={cancelarCantidad} style={{ padding: '0.75rem 1rem', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                          Cancelar
                        </button>
                      </div>
                    </>
                  )}

                  {/* Enviar: elegir destino (lista desplazable) */}
                  {modoOperacion === 'enviar' && modoCantidad && stockSeleccionado && enviarPaso === 'destino' && (
                    <>
                      <div style={{
                        background: '#f8fafc',
                        padding: isMobile ? '1rem' : '0.75rem',
                        borderRadius: '8px',
                        border: '2px solid #e2e8f0',
                        marginBottom: '1rem',
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ fontWeight: 600 }}>{productoSeleccionado?.productoNombre}</div>
                        <div style={{ color: '#64748b', marginTop: '0.25rem' }}>
                          {(() => {
                            const p = parseCantidadIngresada();
                            return (
                              <>
                                Cantidad: <strong>{p.error ? '—' : p.num}</strong> · Máx. {stockSeleccionado.cantidad}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      <label style={{ display: 'block', fontWeight: 600, color: '#9a3412', marginBottom: '0.5rem' }}>
                        Depósito destino (↑↓ o deslizar)
                      </label>
                      <select
                        ref={selectDestinoRef}
                        size={sizeListaDestino}
                        value={sectorDestinoId === '' ? '' : String(sectorDestinoId)}
                        onChange={(e) => setSectorDestinoId(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            confirmarRecepcion();
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '0.35rem',
                          borderRadius: '8px',
                          border: '2px solid #fdba74',
                          fontSize: isMobile ? '1rem' : '0.95rem',
                          background: 'white',
                          touchAction: 'pan-y'
                        }}
                      >
                        <option value="">Elegí depósito…</option>
                        {sectoresDestinoLista.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.nombre}</option>
                        ))}
                      </select>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', lineHeight: 1.4 }}>
                        Elegí el depósito y pulsá <strong>Enter</strong> para agregar a la lista y volver al buscador. <strong>Esc</strong> cancela.
                      </p>
                      <button
                        type="button"
                        onClick={cancelarCantidad}
                        style={{
                          marginTop: '0.75rem',
                          padding: '0.65rem 1rem',
                          background: '#f1f5f9',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        Cancelar
                      </button>
                    </>
                  )}

                  {!ocultarBuscadorEnviar && (
                  <>
                  {!(modoCantidad && stockSeleccionado && modoOperacion === 'recibir') && (
                  <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: '1rem',
                    alignItems: isMobile ? 'stretch' : 'flex-end'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <label style={{
                        display: 'block',
                        fontSize: isMobile ? '1rem' : '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: isMobile ? '0.75rem' : '0.5rem'
                      }}>
                        Buscar por nombre o código:
                      </label>
                      <input
                        ref={inputBusquedaRef}
                        type="text"
                        value={filtroBusqueda}
                        onChange={(e) => setFiltroBusqueda(e.target.value)}
                        placeholder="Escribe el nombre o código del producto..."
                        style={{
                          width: '100%',
                          padding: isMobile ? '1rem' : '0.75rem',
                          border: '2px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: isMobile ? '1rem' : '1rem',
                          background: 'white',
                          transition: 'all 0.2s ease',
                          minHeight: isMobile ? '48px' : 'auto'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#667eea';
                          e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>
                  )}

                  {modoCantidad && stockSeleccionado && modoOperacion === 'recibir' && (
                    <>
                      <div style={{
                        background: '#f8fafc',
                        padding: isMobile ? '1rem' : '0.75rem',
                        borderRadius: '8px',
                        border: '2px solid #e2e8f0',
                        marginTop: isMobile ? '0.5rem' : '0',
                        fontSize: isMobile ? '0.875rem' : '0.875rem'
                      }}>
                        <div style={{ fontWeight: '600', marginBottom: isMobile ? '0.5rem' : '0.25rem' }}>
                          {productoSeleccionado?.codigoPersonalizado ? (
                            <>
                              <span style={{ color: '#3b82f6', fontWeight: '700' }}>
                                {productoSeleccionado.codigoPersonalizado}
                              </span>
                              <br />
                              {productoSeleccionado.productoNombre}
                            </>
                          ) : (
                            productoSeleccionado?.productoNombre
                          )}
                        </div>
                        <div style={{ color: '#64748b', marginBottom: isMobile ? '0.5rem' : '0.25rem' }}>
                          Desde: {stockSeleccionado.ubicacion}
                        </div>
                        <div style={{ color: '#64748b' }}>
                          Stock disponible: {stockSeleccionado.cantidad}
                        </div>
                      </div>
                      <label style={{
                        display: 'block',
                        fontSize: isMobile ? '0.875rem' : '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginTop: isMobile ? '0.85rem' : '0.75rem',
                        marginBottom: isMobile ? '0.5rem' : '0.4rem'
                      }}>
                        Cantidad a recibir
                      </label>
                      <input
                        ref={inputCantidadRef}
                        type="text"
                        inputMode="numeric"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        placeholder="Ej: 336, 3*112, 3x60..."
                        autoComplete="off"
                        style={{
                          width: '100%',
                          padding: isMobile ? '1rem' : '0.75rem',
                          border: '2px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: isMobile ? '1rem' : '1rem',
                          background: 'white',
                          transition: 'all 0.2s ease',
                          minHeight: isMobile ? '48px' : 'auto'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#667eea';
                          e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <div style={{
                        fontSize: isMobile ? '0.75rem' : '0.75rem',
                        color: '#64748b',
                        marginTop: '0.35rem',
                        lineHeight: 1.35
                      }}>
                        Podés usar +, −, ×, /, x y paréntesis. <strong>Enter</strong> agrega a la lista · <strong>Esc</strong> vuelve al paso anterior.
                      </div>
                      {resultadoCalculo !== null && (
                        <div style={{
                          fontSize: isMobile ? '0.75rem' : '0.75rem',
                          color: '#10b981',
                          marginTop: '0.35rem',
                          fontWeight: '600',
                          background: '#f0fdf4',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #bbf7d0'
                        }}>
                          Resultado: {resultadoCalculo.toLocaleString()} unidades
                        </div>
                      )}
                      {errorCalculo && (
                        <div style={{
                          fontSize: isMobile ? '0.75rem' : '0.75rem',
                          color: '#ef4444',
                          marginTop: '0.35rem',
                          fontWeight: '600',
                          background: '#fef2f2',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #fecaca'
                        }}>
                          {errorCalculo}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={cancelarCantidad}
                        style={{
                          marginTop: isMobile ? '0.85rem' : '0.75rem',
                          width: '100%',
                          padding: isMobile ? '0.75rem' : '0.65rem 1rem',
                          background: '#f1f5f9',
                          color: '#374151',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: isMobile ? '0.95rem' : '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          minHeight: isMobile ? '44px' : 'auto'
                        }}
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                  </>
                  )}
                </div>

                {/* Instrucciones */}
                {!filtroBusqueda.trim() && !ocultarBuscadorEnviar && (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#64748b',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '2px dashed #cbd5e1'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                    <p style={{ margin: 0, fontSize: '1rem', marginBottom: '0.5rem' }}>
                      Presiona <kbd style={{
                        background: '#e2e8f0',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151'
                      }}>Enter</kbd> para activar el buscador
                    </p>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                      Luego escribe el nombre o código del producto
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                      <kbd style={{
                        background: '#e2e8f0',
                        border: '1px solid #cbd5e1',
                        borderRadius: '3px',
                        padding: '0.125rem 0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#374151'
                      }}>Esc</kbd> para volver a gestión de sectores
                    </p>
                  </div>
                )}

                {/* Lista de productos filtrados - Diseño compacto */}
                {productosFiltrados.length > 0 && !productoSeleccionado && (
                  <div style={{
                    position: 'relative',
                    marginTop: '0.5rem',
                    background: 'white',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    maxHeight: '250px',
                    overflowY: 'auto',
                    zIndex: 10,
                    opacity: mostrarOpciones ? 1 : 0,
                    transform: mostrarOpciones ? 'translateY(0)' : 'translateY(-10px)',
                    transition: 'all 0.2s ease-in-out'
                  }}>
                    <div style={{
                      padding: isMobile ? '0.75rem' : '0.5rem',
                      borderBottom: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      borderTopLeftRadius: '6px',
                      borderTopRightRadius: '6px'
                    }}>
                      <span style={{
                        fontSize: isMobile ? '1rem' : '0.875rem',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        📦 {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''} encontrado{productosFiltrados.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div ref={listaProductosRef}>
                      {productosFiltrados.map((producto, index) => (
                        <div
                          key={producto.productoId}
                          style={{
                            padding: isMobile ? '1rem' : '0.75rem',
                            borderBottom: index < productosFiltrados.length - 1 ? '1px solid #f1f5f9' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            background: productoSeleccionadoIndex === index ? '#667eea' : 'white',
                            color: productoSeleccionadoIndex === index ? 'white' : '#1e293b',
                            minHeight: isMobile ? '70px' : 'auto'
                          }}
                          onClick={() => seleccionarProducto(producto)}
                          onMouseEnter={(e) => {
                            if (productoSeleccionadoIndex !== index) {
                              e.currentTarget.style.background = '#f8fafc';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (productoSeleccionadoIndex !== index) {
                              e.currentTarget.style.background = 'white';
                            }
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: isMobile ? '0.5rem' : '0.25rem'
                          }}>
                            <div style={{ 
                              fontWeight: '600', 
                              flex: 1,
                              fontSize: isMobile ? '1rem' : 'inherit',
                              lineHeight: isMobile ? '1.3' : 'inherit'
                            }}>
                              {producto.codigoPersonalizado ? (
                                <>
                                  <span style={{ 
                                    color: productoSeleccionadoIndex === index ? '#bfdbfe' : '#3b82f6', 
                                    fontWeight: '700' 
                                  }}>
                                    {producto.codigoPersonalizado}
                                  </span>
                                  <br />
                                  {producto.productoNombre}
                                </>
                              ) : (
                                producto.productoNombre
                              )}
                            </div>
                            <div style={{
                              display: 'flex',
                              gap: isMobile ? '0.75rem' : '0.5rem',
                              alignItems: 'center'
                            }}>
                              <div style={{
                                fontSize: isMobile ? '0.8rem' : '0.75rem',
                                padding: isMobile ? '0.5rem' : '0.25rem 0.5rem',
                                background: productoSeleccionadoIndex === index ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                                borderRadius: '4px',
                                color: productoSeleccionadoIndex === index ? 'white' : '#64748b'
                              }}>
                                {producto.ubicaciones.length} ubic.
                              </div>
                              <div style={{
                                fontSize: isMobile ? '0.8rem' : '0.75rem',
                                padding: isMobile ? '0.5rem' : '0.25rem 0.5rem',
                                background: productoSeleccionadoIndex === index ? 'rgba(255,255,255,0.2)' : '#10b981',
                                borderRadius: '4px',
                                color: productoSeleccionadoIndex === index ? 'white' : 'white',
                                fontWeight: '600'
                              }}>
                                📦 {calcularStockTotal(producto)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista de ubicaciones del producto seleccionado - Diseño compacto */}
                {productoSeleccionado && ubicacionesFiltradas.length > 0 && !modoCantidad && (
                  <div style={{
                    position: 'relative',
                    marginTop: '0.5rem',
                    background: 'white',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 10,
                    opacity: mostrarOpciones ? 1 : 0,
                    transform: mostrarOpciones ? 'translateY(0)' : 'translateY(-10px)',
                    transition: 'all 0.2s ease-in-out'
                  }}>
                    <div style={{
                      padding: isMobile ? '0.75rem' : '0.5rem',
                      borderBottom: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      borderTopLeftRadius: '6px',
                      borderTopRightRadius: '6px'
                    }}>
                      <span style={{
                        fontSize: isMobile ? '1rem' : '0.875rem',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        {modoOperacion === 'enviar'
                          ? `📍 Stock en "${sector?.nombre}" — ${productoSeleccionado.productoNombre}`
                          : `📍 Origen (otros depósitos) — ${productoSeleccionado.productoNombre}`}
                      </span>
                    </div>
                    <div ref={listaUbicacionesRef}>
                      {ubicacionesFiltradas.map((ubicacion, index) => (
                        <div
                          key={ubicacion.stockId}
                          style={{
                            padding: isMobile ? '1rem' : '0.75rem',
                            borderBottom: index < ubicacionesFiltradas.length - 1 ? '1px solid #f1f5f9' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            background: ubicacionSeleccionadaIndex === index ? '#667eea' : 'white',
                            color: ubicacionSeleccionadaIndex === index ? 'white' : '#1e293b',
                            minHeight: isMobile ? '60px' : 'auto'
                          }}
                          onClick={() => seleccionarUbicacion(ubicacion)}
                          onMouseEnter={(e) => {
                            if (ubicacionSeleccionadaIndex !== index) {
                              e.currentTarget.style.background = '#f8fafc';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (ubicacionSeleccionadaIndex !== index) {
                              e.currentTarget.style.background = 'white';
                            }
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{ 
                              fontWeight: '600',
                              fontSize: isMobile ? '1rem' : 'inherit',
                              lineHeight: isMobile ? '1.3' : 'inherit'
                            }}>
                              📍 {ubicacion.ubicacion}
                            </div>
                            <div style={{
                              fontSize: isMobile ? '0.8rem' : '0.875rem',
                              padding: isMobile ? '0.5rem' : '0.25rem 0.5rem',
                              background: ubicacionSeleccionadaIndex === index ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                              borderRadius: '4px',
                              color: ubicacionSeleccionadaIndex === index ? 'white' : '#64748b',
                              fontWeight: '600'
                            }}>
                              {ubicacion.cantidad} unidades
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                </div>
              </div>
            </div>

            {/* Panel central - Lista de movimientos pendientes */}
            <div className="panel-recepcion">
              <div className="card recibir-card">
                <div className="recibir-card__header">
                  <h2 className="recibir-card__title">Lista de movimientos</h2>
                  <p className="recibir-card__subtitle">
                    Marcá cada línea con el tilde cuando esté revisada. El registro solo corre cuando <strong>todas</strong> están confirmadas.
                  </p>
                </div>
                <div className="recibir-card__body contenido-recepcion">
                {movimientos.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#64748b',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '2px dashed #cbd5e1'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                    <p style={{ margin: 0, fontSize: '1rem' }}>
                      No hay líneas en la lista
                    </p>
                  </div>
                ) : (
                  <div 
                    ref={listaRecepcionesRef}
                    className="lista-recepciones"
                  >
                    {movimientos.map((mov, index) => (
                      <div
                        key={mov.id}
                        data-product-index={index}
                        style={{
                          padding: isMobile ? '0.65rem 0.75rem' : '0.55rem 0.7rem',
                          border: `2px solid ${mov.confirmado ? '#86efac' : '#e2e8f0'}`,
                          borderRadius: '8px',
                          marginBottom: isMobile ? '0.6rem' : '0.5rem',
                          background: mov.confirmado ? '#f0fdf4' : '#f8fafc',
                          minHeight: 'auto'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '0.5rem'
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              gap: '0.3rem',
                              marginBottom: '0.3rem'
                            }}>
                              <span style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '0.12rem 0.4rem',
                                borderRadius: '4px',
                                background: mov.tipo === 'recibir' ? '#d1fae5' : '#ffedd5',
                                color: mov.tipo === 'recibir' ? '#065f46' : '#9a3412'
                              }}>
                                {mov.tipo === 'recibir' ? 'Recibir' : 'Enviar'}
                              </span>
                              {mov.confirmado && (
                                <span style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 700 }}>✓</span>
                              )}
                            </div>
                            {/* Fila 1: código interno + nombre + cantidad */}
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              gap: '0.45rem',
                              marginBottom: '0.3rem',
                              rowGap: '0.25rem'
                            }}>
                              {mov.codigoPersonalizado ? (
                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  background: '#e0e7ff',
                                  color: '#3730a3',
                                  flexShrink: 0
                                }}>
                                  {mov.codigoPersonalizado}
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.7rem', color: '#cbd5e1', flexShrink: 0 }} title="Sin código interno">—</span>
                              )}
                              <span style={{
                                fontWeight: 600,
                                fontSize: isMobile ? '0.9rem' : '0.875rem',
                                lineHeight: 1.25,
                                color: '#0f172a',
                                flex: '1 1 140px',
                                minWidth: 0
                              }}>
                                {mov.productoNombre}
                              </span>
                              <span style={{
                                fontSize: isMobile ? '1rem' : '0.95rem',
                                fontWeight: 800,
                                padding: '0.25rem 0.6rem',
                                borderRadius: '8px',
                                background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)',
                                color: '#0f172a',
                                flexShrink: 0,
                                fontVariantNumeric: 'tabular-nums',
                                letterSpacing: '0.02em',
                                border: '1px solid #cbd5e1',
                                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)'
                              }}>
                                {mov.cantidad.toLocaleString('es-AR')}
                              </span>
                            </div>
                            {/* Fila 2: origen / destino */}
                            <div style={{
                              fontSize: isMobile ? '0.75rem' : '0.78rem',
                              color: '#64748b',
                              lineHeight: 1.35
                            }}>
                              <span>
                                {mov.tipo === 'recibir' ? 'Desde' : 'Origen'}: {mov.ubicacion}
                              </span>
                              {mov.tipo === 'enviar' && mov.sectorDestinoNombre && (
                                <span style={{ color: '#9a3412', fontWeight: 600 }}>
                                  {' · '}
                                  Hacia: {mov.sectorDestinoNombre}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'stretch' }}>
                            <button
                              type="button"
                              title={mov.confirmado ? 'Desmarcar confirmación' : 'Confirmar línea'}
                              onClick={() => toggleConfirmarLinea(mov.id)}
                              style={{
                                background: mov.confirmado ? '#22c55e' : '#e2e8f0',
                                color: mov.confirmado ? 'white' : '#475569',
                                border: 'none',
                                borderRadius: '6px',
                                padding: isMobile ? '0.5rem 0.6rem' : '0.35rem 0.5rem',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                fontWeight: 700,
                                minWidth: '44px'
                              }}
                            >
                              {mov.confirmado ? '✓' : '○'}
                            </button>
                            {!mov.confirmado && (
                              <button
                                type="button"
                                title="Quitar de la lista"
                                onClick={() => removerMovimiento(mov.id)}
                                style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: isMobile ? '0.5rem' : '0.35rem 0.5rem',
                                  fontSize: isMobile ? '0.875rem' : '0.75rem',
                                  cursor: 'pointer',
                                  minWidth: '44px'
                                }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </div>
            </div>

            {/* Panel derecho - Resumen y botón */}
            <div className="panel-resumen">
              <div className="card recibir-card">
                <div className="recibir-card__header">
                  <h2 className="recibir-card__title">Resumen</h2>
                </div>
                <div className="recibir-card__body recibir-card__body--resumen">
                <div style={{ marginBottom: '1rem', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: isMobile ? '0.75rem' : '0.5rem',
                    padding: isMobile ? '0.65rem 0.75rem' : '0.5rem 0.65rem',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #eef2f7'
                  }}>
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: isMobile ? '1rem' : 'inherit'
                    }}>
                      Líneas:
                    </span>
                    <span style={{ 
                      fontWeight: '700', 
                      color: '#4f46e5', 
                      fontSize: isMobile ? '1.25rem' : '1.1rem',
                      fontVariantNumeric: 'tabular-nums'
                    }}>
                      {movimientos.length}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: isMobile ? '0.65rem' : '0.5rem',
                    padding: isMobile ? '0.65rem 0.75rem' : '0.5rem 0.65rem',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #eef2f7'
                  }}>
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: isMobile ? '1rem' : 'inherit'
                    }}>
                      Unidades:
                    </span>
                    <span style={{ 
                      fontWeight: '700', 
                      color: '#4f46e5', 
                      fontSize: isMobile ? '1.25rem' : '1.1rem',
                      fontVariantNumeric: 'tabular-nums'
                    }}>
                      {movimientos.reduce((sum, r) => sum + r.cantidad, 0)}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: isMobile ? '0.65rem 0.75rem' : '0.5rem 0.65rem',
                    background: '#f0fdf4',
                    borderRadius: '8px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: isMobile ? '0.95rem' : 'inherit'
                    }}>
                      Confirmadas:
                    </span>
                    <span style={{ 
                      fontWeight: '700', 
                      color: '#15803d', 
                      fontSize: isMobile ? '1.15rem' : '1rem',
                      fontVariantNumeric: 'tabular-nums'
                    }}>
                      {movimientos.filter(m => m.confirmado).length} / {movimientos.length || 0}
                    </span>
                  </div>
                </div>

                <button
                  onClick={registrarMovimientos}
                  disabled={
                    guardando ||
                    movimientos.length === 0 ||
                    !movimientos.every(m => m.confirmado)
                  }
                  style={{
                    width: '100%',
                    padding: isMobile ? '1.25rem' : '1rem',
                    background:
                      guardando ||
                      movimientos.length === 0 ||
                      !movimientos.every(m => m.confirmado)
                        ? '#9ca3af'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: isMobile ? '1.125rem' : '1rem',
                    fontWeight: '600',
                    cursor:
                      guardando ||
                      movimientos.length === 0 ||
                      !movimientos.every(m => m.confirmado)
                        ? 'not-allowed'
                        : 'pointer',
                    transition: 'all 0.2s ease',
                    minHeight: isMobile ? '56px' : 'auto'
                  }}
                  onMouseEnter={(e) => {
                    if (!guardando && movimientos.length > 0 && movimientos.every(m => m.confirmado)) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!guardando && movimientos.length > 0 && movimientos.every(m => m.confirmado)) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {guardando
                    ? 'Registrando...'
                    : movimientos.length === 0
                      ? 'Registrar movimientos'
                      : !movimientos.every(m => m.confirmado)
                        ? 'Confirmá todas las líneas'
                        : 'Registrar movimientos'}
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecibirProductos;
