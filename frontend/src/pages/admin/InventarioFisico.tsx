import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useResponsive } from '../../hooks/useResponsive';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { usePermissions } from '../../hooks/usePermissions';

import '../../estilos/inventario-fisico.css';

export default function InventarioFisico() {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const { usuarioActual } = useUsuarioActual();
  const { hasPermission } = usePermissions();

  // Verificar permisos
  if (!hasPermission('GESTION_INVENTARIO')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600">No tienes permisos para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  const handleInventarioCompleto = () => {
    navigate('/admin/inventario-fisico/completo');
  };

  const handleInventarioPorSector = () => {
    navigate('/admin/inventario-fisico/por-sector');
  };

  return (
    <div className="inventario-container">
      <NavbarAdmin />
      
      <div className="container mx-auto">
        {/* Header */}
        <div className="inventario-header">
          <h1 className="inventario-title">
            Gestión de Inventario Físico
          </h1>
          <p className="inventario-subtitle">
            Realiza inventarios físicos completos o por sector específico
          </p>
        </div>

        {/* Cards de opciones */}
        <div className="inventario-cards-grid">
          {/* Inventario Completo */}
          <div 
            className="inventario-card"
            onClick={handleInventarioCompleto}
          >
            <div className="inventario-card-content">
              <div className="inventario-card-header">
                <div className="inventario-card-icon purple">
                  📋
                </div>
                <div>
                  <h3 className="inventario-card-title purple">
                    Inventario Completo
                  </h3>
                  <p className="inventario-card-description">
                    Inventario de todos los sectores
                  </p>
                </div>
              </div>
              
              <div className="inventario-features">
                <div className="inventario-feature">
                  <span className="inventario-feature-dot purple"></span>
                  <span className="inventario-feature-text">Asigna usuarios por sector</span>
                </div>
                <div className="inventario-feature">
                  <span className="inventario-feature-dot purple"></span>
                  <span className="inventario-feature-text">Compara conteos automáticamente</span>
                </div>
                <div className="inventario-feature">
                  <span className="inventario-feature-dot purple"></span>
                  <span className="inventario-feature-text">Genera reporte final completo</span>
                </div>
              </div>
              
              <div className="inventario-card-footer">
                <span className="inventario-card-action">
                  Comenzar inventario
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </div>

          {/* Inventario por Sector */}
          <div 
            className="inventario-card"
            onClick={handleInventarioPorSector}
          >
            <div className="inventario-card-content">
              <div className="inventario-card-header">
                <div className="inventario-card-icon blue">
                  🏢
                </div>
                <div>
                  <h3 className="inventario-card-title blue">
                    Inventario por Sector
                  </h3>
                  <p className="inventario-card-description">
                    Inventario de un sector específico
                  </p>
                </div>
              </div>
              
              <div className="inventario-features">
                <div className="inventario-feature">
                  <span className="inventario-feature-dot blue"></span>
                  <span className="inventario-feature-text">Selecciona el sector a inventariar</span>
                </div>
                <div className="inventario-feature">
                  <span className="inventario-feature-dot blue"></span>
                  <span className="inventario-feature-text">Proceso más rápido y enfocado</span>
                </div>
                <div className="inventario-feature">
                  <span className="inventario-feature-dot blue"></span>
                  <span className="inventario-feature-text">Compara solo con stock del sector</span>
                </div>
              </div>
              
              <div className="inventario-card-footer">
                <span className="inventario-card-action blue">
                  Seleccionar sector
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="inventario-info">
          <h3 className="inventario-info-title">
            Información sobre el proceso de inventario
          </h3>
          <div className="inventario-info-grid">
            <div>
              <h4>Proceso de Conteo</h4>
              <ul className="inventario-info-list">
                <li>• Cada sector requiere 2 usuarios asignados</li>
                <li>• Los usuarios pueden realizar conteos simultáneos</li>
                <li>• Soporte para cálculos matemáticos (ej: 3*112+45)</li>
                <li>• Guardado automático del progreso</li>
              </ul>
            </div>
            <div>
              <h4>Validación y Reportes</h4>
              <ul className="inventario-info-list">
                <li>• Comparación automática de conteos</li>
                <li>• Reconteo hasta eliminar diferencias</li>
                <li>• Actualización automática de stock</li>
                <li>• Generación de reportes detallados</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
