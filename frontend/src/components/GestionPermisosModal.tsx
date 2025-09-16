import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../services/api';
import '../styles/permisos-modal.css';

interface Administrador {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  rol: string;
}

interface PermisosModalProps {
  administrador: Administrador | null;
  isOpen: boolean;
  onClose: () => void;
  onPermisosActualizados: () => void;
}

interface Seccion {
  codigo: string;
  descripcion: string;
}

export default function GestionPermisosModal({ 
  administrador, 
  isOpen, 
  onClose, 
  onPermisosActualizados 
}: PermisosModalProps) {
  const [permisos, setPermisos] = useState<Record<string, boolean>>({});
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (isOpen && administrador) {
      cargarPermisos();
      cargarSecciones();
    }
  }, [isOpen, administrador]);

  const cargarSecciones = async () => {
    try {
      const response = await ApiService.obtenerFuncionalidades();
      const seccionesArray = Object.entries(response.funcionalidades).map(([codigo, descripcion]) => ({
        codigo,
        descripcion: descripcion as string
      }));
      
      // Organizar las secciones: principales primero, luego sub-secciones de Gestión de Empresa
      const seccionesPrincipales = seccionesArray.filter(s => 
        !['CARGA_PLANILLAS', 'ROTURAS_PERDIDAS', 'INGRESOS', 'GESTION_RETORNOS', 
          'GESTION_SECTORES', 'GESTION_TRANSPORTISTAS', 'MOVIMIENTOS_DIA'].includes(s.codigo)
      );
      
      const subSeccionesGestionEmpresa = seccionesArray.filter(s => 
        ['CARGA_PLANILLAS', 'ROTURAS_PERDIDAS', 'INGRESOS', 'GESTION_RETORNOS', 
         'GESTION_SECTORES', 'GESTION_TRANSPORTISTAS', 'MOVIMIENTOS_DIA'].includes(s.codigo)
      );
      
      // Combinar: principales + sub-secciones de gestión de empresa
      const seccionesOrganizadas = [...seccionesPrincipales, ...subSeccionesGestionEmpresa];
      setSecciones(seccionesOrganizadas);
    } catch (error) {
      console.error('Error cargando secciones:', error);
      toast.error('Error al cargar secciones');
    }
  };

  const cargarPermisos = async () => {
    if (!administrador) return;

    try {
      setCargando(true);
      const response = await ApiService.obtenerPermisosUsuario(administrador.id);
      setPermisos(response.permisos.permisos || {});
    } catch (error) {
      console.error('Error cargando permisos:', error);
      toast.error('Error al cargar permisos del usuario');
    } finally {
      setCargando(false);
    }
  };

  const handlePermisoChange = (funcionalidad: string, permitido: boolean) => {
    setPermisos(prev => ({
      ...prev,
      [funcionalidad]: permitido
    }));
  };

  const handleGuardar = async () => {
    if (!administrador) return;

    try {
      setGuardando(true);
      await ApiService.actualizarPermisosUsuario(administrador.id, permisos);
      toast.success('Permisos actualizados exitosamente');
      onPermisosActualizados();
      onClose();
    } catch (error: any) {
      console.error('Error actualizando permisos:', error);
      toast.error(error.response?.data?.error || 'Error al actualizar permisos');
    } finally {
      setGuardando(false);
    }
  };

  const handlePermitirTodo = () => {
    const nuevosPermisos: Record<string, boolean> = {};
    secciones.forEach(seccion => {
      nuevosPermisos[seccion.codigo] = true;
    });
    setPermisos(nuevosPermisos);
  };

  const handleDenegarTodo = () => {
    const nuevosPermisos: Record<string, boolean> = {};
    secciones.forEach(seccion => {
      nuevosPermisos[seccion.codigo] = false;
    });
    setPermisos(nuevosPermisos);
  };

  if (!isOpen || !administrador) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content permisos-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="header-content">
            <div>
              <h2>Gestionar Permisos</h2>
              <p>
                Configurar acceso para: {administrador.nombre} {administrador.apellido}
                {administrador.telefono && (
                  <span style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    color: '#6b7280', 
                    marginTop: '0.25rem' 
                  }}>
                    📞 {administrador.telefono}
                  </span>
                )}
              </p>
            </div>
            <button onClick={onClose} className="close-button">×</button>
          </div>
        </div>

        {/* Content */}
        <div className="modal-content-body">
          {cargando ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <span>Cargando permisos...</span>
            </div>
          ) : (
            <>
              {/* Botones de acción rápida */}
              <div className="action-buttons">
                <button
                  onClick={handlePermitirTodo}
                  className="action-button allow-all"
                >
                  ✅ Permitir Todo
                </button>
                <button
                  onClick={handleDenegarTodo}
                  className="action-button deny-all"
                >
                  ❌ Denegar Todo
                </button>
              </div>

              {/* Secciones Principales */}
              <div className="permissions-section">
                <h3 className="section-title">Secciones Principales</h3>
                <div className="permissions-list">
                  {secciones.filter(s => 
                    !['CARGA_PLANILLAS', 'ROTURAS_PERDIDAS', 'INGRESOS', 'GESTION_RETORNOS', 
                      'GESTION_SECTORES', 'GESTION_TRANSPORTISTAS', 'MOVIMIENTOS_DIA'].includes(s.codigo)
                  ).map((seccion) => (
                    <div key={seccion.codigo} className="permission-item">
                      <div className="permission-info">
                        <h3>{seccion.descripcion}</h3>
                        <p>Acceso a la sección: {seccion.codigo}</p>
                      </div>
                      <div className="permission-controls">
                        <div className="radio-group">
                          <label>
                            <input
                              type="radio"
                              name={`permiso-${seccion.codigo}`}
                              checked={permisos[seccion.codigo] === false}
                              onChange={() => handlePermisoChange(seccion.codigo, false)}
                            />
                            <span className="denied">❌ Sin acceso</span>
                          </label>
                        </div>
                        <div className="radio-group">
                          <label>
                            <input
                              type="radio"
                              name={`permiso-${seccion.codigo}`}
                              checked={permisos[seccion.codigo] === true}
                              onChange={() => handlePermisoChange(seccion.codigo, true)}
                            />
                            <span className="allowed">✅ Con acceso</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-secciones de Gestión de Empresa */}
              <div className="permissions-section">
                <h3 className="section-title">Sub-secciones de Gestión de Empresa</h3>
                <div className="permissions-list">
                  {secciones.filter(s => 
                    ['CARGA_PLANILLAS', 'ROTURAS_PERDIDAS', 'INGRESOS', 'GESTION_RETORNOS', 
                     'GESTION_SECTORES', 'GESTION_TRANSPORTISTAS', 'MOVIMIENTOS_DIA'].includes(s.codigo)
                  ).map((seccion) => (
                    <div key={seccion.codigo} className="permission-item sub-permission">
                      <div className="permission-info">
                        <h3>{seccion.descripcion}</h3>
                        <p>Acceso a la sub-sección: {seccion.codigo}</p>
                        <span className="sub-section-badge">Sub-sección</span>
                      </div>
                      <div className="permission-controls">
                        <div className="radio-group">
                          <label>
                            <input
                              type="radio"
                              name={`permiso-${seccion.codigo}`}
                              checked={permisos[seccion.codigo] === false}
                              onChange={() => handlePermisoChange(seccion.codigo, false)}
                            />
                            <span className="denied">❌ Sin acceso</span>
                          </label>
                        </div>
                        <div className="radio-group">
                          <label>
                            <input
                              type="radio"
                              name={`permiso-${seccion.codigo}`}
                              checked={permisos[seccion.codigo] === true}
                              onChange={() => handlePermisoChange(seccion.codigo, true)}
                            />
                            <span className="allowed">✅ Con acceso</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            onClick={onClose}
            className="footer-button cancel"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="footer-button save"
          >
            {guardando ? (
              <>
                <div className="save-spinner"></div>
                Guardando...
              </>
            ) : (
              'Guardar Permisos'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}