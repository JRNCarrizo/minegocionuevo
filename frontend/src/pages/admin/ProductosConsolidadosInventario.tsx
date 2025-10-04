import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { API_CONFIG } from '../../config/api';

interface ProductoConsolidado {
  productoId: number;
  nombreProducto: string;
  codigoProducto?: string;
  stockSistema: number;
  cantidadConteo1: number;
  cantidadConteo2: number;
  formulaCalculo1?: string;
  formulaCalculo2?: string;
  diferenciaSistema?: number;
  diferenciaEntreConteos?: number;
  sectores: SectorInfo[];
  fueContado?: boolean;
  accionRecomendada?: string;
  cantidadFinal?: number;
}

interface SectorInfo {
  sectorId: number;
  nombreSector: string;
  cantidadConteo1: number;
  cantidadConteo2: number;
  formulaCalculo1?: string;
  formulaCalculo2?: string;
}

const ProductosConsolidadosInventario: React.FC = () => {
  const { empresaId, inventarioId } = useParams<{ empresaId: string; inventarioId: string }>();
  const navigate = useNavigate();
  const { datosUsuario } = useUsuarioActual();
  
  const [productos, setProductos] = useState<ProductoConsolidado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<number | null>(null);
  const [cantidadEditada, setCantidadEditada] = useState<number>(0);
  const [actualizandoStock, setActualizandoStock] = useState(false);
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [registroGenerado, setRegistroGenerado] = useState<any>(null);
  
  // Estados para manejo de productos no contados
  const [accionesProductosNoContados, setAccionesProductosNoContados] = useState<{[key: number]: string}>({});
  
  // Estados para navegación por teclado
  const [modoNavegacion, setModoNavegacion] = useState(false);
  const [elementoSeleccionado, setElementoSeleccionado] = useState(0);

  useEffect(() => {
    if (datosUsuario && inventarioId) {
      cargarProductosConsolidados();
    }
  }, [datosUsuario, inventarioId]);

  // Manejo de teclas para navegación
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          if (modoNavegacion) {
            setModoNavegacion(false);
            setElementoSeleccionado(0);
          } else {
            navigate('/admin/inventario-completo');
          }
          break;

        case 'ArrowUp':
        case 'ArrowDown':
          if (!modoNavegacion) {
            setModoNavegacion(true);
          }
          
          event.preventDefault();
          if (event.key === 'ArrowUp') {
            setElementoSeleccionado(prev => Math.max(0, prev - 1));
          } else {
            setElementoSeleccionado(prev => Math.min(productos.length - 1, prev + 1));
          }
          break;

        case 'Enter':
          event.preventDefault();
          if (modoNavegacion && productos[elementoSeleccionado]) {
            // Simular click en el producto seleccionado
            const elemento = document.getElementById(`producto-${productos[elementoSeleccionado].productoId}`);
            if (elemento) {
              elemento.click();
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [modoNavegacion, elementoSeleccionado, productos, navigate]);

  const cargarProductosConsolidados = async () => {
    try {
      setCargando(true);
      
      if (!datosUsuario?.empresaId || !inventarioId) {
        toast.error('No se pudo obtener la información del inventario');
        return;
      }

      const token = localStorage.getItem('token');
      const baseUrl = API_CONFIG.getBaseUrl();
      const response = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/${inventarioId}/productos-consolidados`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Datos recibidos del backend:', data);
        console.log('📊 Productos consolidados:', data.productosConsolidados);
        
        const productosData = data.productosConsolidados || [];
        setProductos(productosData);
        
        // Inicializar acciones para productos no contados
        const accionesIniciales: {[key: number]: string} = {};
        productosData.forEach((producto: ProductoConsolidado) => {
          if (producto.fueContado === false) {
            accionesIniciales[producto.productoId] = producto.accionRecomendada || 'OMITIR';
          }
        });
        setAccionesProductosNoContados(accionesIniciales);
        
        console.log('📊 Acciones inicializadas para productos no contados:', accionesIniciales);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al cargar los productos consolidados');
      }
    } catch (error) {
      console.error('Error cargando productos consolidados:', error);
      toast.error('Error al cargar los productos consolidados');
    } finally {
      setCargando(false);
    }
  };

  const editarProducto = (producto: ProductoConsolidado) => {
    setEditando(producto.productoId);
    setCantidadEditada(Math.max(producto.cantidadConteo1 || 0, producto.cantidadConteo2 || 0));
  };

  const guardarEdicion = () => {
    if (editando) {
      setProductos(prev => prev.map(p => {
        if (p.productoId === editando) {
          // Actualizar ambos conteos con la misma cantidad final
          const cantidadFinal = cantidadEditada;
          return { 
            ...p, 
            cantidadConteo1: cantidadFinal,
            cantidadConteo2: cantidadFinal
          };
        }
        return p;
      }));
      setEditando(null);
      setCantidadEditada(0);
      toast.success('Cantidad final actualizada');
    }
  };

  const cambiarAccionProductoNoContado = (productoId: number, accion: string) => {
    setAccionesProductosNoContados(prev => ({
      ...prev,
      [productoId]: accion
    }));
    
    // Actualizar la cantidad final según la acción
    setProductos(prev => prev.map(p => {
      if (p.productoId === productoId && p.fueContado === false) {
        const cantidadFinal = accion === 'DAR_POR_0' ? 0 : p.stockSistema;
        return {
          ...p,
          cantidadFinal: cantidadFinal
        };
      }
      return p;
    }));
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setCantidadEditada(0);
  };

  const actualizarStock = async () => {
    try {
      setActualizandoStock(true);
      
      if (!datosUsuario?.empresaId || !inventarioId) {
        toast.error('No se pudo obtener la información del inventario');
        return;
      }

      // Preparar los productos editados para enviar al backend
      const productosEditados = productos.map(producto => ({
        productoId: producto.productoId,
        cantidadFinal: producto.cantidadFinal || Math.max(producto.cantidadConteo1 || 0, producto.cantidadConteo2 || 0),
        observaciones: `Inventario completo - ${new Date().toLocaleDateString()}`,
        fueContado: producto.fueContado,
        accionSeleccionada: accionesProductosNoContados[producto.productoId] || producto.accionRecomendada
      }));

      const token = localStorage.getItem('token');
      const baseUrl = API_CONFIG.getBaseUrl();
      
      const response = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/${inventarioId}/actualizar-stock-y-generar-registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productosEditados,
          observaciones: `Registro generado por ${datosUsuario.nombreCompleto} el ${new Date().toLocaleDateString()}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Mostrar el registro generado
        mostrarRegistroGenerado(data);
        
        toast.success('Stock actualizado y registro generado exitosamente');
        
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al actualizar el stock');
      }
    } catch (error) {
      console.error('Error actualizando stock:', error);
      toast.error('Error al actualizar el stock');
    } finally {
      setActualizandoStock(false);
    }
  };

  const calcularDiferenciaSistema = (producto: ProductoConsolidado) => {
    const cantidadFinal = Math.max(producto.cantidadConteo1 || 0, producto.cantidadConteo2 || 0);
    return cantidadFinal - producto.stockSistema;
  };

  const calcularDiferenciaEntreConteos = (producto: ProductoConsolidado) => {
    return Math.abs((producto.cantidadConteo1 || 0) - (producto.cantidadConteo2 || 0));
  };

  const mostrarRegistroGenerado = (data: any) => {
    setRegistroGenerado(data);
    setMostrarRegistro(true);
  };

  const cerrarRegistro = () => {
    setMostrarRegistro(false);
    setRegistroGenerado(null);
    // Redirigir al inicio del inventario completo cuando se cierre el modal
    navigate('/admin/inventario-completo');
  };

  if (cargando) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#64748b'
      }}>
        Cargando productos consolidados...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '2rem'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1e293b'
          }}>
            📊 Revisión Final - Productos Consolidados - Inventario #{inventarioId}
          </h1>
          
        </div>

        <div style={{
          display: 'flex',
          gap: '2rem',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '1.1rem',
            color: '#64748b'
          }}>
            Total de productos: <strong style={{ color: '#1e293b' }}>{productos.length}</strong>
          </div>
          
          <button
            onClick={actualizarStock}
            disabled={actualizandoStock}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: actualizandoStock ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: actualizandoStock ? 0.7 : 1
            }}
          >
            {actualizandoStock ? 'Actualizando...' : '🔄 Actualizar Stock del Sistema'}
          </button>
        </div>
      </div>

      {/* Lista de productos */}
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {productos.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '1.1rem'
          }}>
            No hay productos consolidados disponibles
          </div>
        ) : (
          <>
            {/* Header de la tabla */}
            <div style={{
              background: '#f8fafc',
              padding: '1rem 2rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
              gap: '1rem',
              fontWeight: '600',
              color: '#374151',
              fontSize: '0.9rem'
            }}>
              <div>Producto</div>
              <div style={{ textAlign: 'center' }}>Stock Sistema</div>
              <div style={{ textAlign: 'center' }}>Cantidad Final</div>
              <div style={{ textAlign: 'center' }}>Diferencia con Sistema</div>
              <div style={{ textAlign: 'center' }}>Acciones</div>
            </div>

            {/* Productos */}
            {productos.map((producto, index) => (
              <div
                key={producto.productoId}
                id={`producto-${producto.productoId}`}
                style={{
                  padding: '1rem 2rem',
                  borderBottom: index < productos.length - 1 ? '1px solid #f1f5f9' : 'none',
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                  gap: '1rem',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: modoNavegacion && elementoSeleccionado === index ? '#f0f9ff' : 'transparent'
                }}
                onClick={() => editarProducto(producto)}
                onMouseEnter={(e) => {
                  if (!modoNavegacion) {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!modoNavegacion) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {/* Información del producto */}
                <div>
                  <div style={{
                    fontWeight: '600',
                    color: producto.fueContado === false ? '#f59e0b' : '#1e293b',
                    marginBottom: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {producto.fueContado === false && (
                      <span style={{
                        background: '#f59e0b',
                        color: 'white',
                        fontSize: '0.7rem',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '0.25rem',
                        fontWeight: 'bold'
                      }}>
                        NO CONTADO
                      </span>
                    )}
                    {producto.nombreProducto}
                  </div>
                  {producto.codigoProducto && (
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#64748b'
                    }}>
                      Código: {producto.codigoProducto}
                    </div>
                  )}
                  {producto.sectores && producto.sectores.length > 0 && (
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#3b82f6',
                      marginTop: '0.25rem'
                    }}>
                      Sectores: {producto.sectores.map(s => s.nombreSector).join(', ')}
                    </div>
                  )}
                </div>

                {/* Stock sistema */}
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                  {producto.stockSistema}
                </div>

                {/* Cantidad Final (Editable) */}
                <div style={{ textAlign: 'center' }}>
                  {producto.fueContado === false ? (
                    // Producto no contado - mostrar opciones
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        color: producto.cantidadFinal === 0 ? '#ef4444' : '#f59e0b',
                        background: producto.cantidadFinal === 0 ? '#fef2f2' : '#fffbeb',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        display: 'inline-block'
                      }}>
                        {producto.cantidadFinal || producto.stockSistema}
                      </div>
                      <select
                        value={accionesProductosNoContados[producto.productoId] || 'OMITIR'}
                        onChange={(e) => cambiarAccionProductoNoContado(producto.productoId, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontSize: '0.8rem',
                          padding: '0.25rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.25rem',
                          background: 'white'
                        }}
                      >
                        <option value="OMITIR">Omitir (conservar)</option>
                        <option value="DAR_POR_0">Dar por 0</option>
                      </select>
                    </div>
                  ) : editando === producto.productoId ? (
                    <input
                      type="number"
                      value={cantidadEditada}
                      onChange={(e) => setCantidadEditada(parseInt(e.target.value) || 0)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          guardarEdicion();
                        } else if (e.key === 'Escape') {
                          cancelarEdicion();
                        }
                      }}
                      style={{
                        width: '80px',
                        padding: '0.25rem 0.5rem',
                        border: '2px solid #7c3aed',
                        borderRadius: '0.25rem',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                      }}
                      autoFocus
                    />
                  ) : (
                    <span style={{
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      color: '#7c3aed',
                      background: '#f3f4f6',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      display: 'inline-block'
                    }}>
                      {producto.cantidadFinal || Math.max(producto.cantidadConteo1 || 0, producto.cantidadConteo2 || 0)}
                    </span>
                  )}
                </div>

                {/* Diferencia sistema */}
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    fontWeight: '600',
                    color: calcularDiferenciaSistema(producto) === 0 ? '#10b981' : 
                           calcularDiferenciaSistema(producto) > 0 ? '#3b82f6' : '#ef4444'
                  }}>
                    {calcularDiferenciaSistema(producto) > 0 ? '+' : ''}{calcularDiferenciaSistema(producto)}
                  </span>
                </div>


                {/* Acciones */}
                <div style={{ textAlign: 'center' }}>
                  {editando === producto.productoId ? (
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          guardarEdicion();
                        }}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelarEdicion();
                        }}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        editarProducto(producto);
                      }}
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      ✏️ Editar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Instrucciones de navegación */}
      {modoNavegacion && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: '#1e293b',
          color: 'white',
          padding: '1rem',
          borderRadius: '0.5rem',
          fontSize: '0.9rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Navegación por teclado:</div>
          <div>↑↓ Navegar productos</div>
          <div>Enter Seleccionar/Editar</div>
          <div>Escape Salir</div>
        </div>
      )}

      {/* Modal del Registro Generado */}
      {mostrarRegistro && registroGenerado && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Header del Modal */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '1rem'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1e293b'
              }}>
                📋 Registro de Inventario Generado
              </h2>
              <button
                onClick={cerrarRegistro}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                ✕ Cerrar
              </button>
            </div>

            {/* Información del Registro */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#374151', marginBottom: '1rem' }}>📊 Información General</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div>
                  <strong>Inventario:</strong> {registroGenerado.registroInventario?.nombreInventario}
                </div>
                <div>
                  <strong>Fecha Realización:</strong> {new Date(registroGenerado.registroInventario?.fechaRealizacion).toLocaleString()}
                </div>
                <div>
                  <strong>Responsable:</strong> {registroGenerado.registroInventario?.usuarioResponsable}
                </div>
                <div>
                  <strong>Fecha Generación:</strong> {new Date(registroGenerado.registroInventario?.fechaGeneracion).toLocaleString()}
                </div>
              </div>
              
              {registroGenerado.registroInventario?.observaciones && (
                <div style={{
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <strong>Observaciones:</strong> {registroGenerado.registroInventario.observaciones}
                </div>
              )}
            </div>

            {/* Estadísticas */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#374151', marginBottom: '1rem' }}>📈 Estadísticas</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem'
              }}>
                <div style={{
                  background: '#f0f9ff',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0369a1' }}>
                    {registroGenerado.estadisticas?.totalProductos}
                  </div>
                  <div style={{ color: '#64748b' }}>Total Productos</div>
                </div>
                <div style={{
                  background: '#fef3c7',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706' }}>
                    {registroGenerado.estadisticas?.productosConDiferencias}
                  </div>
                  <div style={{ color: '#64748b' }}>Con Diferencias</div>
                </div>
                <div style={{
                  background: '#d1fae5',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
                    {registroGenerado.estadisticas?.productosSinDiferencias}
                  </div>
                  <div style={{ color: '#64748b' }}>Sin Diferencias</div>
                </div>
                <div style={{
                  background: '#e0e7ff',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3730a3' }}>
                    {registroGenerado.estadisticas?.totalSectores}
                  </div>
                  <div style={{ color: '#64748b' }}>Total Sectores</div>
                </div>
              </div>
            </div>

            {/* Lista de Productos Actualizados */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#374151', marginBottom: '1rem' }}>📦 Productos Actualizados</h3>
              <div style={{
                maxHeight: '300px',
                overflow: 'auto',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem'
              }}>
                {registroGenerado.productosActualizados?.map((producto: any, index: number) => (
                  <div
                    key={index}
                    style={{
                      padding: '1rem',
                      borderBottom: index < registroGenerado.productosActualizados.length - 1 ? '1px solid #f1f5f9' : 'none',
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                      gap: '1rem',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>
                        {producto.nombreProducto}
                      </div>
                      {producto.codigoProducto && (
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          Código: {producto.codigoProducto}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'center', color: '#64748b' }}>
                      {producto.stockAnterior}
                    </div>
                    <div style={{ textAlign: 'center', fontWeight: '600', color: '#1e293b' }}>
                      {producto.stockNuevo}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{
                        fontWeight: '600',
                        color: producto.diferenciaStock === 0 ? '#10b981' : 
                               producto.diferenciaStock > 0 ? '#3b82f6' : '#ef4444'
                      }}>
                        {producto.diferenciaStock > 0 ? '+' : ''}{producto.diferenciaStock}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {producto.observaciones}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Información de Sectores */}
            <div>
              <h3 style={{ color: '#374151', marginBottom: '1rem' }}>🏢 Sectores Procesados</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {registroGenerado.sectoresInfo?.map((sector: any, index: number) => (
                  <div
                    key={index}
                    style={{
                      background: '#f8fafc',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
                      {sector.nombreSector}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Productos: {sector.productosContados}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Diferencias: {sector.productosConDiferencias}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Estado: {sector.estado}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductosConsolidadosInventario;
