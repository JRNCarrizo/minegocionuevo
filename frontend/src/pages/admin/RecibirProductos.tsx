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

interface RecepcionProducto {
  productoId: number;
  stockId: string;
  ubicacion: string;
  cantidad: number;
  productoNombre: string;
  codigoPersonalizado?: string;
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
  const [recepciones, setRecepciones] = useState<RecepcionProducto[]>([]);
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

  // Referencias para focus
  const inputBusquedaRef = useRef<HTMLInputElement>(null);
  const listaProductosRef = useRef<HTMLDivElement>(null);
  const listaUbicacionesRef = useRef<HTMLDivElement>(null);
  const inputCantidadRef = useRef<HTMLInputElement>(null);
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
      const tieneStockDisponible = producto.ubicaciones.some(ubicacion => ubicacion.cantidad > 0);
      
      // Log para debug
      console.log('🔍 [DEBUG] Producto:', producto.productoNombre, {
        coincideBusqueda,
        tieneStockDisponible,
        ubicaciones: producto.ubicaciones.map(u => `${u.ubicacion}: ${u.cantidad}`)
      });
      
      // Incluir TODOS los productos que coincidan con la búsqueda y tengan stock disponible
      // Esto permite recibir productos que ya están en el sector actual (para aumentar stock)
      // y también productos de otros sectores o sin sectores asignados
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
  }, [filtroBusqueda, stockDetallado]);

  // Estado para controlar el focus del buscador
  const [focusBuscador, setFocusBuscador] = useState(false);

  // Auto-focus en el buscador solo cuando se solicita
  useEffect(() => {
    if (focusBuscador && inputBusquedaRef.current && !cargandoSector && !cargandoStock) {
      inputBusquedaRef.current.focus();
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

  // Manejar teclas para navegación
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Si estamos en modo cantidad, manejar solo Enter y Escape
      if (modoCantidad) {
        if (event.key === 'Enter') {
          event.preventDefault();
          confirmarRecepcion();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          cancelarCantidad();
        }
        return;
      }

      // Si hay un producto seleccionado y ubicaciones disponibles
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

      // Si hay productos filtrados
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

      // Si no hay productos filtrados y se presiona Enter, activar el buscador
      if (event.key === 'Enter' && !filtroBusqueda.trim()) {
        event.preventDefault();
        setFocusBuscador(true);
        // Hacer scroll automático
        setTimeout(() => {
          window.scrollBy({
            top: 250,
            behavior: 'smooth'
          });
        }, 100);
      }

      // Escape global para volver a gestión de sectores
      if (event.key === 'Escape' && !filtroBusqueda.trim() && productosFiltrados.length === 0 && !productoSeleccionado) {
        event.preventDefault();
        navigate('/admin/sectores');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [productosFiltrados, productoSeleccionadoIndex, productoSeleccionado, ubicacionesFiltradas, ubicacionSeleccionadaIndex, modoCantidad, cantidad, filtroBusqueda, navigate]);

  // Seleccionar producto
  const seleccionarProducto = (producto: StockDetallado) => {
    setProductoSeleccionado(producto);
    // Filtrar ubicaciones con stock disponible que NO sean del sector actual
    const ubicacionesConStock = producto.ubicaciones.filter(ubicacion => {
      const tieneStock = ubicacion.cantidad > 0;
      const noEsSectorActual = ubicacion.ubicacion !== sector?.nombre;
      return tieneStock && noEsSectorActual;
    });
    
    console.log('🔍 [DEBUG] Ubicaciones filtradas para recibir:', ubicacionesConStock.map(u => `${u.ubicacion}: ${u.cantidad}`));
    console.log('🔍 [DEBUG] Sector actual excluido:', sector?.nombre);
    
    setUbicacionesFiltradas(ubicacionesConStock);
    setUbicacionSeleccionadaIndex(ubicacionesConStock.length > 0 ? 0 : -1);
    setFiltroBusqueda(producto.productoNombre);
    // Mostrar ubicaciones con animación
    if (ubicacionesConStock.length > 0) {
      setMostrarOpciones(true);
    }
  };

  // Seleccionar ubicación
  const seleccionarUbicacion = (ubicacion: any) => {
    setStockSeleccionado(ubicacion);
    setModoCantidad(true);
    setCantidad('');
  };

  // Confirmar recepción
  const confirmarRecepcion = () => {
    if (!productoSeleccionado || !stockSeleccionado || !cantidad.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    // Evaluar la expresión matemática si contiene operadores
    let cantidadNum: number;
    
    // Verificar si la cantidad contiene operadores matemáticos
    const contieneOperadores = /[+\-*/x()]/.test(cantidad);
    
    if (contieneOperadores) {
      // Evaluar la expresión matemática
      const evaluacion = evaluarExpresion(cantidad);
      if (evaluacion.error) {
        toast.error(`Error en el cálculo: ${evaluacion.error}`);
        return;
      }
      cantidadNum = evaluacion.resultado!;
    } else {
      // Si no contiene operadores, parsear como número normal
      cantidadNum = parseInt(cantidad);
      if (isNaN(cantidadNum) || cantidadNum <= 0) {
        toast.error('Por favor ingresa una cantidad válida');
        return;
      }
    }

    if (cantidadNum > stockSeleccionado.cantidad) {
      toast.error('La cantidad no puede ser mayor al stock disponible');
      return;
    }

    const nuevaRecepcion: RecepcionProducto = {
      productoId: productoSeleccionado.productoId,
      stockId: stockSeleccionado.stockId,
      ubicacion: stockSeleccionado.ubicacion,
      cantidad: cantidadNum,
      productoNombre: productoSeleccionado.productoNombre,
      codigoPersonalizado: productoSeleccionado.codigoPersonalizado
    };

    setRecepciones(prev => [...prev, nuevaRecepcion]);
    
    // Hacer scroll al último producto agregado solo si hay más de 3 productos
    if (recepciones.length > 3) {
      setTimeout(() => {
        scrollToLastProduct();
      }, 100);
    }
    
    // Actualizar el stock detallado para descontar la cantidad
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
    
    // Limpiar y volver al buscador
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

    // Focus en el buscador
    setTimeout(() => {
      setFocusBuscador(true);
    }, 100);

    toast.success('Producto agregado a la lista de recepción');
  };

  // Función para hacer scroll automático al último producto agregado a la recepción
  const scrollToLastProduct = () => {
    if (listaRecepcionesRef.current && recepciones.length > 0) {
      const container = listaRecepcionesRef.current;
      const lastProductIndex = recepciones.length - 1;
      
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
    setModoCantidad(false);
    setCantidad('');
    setStockSeleccionado(null);
    setUbicacionSeleccionadaIndex(0);
    setResultadoCalculo(null);
    setErrorCalculo(null);
  };

  // Remover recepción de la lista
  const removerRecepcion = (index: number) => {
    const recepcionAEliminar = recepciones[index];
    
    // Restaurar el stock detallado sumando la cantidad eliminada
    setStockDetallado(prevStock => 
      prevStock.map(producto => {
        if (producto.productoId === recepcionAEliminar.productoId) {
          return {
            ...producto,
            ubicaciones: producto.ubicaciones.map(ubicacion => {
              if (ubicacion.stockId === recepcionAEliminar.stockId) {
                return {
                  ...ubicacion,
                  cantidad: ubicacion.cantidad + recepcionAEliminar.cantidad
                };
              }
              return ubicacion;
            })
          };
        }
        return producto;
      })
    );
    
    setRecepciones(prev => prev.filter((_, i) => i !== index));
    toast.success('Producto removido de la lista de recepción');
  };

  // Guardar recepciones
  const guardarRecepciones = async () => {
    if (recepciones.length === 0) {
      toast.error('No hay productos para recibir');
      return;
    }

    if (!datosUsuario?.empresaId || !sectorId) {
      toast.error('Error: No se pudo obtener la información necesaria');
      return;
    }

    try {
      setGuardando(true);
      
      const requestBody = {
        recepciones: recepciones.map(r => ({
          productoId: r.productoId,
          stockId: r.stockId,
          cantidad: r.cantidad
        }))
      };

      console.log('🔍 Enviando recepciones:', requestBody);
      console.log('🔍 URL:', `/empresas/${datosUsuario.empresaId}/sectores/${sectorId}/recibir-productos`);
      console.log('🔍 empresaId:', datosUsuario.empresaId);
      console.log('🔍 sectorId:', sectorId);
      
      await apiCall(`/empresas/${datosUsuario.empresaId}/sectores/${sectorId}/recibir-productos`, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      toast.success('Productos recibidos exitosamente');
      setRecepciones([]);
      
      // Recargar stock detallado
      await cargarStockDetallado();
      
      // Volver a la gestión de sectores
      setTimeout(() => {
        navigate('/admin/sectores');
      }, 1500);

    } catch (error) {
      console.error('Error al recibir productos:', error);
      toast.error('Error al recibir productos');
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

  // Auto-scroll para mantener visible el último producto agregado a la recepción
  useEffect(() => {
    // Solo hacer scroll si hay productos en la lista y no estamos en modo cantidad
    if (recepciones.length > 0 && !modoCantidad) {
      // Solo hacer scroll si hay más de 3 productos (para evitar scroll en los primeros productos)
      if (recepciones.length > 3) {
        // Delay para asegurar que el DOM se haya actualizado completamente
        const timeoutId = setTimeout(() => {
          scrollToLastProduct();
        }, 200);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [recepciones.length, modoCantidad]);

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
          {/* Header */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: isMobile ? '1rem' : '24px',
            marginBottom: isMobile ? '1rem' : '2rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            border: '2px solid #e2e8f0'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'nowrap',
              gap: '1rem'
            }}>
              <div>
                <button 
                  onClick={() => navigate('/admin/sectores')}
                  style={{
                    background: 'rgba(102, 126, 234, 0.1)',
                    border: '2px solid rgba(102, 126, 234, 0.2)',
                    borderRadius: '8px',
                    color: '#667eea',
                    padding: isMobile ? '0.75rem 1rem' : '0.5rem 1rem',
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: isMobile ? '0.75rem' : '1rem',
                    transition: 'all 0.2s ease',
                    minHeight: isMobile ? '48px' : 'auto'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  ← Volver
                </button>
                <h1 style={{
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: '0 0 0.5rem 0'
                }}>
                  📦 Recibir Stock
                </h1>
                <p style={{
                  color: '#64748b',
                  margin: 0,
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}>
                  Sector: {sector?.nombre}
                </p>
              </div>
            </div>
          </div>

          <div className="recibir-productos-container">
            {/* Panel izquierdo - Búsqueda y selección */}
            <div className="panel-busqueda">
              <div className="card" style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                border: '2px solid #e2e8f0'
              }}>
                <h2 style={{
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 1.5rem 0'
                }}>
                  🔍 Buscador Avanzado
                </h2>

                                 {/* Campo de búsqueda y cantidad */}
                 <div style={{ marginBottom: '1.5rem' }}>
                   <div style={{
                     display: 'flex',
                     gap: '1rem',
                     alignItems: 'flex-end'
                   }}>
                     {/* Buscador */}
                     <div style={{ flex: 1 }}>
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

                     {/* Campo de cantidad - solo visible cuando modoCantidad es true */}
                     {modoCantidad && stockSeleccionado && (
                       <div style={{ flex: '0 0 250px' }}>
                         <label style={{
                           display: 'block',
                           fontSize: isMobile ? '0.875rem' : '0.875rem',
                           fontWeight: '600',
                           color: '#374151',
                           marginBottom: isMobile ? '0.5rem' : '0.5rem'
                         }}>
                           Cantidad:
                         </label>
                         <input
                           ref={inputCantidadRef}
                           type="text"
                           value={cantidad}
                           onChange={(e) => setCantidad(e.target.value)}
                           placeholder="Ej: 336, 3*112, 3x60..."
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
                           onKeyDown={(e) => {
                             // Permitir todas las teclas de edición normales
                             if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
                               return; // Permitir comportamiento normal
                             }
                             
                             // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                             if (e.ctrlKey && (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x')) {
                               return; // Permitir comportamiento normal
                             }
                             
                             // Permitir Enter y Escape
                             if (e.key === 'Enter' || e.key === 'Escape') {
                               return; // Permitir comportamiento normal
                             }
                           }}
                         />
                         <div style={{
                           fontSize: isMobile ? '0.75rem' : '0.75rem',
                           color: '#64748b',
                           marginTop: '0.25rem',
                           lineHeight: '1.2'
                         }}>
                           💡 Puedes usar: +, -, *, /, x, paréntesis
                         </div>
                         
                         {/* Mostrar resultado del cálculo en tiempo real */}
                         {resultadoCalculo !== null && (
                           <div style={{
                             fontSize: isMobile ? '0.75rem' : '0.75rem',
                             color: '#10b981',
                             marginTop: '0.25rem',
                             fontWeight: '600',
                             background: '#f0fdf4',
                             padding: '0.25rem 0.5rem',
                             borderRadius: '4px',
                             border: '1px solid #bbf7d0'
                           }}>
                             ✅ Resultado: {resultadoCalculo.toLocaleString()} unidades
                           </div>
                         )}
                         
                         {errorCalculo && (
                           <div style={{
                             fontSize: isMobile ? '0.75rem' : '0.75rem',
                             color: '#ef4444',
                             marginTop: '0.25rem',
                             fontWeight: '600',
                             background: '#fef2f2',
                             padding: '0.25rem 0.5rem',
                             borderRadius: '4px',
                             border: '1px solid #fecaca'
                           }}>
                             ❌ {errorCalculo}
                           </div>
                         )}
                       </div>
                     )}
                   </div>

                   {/* Información del producto seleccionado cuando está en modo cantidad */}
                   {modoCantidad && stockSeleccionado && (
                     <>
                       <div style={{
                         background: '#f8fafc',
                         padding: isMobile ? '1rem' : '0.75rem',
                         borderRadius: '8px',
                         border: '2px solid #e2e8f0',
                         marginTop: isMobile ? '1rem' : '0.75rem',
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
                       
                       {/* Botones de confirmar y cancelar */}
                       <div style={{
                         display: 'flex',
                         gap: isMobile ? '0.75rem' : '0.5rem',
                         marginTop: isMobile ? '1rem' : '0.75rem'
                       }}>
                         <button
                           onClick={confirmarRecepcion}
                           style={{
                             flex: 1,
                             padding: isMobile ? '1rem' : '0.75rem',
                             background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                             color: 'white',
                             border: 'none',
                             borderRadius: '8px',
                             fontSize: isMobile ? '1rem' : '1rem',
                             fontWeight: '600',
                             cursor: 'pointer',
                             transition: 'all 0.2s ease',
                             minHeight: isMobile ? '48px' : 'auto'
                           }}
                           onMouseEnter={(e) => {
                             e.currentTarget.style.transform = 'translateY(-2px)';
                             e.currentTarget.style.boxShadow = '0 4px 15px rgba(67, 233, 123, 0.3)';
                           }}
                           onMouseLeave={(e) => {
                             e.currentTarget.style.transform = 'translateY(0)';
                             e.currentTarget.style.boxShadow = 'none';
                           }}
                         >
                           Confirmar
                         </button>
                         <button
                           onClick={cancelarCantidad}
                           style={{
                             padding: isMobile ? '1rem' : '0.75rem 1rem',
                             background: '#f1f5f9',
                             color: '#374151',
                             border: 'none',
                             borderRadius: '8px',
                             fontSize: isMobile ? '1rem' : '1rem',
                             fontWeight: '600',
                             cursor: 'pointer',
                             transition: 'all 0.2s ease',
                             minHeight: isMobile ? '48px' : 'auto'
                           }}
                           onMouseEnter={(e) => {
                             e.currentTarget.style.background = '#e2e8f0';
                           }}
                           onMouseLeave={(e) => {
                             e.currentTarget.style.background = '#f1f5f9';
                           }}
                         >
                           Cancelar
                         </button>
                       </div>
                     </>
                   )}
                 </div>

                {/* Instrucciones */}
                {!filtroBusqueda.trim() && (
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
                        📍 Ubicaciones actuales de {productoSeleccionado.productoNombre}
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

            {/* Panel central - Lista de recepciones */}
            <div className="panel-recepcion">
              <div className="card" style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                border: '2px solid #e2e8f0'
              }}>
                <h2 style={{
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 1.5rem 0'
                }}>
                  📋 Lista de Recepción
                </h2>

                {recepciones.length === 0 ? (
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
                      No hay productos en la lista de recepción
                    </p>
                  </div>
                ) : (
                  <div 
                    ref={listaRecepcionesRef}
                    style={{ 
                      height: '400px', 
                      overflowY: 'auto', 
                      overflowX: 'hidden',
                      marginBottom: '1.5rem' 
                    }}>
                    {recepciones.map((recepcion, index) => (
                      <div
                        key={index}
                        data-product-index={index}
                        style={{
                          padding: isMobile ? '1rem' : '1rem',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          marginBottom: isMobile ? '1rem' : '0.75rem',
                          background: '#f8fafc',
                          minHeight: isMobile ? '70px' : 'auto'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: isMobile ? '0.75rem' : '0.5rem'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: '600', 
                              marginBottom: isMobile ? '0.5rem' : '0.25rem',
                              fontSize: isMobile ? '1rem' : 'inherit',
                              lineHeight: isMobile ? '1.3' : 'inherit'
                            }}>
                              {recepcion.productoNombre}
                            </div>
                            {recepcion.codigoPersonalizado && (
                              <div style={{ 
                                fontSize: isMobile ? '0.8rem' : '0.875rem', 
                                color: '#64748b', 
                                marginBottom: isMobile ? '0.5rem' : '0.25rem' 
                              }}>
                                Código: {recepcion.codigoPersonalizado}
                              </div>
                            )}
                            <div style={{ 
                              fontSize: isMobile ? '0.8rem' : '0.875rem', 
                              color: '#64748b', 
                              marginBottom: isMobile ? '0.5rem' : '0.25rem' 
                            }}>
                              Desde: {recepcion.ubicacion}
                            </div>
                            <div style={{ 
                              fontSize: isMobile ? '0.8rem' : '0.875rem', 
                              color: '#64748b' 
                            }}>
                              Cantidad: {recepcion.cantidad}
                            </div>
                          </div>
                          <button
                            onClick={() => removerRecepcion(index)}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: isMobile ? '0.5rem' : '0.25rem 0.5rem',
                              fontSize: isMobile ? '0.875rem' : '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              minHeight: isMobile ? '2rem' : 'auto',
                              minWidth: isMobile ? '2rem' : 'auto'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#dc2626';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#ef4444';
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Panel derecho - Resumen y botón */}
            <div className="panel-resumen">
              <div className="card" style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                border: '2px solid #e2e8f0'
              }}>
                <h2 style={{
                  fontSize: isMobile ? '1.5rem' : '1.25rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 1.5rem 0'
                }}>
                  📊 Resumen
                </h2>

                <div style={{ marginBottom: '2rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: isMobile ? '1.5rem' : '1rem',
                    padding: isMobile ? '1rem' : '0.75rem',
                    background: '#f8fafc',
                    borderRadius: '8px'
                  }}>
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#374151',
                      fontSize: isMobile ? '1rem' : 'inherit'
                    }}>
                      Productos:
                    </span>
                    <span style={{ 
                      fontWeight: '700', 
                      color: '#667eea', 
                      fontSize: isMobile ? '1.5rem' : '1.25rem' 
                    }}>
                      {recepciones.length}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: isMobile ? '1rem' : '0.75rem',
                    background: '#f8fafc',
                    borderRadius: '8px'
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
                      color: '#667eea', 
                      fontSize: isMobile ? '1.5rem' : '1.25rem' 
                    }}>
                      {recepciones.reduce((sum, r) => sum + r.cantidad, 0)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={guardarRecepciones}
                  disabled={guardando || recepciones.length === 0}
                  style={{
                    width: '100%',
                    padding: isMobile ? '1.25rem' : '1rem',
                    background: guardando || recepciones.length === 0 ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: isMobile ? '1.125rem' : '1rem',
                    fontWeight: '600',
                    cursor: guardando || recepciones.length === 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    minHeight: isMobile ? '56px' : 'auto'
                  }}
                  onMouseEnter={(e) => {
                    if (!guardando && recepciones.length > 0) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!guardando && recepciones.length > 0) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {guardando ? 'Guardando...' : 'Confirmar Recepción'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecibirProductos;
