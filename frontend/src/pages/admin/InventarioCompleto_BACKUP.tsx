import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';

interface Sector {
  id: number;
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
}

interface Usuario {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  rol: string;
}

interface ConteoSector {
  id: number;
  sectorId: number;
  sectorNombre: string;
  sectorDescripcion?: string;
  usuario1Id?: number;
  usuario1Nombre?: string;
  usuario2Id?: number;
  usuario2Nombre?: string;
  estado: string;
  totalProductos: number;
  productosContados: number;
  porcentajeCompletado: number;
  fechaInicio: string;
}

interface InventarioCompleto {
  id: number;
  fechaInicio: string;
  estado: string;
  totalSectores: number;
  sectoresCompletados: number;
  sectoresEnProgreso: number;
  sectoresPendientes: number;
  porcentajeCompletado: number;
  conteosSectores: ConteoSector[];
}

export default function InventarioCompleto() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  
  const [inventario, setInventario] = useState<InventarioCompleto | null>(null);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [usuariosAsignados, setUsuariosAsignados] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(false);
  const [creandoInventario, setCreandoInventario] = useState(false);
  const [mostrarModalAsignacion, setMostrarModalAsignacion] = useState(false);
  const [sectorSeleccionado, setSectorSeleccionado] = useState<Sector | null>(null);
  const [usuario1Seleccionado, setUsuario1Seleccionado] = useState<number | null>(null);
  const [usuario2Seleccionado, setUsuario2Seleccionado] = useState<number | null>(null);
  const [mostrarModalCancelacion, setMostrarModalCancelacion] = useState(false);
  const [mostrarModalFinalizacion, setMostrarModalFinalizacion] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  useEffect(() => {
    if (datosUsuario && !cargando) {
      cargarDatos();
    }
  }, [datosUsuario]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      
      console.log('🔍 InventarioCompleto - cargarDatos iniciado');
      console.log('🔍 datosUsuario:', datosUsuario);
      console.log('🔍 empresaId:', datosUsuario?.empresaId);
      
      if (!datosUsuario?.empresaId) {
        console.error('❌ No se pudo obtener la información de la empresa');
        toast.error('No se pudo obtener la información de la empresa');
            return;
      }

      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Cargar sectores
      const sectoresResponse = await fetch(`/api/empresas/${datosUsuario.empresaId}/sectores`, {
        headers
      });
      if (sectoresResponse.ok) {
        const sectoresData = await sectoresResponse.json();
        console.log('✅ Sectores cargados:', sectoresData);
        // El backend devuelve {mensaje, data}, necesitamos extraer 'data'
        if (sectoresData.data) {
          setSectores(sectoresData.data);
      } else {
          setSectores(sectoresData);
        }
      } else {
        console.error('❌ Error cargando sectores:', sectoresResponse.status);
        const errorData = await sectoresResponse.text();
        console.error('❌ Error details sectores:', errorData);
      }

      // Cargar usuarios asignados
      const usuariosResponse = await fetch(`/api/empresas/${datosUsuario.empresaId}/inventario-completo/usuarios?rol=ASIGNADO`, {
        headers
      });
      if (usuariosResponse.ok) {
        const usuariosData = await usuariosResponse.json();
        console.log('✅ Usuarios asignados cargados:', usuariosData);
        setUsuariosAsignados(usuariosData);
      } else {
        console.error('❌ Error cargando usuarios:', usuariosResponse.status);
        const errorData = await usuariosResponse.text();
        console.error('❌ Error details usuarios:', errorData);
      }

      // Probar endpoint de test primero
      const testResponse = await fetch(`/api/empresas/${datosUsuario.empresaId}/inventario-completo/test`, {
        headers
      });
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log('✅ Test endpoint funcionando:', testData);
      } else {
        console.error('❌ Error en test endpoint:', testResponse.status);
      }

      // Cargar inventario activo
      const inventarioResponse = await fetch(`/api/empresas/${datosUsuario.empresaId}/inventario-completo/activo`, {
        headers
      });
      if (inventarioResponse.ok) {
        const inventarioData = await inventarioResponse.json();
        console.log('✅ Inventario activo cargado:', inventarioData);
        console.log('✅ Conteos de sectores:', inventarioData.conteosSectores);
        // Asegurar que todos los campos numéricos tengan valores por defecto
        const inventarioConDefaults = {
          ...inventarioData,
          totalSectores: inventarioData.totalSectores || 0,
          sectoresCompletados: inventarioData.sectoresCompletados || 0,
          sectoresEnProgreso: inventarioData.sectoresEnProgreso || 0,
          sectoresPendientes: inventarioData.sectoresPendientes || 0,
          porcentajeCompletado: inventarioData.porcentajeCompletado || 0,
          conteosSectores: inventarioData.conteosSectores || []
        };
        console.log('✅ Inventario con defaults:', inventarioConDefaults);
        console.log('✅ Inventario ID cargado:', inventarioConDefaults.id);
        setInventario(inventarioConDefaults);
      } else if (inventarioResponse.status === 404) {
        // No hay inventario activo, esto es normal
        console.log('ℹ️ No hay inventario activo');
        setInventario(null); // Limpiar inventario anterior
      } else {
        console.error('❌ Error cargando inventario activo:', inventarioResponse.status);
        const errorData = await inventarioResponse.text();
        console.error('❌ Error details:', errorData);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  const crearInventarioCompleto = async () => {
    try {
      setCreandoInventario(true);
      
      if (!datosUsuario?.empresaId) {
        toast.error('No se pudo obtener la información de la empresa');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/empresas/${datosUsuario.empresaId}/inventario-completo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          empresaId: datosUsuario.empresaId
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Respuesta crear inventario:', responseData);
        
        // Extraer el inventario de la respuesta
        const inventarioCreado = responseData.inventario || responseData;
        
        // Asegurar que todos los campos numéricos tengan valores por defecto
        const inventarioConDefaults = {
          ...inventarioCreado,
          totalSectores: inventarioCreado.totalSectores || 0,
          sectoresCompletados: inventarioCreado.sectoresCompletados || 0,
          sectoresEnProgreso: inventarioCreado.sectoresEnProgreso || 0,
          sectoresPendientes: inventarioCreado.sectoresPendientes || 0,
          porcentajeCompletado: inventarioCreado.porcentajeCompletado || 0,
          conteosSectores: inventarioCreado.conteosSectores || []
        };
        
        console.log('✅ Inventario con defaults:', inventarioConDefaults);
        console.log('✅ Inventario ID:', inventarioConDefaults.id);
        
        toast.success('Inventario completo creado exitosamente');
        setInventario(inventarioConDefaults);
      } else if (response.status === 400) {
        const errorData = await response.json();
        if (errorData.error && errorData.error.includes('Ya existe un inventario completo en progreso')) {
          toast.success('Ya existe un inventario en progreso. Cargando inventario existente...');
          // Recargar datos para mostrar el inventario existente
          await cargarDatos();
      } else {
          toast.error(errorData.error || 'Error al crear el inventario');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al crear el inventario');
      }
    } catch (error) {
      console.error('Error creando inventario:', error);
      toast.error('Error al crear el inventario');
    } finally {
      setCreandoInventario(false);
    }
  };

  const asignarUsuarios = async () => {
    if (!sectorSeleccionado || !usuario1Seleccionado || !usuario2Seleccionado) {
      toast.error('Debe seleccionar ambos usuarios');
      return;
    }
    
    if (usuario1Seleccionado === usuario2Seleccionado) {
      toast.error('Los usuarios deben ser diferentes');
      return;
    }

    try {
      if (!datosUsuario?.empresaId) {
        toast.error('No se pudo obtener la información de la empresa');
      return;
    }
    
      if (!inventario?.id) {
        toast.error('No se pudo obtener la información del inventario');
      return;
    }

      if (!sectorSeleccionado?.id) {
        toast.error('No se pudo obtener la información del sector');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/empresas/${datosUsuario.empresaId}/inventario-completo/${inventario.id}/sectores/${sectorSeleccionado.id}/asignar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          usuario1Id: usuario1Seleccionado,
          usuario2Id: usuario2Seleccionado
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Respuesta de asignación:', responseData);
        toast.success('Usuarios asignados exitosamente');
        setMostrarModalAsignacion(false);
        setSectorSeleccionado(null);
        setUsuario1Seleccionado(null);
        setUsuario2Seleccionado(null);
        console.log('🔄 Recargando datos después de asignación...');
        await cargarDatos();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al asignar usuarios');
      }
    } catch (error) {
      console.error('Error asignando usuarios:', error);
      toast.error('Error al asignar usuarios');
    }
  };

  const cancelarInventario = async () => {
    try {
      setCancelando(true);
      
      if (!datosUsuario?.empresaId || !inventario?.id) {
        toast.error('No se pudo obtener la información del inventario');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/empresas/${datosUsuario.empresaId}/inventario-completo/${inventario.id}/cancelar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Inventario cancelado exitosamente');
        setMostrarModalCancelacion(false);
        setInventario(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al cancelar el inventario');
      }
    } catch (error) {
      console.error('Error cancelando inventario:', error);
      toast.error('Error al cancelar el inventario');
    } finally {
      setCancelando(false);
    }
  };

  const finalizarInventario = async () => {
    try {
      setFinalizando(true);
      
      if (!datosUsuario?.empresaId || !inventario?.id) {
        toast.error('No se pudo obtener la información del inventario');
      return;
    }

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/empresas/${datosUsuario.empresaId}/inventario-completo/${inventario.id}/finalizar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Inventario finalizado exitosamente');
        setMostrarModalFinalizacion(false);
        await cargarDatos(); // Recargar para mostrar el estado actualizado
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al finalizar el inventario');
      }
    } catch (error) {
      console.error('Error finalizando inventario:', error);
      toast.error('Error al finalizar el inventario');
    } finally {
      setFinalizando(false);
    }
  };

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return '#f59e0b';
      case 'EN_PROGRESO':
        return '#3b82f6';
      case 'COMPLETADO':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const obtenerColoresSector = (sectorId: number) => {
    const colores = [
      {
        gradient: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
        border: '#64748b',
        header: '#f8fafc',
        text: '#1e293b',
        accent: '#64748b'
      },
      {
        gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        border: '#d97706',
        header: '#f8fafc',
        text: '#1e293b',
        accent: '#d97706'
      },
      {
        gradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
        border: '#2563eb',
        header: '#f8fafc',
        text: '#1e293b',
        accent: '#2563eb'
      },
      {
        gradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
        border: '#059669',
        header: '#f8fafc',
        text: '#1e293b',
        accent: '#059669'
      },
      {
        gradient: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
        border: '#be185d',
        header: '#f8fafc',
        text: '#1e293b',
        accent: '#be185d'
      },
      {
        gradient: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
        border: '#7c3aed',
        header: '#f8fafc',
        text: '#1e293b',
        accent: '#7c3aed'
      },
      {
        gradient: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
        border: '#dc2626',
        header: '#f8fafc',
        text: '#1e293b',
        accent: '#dc2626'
      },
      {
        gradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
        border: '#16a34a',
        header: '#f8fafc',
        text: '#1e293b',
        accent: '#16a34a'
      }
    ];
    return colores[sectorId % colores.length];
  };

  const obtenerTextoEstado = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'Pendiente';
      case 'EN_PROGRESO':
        return 'En Progreso';
      case 'COMPLETADO':
        return 'Completado';
      default:
        return estado;
    }
  };

  const esUsuarioAsignadoAlSector = (conteo: ConteoSector) => {
    if (!datosUsuario?.id) return false;
    
    // Verificar si el usuario actual está asignado como usuario1 o usuario2
    return (conteo.usuario1Id === datosUsuario.id) || (conteo.usuario2Id === datosUsuario.id);
  };

  if (cargando || !datosUsuario) {
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
          padding: '2rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #7c3aed',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280', margin: 0 }}>Cargando inventario completo...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <NavbarAdmin
          onCerrarSesion={cerrarSesion}
          empresaNombre={datosUsuario?.empresaNombre}
          nombreAdministrador={datosUsuario?.nombre}
        />

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          paddingTop: isMobile ? '8rem' : '9rem',
          paddingBottom: isMobile ? '1rem' : '2rem',
          paddingLeft: isMobile ? '1rem' : '2rem',
          paddingRight: isMobile ? '1rem' : '2rem'
        }}>
        {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <h1 style={{
              color: 'white',
              fontSize: isMobile ? '1.8rem' : '2.5rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>
              🏢 Inventario Completo
              </h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: isMobile ? '1rem' : '1.2rem',
              margin: 0
            }}>
              Inventario de todos los sectores con doble verificación
              </p>
            </div>
            
          {!inventario ? (
            /* Crear nuevo inventario */
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '4rem',
                marginBottom: '1rem'
              }}>
                📋
              </div>
              <h2 style={{
                margin: '0 0 1rem 0',
                color: '#1e293b',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}>
                Crear Nuevo Inventario Completo
              </h2>
              <p style={{
                color: '#64748b',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                Inicia un inventario completo de todos los sectores de tu empresa. 
                Cada sector será asignado a dos usuarios para doble verificación.
              </p>
              <button
                onClick={crearInventarioCompleto}
                disabled={creandoInventario}
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '1rem 2rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: creandoInventario ? 'not-allowed' : 'pointer',
                  opacity: creandoInventario ? 0.7 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                {creandoInventario ? 'Creando...' : 'Crear Inventario Completo'}
              </button>
            </div>
          ) : (
            /* Inventario existente */
            <div>
              {/* Resumen del inventario */}
              <div style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0',
                marginBottom: '3rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <h2 style={{
                    margin: 0,
                    color: '#1e293b',
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}>
                    Inventario #{inventario.id}
                  </h2>
                  <span style={{
                    background: obtenerColorEstado(inventario.estado),
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '1rem',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}>
                    {obtenerTextoEstado(inventario.estado)}
                  </span>
                </div>

                {/* Estadísticas */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#1e293b',
                      marginBottom: '0.25rem'
                    }}>
                      {inventario.totalSectores || 0}
            </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#64748b'
                    }}>
                      Total Sectores
          </div>
        </div>
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#10b981',
                      marginBottom: '0.25rem'
                    }}>
                      {inventario.sectoresCompletados || 0}
              </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#64748b'
                    }}>
                      Completados
              </div>
              </div>
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#3b82f6',
                      marginBottom: '0.25rem'
                    }}>
                      {inventario.sectoresEnProgreso || 0}
              </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#64748b'
                    }}>
                      En Progreso
            </div>
          </div>
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#f59e0b',
                      marginBottom: '0.25rem'
                    }}>
                      {inventario.sectoresPendientes || 0}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#64748b'
                    }}>
                      Pendientes
                    </div>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div style={{
                  background: '#f1f5f9',
                  borderRadius: '0.5rem',
                  height: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                    height: '100%',
                    width: `${inventario.porcentajeCompletado || 0}%`,
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.5rem'
                }}>
                  <span style={{
                    fontSize: '0.9rem',
                    color: '#64748b'
                  }}>
                    Progreso General
                  </span>
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: '#1e293b'
                  }}>
                    {(inventario.porcentajeCompletado || 0).toFixed(1)}%
                    </span>
                  </div>
                  
                {/* Botones de gestión del administrador */}
                {datosUsuario?.rol === 'ADMINISTRADOR' && (
                  <div style={{
                    marginTop: '1.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                  }}>
                          <button
                      onClick={() => setMostrarModalCancelacion(true)}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      🗑️ Cancelar Inventario
                          </button>
                    
                    {inventario.estado === 'EN_PROGRESO' && inventario.sectoresCompletados === inventario.totalSectores && (
                        <button
                        onClick={() => setMostrarModalFinalizacion(true)}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          padding: '0.75rem 1.5rem',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        ✅ Finalizar Inventario
                        </button>
                      )}
                  </div>
                        )}
                    </div>

              {/* Sectores del inventario */}
              <div style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{
                  margin: '0 0 1.5rem 0',
                  color: '#1e293b',
                  fontSize: '1.3rem',
                  fontWeight: 'bold'
                }}>
                  Sectores del Inventario 📋
                </h3>

                {/* Sección única de todos los sectores del inventario */}
                <div style={{ marginTop: '2rem' }}>
                  <h4 style={{
                    margin: '0 0 1rem 0',
                    color: '#1e293b',
                    fontSize: '1.1rem',
                    fontWeight: '600'
                  }}>
                    📋 Sectores del Inventario
                  </h4>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                      gap: '1rem' 
                    }}>
                      {/* Mostrar todos los sectores: asignados y no asignados */}
                      {sectores.map((sector) => {
                        // Buscar si este sector ya tiene un conteo asignado
                        const conteo = inventario.conteosSectores?.find(c => c.sectorId === sector.id);
                        const colores = obtenerColoresSector(sector.id);
                        return (
                        <div
                          key={sector.id}
                          style={{
                            background: colores.gradient,
                            borderRadius: '0.75rem',
                            padding: '1.5rem',
                            border: `2px solid ${colores.border}`,
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transform: 'translateY(0)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                            e.currentTarget.style.borderColor = colores.accent;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
                            e.currentTarget.style.borderColor = colores.border;
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '1rem'
                          }}>
                            <div>
                              <h5 style={{
                                margin: '0 0 0.5rem 0',
                                color: colores.accent,
                                fontSize: '1.2rem',
                                fontWeight: '700',
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                                letterSpacing: '0.025em'
                              }}>
                                {sector.nombre}
                              </h5>
                              {sector.descripcion && (
                                <p style={{
                                  margin: 0,
                                  color: '#64748b',
                                  fontSize: '0.9rem'
                                }}>
                                  {sector.descripcion}
                                </p>
                                )}
                            </div>
                            <span style={{
                              background: conteo ? obtenerColorEstado(conteo.estado) : '#6b7280',
                              color: 'white',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '0.5rem',
                              fontSize: '0.8rem',
                              fontWeight: '500'
                            }}>
                              {conteo ? obtenerTextoEstado(conteo.estado) : 'PENDIENTE'}
                          </span>
                    </div>

                          {/* Información de usuarios asignados */}
                          {conteo ? (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                              gap: '1rem',
                              marginBottom: '1rem'
                            }}>
                              <div style={{
                                background: 'white',
                                borderRadius: '0.5rem',
                                padding: '1rem',
                                border: '1px solid #e2e8f0'
                              }}>
                                <div style={{
                                  fontSize: '0.8rem',
                                  color: '#64748b',
                                  marginBottom: '0.25rem'
                                }}>
                                  Usuario 1
                                </div>
                                <div style={{
                                  fontSize: '0.9rem',
                                  fontWeight: '600',
                                  color: '#1e293b'
                                }}>
                                  {conteo.usuario1Nombre || 'No asignado'}
                                </div>
                              </div>
                              <div style={{
                                background: 'white',
                                borderRadius: '0.5rem',
                                padding: '1rem',
                                border: '1px solid #e2e8f0'
                              }}>
                                <div style={{
                                  fontSize: '0.8rem',
                                  color: '#64748b',
                                  marginBottom: '0.25rem'
                                }}>
                                  Usuario 2
                                </div>
                                <div style={{
                                  fontSize: '0.9rem',
                                  fontWeight: '600',
                                  color: '#1e293b'
                                }}>
                                  {conteo.usuario2Nombre || 'No asignado'}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div style={{
                              background: 'white',
                              borderRadius: '0.5rem',
                              padding: '1rem',
                              border: '1px solid #e2e8f0',
                              marginBottom: '1rem',
                              textAlign: 'center'
                            }}>
                              <div style={{
                                fontSize: '0.9rem',
                                color: '#64748b',
                                fontWeight: '500'
                              }}>
                                Sin usuarios asignados
                              </div>
                            </div>
                            )}

                          {/* Progreso del sector */}
                          {conteo && (
                            <div style={{
                              background: 'white',
                              borderRadius: '0.5rem',
                              padding: '1rem',
                              border: '1px solid #e2e8f0',
                              marginBottom: '1rem'
                            }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.5rem'
                              }}>
                                <span style={{
                                  fontSize: '0.9rem',
                                  fontWeight: '600',
                                  color: '#1e293b'
                                }}>
                                  Progreso
                            </span>
                                <span style={{
                                  fontSize: '0.9rem',
                                  fontWeight: '600',
                                  color: '#7c3aed'
                                }}>
                                  {conteo.productosContados || 0} / {conteo.totalProductos || 0}
                                </span>
                              </div>
                              <div style={{
                                background: '#f1f5f9',
                                borderRadius: '0.25rem',
                                height: '6px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                                  height: '100%',
                                  width: `${conteo.porcentajeCompletado || 0}%`,
                                  transition: 'width 0.3s ease'
                                }}></div>
                              </div>
                            </div>
                            )}

                          {/* Botones de acción */}
                          <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            justifyContent: 'flex-end'
                          }}>
                            {!conteo || !conteo.usuario1Nombre || !conteo.usuario2Nombre ? (
                          <button
                            onClick={() => {
                                  setSectorSeleccionado(sector);
                                  setMostrarModalAsignacion(true);
                                }}
                                style={{
                                  background: '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.25rem',
                                  padding: '0.5rem 1rem',
                                  fontSize: '0.9rem',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  transform: 'scale(1)'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#2563eb';
                                  e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#3b82f6';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              >
                                Asignar Usuarios
                          </button>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {/* Botón para reasignar usuarios (solo administradores) */}
                          {datosUsuario?.rol === 'ADMINISTRADOR' && (
                        <button
                          onClick={() => {
                                    setSectorSeleccionado(sector);
                                    setMostrarModalAsignacion(true);
                                  }}
                                  style={{
                                    background: '#f59e0b',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    transform: 'scale(1)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#d97706';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#f59e0b';
                                    e.currentTarget.style.transform = 'scale(1)';
                                  }}
                                >
                                  🔄 Reasignar
                        </button>
                        )}
                          
                          {/* Botón "Iniciar Conteo" solo si el usuario actual está asignado al sector */}
                          {conteo && esUsuarioAsignadoAlSector(conteo) && (
                        <button
                              onClick={() => {
                                      // Navegar al conteo del sector
                                      navigate(`/admin/conteo-sector/${conteo.id}`);
                                    }}
                                    style={{
                                      background: '#10b981',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '0.25rem',
                                      padding: '0.5rem 1rem',
                                      fontSize: '0.9rem',
                                      fontWeight: '500',
                                      cursor: 'pointer',
                                      transition: 'all 0.3s ease',
                                      transform: 'scale(1)'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = '#059669';
                                      e.currentTarget.style.transform = 'scale(1.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = '#10b981';
                                      e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                  >
                                    Iniciar Conteo
                        </button>
                        )}
                        </div>
                        )}
                </div>
              </div>
            );
          })}
        </div>
            

          {/* Modal de asignación de usuarios */}
        {mostrarModalAsignacion && (
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
                borderRadius: '1rem',
                padding: '2rem',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}>
                <h3 style={{
                  margin: '0 0 1.5rem 0',
                  color: '#1e293b',
                  fontSize: '1.3rem',
                  fontWeight: 'bold'
                }}>
                  Asignar Usuarios a {sectorSeleccionado?.nombre}
                </h3>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Usuario 1
                  </label>
                  <select
                    value={usuario1Seleccionado || ''}
                    onChange={(e) => setUsuario1Seleccionado(e.target.value ? parseInt(e.target.value) : null)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem',
                      background: 'white'
                    }}
                  >
                    <option value="">Seleccionar usuario</option>
                    {usuariosAsignados.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nombre} {usuario.apellidos}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Usuario 2
                  </label>
                  <select
                    value={usuario2Seleccionado || ''}
                    onChange={(e) => setUsuario2Seleccionado(e.target.value ? parseInt(e.target.value) : null)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem',
                      background: 'white'
                    }}
                  >
                    <option value="">Seleccionar usuario</option>
                    {usuariosAsignados.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nombre} {usuario.apellidos}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => {
                      setMostrarModalAsignacion(false);
                      setSectorSeleccionado(null);
                      setUsuario1Seleccionado(null);
                      setUsuario2Seleccionado(null);
                    }}
                    style={{
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={asignarUsuarios}
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Asignar Usuarios
                  </button>
                </div>
            </div>
          </div>
          )}

          {/* Modal de confirmación para cancelar inventario */}
          {mostrarModalCancelacion && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000
            }}>
              <div style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                maxWidth: '400px',
                width: '90%',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem'
                }}>
                  ⚠️
                </div>
                <h3 style={{
                  margin: '0 0 1rem 0',
                  color: '#1e293b',
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                }}>
                  ¿Cancelar Inventario?
                </h3>
                <p style={{
                  margin: '0 0 1.5rem 0',
                  color: '#64748b',
                  lineHeight: '1.5'
                }}>
                  Esta acción cancelará el inventario completo y eliminará todos los datos de conteo. Esta acción no se puede deshacer.
                </p>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center'
                }}>
                  <button
                    onClick={() => setMostrarModalCancelacion(false)}
                    style={{
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    No, Mantener
                  </button>
                  <button
                    onClick={cancelarInventario}
                    disabled={cancelando}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: cancelando ? 'not-allowed' : 'pointer',
                      opacity: cancelando ? 0.7 : 1,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {cancelando ? 'Cancelando...' : 'Sí, Cancelar'}
                  </button>
              </div>
            </div>
          </div>
          )}

          {/* Modal de confirmación para finalizar inventario */}
          {mostrarModalFinalizacion && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000
            }}>
              <div style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                maxWidth: '400px',
                width: '90%',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem'
                }}>
                  ✅
      </div>
                <h3 style={{
                  margin: '0 0 1rem 0',
                  color: '#1e293b',
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                }}>
                  ¿Finalizar Inventario?
                </h3>
                <p style={{
                  margin: '0 0 1.5rem 0',
                  color: '#64748b',
                  lineHeight: '1.5'
                }}>
                  Todos los sectores han sido completados. ¿Desea finalizar el inventario y generar el reporte final?
                </p>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center'
                }}>
                  <button
                    onClick={() => setMostrarModalFinalizacion(false)}
                    style={{
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    No, Revisar
                  </button>
                  <button
                    onClick={finalizarInventario}
                    disabled={finalizando}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: finalizando ? 'not-allowed' : 'pointer',
                      opacity: finalizando ? 0.7 : 1,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {finalizando ? 'Finalizando...' : 'Sí, Finalizar'}
                  </button>
    </div>
              </div>
            </div>
            )}

          {/* Botón de regreso */}
          <div style={{
            textAlign: 'center',
            marginTop: '2rem'
          }}>
            <button
              onClick={() => navigate('/admin/gestion-inventario')}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              ← Volver a Gestión de Inventario
            </button>
        </div>
      
    </>
  );
}
