import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useResponsive } from '../../hooks/useResponsive';
import type { Pedido } from '../../types';
import type { DetallePedido } from '../../types';
import { formatearFechaConHora } from '../../utils/dateUtils';

// Tipo para las estadísticas de pedidos
interface EstadisticasPedidos {
  totalPedidos?: number;
  pedidosPendientes?: number;
  pedidosConfirmados?: number;
  pedidosPreparando?: number;
  pedidosEnviados?: number;
  pedidosEntregados?: number;
  pedidosCancelados?: number;
  totalVentas?: number;
  promedioTicket?: number;
  [key: string]: number | undefined; // Para propiedades adicionales
}

// Componente Modal para detalles del pedido
function PedidoDetalleModal({ pedido, open, onClose }: { pedido: Pedido | null, open: boolean, onClose: () => void }) {
  const { isMobile } = useResponsive();
  const [productoSeleccionado, setProductoSeleccionado] = useState<DetallePedido | null>(null);
  const [mostrarProducto, setMostrarProducto] = useState(false);

  if (!pedido || !open) return null;
  const wideLines = !isMobile;

  const obtenerColorEstado = (estado: Pedido['estado']) => {
    const colores: Record<Pedido['estado'], string> = {
      PENDIENTE: '#f59e0b',
      PENDIENTE_PAGO: '#f59e0b',
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
      PENDIENTE_PAGO: 'Pendiente de Pago',
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
        zIndex: 1100, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        padding: isMobile ? '12px' : '20px',
        boxSizing: 'border-box'
      }}>
        <div className="modal-content" style={{
          background: '#fff',
          borderRadius: isMobile ? '14px' : '16px',
          padding: '0',
          width: '100%',
          maxWidth: wideLines ? 'min(1040px, calc(100vw - 40px))' : '100%',
          maxHeight: 'min(92vh, 880px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(15,23,42,0.22)',
          border: '1px solid #e2e8f0'
        }}>
          {/* Header del modal */}
          <div style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #3730a3 100%)',
            color: 'white',
            padding: isMobile ? '12px 14px' : '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexShrink: 0
          }}>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? '17px' : '19px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Pedido #{pedido.numeroPedido || pedido.id}
              </h2>
              <p style={{ margin: '3px 0 0 0', opacity: 0.92, fontSize: isMobile ? '12px' : '13px' }}>
                {formatearFechaConHora(pedido.fechaCreacion)}
              </p>
            </div>
            <button 
              type="button"
              aria-label="Cerrar"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '10px',
                width: 36,
                height: 36,
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
          <div style={{ flex: 1, minHeight: 0, padding: isMobile ? '12px 14px' : '16px 20px', overflow: 'auto' }}>
            {/* Información del cliente */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '10px',
              padding: isMobile ? '10px 12px' : '12px 14px',
              marginBottom: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: isMobile ? '12px' : '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Cliente
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: isMobile ? '8px' : '10px' 
              }}>
                <div>
                  <p style={{ margin: '0 0 2px 0', fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Nombre</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                    {pedido.cliente?.nombre} {pedido.cliente?.apellidos}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 2px 0', fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Email</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a', wordBreak: 'break-all' }}>
                    {pedido.cliente?.email}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 2px 0', fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Teléfono</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                    {pedido.cliente?.telefono || 'No especificado'}
                  </p>
                </div>
              </div>
            </div>

            {/* Estado del pedido */}
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center', 
                justifyContent: 'space-between',
                gap: isMobile ? '16px' : '0'
              }}>
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
                        • Pedido cancelado - no se puede modificar
                      </span>
                    )}
                    {pedido.estado === 'ENTREGADO' && (
                      <span style={{ fontSize: '14px', color: '#64748b' }}>
                        • Pedido completado exitosamente
                      </span>
                    )}
                  </div>
                  {pedido.estado === 'CANCELADO' && (
                    <div style={{ 
                      marginTop: '12px', 
                      padding: '12px', 
                      background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', 
                      border: '1px solid #fecaca', 
                      borderRadius: '8px' 
                    }}>
                      <p style={{ margin: 0, fontSize: '14px', color: '#dc2626', fontWeight: '500' }}>
                        <strong>ℹ️ Información:</strong> Al cancelar este pedido, el stock de los productos ha sido restaurado automáticamente.
                      </p>
                    </div>
                  )}
                </div>
                <div style={{
                  width: isMobile ? '50px' : '60px',
                  height: isMobile ? '50px' : '60px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${obtenerColorEstado(pedido.estado)}20 0%, ${obtenerColorEstado(pedido.estado)}40 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `3px solid ${obtenerColorEstado(pedido.estado)}30`,
                  alignSelf: isMobile ? 'center' : 'flex-end'
                }}>
                  <span style={{ fontSize: isMobile ? '20px' : '24px', color: obtenerColorEstado(pedido.estado) }}>
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

            {/* Dirección de entrega */}
            {pedido.direccionEntrega && (
              <div style={{
                background: '#fff',
                borderRadius: '10px',
                padding: isMobile ? '10px 12px' : '12px 14px',
                marginBottom: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ 
                  margin: '0 0 6px 0', 
                  fontSize: isMobile ? '12px' : '13px', 
                  fontWeight: 700, 
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Entrega
                </h3>
                <p style={{ 
                  margin: 0, 
                  fontSize: isMobile ? '13px' : '14px', 
                  color: '#334155', 
                  lineHeight: '1.45',
                  wordBreak: 'break-word'
                }}>
                  {pedido.direccionEntrega}
                </p>
              </div>
            )}

            {/* Productos */}
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ 
                margin: '0 0 8px 0', 
                fontSize: isMobile ? '14px' : '15px', 
                fontWeight: 800, 
                color: '#0f172a' 
              }}>
                Productos <span style={{ fontWeight: 600, color: '#64748b' }}>({pedido.detalles?.length || 0})</span>
              </h3>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                {wideLines && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '44px 1fr 72px 72px 88px',
                    gap: 8,
                    padding: '8px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#94a3b8',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}>
                    <span />
                    <span>Producto</span>
                    <span style={{ textAlign: 'right' }}>P. unit.</span>
                    <span style={{ textAlign: 'center' }}>Cant.</span>
                    <span style={{ textAlign: 'right' }}>Subt.</span>
                  </div>
                )}

                {pedido.detalles?.map((detalle, index) => {
                  const thumb = isMobile ? 40 : 44;
                  const nombre = detalle.productoNombre || detalle.nombreProducto;
                  const subt = detalle.subtotal?.toFixed(2) || detalle.precioTotal?.toFixed(2) || '0.00';
                  return (
                    <div
                      key={detalle.id || index}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          verDetalleProducto(detalle);
                        }
                      }}
                      onClick={() => verDetalleProducto(detalle)}
                      style={{
                        display: wideLines ? 'grid' : 'flex',
                        gridTemplateColumns: wideLines ? '44px 1fr 72px 72px 88px' : undefined,
                        gap: wideLines ? 8 : 10,
                        alignItems: wideLines ? 'center' : 'flex-start',
                        padding: isMobile ? '10px 10px' : '10px 12px',
                        borderBottom: index < (pedido.detalles?.length || 0) - 1 ? '1px solid #f1f5f9' : 'none',
                        cursor: 'pointer',
                        transition: 'background 0.12s ease'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; }}
                    >
                      <div style={{ flexShrink: 0, width: thumb, height: thumb }}>
                        {detalle.productoImagen ? (
                          <img
                            src={detalle.productoImagen}
                            alt=""
                            style={{ width: thumb, height: thumb, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0', display: 'block' }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{ width: thumb, height: thumb, background: '#f1f5f9', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#94a3b8' }}>—</div>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: isMobile ? 13 : 14,
                          fontWeight: 700,
                          color: '#0f172a',
                          lineHeight: 1.25,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {nombre}
                        </div>
                        {!wideLines && (
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                            ${detalle.precioUnitario?.toFixed(2)} c/u · {detalle.cantidad} u. ·{' '}
                            <span style={{ fontWeight: 800, color: '#0f172a' }}>${subt}</span>
                          </div>
                        )}
                      </div>

                      {wideLines && (
                        <>
                          <span style={{ fontSize: 13, color: '#64748b', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                            ${detalle.precioUnitario?.toFixed(2)}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', color: '#334155' }}>
                            {detalle.cantidad}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 800, textAlign: 'right', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                            ${subt}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resumen de totales */}
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '16px',
              padding: isMobile ? '16px' : '24px',
              border: '2px solid #e2e8f0'
            }}>
              <h3 style={{ 
                margin: '0 0 16px 0', 
                fontSize: isMobile ? '18px' : '20px', 
                fontWeight: '600', 
                color: '#1e293b' 
              }}>
                💰 Resumen de Totales
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '12px' }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'space-between', 
                  alignItems: isMobile ? 'flex-start' : 'center',
                  gap: isMobile ? '4px' : '0'
                }}>
                  <span style={{ 
                    fontSize: isMobile ? '14px' : '16px', 
                    color: '#64748b' 
                  }}>
                    Subtotal:
                  </span>
                  <span style={{ 
                    fontSize: isMobile ? '14px' : '16px', 
                    fontWeight: '600', 
                    color: '#1e293b' 
                  }}>
                    ${pedido.subtotal?.toFixed(2) || pedido.total?.toFixed(2)}
                  </span>
                </div>
                {pedido.impuestos && pedido.impuestos > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between', 
                    alignItems: isMobile ? 'flex-start' : 'center',
                    gap: isMobile ? '4px' : '0'
                  }}>
                    <span style={{ 
                      fontSize: isMobile ? '14px' : '16px', 
                      color: '#64748b' 
                    }}>
                      Impuestos:
                    </span>
                    <span style={{ 
                      fontSize: isMobile ? '14px' : '16px', 
                      fontWeight: '600', 
                      color: '#1e293b' 
                    }}>
                      ${pedido.impuestos.toFixed(2)}
                    </span>
                  </div>
                )}
                {pedido.descuento && pedido.descuento > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between', 
                    alignItems: isMobile ? 'flex-start' : 'center',
                    gap: isMobile ? '4px' : '0'
                  }}>
                    <span style={{ 
                      fontSize: isMobile ? '14px' : '16px', 
                      color: '#64748b' 
                    }}>
                      Descuento:
                    </span>
                    <span style={{ 
                      fontSize: isMobile ? '14px' : '16px', 
                      fontWeight: '600', 
                      color: '#059669' 
                    }}>
                      -${pedido.descuento.toFixed(2)}
                    </span>
                  </div>
                )}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  justifyContent: 'space-between', 
                  alignItems: isMobile ? 'flex-start' : 'center',
                  padding: isMobile ? '12px 0' : '16px 0',
                  borderTop: '2px solid #cbd5e1',
                  marginTop: '8px',
                  gap: isMobile ? '8px' : '0'
                }}>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: isMobile ? '18px' : '20px', 
                    fontWeight: '700', 
                    color: '#1e293b' 
                  }}>
                    Total del Pedido
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    fontSize: isMobile ? '20px' : '24px', 
                    fontWeight: '800', 
                    color: '#059669' 
                  }}>
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
                  {(productoSeleccionado.productoMarca || productoSeleccionado.marcaProducto) && (
                    <p style={{ 
                      margin: '0 0 12px 0', 
                      fontSize: '16px', 
                      color: '#64748b',
                      lineHeight: '1.6',
                      fontWeight: '500'
                    }}>
                      🏷️ {productoSeleccionado.productoMarca || productoSeleccionado.marcaProducto}
                    </p>
                  )}
                  {(productoSeleccionado.productoDescripcion || productoSeleccionado.descripcionProducto) && (
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
                        {productoSeleccionado.productoDescripcion || productoSeleccionado.descripcionProducto}
                      </p>
                    </div>
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
                        ${productoSeleccionado.subtotal?.toFixed(2) || productoSeleccionado.precioTotal?.toFixed(2)}
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

export default function GestionPedidos() {
  const { isMobile } = useResponsive();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [cargando, setCargando] = useState(true);
  const [empresaId, setEmpresaId] = useState<number | null>(null);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [empresaNombre, setEmpresaNombre] = useState<string>('');
  const [nombreAdministrador, setNombreAdministrador] = useState<string>('');
  
  // Estados para estadísticas
  const [estadisticas, setEstadisticas] = useState<EstadisticasPedidos | null>(null);
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(false);

  useEffect(() => {
    // Obtener empresaId del usuario logueado
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setEmpresaId(user.empresaId);
        setEmpresaNombre(user.empresaNombre || '');
        setNombreAdministrador(user.nombre || '');
      } catch (error) {
        console.log('Error al parsear el usuario:', error);
        /* ignorado */
      }
    }
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/admin/login';
  };

  useEffect(() => {
    if (empresaId) {
      console.log('useEffect ejecutado con empresaId:', empresaId);
      cargarPedidos();
      cargarEstadisticas();
      
      // Marcar todos los pedidos como vistos
      const marcarPedidosComoVistos = async () => {
        try {
          const response = await api.obtenerPedidos(empresaId, 0, 1000);
          const pedidosApi: Pedido[] = response.content || [];
          
          // Ordenar pedidos por fecha de creación (más recientes primero)
          const pedidosOrdenados = pedidosApi.sort((a, b) => {
            const fechaA = new Date(a.fechaCreacion);
            const fechaB = new Date(b.fechaCreacion);
            return fechaB.getTime() - fechaA.getTime();
          });
          
          const todosLosIds = pedidosOrdenados.map((pedido: Pedido) => pedido.id);
          localStorage.setItem(`pedidosVistos_${empresaId}`, JSON.stringify(todosLosIds));
        } catch (error) {
          console.error('Error al marcar pedidos como vistos:', error);
        }
      };
      
      marcarPedidosComoVistos();
    }
  }, [empresaId]);

  // Manejar tecla Esc para salir de la sección
  useEffect(() => {
    const manejarTeclaEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        
        // Si el modal de detalles está abierto, solo cerrarlo
        if (mostrarDetalle) {
          setMostrarDetalle(false);
          setPedidoSeleccionado(null);
          return;
        }
        
        // Si no hay modal abierto, navegar al panel principal
        window.location.href = '/admin';
      }
    };

    document.addEventListener('keydown', manejarTeclaEsc);
    return () => {
      document.removeEventListener('keydown', manejarTeclaEsc);
    };
  }, [mostrarDetalle]);

  const cargarEstadisticas = async () => {
    if (!empresaId) return;
    
    try {
      setCargandoEstadisticas(true);
      console.log('Cargando estadísticas para empresa:', empresaId);
      
      // Verificar token
      const token = localStorage.getItem('token');
      console.log('Token disponible:', token ? 'Sí' : 'No');
      if (token) {
        console.log('Token (primeros 20 chars):', token.substring(0, 20) + '...');
      }
      
      // Primero probar la conectividad
      try {
        const testResponse = await api.testEstadisticasPedidos(empresaId);
        console.log('Test de conectividad exitoso:', testResponse);
      } catch (testErr) {
        console.error('Error en test de conectividad:', testErr);
      }
      
      const response = await api.obtenerEstadisticasPedidos(empresaId);
      console.log('Respuesta de estadísticas:', response);
      if (response && response.data) {
        setEstadisticas(response.data as EstadisticasPedidos);
        console.log('Estadísticas cargadas:', response);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    } finally {
      setCargandoEstadisticas(false);
    }
  };

  const cargarPedidos = async () => {
    if (!empresaId) return;
    setCargando(true);
    try {
      console.log('Cargando pedidos para empresa:', empresaId);
      const response = await api.obtenerPedidos(empresaId, 0, 100);
      console.log('Respuesta de pedidos:', response);
      
      // Verificar si la respuesta tiene la estructura esperada
      const pedidosApi: Pedido[] = response.content || [];
      console.log('Pedidos cargados:', pedidosApi);
      
      // Ordenar pedidos por fecha de creación (más recientes primero)
      const pedidosOrdenados = pedidosApi.sort((a, b) => {
        const fechaA = new Date(a.fechaCreacion);
        const fechaB = new Date(b.fechaCreacion);
        return fechaB.getTime() - fechaA.getTime(); // Orden descendente (más reciente primero)
      });
      
      setPedidos(pedidosOrdenados);
    } catch (e) {
      console.error('Error al cargar pedidos:', e);
      toast.error('Error al cargar los pedidos');
    } finally {
      setCargando(false);
    }
  };

  const cambiarEstadoPedido = async (id: number, nuevoEstado: Pedido['estado']) => {
    try {
      // Si es cancelar, pedir confirmación
      if (nuevoEstado === 'CANCELADO') {
        const confirmar = window.confirm('¿Estás seguro de que quieres cancelar este pedido? Esta acción no se puede deshacer.');
        if (!confirmar) {
          return;
        }
      }
      
      // Llamar al backend para actualizar el estado
      await api.actualizarEstadoPedido(empresaId!, id, nuevoEstado);
      
      // Actualizar el estado local
      setPedidos(prev => prev.map(pedido => 
        pedido.id === id ? { ...pedido, estado: nuevoEstado } : pedido
      ));
      
      const mensaje = nuevoEstado === 'CANCELADO' ? 'Pedido cancelado exitosamente' : 'Estado del pedido actualizado';
      toast.success(mensaje);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      toast.error('Error al actualizar el estado del pedido');
    }
  };

  const verDetalles = (pedido: Pedido) => {
    setPedidoSeleccionado(pedido);
    setMostrarDetalle(true);
  };

  const ESTADOS_PEDIDO = [
    'PENDIENTE',
    'CONFIRMADO',
    'PREPARANDO',
    'ENVIADO',
    'ENTREGADO',
    'CANCELADO',
  ] as const;

  const obtenerColorEstado = (estado: Pedido['estado']) => {
    const colores: Record<Pedido['estado'], string> = {
      PENDIENTE: '#f59e0b',
      PENDIENTE_PAGO: '#f59e0b',
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
      PENDIENTE_PAGO: 'Pendiente de Pago',
      CONFIRMADO: 'Confirmado',
      PREPARANDO: 'Preparando',
      ENVIADO: 'Enviado',
      ENTREGADO: 'Entregado',
      CANCELADO: 'Cancelado',
    };
    return textos[estado] || estado;
  };

  const pedidosFiltrados = filtroEstado === 'todos'
    ? pedidos
    : pedidos.filter(pedido => pedido.estado === filtroEstado.toUpperCase());

  if (cargando) {
    return (
      <div className="h-pantalla-minimo" style={{ backgroundColor: '#f8fafc' }}>
        <NavbarAdmin 
          onCerrarSesion={cerrarSesion}
          empresaNombre={empresaNombre}
          nombreAdministrador={nombreAdministrador}
        />
        <div className="contenedor" style={{ 
          paddingTop: (isMobile || window.innerWidth < 768) ? '10.5rem' : '5rem', 
          paddingBottom: '2rem',
          paddingLeft: '1rem',
          paddingRight: '1rem'
        }}>
          <div className="tarjeta text-center py-12">
            <div className="spinner mx-auto mb-4"></div>
            <p>Cargando pedidos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-pantalla-minimo" style={{ backgroundColor: '#f8fafc' }}>
      {/* Navegación */}
      <NavbarAdmin 
        onCerrarSesion={cerrarSesion}
        empresaNombre={empresaNombre}
        nombreAdministrador={nombreAdministrador}
      />

      {/* Contenido principal */}
      <div className="contenedor" style={{ 
        paddingTop: (isMobile || window.innerWidth < 768) ? '10.5rem' : '5rem', 
        paddingBottom: '2rem',
        paddingLeft: '1rem',
        paddingRight: '1rem'
      }}>
        <div className="mb-8" style={{ textAlign: isMobile ? 'center' : 'left' }}>
          <h1 className="titulo-2 mb-4" style={{ 
            fontSize: isMobile ? '1.75rem' : '32px', 
            fontWeight: '700', 
            color: '#1e293b',
            letterSpacing: '-0.025em',
            lineHeight: '1.2'
          }}>
            📋 Gestión de Pedidos
          </h1>
          <p className="texto-gris" style={{ 
            fontSize: isMobile ? '1rem' : '16px', 
            color: '#64748b',
            marginBottom: '8px'
          }}>
            Administra todos los pedidos de tu tienda de manera eficiente.
          </p>
          <div style={{
            height: '4px',
            width: '60px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            borderRadius: '2px',
            marginTop: '16px',
            marginLeft: isMobile ? 'auto' : '0',
            marginRight: isMobile ? 'auto' : '0'
          }}></div>
        </div>

        {/* Estadísticas Generales */}
        {cargandoEstadisticas ? (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e2e8f0',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }} />
            <p style={{ color: '#64748b', margin: 0 }}>Cargando estadísticas...</p>
          </div>
        ) : estadisticas ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: isMobile ? '1rem' : '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: isMobile ? '1rem' : '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '0.5rem',
                flexDirection: isMobile ? 'column' : 'row',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                <span style={{ 
                  fontSize: isMobile ? '1.5rem' : '2rem', 
                  marginRight: isMobile ? '0' : '1rem',
                  marginBottom: isMobile ? '0.5rem' : '0'
                }}>💰</span>
                <div>
                  <div style={{ 
                    color: '#64748b', 
                    fontSize: isMobile ? '0.75rem' : '0.875rem' 
                  }}>Total Pedidos</div>
                  <div style={{ 
                    fontSize: isMobile ? '1.25rem' : '1.5rem', 
                    fontWeight: '700', 
                    color: '#1e293b' 
                  }}>
                    {estadisticas.totalPedidos || 0}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: isMobile ? '1rem' : '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '0.5rem',
                flexDirection: isMobile ? 'column' : 'row',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                <span style={{ 
                  fontSize: isMobile ? '1.5rem' : '2rem', 
                  marginRight: isMobile ? '0' : '1rem',
                  marginBottom: isMobile ? '0.5rem' : '0'
                }}>🛒</span>
                <div>
                  <div style={{ 
                    color: '#64748b', 
                    fontSize: isMobile ? '0.75rem' : '0.875rem' 
                  }}>Transacciones</div>
                  <div style={{ 
                    fontSize: isMobile ? '1.25rem' : '1.5rem', 
                    fontWeight: '700', 
                    color: '#1e293b' 
                  }}>
                    {estadisticas.totalTransacciones || 0}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: isMobile ? '1rem' : '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '0.5rem',
                flexDirection: isMobile ? 'column' : 'row',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                <span style={{ 
                  fontSize: isMobile ? '1.5rem' : '2rem', 
                  marginRight: isMobile ? '0' : '1rem',
                  marginBottom: isMobile ? '0.5rem' : '0'
                }}>📦</span>
                <div>
                  <div style={{ 
                    color: '#64748b', 
                    fontSize: isMobile ? '0.75rem' : '0.875rem' 
                  }}>Productos Vendidos</div>
                  <div style={{ 
                    fontSize: isMobile ? '1.25rem' : '1.5rem', 
                    fontWeight: '700', 
                    color: '#1e293b' 
                  }}>
                    {estadisticas.totalProductos || 0}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: isMobile ? '1rem' : '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '0.5rem',
                flexDirection: isMobile ? 'column' : 'row',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                <span style={{ 
                  fontSize: isMobile ? '1.5rem' : '2rem', 
                  marginRight: isMobile ? '0' : '1rem',
                  marginBottom: isMobile ? '0.5rem' : '0'
                }}>📊</span>
                <div>
                  <div style={{ 
                    color: '#64748b', 
                    fontSize: isMobile ? '0.75rem' : '0.875rem' 
                  }}>Cantidad Pedidos</div>
                  <div style={{ 
                    fontSize: isMobile ? '1.25rem' : '1.5rem', 
                    fontWeight: '700', 
                    color: '#1e293b' 
                  }}>
                    {estadisticas.cantidadPedidos || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <p style={{ color: '#64748b', margin: 0 }}>No se pudieron cargar las estadísticas</p>
          </div>
        )}

        {/* Filtros */}
        <div className="tarjeta mb-6" style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: isMobile ? '16px' : '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <h3 className="titulo-3 mb-4" style={{
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '16px'
          }}>
            🔍 Filtrar por Estado
          </h3>
          <div className="flex gap-2 flex-wrap" style={{
            gap: isMobile ? '0.5rem' : '0.5rem',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
                          <button
                onClick={() => setFiltroEstado('todos')}
                className={`boton ${filtroEstado === 'todos' ? 'boton-primario' : 'boton-secundario'}`}
                style={{
                  background: filtroEstado === 'todos' ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : '#f8fafc',
                  color: filtroEstado === 'todos' ? 'white' : '#64748b',
                  border: '2px solid',
                  borderColor: filtroEstado === 'todos' ? '#3b82f6' : '#e2e8f0',
                  borderRadius: '12px',
                  padding: isMobile ? '8px 12px' : '10px 16px',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: filtroEstado === 'todos' ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                📊 Todos ({pedidos.length})
              </button>
            {ESTADOS_PEDIDO.map(estado => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`boton ${filtroEstado === estado ? 'boton-primario' : 'boton-secundario'}`}
                style={{
                  background: filtroEstado === estado ? `linear-gradient(135deg, ${obtenerColorEstado(estado)} 0%, ${obtenerColorEstado(estado)}dd 100%)` : '#f8fafc',
                  color: filtroEstado === estado ? 'white' : '#64748b',
                  border: '2px solid',
                  borderColor: filtroEstado === estado ? obtenerColorEstado(estado) : '#e2e8f0',
                  borderRadius: '12px',
                  padding: isMobile ? '8px 12px' : '10px 16px',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: filtroEstado === estado ? `0 4px 12px ${obtenerColorEstado(estado)}40` : 'none',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                {estado === 'PENDIENTE' && '⏳'}
                {estado === 'CONFIRMADO' && '✅'}
                {estado === 'PREPARANDO' && '👨‍🍳'}
                {estado === 'ENVIADO' && '🚚'}
                {estado === 'ENTREGADO' && '🎉'}
                {estado === 'CANCELADO' && '❌'}
                {' '}{obtenerTextoEstado(estado)} ({pedidos.filter(p => p.estado === estado).length})
              </button>
            ))}
          </div>
        </div>

        {/* Lista de pedidos */}
        <div className="tarjeta" style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: isMobile ? '16px' : '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <h3 className="titulo-3 mb-6" style={{
            fontSize: isMobile ? '18px' : '22px',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexDirection: isMobile ? 'column' : 'row',
            textAlign: isMobile ? 'center' : 'left'
          }}>
            📦 Pedidos {filtroEstado !== 'todos' && `- ${obtenerTextoEstado(filtroEstado as Pedido['estado'])}`}
            <span style={{
              background: '#e2e8f0',
              color: '#64748b',
              fontSize: '14px',
              padding: '4px 12px',
              borderRadius: '20px',
              fontWeight: '500'
            }}>
              {pedidosFiltrados.length}
            </span>
          </h3>
          
          {pedidosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <div style={{
                fontSize: '48px',
                marginBottom: '16px',
                opacity: 0.5
              }}>
                📭
              </div>
              <p className="texto-gris" style={{ fontSize: '16px', color: '#64748b' }}>
                No hay pedidos que mostrar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pedidosFiltrados.map(pedido => (
                <div
                  key={pedido.id}
                  className="p-6 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    border: '2px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: isMobile ? '16px' : '24px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Header del pedido - Responsive */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'flex-start' : 'center', 
                    justifyContent: 'space-between', 
                    marginBottom: isMobile ? '16px' : '24px',
                    gap: isMobile ? '12px' : '0'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 className="titulo-3 mb-1" style={{
                        fontSize: isMobile ? '18px' : '20px',
                        fontWeight: '700',
                        color: '#1e293b',
                        marginBottom: '8px',
                        wordBreak: 'break-word'
                      }}>
                        🛒 Pedido #{pedido.numeroPedido || pedido.id}
                      </h4>
                      <p className="texto-pequeno texto-gris" style={{
                        fontSize: isMobile ? '12px' : '14px',
                        color: '#64748b',
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: isMobile ? 'flex-start' : 'center',
                        gap: isMobile ? '4px' : '8px',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{ wordBreak: 'break-word' }}>
                          👤 {pedido.cliente?.nombre} {pedido.cliente?.apellidos}
                        </span>
                        {!isMobile && <span style={{ color: '#cbd5e1' }}>•</span>}
                        <span style={{ wordBreak: 'break-word' }}>
                          📅 {formatearFechaConHora(pedido.fechaCreacion)}
                        </span>
                      </p>
                    </div>
                    
                    {/* Información del total - Responsive */}
                    <div style={{ 
                      textAlign: isMobile ? 'left' : 'right',
                      alignSelf: isMobile ? 'flex-start' : 'center'
                    }}>
                      <p className="titulo-3" style={{ 
                        fontSize: isMobile ? '20px' : '24px', 
                        fontWeight: '700', 
                        color: '#059669',
                        marginBottom: '8px'
                      }}>
                        ${pedido.total?.toFixed(2)}
                      </p>
                      <p className="texto-pequeno texto-gris" style={{ 
                        fontSize: isMobile ? '12px' : '14px', 
                        color: '#64748b',
                        background: '#f1f5f9',
                        padding: isMobile ? '4px 8px' : '6px 12px',
                        borderRadius: '8px',
                        display: 'inline-block',
                        fontWeight: '500'
                      }}>
                        📦 {pedido.detalles?.length || 0} producto{(pedido.detalles?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Estado y botones - Responsive */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'flex-start' : 'center', 
                    justifyContent: 'space-between',
                    gap: isMobile ? '12px' : '0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        className="px-3 py-1 rounded-full texto-pequeno"
                        style={{
                          backgroundColor: obtenerColorEstado(pedido.estado) + '20',
                          color: obtenerColorEstado(pedido.estado),
                          fontWeight: '600',
                          padding: isMobile ? '6px 12px' : '8px 16px',
                          borderRadius: '20px',
                          fontSize: isMobile ? '12px' : '14px',
                          border: `2px solid ${obtenerColorEstado(pedido.estado)}30`,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {pedido.estado === 'PENDIENTE' && '⏳'}
                        {pedido.estado === 'CONFIRMADO' && '✅'}
                        {pedido.estado === 'PREPARANDO' && '👨‍🍳'}
                        {pedido.estado === 'ENVIADO' && '🚚'}
                        {pedido.estado === 'ENTREGADO' && '🎉'}
                        {pedido.estado === 'CANCELADO' && '❌'}
                        {' '}{obtenerTextoEstado(pedido.estado)}
                      </span>
                    </div>

                    {/* Botones de acción - Responsive */}
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: isMobile ? '8px' : '8px',
                      width: isMobile ? '100%' : 'auto'
                    }}>
                      {pedido.estado === 'PENDIENTE' && (
                        <>
                          <button
                            onClick={() => cambiarEstadoPedido(pedido.id, 'CONFIRMADO')}
                            className="boton boton-primario texto-pequeno"
                            style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: isMobile ? '8px 12px' : '8px 16px',
                              fontSize: isMobile ? '12px' : '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                              width: isMobile ? '100%' : 'auto',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {isMobile ? '✅ Confirmar' : '✅ Confirmar'}
                          </button>
                          <button
                            onClick={() => cambiarEstadoPedido(pedido.id, 'CANCELADO')}
                            className="boton boton-secundario texto-pequeno"
                            style={{
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: isMobile ? '8px 12px' : '8px 16px',
                              fontSize: isMobile ? '12px' : '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
                              width: isMobile ? '100%' : 'auto',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {isMobile ? '❌ Rechazar' : '❌ Rechazar'}
                          </button>
                        </>
                      )}
                      {pedido.estado === 'CONFIRMADO' && (
                        <>
                          <button
                            onClick={() => cambiarEstadoPedido(pedido.id, 'PREPARANDO')}
                            className="boton boton-primario texto-pequeno"
                            style={{
                              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: isMobile ? '8px 12px' : '8px 16px',
                              fontSize: isMobile ? '12px' : '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                              width: isMobile ? '100%' : 'auto',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {isMobile ? '👨‍🍳 Preparar' : '👨‍🍳 Preparar'}
                          </button>
                          <button
                            onClick={() => cambiarEstadoPedido(pedido.id, 'CANCELADO')}
                            className="boton boton-secundario texto-pequeno"
                            style={{
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: isMobile ? '8px 12px' : '8px 16px',
                              fontSize: isMobile ? '12px' : '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
                              width: isMobile ? '100%' : 'auto',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {isMobile ? '❌ Cancelar' : '❌ Cancelar'}
                          </button>
                        </>
                      )}
                      {pedido.estado === 'PREPARANDO' && (
                        <>
                          <button
                            onClick={() => cambiarEstadoPedido(pedido.id, 'ENVIADO')}
                            className="boton boton-primario texto-pequeno"
                            style={{
                              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: isMobile ? '8px 12px' : '8px 16px',
                              fontSize: isMobile ? '12px' : '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 8px rgba(139,92,246,0.3)',
                              width: isMobile ? '100%' : 'auto',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {isMobile ? '🚚 Enviar' : '🚚 Marcar como Enviado'}
                          </button>
                          <button
                            onClick={() => cambiarEstadoPedido(pedido.id, 'CANCELADO')}
                            className="boton boton-secundario texto-pequeno"
                            style={{
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: isMobile ? '8px 12px' : '8px 16px',
                              fontSize: isMobile ? '12px' : '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
                              width: isMobile ? '100%' : 'auto',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {isMobile ? '❌ Cancelar' : '❌ Cancelar'}
                          </button>
                        </>
                      )}
                      {pedido.estado === 'ENVIADO' && (
                        <>
                          <button
                            onClick={() => cambiarEstadoPedido(pedido.id, 'ENTREGADO')}
                            className="boton boton-primario texto-pequeno"
                            style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: isMobile ? '8px 12px' : '8px 16px',
                              fontSize: isMobile ? '12px' : '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                              width: isMobile ? '100%' : 'auto',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {isMobile ? '🎉 Entregar' : '🎉 Marcar como Entregado'}
                          </button>
                          <button
                            onClick={() => cambiarEstadoPedido(pedido.id, 'CANCELADO')}
                            className="boton boton-secundario texto-pequeno"
                            style={{
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: isMobile ? '8px 12px' : '8px 16px',
                              fontSize: isMobile ? '12px' : '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
                              width: isMobile ? '100%' : 'auto',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {isMobile ? '❌ Cancelar' : '❌ Cancelar'}
                          </button>
                        </>
                      )}
                      {pedido.estado === 'CANCELADO' && (
                        <span className="texto-pequeno" style={{ 
                          color: '#ef4444',
                          fontSize: isMobile ? '12px' : '14px',
                          fontWeight: '600',
                          padding: isMobile ? '6px 12px' : '8px 16px',
                          background: '#fef2f2',
                          borderRadius: '8px',
                          border: '1px solid #fecaca',
                          width: isMobile ? '100%' : 'auto',
                          textAlign: isMobile ? 'center' : 'left'
                        }}>
                          ❌ Pedido cancelado
                        </span>
                      )}
                      {pedido.estado === 'ENTREGADO' && (
                        <span className="texto-pequeno" style={{ 
                          color: '#10b981',
                          fontSize: isMobile ? '12px' : '14px',
                          fontWeight: '600',
                          padding: isMobile ? '6px 12px' : '8px 16px',
                          background: '#f0fdf4',
                          borderRadius: '8px',
                          border: '1px solid #bbf7d0',
                          width: isMobile ? '100%' : 'auto',
                          textAlign: isMobile ? 'center' : 'left'
                        }}>
                          🎉 Pedido entregado
                        </span>
                      )}
                      <button 
                        onClick={() => verDetalles(pedido)}
                        className="boton boton-secundario texto-pequeno"
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: isMobile ? '8px 12px' : '8px 16px',
                          fontSize: isMobile ? '12px' : '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
                          width: isMobile ? '100%' : 'auto',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {isMobile ? '👁️ Ver' : '👁️ Ver Detalles'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalles */}
      <PedidoDetalleModal 
        pedido={pedidoSeleccionado} 
        open={mostrarDetalle} 
        onClose={() => {
          setMostrarDetalle(false);
          setPedidoSeleccionado(null);
        }} 
      />
    </div>
  );
}
