import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import NavbarAdmin from '../../components/NavbarAdmin';
import ApiService from '../../services/api';
import UsageIndicator from '../../components/UsageIndicator';
import { useResponsive } from '../../hooks/useResponsive';

interface SuscripcionData {
  fechaFin: string;
  diasRestantes: number;
  estaPorExpirar: boolean;
  estaActiva: boolean;
  fechaInicio: string;
  precio: number;
  plan: {
    nombre: string;
    descripcion: string;
    periodo: string;
    maxProductos: number;
    maxClientes: number;
    maxUsuarios: number;
    maxAlmacenamientoGB: number;
  };
}

interface PlanData {
  maxAlmacenamientoGB: number;
  maxUsuarios: number;
  maxClientes: number;
  nombre: string;
  maxProductos: number;
  id: number;
}

interface ConsumoData {
  clientes: number;
  usuarios: number;
  productos: number;
  almacenamientoGB: number;
}

export default function ConsumoYSuscripciones() {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  
  // Estados
  const [tabActiva, setTabActiva] = useState('suscripcion');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Datos
  const [suscripcion, setSuscripcion] = useState<SuscripcionData | null>(null);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [consumo, setConsumo] = useState<ConsumoData | null>(null);
  const [datosUsuario, setDatosUsuario] = useState<any>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError(null);

        // Cargar datos del usuario
        const userString = localStorage.getItem('user');
        if (!userString) {
          toast.error('No se encontró información de usuario');
          navigate('/login');
          return;
        }
        const user = JSON.parse(userString);
        setDatosUsuario(user);

        // Cargar información de suscripción
        const suscripcionResponse = await ApiService.getMiSuscripcion();
        console.log('✅ ConsumoYSuscripciones - Suscripción cargada:', suscripcionResponse);
        
        if (suscripcionResponse) {
          setSuscripcion(suscripcionResponse);
          // Los datos del plan y consumo están dentro de la suscripción
          if (suscripcionResponse.plan) {
            setPlan(suscripcionResponse.plan);
          }
          if (suscripcionResponse.consumo) {
            setConsumo(suscripcionResponse.consumo);
          }
        }

      } catch (error) {
        console.error('Error cargando datos:', error);
        setError('Error al cargar la información');
        toast.error('Error al cargar los datos');
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [navigate]);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Sesión cerrada exitosamente');
    navigate('/login');
  };

  const tabs = [
    { id: 'suscripcion', label: 'Mi Suscripción', icon: '💳' },
    { id: 'consumo', label: 'Uso de Recursos', icon: '📊' },
    { id: 'planes', label: 'Planes Disponibles', icon: '📋' },
    { id: 'historial', label: 'Historial', icon: '📈' }
  ];

  const renderTabConsumo = () => (
    <div style={{ padding: isMobile ? '1rem' : '2rem' }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '2rem',
        color: 'white',
        marginBottom: '2rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: isMobile ? '1.5rem' : '2rem' }}>
          📊 Uso de Recursos
        </h2>
        <p style={{ margin: 0, opacity: 0.9, fontSize: isMobile ? '0.9rem' : '1rem' }}>
          Monitorea el consumo de tu plan actual
        </p>
      </div>

      {/* Componente UsageIndicator con vista detallada */}
      <div style={{ marginBottom: '2rem' }}>
        <UsageIndicator showDetails={true} />
      </div>

      {/* Información adicional de consumo */}
      {consumo && plan && (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {/* Productos */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{
                background: '#3b82f6',
                borderRadius: '8px',
                padding: '0.75rem',
                marginRight: '1rem'
              }}>
                📦
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1f2937' }}>Productos</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>
                  {consumo.productos} de {plan.maxProductos} utilizados
                </p>
              </div>
            </div>
            <div style={{
              background: '#f3f4f6',
              borderRadius: '8px',
              height: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: '#3b82f6',
                height: '100%',
                width: `${Math.min((consumo.productos / plan.maxProductos) * 100, 100)}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
              {Math.round((consumo.productos / plan.maxProductos) * 100)}% utilizado
            </p>
          </div>

          {/* Clientes */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{
                background: '#10b981',
                borderRadius: '8px',
                padding: '0.75rem',
                marginRight: '1rem'
              }}>
                👥
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1f2937' }}>Clientes</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>
                  {consumo.clientes} de {plan.maxClientes} utilizados
                </p>
              </div>
            </div>
            <div style={{
              background: '#f3f4f6',
              borderRadius: '8px',
              height: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: '#10b981',
                height: '100%',
                width: `${Math.min((consumo.clientes / plan.maxClientes) * 100, 100)}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
              {Math.round((consumo.clientes / plan.maxClientes) * 100)}% utilizado
            </p>
          </div>

          {/* Usuarios */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{
                background: '#f59e0b',
                borderRadius: '8px',
                padding: '0.75rem',
                marginRight: '1rem'
              }}>
                👤
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1f2937' }}>Usuarios</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>
                  {consumo.usuarios} de {plan.maxUsuarios} utilizados
                </p>
              </div>
            </div>
            <div style={{
              background: '#f3f4f6',
              borderRadius: '8px',
              height: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: '#f59e0b',
                height: '100%',
                width: `${Math.min((consumo.usuarios / plan.maxUsuarios) * 100, 100)}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
              {Math.round((consumo.usuarios / plan.maxUsuarios) * 100)}% utilizado
            </p>
          </div>

          {/* Almacenamiento */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{
                background: '#8b5cf6',
                borderRadius: '8px',
                padding: '0.75rem',
                marginRight: '1rem'
              }}>
                💾
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1f2937' }}>Almacenamiento</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>
                  {consumo.almacenamientoGB.toFixed(2)} GB de {plan.maxAlmacenamientoGB} GB utilizados
                </p>
              </div>
            </div>
            <div style={{
              background: '#f3f4f6',
              borderRadius: '8px',
              height: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: '#8b5cf6',
                height: '100%',
                width: `${Math.min((consumo.almacenamientoGB / plan.maxAlmacenamientoGB) * 100, 100)}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
              {Math.round((consumo.almacenamientoGB / plan.maxAlmacenamientoGB) * 100)}% utilizado
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderTabSuscripcion = () => (
    <div style={{ padding: isMobile ? '1rem' : '2rem' }}>
      <div style={{
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        borderRadius: '16px',
        padding: '2rem',
        color: 'white',
        marginBottom: '2rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: isMobile ? '1.5rem' : '2rem' }}>
          💳 Mi Suscripción
        </h2>
        <p style={{ margin: 0, opacity: 0.9, fontSize: isMobile ? '0.9rem' : '1rem' }}>
          Información detallada de tu plan actual
        </p>
      </div>

      {suscripcion && (
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '1.875rem',
              fontWeight: '600',
              color: '#1e293b',
              margin: 0
            }}>
              📋 Información de Suscripción
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: suscripcion.estaActiva ? '#10b981' : '#ef4444',
                animation: suscripcion.estaActiva ? 'pulse 2s infinite' : 'none'
              }}></div>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: suscripcion.estaActiva ? '#10b981' : '#ef4444'
              }}>
                {suscripcion.estaActiva ? 'ACTIVA' : 'INACTIVA'}
              </span>
            </div>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Plan actual */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              color: 'white'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                {suscripcion.plan.nombre}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                opacity: 0.9,
                marginBottom: '1rem'
              }}>
                {suscripcion.plan.descripcion}
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                  ${suscripcion.precio}
                </span>
                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                  {suscripcion.plan.periodo}
                </span>
              </div>
            </div>

            {/* Días restantes */}
            <div style={{
              background: suscripcion.diasRestantes <= 7 ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 
                       suscripcion.diasRestantes <= 15 ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 
                       'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              color: 'white',
              textAlign: 'center'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                ⏰ Días Restantes
              </h3>
              <div style={{
                fontSize: '3rem',
                fontWeight: '700',
                marginBottom: '0.5rem'
              }}>
                {suscripcion.diasRestantes}
              </div>
              <p style={{
                fontSize: '0.875rem',
                opacity: 0.9
              }}>
                {suscripcion.diasRestantes <= 0 ? 'Suscripción expirada' :
                 suscripcion.diasRestantes <= 7 ? '¡Renueva pronto!' :
                 suscripcion.diasRestantes <= 15 ? 'Considera renovar' : 'Todo en orden'}
              </p>
            </div>

            {/* Límites del plan */}
            <div style={{
              background: 'white',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              border: '2px solid #e2e8f0'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '1rem'
              }}>
                📊 Límites del Plan
              </h3>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Productos</span>
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>
                    {suscripcion.plan.maxProductos === -1 ? '∞' : suscripcion.plan.maxProductos}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Clientes</span>
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>
                    {suscripcion.plan.maxClientes === -1 ? '∞' : suscripcion.plan.maxClientes}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Usuarios</span>
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>
                    {suscripcion.plan.maxUsuarios === -1 ? '∞' : suscripcion.plan.maxUsuarios}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Almacenamiento</span>
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>
                    {suscripcion.plan.maxAlmacenamientoGB === -1 ? '∞' : `${suscripcion.plan.maxAlmacenamientoGB} GB`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Fechas importantes */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: '#f8fafc',
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '0.75rem'
            }}>
              📅 Fechas Importantes
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Inicio:</span>
                <div style={{ fontWeight: '600', color: '#1e293b' }}>
                  {new Date(suscripcion.fechaInicio).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Vencimiento:</span>
                <div style={{ 
                  fontWeight: '600', 
                  color: suscripcion.diasRestantes <= 7 ? '#ef4444' : '#1e293b'
                }}>
                  {new Date(suscripcion.fechaFin).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div style={{
            marginTop: '1.5rem',
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => navigate('/admin/planes')}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
              onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
            >
              🔄 Cambiar Plan
            </button>
            <button
              onClick={() => navigate('/admin/renovar-suscripcion')}
              style={{
                background: suscripcion.estaPorExpirar ? '#f59e0b' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = suscripcion.estaPorExpirar ? '#d97706' : '#059669'}
              onMouseOut={(e) => e.currentTarget.style.background = suscripcion.estaPorExpirar ? '#f59e0b' : '#10b981'}
            >
              🔄 Renovar Suscripción
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderTabPlanes = () => (
    <div style={{ padding: isMobile ? '1rem' : '2rem' }}>
      <div style={{
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        borderRadius: '16px',
        padding: '2rem',
        color: 'white',
        marginBottom: '2rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: isMobile ? '1.5rem' : '2rem' }}>
          📋 Planes Disponibles
        </h2>
        <p style={{ margin: 0, opacity: 0.9, fontSize: isMobile ? '0.9rem' : '1rem' }}>
          Compara y elige el plan que mejor se adapte a tus necesidades
        </p>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        border: '1px solid #e5e7eb',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚀</div>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Explora Nuestros Planes</h3>
        <p style={{ margin: '0 0 2rem 0', color: '#6b7280' }}>
          Descubre todos los planes disponibles y sus características
        </p>
        <button
          onClick={() => navigate('/admin/planes')}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '1rem 2rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
          onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
        >
          📋 Ver Todos los Planes
        </button>
      </div>
    </div>
  );

  const renderTabHistorial = () => (
    <div style={{ padding: isMobile ? '1rem' : '2rem' }}>
      <div style={{
        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        borderRadius: '16px',
        padding: '2rem',
        color: 'white',
        marginBottom: '2rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: isMobile ? '1.5rem' : '2rem' }}>
          📈 Historial
        </h2>
        <p style={{ margin: 0, opacity: 0.9, fontSize: isMobile ? '0.9rem' : '1rem' }}>
          Historial de cambios de plan y renovaciones
        </p>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        border: '1px solid #e5e7eb',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Historial de Suscripciones</h3>
        <p style={{ margin: '0 0 2rem 0', color: '#6b7280' }}>
          Próximamente: Historial detallado de cambios de plan y renovaciones
        </p>
        <div style={{
          background: '#f3f4f6',
          borderRadius: '8px',
          padding: '1rem',
          color: '#6b7280',
          fontSize: '0.9rem'
        }}>
          🚧 Esta funcionalidad estará disponible próximamente
        </div>
      </div>
    </div>
  );

  const renderContenido = () => {
    switch (tabActiva) {
      case 'suscripcion':
        return renderTabSuscripcion();
      case 'consumo':
        return renderTabConsumo();
      case 'planes':
        return renderTabPlanes();
      case 'historial':
        return renderTabHistorial();
      default:
        return renderTabSuscripcion();
    }
  };

  if (cargando) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: '#6b7280' }}>Cargando información...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <p style={{ color: '#dc2626' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <NavbarAdmin
        onCerrarSesion={cerrarSesion}
        empresaNombre={datosUsuario?.empresaNombre}
        nombreAdministrador={datosUsuario?.nombre}
      />

      <div style={{ 
        paddingTop: isMobile ? '6rem' : '5rem',
        paddingBottom: '2rem'
      }}>
        {/* Header */}
        <div style={{
          background: 'white',
          margin: isMobile ? '1rem' : '2rem',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <h1 style={{ 
            margin: '0 0 0.5rem 0', 
            fontSize: isMobile ? '1.8rem' : '2.5rem',
            color: '#1f2937',
            textAlign: 'center'
          }}>
            📊 Consumo y Suscripciones
          </h1>
          <p style={{ 
            margin: 0, 
            textAlign: 'center',
            color: '#6b7280',
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}>
            Gestiona tu plan, monitorea el consumo y administra tu suscripción
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          background: 'white',
          margin: isMobile ? '1rem' : '2rem',
          borderRadius: '12px',
          padding: '1rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem'
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id)}
                style={{
                  background: tabActiva === tab.id ? '#3b82f6' : 'transparent',
                  color: tabActiva === tab.id ? 'white' : '#6b7280',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  cursor: 'pointer',
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseOver={(e) => {
                  if (tabActiva !== tab.id) {
                    e.currentTarget.style.background = '#f3f4f6';
                  }
                }}
                onMouseOut={(e) => {
                  if (tabActiva !== tab.id) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Contenido de la pestaña */}
        <div style={{
          background: 'white',
          margin: isMobile ? '1rem' : '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          {renderContenido()}
        </div>
      </div>
    </div>
  );
}
