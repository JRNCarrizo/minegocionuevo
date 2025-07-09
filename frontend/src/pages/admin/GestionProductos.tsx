import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import type { Producto } from '../../types';
import '../../styles/gestion-productos.css';

interface FiltrosProductos {
  nombre?: string;
  categoria?: string;
  marca?: string;
  activo?: boolean;
  stockBajo?: boolean;
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
  // Estados para paginación (TODO: implementar cuando sea necesario)
  // const [paginaActual, setPaginaActual] = useState(0);
  // const [totalPaginas, setTotalPaginas] = useState(1);
  // const [totalElementos, setTotalElementos] = useState(0);

  useEffect(() => {
    // Verificar autenticación y obtener empresaId
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    console.log('Debug - Token encontrado:', !!token); // Debug
    console.log('Debug - User string encontrado:', !!userStr); // Debug
    console.log('Debug - Contenido de localStorage user:', userStr); // Debug
    
    if (!token || !userStr) {
      console.log('Debug - Redirigiendo a login por falta de token o user');
      navigate('/admin/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      console.log('Debug - Usuario parseado:', user); // Debug
      console.log('Debug - empresaId del usuario:', user.empresaId); // Debug
      
      if (user.empresaId) {
        setEmpresaId(user.empresaId);
        console.log('Debug - empresaId establecido:', user.empresaId);
      } else {
        console.log('Debug - No se encontró empresaId en el usuario');
        setError('No se encontró información de empresa');
        // No redirigir inmediatamente, dar oportunidad de ver el error
        // navigate('/admin/login');
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
      
      console.log('Cargando productos para empresa:', empresaId);
      console.log('Filtros aplicados:', filtros);
      
      let productos: Producto[] = [];
      
      // Usar el endpoint específico para filtrar por estado si se especifica
      if (filtros.activo !== undefined) {
        console.log('Filtrando por estado activo:', filtros.activo);
        productos = await ApiService.obtenerProductosPorEstado(empresaId, filtros.activo);
      } else {
        // Obtener todos los productos (activos e inactivos)
        console.log('Obteniendo todos los productos (activos e inactivos)');
        const response = await ApiService.obtenerTodosLosProductosIncluirInactivos(empresaId);
        productos = Array.isArray(response) ? response : [];
      }

      console.log('Productos cargados del backend:', productos.length, 'productos');
      setProductos(productos);
      
      // Extraer categorías y marcas únicas de los productos obtenidos
      const categoriasUnicas = [...new Set(productos.map((p: Producto) => p.categoria).filter(Boolean) as string[])];
      const marcasUnicas = [...new Set(productos.map((p: Producto) => p.marca).filter(Boolean) as string[])];
      
      setCategorias(categoriasUnicas);
      setMarcas(marcasUnicas);
        
    } catch (error: unknown) {
      console.error('Error al cargar productos:', error);
      
      // Mostrar un mensaje de error más específico
      let mensajeError = 'Error al cargar productos del servidor. Verifica tu conexión.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string; message?: string } } };
        
        if (axiosError.response?.status === 403) {
          mensajeError = 'No tienes permisos para acceder a los productos. Verifica tu sesión.';
        } else if (axiosError.response?.status === 401) {
          mensajeError = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        }
      }
      
      setError(mensajeError);
      setProductos([]);
    } finally {
      setCargando(false);
    }
  }, [empresaId, filtros]);

  useEffect(() => {
    if (empresaId) {
      cargarProductos();
    }
  }, [empresaId, cargarProductos]);

  // Función para filtrar productos
  const productosFiltrados = productos.filter(producto => {
    // Filtro por búsqueda
    if (busqueda && !producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
        !(producto.descripcion?.toLowerCase().includes(busqueda.toLowerCase()))) {
      return false;
    }

    // Filtro por categoría
    if (filtros.categoria && producto.categoria !== filtros.categoria) {
      return false;
    }

    // Filtro por marca
    if (filtros.marca && producto.marca !== filtros.marca) {
      return false;
    }

    // Filtro por estado activo
    if (filtros.activo !== undefined && producto.activo !== filtros.activo) {
      return false;
    }

    // Filtro por stock bajo
    if (filtros.stockBajo && producto.stock > producto.stockMinimo) {
      return false;
    }

    return true;
  });

  const limpiarFiltros = () => {
    setFiltros({});
    setBusqueda('');
  };

  const cambiarStock = async (producto: Producto, cambio: number) => {
    if (!empresaId) {
      console.error('No hay empresaId para cambiar stock');
      return;
    }
    
    const nuevoStock = Math.max(0, producto.stock + cambio);
    
    console.log('=== DEBUG CAMBIAR STOCK ===');
    console.log('Producto ID:', producto.id);
    console.log('Stock actual:', producto.stock);
    console.log('Cambio:', cambio);
    console.log('Nuevo stock:', nuevoStock);
    console.log('EmpresaId:', empresaId);
    
    try {
      // Usar el endpoint específico de stock
      const response = await ApiService.actualizarStock(
        empresaId,
        producto.id,
        nuevoStock
      );

      console.log('Respuesta de actualización de stock:', response);

      if (response && response.data) {
        // Actualizar el estado local
        setProductos(productos.map(p => 
          p.id === producto.id 
            ? { ...p, stock: nuevoStock }
            : p
        ));
        
        console.log(`Stock actualizado exitosamente para producto ${producto.id}: ${producto.stock} -> ${nuevoStock}`);
      } else {
        console.error('Respuesta inesperada al actualizar stock:', response);
      }
    } catch (error) {
      console.error('Error detallado al actualizar stock:', error);
      
      // Mostrar información del error para debug
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown } };
        console.error('Status del error:', axiosError.response?.status);
        console.error('Data del error:', axiosError.response?.data);
      }
    }
  };

  const irADetalle = (producto: Producto) => {
    navigate(`/admin/productos/${producto.id}`);
  };

  const irAEditar = (producto: Producto) => {
    navigate(`/admin/productos/editar/${producto.id}`);
  };

  if (cargando) {
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
        {/* Navegación superior */}
        <div className="navegacion-superior">
          <button 
            onClick={() => navigate('/admin/dashboard')}
            className="boton-volver"
          >
            ← Volver al Dashboard
          </button>
        </div>

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

        {error && (
          <div className="mensaje-error">
            <p>{error}</p>
            <p>EmpresaId: {empresaId}</p>
            <p>Token: {localStorage.getItem('token') ? 'Presente' : 'Ausente'}</p>
            {localStorage.getItem('token') && (
              <details>
                <summary>Ver token (debug)</summary>
                <small style={{wordBreak: 'break-all'}}>{localStorage.getItem('token')}</small>
              </details>
            )}
          </div>
        )}

        {/* Barra de búsqueda y filtros */}
        {productos.length > 0 && (
          <div className="controles-productos">
            <div className="barra-busqueda">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="input-busqueda"
              />
            </div>

            <div className="filtros-productos">
              <select 
                value={filtros.categoria || ''} 
                onChange={(e) => setFiltros({...filtros, categoria: e.target.value || undefined})}
                className="select-filtro"
              >
                <option value="">Todas las categorías</option>
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>

              <select 
                value={filtros.marca || ''} 
                onChange={(e) => setFiltros({...filtros, marca: e.target.value || undefined})}
                className="select-filtro"
              >
                <option value="">Todas las marcas</option>
                {marcas.map(marca => (
                  <option key={marca} value={marca}>{marca}</option>
                ))}
              </select>

              <select 
                value={filtros.activo === undefined ? '' : filtros.activo.toString()} 
                onChange={(e) => setFiltros({...filtros, activo: e.target.value === '' ? undefined : e.target.value === 'true'})}
                className="select-filtro"
              >
                <option value="">Todos los estados</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>

              <label className="filtro-checkbox">
                <input
                  type="checkbox"
                  checked={filtros.stockBajo || false}
                  onChange={(e) => setFiltros({...filtros, stockBajo: e.target.checked || undefined})}
                />
                Solo stock bajo
              </label>

              {(busqueda || Object.keys(filtros).length > 0) && (
                <button onClick={limpiarFiltros} className="boton-limpiar">
                  Limpiar filtros
                </button>
              )}
            </div>

            <div className="controles-vista">
              <div className="info-resultados">
                {productosFiltrados.length} de {productos.length} productos
              </div>
              
              <div className="selector-vista">
                <button 
                  className={`boton-vista ${vista === 'lista' ? 'activo' : ''}`}
                  onClick={() => setVista('lista')}
                  title="Vista de lista"
                >
                  ☰
                </button>
                <button 
                  className={`boton-vista ${vista === 'cuadricula' ? 'activo' : ''}`}
                  onClick={() => setVista('cuadricula')}
                  title="Vista de cuadrícula"
                >
                  ⊞
                </button>
              </div>
            </div>
          </div>
        )}

        {productosFiltrados.length === 0 && !cargando && !error && productos.length > 0 && (
          <div className="sin-resultados">
            <div className="ilustracion">🔍</div>
            <h3>No se encontraron productos</h3>
            <p>Intenta ajustar los filtros de búsqueda</p>
            <button onClick={limpiarFiltros} className="boton-secundario">
              Limpiar filtros
            </button>
          </div>
        )}

        {productos.length === 0 && !cargando && !error && (
          <div className="sin-productos">
            <div className="ilustracion">📦</div>
            <h3>No se encontraron productos</h3>
            <p>Comienza agregando tu primer producto al catálogo</p>
            <button 
              className="boton-primario"
              onClick={() => navigate('/admin/productos/nuevo')}
            >
              Agregar Producto
            </button>
          </div>
        )}

        {/* Vista de productos */}
        {productosFiltrados.length > 0 && (
          <>
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
                  
                  {productosFiltrados.map(producto => (
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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="vista-cuadricula">
                <div className="grid-productos">
                  {productosFiltrados.map(producto => (
                    <div key={producto.id} className="tarjeta-producto">
                      <div className="imagen-tarjeta">
                        <img 
                          src={producto.imagenes?.[0] || '/api/placeholder/200/200'} 
                          alt={producto.nombre}
                          onClick={() => irADetalle(producto)}
                        />
                        {producto.destacado && <span className="badge-destacado">Destacado</span>}
                        {!producto.activo && <span className="badge-inactivo">Inactivo</span>}
                        {producto.stock <= producto.stockMinimo && <span className="badge-stock-bajo">Stock bajo</span>}
                      </div>

                      <div className="contenido-tarjeta">
                        <div className="info-principal">
                          <h3 onClick={() => irADetalle(producto)}>{producto.nombre}</h3>
                          <p className="descripcion">{producto.descripcion}</p>
                          {producto.marca && <span className="marca">Marca: {producto.marca}</span>}
                          <span className="categoria">{producto.categoria}</span>
                        </div>

                        <div className="precio-stock">
                          <div className="precio">
                            <span className="valor">${producto.precio.toLocaleString()}</span>
                            {producto.unidad && <span className="unidad">/ {producto.unidad}</span>}
                          </div>

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
                        </div>

                        <div className="acciones-tarjeta">
                          <button 
                            onClick={() => irADetalle(producto)}
                            className="boton-accion-tarjeta boton-detalle"
                          >
                            Ver detalle
                          </button>
                          <button 
                            onClick={() => irAEditar(producto)}
                            className="boton-accion-tarjeta boton-editar"
                          >
                            Editar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GestionProductos;
