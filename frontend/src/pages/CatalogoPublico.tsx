import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSubdominio } from '../hooks/useSubdominio';
import apiService from '../services/api';
import type { Producto } from '../types';

export default function CatalogoPublico() {
  const { empresa, subdominio, cargando: cargandoEmpresa } = useSubdominio();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [filtroMarca, setFiltroMarca] = useState<string>('');
  const [categorias, setCategorias] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [clienteInfo, setClienteInfo] = useState<{ nombre: string; email: string } | null>(null);

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
    <div className="catalogo-publico">
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
            <Link to="/carrito" className="nav-link">
              Carrito
            </Link>
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

      <main className="contenedor">
        {/* Filtros */}
        <div className="filtros-catalogo">
          <h2>Catálogo de Productos</h2>
          
          <div className="controles-filtros">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="filtro-select"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>

            <select
              value={filtroMarca}
              onChange={(e) => setFiltroMarca(e.target.value)}
              className="filtro-select"
            >
              <option value="">Todas las marcas</option>
              {marcas.map(marca => (
                <option key={marca} value={marca}>{marca}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid de productos */}
        {cargando ? (
          <div className="cargando-productos">
            <div className="spinner"></div>
            <p>Cargando productos...</p>
          </div>
        ) : error ? (
          <div className="error-productos">
            <p>{error}</p>
            <button onClick={cargarProductos} className="boton boton-secundario">
              Reintentar
            </button>
          </div>
        ) : productos.length === 0 ? (
          <div className="sin-productos">
            <p>No hay productos disponibles en este momento.</p>
          </div>
        ) : (
          <div className="grid-productos">
            {productos.map(producto => (
              <div key={producto.id} className="tarjeta-producto">
                <Link to={`/producto/${producto.id}`} className="link-producto">
                  <div className="imagen-producto">
                    {producto.imagenes && producto.imagenes.length > 0 ? (
                      <img 
                        src={producto.imagenes[0]} 
                        alt={producto.nombre}
                      />
                    ) : (
                      <div className="sin-imagen">
                        <span>Sin imagen</span>
                      </div>
                    )}
                    {producto.destacado && (
                      <span className="badge-destacado">Destacado</span>
                    )}
                  </div>
                  
                  <div className="info-producto">
                    <h3 className="nombre-producto">{producto.nombre}</h3>
                    
                    {producto.categoria && (
                      <p className="categoria-producto">{producto.categoria}</p>
                    )}
                    
                    {producto.marca && (
                      <p className="marca-producto">{producto.marca}</p>
                    )}
                    
                    <div className="precio-stock">
                      <span className="precio">
                        {formatearPrecio(producto.precio, empresa.moneda)}
                      </span>
                      
                      {producto.stock !== null && (
                        <span className={`stock ${producto.stock > 0 ? 'disponible' : 'agotado'}`}>
                          {producto.stock > 0 ? `${producto.stock} disponibles` : 'Agotado'}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
