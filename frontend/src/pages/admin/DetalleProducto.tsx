import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import type { Producto } from '../../types';

const DetalleProducto: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [imagenActual, setImagenActual] = useState(0);
  const [empresaId, setEmpresaId] = useState<number | null>(null);

  useEffect(() => {
    // Verificar autenticación y obtener empresaId
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    console.log('Debug - Token encontrado:', !!token); // Debug
    console.log('Debug - User string encontrado:', !!userStr); // Debug
    
    if (!token || !userStr) {
      console.log('Debug - Redirigiendo a login por falta de token o user');
      navigate('/admin/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      console.log('Debug - Usuario parseado:', user); // Debug
      
      if (user.empresaId) {
        setEmpresaId(user.empresaId);
        console.log('Debug - empresaId establecido:', user.empresaId);
      } else {
        console.log('Debug - No se encontró empresaId en el usuario');
        setError('No se encontró información de empresa');
        navigate('/admin/login');
      }
    } catch (error) {
      console.error('Error al parsear usuario:', error);
      navigate('/admin/login');
    }
  }, [navigate]);

  const cargarProducto = useCallback(async () => {
    if (!id || !empresaId) return;

    try {
      setCargando(true);
      setError('');
      
      console.log('Cargando producto:', id, 'para empresa:', empresaId);
      
      // Llamada real al API
      const response = await ApiService.obtenerProducto(empresaId, parseInt(id));
      
      console.log('Respuesta del API:', response);
      
      if (response && response.data) {
        setProducto(response.data);
        console.log('Producto cargado del backend:', response.data);
      } else if (response) {
        // Si la respuesta no tiene el formato esperado, usar directamente
        setProducto(response as unknown as Producto);
        console.log('Producto cargado del backend (formato directo):', response);
      } else {
        setError('Producto no encontrado');
      }
    } catch (error: unknown) {
      console.error('Error al cargar producto:', error);
      
      let mensajeError = 'Error al cargar el producto del servidor.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string; message?: string } } };
        
        if (axiosError.response?.status === 403) {
          mensajeError = 'No tienes permisos para acceder a este producto.';
        } else if (axiosError.response?.status === 401) {
          mensajeError = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        } else if (axiosError.response?.status === 404) {
          mensajeError = 'El producto no fue encontrado.';
        }
      }
      
      setError(mensajeError);
    } finally {
      setCargando(false);
    }
  }, [id, empresaId]);

  useEffect(() => {
    if (empresaId) {
      cargarProducto();
    }
  }, [cargarProducto, empresaId]);

  const cambiarStock = async (cambio: number) => {
    if (!producto || !empresaId) return;
    
    const nuevoStock = Math.max(0, producto.stock + cambio);
    
    try {
      // Llamada real al API
      const response = await ApiService.actualizarProducto(
        empresaId,
        producto.id,
        { stock: nuevoStock }
      );

      if (response.data) {
        setProducto({ ...producto, stock: nuevoStock });
        console.log(`Stock actualizado en BD: ${producto.stock} → ${nuevoStock}`);
      } else {
        setError('Error al actualizar stock');
      }
    } catch (error) {
      setError('Error al actualizar stock');
      console.error('Error:', error);
    }
  };

  const alternarActivo = async () => {
    if (!producto || !empresaId) return;
    
    try {
      const nuevoEstado = !producto.activo;
      
      // Llamada real al API
      const response = await ApiService.actualizarProducto(
        empresaId,
        producto.id,
        { activo: nuevoEstado }
      );

      if (response.data) {
        setProducto({ ...producto, activo: nuevoEstado });
        console.log(`Estado cambiado en BD: ${producto.activo} → ${nuevoEstado}`);
      } else {
        setError('Error al cambiar estado');
      }
    } catch (error) {
      setError('Error al cambiar estado');
      console.error('Error:', error);
    }
  };

  const alternarDestacado = async () => {
    if (!producto || !empresaId) return;
    
    try {
      const nuevoDestacado = !producto.destacado;
      
      console.log('=== DEBUG DESTACADO ===');
      console.log('Producto actual:', producto);
      console.log('Nuevo destacado:', nuevoDestacado);
      console.log('EmpresaId:', empresaId);
      console.log('ProductoId:', producto.id);
      
      // Llamada real al API
      const response = await ApiService.actualizarProducto(
        empresaId,
        producto.id,
        { destacado: nuevoDestacado }
      );

      console.log('Respuesta del API:', response);

      if (response.data) {
        setProducto({ ...producto, destacado: nuevoDestacado });
        console.log(`Destacado cambiado en BD: ${producto.destacado} → ${nuevoDestacado}`);
      } else {
        console.error('No se recibió data en la respuesta:', response);
        setError('Error al cambiar destacado');
      }
    } catch (error) {
      console.error('Error completo al cambiar destacado:', error);
      
      let mensaje = 'Error al cambiar destacado';
      if (error && typeof error === 'object') {
        const errorObj = error as { response?: { status?: number; data?: { error?: string; message?: string } }; message?: string };
        
        console.log('Status del error:', errorObj.response?.status);
        console.log('Data del error:', errorObj.response?.data);
        
        if (errorObj.response?.status === 403) {
          mensaje = 'No tienes permisos para modificar este producto. Verifica tu sesión.';
        } else if (errorObj.response?.status === 401) {
          mensaje = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        } else if (errorObj.response?.status === 400) {
          mensaje = `Error de validación: ${errorObj.response.data?.error || errorObj.response.data?.message || 'Datos inválidos'}`;
        } else if (errorObj.response?.status === 404) {
          mensaje = 'Producto no encontrado';
        } else if (errorObj.response?.status === 500) {
          mensaje = `Error del servidor: ${errorObj.response.data?.error || errorObj.response.data?.message || 'Error interno'}`;
        } else if (errorObj.message) {
          mensaje = `Error: ${errorObj.message}`;
        }
      }
      
      setError(mensaje);
      console.error('Mensaje de error mostrado:', mensaje);
    }
  };

  if (cargando) {
    return (
      <div className="pagina-detalle-producto">
        <div className="contenedor-principal">
          <div className="cargando">
            <div className="spinner"></div>
            <p>Cargando producto...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !producto) {
    return (
      <div className="pagina-detalle-producto">
        <div className="contenedor-principal">
          <div className="mensaje-error">
            <h2>Error</h2>
            <p>{error || 'Producto no encontrado'}</p>
            <button 
              onClick={() => navigate('/admin/productos')}
              className="boton-secundario"
            >
              Volver a Productos
            </button>
          </div>
        </div>
      </div>
    );
  }

  const imagenes = producto.imagenes && producto.imagenes.length > 0 
    ? producto.imagenes 
    : ['/api/placeholder/600/600'];

  return (
    <div className="pagina-detalle-producto">
      <div className="contenedor-principal">
        {/* Navegación superior */}
        <div className="navegacion-superior">
          <button 
            onClick={() => navigate('/admin/productos')}
            className="boton-volver"
          >
            ← Volver a Productos
          </button>
          
          <div className="acciones-rapidas">
            <button 
              onClick={() => navigate(`/admin/productos/editar/${producto.id}`)}
              className="boton-primario"
            >
              ✏️ Editar Producto
            </button>
          </div>
        </div>

        {error && (
          <div className="mensaje-error">
            {error}
          </div>
        )}

        {/* Contenido principal */}
        <div className="detalle-contenido">
          {/* Galería de imágenes */}
          <div className="galeria-imagenes">
            <div className="imagen-principal">
              <img 
                src={imagenes[imagenActual]} 
                alt={producto.nombre}
                className="imagen-grande"
              />
              
              {imagenes.length > 1 && (
                <div className="controles-imagen">
                  <button 
                    onClick={() => setImagenActual(Math.max(0, imagenActual - 1))}
                    disabled={imagenActual === 0}
                    className="boton-control"
                  >
                    ‹
                  </button>
                  <span className="contador-imagenes">
                    {imagenActual + 1} de {imagenes.length}
                  </span>
                  <button 
                    onClick={() => setImagenActual(Math.min(imagenes.length - 1, imagenActual + 1))}
                    disabled={imagenActual === imagenes.length - 1}
                    className="boton-control"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>

            {imagenes.length > 1 && (
              <div className="miniaturas">
                {imagenes.map((imagen, index) => (
                  <img
                    key={index}
                    src={imagen}
                    alt={`${producto.nombre} ${index + 1}`}
                    className={`miniatura ${index === imagenActual ? 'activa' : ''}`}
                    onClick={() => setImagenActual(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Información del producto */}
          <div className="informacion-producto">
            <div className="encabezado-producto">
              <div className="titulo-y-estado">
                <h1>{producto.nombre}</h1>
                <div className="badges">
                  <span className={`badge-estado ${producto.activo ? 'activo' : 'inactivo'}`}>
                    {producto.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  {producto.destacado && (
                    <span className="badge-destacado">Destacado</span>
                  )}
                  {producto.stock <= producto.stockMinimo && (
                    <span className="badge-stock-bajo">Stock Bajo</span>
                  )}
                </div>
              </div>

              <div className="precio-principal">
                <span className="precio">${producto.precio.toLocaleString()}</span>
                {producto.unidad && <span className="unidad">/ {producto.unidad}</span>}
              </div>
            </div>

            {/* Descripción */}
            {producto.descripcion && (
              <div className="seccion-descripcion">
                <h3>Descripción</h3>
                <p>{producto.descripcion}</p>
              </div>
            )}

            {/* Información básica */}
            <div className="seccion-informacion">
              <h3>Información del Producto</h3>
              <div className="tabla-informacion">
                <div className="fila-info">
                  <span className="etiqueta">ID:</span>
                  <span className="valor">{producto.id}</span>
                </div>
                
                {producto.categoria && (
                  <div className="fila-info">
                    <span className="etiqueta">Categoría:</span>
                    <span className="valor">{producto.categoria}</span>
                  </div>
                )}
                
                {producto.marca && (
                  <div className="fila-info">
                    <span className="etiqueta">Marca:</span>
                    <span className="valor">{producto.marca}</span>
                  </div>
                )}
                
                {producto.unidad && (
                  <div className="fila-info">
                    <span className="etiqueta">Unidad:</span>
                    <span className="valor">{producto.unidad}</span>
                  </div>
                )}
                
                <div className="fila-info">
                  <span className="etiqueta">Fecha creación:</span>
                  <span className="valor">
                    {new Date(producto.fechaCreacion).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="fila-info">
                  <span className="etiqueta">Última actualización:</span>
                  <span className="valor">
                    {new Date(producto.fechaActualizacion).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Gestión de stock */}
            <div className="seccion-stock">
              <h3>Gestión de Inventario</h3>
              <div className="controles-stock">
                <div className="stock-actual">
                  <span className="etiqueta">Stock actual:</span>
                  <div className="control-stock-detalle">
                    <button 
                      onClick={() => cambiarStock(-1)}
                      className="boton-stock"
                      disabled={producto.stock <= 0}
                    >
                      -
                    </button>
                    <span className={`stock ${producto.stock <= producto.stockMinimo ? 'stock-bajo' : ''}`}>
                      {producto.stock}
                    </span>
                    <button 
                      onClick={() => cambiarStock(1)}
                      className="boton-stock"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div className="stock-minimo">
                  <span className="etiqueta">Stock mínimo:</span>
                  <span className="valor">{producto.stockMinimo}</span>
                </div>
              </div>
              
              {producto.stock <= producto.stockMinimo && (
                <div className="alerta-stock-bajo">
                  ⚠️ El stock actual está por debajo del mínimo recomendado
                </div>
              )}
            </div>

            {/* Acciones rápidas */}
            <div className="seccion-acciones">
              <h3>Acciones Rápidas</h3>
              <div className="botones-accion">
                <button 
                  onClick={alternarActivo}
                  className={`boton-toggle ${producto.activo ? 'activo' : 'inactivo'}`}
                >
                  {producto.activo ? '🔴 Desactivar' : '🟢 Activar'} Producto
                </button>
                
                <button 
                  onClick={alternarDestacado}
                  className={`boton-toggle ${producto.destacado ? 'destacado' : 'normal'}`}
                >
                  {producto.destacado ? '⭐ Quitar Destacado' : '⭐ Destacar'} Producto
                </button>
                
                <button 
                  onClick={() => navigate(`/admin/productos/editar/${producto.id}`)}
                  className="boton-editar"
                >
                  ✏️ Editar Información
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalleProducto;
