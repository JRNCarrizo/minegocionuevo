import React, { useState, useEffect } from 'react';

interface PlanInfo {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  periodo: string;
  maxProductos: number;
  maxUsuarios: number;
  maxClientes: number;
  maxAlmacenamientoGB: number;
  personalizacionCompleta: boolean;
  estadisticasAvanzadas: boolean;
  soportePrioritario: boolean;
  integracionesAvanzadas: boolean;
  backupAutomatico: boolean;
  dominioPersonalizado: boolean;
}

interface SuscripcionInfo {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  precio: number;
  plan: PlanInfo;
  diasRestantes: number;
  estaPorExpirar: boolean;
}

const DashboardSuscripcion: React.FC = () => {
  const [suscripcion, setSuscripcion] = useState<SuscripcionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarSuscripcion();
  }, []);

  const cargarSuscripcion = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('🔍 DashboardSuscripcion - Token encontrado:', token ? 'SÍ' : 'NO');
      
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      console.log('🔍 DashboardSuscripcion - Haciendo petición a /api/super-admin/suscripciones/mi-suscripcion');
      
      const response = await fetch('http://localhost:8080/api/super-admin/suscripciones/mi-suscripcion', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 DashboardSuscripcion - Respuesta del servidor:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 DashboardSuscripcion - Error response:', errorText);
        throw new Error(`Error al cargar la suscripción: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔍 DashboardSuscripcion - Datos recibidos:', data);
      setSuscripcion(data);
    } catch (err) {
      console.error('🔍 DashboardSuscripcion - Error completo:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const obtenerEstadoColor = (estado: string) => {
    switch (estado) {
      case 'ACTIVA':
        return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
      case 'SUSPENDIDA':
        return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
      case 'CANCELADA':
        return { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' };
      case 'EXPIRADA':
        return { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
      default:
        return { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' };
    }
  };

  const obtenerEstadoIcono = (estado: string) => {
    switch (estado) {
      case 'ACTIVA':
        return '✅';
      case 'SUSPENDIDA':
      case 'EXPIRADA':
        return '⚠️';
      default:
        return '⏰';
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(precio);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '0.5rem',
        color: '#991b1b',
        margin: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>⚠️</span>
          <strong>Error al cargar la información de suscripción:</strong> {error}
        </div>
      </div>
    );
  }

  if (!suscripcion) {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#fef3c7',
        border: '1px solid #fde68a',
        borderRadius: '0.5rem',
        color: '#92400e',
        margin: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>⚠️</span>
          <strong>No se encontró información de suscripción.</strong> Contacte al administrador.
        </div>
      </div>
    );
  }

  const estadoColors = obtenerEstadoColor(suscripcion.estado);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header con información principal */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            Mi Suscripción
          </h1>
          <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
            Información de tu plan actual
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          backgroundColor: estadoColors.bg,
          color: estadoColors.text,
          border: `1px solid ${estadoColors.border}`,
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: '600'
        }}>
          <span>{obtenerEstadoIcono(suscripcion.estado)}</span>
          {suscripcion.estado}
        </div>
      </div>

      {/* Plan actual */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📦 Plan Actual: {suscripcion.plan.nombre}
          </h2>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            {suscripcion.plan.descripcion}
          </p>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Precio</span>
            <span style={{ fontWeight: '600' }}>
              {suscripcion.precio === 0 ? 'Gratuito' : formatearPrecio(suscripcion.precio)}
              <span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '0.25rem' }}>
                / {suscripcion.plan.periodo.toLowerCase()}
              </span>
            </span>
          </div>

          {/* Conteo regresivo */}
          <div style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>⏰</span>
                <span style={{ fontWeight: '600', color: '#1e40af' }}>Días Restantes</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#2563eb'
                }}>
                  {suscripcion.diasRestantes}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#3b82f6' }}>días</div>
              </div>
            </div>
            
            {suscripcion.estaPorExpirar && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: '0.375rem',
                color: '#c2410c'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>⚠️</span>
                  <strong>Tu suscripción expira pronto.</strong> Considera renovar para mantener el acceso a todas las funcionalidades.
                </div>
              </div>
            )}
          </div>

          {/* Fechas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1rem', color: '#6b7280' }}>📅</span>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Inicio</div>
                <div style={{ fontWeight: '500' }}>{formatearFecha(suscripcion.fechaInicio)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1rem', color: '#6b7280' }}>📅</span>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Vencimiento</div>
                <div style={{ fontWeight: '500' }}>{formatearFecha(suscripcion.fechaFin)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Límites del plan */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            💾 Límites de tu Plan
          </h2>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1rem', color: '#3b82f6' }}>📦</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Productos</div>
                <div style={{ fontWeight: '500' }}>{suscripcion.plan.maxProductos}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1rem', color: '#10b981' }}>👥</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Usuarios</div>
                <div style={{ fontWeight: '500' }}>{suscripcion.plan.maxUsuarios}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1rem', color: '#8b5cf6' }}>👥</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Clientes</div>
                <div style={{ fontWeight: '500' }}>{suscripcion.plan.maxClientes}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1rem', color: '#f59e0b' }}>💾</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Almacenamiento</div>
                <div style={{ fontWeight: '500' }}>{suscripcion.plan.maxAlmacenamientoGB} GB</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Características del plan */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            ✅ Características Incluidas
          </h2>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '1rem',
                color: suscripcion.plan.personalizacionCompleta ? '#10b981' : '#d1d5db'
              }}>
                {suscripcion.plan.personalizacionCompleta ? '✅' : '❌'}
              </span>
              <span style={{
                fontSize: '0.875rem',
                color: suscripcion.plan.personalizacionCompleta ? '#374151' : '#9ca3af'
              }}>
                Personalización Completa
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '1rem',
                color: suscripcion.plan.estadisticasAvanzadas ? '#10b981' : '#d1d5db'
              }}>
                {suscripcion.plan.estadisticasAvanzadas ? '✅' : '❌'}
              </span>
              <span style={{
                fontSize: '0.875rem',
                color: suscripcion.plan.estadisticasAvanzadas ? '#374151' : '#9ca3af'
              }}>
                Estadísticas Avanzadas
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '1rem',
                color: suscripcion.plan.soportePrioritario ? '#10b981' : '#d1d5db'
              }}>
                {suscripcion.plan.soportePrioritario ? '✅' : '❌'}
              </span>
              <span style={{
                fontSize: '0.875rem',
                color: suscripcion.plan.soportePrioritario ? '#374151' : '#9ca3af'
              }}>
                Soporte Prioritario
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '1rem',
                color: suscripcion.plan.integracionesAvanzadas ? '#10b981' : '#d1d5db'
              }}>
                {suscripcion.plan.integracionesAvanzadas ? '✅' : '❌'}
              </span>
              <span style={{
                fontSize: '0.875rem',
                color: suscripcion.plan.integracionesAvanzadas ? '#374151' : '#9ca3af'
              }}>
                Integraciones Avanzadas
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '1rem',
                color: suscripcion.plan.backupAutomatico ? '#10b981' : '#d1d5db'
              }}>
                {suscripcion.plan.backupAutomatico ? '✅' : '❌'}
              </span>
              <span style={{
                fontSize: '0.875rem',
                color: suscripcion.plan.backupAutomatico ? '#374151' : '#9ca3af'
              }}>
                Backup Automático
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '1rem',
                color: suscripcion.plan.dominioPersonalizado ? '#10b981' : '#d1d5db'
              }}>
                {suscripcion.plan.dominioPersonalizado ? '✅' : '❌'}
              </span>
              <span style={{
                fontSize: '0.875rem',
                color: suscripcion.plan.dominioPersonalizado ? '#374151' : '#9ca3af'
              }}>
                Dominio Personalizado
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            💳 Acciones
          </h2>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button style={{
              width: '100%',
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              Ver Planes Disponibles
            </button>
            <button style={{
              width: '100%',
              backgroundColor: '#059669',
              color: 'white',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#047857'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#059669'}
            >
              Renovar Suscripción
            </button>
            <button style={{
              width: '100%',
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
            >
              Contactar Soporte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSuscripcion; 