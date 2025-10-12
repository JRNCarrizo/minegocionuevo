import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaStore, FaChartLine, FaBell, FaBox, FaMoneyBillWave, FaExclamationTriangle, FaCreditCard, FaArrowUp } from 'react-icons/fa';
import {  MdInventory, MdPeople, MdSettings, MdNotifications, MdLogout, MdDashboard } from 'react-icons/md';
import { superAdminService } from '../services/superAdminService';
import type { DashboardStats } from '../services/superAdminService';
import toast from 'react-hot-toast';
import { useResponsive } from '../hooks/useResponsive';

const DashboardSuperAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalEmpresas: 0,
    totalUsuarios: 0,
    totalClientes: 0,
    totalProductos: 0,
    totalPedidos: 0,
    totalVentasRapidas: 0,
    empresasActivas: 0,
    empresasEnPrueba: 0,
    empresasSuspendidas: 0,
    empresasCanceladas: 0,
    empresasPorExpirar: 0,
    ingresosMensuales: 0,
    ingresosAnuales: 0,
    ingresosTotales: 0,
    promedioIngresosPorEmpresa: 0,
    tasaConversionPrueba: 0,
    nuevasEmpresasEsteMes: 0,
    nuevasEmpresasEsteAno: 0,
    empresasCanceladasEsteMes: 0,
    tasaRetencion: 0,
    empresasActivasHoy: 0,
    empresasInactivasMasDe30Dias: 0,
    empresasNuevasEstaSemana: 0
  });

  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const stats = await superAdminService.obtenerDashboard();
        setStats(stats);
      } catch (error) {
        console.error('Error al cargar dashboard:', error);
        setError('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    cargarDashboard();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showUserMenu && !target.closest('[data-user-menu]')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Sesión cerrada correctamente');
    navigate('/admin/login');
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
            Cargando dashboard...
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

  const statsCards = [
    { 
      icon: <FaStore size={40} />, 
      value: stats.totalEmpresas, 
      label: 'Empresas Registradas',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      bgLight: 'rgba(102, 126, 234, 0.1)',
      id: 'empresas'
    },
    { 
      icon: <FaUsers size={40} />, 
      value: stats.totalUsuarios, 
      label: 'Usuarios Activos',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      bgLight: 'rgba(245, 87, 108, 0.1)',
      id: 'usuarios'
    },
    { 
      icon: <FaBox size={40} />, 
      value: stats.totalProductos, 
      label: 'Productos Totales',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      bgLight: 'rgba(79, 172, 254, 0.1)',
      id: 'productos'
    },
    { 
      icon: <FaMoneyBillWave size={40} />, 
      value: stats.totalVentasRapidas, 
      label: 'Ventas Rápidas',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      bgLight: 'rgba(67, 233, 123, 0.1)',
      id: 'ventas'
    }
  ];

  const actionCards = [
    {
      icon: <MdPeople size={50} />,
      title: 'Gestionar Empresas',
      description: 'Administrar empresas registradas y configurar permisos',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      path: '/super-admin/empresas',
      id: 'empresas-action'
    },
    {
      icon: <FaCreditCard size={50} />,
      title: 'Gestionar Suscripciones',
      description: 'Administrar planes, suscripciones y facturación',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      path: '/super-admin/suscripciones',
      id: 'suscripciones-action'
    },
    {
      icon: <MdInventory size={50} />,
      title: 'Control de Inventarios',
      description: 'Monitorear inventarios globales y reportes',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      path: '/super-admin/inventarios',
      id: 'inventarios-action'
    },
    {
      icon: <FaChartLine size={50} />,
      title: 'Reportes Globales',
      description: 'Analizar métricas y generar estadísticas',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      path: '/super-admin/reportes',
      id: 'reportes-action'
    },
    {
      icon: <FaExclamationTriangle size={50} />,
      title: 'Soporte Técnico',
      description: 'Gestionar tickets y resolver problemas',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      path: '/super-admin/soporte',
      id: 'soporte-action'
    },
    {
      icon: <MdSettings size={50} />,
      title: 'Configuración Global',
      description: 'Configurar parámetros del sistema',
      gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      path: '/super-admin/configuracion',
      id: 'config-action'
    }
  ];

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
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>

      {/* Header Glassmorphism */}
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
                <MdDashboard size={isMobile ? 28 : 36} color="white" />
              </div>
              <h1 style={{
                fontSize: isMobile ? '1.5rem' : '2.5rem',
                fontWeight: '800',
                color: 'white',
                margin: 0,
                textShadow: '0 2px 10px rgba(0,0,0,0.2)'
              }}>
                Panel Super Administrador
              </h1>
            </div>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0,
              fontSize: isMobile ? '0.9rem' : '1.1rem',
              fontWeight: '500',
              paddingLeft: isMobile ? '0' : '4.5rem'
            }}>
              Gestión global de la plataforma Mi Negocio
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* Notificaciones */}
            <button style={{
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '14px',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1.3rem',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
            }}
            title="Notificaciones"
            >
              <MdNotifications />
              <span style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: '#ef4444',
                borderRadius: '50%',
                width: '10px',
                height: '10px',
                animation: 'pulse 2s infinite'
              }} />
            </button>

            {/* Menú de usuario */}
            <div style={{ position: 'relative' }} data-user-menu>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '14px',
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '1.3rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                }}
                title="Menú de usuario"
              >
                <FaUsers />
              </button>

              {/* Menú desplegable */}
              {showUserMenu && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  background: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                  minWidth: '250px',
                  zIndex: 9999,
                  overflow: 'hidden',
                  animation: 'fadeIn 0.3s ease'
                }}>
                  <div style={{
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    textAlign: 'center',
                    color: 'white'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: 'rgba(255,255,255,0.3)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem',
                      fontSize: '2rem'
                    }}>
                      👤
                    </div>
                    <div style={{ fontWeight: '700', marginBottom: '0.25rem', fontSize: '1.1rem' }}>
                      {userInfo.nombre || 'Super'} {userInfo.apellidos || 'Administrador'}
                    </div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                      {userInfo.email || 'admin@minegocio.com'}
                    </div>
                    <div style={{
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: '20px',
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      marginTop: '0.75rem',
                      display: 'inline-block'
                    }}>
                      SUPER ADMIN
                    </div>
                  </div>
                  
                  <div style={{ padding: '0.5rem' }}>
                    <button 
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/super-admin/perfil');
                      }}
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        color: '#374151',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        borderRadius: '10px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <MdSettings size={18} color="#667eea" />
                      Configuración
                    </button>
                    
                    <button 
                      onClick={() => {
                        setShowUserMenu(false);
                        cerrarSesion();
                      }}
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        color: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        borderRadius: '10px',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#fef2f2';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <MdLogout size={18} />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: isMobile ? '1rem' : '1.5rem',
        marginBottom: '2rem'
      }}>
        {statsCards.map((card, index) => (
          <div
            key={card.id}
            onMouseEnter={() => setHoveredCard(card.id)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '2rem',
              boxShadow: hoveredCard === card.id 
                ? '0 20px 60px rgba(0, 0, 0, 0.15)' 
                : '0 10px 30px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: hoveredCard === card.id ? 'translateY(-8px)' : 'translateY(0)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              animation: `fadeIn 0.6s ease ${index * 0.1}s both`
            }}
          >
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '150px',
              height: '150px',
              background: card.bgLight,
              borderRadius: '50%',
              transition: 'all 0.4s ease',
              transform: hoveredCard === card.id ? 'scale(1.5)' : 'scale(1)'
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                background: card.gradient,
                width: '70px',
                height: '70px',
                borderRadius: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                marginBottom: '1.5rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                transform: hoveredCard === card.id ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)',
                transition: 'all 0.4s ease'
              }}>
                {card.icon}
              </div>
              
              <div style={{
                fontSize: isMobile ? '2.2rem' : '2.8rem',
                fontWeight: '800',
                background: card.gradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '0.5rem',
                lineHeight: '1'
              }}>
                {(card.value || 0).toLocaleString()}
              </div>
              
              <div style={{
                fontSize: '1rem',
                color: '#6b7280',
                fontWeight: '600',
                letterSpacing: '0.3px'
              }}>
                {card.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions Section */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: isMobile ? '1.5rem' : '2rem',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        animation: 'fadeIn 0.8s ease'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '14px',
            padding: '0.75rem',
            display: 'flex'
          }}>
            <FaArrowUp size={28} color="white" />
          </div>
          <h2 style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '700',
            color: 'white',
            margin: 0
          }}>
            Acciones Rápidas
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: isMobile ? '1rem' : '1.5rem'
        }}>
          {actionCards.map((card, index) => (
            <div
              key={card.id}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => navigate(card.path)}
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '2rem',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: hoveredCard === card.id 
                  ? '0 20px 60px rgba(0, 0, 0, 0.15)' 
                  : '0 10px 30px rgba(0, 0, 0, 0.1)',
                transform: hoveredCard === card.id ? 'translateY(-8px)' : 'translateY(0)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: `fadeIn 0.6s ease ${index * 0.1}s both`
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '5px',
                background: card.gradient,
                transform: hoveredCard === card.id ? 'scaleX(1)' : 'scaleX(0)',
                transformOrigin: 'left',
                transition: 'transform 0.4s ease'
              }} />

              <div style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '150px',
                height: '150px',
                background: card.gradient,
                opacity: 0.05,
                borderRadius: '50%',
                transition: 'all 0.4s ease',
                transform: hoveredCard === card.id ? 'scale(1.5)' : 'scale(1)'
              }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  background: card.gradient,
                  width: '80px',
                  height: '80px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  marginBottom: '1.5rem',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                  transform: hoveredCard === card.id ? 'scale(1.1) rotate(-5deg)' : 'scale(1) rotate(0deg)',
                  transition: 'all 0.4s ease'
                }}>
                  {card.icon}
                </div>

                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  marginBottom: '0.75rem',
                  lineHeight: '1.3'
                }}>
                  {card.title}
                </h3>

                <p style={{
                  fontSize: '0.95rem',
                  color: '#6b7280',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {card.description}
                </p>

                <div style={{
                  marginTop: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  background: card.gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  opacity: hoveredCard === card.id ? 1 : 0,
                  transform: hoveredCard === card.id ? 'translateX(0)' : 'translateX(-10px)',
                  transition: 'all 0.3s ease'
                }}>
                  Acceder →
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSuperAdmin;
