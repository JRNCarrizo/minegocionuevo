import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// import ApiService from '../../services/api'; // Temporalmente comentado para usar datos mock
import type { Producto } from '../../types';

interface FiltrosProductos {
  nombre?: string;
  categoria?: string;
  marca?: string;
}

type VistaProducto = 'lista' | 'cuadricula';

const GestionProductos: React.FC = () => {
  const navigate = useNavigate();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [vista, setVista] = useState<VistaProducto>('lista');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState<FiltrosProductos>({});
  const [busqueda, setBusqueda] = useState('');
  const [categorias, setCategorias] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [empresaId, setEmpresaId] = useState<number | null>(null);

  // Paginación
  // Estados para paginación (TODO: implementar cuando sea necesario)
  // const [paginaActual, setPaginaActual] = useState(0);
  // const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalElementos, setTotalElementos] = useState(0);

  useEffect(() => {
    // Verificar autenticación y obtener empresaId
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    console.log('Debug - Token encontrado:', !!token);
    console.log('Debug - User string encontrado:', !!userStr);
    console.log('Debug - Contenido de localStorage user:', userStr);
    
    if (!token || !userStr) {
      console.log('Debug - Redirigiendo a login por falta de token o user');
      navigate('/admin/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      console.log('Debug - Usuario parseado:', user);
      console.log('Debug - empresaId del usuario:', user.empresaId);
      
      if (user.empresaId) {
        setEmpresaId(user.empresaId);
        console.log('Debug - empresaId establecido:', user.empresaId);
      } else {
        console.log('Debug - No se encontró empresaId en el usuario');
        setError('No se encontró información de empresa');
      }
    } catch (error) {
      console.error('Error al parsear usuario:', error);
      navigate('/admin/login');
    }
  }, [navigate]);

  const cargarProductos = useCallback(async () => {
    if (!empresaId) return;
    
    try {
      setCargando(true);
      setError('');
      
      // Datos mock temporales
      const mockProductos: Producto[] = [
        {
          id: 1,
          nombre: 'Laptop Dell Inspiron 15',
          descripcion: 'Laptop para uso profesional con procesador Intel i5, 8GB RAM y 256GB SSD.',
          precio: 899.99,
          stock: 5,
          stockMinimo: 5,
          categoria: 'Electrónicos',
          marca: 'Dell',
          unidad: 'unidad',
          activo: true,
          destacado: true,
          imagenes: ['/api/placeholder/200/200'],
          fechaCreacion: new Date('2024-01-15').toISOString(),
          fechaActualizacion: new Date().toISOString()
        },
        {
          id: 2,
          nombre: 'Mouse Inalámbrico Logitech',
          descripcion: 'Mouse inalámbrico ergonómico con conexión USB.',
          precio: 29.99,
          stock: 50,
          stockMinimo: 10,
          categoria: 'Electrónicos',
          marca: 'Logitech',
          unidad: 'unidad',
          activo: true,
          destacado: false,
          imagenes: ['/api/placeholder/200/200'],
          fechaCreacion: new Date('2024-02-01').toISOString(),
          fechaActualizacion: new Date().toISOString()
        },
        {
          id: 3,
          nombre: 'Teclado Mecánico RGB',
          descripcion: 'Teclado mecánico con retroiluminación RGB personalizable.',
          precio: 79.99,
          stock: 25,
          stockMinimo: 5,
          categoria: 'Electrónicos',
          marca: 'Corsair',
          unidad: 'unidad',
          activo: true,
          destacado: true,
          imagenes: ['/api/placeholder/200/200'],
          fechaCreacion: new Date('2024-01-20').toISOString(),
          fechaActualizacion: new Date().toISOString()
        },
        {
          id: 4,
          nombre: 'Monitor 24" Full HD',
          descripcion: 'Monitor LED de 24 pulgadas con resolución Full HD 1920x1080.',
          precio: 199.99,
          stock: 12,
          stockMinimo: 3,
          categoria: 'Electrónicos',
          marca: 'Samsung',
          unidad: 'unidad',
          activo: true,
          destacado: false,
          imagenes: ['/api/placeholder/200/200'],
          fechaCreacion: new Date('2024-02-10').toISOString(),
          fechaActualizacion: new Date().toISOString()
        },
        {
          id: 5,
          nombre: 'Silla Ergonómica de Oficina',
          descripcion: 'Silla ergonómica con soporte lumbar y reposabrazos ajustables.',
          precio: 299.99,
          stock: 3,
          stockMinimo: 5,
          categoria: 'Mobiliario',
          marca: 'Herman Miller',
          unidad: 'unidad',
          activo: true,
          destacado: true,
          imagenes: ['/api/placeholder/200/200'],
          fechaCreacion: new Date('2024-01-25').toISOString(),
          fechaActualizacion: new Date().toISOString()
        }
      ];

      setProductos(mockProductos);
      setTotalElementos(mockProductos.length);
      
      // TODO: Implementar paginación real cuando sea necesario
      // setTotalPaginas(1);
      
      // También cargamos categorías y marcas
      const categoriasUnicas = [...new Set(mockProductos.map(p => p.categoria).filter(Boolean))] as string[];
      const marcasUnicas = [...new Set(mockProductos.map(p => p.marca).filter(Boolean))] as string[];
      setCategorias(categoriasUnicas);
      setMarcas(marcasUnicas);
      
    } catch (error) {
      setError('Error al cargar productos');
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  }, [empresaId]);

  useEffect(() => {
    if (empresaId) {
      cargarProductos();
    }
  }, [cargarProductos, empresaId]);

  const buscarProductos = () => {
    cargarProductos();
  };

  const limpiarFiltros = () => {
    setFiltros({});
    setBusqueda('');
  };

  const cambiarStock = async (producto: Producto, cambio: number) => {
    const nuevoStock = Math.max(0, producto.stock + cambio);
    
    try {
      // Actualizar el producto en la lista local (simulando actualización)
      setProductos(productos.map(p => 
        p.id === producto.id 
          ? { ...p, stock: nuevoStock }
          : p
      ));
    } catch (error) {
      setError('Error al actualizar stock');
      console.error('Error:', error);
    }
  };

  const irADetalle = (producto: Producto) => {
    navigate(`/admin/productos/${producto.id}`);
  };

  const irAEditar = (producto: Producto) => {
    navigate(`/admin/productos/editar/${producto.id}`);
  };

  const eliminarProducto = async (producto: Producto) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${producto.nombre}"?`)) {
      return;
    }

    try {
      // Eliminar de la lista local (simulando eliminación)
      setProductos(productos.filter(p => p.id !== producto.id));
    } catch (error) {
      setError('Error al eliminar producto');
      console.error('Error:', error);
    }
  };

  if (cargando && productos.length === 0) {
    return (
      <div className="pagina-productos">
        <div className="contenedor-principal">
          <div className="cargando">
            <div className="spinner"></div>
            <p>Cargando productos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pagina-productos">
      <div className="contenedor-principal">
        {/* Encabezado */}
        <div className="encabezado-productos">
          <div className="titulo-seccion">
            <h1>Gestión de Productos</h1>
            <p>Administra tu inventario y catálogo de productos</p>
          </div>
          
          <div className="acciones-principales">
            <button 
              className="boton-primario"
              onClick={() => navigate('/admin/productos/nuevo')}
            >
              <span className="icono">+</span>
              Nuevo Producto
            </button>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="seccion-filtros">
          <div className="barra-busqueda">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && buscarProductos()}
            />
            <button onClick={buscarProductos} className="boton-buscar">
              🔍
            </button>
          </div>

          <div className="filtros-avanzados">
            <select
              value={filtros.categoria || ''}
              onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value || undefined })}
            >
              <option value="">Todas las categorías</option>
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>

            <select
              value={filtros.marca || ''}
              onChange={(e) => setFiltros({ ...filtros, marca: e.target.value || undefined })}
            >
              <option value="">Todas las marcas</option>
              {marcas.map(marca => (
                <option key={marca} value={marca}>{marca}</option>
              ))}
            </select>

            <button onClick={limpiarFiltros} className="boton-secundario">
              Limpiar filtros
            </button>
          </div>

          <div className="opciones-vista">
            <div className="toggle-vista">
              <button
                className={`boton-vista ${vista === 'lista' ? 'activo' : ''}`}
                onClick={() => setVista('lista')}
              >
                ☰ Lista
              </button>
              <button
                className={`boton-vista ${vista === 'cuadricula' ? 'activo' : ''}`}
                onClick={() => setVista('cuadricula')}
              >
                ⊞ Cuadrícula
              </button>
            </div>
          </div>
        </div>

        {/* Información de resultados */}
        <div className="info-resultados">
          <p>
            Mostrando {productos.length} de {totalElementos} productos
            {Object.keys(filtros).length > 0 && ' (filtrados)'}
          </p>
        </div>

        {error && (
          <div className="mensaje-error">
            {error}
          </div>
        )}

        {/* Lista de productos */}
        {vista === 'lista' ? (
          <div className="vista-lista">
            <div className="tabla-productos">
              <div className="encabezado-tabla">
                <div className="columna-imagen">Imagen</div>
                <div className="columna-nombre">Producto</div>
                <div className="columna-precio">Precio</div>
                <div className="columna-stock">Stock</div>
                <div className="columna-categoria">Categoría</div>
                <div className="columna-estado">Estado</div>
                <div className="columna-acciones">Acciones</div>
              </div>
              
              {productos.map(producto => (
                <div key={producto.id} className="fila-producto">
                  <div className="columna-imagen">
                    <img 
                      src={producto.imagenes?.[0] || '/api/placeholder/60/60'} 
                      alt={producto.nombre}
                      className="imagen-producto-mini"
                    />
                  </div>
                  
                  <div className="columna-nombre">
                    <div className="info-producto">
                      <h3 onClick={() => irADetalle(producto)}>{producto.nombre}</h3>
                      <p>{producto.descripcion}</p>
                      {producto.marca && <span className="marca">Marca: {producto.marca}</span>}
                    </div>
                  </div>
                  
                  <div className="columna-precio">
                    <span className="precio">${producto.precio.toLocaleString()}</span>
                    {producto.unidad && <span className="unidad">/ {producto.unidad}</span>}
                  </div>
                  
                  <div className="columna-stock">
                    <div className="control-stock">
                      <button 
                        onClick={() => cambiarStock(producto, -1)}
                        className="boton-stock"
                        disabled={producto.stock <= 0}
                      >
                        -
                      </button>
                      <span className={`stock ${producto.stock <= producto.stockMinimo ? 'stock-bajo' : ''}`}>
                        {producto.stock}
                      </span>
                      <button 
                        onClick={() => cambiarStock(producto, 1)}
                        className="boton-stock"
                      >
                        +
                      </button>
                    </div>
                    {producto.stock <= producto.stockMinimo && (
                      <span className="alerta-stock">¡Stock bajo!</span>
                    )}
                  </div>
                  
                  <div className="columna-categoria">
                    {producto.categoria || 'Sin categoría'}
                  </div>
                  
                  <div className="columna-estado">
                    <span className={`estado ${producto.activo ? 'activo' : 'inactivo'}`}>
                      {producto.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    {producto.destacado && <span className="destacado">Destacado</span>}
                  </div>
                  
                  <div className="columna-acciones">
                    <div className="acciones-producto">
                      <button 
                        onClick={() => irADetalle(producto)}
                        className="boton-accion"
                        title="Ver detalle"
                      >
                        👁️
                      </button>
                      <button 
                        onClick={() => irAEditar(producto)}
                        className="boton-accion"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => eliminarProducto(producto)}
                        className="boton-accion peligro"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="vista-cuadricula">
            <div className="grilla-productos">
              {productos.map(producto => (
                <div key={producto.id} className="tarjeta-producto">
                  <div className="imagen-container">
                    <img 
                      src={producto.imagenes?.[0] || '/api/placeholder/200/200'} 
                      alt={producto.nombre}
                      className="imagen-producto"
                      onClick={() => irADetalle(producto)}
                    />
                    <div className="overlay-acciones">
                      <button 
                        onClick={() => irADetalle(producto)}
                        className="boton-overlay"
                        title="Ver detalle"
                      >
                        👁️
                      </button>
                      <button 
                        onClick={() => irAEditar(producto)}
                        className="boton-overlay"
                        title="Editar"
                      >
                        ✏️
                      </button>
                    </div>
                    {producto.destacado && <span className="badge-destacado">Destacado</span>}
                    {!producto.activo && <span className="badge-inactivo">Inactivo</span>}
                  </div>
                  
                  <div className="info-tarjeta">
                    <h3 onClick={() => irADetalle(producto)}>{producto.nombre}</h3>
                    <p className="descripcion">{producto.descripcion}</p>
                    
                    <div className="detalles-producto">
                      <div className="precio-stock">
                        <span className="precio">${producto.precio.toLocaleString()}</span>
                        <div className="control-stock-mini">
                          <button 
                            onClick={() => cambiarStock(producto, -1)}
                            className="boton-stock-mini"
                            disabled={producto.stock <= 0}
                          >
                            -
                          </button>
                          <span className={`stock ${producto.stock <= producto.stockMinimo ? 'stock-bajo' : ''}`}>
                            {producto.stock}
                          </span>
                          <button 
                            onClick={() => cambiarStock(producto, 1)}
                            className="boton-stock-mini"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      
                      <div className="metadata">
                        {producto.categoria && <span className="categoria">{producto.categoria}</span>}
                        {producto.marca && <span className="marca">{producto.marca}</span>}
                      </div>
                      
                      {producto.stock <= producto.stockMinimo && (
                        <div className="alerta-stock">¡Stock bajo!</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {productos.length === 0 && !cargando && (
          <div className="sin-productos">
            <div className="ilustracion">📦</div>
            <h3>No se encontraron productos</h3>
            <p>
              {Object.keys(filtros).length > 0 || busqueda
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza agregando tu primer producto al catálogo'
              }
            </p>
            <button 
              className="boton-primario"
              onClick={() => navigate('/admin/productos/nuevo')}
            >
              Agregar Producto
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionProductos;
