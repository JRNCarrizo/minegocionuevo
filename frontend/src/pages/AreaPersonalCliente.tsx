import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSubdominio } from '../hooks/useSubdominio';
import { useResponsive } from '../hooks/useResponsive';
import CartModal from '../components/CartModal';
import NavbarCliente from '../components/NavbarCliente';
import ProductoDetalleModal from '../components/ProductoDetalleModal';
import api from '../services/api';
import * as cookies from '../utils/cookies';
import { formatearFechaConHora, formatearFecha } from '../utils/dateUtils';
import TimeZoneInfo from '../components/TimeZoneInfo';
import type { Pedido, DetallePedido, ProductoFavorito, Producto } from '../types';

interface ClienteInfo {
  id: number;
  nombre: string;
  apellidos?: string;
  email: string;
  telefono?: string;
}

function EstadoBadge({ estado }: { estado: string }) {
  const { isMobile } = useResponsive();
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
        padding: isMobile ? '2px 8px' : '2px 10px',
        fontWeight: 600,
        fontSize: isMobile ? 11 : 13,
        marginLeft: isMobile ? 0 : 8,
        whiteSpace: 'nowrap',
        textAlign: 'center',
        display: 'inline-block',
        minWidth: isMobile ? '60px' : 'auto'
      }}
    >
      {isMobile ? estado.charAt(0) + estado.slice(1).toLowerCase().substring(0, 3) : estado.charAt(0) + estado.slice(1).toLowerCase()}
    </span>
  );
}

function PedidoDetalleModal({ pedido, open, onClose, onCancelar }: { pedido: Pedido|null, open: boolean, onClose: () => void, onCancelar?: (pedidoId: number) => void }) {
  const [productoSeleccionado, setProductoSeleccionado] = useState<DetallePedido | null>(null);
  const [mostrarProducto, setMostrarProducto] = useState(false);
  const { empresa } = useSubdominio();

  if (!pedido || !open) return null;

  const obtenerColorEstado = (estado: Pedido['estado']) => {
    const colores: Record<Pedido['estado'], string> = {
      PENDIENTE: '#f59e0b',
      PENDIENTE_PAGO: '#dc2626',
      CONFIRMADO: '#3b82f6',
      PREPARANDO: '#8b5cf6',
      ENVIADO: '#059669',
      ENTREGADO: '#059669',
      CANCELADO: '#ef4444'
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
      CANCELADO: 'Cancelado'
    };
    return textos[estado] || 'Desconocido';
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
            background: empresa?.colorPrimario ? 
              `linear-gradient(135deg, ${empresa.colorPrimario} 0%, ${empresa.colorSecundario || empresa.colorPrimario} 100%)` :
              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                {formatearFechaConHora(pedido.fechaCreacion)}
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
                            {(detalle.productoMarca || detalle.marcaProducto) && (
                              <p style={{ 
                                margin: '0 0 8px 0', 
                                fontSize: '14px', 
                                color: '#64748b',
                                lineHeight: '1.4',
                                fontWeight: '500'
                              }}>
                                🏷️ {detalle.productoMarca || detalle.marcaProducto}
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

            {/* Botón de cancelar pedido */}
            {(pedido.estado === 'PENDIENTE' || pedido.estado === 'CONFIRMADO') && (
              <div style={{
                padding: '24px 32px',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc',
                borderBottomLeftRadius: '16px',
                borderBottomRightRadius: '16px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                  border: '2px solid #fecaca',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: '#dc2626' }}>
                    ⚠️ ¿Necesitas cancelar este pedido? El stock de los productos será restaurado automáticamente.
                  </h4>
                  <button 
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de que quieres cancelar este pedido? El stock será restaurado.')) {
                        if (onCancelar && pedido) {
                          onCancelar(pedido.id);
                        }
                      }
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(239,68,68,0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.3)';
                    }}
                  >
                    ❌ Cancelar Pedido
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de detalle del producto */}
      <ProductoDetalleModal
        open={mostrarProducto}
        onClose={() => setMostrarProducto(false)}
        productoId={productoSeleccionado?.producto?.id || null}
        subdominio={empresa?.subdominio || ''}
        empresa={empresa}
      />
    </>
  );
}

export default function AreaPersonalCliente() {
  const { empresa, cargando: cargandoEmpresa, subdominio } = useSubdominio();
  const { isMobile } = useResponsive();
  const [cliente, setCliente] = useState<ClienteInfo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);
  const [detallePedido, setDetallePedido] = useState<Pedido|null>(null);
  const [clienteInfo, setClienteInfo] = useState<{ nombre: string; email: string } | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [tabActiva, setTabActiva] = useState<'pedidos' | 'favoritos'>('pedidos');
  
  // Estados para favoritos
  const [favoritos, setFavoritos] = useState<ProductoFavorito[]>([]);
  const [cargandoFavoritos, setCargandoFavoritos] = useState(false);
  
  // Estados para modal de producto
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [productoIdSeleccionado, setProductoIdSeleccionado] = useState<number | null>(null);
  
  // Estados para edición de perfil
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editando, setEditando] = useState(false);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: ''
  });
  const [passwordData, setPasswordData] = useState({
    passwordActual: '',
    passwordNueva: '',
    confirmarPassword: ''
  });
  
  const navigate = useNavigate();

  // Verificar si hay un cliente logueado para el navbar
  useEffect(() => {
    // Buscar token en cookies primero (se comparte entre subdominios)
    let token = cookies.getCookie('clienteToken');
    let cliente = cookies.getCookie('clienteInfo');
    
    // Si no está en cookies, buscar en localStorage
    if (!token) {
      token = localStorage.getItem('clienteToken');
    }
    if (!cliente) {
      cliente = localStorage.getItem('clienteInfo');
    }
    
    if (token && cliente) {
      try {
        setClienteInfo(JSON.parse(cliente));
      } catch (error) {
        console.error('Error al parsear clienteInfo:', error);
        localStorage.removeItem('clienteToken');
        localStorage.removeItem('clienteInfo');
        cookies.deleteCookie('clienteToken');
        cookies.deleteCookie('clienteInfo');
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

      // Buscar token en cookies primero (se comparte entre subdominios)
      let token = cookies.getCookie('clienteToken');
      if (!token) {
        token = localStorage.getItem('clienteToken');
      }
      
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
        console.log('Cliente del perfil - ID:', response.cliente?.id);
        console.log('Cliente del perfil - Email:', response.cliente?.email);
        
        setCliente(response.cliente);
        console.log('Cliente establecido:', response.cliente);
        
        // Cargar favoritos del cliente
        if (subdominioFinal && response.cliente?.id) {
          try {
            const favoritosResp = await api.obtenerFavoritos(subdominioFinal, token);
            setFavoritos(favoritosResp.favoritos || []);
            console.log('Favoritos cargados:', favoritosResp.favoritos?.length || 0);
          } catch (e) {
            console.error('Error al cargar favoritos:', e);
            setFavoritos([]);
          }
        }
        
        // Cargar pedidos del cliente usando endpoint público
        if (subdominioFinal && response.cliente?.id) {
          console.log('Cargando pedidos para cliente:', response.cliente.id, 'subdominio:', subdominioFinal);
          setCargandoPedidos(true);
          try {
            const pedidosResp = await api.obtenerPedidosClientePublico(subdominioFinal, response.cliente.id);
            console.log('=== DEBUG PEDIDOS FRONTEND ===');
            console.log('Respuesta completa:', pedidosResp);
            console.log('Tipo de respuesta:', typeof pedidosResp);
            console.log('Es array?', Array.isArray(pedidosResp));
            console.log('Tiene propiedad data?', pedidosResp && typeof pedidosResp === 'object' && 'data' in pedidosResp);
            if (pedidosResp && typeof pedidosResp === 'object' && 'data' in pedidosResp) {
              console.log('Propiedad data:', pedidosResp.data);
              console.log('Tipo de data:', typeof pedidosResp.data);
              console.log('Data es array?', Array.isArray(pedidosResp.data));
            }
            
            // Adaptación robusta para diferentes estructuras de respuesta
            let pedidosArray = Array.isArray(pedidosResp) ? pedidosResp : pedidosResp?.data;
            if (!Array.isArray(pedidosArray)) pedidosArray = [];
            console.log('Pedidos obtenidos (adaptado):', pedidosArray);
            console.log('=== FIN DEBUG PEDIDOS FRONTEND ===');
            setPedidos(pedidosArray);
          } catch (e) {
            console.error('Error al cargar pedidos:', e);
            setPedidos([]);
          } finally {
            setCargandoPedidos(false);
          }
        } else {
          console.log('No se pueden cargar pedidos - subdominio:', !!subdominioFinal, 'cliente.id:', response.cliente?.id);
        }
      } catch (error: unknown) {
        console.error('Error al cargar perfil:', error);
        const mensaje = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al cargar perfil';
        toast.error(mensaje);
        
        // Si el token es inválido, redirigir al login
        if ((error as { response?: { status?: number } }).response?.status === 401) {
          localStorage.removeItem('clienteToken');
          localStorage.removeItem('clienteInfo');
          cookies.deleteCookie('clienteToken');
          cookies.deleteCookie('clienteInfo');
          navigate('/login');
        }
      } finally {
        setCargando(false);
      }
    };

    cargarPerfilCliente();
  }, [subdominio, navigate, empresa, cargandoEmpresa]);

  useEffect(() => {
    if (!subdominio || !cliente?.id) return;
    console.log('useEffect secundario - Cargando pedidos para cliente:', cliente.id, 'subdominio:', subdominio);
    setCargandoPedidos(true);
    api.obtenerPedidosClientePublico(subdominio, cliente.id)
      .then((pedidosResp) => {
        console.log('=== DEBUG PEDIDOS FRONTEND (useEffect secundario) ===');
        console.log('Respuesta completa:', pedidosResp);
        console.log('Tipo de respuesta:', typeof pedidosResp);
        console.log('Es array?', Array.isArray(pedidosResp));
        console.log('Tiene propiedad data?', pedidosResp && typeof pedidosResp === 'object' && 'data' in pedidosResp);
        if (pedidosResp && typeof pedidosResp === 'object' && 'data' in pedidosResp) {
          console.log('Propiedad data:', pedidosResp.data);
          console.log('Tipo de data:', typeof pedidosResp.data);
          console.log('Data es array?', Array.isArray(pedidosResp.data));
        }
        
        // Adaptación robusta para diferentes estructuras de respuesta
        let pedidosArray = Array.isArray(pedidosResp) ? pedidosResp : pedidosResp?.data;
        if (!Array.isArray(pedidosArray)) pedidosArray = [];
        console.log('Pedidos obtenidos en useEffect secundario (adaptado):', pedidosArray);
        console.log('=== FIN DEBUG PEDIDOS FRONTEND (useEffect secundario) ===');
        setPedidos(pedidosArray);
      })
      .catch((error) => {
        console.error('Error al cargar pedidos en useEffect secundario:', error);
        setPedidos([]);
      })
      .finally(() => setCargandoPedidos(false));
  }, [subdominio, cliente]);

  const cerrarSesion = () => {
    localStorage.removeItem('clienteToken');
    localStorage.removeItem('clienteInfo');
    cookies.deleteCookie('clienteToken');
    cookies.deleteCookie('clienteInfo');
    setClienteInfo(null);
    toast.success('Sesión cerrada');
    navigate('/');
  };

  // Función para abrir modal de edición
  const abrirModalEdicion = () => {
    if (cliente) {
      setFormData({
        nombre: cliente.nombre || '',
        apellidos: cliente.apellidos || '',
        email: cliente.email || '',
        telefono: cliente.telefono || ''
      });
      setShowEditModal(true);
    }
  };

  // Función para abrir modal de cambio de contraseña
  const abrirModalPassword = () => {
    setPasswordData({
      passwordActual: '',
      passwordNueva: '',
      confirmarPassword: ''
    });
    setShowPasswordModal(true);
  };

  // Función para guardar cambios del perfil
  const guardarPerfil = async () => {
    if (!subdominio || !cliente?.id) {
      toast.error('Error: No se pudo identificar la tienda o el cliente');
      return;
    }

    // Validaciones básicas
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('El email es obligatorio');
      return;
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('El formato del email no es válido');
      return;
    }

    setEditando(true);
    try {
      // Buscar token en cookies primero (se comparte entre subdominios)
      let token = cookies.getCookie('clienteToken');
      if (!token) {
        token = localStorage.getItem('clienteToken');
      }
      
      if (!token) {
        toast.error('Sesión expirada');
        navigate('/login');
        return;
      }

      const response = await api.actualizarPerfilCliente(subdominio, cliente.id, {
        nombre: formData.nombre.trim(),
        apellidos: formData.apellidos.trim(),
        email: formData.email.trim(),
        telefono: formData.telefono.trim()
      }, token);

      console.log('Perfil actualizado:', response);
      
      // Actualizar el estado local
      setCliente(prev => prev ? {
        ...prev,
        nombre: formData.nombre.trim(),
        apellidos: formData.apellidos.trim(),
        email: formData.email.trim(),
        telefono: formData.telefono.trim()
      } : null);

      // Actualizar clienteInfo en localStorage
      const clienteInfoActual = localStorage.getItem('clienteInfo');
      if (clienteInfoActual) {
        const clienteInfoParsed = JSON.parse(clienteInfoActual);
        const nuevoClienteInfo = {
          ...clienteInfoParsed,
          nombre: formData.nombre.trim(),
          email: formData.email.trim()
        };
        localStorage.setItem('clienteInfo', JSON.stringify(nuevoClienteInfo));
        setClienteInfo(nuevoClienteInfo);
      }

      toast.success('Perfil actualizado correctamente');
      setShowEditModal(false);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      const mensaje = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al actualizar perfil';
      toast.error(mensaje);
    } finally {
      setEditando(false);
    }
  };

  // Función para cambiar contraseña
  const cambiarPassword = async () => {
    if (!subdominio || !cliente?.id) {
      toast.error('Error: No se pudo identificar la tienda o el cliente');
      return;
    }

    // Validaciones
    if (!passwordData.passwordNueva.trim()) {
      toast.error('Debes ingresar una nueva contraseña');
      return;
    }

    if (passwordData.passwordNueva.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (passwordData.passwordNueva !== passwordData.confirmarPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    // Para usuarios que se registraron con Google, no es necesario verificar contraseña actual
    // pero si la ingresaron, la validamos
    if (passwordData.passwordActual.trim() && passwordData.passwordActual.length < 6) {
      toast.error('La contraseña actual debe tener al menos 6 caracteres');
      return;
    }

    setCambiandoPassword(true);
    try {
      // Buscar token en cookies primero (se comparte entre subdominios)
      let token = cookies.getCookie('clienteToken');
      if (!token) {
        token = localStorage.getItem('clienteToken');
      }
      
      if (!token) {
        toast.error('Sesión expirada');
        navigate('/login');
        return;
      }

      const response = await api.cambiarPasswordCliente(subdominio, cliente.id, {
        passwordActual: passwordData.passwordActual || "", // Enviar vacío si no se ingresó
        passwordNueva: passwordData.passwordNueva
      }, token);

      console.log('Contraseña cambiada:', response);
      
      toast.success('Contraseña cambiada correctamente');
      setShowPasswordModal(false);
      
      // Limpiar formulario
      setPasswordData({
        passwordActual: '',
        passwordNueva: '',
        confirmarPassword: ''
      });
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      const mensaje = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al cambiar contraseña';
      toast.error(mensaje);
    } finally {
      setCambiandoPassword(false);
    }
  };

  const cancelarPedido = async (pedidoId: number) => {
    try {
      const subdominioDesarrollo = localStorage.getItem('subdominio-desarrollo');
      const subdominioFinal = subdominio || subdominioDesarrollo;
      
      if (!subdominioFinal) {
        toast.error('No se pudo identificar la tienda');
        return;
      }

      await api.cancelarPedidoCliente(subdominioFinal, pedidoId, cliente!.id);
      toast.success('Pedido cancelado correctamente');
      
      // Recargar pedidos
      const pedidosResp = await api.obtenerPedidosClientePublico(subdominioFinal, cliente!.id);
      let pedidosArray = Array.isArray(pedidosResp) ? pedidosResp : pedidosResp?.data;
      if (!Array.isArray(pedidosArray)) pedidosArray = [];
      setPedidos(pedidosArray);
    } catch (error) {
      console.error('Error al cancelar pedido:', error);
      const mensaje = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al cancelar pedido';
      toast.error(mensaje);
    }
  };



  // ============================================
  // FUNCIONES PARA FAVORITOS
  // ============================================

  const cargarFavoritos = async () => {
    if (!cliente) return;
    
    const subdominioDesarrollo = localStorage.getItem('subdominio-desarrollo');
    const subdominioFinal = subdominio || subdominioDesarrollo;
    
    // Buscar token en cookies primero (se comparte entre subdominios)
    let token = cookies.getCookie('clienteToken');
    if (!token) {
      token = localStorage.getItem('clienteToken');
    }
    
    if (!subdominioFinal || !token) {
      toast.error('Error de autenticación');
      return;
    }

    setCargandoFavoritos(true);
    try {
      const response = await api.obtenerFavoritos(subdominioFinal, token);
      setFavoritos(response.favoritos || []);
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
      toast.error('Error al cargar favoritos');
      setFavoritos([]);
    } finally {
      setCargandoFavoritos(false);
    }
  };

  const agregarFavorito = async (productoId: number) => {
    const subdominioDesarrollo = localStorage.getItem('subdominio-desarrollo');
    const subdominioFinal = subdominio || subdominioDesarrollo;
    
    // Buscar token en cookies primero (se comparte entre subdominios)
    let token = cookies.getCookie('clienteToken');
    if (!token) {
      token = localStorage.getItem('clienteToken');
    }
    
    if (!subdominioFinal || !token) {
      toast.error('Error de autenticación');
      return;
    }

    try {
      await api.agregarFavorito(subdominioFinal, productoId, token);
      toast.success('Producto agregado a favoritos');
      // Recargar favoritos si estamos en esa pestaña
      if (tabActiva === 'favoritos') {
        await cargarFavoritos();
      }
    } catch (error) {
      console.error('Error al agregar favorito:', error);
      const mensaje = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al agregar a favoritos';
      toast.error(mensaje);
    }
  };

  const removerFavorito = async (productoId: number) => {
    const subdominioDesarrollo = localStorage.getItem('subdominio-desarrollo');
    const subdominioFinal = subdominio || subdominioDesarrollo;
    
    // Buscar token en cookies primero (se comparte entre subdominios)
    let token = cookies.getCookie('clienteToken');
    if (!token) {
      token = localStorage.getItem('clienteToken');
    }
    
    if (!subdominioFinal || !token) {
      toast.error('Error de autenticación');
      return;
    }

    try {
      await api.removerFavorito(subdominioFinal, productoId, token);
      toast.success('Producto removido de favoritos');
      // Recargar favoritos
      await cargarFavoritos();
    } catch (error) {
      console.error('Error al remover favorito:', error);
      const mensaje = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al remover de favoritos';
      toast.error(mensaje);
    }
  };

  // Cargar favoritos cuando cambie la pestaña
  useEffect(() => {
    if (tabActiva === 'favoritos' && cliente) {
      cargarFavoritos();
    }
  }, [tabActiva, cliente]);

  // Función para abrir modal de producto
  const abrirModalProducto = (producto: Producto) => {
    setProductoIdSeleccionado(producto.id);
    setShowProductoModal(true);
  };

  const cerrarModalProducto = () => {
    setShowProductoModal(false);
    setProductoIdSeleccionado(null);
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
      background: empresa?.imagenFondoUrl
        ? `url(${empresa.imagenFondoUrl}) center/cover no-repeat`
        : empresa?.colorFondo
          ? `linear-gradient(135deg, ${empresa.colorFondo} 0%, ${empresa.colorFondo}dd 100%)`
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      minHeight: '100vh',
      paddingBottom: '40px',
      color: empresa?.colorTexto || '#1f2937'
    }}>
      {/* Navbar del cliente */}
      <NavbarCliente
        empresa={empresa}
        clienteInfo={clienteInfo}
        onCerrarSesion={cerrarSesion}
        onShowCart={() => setShowCart(true)}
      />
              <CartModal 
          open={showCart} 
          onClose={() => setShowCart(false)} 
          onCompraExitosa={() => {
            // Recargar la página para actualizar datos
            window.location.reload();
          }}
        />

      <main className="contenedor" style={{
        paddingTop: isMobile ? '12rem' : '3rem'
      }}>
        {/* Cabecera mejorada */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '20px' : '40px',
          padding: isMobile ? '24px 16px' : '40px 20px',
          background: empresa?.colorPrimario ? 
            `linear-gradient(135deg, ${empresa.colorPrimario} 0%, ${empresa.colorSecundario || empresa.colorPrimario} 100%)` :
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '20px',
          color: 'white',
          boxShadow: empresa?.colorPrimario ? 
            `0 10px 30px ${empresa.colorPrimario}40` :
            '0 10px 30px rgba(102, 126, 234, 0.3)',
          marginTop: isMobile ? '20px' : '60px'
        }}>
          <div style={{
            width: isMobile ? '60px' : '80px',
            height: isMobile ? '60px' : '80px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: isMobile ? '24px' : '32px'
          }}>
            👤
          </div>
          <h1 style={{ 
            margin: '0 0 8px 0', 
            fontSize: isMobile ? '24px' : '32px', 
            fontWeight: '700',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            Mi Cuenta
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: isMobile ? '14px' : '18px', 
            opacity: 0.9,
            fontWeight: '300'
          }}>
            Bienvenido a tu área personal, {cliente?.nombre}
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gap: isMobile ? '20px' : '32px', 
          maxWidth: '1200px', 
          margin: '0 auto',
          padding: isMobile ? '0 16px' : '0'
        }}>
            {/* Información del perfil */}
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: isMobile ? '20px' : '32px',
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
              background: empresa?.colorAcento ? 
                `linear-gradient(135deg, ${empresa.colorAcento} 0%, ${empresa.colorAcento}dd 100%)` :
                'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            }} />
            
            {/* Título e icono de información personal - centrado */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '32px',
              gap: '12px'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                background: empresa?.colorAcento ? 
                  `linear-gradient(135deg, ${empresa.colorAcento} 0%, ${empresa.colorAcento}dd 100%)` :
                  'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: 'white'
              }}>
                👤
              </div>
              <h2 style={{ 
                margin: 0, 
                fontSize: '24px', 
                fontWeight: '700', 
                color: empresa?.colorTexto || '#1e293b',
                textAlign: 'center'
              }}>
                Información Personal
              </h2>
            </div>

            {/* Contenido centrado */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: '32px'
            }}>
              {/* Campos de información - centrados */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: isMobile ? '16px' : '20px',
                width: '100%',
                maxWidth: '800px',
                margin: '0 auto'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  padding: isMobile ? '16px' : '24px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center'
                }}>
                  <p style={{ 
                    margin: '0 0 12px 0', 
                    fontSize: isMobile ? '11px' : '13px', 
                    color: '#64748b', 
                    fontWeight: '600', 
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Nombre Completo
                  </p>
                  <p style={{ 
                    margin: 0, 
                    fontSize: isMobile ? '16px' : '18px', 
                    fontWeight: '600', 
                    color: '#1e293b',
                    wordBreak: 'break-word'
                  }}>
                    {cliente?.nombre} {cliente?.apellidos}
                  </p>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  padding: isMobile ? '16px' : '24px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center'
                }}>
                  <p style={{ 
                    margin: '0 0 12px 0', 
                    fontSize: isMobile ? '11px' : '13px', 
                    color: '#64748b', 
                    fontWeight: '600', 
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Email
                  </p>
                  <p style={{ 
                    margin: 0, 
                    fontSize: isMobile ? '16px' : '18px', 
                    fontWeight: '600', 
                    color: '#1e293b',
                    wordBreak: 'break-all'
                  }}>
                    {cliente?.email}
                  </p>
                </div>

                {cliente?.telefono && (
                  <div style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    padding: isMobile ? '16px' : '24px',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                  }}>
                    <p style={{ 
                      margin: '0 0 12px 0', 
                      fontSize: isMobile ? '11px' : '13px', 
                      color: '#64748b', 
                      fontWeight: '600', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Teléfono
                    </p>
                    <p style={{ 
                      margin: 0, 
                      fontSize: isMobile ? '16px' : '18px', 
                      fontWeight: '600', 
                      color: '#1e293b',
                      wordBreak: 'break-all'
                    }}>
                      {cliente.telefono}
                    </p>
                  </div>
                )}
              </div>

              {/* Botones centrados */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '16px',
                alignItems: 'center',
                width: '100%',
                maxWidth: '400px'
              }}>
                <button style={{
                  background: empresa?.colorPrimario ? 
                    `linear-gradient(135deg, ${empresa.colorPrimario} 0%, ${empresa.colorPrimario}dd 100%)` :
                    'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '16px 32px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: empresa?.colorPrimario ? 
                    `0 4px 12px ${empresa.colorPrimario}40` :
                    '0 4px 12px rgba(59,130,246,0.3)',
                  width: '100%'
                }}
                onClick={abrirModalEdicion}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = empresa?.colorPrimario ? 
                    `0 6px 16px ${empresa.colorPrimario}60` :
                    '0 6px 16px rgba(59,130,246,0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = empresa?.colorPrimario ? 
                    `0 4px 12px ${empresa.colorPrimario}40` :
                    '0 4px 12px rgba(59,130,246,0.3)';
                }}>
                  ✏️ Editar Perfil
                </button>
                <button style={{
                  background: empresa?.colorSecundario ? 
                    `linear-gradient(135deg, ${empresa.colorSecundario} 0%, ${empresa.colorSecundario}dd 100%)` :
                    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '16px 32px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: empresa?.colorSecundario ? 
                    `0 4px 12px ${empresa.colorSecundario}40` :
                    '0 4px 12px rgba(245,158,11,0.3)',
                  width: '100%'
                }}
                onClick={abrirModalPassword}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = empresa?.colorSecundario ? 
                    `0 6px 16px ${empresa.colorSecundario}60` :
                    '0 6px 16px rgba(245,158,11,0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = empresa?.colorSecundario ? 
                    `0 4px 12px ${empresa.colorSecundario}40` :
                    '0 4px 12px rgba(245,158,11,0.3)';
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
            padding: isMobile ? '20px' : '32px',
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
              marginBottom: isMobile ? '20px' : '32px',
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '4px',
              border: '1px solid #e2e8f0',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '4px' : '0'
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
                  padding: isMobile ? '10px 16px' : '12px 20px',
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isMobile ? '6px' : '8px'
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
                  padding: isMobile ? '10px 16px' : '12px 20px',
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isMobile ? '6px' : '8px'
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
                  {favoritos.length}
                </span>
              </button>
              </div>

            {/* Contenido de las Pestañas */}
            <div style={{ minHeight: '400px' }}>
              {/* Pestaña: Mis Pedidos */}
              {tabActiva === 'pedidos' && (
                <div>
                  {/* Información de zona horaria */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: '12px'
                    }}>
                      <div>
                        <h3 style={{
                          margin: '0 0 8px 0',
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1e293b'
                        }}>
                          📅 Información de Fechas
                        </h3>
                        <p style={{
                          margin: 0,
                          fontSize: '14px',
                          color: '#64748b'
                        }}>
                          Las fechas se muestran en tu zona horaria local
                        </p>
                      </div>
                      <TimeZoneInfo showDetails={true} />
                    </div>
                  </div>
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
                          padding: isMobile ? '16px' : '24px',
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
                          {/* Header del pedido - Responsive */}
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: isMobile ? 'column' : 'row',
                            alignItems: isMobile ? 'flex-start' : 'center', 
                            justifyContent: 'space-between', 
                            marginBottom: '16px',
                            gap: isMobile ? '12px' : '0'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                              <div style={{
                                width: isMobile ? '32px' : '40px',
                                height: isMobile ? '32px' : '40px',
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: isMobile ? '14px' : '18px',
                                fontWeight: '600',
                                flexShrink: 0
                              }}>
                                📦
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <h3 style={{ 
                                  margin: '0 0 4px 0', 
                                  fontSize: isMobile ? '16px' : '18px', 
                                  fontWeight: '600', 
                                  color: '#1e293b',
                                  wordBreak: 'break-word'
                                }}>
                                  Pedido #{pedido.numeroPedido || pedido.id}
                                </h3>
                                <p style={{ 
                                  margin: 0, 
                                  fontSize: isMobile ? '12px' : '14px', 
                                  color: '#64748b',
                                  wordBreak: 'break-word'
                                }}>
                                  {formatearFecha(pedido.fechaCreacion)}
                                </p>
                              </div>
                            </div>
                            
                            {/* Botones y estado - Responsive */}
                            <div style={{ 
                              display: 'flex', 
                              flexDirection: isMobile ? 'column' : 'row',
                              alignItems: isMobile ? 'stretch' : 'center', 
                              gap: isMobile ? '8px' : '12px',
                              width: isMobile ? '100%' : 'auto'
                            }}>
                              <EstadoBadge estado={pedido.estado} />
                              
                              <div style={{
                                display: 'flex',
                                gap: '8px',
                                flexDirection: isMobile ? 'row' : 'row'
                              }}>
                                <button style={{
                                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: isMobile ? '6px 12px' : '8px 16px',
                                  fontSize: isMobile ? '12px' : '14px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  flex: isMobile ? 1 : 'auto',
                                  whiteSpace: 'nowrap'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetallePedido(pedido);
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                  {isMobile ? '👁️ Ver' : '👁️ Ver Detalles'}
                                </button>
                                
                                {/* Botón de cancelar solo para pedidos pendientes o confirmados */}
                                {(pedido.estado === 'PENDIENTE' || pedido.estado === 'CONFIRMADO') && (
                                  <button style={{
                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: isMobile ? '6px 12px' : '8px 16px',
                                    fontSize: isMobile ? '12px' : '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    flex: isMobile ? 1 : 'auto',
                                    whiteSpace: 'nowrap'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('¿Estás seguro de que quieres cancelar este pedido? El stock será restaurado.')) {
                                      cancelarPedido(pedido.id);
                                    }
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                                    {isMobile ? '❌ Cancelar' : '❌ Cancelar'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Contenido del pedido - Responsive */}
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: isMobile ? '1fr' : '1fr auto', 
                            gap: isMobile ? '12px' : '16px', 
                            alignItems: isMobile ? 'flex-start' : 'center' 
                          }}>
                            <div>
                              <p style={{ 
                                margin: '0 0 8px 0', 
                                fontSize: isMobile ? '12px' : '14px', 
                                color: '#64748b', 
                                fontWeight: '500' 
                              }}>
                                Productos:
                              </p>
                              <div style={{ 
                                display: 'flex', 
                                flexWrap: 'wrap', 
                                gap: isMobile ? '6px' : '8px' 
                              }}>
                                {pedido.detalles?.slice(0, isMobile ? 2 : 3).map(det => (
                                  <span key={det.id} style={{
                                    background: 'white',
                                    padding: isMobile ? '3px 8px' : '4px 12px',
                                    borderRadius: '8px',
                                    fontSize: isMobile ? '10px' : '12px',
                                    color: '#1e293b',
                                    border: '1px solid #e2e8f0',
                                    wordBreak: 'break-word',
                                    maxWidth: isMobile ? '120px' : 'none'
                                  }}>
                                    {det.nombreProducto} {det.cantidad}
                                  </span>
                                ))}
                                {pedido.detalles && pedido.detalles.length > (isMobile ? 2 : 3) && (
                                  <span style={{
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                    color: 'white',
                                    padding: isMobile ? '3px 8px' : '4px 12px',
                                    borderRadius: '8px',
                                    fontSize: isMobile ? '10px' : '12px',
                                    fontWeight: '600'
                                  }}>
                                    +{pedido.detalles.length - (isMobile ? 2 : 3)} más
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Total - Responsive */}
                            <div style={{ 
                              textAlign: isMobile ? 'left' : 'right',
                              alignSelf: isMobile ? 'flex-start' : 'center'
                            }}>
                              <p style={{ 
                                margin: '0 0 4px 0', 
                                fontSize: isMobile ? '12px' : '14px', 
                                color: '#64748b' 
                              }}>
                                Total
                              </p>
                              <p style={{ 
                                margin: 0, 
                                fontSize: isMobile ? '20px' : '24px', 
                                fontWeight: '700', 
                                color: '#8b5cf6' 
                              }}>
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
                <div>
                  {cargandoFavoritos ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
                      color: '#64748b'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid #e2e8f0',
                        borderTop: '3px solid #f59e0b',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                      }} />
                      <p style={{ margin: 0, fontSize: '16px' }}>Cargando favoritos...</p>
                    </div>
                  ) : favoritos.length === 0 ? (
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
                        Ver Productos
                  </Link>
                </div>
                  ) : (
                    <div>
                      <div style={{
                        display: 'grid',
                        gap: '20px',
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))'
                      }}>
                        {favoritos.map((favorito) => (
                          <div key={favorito.id} style={{
                            background: '#fff',
                            borderRadius: '16px',
                            padding: '20px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            cursor: 'pointer'
                          }}
                          onClick={() => abrirModalProducto(favorito.producto)}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                          }}>
                            {/* Botón de remover favorito */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removerFavorito(favorito.producto.id);
                              }}
                              style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                background: 'rgba(239,68,68,0.1)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                color: '#ef4444',
                                fontSize: '16px',
                                zIndex: 10
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              ❌
                            </button>

                            {/* Imagen del producto */}
                            <div style={{
                              width: '100%',
                              height: '200px',
                              background: favorito.producto.imagenUrl 
                                ? `url(${favorito.producto.imagenUrl}) center/cover`
                                : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                              borderRadius: '12px',
                              marginBottom: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '48px',
                              color: '#94a3b8'
                            }}>
                              {!favorito.producto.imagenUrl && '🛍️'}
                            </div>

                            {/* Información del producto */}
                            <div>
                              <h3 style={{
                                margin: '0 0 8px 0',
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#1e293b',
                                lineHeight: '1.4'
                              }}>
                                {favorito.producto.nombre}
                              </h3>
                              
                              {favorito.producto.descripcion && (
                                <p style={{
                                  margin: '0 0 12px 0',
                                  fontSize: '14px',
                                  color: '#64748b',
                                  lineHeight: '1.5',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}>
                                  {favorito.producto.descripcion}
                                </p>
                              )}

                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '16px'
                              }}>
                                <span style={{
                                  fontSize: '24px',
                                  fontWeight: '700',
                                  color: empresa?.colorPrimario || '#f59e0b'
                                }}>
                                  ${favorito.producto.precio.toFixed(2)}
                                </span>
                                
                                <span style={{
                                  fontSize: '14px',
                                  color: favorito.producto.stock > 0 ? '#10b981' : '#ef4444',
                                  fontWeight: '600'
                                }}>
                                  {favorito.producto.stock > 0 ? `Stock: ${favorito.producto.stock}` : 'Sin stock'}
                                </span>
            </div>

                              {/* Categoría y marca */}
                              <div style={{
                                display: 'flex',
                                gap: '8px',
                                marginBottom: '16px',
                                flexWrap: 'wrap'
                              }}>
                                {favorito.producto.categoria && (
                                  <span style={{
                                    background: 'rgba(139,92,246,0.1)',
                                    color: '#8b5cf6',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '500'
                                  }}>
                                    {favorito.producto.categoria}
                                  </span>
                                )}
                                {favorito.producto.marca && (
                                  <span style={{
                                    background: 'rgba(59,130,246,0.1)',
                                    color: '#3b82f6',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '500'
                                  }}>
                                    {favorito.producto.marca}
                                  </span>
                                )}
                              </div>

                              {/* Indicador de click */}
                              <div style={{
                                textAlign: 'center',
                                padding: '8px',
                                background: 'rgba(59,130,246,0.1)',
                                borderRadius: '8px',
                                color: '#3b82f6',
                                fontSize: '14px',
                                fontWeight: '500'
                              }}>
                                👆 Click para ver detalles
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
        onCancelar={cancelarPedido}
      />

      {/* Modal de edición de perfil */}
      {showEditModal && (
        <div style={{
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
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: isMobile ? '24px' : '32px',
            maxWidth: isMobile ? '90vw' : '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: `3px solid ${empresa?.colorPrimario || '#3b82f6'}`
          }}>
            {/* Header del modal */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '2px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: `linear-gradient(135deg, ${empresa?.colorPrimario || '#3b82f6'} 0%, ${empresa?.colorPrimario ? `${empresa.colorPrimario}dd` : '#1d4ed8'} 100%)`,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: 'white'
                }}>
                  ✏️
                </div>
                <h2 style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '700',
                  color: empresa?.colorTexto || '#1e293b'
                }}>
                  Editar Perfil
                </h2>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
              >
                ✕
              </button>
            </div>

            {/* Formulario */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: empresa?.colorTexto || '#1e293b'
                }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #e2e8f0',
                    fontSize: '16px',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = empresa?.colorPrimario || '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: empresa?.colorTexto || '#1e293b'
                }}>
                  Apellidos
                </label>
                <input
                  type="text"
                  value={formData.apellidos}
                  onChange={(e) => setFormData(prev => ({ ...prev, apellidos: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #e2e8f0',
                    fontSize: '16px',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = empresa?.colorPrimario || '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  placeholder="Tus apellidos"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: empresa?.colorTexto || '#1e293b'
                }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #e2e8f0',
                    fontSize: '16px',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = empresa?.colorPrimario || '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: empresa?.colorTexto || '#1e293b'
                }}>
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #e2e8f0',
                    fontSize: '16px',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = empresa?.colorPrimario || '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  placeholder="+54 11 1234-5678"
                />
              </div>
            </div>

            {/* Botones */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '32px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowEditModal(false)}
                disabled={editando}
                style={{
                  background: '#f1f5f9',
                  color: '#64748b',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: editando ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: editando ? 0.6 : 1
                }}
              >
                Cancelar
              </button>
              <button
                onClick={guardarPerfil}
                disabled={editando}
                style={{
                  background: `linear-gradient(135deg, ${empresa?.colorPrimario || '#3b82f6'} 0%, ${empresa?.colorPrimario ? `${empresa.colorPrimario}dd` : '#1d4ed8'} 100%)`,
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: editando ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: editando ? 0.6 : 1
                }}
              >
                {editando ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de cambio de contraseña */}
      {showPasswordModal && (
        <div style={{
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
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: isMobile ? '24px' : '32px',
            maxWidth: isMobile ? '90vw' : '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: `3px solid ${empresa?.colorAcento || '#f59e0b'}`
          }}>
            {/* Header del modal */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '2px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: `linear-gradient(135deg, ${empresa?.colorAcento || '#f59e0b'} 0%, ${empresa?.colorAcento ? `${empresa.colorAcento}dd` : '#d97706'} 100%)`,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: 'white'
                }}>
                  🔒
                </div>
                <h2 style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '700',
                  color: empresa?.colorTexto || '#1e293b'
                }}>
                  Cambiar Contraseña
                </h2>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
              >
                ✕
              </button>
            </div>

            {/* Formulario */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: empresa?.colorTexto || '#1e293b'
                }}>
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  value={passwordData.passwordActual}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, passwordActual: e.target.value }))}
                  placeholder="Deja vacío si te registraste con Google"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = empresa?.colorAcento || '#f59e0b'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '12px',
                  color: '#64748b',
                  fontStyle: 'italic'
                }}>
                  💡 Si te registraste con Google, deja este campo vacío
                </p>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: empresa?.colorTexto || '#1e293b'
                }}>
                  Nueva Contraseña *
                </label>
                <input
                  type="password"
                  value={passwordData.passwordNueva}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, passwordNueva: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #e2e8f0',
                    fontSize: '16px',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = empresa?.colorAcento || '#f59e0b'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: empresa?.colorTexto || '#1e293b'
                }}>
                  Confirmar Nueva Contraseña *
                </label>
                <input
                  type="password"
                  value={passwordData.confirmarPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmarPassword: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #e2e8f0',
                    fontSize: '16px',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = empresa?.colorAcento || '#f59e0b'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  placeholder="Repite la nueva contraseña"
                />
              </div>
            </div>

            {/* Botones */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '32px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowPasswordModal(false)}
                disabled={cambiandoPassword}
                style={{
                  background: '#f1f5f9',
                  color: '#64748b',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: cambiandoPassword ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: cambiandoPassword ? 0.6 : 1
                }}
              >
                Cancelar
              </button>
              <button
                onClick={cambiarPassword}
                disabled={cambiandoPassword}
                style={{
                  background: `linear-gradient(135deg, ${empresa?.colorSecundario || '#63016a'} 0%, ${empresa?.colorSecundario ? `${empresa.colorSecundario}dd` : '#4c1d95'} 100%)`,
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: cambiandoPassword ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: cambiandoPassword ? 0.6 : 1
                }}
              >
                {cambiandoPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalles del producto */}
      <ProductoDetalleModal
        open={showProductoModal}
        onClose={cerrarModalProducto}
        productoId={productoIdSeleccionado}
        subdominio={subdominio || ''}
        empresa={empresa}
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
