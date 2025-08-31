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
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile, isTablet } = useResponsive();
  const navigate = useNavigate();
  
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);

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
  const inputBusquedaRef = useRef<HTMLInputElement>(null);
  const inputCantidadRef = useRef<HTMLInputElement>(null);
  const listaProductosRef = useRef<HTMLDivElement>(null);
  const codigoPlanillaRef = useRef<HTMLInputElement>(null);
  const transporteRef = useRef<HTMLInputElement>(null);
  const observacionesRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    // Solo cargar datos si el usuario ya está cargado
    if (datosUsuario) {
      cargarProductos();
      cargarTransportistas();
    }
  }, [navigate, datosUsuario]);

  // Efecto para filtrar productos
  useEffect(() => {
    if (inputBusqueda.trim()) {
      const filtrados = productos.filter(producto => {
        const matchNombre = producto.nombre.toLowerCase().includes(inputBusqueda.toLowerCase());
        const matchCodigo = producto.codigoPersonalizado && producto.codigoPersonalizado.toLowerCase().includes(inputBusqueda.toLowerCase());
        const matchBarras = producto.codigoBarras && producto.codigoBarras.includes(inputBusqueda);
        
        return matchNombre || matchCodigo || matchBarras;
      });
      
      setProductosFiltrados(filtrados);
      setMostrarProductos(filtrados.length > 0);
    } else {
      setProductosFiltrados([]);
      setMostrarProductos(false);
    }
  }, [inputBusqueda, productos]);

  // Efecto para filtrar transportistas
  useEffect(() => {
    if (inputBusquedaTransporte.trim()) {
      const filtrados = transportistas.filter(transportista => {
        const matchCodigo = transportista.codigoInterno.toLowerCase().includes(inputBusquedaTransporte.toLowerCase());
        const matchNombre = transportista.nombreApellido.toLowerCase().includes(inputBusquedaTransporte.toLowerCase());
        const matchEmpresa = transportista.nombreEmpresa && transportista.nombreEmpresa.toLowerCase().includes(inputBusquedaTransporte.toLowerCase());
        
        // Buscar en vehículos del transportista
        const matchVehiculo = transportista.vehiculos.some(vehiculo => 
          vehiculo.marca.toLowerCase().includes(inputBusquedaTransporte.toLowerCase()) ||
          vehiculo.modelo.toLowerCase().includes(inputBusquedaTransporte.toLowerCase()) ||
          vehiculo.patente.toLowerCase().includes(inputBusquedaTransporte.toLowerCase())
        );
        
        return matchCodigo || matchNombre || matchEmpresa || matchVehiculo;
      });
      
      // Crear opciones individuales para cada transportista-vehículo
      const opciones: Array<{
        transportista: Transportista;
        vehiculo?: Vehiculo;
        displayText: string;
        key: string;
      }> = [];
      
      filtrados.forEach(transportista => {
        const vehiculosActivos = transportista.vehiculos.filter(v => v.activo);
        
        if (vehiculosActivos.length === 0) {
          // Si no tiene vehículos activos, mostrar solo el transportista
          opciones.push({
            transportista,
            displayText: `${transportista.codigoInterno} - ${transportista.nombreApellido}`,
            key: `transportista-${transportista.id}`
          });
        } else {
          // Crear una opción por cada vehículo activo
          vehiculosActivos.forEach(vehiculo => {
            opciones.push({
              transportista,
              vehiculo,
              displayText: `${transportista.codigoInterno} - ${transportista.nombreApellido} (${vehiculo.marca} ${vehiculo.modelo})`,
              key: `transportista-${transportista.id}-vehiculo-${vehiculo.id}`
            });
          });
        }
      });
      
      setOpcionesTransporte(opciones);
      setTransportistasFiltrados(filtrados);
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
    if (codigoPlanillaRef.current && !cargando) {
      // Pequeño delay para asegurar que la página esté completamente renderizada
      setTimeout(() => {
        codigoPlanillaRef.current?.focus();
      }, 100);
    }
  }, [cargando]);

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

  const cargarProductos = async () => {
    try {
      setCargando(true);
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
      setCargando(false);
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
  const mostrarPredicciones = (valor: string) => {
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
          setTransportistaSeleccionado(prev => 
            prev < opcionesTransporte.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setTransportistaSeleccionado(prev => 
            prev > 0 ? prev - 1 : opcionesTransporte.length - 1
          );
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
        const targetPosition = scrollTop + rect.top - 140; // 140px de margen desde arriba
        
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

    // Validar stock disponible
    const stockDisponible = obtenerStockDisponible(productoParaCantidad);
    
    if (cantidadTemporal > stockDisponible) {
      toast.error(`Stock insuficiente. Disponible: ${stockDisponible} unidades`);
      return;
    }

    if (cantidadTemporal <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    const detalle: DetallePlanillaPedido = {
      id: Date.now(),
      productoId: productoParaCantidad.id,
      numeroPersonalizado: productoParaCantidad.codigoPersonalizado || undefined,
      descripcion: productoParaCantidad.nombre,
      cantidad: cantidadTemporal,
      observaciones: undefined,
      fechaCreacion: new Date().toISOString()
    };

    setNuevaPlanilla(prev => ({
      ...prev,
      detalles: [...prev.detalles, detalle]
    }));

    // Actualizar el último producto seleccionado con la cantidad agregada
    setUltimoProductoSeleccionado(productoParaCantidad);
    setUltimaCantidadAgregada(cantidadTemporal);

    toast.success(`${productoParaCantidad.nombre} agregado (${cantidadTemporal})`);
    
    // Resetear estado
    setModoCantidad(false);
    setProductoParaCantidad(null);
    setCantidadTemporal(1);
    
    // Volver al campo de búsqueda con un pequeño delay para asegurar que el DOM se actualice
    setTimeout(() => {
      inputBusquedaRef.current?.focus();
    }, 100);
  };

  // Cancelar modo cantidad
  const cancelarCantidad = () => {
    setModoCantidad(false);
    setProductoParaCantidad(null);
    setCantidadTemporal(1);
    
    // Volver al campo de búsqueda con un pequeño delay
    setTimeout(() => {
      inputBusquedaRef.current?.focus();
    }, 100);
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

  // Función para aumentar cantidad
  const aumentarCantidad = (index: number) => {
    setNuevaPlanilla(prev => ({
      ...prev,
      detalles: prev.detalles.map((detalle, i) => 
        i === index ? { ...detalle, cantidad: detalle.cantidad + 1 } : detalle
      )
    }));
  };

  // Función para disminuir cantidad
  const disminuirCantidad = (index: number) => {
    setNuevaPlanilla(prev => ({
      ...prev,
      detalles: prev.detalles.map((detalle, i) => 
        i === index ? { ...detalle, cantidad: Math.max(1, detalle.cantidad - 1) } : detalle
      )
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

  if (cargando || !datosUsuario) {
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
          <p style={{ color: '#6b7280', margin: 0 }}>Cargando productos...</p>
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
        padding: `${isMobile ? '6rem' : '7rem'} ${isMobile ? '1rem' : '2rem'} ${isMobile ? '1rem' : '2rem'} ${isMobile ? '1rem' : '2rem'}`
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
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
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
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
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
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Transporte
              </label>
              {nuevaPlanilla.transporte ? (
                <div style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #10b981',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: '#f0fdf4',
                  color: '#065f46',
                  fontWeight: '500',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
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
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              )}
              {mostrarTransportistas && transportistasFiltrados.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {opcionesTransporte.map((opcion, index) => (
                    <div
                      key={opcion.key}
                      onClick={() => seleccionarTransportista(opcion)}
                      style={{
                        padding: '0.75rem',
                        cursor: 'pointer',
                        backgroundColor: index === transportistaSeleccionado ? '#f3f4f6' : 'transparent',
                        borderBottom: index < opcionesTransporte.length - 1 ? '1px solid #f3f4f6' : 'none'
                      }}
                    >
                      <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                        {opcion.displayText}
                      </div>
                      {opcion.transportista.nombreEmpresa && (
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {opcion.transportista.nombreEmpresa}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
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
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
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
            
            {/* Campo de búsqueda y cantidad */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: modoCantidad ? '1fr 80px' : '1fr',
                gap: '0.5rem',
                alignItems: 'end'
              }}>
                <div style={{ position: 'relative' }}>
                  <input
                    ref={inputBusquedaRef}
                    type="text"
                    placeholder={modoCantidad ? "Producto seleccionado" : "Nombre, código o barras..."}
                    value={inputBusqueda}
                    onChange={(e) => {
                      if (!modoCantidad) {
                        setInputBusqueda(e.target.value);
                        mostrarPredicciones(e.target.value);
                      }
                    }}
                    onKeyDown={manejarTeclas}
                    disabled={modoCantidad}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      background: modoCantidad ? '#f3f4f6' : 'white',
                      color: modoCantidad ? '#6b7280' : '#1e293b'
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
                        maxHeight: '300px',
                        overflow: 'auto'
                      }}
                    >
                      {productosFiltrados.map((producto, index) => {
                        const stockDisponible = obtenerStockDisponible(producto);
                        return (
                        <div
                          key={producto.id}
                          onClick={() => stockDisponible > 0 ? seleccionarProducto(producto) : null}
                          style={{
                            padding: '0.5rem',
                            cursor: stockDisponible > 0 ? 'pointer' : 'not-allowed',
                            borderBottom: index < productosFiltrados.length - 1 ? '1px solid #f1f5f9' : 'none',
                            background: index === productoSeleccionado ? '#3b82f6' : stockDisponible > 0 ? 'white' : '#f3f4f6',
                            color: index === productoSeleccionado ? 'white' : stockDisponible > 0 ? '#1e293b' : '#9ca3af',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            borderRadius: index === productoSeleccionado ? '0.375rem' : '0',
                            boxShadow: index === productoSeleccionado ? '0 2px 4px rgba(59, 130, 246, 0.3)' : 'none',
                            opacity: stockDisponible > 0 ? 1 : 0.6
                          }}
                          onMouseEnter={() => stockDisponible > 0 ? setProductoSeleccionado(index) : null}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontWeight: '600',
                              color: index === productoSeleccionado ? 'white' : '#1e293b',
                              fontSize: '0.8rem',
                              lineHeight: '1.2'
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
                              fontSize: '0.7rem',
                              marginTop: '0.125rem'
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

                {/* Campo de cantidad */}
                {modoCantidad && (
                  <div>
                    <input
                      ref={inputCantidadRef}
                      type="number"
                      min="1"
                      max={productoParaCantidad ? obtenerStockDisponible(productoParaCantidad) : 999}
                      value={cantidadTemporal}
                      onChange={(e) => setCantidadTemporal(Math.max(1, parseInt(e.target.value) || 1))}
                      onKeyDown={manejarTeclasCantidad}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #3b82f6',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
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
                    <strong>Stock disponible:</strong> {obtenerStockDisponible(productoParaCantidad)}
                  </div>
                  <div style={{ color: '#3b82f6', fontWeight: '600' }}>
                    💡 Enter para agregar • Escape para cancelar • ↑↓ para cambiar cantidad
                  </div>
                </div>
              )}
            </div>

            {/* Último producto seleccionado */}
            {ultimoProductoSeleccionado && !modoCantidad && (
              <div style={{
                background: 'white',
                borderRadius: '0.5rem',
                padding: '1rem',
                border: '2px solid #3b82f6',
                marginTop: '1rem'
              }}>
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 0.5rem 0'
                }}>
                  📦 Último Producto
                </h4>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#64748b'
                }}>
                  {ultimoProductoSeleccionado.codigoPersonalizado && (
                    <div style={{ marginBottom: '0.25rem' }}>
                      <strong>Código:</strong> {ultimoProductoSeleccionado.codigoPersonalizado}
                    </div>
                  )}
                  <div style={{ marginBottom: '0.25rem' }}>
                    <strong>Nombre:</strong> {ultimoProductoSeleccionado.nombre}
                  </div>
                  <div style={{ marginBottom: '0.25rem' }}>
                    <strong>Stock disponible:</strong> {obtenerStockDisponible(ultimoProductoSeleccionado)}
                  </div>
                  <div style={{
                    color: '#3b82f6',
                    fontWeight: '600',
                    fontSize: '0.875rem'
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
            
            <div style={{ flex: 1, overflow: 'auto' }}>
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
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: index < nuevaPlanilla.detalles.length - 1 ? '1px solid #f1f5f9' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                    >
                      {/* Número */}
                      <div style={{
                        background: '#3b82f6',
                        color: 'white',
                        borderRadius: '50%',
                        width: '1.5rem',
                        height: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
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
                          fontSize: '0.875rem',
                          marginBottom: '0.125rem',
                          lineHeight: '1.2'
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

                      {/* Cantidad */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
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
                             width: '60px',
                             padding: '0.25rem',
                             border: '1px solid #e2e8f0',
                             borderRadius: '0.25rem',
                             fontSize: '0.8rem',
                             textAlign: 'center',
                             background: '#f8fafc',
                             color: '#1e293b',
                             fontWeight: '500',
                             minHeight: '1.5rem'
                           }}
                         />
                      </div>

                      {/* Botón eliminar */}
                      <button
                        onClick={() => removerDetalle(index)}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          padding: '0.375rem',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        🗑️
                      </button>
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
