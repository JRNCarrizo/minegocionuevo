import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSubdominio } from '../hooks/useSubdominio';
import apiService from '../services/api';
import type { Producto } from '../types';
import CartModal from '../components/CartModal';
import NavbarCliente from '../components/NavbarCliente';
import { useCart } from '../hooks/useCart';
import { useClienteAuth } from '../hooks/useClienteAuth';
import toast from 'react-hot-toast';
import { getCookie } from '../utils/cookies';

export default function ProductoPublico() {
  const { id } = useParams<{ id: string }>();
  const { empresa, subdominio, cargando: cargandoEmpresa } = useSubdominio();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagenActual, setImagenActual] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [showCart, setShowCart] = useState(false);
  const { clienteInfo, cerrarSesion } = useClienteAuth();
  const { addToCart, items } = useCart();

  const cargarProducto = useCallback(async () => {
    if (!subdominio || !id) return;
    try {
      setCargando(true);
      setError(null);
      const url = `/publico/${subdominio}/productos/${id}`;
      console.log('Petición detalle producto:', {
        url,
        subdominio,
        id,
        apiBase: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
      });
      const response = await apiService.obtenerProductoPublico(subdominio, parseInt(id));
      setProducto(response.data || null);
    } catch (err) {
      console.error('Error al cargar producto:', err);
      setError('No se pudo cargar el producto');
    } finally {
      setCargando(false);
    }
  }, [subdominio, id]);

  useEffect(() => {
    // Limpiar producto y error antes de cargar uno nuevo
    setProducto(null);
    setError(null);
    setCargando(true);
    if (empresa && subdominio && id) {
      console.log('Debug Detalle:', { id, subdominio });
      cargarProducto();
    }
  }, [empresa, subdominio, id, cargarProducto]);

  // El hook useClienteAuth maneja automáticamente la autenticación

  const formatearPrecio = (precio: number, moneda: string = 'USD') => {
    const simbolos: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'ARS': '$',
      'Peso Argentino ($)': '$'
    };
    
    return `${simbolos[moneda] || '$'}${precio.toLocaleString()}`;
  };

  const agregarAlCarrito = async () => {
    if (!producto) return;
    
    if (producto.stock === 0) {
      toast.error('Este producto está agotado');
      return;
    }
    
    // Validación local: verificar si ya tenemos el máximo en el carrito
    const cantidadEnCarrito = items.find(i => i.id === producto.id)?.cantidad || 0;
    const cantidadTotal = cantidadEnCarrito + cantidad;
    
    if (cantidadTotal > producto.stock) {
      toast.error(`No puedes agregar más de ${producto.stock} unidades. Ya tienes ${cantidadEnCarrito} en el carrito.`);
      return;
    }
    
    if (typeof producto.precio !== 'number' || isNaN(producto.precio)) {
      alert('Este producto no tiene un precio válido y no puede ser agregado al carrito.');
      return;
    }
    
    console.log(`Intentando agregar producto: ${producto.nombre} (stock: ${producto.stock}, cantidad: ${cantidad}, cantidad en carrito: ${cantidadEnCarrito})`);
    
    const agregado = await addToCart({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad,
      imagen: producto.imagenes && producto.imagenes[0]
    }, undefined, subdominio || undefined);
    
    if (agregado) {
      toast.success('Producto agregado al carrito');
    } else {
      console.log('No se pudo agregar el producto al carrito');
    }
  };

  const comprarAhora = () => {
    if (!producto) return;
    
    // Verificar si el usuario está autenticado
    if (!clienteInfo) {
      toast.error('Debes iniciar sesión para realizar compras');
      return;
    }
    
    // TODO: Implementar compra directa
    alert(`Compra directa del producto ${producto.nombre} (cantidad: ${cantidad})`);
  };

  if (cargandoEmpresa) {
    return (
      <div className="pagina-cargando">
        <div className="spinner"></div>
        <p>Cargando tienda...</p>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="pagina-error">
        <h1>Tienda no encontrada</h1>
        <p>No se pudo encontrar la tienda solicitada.</p>
        <Link to="/" className="boton boton-primario">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="producto-publico">
      {/* Navbar del cliente */}
      <NavbarCliente
        empresa={empresa}
        clienteInfo={clienteInfo}
        onCerrarSesion={cerrarSesion}
        onShowCart={() => setShowCart(true)}
      />
              <CartModal 
          open={showCart} 
          onClose={() => setShowCart(false)} 
          onCompraExitosa={() => {
            // Recargar el producto para actualizar stock
            cargarProducto();
          }}
          permitirCompra={!!clienteInfo}
        />

      <main className="contenedor">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Inicio</Link>
          <span>&gt;</span>
          <span>Producto</span>
        </nav>

        {cargando ? (
          <div className="cargando-producto">
            <div className="spinner"></div>
            <p>Cargando producto...</p>
          </div>
        ) : error ? (
          <div className="error-producto">
            <h2>Error al cargar el producto</h2>
            <p>{error}</p>
            <div className="acciones-error">
              <button onClick={cargarProducto} className="boton boton-secundario">
                Reintentar
              </button>
              <Link to="/" className="boton boton-primario">
                Volver al catálogo
              </Link>
            </div>
          </div>
        ) : !producto ? (
          <div className="producto-no-encontrado">
            <h2>Producto no encontrado</h2>
            <p>El producto que buscas no existe o no está disponible.</p>
            <Link to="/" className="boton boton-primario">
              Volver al catálogo
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: window.innerWidth <= 768 ? '24px' : '48px',
            alignItems: 'start',
            background: 'white',
            padding: '32px 24px',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0',
            maxWidth: '1400px',
            margin: '0 auto'
          }}>
            {/* Galería de imágenes */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0',
              minWidth: 0
            }}>
              {producto.imagenes && producto.imagenes.length > 0 ? (
                <>
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={producto.imagenes[imagenActual]} 
                      alt={producto.nombre}
                      style={{
                        width: '100%',
                        height: '400px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        border: '2px solid #e2e8f0'
                      }}
                    />
                    {/* Indicador dentro de la imagen principal */}
                    <div style={{
                      position: 'absolute',
                      bottom: '16px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      pointerEvents: 'none'
                    }}>
                      {imagenActual + 1} / {producto.imagenes.length}
                    </div>
                  </div>
                  {/* Miniaturas */}
                  {producto.imagenes.length > 1 && (
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '16px',
                      justifyContent: 'center',
                      flexWrap: 'wrap'
                    }}>
                      {producto.imagenes.map((imagen, index) => (
                        <button
                          key={index}
                          onClick={() => setImagenActual(index)}
                          style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: index === imagenActual ? '3px solid #3b82f6' : '2px solid #e2e8f0',
                            cursor: 'pointer',
                            padding: 0,
                            background: 'none',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            if (index !== imagenActual) {
                              e.currentTarget.style.borderColor = '#3b82f6';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (index !== imagenActual) {
                              e.currentTarget.style.borderColor = '#e2e8f0';
                            }
                          }}
                        >
                          <img 
                            src={imagen} 
                            alt={`${producto.nombre} ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{
                  width: '100%',
                  height: '400px',
                  background: '#f9fafb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  fontSize: '18px',
                  border: '2px dashed #d1d5db',
                  borderRadius: '12px'
                }}>
                  📷 Sin imagen disponible
                </div>
              )}
            </div>

            {/* Información del producto */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              minWidth: 0
            }}>
              {/* Información básica del producto */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                border: '1px solid #e2e8f0',
                minWidth: 0
              }}>
                {/* Encabezado */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <h1 style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#1e293b',
                    margin: 0,
                    lineHeight: '1.2',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}>
                    {producto.nombre}
                  </h1>
                  
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    {producto.destacado && (
                      <span style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        ⭐ Destacado
                      </span>
                    )}
                    
                    {producto.stock <= 5 && producto.stock > 0 && (
                      <span style={{
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        ⚠️ Últimas unidades
                      </span>
                    )}
                  </div>
                </div>

                {/* Precio - Solo se muestra si mostrarPrecios está habilitado */}
                {empresa?.mostrarPrecios && (
                  <div style={{
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#059669',
                    marginBottom: '16px'
                  }}>
                    {formatearPrecio(producto.precio, empresa.moneda)}
                    {producto.unidad && (
                      <span style={{
                        fontSize: '16px',
                        color: '#64748b',
                        fontWeight: '500'
                      }}>
                        / {producto.unidad}
                      </span>
                    )}
                  </div>
                )}

                {/* Metadatos */}
                <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
                  {producto.categoria && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '12px 0', 
                      borderBottom: '1px solid #f1f5f9',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <span style={{ color: '#64748b', fontWeight: '500', flexShrink: 0 }}>Categoría:</span>
                      <span style={{ 
                        color: '#1e293b', 
                        fontWeight: '600',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        textAlign: 'right'
                      }}>{producto.categoria}</span>
                    </div>
                  )}
                  
                  {producto.marca && (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '12px 0', 
                      borderBottom: '1px solid #f1f5f9',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <span style={{ color: '#64748b', fontWeight: '500', flexShrink: 0 }}>Marca:</span>
                      <span style={{ 
                        color: '#1e293b', 
                        fontWeight: '600',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        textAlign: 'right'
                      }}>{producto.marca}</span>
                    </div>
                  )}
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '12px 0',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <span style={{ color: '#64748b', fontWeight: '500', flexShrink: 0 }}>Stock:</span>
                    <span style={{ 
                      color: producto.stock > 0 ? '#059669' : '#ef4444', 
                      fontWeight: '600',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      textAlign: 'right'
                    }}>
                      {producto.stock > 0 ? `✓ ${producto.stock} disponibles` : '✗ Producto agotado'}
                    </span>
                  </div>
                </div>

                {producto.descripcion && (
                  <div style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1e293b',
                      margin: '0 0 8px 0'
                    }}>
                      📝 Descripción
                    </h4>
                    <p style={{
                      color: '#64748b',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      margin: 0,
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {producto.descripcion}
                    </p>
                  </div>
                )}
              </div>

              {/* Controles de compra */}
              {producto.stock > 0 && (
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  border: '1px solid #e2e8f0'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: '0 0 20px 0'
                  }}>
                    🛒 Comprar Producto
                  </h3>
                  
                  <div style={{ display: 'grid', gap: '16px' }}>
                        {!clienteInfo && (
                          <div style={{
                            padding: '12px 14px',
                            background: '#fffbeb',
                            border: '1px solid #fcd34d',
                            borderRadius: '10px',
                            fontSize: '13px',
                            color: '#92400e',
                            lineHeight: 1.45
                          }}>
                            Podés agregar al carrito y ver el total. Para finalizar la compra necesitás iniciar sesión.
                          </div>
                        )}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <label htmlFor="cantidad" style={{
                          color: '#374151',
                          fontWeight: '500',
                          fontSize: '14px',
                          minWidth: '80px'
                        }}>
                          Cantidad:
                        </label>
                        <input
                          type="number"
                          id="cantidad"
                          min="1"
                          max={producto.stock}
                          value={cantidad}
                          onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                          style={{
                            width: '100px',
                            padding: '8px 12px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            textAlign: 'center',
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
                        />
                      </div>

                      {/* Información del carrito */}
                      {(() => {
                        const cantidadEnCarrito = items.find(i => i.id === producto.id)?.cantidad || 0;
                        const maximoAlcanzado = cantidadEnCarrito >= producto.stock;
                        
                        return (
                          <div style={{ 
                            padding: '12px 16px',
                            background: maximoAlcanzado ? '#fef2f2' : '#f0f9ff',
                            border: `1px solid ${maximoAlcanzado ? '#fecaca' : '#bae6fd'}`,
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: maximoAlcanzado ? '#dc2626' : '#0369a1',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            {cantidadEnCarrito > 0 ? (
                              maximoAlcanzado ? (
                                <span>🛒 Ya tienes el máximo disponible en el carrito ({cantidadEnCarrito}/{producto.stock})</span>
                              ) : (
                                <span>🛒 Tienes {cantidadEnCarrito} en el carrito. Puedes agregar {producto.stock - cantidadEnCarrito} más.</span>
                              )
                            ) : (
                              <span>🛒 Puedes agregar hasta {producto.stock} unidades al carrito</span>
                            )}
                          </div>
                        );
                      })()}

                      <div style={{ display: 'grid', gap: '12px' }}>
                        <button
                          onClick={agregarAlCarrito}
                          disabled={(() => {
                            const cantidadEnCarrito = items.find(i => i.id === producto.id)?.cantidad || 0;
                            return cantidadEnCarrito >= producto.stock;
                          })()}
                          style={{
                            width: '100%',
                            padding: '12px 24px',
                            background: '#f1f5f9',
                            color: '#3b82f6',
                            border: '1px solid #3b82f6',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: (() => {
                              const cantidadEnCarrito = items.find(i => i.id === producto.id)?.cantidad || 0;
                              return cantidadEnCarrito >= producto.stock ? 'not-allowed' : 'pointer';
                            })(),
                            opacity: (() => {
                              const cantidadEnCarrito = items.find(i => i.id === producto.id)?.cantidad || 0;
                              return cantidadEnCarrito >= producto.stock ? 0.6 : 1;
                            })(),
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            const cantidadEnCarrito = items.find(i => i.id === producto.id)?.cantidad || 0;
                            if (cantidadEnCarrito < producto.stock) {
                              e.currentTarget.style.background = '#3b82f6';
                              e.currentTarget.style.color = 'white';
                            }
                          }}
                          onMouseOut={(e) => {
                            const cantidadEnCarrito = items.find(i => i.id === producto.id)?.cantidad || 0;
                            if (cantidadEnCarrito < producto.stock) {
                              e.currentTarget.style.background = '#f1f5f9';
                              e.currentTarget.style.color = '#3b82f6';
                            }
                          }}
                        >
                          {(() => {
                            const cantidadEnCarrito = items.find(i => i.id === producto.id)?.cantidad || 0;
                            return cantidadEnCarrito >= producto.stock ? 'Máximo en carrito' : 'Agregar al carrito';
                          })()}
                        </button>
                        
                        {clienteInfo && (
                        <button
                          onClick={comprarAhora}
                          style={{
                            width: '100%',
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
                          }}
                        >
                          Comprar ahora
                        </button>
                        )}
                      </div>
                    </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
