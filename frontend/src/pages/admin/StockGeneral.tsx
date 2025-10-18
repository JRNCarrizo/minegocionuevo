import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
import NavbarAdmin from '../../components/NavbarAdmin';
import { API_CONFIG } from '../../config/api';
import { formatearFechaConHora } from '../../utils/dateUtils';
import './StockGeneral.css';
import './GestionSectores.css';

interface StockItem {
  id: number;
  producto: {
    id: number;
    nombre: string;
    codigoPersonalizado?: string;
    unidadMedida?: string;
    imagenes?: string[];
  };
  sector?: {
    id: number;
    nombre: string;
  };
  cantidad: number;
  fechaActualizacion: string;
  tipo: 'con_sector' | 'sin_sector';
}

export default function StockGeneral() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'con_sector' | 'sin_sector' | 'sin_sectorizar'>('todos');
  const [filtroSector, setFiltroSector] = useState<number | 'todos'>('todos');
  const [sectoresDisponibles, setSectoresDisponibles] = useState<Array<{id: number, nombre: string}>>([]);
  const [ordenarPor, setOrdenarPor] = useState<'nombre' | 'codigo' | 'cantidad' | 'sector'>('nombre');
  const [ordenAscendente, setOrdenAscendente] = useState(true);
  
  // Estados para navegación por teclado
  const [filaSeleccionada, setFilaSeleccionada] = useState(-1);
  const [inputBusquedaRef, setInputBusquedaRef] = useState<HTMLInputElement | null>(null);
  
  // Estados para modal de transferir stock
  const [mostrarModalTransferir, setMostrarModalTransferir] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<StockItem | null>(null);
  const [sectorDestino, setSectorDestino] = useState<number | ''>('');
  const [cantidadTransferir, setCantidadTransferir] = useState<number>(0);
  const [transferiendo, setTransferiendo] = useState(false);
  
  // Estados para calculadora en transferencia
  const [cantidadTransferirTexto, setCantidadTransferirTexto] = useState<string>('');
  const [resultadoCalculoTransferir, setResultadoCalculoTransferir] = useState<number | null>(null);
  const [errorCalculoTransferir, setErrorCalculoTransferir] = useState<string>('');
  
  // Estados para asignación de sector
  const [asignandoSector, setAsignandoSector] = useState(false);
  const [modoAsignacion, setModoAsignacion] = useState(false);
  
  // Estados para modal de foto
  const [mostrarModalFoto, setMostrarModalFoto] = useState(false);
  const [productoParaFoto, setProductoParaFoto] = useState<StockItem | null>(null);
  const [imagenActual, setImagenActual] = useState(0);
  const [posicionInicial, setPosicionInicial] = useState(0);
  const [posicionFinal, setPosicionFinal] = useState(0);

  // Referencias para navegación por teclado en modal de transferir
  const sectorDestinoRef = useRef<HTMLSelectElement>(null);
  const cantidadTransferirRef = useRef<HTMLInputElement>(null);
  const [sectorSeleccionadoIndex, setSectorSeleccionadoIndex] = useState(0);

  // Función para consolidar productos
  const consolidarProductos = (items: StockItem[]): StockItem[] => {
    const productosConsolidados = new Map<number, StockItem>();
    
    items.forEach(item => {
      const productoId = item.producto.id;
      
      if (productosConsolidados.has(productoId)) {
        // Sumar cantidad al producto existente
        const existente = productosConsolidados.get(productoId)!;
        existente.cantidad += item.cantidad;
        
        // Actualizar la fecha de actualización a la más reciente
        const fechaExistente = new Date(existente.fechaActualizacion);
        const fechaNueva = new Date(item.fechaActualizacion);
        if (fechaNueva > fechaExistente) {
          existente.fechaActualizacion = item.fechaActualizacion;
        }
      } else {
        // Crear nuevo producto consolidado
        productosConsolidados.set(productoId, {
          ...item,
          cantidad: item.cantidad,
          sector: undefined, // Sin sector en vista consolidada
          tipo: 'sin_sector' as const
        });
      }
    });
    
    // Log de consolidación solo cuando hay muchos productos
    if (items.length > 10) {
      console.log('🔍 CONSOLIDACIÓN - De', items.length, 'a', productosConsolidados.size, 'productos');
    }
    
    return Array.from(productosConsolidados.values());
  };

  // Función helper para hacer llamadas a la API con URL base correcta
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const baseUrl = API_CONFIG.getBaseUrl();
    // Asegurar que el endpoint no empiece con /api para evitar duplicación
    const cleanEndpoint = endpoint.startsWith('/api') ? endpoint.substring(4) : endpoint;
    const url = `${baseUrl}${cleanEndpoint}`;
    
    // Obtener el token correcto del usuario actual
    const token = localStorage.getItem('token');
    console.log('🔍 STOCK GENERAL - Token obtenido:', token ? 'Presente' : 'Ausente');
    console.log('🔍 STOCK GENERAL - URL completa:', url);
    
    const defaultOptions: RequestInit = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
    
    return fetch(url, defaultOptions);
  };

  // Filtrar y ordenar datos
  const datosFiltrados = stockData.filter(item => {
    const cumpleBusqueda = filtroBusqueda === '' || 
      item.producto.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      (item.producto.codigoPersonalizado && item.producto.codigoPersonalizado.toLowerCase().includes(filtroBusqueda.toLowerCase()));
    
    let cumpleTipo = true;
    if (filtroTipo === 'con_sector') {
      cumpleTipo = item.tipo === 'con_sector';
    } else if (filtroTipo === 'sin_sector') {
      cumpleTipo = item.tipo === 'sin_sector';
    } else if (filtroTipo === 'sin_sectorizar') {
      // Para "sin sectorizar" incluimos TODOS los productos (con y sin sector)
      cumpleTipo = true;
    }
    
    // Filtro por sector específico
    const cumpleSector = filtroSector === 'todos' || 
      (item.sector && item.sector.id === filtroSector);
    
    return cumpleBusqueda && cumpleTipo && cumpleSector;
  });

  // Logs de debugging solo cuando hay cambios significativos
  if (stockData.length > 0) {
    console.log('🔍 FILTRADO - Datos originales:', stockData.length, 'Filtrados:', datosFiltrados.length);
  }
  
  // Consolidar productos cuando se selecciona "sin_sectorizar"
  const datosConsolidados = filtroTipo === 'sin_sectorizar' 
    ? consolidarProductos(datosFiltrados)
    : datosFiltrados;

  const datosOrdenados = datosConsolidados.sort((a, b) => {
    let valorA: any, valorB: any;
    
    switch (ordenarPor) {
      case 'nombre':
        valorA = a.producto.nombre.toLowerCase();
        valorB = b.producto.nombre.toLowerCase();
        break;
      case 'codigo':
        valorA = a.producto.codigoPersonalizado || '';
        valorB = b.producto.codigoPersonalizado || '';
        break;
      case 'cantidad':
        valorA = a.cantidad;
        valorB = b.cantidad;
        break;
      case 'sector':
        valorA = a.sector?.nombre || '';
        valorB = b.sector?.nombre || '';
        break;
      default:
        valorA = a.producto.nombre.toLowerCase();
        valorB = b.producto.nombre.toLowerCase();
    }
    
    if (ordenAscendente) {
      return valorA > valorB ? 1 : -1;
    } else {
      return valorA < valorB ? 1 : -1;
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    if (datosUsuario?.empresaId) {
      cargarStockGeneral();
    }
  }, [navigate, datosUsuario?.empresaId]);

  // Manejo de teclas para navegación
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Si hay modales abiertos, no procesar ningún evento de teclado
      if (mostrarModalTransferir || mostrarModalFoto) {
        return;
      }
      
      console.log('🔍 KEYDOWN - Tecla presionada:', event.key);
      console.log('🔍 KEYDOWN - Fila seleccionada actual:', filaSeleccionada);
      console.log('🔍 KEYDOWN - Total de datos:', datosOrdenados.length);
      
      // Enter: Enfocar buscador y hacer scroll
      if (event.key === 'Enter' && !filtroBusqueda.trim()) {
        console.log('🔍 KEYDOWN - Ejecutando Enter');
        event.preventDefault();
        event.stopPropagation();
        if (inputBusquedaRef) {
          inputBusquedaRef.focus();
          // Scroll suave hacia el buscador después de un pequeño delay
          setTimeout(() => {
            // Calcular la posición del buscador y la altura del navbar
            const navbar = document.querySelector('.navbar-admin');
            const navbarHeight = navbar ? navbar.offsetHeight : 80; // altura por defecto si no encuentra el navbar
            
            // Obtener la posición del buscador
            const buscadorRect = inputBusquedaRef.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const buscadorTop = buscadorRect.top + scrollTop;
            
            // Scroll para posicionar el buscador justo debajo del navbar
            window.scrollTo({
              top: buscadorTop - navbarHeight - 20, // 20px de margen adicional
              behavior: 'smooth'
            });
          }, 100);
        }
        return;
      }

      // Navegación con flechas en la tabla
      if (datosOrdenados.length > 0 && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        console.log('🔍 KEYDOWN - Ejecutando navegación con flechas');
        console.log('🔍 KEYDOWN - Fila seleccionada actual:', filaSeleccionada);
        console.log('🔍 KEYDOWN - Total de datos:', datosOrdenados.length);
        event.preventDefault();
        event.stopPropagation();
        
        let newIndex = filaSeleccionada;
        
        if (event.key === 'ArrowDown') {
          // Si no hay fila seleccionada, empezar en la primera
          if (filaSeleccionada === -1) {
            newIndex = 0;
            console.log('🔍 KEYDOWN - Primera vez, seleccionando índice 0');
          } else {
            newIndex = filaSeleccionada < datosOrdenados.length - 1 ? filaSeleccionada + 1 : 0;
            console.log('🔍 KEYDOWN - Navegando hacia abajo desde índice', filaSeleccionada, 'a', newIndex);
          }
        } else if (event.key === 'ArrowUp') {
          // Si no hay fila seleccionada, empezar en la última
          if (filaSeleccionada === -1) {
            newIndex = datosOrdenados.length - 1;
            console.log('🔍 KEYDOWN - Primera vez, seleccionando último índice:', newIndex);
          } else if (filaSeleccionada === 0) {
            // Si estamos en el primer registro, volver al buscador
            console.log('🔍 KEYDOWN - En primer registro, volviendo al buscador');
            setFilaSeleccionada(-1); // Deseleccionar fila
            if (inputBusquedaRef) {
              inputBusquedaRef.focus();
              // Scroll suave hacia el buscador
              setTimeout(() => {
                const navbar = document.querySelector('.navbar-admin');
                const navbarHeight = navbar ? navbar.offsetHeight : 80;
                const buscadorRect = inputBusquedaRef.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const buscadorTop = buscadorRect.top + scrollTop;
                window.scrollTo({
                  top: buscadorTop - navbarHeight - 20,
                  behavior: 'smooth'
                });
              }, 100);
            }
            return; // Salir sin continuar con la navegación
          } else {
            newIndex = filaSeleccionada - 1;
            console.log('🔍 KEYDOWN - Navegando hacia arriba desde índice', filaSeleccionada, 'a', newIndex);
          }
        }
        
        console.log('🔍 KEYDOWN - Nueva fila seleccionada:', newIndex);
        setFilaSeleccionada(newIndex);
        
        // Scroll a la fila seleccionada
        setTimeout(() => {
          const tableRows = document.querySelectorAll('.stock-table tbody tr');
          console.log('🔍 KEYDOWN - Filas encontradas:', tableRows.length);
          if (tableRows[newIndex]) {
            // Calcular la posición considerando el navbar
            const navbar = document.querySelector('.navbar-admin');
            const navbarHeight = navbar ? navbar.offsetHeight : 80;
            
            const rowRect = tableRows[newIndex].getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const rowTop = rowRect.top + scrollTop;
            
            // Scroll para posicionar la fila justo debajo del navbar
            window.scrollTo({
              top: rowTop - navbarHeight - 20, // 20px de margen adicional
              behavior: 'smooth'
            });
          }
        }, 100);
        return;
      }

      // Esc: Volver a la sección de sectores
      if (event.key === 'Escape') {
        console.log('🔍 KEYDOWN - Ejecutando Escape');
        const activeElement = document.activeElement;
        const isInput = activeElement?.tagName === 'INPUT' || 
                       activeElement?.tagName === 'TEXTAREA' || 
                       activeElement?.tagName === 'SELECT';
        
        if (isInput) {
          // Si estás en un input, quitar el foco
          event.preventDefault();
          event.stopPropagation();
          (activeElement as HTMLElement)?.blur();
        } else {
          // Si no estás en un input, volver a gestión de sectores
          event.preventDefault();
          event.stopPropagation();
          navigate('/admin/sectores');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true); // Usar capture phase
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [navigate, filtroBusqueda, inputBusquedaRef, filaSeleccionada, datosOrdenados.length, mostrarModalFoto, mostrarModalTransferir]);

  // Resetear selección cuando cambian los datos
  useEffect(() => {
    setFilaSeleccionada(-1);
  }, [datosOrdenados.length]);

  const cargarStockGeneral = async () => {
    try {
      setCargando(true);
      console.log('🔍 STOCK GENERAL - Iniciando carga...');
      console.log('🔍 STOCK GENERAL - Empresa ID:', datosUsuario?.empresaId);
      
      const response = await apiCall(`/empresas/${datosUsuario?.empresaId}/sectores/stock-general`);
      
      console.log('🔍 STOCK GENERAL - Response status:', response.status);
      console.log('🔍 STOCK GENERAL - Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 STOCK GENERAL - Datos recibidos:', data);
        setStockData(data.data || []);
        console.log('🔍 STOCK GENERAL - Stock data establecido:', data.data?.length || 0, 'items');
        
        // Extraer sectores únicos del stock
        const sectoresUnicos = new Map<number, string>();
        (data.data || []).forEach((item: StockItem) => {
          if (item.sector) {
            sectoresUnicos.set(item.sector.id, item.sector.nombre);
          }
        });
        const sectoresList = Array.from(sectoresUnicos, ([id, nombre]) => ({ id, nombre }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        setSectoresDisponibles(sectoresList);
        console.log('🔍 STOCK GENERAL - Sectores disponibles:', sectoresList.length);
      } else if (response.status === 403) {
        console.error('🔍 STOCK GENERAL - Error 403: No autorizado');
        toast.error('Error de autenticación. Por favor, inicia sesión nuevamente.');
        navigate('/admin/login');
      } else {
        const errorText = await response.text();
        console.error('🔍 STOCK GENERAL - Error response:', errorText);
        toast.error('Error al cargar el stock general');
      }
    } catch (error) {
      console.error('🔍 STOCK GENERAL - Error general:', error);
      toast.error('Error al cargar el stock general');
    } finally {
      setCargando(false);
    }
  };

  const cambiarOrden = (campo: 'nombre' | 'codigo' | 'cantidad' | 'sector') => {
    if (ordenarPor === campo) {
      setOrdenAscendente(!ordenAscendente);
    } else {
      setOrdenarPor(campo);
      setOrdenAscendente(true);
    }
  };

  const obtenerEstadisticas = () => {
    const totalProductos = stockData.length;
    const productosConSector = stockData.filter(item => item.tipo === 'con_sector').length;
    const productosSinSector = stockData.filter(item => item.tipo === 'sin_sector').length;
    const totalUnidades = stockData.reduce((sum, item) => sum + item.cantidad, 0);
    
    return { totalProductos, productosConSector, productosSinSector, totalUnidades };
  };

  const estadisticas = obtenerEstadisticas();

  // Función para manejar clic en fila de producto
  const manejarClicFila = (item: StockItem) => {
    setProductoSeleccionado(item);
    setCantidadTransferir(0);
    setCantidadTransferirTexto('');
    setResultadoCalculoTransferir(null);
    setErrorCalculoTransferir('');
    setSectorDestino('');
    setSectorSeleccionadoIndex(0); // Resetear índice de sector seleccionado
    
    // Si el producto no tiene sector, activar modo asignación
    if (!item.sector) {
      setModoAsignacion(true);
    } else {
      setModoAsignacion(false);
    }
    
    setMostrarModalTransferir(true);
    
    // Establecer foco automático en el select de sector después de un breve delay
    setTimeout(() => {
      if (sectorDestinoRef.current) {
        sectorDestinoRef.current.focus();
        console.log('🔍 MODAL - Foco establecido en select de sector');
      } else {
        console.log('🔍 MODAL - Error: sectorDestinoRef.current es null');
      }
    }, 100);
  };

  // Función para manejar clic en el nombre del producto
  const manejarClicNombre = (e: React.MouseEvent, item: StockItem) => {
    e.stopPropagation(); // Evitar que se abra el modal de transferir
    setProductoParaFoto(item);
    setImagenActual(0); // Resetear a la primera imagen
    setMostrarModalFoto(true);
  };

  // Función para cerrar modal de foto
  const cerrarModalFoto = () => {
    setMostrarModalFoto(false);
    setProductoParaFoto(null);
    setImagenActual(0);
  };

  // Función para navegar a la imagen anterior
  const imagenAnterior = () => {
    if (!productoParaFoto?.producto.imagenes) return;
    setImagenActual(prev => 
      prev === 0 ? productoParaFoto.producto.imagenes!.length - 1 : prev - 1
    );
  };

  // Función para navegar a la imagen siguiente
  const imagenSiguiente = () => {
    if (!productoParaFoto?.producto.imagenes) return;
    setImagenActual(prev => 
      prev === productoParaFoto.producto.imagenes!.length - 1 ? 0 : prev + 1
    );
  };

  // Funciones para manejar gestos táctiles
  const manejarInicioTactil = (e: React.TouchEvent) => {
    setPosicionInicial(e.targetTouches[0].clientX);
  };

  const manejarFinTactil = (e: React.TouchEvent) => {
    setPosicionFinal(e.targetTouches[0].clientX);
    manejarDeslizamiento();
  };

  const manejarDeslizamiento = () => {
    const diferencia = posicionInicial - posicionFinal;
    const umbralDeslizamiento = 50;

    if (Math.abs(diferencia) > umbralDeslizamiento) {
      if (diferencia > 0) {
        // Deslizar hacia la izquierda - siguiente imagen
        imagenSiguiente();
      } else {
        // Deslizar hacia la derecha - imagen anterior
        imagenAnterior();
      }
    }
  };

  // Función para manejar teclas en el modal de foto
  const manejarTecladoFoto = (e: KeyboardEvent) => {
    if (!mostrarModalFoto) {
      return;
    }

    switch (e.key) {
      case 'ArrowLeft':
        if (productoParaFoto?.producto.imagenes && productoParaFoto.producto.imagenes.length > 1) {
          e.preventDefault();
          imagenAnterior();
        }
        break;
      case 'ArrowRight':
        if (productoParaFoto?.producto.imagenes && productoParaFoto.producto.imagenes.length > 1) {
          e.preventDefault();
          imagenSiguiente();
        }
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation(); // Evitar que el evento se propague
        cerrarModalFoto();
        break;
    }
  };

  // Efecto para manejar eventos de teclado
  useEffect(() => {
    if (mostrarModalFoto) {
      document.addEventListener('keydown', manejarTecladoFoto, true); // true = fase de captura
      return () => {
        document.removeEventListener('keydown', manejarTecladoFoto, true);
      };
    }
  }, [mostrarModalFoto, productoParaFoto, imagenActual]);

  // Función para cerrar modal de transferir
  const cerrarModalTransferir = () => {
    setMostrarModalTransferir(false);
    setProductoSeleccionado(null);
    setCantidadTransferir(0);
    setCantidadTransferirTexto('');
    setResultadoCalculoTransferir(null);
    setErrorCalculoTransferir('');
    setSectorDestino('');
    setModoAsignacion(false);
    setSectorSeleccionadoIndex(0);
  };

  // Función para manejar navegación por teclado en el select de sector
  const manejarTecladoSector = (e: React.KeyboardEvent) => {
    console.log('🔍 MODAL - Tecla presionada en select:', e.key);
    if (!productoSeleccionado) return;
    
    const sectoresFiltrados = sectoresDisponibles?.filter(sector => 
      !modoAsignacion ? sector.id !== productoSeleccionado.sector?.id : true
    ) || [];

        console.log('🔍 MODAL - Sectores filtrados:', sectoresFiltrados.length);
        console.log('🔍 MODAL - Sectores disponibles:', sectoresDisponibles);
        console.log('🔍 MODAL - Producto seleccionado sector:', productoSeleccionado.sector);
        console.log('🔍 MODAL - Modo asignación:', modoAsignacion);
        if (sectoresFiltrados.length === 0) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        e.stopPropagation(); // Evitar que afecte la navegación de la tabla
        console.log('🔍 MODAL - Flecha arriba presionada');
        // Solo permitir navegación si hay más de 1 sector
        if (sectoresFiltrados.length > 1) {
          setSectorSeleccionadoIndex(prev => {
            const newIndex = prev > 0 ? prev - 1 : sectoresFiltrados.length - 1;
            console.log('🔍 MODAL - Nuevo índice sector:', newIndex);
            // Actualizar también el valor del select
            if (sectoresFiltrados[newIndex]) {
              setSectorDestino(sectoresFiltrados[newIndex].id);
            }
            return newIndex;
          });
        } else {
          console.log('🔍 MODAL - Solo hay 1 sector, navegación deshabilitada');
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation(); // Evitar que afecte la navegación de la tabla
        console.log('🔍 MODAL - Flecha abajo presionada');
        // Solo permitir navegación si hay más de 1 sector
        if (sectoresFiltrados.length > 1) {
          setSectorSeleccionadoIndex(prev => {
            const newIndex = prev < sectoresFiltrados.length - 1 ? prev + 1 : 0;
            console.log('🔍 MODAL - Nuevo índice sector:', newIndex);
            // Actualizar también el valor del select
            if (sectoresFiltrados[newIndex]) {
              setSectorDestino(sectoresFiltrados[newIndex].id);
            }
            return newIndex;
          });
        } else {
          console.log('🔍 MODAL - Solo hay 1 sector, navegación deshabilitada');
        }
        break;
      case 'Enter':
        e.preventDefault();
        e.stopPropagation(); // Evitar que afecte la navegación de la tabla
        console.log('🔍 MODAL - Enter presionado en select de sector');
        console.log('🔍 MODAL - Sector destino actual:', sectorDestino);
        console.log('🔍 MODAL - Índice actual:', sectorSeleccionadoIndex);
        
        // Si ya hay un sector seleccionado, mover directamente al campo cantidad
        if (sectorDestino) {
          console.log('🔍 MODAL - Ya hay sector seleccionado, moviendo a cantidad');
          setTimeout(() => {
            console.log('🔍 MODAL - Intentando mover foco a cantidad');
            if (cantidadTransferirRef.current) {
              cantidadTransferirRef.current.focus();
              cantidadTransferirRef.current.select(); // Seleccionar todo el texto para facilitar escritura
              console.log('🔍 MODAL - Foco movido a campo cantidad');
            } else {
              console.log('🔍 MODAL - Error: cantidadTransferirRef.current es null');
            }
          }, 150);
        } else if (sectoresFiltrados[sectorSeleccionadoIndex]) {
          // Si no hay sector seleccionado, seleccionar el que está en el índice actual
          setSectorDestino(sectoresFiltrados[sectorSeleccionadoIndex].id);
          console.log('🔍 MODAL - Sector destino establecido:', sectoresFiltrados[sectorSeleccionadoIndex].id);
          // Mover foco al campo de cantidad
          setTimeout(() => {
            console.log('🔍 MODAL - Intentando mover foco a cantidad');
            if (cantidadTransferirRef.current) {
              cantidadTransferirRef.current.focus();
              cantidadTransferirRef.current.select(); // Seleccionar todo el texto para facilitar escritura
              console.log('🔍 MODAL - Foco movido a campo cantidad');
            } else {
              console.log('🔍 MODAL - Error: cantidadTransferirRef.current es null');
            }
          }, 150);
        }
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation(); // Evitar que afecte la navegación de la tabla
        console.log('🔍 MODAL - Escape presionado en select sector');
        cerrarModalTransferir();
        break;
    }
  };

  // Función para manejar navegación por teclado en el input de cantidad
  const manejarTecladoCantidad = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation(); // Evitar que afecte la navegación de la tabla
      // Ejecutar la acción correspondiente (transferir o asignar)
      if (modoAsignacion) {
        asignarProductoASector();
      } else {
        transferirStock();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation(); // Evitar que afecte la navegación de la tabla
      console.log('🔍 MODAL - Escape presionado en input cantidad');
      cerrarModalTransferir();
    }
  };

  // Función para transferir stock
  const transferirStock = async () => {
    if (!productoSeleccionado || !sectorDestino || cantidadTransferir <= 0) {
      toast.error('Por favor completa todos los campos correctamente');
      return;
    }

    if (productoSeleccionado.cantidad < cantidadTransferir) {
      toast.error('No hay suficiente stock para transferir');
      return;
    }

    // Si el producto no tiene sector, no se puede transferir (necesita estar en un sector primero)
    if (!productoSeleccionado.sector) {
      toast.error('El producto debe estar asignado a un sector antes de poder transferirse');
      return;
    }

    try {
      setTransferiendo(true);
      
      const response = await apiCall(`/empresas/${datosUsuario?.empresaId}/sectores/transferir-stock`, {
        method: 'POST',
        body: JSON.stringify({
          productoId: productoSeleccionado.producto.id,
          sectorOrigenId: productoSeleccionado.sector?.id,
          sectorDestinoId: sectorDestino,
          cantidad: cantidadTransferir
        })
      });

      if (response.ok) {
        toast.success('Stock transferido exitosamente');
        cerrarModalTransferir();
        cargarStockGeneral(); // Recargar datos
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al transferir stock');
      }
    } catch (error) {
      console.error('Error al transferir stock:', error);
      toast.error('Error al transferir stock');
    } finally {
      setTransferiendo(false);
    }
  };

  // Función para asignar producto a sector
  const asignarProductoASector = async () => {
    if (!productoSeleccionado || !sectorDestino) {
      toast.error('Por favor selecciona un sector');
      return;
    }

    try {
      setAsignandoSector(true);
      
      const asignaciones = [{
        productoId: productoSeleccionado.producto.id,
        cantidad: cantidadTransferir || productoSeleccionado.cantidad
      }];
      
      const response = await apiCall(`/empresas/${datosUsuario?.empresaId}/sectores/${sectorDestino}/asignar-productos`, {
        method: 'POST',
        body: JSON.stringify({ asignaciones })
      });

      if (response.ok) {
        toast.success('Producto asignado al sector exitosamente');
        cerrarModalTransferir();
        cargarStockGeneral(); // Recargar datos
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al asignar producto al sector');
      }
    } catch (error) {
      console.error('Error al asignar producto al sector:', error);
      toast.error('Error al asignar producto al sector');
    } finally {
      setAsignandoSector(false);
    }
  };

  // Función para manejar cambios en cantidad de transferencia
  const manejarCambioCantidadTransferir = (valor: string) => {
    setCantidadTransferirTexto(valor);
    
    if (valor.trim() === '') {
      setCantidadTransferir(0);
      setResultadoCalculoTransferir(null);
      setErrorCalculoTransferir('');
      return;
    }
    
    // Evaluar expresión matemática
    try {
      // Permitir operaciones básicas y números
      const expresionLimpia = valor.replace(/[^0-9+\-*/.() ]/g, '');
      if (expresionLimpia !== valor) {
        setErrorCalculoTransferir('Solo se permiten números y operaciones básicas (+, -, *, /)');
        setResultadoCalculoTransferir(null);
        return;
      }
      
      const resultado = Function('"use strict"; return (' + expresionLimpia + ')')();
      
      if (typeof resultado === 'number' && !isNaN(resultado) && isFinite(resultado)) {
        const cantidadFinal = Math.round(resultado);
        setCantidadTransferir(cantidadFinal);
        setResultadoCalculoTransferir(cantidadFinal);
        setErrorCalculoTransferir('');
      } else {
        setErrorCalculoTransferir('Resultado inválido');
        setResultadoCalculoTransferir(null);
      }
    } catch (error) {
      setErrorCalculoTransferir('Expresión inválida');
      setResultadoCalculoTransferir(null);
    }
  };

  if (!datosUsuario) {
    return (
      <div className="stock-page">
        <div className="stock-container">
          <div className="loading-card">
            <div className="spinner"></div>
            <p>Cargando datos de usuario...</p>
          </div>
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="stock-page">
        <div className="stock-container">
          <div className="loading-card">
            <div className="spinner"></div>
            <p>Cargando stock general...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stock-page">
      <NavbarAdmin onCerrarSesion={cerrarSesion} />
      
      <div className="stock-container" style={{
        padding: isMobile ? '4rem 0.5rem 0.5rem 0.5rem' : '0.25rem 1rem'
      }}>
        {/* Header */}
        <div className="stock-header" style={{
          marginBottom: isMobile ? '1.5rem' : '1rem'
        }}>
          <div className="header-content">
            <div className="header-icon" style={{
              width: isMobile ? '60px' : '80px',
              height: isMobile ? '60px' : '80px',
              fontSize: isMobile ? '2rem' : '3rem'
            }}>📊</div>
            <h1 className="header-title" style={{
              fontSize: isMobile ? '1.75rem' : '2rem'
            }}>Stock General</h1>
            <p className="header-description" style={{
              fontSize: isMobile ? '0.9rem' : '1rem'
            }}>
              Vista completa del inventario de tu empresa con búsqueda avanzada
            </p>
          </div>
        </div>



        {/* Estadísticas */}
        <div className="stats-grid" style={{
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '0.75rem' : '1rem',
          marginBottom: isMobile ? '1.5rem' : '2rem'
        }}>
          <div className="stat-card" style={{
            padding: isMobile ? '1rem' : '1.5rem',
            flexDirection: isMobile ? 'column' : 'row',
            textAlign: isMobile ? 'center' : 'left',
            gap: isMobile ? '0.5rem' : '1rem'
          }}>
            <div className="stat-icon" style={{
              width: isMobile ? '40px' : '50px',
              height: isMobile ? '40px' : '50px',
              fontSize: isMobile ? '1.25rem' : '1.5rem'
            }}>📦</div>
            <div className="stat-content">
              <div className="stat-number" style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem'
              }}>{estadisticas.totalProductos}</div>
              <div className="stat-label" style={{
                fontSize: isMobile ? '0.8rem' : '0.9rem'
              }}>Total Productos</div>
            </div>
          </div>
          <div className="stat-card" style={{
            padding: isMobile ? '1rem' : '1.5rem',
            flexDirection: isMobile ? 'column' : 'row',
            textAlign: isMobile ? 'center' : 'left',
            gap: isMobile ? '0.5rem' : '1rem'
          }}>
            <div className="stat-icon" style={{
              width: isMobile ? '40px' : '50px',
              height: isMobile ? '40px' : '50px',
              fontSize: isMobile ? '1.25rem' : '1.5rem'
            }}>🏢</div>
            <div className="stat-content">
              <div className="stat-number" style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem'
              }}>{estadisticas.productosConSector}</div>
              <div className="stat-label" style={{
                fontSize: isMobile ? '0.8rem' : '0.9rem'
              }}>Con sector</div>
            </div>
          </div>
          <div className="stat-card" style={{
            padding: isMobile ? '1rem' : '1.5rem',
            flexDirection: isMobile ? 'column' : 'row',
            textAlign: isMobile ? 'center' : 'left',
            gap: isMobile ? '0.5rem' : '1rem'
          }}>
            <div className="stat-icon" style={{
              width: isMobile ? '40px' : '50px',
              height: isMobile ? '40px' : '50px',
              fontSize: isMobile ? '1.25rem' : '1.5rem'
            }}>⚠️</div>
            <div className="stat-content">
              <div className="stat-number" style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem'
              }}>{estadisticas.productosSinSector}</div>
              <div className="stat-label" style={{
                fontSize: isMobile ? '0.8rem' : '0.9rem'
              }}>Sin sector</div>
            </div>
          </div>
          <div className="stat-card" style={{
            padding: isMobile ? '1rem' : '1.5rem',
            flexDirection: isMobile ? 'column' : 'row',
            textAlign: isMobile ? 'center' : 'left',
            gap: isMobile ? '0.5rem' : '1rem'
          }}>
            <div className="stat-icon" style={{
              width: isMobile ? '40px' : '50px',
              height: isMobile ? '40px' : '50px',
              fontSize: isMobile ? '1.25rem' : '1.5rem'
            }}>🔢</div>
            <div className="stat-content">
              <div className="stat-number" style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem'
              }}>{estadisticas.totalUnidades}</div>
              <div className="stat-label" style={{
                fontSize: isMobile ? '0.8rem' : '0.9rem'
              }}>Total Unidades</div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="filters-section" style={{
          padding: isMobile ? '1rem' : '1.5rem',
          marginBottom: isMobile ? '1rem' : '1.5rem'
        }}>
          <div className="filters-container" style={{
            gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr',
            gap: isMobile ? '1rem' : '1rem'
          }}>
            <div className="search-group">
              <div className="search-input-wrapper">
                <span className="search-icon" style={{
                  left: isMobile ? '0.75rem' : '1rem',
                  fontSize: isMobile ? '1rem' : '1.1rem'
                }}>🔍</span>
                <input
                  type="text"
                  placeholder="Buscar por nombre o código..."
                  value={filtroBusqueda}
                  onChange={(e) => setFiltroBusqueda(e.target.value)}
                  className="search-input"
                  ref={(el) => setInputBusquedaRef(el)}
                  style={{
                    padding: isMobile ? '0.75rem 1rem 0.75rem 2.5rem' : '1rem 1.5rem 1rem 3rem',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    minHeight: isMobile ? '44px' : '48px'
                  }}
                />
              </div>
            </div>
            
            <div className="filter-group">
              <select
                value={filtroTipo}
                onChange={(e) => {
                  setFiltroTipo(e.target.value as any);
                  // Resetear filtro de sector cuando se cambia el tipo
                  if (e.target.value === 'sin_sector' || e.target.value === 'sin_sectorizar') {
                    setFiltroSector('todos');
                  }
                }}
                className="filter-select"
                style={{
                  padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  minHeight: isMobile ? '44px' : '48px'
                }}
              >
                <option value="todos">Todos los productos</option>
                <option value="con_sector">Con sector asignado</option>
                <option value="sin_sector">Sin sector asignado</option>
                <option value="sin_sectorizar">Sin sectorizar (consolidado)</option>
              </select>
            </div>

            <div className="filter-group">
              <select
                value={filtroSector}
                onChange={(e) => setFiltroSector(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
                className="filter-select"
                disabled={filtroTipo === 'sin_sector' || filtroTipo === 'sin_sectorizar'}
                style={{
                  padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  minHeight: isMobile ? '44px' : '48px',
                  opacity: (filtroTipo === 'sin_sector' || filtroTipo === 'sin_sectorizar') ? 0.5 : 1,
                  cursor: (filtroTipo === 'sin_sector' || filtroTipo === 'sin_sectorizar') ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="todos">Todos los sectores</option>
                {sectoresDisponibles.map(sector => (
                  <option key={sector.id} value={sector.id}>
                    {sector.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="table-section" style={{
          padding: isMobile ? '0.75rem' : '1rem'
        }}>
          <div className="table-header" style={{
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '1rem' : '0',
            alignItems: isMobile ? 'stretch' : 'center'
          }}>
            <h3 style={{
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              textAlign: isMobile ? 'center' : 'left'
            }}>Productos ({datosOrdenados.length})</h3>
          </div>

          {datosOrdenados.length === 0 ? (
            <div className="empty-message">
              <div className="empty-icon">📭</div>
              <h4>No se encontraron productos</h4>
              <p>Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <>
              {isMobile ? (
              // Vista móvil con tarjetas
              <div className="mobile-cards-wrapper" style={{
                maxHeight: '60vh',
                overflowY: 'auto'
              }}>
                {datosOrdenados.map((item, index) => (
                  <div
                    key={item.id}
                    className={`mobile-stock-card ${filaSeleccionada === index ? 'card-seleccionada' : ''} clickeable-card`}
                    onClick={() => manejarClicFila(item)}
                    style={{
                      background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                      border: filaSeleccionada === index ? '2px solid #3b82f6' : '1px solid rgba(226, 232, 240, 0.8)',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      marginBottom: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: filaSeleccionada === index 
                        ? '0 8px 32px rgba(59, 130, 246, 0.2), 0 4px 16px rgba(59, 130, 246, 0.1)' 
                        : '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
                      backdropFilter: 'blur(10px)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Primera fila: Código y Nombre */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.75rem',
                      gap: '1rem'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          marginBottom: '0.25rem',
                          fontWeight: '500'
                        }}>
                          Código
                        </div>
                        <div style={{
                          fontSize: '0.9rem',
                          color: '#059669',
                          fontWeight: '700',
                          wordBreak: 'break-all',
                          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(34, 197, 94, 0.2)',
                          display: 'inline-block',
                          boxShadow: '0 1px 3px rgba(34, 197, 94, 0.1)'
                        }}>
                          {item.producto.codigoPersonalizado || 'Sin código'}
                        </div>
                      </div>
                      <div style={{ flex: 2, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          marginBottom: '0.25rem',
                          fontWeight: '500'
                        }}>
                          Producto
                        </div>
                        <div style={{
                          fontSize: '1rem',
                          color: '#1e40af',
                          fontWeight: '700',
                          cursor: 'pointer',
                          wordBreak: 'break-word',
                          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 1px 3px rgba(59, 130, 246, 0.1)',
                          position: 'relative'
                        }}
                        onClick={(e) => manejarClicNombre(e, item)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(59, 130, 246, 0.1)';
                        }}
                        >
                          {item.producto.nombre}
                        </div>
                      </div>
                    </div>

                    {/* Segunda fila: Sector y Cantidad */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          marginBottom: '0.25rem',
                          fontWeight: '500'
                        }}>
                          Sector
                        </div>
                        <div style={{
                          fontSize: '0.85rem',
                          fontWeight: '600'
                        }}>
                          {filtroTipo === 'sin_sectorizar' ? (
                            <span style={{
                              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                              color: 'white',
                              padding: '0.5rem 1rem',
                              borderRadius: '12px',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              display: 'inline-block',
                              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                              border: '1px solid rgba(139, 92, 246, 0.2)',
                              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                            }}>
                              📊 Consolidado
                            </span>
                          ) : item.sector ? (
                            <span style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              padding: '0.5rem 1rem',
                              borderRadius: '12px',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              display: 'inline-block',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                              border: '1px solid rgba(16, 185, 129, 0.2)',
                              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                              wordBreak: 'break-word'
                            }}>
                              🏢 {item.sector.nombre}
                            </span>
                          ) : (
                            <span style={{
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              color: 'white',
                              padding: '0.5rem 1rem',
                              borderRadius: '12px',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              display: 'inline-block',
                              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                              border: '1px solid rgba(245, 158, 11, 0.2)',
                              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                            }}>
                              ⚠️ Sin sector
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          marginBottom: '0.25rem',
                          fontWeight: '500'
                        }}>
                          Cantidad
                        </div>
                        <div style={{
                          fontSize: '1.1rem',
                          color: '#1f2937',
                          fontWeight: '800',
                          textAlign: 'right',
                          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                          padding: '0.75rem 1rem',
                          borderRadius: '12px',
                          border: '2px solid rgba(226, 232, 240, 0.5)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          <span style={{
                            fontSize: '1.3rem',
                            color: '#059669',
                            fontWeight: '900',
                            display: 'block',
                            marginBottom: '0.25rem'
                          }}>
                            {item.cantidad.toLocaleString()}
                          </span>
                          <span style={{
                            fontSize: '0.8rem',
                            color: '#64748b',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {item.producto.unidadMedida || 'unidades'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Fecha de actualización */}
                    <div style={{
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '2px solid rgba(226, 232, 240, 0.6)',
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      color: '#64748b',
                      textAlign: 'center',
                      fontWeight: '500',
                      border: '1px solid rgba(226, 232, 240, 0.3)',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                    }}>
                      <span style={{ fontWeight: '600', color: '#475569' }}>🕒 Actualizado:</span>{' '}
                      {formatearFechaConHora(item.fechaActualizacion)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Vista desktop con tabla
              <div className="table-wrapper" style={{
                maxHeight: '70vh',
                overflowX: 'auto',
                overflowY: 'auto'
              }}>
                <table className="stock-table" style={{
                  minWidth: '100%'
                }}>
                <thead>
                  <tr>
                    <th onClick={() => cambiarOrden('codigo')} className="sortable-header" style={{
                      padding: isMobile ? '0.75rem 0.5rem' : '1.25rem 1rem',
                      fontSize: isMobile ? '0.8rem' : '0.95rem'
                    }}>
                      Código {ordenarPor === 'codigo' && (ordenAscendente ? '↑' : '↓')}
                    </th>
                    <th onClick={() => cambiarOrden('nombre')} className="sortable-header" style={{
                      padding: isMobile ? '0.75rem 0.5rem' : '1.25rem 1rem',
                      fontSize: isMobile ? '0.8rem' : '0.95rem'
                    }}>
                      Producto {ordenarPor === 'nombre' && (ordenAscendente ? '↑' : '↓')}
                    </th>
                    <th onClick={() => cambiarOrden('sector')} className="sortable-header" style={{
                      padding: isMobile ? '0.75rem 0.5rem' : '1.25rem 1rem',
                      fontSize: isMobile ? '0.8rem' : '0.95rem'
                    }}>
                      Sector {ordenarPor === 'sector' && (ordenAscendente ? '↑' : '↓')}
                    </th>
                    <th onClick={() => cambiarOrden('cantidad')} className="sortable-header" style={{
                      padding: isMobile ? '0.75rem 0.5rem' : '1.25rem 1rem',
                      fontSize: isMobile ? '0.8rem' : '0.95rem'
                    }}>
                      Cantidad {ordenarPor === 'cantidad' && (ordenAscendente ? '↑' : '↓')}
                    </th>
                    <th style={{
                      padding: isMobile ? '0.75rem 0.5rem' : '1.25rem 1rem',
                      fontSize: isMobile ? '0.8rem' : '0.95rem'
                    }}>Última Actualización</th>
                  </tr>
                </thead>
                <tbody>
                  {datosOrdenados.map((item, index) => (
                    <tr 
                      key={item.id} 
                      className={`table-row ${filaSeleccionada === index ? 'fila-seleccionada' : ''} clickeable-row`}
                      onClick={() => manejarClicFila(item)}
                      style={{
                        padding: isMobile ? '0.5rem 0.25rem' : '1.25rem 1rem',
                        cursor: 'pointer'
                      }}
                    >
                      <td className="code-cell" style={{
                        padding: isMobile ? '0.5rem 0.25rem' : '1.25rem 1rem',
                        fontSize: isMobile ? '0.8rem' : '0.9rem'
                      }}>{item.producto.codigoPersonalizado || 'Sin código'}</td>
                      <td className="name-cell" style={{
                        padding: isMobile ? '0.5rem 0.25rem' : '1.25rem 1rem',
                        fontSize: isMobile ? '0.8rem' : '0.9rem'
                      }}>
                        <div className="product-name-container">
                          <span 
                            className="product-name"
                            onClick={(e) => manejarClicNombre(e, item)}
                            style={{
                              cursor: 'pointer',
                              color: '#2563eb',
                              textDecoration: 'underline',
                              transition: 'color 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#1d4ed8';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#2563eb';
                            }}
                          >
                            {item.producto.nombre}
                          </span>
                        </div>
                      </td>
                      <td className="sector-cell" style={{
                        padding: isMobile ? '0.5rem 0.25rem' : '1.25rem 1rem',
                        fontSize: isMobile ? '0.8rem' : '0.9rem',
                        minWidth: isMobile ? '120px' : '150px',
                        maxWidth: isMobile ? '200px' : '300px',
                        overflow: 'auto',
                        whiteSpace: 'nowrap'
                      }}>
                        <div className="sector-cell-content" style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          width: '100%'
                        }}>
                          {filtroTipo === 'sin_sectorizar' ? (
                            <span className="consolidated-badge">Consolidado</span>
                          ) : item.sector ? (
                            <span 
                              className="sector-badge sector-badge-full" 
                              title={item.sector.nombre}
                              style={{
                                maxWidth: 'none',
                                whiteSpace: 'nowrap',
                                overflow: 'visible',
                                textOverflow: 'clip',
                                display: 'inline-block'
                              }}
                            >
                              {item.sector.nombre}
                            </span>
                          ) : (
                            <span className="no-sector-badge">Sin sector</span>
                          )}
                        </div>
                      </td>
                      <td className="quantity-cell" style={{
                        padding: isMobile ? '0.5rem 0.25rem' : '1.25rem 1rem',
                        fontSize: isMobile ? '0.8rem' : '0.9rem'
                      }}>
                        <span className="quantity-number">{item.cantidad}</span>
                        <span className="quantity-unit">{item.producto.unidadMedida || 'unidades'}</span>
                      </td>
                      <td className="date-cell" style={{
                        padding: isMobile ? '0.5rem 0.25rem' : '1.25rem 1rem',
                        fontSize: isMobile ? '0.8rem' : '0.9rem'
                      }}>
                        {new Date(item.fechaActualizacion).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
            </>
          )}
        </div>
      </div>

      {/* Modal de Transferir Stock */}
      {mostrarModalTransferir && productoSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-formulario">
            <div className="header-modal">
              <div className="contenido-header-modal">
                <div className="icono-modal">{modoAsignacion ? '📍' : '🔄'}</div>
                <div>
                  <h3 className="titulo-modal">
                    {modoAsignacion ? 'Asignar Producto a Sector' : 'Transferir Stock entre Sectores'}
                  </h3>
                  <p className="subtitulo-modal">
                    {modoAsignacion 
                      ? 'Asignar un producto sin sector a un sector específico' 
                      : 'Mover productos entre sectores de almacenamiento'
                    }
                  </p>
                </div>
              </div>
              <button onClick={cerrarModalTransferir} className="boton-cerrar-modal">
                ✕
              </button>
            </div>
            
            <div className="contenido-modal-formulario">
              <div className="seccion-transferencia">
                <h4>
                  {modoAsignacion 
                    ? 'Producto sin sector asignado' 
                    : `Sector Origen: ${productoSeleccionado.sector?.nombre}`
                  }
                </h4>
                
                <div className="campo-transferencia">
                  <label>
                    {modoAsignacion ? 'Producto a asignar:' : 'Producto a transferir:'}
                  </label>
                  <div className="producto-seleccionado">
                    <strong>{productoSeleccionado.producto.nombre}</strong>
                    <span className="stock-disponible">
                      Código: {productoSeleccionado.producto.codigoPersonalizado || 'Sin código'} | 
                      Stock disponible: {productoSeleccionado.cantidad} {productoSeleccionado.producto.unidadMedida || 'unidades'}
                    </span>
                  </div>
                </div>

                {modoAsignacion && (
                  <div className="campo-transferencia">
                    <div style={{
                      background: '#f0f9ff',
                      border: '2px solid #0ea5e9',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>📍</span>
                        <strong style={{ color: '#0c4a6e' }}>Asignar a Sector</strong>
                      </div>
                      <p style={{ color: '#0c4a6e', margin: 0, fontSize: '0.9rem' }}>
                        Este producto no está asignado a ningún sector. Selecciona un sector y la cantidad para asignarlo directamente desde aquí.
                      </p>
                    </div>
                  </div>
                )}

                <div className="campo-transferencia">
                  <label>
                    {modoAsignacion ? 'Sector a asignar:' : 'Sector destino:'}
                  </label>
                  <select
                    ref={sectorDestinoRef}
                    value={sectorDestino}
                    onChange={(e) => setSectorDestino(Number(e.target.value))}
                    onKeyDown={manejarTecladoSector}
                    onFocus={(e) => {
                      // Cuando el select recibe foco, establecer el índice basado en el valor seleccionado
                      const sectoresFiltrados = sectoresDisponibles?.filter(sector => 
                        !modoAsignacion ? sector.id !== productoSeleccionado.sector?.id : true
                      ) || [];
                      const indexEncontrado = sectoresFiltrados.findIndex(sector => sector.id === sectorDestino);
                      if (indexEncontrado !== -1) {
                        setSectorSeleccionadoIndex(indexEncontrado);
                      }
                    }}
                    className="select-transferencia"
                  >
                    <option value="">
                      {modoAsignacion ? 'Seleccionar sector' : 'Seleccionar sector destino'}
                    </option>
                    {sectoresDisponibles
                      .filter(sector => !modoAsignacion ? sector.id !== productoSeleccionado.sector?.id : true)
                      .map((sector, index) => (
                        <option 
                          key={sector.id} 
                          value={sector.id}
                          style={{
                            backgroundColor: index === sectorSeleccionadoIndex ? '#e0f2fe' : 'transparent'
                          }}
                        >
                          {sector.nombre}
                        </option>
                      ))}
                  </select>
                  
                  {/* Información de navegación por teclado */}
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                      ⌨️ Navegación por teclado:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {sectoresDisponibles.filter(sector => !modoAsignacion ? sector.id !== productoSeleccionado.sector?.id : true).length > 1 ? (
                        <>
                          <span>↑↓ Navegar sectores</span>
                          <span>Enter → Confirmar y pasar a cantidad</span>
                          <span>Esc → Cancelar</span>
                        </>
                      ) : (
                        <>
                          <span>Enter → Confirmar y pasar a cantidad</span>
                          <span>Esc → Cancelar</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="campo-transferencia">
                  <label>
                    {modoAsignacion ? 'Cantidad a asignar:' : 'Cantidad a transferir:'}
                  </label>
                  <div className="input-cantidad-transferencia">
                    <input
                      ref={cantidadTransferirRef}
                      type="text"
                      value={cantidadTransferirTexto}
                      onChange={(e) => manejarCambioCantidadTransferir(e.target.value)}
                      onKeyDown={manejarTecladoCantidad}
                      placeholder="Ej: 10, 5+3, 20/2"
                      className="input-transferencia"
                    />
                    <span className="stock-disponible-transferencia">
                      Máximo: {productoSeleccionado.cantidad}
                    </span>
                    
                    {resultadoCalculoTransferir !== null && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#10b981',
                        marginTop: '0.25rem',
                        fontWeight: '600',
                        background: '#f0fdf4',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        border: '1px solid #bbf7d0'
                      }}>
                        ✅ Resultado: {resultadoCalculoTransferir.toLocaleString()} unidades
                      </div>
                    )}
                    
                    {errorCalculoTransferir && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#ef4444',
                        marginTop: '0.25rem',
                        fontWeight: '600',
                        background: '#fef2f2',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        border: '1px solid #fecaca'
                      }}>
                        ❌ {errorCalculoTransferir}
                      </div>
                    )}
                    
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      marginTop: '0.25rem',
                      lineHeight: '1.2'
                    }}>
                      💡 Puedes usar: +, -, *, /, x, paréntesis
                    </div>
                  </div>
                  
                  {/* Información de navegación para cantidad */}
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '6px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                      ⌨️ Enter para {modoAsignacion ? 'asignar' : 'transferir'}:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span>Enter → {modoAsignacion ? 'Asignar a Sector' : 'Transferir Stock'}</span>
                      <span>Esc → Cancelar y cerrar modal</span>
                    </div>
                  </div>
                </div>

                {cantidadTransferir > 0 && sectorDestino && (
                  <div className="resumen-transferencia">
                    <h4>Resumen de la {modoAsignacion ? 'asignación' : 'transferencia'}</h4>
                    <div className="detalles-transferencia">
                      <p><strong>Producto:</strong> {productoSeleccionado.producto.nombre}</p>
                      {!modoAsignacion && (
                        <p><strong>Desde:</strong> {productoSeleccionado.sector?.nombre}</p>
                      )}
                      <p><strong>{modoAsignacion ? 'A sector:' : 'Hacia:'}</strong> {sectoresDisponibles.find(s => s.id === sectorDestino)?.nombre}</p>
                      <p><strong>Cantidad:</strong> {
                        resultadoCalculoTransferir 
                          ? `${cantidadTransferirTexto} = ${resultadoCalculoTransferir}` 
                          : cantidadTransferirTexto
                      } {productoSeleccionado.producto.unidadMedida || 'unidades'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="botones-modal">
              <button
                onClick={cerrarModalTransferir}
                className="boton-cancelar"
                disabled={transferiendo || asignandoSector}
              >
                Cancelar
              </button>
              <button
                onClick={modoAsignacion ? asignarProductoASector : transferirStock}
                className="boton-primario"
                disabled={transferiendo || asignandoSector || !sectorDestino || cantidadTransferir <= 0}
              >
                {asignandoSector 
                  ? 'Asignando...' 
                  : transferiendo 
                    ? 'Transferiendo...' 
                    : modoAsignacion 
                      ? 'Asignar a Sector' 
                      : 'Transferir Stock'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Foto del Producto */}
      {mostrarModalFoto && productoParaFoto && (
        <div className="modal-overlay">
          <div className="modal-formulario">
            <div className="header-modal">
              <div className="contenido-header-modal">
                <div className="icono-modal">📷</div>
                <div>
                  <h3 className="titulo-modal">Foto del Producto</h3>
                  <p className="subtitulo-modal">{productoParaFoto.producto.nombre}</p>
                </div>
              </div>
              <button onClick={cerrarModalFoto} className="boton-cerrar-modal">
                ✕
              </button>
            </div>
            
            <div className="contenido-modal-formulario">
              <div className="seccion-transferencia">
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  {productoParaFoto.producto.imagenes && productoParaFoto.producto.imagenes.length > 0 ? (
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: '500px',
                      maxHeight: '400px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {/* Botón anterior */}
                      {productoParaFoto.producto.imagenes.length > 1 && (
                        <button
                          onClick={imagenAnterior}
                          style={{
                            position: 'absolute',
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            zIndex: 10,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
                            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                          }}
                        >
                          ‹
                        </button>
                      )}

                      {/* Imagen actual */}
                      <img
                        src={productoParaFoto.producto.imagenes[imagenActual]}
                        alt={productoParaFoto.producto.nombre}
                        onTouchStart={manejarInicioTactil}
                        onTouchEnd={manejarFinTactil}
                        style={{
                          width: '100%',
                          maxHeight: '400px',
                          objectFit: 'contain',
                          borderRadius: '12px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          backgroundColor: '#f8fafc',
                          padding: '1rem',
                          userSelect: 'none'
                        }}
                      />

                      {/* Botón siguiente */}
                      {productoParaFoto.producto.imagenes.length > 1 && (
                        <button
                          onClick={imagenSiguiente}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            zIndex: 10,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
                            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                          }}
                        >
                          ›
                        </button>
                      )}

                      {/* Indicadores de posición */}
                      {productoParaFoto.producto.imagenes.length > 1 && (
                        <div style={{
                          position: 'absolute',
                          bottom: '10px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          gap: '8px',
                          background: 'rgba(0, 0, 0, 0.7)',
                          padding: '8px 12px',
                          borderRadius: '20px'
                        }}>
                          {productoParaFoto.producto.imagenes.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setImagenActual(index)}
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                border: 'none',
                                background: index === imagenActual ? 'white' : 'rgba(255, 255, 255, 0.5)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Contador de imágenes */}
                      {productoParaFoto.producto.imagenes.length > 1 && (
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'rgba(0, 0, 0, 0.7)',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: '500'
                        }}>
                          {imagenActual + 1} / {productoParaFoto.producto.imagenes.length}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      width: '100%',
                      maxWidth: '500px',
                      height: '300px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '2px dashed #d1d5db',
                      color: '#6b7280',
                      gap: '1rem'
                    }}>
                      <span style={{ fontSize: '4rem' }}>📷</span>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                          Sin imagen disponible
                        </p>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                          Este producto no tiene una foto asociada
                        </p>
                      </div>
                    </div>
                  )}
                  
                     <div style={{
                       textAlign: 'center',
                       padding: '1rem',
                       backgroundColor: '#f8fafc',
                       borderRadius: '8px',
                       width: '100%'
                     }}>
                       <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>
                         {productoParaFoto.producto.nombre}
                       </h4>
                       <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                         <span style={{ color: '#6b7280' }}>
                           <strong>Código:</strong> {productoParaFoto.producto.codigoPersonalizado || 'Sin código'}
                         </span>
                         <span style={{ color: '#6b7280' }}>
                           <strong>Stock:</strong> {productoParaFoto.cantidad} {productoParaFoto.producto.unidadMedida || 'unidades'}
                         </span>
                         {productoParaFoto.sector && (
                           <span style={{ color: '#6b7280' }}>
                             <strong>Sector:</strong> {productoParaFoto.sector.nombre}
                           </span>
                         )}
                       </div>
                       
                       {/* Información de navegación */}
                       {productoParaFoto.producto.imagenes && productoParaFoto.producto.imagenes.length > 1 && (
                         <div style={{
                           marginTop: '1rem',
                           padding: '0.75rem',
                           backgroundColor: '#e0f2fe',
                           borderRadius: '8px',
                           fontSize: '0.85rem',
                           color: '#0277bd'
                         }}>
                           <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                             💡 Navegación disponible:
                           </div>
                           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                             <span>🖱️ Botones laterales</span>
                             <span>⌨️ Flechas del teclado</span>
                             <span>👆 Deslizar en móvil</span>
                             <span>🔘 Puntos de navegación</span>
                           </div>
                         </div>
                       )}
                     </div>
                </div>
              </div>
            </div>
            
            <div className="botones-modal">
              <button
                onClick={cerrarModalFoto}
                className="boton-cancelar"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
