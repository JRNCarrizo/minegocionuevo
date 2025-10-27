import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
import { obtenerFechaActual } from '../../utils/dateUtils';
import BarcodeScanner from '../../components/BarcodeScanner';

interface DetallePlanillaPedido {
  id: number;
  productoId?: number;
  codigoPersonalizado?: string;
  descripcion: string;
  cantidad: number;
  observaciones?: string;
  estadoProducto: string;
  fechaCreacion: string;
}

interface Producto {
  id: number;
  nombre: string;
  marca?: string;
  codigoBarras?: string;
  codigoPersonalizado?: string;
  stock: number;
  precio: number;
  activo: boolean;
}

export default function CrearDevolucion() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  
  const [numeroPlanilla, setNumeroPlanilla] = useState('');
  const [fechaPlanilla, setFechaPlanilla] = useState(obtenerFechaActual());
  const [observaciones, setObservaciones] = useState('');
  const [detalles, setDetalles] = useState<DetallePlanillaPedido[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([]);
  const [mostrarProductos, setMostrarProductos] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(-1);
  const [inputBusqueda, setInputBusqueda] = useState('');
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarCampoCantidad, setMostrarCampoCantidad] = useState(false);
  const [mostrarSelectorEstado, setMostrarSelectorEstado] = useState(false);
  const [cantidadTemporal, setCantidadTemporal] = useState(0);
  const [cantidadTemporalTexto, setCantidadTemporalTexto] = useState<string>('');
  const [resultadoCalculoRetorno, setResultadoCalculoRetorno] = useState<number | null>(null);
  const [errorCalculoRetorno, setErrorCalculoRetorno] = useState<string | null>(null);
  const [estadoTemporal, setEstadoTemporal] = useState('BUEN_ESTADO');
  const [productoSeleccionadoTemporal, setProductoSeleccionadoTemporal] = useState<Producto | null>(null);
  

  
  // Estados para el estado del producto
  const [estadosProducto] = useState([
    { value: 'BUEN_ESTADO', label: 'Buen Estado', color: '#10b981' },
    { value: 'ROTO', label: 'Roto', color: '#ef4444' },
    { value: 'MAL_ESTADO', label: 'Mal Estado', color: '#f59e0b' },
    { value: 'DEFECTUOSO', label: 'Defectuoso', color: '#dc2626' }
  ]);
  

  const inputBusquedaRef = useRef<HTMLInputElement>(null);
  const numeroPlanillaRef = useRef<HTMLInputElement>(null);
  const fechaPlanillaRef = useRef<HTMLInputElement>(null);
  const observacionesRef = useRef<HTMLTextAreaElement>(null);
  const cantidadTemporalRef = useRef<HTMLInputElement>(null);
  const estadoTemporalRef = useRef<HTMLSelectElement>(null);
  const listaProductosRef = useRef<HTMLDivElement>(null);
  const listaTransportistasRef = useRef<HTMLDivElement>(null);
  const listaProductosDevolucionRef = useRef<HTMLDivElement>(null);

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

  // Estados para transportista
  const [transporte, setTransporte] = useState('');
  const [transportistas, setTransportistas] = useState<any[]>([]);
  const [mostrarTransportistas, setMostrarTransportistas] = useState(false);
  const [transportistaSeleccionado, setTransportistaSeleccionado] = useState(-1);
  const [inputBusquedaTransporte, setInputBusquedaTransporte] = useState('');
  const [opcionesTransporte, setOpcionesTransporte] = useState<Array<{
    transportista: any;
    vehiculo?: any;
    displayText: string;
    key: string;
  }>>([]);

  // Cargar transportistas
  const cargarTransportistas = async () => {
    if (!datosUsuario?.empresaId) return;
    
    try {
      const response = await ApiService.obtenerTransportistas(datosUsuario.empresaId);
      if (response.data) {
        setTransportistas(response.data || []);
        console.log('✅ Transportistas cargados en CrearDevolucion:', response.data);
      }
    } catch (error) {
      console.error('Error al cargar transportistas:', error);
    }
  };

  // Función para seleccionar transportista
  const seleccionarTransportista = (opcion: { transportista: any; vehiculo?: any; displayText: string }) => {
    setTransporte(opcion.displayText);
    setInputBusquedaTransporte('');
    setMostrarTransportistas(false);
    setTransportistaSeleccionado(-1);
    
    // Pasar al siguiente campo
    observacionesRef.current?.focus();
  };

  // Función para manejar teclas en el buscador de transportista
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
          } else if (transporte) {
            // Si ya hay un transportista seleccionado, pasar al siguiente campo
            observacionesRef.current?.focus();
          }
          break;
        case 'Escape':
          e.preventDefault();
          setMostrarTransportistas(false);
          setTransportistaSeleccionado(-1);
          break;
      }
    } else if (e.key === 'Enter') {
      // Si no hay opciones de transportista mostradas, pasar al siguiente campo
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

  // Cargar transportistas al montar el componente
  useEffect(() => {
    if (datosUsuario?.empresaId) {
      cargarTransportistas();
    }
  }, [datosUsuario?.empresaId]);

  // Filtrar transportistas cuando cambia la búsqueda
  useEffect(() => {
    if (!inputBusquedaTransporte.trim()) {
      setOpcionesTransporte([]);
      setMostrarTransportistas(false);
      return;
    }

    const busqueda = inputBusquedaTransporte.toLowerCase().trim();
    
    // Crear opciones individuales para cada transportista-vehículo
    const opciones: Array<{
      transportista: any;
      vehiculo?: any;
      displayText: string;
      key: string;
    }> = [];

    transportistas.forEach(transportista => {
      if (!transportista.activo) return;
      
      const vehiculosActivos = transportista.vehiculos.filter((v: any) => v.activo);
      
      // Verificar si la búsqueda coincide con código interno o nombre del transportista
      const matchCodigo = transportista.codigoInterno.toLowerCase().includes(busqueda);
      const matchNombre = transportista.nombreApellido.toLowerCase().includes(busqueda);
      
      // Si coincide con transportista, mostrar todos sus vehículos
      if (matchCodigo || matchNombre) {
        // Solo mostrar transportistas que tienen vehículos activos
        if (vehiculosActivos.length > 0) {
          // Crear una opción por cada vehículo activo del transportista
          vehiculosActivos.forEach((vehiculo: any) => {
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
        vehiculosActivos.forEach((vehiculo: any) => {
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
    setMostrarTransportistas(opciones.length > 0);
  }, [inputBusquedaTransporte, transportistas]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    if (datosUsuario) {
      cargarProductos();
      // Solo inicializar si no hay datos de la planilla
      if (!numeroPlanilla && detalles.length === 0) {
        inicializarPlanilla();
      }
    }
  }, [navigate, datosUsuario]);

  // Manejar teclas globales para guardar con Ctrl+S
  const manejarTeclasGlobales = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      guardarPlanilla();
    }
  };

  // Agregar y remover event listener para teclas globales
  useEffect(() => {
    document.addEventListener('keydown', manejarTeclasGlobales);
    return () => {
      document.removeEventListener('keydown', manejarTeclasGlobales);
    };
  }, [detalles, numeroPlanilla, fechaPlanilla, observaciones]);

  // Manejar tecla Escape para volver a la vista principal
  useEffect(() => {
    const manejarEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/admin/descarga-devoluciones');
      }
    };

    document.addEventListener('keydown', manejarEscape);
    return () => {
      document.removeEventListener('keydown', manejarEscape);
    };
  }, [navigate]);

  const inicializarPlanilla = () => {
    // No establecer número de planilla predeterminado
    setNumeroPlanilla('');
  };

  const cargarProductos = async () => {
    try {
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
    }
  };


  // Efecto para filtrar productos (priorizando código personalizado primero)
  useEffect(() => {
    if (inputBusqueda.trim()) {
      const filtrados = productos.filter(producto => {
        const matchCodigo = producto.codigoPersonalizado && producto.codigoPersonalizado.toLowerCase().includes(inputBusqueda.toLowerCase());
        const matchBarras = producto.codigoBarras && producto.codigoBarras.includes(inputBusqueda);
        const matchNombre = producto.nombre.toLowerCase().includes(inputBusqueda.toLowerCase());
        
        return matchCodigo || matchBarras || matchNombre;
      });
      
      // Ordenar resultados: primero códigos personalizados, luego códigos de barras, luego nombres
      const productosOrdenados = filtrados.sort((a, b) => {
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

  // Resetear selección cuando se cierra la lista
  useEffect(() => {
    if (!mostrarProductos) {
      setProductoSeleccionado(-1);
    }
  }, [mostrarProductos]);

  // Efecto para enfocar el campo de cantidad cuando se activa
  useEffect(() => {
    if (mostrarCampoCantidad && cantidadTemporalRef.current) {
      cantidadTemporalRef.current.focus();
      cantidadTemporalRef.current.select();
    }
  }, [mostrarCampoCantidad]);

  // Calcular resultado en tiempo real cuando se escribe en el campo de cantidad
  useEffect(() => {
    if (!cantidadTemporalTexto.trim()) {
      setResultadoCalculoRetorno(null);
      setErrorCalculoRetorno(null);
      return;
    }

    // Verificar si la cantidad contiene operadores matemáticos
    const contieneOperadores = /[+\-*/x()]/.test(cantidadTemporalTexto);
    
    if (contieneOperadores) {
      const evaluacion = evaluarExpresion(cantidadTemporalTexto);
      if (evaluacion.error) {
        setResultadoCalculoRetorno(null);
        setErrorCalculoRetorno(evaluacion.error);
      } else {
        setResultadoCalculoRetorno(evaluacion.resultado);
        setErrorCalculoRetorno(null);
      }
    } else {
      // Si no contiene operadores, limpiar el resultado
      setResultadoCalculoRetorno(null);
      setErrorCalculoRetorno(null);
    }
  }, [cantidadTemporalTexto]);

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

  // Efecto para enfocar el selector de estado cuando se activa
  useEffect(() => {
    if (mostrarSelectorEstado && estadoTemporalRef.current) {
      estadoTemporalRef.current.focus();
    }
  }, [mostrarSelectorEstado]);

  // Efecto para enfocar el campo de número de planilla cuando se abre la página
  useEffect(() => {
    if (datosUsuario && numeroPlanillaRef.current) {
      setTimeout(() => {
        numeroPlanillaRef.current?.focus();
      }, 200);
    }
  }, [datosUsuario]);

  // Auto-scroll para mantener visible el último producto agregado a la devolución
  useEffect(() => {
    // Solo hacer scroll si hay productos en la lista y no estamos en modo cantidad
    if (detalles.length > 0 && !mostrarCampoCantidad) {
      // Solo hacer scroll si hay más de 3 productos (para evitar scroll en los primeros productos)
      if (detalles.length > 3) {
        // Delay para asegurar que el DOM se haya actualizado completamente
        const timeoutId = setTimeout(() => {
          scrollToLastProduct();
        }, 200);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [detalles.length, mostrarCampoCantidad]);

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

  // Manejar teclas en campo de cantidad
  const manejarTeclasCantidad = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        activarSelectorEstado();
        break;
      case 'Escape':
        cancelarCantidad();
        break;
      case 'ArrowUp':
        e.preventDefault();
        setCantidadTemporal(prev => prev + 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setCantidadTemporal(prev => Math.max(prev - 1, 1));
        break;
    }
  };

  const seleccionarProducto = (producto: Producto) => {
    setProductoSeleccionadoTemporal(producto);
    setCantidadTemporal(1);
    setCantidadTemporalTexto('1');
    setResultadoCalculoRetorno(null);
    setErrorCalculoRetorno(null);
    setEstadoTemporal('BUEN_ESTADO');
    setMostrarCampoCantidad(true);
    setMostrarProductos(false);
    setProductoSeleccionado(-1);
    setInputBusqueda('');
  };

  // Función confirmarCantidad ya no se usa, reemplazada por el nuevo flujo
  // const confirmarCantidad = () => { ... }

  const activarSelectorEstado = () => {
    if (!productoSeleccionadoTemporal) {
      toast.error('Por favor seleccione un producto');
      return;
    }

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
          toast.error('Por favor ingrese una cantidad válida');
          return;
        }
      }
    } else {
      // Usar la cantidad numérica si no hay texto
      cantidadFinal = cantidadTemporal;
      if (cantidadFinal <= 0) {
        toast.error('Por favor ingrese una cantidad válida');
        return;
      }
    }

    setCantidadTemporal(cantidadFinal);
    setMostrarCampoCantidad(false);
    setMostrarSelectorEstado(true);
  };

  const cancelarCantidad = () => {
    setMostrarCampoCantidad(false);
    setMostrarSelectorEstado(false);
    setProductoSeleccionadoTemporal(null);
    setCantidadTemporal(1);
    setCantidadTemporalTexto('');
    setResultadoCalculoRetorno(null);
    setErrorCalculoRetorno(null);
    setEstadoTemporal('BUEN_ESTADO');
    
    // Volver al campo de búsqueda
    setTimeout(() => {
      inputBusquedaRef.current?.focus();
    }, 100);
  };

  // Manejar teclas en selector de estado
  const manejarTeclasEstado = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        confirmarProducto();
        break;
      case 'Escape':
        e.preventDefault();
        cancelarCantidad();
        break;
      case 'ArrowUp':
        e.preventDefault();
        const currentIndexUp = estadosProducto.findIndex(estado => estado.value === estadoTemporal);
        const prevIndex = currentIndexUp > 0 ? currentIndexUp - 1 : estadosProducto.length - 1;
        setEstadoTemporal(estadosProducto[prevIndex].value);
        break;
      case 'ArrowDown':
        e.preventDefault();
        const currentIndexDown = estadosProducto.findIndex(estado => estado.value === estadoTemporal);
        const nextIndex = (currentIndexDown + 1) % estadosProducto.length;
        setEstadoTemporal(estadosProducto[nextIndex].value);
        break;
    }
  };

  const confirmarProducto = () => {
    if (!productoSeleccionadoTemporal || cantidadTemporal <= 0) {
      toast.error('Por favor ingrese una cantidad válida');
      return;
    }

    // Siempre agregar como nueva línea (cada producto + estado es único)
    const nuevoDetalle: DetallePlanillaPedido = {
      id: Date.now(), // ID temporal
      productoId: productoSeleccionadoTemporal.id,
      codigoPersonalizado: productoSeleccionadoTemporal.codigoPersonalizado,
      descripcion: productoSeleccionadoTemporal.nombre,
      cantidad: cantidadTemporal,
      estadoProducto: estadoTemporal,
      fechaCreacion: new Date().toISOString()
    };
    
    setDetalles(prev => [...prev, nuevoDetalle]);
    toast.success(`${productoSeleccionadoTemporal.nombre} agregado (${cantidadTemporal} unidades - ${estadoTemporal})`);

    // Hacer scroll al último producto agregado solo si hay más de 3 productos
    if (detalles.length > 3) {
      setTimeout(() => {
        scrollToLastProduct();
      }, 100);
    }

    // Resetear estado
    setMostrarCampoCantidad(false);
    setMostrarSelectorEstado(false);
    setProductoSeleccionadoTemporal(null);
    setCantidadTemporal(1);
    setCantidadTemporalTexto('');
    setResultadoCalculoRetorno(null);
    setErrorCalculoRetorno(null);
    setEstadoTemporal('BUEN_ESTADO');
    
    // Volver al campo de búsqueda
    setTimeout(() => {
      inputBusquedaRef.current?.focus();
    }, 100);
  };

  const removerDetalle = (index: number) => {
    setDetalles(prev => prev.filter((_, i) => i !== index));
  };

  // Función para hacer scroll automático al último producto agregado a la devolución
  const scrollToLastProduct = () => {
    if (listaProductosDevolucionRef.current && detalles.length > 0) {
      const container = listaProductosDevolucionRef.current;
      const lastProductIndex = detalles.length - 1;
      
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

  const actualizarCantidad = (index: number, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      removerDetalle(index);
      return;
    }
    
    setDetalles(prev => prev.map((detalle, i) => 
      i === index ? { ...detalle, cantidad: nuevaCantidad } : detalle
    ));
  };


  const actualizarEstadoProducto = (index: number, estadoProducto: string) => {
    setDetalles(prev => prev.map((detalle, i) => 
      i === index ? { ...detalle, estadoProducto } : detalle
    ));
  };

  const guardarPlanilla = async () => {
    if (!fechaPlanilla) {
      toast.error('Por favor seleccione la fecha de la planilla');
      fechaPlanillaRef.current?.focus();
      return;
    }

    if (detalles.length === 0) {
      toast.error('Por favor agregue al menos un producto a la planilla');
      inputBusquedaRef.current?.focus();
      return;
    }

    try {
      setGuardando(true);
      
      // Obtener la zona horaria del usuario
      const zonaHorariaUsuario = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('🌍 Zona horaria del usuario:', zonaHorariaUsuario);
      
      // Crear fecha con hora local del usuario
      const fechaSeleccionada = new Date(fechaPlanilla + 'T00:00:00');
      const ahora = new Date();
      
      // Obtener la hora local del usuario
      const horaLocal = ahora.getHours();
      const minutosLocal = ahora.getMinutes();
      const segundosLocal = ahora.getSeconds();
      
      // Crear fecha en la zona horaria local del usuario
      const fechaLocal = new Date(
        fechaSeleccionada.getFullYear(),
        fechaSeleccionada.getMonth(),
        fechaSeleccionada.getDate(),
        horaLocal,
        minutosLocal,
        segundosLocal
      );
      
      // Formatear como string local sin conversión UTC (incluyendo segundos)
      const fechaFormateada = fechaLocal.getFullYear() + '-' + 
        String(fechaLocal.getMonth() + 1).padStart(2, '0') + '-' + 
        String(fechaLocal.getDate()).padStart(2, '0') + 'T' + 
        String(fechaLocal.getHours()).padStart(2, '0') + ':' + 
        String(fechaLocal.getMinutes()).padStart(2, '0') + ':' + 
        String(fechaLocal.getSeconds()).padStart(2, '0');
      
      const planillaData = {
         numeroPlanilla: numeroPlanilla.trim() || null,
        fechaPlanilla: fechaFormateada,
         observaciones: observaciones.trim() || null,
         transporte: transporte.trim() || null,
         zonaHoraria: zonaHorariaUsuario,
         detalles: detalles.map(detalle => ({
           productoId: detalle.productoId,
           numeroPersonalizado: detalle.codigoPersonalizado,
           descripcion: detalle.descripcion,
           cantidad: detalle.cantidad,
           observaciones: detalle.observaciones,
           estadoProducto: detalle.estadoProducto
         }))
       };

      console.log('📋 [DEBUG] Fecha seleccionada:', fechaPlanilla);
      console.log('📋 [DEBUG] Hora local del usuario:', `${horaLocal}:${minutosLocal}:${segundosLocal}`);
      console.log('📋 [DEBUG] Fecha local creada:', fechaLocal.toString());
      console.log('📋 [DEBUG] Fecha formateada (sin Z):', fechaFormateada);
      console.log('📋 [DEBUG] Zona horaria del usuario:', zonaHorariaUsuario);
      console.log('📋 [DEBUG] Token actual:', localStorage.getItem('token') ? 'Presente' : 'Ausente');
      console.log('📋 [DEBUG] Token (primeros 20 chars):', localStorage.getItem('token')?.substring(0, 20) + '...');
      console.log('📋 [DEBUG] Enviando planilla de devolución:', planillaData);
      
      await ApiService.crearPlanillaDevolucion(planillaData);
      toast.success('Planilla de devolución creada exitosamente');
      
      // Navegar de vuelta a la página de devoluciones
      navigate('/admin/descarga-devoluciones');
    } catch (error: any) {
      console.error('Error al crear planilla de devolución:', error);
      
      if (error.response?.status === 403) {
        toast.error('Error de autorización. Por favor, verifique que esté logueado con un rol de administrador.');
      } else if (error.response?.status === 400) {
        toast.error('Error en los datos enviados. Verifique la información de la planilla.');
      } else {
        toast.error('Error al crear la planilla de devolución. Por favor, intente nuevamente.');
      }
    } finally {
      setGuardando(false);
    }
  };

  const manejarCodigoBarras = (codigo: string) => {
    setInputBusqueda(codigo);
    setMostrarScanner(false);
    
    // Buscar producto por código de barras
    const producto = productos.find(p => p.codigoBarras === codigo);
    if (producto) {
      seleccionarProducto(producto);
    } else {
      toast.error('Producto no encontrado con ese código de barras');
    }
  };

  const calcularTotalUnidades = () => {
    return detalles.reduce((total, detalle) => total + detalle.cantidad, 0);
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
          <p style={{ color: '#6b7280', margin: 0 }}>Cargando...</p>
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
        padding: isMobile ? '8rem 1rem 1rem 1rem' : '7rem 2rem 2rem 2rem'
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
              <button
                onClick={() => navigate('/admin/descarga-devoluciones')}
                style={{
                  background: '#64748b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.5rem',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  width: '2.5rem',
                  height: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ←
              </button>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
                   Nuevo Registro de Retorno
              </h1>
              <p style={{
                color: '#64748b',
                margin: 0,
                  fontSize: '0.875rem'
                }}>
                  Registra los productos devueltos o no entregados
                </p>
                <p style={{
                  color: '#f59e0b',
                  margin: '0.25rem 0 0 0',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  💡 Presiona Escape para volver a Devoluciones
              </p>
            </div>
            </div>
            <div style={{
              display: 'flex',
              gap: '1rem',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <button
                onClick={() => navigate('/admin/descarga-devoluciones')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#64748b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                 onClick={guardarPlanilla}
                 disabled={guardando || detalles.length === 0}
                style={{
                   padding: '0.75rem 1.5rem',
                   background: guardando || detalles.length === 0 ? '#9ca3af' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                   fontSize: '0.875rem',
                  fontWeight: '600',
                   cursor: guardando || detalles.length === 0 ? 'not-allowed' : 'pointer',
                   transition: 'all 0.3s ease',
                   boxShadow: guardando || detalles.length === 0 ? 'none' : '0 4px 12px rgba(245, 158, 11, 0.3)'
                 }}
               >
                 {guardando ? '💾 Creando...' : '💾 Crear Registro de Devolución'}
              </button>
            </div>
          </div>
        </div>

        {/* Campos de información de la planilla */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
          padding: isMobile ? '1.5rem' : '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{
            fontSize: '1.25rem',
              fontWeight: '600',
              color: '#1e293b',
            margin: '0 0 1.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
            }}>
            📋 Información del Registro de Devolución
            </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr 1fr',
            gap: '1rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: isMobile ? '1rem' : '0.875rem',
                fontWeight: '600',
                color: '#64748b',
                marginBottom: isMobile ? '0.75rem' : '0.5rem'
              }}>
                📅 Fecha de la Planilla
              </label>
              <input
                ref={fechaPlanillaRef}
                type="date"
                value={fechaPlanilla}
                onChange={(e) => setFechaPlanilla(e.target.value)}
                max={obtenerFechaActual()}
                style={{
                  width: '100%',
                  padding: isMobile ? '1rem' : '0.75rem',
                  border: '2px solid #e2e8f0',
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
                color: '#64748b',
                marginBottom: isMobile ? '0.75rem' : '0.5rem'
              }}>
                📄 Número de Planilla
              </label>
              <input
                 ref={numeroPlanillaRef}
                 type="text"
                 value={numeroPlanilla}
                 onChange={(e) => setNumeroPlanilla(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     e.preventDefault();
                     // Focus en el campo de transportista
                     const transporteInput = document.querySelector('input[placeholder*="Buscar transportista"]') as HTMLInputElement;
                     if (transporteInput) {
                       transporteInput.focus();
                     }
                   }
                 }}
                 placeholder="Opcional"
                style={{
                  width: '100%',
                  padding: isMobile ? '1rem' : '0.75rem',
                   border: '2px solid #e2e8f0',
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
                color: '#64748b',
                marginBottom: isMobile ? '0.75rem' : '0.5rem'
              }}>
                🚛 Transporte (Opcional)
              </label>
              {transporte ? (
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
                  <span>{transporte}</span>
                  <button
                    onClick={() => {
                      setTransporte('');
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
                  type="text"
                  value={inputBusquedaTransporte}
                  onChange={(e) => {
                    setInputBusquedaTransporte(e.target.value);
                  }}
                  onKeyDown={manejarTeclasTransporte}
                  onFocus={() => {
                    setInputBusquedaTransporte('');
                    setMostrarTransportistas(true);
                  }}
                  placeholder="Buscar transportista por código, nombre o vehículo..."
                  style={{
                    width: '100%',
                    padding: isMobile ? '1rem' : '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    minHeight: isMobile ? '48px' : 'auto'
                  }}
                />
              )}
              
              {/* Dropdown de transportistas */}
              {mostrarTransportistas && opcionesTransporte.length > 0 && (
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
                        backgroundColor: transportistaSeleccionado === index ? '#eff6ff' : 'transparent',
                        borderLeft: transportistaSeleccionado === index ? '3px solid #3b82f6' : 'none',
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
                          <div style={{ fontSize: isMobile ? '0.8rem' : '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                            {opcion.transportista.nombreEmpresa}
                          </div>
                        )}
                        {opcion.vehiculo && (
                          <div style={{ fontSize: isMobile ? '0.8rem' : '0.75rem', color: '#059669', fontWeight: '500', marginTop: '0.25rem' }}>
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
                color: '#64748b',
                marginBottom: isMobile ? '0.75rem' : '0.5rem'
              }}>
                💬 Observaciones / Motivo
              </label>
              <textarea
                 ref={observacionesRef}
                 value={observaciones}
                 onChange={(e) => setObservaciones(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     e.preventDefault();
                     inputBusquedaRef.current?.focus();
                                           // Scroll manual para posicionar justo debajo del navbar
                      setTimeout(() => {
                        if (inputBusquedaRef.current) {
                          const rect = inputBusquedaRef.current.getBoundingClientRect();
                          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                          window.scrollTo({
                            top: scrollTop + rect.top - 185,
                            behavior: 'smooth'
                          });
                        }
                      }, 50);
                   }
                 }}
                 placeholder="Devolución, retiro, recuperado, etc."
                 rows={1}
                style={{
                  width: '100%',
                  padding: isMobile ? '1rem' : '0.75rem',
                   border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                   fontSize: isMobile ? '1rem' : '0.875rem',
                   resize: 'none',
                   minHeight: isMobile ? '48px' : 'auto'
                }}
              />
            </div>
          </div>
            </div>

        {/* Contenido principal - Buscador, Lista y Resumen */}
              <div style={{
                display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '0.8fr 1.4fr 0.8fr',
          gap: '2rem'
        }}>
          {/* Panel izquierdo - Búsqueda */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: isMobile ? '1.5rem' : '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            height: 'fit-content'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0 0 1.5rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🛒 Agregar Productos
            </h2>

            {/* Búsqueda de productos */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: isMobile ? '1rem' : '0.875rem',
                fontWeight: '600',
                color: '#64748b',
                marginBottom: isMobile ? '0.75rem' : '0.5rem'
              }}>
                🔍 Buscar Producto
              </label>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '0.5rem',
                alignItems: 'end'
              }}>
                {!mostrarCampoCantidad && !mostrarSelectorEstado && (
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={inputBusquedaRef}
                      type="text"
                      placeholder="Código de barras, código personalizado o nombre..."
                      value={inputBusqueda}
                      onChange={(e) => setInputBusqueda(e.target.value)}
                      onKeyDown={manejarTeclas}
                      style={{
                        width: '100%',
                        padding: isMobile ? '1rem' : '0.75rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        fontSize: isMobile ? '1rem' : '0.875rem',
                        minHeight: isMobile ? '48px' : 'auto'
                      }}
                    />

                  {/* Lista de productos filtrados */}
                  {mostrarProductos && (
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
                    }}>
                      {productosFiltrados.map((producto, index) => (
                  <div
                    key={producto.id}
                          onClick={() => seleccionarProducto(producto)}
                    style={{
                            padding: isMobile ? '0.75rem' : '0.5rem',
                      cursor: 'pointer',
                            borderBottom: index < productosFiltrados.length - 1 ? '1px solid #f1f5f9' : 'none',
                            background: index === productoSeleccionado ? '#3b82f6' : 'white',
                            color: index === productoSeleccionado ? 'white' : '#1e293b',
                            fontSize: isMobile ? '1rem' : '0.875rem',
                            transition: 'all 0.2s ease',
                            minHeight: isMobile ? '60px' : 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: isMobile ? '1rem' : '0.5rem'
                          }}
                          onMouseOver={() => setProductoSeleccionado(index)}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: '600', 
                              color: index === productoSeleccionado ? 'white' : '#1e293b',
                              fontSize: isMobile ? '0.95rem' : '0.875rem',
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
                              fontSize: isMobile ? '0.8rem' : '0.75rem', 
                              color: index === productoSeleccionado ? '#e2e8f0' : '#64748b',
                              marginTop: '0.25rem'
                            }}>
                              {producto.codigoBarras && `Barras: ${producto.codigoBarras}`}
                              {producto.codigoBarras && ` • `}
                              {`Stock: ${producto.stock}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                )}

                {/* Campo de cantidad temporal */}
                {mostrarCampoCantidad && (
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={cantidadTemporalRef}
                      type="text"
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
                      placeholder="Ej: 336, 3*112, 3x60..."
                      style={{
                        width: '100%',
                        padding: isMobile ? '1rem' : '0.75rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        fontSize: isMobile ? '1rem' : '0.875rem',
                        minHeight: isMobile ? '48px' : 'auto'
                      }}
                    />
                    
                    {/* Mostrar resultado del cálculo en tiempo real */}
                    {resultadoCalculoRetorno !== null && (
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
                        ✅ Resultado: {resultadoCalculoRetorno.toLocaleString()} unidades
                      </div>
                    )}
                    
                    {errorCalculoRetorno && (
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
                        ❌ {errorCalculoRetorno}
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

                {/* Selector de estado temporal */}
                {mostrarSelectorEstado && (
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: isMobile ? '0.875rem' : '0.75rem',
                      fontWeight: '600',
                      color: '#64748b',
                      marginBottom: isMobile ? '0.5rem' : '0.25rem'
                    }}>
                      Estado
                    </label>
                    <select
                      ref={estadoTemporalRef}
                      value={estadoTemporal}
                      onChange={(e) => setEstadoTemporal(e.target.value)}
                      onKeyDown={manejarTeclasEstado}
                      style={{
                        width: '100%',
                        padding: isMobile ? '1rem' : '0.75rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        fontSize: isMobile ? '1rem' : '0.875rem',
                        backgroundColor: 'white',
                        minHeight: isMobile ? '48px' : 'auto'
                      }}
                    >
                      {estadosProducto.map(estado => (
                        <option key={estado.value} value={estado.value}>
                          {estado.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Vista previa del producto seleccionado */}
              {(mostrarCampoCantidad || mostrarSelectorEstado) && productoSeleccionadoTemporal && (
                <div 
                  onClick={isMobile ? (mostrarCampoCantidad ? activarSelectorEstado : confirmarProducto) : undefined}
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
                    <strong>Producto:</strong> {productoSeleccionadoTemporal.nombre}
                  </div>
                  {productoSeleccionadoTemporal.codigoPersonalizado && (
                    <div style={{ marginBottom: isMobile ? '0.5rem' : '0.25rem' }}>
                      <strong>Código:</strong> {productoSeleccionadoTemporal.codigoPersonalizado}
                    </div>
                  )}
                  <div style={{ marginBottom: isMobile ? '0.5rem' : '0.25rem' }}>
                    <strong>Stock actual:</strong> {productoSeleccionadoTemporal.stock}
                  </div>
                  <div style={{ marginBottom: isMobile ? '0.5rem' : '0.25rem' }}>
                    <strong>Cantidad:</strong> {cantidadTemporal}
                  </div>
                  {mostrarSelectorEstado && (
                    <div style={{ marginBottom: isMobile ? '0.5rem' : '0.25rem' }}>
                      <strong>Estado:</strong> {estadosProducto.find(e => e.value === estadoTemporal)?.label}
                    </div>
                  )}
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
                    {isMobile ? (
                      mostrarCampoCantidad ? '👆 TOCA PARA CONTINUAR' : '👆 TOCA PARA AGREGAR'
                    ) : (
                      mostrarCampoCantidad ? '💡 Enter para continuar • Escape para cancelar' : '💡 Enter para agregar • Escape para cancelar'
                    )}
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setMostrarScanner(true)}
                style={{
                  width: '100%',
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                📷 Escanear Código de Barras
              </button>
            </div>
          </div>

          {/* Panel central - Lista de productos */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: isMobile ? '1.5rem' : '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0 0 1.5rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📦 Productos de la Planilla ({detalles.length})
            </h2>

            {detalles.length === 0 ? (
            <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6b7280',
                background: '#f8fafc',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                <p>No hay productos agregados a la planilla</p>
                <p style={{ fontSize: '0.875rem' }}>Busca y agrega productos en el panel izquierdo</p>
              </div>
            ) : (
              <div 
                ref={listaProductosDevolucionRef}
                style={{
                  background: 'white',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  height: '400px',
                  overflowY: 'auto',
                  overflowX: 'hidden'
                }}>
                {detalles.map((detalle, index) => (
                  <div
                    key={detalle.id}
                    data-product-index={index}
                  style={{
                      padding: isMobile ? '1rem' : '0.75rem',
                      borderBottom: index < detalles.length - 1 ? '1px solid #f1f5f9' : 'none',
                      background: index % 2 === 0 ? 'white' : '#f8fafc',
                      minHeight: isMobile ? '70px' : 'auto'
                  }}
                >
                  <div style={{
                    display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '1fr auto',
                      gap: '0.75rem',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{
                        fontWeight: '600',
                        color: '#1e293b',
                          fontSize: isMobile ? '1rem' : '0.875rem',
                          lineHeight: '1.3'
                      }}>
                        {detalle.codigoPersonalizado ? (
                          <>
                            <span style={{ color: '#3b82f6', fontWeight: '700' }}>
                              {detalle.codigoPersonalizado}
                            </span>
                            <br />
                            {detalle.descripcion}
                          </>
                        ) : (
                          detalle.descripcion
                        )}
                      </div>
                    </div>
                    
                    {/* Cantidad, Estado y Botón eliminar en la misma línea */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? '0.75rem' : '0.5rem',
                      flexShrink: 0
                    }}>
                      <div>
                        <label style={{
                            display: 'block',
                            fontSize: isMobile ? '0.8rem' : '0.7rem',
                          fontWeight: '600',
                            color: '#64748b',
                            marginBottom: isMobile ? '0.25rem' : '0.125rem'
                        }}>
                          Cantidad
                        </label>
                          <input
                            type="text"
                            value={detalle.cantidad}
                            onChange={(e) => {
                              const valor = e.target.value;
                              if (valor === '' || /^\d+$/.test(valor)) {
                                const nuevaCantidad = valor === '' ? 0 : parseInt(valor);
                                actualizarCantidad(index, nuevaCantidad);
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
                        </div>
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: isMobile ? '0.8rem' : '0.7rem',
                            fontWeight: '600',
                            color: '#64748b',
                            marginBottom: isMobile ? '0.25rem' : '0.125rem'
                          }}>
                            Estado
                          </label>
                          <select
                            value={detalle.estadoProducto}
                            onChange={(e) => actualizarEstadoProducto(index, e.target.value)}
                            style={{
                              padding: isMobile ? '0.5rem' : '0.25rem',
                              border: '1px solid #e2e8f0',
                              borderRadius: '0.25rem',
                              fontSize: isMobile ? '0.8rem' : '0.7rem',
                              background: '#f8fafc',
                              color: '#1e293b',
                              fontWeight: '500',
                              minHeight: isMobile ? '2rem' : '1.5rem',
                              cursor: 'pointer'
                            }}
                          >
                            {estadosProducto.map(estado => (
                              <option key={estado.value} value={estado.value}>
                                {estado.label}
                              </option>
                            ))}
                          </select>
                        </div>
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
                              width: isMobile ? '2.5rem' : '2rem',
                              height: isMobile ? '2.5rem' : '2rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              alignSelf: 'flex-end',
                              marginTop: isMobile ? '1.5rem' : '1.25rem'
                            }}
                          >
                          🗑️
                          </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel derecho - Resumen de productos */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: isMobile ? '1.5rem' : '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            height: 'fit-content'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
                          fontWeight: '600',
                          color: '#1e293b',
              margin: '0 0 1.5rem 0',
                            display: 'flex',
                            alignItems: 'center',
              gap: '0.5rem'
            }}>
              📊 Resumen de la Planilla
            </h2>
            
            <div style={{
              display: 'grid',
              gap: '1rem'
            }}>
              <div>
                <div style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Productos</div>
                  <div style={{ fontSize: '2rem', fontWeight: '700' }}>{detalles.length}</div>
                      </div>
                    </div>

                    <div>
                <div style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: 'white',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Unidades</div>
                  <div style={{ fontSize: '2rem', fontWeight: '700' }}>{calcularTotalUnidades()}</div>
                </div>
              </div>
              
                             <div style={{
                 background: '#f8fafc',
                 padding: '1rem',
                 borderRadius: '0.75rem',
                 border: '1px solid #e2e8f0'
               }}>
                 <h3 style={{
                   fontSize: '1rem',
                        fontWeight: '600',
                   color: '#1e293b',
                   margin: '0 0 0.75rem 0'
                 }}>
                   📋 Información
                 </h3>
                 <div style={{
                          fontSize: '0.875rem',
                   color: '#64748b',
                   lineHeight: '1.5',
                   marginBottom: '1rem'
                 }}>
                   <div><strong>Número:</strong> {numeroPlanilla || 'No definido'}</div>
                   <div><strong>Fecha:</strong> {fechaPlanilla ? new Date(fechaPlanilla).toLocaleDateString() : 'No definida'}</div>
                   <div><strong>Observaciones:</strong> {observaciones ? 'Sí' : 'No'}</div>
                    </div>

                    <button
                   onClick={guardarPlanilla}
                   disabled={guardando || detalles.length === 0}
                      style={{
                     width: '100%',
                     padding: '0.75rem',
                     background: guardando || detalles.length === 0 ? '#9ca3af' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                     fontSize: '0.875rem',
                     fontWeight: '600',
                     cursor: guardando || detalles.length === 0 ? 'not-allowed' : 'pointer',
                     transition: 'all 0.3s ease',
                     boxShadow: guardando || detalles.length === 0 ? 'none' : '0 4px 12px rgba(245, 158, 11, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                     justifyContent: 'center',
                     gap: '0.5rem'
                   }}
                 >
                   {guardando ? (
                     <>
                       <div style={{
                         width: '1rem',
                         height: '1rem',
                         border: '2px solid transparent',
                         borderTop: '2px solid white',
                         borderRadius: '50%',
                         animation: 'spin 1s linear infinite'
                       }}></div>
                       Creando...
                     </>
                   ) : (
                     '📋 Crear Registro'
                   )}
                    </button>
                  </div>
                </div>
            </div>
          </div>
      </div>

      {/* Scanner de código de barras */}
      {mostrarScanner && (
        <BarcodeScanner
          isOpen={mostrarScanner}
          onScan={manejarCodigoBarras}
          onClose={() => setMostrarScanner(false)}
        />
      )}
    </div>
  );
}
