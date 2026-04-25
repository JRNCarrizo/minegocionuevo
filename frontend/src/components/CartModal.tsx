import React, { useState } from "react";
import "../styles/cart-modal.css";
import { useCart } from "../hooks/useCart";
import ConfirmarCompraModal from "./ConfirmarCompraModal";
import apiService from "../services/api";
import { useSubdominio } from "../hooks/useSubdominio";
import { useResponsive } from "../hooks/useResponsive";
import toast from "react-hot-toast";
import * as cookies from "../utils/cookies";

interface CartModalProps {
  open: boolean;
  onClose: () => void;
  onCompraExitosa?: () => void; // Callback para recargar productos
  /** Si es false, se muestra lista y total pero no el flujo de compra (visitante sin sesión). */
  permitirCompra?: boolean;
}

const getClienteInfo = () => {
  console.log('=== DEBUG GET CLIENTE INFO ===');
  
  // Buscar en cookies primero (se comparte entre subdominios)
  let cliente = cookies.getCookie("clienteInfo");
  console.log('Cliente en cookies:', cliente);
  
  // Si no está en cookies, buscar en localStorage
  if (!cliente) {
    cliente = localStorage.getItem("clienteInfo");
    console.log('Cliente en localStorage:', cliente);
  }
  
  if (cliente) {
    try {
      const clienteParsed = JSON.parse(cliente);
      console.log('Cliente parseado:', clienteParsed);
      return clienteParsed;
    } catch (error) {
      console.error('Error parseando cliente:', error);
      return null;
    }
  }
  console.log('No se encontró información del cliente');
  return null;
};

const CartModal: React.FC<CartModalProps> = ({ open, onClose, onCompraExitosa, permitirCompra = true }) => {
  const { items, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const [showConfirm, setShowConfirm] = useState(false);
  const [compraRealizada, setCompraRealizada] = useState(false);
  const [loading, setLoading] = useState(false);
  const usuario = getClienteInfo();
  const { empresa, subdominio } = useSubdominio();
  const { isMobile, isDesktop } = useResponsive();
  const subdominioStock = subdominio || empresa?.subdominio;

  const handleConfirmarCompra = async (datos: { nombre: string; email: string; direccion: string; acordarConVendedor?: boolean }) => {
    console.log('=== DEBUG CREAR PEDIDO ===');
    console.log('Usuario completo:', usuario);
    console.log('Usuario ID:', usuario?.id);
    console.log('Datos del formulario:', datos);
    console.log('Subdominio:', subdominio);
    console.log('Empresa ID:', empresa?.id);
    
    if (!usuario || !items.length || !empresa?.id) {
      toast.error('Faltan datos del usuario, empresa o carrito vacío.');
      return;
    }
    
    if (items.some(item => item.cantidad <= 0)) {
      toast.error('Todos los productos deben tener cantidad mayor a 0.');
      return;
    }
    
    if (items.some(item => !item.id || !item.nombre)) {
      toast.error('Hay productos con datos incompletos en el carrito.');
      return;
    }
    
    if (items.some(item => typeof item.precio !== 'number' || isNaN(item.precio) || item.precio < 0)) {
      toast.error('Hay productos en el carrito con precio inválido.');
      return;
    }
    
    // Solo validar dirección si no se selecciona acordar con vendedor
    if (!datos.acordarConVendedor && (!datos.direccion || datos.direccion.length < 5)) {
      toast.error('Debes ingresar una dirección de envío válida o seleccionar "Acordar con vendedor".');
      return;
    }

    setLoading(true);
    try {
      if (!subdominio) {
        toast.error('No se pudo identificar la tienda. Por favor, recarga la página.');
        return;
      }
      
      const pedidoData = {
        clienteId: usuario?.id,
        clienteNombre: datos.nombre,
        clienteEmail: datos.email,
        direccionEnvio: datos.direccion,
        detalles: items.map(item => ({
          productoId: item.id,
          productoNombre: item.nombre,
          cantidad: item.cantidad,
          precioUnitario: Number(item.precio)
        })),
        total: Number(total)
      };
      
      console.log('Datos del pedido a enviar:', pedidoData);
      
      await apiService.crearPedidoPublico(subdominio, pedidoData);
      
      setCompraRealizada(true);
      clearCart();
      toast.success('¡Pedido creado exitosamente! Revisa tu historial en "Mi Cuenta".');
      
      // Recargar productos para actualizar stock
      if (onCompraExitosa) {
        onCompraExitosa();
      }
      
      setTimeout(() => {
        setShowConfirm(false);
        setCompraRealizada(false);
        onClose();
      }, 2000);
    } catch (e) {
      let mensaje = 'Error al guardar el pedido. Intenta de nuevo.';
      if (typeof e === 'object' && e !== null && 'response' in e) {
        const err = e as { response?: { data?: any } };
        if (err.response && typeof err.response.data === 'string') {
          mensaje = err.response.data;
        } else if (err.response && err.response.data && err.response.data.error) {
          mensaje = err.response.data.error;
        }
      }
      toast.error(mensaje);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div 
        className="cart-modal-overlay" 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.3s ease-out'
        }}
      >
        <div 
          className="cart-modal cart-modal-redesign" 
          onClick={e => e.stopPropagation()}
          style={{
            background: '#ffffff',
            borderRadius: isMobile ? '14px' : '16px',
            padding: 0,
            width: isMobile ? 'min(100vw - 16px, 440px)' : 'min(980px, calc(100vw - 32px))',
            maxWidth: isMobile ? '100%' : 980,
            maxHeight: isMobile ? '92vh' : '88vh',
            ...(items.length > 0
              ? { height: isMobile ? 'min(90vh, 640px)' : 'min(82vh, 720px)' }
              : {}),
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 24px 48px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(15,23,42,0.06)',
            border: '1px solid #e2e8f0',
            animation: 'slideIn 0.35s ease-out',
            position: 'relative'
          }}
        >
          {/* Header compacto */}
          <div style={{
            background: empresa?.colorPrimario ? 
              `linear-gradient(135deg, ${empresa.colorPrimario} 0%, ${empresa.colorSecundario || empresa.colorPrimario} 100%)` :
              'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: 'white',
            padding: isMobile ? '12px 14px' : '14px 20px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: isMobile ? '17px' : '18px', 
                fontWeight: 700,
                letterSpacing: '-0.02em'
              }}>
                Tu carrito
              </h2>
              <p style={{ 
                margin: '2px 0 0 0', 
                opacity: 0.92, 
                fontSize: isMobile ? '12px' : '13px' 
              }}>
                {items.length} {items.length === 1 ? 'producto' : 'productos'}
                {items.length > 0 ? ` · ${items.reduce((s, i) => s + i.cantidad, 0)} unidades` : ''}
              </p>
            </div>
            <button 
              type="button"
              aria-label="Cerrar"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.18)',
                border: 'none',
                borderRadius: '10px',
                width: 36,
                height: 36,
                color: 'white',
                fontSize: '22px',
                lineHeight: 1,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s ease'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
            >
              ×
            </button>
          </div>

          {items.length === 0 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 20px',
              color: '#64748b',
              textAlign: 'center'
            }}>
              <div style={{
                width: 72,
                height: 72,
                background: '#f1f5f9',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                fontSize: '28px'
              }}>
                🛒
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                Carrito vacío
              </h3>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, maxWidth: 280 }}>
                Agregá productos desde el catálogo para ver el detalle y el total acá.
              </p>
            </div>
          ) : (
            <div style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: isDesktop ? 'row' : 'column'
            }}>
              {/* Lista: solo esta zona hace scroll */}
              <div
                className="cart-modal-list-scroll"
                style={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: isDesktop ? 0 : 180,
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  borderBottom: isDesktop ? 'none' : '1px solid #e2e8f0'
                }}
              >
                {isDesktop && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '52px 1fr 72px 120px 88px 36px',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 16px',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#94a3b8',
                    borderBottom: '1px solid #e2e8f0',
                    background: '#fafafa',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                  }}>
                    <span />
                    <span>Producto</span>
                    <span style={{ textAlign: 'right' }}>P. unit.</span>
                    <span style={{ textAlign: 'center' }}>Cant.</span>
                    <span style={{ textAlign: 'right' }}>Subtotal</span>
                    <span />
                  </div>
                )}
                <div style={{ padding: isDesktop ? '4px 0 12px' : '8px 12px 12px' }}>
                  {items.map((item) => {
                    const thumb = 48;
                    const sub = item.precio * item.cantidad;
                    const btnQty: React.CSSProperties = {
                      width: 28,
                      height: 28,
                      border: '1px solid #e2e8f0',
                      borderRadius: 6,
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#475569',
                      lineHeight: 1,
                      padding: 0
                    };
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: isDesktop
                            ? '52px 1fr 72px 120px 88px 36px'
                            : '48px 1fr',
                          gridTemplateRows: isDesktop ? 'auto' : 'auto auto',
                          gap: isDesktop ? 10 : '8px 10px',
                          alignItems: 'center',
                          padding: isDesktop ? '10px 16px' : '10px 4px',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                      >
                        <div style={{
                          width: thumb,
                          height: thumb,
                          borderRadius: 8,
                          overflow: 'hidden',
                          background: '#f1f5f9',
                          flexShrink: 0,
                          gridRow: isDesktop ? 'auto' : 'span 2'
                        }}>
                          {item.imagen ? (
                            <img
                              src={item.imagen}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 18,
                              color: '#94a3b8'
                            }}>📦</div>
                          )}
                        </div>
                        <div style={{ minWidth: 0, gridColumn: isDesktop ? 'auto' : '2', gridRow: isDesktop ? 'auto' : '1' }}>
                          <div style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#0f172a',
                            lineHeight: 1.3,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {item.nombre}
                          </div>
                          {!isDesktop && (
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                              ${item.precio.toFixed(2)} c/u · <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: '#0f172a' }}>${sub.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                        {isDesktop && (
                          <span style={{ fontSize: 13, color: '#64748b', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                            ${item.precio.toFixed(2)}
                          </span>
                        )}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isDesktop ? 'center' : 'flex-start',
                          gap: 4,
                          gridColumn: isDesktop ? 'auto' : 2,
                          gridRow: isDesktop ? 'auto' : 2
                        }}>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.cantidad - 1), undefined, subdominioStock)}
                            style={btnQty}
                          >-</button>
                          <input
                            type="number"
                            min={1}
                            value={item.cantidad}
                            onChange={async (e) => {
                              const n = Number(e.target.value);
                              await updateQuantity(item.id, n, undefined, subdominioStock);
                            }}
                            style={{
                              width: 44,
                              height: 28,
                              border: '1px solid #e2e8f0',
                              borderRadius: 6,
                              textAlign: 'center',
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#0f172a',
                              background: '#fff'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.cantidad + 1, undefined, subdominioStock)}
                            style={btnQty}
                          >+</button>
                          {!isDesktop && (
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              style={{
                                marginLeft: 'auto',
                                border: 'none',
                                background: 'transparent',
                                color: '#ef4444',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                padding: '4px 8px'
                              }}
                            >
                              Quitar
                            </button>
                          )}
                        </div>
                        {isDesktop && (
                          <>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                              ${sub.toFixed(2)}
                            </span>
                            <button
                              type="button"
                              title="Quitar"
                              aria-label="Quitar producto"
                              onClick={() => removeFromCart(item.id)}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                border: 'none',
                                background: '#fef2f2',
                                color: '#dc2626',
                                cursor: 'pointer',
                                fontSize: 16,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: 1
                              }}
                            >
                              ×
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resumen fijo (lateral en desktop, abajo en móvil) */}
              <aside style={{
                width: isDesktop ? 268 : '100%',
                flexShrink: 0,
                borderLeft: isDesktop ? '1px solid #e2e8f0' : 'none',
                background: '#f8fafc',
                padding: isMobile ? '14px 16px 16px' : '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: 4 }}>
                    Total estimado
                  </div>
                  <div style={{
                    fontSize: isMobile ? 22 : 24,
                    fontWeight: 800,
                    color: '#059669',
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.02em'
                  }}>
                    ${total.toFixed(2)}
                  </div>
                </div>

                {!permitirCompra && (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    color: '#92400e',
                    fontSize: 12,
                    fontWeight: 500,
                    lineHeight: 1.45
                  }}>
                    Solo cotización: la compra en línea requiere iniciar sesión.
                  </div>
                )}

                {permitirCompra && (
                  <button
                    type="button"
                    onClick={() => setShowConfirm(true)}
                    disabled={loading}
                    style={{
                      background: empresa?.colorPrimario ? 
                        `linear-gradient(180deg, ${empresa.colorPrimario} 0%, ${empresa.colorPrimario}dd 100%)` :
                        'linear-gradient(180deg, #059669 0%, #047857 100%)',
                      border: 'none',
                      borderRadius: 10,
                      padding: '12px 16px',
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'white',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.75 : 1,
                      width: '100%',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                    }}
                  >
                    {loading ? 'Procesando…' : 'Finalizar compra'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={clearCart}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#64748b',
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    cursor: 'pointer'
                  }}
                >
                  Vaciar carrito
                </button>

                {compraRealizada && (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: '#ecfdf5',
                    border: '1px solid #6ee7b7',
                    color: '#065f46',
                    fontWeight: 600,
                    fontSize: 13,
                    textAlign: 'center'
                  }}>
                    Pedido registrado correctamente.
                  </div>
                )}
              </aside>
            </div>
          )}
        </div>
      </div>
      
      <ConfirmarCompraModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmarCompra}
        usuario={usuario}
        loading={loading}
      />
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
      `}</style>
    </>
  );
};

export default CartModal;
