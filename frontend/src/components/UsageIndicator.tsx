import React, { useState, useEffect } from 'react';
import LimitService from '../services/limitService';

interface UsageIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

interface CurrentUsage {
  productos: number;
  usuarios: number;
  clientes: number;
  almacenamientoGB: number;
}

interface PlanLimits {
  maxProductos: number;
  maxUsuarios: number;
  maxClientes: number;
  maxAlmacenamientoGB: number;
}

export default function UsageIndicator({ showDetails = false, className = '' }: UsageIndicatorProps) {
  const [usage, setUsage] = useState<CurrentUsage | null>(null);
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarUso();
  }, []);

  const cargarUso = async () => {
    try {
      setLoading(true);
      console.log('🔍 UsageIndicator: Iniciando carga de datos...');
      
      const [currentUsage, currentLimits] = await Promise.all([
        LimitService.getCurrentUsage(),
        LimitService.getCurrentPlanLimits()
      ]);
      
      console.log('🔍 UsageIndicator: Datos recibidos:', { currentUsage, currentLimits });
      
      setUsage(currentUsage);
      setLimits(currentLimits);
    } catch (err) {
      console.error('❌ UsageIndicator: Error cargando uso:', err);
      setError('Error al cargar el uso');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`usage-indicator loading ${className}`}>
        <div style={{
          width: '20px',
          height: '20px',
          border: '2px solid #e5e7eb',
          borderTop: '2px solid #3b82f6',
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

  if (error || !usage || !limits) {
    return null;
  }

  const calcularPorcentaje = (actual: number, limite: number) => {
    return Math.min((actual / limite) * 100, 100);
  };

  const obtenerColorPorcentaje = (porcentaje: number) => {
    if (porcentaje >= 90) return '#ef4444'; // Rojo
    if (porcentaje >= 75) return '#f59e0b'; // Amarillo
    return '#10b981'; // Verde
  };

  const porcentajeProductos = calcularPorcentaje(usage.productos, limits.maxProductos);
  const porcentajeClientes = calcularPorcentaje(usage.clientes, limits.maxClientes);
  const porcentajeUsuarios = calcularPorcentaje(usage.usuarios, limits.maxUsuarios);
  const porcentajeAlmacenamiento = calcularPorcentaje(usage.almacenamientoGB, limits.maxAlmacenamientoGB);

  if (!showDetails) {
    // Vista compacta
    return (
      <div className={`usage-indicator compact ${className}`} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.75rem',
        backgroundColor: '#f8fafc',
        borderRadius: '0.5rem',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem' }}>📦</span>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
            {usage.productos}/{limits.maxProductos}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem' }}>👥</span>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
            {usage.clientes}/{limits.maxClientes}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem' }}>💾</span>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
            {usage.almacenamientoGB.toFixed(2)}/{limits.maxAlmacenamientoGB}GB
          </span>
        </div>
      </div>
    );
  }

  // Vista detallada
  return (
    <div className={`usage-indicator detailed ${className}`} style={{
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      <h3 style={{
        fontSize: '1.125rem',
        fontWeight: '600',
        color: '#111827',
        margin: '0 0 1rem 0',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        📊 Uso de Recursos
      </h3>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {/* Productos */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>📦 Productos</span>
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
              {usage.productos} / {limits.maxProductos}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${porcentajeProductos}%`,
              height: '100%',
              backgroundColor: obtenerColorPorcentaje(porcentajeProductos),
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>

        {/* Clientes */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>👥 Clientes</span>
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
              {usage.clientes} / {limits.maxClientes}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${porcentajeClientes}%`,
              height: '100%',
              backgroundColor: obtenerColorPorcentaje(porcentajeClientes),
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>

        {/* Usuarios */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>👤 Usuarios</span>
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
              {usage.usuarios} / {limits.maxUsuarios}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${porcentajeUsuarios}%`,
              height: '100%',
              backgroundColor: obtenerColorPorcentaje(porcentajeUsuarios),
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>

        {/* Almacenamiento */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>💾 Almacenamiento</span>
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
              {usage.almacenamientoGB.toFixed(2)} / {limits.maxAlmacenamientoGB} GB
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${porcentajeAlmacenamiento}%`,
              height: '100%',
              backgroundColor: obtenerColorPorcentaje(porcentajeAlmacenamiento),
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>
      </div>

      {/* Advertencia si algún recurso está cerca del límite */}
      {(porcentajeProductos >= 80 || porcentajeClientes >= 80 || 
        porcentajeUsuarios >= 80 || porcentajeAlmacenamiento >= 80) && (
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
            <span style={{ fontSize: '0.875rem' }}>
              Algunos recursos están cerca de su límite. Considera actualizar tu plan.
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 