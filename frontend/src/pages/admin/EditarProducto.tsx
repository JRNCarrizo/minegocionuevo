import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import GestorImagenes from '../../components/GestorImagenes';
import '../../styles/gestor-imagenes.css';

const EditarProducto: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Usuario logueado
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const empresaId = user.empresaId;

  // Formulario
  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    stockMinimo: 5,
    categoria: '',
    marca: '',
    unidad: '',
    activo: true,
    destacado: false,
    imagenes: [] as string[]
  });

  const [categorias, setCategorias] = useState<string[]>([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [mostrarOtraCategoria, setMostrarOtraCategoria] = useState(false);

  const manejarCambioImagenes = (imagenes: string[]) => {
    setFormulario(prev => ({
      ...prev,
      imagenes
    }));
  };

  const cargarProducto = useCallback(async () => {
    if (!id) {
      setError('ID de producto no válido');
      setCargando(false);
      return;
    }

    if (!empresaId) {
      setError('No se encontró información de empresa');
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError('');
      
      console.log('Cargando producto para edición:', id, 'empresaId:', empresaId);
      
      const response = await ApiService.obtenerProducto(empresaId, parseInt(id), true); // incluirInactivos = true
      
      console.log('Respuesta al cargar producto:', response);
      
      if (response && response.data) {
        const producto = response.data;
        console.log('Producto cargado para edición:', producto);
        console.log('=== DEBUG IMÁGENES ===');
        console.log('Imágenes en el producto:', producto.imagenes);
        console.log('Cantidad de imágenes:', producto.imagenes?.length || 0);
        console.log('Tipos de imágenes:', producto.imagenes?.map(img => typeof img));
        console.log('=== FIN DEBUG IMÁGENES ===');
        
        setFormulario({
          nombre: producto.nombre,
          descripcion: producto.descripcion || '',
          precio: producto.precio,
          stock: producto.stock,
          stockMinimo: producto.stockMinimo,
          categoria: producto.categoria || '',
          marca: producto.marca || '',
          unidad: producto.unidad || '',
          activo: producto.activo,
          destacado: producto.destacado,
          imagenes: producto.imagenes || []
        });
      } else {
        console.log('Respuesta inesperada:', response);
        setError('Producto no encontrado o respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('Error detallado al cargar producto:', error);
      
      let mensajeError = 'Error al cargar el producto';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown } };
        console.error('Respuesta del servidor:', axiosError.response);
        
        if (axiosError.response?.status === 404) {
          mensajeError = 'Producto no encontrado. Puede haber sido eliminado.';
        } else if (axiosError.response?.status === 403) {
          mensajeError = 'No tienes permisos para acceder a este producto.';
        } else if (axiosError.response?.status === 401) {
          mensajeError = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        }
      }
      
      setError(mensajeError);
    } finally {
      setCargando(false);
    }
  }, [id, empresaId]);

  const cargarCategorias = useCallback(async () => {
    try {
      setCargandoCategorias(true);
      const response = await ApiService.obtenerCategorias(empresaId);
      if (response.data) {
        setCategorias(response.data);
        console.log('Categorías cargadas:', response.data);
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      // No mostramos error porque las categorías son opcionales
    } finally {
      setCargandoCategorias(false);
    }
  }, [empresaId]);

  useEffect(() => {
    if (id) {
      cargarProducto();
    }
    cargarCategorias();
  }, [id, cargarProducto, cargarCategorias]);

  const manejarCambio = (campo: string, valor: string | number | boolean) => {
    setFormulario({ ...formulario, [campo]: valor });
    setError('');
    setExito('');
  };

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formulario.nombre.trim()) {
      setError('El nombre del producto es obligatorio');
      return;
    }

    if (formulario.precio <= 0) {
      setError('El precio debe ser mayor a cero');
      return;
    }

    if (formulario.stock < 0) {
      setError('El stock no puede ser negativo');
      return;
    }

    try {
      setGuardando(true);
      setError('');
      
      const datosProducto = {
        ...formulario,
        precio: Number(formulario.precio),
        stock: Number(formulario.stock),
        stockMinimo: Number(formulario.stockMinimo)
      };

      if (id) {
        // Editar producto existente
        console.log('Actualizando producto con datos:', datosProducto);
        
        const response = await ApiService.actualizarProducto(empresaId, parseInt(id), datosProducto);
        
        console.log('Respuesta de actualización:', response);
        
        if (response && response.data) {
          console.log('Producto actualizado exitosamente:', response.data);
          setExito('Producto actualizado correctamente');
          
          // Navegar de vuelta a la lista de productos después de mostrar el mensaje de éxito
          setTimeout(() => {
            navigate('/admin/productos');
          }, 1500);
        } else {
          console.log('Respuesta inesperada al actualizar:', response);
          setError('Respuesta inesperada del servidor');
        }
      } else {
        // Crear nuevo producto
        const response = await ApiService.crearProducto(empresaId, datosProducto);
        
        if (response.data) {
          setExito('Producto creado correctamente');
          setTimeout(() => {
            navigate('/admin/productos');
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error detallado al guardar producto:', error);
      
      let mensajeError = 'Error al guardar el producto';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
        console.error('Respuesta del servidor:', axiosError.response);
        
        if (axiosError.response?.data?.error) {
          mensajeError = axiosError.response.data.error;
        } else if (axiosError.response?.status === 404) {
          mensajeError = 'Producto no encontrado. Puede haber sido eliminado.';
        } else if (axiosError.response?.status === 403) {
          mensajeError = 'No tienes permisos para realizar esta acción.';
        } else if (axiosError.response?.status === 401) {
          mensajeError = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        } else if (axiosError.response?.status === 400) {
          mensajeError = 'Datos de producto inválidos. Verifica la información ingresada.';
        }
      }
      
      setError(mensajeError);
      
      // Limpiar mensaje de error después de 5 segundos
      setTimeout(() => {
        setError('');
      }, 5000);
      console.error('Error:', error);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="pagina-editar-producto">
        <div className="contenedor-principal">
          <div className="cargando">
            <div className="spinner"></div>
            <p>Cargando producto...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-pantalla-minimo" style={{ backgroundColor: '#f8fafc' }}>
      {/* Navegación */}
      <nav className="navbar">
        <div className="contenedor">
          <div className="navbar-contenido">
            <button 
              onClick={() => navigate('/admin/productos')}
              className="logo"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ← miNegocio - Admin
            </button>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <div className="contenedor py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="titulo-2 mb-2">{id ? 'Editar Producto' : 'Nuevo Producto'}</h1>
            <p className="texto-gris">
              {id ? 'Modifica los datos del producto.' : 'Completa los datos del producto para añadirlo a tu inventario.'}
            </p>
          </div>

          {error && (
            <div className="mensaje-error mb-6">
              {error}
            </div>
          )}

          {exito && (
            <div className="mensaje-exito mb-6">
              {exito}
            </div>
          )}

          <div className="tarjeta">
            <form onSubmit={manejarSubmit} className="space-y-6">
              {/* Nombre */}
              <div>
                <label htmlFor="nombre" className="etiqueta">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formulario.nombre}
                  onChange={(e) => manejarCambio('nombre', e.target.value)}
                  className="campo"
                  placeholder="Ej: Camiseta Básica Algodón"
                  required
                />
              </div>

              {/* Marca */}
              <div>
                <label htmlFor="marca" className="etiqueta">
                  Marca
                </label>
                <input
                  type="text"
                  id="marca"
                  name="marca"
                  value={formulario.marca}
                  onChange={(e) => manejarCambio('marca', e.target.value)}
                  className="campo"
                  placeholder="Ej: Nike, Apple, Samsung..."
                />
              </div>

              {/* Descripción */}
              <div>
                <label htmlFor="descripcion" className="etiqueta">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formulario.descripcion}
                  onChange={(e) => manejarCambio('descripcion', e.target.value)}
                  rows={4}
                  className="campo"
                  placeholder="Describe las características del producto..."
                />
              </div>

              {/* Precio y Unidad */}
              <div className="grid grid-2">
                <div>
                  <label htmlFor="precio" className="etiqueta">
                    Precio ($) *
                  </label>
                  <input
                    type="number"
                    id="precio"
                    name="precio"
                    value={formulario.precio}
                    onChange={(e) => manejarCambio('precio', e.target.value)}
                    className="campo"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="unidad" className="etiqueta">
                    Unidad
                  </label>
                  <input
                    type="text"
                    id="unidad"
                    name="unidad"
                    value={formulario.unidad}
                    onChange={(e) => manejarCambio('unidad', e.target.value)}
                    className="campo"
                    placeholder="ej: kg, litro, unidad"
                  />
                </div>
              </div>

              {/* Stock y Stock Mínimo */}
              <div className="grid grid-2">
                <div>
                  <label htmlFor="stock" className="etiqueta">
                    Stock Actual *
                  </label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formulario.stock}
                    onChange={(e) => manejarCambio('stock', e.target.value)}
                    className="campo"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="stockMinimo" className="etiqueta">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    id="stockMinimo"
                    name="stockMinimo"
                    value={formulario.stockMinimo}
                    onChange={(e) => manejarCambio('stockMinimo', e.target.value)}
                    className="campo"
                    placeholder="5"
                    min="0"
                  />
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label htmlFor="categoria" className="etiqueta">
                  Categoría *
                </label>
                {cargandoCategorias ? (
                  <div className="campo" style={{ padding: '12px', color: '#666' }}>
                    Cargando categorías...
                  </div>
                ) : (
                  <>
                    <select
                      id="categoria"
                      name="categoria"
                      value={mostrarOtraCategoria ? '__nueva__' : formulario.categoria}
                      onChange={(e) => {
                        if (e.target.value === '__nueva__') {
                          setMostrarOtraCategoria(true);
                          manejarCambio('categoria', '');
                        } else {
                          setMostrarOtraCategoria(false);
                          manejarCambio('categoria', e.target.value);
                        }
                      }}
                      className="campo"
                      required
                    >
                      <option value="">Selecciona una categoría</option>
                      {categorias.map(categoria => (
                        <option key={categoria} value={categoria}>
                          {categoria}
                        </option>
                      ))}
                      <option value="__nueva__">+ Agregar nueva categoría</option>
                    </select>
                    
                    {mostrarOtraCategoria && (
                      <div style={{ marginTop: '10px' }}>
                        <input
                          type="text"
                          placeholder="Escribe el nombre de la nueva categoría"
                          className="campo"
                          value={formulario.categoria}
                          onChange={(e) => manejarCambio('categoria', e.target.value)}
                          autoFocus
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Imágenes */}
              <div>
                <GestorImagenes
                  empresaId={empresaId}
                  imagenesIniciales={formulario.imagenes}
                  onChange={manejarCambioImagenes}
                  maxImagenes={5}
                  disabled={guardando}
                />
              </div>

              {/* Checkboxes para estado del producto */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formulario.activo}
                    onChange={(e) => manejarCambio('activo', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="activo" className="etiqueta" style={{ margin: 0 }}>
                    Producto activo
                  </label>
                </div>
                <p className="texto-pequeno texto-gris -mt-1">
                  El producto aparecerá en el catálogo público
                </p>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="destacado"
                    checked={formulario.destacado}
                    onChange={(e) => manejarCambio('destacado', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="destacado" className="etiqueta" style={{ margin: 0 }}>
                    Producto destacado
                  </label>
                </div>
                <p className="texto-pequeno texto-gris -mt-1">
                  El producto aparecerá en secciones especiales
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={guardando}
                  className="boton boton-primario flex-1"
                >
                  {guardando ? (id ? 'Actualizando...' : 'Creando...') : (id ? 'Actualizar Producto' : 'Crear Producto')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/productos')}
                  className="boton boton-secundario flex-1"
                  disabled={guardando}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditarProducto;
