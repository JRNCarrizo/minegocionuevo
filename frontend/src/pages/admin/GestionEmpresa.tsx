import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';

interface Empresa {
  id: number;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  sitioWeb?: string;
  logo?: string;
  subdominio: string;
  activo?: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export default function GestionEmpresa() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile, isTablet } = useResponsive();
  const navigate = useNavigate();
  
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Verificar si el token existe
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ Token no encontrado en localStorage, redirigiendo al login');
      navigate('/admin/login');
      return;
    }
    
    // Si tenemos token, intentar cargar la empresa
    console.log('✅ Token encontrado, cargando empresa...');
    cargarEmpresa();
  }, [navigate]);

  const cargarEmpresa = async () => {
    try {
      setCargando(true);
      console.log('🔍 Intentando cargar empresa...');
      console.log('📧 Usuario actual:', datosUsuario);
      console.log('🌐 URL base de API:', import.meta.env.VITE_API_URL || 'No configurada');
      console.log('🔑 Token en localStorage:', localStorage.getItem('token') ? 'Presente' : 'Ausente');
      console.log('👤 User en localStorage:', localStorage.getItem('user') ? 'Presente' : 'Ausente');
      
      const response = await ApiService.obtenerEmpresaAdmin();
      console.log('✅ Respuesta del servidor:', response);
      
      if (response.data) {
        setEmpresa(response.data);
        console.log('🏢 Empresa cargada:', response.data);
      } else {
        console.log('⚠️ No se encontraron datos de empresa en la respuesta');
      }
    } catch (error: any) {
      console.error('❌ Error al cargar empresa:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      
      // Si es un error 401, redirigir al login
      if (error.response?.status === 401) {
        console.log('🔐 Error 401 - Token expirado, redirigiendo al login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/admin/login');
        return;
      }
      
      toast.error('Error al cargar la información de la empresa');
    } finally {
      setCargando(false);
    }
  };

  const cardsGestion = [
    {
      titulo: 'Carga de Pedidos',
      descripcion: 'Gestiona los pedidos realizados',
      icono: '📦',
      color: '#3b82f6',
      enlace: '/admin/carga-pedidos',
      gradiente: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
    },
    {
      titulo: 'Roturas y Pérdidas',
      descripcion: 'Registra productos dañados, vencidos o en malas condiciones',
      icono: '💔',
      color: '#ef4444',
      enlace: '/admin/roturas-perdidas',
      gradiente: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    },
    {
      titulo: 'Ingresos',
      descripcion: 'Registra la entrada de nueva mercadería al inventario',
      icono: '📥',
      color: '#059669',
      enlace: '/admin/ingresos',
      gradiente: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
    },
    {
      titulo: 'Gestión de Retornos',
      descripcion: 'Gestiona las devoluciones y productos no entregados',
      icono: '🔄',
      color: '#f59e0b',
      enlace: '/admin/descarga-devoluciones',
      gradiente: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    }
  ];

  if (cargando) {
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
          borderRadius: '1rem',
          paddingTop: '2rem',
          paddingBottom: '2rem',
          paddingLeft: '2rem',
          paddingRight: '2rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280', margin: 0 }}>Cargando información de la empresa...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <NavbarAdmin
        onCerrarSesion={cerrarSesion}
        empresaNombre={empresa?.nombre}
        nombreAdministrador={datosUsuario?.nombre}
      />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        paddingTop: isMobile ? '6rem' : '7rem',
        paddingBottom: isMobile ? '1rem' : '2rem',
        paddingLeft: isMobile ? '1rem' : '2rem',
        paddingRight: isMobile ? '1rem' : '2rem'
      }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          paddingTop: isMobile ? '1.5rem' : '2rem',
          paddingBottom: isMobile ? '1.5rem' : '2rem',
          paddingLeft: isMobile ? '1.5rem' : '2rem',
          paddingRight: isMobile ? '1.5rem' : '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            justifyContent: isMobile ? 'center' : 'flex-start',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: 'white'
            }}>
              🏢
            </div>
            <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
              <h1 style={{
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: '700',
                color: '#1e293b',
                margin: 0
              }}>
                Gestión de Empresa
              </h1>
              <p style={{
                color: '#64748b',
                margin: 0,
                fontSize: '0.875rem'
              }}>
                Administra el inventario y operaciones de {empresa?.nombre}
              </p>
            </div>
          </div>
        </div>

        {/* Cards de Gestión */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
          gap: isMobile ? '1rem' : '1.5rem'
        }}>
          {cardsGestion.map((card, index) => (
            <div
              key={index}
              style={{
                background: 'white',
                borderRadius: '1rem',
                paddingTop: isMobile ? '1.5rem' : '2rem',
                paddingBottom: isMobile ? '1.5rem' : '2rem',
                paddingLeft: isMobile ? '1.5rem' : '2rem',
                paddingRight: isMobile ? '1.5rem' : '2rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.borderColor = card.color;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
              onClick={() => {
                // Por ahora mostrar un toast, luego se implementarán las páginas
                toast.success(`Funcionalidad de ${card.titulo} en desarrollo`);
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  background: card.gradiente,
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  marginRight: '1rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}>
                  {card.icono}
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '0.25rem'
                  }}>
                    {card.titulo}
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    {card.descripcion}
                  </p>
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: card.color,
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                Ir a {card.titulo.toLowerCase()} →
              </div>
            </div>
          ))}
        </div>

        {/* Información de la Empresa (Reducida) */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          paddingTop: isMobile ? '1.5rem' : '2rem',
          paddingBottom: isMobile ? '1.5rem' : '2rem',
          paddingLeft: isMobile ? '1.5rem' : '2rem',
          paddingRight: isMobile ? '1.5rem' : '2rem',
          marginTop: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '1.5rem',
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '1rem'
          }}>
            Información de la Empresa
          </h2>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Nombre de la Empresa
            </label>
            <div style={{
              paddingTop: '0.75rem',
              paddingBottom: '0.75rem',
              paddingLeft: '0.75rem',
              paddingRight: '0.75rem',
              background: '#f9fafb',
              border: '2px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              color: '#374151'
            }}>
              {empresa?.nombre || 'No especificado'}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
