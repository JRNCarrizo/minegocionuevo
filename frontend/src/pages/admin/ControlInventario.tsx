import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import BarcodeScanner from '../../components/BarcodeScanner';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
import ApiService from '../../services/api';
import inventarioService, { type HistorialInventario, type EstadisticasInventario as EstadisticasInventarioAPI } from '../../services/inventarioService';
import type { Producto } from '../../types';

interface ProductoInventario {
  id: number;
  codigoProducto: string;
  nombreProducto: string;
  stockReal: number;
  stockEscaneado: number;
  diferencia: number;
  precioUnitario: number;
  categoria: string;
  marca: string;
}

interface Inventario {
  id: number;
  fechaInventario: string;
  totalProductos: number;
  productosConDiferencias: number;
  valorTotalDiferencias: number;
  porcentajePrecision: number;
  estado: string;
  detalles: ProductoInventario[];
}

interface EstadisticasInventario {
  totalProductos: number;
  productosConDiferencias: number;
  productosFaltantes: number;
  cantidadProductosSobrantes: number;
  valorTotalDiferencias: number;
  porcentajePrecision: number;
  productosPerdidos: ProductoInventario[];
  productosSobrantes: ProductoInventario[];
}

const ControlInventario: React.FC = () => {
  const { datosUsuario, cerrarSesion, cargando: cargandoUsuario } = useUsuarioActual();
  const { isMobile } = useResponsive();
  
  // Estados principales
  const [inventarioActual, setInventarioActual] = useState<Inventario | null>(null);
  const [productosEscaneados, setProductosEscaneados] = useState<Map<string, ProductoInventario>>(new Map());
  const [estadisticas, setEstadisticas] = useState<EstadisticasInventario | null>(null);
  const [historialInventarios, setHistorialInventarios] = useState<Inventario[]>([]);
  
  // Estados de UI
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [mostrarScannerUSB, setMostrarScannerUSB] = useState(false);
  const [mostrarResumen, setMostrarResumen] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [modoEscaneo, setModoEscaneo] = useState<'INICIAR' | 'ESCANEANDO' | 'FINALIZADO'>('INICIAR');

  // Estados para el modal de producto
  const [productoSeleccionado, setProductoSeleccionado] = useState<ProductoInventario | null>(null);
  const [cantidadEscaneada, setCantidadEscaneada] = useState<number>(1);
  const [mostrarModalProducto, setMostrarModalProducto] = useState(false);
  
  // Estados para el modal de detalle de inventario
  const [inventarioDetalle, setInventarioDetalle] = useState<Inventario | null>(null);
  const [mostrarDetalleInventario, setMostrarDetalleInventario] = useState(false);
  const [filtroDetalle, setFiltroDetalle] = useState<'todos' | 'faltantes' | 'sobrantes'>('todos');

  // Estados para el historial de operaciones
  const [historialOperaciones, setHistorialOperaciones] = useState<HistorialInventario[]>([]);
  const [estadisticasOperaciones, setEstadisticasOperaciones] = useState<EstadisticasInventarioAPI | null>(null);
  const [mostrarHistorialOperaciones, setMostrarHistorialOperaciones] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [paginaHistorial, setPaginaHistorial] = useState(0);
  const [totalPaginasHistorial, setTotalPaginasHistorial] = useState(0);
  
  // Estados para el historial de inventarios físicos
  const [mostrarHistorialInventarios, setMostrarHistorialInventarios] = useState(false);
  
  // Estados para el modal de detalles de operación
  const [operacionSeleccionada, setOperacionSeleccionada] = useState<HistorialInventario | null>(null);
  const [mostrarDetalleOperacion, setMostrarDetalleOperacion] = useState(false);
  
  // Estados para productos no escaneados
  const [productosNoEscaneados, setProductosNoEscaneados] = useState<Producto[]>([]);
  const [mostrarModalProductosNoEscaneados, setMostrarModalProductosNoEscaneados] = useState(false);
  const [productosSeleccionadosComoFaltantes, setProductosSeleccionadosComoFaltantes] = useState<Set<number>>(new Set());

  // Estados para secciones expandibles
  const [seccionExpandida, setSeccionExpandida] = useState<string | null>(null);

  useEffect(() => {
    if (datosUsuario?.empresaId) {
      cargarHistorialInventarios();
      cargarEstadisticasOperaciones();
    }
  }, [datosUsuario?.empresaId]);

  const cargarHistorialInventarios = async () => {
    if (!datosUsuario?.empresaId) {
      console.log('❌ No hay empresaId disponible para cargar historial');
      return;
    }

    console.log('🔍 Datos del usuario:', datosUsuario);
    console.log('🔍 EmpresaId:', datosUsuario.empresaId);

    try {
      console.log('📋 Cargando historial de inventarios físicos...');
      const response = await inventarioService.obtenerHistorialInventariosFisicos(0, 50);
      
      if (response.success && response.data) {
        console.log('✅ Historial de inventarios físicos cargado:', response.data);
        const inventarios = response.data.content || [];
        
        // Debug: verificar las fechas de cada inventario
        inventarios.forEach((inventario: { id: number; fecha: string }, index: number) => {
          console.log(`📅 Inventario ${index + 1}:`, {
            id: inventario.id,
            fecha: inventario.fecha,
            fechaTipo: typeof inventario.fecha,
            fechaValida: inventario.fecha ? !isNaN(new Date(inventario.fecha).getTime()) : false
          });
        });
        
        setHistorialInventarios(inventarios);
      } else {
        console.error('❌ Error en respuesta de historial:', response);
        // Fallback a localStorage si la API no está disponible
        const historialGuardado = localStorage.getItem(`historialInventarios_${datosUsuario.empresaId}`);
        console.log('🔍 Buscando en localStorage con key:', `historialInventarios_${datosUsuario.empresaId}`);
        console.log('🔍 Contenido de localStorage:', historialGuardado);
        if (historialGuardado) {
          const historial = JSON.parse(historialGuardado);
          console.log('✅ Historial cargado desde localStorage:', historial);
          setHistorialInventarios(historial);
        } else {
          console.log('❌ No se encontró historial en localStorage');
        }
      }
    } catch (error) {
      console.error('❌ Error al cargar historial de inventarios físicos:', error);
      // Fallback a localStorage si hay error
      const historialGuardado = localStorage.getItem(`historialInventarios_${datosUsuario.empresaId}`);
      console.log('🔍 Fallback: Buscando en localStorage con key:', `historialInventarios_${datosUsuario.empresaId}`);
      console.log('🔍 Fallback: Contenido de localStorage:', historialGuardado);
      if (historialGuardado) {
        const historial = JSON.parse(historialGuardado);
        console.log('✅ Historial cargado desde localStorage (fallback):', historial);
        setHistorialInventarios(historial);
      } else {
        console.log('❌ No se encontró historial en localStorage (fallback)');
      }
    }
  };

  const cargarEstadisticasOperaciones = async () => {
    if (!datosUsuario?.empresaId) {
      console.log('❌ No hay empresaId disponible para cargar estadísticas');
      return;
    }

    try {
      console.log('📊 Cargando estadísticas de operaciones...');
      const response = await inventarioService.obtenerEstadisticas();
      console.log('📊 Respuesta de estadísticas:', response);
      
      if (response.success) {
        console.log('📊 Estadísticas cargadas:', response.data);
        setEstadisticasOperaciones(response.data);
      } else {
        console.error('❌ Error en respuesta de estadísticas:', response);
      }
    } catch (error) {
      console.error('❌ Error al cargar estadísticas de operaciones:', error);
    }
  };

  const cargarHistorialOperaciones = async (pagina: number = 0) => {
    try {
      setCargandoHistorial(true);
      const response = await inventarioService.obtenerHistorial(pagina, 20);
      if (response.success && response.data) {
        setHistorialOperaciones(response.data.content || []);
        setTotalPaginasHistorial(response.data.totalPages || 0);
        setPaginaHistorial(pagina);
      }
    } catch (error) {
      console.error('Error al cargar historial de operaciones:', error);
      toast.error('Error al cargar el historial de operaciones');
    } finally {
      setCargandoHistorial(false);
    }
  };

  const iniciarInventario = () => {
    const nuevoInventario: Inventario = {
      id: Date.now(), // Temporal, debería venir del backend
      fechaInventario: new Date().toISOString(),
      totalProductos: 0,
      productosConDiferencias: 0,
      valorTotalDiferencias: 0,
      porcentajePrecision: 0,
      estado: 'EN_PROGRESO',
      detalles: []
    };
    
    setInventarioActual(nuevoInventario);
    setProductosEscaneados(new Map());
    setModoEscaneo('ESCANEANDO');
    setMostrarScanner(true);
  };

  const iniciarInventarioUSB = () => {
    const nuevoInventario: Inventario = {
      id: Date.now(), // Temporal, debería venir del backend
      fechaInventario: new Date().toISOString(),
      totalProductos: 0,
      productosConDiferencias: 0,
      valorTotalDiferencias: 0,
      porcentajePrecision: 0,
      estado: 'EN_PROGRESO',
      detalles: []
    };
    
    setInventarioActual(nuevoInventario);
    setProductosEscaneados(new Map());
    setModoEscaneo('ESCANEANDO');
    // NO activar la cámara para escáner USB
  };

  const manejarCodigoEscaneado = async (codigo: string) => {
    try {
      setCargando(true);
      
      console.log('🔍 Buscando producto con código:', codigo);
      
      // Buscar el producto por código de barras (solo productos activos)
      let productos = await ApiService.obtenerProductosPorCodigoBarras(datosUsuario!.empresaId, codigo, true);
      console.log('📦 Resultado búsqueda por código de barras:', productos);
      
      // Si no se encuentra por código de barras, intentar por código personalizado
      if (!productos || productos.length === 0) {
        console.log('🔄 Intentando búsqueda por código personalizado...');
        productos = await ApiService.obtenerProductosPorCodigo(datosUsuario!.empresaId, codigo, true);
        console.log('📦 Resultado búsqueda por código personalizado:', productos);
      }
      
      if (!productos || productos.length === 0) {
        console.log('❌ Producto no encontrado');
        toast.error(`Producto con código "${codigo}" no encontrado. Verifica que el código esté registrado en el sistema.`);
        return;
      }

      const producto: Producto = productos[0];
      
      // Crear objeto de producto para inventario
      const productoInventario: ProductoInventario = {
        id: producto.id,
        codigoProducto: producto.codigoBarras || producto.codigoPersonalizado || codigo,
        nombreProducto: producto.nombre,
        stockReal: producto.stock,
        stockEscaneado: 1, // Por defecto 1, se puede editar
        diferencia: 0,
        precioUnitario: producto.precio,
        categoria: producto.categoria || 'Sin categoría',
        marca: producto.marca || 'Sin marca'
      };

      // Verificar si ya fue escaneado
      const productoExistente = productosEscaneados.get(codigo);
      if (productoExistente) {
        // Si ya existe, incrementar cantidad
        productoInventario.stockEscaneado = productoExistente.stockEscaneado + 1;
        productoInventario.diferencia = productoInventario.stockEscaneado - productoInventario.stockReal;
      } else {
        productoInventario.diferencia = productoInventario.stockEscaneado - productoInventario.stockReal;
      }

      // Actualizar el mapa de productos escaneados
      const nuevosProductosEscaneados = new Map(productosEscaneados);
      nuevosProductosEscaneados.set(codigo, productoInventario);
      setProductosEscaneados(nuevosProductosEscaneados);

      // Mostrar modal para editar cantidad
      setProductoSeleccionado(productoInventario);
      setCantidadEscaneada(productoInventario.stockEscaneado);
      setMostrarModalProducto(true);
      setMostrarScanner(false);

    } catch (error) {
      console.error('Error al procesar código escaneado:', error);
      toast.error('Error al procesar el producto escaneado');
    } finally {
      setCargando(false);
    }
  };

  const confirmarCantidad = () => {
    if (!productoSeleccionado) return;

    const diferencia = cantidadEscaneada - productoSeleccionado.stockReal;
    
    console.log('🔍 DEBUG - confirmarCantidad:');
    console.log('🔍 Producto:', productoSeleccionado.nombreProducto);
    console.log('🔍 Stock Real (sistema):', productoSeleccionado.stockReal);
    console.log('🔍 Cantidad Escaneada:', cantidadEscaneada);
    console.log('🔍 Diferencia calculada:', diferencia);
    console.log('🔍 Tipo de diferencia:', diferencia > 0 ? 'SOBRANTE' : diferencia < 0 ? 'FALTANTE' : 'CORRECTO');

    const productoActualizado: ProductoInventario = {
      ...productoSeleccionado,
      stockEscaneado: cantidadEscaneada,
      diferencia: diferencia
    };

    // Actualizar el mapa de productos escaneados
    const nuevosProductosEscaneados = new Map(productosEscaneados);
    nuevosProductosEscaneados.set(productoSeleccionado.codigoProducto, productoActualizado);
    setProductosEscaneados(nuevosProductosEscaneados);

    // Cerrar modal y escáner
    setMostrarModalProducto(false);
    setProductoSeleccionado(null);
    setMostrarScanner(false);
    setMostrarScannerUSB(false);

    // Calcular y mostrar estadísticas del inventario actual
    const productos = Array.from(nuevosProductosEscaneados.values());
    const totalProductos = productos.length;
    const productosConDiferencias = productos.filter(p => p.diferencia !== 0).length;
    const valorTotalDiferencias = productos.reduce((total, p) => {
      const valorDiferencia = p.diferencia * p.precioUnitario;
      return total + valorDiferencia;
    }, 0);
    const porcentajePrecision = ((totalProductos - productosConDiferencias) / totalProductos) * 100;

    const estadisticasCalculadas: EstadisticasInventario = {
      totalProductos,
      productosConDiferencias,
      productosFaltantes: productos.filter(p => p.diferencia < 0).length,
      cantidadProductosSobrantes: productos.filter(p => p.diferencia > 0).length,
      valorTotalDiferencias,
      porcentajePrecision,
      productosPerdidos: productos.filter(p => p.diferencia < 0),
      productosSobrantes: productos.filter(p => p.diferencia > 0)
    };

    // Crear el inventario actual si no existe
    const inventarioActualizado: Inventario = {
      id: inventarioActual ? inventarioActual.id : Date.now(),
      fechaInventario: inventarioActual ? inventarioActual.fechaInventario : new Date().toISOString(),
      totalProductos,
      productosConDiferencias,
      valorTotalDiferencias,
      porcentajePrecision,
      estado: 'EN_PROGRESO',
      detalles: Array.from(nuevosProductosEscaneados.values())
    };

    setInventarioActual(inventarioActualizado);
    setEstadisticas(estadisticasCalculadas);
    setModoEscaneo('FINALIZADO');
    setMostrarResumen(true);

    toast.success(`Producto ${productoSeleccionado.nombreProducto} registrado. Mostrando resumen del inventario...`);
  };

  const seguirEscaneando = () => {
    if (!productoSeleccionado) return;

    const diferencia = cantidadEscaneada - productoSeleccionado.stockReal;
    
    console.log('🔍 DEBUG - seguirEscaneando:');
    console.log('🔍 Producto:', productoSeleccionado.nombreProducto);
    console.log('🔍 Stock Real (sistema):', productoSeleccionado.stockReal);
    console.log('🔍 Cantidad Escaneada:', cantidadEscaneada);
    console.log('🔍 Diferencia calculada:', diferencia);
    console.log('🔍 Tipo de diferencia:', diferencia > 0 ? 'SOBRANTE' : diferencia < 0 ? 'FALTANTE' : 'CORRECTO');

    const productoActualizado: ProductoInventario = {
      ...productoSeleccionado,
      stockEscaneado: cantidadEscaneada,
      diferencia: diferencia
    };

    // Actualizar el mapa de productos escaneados
    const nuevosProductosEscaneados = new Map(productosEscaneados);
    nuevosProductosEscaneados.set(productoSeleccionado.codigoProducto, productoActualizado);
    setProductosEscaneados(nuevosProductosEscaneados);

    // Cerrar modal y volver al escáner correspondiente
    setMostrarModalProducto(false);
    setProductoSeleccionado(null);
    
    // Si el escáner USB está abierto, volver al modal USB
    if (mostrarScannerUSB) {
      setMostrarScannerUSB(true); // Mantener abierto el modal USB
    } else {
      setMostrarScanner(true); // Volver a la cámara
    }
    
    toast.success(`Producto ${productoSeleccionado.nombreProducto} registrado con cantidad: ${cantidadEscaneada}`);
  };

  const cancelarCantidad = () => {
    // No guardar nada, solo cerrar modal y salir del escáner correspondiente
    setMostrarModalProducto(false);
    setProductoSeleccionado(null);
    
    // Si el escáner USB está abierto, cerrarlo también
    if (mostrarScannerUSB) {
      setMostrarScannerUSB(false);
    } else {
      setMostrarScanner(false);
    }
    
    toast.error('Operación cancelada');
  };

  const resetearInventario = () => {
    // Resetear completamente el estado del inventario
    setInventarioActual(null);
    setProductosEscaneados(new Map());
    setEstadisticas(null);
    setModoEscaneo('INICIAR');
    setMostrarScanner(false);
    setMostrarScannerUSB(false);
    setMostrarResumen(false);
    setProductoSeleccionado(null);
    setCantidadEscaneada(1);
    setMostrarModalProducto(false);
  };

  const finalizarInventario = () => {
    if (productosEscaneados.size === 0) {
      toast.error('No se han escaneado productos para finalizar el inventario. Escanea al menos un producto o cancela el inventario.');
      return;
    }

    // Calcular estadísticas
    const productos = Array.from(productosEscaneados.values());
    const totalProductos = productos.length;
    const productosConDiferencias = productos.filter(p => p.diferencia !== 0).length;
    const valorTotalDiferencias = productos.reduce((total, p) => {
      const valorDiferencia = p.diferencia * p.precioUnitario;
      return total + valorDiferencia;
    }, 0);
    const porcentajePrecision = ((totalProductos - productosConDiferencias) / totalProductos) * 100;

    const estadisticasCalculadas: EstadisticasInventario = {
      totalProductos,
      productosConDiferencias,
      productosFaltantes: productos.filter(p => p.diferencia < 0).length,
      cantidadProductosSobrantes: productos.filter(p => p.diferencia > 0).length,
      valorTotalDiferencias,
      porcentajePrecision,
      productosPerdidos: productos.filter(p => p.diferencia < 0),
      productosSobrantes: productos.filter(p => p.diferencia > 0)
    };

    setEstadisticas(estadisticasCalculadas);
    setModoEscaneo('FINALIZADO');
    setMostrarScanner(false);
    setMostrarResumen(true);
  };

  const obtenerProductosNoEscaneados = async () => {
    try {
      console.log('🔍 Obteniendo todos los productos activos...');
      console.log('🔍 empresaId:', datosUsuario!.empresaId);
      console.log('🔍 productosEscaneados actuales:', productosEscaneados.size);
      
      const response = await ApiService.obtenerTodosLosProductos(datosUsuario!.empresaId);
      console.log('🔍 Response de API:', response);
      
      // Verificar si response es un array directo o tiene la propiedad data
      const todosLosProductos = Array.isArray(response) ? response : (response.data || []);
      console.log('🔍 Total de productos en la empresa:', todosLosProductos.length);
      console.log('🔍 Todos los productos:', todosLosProductos.map(p => ({ id: p.id, nombre: p.nombre, activo: p.activo })));
      
      // Filtrar solo productos activos
      const productosActivos = todosLosProductos.filter(p => p.activo !== false);
      console.log('🔍 Productos activos:', productosActivos.length);
      console.log('🔍 Productos activos:', productosActivos.map(p => ({ id: p.id, nombre: p.nombre })));
      
      const productosEscaneadosIds = new Set(Array.from(productosEscaneados.values()).map(p => p.id));
      console.log('🔍 IDs de productos escaneados:', Array.from(productosEscaneadosIds));
      console.log('🔍 Productos escaneados detallados:', Array.from(productosEscaneados.values()).map(p => ({ id: p.id, nombre: p.nombreProducto })));
      
      const productosNoEscaneados = productosActivos.filter(producto => !productosEscaneadosIds.has(producto.id));
      console.log('🔍 Productos no escaneados encontrados:', productosNoEscaneados.length);
      console.log('🔍 Productos no escaneados:', productosNoEscaneados.map(p => ({ id: p.id, nombre: p.nombre })));
      
      setProductosNoEscaneados(productosNoEscaneados);
      setProductosSeleccionadosComoFaltantes(new Set());
      
      if (productosNoEscaneados.length > 0) {
        console.log('✅ Mostrando modal de productos no escaneados');
        setMostrarModalProductosNoEscaneados(true);
        return true; // Hay productos no escaneados
      } else {
        console.log('✅ No hay productos no escaneados');
      }
      
      return false; // No hay productos no escaneados
    } catch (error) {
      console.error('Error al obtener productos no escaneados:', error);
      toast.error('Error al verificar productos no escaneados');
      return false;
    }
  };

  const guardarInventario = async () => {
    console.log('🔍 DEBUG - Función guardarInventario llamada');
    console.log('🔍 DEBUG - inventarioActual:', inventarioActual);
    console.log('🔍 DEBUG - estadisticas:', estadisticas);
    console.log('🔍 DEBUG - productosEscaneados:', productosEscaneados);
    
    if (!estadisticas) {
      console.log('❌ DEBUG - Validación fallida: estadisticas es null');
      toast.error('No hay datos de inventario para guardar');
      return;
    }

    // Verificar productos no escaneados antes de guardar
    const hayProductosNoEscaneados = await obtenerProductosNoEscaneados();
    if (hayProductosNoEscaneados) {
      console.log('⚠️ Hay productos no escaneados, mostrando modal de confirmación');
      return; // No continuar con el guardado hasta que se confirme
    }

    // Si no hay productos no escaneados, continuar con el guardado normal
    await guardarInventarioReal();
  };

  const continuarGuardadoConProductosFaltantes = async () => {
    console.log('✅ Continuando guardado con productos marcados como faltantes');
    
    // Agregar productos seleccionados como faltantes al inventario
    const productosFaltantes = productosNoEscaneados.filter(producto => 
      productosSeleccionadosComoFaltantes.has(producto.id)
    );
    
    console.log('🔍 Productos seleccionados como faltantes:', productosFaltantes.length);
    console.log('🔍 Productos faltantes:', productosFaltantes.map(p => ({ id: p.id, nombre: p.nombre, stock: p.stock })));
    
    // Convertir productos faltantes a formato ProductoInventario
    const productosFaltantesInventario = productosFaltantes.map(producto => ({
      id: producto.id,
      codigoProducto: producto.codigoBarras || producto.codigoPersonalizado || '',
      nombreProducto: producto.nombre,
      stockReal: producto.stock,
      stockEscaneado: 0, // No fueron escaneados
      diferencia: -producto.stock, // Faltan todos los que había en stock
      precioUnitario: producto.precio,
      categoria: producto.categoria || 'Sin categoría',
      marca: producto.marca || 'Sin marca'
    }));
    
    console.log('🔍 Productos faltantes convertidos:', productosFaltantesInventario.map(p => ({ 
      id: p.id, 
      nombre: p.nombreProducto, 
      stockReal: p.stockReal, 
      stockEscaneado: p.stockEscaneado, 
      diferencia: p.diferencia 
    })));
    
    // Agregar productos faltantes a productosEscaneados
    const nuevosProductosEscaneados = new Map(productosEscaneados);
    productosFaltantesInventario.forEach(producto => {
      nuevosProductosEscaneados.set(producto.codigoProducto, producto);
    });
    
    console.log('🔍 Total productos escaneados después de agregar faltantes:', nuevosProductosEscaneados.size);
    console.log('🔍 DEBUG - Contenido de nuevosProductosEscaneados:');
    Array.from(nuevosProductosEscaneados.entries()).forEach(([codigo, producto]) => {
      console.log(`  - ${codigo}: ${producto.nombreProducto} (ID: ${producto.id}, Stock: ${producto.stockReal} → ${producto.stockEscaneado}, Diferencia: ${producto.diferencia})`);
    });
    
    // Recalcular estadísticas con los productos faltantes incluidos
    const todosLosProductos = Array.from(nuevosProductosEscaneados.values());
    const totalProductos = todosLosProductos.length;
    const productosConDiferencias = todosLosProductos.filter(p => p.diferencia !== 0).length;
    const valorTotalDiferencias = todosLosProductos.reduce((total, p) => {
      const valorDiferencia = p.diferencia * p.precioUnitario;
      return total + valorDiferencia;
    }, 0);
    const porcentajePrecision = ((totalProductos - productosConDiferencias) / totalProductos) * 100;

    const estadisticasActualizadas: EstadisticasInventario = {
      totalProductos,
      productosConDiferencias,
      productosFaltantes: todosLosProductos.filter(p => p.diferencia < 0).length,
      cantidadProductosSobrantes: todosLosProductos.filter(p => p.diferencia > 0).length,
      valorTotalDiferencias,
      porcentajePrecision,
      productosPerdidos: todosLosProductos.filter(p => p.diferencia < 0),
      productosSobrantes: todosLosProductos.filter(p => p.diferencia > 0)
    };
    
    console.log('🔍 Estadísticas actualizadas:', estadisticasActualizadas);
    
    // Actualizar estados
    setProductosEscaneados(nuevosProductosEscaneados);
    setEstadisticas(estadisticasActualizadas);
    
    // Actualizar inventarioActual con los productos faltantes incluidos
    const inventarioActualizado: Inventario = {
      id: inventarioActual ? inventarioActual.id : Date.now(),
      fechaInventario: inventarioActual ? inventarioActual.fechaInventario : new Date().toISOString(),
      totalProductos,
      productosConDiferencias,
      valorTotalDiferencias,
      porcentajePrecision,
      estado: 'EN_PROGRESO',
      detalles: Array.from(nuevosProductosEscaneados.values())
    };
    setInventarioActual(inventarioActualizado);
    
    console.log('🔍 Inventario actualizado con productos faltantes:', inventarioActualizado);
    console.log('🔍 DEBUG - Detalles del inventario actualizado:', inventarioActualizado.detalles.map(p => ({
      id: p.id,
      nombre: p.nombreProducto,
      stockReal: p.stockReal,
      stockEscaneado: p.stockEscaneado,
      diferencia: p.diferencia
    })));
    
    // Cerrar modal
    setMostrarModalProductosNoEscaneados(false);
    setProductosNoEscaneados([]);
    setProductosSeleccionadosComoFaltantes(new Set());
    
    // Continuar con el guardado normal pasando los productos actualizados
    await guardarInventarioReal(nuevosProductosEscaneados);
  };

  const omitirProductosNoEscaneados = async () => {
    console.log('⏭️ Omitiendo productos no escaneados');
    
    // Cerrar modal
    setMostrarModalProductosNoEscaneados(false);
    setProductosNoEscaneados([]);
    setProductosSeleccionadosComoFaltantes(new Set());
    
    // Continuar con el guardado normal
    await guardarInventarioReal();
  };

  const guardarInventarioReal = async (productosActualizados?: Map<string, ProductoInventario>) => {
    // Si no hay inventarioActual, crear uno básico
    if (!inventarioActual) {
      console.log('⚠️ DEBUG - inventarioActual es null, creando uno básico');
      const inventarioBasico: Inventario = {
        id: Date.now(),
        fechaInventario: new Date().toISOString(),
        totalProductos: estadisticas!.totalProductos,
        productosConDiferencias: estadisticas!.productosConDiferencias,
        valorTotalDiferencias: estadisticas!.valorTotalDiferencias,
        porcentajePrecision: estadisticas!.porcentajePrecision,
        estado: 'EN_PROGRESO',
        detalles: Array.from(productosEscaneados.values())
      };
      setInventarioActual(inventarioBasico);
    }

    try {
      setCargando(true);
      console.log('✅ DEBUG - Iniciando proceso de guardado...');
      console.log('🔍 DEBUG - Estado actual al inicio de guardarInventarioReal:');
      console.log('  - productosEscaneados.size:', productosEscaneados.size);
      console.log('  - estadisticas:', estadisticas);
      console.log('  - inventarioActual:', inventarioActual);
      
      // Usar productos actualizados si se proporcionan, sino usar productosEscaneados
      const productosParaProcesar = productosActualizados || productosEscaneados;
      const productosEscaneadosArray = Array.from(productosParaProcesar.values());
      
      console.log('🔍 DEBUG - Productos para procesar:');
      console.log('  - productosActualizados proporcionados:', !!productosActualizados);
      console.log('  - productosParaProcesar.size:', productosParaProcesar.size);
      console.log('  - productosEscaneados.size:', productosEscaneados.size);
      
      const inventarioCompletado: Inventario = {
        id: inventarioActual ? inventarioActual.id : Date.now(),
        fechaInventario: inventarioActual ? inventarioActual.fechaInventario : new Date().toISOString(),
        estado: 'COMPLETADO',
        totalProductos: estadisticas!.totalProductos,
        productosConDiferencias: estadisticas!.productosConDiferencias,
        valorTotalDiferencias: estadisticas!.valorTotalDiferencias,
        porcentajePrecision: estadisticas!.porcentajePrecision,
        detalles: productosEscaneadosArray
      };
      
      console.log('🔍 DEBUG - inventarioCompletado creado con productosEscaneados actualizado:');
      console.log('🔍 Total productos en productosEscaneados:', productosEscaneadosArray.length);
      console.log('🔍 Productos en productosEscaneados:', productosEscaneadosArray.map(p => ({
        id: p.id,
        nombre: p.nombreProducto,
        stockReal: p.stockReal,
        stockEscaneado: p.stockEscaneado,
        diferencia: p.diferencia,
        tipo: p.diferencia > 0 ? 'SOBRANTE' : p.diferencia < 0 ? 'FALTANTE' : 'CORRECTO'
      })));

      // Crear objeto para la API de inventario físico
      const inventarioParaAPI = {
        totalProductos: estadisticas!.totalProductos,
        productosConDiferencias: estadisticas!.productosConDiferencias,
        valorTotalDiferencias: estadisticas!.valorTotalDiferencias,
        porcentajePrecision: estadisticas!.porcentajePrecision,
        estado: 'COMPLETADO' as const,
        detalles: productosEscaneadosArray.map(p => ({
          productoId: p.id,
          codigoProducto: p.codigoProducto,
          nombreProducto: p.nombreProducto,
          stockReal: p.stockReal,
          stockEscaneado: p.stockEscaneado,
          diferencia: p.diferencia,
          precioUnitario: p.precioUnitario,
          categoria: p.categoria,
          marca: p.marca
        }))
      };

      console.log('💾 Guardando inventario físico en API:', inventarioParaAPI);
      
      // Intentar guardar en la API
      try {
        const response = await inventarioService.guardarInventarioFisico(inventarioParaAPI);
        
        if (response.success) {
          console.log('✅ Inventario físico guardado en API:', response.data);
          toast.success('Inventario guardado exitosamente en el servidor');
        } else {
          throw new Error(response.message || 'Error al guardar en API');
        }
      } catch (apiError) {
        console.error('❌ Error al guardar en API, guardando en localStorage:', apiError);
        toast.success('Inventario guardado localmente (servidor no disponible)');
      }
      
      // Procesar productos con diferencias de forma más eficiente
      const productosConDiferencias = inventarioCompletado.detalles.filter(p => p.diferencia !== 0);
      
      console.log('🔍 DEBUG - guardarInventarioReal:');
      console.log('🔍 Total productos en inventario:', inventarioCompletado.detalles.length);
      console.log('🔍 Productos con diferencias:', productosConDiferencias.length);
      console.log('🔍 Productos con diferencias:', productosConDiferencias.map(p => ({
        id: p.id,
        nombre: p.nombreProducto,
        stockReal: p.stockReal,
        stockEscaneado: p.stockEscaneado,
        diferencia: p.diferencia,
        tipo: p.diferencia > 0 ? 'SOBRANTE' : p.diferencia < 0 ? 'FALTANTE' : 'CORRECTO'
      })));
      
      // Verificar productos faltantes específicamente
      const productosFaltantes = productosConDiferencias.filter(p => p.diferencia < 0);
      console.log('🔍 Productos faltantes a procesar:', productosFaltantes.length);
      console.log('🔍 Productos faltantes:', productosFaltantes.map(p => ({
        id: p.id,
        nombre: p.nombreProducto,
        stockReal: p.stockReal,
        stockEscaneado: p.stockEscaneado,
        diferencia: p.diferencia
      })));
      
      if (productosConDiferencias.length > 0) {
        console.log('📊 Procesando productos con diferencias...');
        
        // Procesar en lotes para evitar sobrecarga
        const lotes = [];
        for (let i = 0; i < productosConDiferencias.length; i += 3) {
          lotes.push(productosConDiferencias.slice(i, i + 3));
        }
        
        for (const lote of lotes) {
          await Promise.all(lote.map(async (producto) => {
            try {
              // Obtener el stock actual del producto antes de actualizarlo
              console.log(`🔍 Obteniendo stock actual para ${producto.nombreProducto}...`);
              const productoActualResponse = await ApiService.obtenerProducto(datosUsuario!.empresaId, producto.id);
              const stockActual = productoActualResponse.data?.stock || producto.stockReal;
              
              // Verificar si es un producto faltante
              const esProductoFaltante = producto.diferencia < 0;
              console.log(`🔍 Producto ${producto.nombreProducto} - Es faltante: ${esProductoFaltante}`);
              if (esProductoFaltante) {
                console.log(`🔍 Producto faltante - Stock actual: ${stockActual}, Stock escaneado: ${producto.stockEscaneado}, Diferencia: ${producto.diferencia}`);
              }
              
              const tipoOperacion = producto.diferencia > 0 ? 'INCREMENTO' : 'DECREMENTO';
              const cantidad = Math.abs(producto.diferencia);
              // CORRECCIÓN: El stock nuevo debe ser el stock escaneado, no el stock real + diferencia
              const stockNuevo = producto.stockEscaneado;
              
              console.log(`🔍 DEBUG - Producto: ${producto.nombreProducto}`);
              console.log(`🔍 DEBUG - Stock Actual (sistema): ${stockActual}`);
              console.log(`🔍 DEBUG - Stock Real (cuando se escaneó): ${producto.stockReal}`);
              console.log(`🔍 DEBUG - Stock Escaneado: ${producto.stockEscaneado}`);
              console.log(`🔍 DEBUG - Diferencia: ${producto.diferencia}`);
              console.log(`🔍 DEBUG - Stock Nuevo: ${stockNuevo}`);
              console.log(`🔍 DEBUG - Tipo Operación: ${tipoOperacion}`);
              console.log(`🔍 DEBUG - Cantidad: ${cantidad}`);
              
              // Registrar operación con el tipo correcto y luego actualizar stock
              console.log(`📝 Registrando operación de ${tipoOperacion}...`);
              await registrarOperacionInventario(
                producto.id,
                tipoOperacion, // Usar INCREMENTO o DECREMENTO según corresponda
                cantidad,
                stockActual, // Usar el stock actual, no el stock cuando se escaneó
                stockNuevo,
                producto.codigoProducto,
                `Inventario físico: Stock escaneado ${producto.stockEscaneado}, Stock sistema ${stockActual}`
              );
              
              // Actualizar stock usando actualizarProducto para evitar registro automático de operación
              console.log(`🔄 Actualizando stock para ${producto.nombreProducto}...`);
              const response = await ApiService.actualizarProducto(datosUsuario!.empresaId, producto.id, { stock: stockNuevo });
              console.log(`✅ Respuesta de actualización de stock:`, response);
              
              console.log(`✅ Stock actualizado para ${producto.nombreProducto}: ${stockActual} → ${stockNuevo}`);
              if (esProductoFaltante) {
                console.log(`✅ Producto faltante procesado: ${producto.nombreProducto} - Stock actualizado a 0`);
              }
            } catch (error) {
              console.error(`❌ Error al procesar producto ${producto.nombreProducto}:`, error);
            }
          }));
          
          // Pequeña pausa entre lotes para evitar sobrecarga
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Actualizar historial
      setHistorialInventarios(prev => {
        const nuevoHistorial = [inventarioCompletado, ...prev];
        // Guardar en localStorage como backup
        if (datosUsuario?.empresaId) {
          localStorage.setItem(`historialInventarios_${datosUsuario.empresaId}`, JSON.stringify(nuevoHistorial));
          console.log('💾 Historial guardado en localStorage:', nuevoHistorial);
        }
        return nuevoHistorial;
      });
      
      // Resetear estados
      setInventarioActual(null);
      setProductosEscaneados(new Map());
      setEstadisticas(null);
      setModoEscaneo('INICIAR');
      setMostrarResumen(false);
      
      toast.success('Inventario guardado y procesado exitosamente');
      
    } catch (error) {
      console.error('Error al guardar inventario:', error);
      toast.error('Error al guardar el inventario');
    } finally {
      setCargando(false);
    }
  };

  const registrarOperacionInventario = async (
    productoId: number,
    tipoOperacion: 'INCREMENTO' | 'DECREMENTO' | 'AJUSTE' | 'INVENTARIO_FISICO',
    cantidad: number,
    stockAnterior: number,
    stockNuevo: number,
    codigoBarras?: string,
    observacion?: string
  ) => {
    try {
      // Obtener el producto para obtener su precio unitario
      const productoResponse = await ApiService.obtenerProducto(datosUsuario!.empresaId, productoId, true);
      const precioUnitario = productoResponse.data?.precio || 0;

      const request = {
        productoId,
        tipoOperacion,
        cantidad,
        stockAnterior,
        stockNuevo,
        precioUnitario,
        codigoBarras,
        observacion,
        metodoEntrada: 'inventario_fisico'
      };

      const response = await inventarioService.registrarOperacion(request);
      if (response.success) {
        console.log('✅ Operación registrada en historial para producto ID:', productoId);
      } else {
        console.error('❌ Error al registrar operación:', response.message);
      }
    } catch (error) {
      console.error('Error al registrar operación de inventario:', error);
    }
  };

  const cerrarSesionConToast = () => {
    cerrarSesion();
    toast.success('Sesión cerrada correctamente');
  };

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(monto);
  };

  const formatearFecha = (fecha: string) => {
    try {
      if (!fecha) {
        return 'Fecha no disponible';
      }
      // Si la fecha viene sin zona, la tratamos como UTC
      const fechaUTC = fecha.endsWith('Z') ? fecha : fecha + 'Z';
      const fechaObj = new Date(fechaUTC);
      if (isNaN(fechaObj.getTime())) {
        console.warn('Fecha inválida recibida:', fecha);
        return 'Fecha inválida';
      }
      // Usar la zona horaria local del usuario en lugar de una zona específica
      return fechaObj.toLocaleString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        // No especificar timeZone para usar la zona horaria local del navegador
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error, 'Fecha recibida:', fecha);
      return 'Error en fecha';
    }
  };

  const verDetalleInventario = (inventario: Inventario) => {
    setInventarioDetalle(inventario);
    setMostrarDetalleInventario(true);
  };



  const verDetalleOperacion = (operacion: HistorialInventario) => {
    setOperacionSeleccionada(operacion);
    setMostrarDetalleOperacion(true);
  };

  const toggleSeccion = (seccion: string) => {
    setSeccionExpandida(seccionExpandida === seccion ? null : seccion);
  };

  // Mostrar estado de carga mientras se cargan los datos del usuario
  if (cargandoUsuario) {
    return (
      <div className="h-pantalla-minimo pagina-con-navbar" style={{ backgroundColor: 'var(--color-fondo)' }}>
        <div className="contenedor" style={{ 
          paddingTop: (isMobile || window.innerWidth < 768) ? '10.5rem' : '5rem', 
          paddingBottom: '2rem',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e2e8f0',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{ color: '#64748b', fontSize: '16px' }}>
              Cargando datos del usuario...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-pantalla-minimo pagina-con-navbar" style={{ backgroundColor: 'var(--color-fondo)' }}>
      <style>
        {`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      {/* Navegación */}
      <NavbarAdmin 
        onCerrarSesion={cerrarSesionConToast}
        empresaNombre={datosUsuario?.empresaNombre}
        nombreAdministrador={datosUsuario?.nombre}
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
          <h1 className="titulo-2 mb-4" style={{ 
            fontSize: isMobile ? '1.75rem' : '32px', 
            fontWeight: '700', 
            color: '#1e293b',
            letterSpacing: '-0.025em',
            lineHeight: '1.2'
          }}>
            🔍 Control de Inventario
          </h1>
          <p className="texto-gris" style={{ 
            fontSize: isMobile ? '1rem' : '16px', 
            color: '#64748b',
            marginBottom: '8px'
          }}>
            Realiza conteo físico y control de stock de tus productos.
          </p>
          <div style={{
            height: '4px',
            width: '60px',
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            borderRadius: '2px',
            marginTop: '16px',
            marginLeft: isMobile ? 'auto' : '0',
            marginRight: isMobile ? 'auto' : '0'
          }}></div>
        </div>

        {/* Estado del inventario */}
        {modoEscaneo === 'INICIAR' && (
          <div className="tarjeta mb-6" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: isMobile ? '16px' : '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <div className="text-center">
              <div style={{ fontSize: isMobile ? '3rem' : '4rem', marginBottom: '1rem' }}>🔍</div>
              <h3 className="titulo-3 mb-4" style={{
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '16px'
              }}>
                Iniciar Control de Inventario
              </h3>
              <p className="texto-gris mb-6" style={{ 
                fontSize: isMobile ? '14px' : '16px', 
                color: '#64748b',
                marginBottom: '24px',
                maxWidth: '600px',
                margin: '0 auto 24px'
              }}>
                Escanea todos los productos de tu inventario para realizar un conteo físico 
                y comparar con el stock registrado en el sistema.
              </p>
              
              <div className="flex gap-4 justify-center" style={{ 
                gap: isMobile ? '0.5rem' : '1rem', 
                justifyContent: 'center',
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                <button
                  onClick={() => {
                    setMostrarScanner(true);
                    iniciarInventario();
                  }}
                  className="boton boton-primario"
                  style={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    color: 'white',
                    border: 'none',
                    padding: isMobile ? '10px 20px' : '12px 24px',
                    borderRadius: '12px',
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                    width: isMobile ? '100%' : 'auto'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
                  }}
                >
                  📱 Iniciar con Cámara
                </button>
                
                <button
                  onClick={() => {
                    setMostrarScannerUSB(true);
                    iniciarInventarioUSB();
                  }}
                  className="boton boton-secundario"
                  style={{
                    background: 'white',
                    color: '#dc2626',
                    border: '2px solid #dc2626',
                    padding: isMobile ? '10px 20px' : '12px 24px',
                    borderRadius: '12px',
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    width: isMobile ? '100%' : 'auto'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#dc2626';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = '#dc2626';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  ⌨️ Escáner USB
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Estadísticas de Operaciones */}
        {estadisticasOperaciones && (
          <div className="tarjeta mb-6" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: isMobile ? '16px' : '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <h3 className="titulo-3 mb-4" style={{
              fontSize: isMobile ? '18px' : '20px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              📊 Estadísticas de Operaciones
            </h3>
            
            <div className="grid grid-4 mb-4" style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
              gap: isMobile ? '0.75rem' : '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                background: 'white',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
                  {estadisticasOperaciones.totalOperaciones || 0}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>Total Operaciones</div>
              </div>
              <div style={{
                background: 'white',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                  {estadisticasOperaciones.totalIncrementos || 0}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>Incrementos</div>
              </div>
              <div style={{
                background: 'white',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
                  {estadisticasOperaciones.totalDecrementos || 0}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>Decrementos</div>
              </div>
              <div style={{
                background: 'white',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
                  {estadisticasOperaciones.totalAjustes || 0}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>Ajustes</div>
              </div>
            </div>
          </div>
        )}

        {/* Progreso del escaneo */}
        {modoEscaneo === 'ESCANEANDO' && (
          <div className="tarjeta mb-6" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: isMobile ? '16px' : '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px' }}>
              {/* Título principal */}
              <div style={{ textAlign: 'center' }}>
                <h3 className="titulo-3" style={{
                  fontSize: isMobile ? '20px' : '24px',
                  fontWeight: '700',
                  color: '#1e293b',
                  marginBottom: '8px'
                }}>
                  🔍 Escaneando Productos
                </h3>
                <div style={{
                  height: '3px',
                  width: '80px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  borderRadius: '2px',
                  margin: '0 auto'
                }}></div>
              </div>
              
              {/* Información y controles */}
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'stretch' : 'center',
                background: 'white',
                padding: isMobile ? '12px 16px' : '16px 20px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                gap: isMobile ? '12px' : '0'
              }}>
                {/* Contador de productos */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  justifyContent: isMobile ? 'center' : 'flex-start'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: isMobile ? '12px' : '14px',
                    fontWeight: '600'
                  }}>
                    📦 {productosEscaneados.size}
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: isMobile ? '14px' : '16px', 
                      fontWeight: '600', 
                      color: '#1e293b' 
                    }}>
                      Productos Escaneados
                    </div>
                    <div style={{ 
                      fontSize: isMobile ? '10px' : '12px', 
                      color: '#64748b' 
                    }}>
                      Continúa escaneando códigos de barras
                    </div>
                  </div>
                </div>
                
                {/* Botones de acción */}
                <div style={{ 
                  display: 'flex', 
                  gap: isMobile ? '8px' : '12px',
                  flexDirection: isMobile ? 'column' : 'row'
                }}>
                  {/* Botón de cancelar */}
                  <button
                    onClick={resetearInventario}
                    className="boton boton-secundario"
                    style={{
                      background: 'white',
                      color: '#dc2626',
                      border: '2px solid #dc2626',
                      padding: isMobile ? '10px 16px' : '12px 20px',
                      borderRadius: '10px',
                      fontSize: isMobile ? '12px' : '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      width: isMobile ? '100%' : 'auto'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#dc2626';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = '#dc2626';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    ❌ Cancelar
                  </button>
                  
                  {/* Botón de finalizar */}
                  <button
                    onClick={finalizarInventario}
                    className="boton boton-primario"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      padding: isMobile ? '10px 20px' : '12px 24px',
                      borderRadius: '10px',
                      fontSize: isMobile ? '14px' : '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                      width: isMobile ? '100%' : 'auto'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                    }}
                  >
                    ✅ Finalizar Inventario
                  </button>
                </div>
              </div>
            </div>
            
            {/* Lista de productos escaneados */}
            {productosEscaneados.size > 0 && (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <div className="grid grid-1 gap-2" style={{ gap: '8px' }}>
                  {Array.from(productosEscaneados.values()).map((producto) => (
                    <div key={producto.codigoProducto} style={{
                      background: 'white',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>
                          {producto.nombreProducto}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          Código: {producto.codigoProducto}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '600', color: '#3b82f6' }}>
                          Escaneado: {producto.stockEscaneado}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          Real: {producto.stockReal}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resumen del inventario */}
        {mostrarResumen && estadisticas && (
          <div className="tarjeta mb-6" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: isMobile ? '16px' : '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <h3 className="titulo-3 mb-4" style={{
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '16px'
            }}>
              📊 Resumen del Inventario
            </h3>
            
            {/* Estadísticas principales */}
            <div className="grid grid-4 mb-6" style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: isMobile ? '12px' : '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: isMobile ? '12px' : '16px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: isMobile ? '20px' : '24px', marginBottom: '8px' }}>📦</div>
                <div style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '700', color: '#3b82f6' }}>
                  {estadisticas.totalProductos}
                </div>
                <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#64748b' }}>Total Productos</div>
              </div>
              
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: isMobile ? '12px' : '16px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: isMobile ? '20px' : '24px', marginBottom: '8px' }}>⚠️</div>
                <div style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '700', color: '#f59e0b' }}>
                  {estadisticas.productosConDiferencias}
                </div>
                <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#64748b' }}>Con Diferencias</div>
              </div>
              
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: isMobile ? '12px' : '16px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: isMobile ? '20px' : '24px', marginBottom: '8px' }}>💰</div>
                <div style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '700', color: '#dc2626' }}>
                  {formatearMoneda(estadisticas.valorTotalDiferencias)}
                </div>
                <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#64748b' }}>Valor Diferencias</div>
              </div>
              
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: isMobile ? '12px' : '16px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: isMobile ? '20px' : '24px', marginBottom: '8px' }}>📈</div>
                <div style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '700', color: '#10b981' }}>
                  {estadisticas.porcentajePrecision.toFixed(1)}%
                </div>
                <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#64748b' }}>Precisión</div>
              </div>
            </div>

            {/* Productos con diferencias */}
            {(estadisticas.productosPerdidos.length > 0 || estadisticas.productosSobrantes.length > 0) && (
              <div className="mb-6">
                <h4 className="titulo-4 mb-3" style={{
                  fontSize: isMobile ? '16px' : '18px',
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '12px'
                }}>
                  Productos con Diferencias
                </h4>
                
                <div className="grid grid-2" style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: isMobile ? '12px' : '16px'
                }}>
                  {/* Productos perdidos */}
                  {estadisticas.productosPerdidos.length > 0 && (
                    <div style={{
                      background: '#fef2f2',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #fecaca'
                    }}>
                      <h5 style={{ color: '#dc2626', fontWeight: '600', marginBottom: '12px' }}>
                        ❌ Productos Faltantes ({estadisticas.productosPerdidos.length})
                      </h5>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {estadisticas.productosPerdidos.map((producto) => (
                          <div key={producto.codigoProducto} style={{
                            background: 'white',
                            padding: '8px',
                            borderRadius: '6px',
                            marginBottom: '6px',
                            border: '1px solid #fecaca'
                          }}>
                            <div style={{ fontWeight: '600', fontSize: '14px' }}>
                              {producto.nombreProducto}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              Faltan: {Math.abs(producto.diferencia)} unidades | 
                              Valor: {formatearMoneda(Math.abs(producto.diferencia) * producto.precioUnitario)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Productos sobrantes */}
                  {estadisticas.productosSobrantes.length > 0 && (
                    <div style={{
                      background: '#f0fdf4',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #bbf7d0'
                    }}>
                      <h5 style={{ color: '#059669', fontWeight: '600', marginBottom: '12px' }}>
                        ✅ Productos Sobrantes ({estadisticas.productosSobrantes.length})
                      </h5>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {estadisticas.productosSobrantes.map((producto) => (
                          <div key={producto.codigoProducto} style={{
                            background: 'white',
                            padding: '8px',
                            borderRadius: '6px',
                            marginBottom: '6px',
                            border: '1px solid #bbf7d0'
                          }}>
                            <div style={{ fontWeight: '600', fontSize: '14px' }}>
                              {producto.nombreProducto}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              Sobran: {producto.diferencia} unidades | 
                              Valor: {formatearMoneda(producto.diferencia * producto.precioUnitario)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Información del proceso */}
            {cargando && (
              <div style={{
                background: '#f0f9ff',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #bae6fd',
                marginBottom: '16px',
                textAlign: 'center',
                fontSize: '14px',
                color: '#0369a1'
              }}>
                ⏳ <strong>Procesando inventario...</strong> Esto puede tomar unos segundos dependiendo de la cantidad de productos.
              </div>
            )}
            
            {/* Botones de acción */}
            <div className="flex gap-4 justify-center" style={{ 
              gap: isMobile ? '0.5rem' : '1rem', 
              justifyContent: 'center',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <button
                onClick={guardarInventario}
                disabled={cargando}
                className="boton boton-primario"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  padding: isMobile ? '10px 20px' : '12px 24px',
                  borderRadius: '12px',
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: '600',
                  cursor: cargando ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: cargando ? 0.7 : 1,
                  width: isMobile ? '100%' : 'auto',
                  position: 'relative'
                }}
              >
                {cargando ? (
                  <>
                    <span style={{ marginRight: '8px' }}>💾</span>
                    Guardando...
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      height: '3px',
                      background: 'rgba(255,255,255,0.3)',
                      borderRadius: '0 0 12px 12px',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }}></div>
                  </>
                ) : (
                  '💾 Guardar Inventario'
                )}
              </button>
              
              {/* Botón de prueba temporal */}
              <button
                onClick={() => {
                  console.log('🔍 DEBUG - Botón de prueba clickeado');
                  console.log('🔍 DEBUG - inventarioActual:', inventarioActual);
                  console.log('🔍 DEBUG - estadisticas:', estadisticas);
                  console.log('🔍 DEBUG - productosEscaneados:', productosEscaneados);
                  toast.success('Revisa la consola para ver los datos de debug');
                }}
                className="boton boton-secundario"
                style={{
                  background: 'white',
                  color: '#3b82f6',
                  border: '2px solid #3b82f6',
                  padding: isMobile ? '8px 16px' : '10px 20px',
                  borderRadius: '8px',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                🔍 Debug
              </button>
              
              {/* Botón para probar productos no escaneados */}
              <button
                onClick={async () => {
                  console.log('🧪 Probando funcionalidad de productos no escaneados...');
                  const hayProductos = await obtenerProductosNoEscaneados();
                  console.log('🧪 Resultado:', hayProductos);
                  if (hayProductos) {
                    toast.success('Se encontraron productos no escaneados. Revisa el modal.');
                  } else {
                    toast.success('No se encontraron productos no escaneados.');
                  }
                }}
                className="boton boton-secundario"
                style={{
                  background: 'white',
                  color: '#f59e0b',
                  border: '2px solid #f59e0b',
                  padding: isMobile ? '8px 16px' : '10px 20px',
                  borderRadius: '8px',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                🧪 Probar No Escaneados
              </button>
              
              {/* Botón para probar con productos inactivos */}
              <button
                onClick={async () => {
                  console.log('🧪 Probando con productos incluyendo inactivos...');
                  try {
                    const response = await ApiService.obtenerTodosLosProductosIncluirInactivos(datosUsuario!.empresaId);
                    console.log('🧪 Response con inactivos:', response);
                    
                    if (response.data) {
                      const todosLosProductos = response.data;
                      const productosEscaneadosIds = new Set(Array.from(productosEscaneados.values()).map(p => p.id));
                      const productosNoEscaneados = todosLosProductos.filter(producto => !productosEscaneadosIds.has(producto.id));
                      
                      console.log('🧪 Productos no escaneados (incluyendo inactivos):', productosNoEscaneados.length);
                      console.log('🧪 Productos no escaneados:', productosNoEscaneados.map(p => ({ id: p.id, nombre: p.nombre, activo: p.activo })));
                      
                      if (productosNoEscaneados.length > 0) {
                        setProductosNoEscaneados(productosNoEscaneados);
                        setProductosSeleccionadosComoFaltantes(new Set());
                        setMostrarModalProductosNoEscaneados(true);
                        toast.success('Se encontraron productos no escaneados (incluyendo inactivos).');
                      } else {
                        toast.success('No se encontraron productos no escaneados (incluyendo inactivos).');
                      }
                    }
                  } catch (error) {
                    console.error('🧪 Error:', error);
                    toast.error('Error al probar con productos inactivos');
                  }
                }}
                className="boton boton-secundario"
                style={{
                  background: 'white',
                  color: '#8b5cf6',
                  border: '2px solid #8b5cf6',
                  padding: isMobile ? '8px 16px' : '10px 20px',
                  borderRadius: '8px',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                🧪 Probar Con Inactivos
              </button>
              
              {/* Botón para debug detallado */}
              <button
                onClick={async () => {
                  console.log('🔬 DEBUG DETALLADO - Estado actual:');
                  console.log('🔬 productosEscaneados:', productosEscaneados);
                  console.log('🔬 productosEscaneados.size:', productosEscaneados.size);
                  console.log('🔬 productosEscaneados.values():', Array.from(productosEscaneados.values()));
                  
                  try {
                    const response = await ApiService.obtenerTodosLosProductos(datosUsuario!.empresaId);
                    console.log('🔬 API Response (activos):', response);
                    const productosActivos = Array.isArray(response) ? response : (response.data || []);
                    console.log('🔬 Total productos activos en API:', productosActivos.length);
                    console.log('🔬 Productos activos:', productosActivos);
                    
                    // También probar con productos incluyendo inactivos
                    const responseInactivos = await ApiService.obtenerTodosLosProductosIncluirInactivos(datosUsuario!.empresaId);
                    console.log('🔬 API Response (incluyendo inactivos):', responseInactivos);
                    const productosTodos = Array.isArray(responseInactivos) ? responseInactivos : (responseInactivos.data || []);
                    console.log('🔬 Total productos (incluyendo inactivos):', productosTodos.length);
                    console.log('🔬 Productos inactivos:', productosTodos.filter(p => p.activo === false));
                  } catch (error) {
                    console.error('🔬 Error al obtener productos:', error);
                  }
                  
                  toast.success('Revisa la consola para debug detallado');
                }}
                className="boton boton-secundario"
                style={{
                  background: 'white',
                  color: '#dc2626',
                  border: '2px solid #dc2626',
                  padding: isMobile ? '8px 16px' : '10px 20px',
                  borderRadius: '8px',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                🔬 Debug Detallado
              </button>
              
              <button
                onClick={() => {
                  setMostrarResumen(false);
                  setModoEscaneo('INICIAR');
                  setInventarioActual(null);
                  setProductosEscaneados(new Map());
                  setEstadisticas(null);
                }}
                className="boton boton-secundario"
                style={{
                  background: 'white',
                  color: '#6b7280',
                  border: '2px solid #6b7280',
                  padding: isMobile ? '10px 20px' : '12px 24px',
                  borderRadius: '12px',
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                🔄 Nuevo Inventario
              </button>
            </div>
          </div>
        )}

        {/* Sección de Historiales */}
        <div className="tarjeta mb-6" style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: isMobile ? '16px' : '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <h3 className="titulo-3 mb-4" style={{
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            📚 Historiales
          </h3>

          {/* Botones de historiales en línea */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'center',
            flexDirection: isMobile ? 'column' : 'row',
            marginBottom: '20px'
          }}>
            <button
              onClick={() => toggleSeccion('inventarios')}
              className="boton boton-secundario"
              style={{
                background: seccionExpandida === 'inventarios' ? '#10b981' : 'white',
                color: seccionExpandida === 'inventarios' ? 'white' : '#10b981',
                border: '2px solid #10b981',
                padding: '12px 20px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flex: isMobile ? '1' : 'auto',
                minWidth: isMobile ? 'auto' : '180px'
              }}
              onMouseOver={(e) => {
                if (seccionExpandida !== 'inventarios') {
                  e.currentTarget.style.background = '#10b981';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseOut={(e) => {
                if (seccionExpandida !== 'inventarios') {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = '#10b981';
                }
              }}
            >
              📋 Inventarios Físicos
            </button>
            
            <button
              onClick={() => {
                toggleSeccion('operaciones');
                if (seccionExpandida !== 'operaciones') {
                  cargarHistorialOperaciones();
                }
              }}
              className="boton boton-secundario"
              style={{
                background: seccionExpandida === 'operaciones' ? '#3b82f6' : 'white',
                color: seccionExpandida === 'operaciones' ? 'white' : '#3b82f6',
                border: '2px solid #3b82f6',
                padding: '12px 20px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flex: isMobile ? '1' : 'auto',
                minWidth: isMobile ? 'auto' : '180px'
              }}
              onMouseOver={(e) => {
                if (seccionExpandida !== 'operaciones') {
                  e.currentTarget.style.background = '#3b82f6';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseOut={(e) => {
                if (seccionExpandida !== 'operaciones') {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = '#3b82f6';
                }
              }}
            >
              📊 Operaciones
            </button>
          </div>

          {/* Contenido expandible - Inventarios Físicos */}
          {seccionExpandida === 'inventarios' && (
            <div style={{ 
              borderTop: '1px solid #e2e8f0', 
              paddingTop: '20px',
              animation: 'slideDown 0.3s ease-out'
            }}>
              {historialInventarios.length > 0 ? (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {historialInventarios.map((inventario) => (
                    <div key={inventario.id} style={{
                      background: 'white',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      marginBottom: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                      e.currentTarget.style.borderColor = '#10b981';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                    onClick={() => verDetalleInventario(inventario)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>
                            Inventario del {inventarioService.formatearFechaDesdeAPI(inventario.fechaInventario)}
                          </div>
                          <div style={{ fontSize: '14px', color: '#64748b' }}>
                            {inventario.totalProductos} productos | 
                            {inventario.productosConDiferencias} con diferencias | 
                            Precisión: {inventario.porcentajePrecision.toFixed(1)}%
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '600', color: inventario.valorTotalDiferencias < 0 ? '#dc2626' : inventario.valorTotalDiferencias > 0 ? '#059669' : '#64748b' }}>
                            {formatearMoneda(inventario.valorTotalDiferencias)}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            Valor diferencias
                          </div>
                        </div>
                      </div>
                      <div style={{ 
                        marginTop: '8px', 
                        fontSize: '12px', 
                        color: '#10b981',
                        fontWeight: '500'
                      }}>
                        👆 Haz clic para ver detalles
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#64748b'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
                    No hay inventarios físicos
                  </h4>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    Realiza tu primer inventario físico para ver el historial aquí.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Contenido expandible - Operaciones */}
          {seccionExpandida === 'operaciones' && (
            <div style={{ 
              borderTop: '1px solid #e2e8f0', 
              paddingTop: '20px',
              animation: 'slideDown 0.3s ease-out'
            }}>
              {cargandoHistorial ? (
                <div className="text-center py-8">
                  <div className="spinner mx-auto mb-4"></div>
                  <p className="texto-gris">Cargando historial...</p>
                </div>
              ) : historialOperaciones.length > 0 ? (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {historialOperaciones.map((operacion) => (
                    <div 
                      key={operacion.id} 
                      onClick={() => verDetalleOperacion(operacion)}
                      style={{
                        background: 'white',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        marginBottom: '12px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        e.currentTarget.style.borderColor = '#3b82f6';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div style={{ flex: 1 }}>
                          <div className="flex items-center gap-2 mb-2">
                            <span style={{ fontSize: '1.2rem' }}>
                              {inventarioService.getIconoTipoOperacion(operacion.tipoOperacion)}
                            </span>
                            <span style={{ 
                              fontWeight: '600', 
                              color: inventarioService.getColorTipoOperacion(operacion.tipoOperacion)
                            }}>
                              {inventarioService.getDescripcionCortaTipoOperacion(operacion.tipoOperacion)}
                            </span>
                            <span style={{ 
                              fontSize: '12px', 
                              color: '#64748b',
                              background: '#f1f5f9',
                              padding: '2px 8px',
                              borderRadius: '12px'
                            }}>
                              {operacion.cantidad} unidades
                            </span>
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                            {operacion.productoNombre}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {operacion.usuarioNombre} • {inventarioService.formatearFechaDesdeAPI(operacion.fechaOperacion)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>
                            {formatearMoneda(operacion.valorTotal)}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            Valor total
                          </div>
                        </div>
                      </div>
                      <div style={{ 
                        marginTop: '8px', 
                        fontSize: '12px', 
                        color: '#3b82f6',
                        fontWeight: '500'
                      }}>
                        👆 Haz clic para ver detalles
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#64748b'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
                    No hay operaciones de inventario
                  </h4>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    Realiza operaciones de inventario para ver el historial aquí.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scanner de Códigos */}
      <BarcodeScanner
        isOpen={mostrarScanner}
        onScan={manejarCodigoEscaneado}
        onClose={() => {
          setMostrarScanner(false);
          // Si no hay productos escaneados, resetear el inventario
          if (productosEscaneados.size === 0) {
            resetearInventario();
          }
        }}
      />

      {/* Modal de Scanner USB */}
      {mostrarScannerUSB && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="modal-content" style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            width: '90vw',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                ⌨️ Escáner USB
              </h3>
              <button
                onClick={() => {
                  setMostrarScannerUSB(false);
                  // Si no hay productos escaneados, resetear el inventario
                  if (productosEscaneados.size === 0) {
                    resetearInventario();
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ×
              </button>
            </div>
            
            <div className="text-center mb-4">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⌨️</div>
              <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                Conecta tu escáner USB y escanea los códigos de barras de los productos.
                El código se procesará automáticamente.
              </p>
            </div>
            
            <input
              type="text"
              placeholder="El código aparecerá aquí automáticamente..."
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                textAlign: 'center'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  manejarCodigoEscaneado(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              autoFocus
            />
            
            <div className="text-center mt-4">
              <button
                onClick={() => {
                  setMostrarScannerUSB(false);
                  // Si no hay productos escaneados, resetear el inventario
                  if (productosEscaneados.size === 0) {
                    resetearInventario();
                  }
                }}
                className="boton boton-secundario"
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Producto */}
      {mostrarModalProducto && productoSeleccionado && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="modal-content" style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            width: '90vw',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                📦 {productoSeleccionado.nombreProducto}
              </h3>
              <button
                onClick={() => setMostrarModalProducto(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e293b' }}>
                  Cantidad Escaneada:
                </label>
                <input
                  type="number"
                  value={cantidadEscaneada === 0 ? '' : cantidadEscaneada}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setCantidadEscaneada(0);
                    } else {
                      const numValue = parseInt(value);
                      if (!isNaN(numValue) && numValue >= 0) {
                        setCantidadEscaneada(numValue);
                      }
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      setCantidadEscaneada(1); // Valor por defecto si se deja vacío
                    }
                  }}
                  min="0"
                  placeholder="Ingresa la cantidad"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                  Stock Real: {productoSeleccionado.stockReal}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                  Código: {productoSeleccionado.codigoProducto}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                  Precio: {formatearMoneda(productoSeleccionado.precioUnitario)}
                </div>
                <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: '500' }}>
                  💡 <strong>Confirmar y Finalizar:</strong> Guarda el producto y muestra el resumen del inventario
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Botones superiores */}
              <div className="flex gap-3" style={{ gap: '12px' }}>
                <button
                  onClick={confirmarCantidad}
                  className="boton boton-primario"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  ✅ Confirmar y Finalizar
                </button>
                
                <button
                  onClick={cancelarCantidad}
                  className="boton boton-secundario"
                  style={{
                    background: 'white',
                    color: '#dc2626',
                    border: '2px solid #dc2626',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  ❌ Cancelar
                </button>
              </div>
              
              {/* Botón central llamativo */}
              <button
                onClick={seguirEscaneando}
                className="boton boton-primario"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  width: '100%',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }}
              >
                🔄 Seguir Escaneando
              </button>
              
              {/* Información adicional */}
              <div style={{ 
                background: '#f0f9ff', 
                padding: '12px', 
                borderRadius: '8px', 
                border: '1px solid #bae6fd',
                fontSize: '12px',
                color: '#0369a1',
                textAlign: 'center'
              }}>
                💡 <strong>Opciones:</strong> Puedes finalizar el inventario ahora o continuar escaneando más productos
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Inventario */}
      {mostrarDetalleInventario && inventarioDetalle && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="modal-content" style={{
            background: 'white',
            borderRadius: '16px',
            padding: '0',
            maxWidth: '900px',
            width: '95vw',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            {/* Header del modal */}
            <div style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              color: 'white',
              padding: '24px 32px',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
                  📊 Detalle del Inventario
                </h2>
                <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
                  {inventarioService.formatearFechaDesdeAPI(inventarioDetalle.fechaInventario)}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setMostrarDetalleInventario(false)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    color: 'white',
                    fontSize: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Contenido del modal */}
            <div style={{ padding: '32px', maxHeight: 'calc(90vh - 120px)', overflow: 'auto' }}>
              {/* Resumen ejecutivo */}
              <div style={{
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
                border: '1px solid #bae6fd'
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                  📋 Resumen Ejecutivo
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Total Productos</p>
                    <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#3b82f6' }}>
                      {inventarioDetalle.totalProductos}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Con Diferencias</p>
                    <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>
                      {inventarioDetalle.productosConDiferencias}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Precisión</p>
                    <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                      {inventarioDetalle.porcentajePrecision.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Valor Diferencias</p>
                    <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#dc2626' }}>
                      {formatearMoneda(inventarioDetalle.valorTotalDiferencias)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Productos con diferencias */}
              {Array.isArray(inventarioDetalle.detalles) && inventarioDetalle.detalles.length > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                    📦 Detalle de Productos
                  </h3>
                  
                  {/* Filtros */}
                  <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setFiltroDetalle('todos')}
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Todos ({Array.isArray(inventarioDetalle.detalles) ? inventarioDetalle.detalles.length : 0})
                    </button>
                    <button
                      onClick={() => setFiltroDetalle('faltantes')}
                      style={{
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Faltantes ({Array.isArray(inventarioDetalle.detalles) ? inventarioDetalle.detalles.filter(p => p.diferencia < 0).length : 0})
                    </button>
                    <button
                      onClick={() => setFiltroDetalle('sobrantes')}
                      style={{
                        background: '#059669',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Sobrantes ({Array.isArray(inventarioDetalle.detalles) ? inventarioDetalle.detalles.filter(p => p.diferencia > 0).length : 0})
                    </button>
                  </div>

                  {/* Tabla de productos */}
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#1e293b', borderBottom: '1px solid #e2e8f0' }}>
                            Producto
                          </th>
                          <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#1e293b', borderBottom: '1px solid #e2e8f0' }}>
                            Código
                          </th>
                          <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#1e293b', borderBottom: '1px solid #e2e8f0' }}>
                            Stock Real
                          </th>
                          <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#1e293b', borderBottom: '1px solid #e2e8f0' }}>
                            Stock Escaneado
                          </th>
                          <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#1e293b', borderBottom: '1px solid #e2e8f0' }}>
                            Diferencia
                          </th>
                          <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#1e293b', borderBottom: '1px solid #e2e8f0' }}>
                            Valor Diferencia
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(inventarioDetalle.detalles) && inventarioDetalle.detalles
                          .filter(producto => {
                            if (filtroDetalle === 'todos') return true;
                            if (filtroDetalle === 'faltantes') return producto.diferencia < 0;
                            if (filtroDetalle === 'sobrantes') return producto.diferencia > 0;
                            return true;
                          })
                          .map((producto, index) => (
                            <tr key={index} style={{ 
                              borderBottom: '1px solid #f1f5f9',
                              background: index % 2 === 0 ? 'white' : '#f8fafc'
                            }}>
                              <td style={{ padding: '12px', fontSize: '14px', color: '#1e293b' }}>
                                <div>
                                  <div style={{ fontWeight: '600' }}>{producto.nombreProducto}</div>
                                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                                    {producto.categoria} • {producto.marca}
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
                                {producto.codigoProducto}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>
                                {producto.stockReal}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>
                                {producto.stockEscaneado}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
                                <span style={{ 
                                  color: producto.diferencia < 0 ? '#dc2626' : producto.diferencia > 0 ? '#059669' : '#64748b',
                                  background: producto.diferencia !== 0 ? 
                                    (producto.diferencia < 0 ? '#fef2f2' : '#f0fdf4') : '#f8fafc',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px'
                                }}>
                                  {producto.diferencia > 0 ? '+' : ''}{producto.diferencia}
                                </span>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
                                <span style={{ 
                                  color: producto.diferencia < 0 ? '#dc2626' : producto.diferencia > 0 ? '#059669' : '#64748b'
                                }}>
                                  {formatearMoneda(Math.abs(producto.diferencia) * producto.precioUnitario)}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recomendaciones */}
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #fbbf24'
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#92400e' }}>
                  💡 Recomendaciones
                </h3>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#92400e' }}>
                  <li style={{ marginBottom: '8px' }}>
                    <strong>Productos faltantes:</strong> Revisar posibles robos, pérdidas o errores de registro
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <strong>Productos sobrantes:</strong> Verificar si hay productos no registrados o duplicados
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <strong>Precisión baja:</strong> Considerar mejorar el proceso de conteo físico
                  </li>
                  <li>
                    <strong>Valor alto de diferencias:</strong> Priorizar la investigación de productos de mayor valor
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles de Operación */}
      {mostrarDetalleOperacion && operacionSeleccionada && (
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
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
              <div className="flex items-center justify-between">
                <h2 style={{ 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: '#1e293b',
                  margin: 0
                }}>
                  📊 Detalles de Operación
                </h2>
                <button
                  onClick={() => setMostrarDetalleOperacion(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '4px'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Información de la operación */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e2e8f0'
              }}>
                <div className="flex items-center gap-3 mb-4">
                  <span style={{ fontSize: '2rem' }}>
                    {inventarioService.getIconoTipoOperacion(operacionSeleccionada.tipoOperacion)}
                  </span>
                  <div>
                    <h3 style={{ 
                      fontSize: '20px', 
                      fontWeight: '700', 
                      color: inventarioService.getColorTipoOperacion(operacionSeleccionada.tipoOperacion),
                      margin: '0 0 4px 0'
                    }}>
                      {inventarioService.getDescripcionCortaTipoOperacion(operacionSeleccionada.tipoOperacion)}
                    </h3>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#64748b',
                      margin: 0
                    }}>
                      ID: {operacionSeleccionada.id}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                      Cantidad Movida
                    </p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                      {operacionSeleccionada.cantidad} unidades
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                      Valor Total
                    </p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                      {formatearMoneda(operacionSeleccionada.valorTotal)}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                      Precio Unitario
                    </p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                      {formatearMoneda(operacionSeleccionada.precioUnitario)}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                      Método de Entrada
                    </p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                      {operacionSeleccionada.metodoEntrada || 'Manual'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información del producto */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#1e293b',
                margin: '0 0 16px 0'
              }}>
                📦 Información del Producto
              </h3>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                    Nombre del Producto
                  </p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                    {operacionSeleccionada.productoNombre}
                  </p>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                    Código de Barras
                  </p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                    {operacionSeleccionada.codigoBarras || 'No especificado'}
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                      Stock Anterior
                    </p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                      {operacionSeleccionada.stockAnterior}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                      Stock Nuevo
                    </p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                      {operacionSeleccionada.stockNuevo}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información del usuario */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#1e293b',
                margin: '0 0 16px 0'
              }}>
                👤 Información del Usuario
              </h3>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                    Usuario Responsable
                  </p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                    {operacionSeleccionada.usuarioNombre}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                    Fecha y Hora
                  </p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                    {inventarioService.formatearFechaDesdeAPI(operacionSeleccionada.fechaOperacion)}
                  </p>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            {operacionSeleccionada.observacion && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#1e293b',
                  margin: '0 0 16px 0'
                }}>
                  📝 Observaciones
                </h3>
                <div style={{
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #fbbf24'
                }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '14px', 
                    color: '#92400e',
                    lineHeight: '1.5'
                  }}>
                    {operacionSeleccionada.observacion}
                  </p>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setMostrarDetalleOperacion(false)}
                className="boton boton-secundario"
                style={{
                  background: 'white',
                  color: '#64748b',
                  border: '2px solid #e2e8f0',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Productos No Escaneados */}
      {mostrarModalProductosNoEscaneados && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="modal-content" style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '800px',
            width: '95vw',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                ⚠️ Productos No Escaneados
              </h3>
              <button
                onClick={() => setMostrarModalProductosNoEscaneados(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                Se encontraron <strong>{productosNoEscaneados.length}</strong> productos que no fueron escaneados durante el inventario.
              </p>
              <p style={{ fontSize: '14px', color: '#dc2626', fontWeight: '500' }}>
                💡 Selecciona los productos que quieres marcar como faltantes, o omite todos para continuar sin cambios.
              </p>
            </div>
            
            {/* Lista de productos no escaneados */}
            <div style={{ 
              maxHeight: '400px', 
              overflowY: 'auto', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              {productosNoEscaneados.map((producto) => (
                <div key={producto.id} style={{
                  padding: '12px',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: productosSeleccionadosComoFaltantes.has(producto.id) ? '#fef2f2' : 'white'
                }}>
                  <input
                    type="checkbox"
                    checked={productosSeleccionadosComoFaltantes.has(producto.id)}
                    onChange={(e) => {
                      const nuevosSeleccionados = new Set(productosSeleccionadosComoFaltantes);
                      if (e.target.checked) {
                        nuevosSeleccionados.add(producto.id);
                      } else {
                        nuevosSeleccionados.delete(producto.id);
                      }
                      setProductosSeleccionadosComoFaltantes(nuevosSeleccionados);
                    }}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>
                      {producto.nombre}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Código: {producto.codigoBarras || producto.codigoPersonalizado || 'N/A'} | 
                      Stock: {producto.stock} | 
                      Precio: {formatearMoneda(producto.precio)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={omitirProductosNoEscaneados}
                className="boton boton-secundario"
                style={{
                  background: 'white',
                  color: '#6b7280',
                  border: '2px solid #6b7280',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ⏭️ Omitir Todos
              </button>
              
              <button
                onClick={continuarGuardadoConProductosFaltantes}
                className="boton boton-primario"
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ✅ Continuar ({productosSeleccionadosComoFaltantes.size} seleccionados)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlInventario;
