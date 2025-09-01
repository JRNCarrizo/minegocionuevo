import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { API_CONFIG } from '../../config/api';
import toast from 'react-hot-toast';
import './GestionTransportistas.css';

// Interfaces
interface Vehiculo {
  id: number;
  marca: string;
  modelo: string;
  patente: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  transportistaId: number;
}

interface Transportista {
  id: number;
  codigoInterno: string;
  nombreApellido: string;
  nombreEmpresa?: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  empresaId: number;
  vehiculos: Vehiculo[];
}

const GestionTransportistas: React.FC = () => {
  const { datosUsuario, cargando: cargandoUsuario, cerrarSesion } = useUsuarioActual();
  const navigate = useNavigate();

  // Estados principales
  const [transportistas, setTransportistas] = useState<Transportista[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroActivos, setFiltroActivos] = useState(true);
  const [cardSeleccionada, setCardSeleccionada] = useState<number>(-1); // Para navegación por teclado

  // Estados para modales
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [mostrarModalVehiculos, setMostrarModalVehiculos] = useState(false);
  const [transportistaSeleccionado, setTransportistaSeleccionado] = useState<Transportista | null>(null);

  // Estados para formularios
  const [formData, setFormData] = useState({
    codigoInterno: '',
    nombreApellido: '',
    nombreEmpresa: ''
  });

  const [formVehiculo, setFormVehiculo] = useState({
    marca: '',
    modelo: '',
    patente: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [guardando, setGuardando] = useState(false);

  // Función helper para hacer llamadas a la API
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const baseUrl = API_CONFIG.getBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/api') ? endpoint.substring(4) : endpoint;
    const url = `${baseUrl}${cleanEndpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
    
    return fetch(url, defaultOptions);
  };

  // Cargar transportistas
  const cargarTransportistas = async () => {
    if (!datosUsuario?.empresaId) {
      console.error('No se pudo obtener el ID de la empresa');
      return;
    }

    try {
      setCargando(true);
      const response = await apiCall(`/empresas/${datosUsuario.empresaId}/transportistas`);
      
      if (response.ok) {
        const data = await response.json();
        setTransportistas(data.data || []);
      } else {
        toast.error('Error al cargar transportistas');
      }
    } catch (error) {
      console.error('Error al cargar transportistas:', error);
      toast.error('Error al cargar transportistas');
    } finally {
      setCargando(false);
    }
  };

  // Buscar transportistas
  const buscarTransportistas = async () => {
    if (!datosUsuario?.empresaId) {
      console.error('No se pudo obtener el ID de la empresa');
      return;
    }

    if (!busqueda.trim()) {
      await cargarTransportistas();
      return;
    }

    try {
      setCargando(true);
      const response = await apiCall(`/empresas/${datosUsuario.empresaId}/transportistas/buscar?busqueda=${encodeURIComponent(busqueda)}`);
      
      if (response.ok) {
        const data = await response.json();
        setTransportistas(data.data || []);
      } else {
        toast.error('Error al buscar transportistas');
      }
    } catch (error) {
      console.error('Error al buscar transportistas:', error);
      toast.error('Error al buscar transportistas');
    } finally {
      setCargando(false);
    }
  };

  // Crear transportista
  const crearTransportista = async () => {
    if (!datosUsuario?.empresaId) {
      toast.error('Error: No se pudo obtener la información de la empresa');
      return;
    }

    // Validar campos obligatorios
    if (!formData.codigoInterno.trim() || !formData.nombreApellido.trim()) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    try {
      setGuardando(true);
      setErrors({});

      const response = await apiCall(`/empresas/${datosUsuario.empresaId}/transportistas`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Transportista creado exitosamente');
        setMostrarModalCrear(false);
        resetForm();
        await cargarTransportistas();
      } else {
        const errorData = await response.json();
        if (errorData.errors) {
          setErrors(errorData.errors);
        } else {
          toast.error(errorData.message || 'Error al crear transportista');
        }
      }
    } catch (error) {
      console.error('Error al crear transportista:', error);
      toast.error('Error al crear transportista');
    } finally {
      setGuardando(false);
    }
  };

  // Actualizar transportista
  const actualizarTransportista = async () => {
    if (!transportistaSeleccionado) return;
    if (!datosUsuario?.empresaId) {
      toast.error('Error: No se pudo obtener la información de la empresa');
      return;
    }

    try {
      setGuardando(true);
      setErrors({});

      const response = await apiCall(`/empresas/${datosUsuario.empresaId}/transportistas/${transportistaSeleccionado.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Transportista actualizado exitosamente');
        setMostrarModalEditar(false);
        resetForm();
        await cargarTransportistas();
      } else {
        const errorData = await response.json();
        if (errorData.errors) {
          setErrors(errorData.errors);
        } else {
          toast.error(errorData.message || 'Error al actualizar transportista');
        }
      }
    } catch (error) {
      console.error('Error al actualizar transportista:', error);
      toast.error('Error al actualizar transportista');
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar transportista
  const eliminarTransportista = async (id: number) => {
    if (!datosUsuario?.empresaId) {
      toast.error('Error: No se pudo obtener la información de la empresa');
      return;
    }

    if (!confirm('¿Estás seguro de que quieres eliminar este transportista?')) {
      return;
    }

    try {
      const response = await apiCall(`/empresas/${datosUsuario.empresaId}/transportistas/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Transportista eliminado exitosamente');
        await cargarTransportistas();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al eliminar transportista');
      }
    } catch (error) {
      console.error('Error al eliminar transportista:', error);
      toast.error('Error al eliminar transportista');
    }
  };

  // Cambiar estado del transportista
  const cambiarEstadoTransportista = async (id: number, activo: boolean) => {
    if (!datosUsuario?.empresaId) {
      toast.error('Error: No se pudo obtener la información de la empresa');
      return;
    }

    try {
      const response = await apiCall(`/empresas/${datosUsuario.empresaId}/transportistas/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ activo })
      });

      if (response.ok) {
        toast.success(`Transportista ${activo ? 'activado' : 'desactivado'} exitosamente`);
        await cargarTransportistas();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al cambiar estado del transportista');
      }
    } catch (error) {
      console.error('Error al cambiar estado del transportista:', error);
      toast.error('Error al cambiar estado del transportista');
    }
  };

  // Crear vehículo
  const crearVehiculo = async () => {
    if (!transportistaSeleccionado) return;
    if (!datosUsuario?.empresaId) {
      toast.error('Error: No se pudo obtener la información de la empresa');
      return;
    }

    // Validar campos obligatorios
    if (!formVehiculo.marca.trim() || !formVehiculo.modelo.trim() || !formVehiculo.patente.trim()) {
      toast.error('Por favor completa todos los campos del vehículo');
      return;
    }

    try {
      setGuardando(true);
      setErrors({});

      const response = await apiCall(`/empresas/${datosUsuario.empresaId}/transportistas/${transportistaSeleccionado.id}/vehiculos`, {
        method: 'POST',
        body: JSON.stringify(formVehiculo)
      });

      if (response.ok) {
        const nuevoVehiculo = await response.json();
        toast.success('Vehículo creado exitosamente');
        
        // Guardar los datos del formulario antes de limpiarlo
        const datosVehiculo = { ...formVehiculo };
        setFormVehiculo({ marca: '', modelo: '', patente: '' });
        
        // Crear el vehículo completo con los datos del formulario
        const vehiculoCompleto = {
          ...nuevoVehiculo,
          marca: datosVehiculo.marca,
          modelo: datosVehiculo.modelo,
          patente: datosVehiculo.patente,
          activo: true
        };
        
        // Actualizar directamente el transportista seleccionado con el vehículo completo
        setTransportistaSeleccionado(prev => ({
          ...prev!,
          vehiculos: [...prev!.vehiculos, vehiculoCompleto]
        }));
        
        // También recargar la lista completa para mantener sincronización
        await cargarTransportistas();
      } else {
        const errorData = await response.json();
        if (errorData.errors) {
          setErrors(errorData.errors);
        } else {
          toast.error(errorData.message || 'Error al crear vehículo');
        }
      }
    } catch (error) {
      console.error('Error al crear vehículo:', error);
      toast.error('Error al crear vehículo');
    } finally {
      setGuardando(false);
    }
  };

  // Cambiar estado del vehículo
  const cambiarEstadoVehiculo = async (vehiculoId: number, activo: boolean) => {
    if (!datosUsuario?.empresaId) {
      toast.error('Error: No se pudo obtener la información de la empresa');
      return;
    }

    try {
      const response = await apiCall(`/empresas/${datosUsuario.empresaId}/vehiculos/${vehiculoId}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ activo })
      });

      if (response.ok) {
        toast.success(`Vehículo ${activo ? 'activado' : 'desactivado'} exitosamente`);
        
        // Actualizar el estado del vehículo en el modal dinámicamente
        setTransportistaSeleccionado(prev => ({
          ...prev!,
          vehiculos: prev!.vehiculos.map(vehiculo => 
            vehiculo.id === vehiculoId 
              ? { ...vehiculo, activo } 
              : vehiculo
          )
        }));
        
        // También actualizar la lista principal de transportistas
        await cargarTransportistas();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al cambiar estado del vehículo');
      }
    } catch (error) {
      console.error('Error al cambiar estado del vehículo:', error);
      toast.error('Error al cambiar estado del vehículo');
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      codigoInterno: '',
      nombreApellido: '',
      nombreEmpresa: ''
    });
    setErrors({});
  };

  // Abrir modal de edición
  const abrirModalEditar = (transportista: Transportista) => {
    setTransportistaSeleccionado(transportista);
    setFormData({
      codigoInterno: transportista.codigoInterno,
      nombreApellido: transportista.nombreApellido,
      nombreEmpresa: transportista.nombreEmpresa || ''
    });
    setMostrarModalEditar(true);
  };

  // Abrir modal de vehículos
  const abrirModalVehiculos = (transportista: Transportista) => {
    setTransportistaSeleccionado(transportista);
    setMostrarModalVehiculos(true);
  };

  // Efecto para auto-focus en el modal de vehículos
  useEffect(() => {
    if (mostrarModalVehiculos) {
      // Pequeño delay para asegurar que el modal esté renderizado
      const timer = setTimeout(() => {
        const marcaInput = document.querySelector('input[data-field="marca"]') as HTMLInputElement;
        if (marcaInput) {
          marcaInput.focus();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [mostrarModalVehiculos]);

  // Filtrar transportistas
  const transportistasFiltrados = transportistas.filter(transportista => {
    const cumpleFiltroActivos = filtroActivos ? transportista.activo : true;
    const cumpleBusqueda = busqueda.trim() === '' || 
      transportista.codigoInterno.toLowerCase().includes(busqueda.toLowerCase()) ||
      transportista.nombreApellido.toLowerCase().includes(busqueda.toLowerCase()) ||
      (transportista.nombreEmpresa && transportista.nombreEmpresa.toLowerCase().includes(busqueda.toLowerCase()));
    
    return cumpleFiltroActivos && cumpleBusqueda;
  });

  // Efectos
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No hay token, redirigiendo a login');
      navigate('/admin/login');
      return;
    }
    
    console.log('datosUsuario:', datosUsuario);
    console.log('empresaId:', datosUsuario?.empresaId);
    
    if (datosUsuario?.empresaId) {
      console.log('Cargando transportistas...');
      cargarTransportistas();
    } else if (datosUsuario && !datosUsuario.empresaId) {
      console.log('Usuario autenticado pero sin empresaId');
      toast.error('Error: No se pudo obtener la información de la empresa');
    }
  }, [datosUsuario, navigate]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      buscarTransportistas();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [busqueda]);

  // Navegación por teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (mostrarModalCrear || mostrarModalEditar || mostrarModalVehiculos) {
        if (event.key === 'Escape') {
          if (mostrarModalCrear) setMostrarModalCrear(false);
          if (mostrarModalEditar) setMostrarModalEditar(false);
          if (mostrarModalVehiculos) setMostrarModalVehiculos(false);
          resetForm();
        }
        return;
      }

      switch (event.key) {
        case 'Enter':
          if (cardSeleccionada === -1) {
            setMostrarModalCrear(true);
          } else if (cardSeleccionada >= 0 && cardSeleccionada < transportistasFiltrados.length) {
            abrirModalVehiculos(transportistasFiltrados[cardSeleccionada]);
          }
          break;
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          event.preventDefault();
          if (transportistasFiltrados.length === 0) return;
          
          let nuevaSeleccion = cardSeleccionada;
          if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
            nuevaSeleccion = cardSeleccionada <= 0 ? transportistasFiltrados.length - 1 : cardSeleccionada - 1;
          } else {
            nuevaSeleccion = cardSeleccionada >= transportistasFiltrados.length - 1 ? 0 : cardSeleccionada + 1;
          }
          setCardSeleccionada(nuevaSeleccion);
          break;
        case 'Escape':
          if (mostrarModalCrear || mostrarModalEditar || mostrarModalVehiculos) {
            // Cerrar modales abiertos
            if (mostrarModalCrear) {
              setMostrarModalCrear(false);
              resetForm();
            } else if (mostrarModalEditar) {
              setMostrarModalEditar(false);
              resetForm();
            } else if (mostrarModalVehiculos) {
              setMostrarModalVehiculos(false);
            }
          } else if (cardSeleccionada >= 0) {
            setCardSeleccionada(-1);
          } else {
            navigate('/admin/gestion-empresa');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cardSeleccionada, transportistasFiltrados, mostrarModalCrear, mostrarModalEditar, mostrarModalVehiculos]);

  // Renderizado
  if (cargandoUsuario || !datosUsuario || !datosUsuario.empresaId) {
    return (
      <div className="pagina-cargando">
        <div className="spinner"></div>
        <p>Cargando datos de usuario...</p>
      </div>
    );
  }

  return (
    <div className="pagina-admin">
      <div className="contenido-admin">
        {/* Header */}
        <div className="header-admin">
          <div className="header-content">
            <div className="header-top">
              <div className="header-left">
                <button 
                  className="btn-volver"
                  onClick={() => navigate('/admin/gestion-empresa')}
                >
                  ← Volver
                </button>
                <h1>🚛 Gestión de Transportistas</h1>
                <p>Administra los transportistas y sus vehículos</p>
              </div>
              <div className="header-right">
                <button 
                  className="btn-crear"
                  onClick={() => setMostrarModalCrear(true)}
                >
                  + Crear Transportista
                </button>
              </div>
            </div>
            
            {/* Filtros y búsqueda dentro de la card */}
            <div className="header-filters">
              <div className="busqueda-container">
                <input
                  type="text"
                  placeholder="Buscar por código interno, nombre o empresa..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="input-busqueda"
                />
              </div>
              <div className="filtros">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={filtroActivos}
                    onChange={(e) => setFiltroActivos(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  Solo activos
                </label>
              </div>
            </div>
          </div>
        </div>

      {/* Contenido principal */}

        {/* Lista de transportistas */}
        {cargando ? (
          <div className="cargando-container">
            <div className="spinner"></div>
            <p>Cargando transportistas...</p>
          </div>
        ) : transportistasFiltrados.length === 0 ? (
          <div className="sin-datos">
            <p>No se encontraron transportistas</p>
            <button 
              className="btn-crear"
              onClick={() => setMostrarModalCrear(true)}
            >
              Crear primer transportista
            </button>
          </div>
        ) : (
          <div className="grid-transportistas">
            {transportistasFiltrados.map((transportista, index) => (
              <div
                key={transportista.id}
                className={`card-transportista ${cardSeleccionada === index ? 'seleccionada' : ''} ${!transportista.activo ? 'inactiva' : ''}`}
                onClick={() => abrirModalVehiculos(transportista)}
              >
                <div className="card-header">
                  <div className="codigo-interno">
                    {transportista.codigoInterno}
                  </div>
                  <div className={`estado ${transportista.activo ? 'activo' : 'inactivo'}`}>
                    {transportista.activo ? 'Activo' : 'Inactivo'}
                  </div>
                </div>
                
                <div className="card-content">
                  <h3>{transportista.nombreApellido}</h3>
                  <p className="empresa">{transportista.nombreEmpresa || ''}</p>
                  <div className="info-vehiculos">
                    <span>🚗 {transportista.vehiculos.length} vehículos</span>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="btn-editar"
                    onClick={(e) => {
                      e.stopPropagation();
                      abrirModalEditar(transportista);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className={`btn-estado ${transportista.activo ? 'btn-desactivar' : 'btn-activar'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      cambiarEstadoTransportista(transportista.id, !transportista.activo);
                    }}
                  >
                    {transportista.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    className="btn-eliminar"
                    onClick={(e) => {
                      e.stopPropagation();
                      eliminarTransportista(transportista.id);
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear Transportista */}
      {mostrarModalCrear && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Crear Transportista</h2>
              <button 
                className="btn-cerrar"
                onClick={() => {
                  setMostrarModalCrear(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>Código Interno *</label>
                <input
                  type="text"
                  value={formData.codigoInterno}
                  onChange={(e) => setFormData({...formData, codigoInterno: e.target.value})}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const nombreInput = document.querySelector('input[data-field="nombreApellido"]') as HTMLInputElement;
                      if (nombreInput) nombreInput.focus();
                    }
                  }}
                  className={errors.codigoInterno ? 'error' : ''}
                  autoFocus
                />
                {errors.codigoInterno && <span className="error-message">{errors.codigoInterno}</span>}
              </div>

              <div className="form-group">
                <label>Nombre y Apellido *</label>
                <input
                  type="text"
                  value={formData.nombreApellido}
                  onChange={(e) => setFormData({...formData, nombreApellido: e.target.value})}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const empresaInput = document.querySelector('input[data-field="nombreEmpresa"]') as HTMLInputElement;
                      if (empresaInput) empresaInput.focus();
                    }
                  }}
                  className={errors.nombreApellido ? 'error' : ''}
                  data-field="nombreApellido"
                />
                {errors.nombreApellido && <span className="error-message">{errors.nombreApellido}</span>}
              </div>

              <div className="form-group">
                <label>Empresa (opcional)</label>
                <input
                  type="text"
                  value={formData.nombreEmpresa}
                  onChange={(e) => setFormData({...formData, nombreEmpresa: e.target.value})}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      // Solo crear si los campos obligatorios están completos
                      if (formData.codigoInterno.trim() && formData.nombreApellido.trim()) {
                        crearTransportista();
                      } else {
                        toast.error('Por favor completa los campos obligatorios');
                      }
                    }
                  }}
                  className={errors.nombreEmpresa ? 'error' : ''}
                  data-field="nombreEmpresa"
                />
                {errors.nombreEmpresa && <span className="error-message">{errors.nombreEmpresa}</span>}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancelar"
                onClick={() => {
                  setMostrarModalCrear(false);
                  resetForm();
                }}
              >
                Cancelar
              </button>
              <button 
                className="btn-guardar"
                onClick={crearTransportista}
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Transportista */}
      {mostrarModalEditar && transportistaSeleccionado && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Editar Transportista</h2>
              <button 
                className="btn-cerrar"
                onClick={() => {
                  setMostrarModalEditar(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>Código Interno *</label>
                <input
                  type="text"
                  value={formData.codigoInterno}
                  onChange={(e) => setFormData({...formData, codigoInterno: e.target.value})}
                  className={errors.codigoInterno ? 'error' : ''}
                  autoFocus
                />
                {errors.codigoInterno && <span className="error-message">{errors.codigoInterno}</span>}
              </div>

              <div className="form-group">
                <label>Nombre y Apellido *</label>
                <input
                  type="text"
                  value={formData.nombreApellido}
                  onChange={(e) => setFormData({...formData, nombreApellido: e.target.value})}
                  className={errors.nombreApellido ? 'error' : ''}
                />
                {errors.nombreApellido && <span className="error-message">{errors.nombreApellido}</span>}
              </div>

              <div className="form-group">
                <label>Empresa (opcional)</label>
                <input
                  type="text"
                  value={formData.nombreEmpresa}
                  onChange={(e) => setFormData({...formData, nombreEmpresa: e.target.value})}
                  className={errors.nombreEmpresa ? 'error' : ''}
                />
                {errors.nombreEmpresa && <span className="error-message">{errors.nombreEmpresa}</span>}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancelar"
                onClick={() => {
                  setMostrarModalEditar(false);
                  resetForm();
                }}
              >
                Cancelar
              </button>
              <button 
                className="btn-guardar"
                onClick={actualizarTransportista}
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Vehículos */}
      {mostrarModalVehiculos && transportistaSeleccionado && (
        <div className="modal-overlay">
          <div className="modal modal-grande">
            <div className="modal-header">
              <h2>Vehículos de {transportistaSeleccionado.nombreApellido}</h2>
              <button 
                className="btn-cerrar"
                onClick={() => setMostrarModalVehiculos(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              {/* Formulario para agregar vehículo */}
              <div className="formulario-vehiculo">
                <h3>Agregar Vehículo</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Marca *</label>
                    <input
                      type="text"
                      value={formVehiculo.marca}
                      onChange={(e) => setFormVehiculo({...formVehiculo, marca: e.target.value})}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const modeloInput = document.querySelector('input[data-field="modelo"]') as HTMLInputElement;
                          if (modeloInput) modeloInput.focus();
                        }
                      }}
                      className={errors.marca ? 'error' : ''}
                      data-field="marca"
                    />
                    {errors.marca && <span className="error-message">{errors.marca}</span>}
                  </div>

                  <div className="form-group">
                    <label>Modelo *</label>
                    <input
                      type="text"
                      value={formVehiculo.modelo}
                      onChange={(e) => setFormVehiculo({...formVehiculo, modelo: e.target.value})}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const patenteInput = document.querySelector('input[data-field="patente"]') as HTMLInputElement;
                          if (patenteInput) patenteInput.focus();
                        }
                      }}
                      className={errors.modelo ? 'error' : ''}
                      data-field="modelo"
                    />
                    {errors.modelo && <span className="error-message">{errors.modelo}</span>}
                  </div>

                  <div className="form-group">
                    <label>Patente *</label>
                    <input
                      type="text"
                      value={formVehiculo.patente}
                      onChange={(e) => setFormVehiculo({...formVehiculo, patente: e.target.value})}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          // Solo crear si todos los campos están completos
                          if (formVehiculo.marca.trim() && formVehiculo.modelo.trim() && formVehiculo.patente.trim()) {
                            crearVehiculo();
                          } else {
                            toast.error('Por favor completa todos los campos del vehículo');
                          }
                        }
                      }}
                      className={errors.patente ? 'error' : ''}
                      data-field="patente"
                    />
                    {errors.patente && <span className="error-message">{errors.patente}</span>}
                  </div>

                  <div className="form-group">
                    <label>&nbsp;</label>
                    <button 
                      className="btn-agregar"
                      onClick={crearVehiculo}
                      disabled={guardando}
                    >
                      {guardando ? 'Guardando...' : 'Agregar'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de vehículos */}
              <div className="lista-vehiculos">
                <h3>Vehículos ({transportistaSeleccionado?.vehiculos?.length || 0})</h3>
                {!transportistaSeleccionado?.vehiculos || transportistaSeleccionado.vehiculos.length === 0 ? (
                  <p className="sin-vehiculos">No hay vehículos registrados</p>
                ) : (
                  <div className="vehiculos-grid">
                    {transportistaSeleccionado.vehiculos.map((vehiculo) => (
                      <div key={vehiculo.id} className={`vehiculo-item ${!vehiculo.activo ? 'inactivo' : ''}`}>
                        <div className="vehiculo-info">
                          <div className="vehiculo-marca-modelo">
                            {vehiculo.marca} {vehiculo.modelo}
                          </div>
                          <div className="vehiculo-patente">
                            {vehiculo.patente}
                          </div>
                          <div className={`vehiculo-estado ${vehiculo.activo ? 'activo' : 'inactivo'}`}>
                            {vehiculo.activo ? 'Activo' : 'Desactivado'}
                          </div>
                        </div>
                        <div className="vehiculo-acciones">
                          <button
                            className={`btn-estado ${vehiculo.activo ? 'btn-desactivar' : 'btn-activar'}`}
                            onClick={() => cambiarEstadoVehiculo(vehiculo.id, !vehiculo.activo)}
                          >
                            {vehiculo.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cerrar-modal"
                onClick={() => setMostrarModalVehiculos(false)}
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

export default GestionTransportistas;
