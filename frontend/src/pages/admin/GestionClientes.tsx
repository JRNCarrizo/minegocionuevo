import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useResponsive } from '../../hooks/useResponsive';
import type { Cliente, Pedido } from '../../types';

// Componente Modal para detalles del cliente
function ClienteDetalleModal({ cliente, pedidos, open, onClose }: { 
  cliente: Cliente | null, 
  pedidos: Pedido[], 
  open: boolean, 
  onClose: () => void 
}) {
  const { isMobile } = useResponsive();
  console.log('=== DEBUG CLIENTE DETALLE MODAL ===');
  console.log('Open:', open);
  console.log('Cliente:', cliente);
  console.log('Pedidos:', pedidos);
  
  if (!cliente || !open) {
    console.log('Modal no se renderiza - cliente:', !!cliente, 'open:', open);
    return null;
  }

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

  return (
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
        borderRadius: isMobile ? '12px' : '16px',
        padding: '0',
        maxWidth: isMobile ? '95vw' : '900px',
        width: isMobile ? '95vw' : '95vw',
        maxHeight: isMobile ? '95vh' : '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Header del modal */}
        <div style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #3730a3 100%)',
          color: 'white',
          padding: isMobile ? '16px 20px' : '24px 32px',
          borderTopLeftRadius: isMobile ? '12px' : '16px',
          borderTopRightRadius: isMobile ? '12px' : '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ 
              margin: 0, 
              fontSize: isMobile ? '18px' : '24px', 
              fontWeight: '600',
              lineHeight: isMobile ? '1.2' : '1.4'
            }}>
              👤 {cliente.nombre} {cliente.apellidos}
            </h2>
            <p style={{ 
              margin: '4px 0 0 0', 
              opacity: 0.9, 
              fontSize: isMobile ? '12px' : '14px' 
            }}>
              Detalles completos del cliente
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
        <div style={{ 
          padding: isMobile ? '16px' : '32px', 
          maxHeight: isMobile ? 'calc(95vh - 100px)' : 'calc(90vh - 120px)', 
          overflow: 'auto' 
        }}>
          {/* Información del cliente */}
          <div style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '20px',
            marginBottom: '24px',
            border: '1px solid #bae6fd'
          }}>
            <h3 style={{ 
              margin: '0 0 16px 0', 
              fontSize: isMobile ? '16px' : '18px', 
              fontWeight: '600', 
              color: '#1e293b' 
            }}>
              📋 Información Personal
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: isMobile ? '12px' : '16px' 
            }}>
              <div>
                <p style={{ 
                  margin: '0 0 4px 0', 
                  fontSize: isMobile ? '11px' : '12px', 
                  color: '#64748b', 
                  fontWeight: '500' 
                }}>
                  Nombre Completo
                </p>
                <p style={{ 
                  margin: 0, 
                  fontSize: isMobile ? '14px' : '16px', 
                  fontWeight: '600', 
                  color: '#1e293b',
                  wordBreak: 'break-word'
                }}>
                  {cliente.nombre} {cliente.apellidos}
                </p>
              </div>
              <div>
                <p style={{ 
                  margin: '0 0 4px 0', 
                  fontSize: isMobile ? '11px' : '12px', 
                  color: '#64748b', 
                  fontWeight: '500' 
                }}>
                  Email
                </p>
                <p style={{ 
                  margin: 0, 
                  fontSize: isMobile ? '14px' : '16px', 
                  fontWeight: '600', 
                  color: '#1e293b',
                  wordBreak: 'break-all'
                }}>
                  {cliente.email}
                </p>
              </div>
              <div>
                <p style={{ 
                  margin: '0 0 4px 0', 
                  fontSize: isMobile ? '11px' : '12px', 
                  color: '#64748b', 
                  fontWeight: '500' 
                }}>
                  Teléfono
                </p>
                <p style={{ 
                  margin: 0, 
                  fontSize: isMobile ? '14px' : '16px', 
                  fontWeight: '600', 
                  color: '#1e293b' 
                }}>
                  {cliente.telefono || 'No especificado'}
                </p>
              </div>
              <div>
                <p style={{ 
                  margin: '0 0 4px 0', 
                  fontSize: isMobile ? '11px' : '12px', 
                  color: '#64748b', 
                  fontWeight: '500' 
                }}>
                  Fecha de Registro
                </p>
                <p style={{ 
                  margin: 0, 
                  fontSize: isMobile ? '14px' : '16px', 
                  fontWeight: '600', 
                  color: '#1e293b',
                  wordBreak: 'break-word'
                }}>
                  {(() => { const fecha = cliente.fechaCreacion; const fechaUTC = fecha.endsWith('Z') ? fecha : fecha + 'Z'; return new Date(fechaUTC).toLocaleString('es-AR', { year: 'numeric', month: isMobile ? 'short' : '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' }); })()}
                </p>
              </div>
            </div>
            
            {(cliente.direccion || cliente.ciudad || cliente.pais) && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ 
                  margin: '0 0 4px 0', 
                  fontSize: isMobile ? '11px' : '12px', 
                  color: '#64748b', 
                  fontWeight: '500' 
                }}>
                  Dirección
                </p>
                <p style={{ 
                  margin: 0, 
                  fontSize: isMobile ? '13px' : '14px', 
                  color: '#475569',
                  wordBreak: 'break-word'
                }}>
                  {[cliente.direccion, cliente.ciudad, cliente.pais].filter(Boolean).join(', ') || 'No especificada'}
                </p>
              </div>
            )}
          </div>

          {/* Estadísticas de compras */}
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '20px',
            marginBottom: '24px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ 
              margin: '0 0 16px 0', 
              fontSize: isMobile ? '16px' : '18px', 
              fontWeight: '600', 
              color: '#1e293b' 
            }}>
              💰 Estadísticas de Compras
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(150px, 1fr))', 
              gap: isMobile ? '12px' : '16px' 
            }}>
              <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: isMobile ? '12px' : '16px',
                textAlign: 'center',
                border: '1px solid #e2e8f0'
              }}>
                <p style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: isMobile ? '12px' : '14px', 
                  color: '#64748b' 
                }}>
                  Total Pedidos
                </p>
                <p style={{ 
                  margin: 0, 
                  fontSize: isMobile ? '20px' : '24px', 
                  fontWeight: '700', 
                  color: '#3b82f6' 
                }}>
                  {cliente.totalPedidos || 0}
                </p>
              </div>
              <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: isMobile ? '12px' : '16px',
                textAlign: 'center',
                border: '1px solid #e2e8f0'
              }}>
                <p style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: isMobile ? '12px' : '14px', 
                  color: '#64748b' 
                }}>
                  Total Compras
                </p>
                <p style={{ 
                  margin: 0, 
                  fontSize: isMobile ? '20px' : '24px', 
                  fontWeight: '700', 
                  color: '#059669' 
                }}>
                  ${(cliente.totalCompras || 0).toFixed(2)}
                </p>
              </div>
              <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: isMobile ? '12px' : '16px',
                textAlign: 'center',
                border: '1px solid #e2e8f0'
              }}>
                <p style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: isMobile ? '12px' : '14px', 
                  color: '#64748b' 
                }}>
                  Promedio por Pedido
                </p>
                <p style={{ 
                  margin: 0, 
                  fontSize: isMobile ? '20px' : '24px', 
                  fontWeight: '700', 
                  color: '#f59e0b' 
                }}>
                  ${cliente.totalPedidos && cliente.totalPedidos > 0 ? ((cliente.totalCompras || 0) / cliente.totalPedidos).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </div>

          {/* Historial de pedidos */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ 
              margin: '0 0 16px 0', 
              fontSize: isMobile ? '18px' : '20px', 
              fontWeight: '600', 
              color: '#1e293b' 
            }}>
              🛒 Historial de Pedidos ({pedidos.length})
            </h3>
            
            {pedidos.length === 0 ? (
              <div style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: isMobile ? '24px' : '32px',
                textAlign: 'center',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ 
                  fontSize: isMobile ? '36px' : '48px', 
                  marginBottom: '16px', 
                  opacity: 0.5 
                }}>
                  📭
                </div>
                <p style={{ 
                  margin: 0, 
                  fontSize: isMobile ? '14px' : '16px', 
                  color: '#64748b' 
                }}>
                  Este cliente aún no ha realizado ningún pedido.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '12px' }}>
                {pedidos.map((pedido, index) => (
                  <div 
                    key={pedido.id || index} 
                    style={{
                      background: '#fff',
                      borderRadius: '12px',
                      padding: isMobile ? '12px' : '16px',
                      border: '2px solid #e2e8f0',
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
                  >
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: 'space-between', 
                      alignItems: isMobile ? 'flex-start' : 'center',
                      gap: isMobile ? '8px' : '0'
                    }}>
                      <div>
                        <h4 style={{ 
                          margin: '0 0 4px 0', 
                          fontSize: isMobile ? '14px' : '16px', 
                          fontWeight: '600', 
                          color: '#1e293b',
                          wordBreak: 'break-word'
                        }}>
                          Pedido #{pedido.numeroPedido || pedido.id}
                        </h4>
                        <p style={{ 
                          margin: '0 0 8px 0', 
                          fontSize: isMobile ? '12px' : '14px', 
                          color: '#64748b',
                          wordBreak: 'break-word'
                        }}>
                          {(() => { const fecha = pedido.fechaCreacion; const fechaUTC = fecha.endsWith('Z') ? fecha : fecha + 'Z'; return new Date(fechaUTC).toLocaleString('es-AR', { year: 'numeric', month: isMobile ? 'short' : '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' }); })()}
                        </p>
                        <span
                          style={{
                            backgroundColor: obtenerColorEstado(pedido.estado) + '20',
                            color: obtenerColorEstado(pedido.estado),
                            padding: isMobile ? '3px 8px' : '4px 12px',
                            borderRadius: '12px',
                            fontSize: isMobile ? '10px' : '12px',
                            fontWeight: '600',
                            border: `1px solid ${obtenerColorEstado(pedido.estado)}30`
                          }}
                        >
                          {obtenerTextoEstado(pedido.estado)}
                        </span>
                      </div>
                      <div style={{ 
                        textAlign: isMobile ? 'left' : 'right',
                        alignSelf: isMobile ? 'flex-start' : 'flex-end'
                      }}>
                        <p style={{ 
                          margin: 0, 
                          fontSize: isMobile ? '16px' : '18px', 
                          fontWeight: '700', 
                          color: '#059669'
                        }}>
                          ${pedido.total?.toFixed(2)}
                        </p>
                        <p style={{ 
                          margin: '4px 0 0 0', 
                          fontSize: isMobile ? '10px' : '12px', 
                          color: '#64748b'
                        }}>
                          {pedido.detalles?.length || 0} producto{(pedido.detalles?.length || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GestionClientes() {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  console.log('Responsive debug:', { isMobile, isTablet, isDesktop, windowWidth: window.innerWidth });
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [empresaId, setEmpresaId] = useState<number | null>(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [pedidosCliente, setPedidosCliente] = useState<Pedido[]>([]);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [empresaNombre, setEmpresaNombre] = useState<string>('');
  const [nombreAdministrador, setNombreAdministrador] = useState<string>('');

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
        console.log(error);
        // Error al parsear usuario, ignorado
        // Puedes loguear el error si lo deseas:
        // console.error('Error al parsear usuario:', error);
      }
    }
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/admin/login';
  };

  const cargarClientes = useCallback(async () => {
    if (!empresaId) return;
    setCargando(true);
    try {
      console.log('=== DEBUG CARGAR CLIENTES ===');
      console.log('EmpresaId:', empresaId);
      const response = await api.obtenerClientesPaginado(empresaId, 0, 100);
      console.log('Respuesta completa:', response);
      const clientesApi: Cliente[] = response.content || [];
      console.log('Clientes cargados:', clientesApi);
      console.log('Estadísticas de clientes:', clientesApi.map(c => ({
        id: c.id,
        nombre: c.nombre,
        totalPedidos: c.totalPedidos,
        totalCompras: c.totalCompras
      })));
      setClientes(clientesApi);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      toast.error('Error al cargar los clientes');
    } finally {
      setCargando(false);
    }
  }, [empresaId]);

  useEffect(() => {
    if (empresaId) {
      cargarClientes();
      
      // Marcar todos los clientes como vistos
      const marcarClientesComoVistos = async () => {
        try {
          const response = await api.obtenerClientesPaginado(empresaId, 0, 1000);
          const todosLosIds = response.content?.map((cliente: Cliente) => cliente.id) || [];
          localStorage.setItem(`clientesVistos_${empresaId}`, JSON.stringify(todosLosIds));
        } catch (error) {
          console.error('Error al marcar clientes como vistos:', error);
        }
      };
      
      marcarClientesComoVistos();
    }
  }, [empresaId, cargarClientes]);

  const alternarEstadoCliente = async (id: number) => {
    try {
      // Simular actualización
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setClientes(prev => prev.map(cliente => 
        cliente.id === id ? { ...cliente, activo: !cliente.activo } : cliente
      ));
      
      toast.success('Estado del cliente actualizado');
    } catch {
      toast.error('Error al actualizar el estado del cliente');
    }
  };

  const verDetallesCliente = async (cliente: Cliente) => {
    if (!empresaId) return;
    
    console.log('=== DEBUG VER DETALLES CLIENTE ===');
    console.log('EmpresaId:', empresaId);
    console.log('Cliente:', cliente);
    
    setCargandoDetalle(true);
    try {
      // Primero probar el endpoint de debug
      console.log('Probando endpoint de debug...');
      try {
        const debugResponse = await api.debugAuth(empresaId);
        console.log('Debug response:', debugResponse);
      } catch (debugError) {
        console.error('Error en debug endpoint:', debugError);
      }
      
      // Cargar detalles del cliente y su historial de pedidos
      console.log('Llamando a obtenerClienteConHistorial...');
      const clienteResponse = await api.obtenerClienteConHistorial(empresaId, cliente.id);
      console.log('Respuesta cliente:', clienteResponse);
      
      console.log('Llamando a obtenerHistorialPedidosCliente...');
      const pedidosResponse = await api.obtenerHistorialPedidosCliente(empresaId, cliente.id);
      console.log('Respuesta pedidos:', pedidosResponse);
      
      setClienteSeleccionado(clienteResponse.data);
      setPedidosCliente(pedidosResponse.data || []);
      setMostrarDetalle(true);
      
      console.log('Modal abierto con datos:', {
        cliente: clienteResponse.data,
        pedidos: pedidosResponse.data
      });
    } catch (error) {
      console.error('Error al cargar detalles del cliente:', error);
      toast.error('Error al cargar los detalles del cliente');
    } finally {
      setCargandoDetalle(false);
    }
  };

  const clientesFiltrados = clientes.filter(cliente => {
    const textoBusqueda = busqueda.toLowerCase();
    return (
      cliente.nombre.toLowerCase().includes(textoBusqueda) ||
      (cliente.apellidos?.toLowerCase().includes(textoBusqueda) || "") ||
      cliente.email.toLowerCase().includes(textoBusqueda) ||
      (cliente.telefono?.includes(textoBusqueda) || "")
    );
  });

  // Calcular estadísticas generales
  const totalCompras = clientes.reduce((total, cliente) => total + (cliente.totalCompras || 0), 0);

  console.log('Estado del modal:', { mostrarDetalle, clienteSeleccionado: !!clienteSeleccionado, pedidosCliente: pedidosCliente.length });

  if (cargando) {
    return (
      <div className="h-pantalla-minimo" style={{ backgroundColor: '#f8fafc' }}>
        <NavbarAdmin 
          onCerrarSesion={cerrarSesion}
          empresaNombre={empresaNombre}
          nombreAdministrador={nombreAdministrador}
        />
        <div className="contenedor" style={{ 
          paddingTop: (isMobile || window.innerWidth < 768) ? '8rem' : '5rem', 
          paddingBottom: '2rem',
          paddingLeft: '1rem',
          paddingRight: '1rem'
        }}>
          <div className="tarjeta text-center py-12">
            <div className="spinner mx-auto mb-4"></div>
            <p>Cargando clientes...</p>
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
          paddingTop: (isMobile || window.innerWidth < 768) ? '10.5rem' : '11.5rem', // Increased to avoid overlap
        paddingBottom: '2rem',
        paddingLeft: '1rem',
        paddingRight: '1rem'
      }}>
        <div className="mb-8">
          <h1 className="titulo-2 mb-4" style={{ 
            fontSize: isMobile ? '24px' : '32px', 
            fontWeight: '700', 
            color: '#1e293b',
            letterSpacing: '-0.025em',
            lineHeight: '1.2'
          }}>
            👥 Gestión de Clientes
          </h1>
          <p className="texto-gris" style={{ 
            fontSize: isMobile ? '14px' : '16px', 
            color: '#64748b',
            marginBottom: '8px'
          }}>
            Administra tu base de clientes y sus actividades comerciales.
          </p>
          <div style={{
            height: '4px',
            width: '60px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            borderRadius: '2px',
            marginTop: '16px'
          }}></div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-2 mb-6" style={{ 
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: isMobile ? '12px' : '16px'
        }}>
          <div className="tarjeta" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: isMobile ? '16px' : '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <h3 className="texto-pequeno texto-gris mb-1" style={{ 
              fontSize: isMobile ? '12px' : '14px', 
              color: '#64748b' 
            }}>
              👥 Total Clientes
            </h3>
            <p className="titulo-2" style={{ 
              color: '#3b82f6', 
              fontSize: isMobile ? '24px' : '28px', 
              fontWeight: '700',
              margin: 0
            }}>
              {clientes.length}
            </p>
          </div>
          <div className="tarjeta" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: isMobile ? '16px' : '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <h3 className="texto-pequeno texto-gris mb-1" style={{ 
              fontSize: isMobile ? '12px' : '14px', 
              color: '#64748b' 
            }}>
              ✅ Clientes Activos
            </h3>
            <p className="titulo-2" style={{ 
              color: '#10b981', 
              fontSize: isMobile ? '24px' : '28px', 
              fontWeight: '700',
              margin: 0
            }}>
              {clientes.filter(c => c.activo).length}
            </p>
          </div>
          <div className="tarjeta" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: isMobile ? '16px' : '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <h3 className="texto-pequeno texto-gris mb-1" style={{ 
              fontSize: isMobile ? '12px' : '14px', 
              color: '#64748b' 
            }}>
              🛒 Total Pedidos
            </h3>
            <p className="titulo-2" style={{ 
              color: '#f59e0b', 
              fontSize: isMobile ? '24px' : '28px', 
              fontWeight: '700',
              margin: 0
            }}>
              {clientes.reduce((total, cliente) => total + (cliente.totalPedidos || 0), 0)}
            </p>
          </div>
          <div className="tarjeta" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: isMobile ? '16px' : '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <h3 className="texto-pequeno texto-gris mb-1" style={{ 
              fontSize: isMobile ? '12px' : '14px', 
              color: '#64748b' 
            }}>
              💰 Total Ventas
            </h3>
            <p className="titulo-2" style={{ 
              color: '#059669', 
              fontSize: isMobile ? '24px' : '28px', 
              fontWeight: '700',
              margin: 0
            }}>
              ${totalCompras.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Buscador */}
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
            🔍 Buscar Clientes
          </h3>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="campo"
            placeholder="Buscar por nombre, email o teléfono..."
            style={{
              width: '100%',
              padding: isMobile ? '10px 14px' : '12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: isMobile ? '14px' : '16px',
              transition: 'all 0.2s ease'
            }}
          />
        </div>

        {/* Lista de clientes */}
        <div className="tarjeta" style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: isMobile ? '16px' : '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <h3 className="titulo-3 mb-6" style={{
            fontSize: isMobile ? '20px' : '22px',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            👥 Clientes ({clientesFiltrados.length})
            <span style={{
              background: '#e2e8f0',
              color: '#64748b',
              fontSize: isMobile ? '12px' : '14px',
              padding: isMobile ? '3px 8px' : '4px 12px',
              borderRadius: '20px',
              fontWeight: '500'
            }}>
              {clientesFiltrados.length}
            </span>
          </h3>
          
          {clientesFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <div style={{
                fontSize: isMobile ? '36px' : '48px',
                marginBottom: '16px',
                opacity: 0.5
              }}>
                📭
              </div>
              <p className="texto-gris" style={{ 
                fontSize: isMobile ? '14px' : '16px', 
                color: '#64748b',
                padding: isMobile ? '0 16px' : '0'
              }}>
                {busqueda ? 'No se encontraron clientes que coincidan con la búsqueda.' : 'No hay clientes registrados.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4" style={{ gap: isMobile ? '12px' : '16px' }}>
              {clientesFiltrados.map(cliente => (
                <div
                  key={cliente.id}
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
                    if (!isMobile) {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.15)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {isMobile ? (
                    // Layout móvil: elementos apilados verticalmente
                    <>
                      {/* Header con nombre y estado */}
                      <div style={{ marginBottom: '16px' }}>
                        <h4 className="titulo-3 mb-1" style={{
                          fontSize: '18px',
                          fontWeight: '700',
                          color: '#1e293b',
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap'
                        }}>
                          {cliente.nombre} {cliente.apellidos}
                          {!cliente.activo && (
                            <span 
                              className="ml-2 px-2 py-1 rounded-full texto-pequeno"
                              style={{
                                backgroundColor: '#ef444420',
                                color: '#ef4444',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '600',
                                border: '1px solid #ef444430'
                              }}
                            >
                              ❌ Inactivo
                            </span>
                          )}
                        </h4>
                        <p className="texto-pequeno texto-gris mb-2" style={{
                          fontSize: '13px',
                          color: '#64748b',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}>
                          <span>📧 {cliente.email}</span>
                          {cliente.telefono && (
                            <span>📞 {cliente.telefono}</span>
                          )}
                        </p>
                        <p className="texto-pequeno texto-gris" style={{
                          fontSize: '11px',
                          color: '#64748b'
                        }}>
                          📅 Registrado: {(() => { const fecha = cliente.fechaCreacion; const fechaUTC = fecha.endsWith('Z') ? fecha : fecha + 'Z'; return new Date(fechaUTC).toLocaleString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' }); })()}
                        </p>
                      </div>

                      {/* Estadísticas centradas */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: '12px', 
                        marginBottom: '16px',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{
                          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                          color: 'white',
                          padding: '8px 12px',
                          borderRadius: '12px',
                          fontSize: '16px',
                          fontWeight: '700',
                          boxShadow: '0 2px 8px rgba(5,150,105,0.3)',
                          textAlign: 'center'
                        }}>
                          ${(cliente.totalCompras || 0).toFixed(2)}
                        </div>
                        <div style={{
                          background: '#f1f5f9',
                          color: '#64748b',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          textAlign: 'center'
                        }}>
                          🛒 {cliente.totalPedidos || 0} pedidos
                        </div>
                      </div>

                      {/* Botones apilados verticalmente */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            onClick={() => verDetallesCliente(cliente)}
                            className="boton boton-secundario texto-pequeno"
                            style={{
                              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '10px 16px',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
                              flex: 1
                            }}
                            disabled={cargandoDetalle}
                          >
                            {cargandoDetalle ? '⏳ Cargando...' : '👁️ Ver Detalles'}
                          </button>
                          <button className="boton boton-secundario texto-pequeno" style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '10px 16px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                            flex: 1
                          }}>
                            📧 Enviar Email
                          </button>
                        </div>
                        <button
                          onClick={() => alternarEstadoCliente(cliente.id)}
                          className={`boton texto-pequeno ${cliente.activo ? 'boton-secundario' : 'boton-primario'}`}
                          style={{
                            background: cliente.activo 
                              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: cliente.activo 
                              ? '0 2px 8px rgba(239,68,68,0.3)'
                              : '0 2px 8px rgba(16,185,129,0.3)'
                          }}
                        >
                          {cliente.activo ? '❌ Desactivar' : '✅ Activar'}
                        </button>
                      </div>
                    </>
                  ) : (
                    // Layout desktop/tablet: elementos en línea
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="titulo-3 mb-1" style={{
                            fontSize: '20px',
                            fontWeight: '700',
                            color: '#1e293b',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            {cliente.nombre} {cliente.apellidos}
                            {!cliente.activo && (
                              <span 
                                className="ml-2 px-2 py-1 rounded-full texto-pequeno"
                                style={{
                                  backgroundColor: '#ef444420',
                                  color: '#ef4444',
                                  padding: '4px 12px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  border: '1px solid #ef444430'
                                }}
                              >
                                ❌ Inactivo
                              </span>
                            )}
                          </h4>
                          <p className="texto-pequeno texto-gris mb-2" style={{
                            fontSize: '14px',
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            📧 {cliente.email}
                            {cliente.telefono && (
                              <>
                                <span style={{ color: '#cbd5e1' }}>•</span>
                                📞 {cliente.telefono}
                              </>
                            )}
                          </p>
                          <p className="texto-pequeno texto-gris" style={{
                            fontSize: '12px',
                            color: '#64748b'
                          }}>
                            📅 Registrado: {(() => { const fecha = cliente.fechaCreacion; const fechaUTC = fecha.endsWith('Z') ? fecha : fecha + 'Z'; return new Date(fechaUTC).toLocaleString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' }); })()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                            <div style={{
                              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                              color: 'white',
                              padding: '8px 16px',
                              borderRadius: '12px',
                              fontSize: '18px',
                              fontWeight: '700',
                              boxShadow: '0 2px 8px rgba(5,150,105,0.3)'
                            }}>
                              ${(cliente.totalCompras || 0).toFixed(2)}
                            </div>
                            <div style={{
                              background: '#f1f5f9',
                              color: '#64748b',
                              padding: '4px 12px',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}>
                              🛒 {cliente.totalPedidos || 0} pedidos
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => verDetallesCliente(cliente)}
                            className="boton boton-secundario texto-pequeno"
                            style={{
                              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 16px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 8px rgba(59,130,246,0.3)'
                            }}
                            disabled={cargandoDetalle}
                          >
                            {cargandoDetalle ? '⏳ Cargando...' : '👁️ Ver Detalles'}
                          </button>
                          <button className="boton boton-secundario texto-pequeno" style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(99,102,241,0.3)'
                          }}>
                            📧 Enviar Email
                          </button>
                        </div>
                        <button
                          onClick={() => alternarEstadoCliente(cliente.id)}
                          className={`boton texto-pequeno ${cliente.activo ? 'boton-secundario' : 'boton-primario'}`}
                          style={{
                            background: cliente.activo 
                              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: cliente.activo 
                              ? '0 2px 8px rgba(239,68,68,0.3)'
                              : '0 2px 8px rgba(16,185,129,0.3)'
                          }}
                        >
                          {cliente.activo ? '❌ Desactivar' : '✅ Activar'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalles */}
      <ClienteDetalleModal 
        cliente={clienteSeleccionado} 
        pedidos={pedidosCliente}
        open={mostrarDetalle} 
        onClose={() => {
          console.log('Cerrando modal');
          setMostrarDetalle(false);
          setClienteSeleccionado(null);
          setPedidosCliente([]);
        }} 
      />
    </div>
  );
}
