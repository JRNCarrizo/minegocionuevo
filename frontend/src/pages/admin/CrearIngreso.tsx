import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
import { obtenerFechaActual } from '../../utils/dateUtils';
import BarcodeScanner from '../../components/BarcodeScanner';

interface DetalleRemitoIngreso {
  id: number;
  productoId?: number;
  codigoPersonalizado?: string;
  descripcion: string;
  cantidad: number;
  observaciones?: string;
  estadoProducto?: string; // "BUEN_ESTADO", "MAL_ESTADO", "ROTO", "DEFECTUOSO"
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

export default function CrearIngreso() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  
  const [numeroRemito, setNumeroRemito] = useState('');
  const [fechaRemito, setFechaRemito] = useState(obtenerFechaActual());
  const [observaciones, setObservaciones] = useState('');
  const [detalles, setDetalles] = useState<DetalleRemitoIngreso[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([]);
  const [mostrarProductos, setMostrarProductos] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(-1);
  const [inputBusqueda, setInputBusqueda] = useState('');
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [mostrarScannerModal, setMostrarScannerModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarCampoCantidad, setMostrarCampoCantidad] = useState(false);
  const [cantidadTemporal, setCantidadTemporal] = useState(0);
  const [cantidadTemporalTexto, setCantidadTemporalTexto] = useState<string>('');
  const [resultadoCalculoIngreso, setResultadoCalculoIngreso] = useState<number | null>(null);
  const [errorCalculoIngreso, setErrorCalculoIngreso] = useState<string | null>(null);
  const [productoSeleccionadoTemporal, setProductoSeleccionadoTemporal] = useState<Producto | null>(null);
  const [mostrarModalCrearProducto, setMostrarModalCrearProducto] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    marca: '',
    descripcion: '',
    precio: '0',
    unidad: '',
    categoria: '',
    sectorAlmacenamiento: '',
    codigoPersonalizado: '',
    codigoBarras: '',
    imagenes: [] as string[]
  });
  const [guardandoProducto, setGuardandoProducto] = useState(false);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [mostrarNuevaCategoria, setMostrarNuevaCategoria] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [nombresExistentes, setNombresExistentes] = useState<string[]>([]);
  const [marcasExistentes, setMarcasExistentes] = useState<string[]>([]);
  const [mostrarSugerenciasNombre, setMostrarSugerenciasNombre] = useState(false);
  const [mostrarSugerenciasMarca, setMostrarSugerenciasMarca] = useState(false);
  const [sugerenciasNombre, setSugerenciasNombre] = useState<string[]>([]);
  const [sugerenciasMarca, setSugerenciasMarca] = useState<string[]>([]);
  const [sugerenciaSeleccionadaNombre, setSugerenciaSeleccionadaNombre] = useState(-1);
  const [sugerenciaSeleccionadaMarca, setSugerenciaSeleccionadaMarca] = useState(-1);
  
  // Estados para autocomplete de sectores
  const [sectoresAlmacenamiento, setSectoresAlmacenamiento] = useState<string[]>([]);
  const [sectoresFiltrados, setSectoresFiltrados] = useState<string[]>([]);
  const [mostrarSugerenciasSector, setMostrarSugerenciasSector] = useState(false);
  const [sectorSeleccionadoIndex, setSectorSeleccionadoIndex] = useState(-1);
  

  const inputBusquedaRef = useRef<HTMLInputElement>(null);
  const numeroRemitoRef = useRef<HTMLInputElement>(null);
  const fechaRemitoRef = useRef<HTMLInputElement>(null);
  const observacionesRef = useRef<HTMLTextAreaElement>(null);
  const cantidadTemporalRef = useRef<HTMLInputElement>(null);
  const listaProductosRef = useRef<HTMLDivElement>(null);
  const listaProductosIngresoRef = useRef<HTMLDivElement>(null);

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
  
  // Referencias para los campos del modal de crear producto
  const nombreProductoRef = useRef<HTMLInputElement>(null);
  const marcaProductoRef = useRef<HTMLInputElement>(null);
  const codigoPersonalizadoRef = useRef<HTMLInputElement>(null);
  const codigoBarrasRef = useRef<HTMLInputElement>(null);
  const categoriaProductoRef = useRef<HTMLSelectElement>(null);
  const descripcionProductoRef = useRef<HTMLTextAreaElement>(null);
  const precioProductoRef = useRef<HTMLInputElement>(null);
  const unidadProductoRef = useRef<HTMLInputElement>(null);
  const sectorProductoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    if (datosUsuario) {
      cargarProductos();
      cargarCategorias();
      cargarSectoresAlmacenamiento();
      // Solo inicializar si no hay datos del remito
      if (!numeroRemito && detalles.length === 0) {
        inicializarRemito();
      }
    }
  }, [navigate, datosUsuario]);

  // Manejar tecla Escape para volver a la vista principal
  useEffect(() => {
    const manejarEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Si está en el modal de crear producto, cerrarlo
        if (mostrarModalCrearProducto) {
          cerrarModalCrearProducto();
          return;
        }
        // Si está en el campo de cantidad temporal, no navegar fuera
        if (mostrarCampoCantidad) {
          return;
        }
        navigate('/admin/ingresos');
      }
    };

    document.addEventListener('keydown', manejarEscape);
    return () => {
      document.removeEventListener('keydown', manejarEscape);
    };
  }, [navigate, mostrarCampoCantidad, mostrarModalCrearProducto]);

  // Navegación por teclado en el modal de crear producto
  useEffect(() => {
    const manejarTeclasModal = (e: KeyboardEvent) => {
      if (!mostrarModalCrearProducto) return;
      
      if (e.key === 'Enter') {
        e.preventDefault();
        
        // Obtener el elemento activo
        const elementoActivo = document.activeElement as HTMLElement;
        
        // Definir el orden de los campos
        const campos = [
          nombreProductoRef.current,
          marcaProductoRef.current,
          codigoPersonalizadoRef.current,
          codigoBarrasRef.current,
          categoriaProductoRef.current,
          descripcionProductoRef.current,
          precioProductoRef.current,
          unidadProductoRef.current,
          sectorProductoRef.current
        ];
        
        // Encontrar el índice del campo actual
        const indiceActual = campos.findIndex(campo => campo === elementoActivo);
        
        // Si estamos en el campo de categoría, no navegar automáticamente
        if (elementoActivo === categoriaProductoRef.current) {
          // El manejador de teclado del select se encargará de expandir las opciones
          return;
        }
        
        if (indiceActual >= 0 && indiceActual < campos.length - 1) {
          // Navegar al siguiente campo
          const siguienteCampo = campos[indiceActual + 1];
          if (siguienteCampo) {
            siguienteCampo.focus();
          }
        } else if (indiceActual === campos.length - 1) {
          // Estamos en el último campo, crear el producto
          // Primero actualizar el estado con los valores actuales de los campos
          actualizarEstadoDesdeCampos();
          // Luego crear el producto con un pequeño delay para asegurar que el estado se actualice
          setTimeout(() => crearNuevoProducto(), 10);
        }
      }
    };

    document.addEventListener('keydown', manejarTeclasModal);
    return () => {
      document.removeEventListener('keydown', manejarTeclasModal);
    };
  }, [mostrarModalCrearProducto]);

  // Auto-focus en el primer campo cuando se abre el modal
  useEffect(() => {
    if (mostrarModalCrearProducto && nombreProductoRef.current) {
      setTimeout(() => {
        if (nombreProductoRef.current) {
          nombreProductoRef.current.focus();
        }
      }, 100);
    }
  }, [mostrarModalCrearProducto]);

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

  // Auto-scroll para mantener visible el último producto agregado al ingreso
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

     // Auto-focus en el campo de número de remito al cargar
   useEffect(() => {
     // Solo hacer focus cuando el usuario esté cargado y el remito esté inicializado
     if (datosUsuario && numeroRemitoRef.current) {
       // Pequeño delay para asegurar que la página esté completamente renderizada
       setTimeout(() => {
         if (numeroRemitoRef.current) {
           numeroRemitoRef.current.focus();
           numeroRemitoRef.current.select(); // Seleccionar todo el texto para facilitar la edición
         }
       }, 100);
     }
   }, [datosUsuario]);

  // Calcular resultado en tiempo real cuando se escribe en el campo de cantidad
  useEffect(() => {
    if (!cantidadTemporalTexto.trim()) {
      setResultadoCalculoIngreso(null);
      setErrorCalculoIngreso(null);
      return;
    }

    // Verificar si la cantidad contiene operadores matemáticos
    const contieneOperadores = /[+\-*/x()]/.test(cantidadTemporalTexto);
    
    if (contieneOperadores) {
      const evaluacion = evaluarExpresion(cantidadTemporalTexto);
      if (evaluacion.error) {
        setResultadoCalculoIngreso(null);
        setErrorCalculoIngreso(evaluacion.error);
      } else {
        setResultadoCalculoIngreso(evaluacion.resultado);
        setErrorCalculoIngreso(null);
      }
    } else {
      // Si no contiene operadores, limpiar el resultado
      setResultadoCalculoIngreso(null);
      setErrorCalculoIngreso(null);
    }
  }, [cantidadTemporalTexto]);

    

  const inicializarRemito = () => {
    setNumeroRemito('');
    setFechaRemito(obtenerFechaActual());
    setObservaciones('');
    setDetalles([]);
  };

  const cargarProductos = async () => {
    try {
      const response = await ApiService.obtenerTodosLosProductosIncluirInactivos(datosUsuario!.empresaId);
      if (response && response.data) {
        setProductos(response.data);
        // Guardar en localStorage para persistencia
        localStorage.setItem('productos', JSON.stringify(response.data));
        // Extraer nombres y marcas existentes para autocompletado
        setTimeout(() => extraerNombresYMarcas(), 100);
      } else {
        // Si no hay respuesta de la API, intentar cargar desde localStorage
        const productosGuardados = JSON.parse(localStorage.getItem('productos') || '[]');
        if (productosGuardados.length > 0) {
          setProductos(productosGuardados);
          setTimeout(() => extraerNombresYMarcas(), 100);
        } else {
          setProductos([]);
        }
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      // En caso de error, intentar cargar desde localStorage
      const productosGuardados = JSON.parse(localStorage.getItem('productos') || '[]');
      if (productosGuardados.length > 0) {
        setProductos(productosGuardados);
        setTimeout(() => extraerNombresYMarcas(), 100);
      } else {
        setProductos([]);
      }
      toast.error('Error al cargar productos desde la API, usando datos locales');
    }
  };


  const buscarProductos = (valor: string) => {
    setInputBusqueda(valor);
    setProductoSeleccionado(-1);
    
    if (!valor.trim()) {
      setProductosFiltrados([]);
      setMostrarProductos(false);
      return;
    }

    const filtrados = productos.filter(producto => {
      const matchCodigo = producto.codigoPersonalizado && producto.codigoPersonalizado.toLowerCase().includes(valor.toLowerCase());
      const matchBarras = producto.codigoBarras && producto.codigoBarras.includes(valor);
      const matchNombre = producto.nombre.toLowerCase().includes(valor.toLowerCase());
      
      return matchCodigo || matchBarras || matchNombre;
    });

    // Ordenar resultados: primero códigos personalizados, luego códigos de barras, luego nombres
    const productosOrdenados = filtrados.sort((a, b) => {
      const busqueda = valor.toLowerCase();
      
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
      const aTieneBarras = a.codigoBarras?.includes(valor);
      const bTieneBarras = b.codigoBarras?.includes(valor);
      if (aTieneBarras && !bTieneBarras) return -1;
      if (!aTieneBarras && bTieneBarras) return 1;
      
      // Prioridad 5: Coincidencia en nombre (orden alfabético)
      return a.nombre.localeCompare(b.nombre);
    });

    setProductosFiltrados(productosOrdenados);
    setMostrarProductos(productosOrdenados.length > 0);
  };

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
          agregarProducto(productosFiltrados[productoSeleccionado]);
        }
        break;
      case 'Escape':
        setMostrarProductos(false);
        setProductoSeleccionado(-1);
        break;
    }
  };

     // Navegación entre campos con Enter
   const manejarEnterCampo = (e: React.KeyboardEvent, siguienteCampo: 'numeroRemito' | 'observaciones' | 'busqueda') => {
     if (e.key === 'Enter') {
       e.preventDefault();
       switch (siguienteCampo) {
         case 'numeroRemito':
           numeroRemitoRef.current?.focus();
           break;
         case 'observaciones':
           observacionesRef.current?.focus();
           break;
         case 'busqueda':
           inputBusquedaRef.current?.focus();
           // Scroll automático para que el buscador quede visible
           setTimeout(() => {
             const element = inputBusquedaRef.current;
             if (element) {
               const elementPosition = element.getBoundingClientRect().top;
                              const offsetPosition = elementPosition + window.pageYOffset - 190; // 190px de offset desde arriba
               
               window.scrollTo({
                 top: offsetPosition,
                 behavior: 'smooth'
               });
             }
           }, 100);
           break;
       }
     }
   };

  const agregarProducto = (producto: Producto) => {
    // Guardar el producto seleccionado y mostrar el campo de cantidad
    setProductoSeleccionadoTemporal(producto);
    setCantidadTemporal(0);
    setCantidadTemporalTexto('');
    setResultadoCalculoIngreso(null);
    setErrorCalculoIngreso(null);
    setMostrarCampoCantidad(true);
    setInputBusqueda('');
    setMostrarProductos(false);
    setProductoSeleccionado(-1);
    
    // Hacer focus en el campo de cantidad temporal
    setTimeout(() => {
      if (cantidadTemporalRef.current) {
        cantidadTemporalRef.current.focus();
        cantidadTemporalRef.current.select();
      }
    }, 100);
  };

  const actualizarDetalle = (index: number, campo: keyof DetalleRemitoIngreso, valor: any) => {
    setDetalles(prev => prev.map((detalle, i) => 
      i === index ? { ...detalle, [campo]: valor } : detalle
    ));
  };


  const confirmarCantidad = () => {
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
          toast.error('❌ La cantidad debe ser mayor a 0 para agregar el producto al remito');
          return;
        }
      }
    } else {
      // Usar la cantidad numérica si no hay texto
      cantidadFinal = cantidadTemporal;
      if (cantidadFinal <= 0) {
        toast.error('❌ La cantidad debe ser mayor a 0 para agregar el producto al remito');
        return;
      }
    }

    const nuevoDetalle: DetalleRemitoIngreso = {
      id: Date.now(),
      productoId: productoSeleccionadoTemporal.id,
      codigoPersonalizado: productoSeleccionadoTemporal.codigoPersonalizado,
      descripcion: productoSeleccionadoTemporal.nombre,
      cantidad: cantidadFinal,
      observaciones: '',
      fechaCreacion: new Date().toISOString()
    };

    setDetalles(prev => [...prev, nuevoDetalle]);
    setMostrarCampoCantidad(false);
    setProductoSeleccionadoTemporal(null);
    setCantidadTemporal(0);
    setCantidadTemporalTexto('');
    setResultadoCalculoIngreso(null);
    setErrorCalculoIngreso(null);
    
    // Hacer scroll al último producto agregado solo si hay más de 3 productos
    if (detalles.length > 3) {
      setTimeout(() => {
        scrollToLastProduct();
      }, 100);
    }
    
    // Volver el focus al buscador
    setTimeout(() => {
      if (inputBusquedaRef.current) {
        inputBusquedaRef.current.focus();
      }
    }, 100);
  };



  const manejarEnterCantidadTemporal = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmarCantidad();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation(); // Detener la propagación del evento
      // Cancelar la selección del producto y volver al buscador
      setMostrarCampoCantidad(false);
      setProductoSeleccionadoTemporal(null);
      setCantidadTemporal(0);
      setCantidadTemporalTexto('');
      setResultadoCalculoIngreso(null);
      setErrorCalculoIngreso(null);
      setInputBusqueda('');
      
      // Volver el focus al buscador
      if (inputBusquedaRef.current) {
        inputBusquedaRef.current.focus();
      }
    }
  };


  const eliminarDetalle = (index: number) => {
    setDetalles(prev => prev.filter((_, i) => i !== index));
  };

  // Función para hacer scroll automático al último producto agregado al ingreso
  const scrollToLastProduct = () => {
    if (listaProductosIngresoRef.current && detalles.length > 0) {
      const container = listaProductosIngresoRef.current;
      const lastProductIndex = detalles.length - 1;
      
      // Buscar el último elemento de producto en la lista
      const productElements = container.querySelectorAll('[data-product-index]');
      const lastProductElement = productElements[lastProductIndex] as HTMLElement;
      
      if (lastProductElement) {
        // Usar scrollIntoView que es más confiable para posicionar elementos
        lastProductElement.scrollIntoView({
          behavior: 'smooth',
          block: 'end', // Posiciona el elemento al final del área visible
          inline: 'nearest'
        });
      }
    }
  };

  const abrirModalCrearProducto = () => {
    setMostrarModalCrearProducto(true);
    // Asegurar que los nombres y marcas estén disponibles para el predictivo
    setTimeout(() => extraerNombresYMarcas(), 100);
  };

  const cerrarModalCrearProducto = () => {
    setMostrarModalCrearProducto(false);
    // Resetear el formulario
    setNuevoProducto({
      nombre: '',
      marca: '',
      descripcion: '',
      precio: '0',
      unidad: '',
      categoria: '',
      sectorAlmacenamiento: '',
      codigoPersonalizado: '',
      codigoBarras: '',
      imagenes: []
    });
    // Resetear estados de categoría
    setMostrarNuevaCategoria(false);
    setNuevaCategoria('');
    // Resetear estados de autocompletado
    setMostrarSugerenciasNombre(false);
    setMostrarSugerenciasMarca(false);
    setSugerenciasNombre([]);
    setSugerenciasMarca([]);
    setSugerenciaSeleccionadaNombre(-1);
    setSugerenciaSeleccionadaMarca(-1);
  };

  const cargarCategorias = async () => {
    try {
      const response = await ApiService.obtenerCategorias(datosUsuario!.empresaId);
      if (response.data) {
        setCategorias(response.data);
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const cargarSectoresAlmacenamiento = async () => {
    try {
      // Cargar sectores desde la gestión de sectores usando ApiService
      const response = await ApiService.obtenerSectores(datosUsuario!.empresaId);
      if (response.data) {
        // Extraer solo los nombres de los sectores activos
        const sectoresActivos = (response.data || [])
          .filter((sector: any) => sector.activo)
          .map((sector: any) => sector.nombre);
        setSectoresAlmacenamiento(sectoresActivos);
        console.log('✅ Sectores cargados en CrearIngreso:', sectoresActivos);
      }
    } catch (error) {
      console.error('Error al cargar sectores de almacenamiento:', error);
    }
  };

  const extraerNombresYMarcas = () => {
    console.log('🔍 [PREDICTIVO] Extrayendo nombres y marcas...');
    console.log('🔍 [PREDICTIVO] Productos disponibles:', productos.length);
    console.log('🔍 [PREDICTIVO] Productos:', productos);
    
    const nombres = [...new Set(productos.map(p => p.nombre).filter((nombre): nombre is string => Boolean(nombre)))];
    const marcas = [...new Set(productos.map(p => p.marca).filter((marca): marca is string => Boolean(marca)))];
    
    console.log('🔍 [PREDICTIVO] Nombres extraídos:', nombres);
    console.log('🔍 [PREDICTIVO] Marcas extraídas:', marcas);
    
    setNombresExistentes(nombres);
    setMarcasExistentes(marcas);
  };

  const buscarSugerenciasNombre = (valor: string) => {
    console.log('🔍 [PREDICTIVO] Buscando sugerencias para nombre:', valor);
    console.log('🔍 [PREDICTIVO] Nombres existentes:', nombresExistentes);
    
    if (!valor.trim()) {
      setSugerenciasNombre([]);
      setMostrarSugerenciasNombre(false);
      setSugerenciaSeleccionadaNombre(-1);
      return;
    }

    const sugerencias = nombresExistentes.filter(nombre =>
      nombre.toLowerCase().includes(valor.toLowerCase())
    ).slice(0, 5); // Máximo 5 sugerencias

    console.log('🔍 [PREDICTIVO] Sugerencias encontradas:', sugerencias);
    
    setSugerenciasNombre(sugerencias);
    setMostrarSugerenciasNombre(sugerencias.length > 0);
    setSugerenciaSeleccionadaNombre(-1);
  };

  const buscarSugerenciasMarca = (valor: string) => {
    console.log('🔍 [PREDICTIVO] Buscando sugerencias para marca:', valor);
    console.log('🔍 [PREDICTIVO] Marcas existentes:', marcasExistentes);
    
    if (!valor.trim()) {
      setSugerenciasMarca([]);
      setMostrarSugerenciasMarca(false);
      setSugerenciaSeleccionadaMarca(-1);
      return;
    }

    const sugerencias = marcasExistentes.filter(marca =>
      marca.toLowerCase().includes(valor.toLowerCase())
    ).slice(0, 5); // Máximo 5 sugerencias

    console.log('🔍 [PREDICTIVO] Sugerencias de marca encontradas:', sugerencias);
    
    setSugerenciasMarca(sugerencias);
    setMostrarSugerenciasMarca(sugerencias.length > 0);
    setSugerenciaSeleccionadaMarca(-1);
  };

  const seleccionarSugerenciaNombre = (nombre: string) => {
    setNuevoProducto(prev => ({ ...prev, nombre }));
    setMostrarSugerenciasNombre(false);
    setSugerenciaSeleccionadaNombre(-1);
  };

  const seleccionarSugerenciaMarca = (marca: string) => {
    setNuevoProducto(prev => ({ ...prev, marca }));
    setMostrarSugerenciasMarca(false);
    setSugerenciaSeleccionadaMarca(-1);
  };

  const manejarTeclasNombre = (e: React.KeyboardEvent) => {
    if (!mostrarSugerenciasNombre || sugerenciasNombre.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSugerenciaSeleccionadaNombre(prev => 
          prev < sugerenciasNombre.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSugerenciaSeleccionadaNombre(prev => 
          prev > 0 ? prev - 1 : sugerenciasNombre.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (sugerenciaSeleccionadaNombre >= 0 && sugerenciaSeleccionadaNombre < sugerenciasNombre.length) {
          seleccionarSugerenciaNombre(sugerenciasNombre[sugerenciaSeleccionadaNombre]);
        }
        break;
      case 'Escape':
        setMostrarSugerenciasNombre(false);
        setSugerenciaSeleccionadaNombre(-1);
        break;
    }
  };

  const manejarTeclasMarca = (e: React.KeyboardEvent) => {
    if (!mostrarSugerenciasMarca || sugerenciasMarca.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSugerenciaSeleccionadaMarca(prev => 
          prev < sugerenciasMarca.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSugerenciaSeleccionadaMarca(prev => 
          prev > 0 ? prev - 1 : sugerenciasMarca.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (sugerenciaSeleccionadaMarca >= 0 && sugerenciaSeleccionadaMarca < sugerenciasMarca.length) {
          seleccionarSugerenciaMarca(sugerenciasMarca[sugerenciaSeleccionadaMarca]);
        }
        break;
      case 'Escape':
        setMostrarSugerenciasMarca(false);
        setSugerenciaSeleccionadaMarca(-1);
        break;
    }
  };

  const manejarCambioSectorAlmacenamiento = (valor: string) => {
    setNuevoProducto(prev => ({ ...prev, sectorAlmacenamiento: valor }));
    
    // Resetear índice de selección
    setSectorSeleccionadoIndex(-1);
    
    // Filtrar sectores que coincidan con lo que está escribiendo
    if (valor.trim()) {
      const filtrados = sectoresAlmacenamiento.filter(sector =>
        sector.toLowerCase().includes(valor.toLowerCase())
      );
      setSectoresFiltrados(filtrados);
      setMostrarSugerenciasSector(filtrados.length > 0);
    } else {
      setSectoresFiltrados([]);
      setMostrarSugerenciasSector(false);
    }
  };




  const manejarCambioSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (value === '__nueva__') {
      // Si selecciona "agregar nueva categoría", mostrar el input
      setMostrarNuevaCategoria(true);
      setNuevaCategoria('');
      return;
    }
    
    setMostrarNuevaCategoria(false);
    setNuevoProducto(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejador de teclado específico para el campo de categoría
  const manejarTeclasCategoria = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Si el select está cerrado, expandirlo
      if (!categoriaProductoRef.current?.matches(':focus')) {
        if (categoriaProductoRef.current) {
          categoriaProductoRef.current.focus();
          // Simular click para abrir las opciones
          categoriaProductoRef.current.click();
        }
      } else {
        // Si el select está abierto y hay una opción seleccionada, confirmar y pasar al siguiente campo
        if (categoriaProductoRef.current) {
          categoriaProductoRef.current.blur();
          // Pasar al siguiente campo
          setTimeout(() => {
            if (descripcionProductoRef.current) {
              descripcionProductoRef.current.focus();
            }
          }, 50);
        }
      }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      // Permitir navegación normal con flechas
      return; // No prevenir el comportamiento por defecto
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // Cerrar el select y pasar al siguiente campo
      if (categoriaProductoRef.current) {
        categoriaProductoRef.current.blur();
        // Pasar al siguiente campo
        setTimeout(() => {
          if (descripcionProductoRef.current) {
            descripcionProductoRef.current.focus();
          }
        }, 50);
      }
    }
  };

  const manejarNuevaCategoria = (e: React.KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value.trim();
    
    if (value) {
      // Agregar la nueva categoría si no existe
      if (!categorias.includes(value)) {
        setCategorias(prev => [...prev, value]);
      }
      setNuevoProducto(prev => ({ ...prev, categoria: value }));
      setMostrarNuevaCategoria(false);
    } else {
      setMostrarNuevaCategoria(false);
      setNuevoProducto(prev => ({ ...prev, categoria: '' }));
    }
  };

  // Función auxiliar para actualizar el estado desde los campos del formulario
  const actualizarEstadoDesdeCampos = () => {
    if (nombreProductoRef.current) {
      setNuevoProducto(prev => ({ ...prev, nombre: nombreProductoRef.current?.value || '' }));
    }
    if (marcaProductoRef.current) {
      setNuevoProducto(prev => ({ ...prev, marca: marcaProductoRef.current?.value || '' }));
    }
    if (codigoPersonalizadoRef.current) {
      setNuevoProducto(prev => ({ ...prev, codigoPersonalizado: codigoPersonalizadoRef.current?.value || '' }));
    }
    if (codigoBarrasRef.current) {
      setNuevoProducto(prev => ({ ...prev, codigoBarras: codigoBarrasRef.current?.value || '' }));
    }
    if (categoriaProductoRef.current) {
      setNuevoProducto(prev => ({ ...prev, categoria: categoriaProductoRef.current?.value || '' }));
    }
    if (descripcionProductoRef.current) {
      setNuevoProducto(prev => ({ ...prev, descripcion: descripcionProductoRef.current?.value || '' }));
    }
    if (precioProductoRef.current) {
      setNuevoProducto(prev => ({ ...prev, precio: precioProductoRef.current?.value || '0' }));
    }
    if (unidadProductoRef.current) {
      setNuevoProducto(prev => ({ ...prev, unidad: unidadProductoRef.current?.value || '' }));
    }
    if (sectorProductoRef.current) {
      setNuevoProducto(prev => ({ ...prev, sectorAlmacenamiento: sectorProductoRef.current?.value || '' }));
    }
  };

  const crearNuevoProducto = async () => {
    // Obtener el valor del nombre directamente del campo para evitar problemas de sincronización
    const nombreActual = nombreProductoRef.current?.value?.trim() || nuevoProducto.nombre.trim();
    
    if (!nombreActual) {
      toast.error('El nombre del producto es obligatorio');
      if (nombreProductoRef.current) {
        nombreProductoRef.current.focus();
      }
      return;
    }

    try {
      setGuardandoProducto(true);
      
      const productoData = {
        nombre: nombreActual,
        marca: nuevoProducto.marca,
        descripcion: nuevoProducto.descripcion,
        precio: parseFloat(nuevoProducto.precio) || 0,
        stock: 0, // Siempre 0 para productos nuevos - se agregará stock al ingresar al remito
        stockMinimo: 5, // Valor por defecto para productos nuevos
        unidad: nuevoProducto.unidad,
        categoria: nuevoProducto.categoria,
        sectorAlmacenamiento: nuevoProducto.sectorAlmacenamiento,
        codigoPersonalizado: nuevoProducto.codigoPersonalizado || undefined,
        codigoBarras: nuevoProducto.codigoBarras || undefined,
        imagenes: nuevoProducto.imagenes,
        activo: true
      };

      const response = await ApiService.crearProducto(datosUsuario!.empresaId, productoData);
      
      if (response && response.data) {
        const producto = response.data;
        
        // Mostrar mensaje de éxito
        if (nuevoProducto.sectorAlmacenamiento && nuevoProducto.sectorAlmacenamiento.trim()) {
          toast.success(`✅ Producto "${producto.nombre}" creado y asignado al sector "${nuevoProducto.sectorAlmacenamiento}" exitosamente.`);
        } else {
          toast.success(`✅ Producto "${producto.nombre}" creado exitosamente. Ahora puedes buscarlo y agregarlo al remito.`);
        }
        
        // Agregar el producto a la lista local
        setProductos(prev => [...prev, producto]);
        
        // Cerrar el modal
        cerrarModalCrearProducto();
        
        // Hacer focus en el buscador para que pueda buscarlo
        setTimeout(() => {
          if (inputBusquedaRef.current) {
            inputBusquedaRef.current.focus();
          }
        }, 500);
        
      } else {
        toast.error('Error: No se recibió respuesta del servidor');
      }
    } catch (error) {
      console.error('Error al crear producto:', error);
      toast.error('Error al crear el producto');
    } finally {
      setGuardandoProducto(false);
    }
  };

  

  const guardarRemito = async () => {
    if (!numeroRemito.trim()) {
      toast.error('El número de remito es obligatorio');
      return;
    }

    if (!fechaRemito) {
      toast.error('La fecha del remito es obligatoria');
      return;
    }

    if (detalles.length === 0) {
      toast.error('Debe agregar al menos un producto al remito');
      return;
    }

    try {
      setGuardando(true);
      
      // Crear fecha en UTC para evitar problemas de zona horaria
      // Tomar la fecha seleccionada y combinarla con la hora actual local
      const fechaSeleccionada = new Date(fechaRemito + 'T00:00:00');
      const ahora = new Date();
      
      // Obtener la hora local del usuario
      const horaLocal = ahora.getHours();
      const minutosLocal = ahora.getMinutes();
      const segundosLocal = ahora.getSeconds();
      
      // Obtener la zona horaria del usuario
      const zonaHorariaUsuario = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('🌍 Zona horaria del usuario:', zonaHorariaUsuario);
      
      // IMPORTANTE: Usar directamente los valores seleccionados por el usuario
      // NO usar el constructor Date que interpreta como UTC
      const fechaFormateada = fechaSeleccionada.getFullYear() + '-' + 
        String(fechaSeleccionada.getMonth() + 1).padStart(2, '0') + '-' + 
        String(fechaSeleccionada.getDate()).padStart(2, '0') + 'T' + 
        String(horaLocal).padStart(2, '0') + ':' + 
        String(minutosLocal).padStart(2, '0') + ':' + 
        String(segundosLocal).padStart(2, '0');
      
      // Preparar los datos del remito para la API
      const remitoData = {
        numeroRemito,
        fechaRemito: fechaFormateada, // Enviar como string local sin conversión UTC
        observaciones,
        totalProductos: detalles.reduce((total, detalle) => total + detalle.cantidad, 0),
        detalles: detalles.map(detalle => ({
          productoId: detalle.productoId,
          codigoPersonalizado: detalle.codigoPersonalizado,
          descripcion: detalle.descripcion,
          cantidad: detalle.cantidad,
          observaciones: detalle.observaciones
        })),
        zonaHoraria: zonaHorariaUsuario
      };

      console.log('📋 [DEBUG] Fecha seleccionada:', fechaRemito);
      console.log('📋 [DEBUG] Hora local del usuario:', `${horaLocal}:${minutosLocal}:${segundosLocal}`);
      console.log('📋 [DEBUG] Fecha formateada (sin conversión UTC):', fechaFormateada);
      console.log('📋 [DEBUG] Zona horaria del usuario:', zonaHorariaUsuario);
      console.log('📋 [DEBUG] Fecha actual del sistema:', new Date().toISOString());
      console.log('📋 [DEBUG] Offset de zona horaria (minutos):', new Date().getTimezoneOffset());
      console.log('📋 [DEBUG] Enviando remito:', remitoData);

      // Guardar remito usando la API
      const response = await ApiService.crearRemitoIngreso(remitoData);
      
      if (response && response.data) {
        toast.success('Remito guardado exitosamente');
        navigate('/admin/ingresos');
      } else {
        toast.error('Error al guardar el remito');
      }
    } catch (error: any) {
      console.error('Error al guardar remito:', error);
      
      // Mostrar mensaje específico del error si está disponible
      let mensajeError = 'Error al guardar el remito';
      if (error.response && error.response.data && error.response.data.error) {
        mensajeError = error.response.data.error;
      } else if (error.message) {
        mensajeError = error.message;
      }
      
      toast.error(mensajeError);
    } finally {
      setGuardando(false);
    }
  };




  const manejarScan = (codigo: string) => {
    setInputBusqueda(codigo);
    buscarProductos(codigo);
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
                onClick={() => navigate('/admin/ingresos')}
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
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                color: 'white'
              }}>
                📥
              </div>
              <div>
                <h1 style={{
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: 0
                }}>
                  Nuevo Remito de Ingreso
                </h1>
                <p style={{
                  color: '#64748b',
                  margin: 0,
                  fontSize: '0.875rem'
                }}>
                  Registra la entrada de nueva mercadería al inventario
                </p>
                <p style={{
                  color: '#059669',
                  margin: '0.25rem 0 0 0',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  💡 Presiona Escape para volver a Ingresos
                </p>
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: '1rem',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <button
                onClick={() => navigate('/admin/ingresos')}
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
                onClick={guardarRemito}
                disabled={guardando}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: guardando ? '#9ca3af' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: guardando ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: guardando ? 'none' : '0 4px 12px rgba(5, 150, 105, 0.3)'
                }}
              >
                {guardando ? '💾 Guardando...' : '💾 Guardar Remito'}
              </button>
            </div>
          </div>
        </div>

        {/* Campos de información del remito */}
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
            📋 Información del Remito
          </h2>
          
                     <div style={{
             display: 'grid',
             gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 2fr',
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
                 📅 Fecha del Remito
               </label>
               <input
                 ref={fechaRemitoRef}
                 type="date"
                 value={fechaRemito}
                 onChange={(e) => setFechaRemito(e.target.value)}
                 onKeyDown={(e) => manejarEnterCampo(e, 'numeroRemito')}
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
                 📄 Número de Remito
               </label>
               <input
                 ref={numeroRemitoRef}
                 type="text"
                 value={numeroRemito}
                 onChange={(e) => setNumeroRemito(e.target.value)}
                 onKeyDown={(e) => manejarEnterCampo(e, 'observaciones')}
                 placeholder="0000-00000000"
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
                💬 Observaciones
              </label>
              <textarea
                ref={observacionesRef}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                onKeyDown={(e) => manejarEnterCampo(e, 'busqueda')}
                placeholder="Observaciones adicionales..."
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
          {/* Panel izquierdo - Búsqueda y creación de productos */}
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
                 {!mostrarCampoCantidad && (
                   <div style={{ position: 'relative' }}>
                     <input
                       ref={inputBusquedaRef}
                       type="text"
                       placeholder="Código de barras, código personalizado o nombre..."
                       value={inputBusqueda}
                       onChange={(e) => buscarProductos(e.target.value)}
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
                           onClick={() => agregarProducto(producto)}
                           style={{
                             padding: isMobile ? '0.75rem' : '0.5rem',
                             cursor: 'pointer',
                             borderBottom: index < productosFiltrados.length - 1 ? '1px solid #f1f5f9' : 'none',
                             background: index === productoSeleccionado ? '#3b82f6' : 'white',
                             color: index === productoSeleccionado ? 'white' : '#1e293b',
                             fontSize: isMobile ? '1rem' : '0.875rem',
                             transition: 'all 0.2s ease',
                             minHeight: isMobile ? '60px' : 'auto'
                           }}
                           onMouseOver={() => setProductoSeleccionado(index)}
                         >
                           <div style={{ 
                             fontWeight: '600', 
                             color: index === productoSeleccionado ? 'white' : '#1e293b',
                             fontSize: isMobile ? '1rem' : '0.875rem',
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
                             fontSize: isMobile ? '0.875rem' : '0.75rem', 
                             color: index === productoSeleccionado ? '#e2e8f0' : '#64748b',
                             marginTop: '0.25rem'
                           }}>
                             {producto.codigoBarras && `Barras: ${producto.codigoBarras}`}
                             {producto.codigoBarras && ` • `}
                             {`Stock: ${producto.stock}`}
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
                        onKeyDown={manejarEnterCantidadTemporal}
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
                      {resultadoCalculoIngreso !== null && (
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
                          ✅ Resultado: {resultadoCalculoIngreso.toLocaleString()} unidades
                        </div>
                      )}
                      
                      {errorCalculoIngreso && (
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
                          ❌ {errorCalculoIngreso}
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

               {/* Vista previa del producto seleccionado */}
               {mostrarCampoCantidad && productoSeleccionadoTemporal && (
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
                     color: isMobile ? 'white' : 'inherit',
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
                   <div style={{ 
                     fontWeight: '600', 
                     fontSize: isMobile ? '0.9rem' : '0.75rem',
                     textAlign: isMobile ? 'center' : 'left',
                     marginTop: isMobile ? '0.5rem' : '0',
                     padding: isMobile ? '0.5rem' : '0',
                     background: isMobile ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                     borderRadius: isMobile ? '0.25rem' : '0'
                   }}>
                     {isMobile ? '👆 TOCA PARA AGREGAR' : '💡 Enter para agregar • Escape para cancelar'}
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

                         {/* Crear nuevo producto */}
             <div style={{
               background: '#fef3c7',
               borderRadius: '0.5rem',
               padding: '1rem',
               border: '1px solid #f59e0b'
             }}>
               <h4 style={{
                 fontSize: '1rem',
                 fontWeight: '600',
                 color: '#92400e',
                 margin: '0 0 0.75rem 0'
               }}>
                 ➕ Crear Nuevo Producto
               </h4>
                               <p style={{
                  fontSize: '0.875rem',
                  color: '#92400e',
                  margin: '0 0 1rem 0'
                }}>
                  Crea el producto si es nuevo, para luego poder agregarlo al remito
                </p>
                                                               <button
                   onClick={abrirModalCrearProducto}
                   style={{
                     width: '100%',
                     padding: '0.75rem',
                     background: '#f59e0b',
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
                   📝 Crear Producto
                 </button>
             </div>
          </div>

                     {/* Panel derecho - Lista de productos */}
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
               📦 Productos del Remito ({detalles.length})
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
                 <p>No hay productos agregados al remito</p>
                 <p style={{ fontSize: '0.875rem' }}>Busca y agrega productos en el panel izquierdo</p>
               </div>
             ) : (
               <div 
                 ref={listaProductosIngresoRef}
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
                         
                         {/* Cantidad y Botón eliminar en la misma línea */}
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
                                   actualizarDetalle(index, 'cantidad', nuevaCantidad);
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
                           <button
                             onClick={() => eliminarDetalle(index)}
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
               📊 Resumen del Remito
             </h2>
             
             <div style={{
               display: 'grid',
               gap: '1rem'
             }}>
               <div>
                 <label style={{
                   display: 'block',
                   fontSize: '0.875rem',
                   fontWeight: '600',
                   color: '#64748b',
                   marginBottom: '0.5rem'
                 }}>
                   🛒 Cantidad de Productos
                 </label>
                 <div style={{
                   padding: '0.75rem',
                   background: 'white',
                   border: '1px solid #e2e8f0',
                   borderRadius: '0.5rem',
                   fontSize: '0.875rem',
                   color: '#1e293b',
                   fontWeight: '500'
                 }}>
                   <span style={{ 
                     color: '#3b82f6', 
                     fontWeight: '700',
                     fontSize: '1.1rem'
                   }}>
                     {detalles.length}
                   </span>
                 </div>
               </div>
               
               <div>
                 <label style={{
                   display: 'block',
                   fontSize: '0.875rem',
                   fontWeight: '600',
                   color: '#64748b',
                   marginBottom: '0.5rem'
                 }}>
                   📦 Total de Unidades
                 </label>
                 <div style={{
                   padding: '0.75rem',
                   background: 'white',
                   border: '1px solid #e2e8f0',
                   borderRadius: '0.5rem',
                   fontSize: '0.875rem',
                   color: '#1e293b',
                   fontWeight: '500'
                 }}>
                   <span style={{ 
                     color: '#059669', 
                     fontWeight: '700',
                     fontSize: '1.1rem'
                   }}>
                     {detalles.reduce((total, detalle) => total + detalle.cantidad, 0)}
                   </span>
                 </div>
               </div>
               
                               <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#64748b',
                    marginBottom: '0.5rem'
                  }}>
                                         💰 Valor Total Estimado
                   </label>
                   <div style={{
                     padding: '0.75rem',
                     background: 'white',
                     border: '1px solid #e2e8f0',
                     borderRadius: '0.5rem',
                     fontSize: '0.875rem',
                     color: '#1e293b',
                     fontWeight: '500'
                   }}>
                     <span style={{ 
                       color: '#f59e0b', 
                       fontWeight: '700',
                       fontSize: '1.1rem'
                     }}>
                       ${detalles.reduce((total, detalle) => {
                         const producto = productos.find(p => p.id === detalle.productoId);
                         return total + (detalle.cantidad * (producto?.precio || 0));
                       }, 0).toFixed(2)}
                     </span>
                   </div>
                </div>

                {/* Resumen de cambios de stock */}
                {detalles.length > 0 && (
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#64748b',
                      marginBottom: '0.5rem'
                    }}>
                      📈 Cambios de Stock
                    </label>
                    <div style={{
                      padding: '0.75rem',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      color: '#166534',
                      maxHeight: '120px',
                      overflow: 'auto'
                    }}>
                      {detalles.map(detalle => {
                        const producto = productos.find(p => p.id === detalle.productoId);
                        if (producto) {
                          const stockActual = producto.stock;
                          const nuevoStock = stockActual + detalle.cantidad;
                          return (
                            <div key={detalle.id} style={{ marginBottom: '0.25rem' }}>
                              <strong>{producto.nombre}:</strong> {stockActual} → {nuevoStock} <span style={{ color: '#059669' }}>(+{detalle.cantidad})</span>
                            </div>
                          );
                        }
                        return (
                          <div key={detalle.id} style={{ marginBottom: '0.25rem' }}>
                            <strong>{detalle.descripcion}:</strong> <span style={{ color: '#059669' }}>(+{detalle.cantidad})</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Botón de Guardar Remito */}
                <div style={{ marginTop: '1.5rem' }}>
                  <button
                    onClick={guardarRemito}
                    disabled={guardando || detalles.length === 0}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: guardando || detalles.length === 0 ? '#9ca3af' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: guardando || detalles.length === 0 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: guardando || detalles.length === 0 ? 'none' : '0 4px 12px rgba(5, 150, 105, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {guardando ? '💾 Guardando...' : '💾 Guardar Remito'}
                  </button>
                  {detalles.length === 0 && (
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      textAlign: 'center',
                      marginTop: '0.5rem',
                      marginBottom: 0
                    }}>
                      Agrega productos para poder guardar
                    </p>
                  )}
                </div>
             </div>
           </div>
        </div>
      </div>

             {/* Scanner de código de barras */}
       <BarcodeScanner
         isOpen={mostrarScanner}
         onScan={manejarScan}
         onClose={() => setMostrarScanner(false)}
       />

       {/* Scanner de código de barras para el modal */}
       <BarcodeScanner
         isOpen={mostrarScannerModal}
         onScan={(codigo) => {
           setNuevoProducto(prev => ({ ...prev, codigoBarras: codigo }));
           setMostrarScannerModal(false);
         }}
         onClose={() => setMostrarScannerModal(false)}
         zIndex={10001}
       />

       {/* Modal de Crear Producto */}
       {mostrarModalCrearProducto && (
         <div style={{
           position: 'fixed',
           top: 0,
           left: 0,
           right: 0,
           bottom: 0,
           background: 'rgba(0, 0, 0, 0.5)',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           zIndex: 10000,
           padding: '1rem'
         }}>
           <div style={{
             background: 'white',
             borderRadius: '1rem',
             padding: '2rem',
             maxWidth: '600px',
             width: '100%',
             maxHeight: '90vh',
             overflow: 'auto',
             boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
           }}>
             <div style={{
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'space-between',
               marginBottom: '2rem'
             }}>
               <h2 style={{
                 fontSize: '1.5rem',
                 fontWeight: '600',
                 color: '#1e293b',
                 margin: 0
               }}>
                 ➕ Crear Nuevo Producto
               </h2>
               <button
                 onClick={cerrarModalCrearProducto}
                 style={{
                   background: 'none',
                   border: 'none',
                   fontSize: '1.5rem',
                   cursor: 'pointer',
                   color: '#64748b',
                   padding: '0.5rem'
                 }}
               >
                 ✕
               </button>
             </div>

             <div style={{
               display: 'grid',
               gap: '1rem'
             }}>
                               {/* Nombre */}
                <div style={{ position: 'relative' }}>
                  <label style={{
                    display: 'block',
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    fontWeight: '600',
                    color: '#64748b',
                    marginBottom: isMobile ? '0.75rem' : '0.5rem'
                  }}>
                    📝 Nombre del Producto *
                  </label>
                                     <input
                     ref={nombreProductoRef}
                     type="text"
                     value={nuevoProducto.nombre}
                     onChange={(e) => {
                       setNuevoProducto(prev => ({ ...prev, nombre: e.target.value }));
                       buscarSugerenciasNombre(e.target.value);
                     }}
                     onKeyDown={manejarTeclasNombre}
                     onFocus={() => buscarSugerenciasNombre(nuevoProducto.nombre)}
                     onBlur={() => setTimeout(() => setMostrarSugerenciasNombre(false), 200)}
                     placeholder="Nombre del producto"
                     style={{
                       width: '100%',
                       padding: isMobile ? '1rem' : '0.75rem',
                       border: '2px solid #e2e8f0',
                       borderRadius: '0.5rem',
                       fontSize: isMobile ? '1rem' : '0.875rem',
                       minHeight: isMobile ? '48px' : 'auto'
                     }}
                   />
                  {mostrarSugerenciasNombre && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      maxHeight: '200px',
                      overflow: 'auto',
                      zIndex: 1000
                    }}>
                                             {sugerenciasNombre.map((nombre, index) => (
                         <div
                           key={index}
                           onClick={() => seleccionarSugerenciaNombre(nombre)}
                           style={{
                             padding: isMobile ? '1rem' : '0.75rem',
                             cursor: 'pointer',
                             borderBottom: index < sugerenciasNombre.length - 1 ? '1px solid #f1f5f9' : 'none',
                             fontSize: isMobile ? '1rem' : '0.875rem',
                             background: index === sugerenciaSeleccionadaNombre ? '#f1f5f9' : 'white',
                             minHeight: isMobile ? '50px' : 'auto'
                           }}
                           onMouseOver={() => setSugerenciaSeleccionadaNombre(index)}
                           onMouseOut={() => setSugerenciaSeleccionadaNombre(-1)}
                         >
                           {nombre}
                         </div>
                       ))}
                    </div>
                  )}
                </div>

                               {/* Marca */}
                <div style={{ position: 'relative' }}>
                  <label style={{
                    display: 'block',
                    fontSize: isMobile ? '1rem' : '0.875rem',
                    fontWeight: '600',
                    color: '#64748b',
                    marginBottom: isMobile ? '0.75rem' : '0.5rem'
                  }}>
                    🏷️ Marca
                  </label>
                                     <input
                     ref={marcaProductoRef}
                     type="text"
                     value={nuevoProducto.marca}
                     onChange={(e) => {
                       setNuevoProducto(prev => ({ ...prev, marca: e.target.value }));
                       buscarSugerenciasMarca(e.target.value);
                     }}
                     onKeyDown={manejarTeclasMarca}
                     onFocus={() => buscarSugerenciasMarca(nuevoProducto.marca)}
                     onBlur={() => setTimeout(() => setMostrarSugerenciasMarca(false), 200)}
                     placeholder="Marca del producto"
                     style={{
                       width: '100%',
                       padding: isMobile ? '1rem' : '0.75rem',
                       border: '2px solid #e2e8f0',
                       borderRadius: '0.5rem',
                       fontSize: isMobile ? '1rem' : '0.875rem',
                       minHeight: isMobile ? '48px' : 'auto'
                     }}
                   />
                  {mostrarSugerenciasMarca && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      maxHeight: '200px',
                      overflow: 'auto',
                      zIndex: 1000
                    }}>
                                             {sugerenciasMarca.map((marca, index) => (
                         <div
                           key={index}
                           onClick={() => seleccionarSugerenciaMarca(marca)}
                           style={{
                             padding: isMobile ? '1rem' : '0.75rem',
                             cursor: 'pointer',
                             borderBottom: index < sugerenciasMarca.length - 1 ? '1px solid #f1f5f9' : 'none',
                             fontSize: isMobile ? '1rem' : '0.875rem',
                             background: index === sugerenciaSeleccionadaMarca ? '#f1f5f9' : 'white',
                             minHeight: isMobile ? '50px' : 'auto'
                           }}
                           onMouseOver={() => setSugerenciaSeleccionadaMarca(index)}
                           onMouseOut={() => setSugerenciaSeleccionadaMarca(-1)}
                         >
                           {marca}
                         </div>
                       ))}
                    </div>
                  )}
                </div>

               {/* Código Personalizado */}
               <div>
                 <label style={{
                   display: 'block',
                   fontSize: '0.875rem',
                   fontWeight: '600',
                   color: '#64748b',
                   marginBottom: '0.5rem'
                 }}>
                   🏷️ Código Personalizado
                 </label>
                 <input
                   ref={codigoPersonalizadoRef}
                   type="text"
                   value={nuevoProducto.codigoPersonalizado}
                   onChange={(e) => setNuevoProducto(prev => ({ ...prev, codigoPersonalizado: e.target.value }))}
                   placeholder="Código interno"
                   style={{
                     width: '100%',
                     padding: '0.75rem',
                     border: '2px solid #e2e8f0',
                     borderRadius: '0.5rem',
                     fontSize: '0.875rem'
                   }}
                 />
               </div>

               {/* Código de Barras */}
               <div>
                 <label style={{
                   display: 'block',
                   fontSize: '0.875rem',
                   fontWeight: '600',
                   color: '#64748b',
                   marginBottom: '0.5rem'
                 }}>
                   📊 Código de Barras
                 </label>
                 <div style={{ position: 'relative' }}>
                   <input
                     ref={codigoBarrasRef}
                     type="text"
                     value={nuevoProducto.codigoBarras}
                     onChange={(e) => setNuevoProducto(prev => ({ ...prev, codigoBarras: e.target.value }))}
                     placeholder="Código de barras"
                     style={{
                       width: '100%',
                       padding: '0.75rem',
                       paddingRight: '3rem',
                       border: '2px solid #e2e8f0',
                       borderRadius: '0.5rem',
                       fontSize: '0.875rem'
                     }}
                   />
                   <button
                     type="button"
                     onClick={() => setMostrarScannerModal(true)}
                     style={{
                       position: 'absolute',
                       right: '0.5rem',
                       top: '50%',
                       transform: 'translateY(-50%)',
                       background: '#3b82f6',
                       color: 'white',
                       border: 'none',
                       borderRadius: '0.25rem',
                       padding: '0.5rem',
                       cursor: 'pointer',
                       fontSize: '0.875rem',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'center'
                     }}
                     title="Escanear código de barras"
                   >
                     📷
                   </button>
                 </div>
               </div>

                               {/* Categoría */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#64748b',
                    marginBottom: '0.5rem'
                  }}>
                    📂 Categoría
                  </label>
                  <select
                    ref={categoriaProductoRef}
                    name="categoria"
                    value={nuevoProducto.categoria}
                    onChange={manejarCambioSelect}
                    onKeyDown={manejarTeclasCategoria}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Selecciona una categoría</option>
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
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        marginTop: '0.5rem'
                      }}
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
                </div>

               {/* Descripción */}
               <div>
                 <label style={{
                   display: 'block',
                   fontSize: '0.875rem',
                   fontWeight: '600',
                   color: '#64748b',
                   marginBottom: '0.5rem'
                 }}>
                   📝 Descripción
                 </label>
                 <textarea
                   ref={descripcionProductoRef}
                   value={nuevoProducto.descripcion}
                   onChange={(e) => setNuevoProducto(prev => ({ ...prev, descripcion: e.target.value }))}
                   placeholder="Descripción del producto"
                   rows={3}
                   style={{
                     width: '100%',
                     padding: '0.75rem',
                     border: '2px solid #e2e8f0',
                     borderRadius: '0.5rem',
                     fontSize: '0.875rem',
                     resize: 'none'
                   }}
                 />
               </div>

               {/* Precio */}
               <div>
                 <label style={{
                   display: 'block',
                   fontSize: '0.875rem',
                   fontWeight: '600',
                   color: '#64748b',
                   marginBottom: '0.5rem'
                 }}>
                   💰 Precio
                 </label>
                 <input
                   ref={precioProductoRef}
                   type="number"
                   value={nuevoProducto.precio}
                   onChange={(e) => setNuevoProducto(prev => ({ ...prev, precio: e.target.value }))}
                   placeholder="0.00"
                   step="0.01"
                   min="0"
                   style={{
                     width: '100%',
                     padding: '0.75rem',
                     border: '2px solid #e2e8f0',
                     borderRadius: '0.5rem',
                     fontSize: '0.875rem'
                   }}
                 />
               </div>

               {/* Unidad */}
               <div>
                 <label style={{
                   display: 'block',
                   fontSize: '0.875rem',
                   fontWeight: '600',
                   color: '#64748b',
                   marginBottom: '0.5rem'
                 }}>
                   📏 Unidad
                 </label>
                 <input
                   ref={unidadProductoRef}
                   type="text"
                   value={nuevoProducto.unidad}
                   onChange={(e) => setNuevoProducto(prev => ({ ...prev, unidad: e.target.value }))}
                   placeholder="Unidad de medida"
                   style={{
                     width: '100%',
                     padding: '0.75rem',
                     border: '2px solid #e2e8f0',
                     borderRadius: '0.5rem',
                     fontSize: '0.875rem'
                   }}
                 />
               </div>


               

             </div>

             <div style={{
               display: 'flex',
               gap: '1rem',
               marginTop: '2rem',
               justifyContent: 'flex-end'
             }}>
               <button
                 onClick={cerrarModalCrearProducto}
                 style={{
                   padding: '0.75rem 1.5rem',
                   background: '#64748b',
                   color: 'white',
                   border: 'none',
                   borderRadius: '0.5rem',
                   fontSize: '0.875rem',
                   fontWeight: '600',
                   cursor: 'pointer'
                 }}
               >
                 Cancelar
               </button>
               <button
                 onClick={crearNuevoProducto}
                 disabled={guardandoProducto}
                 style={{
                   padding: '0.75rem 1.5rem',
                   background: guardandoProducto ? '#9ca3af' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                   color: 'white',
                   border: 'none',
                   borderRadius: '0.5rem',
                   fontSize: '0.875rem',
                   fontWeight: '600',
                   cursor: guardandoProducto ? 'not-allowed' : 'pointer',
                   transition: 'all 0.3s ease'
                 }}
               >
                 {guardandoProducto ? '💾 Creando...' : '💾 Crear Producto'}
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}
