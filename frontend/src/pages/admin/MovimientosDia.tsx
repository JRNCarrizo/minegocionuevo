import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
import { formatearFecha } from '../../utils/dateUtils';

interface MovimientoDia {
  fecha: string;
  stockInicial: StockInicialDTO;
  ingresos: MovimientosDTO;
  devoluciones: MovimientosDTO;
  salidas: MovimientosDTO;
  roturas: MovimientosDTO;
  balanceFinal: StockInicialDTO;
  diaCerrado: boolean;
}

interface StockInicialDTO {
  cantidadTotal: number;
  productos: ProductoStockDTO[];
}

interface MovimientosDTO {
  cantidadTotal: number;
  productos: ProductoMovimientoDTO[];
}

interface ProductoStockDTO {
  id: number;
  nombre: string;
  codigoPersonalizado?: string;
  cantidad: number;
  precio?: number;
  cantidadInicial?: number;
  variacion?: number;
  tipoVariacion?: string;
}

interface ProductoMovimientoDTO {
  id: number;
  nombre: string;
  codigoPersonalizado?: string;
  cantidad: number;
  fechaMovimiento: string;
  observaciones?: string;
}

export default function MovimientosDia() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [modoRango, setModoRango] = useState<boolean>(false);
  const [movimientos, setMovimientos] = useState<MovimientoDia | null>(null);
  const [cargando, setCargando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState<string | null>(null);
  const [transicionando, setTransicionando] = useState<boolean>(false);
  const [filtroBusqueda, setFiltroBusqueda] = useState<string>('');
  
  // Estado para navegación por teclado
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(0);

  // Obtener fecha actual en formato YYYY-MM-DD usando zona horaria local
  const obtenerFechaActual = () => {
    const hoy = new Date();
    const zonaHorariaLocal = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fechaActual = hoy.toLocaleDateString('en-CA', { timeZone: zonaHorariaLocal }); // formato YYYY-MM-DD
    
    console.log('🔍 [DEBUG] obtenerFechaActual:', {
      hoy: hoy.toISOString(),
      zonaHorariaLocal,
      fechaActual
    });
    
    return fechaActual;
  };

  useEffect(() => {
    // Establecer fecha actual por defecto
    const fechaActual = obtenerFechaActual();
    setFechaSeleccionada(fechaActual);
    setFechaInicio(fechaActual);
    setFechaFin(fechaActual);
  }, []);

  useEffect(() => {
    // Solo cargar automáticamente si no está en transición y es la carga inicial
    if (fechaSeleccionada && !modoRango && !transicionando && !movimientos) {
      cargarMovimientosDia(fechaSeleccionada, false); // No mostrar toast en carga inicial
    }
  }, [fechaSeleccionada, modoRango, transicionando, movimientos]);

  useEffect(() => {
    // Solo cargar automáticamente si no está en transición y es la carga inicial
    if (modoRango && fechaInicio && fechaFin && !transicionando && !movimientos) {
      cargarMovimientosRango(fechaInicio, fechaFin, false); // No mostrar toast en carga inicial
    }
  }, [fechaInicio, fechaFin, modoRango, transicionando, movimientos]);

  // Efecto para manejar cambios manuales de fecha (con toast)
  useEffect(() => {
    if (fechaSeleccionada && !modoRango && !transicionando && movimientos) {
      // Si ya hay movimientos cargados, es un cambio manual de fecha
      cargarMovimientosDia(fechaSeleccionada, true); // Mostrar toast
    }
  }, [fechaSeleccionada]);

  useEffect(() => {
    if (modoRango && fechaInicio && fechaFin && !transicionando && movimientos) {
      // Si ya hay movimientos cargados, es un cambio manual de fecha
      cargarMovimientosRango(fechaInicio, fechaFin, true); // Mostrar toast
    }
  }, [fechaInicio, fechaFin]);

  // Función para obtener estilos de indicador de selección más visible con colores específicos
  const obtenerEstilosIndicador = (esSeleccionada: boolean, cardIndex: number) => {
    if (!esSeleccionada) return { display: 'none' };
    
    // Definir colores específicos para cada card
    const coloresCards = {
      0: '#3b82f6', // Stock Inicial - Azul
      1: '#059669', // Ingresos - Verde
      2: '#f59e0b', // Retornos y Devoluciones - Amarillo/Naranja
              3: '#ef4444', // Carga de Planillas - Rojo
      4: '#7c3aed', // Roturas y Pérdidas - Púrpura
      5: '#8b5cf6'  // Balance Final - Púrpura
    };
    
    const color = coloresCards[cardIndex as keyof typeof coloresCards] || '#3b82f6';
    
    return {
      position: 'absolute' as const,
      top: '-4px',
      left: '-4px',
      right: '-4px',
      bottom: '-4px',
      border: `3px solid ${color}`,
      borderRadius: '1rem',
      pointerEvents: 'none' as const,
      zIndex: 10,
      opacity: 1,
      boxShadow: `0 0 20px ${color}40`
    };
  };

  // Función para obtener estilos de la card con efecto de escala cuando está seleccionada
  const obtenerEstilosCard = (_index: number, esSeleccionada: boolean) => {
    const baseStyles = {
      background: 'white',
      borderRadius: '1rem',
      paddingTop: isMobile ? '1.5rem' : '2rem',
      paddingBottom: isMobile ? '1.5rem' : '2rem',
      paddingLeft: isMobile ? '1.5rem' : '2rem',
      paddingRight: isMobile ? '1.5rem' : '2rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      position: 'relative' as const
    };

    if (esSeleccionada) {
      return {
        ...baseStyles,
        transform: 'scale(1.05)',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
        zIndex: 5
      };
    }

    return baseStyles;
  };

  // Función para manejar la navegación por teclado
  const manejarNavegacionTeclado = (event: KeyboardEvent) => {
    if (!movimientos) return;
    
    const totalCards = 6; // Stock Inicial, Ingresos, Retornos, Carga de Planillas, Roturas, Balance Final
    
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        // Si hay un modal abierto, cerrarlo primero
        if (modalAbierto) {
          cerrarModal();
          return;
        }
        // Si no hay modal abierto, salir de la sección
        navigate('/admin/gestion-empresa');
        break;
      case 'ArrowLeft':
        event.preventDefault();
        // Solo permitir navegación si no hay modal abierto
        if (!modalAbierto) {
          setIndiceSeleccionado(prev => (prev > 0 ? prev - 1 : totalCards - 1));
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        // Solo permitir navegación si no hay modal abierto
        if (!modalAbierto) {
          setIndiceSeleccionado(prev => (prev < totalCards - 1 ? prev + 1 : 0));
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        // Solo permitir navegación si no hay modal abierto
        if (!modalAbierto) {
          setIndiceSeleccionado(prev => {
            if (prev >= 3) return prev - 3; // Mover a la fila superior
            return prev; // Ya está en la primera fila
          });
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        // Solo permitir navegación si no hay modal abierto
        if (!modalAbierto) {
          setIndiceSeleccionado(prev => {
            if (prev < 3) return prev + 3; // Mover a la fila inferior
            return prev; // Ya está en la última fila
          });
        }
        break;
      case 'Enter':
        event.preventDefault();
        // Solo permitir abrir modal si no hay uno abierto
        if (!modalAbierto) {
          const secciones = ['stockInicial', 'ingresos', 'devoluciones', 'salidas', 'roturas', 'balanceFinal'];
          const seccionSeleccionada = secciones[indiceSeleccionado];
          if (seccionSeleccionada) {
            abrirModal(seccionSeleccionada);
          }
        }
        break;
             case '?':
         event.preventDefault();
         // Función de ayuda removida - mantener la tecla disponible para futuras funcionalidades
         break;
    }
  };

  // Agregar y remover event listeners para navegación por teclado
  useEffect(() => {
    document.addEventListener('keydown', manejarNavegacionTeclado);
    return () => {
      document.removeEventListener('keydown', manejarNavegacionTeclado);
    };
  }, [movimientos, indiceSeleccionado, modalAbierto]);

  const cargarMovimientosDia = async (fecha: string, mostrarToast: boolean = true) => {
    try {
      setCargando(true);
      console.log('🔍 [DEBUG] cargarMovimientosDia:', {
        fecha,
        zonaHorariaLocal: Intl.DateTimeFormat().resolvedOptions().timeZone,
        fechaActual: obtenerFechaActual()
      });
      
      const response = await ApiService.obtenerMovimientosDia(fecha);
      console.log('📊 Datos recibidos del backend:', response);
      
             // Debug específico para Balance Final
       if (response && response.balanceFinal && response.balanceFinal.productos) {
         console.log('🎯 [BALANCE FINAL] Todos los productos:');
         response.balanceFinal.productos.forEach((producto, index) => {
           const productoAny = producto as any;
           console.log(`  ${index + 1}. ${productoAny.codigoPersonalizado} | ${productoAny.nombre} | ` +
                      `Cantidad: ${productoAny.cantidad} | ` +
                      `Inicial: ${productoAny.cantidadInicial} | ` +
                      `Variación: ${productoAny.variacion} | ` +
                      `Tipo: ${productoAny.tipoVariacion}`);
         });
         
         console.log('🎯 [BALANCE FINAL] Productos con cambios:');
         response.balanceFinal.productos.forEach(producto => {
           const productoAny = producto as any;
           if (productoAny.tipoVariacion && productoAny.tipoVariacion !== 'SIN_CAMBIOS') {
             console.log(`  - ${productoAny.codigoPersonalizado} | ${productoAny.nombre} | ` +
                        `Inicial: ${productoAny.cantidadInicial} | Final: ${productoAny.cantidad} | ` +
                        `Variación: ${productoAny.variacion} | Tipo: ${productoAny.tipoVariacion}`);
           }
         });
       }
      
      setMovimientos(response);
      
      if (mostrarToast) {
        toast.success(`Movimientos cargados para ${formatearFecha(fecha)}`);
      }
      
    } catch (error) {
      console.error('❌ Error al cargar movimientos:', error);
      if (mostrarToast) {
        toast.error('Error al cargar los movimientos del día');
      }
    } finally {
      setCargando(false);
      setTransicionando(false);
    }
  };

  const cargarMovimientosRango = async (fechaInicio: string, fechaFin: string, mostrarToast: boolean = true) => {
    try {
      setCargando(true);
      console.log('🔍 Cargando movimientos para rango:', fechaInicio, 'a', fechaFin);
      
      const response = await ApiService.obtenerMovimientosRango(fechaInicio, fechaFin);
      console.log('📊 Datos recibidos del backend para rango:', response);
      
      setMovimientos(response);
      
      if (mostrarToast) {
        toast.success(`Movimientos cargados del ${formatearFecha(fechaInicio)} al ${formatearFecha(fechaFin)}`);
      }
      
    } catch (error) {
      console.error('❌ Error al cargar movimientos del rango:', error);
      if (mostrarToast) {
        toast.error('Error al cargar los movimientos del rango');
      }
    } finally {
      setCargando(false);
      setTransicionando(false);
    }
  };

  const abrirModal = (seccion: string) => {
    setModalAbierto(seccion);
  };

  const cerrarModal = () => {
    setModalAbierto(null);
    setFiltroBusqueda(''); // Limpiar filtro al cerrar modal
  };

  const cambiarModoDia = () => {
    setTransicionando(true);
    setModoRango(false);
    setMovimientos(null); // Limpiar movimientos actuales
    // Pequeño delay para que la transición se vea suave
    setTimeout(() => {
      if (fechaSeleccionada) {
        cargarMovimientosDia(fechaSeleccionada);
      }
    }, 150);
  };

  const cambiarModoRango = () => {
    setTransicionando(true);
    setModoRango(true);
    setMovimientos(null); // Limpiar movimientos actuales
    // Pequeño delay para que la transición se vea suave
    setTimeout(() => {
      if (fechaInicio && fechaFin) {
        cargarMovimientosRango(fechaInicio, fechaFin);
      }
    }, 150);
  };

  const exportarMovimientosExcel = async () => {
    if (!movimientos || modoRango) return;
    
    try {
      toast.loading('Exportando movimientos a Excel...');
      
      const blob = await ApiService.exportarMovimientosDiaExcel(fechaSeleccionada);
      
      // Crear URL y descargar archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `movimientos_dia_${fechaSeleccionada}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.dismiss();
      toast.success('Excel exportado exitosamente');
      
    } catch (error) {
      console.error('Error al exportar movimientos a Excel:', error);
      toast.dismiss();
      toast.error('Error al exportar movimientos a Excel');
    }
  };

  const exportarMovimientosRangoExcel = async () => {
    if (!movimientos || !modoRango) return;
    
    try {
      toast.loading('Exportando movimientos de rango a Excel...');
      
      const blob = await ApiService.exportarMovimientosRangoExcel(fechaInicio, fechaFin);
      
      // Crear URL y descargar archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `movimientos_rango_${fechaInicio}_a_${fechaFin}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.dismiss();
      toast.success('Excel de rango exportado exitosamente');
      
    } catch (error) {
      console.error('Error al exportar movimientos de rango a Excel:', error);
      toast.dismiss();
      toast.error('Error al exportar movimientos de rango a Excel');
    }
  };

  const exportarIngresosDiaExcel = async () => {
    if (!movimientos || modoRango) return;
    
    try {
      toast.loading('Exportando ingresos a Excel...');
      
      const blob = await ApiService.exportarIngresosDiaExcel(fechaSeleccionada);
      
      // Crear URL y descargar archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ingresos_dia_${fechaSeleccionada}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.dismiss();
      toast.success('Excel de ingresos exportado exitosamente');
      
    } catch (error) {
      console.error('Error al exportar ingresos a Excel:', error);
      toast.dismiss();
      toast.error('Error al exportar ingresos a Excel');
    }
  };

  const exportarPlanillasDiaExcel = async () => {
    if (!movimientos || modoRango) return;
    
    try {
      toast.loading('Exportando planillas a Excel...');
      
      const blob = await ApiService.exportarPlanillasDiaExcel(fechaSeleccionada);
      
      // Crear URL y descargar archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `planillas_dia_${fechaSeleccionada}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.dismiss();
      toast.success('Excel de planillas exportado exitosamente');
      
    } catch (error) {
      console.error('Error al exportar planillas a Excel:', error);
      toast.dismiss();
      toast.error('Error al exportar planillas a Excel');
    }
  };

  const exportarDevolucionesDiaExcel = async () => {
    if (!movimientos || modoRango) return;
    
    try {
      toast.loading('Exportando devoluciones a Excel...');
      
      const blob = await ApiService.exportarDevolucionesDiaExcel(fechaSeleccionada);
      
      // Crear URL y descargar archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devoluciones_dia_${fechaSeleccionada}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.dismiss();
      toast.success('Excel de devoluciones exportado exitosamente');
      
    } catch (error) {
      console.error('Error al exportar devoluciones a Excel:', error);
      toast.dismiss();
      toast.error('Error al exportar devoluciones a Excel');
    }
  };

  const exportarStockInicialExcel = async () => {
    if (!movimientos || modoRango) return;
    
    try {
      toast.loading('Exportando stock inicial a Excel...');
      
      const blob = await ApiService.exportarStockInicialExcel(fechaSeleccionada);
      
      // Crear URL y descargar archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock_inicial_${fechaSeleccionada}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.dismiss();
      toast.success('Excel de stock inicial exportado exitosamente');
      
    } catch (error) {
      console.error('Error al exportar stock inicial a Excel:', error);
      toast.dismiss();
      toast.error('Error al exportar stock inicial a Excel');
    }
  };

  const calcularBalanceFinal = () => {
    if (!movimientos) return 0;
    
    return movimientos.stockInicial.cantidadTotal + 
           movimientos.ingresos.cantidadTotal + 
           movimientos.devoluciones.cantidadTotal - 
           movimientos.salidas.cantidadTotal - 
           movimientos.roturas.cantidadTotal;
  };

  const obtenerTituloModal = (seccion: string) => {
    switch (seccion) {
      case 'stockInicial': return 'Stock Inicial';
              case 'salidas': return 'Carga de Planillas';
      case 'ingresos': return 'Ingresos';
      case 'roturas': return 'Roturas y Pérdidas';
      case 'devoluciones': return 'Retornos y Devoluciones';
      case 'balanceFinal': return 'Balance Final';
      default: return '';
    }
  };

  const obtenerProductosModal = (seccion: string) => {
    if (!movimientos) return [];
    
    let productos = [];
    switch (seccion) {
      case 'stockInicial': productos = movimientos.stockInicial.productos; break;
      case 'salidas': productos = movimientos.salidas.productos; break;
      case 'ingresos': productos = movimientos.ingresos.productos; break;
      case 'roturas': productos = movimientos.roturas.productos; break;
      case 'devoluciones': productos = movimientos.devoluciones.productos; break;
      case 'balanceFinal': productos = movimientos.balanceFinal.productos; break;
      default: return [];
    }
    
    // Aplicar filtro de búsqueda si está activo
    if (filtroBusqueda.trim()) {
      const filtro = filtroBusqueda.toLowerCase().trim();
      return productos.filter((producto: any) => {
        const nombre = (producto.nombre || '').toLowerCase();
        const codigo = (producto.codigoPersonalizado || '').toLowerCase();
        return nombre.includes(filtro) || codigo.includes(filtro);
      });
    }
    
    return productos;
  };

  const obtenerColorModal = (seccion: string) => {
    switch (seccion) {
      case 'stockInicial': return '#3b82f6';
      case 'salidas': return '#ef4444';
      case 'ingresos': return '#059669';
      case 'roturas': return '#7c3aed';
      case 'devoluciones': return '#f59e0b';
      case 'balanceFinal': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const obtenerIconoModal = (seccion: string) => {
    switch (seccion) {
      case 'stockInicial': return '📦';
      case 'salidas': return '📤';
      case 'ingresos': return '📥';
      case 'roturas': return '💔';
      case 'devoluciones': return '🔄';
      case 'balanceFinal': return '⚖️';
      default: return '📊';
    }
  };

  const renderizarProducto = (producto: any, seccion: string) => {
    if (seccion === 'balanceFinal') {
      // Debug: verificar si los campos están presentes
      console.log('🔍 [RENDERIZAR PRODUCTO] Producto:', {
        id: producto.id,
        nombre: producto.nombre,
        cantidad: producto.cantidad,
        cantidadInicial: producto.cantidadInicial,
        variacion: producto.variacion,
        tipoVariacion: producto.tipoVariacion
      });
      
      // Determinar el color de fondo y borde según el tipo de variación
      let backgroundColor = '#f8fafc';
      let borderColor = '#e2e8f0';
      let cantidadColor = '#8b5cf6';
      let variacionText = '';
      let badgeText = '';
      
      // Verificar si el producto tiene variación
      if (producto.tipoVariacion === 'INCREMENTO') {
        backgroundColor = '#f0fdf4';
        borderColor = '#22c55e';
        cantidadColor = '#16a34a';
        variacionText = `+${producto.variacion || 0}`;
        badgeText = `📈 +${producto.variacion || 0}`;
      } else if (producto.tipoVariacion === 'DECREMENTO') {
        backgroundColor = '#fef2f2';
        borderColor = '#ef4444';
        cantidadColor = '#dc2626';
        variacionText = `${producto.variacion || 0}`;
        badgeText = `📉 ${producto.variacion || 0}`;
      } else {
        // Producto sin cambios - hacer más sutil
        backgroundColor = '#f8fafc';
        borderColor = '#e2e8f0';
        cantidadColor = '#64748b';
        badgeText = '➖ Sin cambios';
      }
      
      return (
        <div key={producto.id} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem',
          background: backgroundColor,
          borderRadius: '0.5rem',
          marginBottom: '0.5rem',
          border: `2px solid ${borderColor}`,
          position: 'relative',
          transition: 'all 0.2s ease'
        }}>
          <div style={{ flex: 1 }}>
                         <div style={{ 
               fontWeight: '600', 
               color: '#1e293b',
               display: 'flex',
               alignItems: 'center',
               gap: '0.5rem',
               marginBottom: '0.25rem'
             }}>
               {producto.codigoPersonalizado && (
                 <span style={{ 
                   fontSize: '0.875rem', 
                   color: '#64748b',
                   fontWeight: '500',
                   fontFamily: 'monospace'
                 }}>
                   [{producto.codigoPersonalizado}]
                 </span>
               )}
               {producto.nombre}
               <span style={{
                 fontSize: '0.75rem',
                 padding: '0.25rem 0.5rem',
                 borderRadius: '0.25rem',
                 fontWeight: '500',
                 color: producto.tipoVariacion === 'INCREMENTO' ? '#16a34a' : 
                        producto.tipoVariacion === 'DECREMENTO' ? '#dc2626' : '#64748b',
                 background: producto.tipoVariacion === 'INCREMENTO' ? '#dcfce7' : 
                            producto.tipoVariacion === 'DECREMENTO' ? '#fee2e2' : '#f1f5f9',
                 border: `1px solid ${producto.tipoVariacion === 'INCREMENTO' ? '#bbf7d0' : 
                                    producto.tipoVariacion === 'DECREMENTO' ? '#fecaca' : '#e2e8f0'}`
               }}>
                 {badgeText}
               </span>
             </div>
            {producto.cantidadInicial !== undefined && (
              <div style={{ 
                fontSize: '0.75rem', 
                color: producto.tipoVariacion !== 'SIN_CAMBIOS' ? '#64748b' : '#9ca3af',
                fontStyle: 'italic'
              }}>
                Inicial: {producto.cantidadInicial} → Final: {producto.cantidad}
                {producto.tipoVariacion !== 'SIN_CAMBIOS' && (
                  <span style={{ 
                    marginLeft: '0.5rem',
                    fontWeight: '500',
                    color: producto.tipoVariacion === 'INCREMENTO' ? '#16a34a' : '#dc2626'
                  }}>
                    ({variacionText})
                  </span>
                )}
              </div>
            )}
          </div>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: cantidadColor,
            marginLeft: '1rem'
          }}>
            {producto.cantidad}
          </div>
        </div>
      );
    } else {
             // Para otras secciones
       const esNegativo = seccion === 'salidas' || seccion === 'roturas';
       const esPositivo = seccion === 'ingresos' || seccion === 'devoluciones';
       const color = obtenerColorModal(seccion);
       const backgroundColor = seccion === 'ingresos' ? '#f0fdf4' : 
                              seccion === 'devoluciones' ? '#fffbeb' :
                              seccion === 'salidas' ? '#fef2f2' :
                              seccion === 'roturas' ? '#faf5ff' : '#f8fafc';
       
       return (
         <div key={producto.id} style={{
           display: 'flex',
           justifyContent: 'space-between',
           alignItems: 'center',
           padding: '0.75rem',
           background: backgroundColor,
           borderRadius: '0.5rem',
           marginBottom: '0.5rem'
         }}>
           <div>
             <div style={{ fontWeight: '600', color: '#1e293b' }}>
               {producto.nombre}
             </div>
             {producto.codigoPersonalizado && (
               <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                 {producto.codigoPersonalizado}
               </div>
             )}
           </div>
           <div style={{
             fontSize: '1.25rem',
             fontWeight: '700',
             color: color
           }}>
             {esNegativo ? '-' : esPositivo ? '+' : ''}{producto.cantidad}
           </div>
         </div>
       );
    }
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
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280', margin: 0 }}>Cargando movimientos del día...</p>
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
        maxWidth: '1200px',
        margin: '0 auto',
        paddingTop: isMobile ? '6rem' : '7rem',
        paddingBottom: isMobile ? '1rem' : '2rem',
        paddingLeft: isMobile ? '1rem' : '2rem',
        paddingRight: isMobile ? '1rem' : '2rem'
      }}>
        {/* Header */}
                 <div style={{
           background: 'white',
           borderRadius: '1rem',
           padding: '2rem',
           marginBottom: '2rem',
           boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
           border: '1px solid #e2e8f0',
           opacity: transicionando ? 0.8 : 1,
           transition: 'opacity 0.3s ease'
         }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            gap: '1rem'
          }}>
                         <div>
                               <h1 style={{
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: '0 0 0.5rem 0'
                }}>
                  📊 {modoRango ? 'Movimientos por Rango' : 'Movimientos del Día'}
                </h1>
                                <p style={{
                  color: '#64748b',
                  margin: 0,
                  fontSize: '1rem'
                }}>
                  {transicionando 
                    ? '🔄 Cambiando modo...'
                    : modoRango 
                      ? `Balance acumulado del ${formatearFecha(fechaInicio)} al ${formatearFecha(fechaFin)}`
                      : 'Balance diario de inventario y movimientos'
                  }
                </p>
             </div>
            
                                                               <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              alignItems: 'flex-end'
            }}>
              {/* Primera fila: Botón exportar y toggle día/rango */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center'
              }}>
                {/* Botón de exportar */}
                <button
                  onClick={modoRango ? exportarMovimientosRangoExcel : exportarMovimientosExcel}
                  disabled={!movimientos || transicionando}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: !movimientos || transicionando ? 'not-allowed' : 'pointer',
                    opacity: !movimientos || transicionando ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  📊 Exportar Excel
                </button>

                {/* Toggle entre modo día y modo rango */}
                <div style={{
                  display: 'flex',
                  background: '#f1f5f9',
                  borderRadius: '0.5rem',
                  padding: '0.25rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <button
                    onClick={cambiarModoDia}
                    disabled={transicionando}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem',
                      border: 'none',
                      cursor: transicionando ? 'not-allowed' : 'pointer',
                      background: !modoRango ? 'white' : 'transparent',
                      color: !modoRango ? '#374151' : '#64748b',
                      fontWeight: !modoRango ? '600' : '400',
                      boxShadow: !modoRango ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                      transition: 'all 0.2s ease',
                      opacity: transicionando ? 0.6 : 1
                    }}
                  >
                    📅 Día
                  </button>
                  <button
                    onClick={cambiarModoRango}
                    disabled={transicionando}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem',
                      border: 'none',
                      cursor: transicionando ? 'not-allowed' : 'pointer',
                      background: modoRango ? 'white' : 'transparent',
                      color: modoRango ? '#374151' : '#64748b',
                      fontWeight: modoRango ? '600' : '400',
                      boxShadow: modoRango ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                      transition: 'all 0.2s ease',
                      opacity: transicionando ? 0.6 : 1
                    }}
                  >
                    📊 Rango
                  </button>
                </div>
              </div>

              {/* Segunda fila: Filtros de fecha */}
              {!modoRango ? (
                <input
                  type="date"
                  value={fechaSeleccionada}
                  onChange={(e) => setFechaSeleccionada(e.target.value)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    background: 'white',
                    minWidth: '200px'
                  }}
                />
              ) : (
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center'
                }}>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    style={{
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      background: 'white',
                      minWidth: '150px'
                    }}
                  />
                  <span style={{ color: '#64748b', fontSize: '0.875rem' }}>a</span>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    style={{
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      background: 'white',
                      minWidth: '150px'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

                                   {movimientos && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: isMobile ? '1rem' : '1.5rem',
              opacity: transicionando ? 0.7 : 1,
              transform: transicionando ? 'scale(0.98)' : 'scale(1)',
              transition: 'all 0.3s ease'
            }}>
                         {/* Stock Inicial */}
             <div
               data-card-index="0"
               style={{
                 ...obtenerEstilosCard(0, indiceSeleccionado === 0),
                 position: 'relative'
               }}
               onClick={() => {
                 setIndiceSeleccionado(0);
                 abrirModal('stockInicial');
               }}
               onMouseOver={(e) => {
                 // Solo aplicar hover si no está seleccionada por teclado
                 if (indiceSeleccionado !== 0) {
                   e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                   e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
                   e.currentTarget.style.borderColor = '#3b82f6';
                 }
               }}
               onMouseOut={(e) => {
                 // Solo resetear si no está seleccionada por teclado
                 if (indiceSeleccionado !== 0) {
                   e.currentTarget.style.transform = 'translateY(0) scale(1)';
                   e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                   e.currentTarget.style.borderColor = '#e2e8f0';
                 }
               }}
             >
               {/* Indicador de selección por teclado */}
               <div style={obtenerEstilosIndicador(indiceSeleccionado === 0, 0)} />
               <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 marginBottom: '1.5rem'
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
                   marginRight: '1rem',
                   color: 'white'
                 }}>
                   📦
                 </div>
                 <div>
                   <h3 style={{
                     fontSize: '1.125rem',
                     fontWeight: '600',
                     color: '#1e293b',
                     margin: '0 0 0.5rem 0'
                   }}>
                     Stock Inicial
                   </h3>
                   <p style={{
                     fontSize: '1.5rem',
                     fontWeight: '700',
                     color: '#3b82f6',
                     margin: 0
                   }}>
                     {movimientos.stockInicial.cantidadTotal}
                   </p>
                 </div>
               </div>
               
               {/* Botón de exportación específico para stock inicial */}
               {!modoRango && (
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     exportarStockInicialExcel();
                   }}
                   disabled={!movimientos || transicionando}
                   style={{
                     position: 'absolute',
                     bottom: '1rem',
                     right: '1rem',
                     padding: '0.5rem',
                     background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                     color: 'white',
                     border: 'none',
                     borderRadius: '0.5rem',
                     fontSize: '0.75rem',
                     fontWeight: '600',
                     cursor: !movimientos || transicionando ? 'not-allowed' : 'pointer',
                     opacity: !movimientos || transicionando ? 0.6 : 1,
                     transition: 'all 0.2s ease',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '0.25rem',
                     boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                   }}
                   onMouseOver={(e) => {
                     if (!isMobile && movimientos && !transicionando) {
                       e.currentTarget.style.transform = 'scale(1.05)';
                       e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
                     }
                   }}
                   onMouseOut={(e) => {
                     if (!isMobile) {
                       e.currentTarget.style.transform = 'scale(1)';
                       e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                     }
                   }}
                 >
                   📊 Exportar
                 </button>
               )}
             </div>

             {/* Ingresos */}
             <div
               data-card-index="1"
               style={{
                 ...obtenerEstilosCard(1, indiceSeleccionado === 1),
                 position: 'relative'
               }}
               onClick={() => {
                 setIndiceSeleccionado(1);
                 abrirModal('ingresos');
               }}
               onMouseOver={(e) => {
                 if (indiceSeleccionado !== 1) {
                   e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                   e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
                   e.currentTarget.style.borderColor = '#059669';
                 }
               }}
               onMouseOut={(e) => {
                 if (indiceSeleccionado !== 1) {
                   e.currentTarget.style.transform = 'translateY(0) scale(1)';
                   e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                   e.currentTarget.style.borderColor = '#e2e8f0';
                 }
               }}
             >
               {/* Indicador de selección por teclado */}
               <div style={obtenerEstilosIndicador(indiceSeleccionado === 1, 1)} />
               <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 marginBottom: '1.5rem'
               }}>
                 <div style={{
                   width: '3rem',
                   height: '3rem',
                   background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                   borderRadius: '1rem',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   fontSize: '1.5rem',
                   marginRight: '1rem',
                   color: 'white'
                 }}>
                   📥
                 </div>
                 <div style={{ flex: 1 }}>
                   <h3 style={{
                     fontSize: '1.125rem',
                     fontWeight: '600',
                     color: '#1e293b',
                     margin: '0 0 0.5rem 0'
                   }}>
                     Ingresos
                   </h3>
                   <p style={{
                     fontSize: '1.5rem',
                     fontWeight: '700',
                     color: '#059669',
                     margin: 0
                   }}>
                     +{movimientos.ingresos.cantidadTotal}
                   </p>
                 </div>
               </div>
               
               {/* Botón de exportación específico para ingresos */}
               {!modoRango && (
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     exportarIngresosDiaExcel();
                   }}
                   disabled={!movimientos || transicionando}
                   style={{
                     position: 'absolute',
                     bottom: '1rem',
                     right: '1rem',
                     padding: '0.5rem',
                     background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                     color: 'white',
                     border: 'none',
                     borderRadius: '0.5rem',
                     fontSize: '0.75rem',
                     fontWeight: '600',
                     cursor: !movimientos || transicionando ? 'not-allowed' : 'pointer',
                     opacity: !movimientos || transicionando ? 0.6 : 1,
                     transition: 'all 0.2s ease',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '0.25rem',
                     boxShadow: '0 2px 4px rgba(5, 150, 105, 0.3)'
                   }}
                   onMouseOver={(e) => {
                     if (!isMobile && movimientos && !transicionando) {
                       e.currentTarget.style.transform = 'scale(1.05)';
                       e.currentTarget.style.boxShadow = '0 4px 8px rgba(5, 150, 105, 0.4)';
                     }
                   }}
                   onMouseOut={(e) => {
                     if (!isMobile) {
                       e.currentTarget.style.transform = 'scale(1)';
                       e.currentTarget.style.boxShadow = '0 2px 4px rgba(5, 150, 105, 0.3)';
                     }
                   }}
                 >
                   📊 Exportar
                 </button>
               )}
             </div>

             {/* Retornos y Devoluciones */}
             <div
               data-card-index="2"
               style={{
                 ...obtenerEstilosCard(2, indiceSeleccionado === 2),
                 position: 'relative'
               }}
               onClick={() => {
                 setIndiceSeleccionado(2);
                 abrirModal('devoluciones');
               }}
               onMouseOver={(e) => {
                 if (indiceSeleccionado !== 2) {
                   e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                   e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
                   e.currentTarget.style.borderColor = '#f59e0b';
                 }
               }}
               onMouseOut={(e) => {
                 if (indiceSeleccionado !== 2) {
                   e.currentTarget.style.transform = 'translateY(0) scale(1)';
                   e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                   e.currentTarget.style.borderColor = '#e2e8f0';
                 }
               }}
             >
               {/* Indicador de selección por teclado */}
               <div style={obtenerEstilosIndicador(indiceSeleccionado === 2, 2)} />
               <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 marginBottom: '1.5rem'
               }}>
                 <div style={{
                   width: '3rem',
                   height: '3rem',
                   background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                   borderRadius: '1rem',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   fontSize: '1.5rem',
                   marginRight: '1rem',
                   color: 'white'
                 }}>
                   🔄
                 </div>
                 <div style={{ flex: 1 }}>
                   <h3 style={{
                     fontSize: '1.125rem',
                     fontWeight: '600',
                     color: '#1e293b',
                     margin: '0 0 0.5rem 0'
                   }}>
                     Retornos y Devoluciones
                   </h3>
                   <p style={{
                     fontSize: '1.5rem',
                     fontWeight: '700',
                     color: '#f59e0b',
                     margin: 0
                   }}>
                     +{movimientos.devoluciones.cantidadTotal}
                   </p>
                 </div>
               </div>
               
               {/* Botón de exportación específico para devoluciones */}
               {!modoRango && (
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     exportarDevolucionesDiaExcel();
                   }}
                   disabled={!movimientos || transicionando}
                   style={{
                     position: 'absolute',
                     bottom: '1rem',
                     right: '1rem',
                     padding: '0.5rem',
                     background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                     color: 'white',
                     border: 'none',
                     borderRadius: '0.5rem',
                     fontSize: '0.75rem',
                     fontWeight: '600',
                     cursor: !movimientos || transicionando ? 'not-allowed' : 'pointer',
                     opacity: !movimientos || transicionando ? 0.6 : 1,
                     transition: 'all 0.2s ease',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '0.25rem',
                     boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
                   }}
                   onMouseOver={(e) => {
                     if (!isMobile && movimientos && !transicionando) {
                       e.currentTarget.style.transform = 'scale(1.05)';
                       e.currentTarget.style.boxShadow = '0 4px 8px rgba(245, 158, 11, 0.4)';
                     }
                   }}
                   onMouseOut={(e) => {
                     if (!isMobile) {
                       e.currentTarget.style.transform = 'scale(1)';
                       e.currentTarget.style.boxShadow = '0 2px 4px rgba(245, 158, 11, 0.3)';
                     }
                   }}
                 >
                   📊 Exportar
                 </button>
               )}
             </div>

             {/* Carga de Planillas (Salidas) */}
             <div
               data-card-index="3"
               style={{
                 ...obtenerEstilosCard(3, indiceSeleccionado === 3),
                 position: 'relative'
               }}
               onClick={() => {
                 setIndiceSeleccionado(3);
                 abrirModal('salidas');
               }}
               onMouseOver={(e) => {
                 if (indiceSeleccionado !== 3) {
                   e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                   e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
                   e.currentTarget.style.borderColor = '#ef4444';
                 }
               }}
               onMouseOut={(e) => {
                 if (indiceSeleccionado !== 3) {
                   e.currentTarget.style.transform = 'translateY(0) scale(1)';
                   e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                   e.currentTarget.style.borderColor = '#e2e8f0';
                 }
               }}
             >
               {/* Indicador de selección por teclado */}
               <div style={obtenerEstilosIndicador(indiceSeleccionado === 3, 3)} />
               <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 marginBottom: '1.5rem'
               }}>
                 <div style={{
                   width: '3rem',
                   height: '3rem',
                   background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                   borderRadius: '1rem',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   fontSize: '1.5rem',
                   marginRight: '1rem',
                   color: 'white'
                 }}>
                   📤
                 </div>
                 <div style={{ flex: 1 }}>
                   <h3 style={{
                     fontSize: '1.125rem',
                     fontWeight: '600',
                     color: '#1e293b',
                     margin: '0 0 0.5rem 0'
                   }}>
                     Carga de Planillas
                   </h3>
                   <p style={{
                     fontSize: '1.5rem',
                     fontWeight: '700',
                     color: '#ef4444',
                     margin: 0
                   }}>
                     -{movimientos.salidas.cantidadTotal}
                   </p>
                 </div>
               </div>
               
               {/* Botón de exportación específico para planillas */}
               {!modoRango && (
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     exportarPlanillasDiaExcel();
                   }}
                   disabled={!movimientos || transicionando}
                   style={{
                     position: 'absolute',
                     bottom: '1rem',
                     right: '1rem',
                     padding: '0.5rem',
                     background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                     color: 'white',
                     border: 'none',
                     borderRadius: '0.5rem',
                     fontSize: '0.75rem',
                     fontWeight: '600',
                     cursor: !movimientos || transicionando ? 'not-allowed' : 'pointer',
                     opacity: !movimientos || transicionando ? 0.6 : 1,
                     transition: 'all 0.2s ease',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '0.25rem',
                     boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                   }}
                   onMouseOver={(e) => {
                     if (!isMobile && movimientos && !transicionando) {
                       e.currentTarget.style.transform = 'scale(1.05)';
                       e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.4)';
                     }
                   }}
                   onMouseOut={(e) => {
                     if (!isMobile) {
                       e.currentTarget.style.transform = 'scale(1)';
                       e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
                     }
                   }}
                 >
                   📊 Exportar
                 </button>
               )}
             </div>

             {/* Roturas y Pérdidas */}
             <div
               data-card-index="4"
               style={obtenerEstilosCard(4, indiceSeleccionado === 4)}
               onClick={() => {
                 setIndiceSeleccionado(4);
                 abrirModal('roturas');
               }}
               onMouseOver={(e) => {
                 if (indiceSeleccionado !== 4) {
                   e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                   e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
                   e.currentTarget.style.borderColor = '#7c3aed';
                 }
               }}
               onMouseOut={(e) => {
                 if (indiceSeleccionado !== 4) {
                   e.currentTarget.style.transform = 'translateY(0) scale(1)';
                   e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                   e.currentTarget.style.borderColor = '#e2e8f0';
                 }
               }}
             >
               {/* Indicador de selección por teclado */}
               <div style={obtenerEstilosIndicador(indiceSeleccionado === 4, 4)} />
               <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 marginBottom: '1.5rem'
               }}>
                 <div style={{
                   width: '3rem',
                   height: '3rem',
                   background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                   borderRadius: '1rem',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   fontSize: '1.5rem',
                   marginRight: '1rem',
                   color: 'white'
                 }}>
                   💔
                 </div>
                 <div>
                   <h3 style={{
                     fontSize: '1.125rem',
                     fontWeight: '600',
                     color: '#1e293b',
                     margin: '0 0 0.5rem 0'
                   }}>
                     Roturas y Pérdidas
                   </h3>
                   <p style={{
                     fontSize: '1.5rem',
                     fontWeight: '700',
                     color: '#7c3aed',
                     margin: 0
                   }}>
                     -{movimientos.roturas.cantidadTotal}
                   </p>
                 </div>
               </div>
             </div>

             {/* Balance Final */}
             <div
               data-card-index="5"
               style={obtenerEstilosCard(5, indiceSeleccionado === 5)}
               onClick={() => {
                 setIndiceSeleccionado(5);
                 abrirModal('balanceFinal');
               }}
               onMouseOver={(e) => {
                 if (indiceSeleccionado !== 5) {
                   e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                   e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
                   e.currentTarget.style.borderColor = '#8b5cf6';
                 }
               }}
               onMouseOut={(e) => {
                 if (indiceSeleccionado !== 5) {
                   e.currentTarget.style.transform = 'translateY(0) scale(1)';
                   e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                   e.currentTarget.style.borderColor = '#e2e8f0';
                 }
               }}
             >
               {/* Indicador de selección por teclado */}
               <div style={obtenerEstilosIndicador(indiceSeleccionado === 5, 5)} />
               <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 marginBottom: '1.5rem'
               }}>
                 <div style={{
                   width: '3rem',
                   height: '3rem',
                   background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                   borderRadius: '1rem',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   fontSize: '1.5rem',
                   marginRight: '1rem',
                   color: 'white'
                 }}>
                   ⚖️
                 </div>
                 <div>
                   <h3 style={{
                     fontSize: '1.125rem',
                     fontWeight: '600',
                     color: '#1e293b',
                     margin: '0 0 0.5rem 0'
                   }}>
                     Balance Final
                     {movimientos.balanceFinal.productos.some((p: any) => p.tipoVariacion && p.tipoVariacion !== 'SIN_CAMBIOS') && (
                       <span style={{
                         fontSize: '0.875rem',
                         marginLeft: '0.5rem',
                         padding: '0.25rem 0.5rem',
                         borderRadius: '0.25rem',
                         background: '#fef3c7',
                         color: '#92400e',
                         fontWeight: '500'
                       }}>
                         {movimientos.balanceFinal.productos.filter((p: any) => p.tipoVariacion === 'INCREMENTO').length} 📈
                         {' '}
                         {movimientos.balanceFinal.productos.filter((p: any) => p.tipoVariacion === 'DECREMENTO').length} 📉
                       </span>
                     )}
                   </h3>
                   <p style={{
                     fontSize: '1.5rem',
                     fontWeight: '700',
                     color: '#8b5cf6',
                     margin: 0
                   }}>
                     {calcularBalanceFinal()}
                   </p>
                 </div>
               </div>
             </div>
          </div>
        )}

        {!movimientos && !cargando && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>
              📊
            </div>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              No hay movimientos para esta fecha
            </h3>
            <p style={{
              fontSize: '1rem',
              color: '#64748b'
            }}>
              Selecciona otra fecha o crea movimientos para el día seleccionado
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalAbierto && (
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
        }}
        onClick={cerrarModal}
        >
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  background: `linear-gradient(135deg, ${obtenerColorModal(modalAbierto)} 0%, ${obtenerColorModal(modalAbierto)}dd 100%)`,
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  color: 'white'
                }}>
                  {obtenerIconoModal(modalAbierto)}
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#1e293b',
                    margin: 0
                  }}>
                    {obtenerTituloModal(modalAbierto)}
                  </h2>
                  <p style={{
                    color: '#64748b',
                    margin: '0.25rem 0 0 0',
                    fontSize: '1rem'
                  }}>
                    Detalle de productos
                  </p>
                </div>
              </div>
              
              {/* Buscador solo para Stock Inicial y Balance Final */}
              {(modalAbierto === 'stockInicial' || modalAbierto === 'balanceFinal') && (
                <div style={{
                  marginTop: '1rem',
                  position: 'relative'
                }}>
                  <input
                    type="text"
                    placeholder="Buscar por nombre o código..."
                    value={filtroBusqueda}
                    onChange={(e) => setFiltroBusqueda(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.5rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      background: '#f8fafc',
                      color: '#1e293b',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = obtenerColorModal(modalAbierto);
                      e.target.style.background = 'white';
                      e.target.style.boxShadow = `0 0 0 3px ${obtenerColorModal(modalAbierto)}20`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.background = '#f8fafc';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    fontSize: '1rem'
                  }}>
                    🔍
                  </div>
                  {filtroBusqueda && (
                    <button
                      onClick={() => setFiltroBusqueda('')}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f1f5f9';
                        e.currentTarget.style.color = '#ef4444';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'none';
                        e.currentTarget.style.color = '#64748b';
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
              <button
                onClick={cerrarModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                ✕
              </button>
            </div>

            {/* Contenido del Modal */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              paddingRight: '0.5rem'
            }}>
              {/* Indicador de resultados filtrados */}
              {(modalAbierto === 'stockInicial' || modalAbierto === 'balanceFinal') && filtroBusqueda.trim() && (
                <div style={{
                  padding: '0.5rem 0',
                  marginBottom: '0.5rem',
                  borderBottom: '1px solid #e2e8f0',
                  fontSize: '0.875rem',
                  color: '#64748b'
                }}>
                  {obtenerProductosModal(modalAbierto).length > 0 ? (
                    <span>
                      {obtenerProductosModal(modalAbierto).length} producto{obtenerProductosModal(modalAbierto).length !== 1 ? 's' : ''} encontrado{obtenerProductosModal(modalAbierto).length !== 1 ? 's' : ''} para "{filtroBusqueda}"
                    </span>
                  ) : (
                    <span style={{ color: '#ef4444' }}>
                      No se encontraron productos para "{filtroBusqueda}"
                    </span>
                  )}
                </div>
              )}
              
              {obtenerProductosModal(modalAbierto).length > 0 ? (
                obtenerProductosModal(modalAbierto).map(producto => 
                  renderizarProducto(producto, modalAbierto)
                )
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#64748b'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    {filtroBusqueda.trim() ? '🔍' : '📭'}
                  </div>
                  <p style={{ margin: 0, fontSize: '1.125rem' }}>
                    {filtroBusqueda.trim() 
                      ? `No se encontraron productos para "${filtroBusqueda}"`
                      : 'No hay productos en esta sección'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
