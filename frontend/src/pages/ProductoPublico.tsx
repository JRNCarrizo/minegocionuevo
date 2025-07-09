import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSubdominio } from '../hooks/useSubdominio';
import apiService from '../services/api';
import type { Producto } from '../types';

export default function ProductoPublico() {
  const { id } = useParams<{ id: string }>();
  const { empresa, subdominio, cargando: cargandoEmpresa } = useSubdominio();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagenActual, setImagenActual] = useState(0);
  const [cantidad, setCantidad] = useState(1);

  const cargarProducto = useCallback(async () => {
    if (!subdominio || !id) return;
    
    try {
      setCargando(true);
      setError(null);

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
    if (empresa && subdominio && id) {
      cargarProducto();
    }
  }, [empresa, subdominio, id, cargarProducto]);

  const formatearPrecio = (precio: number, moneda: string = 'USD') => {
    const simbolos: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'ARS': '$',
      'Peso Argentino ($)': '$'
    };
    
    return `${simbolos[moneda] || '$'}${precio.toLocaleString()}`;
  };

  const agregarAlCarrito = () => {
    if (!producto) return;
    
    // TODO: Implementar carrito de compras
    alert(`Producto ${producto.nombre} agregado al carrito (cantidad: ${cantidad})`);
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
            <Link to="/carrito" className="nav-link">
              Carrito
            </Link>
            <Link to="/login" className="nav-link">Iniciar Sesión</Link>
          </nav>
        </div>
      </header>

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

                  <div className="botones-compra">
                    <button
                      onClick={agregarAlCarrito}
                      className="boton boton-secundario boton-completo"
                    >
                      Agregar al carrito
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
