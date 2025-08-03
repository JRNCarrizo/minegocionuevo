import React, { useState } from "react";
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

const CartModal: React.FC<CartModalProps> = ({ open, onClose, onCompraExitosa }) => {
  const { items, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const [showConfirm, setShowConfirm] = useState(false);
  const [compraRealizada, setCompraRealizada] = useState(false);
  const [loading, setLoading] = useState(false);
  const usuario = getClienteInfo();
  const { empresa, subdominio } = useSubdominio();
  const { isMobile } = useResponsive();

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
          className="cart-modal" 
          onClick={e => e.stopPropagation()}
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: isMobile ? '16px' : '20px',
            padding: '0',
            width: isMobile ? '95vw' : '90vw',
            maxWidth: '800px',
            maxHeight: isMobile ? '90vh' : '85vh',
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
            padding: isMobile ? '16px 20px' : '24px 32px',
            borderTopLeftRadius: isMobile ? '16px' : '20px',
            borderTopRightRadius: isMobile ? '16px' : '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h2 style={{ 
                margin: 0, 
                fontSize: isMobile ? '20px' : '24px', 
                fontWeight: '600' 
              }}>
                🛒 Carrito de Compras
              </h2>
              <p style={{ 
                margin: '4px 0 0 0', 
                opacity: 0.9, 
                fontSize: isMobile ? '12px' : '14px' 
              }}>
                {items.length} {items.length === 1 ? 'producto' : 'productos'} en tu carrito
              </p>
            </div>
            <button 
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: isMobile ? '36px' : '40px',
                height: isMobile ? '36px' : '40px',
                color: 'white',
                fontSize: isMobile ? '18px' : '20px',
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
          <div style={{ 
            padding: isMobile ? '20px' : '32px', 
            maxHeight: isMobile ? 'calc(90vh - 120px)' : 'calc(85vh - 140px)', 
            overflow: 'auto' 
          }}>
          {items.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#64748b',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '300px'
              }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  fontSize: '40px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                }}>
                  🛒
                </div>
                <h3 style={{ 
                  margin: '0 0 16px 0', 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: '#1e293b',
                  textAlign: 'center'
                }}>
                  Tu carrito está vacío
                </h3>
                <p style={{ 
                  margin: 0, 
                  fontSize: '18px',
                  textAlign: 'center',
                  maxWidth: '300px',
                  lineHeight: '1.5'
                }}>
                  Agrega algunos productos para comenzar a comprar
                </p>
              </div>
          ) : (
            <>
                {/* Productos */}
                <div style={{ 
                  marginBottom: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  {/* Header de la lista */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    borderRadius: '12px',
                    padding: isMobile ? '12px 16px' : '16px 20px',
                    border: '2px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{
                        fontSize: isMobile ? '14px' : '16px',
                        fontWeight: '600',
                        color: '#1e293b'
                      }}>
                        📦 Productos en el carrito
                      </span>
                      <span style={{
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: isMobile ? '12px' : '14px',
                        fontWeight: '600'
                      }}>
                        {items.length} {items.length === 1 ? 'producto' : 'productos'}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{
                        fontSize: isMobile ? '12px' : '14px',
                        color: '#64748b',
                        fontWeight: '500'
                      }}>
                        Total unidades: {items.reduce((sum, item) => sum + item.cantidad, 0)}
                      </span>
                      <span style={{
                        fontSize: isMobile ? '14px' : '16px',
                        fontWeight: '700',
                        color: '#059669'
                      }}>
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Lista de productos */}
                  {items.map((item, index) => (
                    <div 
                      key={item.id}
                      style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '0',
                        border: '2px solid #e2e8f0',
                        transition: 'all 0.2s ease',
                        animation: `slideInUp 0.3s ease-out ${index * 0.1}s both`,
                        display: 'flex',
                        alignItems: 'stretch',
                        overflow: 'hidden',
                        minHeight: isMobile ? '120px' : '140px'
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
                      {/* Imagen del producto - lado izquierdo */}
                      <div style={{
                        width: isMobile ? '120px' : '140px',
                        height: '100%',
                        minWidth: isMobile ? '120px' : '140px',
                        maxWidth: isMobile ? '120px' : '140px',
                        flexShrink: 0,
                        position: 'relative',
                        overflow: 'hidden'
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
                              e.currentTarget.src = 'https://via.placeholder.com/140x140?text=Sin+Imagen';
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
                            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                            color: '#64748b',
                            fontSize: '12px',
                            textAlign: 'center',
                            padding: '16px'
                          }}>
                            <div style={{
                              fontSize: '24px',
                              marginBottom: '4px',
                              opacity: 0.7
                            }}>
                              📸
                            </div>
                            <div style={{
                              fontSize: '10px',
                              opacity: 0.8
                            }}>
                              Sin imagen
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Información del producto - lado derecho */}
                      <div style={{ 
                        flex: 1,
                        padding: isMobile ? '16px' : '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minWidth: 0
                      }}>
                        {/* Información principal */}
                        <div style={{ flex: 1 }}>
                          <h4 style={{ 
                            margin: '0 0 8px 0', 
                            fontSize: isMobile ? '16px' : '18px', 
                            fontWeight: '600', 
                            color: '#1e293b',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            wordBreak: 'break-word'
                          }}>
                            {item.nombre}
                          </h4>
                          
                          {/* Precio unitario y total */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '12px',
                            flexWrap: 'wrap',
                            gap: '8px'
                          }}>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px'
                            }}>
                              <span style={{
                                fontSize: isMobile ? '14px' : '16px',
                                color: '#64748b',
                                fontWeight: '500'
                              }}>
                                Precio unitario: ${item.precio.toFixed(2)}
                              </span>
                              <span style={{
                                fontSize: isMobile ? '18px' : '20px',
                                fontWeight: '700',
                                color: '#8b5cf6'
                              }}>
                                Total: ${(item.precio * item.cantidad).toFixed(2)}
                              </span>
                            </div>
                            
                            {/* Cantidad */}
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <span style={{
                                fontSize: isMobile ? '12px' : '14px',
                                color: '#64748b',
                                fontWeight: '500'
                              }}>
                                Cantidad
                              </span>
                              <span style={{
                                fontSize: isMobile ? '16px' : '18px',
                                fontWeight: '700',
                                color: '#059669',
                                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                                padding: '4px 12px',
                                borderRadius: '8px',
                                border: '1px solid #bbf7d0'
                              }}>
                                {item.cantidad} {item.cantidad === 1 ? 'unidad' : 'unidades'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Controles y acciones */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          flexWrap: 'wrap'
                        }}>
                          {/* Controles de cantidad */}
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: isMobile ? '8px' : '12px',
                            flexWrap: 'wrap'
                          }}>
                            <button
                              onClick={() => updateQuantity(item.id, Math.max(1, item.cantidad - 1), undefined, empresa?.subdominio)}
                              style={{
                                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                                border: '2px solid #cbd5e1',
                                borderRadius: '8px',
                                width: isMobile ? '32px' : '36px',
                                height: isMobile ? '32px' : '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: isMobile ? '16px' : '18px',
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
                                width: isMobile ? '50px' : '60px',
                                height: isMobile ? '32px' : '36px',
                                border: '2px solid #cbd5e1',
                                borderRadius: '8px',
                                textAlign: 'center',
                                fontSize: isMobile ? '14px' : '16px',
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
                                width: isMobile ? '32px' : '36px',
                                height: isMobile ? '32px' : '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: isMobile ? '16px' : '18px',
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

                          {/* Botón eliminar */}
                          <button
                            onClick={() => removeFromCart(item.id)}
                            style={{
                              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                              border: '2px solid #fecaca',
                              borderRadius: '8px',
                              padding: isMobile ? '8px 12px' : '10px 16px',
                              fontSize: isMobile ? '12px' : '14px',
                              fontWeight: '600',
                              color: '#dc2626',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
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
                  borderRadius: isMobile ? '16px' : '20px',
                  padding: isMobile ? '20px' : '32px',
                  border: '2px solid #e2e8f0',
                  width: '100%',
                  maxWidth: '600px',
                  margin: '0 auto'
                }}>
                  {/* Título centrado */}
                  <div style={{ 
                    textAlign: 'center', 
                    marginBottom: isMobile ? '20px' : '24px',
                    paddingBottom: isMobile ? '16px' : '20px',
                    borderBottom: '2px solid #e2e8f0'
                  }}>
                    <h3 style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: isMobile ? '20px' : '24px', 
                      fontWeight: '700', 
                      color: '#1e293b',
                      textAlign: 'center'
                    }}>
                      💰 Resumen del Pedido
                    </h3>
                    <p style={{ 
                      margin: 0, 
                      fontSize: isMobile ? '28px' : '32px', 
                      fontWeight: '800', 
                      color: '#059669',
                      textAlign: 'center'
                    }}>
                      ${total.toFixed(2)}
                    </p>
                  </div>
                  
                  {/* Botones centrados */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: isMobile ? '12px' : '16px',
                    alignItems: 'center'
                  }}>
                    <button
                      onClick={() => setShowConfirm(true)}
                      disabled={loading}
                      style={{
                        background: empresa?.colorPrimario ? 
                          `linear-gradient(135deg, ${empresa.colorPrimario} 0%, ${empresa.colorPrimario}dd 100%)` :
                          'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: isMobile ? '12px' : '16px',
                        padding: isMobile ? '14px 32px' : '16px 40px',
                        fontSize: isMobile ? '16px' : '18px',
                        fontWeight: '700',
                        color: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: empresa?.colorPrimario ? 
                          `0 4px 12px ${empresa.colorPrimario}40` :
                          '0 4px 12px rgba(16,185,129,0.3)',
                        width: '100%',
                        maxWidth: '400px',
                        opacity: loading ? 0.7 : 1
                      }}
                      onMouseOver={(e) => {
                        if (!loading) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = empresa?.colorPrimario ? 
                            `0 6px 16px ${empresa.colorPrimario}60` :
                            '0 6px 16px rgba(16,185,129,0.4)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!loading) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = empresa?.colorPrimario ? 
                            `0 4px 12px ${empresa.colorPrimario}40` :
                            '0 4px 12px rgba(16,185,129,0.3)';
                        }
                      }}
                    >
                      {loading ? '⏳ Procesando...' : '💳 Finalizar Compra'}
                    </button>
                    
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
                        width: '100%',
                        maxWidth: '300px'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = '#64748b';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
                      }}
                    >
                      🗑️ Vaciar Carrito
                    </button>
                  </div>
                  
                  {compraRealizada && (
                    <div style={{
                      background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                      border: '2px solid #10b981',
                      borderRadius: '16px',
                      padding: '20px',
                      marginTop: '20px',
                      textAlign: 'center',
                      color: '#065f46',
                      fontWeight: '600',
                      fontSize: '16px'
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
