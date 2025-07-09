import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import GestorImagenes from '../../components/GestorImagenes';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import '../../styles/gestor-imagenes.css';

export default function NuevoProducto() {
  const navigate = useNavigate();
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  
  // Usuario logueado
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const empresaId = user.empresaId;
  
  const [formulario, setFormulario] = useState({
    nombre: '',
    marca: '',
    descripcion: '',
    precio: '',
    stock: '',
    stockMinimo: '5',
    unidad: '',
    categoria: '',
    imagenes: [] as string[]
  });
  const [cargando, setCargando] = useState(false);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);

  const cargarCategorias = useCallback(async () => {
    try {
      setCargandoCategorias(true);
      const response = await ApiService.obtenerCategorias(empresaId);
      if (response.data) {
        setCategorias(response.data);
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      // No mostramos error porque las categorías son opcionales
    } finally {
      setCargandoCategorias(false);
    }
  }, [empresaId]);

  // Cargar categorías al montar el componente
  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  const manejarCambio = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormulario(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const manejarCambioImagenes = (imagenes: string[]) => {
    setFormulario(prev => ({
      ...prev,
      imagenes
    }));
  };

  const validarFormulario = () => {
    if (!formulario.nombre.trim()) {
      toast.error('El nombre del producto es obligatorio');
      return false;
    }
    if (!formulario.precio || isNaN(Number(formulario.precio)) || Number(formulario.precio) <= 0) {
      toast.error('El precio debe ser un número válido mayor a 0');
      return false;
    }
    if (!formulario.stock || isNaN(Number(formulario.stock)) || Number(formulario.stock) < 0) {
      toast.error('El stock debe ser un número válido mayor o igual a 0');
      return false;
    }
    if (!formulario.stockMinimo || isNaN(Number(formulario.stockMinimo)) || Number(formulario.stockMinimo) < 0) {
      toast.error('El stock mínimo debe ser un número válido mayor o igual a 0');
      return false;
    }
    if (!formulario.categoria) {
      toast.error('Selecciona una categoría');
      return false;
    }
    return true;
  };

  const enviarFormulario = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setCargando(true);
    
    try {
      // Obtener datos del usuario logueado
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const empresaId = user.empresaId;

      if (!empresaId) {
        toast.error('Error: No se encontró la empresa asociada');
        return;
      }

      // Preparar datos del producto
      const        datosProducto = {
        nombre: formulario.nombre.trim(),
        descripcion: formulario.descripcion.trim() || undefined,
        precio: Number(formulario.precio),
        stock: Number(formulario.stock),
        stockMinimo: Number(formulario.stockMinimo),
        categoria: formulario.categoria || undefined,
        marca: formulario.marca.trim() || undefined,
        unidad: formulario.unidad.trim() || undefined,
        activo: true,
        destacado: false,
        imagenes: formulario.imagenes // Ahora son URLs de strings
      };

      // Crear el producto en el backend
      console.log('Creando producto en backend:', datosProducto);
      console.log('EmpresaId:', empresaId);
      console.log('Token disponible:', !!localStorage.getItem('token'));
      
      const response = await ApiService.crearProducto(empresaId, datosProducto);
      
      console.log('Respuesta completa del backend:', response);
      
      // Manejar diferentes formatos de respuesta
      if (response) {
        // Si la respuesta tiene estructura { data: producto }
        if (response.data) {
          console.log('Producto creado con éxito:', response.data);
          toast.success('Producto creado exitosamente');
          navigate('/admin/productos');
        }
        // Si la respuesta es directamente el producto (fallback)
        else if ('id' in response && response.id) {
          console.log('Producto creado con éxito (formato directo):', response);
          toast.success('Producto creado exitosamente');
          navigate('/admin/productos');
        }
        // Si no tiene ninguno de los formatos esperados
        else {
          console.log('Respuesta inesperada pero exitosa:', response);
          toast.success('Producto creado exitosamente');
          navigate('/admin/productos');
        }
      } else {
        toast.error('Error: No se recibió respuesta del servidor');
      }
    } catch (error: unknown) {
      console.error('Error detallado al crear producto:', error);
      
      let mensajeError = 'Error al crear el producto';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown; statusText?: string } };
        console.error('Respuesta del servidor:', axiosError.response);
        
        if (axiosError.response?.status === 403) {
          mensajeError = 'No tienes permisos para crear productos. Verifica tu sesión.';
        } else if (axiosError.response?.status === 401) {
          mensajeError = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        } else if (axiosError.response?.status === 400) {
          mensajeError = 'Datos del producto inválidos. Verifica los campos.';
        } else if (axiosError.response?.status === 500) {
          mensajeError = 'Error interno del servidor. Intenta nuevamente.';
        } else {
          mensajeError = `Error ${axiosError.response?.status}: ${axiosError.response?.statusText}`;
        }
      }
      
      toast.error(mensajeError);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="h-pantalla-minimo" style={{ backgroundColor: '#f8fafc' }}>
      {/* Navegación */}
      <NavbarAdmin 
        onCerrarSesion={() => {
          cerrarSesion();
          toast.success('Sesión cerrada correctamente');
        }}
        empresaNombre={datosUsuario?.empresaNombre}
        nombreAdministrador={datosUsuario?.nombre}
        mostrarVolver={true}
        urlVolver="/admin/productos"
      />

      {/* Contenido principal */}
      <div className="contenedor py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="titulo-2 mb-2">Añadir Nuevo Producto</h1>
            <p className="texto-gris">Completa los datos del producto para añadirlo a tu inventario.</p>
          </div>

          <div className="tarjeta">
            <form onSubmit={enviarFormulario} className="space-y-6">
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
                  onChange={manejarCambio}
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
                  onChange={manejarCambio}
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
                  onChange={manejarCambio}
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
                    onChange={manejarCambio}
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
                    onChange={manejarCambio}
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
                    onChange={manejarCambio}
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
                    onChange={manejarCambio}
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
                  <select
                    id="categoria"
                    name="categoria"
                    value={formulario.categoria}
                    onChange={(e) => setFormulario(prev => ({ ...prev, categoria: e.target.value }))}
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
                )}
                
                {formulario.categoria === '__nueva__' && (
                  <div style={{ marginTop: '10px' }}>
                    <input
                      type="text"
                      placeholder="Escribe el nombre de la nueva categoría"
                      className="campo"
                      onBlur={(e) => {
                        if (e.target.value.trim()) {
                          setFormulario(prev => ({ ...prev, categoria: e.target.value.trim() }));
                        } else {
                          setFormulario(prev => ({ ...prev, categoria: '' }));
                        }
                      }}
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Imágenes */}
              <div>
                <GestorImagenes
                  empresaId={empresaId}
                  imagenesIniciales={formulario.imagenes}
                  onChange={manejarCambioImagenes}
                  maxImagenes={5}
                  disabled={cargando}
                />
              </div>

              {/* Botones */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={cargando}
                  className="boton boton-primario flex-1"
                >
                  {cargando ? 'Creando Producto...' : 'Crear Producto'}
                </button>
                <Link
                  to="/admin/productos"
                  className="boton boton-secundario flex-1 text-center"
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
