import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSubdominio } from '../hooks/useSubdominio';
import { useCart } from '../hooks/useCart';
import CartIcon from '../components/CartIcon';
import CartModal from '../components/CartModal';
import api from '../services/api';
import type { Pedido, DetallePedido } from '../types';

interface ClienteInfo {
  id: number;
  nombre: string;
  apellidos?: string;
  email: string;
  telefono?: string;
}

function EstadoBadge({ estado }: { estado: string }) {
  const colores: Record<string, string> = {
    PENDIENTE: '#f59e0b',
    CONFIRMADO: '#3b82f6',
    PREPARANDO: '#6366f1',
    ENVIADO: '#8b5cf6',
    ENTREGADO: '#10b981',
    CANCELADO: '#ef4444',
  };
  return (
    <span
      style={{
        background: colores[estado] + '22',
        color: colores[estado],
        borderRadius: 8,
        padding: '2px 10px',
        fontWeight: 600,
        fontSize: 13,
        marginLeft: 8
      }}
    >
      {estado.charAt(0) + estado.slice(1).toLowerCase()}
    </span>
  );
}

function PedidoDetalleModal({ pedido, open, onClose }: { pedido: Pedido|null, open: boolean, onClose: () => void }) {
  const [productoSeleccionado, setProductoSeleccionado] = useState<DetallePedido | null>(null);
  const [mostrarProducto, setMostrarProducto] = useState(false);

  if (!pedido || !open) return null;

  const obtenerColorEstado = (estado: Pedido['estado']) => {
    const colores: Record<Pedido['estado'], string> = {
      PENDIENTE: '#f59e0b',
      CONFIRMADO: '#3b82f6',
      PREPARANDO: '#6366f1',
      ENVIADO: '#8b5cf6',
      ENTREGADO: '#10b981',
      CANCELADO: '#ef4444',
    };
    return colores[estado] || '#6b7280';
  };

  const obtenerTextoEstado = (estado: Pedido['estado']) => {
    const textos: Record<Pedido['estado'], string> = {
      PENDIENTE: 'Pendiente',
      CONFIRMADO: 'Confirmado',
      PREPARANDO: 'Preparando',
      ENVIADO: 'Enviado',
      ENTREGADO: 'Entregado',
      CANCELADO: 'Cancelado',
    };
    return textos[estado] || estado;
  };

  const verDetalleProducto = (detalle: DetallePedido) => {
    setProductoSeleccionado(detalle);
    setMostrarProducto(true);
  };

  return (
    <>
      <div className="modal-overlay" style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        background: 'rgba(0,0,0,0.6)', 
        zIndex: 1000, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backdropFilter: 'blur(4px)'
      }}>
        <div className="modal-content" style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '0',
          maxWidth: '800px',
          width: '95vw',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {/* Header del modal */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '24px 32px',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
                Pedido #{pedido.numeroPedido || pedido.id}
              </h2>
              <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
                {new Date(pedido.fechaCreacion).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <button 
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              ×
            </button>
          </div>

          {/* Contenido del modal */}
          <div style={{ padding: '32px', maxHeight: 'calc(90vh - 120px)', overflow: 'auto' }}>
            {/* Estado del pedido */}
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                    Estado del Pedido
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        backgroundColor: obtenerColorEstado(pedido.estado) + '20',
                        color: obtenerColorEstado(pedido.estado),
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: `2px solid ${obtenerColorEstado(pedido.estado)}30`
                      }}
                    >
                      {obtenerTextoEstado(pedido.estado)}
                    </span>
                    {pedido.estado === 'CANCELADO' && (
                      <span style={{ fontSize: '14px', color: '#64748b' }}>
                        • Pedido cancelado
                      </span>
                    )}
                    {pedido.estado === 'ENTREGADO' && (
                      <span style={{ fontSize: '14px', color: '#64748b' }}>
                        • Pedido entregado exitosamente
                      </span>
                    )}
                  </div>
                </div>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${obtenerColorEstado(pedido.estado)}20 0%, ${obtenerColorEstado(pedido.estado)}40 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `3px solid ${obtenerColorEstado(pedido.estado)}30`
                }}>
                  <span style={{ fontSize: '24px', color: obtenerColorEstado(pedido.estado) }}>
                    {pedido.estado === 'PENDIENTE' && '⏳'}
                    {pedido.estado === 'CONFIRMADO' && '✅'}
                    {pedido.estado === 'PREPARANDO' && '👨‍🍳'}
                    {pedido.estado === 'ENVIADO' && '🚚'}
                    {pedido.estado === 'ENTREGADO' && '🎉'}
                    {pedido.estado === 'CANCELADO' && '❌'}
                  </span>
                </div>
              </div>
            </div>

            {/* Información del pedido */}
            {pedido.direccionEntrega && (
              <div style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                  📍 Dirección de Entrega
                </h3>
                <p style={{ margin: 0, fontSize: '16px', color: '#475569', lineHeight: '1.5' }}>
                  {pedido.direccionEntrega}
                </p>
              </div>
            )}

            {/* Productos */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
                🛍️ Productos ({pedido.detalles?.length || 0})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {pedido.detalles?.map((detalle, index) => (
                  <div 
                    key={detalle.id || index} 
                    style={{
                      background: '#fff',
                      borderRadius: '12px',
                      padding: '20px',
                      border: '2px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.15)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                    }}
                    onClick={() => verDetalleProducto(detalle)}
                  >
                    <div style={{ display: 'flex', gap: '16px' }}>
                      {/* Imagen del producto */}
                      <div style={{ flexShrink: 0 }}>
                        {detalle.productoImagen ? (
                          <img 
                            src={detalle.productoImagen} 
                            alt={detalle.productoNombre || detalle.nombreProducto}
                            style={{
                              width: '80px',
                              height: '80px',
                              objectFit: 'cover',
                              borderRadius: '12px',
                              border: '2px solid #e2e8f0'
                            }}
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/80x80?text=Sin+Imagen';
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '80px',
                            height: '80px',
                            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                            borderRadius: '12px',
                            border: '2px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <span style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
                              Sin imagen
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Información del producto */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ 
                              margin: '0 0 4px 0', 
                              fontSize: '16px', 
                              fontWeight: '600', 
                              color: '#1e293b',
                              lineHeight: '1.3'
                            }}>
                              {detalle.productoNombre || detalle.nombreProducto}
                            </h4>
                            {(detalle.productoDescripcion || detalle.descripcionProducto) && (
                              <p style={{ 
                                margin: '0 0 8px 0', 
                                fontSize: '14px', 
                                color: '#64748b',
                                lineHeight: '1.4',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {detalle.productoDescripcion || detalle.descripcionProducto}
                              </p>
                            )}
                            {(detalle.productoCategoria || detalle.categoriaProducto) && (
                              <span style={{
                                display: 'inline-block',
                                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                                color: '#1e40af',
                                fontSize: '12px',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontWeight: '500',
                                border: '1px solid #93c5fd'
                              }}>
                                {detalle.productoCategoria || detalle.categoriaProducto}
                              </span>
                            )}
                          </div>
                          
                          {/* Precios */}
                          <div style={{ textAlign: 'right', marginLeft: '16px' }}>
                            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b' }}>
                              Precio unitario
                            </p>
                            <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#059669' }}>
                              ${detalle.precioUnitario?.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Cantidad y subtotal */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '12px 0',
                          borderTop: '1px solid #f1f5f9',
                          marginTop: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', color: '#64748b' }}>Cantidad:</span>
                            <span style={{ 
                              fontSize: '16px', 
                              fontWeight: '600', 
                              color: '#1e293b',
                              background: '#f1f5f9',
                              padding: '4px 12px',
                              borderRadius: '8px'
                            }}>
                              {detalle.cantidad}
                            </span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b' }}>
                              Subtotal
                            </p>
                            <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                              ${(detalle.subtotal || detalle.precioTotal)?.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ 
                      textAlign: 'center', 
                      marginTop: '12px',
                      padding: '8px',
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                      borderRadius: '8px',
                      border: '1px solid #bae6fd'
                    }}>
                      <span style={{ fontSize: '12px', color: '#0369a1', fontWeight: '500' }}>
                        👆 Haz clic para ver más detalles del producto
                      </span>
                    </div>
                  </div>
                ))}
      </div>
    </div>

            {/* Resumen de totales */}
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '16px',
              padding: '24px',
              border: '2px solid #e2e8f0'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
                💰 Resumen de Totales
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '16px', color: '#64748b' }}>Subtotal:</span>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                    ${pedido.subtotal?.toFixed(2) || pedido.total?.toFixed(2)}
                  </span>
                </div>
                {pedido.impuestos && pedido.impuestos > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '16px', color: '#64748b' }}>Impuestos:</span>
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                      ${pedido.impuestos.toFixed(2)}
                    </span>
                  </div>
                )}
                {pedido.descuento && pedido.descuento > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '16px', color: '#64748b' }}>Descuento:</span>
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#059669' }}>
                      -${pedido.descuento.toFixed(2)}
                    </span>
                  </div>
                )}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '16px 0',
                  borderTop: '2px solid #cbd5e1',
                  marginTop: '8px'
                }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                    Total del Pedido
                  </h3>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#059669' }}>
                    ${pedido.total?.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalle del producto */}
      {productoSeleccionado && (
        <div className="modal-overlay" style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          background: 'rgba(0,0,0,0.6)', 
          zIndex: 1100, 
          display: mostrarProducto ? 'flex' : 'none', 
          alignItems: 'center', 
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="modal-content" style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '0',
            maxWidth: '600px',
            width: '95vw',
            maxHeight: '85vh',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            {/* Header del modal de producto */}
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              padding: '24px 32px',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '600' }}>
                Detalle del Producto
              </h2>
              <button 
                onClick={() => setMostrarProducto(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  color: 'white',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                ×
              </button>
            </div>

            {/* Contenido del modal de producto */}
            <div style={{ padding: '32px', maxHeight: 'calc(85vh - 100px)', overflow: 'auto' }}>
              {/* Imagen del producto */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                {productoSeleccionado.productoImagen ? (
                  <img 
                    src={productoSeleccionado.productoImagen} 
                    alt={productoSeleccionado.productoNombre || productoSeleccionado.nombreProducto}
                    style={{
                      width: '200px',
                      height: '200px',
                      objectFit: 'cover',
                      borderRadius: '16px',
                      border: '3px solid #e2e8f0',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                    }}
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/200x200?text=Sin+Imagen';
                    }}
                  />
                ) : (
                  <div style={{
                    width: '200px',
                    height: '200px',
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    borderRadius: '16px',
                    border: '3px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto'
                  }}>
                    <span style={{ fontSize: '16px', color: '#64748b' }}>Sin imagen</span>
                  </div>
                )}
              </div>

              {/* Información del producto */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={{ 
                    margin: '0 0 12px 0', 
                    fontSize: '24px', 
                    fontWeight: '700', 
                    color: '#1e293b',
                    lineHeight: '1.2'
                  }}>
                    {productoSeleccionado.productoNombre || productoSeleccionado.nombreProducto}
                  </h3>
                  {(productoSeleccionado.productoDescripcion || productoSeleccionado.descripcionProducto) && (
                    <p style={{ 
                      margin: 0, 
                      fontSize: '16px', 
                      color: '#64748b',
                      lineHeight: '1.6'
                    }}>
                      {productoSeleccionado.productoDescripcion || productoSeleccionado.descripcionProducto}
                    </p>
                  )}
                </div>

                {(productoSeleccionado.productoCategoria || productoSeleccionado.categoriaProducto) && (
                  <div>
                    <span style={{
                      display: 'inline-block',
                      background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                      color: '#1e40af',
                      fontSize: '14px',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontWeight: '600',
                      border: '2px solid #93c5fd'
                    }}>
                      📂 {productoSeleccionado.productoCategoria || productoSeleccionado.categoriaProducto}
                    </span>
                  </div>
                )}

                <div style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '2px solid #e2e8f0'
                }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                    💰 Información de Precios
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{
                      background: '#fff',
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center',
                      border: '1px solid #e2e8f0'
                    }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' }}>
                        Precio unitario
                      </p>
                      <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#059669' }}>
                        ${productoSeleccionado.precioUnitario?.toFixed(2)}
                      </p>
                    </div>
                    <div style={{
                      background: '#fff',
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center',
                      border: '1px solid #e2e8f0'
                    }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' }}>
                        Cantidad
                      </p>
                      <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                        {productoSeleccionado.cantidad}
                      </p>
                    </div>
                    <div style={{
                      background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center',
                      border: '2px solid #93c5fd',
                      gridColumn: '1 / -1'
                    }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1e40af', fontWeight: '600' }}>
                        Subtotal
                      </p>
                      <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#1e40af' }}>
                        ${(productoSeleccionado.subtotal || productoSeleccionado.precioTotal)?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <button 
                  onClick={() => setMostrarProducto(false)}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 32px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(16,185,129,0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.3)';
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AreaPersonalCliente() {
  const { empresa, cargando: cargandoEmpresa, subdominio } = useSubdominio();
  const { addToCart } = useCart();
  const [cliente, setCliente] = useState<ClienteInfo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);
  const [detallePedido, setDetallePedido] = useState<Pedido|null>(null);
  const [clienteInfo, setClienteInfo] = useState<{ nombre: string; email: string } | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [tabActiva, setTabActiva] = useState<'pedidos' | 'favoritos'>('pedidos');
  const navigate = useNavigate();

  // Verificar si hay un cliente logueado para el navbar
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

  useEffect(() => {
    const cargarPerfilCliente = async () => {
      // Usar subdominio detectado o el de desarrollo
      const subdominioDesarrollo = localStorage.getItem('subdominio-desarrollo');
      const subdominioFinal = subdominio || subdominioDesarrollo;
      
      // Esperar a que termine de cargar el subdominio antes de mostrar error
      if (!subdominioFinal) {
        if (!cargandoEmpresa) {
          toast.error('No se pudo identificar la tienda');
        }
        return;
      }

      const token = localStorage.getItem('clienteToken');
      if (!token) {
        toast.error('Debes iniciar sesión');
        navigate('/login');
        return;
      }

      setCargando(true);
      try {
        console.log('=== DEBUG FRONTEND - Cargando perfil cliente ===');
        console.log('Subdominio final:', subdominioFinal);
        console.log('Token:', token ? 'presente' : 'ausente');
        
        const response = await api.obtenerPerfilCliente(subdominioFinal, token);
        console.log('Respuesta del perfil:', response);
        
        setCliente(response.cliente);
        console.log('Cliente establecido:', response.cliente);
        
        // Cargar pedidos del cliente
        if (empresa && response.cliente?.id) {
          console.log('Cargando pedidos para cliente:', response.cliente.id, 'empresa:', empresa.id);
          setCargandoPedidos(true);
          try {
            const pedidosResp = await api.obtenerPedidosCliente(empresa.id, response.cliente.id);
            // Adaptación robusta para diferentes estructuras de respuesta
            let pedidosArray = Array.isArray(pedidosResp) ? pedidosResp : pedidosResp?.data;
            if (!Array.isArray(pedidosArray)) pedidosArray = [];
            console.log('Pedidos obtenidos (adaptado):', pedidosArray);
            setPedidos(pedidosArray);
          } catch (e) {
            console.error('Error al cargar pedidos:', e);
            setPedidos([]);
          } finally {
            setCargandoPedidos(false);
          }
        } else {
          console.log('No se pueden cargar pedidos - empresa:', !!empresa, 'cliente.id:', response.cliente?.id);
        }
      } catch (error: unknown) {
        console.error('Error al cargar perfil:', error);
        const mensaje = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al cargar perfil';
        toast.error(mensaje);
        
        // Si el token es inválido, redirigir al login
        if ((error as { response?: { status?: number } }).response?.status === 401) {
          localStorage.removeItem('clienteToken');
          localStorage.removeItem('clienteInfo');
          navigate('/login');
        }
      } finally {
        setCargando(false);
      }
    };

    cargarPerfilCliente();
  }, [subdominio, navigate, empresa, cargandoEmpresa]);

  useEffect(() => {
    if (!empresa || !cliente?.id) return;
    console.log('useEffect secundario - Cargando pedidos para cliente:', cliente.id, 'empresa:', empresa.id);
    setCargandoPedidos(true);
    api.obtenerPedidosCliente(empresa.id, cliente.id)
      .then((pedidosResp) => {
        // Adaptación robusta para diferentes estructuras de respuesta
        let pedidosArray = Array.isArray(pedidosResp) ? pedidosResp : pedidosResp?.data;
        if (!Array.isArray(pedidosArray)) pedidosArray = [];
        console.log('Pedidos obtenidos en useEffect secundario (adaptado):', pedidosArray);
        setPedidos(pedidosArray);
      })
      .catch((error) => {
        console.error('Error al cargar pedidos en useEffect secundario:', error);
        setPedidos([]);
      })
      .finally(() => setCargandoPedidos(false));
  }, [empresa, cliente]);

  const cerrarSesion = () => {
    localStorage.removeItem('clienteToken');
    localStorage.removeItem('clienteInfo');
    setClienteInfo(null);
    toast.success('Sesión cerrada');
    navigate('/');
  };

  if (cargandoEmpresa) {
    return (
      <div className="pagina-cargando">
        <div className="spinner"></div>
        <p>Cargando...</p>
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

  if (cargando) {
    return (
      <div className="pagina-cargando">
        <div className="spinner"></div>
        <p>Cargando tu perfil...</p>
      </div>
    );
  }

  return (
    <div className="area-personal-cliente" style={{
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      minHeight: '100vh',
      paddingBottom: '40px'
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
              onClick={cerrarSesion}
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
        {/* Cabecera mejorada */}
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
            👤
          </div>
          <h1 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '32px', 
            fontWeight: '700',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            Mi Cuenta
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: '18px', 
            opacity: 0.9,
            fontWeight: '300'
          }}>
            Bienvenido a tu área personal, {cliente?.nombre}
          </p>
        </div>

        <div style={{ display: 'grid', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Información del perfil */}
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            }} />
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '16px',
                fontSize: '24px',
                color: 'white'
              }}>
                👤
              </div>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
                Información Personal
              </h2>
                  </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '32px', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '20px'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
                      Nombre Completo
                    </p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                      {cliente?.nombre} {cliente?.apellidos}
                    </p>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
                      Email
                    </p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                      {cliente?.email}
                    </p>
                  </div>

                  {cliente?.telefono && (
                    <div style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
                        Teléfono
                      </p>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                        {cliente.telefono}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(59,130,246,0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.3)';
                }}>
                  ✏️ Editar Perfil
                  </button>
                <button style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(245,158,11,0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(245,158,11,0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,158,11,0.3)';
                }}>
                  🔒 Cambiar Contraseña
                  </button>
                </div>
              </div>
            </div>

          {/* Sistema de Pestañas */}
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: tabActiva === 'pedidos' 
                ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
            }} />
            
            {/* Navegación de Pestañas */}
            <div style={{
              display: 'flex',
              marginBottom: '32px',
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '4px',
              border: '1px solid #e2e8f0'
            }}>
              <button
                onClick={() => setTabActiva('pedidos')}
                style={{
                  flex: 1,
                  background: tabActiva === 'pedidos' 
                    ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                    : 'transparent',
                  color: tabActiva === 'pedidos' ? 'white' : '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                📦 Mis Pedidos
                {pedidos.length > 0 && (
                  <span style={{
                    background: tabActiva === 'pedidos' ? 'rgba(255,255,255,0.2)' : '#8b5cf6',
                    color: tabActiva === 'pedidos' ? 'white' : 'white',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '600',
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {pedidos.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setTabActiva('favoritos')}
                style={{
                  flex: 1,
                  background: tabActiva === 'favoritos' 
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                    : 'transparent',
                  color: tabActiva === 'favoritos' ? 'white' : '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                ❤️ Favoritos
                <span style={{
                  background: tabActiva === 'favoritos' ? 'rgba(255,255,255,0.2)' : '#f59e0b',
                  color: tabActiva === 'favoritos' ? 'white' : 'white',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '600',
                  minWidth: '20px',
                  textAlign: 'center'
                }}>
                  0
                </span>
              </button>
              </div>

            {/* Contenido de las Pestañas */}
            <div style={{ minHeight: '400px' }}>
              {/* Pestaña: Mis Pedidos */}
              {tabActiva === 'pedidos' && (
                <div>
                {cargandoPedidos ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
                      color: '#64748b'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid #e2e8f0',
                        borderTop: '3px solid #8b5cf6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                      }} />
                      <p style={{ margin: 0, fontSize: '16px' }}>Cargando pedidos...</p>
                    </div>
                ) : pedidos.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                      borderRadius: '16px',
                      border: '2px dashed #cbd5e1'
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
                      <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
                        Aún no tienes pedidos
                      </h3>
                      <p style={{ margin: '0 0 24px 0', fontSize: '16px', color: '#64748b' }}>
                        ¡Haz tu primer pedido y comienza a disfrutar de nuestros productos!
                      </p>
                      <Link to="/" style={{
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        color: 'white',
                        textDecoration: 'none',
                        padding: '12px 32px',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        display: 'inline-block',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(139,92,246,0.3)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(139,92,246,0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(139,92,246,0.3)';
                      }}>
                        🛍️ Hacer mi primer pedido
                    </Link>
                  </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {pedidos.map((pedido) => (
                        <div key={pedido.id} style={{
                          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                          borderRadius: '16px',
                          padding: '24px',
                          border: '2px solid #e2e8f0',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = '#8b5cf6';
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(139,92,246,0.15)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        onClick={() => setDetallePedido(pedido)}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '18px',
                                fontWeight: '600'
                              }}>
                                📦
                              </div>
                          <div>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                                  Pedido #{pedido.numeroPedido || pedido.id}
                                </h3>
                                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                                  {new Date(pedido.fechaCreacion).toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                          </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <EstadoBadge estado={pedido.estado} />
                              <button style={{
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 16px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetallePedido(pedido);
                              }}
                              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                👁️ Ver Detalles
                          </button>
                        </div>
                        </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'center' }}>
                            <div>
                              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                                Productos:
                              </p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {pedido.detalles?.slice(0, 3).map(det => (
                                  <span key={det.id} style={{
                                    background: 'white',
                                    padding: '4px 12px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    color: '#1e293b',
                                    border: '1px solid #e2e8f0'
                                  }}>
                                    {det.nombreProducto} {det.cantidad}
                                  </span>
                                ))}
                                {pedido.detalles && pedido.detalles.length > 3 && (
                                  <span style={{
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                    color: 'white',
                                    padding: '4px 12px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                  }}>
                                    +{pedido.detalles.length - 3} más
                                  </span>
                                )}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#64748b' }}>
                                Total
                              </p>
                              <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#8b5cf6' }}>
                                ${pedido.total?.toFixed(2)}
                              </p>
                            </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}

              {/* Pestaña: Favoritos */}
              {tabActiva === 'favoritos' && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderRadius: '16px',
                  border: '2px dashed #cbd5e1'
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
                    ❤️
            </div>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
                    No tienes favoritos aún
                  </h3>
                  <p style={{ margin: '0 0 24px 0', fontSize: '16px', color: '#64748b' }}>
                    Guarda tus productos favoritos para encontrarlos fácilmente
                  </p>
                  <Link to="/" style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    textDecoration: 'none',
                    padding: '12px 32px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    display: 'inline-block',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(245,158,11,0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(245,158,11,0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,158,11,0.3)';
                  }}>
                    🔍 Explorar Productos
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal de detalles del pedido */}
      <PedidoDetalleModal 
        pedido={detallePedido} 
        open={!!detallePedido} 
        onClose={() => setDetallePedido(null)} 
      />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
