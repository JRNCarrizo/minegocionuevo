import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { API_CONFIG } from '../../config/api';
import toast from 'react-hot-toast';
import NavbarAdmin from '../../components/NavbarAdmin';
import './RecibirProductos.css';

interface Producto {
  id: number;
  nombre: string;
  codigoPersonalizado?: string;
  unidadMedida?: string;
}

interface StockDetallado {
  productoId: number;
  productoNombre: string;
  codigoPersonalizado?: string;
  ubicaciones: {
    ubicacion: string;
    cantidad: number;
    stockId: string;
  }[];
}

interface RecepcionProducto {
  productoId: number;
  stockId: string;
  ubicacion: string;
  cantidad: number;
  productoNombre: string;
  codigoPersonalizado?: string;
}

const RecibirProductos: React.FC = () => {
  const { sectorId } = useParams<{ sectorId: string }>();
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const navigate = useNavigate();

  // Estados principales
  const [sector, setSector] = useState<any>(null);
  const [cargandoSector, setCargandoSector] = useState(true);
  const [stockDetallado, setStockDetallado] = useState<StockDetallado[]>([]);
  const [cargandoStock, setCargandoStock] = useState(true);
  const [recepciones, setRecepciones] = useState<RecepcionProducto[]>([]);
  const [guardando, setGuardando] = useState(false);

  // Estados para búsqueda y selección
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [productosFiltrados, setProductosFiltrados] = useState<StockDetallado[]>([]);
  const [productoSeleccionadoIndex, setProductoSeleccionadoIndex] = useState(-1);
  const [productoSeleccionado, setProductoSeleccionado] = useState<StockDetallado | null>(null);
  const [ubicacionesFiltradas, setUbicacionesFiltradas] = useState<any[]>([]);
  const [ubicacionSeleccionadaIndex, setUbicacionSeleccionadaIndex] = useState(-1);
  const [stockSeleccionado, setStockSeleccionado] = useState<any>(null);
  const [modoCantidad, setModoCantidad] = useState(false);
  const [cantidad, setCantidad] = useState('');
  const [scrollRealizado, setScrollRealizado] = useState(false);
  const [mostrarOpciones, setMostrarOpciones] = useState(false);

  // Referencias para focus
  const inputBusquedaRef = useRef<HTMLInputElement>(null);
  const listaProductosRef = useRef<HTMLDivElement>(null);
  const listaUbicacionesRef = useRef<HTMLDivElement>(null);
  const inputCantidadRef = useRef<HTMLInputElement>(null);

  // Función helper para hacer llamadas a la API
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const baseUrl = API_CONFIG.getBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/api') ? endpoint.substring(4) : endpoint;
    const url = `${baseUrl}${cleanEndpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
    
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  };

  // Función helper para calcular la cantidad total de stock disponible
  const calcularStockTotal = (producto: StockDetallado): number => {
    return producto.ubicaciones.reduce((total, ubicacion) => total + ubicacion.cantidad, 0);
  };

  // Cargar información del sector
  const cargarSector = async () => {
    if (!datosUsuario?.empresaId) {
      toast.error('No se pudo obtener la información de la empresa');
      return;
    }
    
    try {
      setCargandoSector(true);
      const response = await apiCall(`/empresas/${datosUsuario.empresaId}/sectores/todos`);
      
      // Verificar que la respuesta sea un array o tenga la propiedad data
      const sectores = Array.isArray(response) ? response : (response?.data && Array.isArray(response.data) ? response.data : []);
      
      const sectorEncontrado = sectores.find((s: any) => s.id === parseInt(sectorId!));
      if (sectorEncontrado) {
        setSector(sectorEncontrado);
      } else {
        toast.error('Sector no encontrado');
      }
    } catch (error) {
      console.error('Error cargando sector:', error);
      toast.error('Error al cargar información del sector');
    } finally {
      setCargandoSector(false);
    }
  };

  // Cargar stock detallado
  const cargarStockDetallado = async () => {
    if (!datosUsuario?.empresaId) {
      toast.error('No se pudo obtener la información de la empresa');
      return;
    }

    try {
      setCargandoStock(true);
      const response = await apiCall(`/empresas/${datosUsuario.empresaId}/sectores/stock/detallado`);
      
      // Verificar que la respuesta sea un array
      const stockData = Array.isArray(response) ? response : (response?.data && Array.isArray(response.data) ? response.data : []);
      setStockDetallado(stockData);
    } catch (error) {
      console.error('Error cargando stock detallado:', error);
      toast.error('Error al cargar stock detallado');
    } finally {
      setCargandoStock(false);
    }
  };

  // Filtrar productos basado en la búsqueda
  useEffect(() => {
    if (!filtroBusqueda.trim()) {
      setProductosFiltrados([]);
      setProductoSeleccionadoIndex(-1);
      setMostrarOpciones(false);
      return;
    }

    const filtrados = stockDetallado.filter(producto => {
      // Filtrar por nombre o código
      const coincideBusqueda = producto.productoNombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
        (producto.codigoPersonalizado && producto.codigoPersonalizado.toLowerCase().includes(filtroBusqueda.toLowerCase()));
      
      if (!coincideBusqueda) return false;
      
      // Verificar que el producto NO esté en el sector actual
      const tieneStockEnSectorActual = producto.ubicaciones.some(ubicacion => 
        ubicacion.ubicacion === sector?.nombre
      );
      
      if (tieneStockEnSectorActual) return false;
      
      // Verificar que el producto tenga stock disponible en al menos una ubicación
      const tieneStockDisponible = producto.ubicaciones.some(ubicacion => ubicacion.cantidad > 0);
      
      // Solo incluir productos que NO estén en el sector actual Y tengan stock disponible
      return tieneStockDisponible;
    });

    setProductosFiltrados(filtrados);
    setProductoSeleccionadoIndex(-1);
    
    // Mostrar opciones con animación si hay resultados
    if (filtrados.length > 0) {
      setMostrarOpciones(true);
    } else {
      setMostrarOpciones(false);
    }
  }, [filtroBusqueda, stockDetallado]);

  // Estado para controlar el focus del buscador
  const [focusBuscador, setFocusBuscador] = useState(false);

  // Auto-focus en el buscador solo cuando se solicita
  useEffect(() => {
    if (focusBuscador && inputBusquedaRef.current && !cargandoSector && !cargandoStock) {
      inputBusquedaRef.current.focus();
      setFocusBuscador(false);
    }
  }, [focusBuscador, cargandoSector, cargandoStock]);

  // Resetear scrollRealizado cuando se carga la página por primera vez
  useEffect(() => {
    if (!cargandoSector && !cargandoStock) {
      setScrollRealizado(false);
    }
  }, [cargandoSector, cargandoStock]);

  // Auto-focus en el campo de cantidad cuando se activa
  useEffect(() => {
    if (modoCantidad && inputCantidadRef.current) {
      inputCantidadRef.current.focus();
      inputCantidadRef.current.select();
    }
  }, [modoCantidad]);

  // Auto-scroll para la lista de productos
  useEffect(() => {
    if (productoSeleccionadoIndex >= 0 && listaProductosRef.current) {
      const container = listaProductosRef.current;
      const items = container.children;
      
      if (items[productoSeleccionadoIndex]) {
        const selectedItem = items[productoSeleccionadoIndex] as HTMLElement;
        const containerRect = container.getBoundingClientRect();
        const itemRect = selectedItem.getBoundingClientRect();
        
        // Calcular si el elemento está fuera de la vista
        if (itemRect.top < containerRect.top || itemRect.bottom > containerRect.bottom) {
          selectedItem.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }
      }
    }
  }, [productoSeleccionadoIndex]);

  // Auto-scroll para la lista de ubicaciones
  useEffect(() => {
    if (ubicacionSeleccionadaIndex >= 0 && listaUbicacionesRef.current) {
      const container = listaUbicacionesRef.current;
      const items = container.children;
      
      if (items[ubicacionSeleccionadaIndex]) {
        const selectedItem = items[ubicacionSeleccionadaIndex] as HTMLElement;
        const containerRect = container.getBoundingClientRect();
        const itemRect = selectedItem.getBoundingClientRect();
        
        // Calcular si el elemento está fuera de la vista
        if (itemRect.top < containerRect.top || itemRect.bottom > containerRect.bottom) {
          selectedItem.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }
      }
    }
  }, [ubicacionSeleccionadaIndex]);

  // Manejar teclas para navegación
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Si estamos en modo cantidad, manejar solo Enter y Escape
      if (modoCantidad) {
        if (event.key === 'Enter') {
          event.preventDefault();
          confirmarRecepcion();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          cancelarCantidad();
        }
        return;
      }

      // Si hay un producto seleccionado y ubicaciones disponibles
      if (productoSeleccionado && ubicacionesFiltradas.length > 0) {
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setUbicacionSeleccionadaIndex(prev => 
            prev <= 0 ? ubicacionesFiltradas.length - 1 : prev - 1
          );
        } else if (event.key === 'ArrowDown') {
          event.preventDefault();
          setUbicacionSeleccionadaIndex(prev => 
            prev >= ubicacionesFiltradas.length - 1 ? 0 : prev + 1
          );
        } else if (event.key === 'Enter') {
          event.preventDefault();
          if (ubicacionSeleccionadaIndex >= 0) {
            seleccionarUbicacion(ubicacionesFiltradas[ubicacionSeleccionadaIndex]);
          }
        } else if (event.key === 'Escape') {
          event.preventDefault();
          setProductoSeleccionado(null);
          setUbicacionesFiltradas([]);
          setUbicacionSeleccionadaIndex(-1);
        }
        return;
      }

      // Si hay productos filtrados
      if (productosFiltrados.length > 0) {
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setProductoSeleccionadoIndex(prev => 
            prev <= 0 ? productosFiltrados.length - 1 : prev - 1
          );
        } else if (event.key === 'ArrowDown') {
          event.preventDefault();
          setProductoSeleccionadoIndex(prev => 
            prev >= productosFiltrados.length - 1 ? 0 : prev + 1
          );
        } else if (event.key === 'Enter') {
          event.preventDefault();
          if (productoSeleccionadoIndex >= 0) {
            seleccionarProducto(productosFiltrados[productoSeleccionadoIndex]);
          }
        } else if (event.key === 'Escape') {
          event.preventDefault();
          setFiltroBusqueda('');
          setProductosFiltrados([]);
          setProductoSeleccionadoIndex(-1);
        }
        return;
      }

      // Si no hay productos filtrados y se presiona Enter, activar el buscador
      if (event.key === 'Enter' && !filtroBusqueda.trim()) {
        event.preventDefault();
        setFocusBuscador(true);
        setScrollRealizado(false);
        // Hacer scroll automático
        setTimeout(() => {
          window.scrollBy({
            top: 250,
            behavior: 'smooth'
          });
        }, 100);
      }

      // Escape global para volver a gestión de sectores
      if (event.key === 'Escape' && !filtroBusqueda.trim() && productosFiltrados.length === 0 && !productoSeleccionado) {
        event.preventDefault();
        navigate('/admin/sectores');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [productosFiltrados, productoSeleccionadoIndex, productoSeleccionado, ubicacionesFiltradas, ubicacionSeleccionadaIndex, modoCantidad, cantidad, filtroBusqueda, navigate]);

  // Seleccionar producto
  const seleccionarProducto = (producto: StockDetallado) => {
    setProductoSeleccionado(producto);
    // Filtrar solo ubicaciones con stock disponible
    const ubicacionesConStock = producto.ubicaciones.filter(ubicacion => ubicacion.cantidad > 0);
    setUbicacionesFiltradas(ubicacionesConStock);
    setUbicacionSeleccionadaIndex(ubicacionesConStock.length > 0 ? 0 : -1);
    setFiltroBusqueda(producto.productoNombre);
    // Mostrar ubicaciones con animación
    if (ubicacionesConStock.length > 0) {
      setMostrarOpciones(true);
    }
  };

  // Seleccionar ubicación
  const seleccionarUbicacion = (ubicacion: any) => {
    setStockSeleccionado(ubicacion);
    setModoCantidad(true);
    setCantidad('');
  };

  // Confirmar recepción
  const confirmarRecepcion = () => {
    if (!productoSeleccionado || !stockSeleccionado || !cantidad.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    const cantidadNum = parseInt(cantidad);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      toast.error('Por favor ingresa una cantidad válida');
      return;
    }

    if (cantidadNum > stockSeleccionado.cantidad) {
      toast.error('La cantidad no puede ser mayor al stock disponible');
      return;
    }

    const nuevaRecepcion: RecepcionProducto = {
      productoId: productoSeleccionado.productoId,
      stockId: stockSeleccionado.stockId,
      ubicacion: stockSeleccionado.ubicacion,
      cantidad: cantidadNum,
      productoNombre: productoSeleccionado.productoNombre,
      codigoPersonalizado: productoSeleccionado.codigoPersonalizado
    };

    setRecepciones(prev => [...prev, nuevaRecepcion]);
    
    // Actualizar el stock detallado para descontar la cantidad
    setStockDetallado(prevStock => 
      prevStock.map(producto => {
        if (producto.productoId === productoSeleccionado.productoId) {
          return {
            ...producto,
            ubicaciones: producto.ubicaciones.map(ubicacion => {
              if (ubicacion.stockId === stockSeleccionado.stockId) {
                return {
                  ...ubicacion,
                  cantidad: Math.max(0, ubicacion.cantidad - cantidadNum)
                };
              }
              return ubicacion;
            })
          };
        }
        return producto;
      })
    );
    
    // Limpiar y volver al buscador
    setProductoSeleccionado(null);
    setStockSeleccionado(null);
    setModoCantidad(false);
    setCantidad('');
    setFiltroBusqueda('');
    setUbicacionesFiltradas([]);
    setUbicacionSeleccionadaIndex(-1);
    setProductoSeleccionadoIndex(-1);
    setScrollRealizado(false);

    // Focus en el buscador
    setTimeout(() => {
      setFocusBuscador(true);
    }, 100);

    toast.success('Producto agregado a la lista de recepción');
  };

  // Cancelar cantidad
  const cancelarCantidad = () => {
    setModoCantidad(false);
    setCantidad('');
    setStockSeleccionado(null);
    setUbicacionSeleccionadaIndex(0);
  };

  // Remover recepción de la lista
  const removerRecepcion = (index: number) => {
    const recepcionAEliminar = recepciones[index];
    
    // Restaurar el stock detallado sumando la cantidad eliminada
    setStockDetallado(prevStock => 
      prevStock.map(producto => {
        if (producto.productoId === recepcionAEliminar.productoId) {
          return {
            ...producto,
            ubicaciones: producto.ubicaciones.map(ubicacion => {
              if (ubicacion.stockId === recepcionAEliminar.stockId) {
                return {
                  ...ubicacion,
                  cantidad: ubicacion.cantidad + recepcionAEliminar.cantidad
                };
              }
              return ubicacion;
            })
          };
        }
        return producto;
      })
    );
    
    setRecepciones(prev => prev.filter((_, i) => i !== index));
    toast.success('Producto removido de la lista de recepción');
  };

  // Guardar recepciones
  const guardarRecepciones = async () => {
    if (recepciones.length === 0) {
      toast.error('No hay productos para recibir');
      return;
    }

    if (!datosUsuario?.empresaId || !sectorId) {
      toast.error('Error: No se pudo obtener la información necesaria');
      return;
    }

    try {
      setGuardando(true);
      
      const requestBody = {
        recepciones: recepciones.map(r => ({
          productoId: r.productoId,
          stockId: r.stockId,
          cantidad: r.cantidad
        }))
      };

      console.log('🔍 Enviando recepciones:', requestBody);
      console.log('🔍 URL:', `/empresas/${datosUsuario.empresaId}/sectores/${sectorId}/recibir-productos`);
      console.log('🔍 empresaId:', datosUsuario.empresaId);
      console.log('🔍 sectorId:', sectorId);
      
      const response = await apiCall(`/empresas/${datosUsuario.empresaId}/sectores/${sectorId}/recibir-productos`, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      toast.success('Productos recibidos exitosamente');
      setRecepciones([]);
      
      // Recargar stock detallado
      await cargarStockDetallado();
      
      // Volver a la gestión de sectores
      setTimeout(() => {
        navigate('/admin/sectores');
      }, 1500);

    } catch (error) {
      console.error('Error al recibir productos:', error);
      toast.error('Error al recibir productos');
    } finally {
      setGuardando(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    if (datosUsuario?.empresaId) {
      cargarSector();
      cargarStockDetallado();
    }
  }, [datosUsuario]);

  if (cargandoSector || cargandoStock || !datosUsuario) {
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
    <>
      <NavbarAdmin
        onCerrarSesion={cerrarSesion}
        empresaNombre={datosUsuario.empresaNombre}
        nombreAdministrador={datosUsuario.nombre}
      />
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          width: '100%',
          margin: '0 auto',
          padding: '7rem 2rem 2rem 2rem'
        }}>
          {/* Header */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '2rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            border: '2px solid #e2e8f0'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'nowrap',
              gap: '1rem'
            }}>
              <div>
                <button 
                  onClick={() => navigate('/admin/sectores')}
                  style={{
                    background: 'rgba(102, 126, 234, 0.1)',
                    border: '2px solid rgba(102, 126, 234, 0.2)',
                    borderRadius: '8px',
                    color: '#667eea',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  ← Volver
                </button>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: '0 0 0.5rem 0'
                }}>
                  📦 Recibir Productos
                </h1>
                <p style={{
                  color: '#64748b',
                  margin: 0,
                  fontSize: '1rem'
                }}>
                  Sector: {sector?.nombre}
                </p>
              </div>
            </div>
          </div>

          <div className="recibir-productos-container">
            {/* Panel izquierdo - Búsqueda y selección */}
            <div className="panel-busqueda">
              <div className="card" style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                border: '2px solid #e2e8f0'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 1.5rem 0'
                }}>
                  🔍 Buscador Avanzado
                </h2>

                                 {/* Campo de búsqueda y cantidad */}
                 <div style={{ marginBottom: '1.5rem' }}>
                   <div style={{
                     display: 'flex',
                     gap: '1rem',
                     alignItems: 'flex-end'
                   }}>
                     {/* Buscador */}
                     <div style={{ flex: 1 }}>
                       <label style={{
                         display: 'block',
                         fontSize: '0.875rem',
                         fontWeight: '600',
                         color: '#374151',
                         marginBottom: '0.5rem'
                       }}>
                         Buscar por nombre o código:
                       </label>
                       <input
                         ref={inputBusquedaRef}
                         type="text"
                         value={filtroBusqueda}
                         onChange={(e) => setFiltroBusqueda(e.target.value)}
                         placeholder="Escribe el nombre o código del producto..."
                         style={{
                           width: '100%',
                           padding: '0.75rem',
                           border: '2px solid #d1d5db',
                           borderRadius: '8px',
                           fontSize: '1rem',
                           background: 'white',
                           transition: 'all 0.2s ease'
                         }}
                         onFocus={(e) => {
                           e.target.style.borderColor = '#667eea';
                           e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                         }}
                         onBlur={(e) => {
                           e.target.style.borderColor = '#d1d5db';
                           e.target.style.boxShadow = 'none';
                         }}
                       />
                     </div>

                     {/* Campo de cantidad - solo visible cuando modoCantidad es true */}
                     {modoCantidad && stockSeleccionado && (
                       <div style={{ flex: '0 0 200px' }}>
                         <label style={{
                           display: 'block',
                           fontSize: '0.875rem',
                           fontWeight: '600',
                           color: '#374151',
                           marginBottom: '0.5rem'
                         }}>
                           Cantidad:
                         </label>
                         <input
                           ref={inputCantidadRef}
                           type="number"
                           value={cantidad}
                           onChange={(e) => setCantidad(e.target.value)}
                           placeholder="Cantidad..."
                           min="1"
                           max={stockSeleccionado.cantidad}
                           style={{
                             width: '100%',
                             padding: '0.75rem',
                             border: '2px solid #d1d5db',
                             borderRadius: '8px',
                             fontSize: '1rem',
                             background: 'white',
                             transition: 'all 0.2s ease'
                           }}
                           onFocus={(e) => {
                             e.target.style.borderColor = '#667eea';
                             e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                           }}
                           onBlur={(e) => {
                             e.target.style.borderColor = '#d1d5db';
                             e.target.style.boxShadow = 'none';
                           }}
                         />
                       </div>
                     )}
                   </div>

                   {/* Información del producto seleccionado cuando está en modo cantidad */}
                   {modoCantidad && stockSeleccionado && (
                     <>
                       <div style={{
                         background: '#f8fafc',
                         padding: '0.75rem',
                         borderRadius: '8px',
                         border: '2px solid #e2e8f0',
                         marginTop: '0.75rem',
                         fontSize: '0.875rem'
                       }}>
                         <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                           {productoSeleccionado?.productoNombre}
                         </div>
                         <div style={{ color: '#64748b', marginBottom: '0.25rem' }}>
                           Desde: {stockSeleccionado.ubicacion}
                         </div>
                         <div style={{ color: '#64748b' }}>
                           Stock disponible: {stockSeleccionado.cantidad}
                         </div>
                       </div>
                       
                       {/* Botones de confirmar y cancelar */}
                       <div style={{
                         display: 'flex',
                         gap: '0.5rem',
                         marginTop: '0.75rem'
                       }}>
                         <button
                           onClick={confirmarRecepcion}
                           style={{
                             flex: 1,
                             padding: '0.75rem',
                             background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                             color: 'white',
                             border: 'none',
                             borderRadius: '8px',
                             fontSize: '1rem',
                             fontWeight: '600',
                             cursor: 'pointer',
                             transition: 'all 0.2s ease'
                           }}
                           onMouseEnter={(e) => {
                             e.currentTarget.style.transform = 'translateY(-2px)';
                             e.currentTarget.style.boxShadow = '0 4px 15px rgba(67, 233, 123, 0.3)';
                           }}
                           onMouseLeave={(e) => {
                             e.currentTarget.style.transform = 'translateY(0)';
                             e.currentTarget.style.boxShadow = 'none';
                           }}
                         >
                           Confirmar
                         </button>
                         <button
                           onClick={cancelarCantidad}
                           style={{
                             padding: '0.75rem 1rem',
                             background: '#f1f5f9',
                             color: '#374151',
                             border: 'none',
                             borderRadius: '8px',
                             fontSize: '1rem',
                             fontWeight: '600',
                             cursor: 'pointer',
                             transition: 'all 0.2s ease'
                           }}
                           onMouseEnter={(e) => {
                             e.currentTarget.style.background = '#e2e8f0';
                           }}
                           onMouseLeave={(e) => {
                             e.currentTarget.style.background = '#f1f5f9';
                           }}
                         >
                           Cancelar
                         </button>
                       </div>
                     </>
                   )}
                 </div>

                {/* Instrucciones */}
                {!filtroBusqueda.trim() && (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#64748b',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '2px dashed #cbd5e1'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                    <p style={{ margin: 0, fontSize: '1rem', marginBottom: '0.5rem' }}>
                      Presiona <kbd style={{
                        background: '#e2e8f0',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151'
                      }}>Enter</kbd> para activar el buscador
                    </p>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                      Luego escribe el nombre o código del producto
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                      <kbd style={{
                        background: '#e2e8f0',
                        border: '1px solid #cbd5e1',
                        borderRadius: '3px',
                        padding: '0.125rem 0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#374151'
                      }}>Esc</kbd> para volver a gestión de sectores
                    </p>
                  </div>
                )}

                {/* Lista de productos filtrados - Diseño compacto */}
                {productosFiltrados.length > 0 && !productoSeleccionado && (
                  <div style={{
                    position: 'relative',
                    marginTop: '0.5rem',
                    background: 'white',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    maxHeight: '250px',
                    overflowY: 'auto',
                    zIndex: 10,
                    opacity: mostrarOpciones ? 1 : 0,
                    transform: mostrarOpciones ? 'translateY(0)' : 'translateY(-10px)',
                    transition: 'all 0.2s ease-in-out'
                  }}>
                    <div style={{
                      padding: '0.5rem',
                      borderBottom: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      borderTopLeftRadius: '6px',
                      borderTopRightRadius: '6px'
                    }}>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        📦 {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''} encontrado{productosFiltrados.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div ref={listaProductosRef}>
                      {productosFiltrados.map((producto, index) => (
                        <div
                          key={producto.productoId}
                          style={{
                            padding: '0.75rem',
                            borderBottom: index < productosFiltrados.length - 1 ? '1px solid #f1f5f9' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            background: productoSeleccionadoIndex === index ? '#667eea' : 'white',
                            color: productoSeleccionadoIndex === index ? 'white' : '#1e293b'
                          }}
                          onClick={() => seleccionarProducto(producto)}
                          onMouseEnter={(e) => {
                            if (productoSeleccionadoIndex !== index) {
                              e.currentTarget.style.background = '#f8fafc';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (productoSeleccionadoIndex !== index) {
                              e.currentTarget.style.background = 'white';
                            }
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '0.25rem'
                          }}>
                            <div style={{ fontWeight: '600', flex: 1 }}>
                              {producto.productoNombre}
                            </div>
                            <div style={{
                              display: 'flex',
                              gap: '0.5rem',
                              alignItems: 'center'
                            }}>
                              <div style={{
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.5rem',
                                background: productoSeleccionadoIndex === index ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                                borderRadius: '4px',
                                color: productoSeleccionadoIndex === index ? 'white' : '#64748b'
                              }}>
                                {producto.ubicaciones.length} ubic.
                              </div>
                              <div style={{
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.5rem',
                                background: productoSeleccionadoIndex === index ? 'rgba(255,255,255,0.2)' : '#10b981',
                                borderRadius: '4px',
                                color: productoSeleccionadoIndex === index ? 'white' : 'white',
                                fontWeight: '600'
                              }}>
                                📦 {calcularStockTotal(producto)}
                              </div>
                            </div>
                          </div>
                          {producto.codigoPersonalizado && (
                            <div style={{
                              fontSize: '0.75rem',
                              opacity: 0.8,
                              color: productoSeleccionadoIndex === index ? 'rgba(255,255,255,0.8)' : '#64748b'
                            }}>
                              📋 {producto.codigoPersonalizado}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista de ubicaciones del producto seleccionado - Diseño compacto */}
                {productoSeleccionado && ubicacionesFiltradas.length > 0 && !modoCantidad && (
                  <div style={{
                    position: 'relative',
                    marginTop: '0.5rem',
                    background: 'white',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 10,
                    opacity: mostrarOpciones ? 1 : 0,
                    transform: mostrarOpciones ? 'translateY(0)' : 'translateY(-10px)',
                    transition: 'all 0.2s ease-in-out'
                  }}>
                    <div style={{
                      padding: '0.5rem',
                      borderBottom: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      borderTopLeftRadius: '6px',
                      borderTopRightRadius: '6px'
                    }}>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        📍 Ubicaciones disponibles para {productoSeleccionado.productoNombre}
                      </span>
                    </div>
                    <div ref={listaUbicacionesRef}>
                      {ubicacionesFiltradas.map((ubicacion, index) => (
                        <div
                          key={ubicacion.stockId}
                          style={{
                            padding: '0.75rem',
                            borderBottom: index < ubicacionesFiltradas.length - 1 ? '1px solid #f1f5f9' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            background: ubicacionSeleccionadaIndex === index ? '#667eea' : 'white',
                            color: ubicacionSeleccionadaIndex === index ? 'white' : '#1e293b'
                          }}
                          onClick={() => seleccionarUbicacion(ubicacion)}
                          onMouseEnter={(e) => {
                            if (ubicacionSeleccionadaIndex !== index) {
                              e.currentTarget.style.background = '#f8fafc';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (ubicacionSeleccionadaIndex !== index) {
                              e.currentTarget.style.background = 'white';
                            }
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{ fontWeight: '600' }}>
                              📍 {ubicacion.ubicacion}
                            </div>
                            <div style={{
                              fontSize: '0.875rem',
                              padding: '0.25rem 0.5rem',
                              background: ubicacionSeleccionadaIndex === index ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                              borderRadius: '4px',
                              color: ubicacionSeleccionadaIndex === index ? 'white' : '#64748b',
                              fontWeight: '600'
                            }}>
                              {ubicacion.cantidad} unidades
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                
              </div>
            </div>

            {/* Panel central - Lista de recepciones */}
            <div className="panel-recepcion">
              <div className="card" style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                border: '2px solid #e2e8f0'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 1.5rem 0'
                }}>
                  📋 Lista de Recepción
                </h2>

                {recepciones.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#64748b',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '2px dashed #cbd5e1'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                    <p style={{ margin: 0, fontSize: '1rem' }}>
                      No hay productos en la lista de recepción
                    </p>
                  </div>
                ) : (
                  <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                    {recepciones.map((recepcion, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '1rem',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          marginBottom: '0.75rem',
                          background: '#f8fafc'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '0.5rem'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                              {recepcion.productoNombre}
                            </div>
                            {recepcion.codigoPersonalizado && (
                              <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                                Código: {recepcion.codigoPersonalizado}
                              </div>
                            )}
                            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                              Desde: {recepcion.ubicacion}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                              Cantidad: {recepcion.cantidad}
                            </div>
                          </div>
                          <button
                            onClick={() => removerRecepcion(index)}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#dc2626';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#ef4444';
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Panel derecho - Resumen y botón */}
            <div className="panel-resumen">
              <div className="card" style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                border: '2px solid #e2e8f0'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 1.5rem 0'
                }}>
                  📊 Resumen
                </h2>

                <div style={{ marginBottom: '2rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    background: '#f8fafc',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontWeight: '600', color: '#374151' }}>
                      Productos:
                    </span>
                    <span style={{ fontWeight: '700', color: '#667eea', fontSize: '1.25rem' }}>
                      {recepciones.length}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: '#f8fafc',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontWeight: '600', color: '#374151' }}>
                      Unidades:
                    </span>
                    <span style={{ fontWeight: '700', color: '#667eea', fontSize: '1.25rem' }}>
                      {recepciones.reduce((sum, r) => sum + r.cantidad, 0)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={guardarRecepciones}
                  disabled={guardando || recepciones.length === 0}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: guardando || recepciones.length === 0 ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: guardando || recepciones.length === 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!guardando && recepciones.length > 0) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!guardando && recepciones.length > 0) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {guardando ? 'Guardando...' : 'Confirmar Recepción'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecibirProductos;
