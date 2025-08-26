import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
import { formatearFecha, formatearFechaCorta, formatearFechaConHora, obtenerFechaActual } from '../../utils/dateUtils';
import BarcodeScanner from '../../components/BarcodeScanner';

interface DetallePlanillaPedido {
  id: number;
  productoId?: number;
  codigoPersonalizado?: string;
  descripcion: string;
  cantidad: number;
  observaciones?: string;
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
  const [cantidadTemporal, setCantidadTemporal] = useState(0);
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
  

  const inputBusquedaRef = useRef<HTMLInputElement>(null);
  const numeroPlanillaRef = useRef<HTMLInputElement>(null);
  const fechaPlanillaRef = useRef<HTMLInputElement>(null);
  const observacionesRef = useRef<HTMLTextAreaElement>(null);
  const cantidadTemporalRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    if (datosUsuario) {
      cargarProductos();
      cargarCategorias();
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
      
      // Extraer nombres y marcas existentes para sugerencias
      const nombres = [...new Set(response.data?.map(p => p.nombre) || [])];
      const marcas = [...new Set(response.data?.map(p => p.marca).filter((marca): marca is string => Boolean(marca)) || [])];
      setNombresExistentes(nombres);
      setMarcasExistentes(marcas);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error('Error al cargar los productos');
    }
  };

  const cargarCategorias = async () => {
    try {
      if (!datosUsuario?.empresaId) return;
      
      const response = await ApiService.obtenerCategorias(datosUsuario.empresaId);
      setCategorias(response.data || []);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

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

  // Efecto para enfocar el campo de número de planilla cuando se abre la página
  useEffect(() => {
    if (datosUsuario && numeroPlanillaRef.current) {
      setTimeout(() => {
        numeroPlanillaRef.current?.focus();
      }, 200);
    }
  }, [datosUsuario]);

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
        confirmarCantidad();
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
    setMostrarCampoCantidad(true);
    setMostrarProductos(false);
    setProductoSeleccionado(-1);
    setInputBusqueda('');
  };

  const confirmarCantidad = () => {
    if (!productoSeleccionadoTemporal || cantidadTemporal <= 0) {
      toast.error('Por favor ingrese una cantidad válida');
      return;
    }

    // Verificar si el producto ya está en la lista
    const productoExistente = detalles.find(d => d.productoId === productoSeleccionadoTemporal.id);
    
    if (productoExistente) {
      // Actualizar cantidad del producto existente
      setDetalles(prev => prev.map(d => 
        d.productoId === productoSeleccionadoTemporal.id 
          ? { ...d, cantidad: d.cantidad + cantidadTemporal }
          : d
      ));
      toast.success(`Cantidad actualizada: ${productoSeleccionadoTemporal.nombre}`);
    } else {
      // Agregar nuevo producto
      const nuevoDetalle: DetallePlanillaPedido = {
        id: Date.now(), // ID temporal
        productoId: productoSeleccionadoTemporal.id,
        codigoPersonalizado: productoSeleccionadoTemporal.codigoPersonalizado,
        descripcion: productoSeleccionadoTemporal.nombre,
        cantidad: cantidadTemporal,
        fechaCreacion: new Date().toISOString()
      };
      
      setDetalles(prev => [...prev, nuevoDetalle]);
      toast.success(`${productoSeleccionadoTemporal.nombre} agregado (${cantidadTemporal} unidades)`);
    }

    // Resetear estado
    setMostrarCampoCantidad(false);
    setProductoSeleccionadoTemporal(null);
    setCantidadTemporal(1);
    
    // Volver al campo de búsqueda
    setTimeout(() => {
      inputBusquedaRef.current?.focus();
    }, 100);
  };

  const cancelarCantidad = () => {
    setMostrarCampoCantidad(false);
    setProductoSeleccionadoTemporal(null);
    setCantidadTemporal(1);
    
    // Volver al campo de búsqueda
    setTimeout(() => {
      inputBusquedaRef.current?.focus();
    }, 100);
  };

  const removerDetalle = (index: number) => {
    setDetalles(prev => prev.filter((_, i) => i !== index));
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

  const actualizarObservaciones = (index: number, observaciones: string) => {
    setDetalles(prev => prev.map((detalle, i) => 
      i === index ? { ...detalle, observaciones } : detalle
    ));
  };

  const guardarPlanilla = async () => {
    if (!numeroPlanilla.trim()) {
      toast.error('Por favor ingrese el número de planilla');
      numeroPlanillaRef.current?.focus();
      return;
    }

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
      
      // Crear fecha con hora local, igual que en las planillas
      const fechaSeleccionada = new Date(fechaPlanilla + 'T00:00:00');
      const ahora = new Date();
      
      // Obtener la hora local del usuario
      const horaLocal = ahora.getHours();
      const minutosLocal = ahora.getMinutes();
      const segundosLocal = ahora.getSeconds();
      
      // Crear fecha directamente en UTC usando Date.UTC()
      const fechaUTC = new Date(Date.UTC(
        fechaSeleccionada.getFullYear(),
        fechaSeleccionada.getMonth(),
        fechaSeleccionada.getDate(),
        horaLocal,
        minutosLocal,
        segundosLocal
      ));
      
      // Formatear como ISO string para enviar al backend
      const fechaFormateada = fechaUTC.toISOString();
      
      const planillaData = {
         numeroPlanilla: numeroPlanilla.trim(),
        fechaPlanilla: fechaFormateada,
         observaciones: observaciones.trim() || null,
         detalles: detalles.map(detalle => ({
           productoId: detalle.productoId,
           numeroPersonalizado: detalle.codigoPersonalizado,
           descripcion: detalle.descripcion,
           cantidad: detalle.cantidad,
           observaciones: detalle.observaciones
         }))
       };

      console.log('📋 Enviando planilla de devolución:', planillaData);
      
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

  const calcularTotalProductos = () => {
    return detalles.length;
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
        padding: isMobile ? '6rem 1rem 1rem 1rem' : '7rem 2rem 2rem 2rem'
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
                 {guardando ? '💾 Creando...' : '💾 Crear Registro'}
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
            📋 Información de la Planilla
            </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 2fr',
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
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
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
                color: '#64748b',
                marginBottom: '0.5rem'
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
                     observacionesRef.current?.focus();
                   }
                 }}
                 placeholder="PL00000000"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                   border: '2px solid #e2e8f0',
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
                color: '#64748b',
                marginBottom: '0.5rem'
              }}>
                💬 Observaciones
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
                 placeholder="Observaciones sobre la devolución..."
                 rows={1}
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
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#64748b',
                marginBottom: '0.5rem'
              }}>
                🔍 Buscar Producto
              </label>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: mostrarCampoCantidad ? '1fr 120px' : '1fr',
                gap: '0.5rem',
                alignItems: 'end'
              }}>
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
                  padding: '0.75rem',
                      border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                      fontSize: '0.875rem'
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
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      maxHeight: '200px',
                      overflow: 'auto',
                      zIndex: 1000
                    }}>
                      {productosFiltrados.map((producto, index) => (
                  <div
                    key={producto.id}
                          onClick={() => seleccionarProducto(producto)}
                    style={{
                            padding: '0.75rem',
                      cursor: 'pointer',
                            borderBottom: index < productosFiltrados.length - 1 ? '1px solid #f1f5f9' : 'none',
                            background: index === productoSeleccionado ? '#f1f5f9' : 'white',
                            fontSize: '0.875rem'
                          }}
                          onMouseOver={() => setProductoSeleccionado(index)}
                        >
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>
                      {producto.nombre}
                    </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {producto.codigoPersonalizado && `Código: ${producto.codigoPersonalizado}`}
                            {producto.codigoBarras && ` • Barras: ${producto.codigoBarras}`}
                            {` • Stock: ${producto.stock}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Campo de cantidad temporal */}
                {mostrarCampoCantidad && (
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#64748b',
                      marginBottom: '0.25rem'
                    }}>
                      Cantidad
                    </label>
                    <input
                      ref={cantidadTemporalRef}
                      type="text"
                      value={cantidadTemporal}
                      onChange={(e) => {
                        const valor = e.target.value;
                        if (valor === '' || /^\d+$/.test(valor)) {
                          setCantidadTemporal(valor === '' ? 0 : parseInt(valor));
                        }
                      }}
                      onKeyDown={manejarTeclasCantidad}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                      }}
                    />
                    </div>
                )}
              </div>

              {/* Vista previa del producto seleccionado */}
              {mostrarCampoCantidad && productoSeleccionadoTemporal && (
                    <div style={{
                  background: 'white',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  border: '2px solid #3b82f6',
                  marginTop: '0.5rem',
                  fontSize: '0.75rem'
                }}>
                  <div style={{ color: '#64748b', marginBottom: '0.25rem' }}>
                    <strong>Producto:</strong> {productoSeleccionadoTemporal.nombre}
                    </div>
                  {productoSeleccionadoTemporal.codigoPersonalizado && (
                    <div style={{ color: '#64748b', marginBottom: '0.25rem' }}>
                      <strong>Código:</strong> {productoSeleccionadoTemporal.codigoPersonalizado}
                  </div>
              )}
                  <div style={{ color: '#64748b', marginBottom: '0.25rem' }}>
                    <strong>Stock actual:</strong> {productoSeleccionadoTemporal.stock}
            </div>
                  <div style={{ color: '#3b82f6', fontWeight: '600' }}>
                    💡 Enter para agregar • Escape para cancelar
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
              <div style={{
                background: 'white',
                borderRadius: '0.75rem',
                border: '1px solid #e2e8f0',
                overflow: 'hidden'
              }}>
                {detalles.map((detalle, index) => (
                  <div
                    key={detalle.id}
                  style={{
                      padding: '0.75rem',
                      borderBottom: index < detalles.length - 1 ? '1px solid #f1f5f9' : 'none',
                      background: index % 2 === 0 ? 'white' : '#f8fafc'
                  }}
                >
                  <div style={{
                    display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '1fr auto auto',
                      gap: '0.75rem',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{
                        fontWeight: '600',
                        color: '#1e293b',
                          fontSize: '0.875rem',
                          lineHeight: '1.2'
                      }}>
                        {detalle.descripcion}
                      </div>
                      {detalle.codigoPersonalizado && (
                        <div style={{
                            fontSize: '0.7rem', 
                            color: '#64748b',
                            marginTop: '0.125rem'
                        }}>
                          Código: {detalle.codigoPersonalizado}
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{
                          display: 'block',
                          fontSize: '0.7rem',
                        fontWeight: '600',
                          color: '#64748b',
                          marginBottom: '0.125rem'
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
                            width: '2rem',
                            height: '2rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
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
