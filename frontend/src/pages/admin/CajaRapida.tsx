import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import { ventaRapidaService } from '../../services/ventaRapidaService';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
import type { Producto } from '../../types';
import BarcodeScanner from '../../components/BarcodeScanner';


// Extender la interfaz Window para incluir webkitAudioContext
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

interface ItemVenta {
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface VentaRapida {
  items: ItemVenta[];
  subtotal: number;
  total: number;
  metodoPago: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';
  montoRecibido?: number;
  vuelto?: number;
  clienteNombre?: string;
  clienteEmail?: string;
  observaciones?: string;
}

export default function CajaRapida() {
  const { isMobile } = useResponsive();
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

  // Agregar estilos CSS para animaciones
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [venta, setVenta] = useState<VentaRapida>({
    items: [],
    subtotal: 0,
    total: 0,
    metodoPago: 'EFECTIVO'
  });
  const [cargando, setCargando] = useState(true);
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [filtroProductos, setFiltroProductos] = useState('');
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([]);
  const [mostrarProductos, setMostrarProductos] = useState(false);
  const [inputCodigo, setInputCodigo] = useState('');
  const [inputMontoRecibido, setInputMontoRecibido] = useState('');
  const [inputClienteNombre, setInputClienteNombre] = useState('');
  const [inputClienteEmail, setInputClienteEmail] = useState('');
  const [inputObservaciones, setInputObservaciones] = useState('');
  const [procesandoVenta, setProcesandoVenta] = useState(false);
  
  const inputCodigoRef = useRef<HTMLInputElement>(null);
  const inputCantidadRef = useRef<HTMLInputElement>(null);
  const listaProductosRef = useRef<HTMLDivElement>(null);
  const [productoRecienAgregado, setProductoRecienAgregado] = useState<number | null>(null);

  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<number>(-1);
  const [productoParaCantidad, setProductoParaCantidad] = useState<Producto | null>(null);
  const [cantidadTemporal, setCantidadTemporal] = useState(1);
  const [modoCantidad, setModoCantidad] = useState(false);

  useEffect(() => {
    if (datosUsuario?.empresaId) {
      cargarProductos();
    }
  }, [datosUsuario?.empresaId]);

  useEffect(() => {
    // Filtrar productos cuando cambie el filtro
    if (filtroProductos.trim()) {
      const filtrados = productos.filter(producto =>
        producto.nombre.toLowerCase().includes(filtroProductos.toLowerCase()) ||
        (producto.codigoPersonalizado && producto.codigoPersonalizado.toLowerCase().includes(filtroProductos.toLowerCase())) ||
        (producto.codigoBarras && producto.codigoBarras.includes(filtroProductos))
      );
      setProductosFiltrados(filtrados);
      setMostrarProductos(filtrados.length > 0);
    } else {
      setProductosFiltrados([]);
      setMostrarProductos(false);
    }
  }, [filtroProductos, productos]);

  // Resetear selección cuando se cierra la lista
  useEffect(() => {
    if (!mostrarProductos) {
      setProductoSeleccionado(-1);
    }
  }, [mostrarProductos]);

  // Efecto para enfocar el campo de cantidad cuando se activa el modo cantidad
  useEffect(() => {
    if (modoCantidad && inputCantidadRef.current) {
      inputCantidadRef.current.focus();
      inputCantidadRef.current.select();
    }
  }, [modoCantidad]);

  // Manejar tecla Esc para salir de la sección
  useEffect(() => {
    const manejarTeclaEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        window.location.href = '/admin';
      }
    };

    document.addEventListener('keydown', manejarTeclaEsc);
    return () => {
      document.removeEventListener('keydown', manejarTeclaEsc);
    };
  }, []);



  const cargarProductos = async () => {
    try {
      setCargando(true);
      const response = await ApiService.obtenerTodosLosProductosIncluirInactivos(datosUsuario!.empresaId);
      
      if (response && response.data) {
        // Filtrar productos activos con stock
        const productosActivos = response.data.filter(p => p.activo && p.stock > 0);
        setProductos(productosActivos);
      } else {
        setProductos([]);
      }
    } catch (error: unknown) {
      console.error('Error al cargar productos:', error);
      toast.error('Error al cargar productos');
    } finally {
      setCargando(false);
    }
  };

  const calcularTotales = (items: ItemVenta[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const total = subtotal;
    return { subtotal, total };
  };

  // Seleccionar producto y activar modo cantidad
  const seleccionarProducto = (producto: Producto) => {
    setProductoParaCantidad(producto);
    setCantidadTemporal(1);
    setModoCantidad(true);
    setMostrarProductos(false);
    setProductoSeleccionado(-1);
    setInputCodigo('');
  };

  // Confirmar cantidad y agregar producto
  const confirmarCantidad = () => {
    if (!productoParaCantidad) return;

    agregarProducto(productoParaCantidad, cantidadTemporal);
    
    // Resetear estado
    setModoCantidad(false);
    setProductoParaCantidad(null);
    setCantidadTemporal(1);
    
    // Volver al campo de búsqueda con un pequeño delay
    setTimeout(() => {
      inputCodigoRef.current?.focus();
    }, 100);
  };

  // Cancelar modo cantidad
  const cancelarCantidad = () => {
    setModoCantidad(false);
    setProductoParaCantidad(null);
    setCantidadTemporal(1);
    
    // Volver al campo de búsqueda con un pequeño delay
    setTimeout(() => {
      inputCodigoRef.current?.focus();
    }, 100);
  };

  // Manejar teclas en campo de cantidad
  const manejarTeclasCantidad = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        confirmarCantidad();
        break;
      case 'Escape':
        cancelarCantidad();
        break;
      case 'ArrowUp':
        e.preventDefault();
        setCantidadTemporal(prev => Math.min(prev + 1, productoParaCantidad?.stock || 999));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setCantidadTemporal(prev => Math.max(prev - 1, 1));
        break;
    }
  };

  const agregarProducto = (producto: Producto, cantidad: number = 1) => {
    const itemExistente = venta.items.find(item => item.producto.id === producto.id);
    
    if (itemExistente) {
      const nuevaCantidad = itemExistente.cantidad + cantidad;
      if (nuevaCantidad > producto.stock) {
        toast.error(`Stock insuficiente. Disponible: ${producto.stock}`);
        return;
      }
      
      const itemsActualizados = venta.items.map(item =>
        item.producto.id === producto.id
          ? { ...item, cantidad: nuevaCantidad, subtotal: nuevaCantidad * item.precioUnitario }
          : item
      );
      
      const { subtotal, total } = calcularTotales(itemsActualizados);
      setVenta(prev => ({ ...prev, items: itemsActualizados, subtotal, total }));
    } else {
      if (cantidad > producto.stock) {
        toast.error(`Stock insuficiente. Disponible: ${producto.stock}`);
        return;
      }
      
      const nuevoItem: ItemVenta = {
        producto,
        cantidad,
        precioUnitario: producto.precio,
        subtotal: cantidad * producto.precio
      };
      
      const itemsActualizados = [nuevoItem, ...venta.items]; // Agregar al inicio de la lista
      const { subtotal, total } = calcularTotales(itemsActualizados);
      setVenta(prev => ({ ...prev, items: itemsActualizados, subtotal, total }));
    }
    
    toast.success(`${producto.nombre} agregado (${cantidad})`);
    setInputCodigo('');
    setFiltroProductos('');
    setMostrarProductos(false);
    
    // Marcar el producto recién agregado para animación
    setProductoRecienAgregado(producto.id);
    setTimeout(() => setProductoRecienAgregado(null), 2000);
    
    inputCodigoRef.current?.focus();
  };

  const actualizarCantidad = (productoId: number, nuevaCantidad: number) => {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;
    
    if (nuevaCantidad > producto.stock) {
      toast.error(`Stock insuficiente. Disponible: ${producto.stock}`);
      return;
    }
    
    if (nuevaCantidad <= 0) {
      const itemsActualizados = venta.items.filter(item => item.producto.id !== productoId);
      const { subtotal, total } = calcularTotales(itemsActualizados);
      setVenta(prev => ({ ...prev, items: itemsActualizados, subtotal, total }));
      toast.success('Producto removido');
    } else {
      const itemsActualizados = venta.items.map(item =>
        item.producto.id === productoId
          ? { ...item, cantidad: nuevaCantidad, subtotal: nuevaCantidad * item.precioUnitario }
          : item
      );
      
      const { subtotal, total } = calcularTotales(itemsActualizados);
      setVenta(prev => ({ ...prev, items: itemsActualizados, subtotal, total }));
    }
  };



  const buscarProductoPorCodigo = async (codigo: string) => {
    if (!codigo.trim()) return;
    
    try {
      // setBuscandoProducto(true); // Eliminado porque no se usa en el JSX
      
      // Buscar directamente en los productos cargados
      const productosEncontrados = productos.filter(producto =>
        (producto.nombre && producto.nombre.toLowerCase().includes(codigo.toLowerCase())) ||
        (producto.codigoPersonalizado && producto.codigoPersonalizado.toLowerCase().includes(codigo.toLowerCase())) ||
        (producto.codigoBarras && producto.codigoBarras.toLowerCase().includes(codigo.toLowerCase()))
      );
      
      if (productosEncontrados.length === 1) {
        // Si hay exactamente uno, agregarlo directamente
        agregarProducto(productosEncontrados[0], 1);
        setInputCodigo(''); // Limpiar input después de agregar
        return;
      } else if (productosEncontrados.length > 1) {
        // Si hay varios, mostrar la lista
        setFiltroProductos(codigo);
        setMostrarProductos(true);
        return;
      }
      
      // Si no hay ninguno localmente, intentar búsqueda en el servidor
      
      // Buscar por código de barras usando el endpoint que funciona
      try {
        const productosPorBarras = await ApiService.obtenerProductosPorCodigoBarras(datosUsuario!.empresaId, codigo, true);
        if (productosPorBarras.length > 0) {
          agregarProducto(productosPorBarras[0], 1);
          setInputCodigo(''); // Limpiar input después de agregar
          return;
        }
      } catch (error: unknown) {
        console.log(error);
        // Error silencioso, continuar con siguiente búsqueda
      }
      
      // Buscar por código personalizado
      try {
        const productosPorCodigo = await ApiService.obtenerProductosPorCodigo(datosUsuario!.empresaId, codigo, true);
        if (productosPorCodigo.length > 0) {
          agregarProducto(productosPorCodigo[0], 1);
          setInputCodigo(''); // Limpiar input después de agregar
          return;
        }
      } catch (error: unknown) {
        console.log(error);
        // Error silencioso, continuar con siguiente búsqueda
      }
      
      // Si no se encontró nada
      toast.error('Producto no encontrado');
      
    } catch (error: unknown) {
      console.error('Error al buscar producto:', error);
      toast.error('Error al buscar producto');
    } finally {
      // setBuscandoProducto(false); // Eliminado porque no se usa en el JSX
    }
  };

  const procesarCodigoBarras = (codigo: string) => {
    // Reproducir sonido "pi"
    playBeepSound();
    setInputCodigo(codigo);
    buscarProductoPorCodigo(codigo);
  };

  // Función para mostrar predicciones mientras escribes
  const mostrarPredicciones = (valor: string) => {
    setFiltroProductos(valor);
    setProductoSeleccionado(-1); // Resetear selección cuando cambia la búsqueda
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
          seleccionarProducto(productosFiltrados[productoSeleccionado]);
        } else if (inputCodigo.trim()) {
          buscarProductoPorCodigo(inputCodigo);
        }
        break;
      case 'Escape':
        setMostrarProductos(false);
        setProductoSeleccionado(-1);
        break;
    }
  };

  const calcularVuelto = () => {
    if (venta.metodoPago === 'EFECTIVO' && inputMontoRecibido) {
      const montoRecibido = parseFloat(inputMontoRecibido);
      return Math.max(0, montoRecibido - venta.total);
    }
    return 0;
  };

  const finalizarVenta = async () => {
    if (venta.items.length === 0) {
      toast.error('No hay productos en la venta');
      return;
    }

    if (venta.metodoPago === 'EFECTIVO' && (!inputMontoRecibido || parseFloat(inputMontoRecibido) < venta.total)) {
      toast.error('El monto recibido debe ser mayor o igual al total');
      return;
    }

    try {
      setProcesandoVenta(true);
      
      const vueltoCalculado = calcularVuelto();
      
      const ventaData = {
        clienteNombre: inputClienteNombre || 'Cliente General',
        clienteEmail: inputClienteEmail || 'venta@local.com',
        total: venta.total,
        subtotal: venta.subtotal,
        metodoPago: venta.metodoPago,
        montoRecibido: venta.metodoPago === 'EFECTIVO' ? parseFloat(inputMontoRecibido) : undefined,
        vuelto: venta.metodoPago === 'EFECTIVO' ? vueltoCalculado : undefined,
        observaciones: inputObservaciones || `Venta ${venta.metodoPago.toLowerCase()}`,
        fechaVenta: new Date().toISOString().slice(0, 19).replace('T', ' '),
        detalles: venta.items.map(item => ({
          productoId: item.producto.id,
          productoNombre: item.producto.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.subtotal
        }))
      };

      console.log('Enviando datos de venta:', ventaData);
      
      // Primero hacer debug para ver qué está pasando
      try {
        const debugResponse = await ApiService.debugVentaRapida(ventaData);
        console.log('Debug response:', debugResponse);
      } catch (debugError: unknown) {
        console.error('Error en debug:', debugError);
      }
      
      console.log('CajaRapida - Token actual:', localStorage.getItem('token'));
      console.log('CajaRapida - Datos de venta:', ventaData);
      
      const response = await ventaRapidaService.procesarVentaRapida(ventaData);
      console.log('CajaRapida - Respuesta del servicio:', response);
      
      if (!response.data) {
        throw new Error(response.mensaje || 'Error al procesar la venta');
      }
      
      toast.success('Venta finalizada correctamente');
      
      setVenta({
        items: [],
        subtotal: 0,
        total: 0,
        metodoPago: 'EFECTIVO'
      });
      setInputMontoRecibido('');
      setInputClienteNombre('');
      setInputClienteEmail('');
      setInputObservaciones('');
      
      await cargarProductos();
      
    } catch (error: unknown) {
      console.error('Error al finalizar venta:', error);
      toast.error('Error al finalizar la venta');
    } finally {
      setProcesandoVenta(false);
    }
  };

  const limpiarVenta = () => {
    setVenta({
      items: [],
      subtotal: 0,
      total: 0,
      metodoPago: 'EFECTIVO'
    });
    setInputMontoRecibido('');
    setInputClienteNombre('');
    setInputClienteEmail('');
    setInputObservaciones('');
    toast.success('Venta limpiada');
  };

  const cerrarSesionConToast = () => {
    cerrarSesion();
    toast.success('Sesión cerrada correctamente');
  };

  if (cargando) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#64748b'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p>Cargando caja rápida...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      <NavbarAdmin 
        onCerrarSesion={cerrarSesionConToast}
        empresaNombre={datosUsuario?.empresaNombre}
        nombreAdministrador={datosUsuario?.nombre}
      />

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '4rem 1rem 2rem 1rem'
      }}>
        <div style={{
          marginBottom: isMobile ? '2rem' : '3rem',
          paddingTop: isMobile ? '4rem' : '1rem'
        }}>
          <div>
            <h1 style={{
              fontSize: isMobile ? '2rem' : '2.5rem',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              💰 Caja Rápida
            </h1>
            <p style={{
              fontSize: isMobile ? '1rem' : '1.125rem',
              color: '#64748b',
              lineHeight: '1.6'
            }}>
              Sistema de punto de venta para ventas cara a cara
            </p>
          </div>
          
          {/* Card Historial de Ventas */}
          <div style={{
            marginTop: '2rem',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <Link 
              to="/admin/historial-ventas"
              style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '1.5rem 2rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e2e8f0',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                maxWidth: '400px',
                width: '100%'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(139, 92, 246, 0.15)';
                e.currentTarget.style.borderColor = '#8b5cf6';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
              }}>
                📊
              </div>
              <div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 0.25rem 0'
                }}>
                  Historial de Ventas
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#64748b',
                  margin: 0
                }}>
                  Consulta el historial de ventas rápidas
                </p>
              </div>
            </Link>
          </div>
        </div>

        <div style={{
          display: isMobile ? 'flex' : 'grid',
          flexDirection: isMobile ? 'column' : 'row',
          gridTemplateColumns: isMobile ? 'none' : '350px 1fr 350px',
          gap: isMobile ? '1rem' : '1.5rem',
          height: isMobile ? 'auto' : 'calc(100vh - 320px)' // Ajustado para más espacio del navbar
        }}>
          {/* Panel izquierdo - Controles */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: isMobile ? '1rem' : '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            height: isMobile ? 'auto' : 'fit-content',
            position: isMobile ? 'static' : 'sticky',
            top: isMobile ? 'auto' : '1rem',
            order: isMobile ? 1 : 0
          }}>
            {/* Título y búsqueda */}
            <h3 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: isMobile ? '1rem' : '1.5rem',
              textAlign: 'center'
            }}>
              🛒 Caja Rápida
            </h3>
            
            {/* Búsqueda de productos */}
            <div style={{ marginBottom: isMobile ? '1rem' : '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '600',
                color: '#1e293b',
                fontSize: isMobile ? '0.875rem' : '1rem'
              }}>
                🔍 Buscar Producto
              </label>
              
              {/* Campo de búsqueda y cantidad */}
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: modoCantidad ? '1fr 80px' : '1fr',
                  gap: '0.5rem',
                  alignItems: 'end'
                }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={inputCodigoRef}
                      type="text"
                      placeholder={modoCantidad ? "Producto seleccionado" : "Código, nombre o escanear..."}
                      value={inputCodigo}
                      onChange={(e) => {
                        if (!modoCantidad) {
                          const valor = e.target.value;
                          setInputCodigo(valor);
                          mostrarPredicciones(valor);
                        }
                      }}
                      onKeyDown={manejarTeclas}
                      disabled={modoCantidad}
                      style={{
                        width: '100%',
                        height: isMobile ? '44px' : '48px',
                        padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        outline: 'none',
                        background: modoCantidad ? '#f3f4f6' : 'white',
                        color: modoCantidad ? '#6b7280' : '#1e293b'
                      }}
                    />
                    
                    {/* Lista de productos filtrados */}
                    {mostrarProductos && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    maxHeight: '250px',
                    overflowY: 'auto'
                  }}>
                    {productosFiltrados.length === 0 ? (
                      <div style={{
                        padding: '1rem',
                        textAlign: 'center',
                        color: '#64748b',
                        fontSize: '0.875rem'
                      }}>
                        No se encontraron productos
                      </div>
                    ) : (
                                              productosFiltrados.map((producto, index) => (
                          <div
                            key={producto.id}
                            onClick={() => seleccionarProducto(producto)}
                            style={{
                              padding: '0.75rem 1rem',
                              borderBottom: '1px solid #f1f5f9',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: productoSeleccionado === index ? '#3b82f6' : 'white',
                              color: productoSeleccionado === index ? 'white' : '#1e293b'
                            }}
                            onMouseOver={(e) => {
                              if (productoSeleccionado !== index) {
                                e.currentTarget.style.background = '#f8fafc';
                              }
                            }}
                            onMouseOut={(e) => {
                              if (productoSeleccionado !== index) {
                                e.currentTarget.style.background = 'white';
                              }
                            }}
                          >
                                                      <div style={{ flex: 1 }}>
                              <div style={{ 
                                fontWeight: '600', 
                                color: productoSeleccionado === index ? 'white' : '#1e293b' 
                              }}>
                                {producto.nombre}
                              </div>
                              <div style={{ 
                                fontSize: '0.875rem', 
                                color: productoSeleccionado === index ? '#e2e8f0' : '#64748b' 
                              }}>
                                Stock: {producto.stock} | ${producto.precio}
                              </div>
                            </div>
                            <div style={{ 
                              fontSize: '0.875rem', 
                              color: productoSeleccionado === index ? '#1e293b' : '#3b82f6',
                              fontWeight: '600',
                              padding: '0.25rem 0.5rem',
                              background: productoSeleccionado === index ? 'white' : '#eff6ff',
                              borderRadius: '0.25rem'
                            }}>
                              Seleccionar
                            </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                  </div>

                  {/* Campo de cantidad */}
                  {modoCantidad && (
                    <div>
                      <input
                        ref={inputCantidadRef}
                        type="number"
                        min="1"
                        max={productoParaCantidad?.stock || 999}
                        value={cantidadTemporal}
                        onChange={(e) => setCantidadTemporal(Math.max(1, parseInt(e.target.value) || 1))}
                        onKeyDown={manejarTeclasCantidad}
                        style={{
                          width: '100%',
                          height: isMobile ? '44px' : '48px',
                          padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem',
                          border: '2px solid #3b82f6',
                          borderRadius: '0.5rem',
                          fontSize: isMobile ? '0.875rem' : '1rem',
                          textAlign: 'center',
                          fontWeight: '600',
                          background: 'white'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Información del producto seleccionado */}
                {modoCantidad && productoParaCantidad && (
                  <div style={{
                    background: 'white',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    border: '2px solid #3b82f6',
                    marginTop: '0.5rem',
                    fontSize: '0.75rem'
                  }}>
                    <div style={{ color: '#64748b', marginBottom: '0.25rem' }}>
                      <strong>Producto:</strong> {productoParaCantidad.nombre}
                    </div>
                    <div style={{ color: '#64748b', marginBottom: '0.25rem' }}>
                      <strong>Stock:</strong> {productoParaCantidad.stock}
                    </div>
                    <div style={{ color: '#3b82f6', fontWeight: '600' }}>
                      💡 Enter para agregar • Escape para cancelar • ↑↓ para cambiar cantidad
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setMostrarScanner(true)}
                style={{
                  width: '100%',
                  height: isMobile ? '44px' : '48px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
              >
                📷 Escanear Código de Barras
              </button>
            </div>
            
            {/* Guía y consejos */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '0.75rem',
              padding: isMobile ? '0.75rem' : '1rem',
              marginBottom: isMobile ? '1rem' : '1.5rem',
              border: '1px solid #e2e8f0'
            }}>
              <h4 style={{
                fontSize: isMobile ? '0.875rem' : '1rem',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: isMobile ? '0.5rem' : '0.75rem'
              }}>
                💡 Consejos Rápidos
              </h4>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                color: '#64748b',
                lineHeight: '1.5'
              }}>
                <div style={{ marginBottom: '0.5rem' }}>• Escribe para buscar automáticamente</div>
                <div style={{ marginBottom: '0.5rem' }}>• Escanea códigos de barras</div>
                <div style={{ marginBottom: '0.5rem' }}>• Edita cantidades en la lista</div>
                <div>• Usa Enter para buscar rápido</div>
              </div>
            </div>
            

          </div>
          
          {/* Panel central - Lista de productos */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: isMobile ? '1rem' : '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            height: isMobile ? 'auto' : '100%',
            order: isMobile ? 2 : 0
          }}>

            {/* Título de la lista */}
            <h3 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: isMobile ? '1rem' : '1.5rem',
              textAlign: 'center'
            }}>
              📋 Productos en Venta
            </h3>

            {/* Lista de productos en la venta - SIN SCROLL */}
            <div 
              ref={listaProductosRef}
              style={{ 
                flex: 1, 
                overflowY: 'visible',
                position: 'relative',
                paddingTop: '0.5rem'
              }}
            >

              
                              {venta.items.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: '#64748b'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
                    <p>No hay productos en la venta</p>
                    <p style={{ fontSize: '0.875rem' }}>Escribe o escanea productos para comenzar</p>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.5rem',
                    paddingTop: '0.5rem' // Espacio adicional para el primer producto
                  }}>
                  {venta.items.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '0.75rem',
                        border: productoRecienAgregado === item.producto.id 
                          ? '2px solid #10b981' 
                          : '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        background: productoRecienAgregado === item.producto.id 
                          ? '#ecfdf5' 
                          : '#f8fafc',
                        transform: productoRecienAgregado === item.producto.id 
                          ? 'scale(1.02)' 
                          : 'scale(1)',
                        transition: 'all 0.3s ease',
                        boxShadow: productoRecienAgregado === item.producto.id 
                          ? '0 4px 12px rgba(16, 185, 129, 0.2)' 
                          : 'none'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.25rem'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontWeight: '600', 
                            color: '#1e293b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            {item.producto.nombre}
                            {productoRecienAgregado === item.producto.id && (
                              <span style={{
                                fontSize: '0.75rem',
                                background: '#10b981',
                                color: 'white',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem',
                                animation: 'pulse 1s infinite'
                              }}>
                                ¡NUEVO!
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                            ${item.precioUnitario} c/u | Stock: {item.producto.stock}
                          </div>
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <button
                            onClick={() => actualizarCantidad(item.producto.id, item.cantidad - 1)}
                            style={{
                              width: '28px',
                              height: '28px',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.25rem',
                              fontSize: '1rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            -
                          </button>
                          
                          <input
                            type="number"
                            min="1"
                            max={item.producto.stock}
                            value={item.cantidad}
                            onChange={(e) => actualizarCantidad(item.producto.id, parseInt(e.target.value) || 0)}
                            style={{
                              width: '50px',
                              padding: '0.25rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '0.25rem',
                              textAlign: 'center',
                              fontSize: '0.875rem'
                            }}
                          />
                          
                          <button
                            onClick={() => actualizarCantidad(item.producto.id, item.cantidad + 1)}
                            disabled={item.cantidad >= item.producto.stock}
                            style={{
                              width: '28px',
                              height: '28px',
                              background: item.cantidad >= item.producto.stock ? '#9ca3af' : '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.25rem',
                              fontSize: '1rem',
                              cursor: item.cantidad >= item.producto.stock ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                          {item.cantidad} x ${item.precioUnitario}
                        </div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>
                          ${item.subtotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Panel derecho - Detalles de la cuenta */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: isMobile ? '1rem' : '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            height: isMobile ? 'auto' : '100%',
            position: isMobile ? 'static' : 'sticky',
            top: isMobile ? 'auto' : '1rem',
            order: isMobile ? 3 : 0
          }}>
            {/* Título */}
            <h3 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: isMobile ? '1rem' : '1.5rem',
              textAlign: 'center'
            }}>
              📊 Detalles de la Cuenta
            </h3>



            {/* Resumen de totales */}
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              borderRadius: '0.75rem',
              padding: isMobile ? '1rem' : '1.5rem',
              border: '2px solid #bbf7d0',
              marginBottom: '1rem'
            }}>
              <h4 style={{
                fontSize: isMobile ? '1rem' : '1.125rem',
                fontWeight: '700',
                color: '#166534',
                marginBottom: isMobile ? '0.75rem' : '1rem',
                textAlign: 'center'
              }}>
                💰 Resumen de Totales
              </h4>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
                fontSize: '0.875rem'
              }}>
                <span style={{ color: '#64748b' }}>Productos:</span>
                <span style={{ fontWeight: '600', color: '#1e293b' }}>{venta.items.length}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
                fontSize: '0.875rem'
              }}>
                <span style={{ color: '#64748b' }}>Unidades:</span>
                <span style={{ fontWeight: '600', color: '#1e293b' }}>
                  {venta.items.reduce((sum, item) => sum + item.cantidad, 0)}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
                fontSize: '0.875rem'
              }}>
                <span style={{ color: '#64748b' }}>Subtotal:</span>
                <span style={{ fontWeight: '600', color: '#1e293b' }}>
                  ${venta.subtotal.toFixed(2)}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#10b981',
                borderTop: '2px solid #bbf7d0',
                paddingTop: '0.75rem',
                marginTop: '0.75rem'
              }}>
                <span>TOTAL:</span>
                <span>${venta.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Botones de acción */}
            {venta.items.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => setMostrarModalPago(true)}
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.875rem' : '1rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontSize: isMobile ? '1rem' : '1.125rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#059669'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#10b981'}
                >
                  💳 Finalizar Venta
                </button>
                
                <button
                  onClick={limpiarVenta}
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.625rem' : '0.75rem',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
                >
                  🗑️ Limpiar Venta
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Pago */}
      {mostrarModalPago && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h3 style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                color: '#1e293b'
              }}>
                💳 Finalizar Venta
              </h3>
              <button
                onClick={() => setMostrarModalPago(false)}
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

            {/* Resumen de la venta */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              marginBottom: '2rem',
              border: '2px solid #e2e8f0'
            }}>
              <h4 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '1rem'
              }}>
                📋 Resumen de Venta
              </h4>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span style={{ color: '#64748b' }}>Productos:</span>
                <span style={{ fontWeight: '600' }}>{venta.items.length}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span style={{ color: '#64748b' }}>Unidades:</span>
                <span style={{ fontWeight: '600' }}>{venta.items.reduce((sum, item) => sum + item.cantidad, 0)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span style={{ color: '#64748b' }}>Subtotal:</span>
                <span style={{ fontWeight: '600' }}>${venta.subtotal.toFixed(2)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span style={{ color: '#64748b' }}>Impuestos:</span>
                <span style={{ fontWeight: '600' }}>$0.00</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#10b981',
                borderTop: '2px solid #e2e8f0',
                paddingTop: '0.75rem',
                marginTop: '0.75rem'
              }}>
                <span>TOTAL:</span>
                <span>${venta.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Método de pago */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.75rem',
                fontWeight: '600',
                color: '#1e293b',
                fontSize: '1.125rem'
              }}>
                💳 Método de Pago:
              </label>
              <select
                value={venta.metodoPago}
                onChange={(e) => setVenta(prev => ({ ...prev, metodoPago: e.target.value as 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' }))}
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none',
                  background: 'white'
                }}
              >
                <option value="EFECTIVO">💵 Efectivo</option>
                <option value="TARJETA">💳 Tarjeta</option>
                <option value="TRANSFERENCIA">🏦 Transferencia</option>
              </select>
            </div>

            {/* Monto recibido (solo para efectivo) */}
            {venta.metodoPago === 'EFECTIVO' && (
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.75rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  fontSize: '1.125rem'
                }}>
                  💰 Monto Recibido:
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={venta.total}
                  value={inputMontoRecibido}
                  onChange={(e) => setInputMontoRecibido(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    background: 'white'
                  }}
                  placeholder={`Mínimo: $${venta.total.toFixed(2)}`}
                />
                
                {inputMontoRecibido && parseFloat(inputMontoRecibido) >= venta.total && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '1rem',
                    background: '#dcfce7',
                    borderRadius: '0.5rem',
                    border: '2px solid #bbf7d0'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontWeight: '700',
                      color: '#166534',
                      fontSize: '1.125rem'
                    }}>
                      <span>💰 Vuelto:</span>
                      <span>${calcularVuelto().toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Información del cliente */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '1rem'
              }}>
                👤 Información del Cliente (Opcional)
              </h4>
              
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="Nombre del cliente"
                  value={inputClienteNombre}
                  onChange={(e) => setInputClienteNombre(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    background: 'white'
                  }}
                />
              </div>
              
              <div>
                <input
                  type="email"
                  placeholder="Email del cliente"
                  value={inputClienteEmail}
                  onChange={(e) => setInputClienteEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    background: 'white'
                  }}
                />
              </div>
            </div>

            {/* Observaciones */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.75rem',
                fontWeight: '600',
                color: '#1e293b',
                fontSize: '1.125rem'
              }}>
                📝 Observaciones:
              </label>
              <textarea
                placeholder="Notas adicionales..."
                value={inputObservaciones}
                onChange={(e) => setInputObservaciones(e.target.value)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '100px',
                  background: 'white'
                }}
              />
            </div>

            {/* Botones de acción */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '2rem'
            }}>
              <button
                onClick={() => setMostrarModalPago(false)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#4b5563'}
                onMouseOut={(e) => e.currentTarget.style.background = '#6b7280'}
              >
                ❌ Cancelar
              </button>
              
              <button
                onClick={() => {
                  finalizarVenta();
                  setMostrarModalPago(false);
                }}
                disabled={procesandoVenta || venta.items.length === 0 || 
                         (venta.metodoPago === 'EFECTIVO' && (!inputMontoRecibido || parseFloat(inputMontoRecibido) < venta.total))}
                style={{
                  flex: 2,
                  padding: '1rem',
                  background: procesandoVenta || venta.items.length === 0 || 
                             (venta.metodoPago === 'EFECTIVO' && (!inputMontoRecibido || parseFloat(inputMontoRecibido) < venta.total))
                             ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: procesandoVenta || venta.items.length === 0 || 
                          (venta.metodoPago === 'EFECTIVO' && (!inputMontoRecibido || parseFloat(inputMontoRecibido) < venta.total))
                          ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (!procesandoVenta && venta.items.length > 0 && 
                      !(venta.metodoPago === 'EFECTIVO' && (!inputMontoRecibido || parseFloat(inputMontoRecibido) < venta.total))) {
                    e.currentTarget.style.background = '#059669';
                  }
                }}
                onMouseOut={(e) => {
                  if (!procesandoVenta && venta.items.length > 0 && 
                      !(venta.metodoPago === 'EFECTIVO' && (!inputMontoRecibido || parseFloat(inputMontoRecibido) < venta.total))) {
                    e.currentTarget.style.background = '#10b981';
                  }
                }}
              >
                {procesandoVenta ? '⏳ Procesando...' : '✅ Confirmar Venta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Componente de escáner de códigos de barras */}
      <BarcodeScanner
        isOpen={mostrarScanner}
        onScan={procesarCodigoBarras}
        onClose={() => setMostrarScanner(false)}
      />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 