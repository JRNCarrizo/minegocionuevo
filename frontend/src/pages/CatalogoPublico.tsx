import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSubdominio } from '../hooks/useSubdominio';
import { useCart } from '../hooks/useCart';
import CartIcon from '../components/CartIcon';
import CartModal from '../components/CartModal';
import apiService from '../services/api';
import type { Producto } from '../types';

export default function CatalogoPublico() {
  const { empresa, subdominio, cargando: cargandoEmpresa } = useSubdominio();
  const { addToCart } = useCart();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [filtroMarca, setFiltroMarca] = useState<string>('');
  const [categorias, setCategorias] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [clienteInfo, setClienteInfo] = useState<{ nombre: string; email: string } | null>(null);
  const [showCart, setShowCart] = useState(false);

  // Verificar si hay un cliente logueado
  useEffect(() => {
    const token = localStorage.getItem('clienteToken');
    const cliente = localStorage.getItem('clienteInfo');
    
    if (token && cliente) {
      try {
        setClienteInfo(JSON.parse(cliente));
      } catch (error) {
        console.error('Error al parsear clienteInfo:', error);
        localStorage.removeItem('clienteToken');
        localStorage.removeItem('clienteInfo');
      }
    }
  }, []);

  const cargarProductos = useCallback(async () => {
    if (!subdominio) {
      console.log('No hay subdominio disponible');
      return;
    }
    
    try {
      setCargando(true);
      setError(null);

      console.log('Cargando productos para subdominio:', subdominio);
      console.log('Filtros:', { categoria: filtroCategoria, marca: filtroMarca });

      const response = await apiService.obtenerProductosPublicos(subdominio, {
        categoria: filtroCategoria || undefined,
        marca: filtroMarca || undefined
      });

      console.log('Respuesta del API:', response);

      const productosData = response.data || [];
      console.log('Productos obtenidos:', productosData);
      setProductos(productosData);

      // Extraer categorías y marcas únicas
      const categoriasUnicas = [...new Set(productosData.map((p: Producto) => p.categoria).filter(Boolean))] as string[];
      const marcasUnicas = [...new Set(productosData.map((p: Producto) => p.marca).filter(Boolean))] as string[];
      
      console.log('Categorías:', categoriasUnicas);
      console.log('Marcas:', marcasUnicas);
      
      setCategorias(categoriasUnicas);
      setMarcas(marcasUnicas);
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setError('No se pudieron cargar los productos');
    } finally {
      setCargando(false);
    }
  }, [subdominio, filtroCategoria, filtroMarca]);

  useEffect(() => {
    if (empresa && subdominio) {
      cargarProductos();
    }
  }, [empresa, subdominio, cargarProductos]);

  const formatearPrecio = (precio: number, moneda: string = 'USD') => {
    const simbolos: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'ARS': '$',
      'Peso Argentino ($)': '$'
    };
    
    return `${simbolos[moneda] || '$'}${precio.toLocaleString()}`;
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
    <div className="catalogo-publico" style={{
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      minHeight: '100vh'
    }}>
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
              {empresa.descripcion && (
                <p className="descripcion-empresa">{empresa.descripcion}</p>
              )}
            </div>
          </div>
          
          <nav className="nav-tienda">
            <Link to="/" className="nav-link">Inicio</Link>
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
        {/* Cabecera del catálogo */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
          padding: '40px 20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '20px',
          color: 'white',
          boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
          marginTop: '20px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '32px'
          }}>
            🛍️
          </div>
          <h1 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '32px', 
            fontWeight: '700',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            Catálogo de Productos
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: '18px', 
            opacity: 0.9,
            fontWeight: '300'
          }}>
            Descubre nuestra increíble selección de productos
          </p>
        </div>

        {/* Filtros modernos */}
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: 'white'
            }}>
              🔍
            </div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
              Filtros de Búsqueda
            </h2>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#64748b'
              }}>
                Categoría
              </label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  fontSize: '14px',
                  background: '#fff',
                  color: '#1e293b',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              >
                <option value="">Todas las categorías</option>
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#64748b'
              }}>
                Marca
              </label>
              <select
                value={filtroMarca}
                onChange={(e) => setFiltroMarca(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  fontSize: '14px',
                  background: '#fff',
                  color: '#1e293b',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              >
                <option value="">Todas las marcas</option>
                {marcas.map(marca => (
                  <option key={marca} value={marca}>{marca}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Grid de productos */}
        {cargando ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
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
            <p style={{ margin: 0, fontSize: '18px', color: '#64748b', fontWeight: '500' }}>
              Cargando productos...
            </p>
          </div>
        ) : error ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
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
            <p style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#dc2626', fontWeight: '600' }}>
              {error}
            </p>
            <button 
              onClick={cargarProductos} 
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              🔄 Reintentar
            </button>
          </div>
        ) : productos.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '32px'
            }}>
              📦
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>
              No hay productos disponibles
            </h3>
            <p style={{ margin: 0, fontSize: '16px', color: '#64748b' }}>
              En este momento no tenemos productos en esta categoría.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '40px'
          }}>
            {productos.map(producto => (
              <div key={producto.id} style={{
                background: '#fff',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative'
              }}
              onClick={() => window.location.href = `/producto/${producto.id}`}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
              }}>
                
                {/* Imagen del producto */}
                <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                  {producto.imagenes && producto.imagenes.length > 0 ? (
                    <img 
                      src={producto.imagenes[0]} 
                      alt={producto.nombre}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#64748b',
                      fontSize: '16px'
                    }}>
                      📷 Sin imagen
                    </div>
                  )}
                  
                  {/* Badge destacado */}
                  {producto.destacado && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      boxShadow: '0 2px 8px rgba(245,158,11,0.3)'
                    }}>
                      ⭐ Destacado
                    </div>
                  )}

                  {/* Badge de stock */}
                  {producto.stock !== null && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: producto.stock > 0 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}>
                      {producto.stock > 0 ? `📦 ${producto.stock}` : '❌ Agotado'}
                    </div>
                  )}
                </div>
                
                {/* Información del producto */}
                <div style={{ padding: '20px' }}>
                  <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#1e293b',
                    lineHeight: '1.3',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {producto.nombre}
                  </h3>
                  
                  {/* Categoría y marca */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {producto.categoria && (
                      <span style={{
                        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                        color: '#1e40af',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: '1px solid #93c5fd'
                      }}>
                        📂 {producto.categoria}
                      </span>
                    )}
                    
                    {producto.marca && (
                      <span style={{
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        color: '#92400e',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: '1px solid #fbbf24'
                      }}>
                        🏷️ {producto.marca}
                      </span>
                    )}
                  </div>
                  
                  {/* Precio */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <span style={{
                      fontSize: '24px',
                      fontWeight: '800',
                      color: '#059669',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      {formatearPrecio(producto.precio, empresa.moneda)}
                    </span>
                  </div>
                </div>

                {/* Botón agregar al carrito */}
                <button
                  style={{
                    width: '100%',
                    background: producto.stock === 0 
                      ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 20px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: producto.stock === 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: producto.stock === 0 ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  disabled={producto.stock === 0}
                  onClick={() => {
                    if (producto.stock === 0) return;
                    if (typeof producto.precio !== 'number' || isNaN(producto.precio)) {
                      alert('Este producto no tiene un precio válido y no puede ser agregado al carrito.');
                      return;
                    }
                    addToCart({
                      id: producto.id,
                      nombre: producto.nombre,
                      precio: producto.precio,
                      cantidad: 1,
                      imagen: producto.imagenes && producto.imagenes[0]
                    });
                  }}
                  onMouseOver={(e) => {
                    if (producto.stock !== 0) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {producto.stock === 0 ? '❌ Agotado' : '🛒 Agregar al carrito'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer del catálogo */}
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: '20px',
          border: '2px dashed #cbd5e1',
          marginTop: '40px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '24px'
          }}>
            🎉
          </div>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
            ¡Gracias por visitarnos!
          </h3>
          <p style={{ margin: 0, fontSize: '16px', color: '#64748b' }}>
            Encuentra los mejores productos al mejor precio
          </p>
        </div>
      </main>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
