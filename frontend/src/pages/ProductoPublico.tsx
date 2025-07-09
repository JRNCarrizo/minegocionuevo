import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSubdominio } from '../hooks/useSubdominio';
import apiService from '../services/api';
import type { Producto } from '../types';
import CartIcon from '../components/CartIcon';
import CartModal from '../components/CartModal';
import { useCart } from '../hooks/useCart';
import toast from 'react-hot-toast';

export default function ProductoPublico() {
  const { id } = useParams<{ id: string }>();
  const { empresa, subdominio, cargando: cargandoEmpresa } = useSubdominio();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagenActual, setImagenActual] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [showCart, setShowCart] = useState(false);
  const [clienteInfo, setClienteInfo] = useState<{ nombre: string; email: string } | null>(null);
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

  useEffect(() => {
    const token = localStorage.getItem('clienteToken');
    const cliente = localStorage.getItem('clienteInfo');
    if (token && cliente) {
      try {
        setClienteInfo(JSON.parse(cliente));
      } catch (error) {
        console.log(error)
        setClienteInfo(null);
      }
    } else {
      setClienteInfo(null);
    }
  }, []);

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
      {/* Header de la tienda */}
      <header className="header-tienda">
        <div className="contenedor">
          <div className="info-empresa">
            {empresa.logoUrl && (
              <img 
                src={empresa.logoUrl} 
                alt={`Logo de ${empresa.nombre}`}
                className="logo-empresa"
              />
            )}
            <div>
              <h1 className="nombre-empresa">{empresa.nombre}</h1>
            </div>
          </div>
          
          <nav className="nav-tienda">
            <Link to="/" className="nav-link">Catálogo</Link>
            <span className="nav-link" style={{ position: 'relative' }}>
              <CartIcon onClick={() => setShowCart(true)} />
            </span>
            {clienteInfo ? (
              <>
                <Link to="/cuenta" className="nav-link">Mi Cuenta</Link>
                <span className="nav-link" style={{ color: '#28a745' }}>
                  ¡Hola, {clienteInfo.nombre}!
                </span>
                <button 
                  onClick={() => {
                    localStorage.removeItem('clienteToken');
                    localStorage.removeItem('clienteInfo');
                    setClienteInfo(null);
                  }}
                  className="nav-link"
                  style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer' }}
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link to="/login" className="nav-link">Iniciar Sesión</Link>
            )}
          </nav>
        </div>
      </header>
      <CartModal open={showCart} onClose={() => setShowCart(false)} />

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
          <div className="detalle-producto">
            <div className="galeria-producto">
              {producto.imagenes && producto.imagenes.length > 0 ? (
                <>
                  <div className="imagen-principal">
                    <img 
                      src={producto.imagenes[imagenActual]} 
                      alt={producto.nombre}
                    />
                  </div>
                  
                  {producto.imagenes.length > 1 && (
                    <div className="miniaturas">
                      {producto.imagenes.map((imagen, index) => (
                        <button
                          key={index}
                          onClick={() => setImagenActual(index)}
                          className={`miniatura ${index === imagenActual ? 'activa' : ''}`}
                        >
                          <img src={imagen} alt={`${producto.nombre} ${index + 1}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="sin-imagen-detalle">
                  <span>Sin imagen disponible</span>
                </div>
              )}
            </div>

            <div className="info-producto">
              <div className="cabecera-producto">
                <h1>{producto.nombre}</h1>
                {producto.destacado && (
                  <span className="badge-destacado">Destacado</span>
                )}
              </div>

              <div className="precio-producto">
                <span className="precio-actual">
                  {formatearPrecio(producto.precio, empresa.moneda)}
                </span>
              </div>

              <div className="metadatos-producto">
                {producto.categoria && (
                  <div className="metadato">
                    <span className="etiqueta">Categoría:</span>
                    <span className="valor">{producto.categoria}</span>
                  </div>
                )}
                
                {producto.marca && (
                  <div className="metadato">
                    <span className="etiqueta">Marca:</span>
                    <span className="valor">{producto.marca}</span>
                  </div>
                )}
                
                {producto.unidad && (
                  <div className="metadato">
                    <span className="etiqueta">Unidad:</span>
                    <span className="valor">{producto.unidad}</span>
                  </div>
                )}
              </div>

              {producto.descripcion && (
                <div className="descripcion-producto">
                  <h3>Descripción</h3>
                  <p>{producto.descripcion}</p>
                </div>
              )}

              <div className="stock-producto">
                {producto.stock > 0 ? (
                  <span className="stock-disponible">
                    ✓ {producto.stock} disponibles
                  </span>
                ) : (
                  <span className="stock-agotado">
                    ✗ Producto agotado
                  </span>
                )}
              </div>

              {producto.stock > 0 && (
                <div className="controles-compra">
                  <div className="selector-cantidad">
                    <label htmlFor="cantidad">Cantidad:</label>
                    <input
                      type="number"
                      id="cantidad"
                      min="1"
                      max={producto.stock}
                      value={cantidad}
                      onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                      className="input-cantidad"
                    />
                  </div>

                  {/* Mostrar información del carrito */}
                  {(() => {
                    const cantidadEnCarrito = items.find(i => i.id === producto.id)?.cantidad || 0;
                    const maximoAlcanzado = cantidadEnCarrito >= producto.stock;
                    
                    return (
                      <div className="info-carrito" style={{ 
                        marginBottom: '16px',
                        padding: '8px 12px',
                        background: maximoAlcanzado ? '#fef2f2' : '#f0f9ff',
                        border: `1px solid ${maximoAlcanzado ? '#fecaca' : '#bae6fd'}`,
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: maximoAlcanzado ? '#dc2626' : '#0369a1'
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

                  <div className="botones-compra">
                    <button
                      onClick={agregarAlCarrito}
                      disabled={(() => {
                        const cantidadEnCarrito = items.find(i => i.id === producto.id)?.cantidad || 0;
                        return cantidadEnCarrito >= producto.stock;
                      })()}
                      className="boton boton-secundario boton-completo"
                      style={{
                        opacity: (() => {
                          const cantidadEnCarrito = items.find(i => i.id === producto.id)?.cantidad || 0;
                          return cantidadEnCarrito >= producto.stock ? 0.6 : 1;
                        })(),
                        cursor: (() => {
                          const cantidadEnCarrito = items.find(i => i.id === producto.id)?.cantidad || 0;
                          return cantidadEnCarrito >= producto.stock ? 'not-allowed' : 'pointer';
                        })()
                      }}
                    >
                      {(() => {
                        const cantidadEnCarrito = items.find(i => i.id === producto.id)?.cantidad || 0;
                        return cantidadEnCarrito >= producto.stock ? 'Máximo en carrito' : 'Agregar al carrito';
                      })()}
                    </button>
                    
                    <button
                      onClick={comprarAhora}
                      className="boton boton-primario boton-completo"
                    >
                      Comprar ahora
                    </button>
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
