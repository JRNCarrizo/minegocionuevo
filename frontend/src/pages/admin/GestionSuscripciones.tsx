import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaEye, FaPause, FaPlay, FaSync, FaChartLine, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaCreditCard, FaUsers, FaBox, FaMoneyBillWave } from 'react-icons/fa';
import { useResponsive } from '../../hooks/useResponsive';
import toast from 'react-hot-toast';

interface Plan {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  periodo: string;
  periodoTexto: string;
  precioAnual: number;
  activo: boolean;
  destacado: boolean;
  orden: number;
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
  totalSuscripciones: number;
  suscripcionesActivas: number;
  ingresosTotales: number;
}

interface Suscripcion {
  id: number;
  empresaId: number;
  empresaNombre: string;
  empresaSubdominio: string;
  planId: number;
  planNombre: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
  fechaCancelacion?: string;
  fechaRenovacion?: string;
  precio: number;
  moneda: string;
  metodoPago?: string;
  referenciaPago?: string;
  facturado: boolean;
  renovacionAutomatica: boolean;
  notificarAntesRenovacion: boolean;
  diasNotificacionRenovacion: number;
  notas?: string;
  motivoCancelacion?: string;
  diasRestantes: number;
  estaActiva: boolean;
  estaExpirada: boolean;
  estaPorExpirar: boolean;
}

interface Estadisticas {
  totalSuscripciones: number;
  suscripcionesActivas: number;
  suscripcionesSuspendidas: number;
  suscripcionesCanceladas: number;
  suscripcionesPorExpirar: number;
  ingresosMensuales: number;
  ingresosAnuales: number;
}

const GestionSuscripciones: React.FC = () => {
  console.log('🔍 GestionSuscripciones - Componente iniciado');
  console.log('🔍 GestionSuscripciones - URL actual:', window.location.href);
  console.log('🔍 GestionSuscripciones - Pathname:', window.location.pathname);
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  
  const [activeTab, setActiveTab] = useState<'planes' | 'suscripciones' | 'estadisticas'>('planes');
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showSuscripcionModal, setShowSuscripcionModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedSuscripcion, setSelectedSuscripcion] = useState<Suscripcion | null>(null);
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [filterPlan, setFilterPlan] = useState<string>('');

  // Función para hacer peticiones autenticadas
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  useEffect(() => {
    console.log('🔍 GestionSuscripciones - useEffect ejecutado');
    console.log('🔍 GestionSuscripciones - Estado inicial loading:', loading);
    cargarDatos();
    
    return () => {
      console.log('🔍 GestionSuscripciones - Componente desmontado');
    };
  }, []);

  const cargarDatos = async () => {
    console.log('🔍 GestionSuscripciones - Iniciando carga de datos...');
    setLoading(true);
    try {
      // Cargar planes (usando datos mock por ahora)
      const planesMock: Plan[] = [
        {
          id: 1,
          nombre: 'Plan Básico',
          descripcion: 'Ideal para pequeñas empresas que están comenzando',
          precio: 29.99,
          periodo: 'MONTHLY',
          periodoTexto: 'mes',
          precioAnual: 299.99,
          activo: true,
          destacado: false,
          orden: 1,
          maxProductos: 100,
          maxUsuarios: 2,
          maxClientes: 500,
          maxAlmacenamientoGB: 5,
          personalizacionCompleta: false,
          estadisticasAvanzadas: false,
          soportePrioritario: false,
          integracionesAvanzadas: false,
          backupAutomatico: false,
          dominioPersonalizado: false,
          totalSuscripciones: 15,
          suscripcionesActivas: 12,
          ingresosTotales: 359.88
        },
        {
          id: 2,
          nombre: 'Plan Profesional',
          descripcion: 'Perfecto para empresas en crecimiento',
          precio: 79.99,
          periodo: 'MONTHLY',
          periodoTexto: 'mes',
          precioAnual: 799.99,
          activo: true,
          destacado: true,
          orden: 2,
          maxProductos: 1000,
          maxUsuarios: 10,
          maxClientes: 5000,
          maxAlmacenamientoGB: 50,
          personalizacionCompleta: true,
          estadisticasAvanzadas: true,
          soportePrioritario: true,
          integracionesAvanzadas: false,
          backupAutomatico: true,
          dominioPersonalizado: false,
          totalSuscripciones: 8,
          suscripcionesActivas: 7,
          ingresosTotales: 559.93
        },
        {
          id: 3,
          nombre: 'Plan Empresarial',
          descripcion: 'Para grandes empresas con necesidades avanzadas',
          precio: 199.99,
          periodo: 'MONTHLY',
          periodoTexto: 'mes',
          precioAnual: 1999.99,
          activo: true,
          destacado: false,
          orden: 3,
          maxProductos: -1,
          maxUsuarios: -1,
          maxClientes: -1,
          maxAlmacenamientoGB: 500,
          personalizacionCompleta: true,
          estadisticasAvanzadas: true,
          soportePrioritario: true,
          integracionesAvanzadas: true,
          backupAutomatico: true,
          dominioPersonalizado: true,
          totalSuscripciones: 3,
          suscripcionesActivas: 3,
          ingresosTotales: 599.97
        }
      ];
      console.log('🔍 GestionSuscripciones - Planes mock cargados:', planesMock.length);
      setPlanes(planesMock);

      // Cargar suscripciones (datos mock)
      const suscripcionesMock: Suscripcion[] = [
        {
          id: 1,
          empresaId: 1,
          empresaNombre: 'Tienda Demo',
          empresaSubdominio: 'demo',
          planId: 2,
          planNombre: 'Plan Profesional',
          estado: 'ACTIVA',
          fechaInicio: '2024-01-01',
          fechaFin: '2024-12-31',
          precio: 79.99,
          moneda: 'USD',
          facturado: true,
          renovacionAutomatica: true,
          notificarAntesRenovacion: true,
          diasNotificacionRenovacion: 30,
          diasRestantes: 45,
          estaActiva: true,
          estaExpirada: false,
          estaPorExpirar: false
        },
        {
          id: 2,
          empresaId: 2,
          empresaNombre: 'Empresa Test',
          empresaSubdominio: 'test',
          planId: 1,
          planNombre: 'Plan Básico',
          estado: 'SUSPENDIDA',
          fechaInicio: '2024-02-01',
          fechaFin: '2024-07-31',
          precio: 29.99,
          moneda: 'USD',
          facturado: false,
          renovacionAutomatica: false,
          notificarAntesRenovacion: true,
          diasNotificacionRenovacion: 15,
          diasRestantes: -15,
          estaActiva: false,
          estaExpirada: true,
          estaPorExpirar: false
        }
      ];
      setSuscripciones(suscripcionesMock);

      // Cargar estadísticas (datos mock)
      const estadisticasMock: Estadisticas = {
        totalSuscripciones: 26,
        suscripcionesActivas: 22,
        suscripcionesSuspendidas: 2,
        suscripcionesCanceladas: 2,
        suscripcionesPorExpirar: 5,
        ingresosMensuales: 1599.78,
        ingresosAnuales: 19197.36
      };
      console.log('🔍 GestionSuscripciones - Estadísticas mock cargadas');
      setEstadisticas(estadisticasMock);

    } catch (error) {
      console.error('🔍 GestionSuscripciones - Error cargando datos:', error);
      console.error('🔍 GestionSuscripciones - Tipo de error:', typeof error);
      console.error('🔍 GestionSuscripciones - Mensaje de error:', error instanceof Error ? error.message : 'Error desconocido');
      toast.error('Error al cargar los datos de suscripciones');
    } finally {
      console.log('🔍 GestionSuscripciones - Carga de datos completada');
      setLoading(false);
    }
  };

  const handleCrearPlan = () => {
    setSelectedPlan(null);
    setShowPlanModal(true);
  };

  const handleEditarPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowPlanModal(true);
  };

  const handleEliminarPlan = async (planId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este plan?')) {
      try {
        const response = await fetch(`/api/super-admin/suscripciones/planes/${planId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          cargarDatos();
        }
      } catch (error) {
        console.error('Error eliminando plan:', error);
      }
    }
  };

  const handleCrearSuscripcion = () => {
    setSelectedSuscripcion(null);
    setShowSuscripcionModal(true);
  };

  const handleAccionSuscripcion = async (suscripcionId: number, accion: string, motivo?: string) => {
    try {
      let url = `/api/super-admin/suscripciones/${suscripcionId}/${accion}`;
      let method = 'POST';
      let body = null;

      if (accion === 'cancelar' && motivo) {
        body = JSON.stringify({ motivo });
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body
      });

      if (response.ok) {
        cargarDatos();
      }
    } catch (error) {
      console.error(`Error en acción ${accion}:`, error);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'ACTIVA': return { color: '#16a34a', background: '#dcfce7' };
      case 'SUSPENDIDA': return { color: '#ca8a04', background: '#fef3c7' };
      case 'CANCELADA': return { color: '#dc2626', background: '#fee2e2' };
      case 'PENDIENTE_PAGO': return { color: '#ea580c', background: '#fed7aa' };
      case 'EXPIRADA': return { color: '#6b7280', background: '#f3f4f6' };
      default: return { color: '#6b7280', background: '#f3f4f6' };
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'ACTIVA': return <FaCheckCircle color="#16a34a" />;
      case 'SUSPENDIDA': return <FaPause color="#ca8a04" />;
      case 'CANCELADA': return <FaTimesCircle color="#dc2626" />;
      case 'PENDIENTE_PAGO': return <FaExclamationTriangle color="#ea580c" />;
      case 'EXPIRADA': return <FaTimesCircle color="#6b7280" />;
      default: return <FaTimesCircle color="#6b7280" />;
    }
  };

  const suscripcionesFiltradas = suscripciones.filter(suscripcion => {
    const cumpleEstado = !filterEstado || suscripcion.estado === filterEstado;
    const cumplePlan = !filterPlan || suscripcion.planNombre.includes(filterPlan);
    return cumpleEstado && cumplePlan;
  });

  // Estilos CSS personalizados
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: 'var(--color-fondo)',
    fontFamily: 'var(--fuente-principal)',
    color: 'var(--color-texto)'
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

  const tabStyle: React.CSSProperties = {
    padding: '12px 24px',
    border: 'none',
    background: 'transparent',
    color: 'var(--color-texto-secundario)',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
    transition: 'all 0.3s ease'
  };

  const activeTabStyle: React.CSSProperties = {
    ...tabStyle,
    color: 'var(--color-primario)',
    borderBottomColor: 'var(--color-primario)'
  };

  const cardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: 'var(--border-radius)',
    padding: '25px',
    boxShadow: 'var(--sombra)',
    border: '1px solid var(--color-borde)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
  };

  const cardHoverStyle: React.CSSProperties = {
    ...cardStyle,
    transform: 'translateY(-5px)',
    boxShadow: 'var(--sombra-hover)'
  };

  const buttonStyle: React.CSSProperties = {
    background: 'var(--gradiente-primario)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--border-radius)',
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const buttonHoverStyle: React.CSSProperties = {
    ...buttonStyle,
    transform: 'translateY(-2px)',
    boxShadow: 'var(--sombra-hover)'
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

  console.log('🔍 GestionSuscripciones - Renderizando componente, loading:', loading);
  console.log('🔍 GestionSuscripciones - Planes cargados:', planes.length);
  console.log('🔍 GestionSuscripciones - Suscripciones cargadas:', suscripciones.length);
  
  if (loading) {
    console.log('🔍 GestionSuscripciones - Mostrando pantalla de carga');
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>
          <div style={spinnerStyle}></div>
          Cargando sistema de suscripciones...
        </div>
      </div>
    );
  }

  console.log('🔍 GestionSuscripciones - Renderizando contenido principal');
  console.log('🔍 GestionSuscripciones - Active tab:', activeTab);
  
  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Gestión de Suscripciones</h1>
          <p style={{ color: 'white', margin: '5px 0 0 0', fontSize: '1.1rem' }}>
            Administra planes, suscripciones y facturación de empresas
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard-super-admin')}
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
            fontSize: '1.2rem'
          }}
        >
          <FaArrowLeft />
        </button>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
        {/* Tabs */}
        <div style={{ 
          background: 'white', 
          borderRadius: 'var(--border-radius)', 
          padding: '0 20px', 
          marginBottom: '30px',
          boxShadow: 'var(--sombra)',
          border: '1px solid var(--color-borde)'
        }}>
          <div style={{ display: 'flex', gap: '0' }}>
            <button
              onClick={() => setActiveTab('planes')}
              style={activeTab === 'planes' ? activeTabStyle : tabStyle}
            >
              <FaCreditCard />
              <span style={{ marginLeft: '8px' }}>Planes ({planes.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('suscripciones')}
              style={activeTab === 'suscripciones' ? activeTabStyle : tabStyle}
            >
              <FaUsers />
              <span style={{ marginLeft: '8px' }}>Suscripciones ({suscripciones.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('estadisticas')}
              style={activeTab === 'estadisticas' ? activeTabStyle : tabStyle}
            >
              <FaChartLine />
              <span style={{ marginLeft: '8px' }}>Estadísticas</span>
            </button>
          </div>
        </div>

        {/* Contenido de las tabs */}
        {activeTab === 'planes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-texto)', margin: 0 }}>
                Planes de Suscripción
              </h2>
              <button
                onClick={handleCrearPlan}
                style={buttonStyle}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonHoverStyle)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, buttonStyle)}
              >
                <FaPlus />
                Nuevo Plan
              </button>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))', 
              gap: '25px' 
            }}>
              {planes.map((plan) => (
                <div 
                  key={plan.id} 
                  style={cardStyle}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, cardStyle)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-texto)', margin: '0 0 8px 0' }}>
                        {plan.nombre}
                      </h3>
                      <p style={{ color: 'var(--color-texto-secundario)', margin: 0, lineHeight: '1.5' }}>
                        {plan.descripcion}
                      </p>
                    </div>
                    {plan.destacado && (
                      <span style={{
                        background: 'var(--color-acento)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        Destacado
                      </span>
                    )}
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primario)', marginBottom: '4px' }}>
                      ${plan.precio}
                      <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--color-texto-secundario)' }}>
                        /{plan.periodoTexto}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-texto-secundario)' }}>
                      ${plan.precioAnual} anual
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: '12px',
                      fontSize: '0.9rem',
                      color: 'var(--color-texto-secundario)'
                    }}>
                      <div>📦 Productos: {plan.maxProductos === -1 ? 'Ilimitados' : plan.maxProductos.toLocaleString()}</div>
                      <div>👥 Usuarios: {plan.maxUsuarios === -1 ? 'Ilimitados' : plan.maxUsuarios}</div>
                      <div>👤 Clientes: {plan.maxClientes === -1 ? 'Ilimitados' : plan.maxClientes.toLocaleString()}</div>
                      <div>💾 Almacenamiento: {plan.maxAlmacenamientoGB}GB</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px', padding: '15px', background: 'var(--color-fondo)', borderRadius: 'var(--border-radius)' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-texto-secundario)', marginBottom: '8px' }}>
                      📊 Suscripciones activas: <strong style={{ color: 'var(--color-texto)' }}>{plan.suscripcionesActivas}</strong>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-texto-secundario)' }}>
                      💰 Ingresos totales: <strong style={{ color: 'var(--color-texto)' }}>${plan.ingresosTotales?.toLocaleString() || '0'}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => handleEditarPlan(plan)}
                      style={{
                        flex: 1,
                        background: 'var(--color-fondo)',
                        color: 'var(--color-texto)',
                        border: '1px solid var(--color-borde)',
                        borderRadius: 'var(--border-radius)',
                        padding: '10px',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <FaEdit />
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminarPlan(plan.id)}
                      style={{
                        flex: 1,
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        borderRadius: 'var(--border-radius)',
                        padding: '10px',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <FaTrash />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'suscripciones' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-texto)', margin: 0 }}>
                Suscripciones
              </h2>
              <button
                onClick={handleCrearSuscripcion}
                style={buttonStyle}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonHoverStyle)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, buttonStyle)}
              >
                <FaPlus />
                Nueva Suscripción
              </button>
            </div>

            {/* Filtros */}
            <div style={{ ...cardStyle, marginBottom: '25px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '600', margin: '0 0 20px 0', color: 'var(--color-texto)' }}>
                Filtros
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '20px' 
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '8px', color: 'var(--color-texto)' }}>
                    Estado
                  </label>
                  <select
                    value={filterEstado}
                    onChange={(e) => setFilterEstado(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--color-borde)',
                      borderRadius: 'var(--border-radius)',
                      fontSize: '0.9rem',
                      background: 'white',
                      color: 'var(--color-texto)'
                    }}
                  >
                    <option value="">Todos los estados</option>
                    <option value="ACTIVA">Activa</option>
                    <option value="SUSPENDIDA">Suspendida</option>
                    <option value="CANCELADA">Cancelada</option>
                    <option value="PENDIENTE_PAGO">Pendiente de Pago</option>
                    <option value="EXPIRADA">Expirada</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '8px', color: 'var(--color-texto)' }}>
                    Plan
                  </label>
                  <input
                    type="text"
                    value={filterPlan}
                    onChange={(e) => setFilterPlan(e.target.value)}
                    placeholder="Buscar por plan..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--color-borde)',
                      borderRadius: 'var(--border-radius)',
                      fontSize: '0.9rem',
                      background: 'white',
                      color: 'var(--color-texto)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Tabla de suscripciones */}
            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: 'var(--color-fondo)' }}>
                    <tr>
                      <th style={{ padding: '15px', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-texto)', borderBottom: '1px solid var(--color-borde)' }}>
                        Empresa
                      </th>
                      <th style={{ padding: '15px', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-texto)', borderBottom: '1px solid var(--color-borde)' }}>
                        Plan
                      </th>
                      <th style={{ padding: '15px', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-texto)', borderBottom: '1px solid var(--color-borde)' }}>
                        Estado
                      </th>
                      <th style={{ padding: '15px', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-texto)', borderBottom: '1px solid var(--color-borde)' }}>
                        Precio
                      </th>
                      <th style={{ padding: '15px', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-texto)', borderBottom: '1px solid var(--color-borde)' }}>
                        Fecha Fin
                      </th>
                      <th style={{ padding: '15px', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-texto)', borderBottom: '1px solid var(--color-borde)' }}>
                        Días Restantes
                      </th>
                      <th style={{ padding: '15px', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-texto)', borderBottom: '1px solid var(--color-borde)' }}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {suscripcionesFiltradas.map((suscripcion, index) => (
                      <tr 
                        key={suscripcion.id} 
                        style={{ 
                          background: index % 2 === 0 ? 'white' : 'var(--color-fondo)',
                          transition: 'background-color 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-fondo)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'white' : 'var(--color-fondo)'}
                      >
                        <td style={{ padding: '15px', borderBottom: '1px solid var(--color-borde)' }}>
                          <div>
                            <div style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--color-texto)' }}>
                              {suscripcion.empresaNombre}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-texto-secundario)' }}>
                              {suscripcion.empresaSubdominio}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '15px', borderBottom: '1px solid var(--color-borde)' }}>
                          <div style={{ fontSize: '0.9rem', color: 'var(--color-texto)' }}>
                            {suscripcion.planNombre}
                          </div>
                        </td>
                        <td style={{ padding: '15px', borderBottom: '1px solid var(--color-borde)' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            gap: '4px',
                            ...getEstadoColor(suscripcion.estado)
                          }}>
                            {getEstadoIcon(suscripcion.estado)}
                            {suscripcion.estado}
                          </span>
                        </td>
                        <td style={{ padding: '15px', borderBottom: '1px solid var(--color-borde)' }}>
                          <div style={{ fontSize: '0.9rem', color: 'var(--color-texto)' }}>
                            ${suscripcion.precio} {suscripcion.moneda}
                          </div>
                        </td>
                        <td style={{ padding: '15px', borderBottom: '1px solid var(--color-borde)' }}>
                          <div style={{ fontSize: '0.9rem', color: 'var(--color-texto)' }}>
                            {suscripcion.fechaFin ? new Date(suscripcion.fechaFin).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td style={{ padding: '15px', borderBottom: '1px solid var(--color-borde)' }}>
                          <div style={{ 
                            fontSize: '0.9rem',
                            fontWeight: suscripcion.diasRestantes <= 7 ? '600' : 'normal',
                            color: suscripcion.diasRestantes <= 7 ? '#dc2626' : 'var(--color-texto)'
                          }}>
                            {suscripcion.diasRestantes > 0 ? `${suscripcion.diasRestantes} días` : 'Expirada'}
                          </div>
                        </td>
                        <td style={{ padding: '15px', borderBottom: '1px solid var(--color-borde)' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => setSelectedSuscripcion(suscripcion)}
                              style={{
                                padding: '6px',
                                background: 'var(--color-fondo)',
                                border: '1px solid var(--color-borde)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                color: 'var(--color-primario)'
                              }}
                            >
                              <FaEye />
                            </button>
                            {suscripcion.estado === 'ACTIVA' && (
                              <>
                                <button
                                  onClick={() => handleAccionSuscripcion(suscripcion.id, 'suspender')}
                                  style={{
                                    padding: '6px',
                                    background: '#fef3c7',
                                    border: '1px solid #fde68a',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    color: '#d97706'
                                  }}
                                >
                                  <FaPause />
                                </button>
                                <button
                                  onClick={() => handleAccionSuscripcion(suscripcion.id, 'renovar')}
                                  style={{
                                    padding: '6px',
                                    background: '#dcfce7',
                                    border: '1px solid #bbf7d0',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    color: '#16a34a'
                                  }}
                                >
                                  <FaSync />
                                </button>
                              </>
                            )}
                            {suscripcion.estado === 'SUSPENDIDA' && (
                              <button
                                onClick={() => handleAccionSuscripcion(suscripcion.id, 'reactivar')}
                                style={{
                                  padding: '6px',
                                  background: '#dcfce7',
                                  border: '1px solid #bbf7d0',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  color: '#16a34a'
                                }}
                              >
                                <FaPlay />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                const motivo = prompt('Motivo de cancelación:');
                                if (motivo) {
                                  handleAccionSuscripcion(suscripcion.id, 'cancelar', motivo);
                                }
                              }}
                              style={{
                                padding: '6px',
                                background: '#fee2e2',
                                border: '1px solid #fecaca',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                color: '#dc2626'
                              }}
                            >
                              <FaTimesCircle />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'estadisticas' && estadisticas && (
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-texto)', marginBottom: '30px' }}>
              Estadísticas de Suscripciones
            </h2>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', 
              gap: '20px', 
              marginBottom: '30px' 
            }}>
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ 
                    padding: '12px', 
                    background: 'var(--color-primario)', 
                    borderRadius: '12px',
                    marginRight: '15px'
                  }}>
                    <FaChartLine color="white" size={24} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-texto-secundario)', margin: '0 0 4px 0' }}>
                      Total Suscripciones
                    </p>
                    <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--color-texto)', margin: 0 }}>
                      {estadisticas.totalSuscripciones.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ 
                    padding: '12px', 
                    background: '#16a34a', 
                    borderRadius: '12px',
                    marginRight: '15px'
                  }}>
                    <FaCheckCircle color="white" size={24} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-texto-secundario)', margin: '0 0 4px 0' }}>
                      Activas
                    </p>
                    <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--color-texto)', margin: 0 }}>
                      {estadisticas.suscripcionesActivas.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ 
                    padding: '12px', 
                    background: '#d97706', 
                    borderRadius: '12px',
                    marginRight: '15px'
                  }}>
                    <FaExclamationTriangle color="white" size={24} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-texto-secundario)', margin: '0 0 4px 0' }}>
                      Por Expirar
                    </p>
                    <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--color-texto)', margin: 0 }}>
                      {estadisticas.suscripcionesPorExpirar.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ 
                    padding: '12px', 
                    background: '#16a34a', 
                    borderRadius: '12px',
                    marginRight: '15px'
                  }}>
                    <FaMoneyBillWave color="white" size={24} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-texto-secundario)', margin: '0 0 4px 0' }}>
                      Ingresos Mensuales
                    </p>
                    <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--color-texto)', margin: 0 }}>
                      ${estadisticas.ingresosMensuales?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '25px' }}>
              <div style={cardStyle}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '600', margin: '0 0 20px 0', color: 'var(--color-texto)' }}>
                  Estado de Suscripciones
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.95rem', color: 'var(--color-texto)' }}>Activas</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-texto)' }}>
                      {estadisticas.suscripcionesActivas}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.95rem', color: 'var(--color-texto)' }}>Suspendidas</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-texto)' }}>
                      {estadisticas.suscripcionesSuspendidas}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.95rem', color: 'var(--color-texto)' }}>Canceladas</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-texto)' }}>
                      {estadisticas.suscripcionesCanceladas}
                    </span>
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '600', margin: '0 0 20px 0', color: 'var(--color-texto)' }}>
                  Ingresos
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.95rem', color: 'var(--color-texto)' }}>Mensuales</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-texto)' }}>
                      ${estadisticas.ingresosMensuales?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.95rem', color: 'var(--color-texto)' }}>Anuales</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-texto)' }}>
                      ${estadisticas.ingresosAnuales?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modales (placeholder) */}
      {showPlanModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 'var(--border-radius)',
            padding: '30px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: 'var(--sombra-hover)'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', margin: '0 0 20px 0', color: 'var(--color-texto)' }}>
              {selectedPlan ? 'Editar Plan' : 'Nuevo Plan'}
            </h3>
            <p style={{ color: 'var(--color-texto-secundario)', marginBottom: '25px' }}>
              Funcionalidad de modal en desarrollo...
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowPlanModal(false)}
                style={{
                  padding: '10px 20px',
                  background: 'var(--color-fondo)',
                  color: 'var(--color-texto)',
                  border: '1px solid var(--color-borde)',
                  borderRadius: 'var(--border-radius)',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowPlanModal(false)}
                style={{
                  padding: '10px 20px',
                  background: 'var(--gradiente-primario)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--border-radius)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuscripcionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 'var(--border-radius)',
            padding: '30px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: 'var(--sombra-hover)'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', margin: '0 0 20px 0', color: 'var(--color-texto)' }}>
              {selectedSuscripcion ? 'Ver Suscripción' : 'Nueva Suscripción'}
            </h3>
            <p style={{ color: 'var(--color-texto-secundario)', marginBottom: '25px' }}>
              Funcionalidad de modal en desarrollo...
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSuscripcionModal(false)}
                style={{
                  padding: '10px 20px',
                  background: 'var(--gradiente-primario)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--border-radius)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionSuscripciones; 