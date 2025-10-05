import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaStore, FaChartLine, FaBell, FaBox, FaMoneyBillWave, FaExclamationTriangle, FaCreditCard } from 'react-icons/fa';
import {  MdInventory, MdPeople, MdSettings, MdNotifications, MdLogout } from 'react-icons/md';
import { superAdminService } from '../services/superAdminService';
import type { DashboardStats } from '../services/superAdminService';
import toast from 'react-hot-toast';

const DashboardSuperAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
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

  // Obtener información del usuario desde localStorage
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔍 Verificando token antes de cargar dashboard...');
        const token = localStorage.getItem('token');
        console.log('🔍 Token en localStorage:', token);
        console.log('🔍 Longitud del token:', token?.length);
        console.log('🔍 Token completo:', token);
        
        if (token) {
          // Verificar si el token es válido (decodificar)
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('🔍 Token payload:', payload);
            console.log('🔍 Token expira:', new Date(payload.exp * 1000));
            console.log('🔍 Token ahora:', new Date());
            console.log('🔍 ¿Token expirado?', new Date() > new Date(payload.exp * 1000));
          } catch (e) {
            console.log('🔍 Error decodificando token:', e);
          }
        }
        
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

  // Cerrar menú cuando se hace clic fuera de él
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
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Mostrar mensaje de confirmación
    toast.success('Sesión cerrada correctamente');
    
    // Redirigir al login
    navigate('/admin/login');
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: 'var(--color-fondo)',
    fontFamily: 'var(--fuente-principal)',
    color: 'var(--color-texto)',
    padding: '20px'
  };

  const headerStyle: React.CSSProperties = {
    background: 'var(--gradiente-primario)',
    borderRadius: 'var(--border-radius)',
    padding: '20px',
    marginBottom: '30px',
    boxShadow: 'var(--sombra)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: 'white',
    margin: 0
  };

  const statsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  };

  const statCardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: 'var(--border-radius)',
    padding: '25px',
    boxShadow: 'var(--sombra)',
    border: '1px solid var(--color-borde)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
  };

  const statCardHoverStyle: React.CSSProperties = {
    ...statCardStyle,
    transform: 'translateY(-5px)',
    boxShadow: 'var(--sombra-hover)'
  };

  const statIconStyle: React.CSSProperties = {
    fontSize: '3rem',
    marginBottom: '15px',
    display: 'block'
  };

  const statNumberStyle: React.CSSProperties = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: 'var(--color-primario)',
    marginBottom: '5px'
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '1.1rem',
    color: 'var(--color-texto-secundario)',
    fontWeight: '500'
  };

  const actionsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  };

  const actionCardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: 'var(--border-radius)',
    padding: '25px',
    boxShadow: 'var(--sombra)',
    border: '1px solid var(--color-borde)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center'
  };

  const actionCardHoverStyle: React.CSSProperties = {
    ...actionCardStyle,
    transform: 'translateY(-3px)',
    boxShadow: 'var(--sombra-hover)',
    borderColor: 'var(--color-primario)'
  };

  const actionIconStyle: React.CSSProperties = {
    fontSize: '2.5rem',
    color: 'var(--color-primario)',
    marginBottom: '15px',
    display: 'block'
  };

  const actionTitleStyle: React.CSSProperties = {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: 'var(--color-texto)',
    marginBottom: '10px'
  };

  const actionDescStyle: React.CSSProperties = {
    fontSize: '1rem',
    color: 'var(--color-texto-secundario)',
    lineHeight: '1.5'
  };

  const loadingStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    fontSize: '1.2rem',
    color: 'var(--color-texto-secundario)'
  };

  const spinnerStyle: React.CSSProperties = {
    border: '4px solid var(--color-borde)',
    borderTop: '4px solid var(--color-primario)',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    marginRight: '15px'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>
          <div style={spinnerStyle}></div>
          Cargando dashboard del Super Administrador...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>
          <div style={{ color: '#ef4444', fontSize: '1.5rem', marginBottom: '15px' }}>⚠️</div>
          <div style={{ color: '#ef4444', fontSize: '1.2rem', marginBottom: '10px' }}>Error</div>
          <div style={{ color: 'var(--color-texto-secundario)', fontSize: '1rem' }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Panel Super Administrador</h1>
          <p style={{ color: 'white', margin: '5px 0 0 0', fontSize: '1.1rem' }}>
            Gestión global de la plataforma Mi Negocio
          </p>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {/* Notificaciones */}
          <button style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '45px',
            height: '45px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            cursor: 'pointer',
            fontSize: '1.2rem',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Notificaciones"
          >
            <MdNotifications />
          </button>

          {/* Menú de usuario */}
          <div style={{ position: 'relative' }} data-user-menu>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '45px',
                height: '45px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1.2rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Menú de usuario"
            >
              <FaUsers />
            </button>

            {/* Menú desplegable */}
            {showUserMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                minWidth: '200px',
                zIndex: 1000,
                marginTop: '5px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  padding: '15px',
                  borderBottom: '1px solid #e5e7eb',
                  textAlign: 'center'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#374151', marginBottom: '5px' }}>
                    {userInfo.nombre || 'Super'} {userInfo.apellidos || 'Administrador'}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {userInfo.email || 'jrncarrizo@gmail.com'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '5px' }}>
                    Super Administrador
                  </div>
                </div>
                
                <div style={{ padding: '8px 0' }}>
                  <button 
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/super-admin/perfil');
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 15px',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <MdSettings size={16} />
                    Configuración
                  </button>
                  
                  <button 
                    onClick={() => {
                      setShowUserMenu(false);
                      cerrarSesion();
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 15px',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fef2f2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <MdLogout size={16} />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div style={statsGridStyle}>
        <div style={statCardStyle}>
          <div style={{ marginBottom: '15px' }}>
            <FaStore color="#4CAF50" size={48} />
          </div>
          <div style={statNumberStyle}>{(stats.totalEmpresas || 0).toLocaleString()}</div>
          <div style={statLabelStyle}>Empresas Registradas</div>
        </div>
        
        <div style={statCardStyle}>
          <div style={{ marginBottom: '15px' }}>
            <FaUsers color="#2196F3" size={48} />
          </div>
          <div style={statNumberStyle}>{(stats.totalUsuarios || 0).toLocaleString()}</div>
          <div style={statLabelStyle}>Usuarios Activos</div>
        </div>
        
        <div style={statCardStyle}>
          <div style={{ marginBottom: '15px' }}>
            <FaBox color="#FF9800" size={48} />
          </div>
          <div style={statNumberStyle}>{(stats.totalProductos || 0).toLocaleString()}</div>
          <div style={statLabelStyle}>Productos Totales</div>
        </div>
        
        <div style={statCardStyle}>
          <div style={{ marginBottom: '15px' }}>
            <FaMoneyBillWave color="#9C27B0" size={48} />
          </div>
          <div style={statNumberStyle}>${(stats.totalVentasRapidas || 0).toLocaleString()}</div>
          <div style={statLabelStyle}>Ventas Rápidas</div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div style={actionsGridStyle}>
        <div 
          style={actionCardStyle}
          onClick={() => navigate('/super-admin/empresas')}
        >
          <div style={{ marginBottom: '15px' }}>
            <MdPeople color="var(--color-primario)" size={40} />
          </div>
          <div style={actionTitleStyle}>Gestionar Empresas</div>
          <div style={actionDescStyle}>
            Administrar empresas registradas, aprobar solicitudes y configurar permisos
          </div>
        </div>
        
        <div 
          style={actionCardStyle}
          onClick={() => {
            console.log('🔍 DashboardSuperAdmin - Navegando a /super-admin/suscripciones');
            navigate('/super-admin/suscripciones');
          }}
        >
          <div style={{ marginBottom: '15px' }}>
            <FaCreditCard color="var(--color-primario)" size={40} />
          </div>
          <div style={actionTitleStyle}>Gestionar Suscripciones</div>
          <div style={actionDescStyle}>
            Administrar planes, suscripciones y facturación de empresas
          </div>
        </div>
        
        <div style={actionCardStyle}>
          <div style={{ marginBottom: '15px' }}>
            <MdInventory color="var(--color-primario)" size={40} />
          </div>
          <div style={actionTitleStyle}>Control de Inventarios</div>
          <div style={actionDescStyle}>
            Monitorear inventarios globales y generar reportes de stock
          </div>
        </div>
        
        <div style={actionCardStyle}>
          <div style={{ marginBottom: '15px' }}>
            <FaChartLine color="var(--color-primario)" size={40} />
          </div>
          <div style={actionTitleStyle}>Reportes Globales</div>
          <div style={actionDescStyle}>
            Analizar métricas de la plataforma y generar estadísticas
          </div>
        </div>
        
        <div style={actionCardStyle}>
          <div style={{ marginBottom: '15px' }}>
            <FaExclamationTriangle color="var(--color-primario)" size={40} />
          </div>
          <div style={actionTitleStyle}>Soporte Técnico</div>
          <div style={actionDescStyle}>
            Gestionar tickets de soporte y resolver problemas de usuarios
          </div>
        </div>
        
        <div style={actionCardStyle}>
          <div style={{ marginBottom: '15px' }}>
            <MdSettings color="var(--color-primario)" size={40} />
          </div>
          <div style={actionTitleStyle}>Configuración Global</div>
          <div style={actionDescStyle}>
            Configurar parámetros del sistema y políticas de la plataforma
          </div>
        </div>
        
        <div style={actionCardStyle}>
          <div style={{ marginBottom: '15px' }}>
            <FaBell color="var(--color-primario)" size={40} />
          </div>
          <div style={actionTitleStyle}>Notificaciones</div>
          <div style={actionDescStyle}>
            Gestionar notificaciones del sistema y alertas importantes
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSuperAdmin; 