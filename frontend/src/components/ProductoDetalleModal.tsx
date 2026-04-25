import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCart } from '../hooks/useCart';
import apiService from '../services/api';
import type { ApiResponse, Producto } from '../types';
import toast from 'react-hot-toast';
import { getCookie } from '../utils/cookies';

interface ProductoDetalleModalProps {
  open: boolean;
  onClose: () => void;
  productoId: number | null;
  subdominio: string;
  empresa: any;
}

export default function ProductoDetalleModal({ 
  open, 
  onClose, 
  productoId, 
  subdominio, 
  empresa 
}: ProductoDetalleModalProps) {
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagenActual, setImagenActual] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const { addToCart, items } = useCart();

  // Función para navegar entre imágenes
  const navegarImagen = (direccion: 'anterior' | 'siguiente') => {
    if (!producto || !producto.imagenes || producto.imagenes.length === 0) return;
    
    if (direccion === 'anterior') {
      setImagenActual(prev => prev > 0 ? prev - 1 : producto.imagenes!.length - 1);
    } else {
      setImagenActual(prev => prev < producto.imagenes!.length - 1 ? prev + 1 : 0);
    }
  };

  // Manejador de eventos de teclado
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!producto || !producto.imagenes || producto.imagenes.length <= 1) return;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        navegarImagen('anterior');
        break;
      case 'ArrowRight':
        event.preventDefault();
        navegarImagen('siguiente');
        break;
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
    }
  };

  const cargarProducto = async () => {
    const sid = (subdominio || '').trim();
    const pid = productoId != null ? Number(productoId) : NaN;

    if (!sid) {
      setProducto(null);
      setError('No se identificó la tienda. Recargá la página o entrá desde el enlace de tu tienda.');
      setCargando(false);
      return;
    }
    if (!Number.isFinite(pid) || pid <= 0) {
      setProducto(null);
      setError('No se identificó el producto en el pedido.');
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError(null);
      const response = (await apiService.obtenerProductoPublico(sid, pid)) as ApiResponse<Producto>;
      const p = response?.data ?? null;
      setProducto(p);
      setImagenActual(0);

      const cantidadEnCarrito = items.find(i => i.id === pid)?.cantidad || 0;
      setCantidad(cantidadEnCarrito > 0 ? cantidadEnCarrito : 1);
    } catch (err) {
      console.error('Error al cargar producto:', err);
      setError('No se pudo cargar el producto');
      setProducto(null);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (open && productoId) {
      cargarProducto();
      
      // Re-validar autenticación cuando se abre el modal
      let token = getCookie('clienteToken');
      let cliente = getCookie('clienteInfo');
      
      if (!token) {
        token = localStorage.getItem('clienteToken');
      }
      if (!cliente) {
        cliente = localStorage.getItem('clienteInfo');
      }
      
      const isAuthenticated = !!(token && cliente);
      console.log('=== ProductoDetalleModal Auth Check ===');
      console.log('Modal opened:', open);
      console.log('Token from cookies:', !!getCookie('clienteToken'));
      console.log('Token from localStorage:', !!localStorage.getItem('clienteToken'));
      console.log('Cliente from cookies:', !!getCookie('clienteInfo'));
      console.log('Cliente from localStorage:', !!localStorage.getItem('clienteInfo'));
      console.log('Is authenticated:', isAuthenticated);
      console.log('=====================================');
      
      // El hook useClienteAuth maneja automáticamente el estado
    } else {
      setProducto(null);
      setError(null);
      setImagenActual(0);
      setCantidad(1);
    }
  }, [open, productoId, subdominio]);

  // Agregar y remover event listener para teclado
  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [open, producto, imagenActual]);

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
    
    const agregado = await addToCart({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad,
      imagen: producto.imagenes && producto.imagenes.length > 0 ? producto.imagenes[0] : undefined,
      stock: producto.stock
    }, undefined, subdominio || undefined);
    
    if (agregado) {
      toast.success('Producto agregado al carrito');
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!open) return null;

  const modalUi = (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1200,
      padding: '20px'
    }}
    onClick={handleClose}
    >
      <div style={{
        background: 'white',
        borderRadius: '20px',
        maxWidth: 'min(90vw, 1200px)',
        maxHeight: '90vh',
        minHeight: 'min(45vh, 360px)',
        overflow: 'auto',
        position: 'relative',
        width: '100%',
        zIndex: 1,
        boxSizing: 'border-box'
      }}
      onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            fontSize: '20px',
            cursor: 'pointer',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ✕
        </button>

        {!productoId ? (
          <div style={{ padding: '48px 32px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#64748b' }}>
              No se pudo identificar el producto para mostrar el detalle.
            </p>
            <button
              type="button"
              onClick={handleClose}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 20px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>
          </div>
        ) : cargando ? (
          <div style={{
            padding: '60px 40px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '3px solid #e2e8f0',
              borderTop: '3px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }} />
            <p style={{ margin: 0, fontSize: '18px', color: '#64748b' }}>
              Cargando producto...
            </p>
          </div>
        ) : error ? (
          <div style={{
            padding: '40px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '24px'
            }}>
              ❌
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: '#dc2626' }}>
              Error al cargar el producto
            </h3>
            <p style={{ margin: '0 0 20px 0', color: '#64748b' }}>
              {error}
            </p>
            <button
              onClick={cargarProducto}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Reintentar
            </button>
          </div>
        ) : producto ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '1fr 1fr',
            gap: '32px',
            padding: '32px',
            minHeight: '0',
            minWidth: '0',
            alignItems: 'start'
          }}>
            {/* Galería de imágenes */}
            <div style={{ minWidth: '0', minHeight: '0', overflow: 'hidden' }}>
              {producto.imagenes && producto.imagenes.length > 0 ? (
                <>
                  <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <img 
                      src={producto.imagenes[imagenActual]} 
                      alt={producto.nombre}
                      style={{
                        width: '100%',
                        height: '400px',
                        objectFit: 'contain',
                        borderRadius: '16px',
                        border: '2px solid #e2e8f0',
                        backgroundColor: '#f8fafc'
                      }}
                    />
                    
                    {/* Botones de navegación */}
                    {producto.imagenes.length > 1 && (
                      <>
                        <button
                          onClick={() => navegarImagen('anterior')}
                          style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0, 0, 0, 0.6)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '48px',
                            height: '48px',
                            fontSize: '20px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            zIndex: 5
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                          }}
                        >
                          ‹
                        </button>
                        
                        <button
                          onClick={() => navegarImagen('siguiente')}
                          style={{
                            position: 'absolute',
                            right: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0, 0, 0, 0.6)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '48px',
                            height: '48px',
                            fontSize: '20px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            zIndex: 5
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                          }}
                        >
                          ›
                        </button>
                      </>
                    )}
                    
                    {/* Indicador de imagen */}
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
                      fontWeight: '500'
                    }}>
                      {imagenActual + 1} / {producto.imagenes!.length}
                    </div>
                    
                    {/* Indicación de controles de teclado */}
                    {producto.imagenes.length > 1 && (
                      <div style={{
                        position: 'absolute',
                        bottom: '16px',
                        right: '16px',
                        background: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '400',
                        opacity: 0.8
                      }}>
                        ← → para navegar
                      </div>
                    )}
                  </div>
                  
                  {/* Miniaturas */}
                  {producto.imagenes!.length > 1 && (
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      overflowX: 'auto',
                      paddingBottom: '8px'
                    }}>
                      {producto.imagenes!.map((imagen, index) => (
                        <img
                          key={index}
                          src={imagen}
                          alt={`${producto.nombre} - Imagen ${index + 1}`}
                          style={{
                            width: '80px',
                            height: '80px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: index === imagenActual ? '3px solid #667eea' : '2px solid #e2e8f0',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => setImagenActual(index)}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{
                  width: '100%',
                  height: '400px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '16px',
                  border: '2px solid #e2e8f0',
                  color: '#64748b',
                  padding: '40px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '80px',
                    marginBottom: '16px',
                    opacity: 0.7
                  }}>
                    📸
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '500',
                    opacity: 0.8
                  }}>
                    Sin imagen disponible
                  </div>
                </div>
              )}
            </div>

            {/* Información del producto */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              minWidth: '0',
              minHeight: '0'
            }}>
              {/* Título y badges */}
              <div>
                <h1 style={{
                  margin: '0 0 16px 0',
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#1e293b',
                  lineHeight: '1.2'
                }}>
                  {producto.nombre}
                </h1>
                
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '16px',
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
                  
                  {/* Categoría - Solo se muestra si mostrarCategorias está habilitado */}
                  {empresa?.mostrarCategorias && producto.categoria && (
                    <span style={{
                      background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                      color: '#1e40af',
                      padding: '6px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      📂 {producto.categoria}
                    </span>
                  )}
                  
                  {producto.marca && (
                    <span style={{
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      color: '#92400e',
                      padding: '6px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      🏷️ {producto.marca}
                    </span>
                  )}
                </div>
              </div>

              {/* Precio */}
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                padding: '20px',
                borderRadius: '16px',
                border: '2px solid #bbf7d0'
              }}>
                {/* Precio - Solo se muestra si mostrarPrecios está habilitado */}
                {empresa?.mostrarPrecios && (
                  <div style={{
                    fontSize: '32px',
                    fontWeight: '800',
                    color: '#059669',
                    marginBottom: '8px'
                  }}>
                    {formatearPrecio(producto.precio, empresa.moneda)}
                  </div>
                )}
                
                {/* Stock disponible - Solo se muestra si mostrarStock está habilitado */}
                {empresa?.mostrarStock && producto.stock !== null && (
                  <div style={{
                    fontSize: '16px',
                    color: producto.stock > 0 ? '#059669' : '#dc2626',
                    fontWeight: '600'
                  }}>
                    {producto.stock > 0 ? `📦 ${producto.stock} unidades disponibles` : '❌ Agotado'}
                  </div>
                )}
              </div>

              {/* Descripción */}
              {producto.descripcion && (
                <div>
                  <h3 style={{
                    margin: '0 0 12px 0',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1e293b'
                  }}>
                    Descripción
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: '16px',
                    lineHeight: '1.6',
                    color: '#64748b',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'pre-wrap',
                    maxWidth: '100%'
                  }}>
                    {producto.descripcion}
                  </p>
                </div>
              )}

              {/* Controles de cantidad y compra */}
              <div style={{
                background: '#f8fafc',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0'
              }}>
                {/* Controles de cantidad */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '20px'
                }}>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Cantidad:
                  </span>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'white',
                    borderRadius: '12px',
                    border: '2px solid #e2e8f0',
                    overflow: 'hidden'
                  }}>
                                      <button
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    disabled={cantidad <= 1}
                    style={{
                      width: '40px',
                      height: '40px',
                      background: cantidad <= 1 ? '#e5e7eb' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      border: 'none',
                      fontSize: '18px',
                      fontWeight: '700',
                      cursor: cantidad <= 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: cantidad <= 1 ? 0.5 : 1
                    }}
                  >
                    -
                  </button>
                    
                    <span style={{
                      minWidth: '60px',
                      textAlign: 'center',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#1e293b',
                      padding: '0 16px'
                    }}>
                      {cantidad}
                    </span>
                    
                    <button
                      onClick={() => {
                        const cantidadEnCarrito = items.find(i => i.id === producto.id)?.cantidad || 0;
                        const cantidadDisponible = (producto.stock || 0) - cantidadEnCarrito;
                        const nuevaCantidad = Math.min(cantidadDisponible, cantidad + 1);
                        setCantidad(nuevaCantidad);
                      }}
                      disabled={(() => {
                        const cantidadEnCarrito = items.find(i => i.id === producto.id)?.cantidad || 0;
                        const cantidadDisponible = (producto.stock || 0) - cantidadEnCarrito;
                        return cantidad >= cantidadDisponible;
                      })()}
                      style={{
                        width: '40px',
                        height: '40px',
                        background: (() => {
                          const cantidadEnCarrito = items.find(i => i.id === producto.id)?.cantidad || 0;
                          const cantidadDisponible = (producto.stock || 0) - cantidadEnCarrito;
                          return cantidad >= cantidadDisponible ? '#e5e7eb' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                        })(),
                        color: 'white',
                        border: 'none',
                        fontSize: '18px',
                        fontWeight: '700',
                        cursor: (() => {
                          const cantidadEnCarrito = items.find(i => i.id === producto.id)?.cantidad || 0;
                          const cantidadDisponible = (producto.stock || 0) - cantidadEnCarrito;
                          return cantidad >= cantidadDisponible ? 'not-allowed' : 'pointer';
                        })(),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: (() => {
                          const cantidadEnCarrito = items.find(i => i.id === producto.id)?.cantidad || 0;
                          const cantidadDisponible = (producto.stock || 0) - cantidadEnCarrito;
                          return cantidad >= cantidadDisponible ? 0.5 : 1;
                        })()
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Información del carrito */}
                {(() => {
                  const cantidadEnCarrito = items.find(i => i.id === producto.id)?.cantidad || 0;
                  const cantidadDisponible = (producto.stock || 0) - cantidadEnCarrito;
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
                      gap: '8px',
                      marginBottom: '20px'
                    }}>
                      {cantidadEnCarrito > 0 ? (
                        maximoAlcanzado ? (
                          <span>🛒 Ya tienes el máximo disponible en el carrito ({cantidadEnCarrito}/{producto.stock})</span>
                        ) : (
                          <span>🛒 Tienes {cantidadEnCarrito} en el carrito. Puedes agregar {cantidadDisponible} más.</span>
                        )
                      ) : (
                        <span>🛒 Puedes agregar hasta {producto.stock} unidades al carrito</span>
                      )}
                    </div>
                  );
                })()}

                {/* Botones de acción */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  flexDirection: window.innerWidth <= 768 ? 'column' : 'row'
                }}>
                  <button
                    onClick={agregarAlCarrito}
                    disabled={producto.stock === 0}
                    style={{
                      flex: 1,
                      padding: '16px 24px',
                      background: producto.stock === 0
                        ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                        : `linear-gradient(135deg, ${empresa?.colorSecundario || '#64748b'} 0%, ${empresa?.colorSecundario ? `${empresa.colorSecundario}dd` : '#475569'} 100%)`,
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '700',
                      cursor: producto.stock === 0 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: producto.stock === 0 ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseOver={(e) => {
                      if (producto.stock !== 0) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = empresa?.colorSecundario 
                          ? `0 8px 25px ${empresa.colorSecundario}40`
                          : '0 8px 25px rgba(100, 116, 139, 0.3)';
                      }
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <span>🛒</span>
                    <span>Agregar al carrito</span>
                  </button>
                  
                  <button
                    onClick={handleClose}
                    style={{
                      padding: '16px 24px',
                      background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(107, 114, 128, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <span>✕</span>
                    <span>Cerrar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalUi, document.body)
    : modalUi;
} 