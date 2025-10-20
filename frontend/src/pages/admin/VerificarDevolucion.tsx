import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
import { formatearFecha, formatearFechaCorta, formatearFechaConHora } from '../../utils/dateUtils';

interface PlanillaDevolucion {
  id: number;
  numeroPlanilla: string;
  fechaPlanilla: string;
  observaciones?: string;
  transporte?: string;
  totalProductos: number;
  fechaCreacion: string;
  fechaActualizacion: string;
  detalles: DetallePlanillaDevolucion[];
  estado: string;
  usuarioVerificacion?: string;
  fechaVerificacion?: string;
}

interface DetallePlanillaDevolucion {
  id: number;
  productoId?: number;
  numeroPersonalizado?: string;
  descripcion: string;
  cantidad: number;
  observaciones?: string;
  estadoProducto?: string;
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

const ESTADOS_PRODUCTO = [
  { value: 'BUEN_ESTADO', label: 'Buen Estado', color: '#10b981' },
  { value: 'ROTO', label: 'Roto', color: '#ef4444' },
  { value: 'MAL_ESTADO', label: 'Mal Estado', color: '#f59e0b' },
  { value: 'DEFECTUOSO', label: 'Defectuoso', color: '#8b5cf6' }
];

export default function VerificarDevolucion() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile } = useResponsive();
  
  console.log('🔍 [DEBUG] VerificarDevolucion - Componente montado');
  console.log('🔍 [DEBUG] ID del parámetro:', id);
  console.log('🔍 [DEBUG] datosUsuario en render:', datosUsuario);
  
  const [planilla, setPlanilla] = useState<PlanillaDevolucion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [detallesEditados, setDetallesEditados] = useState<DetallePlanillaDevolucion[]>([]);
  const [productosAprobados, setProductosAprobados] = useState<Set<number>>(new Set());
  
  // Log cuando cambie el estado de detallesEditados
  useEffect(() => {
    console.log('🔍 [DEBUG] detallesEditados cambió:', detallesEditados);
    console.log('🔍 [DEBUG] Cantidad de detalles:', detallesEditados.length);
  }, [detallesEditados]);
  const [mostrarAgregarProducto, setMostrarAgregarProducto] = useState(false);
  const [mostrarEditarProducto, setMostrarEditarProducto] = useState(false);
  const [productoEditando, setProductoEditando] = useState<{index: number, detalle: DetallePlanillaDevolucion} | null>(null);
  const [nuevoProducto, setNuevoProducto] = useState({
    descripcion: '',
    cantidad: 1,
    numeroPersonalizado: '',
    observaciones: '',
    estadoProducto: 'BUEN_ESTADO'
  });
  
  // Estados para el buscador avanzado en el modal de edición
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([]);
  const [mostrarProductos, setMostrarProductos] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(-1);
  const [inputBusqueda, setInputBusqueda] = useState('');
  const [productoSeleccionadoTemporal, setProductoSeleccionadoTemporal] = useState<Producto | null>(null);
  const [productoYaSeleccionado, setProductoYaSeleccionado] = useState(false);

  console.log('🔍 [DEBUG] Productos cargados actualmente:', productos.length);

  useEffect(() => {
    console.log('🔍 [DEBUG] ===== PRIMER useEffect EJECUTADO =====');
    console.log('🔍 [DEBUG] VerificarDevolucion - useEffect ejecutado');
    console.log('🔍 [DEBUG] ID recibido:', id);
    console.log('🔍 [DEBUG] datosUsuario:', datosUsuario);
    console.log('🔍 [DEBUG] datosUsuario?.empresaId:', datosUsuario?.empresaId);
    
    if (id && datosUsuario?.empresaId) {
      console.log('🔍 [DEBUG] Condiciones cumplidas, cargando planilla y productos...');
      cargarPlanilla();
      cargarProductos();
    } else {
      console.log('🔍 [DEBUG] No se puede cargar - ID o datosUsuario faltantes');
      console.log('🔍 [DEBUG] ID existe?', !!id);
      console.log('🔍 [DEBUG] datosUsuario existe?', !!datosUsuario);
      console.log('🔍 [DEBUG] empresaId existe?', !!datosUsuario?.empresaId);
    }
  }, [id, datosUsuario]);

  // useEffect separado para cargar productos cuando datosUsuario esté disponible
  useEffect(() => {
    console.log('🔍 [DEBUG] useEffect datosUsuario - datosUsuario cambió:', datosUsuario);
    if (datosUsuario?.empresaId) {
      console.log('🔍 [DEBUG] datosUsuario disponible, cargando productos...');
      cargarProductos();
    }
  }, [datosUsuario]);

  // useEffect de prueba para verificar que los useEffect funcionan
  useEffect(() => {
    console.log('🔍 [DEBUG] useEffect de prueba - se ejecutó');
  }, []);

  // useEffect para cargar productos cuando el componente esté completamente inicializado
  useEffect(() => {
    console.log('🔍 [DEBUG] useEffect carga productos - datosUsuario:', datosUsuario);
    console.log('🔍 [DEBUG] useEffect carga productos - productos.length:', productos.length);
    
    if (datosUsuario?.empresaId && productos.length === 0) {
      console.log('🔍 [DEBUG] Cargando productos desde useEffect...');
      cargarProductos();
    }
  }, [datosUsuario, productos.length]);

  const cargarPlanilla = async () => {
    console.log('🔍 [DEBUG] cargarPlanilla - Iniciando carga de planilla');
    console.log('🔍 [DEBUG] cargarPlanilla - ID a cargar:', id);
    
    try {
      setCargando(true);
      console.log('🔍 [DEBUG] cargarPlanilla - Llamando a ApiService.obtenerPlanillaDevolucionPorId');
      const response = await ApiService.obtenerPlanillaDevolucionPorId(parseInt(id!));
      
      console.log('🔍 [DEBUG] Respuesta completa del backend:', response);
      
      if (response && response.planilla) {
        const planillaData = response.planilla;
        console.log('🔍 [DEBUG] Planilla data:', planillaData);
        console.log('🔍 [DEBUG] Detalles de la planilla:', planillaData.detalles);
        
        // Verificar que la planilla esté pendiente de verificación
        if (planillaData.estado !== 'PENDIENTE_VERIFICACION') {
          toast.error('Esta planilla ya ha sido verificada');
          navigate('/admin/descarga-devoluciones');
          return;
        }
        
        setPlanilla(planillaData);
        
        // Verificar que detalles existe y es un array
        console.log('🔍 [DEBUG] Verificando detalles...');
        console.log('🔍 [DEBUG] planillaData.detalles:', planillaData.detalles);
        console.log('🔍 [DEBUG] Tipo de detalles:', typeof planillaData.detalles);
        console.log('🔍 [DEBUG] Es array?', Array.isArray(planillaData.detalles));
        
        if (planillaData.detalles && Array.isArray(planillaData.detalles)) {
          console.log('🔍 [DEBUG] Detalles válidos encontrados, estableciendo estado');
          setDetallesEditados([...planillaData.detalles]);
        } else {
          console.log('🔍 [DEBUG] No hay detalles o no es un array, inicializando vacío');
          setDetallesEditados([]);
        }
      } else {
        console.log('🔍 [DEBUG] No se encontró planilla en la respuesta');
        toast.error('No se pudo cargar la planilla');
        navigate('/admin/descarga-devoluciones');
      }
    } catch (error) {
      console.error('Error al cargar planilla:', error);
      toast.error('Error al cargar la planilla');
      navigate('/admin/descarga-devoluciones');
    } finally {
      setCargando(false);
    }
  };

  const cargarProductos = async () => {
    console.log('🔍 [DEBUG] cargarProductos - Iniciando carga de productos');
    console.log('🔍 [DEBUG] datosUsuario?.empresaId:', datosUsuario?.empresaId);
    
    try {
      if (datosUsuario?.empresaId) {
        console.log('🔍 [DEBUG] Llamando a ApiService.obtenerTodosLosProductos');
        const response = await ApiService.obtenerTodosLosProductos(datosUsuario.empresaId);
        console.log('🔍 [DEBUG] Respuesta de productos:', response);
        
        if (response && response.data) {
          console.log('🔍 [DEBUG] Productos encontrados:', response.data.length);
          console.log('🔍 [DEBUG] Primeros 3 productos:', response.data.slice(0, 3));
          setProductos(response.data);
        } else {
          console.log('🔍 [DEBUG] No se encontraron productos en la respuesta');
          console.log('🔍 [DEBUG] Respuesta completa:', response);
        }
      } else {
        console.log('🔍 [DEBUG] No hay empresaId disponible');
      }
    } catch (error) {
      console.error('❌ Error al cargar productos:', error);
    }
  };

  // Función para filtrar productos
  useEffect(() => {
    console.log('🔍 [DEBUG] useEffect filtrado - inputBusqueda:', inputBusqueda);
    console.log('🔍 [DEBUG] useEffect filtrado - productos disponibles:', productos.length);
    
    if (inputBusqueda.trim()) {
      console.log('🔍 [DEBUG] Filtrando productos con búsqueda:', inputBusqueda);
      const filtrados = productos.filter(producto => {
        const matchCodigo = producto.codigoPersonalizado && producto.codigoPersonalizado.toLowerCase().includes(inputBusqueda.toLowerCase());
        const matchBarras = producto.codigoBarras && producto.codigoBarras.includes(inputBusqueda);
        const matchNombre = producto.nombre.toLowerCase().includes(inputBusqueda.toLowerCase());
        
        return matchCodigo || matchBarras || matchNombre;
      });
      
      // Ordenar resultados: primero códigos personalizados, luego códigos de barras, luego nombres
      const productosOrdenados = filtrados.sort((a, b) => {
        const busqueda = inputBusqueda.toLowerCase();
        const aCodigo = a.codigoPersonalizado?.toLowerCase() || '';
        const bCodigo = b.codigoPersonalizado?.toLowerCase() || '';
        const aBarras = a.codigoBarras || '';
        const bBarras = b.codigoBarras || '';
        const aNombre = a.nombre.toLowerCase();
        const bNombre = b.nombre.toLowerCase();
        
        // Prioridad: código personalizado exacto > código personalizado parcial > código de barras > nombre
        if (aCodigo === busqueda && bCodigo !== busqueda) return -1;
        if (bCodigo === busqueda && aCodigo !== busqueda) return 1;
        if (aCodigo.startsWith(busqueda) && !bCodigo.startsWith(busqueda)) return -1;
        if (bCodigo.startsWith(busqueda) && !aCodigo.startsWith(busqueda)) return 1;
        if (aBarras.includes(inputBusqueda) && !bBarras.includes(inputBusqueda)) return -1;
        if (bBarras.includes(inputBusqueda) && !aBarras.includes(inputBusqueda)) return 1;
        
        return aNombre.localeCompare(bNombre);
      });
      
      console.log('🔍 [DEBUG] Productos filtrados encontrados:', productosOrdenados.length);
      console.log('🔍 [DEBUG] Estableciendo mostrarProductos = true');
      setProductosFiltrados(productosOrdenados);
      setMostrarProductos(true);
      setProductoSeleccionado(-1);
    } else {
      console.log('🔍 [DEBUG] Búsqueda vacía, ocultando lista');
      setProductosFiltrados([]);
      setMostrarProductos(false);
      setProductoSeleccionado(-1);
    }
  }, [inputBusqueda, productos]);

  // Manejar navegación por teclado en búsqueda
  const manejarTeclasBusqueda = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Si hay productos y se ha seleccionado uno, seleccionar el producto
      if (mostrarProductos && productosFiltrados.length > 0 && productoSeleccionado >= 0 && productoSeleccionado < productosFiltrados.length) {
        console.log('🔍 [DEBUG] Seleccionando producto con Enter');
        seleccionarProducto(productosFiltrados[productoSeleccionado]);
        return;
      }
      
      // Si no hay productos filtrados o ya hay un producto seleccionado, pasar al campo de cantidad
      if (!mostrarProductos || productosFiltrados.length === 0 || productoYaSeleccionado) {
        console.log('🔍 [DEBUG] Saltando a cantidad');
        const cantidadInput = document.querySelector('input[type="text"][placeholder*="Ej: 5"]') as HTMLInputElement;
        if (cantidadInput) {
          cantidadInput.focus();
        }
        return;
      }
    }

    // Solo manejar flechas si hay productos
    console.log('🔍 [DEBUG] Navegación con flechas:', {
      mostrarProductos,
      productosFiltradosLength: productosFiltrados.length,
      productoYaSeleccionado,
      key: e.key
    });
    
    if (!mostrarProductos || productosFiltrados.length === 0) {
      console.log('🔍 [DEBUG] No se puede navegar con flechas - no hay productos');
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        console.log('🔍 [DEBUG] Flecha abajo presionada');
        setProductoSeleccionado(prev => 
          prev < productosFiltrados.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        console.log('🔍 [DEBUG] Flecha arriba presionada');
        setProductoSeleccionado(prev => 
          prev > 0 ? prev - 1 : productosFiltrados.length - 1
        );
        break;
      case 'Escape':
        setMostrarProductos(false);
        setProductoSeleccionado(-1);
        break;
    }
  };

  const seleccionarProducto = (producto: Producto) => {
    setProductoSeleccionadoTemporal(producto);
    setNuevoProducto(prev => ({
      ...prev,
      descripcion: producto.nombre,
      numeroPersonalizado: producto.codigoPersonalizado || ''
    }));
    setMostrarProductos(false);
    setProductoSeleccionado(-1);
    setInputBusqueda('');
    setProductoYaSeleccionado(true);
    console.log('🔍 [DEBUG] Producto seleccionado, marcando como seleccionado');
  };

  const actualizarDetalle = (index: number, campo: string, valor: any) => {
    const nuevosDetalles = [...detallesEditados];
    nuevosDetalles[index] = {
      ...nuevosDetalles[index],
      [campo]: valor
    };
    setDetallesEditados(nuevosDetalles);
  };

  const eliminarDetalle = (index: number) => {
    const nuevosDetalles = detallesEditados.filter((_, i) => i !== index);
    setDetallesEditados(nuevosDetalles);
    
    // Remover de productos aprobados si estaba aprobado
    const detalleEliminado = detallesEditados[index];
    if (detalleEliminado && productosAprobados.has(detalleEliminado.id)) {
      const nuevosAprobados = new Set(productosAprobados);
      nuevosAprobados.delete(detalleEliminado.id);
      setProductosAprobados(nuevosAprobados);
    }
  };

  const aprobarProducto = (detalle: DetallePlanillaDevolucion) => {
    const nuevosAprobados = new Set(productosAprobados);
    nuevosAprobados.add(detalle.id);
    setProductosAprobados(nuevosAprobados);
    toast.success('Producto aprobado');
  };

  const desaprobarProducto = (detalle: DetallePlanillaDevolucion) => {
    const nuevosAprobados = new Set(productosAprobados);
    nuevosAprobados.delete(detalle.id);
    setProductosAprobados(nuevosAprobados);
    toast.success('Aprobación removida');
  };

  const abrirModalEditar = (index: number) => {
    const detalle = detallesEditados[index];
    setProductoEditando({ index, detalle });
    
    // Inicializar el estado del formulario con los datos del producto
    setNuevoProducto({
      descripcion: detalle.descripcion,
      cantidad: detalle.cantidad,
      numeroPersonalizado: detalle.numeroPersonalizado || '',
      observaciones: detalle.observaciones || '',
      estadoProducto: detalle.estadoProducto || 'BUEN_ESTADO'
    });
    
    // Inicializar el buscador con el nombre del producto
    setInputBusqueda(detalle.descripcion);
    setProductoSeleccionadoTemporal(null);
    setProductoYaSeleccionado(false); // Resetear para permitir navegación
    setProductoSeleccionado(-1); // Resetear selección
    
    setMostrarEditarProducto(true);
    
    // Enfocar el buscador después de que se abra el modal
    setTimeout(() => {
      const buscadorInput = document.querySelector('input[placeholder*="Código de barras"]') as HTMLInputElement;
      if (buscadorInput) {
        buscadorInput.focus();
        buscadorInput.select();
      }
    }, 100);
  };

  const cerrarModalEditar = () => {
    setMostrarEditarProducto(false);
    setProductoEditando(null);
  };

  const abrirModalAgregar = () => {
    // Resetear el estado del formulario
    setNuevoProducto({
      descripcion: '',
      cantidad: 1,
      numeroPersonalizado: '',
      observaciones: '',
      estadoProducto: 'BUEN_ESTADO'
    });
    
    // Resetear el buscador
    setInputBusqueda('');
    setProductoSeleccionadoTemporal(null);
    setProductoYaSeleccionado(false); // Resetear para permitir navegación
    setProductoSeleccionado(-1); // Resetear selección
    
    setMostrarAgregarProducto(true);
    
    // Enfocar el buscador después de que se abra el modal
    setTimeout(() => {
      const buscadorInput = document.querySelector('input[placeholder*="Código de barras"]') as HTMLInputElement;
      if (buscadorInput) {
        buscadorInput.focus();
      }
    }, 100);
  };

  const guardarEdicionProducto = () => {
    if (productoEditando) {
      // Asegurar que la cantidad sea un número
      let cantidadFinal = 1;
      if (typeof nuevoProducto.cantidad === 'string') {
        try {
          const resultado = eval(nuevoProducto.cantidad);
          if (typeof resultado === 'number' && !isNaN(resultado) && resultado > 0) {
            cantidadFinal = Math.floor(resultado);
          } else {
            const numero = parseInt(nuevoProducto.cantidad);
            cantidadFinal = !isNaN(numero) && numero > 0 ? numero : 1;
          }
        } catch (error) {
          const numero = parseInt(nuevoProducto.cantidad);
          cantidadFinal = !isNaN(numero) && numero > 0 ? numero : 1;
        }
      } else {
        cantidadFinal = nuevoProducto.cantidad;
      }

      const nuevosDetalles = [...detallesEditados];
      nuevosDetalles[productoEditando.index] = {
        ...productoEditando.detalle,
        descripcion: nuevoProducto.descripcion,
        cantidad: cantidadFinal,
        numeroPersonalizado: nuevoProducto.numeroPersonalizado,
        observaciones: nuevoProducto.observaciones,
        estadoProducto: nuevoProducto.estadoProducto
      };
      setDetallesEditados(nuevosDetalles);
      cerrarModalEditar();
    }
  };

  // Manejar teclas en campo de cantidad
  const manejarTeclasCantidad = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Pasar al campo de estado
      const estadoSelect = document.querySelector('select') as HTMLSelectElement;
      if (estadoSelect) {
        estadoSelect.focus();
      }
    }
  };

  // Manejar teclas en campo de estado
  const manejarTeclasEstado = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Determinar qué botón enfocar según el modal activo
      let botonGuardar: HTMLButtonElement | null = null;
      
      if (productoEditando) {
        // Modal de editar
        botonGuardar = document.getElementById('boton-guardar-edicion') as HTMLButtonElement;
        console.log('🔍 [DEBUG] Modal de editar - enfocando botón de guardar cambios');
      } else {
        // Modal de agregar
        botonGuardar = document.getElementById('boton-agregar-producto') as HTMLButtonElement;
        console.log('🔍 [DEBUG] Modal de agregar - enfocando botón de agregar producto');
      }
      
      if (botonGuardar) {
        botonGuardar.focus();
      } else {
        console.log('🔍 [DEBUG] No se encontró el botón correspondiente');
      }
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const select = e.target as HTMLSelectElement;
      const options = Array.from(select.options);
      const currentIndex = options.findIndex(option => option.value === select.value);
      
      if (e.key === 'ArrowUp') {
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        select.value = options[prevIndex].value;
        setNuevoProducto(prev => ({ ...prev, estadoProducto: options[prevIndex].value }));
      } else {
        const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        select.value = options[nextIndex].value;
        setNuevoProducto(prev => ({ ...prev, estadoProducto: options[nextIndex].value }));
      }
    }
  };

  // Manejar teclas en botón de guardar
  const manejarTeclasBotonGuardar = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Determinar si es el modal de editar o agregar
      if (productoEditando) {
        console.log('🔍 [DEBUG] Enter presionado en botón de guardar, ejecutando guardarEdicionProducto');
        guardarEdicionProducto();
      } else {
        console.log('🔍 [DEBUG] Enter presionado en botón de agregar, ejecutando agregarProducto');
        agregarProducto();
      }
    }
  };

  const agregarProducto = () => {
    if (!nuevoProducto.descripcion.trim()) {
      toast.error('La descripción es obligatoria');
      return;
    }

    // Asegurar que la cantidad sea un número
    let cantidadFinal = 1;
    if (typeof nuevoProducto.cantidad === 'string') {
      try {
        const resultado = eval(nuevoProducto.cantidad);
        if (typeof resultado === 'number' && !isNaN(resultado) && resultado > 0) {
          cantidadFinal = Math.floor(resultado);
        } else {
          const numero = parseInt(nuevoProducto.cantidad);
          cantidadFinal = !isNaN(numero) && numero > 0 ? numero : 1;
        }
      } catch (error) {
        const numero = parseInt(nuevoProducto.cantidad);
        cantidadFinal = !isNaN(numero) && numero > 0 ? numero : 1;
      }
    } else {
      cantidadFinal = nuevoProducto.cantidad;
    }

    const nuevoDetalle: DetallePlanillaDevolucion = {
      id: Date.now(), // ID temporal
      productoId: productoSeleccionadoTemporal?.id, // Agregar el ID del producto seleccionado
      descripcion: nuevoProducto.descripcion,
      cantidad: cantidadFinal,
      numeroPersonalizado: nuevoProducto.numeroPersonalizado || undefined,
      observaciones: nuevoProducto.observaciones || undefined,
      estadoProducto: nuevoProducto.estadoProducto,
      fechaCreacion: new Date().toISOString()
    };

    console.log('🔍 [FRONTEND] Producto seleccionado temporal:', productoSeleccionadoTemporal);
    console.log('🔍 [FRONTEND] Nuevo detalle creado:', nuevoDetalle);

    setDetallesEditados([...detallesEditados, nuevoDetalle]);
    setNuevoProducto({
      descripcion: '',
      cantidad: 1,
      numeroPersonalizado: '',
      observaciones: '',
      estadoProducto: 'BUEN_ESTADO'
    });
    setMostrarAgregarProducto(false);
    toast.success('Producto agregado');
  };

  const guardarCambios = async () => {
    try {
      setGuardando(true);
      
      const dto = {
        observaciones: planilla?.observaciones,
        transporte: planilla?.transporte,
        detalles: detallesEditados.map(detalle => ({
          id: detalle.id > 1000000 ? undefined : detalle.id, // IDs temporales se envían como undefined
          productoId: detalle.productoId, // Incluir el ID del producto
          descripcion: detalle.descripcion,
          cantidad: detalle.cantidad,
          numeroPersonalizado: detalle.numeroPersonalizado,
          observaciones: detalle.observaciones,
          estadoProducto: detalle.estadoProducto
        }))
      };

      console.log('🔍 [FRONTEND] Enviando DTO al backend:', JSON.stringify(dto, null, 2));
      console.log('🔍 [FRONTEND] Detalles editados:', detallesEditados);

      await ApiService.editarDetallesPlanillaDevolucion(parseInt(id!), dto);
      toast.success('Cambios guardados exitosamente');
      
      // Recargar la planilla
      await cargarPlanilla();
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      toast.error('Error al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  const finalizarVerificacion = async () => {
    try {
      setGuardando(true);
      
      // Primero guardar los cambios
      await guardarCambios();
      
      // Luego finalizar la verificación
      await ApiService.finalizarVerificacionPlanillaDevolucion(parseInt(id!));
      toast.success('Verificación finalizada exitosamente');
      
      // Volver a la lista de devoluciones
      navigate('/admin/descarga-devoluciones');
    } catch (error) {
      console.error('Error al finalizar verificación:', error);
      toast.error('Error al finalizar la verificación');
    } finally {
      setGuardando(false);
    }
  };

  const obtenerColorEstado = (estado: string) => {
    const estadoObj = ESTADOS_PRODUCTO.find(e => e.value === estado);
    return estadoObj ? estadoObj.color : '#6b7280';
  };

  const obtenerTextoEstado = (estado: string) => {
    const estadoObj = ESTADOS_PRODUCTO.find(e => e.value === estado);
    return estadoObj ? estadoObj.label : estado;
  };

  if (cargando) {
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
          padding: '2rem',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⏳</div>
          <div>Cargando planilla de devolución...</div>
        </div>
      </div>
    );
  }

  if (!planilla) {
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
          padding: '2rem',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>❌</div>
          <div>Planilla no encontrada</div>
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
        empresaNombre={datosUsuario.empresaNombre}
        nombreAdministrador={datosUsuario.nombre}
      />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: isMobile ? '8rem 1rem 1rem 1rem' : '7rem 2rem 2rem 2rem'
      }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: isMobile ? '16px' : '24px',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          border: '2px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div>
              <h1 style={{
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: '700',
                color: '#1e293b',
                margin: '0 0 0.5rem 0'
              }}>
                ✅ Verificar Devolución
              </h1>
              <p style={{
                color: '#64748b',
                margin: 0,
                fontSize: '1rem'
              }}>
                Revisa y verifica los productos devueltos
              </p>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => navigate('/admin/descarga-devoluciones')}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                ← Volver
              </button>
            </div>
          </div>

          {/* Información de la planilla */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            padding: '1rem',
            background: '#f8fafc',
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0'
          }}>
            <div>
              <strong>📋 Número:</strong> {planilla.numeroPlanilla}
            </div>
            <div>
              <strong>📅 Fecha:</strong> {formatearFechaConHora(planilla.fechaPlanilla)}
            </div>
            <div>
              <strong>📦 Total Productos:</strong> {detallesEditados.length}
            </div>
            <div>
              <strong>🔢 Total Unidades:</strong> {detallesEditados.reduce((sum, d) => sum + d.cantidad, 0)}
            </div>
            {planilla.transporte && (
              <div>
                <strong>🚚 Transporte:</strong> {planilla.transporte}
              </div>
            )}
            {planilla.observaciones && (
              <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                <strong>📝 Observaciones:</strong> {planilla.observaciones}
              </div>
            )}
          </div>
        </div>

        {/* Lista de productos */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: isMobile ? '16px' : '24px',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          border: '2px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#1e293b',
              margin: 0
            }}>
              📦 Productos Devueltos
            </h2>
            
            <button
              onClick={() => abrirModalAgregar()}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              ➕ Agregar Producto
            </button>
          </div>

          {/* Lista de productos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {detallesEditados.map((detalle, index) => (
              <div
                key={index}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  background: '#f8fafc',
                  position: 'relative'
                }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr 1fr auto auto',
                  gap: '1rem',
                  alignItems: 'center'
                }}>
                  {/* Código */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                      Código
                    </label>
                    <div style={{
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      background: '#f9fafb',
                      color: '#374151'
                    }}>
                      {detalle.numeroPersonalizado || 'Sin código'}
                    </div>
                  </div>

                  {/* Nombre */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                      Nombre
                    </label>
                    <div style={{
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      background: '#f9fafb',
                      color: '#374151'
                    }}>
                      {detalle.descripcion}
                    </div>
                  </div>

                  {/* Cantidad */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                      Cantidad
                    </label>
                    <div style={{
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      background: '#f9fafb',
                      color: '#374151',
                      textAlign: 'center',
                      fontWeight: '600'
                    }}>
                      {detalle.cantidad}
                    </div>
                  </div>

                  {/* Estado del producto */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                      background: detalle.estadoProducto === 'BUEN_ESTADO' ? '#10b981' : 
                                 detalle.estadoProducto === 'ROTO' ? '#ef4444' : 
                                 detalle.estadoProducto === 'MAL_ESTADO' ? '#f59e0b' : '#8b5cf6',
                      color: 'white',
                      borderRadius: '0.375rem',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      {detalle.estadoProducto === 'BUEN_ESTADO' ? '✅ En buen estado' :
                       detalle.estadoProducto === 'ROTO' ? '💔 Roto' :
                       detalle.estadoProducto === 'MAL_ESTADO' ? '⚠️ Mal Estado' : '❓ Defectuoso'}
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => eliminarDetalle(index)}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Eliminar producto"
                    >
                      🗑️
                    </button>
                    <button
                      onClick={() => abrirModalEditar(index)}
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Editar producto"
                    >
                      ✏️
                    </button>
                    {productosAprobados.has(detalle.id) ? (
                      <button
                        onClick={() => desaprobarProducto(detalle)}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          padding: '0.5rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Desaprobar producto"
                      >
                        ✅
                      </button>
                    ) : (
                      <button
                        onClick={() => aprobarProducto(detalle)}
                        style={{
                          background: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          padding: '0.5rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Aprobar producto"
                      >
                        ⚠️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {detallesEditados.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#64748b'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📦</div>
                <div>No hay productos en esta devolución</div>
              </div>
            )}
          </div>
        </div>

        {/* Modal para agregar producto */}
        {mostrarAgregarProducto && (
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
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: isMobile ? '20px' : '32px',
              width: isMobile ? '90%' : '500px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
            }}>
              <h3 style={{
                margin: '0 0 24px 0',
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937',
                textAlign: 'center'
              }}>
                ➕ Agregar Producto
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Buscador de productos */}
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                    Buscar Producto *
                  </label>
                  <input
                    type="text"
                    value={inputBusqueda}
                    onChange={(e) => setInputBusqueda(e.target.value)}
                    onKeyDown={manejarTeclasBusqueda}
                    placeholder="Código de barras, código personalizado o nombre..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                  
                  {/* Lista de productos filtrados */}
                  {mostrarProductos && productosFiltrados.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '2px solid #3b82f6',
                      borderRadius: '0.5rem',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
                      zIndex: 9999,
                      maxHeight: '300px',
                      overflow: 'auto',
                      marginTop: '0.5rem'
                    }}>
                      {productosFiltrados.map((producto, index) => (
                        <div
                          key={producto.id}
                          onClick={() => seleccionarProducto(producto)}
                          style={{
                            padding: '0.75rem',
                            cursor: 'pointer',
                            borderBottom: index < productosFiltrados.length - 1 ? '1px solid #f1f5f9' : 'none',
                            background: index === productoSeleccionado ? '#3b82f6' : 'white',
                            color: index === productoSeleccionado ? 'white' : '#1e293b',
                            fontSize: '0.875rem',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem'
                          }}
                        >
                          <div style={{ fontWeight: '600' }}>
                            {producto.nombre}
                          </div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                            {producto.codigoPersonalizado && `Código: ${producto.codigoPersonalizado}`}
                            {producto.codigoBarras && ` • Barras: ${producto.codigoBarras}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Mensaje cuando no hay productos */}
                  {mostrarProductos && productosFiltrados.length === 0 && inputBusqueda.trim() !== '' && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: '#fef2f2',
                      border: '2px solid #ef4444',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      marginTop: '0.5rem',
                      color: '#dc2626',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                      zIndex: 9999
                    }}>
                      No se encontraron productos con "{inputBusqueda}"
                    </div>
                  )}
                </div>

                {/* Producto seleccionado */}
                {productoSeleccionadoTemporal && (
                  <div style={{
                    padding: '0.75rem',
                    background: '#f0f9ff',
                    border: '1px solid #0ea5e9',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}>
                    <div style={{ fontWeight: '600', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ✅ {productoSeleccionadoTemporal.codigoPersonalizado || 'Sin código'} - {productoSeleccionadoTemporal.nombre}
                    </div>
                    {productoSeleccionadoTemporal.codigoBarras && (
                      <div style={{ color: '#0369a1', fontSize: '0.75rem' }}>
                        Barras: {productoSeleccionadoTemporal.codigoBarras}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                    Cantidad * (permite fórmulas: 2+3, 10-2, 5*2, 8/2)
                  </label>
                  <input
                    type="text"
                    value={nuevoProducto.cantidad}
                    onChange={(e) => {
                      const valor = e.target.value;
                      setNuevoProducto({...nuevoProducto, cantidad: valor});
                    }}
                    onBlur={(e) => {
                      const valor = e.target.value;
                      try {
                        // Evaluar fórmula matemática
                        const resultado = eval(valor);
                        if (typeof resultado === 'number' && !isNaN(resultado) && resultado > 0) {
                          setNuevoProducto({...nuevoProducto, cantidad: Math.floor(resultado)});
                        } else {
                          // Si no es una fórmula válida, intentar parsear como número
                          const numero = parseInt(valor);
                          if (!isNaN(numero) && numero > 0) {
                            setNuevoProducto({...nuevoProducto, cantidad: numero});
                          } else {
                            setNuevoProducto({...nuevoProducto, cantidad: 1});
                          }
                        }
                      } catch (error) {
                        // Si hay error en la evaluación, intentar parsear como número
                        const numero = parseInt(valor);
                        if (!isNaN(numero) && numero > 0) {
                          setNuevoProducto({...nuevoProducto, cantidad: numero});
                        } else {
                          setNuevoProducto({...nuevoProducto, cantidad: 1});
                        }
                      }
                    }}
                    onKeyDown={manejarTeclasCantidad}
                    placeholder="Ej: 5, 2+3, 10-2, 5*2, 8/2"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                    Estado del Producto *
                  </label>
                  <select
                    value={nuevoProducto.estadoProducto}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, estadoProducto: e.target.value})}
                    onKeyDown={manejarTeclasEstado}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    {ESTADOS_PRODUCTO.map(estado => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
                marginTop: '2rem'
              }}>
                <button
                  onClick={() => setMostrarAgregarProducto(false)}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  id="boton-agregar-producto"
                  onClick={agregarProducto}
                  onKeyDown={manejarTeclasBotonGuardar}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: isMobile ? '16px' : '24px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          border: '2px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={guardarCambios}
              disabled={guardando}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '1rem 2rem',
                fontSize: '1rem',
                cursor: guardando ? 'not-allowed' : 'pointer',
                opacity: guardando ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {guardando ? '⏳' : '💾'} Guardar Cambios
            </button>
            
            <button
              onClick={finalizarVerificacion}
              disabled={guardando || detallesEditados.length === 0 || productosAprobados.size !== detallesEditados.length}
              style={{
                background: productosAprobados.size === detallesEditados.length && detallesEditados.length > 0 ? '#10b981' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '1rem 2rem',
                fontSize: '1rem',
                cursor: productosAprobados.size === detallesEditados.length && detallesEditados.length > 0 ? 'pointer' : 'not-allowed',
                opacity: productosAprobados.size === detallesEditados.length && detallesEditados.length > 0 ? 1 : 0.6,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {guardando ? '⏳' : '✅'} Finalizar Verificación ({productosAprobados.size}/{detallesEditados.length})
            </button>
          </div>
        </div>

        {/* Modal de edición de producto */}
        {mostrarEditarProducto && productoEditando && (
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
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: isMobile ? '20px' : '32px',
              width: isMobile ? '90%' : '500px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
            }}>
              <h3 style={{
                margin: '0 0 24px 0',
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937',
                textAlign: 'center'
              }}>
                ✏️ Editar Producto
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Buscador de productos */}
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                    Buscar Producto *
                  </label>
                  <input
                    type="text"
                    value={inputBusqueda}
                    onChange={(e) => setInputBusqueda(e.target.value)}
                    onKeyDown={manejarTeclasBusqueda}
                    placeholder="Código de barras, código personalizado o nombre..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                  
                  {/* Debug info */}
                  {console.log('🔍 [DEBUG] Render - mostrarProductos:', mostrarProductos, 'productosFiltrados.length:', productosFiltrados.length)}
                  
                  {/* Lista de productos filtrados */}
                  {mostrarProductos && productosFiltrados.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '2px solid #3b82f6',
                      borderRadius: '0.5rem',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
                      zIndex: 9999,
                      maxHeight: '300px',
                      overflow: 'auto',
                      marginTop: '0.5rem'
                    }}>
                      {productosFiltrados.map((producto, index) => (
                        <div
                          key={producto.id}
                          onClick={() => seleccionarProducto(producto)}
                          style={{
                            padding: '0.75rem',
                            cursor: 'pointer',
                            borderBottom: index < productosFiltrados.length - 1 ? '1px solid #f1f5f9' : 'none',
                            background: index === productoSeleccionado ? '#3b82f6' : 'white',
                            color: index === productoSeleccionado ? 'white' : '#1e293b',
                            fontSize: '0.875rem',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem'
                          }}
                        >
                          <div style={{ fontWeight: '600' }}>
                            {producto.nombre}
                          </div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                            {producto.codigoPersonalizado && `Código: ${producto.codigoPersonalizado}`}
                            {producto.codigoBarras && ` • Barras: ${producto.codigoBarras}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Mensaje cuando no hay productos */}
                  {mostrarProductos && productosFiltrados.length === 0 && inputBusqueda.trim() !== '' && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: '#fef2f2',
                      border: '2px solid #ef4444',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      marginTop: '0.5rem',
                      color: '#dc2626',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                      zIndex: 9999
                    }}>
                      No se encontraron productos con "{inputBusqueda}"
                    </div>
                  )}
                </div>

                {/* Producto seleccionado */}
                {productoSeleccionadoTemporal && (
                  <div style={{
                    padding: '0.75rem',
                    background: '#f0f9ff',
                    border: '1px solid #0ea5e9',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}>
                    <div style={{ fontWeight: '600', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ✅ {productoSeleccionadoTemporal.codigoPersonalizado || 'Sin código'} - {productoSeleccionadoTemporal.nombre}
                    </div>
                    {productoSeleccionadoTemporal.codigoBarras && (
                      <div style={{ color: '#0369a1', fontSize: '0.75rem' }}>
                        Barras: {productoSeleccionadoTemporal.codigoBarras}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                    Cantidad * (permite fórmulas: 2+3, 10-2, 5*2, 8/2)
                  </label>
                  <input
                    type="text"
                    value={nuevoProducto.cantidad}
                    onChange={(e) => {
                      const valor = e.target.value;
                      setNuevoProducto({...nuevoProducto, cantidad: valor});
                    }}
                    onBlur={(e) => {
                      const valor = e.target.value;
                      try {
                        // Evaluar fórmula matemática
                        const resultado = eval(valor);
                        if (typeof resultado === 'number' && !isNaN(resultado) && resultado > 0) {
                          setNuevoProducto({...nuevoProducto, cantidad: Math.floor(resultado)});
                        } else {
                          // Si no es una fórmula válida, intentar parsear como número
                          const numero = parseInt(valor);
                          if (!isNaN(numero) && numero > 0) {
                            setNuevoProducto({...nuevoProducto, cantidad: numero});
                          } else {
                            setNuevoProducto({...nuevoProducto, cantidad: 1});
                          }
                        }
                      } catch (error) {
                        // Si hay error en la evaluación, intentar parsear como número
                        const numero = parseInt(valor);
                        if (!isNaN(numero) && numero > 0) {
                          setNuevoProducto({...nuevoProducto, cantidad: numero});
                        } else {
                          setNuevoProducto({...nuevoProducto, cantidad: 1});
                        }
                      }
                    }}
                    onKeyDown={manejarTeclasCantidad}
                    placeholder="Ej: 5, 2+3, 10-2, 5*2, 8/2"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                    Estado del Producto *
                  </label>
                  <select
                    value={nuevoProducto.estadoProducto}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, estadoProducto: e.target.value})}
                    onKeyDown={manejarTeclasEstado}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    {ESTADOS_PRODUCTO.map(estado => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
                marginTop: '2rem'
              }}>
                <button
                  onClick={cerrarModalEditar}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  id="boton-guardar-edicion"
                  onClick={guardarEdicionProducto}
                  onKeyDown={manejarTeclasBotonGuardar}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
