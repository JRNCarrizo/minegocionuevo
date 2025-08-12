import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import NavbarAdmin from '../../components/NavbarAdmin';
import BarcodeScanner from '../../components/BarcodeScanner';
import ImportacionProductos from '../../components/ImportacionProductos';
import { useResponsive } from '../../hooks/useResponsive';
import type { Producto } from '../../types';
import '../../styles/gestion-productos.css';

// Extender la interfaz Window para incluir webkitAudioContext
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

interface FiltrosProductos {
  nombre?: string;
  categoria?: string;
  marca?: string;
  sectorAlmacenamiento?: string;
  codigoPersonalizado?: string;
  codigoBarras?: string;
  activo?: boolean;
  stockBajo?: boolean;
}

type VistaProducto = 'lista' | 'intermedia' | 'cuadricula';

const GestionProductos: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [productos, setProductos] = useState<Producto[]>([]);

  // Función para reproducir el sonido "pi"
  const playBeepSound = () => {
    try {
      // Crear un contexto de audio con soporte para navegadores antiguos
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        console.log('AudioContext no está soportado en este navegador');
        return;
      }
      const audioContext = new AudioContextClass();
      
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
  const [vista, setVista] = useState<VistaProducto>('lista');

  // Cambiar automáticamente a vista intermedia en móvil si está en lista
  useEffect(() => {
    if (isMobile && vista === 'lista') {
      setVista('intermedia');
    }
  }, [isMobile, vista]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState<FiltrosProductos>({});
  const [busqueda, setBusqueda] = useState('');
  const [categorias, setCategorias] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [sectoresAlmacenamiento, setSectoresAlmacenamiento] = useState<string[]>([]);
  const [codigosPersonalizados, setCodigosPersonalizados] = useState<string[]>([]);
  // const [codigosBarras, setCodigosBarras] = useState<string[]>([]); // Eliminado - no se usa
  const [empresaId, setEmpresaId] = useState<number | null>(null);
  const [empresaNombre, setEmpresaNombre] = useState<string>('');
  const [nombreAdministrador, setNombreAdministrador] = useState<string>('');
  // Estados para el modal de detalle
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  // Estados para el escáner de códigos de barras
  const [mostrarScanner, setMostrarScanner] = useState(false);
  
  // Estados para el sistema de escáner de stock
  const [mostrarScannerStock, setMostrarScannerStock] = useState(false);
  const [mostrarScannerUSB, setMostrarScannerUSB] = useState(false);
  const [mostrarModalSeleccionScanner, setMostrarModalSeleccionScanner] = useState(false);
  const [productoEscaneado, setProductoEscaneado] = useState<Producto | null>(null);
  const [stockOriginal, setStockOriginal] = useState<number>(0);
  const [cantidadStock, setCantidadStock] = useState<number>(1);
  
  // Estados para importación masiva
  const [mostrarImportacion, setMostrarImportacion] = useState(false);
  const [productosAgregados, setProductosAgregados] = useState<Array<{producto: Producto, cantidad: number, stockOriginal: number}>>([]);
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [guardandoStock, setGuardandoStock] = useState(false);
  const [modoTerminar, setModoTerminar] = useState(false);
  
  // Estados para paginación (TODO: implementar cuando sea necesario)
  // const [paginaActual, setPaginaActual] = useState(0);
  // const [totalPaginas, setTotalPaginas] = useState(1);
  // const [totalElementos, setTotalElementos] = useState(0);

  useEffect(() => {
    // Verificar autenticación y obtener empresaId
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    console.log('Debug - Token encontrado:', !!token); // Debug
    console.log('Debug - User string encontrado:', !!userStr); // Debug
    console.log('Debug - Contenido de localStorage user:', userStr); // Debug
    
    if (!token || !userStr) {
      console.log('Debug - Redirigiendo a login por falta de token o user');
      navigate('/admin/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      console.log('Debug - Usuario parseado:', user); // Debug
      console.log('Debug - empresaId del usuario:', user.empresaId); // Debug
      
      if (user.empresaId) {
        setEmpresaId(user.empresaId);
        setEmpresaNombre(user.empresaNombre || '');
        setNombreAdministrador(user.nombre || '');
        console.log('Debug - empresaId establecido:', user.empresaId);
      } else {
        console.log('Debug - No se encontró empresaId en el usuario');
        setError('No se encontró información de empresa');
        // No redirigir inmediatamente, dar oportunidad de ver el error
        // navigate('/admin/login');
      }
    } catch (error) {
      console.error('Error al parsear usuario:', error);
      navigate('/admin/login');
    }
  }, [navigate]);

  const cargarProductos = useCallback(async () => {
    if (!empresaId) return;
    
    try {
      setCargando(true);
      setError('');
      
      console.log('Cargando productos para empresa:', empresaId);
      
      // Siempre cargar todos los productos (activos e inactivos) para filtrar localmente
      console.log('Obteniendo todos los productos (activos e inactivos)');
      const response = await ApiService.obtenerTodosLosProductosIncluirInactivos(empresaId);
      const productos = response.data || [];

      console.log('Productos cargados del backend:', productos.length, 'productos');
      setProductos(productos);
      
      // Extraer categorías, marcas y sectores únicos de los productos obtenidos
      const categoriasUnicas = [...new Set(productos.map((p: Producto) => p.categoria).filter(Boolean) as string[])];
      const marcasUnicas = [...new Set(productos.map((p: Producto) => p.marca).filter(Boolean) as string[])];
      const sectoresUnicos = [...new Set(productos.map((p: Producto) => p.sectorAlmacenamiento).filter(Boolean) as string[])];
      
      setCategorias(categoriasUnicas);
      setMarcas(marcasUnicas);
      setSectoresAlmacenamiento(sectoresUnicos);
        
    } catch (error: unknown) {
      console.error('Error al cargar productos:', error);
      
      // Mostrar un mensaje de error más específico
      let mensajeError = 'Error al cargar productos del servidor. Verifica tu conexión.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string; message?: string } } };
        
        if (axiosError.response?.status === 403) {
          mensajeError = 'No tienes permisos para acceder a los productos. Verifica tu sesión.';
        } else if (axiosError.response?.status === 401) {
          mensajeError = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        }
      }
      
      setError(mensajeError);
      setProductos([]);
    } finally {
      setCargando(false);
    }
  }, [empresaId]);

  const cargarSectoresAlmacenamiento = useCallback(async () => {
    if (!empresaId) return;
    
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
    if (!empresaId) return;
    
    try {
      const response = await ApiService.obtenerCodigosPersonalizados(empresaId);
      if (response.data) {
        setCodigosPersonalizados(response.data);
      }
    } catch (error) {
      console.error('Error al cargar códigos personalizados:', error);
    }
  }, [empresaId]);

  // const cargarCodigosBarras = useCallback(async () => {
  //   if (!empresaId) return;
  //   
  //   try {
  //     const response = await ApiService.obtenerCodigosBarras(empresaId);
  //     if (response.data) {
  //       setCodigosBarras(response.data);
  //     }
  //   } catch (error) {
  //     console.error('Error al cargar códigos de barras:', error);
  //   }
  // }, [empresaId]); // Eliminado - no se usa

  useEffect(() => {
    if (empresaId) {
      cargarProductos();
      cargarSectoresAlmacenamiento();
      cargarCodigosPersonalizados();
      // cargarCodigosBarras(); // Eliminado - no se usa
    }
  }, [empresaId, cargarProductos, cargarSectoresAlmacenamiento, cargarCodigosPersonalizados]);



  // Función para filtrar productos
  const productosFiltrados = productos.filter(producto => {
    // Filtro por búsqueda de texto
    if (busqueda) {
      const textoBusqueda = busqueda.toLowerCase();
      const coincideNombre = producto.nombre.toLowerCase().includes(textoBusqueda);
      const coincideDescripcion = producto.descripcion?.toLowerCase().includes(textoBusqueda);
      const coincideCodigo = producto.codigoPersonalizado?.toLowerCase().includes(textoBusqueda);
      const coincideCodigoBarras = producto.codigoBarras?.toLowerCase().includes(textoBusqueda);
      
      if (!coincideNombre && !coincideDescripcion && !coincideCodigo && !coincideCodigoBarras) {
        return false;
      }
    }

    // Filtro por categoría
    if (filtros.categoria && producto.categoria !== filtros.categoria) {
      return false;
    }

    // Filtro por marca
    if (filtros.marca && producto.marca !== filtros.marca) {
      return false;
    }

    // Filtro por sector de almacenamiento
    if (filtros.sectorAlmacenamiento && producto.sectorAlmacenamiento !== filtros.sectorAlmacenamiento) {
      return false;
    }

    // Filtro por código personalizado
    if (filtros.codigoPersonalizado && producto.codigoPersonalizado !== filtros.codigoPersonalizado) {
      return false;
    }

    // Filtro por código de barras
    if (filtros.codigoBarras && producto.codigoBarras !== filtros.codigoBarras) {
      return false;
    }

    // Filtro por estado activo
    if (filtros.activo !== undefined && producto.activo !== filtros.activo) {
      return false;
    }

    // Filtro por stock bajo
    if (filtros.stockBajo && producto.stock > (producto.stockMinimo || 0)) {
      return false;
    }

    return true;
  });

  const limpiarFiltros = () => {
    // Mantener solo los filtros que queremos preservar
    const stockBajoActual = filtros.stockBajo;
    setFiltros({ stockBajo: stockBajoActual });
    setBusqueda('');
  };

  const cambiarStock = async (producto: Producto, cambio: number) => {
    if (!empresaId) {
      console.error('No hay empresaId para cambiar stock');
      return;
    }
    
    const nuevoStock = Math.max(0, producto.stock + cambio);
    
    console.log('=== DEBUG CAMBIAR STOCK ===');
    console.log('Producto ID:', producto.id);
    console.log('Stock actual:', producto.stock);
    console.log('Cambio:', cambio);
    console.log('Nuevo stock:', nuevoStock);
    console.log('EmpresaId:', empresaId);
    
    try {
      // Usar el endpoint específico de stock
      const response = await ApiService.actualizarStock(
        empresaId,
        producto.id,
        nuevoStock
      );

      console.log('Respuesta de actualización de stock:', response);

      if (response && response.data) {
        // Actualizar el estado local
        setProductos(productos.map(p => 
          p.id === producto.id 
            ? { ...p, stock: nuevoStock }
            : p
        ));
        
        console.log(`Stock actualizado exitosamente para producto ${producto.id}: ${producto.stock} -> ${nuevoStock}`);
      } else {
        console.error('Respuesta inesperada al actualizar stock:', response);
      }
    } catch (error) {
      console.error('Error detallado al actualizar stock:', error);
      
      // Mostrar información del error para debug
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown } };
        console.error('Status del error:', axiosError.response?.status);
        console.error('Data del error:', axiosError.response?.data);
      }
    }
  };

  const irADetalle = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setModalDetalleAbierto(true);
  };

  const irAEditar = (producto: Producto) => {
    navigate(`/admin/productos/editar/${producto.id}`);
  };

  const eliminarProducto = async (producto: Producto) => {
    if (!empresaId) {
      console.error('No hay empresaId para eliminar producto');
      return;
    }

    // Confirmar eliminación
    const confirmar = window.confirm(
      `¿Estás seguro de que quieres eliminar "${producto.nombre}"?\n\n⚠️ Esta acción marcará el producto como inactivo y:\n` +
      `• No se mostrará en el catálogo público\n` +
      `• No aparecerá en búsquedas por escáner\n` +
      `• No estará disponible para ventas\n\n` +
      `El producto se puede reactivar más tarde desde la vista de productos inactivos.`
    );
    
    if (!confirmar) {
      return;
    }

    try {
      console.log('=== DEBUG ELIMINAR PRODUCTO ===');
      console.log('EmpresaId:', empresaId);
      console.log('ProductoId:', producto.id);
      console.log('Producto:', producto.nombre);
      
      // Llamar al endpoint de eliminar
      await ApiService.eliminarProducto(empresaId, producto.id);
      
      // Actualizar la lista local
      setProductos(productos.filter(p => p.id !== producto.id));
      
      console.log('Producto eliminado exitosamente');
      
      // Mostrar mensaje de éxito
      alert(`✅ Producto "${producto.nombre}" eliminado exitosamente.\n\nEl producto ha sido marcado como inactivo y:\n` +
        `• No aparecerá en el catálogo público\n` +
        `• No será encontrado por el escáner\n` +
        `• No estará disponible para ventas\n\n` +
        `Para reactivarlo, ve a la vista de productos inactivos.`);
      
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      
      // Mostrar información del error para debug
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown } };
        console.error('Status del error:', axiosError.response?.status);
        console.error('Data del error:', axiosError.response?.data);
      }
      
      alert('Error al eliminar el producto. Por favor, intenta nuevamente.');
    }
  };

  const reactivarProducto = async (producto: Producto) => {
    if (!empresaId) {
      console.error('No hay empresaId para reactivar producto');
      return;
    }

    // Confirmar reactivación
    const confirmar = window.confirm(
      `¿Estás seguro de que quieres reactivar "${producto.nombre}"?\n\n✅ Esta acción marcará el producto como activo y:\n` +
      `• Aparecerá en el catálogo público\n` +
      `• Será encontrado por el escáner\n` +
      `• Estará disponible para ventas`
    );
    
    if (!confirmar) {
      return;
    }

    try {
      console.log('=== DEBUG REACTIVAR PRODUCTO ===');
      console.log('EmpresaId:', empresaId);
      console.log('ProductoId:', producto.id);
      console.log('Producto:', producto.nombre);
      
      // Llamar al endpoint de reactivar
      await ApiService.reactivarProducto(empresaId, producto.id);
      
      // Actualizar la lista local
      setProductos(productos.map(p => 
        p.id === producto.id ? { ...p, activo: true } : p
      ));
      
      console.log('Producto reactivado exitosamente');
      
      // Mostrar mensaje de éxito
      alert(`✅ Producto "${producto.nombre}" reactivado exitosamente.\n\nEl producto ahora está activo y disponible para ventas.`);
      
    } catch (error) {
      console.error('Error al reactivar producto:', error);
      
      // Mostrar información del error para debug
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown } };
        console.error('Status del error:', axiosError.response?.status);
        console.error('Data del error:', axiosError.response?.data);
      }
      
      alert('Error al reactivar el producto. Por favor, intenta nuevamente.');
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/admin/login';
  };

  // Funciones para el escáner de códigos de barras
  const manejarEscaneoBarras = (codigoBarras: string) => {
    console.log("✅ Código escaneado en gestión de productos:", codigoBarras);
    // Reproducir sonido "pi"
    playBeepSound();
    // Solo buscar productos activos cuando se escanea un código de barras
    setFiltros(prev => ({ ...prev, codigoBarras, activo: true }));
    setMostrarScanner(false);
  };

  const abrirScanner = () => {
    setMostrarScanner(true);
  };

  // Funciones para el sistema de escáner de stock
  const abrirModalSeleccionScanner = () => {
    setMostrarModalSeleccionScanner(true);
  };

  const seleccionarScannerCámara = () => {
    setMostrarModalSeleccionScanner(false);
    setMostrarScannerStock(true);
    setProductoEscaneado(null);
    setCantidadStock(1);
    setProductosAgregados([]);
    setMostrarResumen(false);
  };

  const seleccionarScannerUSB = () => {
    setMostrarModalSeleccionScanner(false);
    setMostrarScannerUSB(true);
    setProductoEscaneado(null);
    setCantidadStock(1);
    setProductosAgregados([]);
    setMostrarResumen(false);
  };

  const irAHistorialCarga = () => {
    navigate('/admin/historial-carga-productos');
  };
  
  // Funciones para importación masiva
  const abrirImportacion = () => {
    setMostrarImportacion(true);
  };
  
  const cerrarImportacion = () => {
    setMostrarImportacion(false);
  };
  
  const onImportacionCompletada = () => {
    setMostrarImportacion(false);
    // Recargar productos después de la importación
    cargarProductos();
  };

  // Función para descargar reporte de stock
  const descargarReporteStock = async () => {
    if (!empresaId) {
      alert('Error: No se pudo identificar la empresa');
      return;
    }

    try {
      setCargando(true);
      console.log('📊 Descargando reporte de stock para empresa:', empresaId);
      
      const blob = await ApiService.descargarReporteStock(empresaId);
      
      // Crear un enlace para descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_stock_${empresaId}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Reporte de stock descargado exitosamente');
      alert('✅ Reporte de stock descargado exitosamente');
      
    } catch (error) {
      console.error('❌ Error al descargar reporte de stock:', error);
      alert('❌ Error al descargar el reporte de stock. Por favor, intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  const manejarEscaneoStock = async (codigoBarras: string) => {
    console.log("📦 Código escaneado para agregar stock:", codigoBarras);
    
    // Reproducir sonido "pi"
    playBeepSound();
    
    // Buscar el producto por código de barras
    const producto = productos.find(p => p.codigoBarras === codigoBarras);
    
    if (producto) {
      // Guardar automáticamente con cantidad por defecto (1)
      try {
        setGuardandoStock(true);
        
        // Guardar el stock original antes de modificarlo
        setStockOriginal(producto.stock);
        
        // Agregar el producto a la lista de productos agregados
        const nuevoProducto = { producto, cantidad: 1, stockOriginal: producto.stock };
        setProductosAgregados(prev => [...prev, nuevoProducto]);
        
        // Actualizar el stock en el servidor
        const nuevoStock = producto.stock + 1;
        await ApiService.actualizarStock(empresaId!, producto.id, nuevoStock);
        
        // Actualizar el estado local
        setProductos(prev => prev.map(p => 
          p.id === producto.id ? { ...p, stock: nuevoStock } : p
        ));
        
        // Mostrar el producto escaneado con stock actualizado
        setProductoEscaneado({ ...producto, stock: nuevoStock });
        setCantidadStock(1);
        setMostrarScannerStock(false);
        
      } catch (error) {
        console.error('Error al agregar stock:', error);
        alert('Error al agregar stock. Por favor, intenta nuevamente.');
      } finally {
        setGuardandoStock(false);
      }
    } else {
      alert(`❌ Producto no encontrado\n\nEl código de barras "${codigoBarras}" no corresponde a ningún producto en el inventario.`);
    }
  };

  const seguirEscaneando = async () => {
    if (!productoEscaneado || !empresaId) return;
    
    try {
      setGuardandoStock(true);
      
      // Actualizar la cantidad del último producto agregado
      const ultimoProducto = productosAgregados[productosAgregados.length - 1];
      if (ultimoProducto && ultimoProducto.producto.id === productoEscaneado.id) {
        // Actualizar la cantidad en la lista
        setProductosAgregados(prev => prev.map((item, index) => 
          index === prev.length - 1 ? { ...item, cantidad: cantidadStock } : item
        ));
        
        // Calcular la diferencia de stock
        const diferenciaStock = cantidadStock - ultimoProducto.cantidad;
        const nuevoStock = stockOriginal + cantidadStock;
        
        // Actualizar el stock en el servidor
        await ApiService.actualizarStock(empresaId, productoEscaneado.id, nuevoStock);
        
        // Actualizar el estado local
        setProductos(prev => prev.map(p => 
          p.id === productoEscaneado.id ? { ...p, stock: nuevoStock } : p
        ));
        
        // Actualizar el producto escaneado con el nuevo stock
        setProductoEscaneado({ ...productoEscaneado, stock: nuevoStock });
      }
      
      // Limpiar para el siguiente escaneo
      setProductoEscaneado(null);
      setCantidadStock(1);
      
      // Volver a abrir el escáner
      setMostrarScannerStock(true);
      
    } catch (error) {
      console.error('Error al actualizar stock:', error);
      alert('Error al actualizar stock. Por favor, intenta nuevamente.');
    } finally {
      setGuardandoStock(false);
    }
  };

  const terminarIngresoStock = () => {
    setModoTerminar(true);
    setMostrarResumen(true);
    setMostrarScannerStock(false);
  };

  const cerrarResumenStock = () => {
    setMostrarResumen(false);
    setModoTerminar(false);
    setProductosAgregados([]);
    setProductoEscaneado(null);
    setStockOriginal(0);
    setCantidadStock(1);
  };

  const continuarEscaneando = () => {
    setMostrarResumen(false);
    setModoTerminar(false);
    setMostrarScannerStock(true);
  };

  if (cargando) {
    return (
      <div className="h-pantalla-minimo pagina-con-navbar" style={{ backgroundColor: 'var(--color-fondo)' }}>
        <NavbarAdmin 
          onCerrarSesion={cerrarSesion}
          empresaNombre={empresaNombre}
          nombreAdministrador={nombreAdministrador}
        />
        <div className="contenedor py-8">
          <div className="tarjeta text-center py-12">
            <div className="spinner mx-auto mb-4"></div>
            <p className="texto-gris">Cargando productos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-pantalla-minimo pagina-con-navbar" style={{ backgroundColor: 'var(--color-fondo)' }}>
      {/* Navegación */}
      <NavbarAdmin 
        onCerrarSesion={cerrarSesion}
        empresaNombre={empresaNombre}
        nombreAdministrador={nombreAdministrador}
      />

      {/* Contenido principal */}
      <div className="contenedor" style={{ 
        paddingTop: isMobile ? '4rem' : '2rem',
        paddingBottom: '2rem'
      }}>
        {/* Header con título y descripción */}
        <div style={{
          marginBottom: '3rem',
          animation: 'slideInUp 0.6s ease-out 0.1s both'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Gestión de Productos
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: '#64748b',
            lineHeight: '1.6'
          }}>
            Administra tu catálogo de productos, añade nuevos items y gestiona el inventario de tu negocio.
          </p>
        </div>

        {/* Acciones rápidas */}
        <div style={{
          marginBottom: '3rem',
          animation: 'slideInUp 0.6s ease-out 0.2s both'
        }}>
          <h2 style={{
            fontSize: '1.875rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '1.5rem'
          }}>
            Acciones Rápidas
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Tarjeta Nuevo Producto */}
            <div 
              onClick={() => navigate('/admin/productos/nuevo')}
              style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease',
                animation: 'slideInUp 0.6s ease-out 0.3s both'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = '#667eea';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  marginRight: '0.75rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}>
                  ➕
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '0.25rem'
                  }}>
                    Nuevo Producto
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    Añade un nuevo producto a tu inventario
                  </p>
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: '#667eea',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                Crear producto →
              </div>
            </div>

            {/* Tarjeta Scanner */}
            <div 
              onClick={abrirModalSeleccionScanner}
              style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease',
                animation: 'slideInUp 0.6s ease-out 0.4s both'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = '#8b5cf6';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  marginRight: '0.75rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}>
                  📱
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '0.25rem'
                  }}>
                    Scanner
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    Escanea códigos de barras para añadir stock
                  </p>
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: '#8b5cf6',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                Elegir tipo de scanner →
              </div>
            </div>

            {/* Tarjeta Historial de Carga */}
            <div 
              onClick={irAHistorialCarga}
              style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease',
                animation: 'slideInUp 0.6s ease-out 0.6s both'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = '#f59e0b';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  marginRight: '0.75rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}>
                  📊
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '0.25rem'
                  }}>
                    Historial de Carga
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    Revisa el historial de todas las operaciones de carga de productos
                  </p>
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: '#f59e0b',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                Ver historial →
              </div>
            </div>

            {/* Tarjeta Importación Masiva */}
            <div 
              onClick={abrirImportacion}
              style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease',
                animation: 'slideInUp 0.6s ease-out 0.7s both'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = '#10b981';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  marginRight: '0.75rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}>
                  📥
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '0.25rem'
                  }}>
                    Importación Masiva
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    Carga múltiples productos desde un archivo Excel
                  </p>
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: '#10b981',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                Importar productos →
              </div>
            </div>

            {/* Tarjeta Reporte de Stock */}
            <div 
              onClick={cargando ? undefined : descargarReporteStock}
              style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                cursor: cargando ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease',
                animation: 'slideInUp 0.6s ease-out 0.8s both',
                opacity: cargando ? 0.7 : 1
              }}
              onMouseOver={(e) => {
                if (!cargando) {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = '#3b82f6';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  marginRight: '0.75rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}>
                  📊
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '0.25rem'
                  }}>
                    Reporte de Stock
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    Descarga un reporte completo del inventario en Excel
                  </p>
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: cargando ? '#64748b' : '#3b82f6',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                {cargando ? '⏳ Descargando...' : 'Descargar reporte →'}
              </div>
            </div>
          </div>
        </div>

        {/* Mensaje de error mejorado */}
        {error && (
          <div className="tarjeta mb-6" style={{
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: '1px solid #fecaca',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <div className="flex items-center mb-4">
              <span style={{ fontSize: '24px', marginRight: '12px' }}>⚠️</span>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#dc2626' }}>
                Error al cargar productos
              </h3>
            </div>
            <p style={{ margin: '0 0 12px 0', color: '#991b1b', fontSize: '14px' }}>
              {error}
            </p>
            <details style={{ fontSize: '12px', color: '#7f1d1d' }}>
              <summary style={{ cursor: 'pointer', fontWeight: '500' }}>Información de debug</summary>
              <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
                <p>EmpresaId: {empresaId}</p>
                <p>Token: {localStorage.getItem('token') ? 'Presente' : 'Ausente'}</p>
                {localStorage.getItem('token') && (
                  <div>
                    <p>Token (primeros 50 caracteres):</p>
                    <code style={{ wordBreak: 'break-all', fontSize: '10px' }}>
                      {localStorage.getItem('token')?.substring(0, 50)}...
                    </code>
                  </div>
                )}
              </div>
            </details>
          </div>
        )}

        {/* Filtros y controles mejorados */}
        {productos.length > 0 && (
          <div className="tarjeta mb-6" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <div className="mb-6">
              <h3 className="titulo-3 mb-4" style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '16px'
              }}>
                🔍 Filtros y Búsqueda
              </h3>
              
              {/* Barra de búsqueda con escáner y filtro de stock */}
              <div className="mb-4">
                {isMobile ? (
                  // Layout móvil: elementos apilados verticalmente
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Campo de búsqueda por nombre */}
                    <div className="relative">
                      <div className="absolute" style={{ top: '50%', left: '16px', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        <span style={{ color: '#64748b', fontSize: '18px' }}>🔍</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar productos por nombre o descripción..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="campo"
                        style={{ 
                          paddingLeft: '48px',
                          fontSize: '16px',
                          borderRadius: '12px',
                          border: '2px solid #e2e8f0',
                          transition: 'all 0.2s ease',
                          width: '100%',
                          minHeight: '48px'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#3b82f6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    {/* Campo de código de barras con botón de escanear */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div className="relative" style={{ flex: 1 }}>
                        <div className="absolute" style={{ top: '50%', left: '12px', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                          <span style={{ color: '#64748b', fontSize: '16px' }}>📊</span>
                        </div>
                        <input
                          type="text"
                          placeholder="Código de barras..."
                          value={filtros.codigoBarras || ''}
                          onChange={(e) => setFiltros(prev => ({ ...prev, codigoBarras: e.target.value || undefined }))}
                          className="campo"
                          style={{ 
                            paddingLeft: '36px',
                            fontSize: '14px',
                            borderRadius: '8px',
                            border: '2px solid #e2e8f0',
                            transition: 'all 0.2s ease',
                            width: '100%',
                            minHeight: '44px'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#3b82f6';
                            e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e2e8f0';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                      
                      <button
                        onClick={abrirScanner}
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          minHeight: '44px',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.3)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        title="Escanear código de barras"
                      >
                        📷 Escanear
                      </button>
                    </div>

                    {/* Checkbox de solo stock bajo */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filtros.stockBajo || false}
                          onChange={(e) => setFiltros({...filtros, stockBajo: e.target.checked || undefined})}
                          style={{ 
                            width: '18px',
                            height: '18px',
                            accentColor: '#ef4444'
                          }}
                        />
                        <span style={{ fontSize: '14px', color: '#374151', whiteSpace: 'nowrap' }}>
                          📉 Solo stock bajo
                        </span>
                      </label>
                    </div>
                  </div>
                ) : (
                  // Layout desktop/tablet: elementos en línea
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {/* Campo de búsqueda por nombre */}
                    <div className="relative" style={{ flex: 1 }}>
                      <div className="absolute" style={{ top: '50%', left: '16px', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        <span style={{ color: '#64748b', fontSize: '18px' }}>🔍</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar productos por nombre o descripción..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="campo"
                        style={{ 
                          paddingLeft: '48px',
                          fontSize: '16px',
                          borderRadius: '12px',
                          border: '2px solid #e2e8f0',
                          transition: 'all 0.2s ease',
                          width: '100%'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#3b82f6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    {/* Campo de código de barras con botón de escanear */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', minWidth: 'fit-content' }}>
                      <div className="relative" style={{ minWidth: '200px' }}>
                        <div className="absolute" style={{ top: '50%', left: '12px', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                          <span style={{ color: '#64748b', fontSize: '16px' }}>📊</span>
                        </div>
                        <input
                          type="text"
                          placeholder="Código de barras..."
                          value={filtros.codigoBarras || ''}
                          onChange={(e) => setFiltros(prev => ({ ...prev, codigoBarras: e.target.value || undefined }))}
                          className="campo"
                          style={{ 
                            paddingLeft: '36px',
                            fontSize: '14px',
                            borderRadius: '8px',
                            border: '2px solid #e2e8f0',
                            transition: 'all 0.2s ease',
                            minWidth: '200px'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#3b82f6';
                            e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e2e8f0';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                      
                      <button
                        onClick={abrirScanner}
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          minHeight: '40px'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.3)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        title="Escanear código de barras"
                      >
                        📷 Escanear
                      </button>
                    </div>

                    {/* Checkbox de solo stock bajo */}
                    <div style={{ minWidth: 'fit-content' }}>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filtros.stockBajo || false}
                          onChange={(e) => setFiltros({...filtros, stockBajo: e.target.checked || undefined})}
                          style={{ 
                            width: '18px',
                            height: '18px',
                            accentColor: '#ef4444'
                          }}
                        />
                        <span style={{ fontSize: '14px', color: '#374151', whiteSpace: 'nowrap' }}>
                          📉 Solo stock bajo
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Filtros */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: isMobile ? '12px' : '16px',
                marginBottom: '16px'
              }}>
                <select 
                  value={filtros.categoria || ''} 
                  onChange={(e) => setFiltros({...filtros, categoria: e.target.value || undefined})}
                  className="campo"
                  style={{ 
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0',
                    background: 'white',
                    padding: '10px 12px',
                    minHeight: '44px',
                    width: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="">📂 Todas las categorías</option>
                  {categorias.map(categoria => (
                    <option key={categoria} value={categoria}>{categoria}</option>
                  ))}
                </select>

                <select 
                  value={filtros.marca || ''} 
                  onChange={(e) => setFiltros({...filtros, marca: e.target.value || undefined})}
                  className="campo"
                  style={{ 
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0',
                    background: 'white',
                    padding: '10px 12px',
                    minHeight: '44px',
                    width: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="">🏷️ Todas las marcas</option>
                  {marcas.map(marca => (
                    <option key={marca} value={marca}>{marca}</option>
                  ))}
                </select>

                {sectoresAlmacenamiento.length > 0 && (
                  <select 
                    value={filtros.sectorAlmacenamiento || ''} 
                    onChange={(e) => setFiltros({...filtros, sectorAlmacenamiento: e.target.value || undefined})}
                    className="campo"
                    style={{ 
                      fontSize: '14px',
                      borderRadius: '8px',
                      border: '2px solid #e2e8f0',
                      background: 'white',
                      padding: '10px 12px',
                      minHeight: '44px',
                      width: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="">🏢 Todos los sectores</option>
                    {sectoresAlmacenamiento.map(sector => (
                      <option key={sector} value={sector}>{sector}</option>
                    ))}
                  </select>
                )}

                {codigosPersonalizados.length > 0 && (
                  <select 
                    value={filtros.codigoPersonalizado || ''} 
                    onChange={(e) => setFiltros({...filtros, codigoPersonalizado: e.target.value || undefined})}
                    className="campo"
                    style={{ 
                      fontSize: '14px',
                      borderRadius: '8px',
                      border: '2px solid #e2e8f0',
                      background: 'white',
                      padding: '10px 12px',
                      minHeight: '44px',
                      width: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="">🔢 Todos los códigos</option>
                    {codigosPersonalizados.map(codigo => (
                      <option key={codigo} value={codigo}>{codigo}</option>
                    ))}
                  </select>
                )}

                <select 
                  value={filtros.activo === undefined ? '' : filtros.activo.toString()} 
                  onChange={(e) => setFiltros({...filtros, activo: e.target.value === '' ? undefined : e.target.value === 'true'})}
                  className="campo"
                  style={{ 
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0',
                    background: 'white',
                    padding: '10px 12px',
                    minHeight: '44px',
                    width: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="">🔄 Todos los estados</option>
                  <option value="true">✅ Activos</option>
                  <option value="false">❌ Inactivos</option>
                </select>
              </div>

              {/* Filtros adicionales */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  
                </div>

              </div>
            </div>

            {/* Controles de vista */}
            <div className="flex items-center justify-between pt-4" style={{ 
              borderTop: '1px solid #e2e8f0',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '16px' : '0'
            }}>
              {isMobile ? (
                // Layout móvil: elementos apilados
                <>
                  <div className="flex items-center justify-center">
                    <div style={{
                      background: '#f1f5f9',
                      color: '#64748b',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      📊 {productosFiltrados.length} de {productos.length} productos
                    </div>
                  </div>
                  
                  {/* Botón Limpiar Filtros */}
                  {(busqueda || Object.keys(filtros).length > 0) && (
                    <div className="flex items-center justify-center">
                      <button 
                        onClick={limpiarFiltros} 
                        className="boton boton-secundario"
                        style={{
                          background: 'white',
                          color: '#64748b',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = '#3b82f6';
                          e.currentTarget.style.color = '#3b82f6';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.color = '#64748b';
                        }}
                      >
                        🗑️ Limpiar filtros
                      </button>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 justify-center">
                    <span style={{ fontSize: '14px', color: '#64748b', marginRight: '8px' }}>Vista:</span>
                    {/* Ocultar botón de lista en móvil */}
                    {!isMobile && (
                      <button 
                        className={`boton ${vista === 'lista' ? 'boton-primario' : 'boton-secundario'}`}
                        onClick={() => setVista('lista')}
                        title="Vista de lista"
                        style={{
                          background: vista === 'lista' ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'white',
                          color: vista === 'lista' ? 'white' : '#64748b',
                          border: '2px solid',
                          borderColor: vista === 'lista' ? '#3b82f6' : '#e2e8f0',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ☰
                      </button>
                    )}
                    <button 
                      className={`boton ${vista === 'intermedia' ? 'boton-primario' : 'boton-secundario'}`}
                      onClick={() => setVista('intermedia')}
                      title="Vista intermedia"
                      style={{
                        background: vista === 'intermedia' ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'white',
                        color: vista === 'intermedia' ? 'white' : '#64748b',
                        border: '2px solid',
                        borderColor: vista === 'intermedia' ? '#3b82f6' : '#e2e8f0',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ⊟
                    </button>
                    <button 
                      className={`boton ${vista === 'cuadricula' ? 'boton-primario' : 'boton-secundario'}`}
                      onClick={() => setVista('cuadricula')}
                      title="Vista de cuadrícula"
                      style={{
                        background: vista === 'cuadricula' ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'white',
                        color: vista === 'cuadricula' ? 'white' : '#64748b',
                        border: '2px solid',
                        borderColor: vista === 'cuadricula' ? '#3b82f6' : '#e2e8f0',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ⊞
                    </button>
                  </div>
                </>
              ) : (
                // Layout desktop/tablet: elementos en línea
                <>
                  <div className="flex items-center gap-4" style={{flex: 1}}>
                    <div style={{
                      background: '#f1f5f9',
                      color: '#64748b',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      📊 {productosFiltrados.length} de {productos.length} productos
                    </div>
                  </div>
                  
                  {/* Botón Limpiar Filtros centrado */}
                  {(busqueda || Object.keys(filtros).length > 0) && (
                    <div className="flex items-center justify-center" style={{flex: 1}}>
                      <button 
                        onClick={limpiarFiltros} 
                        className="boton boton-secundario"
                        style={{
                          background: 'white',
                          color: '#64748b',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = '#3b82f6';
                          e.currentTarget.style.color = '#3b82f6';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.color = '#64748b';
                        }}
                      >
                        🗑️ Limpiar filtros
                      </button>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2" style={{flex: 'none', justifyContent: 'flex-end', minWidth: isMobile ? '200px' : '320px'}}>
                    <span style={{ fontSize: '14px', color: '#64748b', marginRight: '8px' }}>Vista:</span>
                    {/* Ocultar botón de lista en móvil */}
                    {!isMobile && (
                      <button 
                        className={`boton ${vista === 'lista' ? 'boton-primario' : 'boton-secundario'}`}
                        onClick={() => setVista('lista')}
                        title="Vista de lista"
                        style={{
                          background: vista === 'lista' ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'white',
                          color: vista === 'lista' ? 'white' : '#64748b',
                          border: '2px solid',
                          borderColor: vista === 'lista' ? '#3b82f6' : '#e2e8f0',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ☰
                      </button>
                    )}
                    <button 
                      className={`boton ${vista === 'intermedia' ? 'boton-primario' : 'boton-secundario'}`}
                      onClick={() => setVista('intermedia')}
                      title="Vista intermedia"
                      style={{
                        background: vista === 'intermedia' ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'white',
                        color: vista === 'intermedia' ? 'white' : '#64748b',
                        border: '2px solid',
                        borderColor: vista === 'intermedia' ? '#3b82f6' : '#e2e8f0',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ⊟
                    </button>
                    <button 
                      className={`boton ${vista === 'cuadricula' ? 'boton-primario' : 'boton-secundario'}`}
                      onClick={() => setVista('cuadricula')}
                      title="Vista de cuadrícula"
                      style={{
                        background: vista === 'cuadricula' ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'white',
                        color: vista === 'cuadricula' ? 'white' : '#64748b',
                        border: '2px solid',
                        borderColor: vista === 'cuadricula' ? '#3b82f6' : '#e2e8f0',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ⊞
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Mensajes de estado mejorados */}
        {productosFiltrados.length === 0 && !cargando && !error && productos.length > 0 && (
          <div className="tarjeta text-center py-12" style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            border: '1px solid #bae6fd',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.7 }}>🔍</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
              No se encontraron productos
            </h3>
            <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '16px' }}>
              Intenta ajustar los filtros de búsqueda
            </p>
            <button 
              onClick={limpiarFiltros} 
              className="boton boton-secundario"
              style={{
                background: 'white',
                color: '#3b82f6',
                border: '2px solid #3b82f6',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🗑️ Limpiar filtros
            </button>
          </div>
        )}

        {productos.length === 0 && !cargando && !error && (
          <div className="tarjeta text-center py-12" style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1px solid #bbf7d0',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.7 }}>📦</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
              No hay productos en tu catálogo
            </h3>
            <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '16px' }}>
              Comienza agregando tu primer producto al catálogo
            </p>
            <button 
              className="boton boton-primario"
              onClick={() => navigate('/admin/productos/nuevo')}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
              }}
            >
              ➕ Agregar Producto
            </button>
          </div>
        )}

        {/* Vista de productos */}
        {productosFiltrados.length > 0 && (
          <>
            {vista === 'lista' && !isMobile ? (
              <div className="tarjeta" style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                overflow: 'hidden'
              }}>
                <div className="tabla-productos">
                  <div className="encabezado-tabla" style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    padding: '16px 24px',
                    borderBottom: '2px solid #e2e8f0',
                    display: 'grid',
                    gridTemplateColumns: '80px 2fr 1fr 1fr 1fr 1fr 1fr',
                    gap: '16px',
                    alignItems: 'center',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    <div>🖼️ Imagen</div>
                    <div>📦 Producto</div>
                    <div>💰 Precio</div>
                    <div>📊 Stock</div>
                    <div>📂 Categoría</div>
                    <div>🔄 Estado</div>
                    <div>⚙️ Acciones</div>
                  </div>
                  
                  {productosFiltrados.map(producto => (
                    <div key={producto.id} className="fila-producto" style={{
                      padding: '0 24px',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'grid',
                      gridTemplateColumns: '80px 2fr 1fr 1fr 1fr 1fr 1fr',
                      gap: '16px',
                      alignItems: 'center',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      height: '80px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                    >
                      <div className="columna-imagen" style={{
                        height: '100%',
                        width: '80px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f8fafc',
                        borderRadius: '0',
                        border: 'none',
                        overflow: 'hidden',
                        margin: 0,
                        padding: 0
                      }}>
                        {producto.imagenes?.[0] ? (
                          <img
                            src={producto.imagenes[0]}
                            alt={producto.nombre}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: '0',
                              display: 'block',
                              margin: 0,
                              padding: 0
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#cbd5e1',
                            fontSize: '1.5rem',
                            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                            borderRadius: '0',
                            margin: 0,
                            padding: 0
                          }}>
                            📷
                          </div>
                        )}
                      </div>
                      
                      <div className="columna-nombre">
                        <h4 style={{
                          margin: '0 0 4px 0',
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1e293b',
                          cursor: 'pointer'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = '#3b82f6'}
                        onMouseOut={(e) => e.currentTarget.style.color = '#1e293b'}
                        onClick={() => irADetalle(producto)}
                        >
                          {producto.nombre}
                        </h4>
                        <p style={{
                          margin: 0,
                          fontSize: '13px',
                          color: '#64748b',
                          lineHeight: '1.4',
                          fontWeight: 500
                        }}>
                          {producto.marca || '-'}
                        </p>
                        {producto.destacado && (
                          <span style={{
                            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: '600',
                            marginTop: '4px',
                            display: 'inline-block'
                          }}>
                            ⭐ Destacado
                          </span>
                        )}
                      </div>
                      
                      <div className="columna-precio">
                        <div style={{
                          fontSize: '18px',
                          fontWeight: '700',
                          color: '#059669'
                        }}>
                          {producto.precio ? `$${producto.precio.toFixed(2)}` : 'No especificado'}
                        </div>
                      </div>
                      
                      <div className="columna-stock">
                        <div className="control-stock" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cambiarStock(producto, -1);
                            }}
                            className="boton-stock"
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              width: '24px',
                              height: '24px',
                              fontSize: '14px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            -
                          </button>
                          
                          <span className="stock" style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: producto.stock <= ((producto.stockMinimo || 0) || 0) ? '#ef4444' : '#059669',
                            minWidth: '30px',
                            textAlign: 'center'
                          }}>
                            {producto.stock}
                          </span>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cambiarStock(producto, 1);
                            }}
                            className="boton-stock"
                            style={{
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              width: '24px',
                              height: '24px',
                              fontSize: '14px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            +
                          </button>
                        </div>
                        
                        {producto.stock <= ((producto.stockMinimo || 0) || 0) && (
                          <div style={{
                            fontSize: '12px',
                            color: '#ef4444',
                            fontWeight: '500',
                            marginTop: '4px'
                          }}>
                            ⚠️ Stock bajo
                          </div>
                        )}
                      </div>
                      
                      <div className="columna-categoria">
                        <div style={{
                          background: '#f1f5f9',
                          color: '#374151',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          textAlign: 'center'
                        }}>
                          {producto.categoria}
                        </div>
                      </div>
                      
                      <div className="columna-estado">
                        <span style={{
                          background: producto.activo ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'inline-block'
                        }}>
                          {producto.activo ? '✅ Activo' : '❌ Inactivo'}
                        </span>
                      </div>
                      
                      <div className="columna-acciones">
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              irADetalle(producto);
                            }}
                            className="boton-accion"
                            style={{
                              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(59,130,246,0.3)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            👁️ Ver
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              irAEditar(producto);
                            }}
                            className="boton-accion"
                            style={{
                              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(139,92,246,0.3)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            ✏️ Editar
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (producto.activo) {
                                eliminarProducto(producto);
                              } else {
                                reactivarProducto(producto);
                              }
                            }}
                            className="boton-accion"
                            style={{
                              background: producto.activo 
                                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = producto.activo 
                                ? '0 2px 8px rgba(239,68,68,0.3)'
                                : '0 2px 8px rgba(16,185,129,0.3)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            {producto.activo ? '🗑️ Eliminar' : '✅ Reactivar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : isMobile && vista === 'lista' ? (
              // Mensaje para móvil cuando se intenta acceder a vista de lista
              <div className="tarjeta text-center py-12" style={{
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                border: '1px solid #bae6fd',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.7 }}>📱</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
                  Vista de lista no disponible
                </h3>
                <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '16px' }}>
                  En dispositivos móviles, usa la vista intermedia o cuadrícula para mejor experiencia
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button 
                    onClick={() => setVista('intermedia')} 
                    className="boton boton-primario"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    ⊟ Vista Intermedia
                  </button>
                  <button 
                    onClick={() => setVista('cuadricula')} 
                    className="boton boton-secundario"
                    style={{
                      background: 'white',
                      color: '#3b82f6',
                      border: '2px solid #3b82f6',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    ⊞ Vista Cuadrícula
                  </button>
                </div>
              </div>
            ) : vista === 'intermedia' ? (
              <div className="vista-intermedia">
                <div className="grilla-productos" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '16px'
                }}>
                  {productosFiltrados.map(producto => (
                    <div key={producto.id} className="tarjeta-producto" style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      border: '2px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '0',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(59,130,246,0.15)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                    }}
                    >
                      {/* Badges de estado */}
                      <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px', zIndex: 10 }}>
                        {producto.destacado && (
                          <span style={{
                            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                            color: 'white',
                            padding: '3px 6px',
                            borderRadius: '8px',
                            fontSize: '9px',
                            fontWeight: '600'
                          }}>
                            ⭐
                          </span>
                        )}
                        <span style={{
                          background: producto.activo ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: 'white',
                          padding: '3px 6px',
                          borderRadius: '8px',
                          fontSize: '9px',
                          fontWeight: '600'
                        }}>
                          {producto.activo ? '✅' : '❌'}
                        </span>
                      </div>

                      {/* Imagen del producto */}
                      <div className="imagen-container" style={{ 
                        width: '100%',
                        position: 'relative',
                        paddingBottom: '90%',
                        overflow: 'hidden',
                        borderRadius: '12px 12px 0 0'
                      }}>
                        {producto.imagenes?.[0] ? (
                          <img 
                            src={producto.imagenes[0]} 
                            alt={producto.nombre}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: '12px 12px 0 0',
                              border: 'none',
                              boxShadow: 'none'
                            }}
                          />
                        ) : (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748b',
                            fontSize: '16px',
                            borderRadius: '12px 12px 0 0',
                            flexDirection: 'column',
                            gap: '4px'
                          }}>
                            <span style={{ fontSize: '2rem' }}>📷</span>
                            <span style={{ fontSize: '0.875rem' }}>Sin imagen disponible</span>
                          </div>
                        )}
                      </div>

                      {/* Información del producto */}
                      <div className="info-tarjeta" style={{ padding: '16px' }}>
                        <h3 style={{
                          margin: '0 0 8px 0',
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1e293b',
                          lineHeight: '1.3'
                        }}
                        onClick={() => irADetalle(producto)}
                        >
                          {producto.nombre}
                        </h3>
                        
                        <p style={{
                          margin: '0 0 12px 0',
                          fontSize: '13px',
                          color: '#64748b',
                          lineHeight: '1.4',
                          fontWeight: '500'
                        }}>
                          {producto.marca || 'Sin marca'}
                        </p>

                        {/* Precio y stock */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div>
                            <div style={{
                              fontSize: '18px',
                              fontWeight: '700',
                              color: '#059669'
                            }}>
                              {producto.precio ? `${producto.precio.toFixed(2)}` : 'No especificado'}
                            </div>
                            <div style={{
                              fontSize: '11px',
                              color: '#64748b'
                            }}>
                              {producto.unidad}
                            </div>
                          </div>
                          
                          <div style={{ textAlign: 'right' }}>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: producto.stock <= (producto.stockMinimo || 0) ? '#ef4444' : '#059669'
                            }}>
                              Stock: {producto.stock}
                            </div>
                            {producto.stock <= (producto.stockMinimo || 0) && (
                              <div style={{
                                fontSize: '9px',
                                color: '#ef4444',
                                fontWeight: '500'
                              }}>
                                ⚠️ Bajo
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Información secundaria */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{
                            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                            color: '#374151',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '500',
                            border: '1px solid #e2e8f0'
                          }}>
                            📂 {producto.categoria}
                          </span>
                          
                          <div className="control-stock-mini" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cambiarStock(producto, -1);
                              }}
                              style={{
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                width: '20px',
                                height: '20px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              -
                            </button>
                            
                            <span style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: producto.stock <= (producto.stockMinimo || 0) ? '#ef4444' : '#059669',
                              minWidth: '25px',
                              textAlign: 'center'
                            }}>
                              {producto.stock}
                            </span>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cambiarStock(producto, 1);
                              }}
                              style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                width: '20px',
                                height: '20px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Botones de acción */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              irADetalle(producto);
                            }}
                            style={{
                              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              flex: 1
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(59,130,246,0.3)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            👁️ Ver
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              irAEditar(producto);
                            }}
                            style={{
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              flex: 1
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(245,158,11,0.3)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            ✏️ Editar
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (producto.activo) {
                                eliminarProducto(producto);
                              } else {
                                reactivarProducto(producto);
                              }
                            }}
                            style={{
                              background: producto.activo 
                                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              flex: 1
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = producto.activo 
                                ? '0 2px 8px rgba(239,68,68,0.3)'
                                : '0 2px 8px rgba(16,185,129,0.3)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            {producto.activo ? '🗑️' : '✅'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="vista-cuadricula">
                <div className="grilla-productos" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px'
                }}>
                  {productosFiltrados.map(producto => (
                    <div key={producto.id} className="tarjeta-producto" style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      border: '2px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '0',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(59,130,246,0.15)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                    }}
                    >
                      {/* Badges de estado */}
                      <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px', zIndex: 10 }}>
                        {producto.destacado && (
                          <span style={{
                            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                            color: 'white',
                            padding: '3px 6px',
                            borderRadius: '8px',
                            fontSize: '9px',
                            fontWeight: '600'
                          }}>
                            ⭐
                          </span>
                        )}
                        <span style={{
                          background: producto.activo ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: 'white',
                          padding: '3px 6px',
                          borderRadius: '8px',
                          fontSize: '9px',
                          fontWeight: '600'
                        }}>
                          {producto.activo ? '✅' : '❌'}
                        </span>
                      </div>

                      {/* Imagen del producto */}
                      <div className="imagen-container" style={{ 
                        width: '100%',
                        position: 'relative',
                        paddingBottom: '90%',
                        overflow: 'hidden',
                        borderRadius: '12px 12px 0 0'
                      }}>
                        {producto.imagenes?.[0] ? (
                          <img 
                            src={producto.imagenes[0]} 
                            alt={producto.nombre}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: '12px 12px 0 0',
                              border: 'none',
                              boxShadow: 'none'
                            }}
                          />
                        ) : (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748b',
                            fontSize: '16px',
                            borderRadius: '12px 12px 0 0',
                            flexDirection: 'column',
                            gap: '4px'
                          }}>
                            <span style={{ fontSize: '2rem' }}>📷</span>
                            <span style={{ fontSize: '0.875rem' }}>Sin imagen disponible</span>
                          </div>
                        )}
                      </div>

                      {/* Información del producto */}
                      <div className="info-tarjeta" style={{ padding: '16px' }}>
                        <h3 style={{
                          margin: '0 0 8px 0',
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1e293b',
                          lineHeight: '1.3'
                        }}
                        onClick={() => irADetalle(producto)}
                        >
                          {producto.nombre}
                        </h3>
                        
                        <p style={{
                          margin: '0 0 12px 0',
                          fontSize: '13px',
                          color: '#64748b',
                          lineHeight: '1.4',
                          fontWeight: '500'
                        }}>
                          {producto.marca || 'Sin marca'}
                        </p>

                        {/* Precio y stock */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div>
                            <div style={{
                              fontSize: '18px',
                              fontWeight: '700',
                              color: '#059669'
                            }}>
                              {producto.precio ? `${producto.precio.toFixed(2)}` : 'No especificado'}
                            </div>
                            <div style={{
                              fontSize: '11px',
                              color: '#64748b'
                            }}>
                              {producto.unidad}
                            </div>
                          </div>
                          
                          <div style={{ textAlign: 'right' }}>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: producto.stock <= (producto.stockMinimo || 0) ? '#ef4444' : '#059669'
                            }}>
                              Stock: {producto.stock}
                            </div>
                            {producto.stock <= (producto.stockMinimo || 0) && (
                              <div style={{
                                fontSize: '9px',
                                color: '#ef4444',
                                fontWeight: '500'
                              }}>
                                ⚠️ Bajo
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Información secundaria */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{
                            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                            color: '#374151',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '500',
                            border: '1px solid #e2e8f0'
                          }}>
                            📂 {producto.categoria}
                          </span>
                          
                          <div className="control-stock-mini" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cambiarStock(producto, -1);
                              }}
                              style={{
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                width: '28px',
                                height: '28px',
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(239,68,68,0.2)'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(239,68,68,0.3)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(239,68,68,0.2)';
                              }}
                            >
                              -
                            </button>
                            
                            <span style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#374151',
                              minWidth: '20px',
                              textAlign: 'center',
                              background: '#f8fafc',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0'
                            }}>
                              {producto.stock}
                            </span>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cambiarStock(producto, 1);
                              }}
                              style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                width: '28px',
                                height: '28px',
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(16,185,129,0.2)'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(16,185,129,0.3)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(16,185,129,0.2)';
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Botones de acción */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              irADetalle(producto);
                            }}
                            style={{
                              flex: 1,
                              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 2px 8px rgba(59,130,246,0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.3)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(59,130,246,0.2)';
                            }}
                          >
                            <span style={{ fontSize: '14px' }}>👁️</span>
                            Ver
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              irAEditar(producto);
                            }}
                            style={{
                              flex: 1,
                              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 2px 8px rgba(139,92,246,0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(139,92,246,0.3)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(139,92,246,0.2)';
                            }}
                          >
                            <span style={{ fontSize: '14px' }}>✏️</span>
                            Editar
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (producto.activo) {
                                eliminarProducto(producto);
                              } else {
                                reactivarProducto(producto);
                              }
                            }}
                            style={{
                              background: producto.activo 
                                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              boxShadow: producto.activo 
                                ? '0 2px 8px rgba(239,68,68,0.2)'
                                : '0 2px 8px rgba(16,185,129,0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: '44px'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = producto.activo 
                                ? '0 4px 12px rgba(239,68,68,0.3)'
                                : '0 4px 12px rgba(16,185,129,0.3)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = producto.activo 
                                ? '0 2px 8px rgba(239,68,68,0.2)'
                                : '0 2px 8px rgba(16,185,129,0.2)';
                            }}
                          >
                            {producto.activo ? '🗑️' : '✅'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Detalle de Producto */}
      {modalDetalleAbierto && productoSeleccionado && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}
        onClick={() => setModalDetalleAbierto(false)}
        >
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '20px 24px',
              borderRadius: '16px 16px 0 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>📦</span>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
                  Detalle del Producto
                </h2>
              </div>
              <button
                onClick={() => setModalDetalleAbierto(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  color: 'white',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
              >
                ✕
              </button>
            </div>

            {/* Contenido del modal */}
            <div style={{ 
              padding: '24px', 
              overflow: 'auto',
              flex: 1,
              display: 'flex',
              gap: '24px'
            }}>
              {/* Columna izquierda - Imagen y información principal */}
              <div style={{ flex: '0 0 300px' }}>
                {/* Imagen del producto */}
                <div style={{
                  textAlign: 'center',
                  marginBottom: '20px'
                }}>
                  {productoSeleccionado.imagenes && productoSeleccionado.imagenes.length > 0 ? (
                    <img
                      src={productoSeleccionado.imagenes[0]}
                      alt={productoSeleccionado.nombre}
                      style={{
                        width: '100%',
                        maxHeight: '250px',
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
                        objectFit: 'contain'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '200px',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '48px'
                    }}>
                      📦
                    </div>
                  )}
                </div>

                {/* Información principal */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{
                    fontSize: '22px',
                    fontWeight: '700',
                    color: '#1e293b',
                    margin: '0 0 16px 0',
                    textAlign: 'center',
                    lineHeight: '1.3'
                  }}>
                    {productoSeleccionado.nombre}
                  </h3>

                  {/* Precio destacado */}
                  <div style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '16px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>
                      PRECIO
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '800' }}>
                      ${productoSeleccionado.precio?.toLocaleString()}
                    </div>
                  </div>

                  {/* Estado y stock */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      background: productoSeleccionado.activo ? '#dcfce7' : '#fee2e2',
                      color: productoSeleccionado.activo ? '#166534' : '#991b1b',
                      padding: '12px',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                        ESTADO
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '700' }}>
                        {productoSeleccionado.activo ? '✅ Activo' : '❌ Inactivo'}
                      </div>
                    </div>

                    <div style={{
                      background: productoSeleccionado.stock > 10 ? '#dcfce7' : productoSeleccionado.stock > 0 ? '#fef3c7' : '#fee2e2',
                      color: productoSeleccionado.stock > 10 ? '#166534' : productoSeleccionado.stock > 0 ? '#92400e' : '#991b1b',
                      padding: '12px',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                        STOCK
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '700' }}>
                        {productoSeleccionado.stock} u.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna derecha - Información detallada */}
              <div style={{ flex: 1 }}>
                {/* Información básica */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#1e293b',
                    margin: '0 0 16px 0',
                    borderBottom: '2px solid #e2e8f0',
                    paddingBottom: '8px'
                  }}>
                    📋 Información Básica
                  </h4>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                  }}>
                    <div>
                      <label style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        Categoría
                      </label>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1e293b',
                        background: '#f8fafc',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}>
                        {productoSeleccionado.categoria || 'Sin categoría'}
                      </div>
                    </div>

                    <div>
                      <label style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        Marca
                      </label>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1e293b',
                        background: '#f8fafc',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}>
                        {productoSeleccionado.marca || 'Sin marca'}
                      </div>
                    </div>

                    <div>
                      <label style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        Sector
                      </label>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1e293b',
                        background: '#f8fafc',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}>
                        {productoSeleccionado.sectorAlmacenamiento || 'Sin sector'}
                      </div>
                    </div>

                    <div>
                      <label style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        Stock Mínimo
                      </label>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1e293b',
                        background: '#f8fafc',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}>
                        {productoSeleccionado.stockMinimo} unidades
                      </div>
                    </div>
                  </div>
                </div>

                {/* Códigos */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#1e293b',
                    margin: '0 0 16px 0',
                    borderBottom: '2px solid #e2e8f0',
                    paddingBottom: '8px'
                  }}>
                    🏷️ Códigos de Identificación
                  </h4>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '16px'
                  }}>
                    <div>
                      <label style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        Código Personalizado
                      </label>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1e293b',
                        fontFamily: 'monospace',
                        background: '#f8fafc',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        wordBreak: 'break-all'
                      }}>
                        {productoSeleccionado.codigoPersonalizado || 'Sin código'}
                      </div>
                    </div>

                    <div>
                      <label style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        Código de Barras
                      </label>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1e293b',
                        fontFamily: 'monospace',
                        background: '#f8fafc',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        wordBreak: 'break-all'
                      }}>
                        {productoSeleccionado.codigoBarras || 'Sin código de barras'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                {productoSeleccionado.descripcion && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: '#1e293b',
                      margin: '0 0 16px 0',
                      borderBottom: '2px solid #e2e8f0',
                      paddingBottom: '8px'
                    }}>
                      📝 Descripción
                    </h4>
                    <div style={{
                      fontSize: '14px',
                      color: '#374151',
                      lineHeight: '1.6',
                      background: '#f8fafc',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      {productoSeleccionado.descripcion}
                    </div>
                  </div>
                )}

                {/* Fechas */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#1e293b',
                    margin: '0 0 16px 0',
                    borderBottom: '2px solid #e2e8f0',
                    paddingBottom: '8px'
                  }}>
                    📅 Fechas
                  </h4>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px'
                  }}>
                    <div>
                      <label style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        Fecha de Creación
                      </label>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1e293b',
                        background: '#f8fafc',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}>
                        {new Date(productoSeleccionado.fechaCreacion || "").toLocaleDateString('es-CL')}
                      </div>
                    </div>

                    <div>
                      <label style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        Última Actualización
                      </label>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1e293b',
                        background: '#f8fafc',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}>
                        {new Date(productoSeleccionado.fechaActualizacion || "").toLocaleDateString('es-CL')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer con botones */}
            <div style={{
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              padding: '20px 24px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              flexShrink: 0
            }}>
              <button
                onClick={() => setModalDetalleAbierto(false)}
                style={{
                  background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(107,114,128,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(107,114,128,0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(107,114,128,0.3)';
                }}
              >
                <span style={{ fontSize: '16px' }}>✕</span>
                Cerrar
              </button>

              <button
                onClick={() => {
                  setModalDetalleAbierto(false);
                  irAEditar(productoSeleccionado);
                }}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(139,92,246,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(139,92,246,0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(139,92,246,0.3)';
                }}
              >
                <span style={{ fontSize: '16px' }}>✏️</span>
                Editar Producto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Componente de escáner de códigos de barras */}
      <BarcodeScanner
        isOpen={mostrarScanner}
        onScan={manejarEscaneoBarras}
        onClose={() => setMostrarScanner(false)}
      />

      {/* Modal de escáner para agregar stock */}
      <BarcodeScanner
        isOpen={mostrarScannerStock}
        onScan={manejarEscaneoStock}
        onClose={() => setMostrarScannerStock(false)}
      />

      {/* Modal de escáner USB para agregar stock */}
      {mostrarScannerUSB && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: 'white',
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔗</div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700' }}>
                Escáner USB/Bluetooth
              </h2>
              <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>
                Escanea códigos de barras con tu escáner físico
              </p>
            </div>

            {/* Contenido */}
            <div style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
              <div style={{
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                border: '1px solid #bae6fd',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                  📋 Instrucciones:
                </h3>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151', lineHeight: '1.6' }}>
                  <li>Conecta tu escáner USB/Bluetooth al dispositivo</li>
                  <li>Haz clic en el campo de texto de abajo</li>
                  <li>Escanea el código de barras del producto</li>
                  <li>El código se procesará automáticamente</li>
                </ul>
              </div>

              {/* Campo de entrada para el escáner */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '12px'
                }}>
                  🔗 Código de barras:
                </label>
                <input
                  type="text"
                  placeholder="Escanea el código aquí..."
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const codigo = e.currentTarget.value.trim();
                      if (codigo) {
                        manejarEscaneoStock(codigo);
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '18px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    background: 'white',
                    textAlign: 'center',
                    fontWeight: '600',
                    letterSpacing: '1px'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>
                  Presiona Enter o escanea directamente
                </p>
              </div>

              {/* Productos ya agregados en esta sesión */}
              {productosAgregados.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                    📋 Productos agregados en esta sesión:
                  </h4>
                  <div style={{ maxHeight: '150px', overflow: 'auto' }}>
                    {productosAgregados.map((item, index) => (
                      <div key={index} style={{
                        background: '#f8fafc',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                          {item.producto.nombre}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#059669' }}>
                          +{item.cantidad}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer con botones */}
            <div style={{
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              padding: '20px 24px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'space-between'
            }}>
              <button
                onClick={() => setMostrarScannerUSB(false)}
                style={{
                  background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '16px' }}>❌</span>
                Cancelar
              </button>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={terminarIngresoStock}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>✅</span>
                  Terminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de producto escaneado */}
      {productoEscaneado && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header compacto */}
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              padding: '16px 24px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ fontSize: '24px' }}>📦</div>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700' }}>
                  Producto Agregado
                </h2>
                <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                  Ajusta la cantidad si es necesario
                </p>
              </div>
            </div>

                        {/* Contenido */}
            <div style={{ padding: '20px', flex: 1, overflow: 'auto' }}>
              {/* Información del producto con cantidad integrada */}
              <div style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                border: '2px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  {/* Imagen del producto */}
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'white',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    border: '2px solid #e2e8f0',
                    flexShrink: 0
                  }}>
                    {productoEscaneado.imagenes && productoEscaneado.imagenes.length > 0 ? (
                      <img 
                        src={productoEscaneado.imagenes[0]} 
                        alt={productoEscaneado.nombre}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }}
                      />
                    ) : (
                      '📦'
                    )}
                  </div>
                  
                  {/* Información del producto */}
                  <div style={{ flex: 1, marginBottom: '16px' }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                      {productoEscaneado.nombre}
                    </h3>
                    <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#64748b' }}>
                      Código: {productoEscaneado.codigoBarras || 'Sin código'}
                    </p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                      Stock actual: <strong style={{ color: '#059669' }}>{stockOriginal}</strong>
                    </p>
                  </div>
                </div>

                {/* Cantidad a agregar - integrada en la misma tarjeta */}
                <div style={{
                  background: 'white',
                  borderRadius: '8px',
                  padding: '16px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <label style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1e293b',
                      whiteSpace: 'nowrap'
                    }}>
                      📊 Ajustar cantidad:
                    </label>
                    <input
                      type="number"
                      value={cantidadStock}
                      onChange={(e) => setCantidadStock(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        fontSize: '18px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        background: 'white',
                        textAlign: 'center',
                        fontWeight: '600',
                        maxWidth: '120px'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#f59e0b';
                        e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <div style={{
                      background: '#dcfce7',
                      color: '#059669',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: '1px solid #bbf7d0',
                      whiteSpace: 'nowrap'
                    }}>
                      Nuevo: <strong>{stockOriginal + cantidadStock}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Productos ya agregados en esta sesión */}
              {productosAgregados.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                    📋 Productos agregados en esta sesión:
                  </h4>
                  <div style={{ maxHeight: '100px', overflow: 'auto' }}>
                    {productosAgregados.map((item, index) => (
                      <div key={index} style={{
                        background: '#f8fafc',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        marginBottom: '6px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                          {item.producto.nombre}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#059669' }}>
                          +{item.cantidad}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer con botones */}
            <div style={{
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              padding: '20px 24px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'space-between'
            }}>
              <button
                onClick={() => setProductoEscaneado(null)}
                style={{
                  background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '16px' }}>❌</span>
                Cancelar
              </button>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={terminarIngresoStock}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>✅</span>
                  Terminar
                </button>

                <button
                  onClick={seguirEscaneando}
                  disabled={guardandoStock}
                  style={{
                    background: guardandoStock 
                      ? '#9ca3af' 
                      : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: guardandoStock ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: guardandoStock ? 0.7 : 1
                  }}
                >
                  {guardandoStock ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '16px' }}>📦</span>
                      Seguir Escaneando
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de resumen final */}
      {mostrarResumen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700' }}>
                Resumen de Ingreso de Stock
              </h2>
              <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>
                Productos agregados exitosamente
              </p>
            </div>

            {/* Contenido */}
            <div style={{ padding: '24px', flex: 1, overflow: 'auto' }}>
              {productosAgregados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📦</div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#374151' }}>
                    No se agregaron productos
                  </h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                    No se escanearon productos en esta sesión
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                      📋 Productos agregados ({productosAgregados.length}):
                    </h3>
                    <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                      {productosAgregados.map((item, index) => (
                        <div key={index} style={{
                          background: '#f8fafc',
                          padding: '16px',
                          borderRadius: '8px',
                          marginBottom: '12px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px'
                        }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'white',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            border: '1px solid #e2e8f0'
                          }}>
                                                         {item.producto.imagenes && item.producto.imagenes.length > 0 ? (
                               <img 
                                 src={item.producto.imagenes[0]} 
                                 alt={item.producto.nombre}
                                 style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                               />
                             ) : (
                               '📦'
                             )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                              {item.producto.nombre}
                            </h4>
                            <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#64748b' }}>
                              Código: {item.producto.codigoBarras || 'Sin código'}
                            </p>
                            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                              Stock anterior: <strong>{item.stockOriginal}</strong> → 
                              Stock actual: <strong style={{ color: '#059669' }}>{item.stockOriginal + item.cantidad}</strong>
                            </p>
                          </div>
                          <div style={{
                            background: '#dcfce7',
                            color: '#059669',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            border: '1px solid #bbf7d0'
                          }}>
                            +{item.cantidad}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#059669' }}>
                      ✅ Ingreso completado exitosamente
                    </h4>
                    <p style={{ margin: 0, fontSize: '14px', color: '#047857' }}>
                      Total de productos: {productosAgregados.length} | 
                      Total de unidades: {productosAgregados.reduce((sum, item) => sum + item.cantidad, 0)}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer con botones */}
            <div style={{
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              padding: '20px 24px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={cerrarResumenStock}
                style={{
                  background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '16px' }}>✕</span>
                Cerrar
              </button>

              {productosAgregados.length > 0 && !modoTerminar && (
                <button
                  onClick={continuarEscaneando}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>📦</span>
                  Continuar Escaneando
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de selección de tipo de scanner */}
      {mostrarModalSeleccionScanner && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: 'calc(100vh - 40px)',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              padding: '20px',
              textAlign: 'center',
              flexShrink: 0
            }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>📱</div>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: '700' }}>
                Seleccionar Tipo de Scanner
              </h2>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                Elige cómo quieres escanear los códigos de barras
              </p>
            </div>

            {/* Contenido */}
            <div style={{ 
              padding: '20px', 
              flex: 1, 
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Opción Scanner Cámara */}
                <button
                  onClick={seleccionarScannerCámara}
                  style={{
                    background: 'white',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    textAlign: 'left'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#10b981';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0
                  }}>
                    📱
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 3px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                      Scanner Cámara
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                      Usa la cámara de tu dispositivo para escanear códigos de barras
                    </p>
                  </div>
                  <div style={{ fontSize: '18px', color: '#10b981' }}>→</div>
                </button>

                {/* Opción Scanner USB */}
                <button
                  onClick={seleccionarScannerUSB}
                  style={{
                    background: 'white',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    textAlign: 'left'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0
                  }}>
                    🔌
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 3px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                      Scanner USB/Bluetooth
                    </h3>
                    <p style={{ margin: '0', fontSize: '13px', color: '#64748b' }}>
                      Conecta un escáner físico USB o Bluetooth para escanear
                    </p>
                  </div>
                  <div style={{ fontSize: '18px', color: '#3b82f6' }}>→</div>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <button
                onClick={() => setMostrarModalSeleccionScanner(false)}
                style={{
                  background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '16px' }}>✕</span>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importación Masiva */}
      {mostrarImportacion && empresaId && (
        <ImportacionProductos
          empresaId={empresaId}
          onCerrar={cerrarImportacion}
          onImportacionCompletada={onImportacionCompletada}
        />
      )}
    </div>
  );
};

export default GestionProductos;
