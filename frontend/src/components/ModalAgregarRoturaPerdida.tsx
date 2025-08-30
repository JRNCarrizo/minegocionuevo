import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../services/api';
import { useResponsive } from '../hooks/useResponsive';
import { useUsuarioActual } from '../hooks/useUsuarioActual';
import { obtenerFechaActual } from '../utils/dateUtils';

interface Producto {
  id: number;
  nombre: string;
  codigoPersonalizado?: string;
  descripcion?: string;
  stock: number;
  codigoBarras?: string;
}

interface ModalAgregarRoturaPerdidaProps {
  isOpen: boolean;
  onClose: () => void;
  onRoturaPerdidaCreada: () => void;
}

export default function ModalAgregarRoturaPerdida({ 
  isOpen, 
  onClose, 
  onRoturaPerdidaCreada 
}: ModalAgregarRoturaPerdidaProps) {
  const { isMobile } = useResponsive();
  const { datosUsuario } = useUsuarioActual();
  
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(false);
  
  // Estados para búsqueda dinámica (igual que CrearPlanilla)
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([]);
  const [mostrarProductos, setMostrarProductos] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<number>(-1);
  const [inputBusqueda, setInputBusqueda] = useState('');
  const [productoParaCantidad, setProductoParaCantidad] = useState<Producto | null>(null);
  const [cantidadTemporal, setCantidadTemporal] = useState(1);
  const [modoCantidad, setModoCantidad] = useState(false);
  
  // Estados para el formulario
  const [fecha, setFecha] = useState(obtenerFechaActual());
  const [observaciones, setObservaciones] = useState('');
  const [descripcionProducto, setDescripcionProducto] = useState('');
  const [codigoPersonalizado, setCodigoPersonalizado] = useState('');
  const [productoFinalSeleccionado, setProductoFinalSeleccionado] = useState<Producto | null>(null);
  const [cantidadFinal, setCantidadFinal] = useState(1);
  const [creando, setCreando] = useState(false);

  // Referencias
  const inputBusquedaRef = useRef<HTMLInputElement>(null);
  const inputCantidadRef = useRef<HTMLInputElement>(null);
  const listaProductosRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && datosUsuario?.empresaId) {
      cargarProductos();
    }
  }, [isOpen, datosUsuario]);

  // Recargar productos cada vez que se abre el modal para tener stock actualizado
  useEffect(() => {
    if (isOpen) {
      cargarProductos();
    }
  }, [isOpen]);

  // Efecto para filtrar productos (igual que CrearPlanilla)
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

  // Efecto para enfocar el campo de cantidad cuando se activa el modo cantidad
  useEffect(() => {
    if (modoCantidad && inputCantidadRef.current) {
      inputCantidadRef.current.focus();
      inputCantidadRef.current.select();
    }
  }, [modoCantidad]);

  // Efecto para enfocar el campo de búsqueda cuando se abre el modal
  useEffect(() => {
    if (isOpen && inputBusquedaRef.current) {
      // Pequeño delay para asegurar que el modal esté completamente renderizado
      setTimeout(() => {
        inputBusquedaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Efecto para enfocar el campo de observaciones cuando se confirma la cantidad
  useEffect(() => {
    if (productoFinalSeleccionado && cantidadFinal > 0 && !modoCantidad) {
      // Enfocar el campo de observaciones para que el usuario pueda presionar Enter para guardar
      const textareaObservaciones = document.querySelector('textarea[placeholder*="Detalles"]') as HTMLTextAreaElement;
      if (textareaObservaciones) {
        setTimeout(() => {
          textareaObservaciones.focus();
        }, 100);
      }
    }
  }, [productoFinalSeleccionado, cantidadFinal, modoCantidad]);

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

  // Manejar navegación por teclado en búsqueda (igual que CrearPlanilla)
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

  // Manejar teclas en campo de cantidad (igual que CrearPlanilla)
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
        if (productoParaCantidad) {
          const stockDisponible = productoParaCantidad.stock;
          setCantidadTemporal(prev => Math.min(prev + 1, stockDisponible));
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        setCantidadTemporal(prev => Math.max(prev - 1, 1));
        break;
    }
  };

  // Manejar teclas en campo de observaciones
  const manejarTeclasObservaciones = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (productoFinalSeleccionado && cantidadFinal > 0) {
        crearRoturaPerdida();
      }
    }
  };

  // Seleccionar producto y activar modo cantidad (igual que CrearPlanilla)
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
    if (cantidadTemporal > productoParaCantidad.stock) {
      toast.error(`Stock insuficiente. Disponible: ${productoParaCantidad.stock} unidades`);
      return;
    }

    if (cantidadTemporal <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    // Establecer el producto y cantidad final (sin modificar el stock original)
    setProductoFinalSeleccionado(productoParaCantidad);
    setCantidadFinal(cantidadTemporal);
    
    toast.success(`${productoParaCantidad.nombre} seleccionado (${cantidadTemporal} unidades)`);
    
    // Resetear estado
    setModoCantidad(false);
    setProductoParaCantidad(null);
    setCantidadTemporal(1);
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

  // Limpiar producto seleccionado
  const limpiarProductoSeleccionado = () => {
    setProductoFinalSeleccionado(null);
    setCantidadFinal(1);
    setInputBusqueda('');
    setTimeout(() => {
      inputBusquedaRef.current?.focus();
    }, 100);
  };



  // Crear rotura/pérdida
  const crearRoturaPerdida = async () => {
    if (!fecha || cantidadFinal <= 0) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    // Validar que no sea una fecha futura
    const fechaActual = obtenerFechaActual();
    if (fecha > fechaActual) {
      toast.error('No se puede registrar una rotura/pérdida para una fecha futura');
      return;
    }

    if (!productoFinalSeleccionado && !descripcionProducto.trim()) {
      toast.error('Debe seleccionar un producto o ingresar una descripción');
      return;
    }

    // Validar stock si es un producto registrado
    if (productoFinalSeleccionado) {
      // Buscar el producto actual en la lista para obtener el stock real
      const productoActual = productos.find(p => p.id === productoFinalSeleccionado.id);
      if (productoActual && cantidadFinal > productoActual.stock) {
        toast.error(`Stock insuficiente. Disponible: ${productoActual.stock} unidades`);
        return;
      }
    }

    try {
      setCreando(true);
      

      
      // Obtener la zona horaria del usuario
      const zonaHorariaUsuario = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('🌍 Zona horaria del usuario:', zonaHorariaUsuario);
      
      // Crear fecha con hora local del usuario
      const fechaSeleccionada = new Date(fecha + 'T00:00:00');
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
      
      // Formatear como ISO string para enviar al backend
      const fechaFormateada = fechaLocal.toISOString();
      
      console.log('📋 Fecha seleccionada:', fecha);
      console.log('📋 Hora local del usuario:', `${horaLocal}:${minutosLocal}:${segundosLocal}`);
      console.log('📋 Fecha local creada:', fechaLocal.toString());
      console.log('📋 Fecha formateada en UTC:', fechaFormateada);
      
      const datosRoturaPerdida = {
        fecha: fechaFormateada,
        cantidad: cantidadFinal,
        observaciones: observaciones.trim() || null,
        productoId: productoFinalSeleccionado?.id || null,
        descripcionProducto: !productoFinalSeleccionado ? descripcionProducto.trim() : null,
        codigoPersonalizado: !productoFinalSeleccionado ? codigoPersonalizado.trim() : null,
        zonaHoraria: zonaHorariaUsuario
      };

      await ApiService.crearRoturaPerdida(datosRoturaPerdida);
      
      toast.success('Rotura/Pérdida registrada exitosamente');
      
      // Recargar productos para actualizar el stock
      if (datosUsuario?.empresaId) {
        await cargarProductos();
      }
      
      onRoturaPerdidaCreada();
      onClose();
      
      // Limpiar formulario
      setFecha(obtenerFechaActual());
      setCantidadFinal(1);
      setObservaciones('');
      setProductoFinalSeleccionado(null);
      setDescripcionProducto('');
      setCodigoPersonalizado('');
      setInputBusqueda('');
    } catch (error) {
      console.error('Error al crear rotura/pérdida:', error);
      toast.error('Error al registrar la rotura/pérdida');
    } finally {
      setCreando(false);
    }
  };

  if (!isOpen) return null;

  return (
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
      padding: isMobile ? '1rem' : '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: isMobile ? '1.5rem' : '2rem',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              color: 'white'
            }}>
              💔
            </div>
            <div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1e293b',
                margin: 0
              }}>
                Agregar Rotura/Pérdida
              </h2>
              <p style={{
                color: '#64748b',
                margin: '0.25rem 0 0 0',
                fontSize: '0.875rem'
              }}>
                Registra un producto dañado o perdido
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
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

        {/* Formulario */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          {/* Fecha */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              📅 Fecha *
            </label>
            <input
              type="date"
              value={fecha}
              max={obtenerFechaActual()}
              onChange={(e) => {
                const fechaSeleccionada = e.target.value;
                const fechaActual = obtenerFechaActual();
                
                // Validar que no sea una fecha futura
                if (fechaSeleccionada > fechaActual) {
                  toast.error('No se puede seleccionar una fecha futura');
                  return;
                }
                
                setFecha(fechaSeleccionada);
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          </div>

          {/* Producto - Búsqueda avanzada */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              🛍️ Producto *
            </label>
            
            {productoFinalSeleccionado ? (
              <div style={{
                padding: '0.75rem',
                border: '1px solid #10b981',
                borderRadius: '0.5rem',
                background: '#f0fdf4'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <p style={{
                      fontWeight: '600',
                      color: '#065f46',
                      margin: '0 0 0.25rem 0'
                    }}>
                      {productoFinalSeleccionado.nombre}
                    </p>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#047857',
                      margin: '0 0 0.25rem 0'
                    }}>
                      Código: {productoFinalSeleccionado.codigoPersonalizado || 'Sin código'}
                    </p>
                                         <p style={{
                       fontSize: '0.875rem',
                       color: '#047857',
                       margin: 0
                     }}>
                       Stock actual: {productoFinalSeleccionado.stock} unidades
                     </p>
                     <p style={{
                       fontSize: '0.875rem',
                       color: '#dc2626',
                       margin: '0.25rem 0 0 0',
                       fontWeight: '600'
                     }}>
                       Stock después de esta pérdida: {Math.max(0, productoFinalSeleccionado.stock - cantidadFinal)} unidades
                     </p>
                     {productoFinalSeleccionado.stock - cantidadFinal <= 0 && (
                       <p style={{
                         fontSize: '0.75rem',
                         color: '#dc2626',
                         margin: '0.25rem 0 0 0',
                         fontWeight: '600',
                         fontStyle: 'italic'
                       }}>
                         ⚠️ El producto quedará sin stock
                       </p>
                     )}
                  </div>
                  <button
                    onClick={limpiarProductoSeleccionado}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <input
                  ref={inputBusquedaRef}
                  type="text"
                  value={inputBusqueda}
                  onChange={(e) => setInputBusqueda(e.target.value)}
                  onKeyDown={manejarTeclas}
                  onFocus={() => setMostrarProductos(true)}
                  placeholder="Buscar producto por nombre, código o código de barras..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                />
                
                {mostrarProductos && productosFiltrados.length > 0 && (
                  <div
                    ref={listaProductosRef}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                      zIndex: 10,
                      maxHeight: '200px',
                      overflow: 'auto'
                    }}
                  >
                    {productosFiltrados.map((producto, index) => (
                      <div
                        key={producto.id}
                        onClick={() => seleccionarProducto(producto)}
                        style={{
                          padding: '0.75rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f3f4f6',
                          transition: 'background-color 0.2s',
                          background: index === productoSeleccionado ? '#f3f4f6' : 'white'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = index === productoSeleccionado ? '#f3f4f6' : 'white';
                        }}
                      >
                        <p style={{
                          fontWeight: '600',
                          color: '#1f2937',
                          margin: '0 0 0.25rem 0'
                        }}>
                          {producto.nombre}
                        </p>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          margin: '0 0 0.25rem 0'
                        }}>
                          Código: {producto.codigoPersonalizado || 'Sin código'}
                        </p>
                                                 <p style={{
                           fontSize: '0.875rem',
                           color: producto.stock > 0 ? '#059669' : '#dc2626',
                           margin: 0,
                           fontWeight: '600'
                         }}>
                           Stock actual: {producto.stock} unidades
                         </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modo cantidad (igual que CrearPlanilla) */}
          {modoCantidad && productoParaCantidad && (
            <div style={{
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div>
                  <p style={{
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: '0 0 0.25rem 0'
                  }}>
                    {productoParaCantidad.nombre}
                  </p>
                                     <p style={{
                     fontSize: '0.875rem',
                     color: '#6b7280',
                     margin: 0
                   }}>
                     Stock actual: {productoParaCantidad.stock} unidades
                   </p>
                </div>
                <button
                  onClick={cancelarCantidad}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Cantidad perdida:
                </label>
                <input
                  ref={inputCantidadRef}
                  type="number"
                  min="1"
                  max={productoParaCantidad.stock}
                  value={cantidadTemporal}
                  onChange={(e) => setCantidadTemporal(parseInt(e.target.value) || 1)}
                  onKeyDown={manejarTeclasCantidad}
                  style={{
                    width: '80px',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={confirmarCantidad}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Confirmar
                </button>
              </div>
            </div>
          )}

          {/* Producto no registrado */}
          {!productoFinalSeleccionado && !modoCantidad && (
            <>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  📝 Descripción del Producto
                </label>
                <input
                  type="text"
                  value={descripcionProducto}
                  onChange={(e) => setDescripcionProducto(e.target.value)}
                  placeholder="Descripción del producto (si no está registrado)"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
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
                  🏷️ Código del Producto
                </label>
                <input
                  type="text"
                  value={codigoPersonalizado}
                  onChange={(e) => setCodigoPersonalizado(e.target.value)}
                  placeholder="Código del producto (opcional)"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>
            </>
          )}

          {/* Cantidad final */}
          {productoFinalSeleccionado && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                📊 Cantidad Perdida *
              </label>
              <div style={{
                padding: '0.75rem',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#dc2626'
              }}>
                {cantidadFinal} unidad{cantidadFinal !== 1 ? 'es' : ''}
              </div>
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              💬 Observaciones
            </label>
                         <textarea
               value={observaciones}
               onChange={(e) => setObservaciones(e.target.value)}
               onKeyDown={manejarTeclasObservaciones}
               placeholder="Detalles sobre la rotura o pérdida (opcional) - Presiona Enter para guardar"
               rows={3}
               style={{
                 width: '100%',
                 padding: '0.75rem',
                 border: '1px solid #d1d5db',
                 borderRadius: '0.5rem',
                 fontSize: '0.875rem',
                 outline: 'none',
                 transition: 'border-color 0.2s',
                 resize: 'vertical'
               }}
             />
          </div>
        </div>

        {/* Botones */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '2rem',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            disabled={creando}
            style={{
              padding: '0.75rem 1.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              background: 'white',
              color: '#374151',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              opacity: creando ? 0.5 : 1
            }}
          >
            Cancelar
          </button>
          
          <button
            onClick={crearRoturaPerdida}
            disabled={creando || (!productoFinalSeleccionado && !descripcionProducto.trim())}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: creando ? 'not-allowed' : 'pointer',
              opacity: creando || (!productoFinalSeleccionado && !descripcionProducto.trim()) ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {creando ? (
              <>
                <div style={{
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Registrando...
              </>
            ) : (
              'Registrar Rotura/Pérdida'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
