import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
import { obtenerFechaActual } from '../../utils/dateUtils';
import { API_CONFIG } from '../../config/api';

interface DetallePlanillaPedido {
  id: number;
  productoId?: number;
  numeroPersonalizado?: string;
  descripcion: string;
  cantidad: number;
  observaciones?: string;
  fechaCreacion: string;
}

interface Producto {
  id: number;
  nombre: string;
  codigoPersonalizado?: string;
  descripcion?: string;
  stock: number;
  codigoBarras?: string;
}

interface Transportista {
  id: number;
  codigoInterno: string;
  nombreApellido: string;
  nombreEmpresa?: string;
  activo: boolean;
  vehiculos: Vehiculo[];
}

interface Vehiculo {
  id: number;
  marca: string;
  modelo: string;
  patente: string;
  activo: boolean;
}

export default function CrearPlanilla() {
  const { datosUsuario, cerrarSesion, cargando: cargandoUsuario } = useUsuarioActual();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);

  // La función obtenerFechaActual ahora está en utils/dateUtils.ts

  // Estados para nueva planilla
  const [nuevaPlanilla, setNuevaPlanilla] = useState({
    fechaPlanilla: obtenerFechaActual(),
    codigoPlanilla: '',
    transporte: '',
    observaciones: '',
    detalles: [] as DetallePlanillaPedido[]
  });

  // Estado para el último producto seleccionado
  const [ultimoProductoSeleccionado, setUltimoProductoSeleccionado] = useState<Producto | null>(null);
  const [ultimaCantidadAgregada, setUltimaCantidadAgregada] = useState<number>(0);

  // Estados para búsqueda dinámica
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([]);
  const [mostrarProductos, setMostrarProductos] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<number>(-1);
  const [inputBusqueda, setInputBusqueda] = useState('');
  const [productoParaCantidad, setProductoParaCantidad] = useState<Producto | null>(null);
  const [cantidadTemporal, setCantidadTemporal] = useState(1);
  const [cantidadTemporalTexto, setCantidadTemporalTexto] = useState<string>('');
  const [resultadoCalculoPlanilla, setResultadoCalculoPlanilla] = useState<number | null>(null);
  const [errorCalculoPlanilla, setErrorCalculoPlanilla] = useState<string | null>(null);
  const [modoCantidad, setModoCantidad] = useState(false);

  // Estados para búsqueda de transportistas
  const [transportistas, setTransportistas] = useState<Transportista[]>([]);
  const [transportistasFiltrados, setTransportistasFiltrados] = useState<Transportista[]>([]);
  const [opcionesTransporte, setOpcionesTransporte] = useState<Array<{
    transportista: Transportista;
    vehiculo?: Vehiculo;
    displayText: string;
    key: string;
  }>>([]);
  const [mostrarTransportistas, setMostrarTransportistas] = useState(false);
  const [transportistaSeleccionado, setTransportistaSeleccionado] = useState<number>(-1);
  const [inputBusquedaTransporte, setInputBusquedaTransporte] = useState('');

  // Referencias
  const datosCargadosRef = useRef(false);
  const inputBusquedaRef = useRef<HTMLInputElement>(null);
  const inputCantidadRef = useRef<HTMLInputElement>(null);
  const listaProductosRef = useRef<HTMLDivElement>(null);
  const listaTransportistasRef = useRef<HTMLDivElement>(null);
  const codigoPlanillaRef = useRef<HTMLInputElement>(null);
  const transporteRef = useRef<HTMLInputElement>(null);
  const observacionesRef = useRef<HTMLInputElement>(null);
  const listaProductosPlanillaRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    // Solo cargar datos si el usuario ya está cargado
    if (datosUsuario && !datosCargadosRef.current) {
      datosCargadosRef.current = true;
      cargarProductos();
      cargarTransportistas();
    }
  }, [navigate, datosUsuario]);

  // Efecto para filtrar productos (priorizando código personalizado primero)
  useEffect(() => {
    if (inputBusqueda.trim()) {
      const filtrados = productos.filter(producto => {
        const matchCodigo = producto.codigoPersonalizado && producto.codigoPersonalizado.toLowerCase().includes(inputBusqueda.toLowerCase());
        const matchBarras = producto.codigoBarras && producto.codigoBarras.includes(inputBusqueda);
        const matchNombre = producto.nombre.toLowerCase().includes(inputBusqueda.toLowerCase());
        
        return matchCodigo || matchBarras || matchNombre;
      });
      
      const filtradosConStock = filtrados.filter(producto => obtenerStockDisponible(producto) > 0);
      
      // Ordenar resultados: primero códigos personalizados, luego códigos de barras, luego nombres
      const productosOrdenados = filtradosConStock.sort((a, b) => {
        const busqueda = inputBusqueda.toLowerCase();
        
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
        
        // Prioridad 4: Coincidencia en código de barras
        const aTieneBarras = a.codigoBarras?.includes(inputBusqueda);
        const bTieneBarras = b.codigoBarras?.includes(inputBusqueda);
        if (aTieneBarras && !bTieneBarras) return -1;
        if (!aTieneBarras && bTieneBarras) return 1;
        
        // Prioridad 5: Coincidencia en nombre (orden alfabético)
        return a.nombre.localeCompare(b.nombre);
      });
      
      setProductosFiltrados(productosOrdenados);
      setMostrarProductos(productosOrdenados.length > 0);
    } else {
      setProductosFiltrados([]);
      setMostrarProductos(false);
    }
  }, [inputBusqueda, productos]);

  // Efecto para manejar el foco del campo de búsqueda cuando cambia el modo cantidad
  useEffect(() => {
    if (!modoCantidad && inputBusquedaRef.current) {
      // Cuando se sale del modo cantidad, asegurar que el campo de búsqueda reciba el foco
      const delay = isMobile ? 300 : 100;
      setTimeout(() => {
        if (inputBusquedaRef.current) {
          inputBusquedaRef.current.focus();
          // En móvil, también hacer scroll hacia el campo de búsqueda
          if (isMobile) {
            inputBusquedaRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }
        }
      }, delay);
    }
  }, [modoCantidad, isMobile]);

  // Calcular resultado en tiempo real cuando se escribe en el campo de cantidad
  useEffect(() => {
    if (!cantidadTemporalTexto.trim()) {
      setResultadoCalculoPlanilla(null);
      setErrorCalculoPlanilla(null);
      return;
    }

    // Verificar si la cantidad contiene operadores matemáticos
    const contieneOperadores = /[+\-*/x()]/.test(cantidadTemporalTexto);
    
    if (contieneOperadores) {
      const evaluacion = evaluarExpresion(cantidadTemporalTexto);
      if (evaluacion.error) {
        setResultadoCalculoPlanilla(null);
        setErrorCalculoPlanilla(evaluacion.error);
      } else {
        setResultadoCalculoPlanilla(evaluacion.resultado);
        setErrorCalculoPlanilla(null);
      }
    } else {
      // Si no contiene operadores, limpiar el resultado
      setResultadoCalculoPlanilla(null);
      setErrorCalculoPlanilla(null);
    }
  }, [cantidadTemporalTexto]);

  // Efecto para filtrar transportistas
  useEffect(() => {
    if (inputBusquedaTransporte.trim()) {
      const busqueda = inputBusquedaTransporte.toLowerCase().trim();
      
      // Crear opciones individuales para cada transportista-vehículo
      const opciones: Array<{
        transportista: Transportista;
        vehiculo?: Vehiculo;
        displayText: string;
        key: string;
      }> = [];
      
      transportistas.forEach(transportista => {
        // Solo mostrar transportistas activos
        if (!transportista.activo) return;
        
        const vehiculosActivos = transportista.vehiculos.filter(v => v.activo);
        
        // Verificar si la búsqueda coincide con código interno o nombre del transportista
        const matchCodigo = transportista.codigoInterno.toLowerCase().includes(busqueda);
        const matchNombre = transportista.nombreApellido.toLowerCase().includes(busqueda);
        
        // Si coincide con transportista, mostrar todos sus vehículos
        if (matchCodigo || matchNombre) {
          // Solo mostrar transportistas que tienen vehículos activos
          if (vehiculosActivos.length > 0) {
            // Crear una opción por cada vehículo activo del transportista
            vehiculosActivos.forEach(vehiculo => {
              opciones.push({
                transportista,
                vehiculo,
                displayText: `${transportista.codigoInterno} - ${transportista.nombreApellido} (${vehiculo.modelo} - ${vehiculo.patente})`,
                key: `transportista-${transportista.id}-vehiculo-${vehiculo.id}`
              });
            });
          }
        } else {
          // Si no coincide con transportista, buscar vehículos específicos que coincidan
          vehiculosActivos.forEach(vehiculo => {
            const matchModelo = vehiculo.modelo.toLowerCase().includes(busqueda);
            const matchPatente = vehiculo.patente.toLowerCase().includes(busqueda);
            
            if (matchModelo || matchPatente) {
              opciones.push({
                transportista,
                vehiculo,
                displayText: `${transportista.codigoInterno} - ${transportista.nombreApellido} (${vehiculo.modelo} - ${vehiculo.patente})`,
                key: `transportista-${transportista.id}-vehiculo-${vehiculo.id}`
              });
            }
          });
        }
      });
      
      setOpcionesTransporte(opciones);
      setTransportistasFiltrados(transportistas.filter(t => 
        opciones.some(opcion => opcion.transportista.id === t.id)
      ));
      setMostrarTransportistas(opciones.length > 0);
    } else {
      setOpcionesTransporte([]);
      setTransportistasFiltrados([]);
      setMostrarTransportistas(false);
    }
  }, [inputBusquedaTransporte, transportistas]);

  // Resetear selección cuando se cierra la lista
  useEffect(() => {
    if (!mostrarProductos) {
      setProductoSeleccionado(-1);
    }
  }, [mostrarProductos]);

  // Efecto para enfocar el campo de código de planilla cuando se carga la página
  useEffect(() => {
    if (codigoPlanillaRef.current && !cargandoProductos) {
      // Pequeño delay para asegurar que la página esté completamente renderizada
      setTimeout(() => {
        codigoPlanillaRef.current?.focus();
      }, 100);
    }
  }, [cargandoProductos]);

  // Manejar tecla Escape para volver a la vista principal
  useEffect(() => {
    const manejarEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Si está en modo cantidad, no navegar fuera
        if (modoCantidad) {
          return;
        }
        navigate('/admin/gestion-empresa');
      }
    };

    document.addEventListener('keydown', manejarEscape);
    return () => {
      document.removeEventListener('keydown', manejarEscape);
    };
  }, [navigate, modoCantidad]);

  // Efecto para enfocar el campo de cantidad cuando se activa el modo cantidad
  useEffect(() => {
    if (modoCantidad && inputCantidadRef.current) {
      inputCantidadRef.current.focus();
      inputCantidadRef.current.select();
    }
  }, [modoCantidad]);

  // Auto-scroll para mantener visible el elemento seleccionado en la lista de productos
  useEffect(() => {
    if (productoSeleccionado >= 0 && listaProductosRef.current) {
      const listaElement = listaProductosRef.current;
      const elementos = listaElement.children;
      
      if (elementos[productoSeleccionado]) {
        const elementoSeleccionado = elementos[productoSeleccionado] as HTMLElement;
        const elementoRect = elementoSeleccionado.getBoundingClientRect();
        const listaRect = listaElement.getBoundingClientRect();
        
        // Verificar si el elemento está fuera del área visible
        if (elementoRect.top < listaRect.top) {
          // Elemento está arriba del área visible, hacer scroll hacia arriba
          // Usar scrollTop en lugar de scrollIntoView para no afectar la posición de la página
          const scrollOffset = elementoSeleccionado.offsetTop - listaElement.offsetTop;
          listaElement.scrollTo({
            top: scrollOffset,
            behavior: 'smooth'
          });
        } else if (elementoRect.bottom > listaRect.bottom) {
          // Elemento está abajo del área visible, hacer scroll hacia abajo
          // Calcular la posición para que el elemento quede visible en la parte inferior
          const scrollOffset = elementoSeleccionado.offsetTop - listaElement.offsetTop - (listaElement.clientHeight - elementoSeleccionado.clientHeight);
          listaElement.scrollTo({
            top: scrollOffset,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [productoSeleccionado]);

  // Auto-scroll para mantener visible el elemento seleccionado en la lista de transportistas
  useEffect(() => {
    if (transportistaSeleccionado >= 0 && listaTransportistasRef.current) {
      const listaElement = listaTransportistasRef.current;
      const elementos = listaElement.children;
      
      if (elementos[transportistaSeleccionado]) {
        const elementoSeleccionado = elementos[transportistaSeleccionado] as HTMLElement;
        const elementoRect = elementoSeleccionado.getBoundingClientRect();
        const listaRect = listaElement.getBoundingClientRect();
        
        // Verificar si el elemento está fuera del área visible
        if (elementoRect.top < listaRect.top) {
          // Elemento está arriba del área visible, hacer scroll hacia arriba
          // Usar scrollTop en lugar de scrollIntoView para no afectar la posición de la página
          const scrollOffset = elementoSeleccionado.offsetTop - listaElement.offsetTop;
          listaElement.scrollTo({
            top: scrollOffset,
            behavior: 'smooth'
          });
        } else if (elementoRect.bottom > listaRect.bottom) {
          // Elemento está abajo del área visible, hacer scroll hacia abajo
          // Calcular la posición para que el elemento quede visible en la parte inferior
          const scrollOffset = elementoSeleccionado.offsetTop - listaElement.offsetTop - (listaElement.clientHeight - elementoSeleccionado.clientHeight);
          listaElement.scrollTo({
            top: scrollOffset,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [transportistaSeleccionado]);

  // Auto-scroll para mantener visible el último producto agregado a la planilla
  useEffect(() => {
    // Solo hacer scroll si hay productos en la lista y no estamos en modo cantidad
    if (nuevaPlanilla.detalles.length > 0 && !modoCantidad) {
      // Solo hacer scroll si hay más de 3 productos (para evitar scroll en los primeros productos)
      if (nuevaPlanilla.detalles.length > 3) {
        // Delay más largo para asegurar que el DOM se haya actualizado completamente
        const timeoutId = setTimeout(() => {
          scrollToLastProduct();
        }, 200);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [nuevaPlanilla.detalles.length, modoCantidad]);

  const cargarProductos = async () => {
    try {
      setCargandoProductos(true);
      if (!datosUsuario?.empresaId) {
        console.error('No se encontró el ID de la empresa');
        toast.error('Error: No se encontró la información de la empresa');
        return;
      }
      
      const response = await ApiService.obtenerTodosLosProductos(datosUsuario.empresaId);
      setProductos(response.data || []);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error('Error al cargar los productos');
    } finally {
      setCargandoProductos(false);
    }
  };

  const cargarTransportistas = async () => {
    try {
      if (!datosUsuario?.empresaId) {
        console.error('No se encontró el ID de la empresa');
        return;
      }
      
      const response = await fetch(`${API_CONFIG.getBaseUrl()}/empresas/${datosUsuario.empresaId}/transportistas`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTransportistas(data.data || []);
      }
    } catch (error) {
      console.error('Error al cargar transportistas:', error);
    }
  };

  // Función para mostrar predicciones mientras escribes
  const mostrarPredicciones = () => {
    setProductoSeleccionado(-1);
  };

  // Manejar navegación por teclado en búsqueda
  const manejarTeclas = (e: React.KeyboardEvent) => {
    if (!mostrarProductos || productosFiltrados.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setProductoSeleccionado(prev => 
          prev < productosFiltrados.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setProductoSeleccionado(prev => 
          prev > 0 ? prev - 1 : productosFiltrados.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (productoSeleccionado >= 0 && productoSeleccionado < productosFiltrados.length) {
          seleccionarProducto(productosFiltrados[productoSeleccionado]);
        }
        break;
      case 'Escape':
        setMostrarProductos(false);
        setProductoSeleccionado(-1);
        break;
    }
  };

  // Manejar teclas en campo de código de planilla
  const manejarTeclasCodigoPlanilla = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      transporteRef.current?.focus();
    }
  };

  // Manejar teclas en campo de transporte
  const manejarTeclasTransporte = (e: React.KeyboardEvent) => {
    if (mostrarTransportistas && opcionesTransporte.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setTransportistaSeleccionado(prev => {
            const nuevoIndice = prev < opcionesTransporte.length - 1 ? prev + 1 : 0;
            // Scroll automático para mantener el elemento visible
            setTimeout(() => {
              scrollToSelectedItem(nuevoIndice);
            }, 10);
            return nuevoIndice;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setTransportistaSeleccionado(prev => {
            const nuevoIndice = prev > 0 ? prev - 1 : opcionesTransporte.length - 1;
            // Scroll automático para mantener el elemento visible
            setTimeout(() => {
              scrollToSelectedItem(nuevoIndice);
            }, 10);
            return nuevoIndice;
          });
          break;
        case 'Enter':
          e.preventDefault();
          if (transportistaSeleccionado >= 0 && transportistaSeleccionado < opcionesTransporte.length) {
            seleccionarTransportista(opcionesTransporte[transportistaSeleccionado]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setMostrarTransportistas(false);
          setTransportistaSeleccionado(-1);
          break;
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      observacionesRef.current?.focus();
    }
  };

  // Función para hacer scroll automático al elemento seleccionado
  const scrollToSelectedItem = (indice: number) => {
    if (!listaTransportistasRef.current) return;
    
    const container = listaTransportistasRef.current;
    const items = container.querySelectorAll('[data-transportista-index]');
    const selectedItem = items[indice] as HTMLElement;
    
    if (selectedItem) {
      // Calcular la posición del elemento dentro del contenedor
      const itemTop = selectedItem.offsetTop;
      const itemHeight = selectedItem.offsetHeight;
      const containerHeight = container.clientHeight;
      const currentScrollTop = container.scrollTop;
      
      // Verificar si el elemento está completamente visible
      const isFullyVisible = itemTop >= currentScrollTop && 
                            (itemTop + itemHeight) <= (currentScrollTop + containerHeight);
      
      if (!isFullyVisible) {
        // Calcular la nueva posición de scroll
        let newScrollTop;
        
        if (itemTop < currentScrollTop) {
          // El elemento está arriba, scroll hacia arriba
          newScrollTop = itemTop;
        } else {
          // El elemento está abajo, scroll hacia abajo
          newScrollTop = itemTop + itemHeight - containerHeight;
        }
        
        // Aplicar el scroll suave
        container.scrollTo({ 
          top: Math.max(0, newScrollTop), 
          behavior: 'smooth' 
        });
      }
    }
  };

  // Seleccionar transportista
  const seleccionarTransportista = (opcion: { transportista: Transportista; vehiculo?: Vehiculo; displayText: string }) => {
    setNuevaPlanilla(prev => ({
      ...prev,
      transporte: opcion.displayText
    }));
    
    setMostrarTransportistas(false);
    setTransportistaSeleccionado(-1);
    setInputBusquedaTransporte('');
    
    // Pasar al siguiente campo
    observacionesRef.current?.focus();
  };

  // Manejar teclas en campo de observaciones
  const manejarTeclasObservaciones = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Hacer scroll suave hacia la sección del buscador
      if (inputBusquedaRef.current) {
        const element = inputBusquedaRef.current;
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetPosition = scrollTop + rect.top - 170; // 170px de margen desde arriba
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        
        // Enfocar el campo después de un pequeño delay para que el scroll termine
        setTimeout(() => {
          inputBusquedaRef.current?.focus();
        }, 300);
      }
    }
  };

  // Manejar teclas en campo de cantidad
  const manejarTeclasCantidad = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        confirmarCantidad();
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation(); // Detener la propagación del evento
        cancelarCantidad();
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (productoParaCantidad) {
          const stockDisponible = obtenerStockDisponible(productoParaCantidad);
          setCantidadTemporal(prev => Math.min(prev + 1, stockDisponible));
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        setCantidadTemporal(prev => Math.max(prev - 1, 1));
        break;
    }
  };

  // Seleccionar producto y activar modo cantidad
  const seleccionarProducto = (producto: Producto) => {
    setProductoParaCantidad(producto);
    setCantidadTemporal(1);
    setModoCantidad(true);
    setMostrarProductos(false);
    setProductoSeleccionado(-1);
    setInputBusqueda('');
  };

  // Confirmar cantidad y agregar producto
  const confirmarCantidad = () => {
    if (!productoParaCantidad) return;

    // Determinar la cantidad final
    let cantidadFinal: number;
    
    // Si hay texto en el campo de cantidad, evaluar la expresión
    if (cantidadTemporalTexto.trim()) {
      // Verificar si la cantidad contiene operadores matemáticos
      const contieneOperadores = /[+\-*/x()]/.test(cantidadTemporalTexto);
      
      if (contieneOperadores) {
        // Evaluar la expresión matemática
        const evaluacion = evaluarExpresion(cantidadTemporalTexto);
        if (evaluacion.error) {
          toast.error(`Error en el cálculo: ${evaluacion.error}`);
          return;
        }
        cantidadFinal = evaluacion.resultado!;
      } else {
        // Si no contiene operadores, parsear como número normal
        cantidadFinal = parseInt(cantidadTemporalTexto);
        if (isNaN(cantidadFinal) || cantidadFinal <= 0) {
          toast.error('❌ La cantidad debe ser mayor a 0 para agregar el producto a la planilla');
          return;
        }
      }
    } else {
      // Usar la cantidad numérica si no hay texto
      cantidadFinal = cantidadTemporal;
      if (cantidadFinal <= 0) {
        toast.error('❌ La cantidad debe ser mayor a 0 para agregar el producto a la planilla');
        return;
      }
    }

    // Validar stock disponible
    const stockDisponible = obtenerStockDisponible(productoParaCantidad);
    
    if (cantidadFinal > stockDisponible) {
      toast.error(`Stock insuficiente. Disponible: ${stockDisponible} unidades`);
      return;
    }

    const detalle: DetallePlanillaPedido = {
      id: Date.now(),
      productoId: productoParaCantidad.id,
      numeroPersonalizado: productoParaCantidad.codigoPersonalizado || undefined,
      descripcion: productoParaCantidad.nombre,
      cantidad: cantidadFinal,
      observaciones: undefined,
      fechaCreacion: new Date().toISOString()
    };

    setNuevaPlanilla(prev => ({
      ...prev,
      detalles: [...prev.detalles, detalle]
    }));

    // Actualizar el último producto seleccionado con la cantidad agregada
    setUltimoProductoSeleccionado(productoParaCantidad);
    setUltimaCantidadAgregada(cantidadFinal);

    toast.success(`${productoParaCantidad.nombre} agregado (${cantidadFinal})`);
    
    // Resetear estado
    setModoCantidad(false);
    setProductoParaCantidad(null);
    setCantidadTemporal(1);
    setCantidadTemporalTexto('');
    setResultadoCalculoPlanilla(null);
    setErrorCalculoPlanilla(null);
    
    // Hacer scroll al último producto agregado solo si hay más de 3 productos
    if (nuevaPlanilla.detalles.length > 3) {
      setTimeout(() => {
        scrollToLastProduct();
      }, 100);
    }
    
    // Volver al campo de búsqueda con un delay mayor en móvil para asegurar que funcione correctamente
    const delay = isMobile ? 300 : 100;
    setTimeout(() => {
      if (inputBusquedaRef.current) {
        inputBusquedaRef.current.focus();
        // En móvil, también hacer scroll hacia el campo de búsqueda
        if (isMobile) {
          inputBusquedaRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }
    }, delay);
  };

  // Cancelar modo cantidad
  const cancelarCantidad = () => {
    setModoCantidad(false);
    setProductoParaCantidad(null);
    setCantidadTemporal(1);
    
    // Volver al campo de búsqueda con un delay mayor en móvil para asegurar que funcione correctamente
    const delay = isMobile ? 300 : 100;
    setTimeout(() => {
      if (inputBusquedaRef.current) {
        inputBusquedaRef.current.focus();
        // En móvil, también hacer scroll hacia el campo de búsqueda
        if (isMobile) {
          inputBusquedaRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }
    }, delay);
  };

  const crearPlanilla = async () => {
    try {
      if (!nuevaPlanilla.fechaPlanilla) {
        toast.error('La fecha de planilla es obligatoria');
        return;
      }

      if (!nuevaPlanilla.codigoPlanilla || nuevaPlanilla.codigoPlanilla.trim() === '') {
        toast.error('El código de planilla es obligatorio');
        return;
      }

      if (nuevaPlanilla.detalles.length === 0) {
        toast.error('Debe agregar al menos un producto');
        return;
      }

      // Verificar autenticación antes de crear la planilla
      console.log('🔍 Verificando autenticación antes de crear planilla...');
      try {
        const authStatus = await ApiService.debugAuthStatus();
        console.log('✅ Estado de autenticación:', authStatus);
      } catch (authError) {
        console.error('❌ Error de autenticación:', authError);
        toast.error('Error de autenticación. Por favor, inicie sesión nuevamente.');
        return;
      }

      // Obtener zona horaria del usuario
      const zonaHorariaUsuario = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Crear fecha local combinando la fecha seleccionada con la hora actual
      const fechaSeleccionada = new Date(nuevaPlanilla.fechaPlanilla + 'T00:00:00');
      const ahora = new Date();
      
      // Obtener la hora local del usuario
      const horaLocal = ahora.getHours();
      const minutosLocal = ahora.getMinutes();
      const segundosLocal = ahora.getSeconds();
      
      // Crear fecha local con la hora actual
      const fechaLocal = new Date(
        fechaSeleccionada.getFullYear(),
        fechaSeleccionada.getMonth(),
        fechaSeleccionada.getDate(),
        horaLocal,
        minutosLocal,
        segundosLocal
      );
      
      // Formatear como string local sin conversión UTC
      const fechaFormateada = fechaLocal.getFullYear() + '-' + 
        String(fechaLocal.getMonth() + 1).padStart(2, '0') + '-' + 
        String(fechaLocal.getDate()).padStart(2, '0') + 'T' + 
        String(fechaLocal.getHours()).padStart(2, '0') + ':' + 
        String(fechaLocal.getMinutes()).padStart(2, '0') + ':' + 
        String(fechaLocal.getSeconds()).padStart(2, '0');
      
      const planillaData = {
        fechaPlanilla: fechaFormateada,
        numeroPlanilla: nuevaPlanilla.codigoPlanilla,
        observaciones: nuevaPlanilla.observaciones,
        transporte: nuevaPlanilla.transporte,
        detalles: nuevaPlanilla.detalles,
        zonaHoraria: zonaHorariaUsuario
      };

      console.log('📋 [DEBUG] Fecha seleccionada:', nuevaPlanilla.fechaPlanilla);
      console.log('📋 [DEBUG] Hora local del usuario:', `${horaLocal}:${minutosLocal}:${segundosLocal}`);
      console.log('📋 [DEBUG] Fecha creada local:', fechaLocal.toString());
      console.log('📋 [DEBUG] Fecha formateada (local):', fechaFormateada);
      console.log('📋 [DEBUG] Zona horaria del usuario:', zonaHorariaUsuario);
      console.log('📋 [DEBUG] Fecha actual del sistema:', new Date().toISOString());
      console.log('📋 [DEBUG] Offset de zona horaria (minutos):', new Date().getTimezoneOffset());
      console.log('📋 [DEBUG] Fecha local getTime():', fechaLocal.getTime());
      console.log('📋 [DEBUG] Fecha local toISOString():', fechaLocal.toISOString());
      console.log('📋 [DEBUG] Fecha local toLocaleString():', fechaLocal.toLocaleString());
      console.log('📋 [DEBUG] Enviando planilla:', planillaData);
      
      await ApiService.crearPlanillaPedido(planillaData);
      toast.success('Planilla creada exitosamente');
      
      // Navegar de vuelta a la página de carga de pedidos
      navigate('/admin/carga-pedidos');
    } catch (error: any) {
      console.error('Error al crear planilla:', error);
      
      // Proporcionar información más específica sobre el error
      if (error.response?.status === 403) {
        toast.error('Error de autorización. Por favor, verifique que esté logueado con un rol de administrador.');
      } else if (error.response?.status === 400) {
        toast.error('Error en los datos enviados. Verifique la información de la planilla.');
      } else {
        toast.error('Error al crear la planilla. Por favor, intente nuevamente.');
      }
    }
  };

  const removerDetalle = (index: number) => {
    setNuevaPlanilla(prev => ({
      ...prev,
      detalles: prev.detalles.filter((_, i) => i !== index)
    }));
  };


  // Calcular total de unidades
  const totalUnidades = nuevaPlanilla.detalles.reduce((total, detalle) => total + detalle.cantidad, 0);

  // Función para calcular stock disponible de un producto (considerando lo ya agregado a la planilla)
  const obtenerStockDisponible = (producto: Producto): number => {
    const cantidadEnPlanilla = nuevaPlanilla.detalles
      .filter(detalle => detalle.productoId === producto.id)
      .reduce((total, detalle) => total + detalle.cantidad, 0);
    
    return producto.stock - cantidadEnPlanilla;
  };

  // Función para hacer scroll automático al último producto agregado
  const scrollToLastProduct = () => {
    if (listaProductosPlanillaRef.current && nuevaPlanilla.detalles.length > 0) {
      const container = listaProductosPlanillaRef.current;
      const lastProductIndex = nuevaPlanilla.detalles.length - 1;
      
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

  if (!datosUsuario) {
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
          <p style={{ color: '#6b7280', margin: 0 }}>
            {cargandoUsuario ? 'Cargando sesión...' : 'Preparando...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <NavbarAdmin
        onCerrarSesion={cerrarSesion}
        empresaNombre={datosUsuario?.empresaNombre}
        nombreAdministrador={datosUsuario?.nombre}
      />

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: `${isMobile ? '8rem' : '7rem'} ${isMobile ? '1rem' : '2rem'} ${isMobile ? '1rem' : '2rem'} ${isMobile ? '1rem' : '2rem'}`
      }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: isMobile ? '1.5rem' : '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                color: 'white'
              }}>
                📋
              </div>
              <div>
                <h1 style={{
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: 0
                }}>
                  Crear Nueva Planilla
                </h1>
                <p style={{
                  color: '#64748b',
                  margin: 0,
                  fontSize: '0.875rem'
                }}>
                  Agrega productos y configura tu planilla de pedidos
                </p>
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: '1rem',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <button
                onClick={() => navigate('/admin/carga-pedidos')}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ← Volver
              </button>
              <button
                onClick={crearPlanilla}
                disabled={nuevaPlanilla.detalles.length === 0}
                style={{
                  background: nuevaPlanilla.detalles.length === 0 
                    ? '#9ca3af' 
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: nuevaPlanilla.detalles.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                ✅ Crear Planilla
              </button>
            </div>
          </div>
        </div>

        {/* Formulario de Planilla - Header */}
        <div style={{ 
          marginBottom: '2rem',
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: '0.75rem',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
            gap: '1rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: isMobile ? '1rem' : '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: isMobile ? '0.75rem' : '0.5rem'
              }}>
                Fecha de Planilla *
              </label>
              <input
                type="date"
                value={nuevaPlanilla.fechaPlanilla}
                onChange={(e) => setNuevaPlanilla(prev => ({
                  ...prev,
                  fechaPlanilla: e.target.value
                }))}
                style={{
                  width: '100%',
                  padding: isMobile ? '1rem' : '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: isMobile ? '1rem' : '0.875rem',
                  minHeight: isMobile ? '48px' : 'auto'
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: isMobile ? '1rem' : '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: isMobile ? '0.75rem' : '0.5rem'
              }}>
                Código de Planilla (8 dígitos)
              </label>
              <input
                ref={codigoPlanillaRef}
                type="text"
                placeholder="12345678"
                maxLength={8}
                required
                value={nuevaPlanilla.codigoPlanilla}
                onChange={(e) => setNuevaPlanilla(prev => ({
                  ...prev,
                  codigoPlanilla: e.target.value.replace(/\D/g, '').slice(0, 8)
                }))}
                onKeyDown={manejarTeclasCodigoPlanilla}
                style={{
                  width: '100%',
                  padding: isMobile ? '1rem' : '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: isMobile ? '1rem' : '0.875rem',
                  minHeight: isMobile ? '48px' : 'auto'
                }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <label style={{
                display: 'block',
                fontSize: isMobile ? '1rem' : '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: isMobile ? '0.75rem' : '0.5rem'
              }}>
                Transporte
              </label>
              {nuevaPlanilla.transporte ? (
                <div style={{
                  width: '100%',
                  padding: isMobile ? '1rem' : '0.75rem',
                  border: '2px solid #10b981',
                  borderRadius: '0.5rem',
                  fontSize: isMobile ? '1rem' : '0.875rem',
                  backgroundColor: '#f0fdf4',
                  color: '#065f46',
                  fontWeight: '500',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  minHeight: isMobile ? '48px' : 'auto'
                }}>
                  <span>{nuevaPlanilla.transporte}</span>
                  <button
                    onClick={() => {
                      setNuevaPlanilla(prev => ({ ...prev, transporte: '' }));
                      setInputBusquedaTransporte('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      padding: '0.25rem'
                    }}
                    title="Limpiar transporte"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <input
                  ref={transporteRef}
                  type="text"
                  placeholder="Buscar transportista o vehículo..."
                  value={inputBusquedaTransporte}
                  onChange={(e) => setInputBusquedaTransporte(e.target.value)}
                  onKeyDown={manejarTeclasTransporte}
                  style={{
                    width: '100%',
                    padding: isMobile ? '1rem' : '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    minHeight: isMobile ? '48px' : 'auto'
                  }}
                />
              )}
              {mostrarTransportistas && transportistasFiltrados.length > 0 && (
                <div
                  ref={listaTransportistasRef}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderTop: 'none',
                    borderRadius: '0 0 0.5rem 0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    zIndex: 1000,
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                  {opcionesTransporte.map((opcion, index) => (
                    <div
                      key={opcion.key}
                      data-transportista-index={index}
                      onClick={() => seleccionarTransportista(opcion)}
                      style={{
                        padding: isMobile ? '1rem' : '0.75rem',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '0.75rem' : '0.5rem',
                        backgroundColor: index === transportistaSeleccionado ? '#eff6ff' : 'transparent',
                        borderLeft: index === transportistaSeleccionado ? '3px solid #3b82f6' : 'none',
                        minHeight: isMobile ? '60px' : 'auto'
                      }}
                      onMouseEnter={() => setTransportistaSeleccionado(index)}
                    >
                      <span style={{ fontSize: isMobile ? '1.25rem' : '0.875rem', color: '#6b7280' }}>🚛</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', fontSize: isMobile ? '1rem' : '0.875rem', lineHeight: '1.3' }}>
                          {opcion.displayText}
                        </div>
                        {opcion.transportista.nombreEmpresa && (
                          <div style={{ fontSize: isMobile ? '0.875rem' : '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                            {opcion.transportista.nombreEmpresa}
                          </div>
                        )}
                        {opcion.vehiculo && (
                          <div style={{ fontSize: isMobile ? '0.875rem' : '0.75rem', color: '#059669', fontWeight: '500', marginTop: '0.25rem' }}>
                            🚗 Patente: {opcion.vehiculo.patente}
                          </div>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: isMobile ? '1rem' : '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: isMobile ? '0.75rem' : '0.5rem'
              }}>
                Observaciones
              </label>
              <input
                ref={observacionesRef}
                type="text"
                placeholder="Observaciones opcionales..."
                value={nuevaPlanilla.observaciones}
                onChange={(e) => setNuevaPlanilla(prev => ({
                  ...prev,
                  observaciones: e.target.value
                }))}
                onKeyDown={manejarTeclasObservaciones}
                style={{
                  width: '100%',
                  padding: isMobile ? '1rem' : '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: isMobile ? '1rem' : '0.875rem',
                  minHeight: isMobile ? '48px' : 'auto'
                }}
              />
            </div>
          </div>
        </div>

        {/* Contenido Principal - Layout de 3 columnas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '350px 1fr 250px',
          gap: '2rem',
          minHeight: '600px'
        }}>
          
          {/* Columna Izquierda - Buscador */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            border: '1px solid #e2e8f0',
            height: 'fit-content',
            position: 'sticky',
            top: '2rem'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '1rem'
            }}>
              🔍 Buscar Productos
            </h3>
            {cargandoProductos && (
              <p style={{
                fontSize: '0.8125rem',
                color: '#64748b',
                margin: '0 0 0.75rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span
                  style={{
                    width: '0.875rem',
                    height: '0.875rem',
                    border: '2px solid #e2e8f0',
                    borderTopColor: '#3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    flexShrink: 0
                  }}
                  aria-hidden
                />
                Cargando catálogo de productos…
              </p>
            )}
            
            {/* Campo de búsqueda y cantidad */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '0.5rem',
                alignItems: 'end'
              }}>
                {!modoCantidad && (
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={inputBusquedaRef}
                      type="text"
                      placeholder={cargandoProductos ? 'Esperando productos…' : 'Nombre, código o barras...'}
                      value={inputBusqueda}
                      disabled={cargandoProductos}
                      aria-busy={cargandoProductos}
                      onChange={(e) => {
                        setInputBusqueda(e.target.value);
                        mostrarPredicciones();
                      }}
                      onKeyDown={manejarTeclas}
                      style={{
                        width: '100%',
                        padding: isMobile ? '1rem' : '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        fontSize: isMobile ? '1rem' : '0.875rem',
                        background: cargandoProductos ? '#f1f5f9' : 'white',
                        color: '#1e293b',
                        opacity: cargandoProductos ? 0.85 : 1,
                        cursor: cargandoProductos ? 'wait' : 'text',
                      minHeight: isMobile ? '48px' : 'auto'
                    }}
                  />
                  
                  {/* Lista de productos filtrados */}
                  {mostrarProductos && productosFiltrados.length > 0 && (
                    <div
                      ref={listaProductosRef}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        maxHeight: '320px',
                        overflow: 'auto',
                        paddingTop: '0.5rem',
                        paddingBottom: '0.5rem'
                      }}
                    >
                      {productosFiltrados.map((producto, index) => {
                        const stockDisponible = obtenerStockDisponible(producto);
                        return (
                        <div
                          key={producto.id}
                          onClick={() => stockDisponible > 0 ? seleccionarProducto(producto) : null}
                          style={{
                            padding: isMobile ? '0.75rem' : '0.5rem',
                            cursor: stockDisponible > 0 ? 'pointer' : 'not-allowed',
                            borderBottom: index < productosFiltrados.length - 1 ? '1px solid #f1f5f9' : 'none',
                            background: index === productoSeleccionado ? '#3b82f6' : stockDisponible > 0 ? 'white' : '#f3f4f6',
                            color: index === productoSeleccionado ? 'white' : stockDisponible > 0 ? '#1e293b' : '#9ca3af',
                            display: 'flex',
                            alignItems: 'center',
                            gap: isMobile ? '1rem' : '0.75rem',
                            borderRadius: index === productoSeleccionado ? '0.375rem' : '0',
                            boxShadow: index === productoSeleccionado ? '0 2px 4px rgba(59, 130, 246, 0.3)' : 'none',
                            opacity: stockDisponible > 0 ? 1 : 0.6,
                            minHeight: isMobile ? '60px' : 'auto'
                          }}
                          onMouseEnter={() => stockDisponible > 0 ? setProductoSeleccionado(index) : null}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontWeight: '600',
                              color: index === productoSeleccionado ? 'white' : '#1e293b',
                              fontSize: isMobile ? '0.95rem' : '0.8rem',
                              lineHeight: '1.3'
                            }}>
                              {producto.codigoPersonalizado ? (
                                <>
                                  <span style={{ 
                                    color: index === productoSeleccionado ? '#bfdbfe' : '#3b82f6', 
                                    fontWeight: '700' 
                                  }}>
                                    {producto.codigoPersonalizado}
                                  </span>
                                  <br />
                                  {producto.nombre}
                                </>
                              ) : (
                                producto.nombre
                              )}
                            </div>
                            <div style={{
                              color: index === productoSeleccionado ? '#e2e8f0' : '#64748b',
                              fontSize: isMobile ? '0.8rem' : '0.7rem',
                              marginTop: '0.25rem'
                            }}>
                              Stock disponible: {obtenerStockDisponible(producto)}
                            </div>
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  )}
                </div>
                )}

                {/* Campo de cantidad */}
                {modoCantidad && (
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={inputCantidadRef}
                      type="text"
                      placeholder="Cantidad o cálculo..."
                      value={cantidadTemporalTexto || cantidadTemporal || ''}
                      onChange={(e) => {
                        const valor = e.target.value;
                        setCantidadTemporalTexto(valor);
                        // También actualizar el valor numérico si es un número simple
                        const numero = parseInt(valor);
                        if (!isNaN(numero) && !/[+\-*/x()]/.test(valor)) {
                          setCantidadTemporal(numero);
                        } else if (valor === '') {
                          setCantidadTemporal(0);
                        }
                      }}
                      onKeyDown={manejarTeclasCantidad}
                      style={{
                        width: '100%',
                        padding: isMobile ? '1rem' : '0.75rem',
                        border: '2px solid #3b82f6',
                        borderRadius: '0.5rem',
                        fontSize: isMobile ? '1.125rem' : '0.875rem',
                        textAlign: 'center',
                        fontWeight: '600',
                        background: 'white',
                        minHeight: isMobile ? '48px' : 'auto'
                      }}
                    />
                    
                    {/* Mostrar resultado del cálculo en tiempo real */}
                    {resultadoCalculoPlanilla !== null && (
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
                        ✅ Resultado: {resultadoCalculoPlanilla.toLocaleString()} unidades
                      </div>
                    )}
                    
                    {errorCalculoPlanilla && (
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
                        ❌ {errorCalculoPlanilla}
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
                  )}
              </div>

              {/* Información del producto seleccionado */}
              {modoCantidad && productoParaCantidad && (
                <div 
                  onClick={isMobile ? confirmarCantidad : undefined}
                  style={{
                    background: isMobile ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'white',
                    borderRadius: '0.5rem',
                    padding: isMobile ? '1rem' : '0.75rem',
                    border: isMobile ? 'none' : '2px solid #3b82f6',
                    marginTop: '0.5rem',
                    fontSize: isMobile ? '0.875rem' : '0.75rem',
                    cursor: isMobile ? 'pointer' : 'default',
                    color: isMobile ? 'white' : '#374151',
                    boxShadow: isMobile ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                    transition: isMobile ? 'all 0.3s ease' : 'none'
                  }}
                  onMouseEnter={isMobile ? (e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                  } : undefined}
                  onMouseLeave={isMobile ? (e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                  } : undefined}
                >
                  <div style={{ marginBottom: isMobile ? '0.5rem' : '0.25rem' }}>
                    <strong>Producto:</strong> {productoParaCantidad.nombre}
                  </div>
                  <div style={{ marginBottom: isMobile ? '0.5rem' : '0.25rem' }}>
                    <strong>Stock disponible:</strong> {obtenerStockDisponible(productoParaCantidad)}
                  </div>
                  <div style={{ 
                    fontWeight: '600', 
                    fontSize: isMobile ? '0.9rem' : '0.75rem',
                    textAlign: isMobile ? 'center' : 'left',
                    marginTop: isMobile ? '0.5rem' : '0',
                    padding: isMobile ? '0.5rem' : '0',
                    background: isMobile ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                    borderRadius: isMobile ? '0.25rem' : '0',
                    color: '#374151'
                  }}>
                    {isMobile ? '👆 TOCA PARA AGREGAR' : '💡 Enter para agregar • Escape para cancelar • ↑↓ para cambiar cantidad'}
                  </div>
                </div>
              )}
            </div>

            {/* Último producto seleccionado */}
            {ultimoProductoSeleccionado && !modoCantidad && (
              <div style={{
                background: 'white',
                borderRadius: '0.5rem',
                padding: isMobile ? '1.25rem' : '1rem',
                border: '2px solid #3b82f6',
                marginTop: '1rem'
              }}>
                <h4 style={{
                  fontSize: isMobile ? '1rem' : '0.875rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 0.75rem 0'
                }}>
                  📦 Último Producto
                </h4>
                <div style={{
                  fontSize: isMobile ? '0.875rem' : '0.75rem',
                  color: '#374151'
                }}>
                  {ultimoProductoSeleccionado.codigoPersonalizado && (
                    <div style={{ marginBottom: isMobile ? '0.5rem' : '0.25rem' }}>
                      <strong>Código:</strong> {ultimoProductoSeleccionado.codigoPersonalizado}
                    </div>
                  )}
                  <div style={{ marginBottom: isMobile ? '0.5rem' : '0.25rem' }}>
                    <strong>Nombre:</strong> {ultimoProductoSeleccionado.nombre}
                  </div>
                  <div style={{ marginBottom: isMobile ? '0.5rem' : '0.25rem' }}>
                    <strong>Stock disponible:</strong> {obtenerStockDisponible(ultimoProductoSeleccionado)}
                  </div>
                  <div style={{
                    color: '#3b82f6',
                    fontWeight: '600',
                    fontSize: isMobile ? '1rem' : '0.875rem'
                  }}>
                    <strong>Cantidad agregada:</strong> {ultimaCantidadAgregada}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Columna Central - Lista de Productos */}
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#1e293b',
                margin: 0
              }}>
                📋 Productos de la Planilla ({nuevaPlanilla.detalles.length})
              </h3>
            </div>
            
            <div ref={listaProductosPlanillaRef} style={{ 
              height: '400px',
              overflowY: 'auto',
              overflowX: 'hidden'
            }}>
              {nuevaPlanilla.detalles.length === 0 ? (
                <div style={{
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  color: '#64748b'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                  <p>No hay productos agregados</p>
                  <p style={{ fontSize: '0.875rem' }}>Busca y agrega productos desde el panel izquierdo</p>
                </div>
              ) : (
                <div>
                  {nuevaPlanilla.detalles.map((detalle, index) => (
                    <div
                      key={index}
                      data-product-index={index}
                      style={{
                        padding: isMobile ? '1rem' : '0.75rem 1rem',
                        borderBottom: index < nuevaPlanilla.detalles.length - 1 ? '1px solid #f1f5f9' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '1rem' : '0.75rem',
                        minHeight: isMobile ? '70px' : 'auto'
                      }}
                    >
                      {/* Número */}
                      <div style={{
                        background: '#3b82f6',
                        color: 'white',
                        borderRadius: '50%',
                        width: isMobile ? '2rem' : '1.5rem',
                        height: isMobile ? '2rem' : '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isMobile ? '0.875rem' : '0.75rem',
                        fontWeight: '600',
                        flexShrink: 0
                      }}>
                        {index + 1}
                      </div>

                      {/* Información del producto */}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: '600',
                          color: '#1e293b',
                          fontSize: isMobile ? '1rem' : '0.875rem',
                          marginBottom: isMobile ? '0.25rem' : '0.125rem',
                          lineHeight: '1.3'
                        }}>
                          {detalle.numeroPersonalizado ? (
                            <>
                              <span style={{ color: '#3b82f6', fontWeight: '700' }}>
                                {detalle.numeroPersonalizado}
                              </span>
                              <br />
                              {detalle.descripcion}
                            </>
                          ) : (
                            detalle.descripcion
                          )}
                        </div>
                      </div>

                      {/* Cantidad y Botón eliminar en la misma línea */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '0.75rem' : '0.5rem',
                        flexShrink: 0
                      }}>
                        <input
                          type="text"
                          value={detalle.cantidad}
                          onChange={(e) => {
                            const valor = e.target.value;
                            if (valor === '' || /^\d+$/.test(valor)) {
                              const nuevaCantidad = valor === '' ? 0 : parseInt(valor);
                              setNuevaPlanilla(prev => ({
                                ...prev,
                                detalles: prev.detalles.map((d, i) => 
                                  i === index ? { ...d, cantidad: nuevaCantidad } : d
                                )
                              }));
                            }
                          }}
                          style={{
                            width: isMobile ? '80px' : '60px',
                            padding: isMobile ? '0.5rem' : '0.25rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.25rem',
                            fontSize: isMobile ? '1rem' : '0.8rem',
                            textAlign: 'center',
                            background: '#f8fafc',
                            color: '#1e293b',
                            fontWeight: '500',
                            minHeight: isMobile ? '2rem' : '1.5rem'
                          }}
                        />
                        <button
                          onClick={() => removerDetalle(index)}
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            padding: isMobile ? '0.5rem' : '0.375rem',
                            fontSize: isMobile ? '0.875rem' : '0.7rem',
                            cursor: 'pointer',
                            flexShrink: 0,
                            minHeight: isMobile ? '2rem' : 'auto',
                            minWidth: isMobile ? '2rem' : 'auto'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha - Resumen */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            border: '1px solid #e2e8f0',
            height: 'fit-content',
            position: 'sticky',
            top: '2rem'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '1rem'
            }}>
              📊 Resumen
            </h3>
            
            <div style={{
              background: 'white',
              borderRadius: '0.5rem',
              padding: '1rem',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Productos:</span>
                <span style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                  {nuevaPlanilla.detalles.length}
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Unidades:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#3b82f6' }}>
                  {totalUnidades}
                </span>
              </div>
              
              <div style={{
                paddingTop: '1rem',
                borderTop: '1px solid #e2e8f0'
              }}>
                <button
                  onClick={crearPlanilla}
                  disabled={nuevaPlanilla.detalles.length === 0}
                  style={{
                    width: '100%',
                    background: nuevaPlanilla.detalles.length === 0 
                      ? '#9ca3af' 
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: nuevaPlanilla.detalles.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ✅ Crear Planilla
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
