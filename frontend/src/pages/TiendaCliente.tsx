import { useState, useEffect, useCallback } from 'react';
import { useSubdominio } from '../hooks/useSubdominio';
import type { Producto } from '../types';
import apiService from '../services/api';

const TiendaCliente = () => {
  const { empresa, subdominio, cargando: cargandoEmpresa, error: errorEmpresa } = useSubdominio();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [errorProductos, setErrorProductos] = useState<string | null>(null);

  const obtenerProductos = useCallback(async () => {
    if (!empresa?.id) return;

    try {
      setCargandoProductos(true);
      setErrorProductos(null);
      
      const response = await apiService.obtenerProductos(empresa.id, 0, 50);
      setProductos(response.content || []);
    } catch (error) {
      console.error('Error al obtener productos:', error);
      setErrorProductos('Error al cargar los productos');
    } finally {
      setCargandoProductos(false);
    }
  }, [empresa?.id]);

  useEffect(() => {
    if (empresa?.id) {
      obtenerProductos();
    }
  }, [empresa?.id, obtenerProductos]);

  if (cargandoEmpresa) {
    return (
      <div className="pagina-cargando">
        <div className="spinner"></div>
        <p>Cargando tienda...</p>
      </div>
    );
  }

  if (errorEmpresa || !empresa) {
    return (
      <div className="pagina-error">
        <div className="contenido-error">
          <h1>Tienda no encontrada</h1>
          <p>La tienda que buscas no existe o no está disponible.</p>
          <p>Verifica la URL e intenta nuevamente.</p>
        </div>
      </div>
    );
  }

  const estilosPersonalizados = empresa.colorPrimario ? {
    '--color-primario': empresa.colorPrimario,
    '--color-secundario': empresa.colorSecundario || '#6366f1'
  } as React.CSSProperties : {};

  return (
    <div className="tienda-cliente" style={estilosPersonalizados}>
      {/* Header de la tienda */}
      <header className="header-tienda">
        <div className="contenedor">
          <div className="logo-empresa">
            {empresa.logoUrl ? (
              <img src={empresa.logoUrl} alt={empresa.nombre} className="logo-img" />
            ) : (
              <div className="logo-texto">{empresa.nombre}</div>
            )}
          </div>
          
          <nav className="nav-tienda">
            <a href="#productos" className="nav-link">Productos</a>
            <a href="#sobre-nosotros" className="nav-link">Sobre Nosotros</a>
            <a href="#contacto" className="nav-link">Contacto</a>
            <button className="btn-carrito">
              <span className="carrito-icono">🛒</span>
              <span className="carrito-contador">0</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-tienda">
        <div className="contenedor">
          <div className="hero-contenido">
            <h1 className="hero-titulo">Bienvenido a {empresa.nombre}</h1>
            <p className="hero-descripcion">
              Descubre nuestros productos de calidad y encuentra exactamente lo que necesitas.
            </p>
            <button className="btn-primario btn-hero">Ver Productos</button>
          </div>
        </div>
      </section>

      {/* Sección de productos */}
      <section id="productos" className="seccion-productos">
        <div className="contenedor">
          <h2 className="titulo-seccion">Nuestros Productos</h2>
          
          {cargandoProductos ? (
            <div className="productos-cargando">
              <div className="spinner"></div>
              <p>Cargando productos...</p>
            </div>
          ) : errorProductos ? (
            <div className="productos-error">
              <p>{errorProductos}</p>
              <button onClick={obtenerProductos} className="btn-secundario">
                Reintentar
              </button>
            </div>
          ) : productos.length === 0 ? (
            <div className="productos-vacio">
              <p>Próximamente tendremos productos disponibles.</p>
            </div>
          ) : (
            <div className="grid-productos">
              {productos.map((producto) => (
                <div key={producto.id} className="tarjeta-producto">
                  <div className="producto-imagen">
                    {producto.imagenes && producto.imagenes.length > 0 ? (
                      <img src={producto.imagenes[0]} alt={producto.nombre} />
                    ) : (
                      <div className="placeholder-imagen">📦</div>
                    )}
                  </div>
                  <div className="producto-info">
                    <h3 className="producto-nombre">{producto.nombre}</h3>
                    <p className="producto-descripcion">{producto.descripcion}</p>
                    <div className="producto-precio">
                      ${producto.precio.toFixed(2)}
                    </div>
                    <div className="producto-stock">
                      {producto.stock > 0 ? (
                        <span className="stock-disponible">En stock ({producto.stock})</span>
                      ) : (
                        <span className="stock-agotado">Agotado</span>
                      )}
                    </div>
                    <button 
                      className="btn-agregar-carrito"
                      disabled={producto.stock === 0}
                    >
                      {producto.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-tienda">
        <div className="contenedor">
          <div className="footer-contenido">
            <div className="footer-seccion">
              <h4>{empresa.nombre}</h4>
              <p>Tu tienda de confianza</p>
            </div>
            <div className="footer-seccion">
              <h4>Contacto</h4>
              <p>Email: info@{subdominio}.com</p>
              <p>Teléfono: +1 234 567 890</p>
            </div>
            <div className="footer-seccion">
              <h4>Síguenos</h4>
              <div className="redes-sociales">
                <a href="#" className="red-social">Facebook</a>
                <a href="#" className="red-social">Instagram</a>
                <a href="#" className="red-social">Twitter</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 {empresa.nombre}. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TiendaCliente;
