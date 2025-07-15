import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import BarcodeScanner from '../../components/BarcodeScanner';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import ApiService from '../../services/api';
import inventarioService, { type HistorialInventario, type EstadisticasInventario as EstadisticasInventarioAPI } from '../../services/inventarioService';
import type { Producto } from '../../types';

interface ProductoInventario {
  id: number;
  codigo: string;
  nombre: string;
  stockReal: number;
  stockEscaneado: number;
  diferencia: number;
  precio: number;
  categoria: string;
  marca: string;
}

interface Inventario {
  id: number;
  fecha: string;
  totalProductos: number;
  productosConDiferencias: number;
  valorTotalDiferencias: number;
  porcentajePrecision: number;
  estado: 'EN_PROGRESO' | 'COMPLETADO';
  productos: ProductoInventario[];
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
  const navigate = useNavigate();
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  
  // Estados principales
  const [inventarioActual, setInventarioActual] = useState<Inventario | null>(null);
  const [productosEscaneados, setProductosEscaneados] = useState<Map<string, ProductoInventario>>(new Map());
  const [estadisticas, setEstadisticas] = useState<EstadisticasInventario | null>(null);
  const [historialInventarios, setHistorialInventarios] = useState<Inventario[]>([]);
  
  // Estados de UI
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [mostrarScannerUSB, setMostrarScannerUSB] = useState(false);
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
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
  
  // Estados para el modal de detalles de operación
  const [operacionSeleccionada, setOperacionSeleccionada] = useState<HistorialInventario | null>(null);
  const [mostrarDetalleOperacion, setMostrarDetalleOperacion] = useState(false);

  useEffect(() => {
    cargarHistorialInventarios();
    cargarEstadisticasOperaciones();
  }, []);

  const cargarHistorialInventarios = async () => {
    try {
      // TODO: Implementar API para cargar historial de inventarios
      // const response = await ApiService.obtenerHistorialInventarios(datosUsuario!.empresaId);
      // setHistorialInventarios(response.data || []);
    } catch (error) {
      console.error('Error al cargar historial de inventarios:', error);
    }
  };

  const cargarEstadisticasOperaciones = async () => {
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
      fecha: new Date().toISOString(),
      totalProductos: 0,
      productosConDiferencias: 0,
      valorTotalDiferencias: 0,
      porcentajePrecision: 0,
      estado: 'EN_PROGRESO',
      productos: []
    };
    
    setInventarioActual(nuevoInventario);
    setProductosEscaneados(new Map());
    setModoEscaneo('ESCANEANDO');
    setMostrarScanner(true);
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
        codigo: producto.codigoBarras || producto.codigoPersonalizado || codigo,
        nombre: producto.nombre,
        stockReal: producto.stock,
        stockEscaneado: 1, // Por defecto 1, se puede editar
        diferencia: 0,
        precio: producto.precio,
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

    const productoActualizado: ProductoInventario = {
      ...productoSeleccionado,
      stockEscaneado: cantidadEscaneada,
      diferencia: cantidadEscaneada - productoSeleccionado.stockReal
    };

    // Actualizar el mapa de productos escaneados
    const nuevosProductosEscaneados = new Map(productosEscaneados);
    nuevosProductosEscaneados.set(productoSeleccionado.codigo, productoActualizado);
    setProductosEscaneados(nuevosProductosEscaneados);

    // Cerrar modal y continuar escaneando
    setMostrarModalProducto(false);
    setProductoSeleccionado(null);
    setMostrarScanner(true);
    
    toast.success(`Producto ${productoSeleccionado.nombre} registrado con cantidad: ${cantidadEscaneada}`);
  };

  const finalizarInventario = () => {
    if (productosEscaneados.size === 0) {
      toast.error('No se han escaneado productos para finalizar el inventario');
      return;
    }

    // Calcular estadísticas
    const productos = Array.from(productosEscaneados.values());
    const totalProductos = productos.length;
    const productosConDiferencias = productos.filter(p => p.diferencia !== 0).length;
    const valorTotalDiferencias = productos.reduce((total, p) => {
      const valorDiferencia = Math.abs(p.diferencia) * p.precio;
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

  const guardarInventario = async () => {
    if (!inventarioActual || !estadisticas) return;

    try {
      setCargando(true);
      
      const inventarioCompletado: Inventario = {
        ...inventarioActual,
        estado: 'COMPLETADO',
        totalProductos: estadisticas.totalProductos,
        productosConDiferencias: estadisticas.productosConDiferencias,
        valorTotalDiferencias: estadisticas.valorTotalDiferencias,
        porcentajePrecision: estadisticas.porcentajePrecision,
        productos: Array.from(productosEscaneados.values())
      };

      // TODO: Implementar API para guardar inventario
      // await ApiService.guardarInventario(datosUsuario!.empresaId, inventarioCompletado);
      
      // Registrar operaciones de inventario para cada producto con diferencias
      console.log('📊 Registrando operaciones de inventario...');
      for (const producto of inventarioCompletado.productos) {
        if (producto.diferencia !== 0) {
          const tipoOperacion = producto.diferencia > 0 ? 'INCREMENTO' : 'DECREMENTO';
          const cantidad = Math.abs(producto.diferencia);
          const stockNuevo = producto.stockReal + producto.diferencia;
          
          await registrarOperacionInventario(
            producto.id,
            tipoOperacion,
            cantidad,
            producto.stockReal,
            stockNuevo,
            producto.codigo,
            `Ajuste por inventario físico. Stock real: ${producto.stockEscaneado}, Stock sistema: ${producto.stockReal}`
          );
          
          // Actualizar el stock del producto en el sistema
          try {
            await ApiService.actualizarStock(datosUsuario!.empresaId, producto.id, stockNuevo);
            console.log(`✅ Stock actualizado para producto ${producto.nombre}: ${producto.stockReal} → ${stockNuevo}`);
          } catch (error) {
            console.error(`❌ Error al actualizar stock del producto ${producto.nombre}:`, error);
          }
        }
      }
      
      toast.success('Inventario guardado exitosamente');
      
      // Actualizar historial
      setHistorialInventarios(prev => [inventarioCompletado, ...prev]);
      
      // Resetear estados
      setInventarioActual(null);
      setProductosEscaneados(new Map());
      setEstadisticas(null);
      setModoEscaneo('INICIAR');
      setMostrarResumen(false);
      
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
      const request = {
        productoId,
        tipoOperacion,
        cantidad,
        stockAnterior,
        stockNuevo,
        codigoBarras,
        observacion,
        metodoEntrada: 'inventario_fisico'
      };

      const response = await inventarioService.registrarOperacion(request);
      if (response.success) {
        console.log('✅ Operación registrada en historial:', response.data);
        // Recargar estadísticas después de un breve delay
        setTimeout(async () => {
          console.log('🔄 Recargando estadísticas después de registrar operación...');
          await cargarEstadisticasOperaciones();
        }, 1000);
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
    return new Date(fecha).toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const verDetalleInventario = (inventario: Inventario) => {
    setInventarioDetalle(inventario);
    setMostrarDetalleInventario(true);
  };

  const generarReportePDF = (inventario: Inventario) => {
    // TODO: Implementar generación de PDF
    toast.success('Función de descarga de PDF en desarrollo');
  };

  const imprimirReporte = (inventario: Inventario) => {
    // TODO: Implementar impresión
    toast.success('Función de impresión en desarrollo');
  };

  const verDetalleOperacion = (operacion: HistorialInventario) => {
    setOperacionSeleccionada(operacion);
    setMostrarDetalleOperacion(true);
  };

  return (
    <div className="h-pantalla-minimo pagina-con-navbar" style={{ backgroundColor: 'var(--color-fondo)' }}>
      {/* Navegación */}
      <NavbarAdmin 
        onCerrarSesion={cerrarSesionConToast}
        empresaNombre={datosUsuario?.empresaNombre}
        nombreAdministrador={datosUsuario?.nombre}
      />

      {/* Contenido principal */}
      <div className="contenedor" style={{ paddingTop: '5rem', paddingBottom: '2rem' }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="titulo-2 mb-4" style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: '#1e293b',
            letterSpacing: '-0.025em',
            lineHeight: '1.2'
          }}>
            🔍 Control de Inventario
          </h1>
          <p className="texto-gris" style={{ 
            fontSize: '16px', 
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
            marginTop: '16px'
          }}></div>
        </div>

        {/* Estado del inventario */}
        {modoEscaneo === 'INICIAR' && (
          <div className="tarjeta mb-6" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <div className="text-center">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
              <h3 className="titulo-3 mb-4" style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '16px'
              }}>
                Iniciar Control de Inventario
              </h3>
              <p className="texto-gris mb-6" style={{ 
                fontSize: '16px', 
                color: '#64748b',
                marginBottom: '24px',
                maxWidth: '600px',
                margin: '0 auto 24px'
              }}>
                Escanea todos los productos de tu inventario para realizar un conteo físico 
                y comparar con el stock registrado en el sistema.
              </p>
              
              <div className="flex gap-4 justify-center" style={{ gap: '1rem', justifyContent: 'center' }}>
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
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
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
                    iniciarInventario();
                  }}
                  className="boton boton-secundario"
                  style={{
                    background: 'white',
                    color: '#dc2626',
                    border: '2px solid #dc2626',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
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

        {/* Progreso del escaneo */}
        {modoEscaneo === 'ESCANEANDO' && (
          <div className="tarjeta mb-6" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="titulo-3" style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '0'
              }}>
                🔍 Escaneando Productos
              </h3>
              <div className="flex gap-2">
                <span className="texto-pequeno texto-gris">
                  Productos escaneados: {productosEscaneados.size}
                </span>
                <button
                  onClick={finalizarInventario}
                  className="boton boton-primario"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  ✅ Finalizar
                </button>
              </div>
            </div>
            
            {/* Lista de productos escaneados */}
            {productosEscaneados.size > 0 && (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <div className="grid grid-1 gap-2" style={{ gap: '8px' }}>
                  {Array.from(productosEscaneados.values()).map((producto) => (
                    <div key={producto.codigo} style={{
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
                          {producto.nombre}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          Código: {producto.codigo}
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
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <h3 className="titulo-3 mb-4" style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '16px'
            }}>
              📊 Resumen del Inventario
            </h3>
            
            {/* Estadísticas principales */}
            <div className="grid grid-4 mb-6" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📦</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6' }}>
                  {estadisticas.totalProductos}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Total Productos</div>
              </div>
              
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>
                  {estadisticas.productosConDiferencias}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Con Diferencias</div>
              </div>
              
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>💰</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#dc2626' }}>
                  {formatearMoneda(estadisticas.valorTotalDiferencias)}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Valor Diferencias</div>
              </div>
              
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📈</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                  {estadisticas.porcentajePrecision.toFixed(1)}%
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Precisión</div>
              </div>
            </div>

            {/* Productos con diferencias */}
            {(estadisticas.productosPerdidos.length > 0 || estadisticas.productosSobrantes.length > 0) && (
              <div className="mb-6">
                <h4 className="titulo-4 mb-3" style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '12px'
                }}>
                  Productos con Diferencias
                </h4>
                
                <div className="grid grid-2" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '16px'
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
                          <div key={producto.codigo} style={{
                            background: 'white',
                            padding: '8px',
                            borderRadius: '6px',
                            marginBottom: '6px',
                            border: '1px solid #fecaca'
                          }}>
                            <div style={{ fontWeight: '600', fontSize: '14px' }}>
                              {producto.nombre}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              Faltan: {Math.abs(producto.diferencia)} unidades | 
                              Valor: {formatearMoneda(Math.abs(producto.diferencia) * producto.precio)}
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
                          <div key={producto.codigo} style={{
                            background: 'white',
                            padding: '8px',
                            borderRadius: '6px',
                            marginBottom: '6px',
                            border: '1px solid #bbf7d0'
                          }}>
                            <div style={{ fontWeight: '600', fontSize: '14px' }}>
                              {producto.nombre}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              Sobran: {producto.diferencia} unidades | 
                              Valor: {formatearMoneda(producto.diferencia * producto.precio)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-4 justify-center" style={{ gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={guardarInventario}
                disabled={cargando}
                className="boton boton-primario"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: cargando ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: cargando ? 0.7 : 1
                }}
              >
                {cargando ? '💾 Guardando...' : '💾 Guardar Inventario'}
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
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                🔄 Nuevo Inventario
              </button>
            </div>
          </div>
        )}

        {/* Historial de inventarios */}
        {historialInventarios.length > 0 && (
          <div className="tarjeta" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <h3 className="titulo-3 mb-4" style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '16px'
            }}>
              📋 Historial de Inventarios
            </h3>
            
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
                e.currentTarget.style.borderColor = '#3b82f6';
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
                      Inventario del {formatearFecha(inventario.fecha)}
                    </div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                      {inventario.totalProductos} productos | 
                      {inventario.productosConDiferencias} con diferencias | 
                      Precisión: {inventario.porcentajePrecision.toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600', color: '#dc2626' }}>
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
                  color: '#3b82f6',
                  fontWeight: '500'
                }}>
                  👆 Haz clic para ver detalles
                </div>
              </div>
            ))}
            </div>
          </div>
        )}

        {/* Historial de Operaciones de Inventario */}
        <div className="tarjeta mb-6" style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="titulo-3" style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '0'
            }}>
              📊 Historial de Operaciones
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={cargarEstadisticasOperaciones}
                className="boton boton-secundario"
                style={{
                  background: 'white',
                  color: '#10b981',
                  border: '2px solid #10b981',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                🔄 Recargar
              </button>
              <button
                onClick={() => {
                  setMostrarHistorialOperaciones(!mostrarHistorialOperaciones);
                  if (!mostrarHistorialOperaciones) {
                    cargarHistorialOperaciones();
                  }
                }}
                className="boton boton-secundario"
                style={{
                  background: 'white',
                  color: '#3b82f6',
                  border: '2px solid #3b82f6',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {mostrarHistorialOperaciones ? '👁️ Ocultar' : '👁️ Ver Historial'}
              </button>
              <button
                onClick={async () => {
                  try {
                    console.log('🧪 Creando operación de prueba...');
                    await registrarOperacionInventario(
                      1, // ID de producto de prueba
                      'INCREMENTO',
                      5,
                      10,
                      15,
                      'TEST123',
                      'Operación de prueba para verificar el sistema'
                    );
                    toast.success('Operación de prueba creada exitosamente');
                    // Recargar estadísticas y historial
                    setTimeout(() => {
                      cargarEstadisticasOperaciones();
                      if (mostrarHistorialOperaciones) {
                        cargarHistorialOperaciones();
                      }
                    }, 1000);
                  } catch (error) {
                    console.error('Error al crear operación de prueba:', error);
                    toast.error('Error al crear operación de prueba');
                  }
                }}
                className="boton boton-secundario"
                style={{
                  background: 'white',
                  color: '#f59e0b',
                  border: '2px solid #f59e0b',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                🧪 Crear Prueba
              </button>
              
              <button
                onClick={async () => {
                  try {
                    const debugInfo = await ApiService.debugInventario();
                    console.log('🔍 Debug info:', debugInfo);
                    toast.success('Debug info obtenida. Revisa la consola.');
                  } catch (error) {
                    console.error('Error al obtener debug info:', error);
                    toast.error('Error al obtener debug info');
                  }
                }}
                className="boton boton-secundario"
                style={{
                  background: 'white',
                  color: '#3b82f6',
                  border: '2px solid #3b82f6',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                🔍 Debug
              </button>
              
              <button
                onClick={async () => {
                  try {
                    const resultado = await ApiService.crearOperacionesPrueba();
                    console.log('✅ Operaciones de prueba creadas:', resultado);
                    toast.success('Operaciones de prueba creadas');
                    setTimeout(() => {
                      cargarEstadisticasOperaciones();
                      if (mostrarHistorialOperaciones) {
                        cargarHistorialOperaciones();
                      }
                    }, 1000);
                  } catch (error) {
                    console.error('Error al crear operaciones de prueba:', error);
                    toast.error('Error al crear operaciones de prueba');
                  }
                }}
                className="boton boton-secundario"
                style={{
                  background: 'white',
                  color: '#10b981',
                  border: '2px solid #10b981',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                🚀 Crear Múltiples Pruebas
              </button>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          {estadisticasOperaciones && (
            <div className="grid grid-4 mb-4" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
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
          )}

          {/* Lista de operaciones */}
          {mostrarHistorialOperaciones && (
            <div>
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
                          {operacion.observacion && (
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                              📝 {operacion.observacion}
                            </div>
                          )}
                          <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '8px', fontWeight: '500' }}>
                            👆 Haz clic para ver detalles completos
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '14px', color: '#64748b' }}>
                            Stock: {operacion.stockAnterior} → {operacion.stockNuevo}
                          </div>
                          {operacion.valorTotal > 0 && (
                            <div style={{ fontWeight: '600', color: '#1e293b' }}>
                              {formatearMoneda(operacion.valorTotal)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                  <p className="texto-gris">No hay operaciones registradas aún.</p>
                  <p className="texto-pequeno texto-gris">Las operaciones de inventario aparecerán aquí automáticamente.</p>
                </div>
              )}

              {/* Paginación */}
              {totalPaginasHistorial > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => cargarHistorialOperaciones(paginaHistorial - 1)}
                    disabled={paginaHistorial === 0}
                    className="boton boton-secundario"
                    style={{
                      padding: '8px 12px',
                      fontSize: '14px',
                      opacity: paginaHistorial === 0 ? 0.5 : 1
                    }}
                  >
                    ← Anterior
                  </button>
                  <span style={{ 
                    padding: '8px 12px', 
                    fontSize: '14px', 
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    Página {paginaHistorial + 1} de {totalPaginasHistorial}
                  </span>
                  <button
                    onClick={() => cargarHistorialOperaciones(paginaHistorial + 1)}
                    disabled={paginaHistorial >= totalPaginasHistorial - 1}
                    className="boton boton-secundario"
                    style={{
                      padding: '8px 12px',
                      fontSize: '14px',
                      opacity: paginaHistorial >= totalPaginasHistorial - 1 ? 0.5 : 1
                    }}
                  >
                    Siguiente →
                  </button>
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
        onClose={() => setMostrarScanner(false)}
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
                onClick={() => setMostrarScannerUSB(false)}
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
                onClick={() => setMostrarScannerUSB(false)}
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
                📦 {productoSeleccionado.nombre}
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
                  value={cantidadEscaneada}
                  onChange={(e) => setCantidadEscaneada(parseInt(e.target.value) || 0)}
                  min="0"
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
                  Código: {productoSeleccionado.codigo}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>
                  Precio: {formatearMoneda(productoSeleccionado.precio)}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3" style={{ gap: '12px' }}>
              <button
                onClick={confirmarCantidad}
                className="boton boton-primario"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
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
                ✅ Confirmar y Continuar
              </button>
              
              <button
                onClick={() => setMostrarModalProducto(false)}
                className="boton boton-secundario"
                style={{
                  background: 'white',
                  color: '#6b7280',
                  border: '2px solid #6b7280',
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
                  {formatearFecha(inventarioDetalle.fecha)}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => generarReportePDF(inventarioDetalle)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Descargar PDF"
                >
                  📄 PDF
                </button>
                <button
                  onClick={() => imprimirReporte(inventarioDetalle)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Imprimir"
                >
                  🖨️ Imprimir
                </button>
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
              {inventarioDetalle.productos.length > 0 && (
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
                      Todos ({inventarioDetalle.productos.length})
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
                      Faltantes ({inventarioDetalle.productos.filter(p => p.diferencia < 0).length})
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
                      Sobrantes ({inventarioDetalle.productos.filter(p => p.diferencia > 0).length})
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
                         {inventarioDetalle.productos
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
                                <div style={{ fontWeight: '600' }}>{producto.nombre}</div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                  {producto.categoria} • {producto.marca}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
                              {producto.codigo}
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
                                color: producto.diferencia !== 0 ? '#dc2626' : '#64748b'
                              }}>
                                {formatearMoneda(Math.abs(producto.diferencia) * producto.precio)}
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
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#dc2626' }}>
                      {operacionSeleccionada.stockAnterior}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                      Stock Nuevo
                    </p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#059669' }}>
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
    </div>
  );
};

export default ControlInventario; 