import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaStore, FaBox, FaShoppingCart, FaEye, FaArrowLeft, FaSearch, FaFilter, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { MdBusiness, MdEmail, MdCalendarToday, MdWarning, MdCheckCircle as MdCheck, MdBlock, MdShoppingCart } from 'react-icons/md';
import { superAdminService } from '../../services/superAdminService';
import { formatearFechaConHora } from '../../utils/dateUtils';
import { useResponsive } from '../../hooks/useResponsive';
import toast from 'react-hot-toast';

interface Empresa {
  id: number;
  nombre: string;
  subdominio: string;
  email: string;
  telefono: string;
  logoUrl: string;
  estadoSuscripcion: string;
  fechaCreacion: string;
  totalProductos: number;
  totalClientes: number;
  totalPedidos: number;
  totalVentasRapidas: number;
  totalTransacciones: number;
  ultimaConexion: string;
  descripcion: string;
  colorPrimario: string;
  moneda: string;
  activa: boolean;
}

const GestionEmpresas: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('TODOS');
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    cargarEmpresas();
  }, []);

  const cargarEmpresas = async () => {
    try {
      setLoading(true);
      setError(null);
      const empresas = await superAdminService.obtenerEmpresas();
      setEmpresas(empresas || []);
    } catch (err) {
      console.error('Error al cargar empresas:', err);
      setError('Error al cargar las empresas');
      toast.error('Error al cargar las empresas');
    } finally {
      setLoading(false);
    }
  };

  const empresasFiltradas = empresas.filter(empresa => {
      const matchesSearch = empresa.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           empresa.subdominio.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           empresa.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterEstado === 'TODOS' || empresa.estadoSuscripcion === filterEstado;
      
      return matchesSearch && matchesFilter;
  });

  const getEstadoBadge = (estado: string) => {
    const configs: Record<string, { color: string; bg: string; text: string; icon: JSX.Element }> = {
      'ACTIVA': { 
        color: '#10B981', 
        bg: 'rgba(16, 185, 129, 0.1)', 
        text: 'Activa',
        icon: <FaCheckCircle />
      },
      'PRUEBA': { 
        color: '#F59E0B', 
        bg: 'rgba(245, 158, 11, 0.1)', 
        text: 'Prueba',
        icon: <MdWarning />
      },
      'SUSPENDIDA': { 
        color: '#EF4444', 
        bg: 'rgba(239, 68, 68, 0.1)', 
        text: 'Suspendida',
        icon: <FaTimesCircle />
      },
      'CANCELADA': { 
        color: '#6B7280', 
        bg: 'rgba(107, 114, 128, 0.1)', 
        text: 'Cancelada',
        icon: <MdBlock />
      }
    };

    const config = configs[estado] || configs['PRUEBA'];
    
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        borderRadius: '20px',
        background: config.bg,
        color: config.color,
        fontSize: '0.875rem',
        fontWeight: '600',
        border: `1.5px solid ${config.color}`
      }}>
        {config.icon}
        {config.text}
      </div>
    );
  };

  const estadosCount = {
    total: empresas.length,
    activas: empresas.filter(e => e.estadoSuscripcion === 'ACTIVA').length,
    prueba: empresas.filter(e => e.estadoSuscripcion === 'PRUEBA').length,
    suspendidas: empresas.filter(e => e.estadoSuscripcion === 'SUSPENDIDA').length
  };

  if (loading) {
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
          borderRadius: '20px',
          padding: '3rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    textAlign: 'center'
        }}>
          <div style={{
    width: '60px',
    height: '60px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #667eea',
    borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1.5rem'
          }} />
          <div style={{
            fontSize: '1.2rem',
            color: '#1f2937',
            fontWeight: '600'
          }}>
            Cargando empresas...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '3rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
          <div style={{ fontSize: '1.5rem', color: '#ef4444', marginBottom: '1rem', fontWeight: '700' }}>Error</div>
          <div style={{ color: '#6b7280', fontSize: '1.1rem' }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: isMobile ? '1rem' : '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: isMobile ? '1.5rem' : '2rem',
        marginBottom: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        animation: 'fadeIn 0.6s ease'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: '1rem'
        }}>
          <div style={{ flex: 1 }}>
            <button
              onClick={() => navigate('/dashboard-super-admin')}
            style={{ 
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                padding: '0.5rem 1rem',
                color: 'white',
              cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                marginBottom: '1rem',
                transition: 'all 0.3s ease'
              }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              <FaArrowLeft /> Volver al Dashboard
            </button>
            
      <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '0.5rem'
      }}>
        <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                padding: '0.75rem',
          display: 'flex',
          alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FaStore size={isMobile ? 28 : 36} color="white" />
              </div>
              <h1 style={{
                fontSize: isMobile ? '1.5rem' : '2.5rem',
                fontWeight: '800',
                color: 'white',
                margin: 0,
                textShadow: '0 2px 10px rgba(0,0,0,0.2)'
              }}>
                Gestión de Empresas
              </h1>
            </div>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0,
              fontSize: isMobile ? '0.9rem' : '1.1rem',
              fontWeight: '500',
              paddingLeft: isMobile ? '0' : '4.5rem'
            }}>
              Administra todas las empresas registradas en la plataforma
            </p>
      </div>

          <div style={{
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            padding: '1rem 2rem',
            minWidth: '120px'
          }}>
            <div style={{
              fontSize: isMobile ? '2rem' : '3rem',
              fontWeight: '800',
              color: 'white',
              lineHeight: '1'
            }}>
              {empresas.length}
          </div>
            <div style={{
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.9)',
              marginTop: '0.25rem',
              fontWeight: '600'
            }}>
              Empresas
          </div>
        </div>
          </div>
        </div>
        
      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {[
          { label: 'Total', value: estadosCount.total, color: '#667eea', icon: <FaStore /> },
          { label: 'Activas', value: estadosCount.activas, color: '#10B981', icon: <FaCheckCircle /> },
          { label: 'En Prueba', value: estadosCount.prueba, color: '#F59E0B', icon: <MdWarning /> },
          { label: 'Suspendidas', value: estadosCount.suspendidas, color: '#EF4444', icon: <FaTimesCircle /> }
        ].map((stat, index) => (
          <div
            key={index}
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              animation: `fadeIn 0.6s ease ${index * 0.1}s both`,
              transition: 'transform 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: `${stat.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: stat.color,
                fontSize: '1.5rem'
              }}>
                {stat.icon}
          </div>
          </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: '800',
              color: stat.color,
              marginBottom: '0.25rem'
            }}>
              {stat.value}
        </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              fontWeight: '600'
            }}>
              {stat.label}
          </div>
          </div>
        ))}
        </div>
        
      {/* Filters */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: isMobile ? '1rem' : '1.5rem',
        marginBottom: '2rem',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        animation: 'fadeIn 0.8s ease'
      }}>
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Search */}
          <div style={{ flex: isMobile ? '1 1 100%' : '1 1 300px', position: 'relative' }}>
            <FaSearch style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af',
              fontSize: '1rem'
            }} />
          <input
            type="text"
              placeholder="Buscar por nombre, email o subdominio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem 0.875rem 3rem',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '14px',
                fontSize: '0.95rem',
                background: 'rgba(255, 255, 255, 0.9)',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#667eea';
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
          />
        </div>
        
          {/* Filter */}
          <div style={{ position: 'relative' }}>
            <FaFilter style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af',
              fontSize: '0.9rem',
              pointerEvents: 'none',
              zIndex: 1
            }} />
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
              style={{
                padding: '0.875rem 3rem 0.875rem 3rem',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '14px',
                fontSize: '0.95rem',
                background: 'rgba(255, 255, 255, 0.9)',
                cursor: 'pointer',
                fontWeight: '600',
                color: '#374151',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
              }}
            >
              <option value="TODOS">Todos los estados</option>
            <option value="ACTIVA">Activas</option>
            <option value="PRUEBA">En Prueba</option>
            <option value="SUSPENDIDA">Suspendidas</option>
            <option value="CANCELADA">Canceladas</option>
          </select>
        </div>
        
          <div style={{
            marginLeft: 'auto',
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: '600',
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '0.875rem 1.5rem',
            borderRadius: '14px'
          }}>
            {empresasFiltradas.length} {empresasFiltradas.length === 1 ? 'empresa' : 'empresas'}
          </div>
        </div>
      </div>

      {/* Empresas Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(380px, 1fr))',
        gap: '1.5rem'
      }}>
        {empresasFiltradas.map((empresa, index) => (
          <div
            key={empresa.id}
            onMouseEnter={() => setHoveredCard(empresa.id)}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => {
              setSelectedEmpresa(empresa);
              setShowModal(true);
            }}
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '2rem',
              boxShadow: hoveredCard === empresa.id 
                ? '0 20px 60px rgba(0, 0, 0, 0.15)' 
                : '0 10px 30px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: hoveredCard === empresa.id ? 'translateY(-8px)' : 'translateY(0)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              animation: `fadeIn 0.6s ease ${index * 0.05}s both`
            }}
          >
            {/* Decorative gradient bar */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '5px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }} />

            {/* Header with logo and status */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
              {empresa.logoUrl ? (
                <img
                  src={empresa.logoUrl}
                    alt={empresa.nombre}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '14px',
                      objectFit: 'cover',
                      border: '2px solid #f3f4f6',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem',
                    fontWeight: '700',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                  }}>
                    {empresa.nombre.charAt(0)}
              </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#1f2937',
                    marginBottom: '0.25rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                  {empresa.nombre}
                </h3>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <MdBusiness size={14} />
                    {empresa.subdominio}.negocio360.org
                  </div>
                </div>
              </div>
            </div>

            {/* Status badge */}
            <div style={{ marginBottom: '1.5rem' }}>
              {getEstadoBadge(empresa.estadoSuscripcion)}
              </div>

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                background: 'rgba(102, 126, 234, 0.05)',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid rgba(102, 126, 234, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <FaBox size={16} color="#667eea" />
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '600' }}>
                    Productos
                </span>
              </div>
                <div style={{
                  fontSize: '1.75rem',
                  fontWeight: '800',
                  color: '#667eea'
                }}>
                  {empresa.totalProductos || 0}
                </div>
            </div>

              <div style={{
                background: 'rgba(16, 185, 129, 0.05)',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid rgba(16, 185, 129, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <FaUsers size={16} color="#10B981" />
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '600' }}>
                    Clientes
                  </span>
                </div>
                <div style={{
                  fontSize: '1.75rem',
                  fontWeight: '800',
                  color: '#10B981'
                }}>
                  {empresa.totalClientes || 0}
              </div>
                </div>

              <div style={{
                background: 'rgba(245, 158, 11, 0.05)',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid rgba(245, 158, 11, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <FaShoppingCart size={16} color="#F59E0B" />
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '600' }}>
                    Pedidos
                  </span>
              </div>
                <div style={{
                  fontSize: '1.75rem',
                  fontWeight: '800',
                  color: '#F59E0B'
                }}>
                  {empresa.totalPedidos || 0}
              </div>
            </div>

              <div style={{
                background: 'rgba(239, 68, 68, 0.05)',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid rgba(239, 68, 68, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <MdShoppingCart size={16} color="#EF4444" />
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '600' }}>
                    Ventas
                  </span>
                </div>
                <div style={{
                  fontSize: '1.75rem',
                  fontWeight: '800',
                  color: '#EF4444'
                }}>
                  {empresa.totalVentasRapidas || 0}
              </div>
                </div>
              </div>

            {/* Footer info */}
            <div style={{
              paddingTop: '1rem',
              borderTop: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: '#9ca3af'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <MdCalendarToday size={12} />
                {formatearFechaConHora(empresa.fechaCreacion)}
                </div>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: '700',
                fontSize: '0.8rem',
                opacity: hoveredCard === empresa.id ? 1 : 0,
                transition: 'opacity 0.3s ease'
              }}>
                Ver detalles →
              </div>
            </div>
          </div>
        ))}
            </div>

      {/* Empty state */}
      {empresasFiltradas.length === 0 && (
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '4rem 2rem',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>
            No se encontraron empresas
            </div>
          <div style={{ color: '#6b7280', fontSize: '1rem' }}>
            Intenta ajustar los filtros de búsqueda
          </div>
      </div>
      )}

      {/* Modal */}
      {showModal && selectedEmpresa && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            padding: '1rem',
            animation: 'fadeIn 0.3s ease'
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '24px',
              padding: '2rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
              position: 'relative'
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: '#ef4444',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1.25rem',
                fontWeight: '700',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.background = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = '#ef4444';
              }}
            >
              ✕
            </button>

            {/* Modal content */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '2rem',
              paddingRight: '3rem'
            }}>
              {selectedEmpresa.logoUrl ? (
                <img
                  src={selectedEmpresa.logoUrl}
                  alt={selectedEmpresa.nombre}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '18px',
                    objectFit: 'cover',
                    border: '3px solid #f3f4f6',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}
                />
              ) : (
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '2rem',
                  fontWeight: '700',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  {selectedEmpresa.nombre.charAt(0)}
              </div>
              )}
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: '2rem',
                  fontWeight: '800',
                  color: '#1f2937',
                  marginBottom: '0.5rem'
                }}>
                  {selectedEmpresa.nombre}
                </h2>
                {getEstadoBadge(selectedEmpresa.estadoSuscripcion)}
              </div>
            </div>

            {/* Details */}
            <div style={{
              display: 'grid',
              gap: '1.5rem'
            }}>
              <div style={{
                background: '#f9fafb',
                borderRadius: '14px',
                padding: '1.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: '#374151',
                  marginBottom: '1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Información General
                </h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <MdBusiness size={18} color="#667eea" />
                    <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Subdominio:</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1f2937' }}>
                      {selectedEmpresa.subdominio}.negocio360.org
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <MdEmail size={18} color="#667eea" />
                    <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Email:</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1f2937' }}>
                      {selectedEmpresa.email}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <MdCalendarToday size={18} color="#667eea" />
                    <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Creada:</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1f2937' }}>
                      {formatearFechaConHora(selectedEmpresa.fechaCreacion)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={{
                background: '#f9fafb',
                borderRadius: '14px',
                padding: '1.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: '#374151',
                  marginBottom: '1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Estadísticas
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1rem'
                }}>
                  {[
                    { label: 'Productos', value: selectedEmpresa.totalProductos, icon: <FaBox />, color: '#667eea' },
                    { label: 'Clientes', value: selectedEmpresa.totalClientes, icon: <FaUsers />, color: '#10B981' },
                    { label: 'Pedidos', value: selectedEmpresa.totalPedidos, icon: <FaShoppingCart />, color: '#F59E0B' },
                    { label: 'Ventas', value: selectedEmpresa.totalVentasRapidas, icon: <MdShoppingCart />, color: '#EF4444' }
                  ].map((stat, i) => (
                    <div key={i} style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '1rem',
                      textAlign: 'center',
                      border: `2px solid ${stat.color}15`
                    }}>
                      <div style={{
                        fontSize: '1.5rem',
                        color: stat.color,
                        marginBottom: '0.5rem'
                      }}>
                        {stat.icon}
                      </div>
                      <div style={{
                        fontSize: '2rem',
                        fontWeight: '800',
                        color: stat.color,
                        marginBottom: '0.25rem'
                      }}>
                        {stat.value || 0}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        fontWeight: '600'
                      }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

              <button
                onClick={() => window.open(`https://${selectedEmpresa.subdominio}.negocio360.org`, '_blank')}
                style={{
                  padding: '1rem 2rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                }}
              >
                <FaEye /> Visitar sitio web
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionEmpresas; 
