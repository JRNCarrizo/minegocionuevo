import React, { useState } from "react";
import { useCart } from "../hooks/useCart";
import ConfirmarCompraModal from "./ConfirmarCompraModal";
import apiService from "../services/api";
import { useSubdominio } from "../hooks/useSubdominio";
import toast from "react-hot-toast";

interface CartModalProps {
  open: boolean;
  onClose: () => void;
}

const getClienteInfo = () => {
  const cliente = localStorage.getItem("clienteInfo");
  if (cliente) {
    try {
      return JSON.parse(cliente);
    } catch {
      return null;
    }
  }
  return null;
};

const CartModal: React.FC<CartModalProps> = ({ open, onClose }) => {
  const { items, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const [showConfirm, setShowConfirm] = useState(false);
  const [compraRealizada, setCompraRealizada] = useState(false);
  const [loading, setLoading] = useState(false);
  const usuario = getClienteInfo();
  const { empresa, subdominio } = useSubdominio();

  const handleConfirmarCompra = async (datos: { nombre: string; email: string; direccion: string; acordarConVendedor?: boolean }) => {
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
    
    if (items.some(item => typeof item.precio !== 'number' || isNaN(item.precio) || item.precio <= 0)) {
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
      
      await apiService.crearPedidoPublico(subdominio, {
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
      });
      
      setCompraRealizada(true);
      clearCart();
      toast.success('¡Pedido creado exitosamente! Revisa tu historial en "Mi Cuenta".');
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
          className="cart-modal" 
          onClick={e => e.stopPropagation()}
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '20px',
            padding: '0',
            width: '90vw',
            maxWidth: '800px',
            maxHeight: '85vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.2)',
            animation: 'slideIn 0.4s ease-out',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div style={{
            background: empresa?.colorPrimario ? 
              `linear-gradient(135deg, ${empresa.colorPrimario} 0%, ${empresa.colorSecundario || empresa.colorPrimario} 100%)` :
              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '24px 32px',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
                🛒 Carrito de Compras
              </h2>
              <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
                {items.length} {items.length === 1 ? 'producto' : 'productos'} en tu carrito
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

          {/* Content */}
          <div style={{ padding: '32px', maxHeight: 'calc(85vh - 140px)', overflow: 'auto' }}>
          {items.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#64748b'
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
                  🛒
                </div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
                  Tu carrito está vacío
                </h3>
                <p style={{ margin: 0, fontSize: '16px' }}>
                  Agrega algunos productos para comenzar a comprar
                </p>
              </div>
          ) : (
            <>
                {/* Productos */}
                <div style={{ marginBottom: '32px' }}>
                  {items.map((item, index) => (
                    <div 
                      key={item.id}
                      style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '20px',
                        marginBottom: '16px',
                        border: '2px solid #e2e8f0',
                        transition: 'all 0.2s ease',
                        animation: `slideInUp 0.3s ease-out ${index * 0.1}s both`
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = '#8b5cf6';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(139,92,246,0.15)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Imagen */}
                        <div style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          background: '#f1f5f9'
                        }}>
                          {item.imagen ? (
                            <img 
                              src={item.imagen} 
                              alt={item.nombre}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/80x80?text=Sin+Imagen';
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#64748b',
                              fontSize: '10px',
                              textAlign: 'center',
                              padding: '8px'
                            }}>
                              <div style={{
                                fontSize: '20px',
                                marginBottom: '4px',
                                opacity: 0.7
                              }}>
                                📸
                              </div>
                              <div style={{
                                fontSize: '8px',
                                opacity: 0.8
                              }}>
                                Sin imagen
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Información del producto */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ 
                            margin: '0 0 8px 0', 
                            fontSize: '18px', 
                            fontWeight: '600', 
                            color: '#1e293b',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                        {item.nombre}
                          </h4>
                          <p style={{ 
                            margin: '0 0 12px 0', 
                            fontSize: '20px', 
                            fontWeight: '700', 
                            color: '#059669' 
                          }}>
                            ${item.precio.toFixed(2)}
                          </p>
                          
                          {/* Controles de cantidad */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button
                              onClick={() => updateQuantity(item.id, Math.max(1, item.cantidad - 1), undefined, empresa?.subdominio)}
                              style={{
                                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                                border: '2px solid #cbd5e1',
                                borderRadius: '8px',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#475569',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.borderColor = '#8b5cf6';
                                e.currentTarget.style.background = 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.borderColor = '#cbd5e1';
                                e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
                              }}
                            >
                              -
                            </button>
                            
                        <input
                          type="number"
                          min={1}
                          value={item.cantidad}
                              onChange={async e => {
                                const nuevaCantidad = Number(e.target.value);
                                await updateQuantity(item.id, nuevaCantidad, undefined, empresa?.subdominio);
                              }}
                              style={{
                                width: '60px',
                                height: '36px',
                                border: '2px solid #cbd5e1',
                                borderRadius: '8px',
                                textAlign: 'center',
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#1e293b',
                                background: 'white'
                              }}
                            />
                            
                            <button
                              onClick={() => updateQuantity(item.id, item.cantidad + 1, undefined, empresa?.subdominio)}
                              style={{
                                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                                border: '2px solid #cbd5e1',
                                borderRadius: '8px',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#475569',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.borderColor = '#8b5cf6';
                                e.currentTarget.style.background = 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.borderColor = '#cbd5e1';
                                e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Subtotal y eliminar */}
                        <div style={{ textAlign: 'right', minWidth: '120px' }}>
                          <p style={{ 
                            margin: '0 0 8px 0', 
                            fontSize: '18px', 
                            fontWeight: '700', 
                            color: '#8b5cf6' 
                          }}>
                            ${(item.precio * item.cantidad).toFixed(2)}
                          </p>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            style={{
                              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                              border: '2px solid #fecaca',
                              borderRadius: '8px',
                              padding: '8px 16px',
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#dc2626',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            ❌ Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resumen y acciones */}
                <div style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '2px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
                      Total del Pedido
                    </h3>
                    <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#059669' }}>
                      ${total.toFixed(2)}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      onClick={clearCart}
                      style={{
                        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                        border: '2px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '12px 24px',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        flex: 1,
                        minWidth: '140px'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = '#64748b';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      🗑️ Vaciar Carrito
                    </button>
                    
                    <button
                      onClick={() => setShowConfirm(true)}
                      disabled={loading}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 32px',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                        flex: 2,
                        minWidth: '200px',
                        opacity: loading ? 0.7 : 1
                      }}
                      onMouseOver={(e) => {
                        if (!loading) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(16,185,129,0.4)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!loading) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.3)';
                        }
                      }}
                    >
                      {loading ? '⏳ Procesando...' : '💳 Finalizar Compra'}
              </button>
                  </div>
                  
                  {compraRealizada && (
                    <div style={{
                      background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                      border: '2px solid #10b981',
                      borderRadius: '12px',
                      padding: '16px',
                      marginTop: '16px',
                      textAlign: 'center',
                      color: '#065f46',
                      fontWeight: '600'
                    }}>
                      ✅ ¡Compra realizada con éxito!
                    </div>
                  )}
                </div>
            </>
          )}
          </div>
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
        
        @keyframes slideInUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default CartModal;
