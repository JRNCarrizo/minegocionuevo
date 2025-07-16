import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import type { Producto } from '../../types';

interface UsuarioLocal {
  empresaId: number;
  empresaNombre?: string;
  nombre?: string;
  email?: string;
  // ...otros campos si los necesitas
}

const DetalleProducto: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [imagenActual, setImagenActual] = useState(0);
  const [empresaId, setEmpresaId] = useState<number | null>(null);
  const [usuario, setUsuario] = useState<UsuarioLocal | null>(null);

  useEffect(() => {
    // Verificar autenticación y obtener empresaId
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      navigate('/admin/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setUsuario(user);
      
      if (user.empresaId) {
        setEmpresaId(user.empresaId);
      } else {
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
      
      const response = await ApiService.obtenerProducto(empresaId, parseInt(id));
      
      if (response && response.data) {
        setProducto(response.data);
      } else if (response) {
        setProducto(response as unknown as Producto);
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
      const response = await ApiService.actualizarProducto(
        empresaId,
        producto.id,
        { stock: nuevoStock }
      );

      if (response.data) {
        setProducto({ ...producto, stock: nuevoStock });
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
      
      const response = await ApiService.actualizarProducto(
        empresaId,
        producto.id,
        { activo: nuevoEstado }
      );

      if (response.data) {
        setProducto({ ...producto, activo: nuevoEstado });
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
      
      const response = await ApiService.actualizarProducto(
        empresaId,
        producto.id,
        { destacado: nuevoDestacado }
      );

      if (response.data) {
        setProducto({ ...producto, destacado: nuevoDestacado });
      } else {
        setError('Error al cambiar destacado');
      }
    } catch (error) {
      setError('Error al cambiar destacado');
      console.error('Error:', error);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  if (cargando) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#64748b', fontSize: '16px' }}>Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (error || !producto) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px'
          }}>❌</div>
          <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Error</h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>{error || 'Producto no encontrado'}</p>
          <button 
            onClick={() => navigate('/admin/productos')}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Volver a Productos
          </button>
        </div>
      </div>
    );
  }

  const imagenes = producto.imagenes && producto.imagenes.length > 0 
    ? producto.imagenes 
    : ['/api/placeholder/600/600'];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Navbar */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '16px 24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button 
              onClick={() => navigate('/admin/productos')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              }}
            >
              ← Volver
            </button>
            
            <div style={{
              height: '24px',
              width: '1px',
              background: 'rgba(255,255,255,0.3)'
            }}></div>
            
            <h1 style={{
              color: 'white',
              fontSize: '20px',
              fontWeight: '600',
              margin: 0
            }}>
              📦 Detalle del Producto
            </h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {usuario && (
              <div style={{
                color: 'white',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                👤 {usuario.nombre || usuario.email}
              </div>
            )}
            
            <button 
              onClick={cerrarSesion}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              }}
            >
              🚪 Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: window.innerWidth <= 768 ? '24px' : '48px',
          alignItems: 'start'
        }}>
          {/* Galería de imágenes */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0',
            minWidth: 0
          }}>
            <div style={{ position: 'relative' }}>
              <img 
                src={imagenes[imagenActual]} 
                alt={producto.nombre}
                style={{
                  width: '100%',
                  height: '400px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0'
                }}
              />
              
              {imagenes.length > 1 && (
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {imagenActual + 1} de {imagenes.length}
                </div>
              )}
            </div>

            {imagenes.length > 1 && (
              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '20px',
                justifyContent: 'center'
              }}>
                {imagenes.map((imagen, index) => (
                  <img
                    key={index}
                    src={imagen}
                    alt={`${producto.nombre} ${index + 1}`}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: index === imagenActual ? '3px solid #3b82f6' : '2px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => setImagenActual(index)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Información del producto */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            minWidth: 0
          }}>
            {/* Encabezado */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <h1 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: 0,
                  lineHeight: '1.2'
                }}>
                  {producto.nombre}
                </h1>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{
                    background: producto.activo ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {producto.activo ? '✅ Activo' : '❌ Inactivo'}
                  </span>
                  
                  {producto.destacado && (
                    <span style={{
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      ⭐ Destacado
                    </span>
                  )}
                  
                  {producto.stock <= producto.stockMinimo && (
                    <span style={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      ⚠️ Stock Bajo
                    </span>
                  )}
                </div>
              </div>

              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#059669',
                marginBottom: '8px'
              }}>
                ${producto.precio.toLocaleString()}
                {producto.unidad && (
                  <span style={{
                    fontSize: '16px',
                    color: '#64748b',
                    fontWeight: '500'
                  }}>
                    / {producto.unidad}
                  </span>
                )}
              </div>

              {producto.descripcion && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: '0 0 8px 0'
                  }}>
                    📝 Descripción
                  </h4>
                  <p style={{
                    color: '#64748b',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    margin: 0,
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {producto.descripcion}
                  </p>
                </div>
              )}
            </div>

            {/* Información básica del producto */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0',
              minWidth: 0
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 20px 0'
              }}>
                📋 Información del Producto
              </h3>
              
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '12px 0', 
                  borderBottom: '1px solid #f1f5f9',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <span style={{ color: '#64748b', fontWeight: '500', flexShrink: 0 }}>ID:</span>
                  <span style={{ 
                    color: '#1e293b', 
                    fontWeight: '600',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    textAlign: 'right'
                  }}>{producto.id}</span>
                </div>
                
                {producto.categoria && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '12px 0', 
                    borderBottom: '1px solid #f1f5f9',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <span style={{ color: '#64748b', fontWeight: '500', flexShrink: 0 }}>Categoría:</span>
                    <span style={{ 
                      color: '#1e293b', 
                      fontWeight: '600',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      textAlign: 'right'
                    }}>{producto.categoria}</span>
                  </div>
                )}
                
                {producto.marca && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '12px 0', 
                    borderBottom: '1px solid #f1f5f9',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <span style={{ color: '#64748b', fontWeight: '500', flexShrink: 0 }}>Marca:</span>
                    <span style={{ 
                      color: '#1e293b', 
                      fontWeight: '600',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      textAlign: 'right'
                    }}>{producto.marca}</span>
                  </div>
                )}
                
                {producto.unidad && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '12px 0', 
                    borderBottom: '1px solid #f1f5f9',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <span style={{ color: '#64748b', fontWeight: '500', flexShrink: 0 }}>Unidad:</span>
                    <span style={{ 
                      color: '#1e293b', 
                      fontWeight: '600',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      textAlign: 'right'
                    }}>{producto.unidad}</span>
                  </div>
                )}
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '12px 0', 
                  borderBottom: '1px solid #f1f5f9',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <span style={{ color: '#64748b', fontWeight: '500', flexShrink: 0 }}>Fecha creación:</span>
                  <span style={{ 
                    color: '#1e293b', 
                    fontWeight: '600',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    textAlign: 'right'
                  }}>
                    {new Date(producto.fechaCreacion).toLocaleDateString()}
                  </span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '12px 0',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <span style={{ color: '#64748b', fontWeight: '500', flexShrink: 0 }}>Última actualización:</span>
                  <span style={{ 
                    color: '#1e293b', 
                    fontWeight: '600',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    textAlign: 'right'
                  }}>
                    {new Date(producto.fechaActualizacion).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Gestión de stock */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 20px 0'
              }}>
                📦 Gestión de Inventario
              </h3>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontWeight: '500' }}>Stock actual:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button 
                      onClick={() => cambiarStock(-1)}
                      disabled={producto.stock <= 0}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        width: '36px',
                        height: '36px',
                        fontSize: '18px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: producto.stock <= 0 ? 0.5 : 1
                      }}
                    >
                      -
                    </button>
                    
                    <span style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      color: producto.stock <= producto.stockMinimo ? '#ef4444' : '#059669',
                      minWidth: '40px',
                      textAlign: 'center'
                    }}>
                      {producto.stock}
                    </span>
                    
                    <button 
                      onClick={() => cambiarStock(1)}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        width: '36px',
                        height: '36px',
                        fontSize: '18px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontWeight: '500' }}>Stock mínimo:</span>
                  <span style={{ color: '#1e293b', fontWeight: '600' }}>{producto.stockMinimo}</span>
                </div>
              </div>
              
              {producto.stock <= producto.stockMinimo && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '12px',
                  borderRadius: '8px',
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  ⚠️ El stock actual está por debajo del mínimo recomendado
                </div>
              )}
            </div>

            {/* Acciones rápidas */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 20px 0'
              }}>
                ⚡ Acciones Rápidas
              </h3>
              
              <div style={{ display: 'grid', gap: '12px' }}>
                <button 
                  onClick={alternarActivo}
                  style={{
                    background: producto.activo ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {producto.activo ? '🔴 Desactivar' : '🟢 Activar'} Producto
                </button>
                
                <button 
                  onClick={alternarDestacado}
                  style={{
                    background: producto.destacado ? 'linear-gradient(135deg, #64748b 0%, #475569 100%)' : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {producto.destacado ? '⭐ Quitar Destacado' : '⭐ Destacar'} Producto
                </button>
                
                <button 
                  onClick={() => navigate(`/admin/productos/editar/${producto.id}`)}
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
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
