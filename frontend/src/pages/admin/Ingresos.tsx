import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
import { formatearFecha, formatearFechaCorta, formatearFechaConHora } from '../../utils/dateUtils';

interface RemitoIngreso {
  id: number;
  numeroRemito: string;
  fechaRemito: string;
  observaciones?: string;
  totalProductos: number;
  fechaCreacion: any;
  fechaActualizacion: any;
  detalles: DetalleRemitoIngreso[];
}

interface DetalleRemitoIngreso {
  id: number;
  productoId?: number;
  codigoPersonalizado?: string;
  descripcion: string;
  cantidad: number;
  observaciones?: string;
  fechaCreacion: any;
}



export default function Ingresos() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();

  // Función helper para convertir fechaRemito a string de fecha
  const obtenerFechaRemitoString = (fechaRemito: any): string => {
    console.log('🔍 [DEBUG] obtenerFechaRemitoString - Input:', {
      fechaRemito,
      tipo: typeof fechaRemito,
      esArray: Array.isArray(fechaRemito)
    });
    
    try {
      // Si es null o undefined
      if (fechaRemito == null) {
        return 'Fecha no disponible';
      }

      // Si es un string
      if (typeof fechaRemito === 'string') {
        console.log('🔍 [DEBUG] Procesando como string:', fechaRemito);
        // Si ya tiene formato de fecha (YYYY-MM-DD)
        if (fechaRemito.match(/^\d{4}-\d{2}-\d{2}$/)) {
          console.log('🔍 [DEBUG] Formato YYYY-MM-DD detectado');
          return fechaRemito;
        }
        // Si tiene formato ISO con T
        if (fechaRemito.includes('T')) {
          const partes = fechaRemito.split('T');
          if (partes.length >= 1) {
            console.log('🔍 [DEBUG] Formato ISO detectado, parte fecha:', partes[0]);
            return partes[0];
          }
        }
        // Si es otro formato, intentar parsear
        // Solo intentar parsear si no es un array
        if (!Array.isArray(fechaRemito)) {
          const fechaObj = new Date(fechaRemito);
          if (!isNaN(fechaObj.getTime())) {
            const resultado = fechaObj.toISOString().split('T')[0];
            console.log('🔍 [DEBUG] Parseado como Date, resultado:', resultado);
            return resultado;
          }
        }
      }

      // Si es un objeto Date o timestamp
      if (fechaRemito instanceof Date || typeof fechaRemito === 'number') {
        const fechaObj = new Date(fechaRemito);
        if (!isNaN(fechaObj.getTime())) {
          return fechaObj.toISOString().split('T')[0];
        }
      }

      // Si es un array (formato [year, month, day, hour, minute, second])
      if (Array.isArray(fechaRemito)) {
        console.log('🔍 [DEBUG] Procesando como array:', fechaRemito);
        const [year, month, day] = fechaRemito;
        // Crear fecha local (no UTC) para evitar conversión automática
        const fechaLocal = new Date(year, month - 1, day);
        
        // Formatear como YYYY-MM-DD en zona horaria local
        const fechaFormateada = fechaLocal.getFullYear() + '-' + 
          String(fechaLocal.getMonth() + 1).padStart(2, '0') + '-' + 
          String(fechaLocal.getDate()).padStart(2, '0');
        
        console.log('🔍 [DEBUG] Array procesado como fecha local:', {
          year, month, day,
          fechaLocal: fechaLocal.toISOString(),
          fechaFormateada
        });
        return fechaFormateada;
      }

      console.error('Formato de fecha no reconocido:', fechaRemito, 'tipo:', typeof fechaRemito);
      return 'Fecha inválida';
    } catch (error) {
      console.error('Error procesando fecha:', fechaRemito, error);
      return 'Fecha inválida';
    }
  };
  
  const [remitos, setRemitos] = useState<RemitoIngreso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [remitoSeleccionado, setRemitoSeleccionado] = useState<RemitoIngreso | null>(null);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [diasExpandidos, setDiasExpandidos] = useState<Set<string>>(new Set());

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    if (datosUsuario) {
      cargarDatos();
    }
  }, [navigate, datosUsuario]);



  // Manejar teclas globales para abrir modal con Enter
  const manejarTeclasGlobales = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      // Verificar que no esté en un input o textarea
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        navigate('/admin/crear-ingreso');
      }
    }
  };

  // Agregar y remover event listener para teclas globales
  useEffect(() => {
    document.addEventListener('keydown', manejarTeclasGlobales);
    return () => {
      document.removeEventListener('keydown', manejarTeclasGlobales);
    };
  }, [navigate]);

  // Manejar tecla Escape para volver a la vista principal
  useEffect(() => {
    const manejarEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/admin/gestion-empresa');
      }
    };

    document.addEventListener('keydown', manejarEscape);
    return () => {
      document.removeEventListener('keydown', manejarEscape);
    };
  }, [navigate]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      await cargarRemitos();
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  const cargarRemitos = async () => {
    try {
      console.log('🔍 Cargando remitos...');
      const response = await ApiService.obtenerRemitosIngreso();
      if (response && response.data) {
        console.log('📋 Remitos cargados:', response.data);
        // Debug: verificar formato de fechas
        response.data.forEach((remito: any, index: number) => {
          console.log(`📅 Remito ${index + 1} - fechaRemito:`, remito.fechaRemito, 'tipo:', typeof remito.fechaRemito);
        });
        setRemitos(response.data);
      } else {
        setRemitos([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar remitos:', error);
      toast.error('Error al cargar los remitos');
      setRemitos([]);
    }
  };

  const abrirModalCrear = () => {
    navigate('/admin/crear-ingreso');
  };

  const filtrarRemitos = () => {
    let remitosFiltrados = remitos;

    // Filtrar por fecha
    if (filtroFecha) {
      remitosFiltrados = remitosFiltrados.filter(r => {
        return obtenerFechaRemitoString(r.fechaRemito) === filtroFecha;
      });
    }

    // Filtrar por búsqueda
    if (filtroBusqueda) {
      remitosFiltrados = remitosFiltrados.filter(r =>
        r.numeroRemito.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
        (r.observaciones && r.observaciones.toLowerCase().includes(filtroBusqueda.toLowerCase()))
      );
    }

    return remitosFiltrados;
  };

  const agruparRemitosPorFecha = () => {
    const remitosFiltrados = filtrarRemitos();
    const grupos: { [fecha: string]: RemitoIngreso[] } = {};
    
    remitosFiltrados.forEach(remito => {
      const fecha = obtenerFechaRemitoString(remito.fechaRemito);
      
      if (!grupos[fecha]) {
        grupos[fecha] = [];
      }
      grupos[fecha].push(remito);
    });
    
    return Object.entries(grupos)
      .sort(([fechaA], [fechaB]) => new Date(fechaB).getTime() - new Date(fechaA).getTime())
      .map(([fecha, remitos]) => ({
        fecha,
        remitos: remitos.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())
      }));
  };

  const gruposPorFecha = agruparRemitosPorFecha();

  const formatearFechaConHoy = (fechaRemito: any, formato: 'corta' | 'completa' = 'corta') => {
    const fechaRemitoString = obtenerFechaRemitoString(fechaRemito);
    const fechaActual = obtenerFechaActual();
    const esHoy = fechaRemitoString === fechaActual;
    
    console.log('🔍 [DEBUG] formatearFechaConHoy:', {
      fechaRemito,
      fechaRemitoString,
      fechaActual,
      esHoy,
      formato
    });
    
    if (esHoy) {
      return 'Hoy';
    }
    
    return formato === 'corta' ? formatearFechaCorta(fechaRemito) : formatearFecha(fechaRemito);
  };

  const formatearFechaGrupoConHoy = (fecha: string) => {
    const fechaActual = obtenerFechaActual();
    const esHoy = fecha === fechaActual;
    console.log('🔍 [DEBUG] formatearFechaGrupoConHoy:', {
      fecha,
      fechaActual,
      esHoy
    });
    return esHoy ? 'Hoy' : formatearFecha(fecha);
  };

  const obtenerFechaActual = () => {
    const hoy = new Date();
    const zonaHorariaLocal = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fechaActual = hoy.toLocaleDateString('en-CA', { timeZone: zonaHorariaLocal }); // format YYYY-MM-DD
    console.log('🔍 [DEBUG] obtenerFechaActual:', {
      hoy: hoy.toISOString(),
      zonaHorariaLocal,
      fechaActual
    });
    return fechaActual;
  };

  const alternarExpansionDia = (fecha: string) => {
    setDiasExpandidos(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(fecha)) {
        nuevo.delete(fecha);
      } else {
        nuevo.add(fecha);
      }
      return nuevo;
    });
  };

  const estaDiaExpandido = (fecha: string) => {
    const fechaActual = obtenerFechaActual();
    
    // Si hay filtros activos, expandir automáticamente los días que tienen remitos filtrados
    if (filtroFecha || filtroBusqueda) {
      return true;
    }
    
    // Si es el día actual, está expandido por defecto pero puede cerrarse
    if (fecha === fechaActual) {
      return !diasExpandidos.has(fecha);
    }
    return diasExpandidos.has(fecha);
  };

  const eliminarRemito = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este remito?')) {
      return;
    }

    try {
      await ApiService.eliminarRemitoIngreso(id);
      
      // Actualizar estado local
      setRemitos(prev => prev.filter(r => r.id !== id));
      
      toast.success('Remito eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar remito:', error);
      toast.error('Error al eliminar el remito');
    }
  };

  const exportarRemito = async (remito: RemitoIngreso) => {
    try {
      const response = await ApiService.exportarRemitoIngreso(remito.id);
      
      const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fechaRemitoStr = obtenerFechaRemitoString(remito.fechaRemito);
      link.download = `Remito_${remito.numeroRemito}_${fechaRemitoStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Remito exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar remito:', error);
      toast.error('Error al exportar el remito');
    }
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
            width: '3rem',
            height: '3rem',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280', margin: 0 }}>Cargando ingresos...</p>
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
        empresaNombre={datosUsuario?.empresaNombre}
        nombreAdministrador={datosUsuario?.nombre}
      />

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: isMobile ? '6rem 1rem 1rem 1rem' : '7rem 2rem 2rem 2rem'
      }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: isMobile ? '1.5rem' : '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                color: 'white'
              }}>
                📥
              </div>
              <div>
                <h1 style={{
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: 0
                }}>
                  Ingresos
                </h1>
                <p style={{
                  color: '#64748b',
                  margin: 0,
                  fontSize: '0.875rem'
                }}>
                  Registra la entrada de nueva mercadería al inventario
                </p>
                                 <p style={{
                   color: '#059669',
                   margin: '0.25rem 0 0 0',
                   fontSize: '0.75rem',
                   fontWeight: '500'
                 }}>
                   💡 Haz clic en "Nuevo Remito" para crear un ingreso
                 </p>
              </div>
            </div>
            <button
              onClick={abrirModalCrear}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(5, 150, 105, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.3)';
              }}
            >
              + Nuevo Remito
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: isMobile ? '1.5rem' : '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '1rem'
          }}>
            Filtros
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                📅 Filtrar por Fecha
              </label>
              <input
                type="date"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                🔍 Buscar
              </label>
              <input
                type="text"
                placeholder="Número de remito o observaciones..."
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'end',
              gap: '0.5rem'
            }}>

            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: isMobile ? '1.5rem' : '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          {gruposPorFecha.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📥</div>
              <p>No hay remitos registrados</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Crea tu primer remito de ingreso haciendo clic en "Nuevo Remito"
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '2rem'
            }}>
              {gruposPorFecha.map((grupo) => (
                <div key={grupo.fecha}>
                  {/* Header del día */}
                  <div
                    onClick={() => alternarExpansionDia(grupo.fecha)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.5rem',
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <div style={{
                        fontSize: '1.5rem',
                        color: '#059669'
                      }}>
                        {estaDiaExpandido(grupo.fecha) ? '📅' : '📅'}
                      </div>
                      <div>
                        <h3 style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: '#1e293b',
                          margin: 0
                        }}>
                          {formatearFechaGrupoConHoy(grupo.fecha)}
                        </h3>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#64748b',
                          margin: 0
                        }}>
                          {grupo.remitos.length} remito{grupo.remitos.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div style={{
                      fontSize: '1.25rem',
                      color: '#64748b',
                      transition: 'transform 0.3s ease'
                    }}>
                      {estaDiaExpandido(grupo.fecha) ? '▼' : '▶'}
                    </div>
                  </div>

                  {/* Remitos del día - Solo se muestran si está expandido */}
                  {estaDiaExpandido(grupo.fecha) && (
                    <div style={{
                      display: 'grid',
                      gap: '1rem',
                      marginTop: '1rem'
                    }}>
                      {grupo.remitos.map((remito) => (
                        <div
                          key={remito.id}
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.75rem',
                            padding: '1.5rem',
                            transition: 'all 0.3s ease',
                            background: 'white'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = '#059669';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.1)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '1rem',
                            flexDirection: isMobile ? 'column' : 'row',
                            gap: '1rem'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '0.5rem'
                              }}>
                                <div style={{
                                  background: '#059669',
                                  color: 'white',
                                  borderRadius: '0.5rem',
                                  padding: '0.5rem 0.75rem',
                                  fontSize: '0.875rem',
                                  fontWeight: '700',
                                  minWidth: 'fit-content'
                                }}>
                                  #{remito.numeroRemito}
                                </div>
                                <h4 style={{
                                  fontSize: '1.125rem',
                                  fontWeight: '600',
                                  color: '#1e293b',
                                  margin: 0
                                }}>
                                  Remito de Ingreso
                                </h4>
                              </div>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                fontSize: '0.875rem',
                                color: '#64748b',
                                flexWrap: 'wrap'
                              }}>
                                <span>📅 {formatearFechaConHoy(remito.fechaRemito, 'corta')}</span>
                                <span>📦 <span style={{ 
                                  color: '#059669', 
                                  fontWeight: '700'
                                }}>
                                  {remito.totalProductos}
                                </span> unidades</span>
                                <span>🛒 {remito.detalles.length} productos</span>
                                <span>⏰ {formatearFechaConHora(remito.fechaRemito)}</span>
                                {/* Debug: {console.log('Fecha creación remito:', remito.fechaCreacion, 'Tipo:', typeof remito.fechaCreacion, 'Es array:', Array.isArray(remito.fechaCreacion))} */}
                              </div>
                            </div>
                            <div style={{
                              display: 'flex',
                              gap: '0.5rem',
                              flexDirection: isMobile ? 'column' : 'row'
                            }}>
                              <button
                                onClick={() => exportarRemito(remito)}
                                style={{
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.5rem',
                                  padding: '0.5rem 1rem',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                📄 Exportar
                              </button>
                              <button
                                onClick={() => setRemitoSeleccionado(remito)}
                                style={{
                                  background: '#059669',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.5rem',
                                  padding: '0.5rem 1rem',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                👁️ Ver
                              </button>
                              <button
                                onClick={() => eliminarRemito(remito.id)}
                                style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.5rem',
                                  padding: '0.5rem 1rem',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                🗑️ Eliminar
                              </button>
                            </div>
                          </div>
                          
                          {remito.observaciones && (
                            <div style={{
                              background: '#f8fafc',
                              borderRadius: '0.5rem',
                              padding: '0.75rem',
                              marginBottom: '1rem',
                              border: '1px solid #e2e8f0'
                            }}>
                              <p style={{
                                color: '#64748b',
                                fontSize: '0.875rem',
                                margin: 0,
                                fontStyle: 'italic'
                              }}>
                                💬 {remito.observaciones}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Detalles de Remito */}
      {remitoSeleccionado && (
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
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header del Modal */}
            <div style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: 'white',
              padding: '1.5rem 2rem',
              borderTopLeftRadius: '1rem',
              borderTopRightRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  margin: 0,
                  marginBottom: '0.5rem'
                }}>
                  Remito #{remitoSeleccionado.numeroRemito}
                </h2>
                <p style={{
                  fontSize: '0.875rem',
                  margin: 0,
                  opacity: 0.9
                }}>
                  {formatearFechaConHoy(remitoSeleccionado.fechaRemito, 'completa')} • {remitoSeleccionado.detalles.length} productos
                </p>
              </div>
              <button
                onClick={() => setRemitoSeleccionado(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                ✕
              </button>
            </div>

            {/* Contenido del Modal */}
            <div style={{
              padding: '2rem',
              overflow: 'auto',
              flex: 1
            }}>
              {/* Información del remito */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '2rem',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 1rem 0'
                }}>
                  📋 Información del Remito
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem'
                }}>
                  <div>
                    <label style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#64748b',
                      display: 'block',
                      marginBottom: '0.25rem'
                    }}>
                      Número de Remito
                    </label>
                    <p style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#1e293b',
                      margin: 0
                    }}>
                      #{remitoSeleccionado.numeroRemito}
                    </p>
                  </div>
                  <div>
                    <label style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#64748b',
                      display: 'block',
                      marginBottom: '0.25rem'
                    }}>
                      Fecha del Remito
                    </label>
                    <p style={{
                      fontSize: '1rem',
                      color: '#1e293b',
                      margin: 0
                    }}>
                      {formatearFechaConHoy(remitoSeleccionado.fechaRemito, 'completa')}
                    </p>
                  </div>
                  <div>
                    <label style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#64748b',
                      display: 'block',
                      marginBottom: '0.25rem'
                    }}>
                      Total de Unidades
                    </label>
                    <p style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#059669',
                      margin: 0
                    }}>
                      {remitoSeleccionado.totalProductos}
                    </p>
                  </div>
                  <div>
                    <label style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#64748b',
                      display: 'block',
                      marginBottom: '0.25rem'
                    }}>
                      Productos Diferentes
                    </label>
                    <p style={{
                      fontSize: '1rem',
                      color: '#1e293b',
                      margin: 0
                    }}>
                      {remitoSeleccionado.detalles.length}
                    </p>
                  </div>
                </div>
                {remitoSeleccionado.observaciones && (
                  <div style={{ marginTop: '1rem' }}>
                    <label style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#64748b',
                      display: 'block',
                      marginBottom: '0.25rem'
                    }}>
                      Observaciones
                    </label>
                    <p style={{
                      fontSize: '1rem',
                      color: '#1e293b',
                      margin: 0,
                      fontStyle: 'italic'
                    }}>
                      {remitoSeleccionado.observaciones}
                    </p>
                  </div>
                )}
              </div>

              {/* Lista de productos */}
              <div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 1rem 0'
                }}>
                  📦 Productos del Remito
                </h3>
                <div style={{
                  background: 'white',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden'
                }}>
                  {remitoSeleccionado.detalles.map((detalle, index) => (
                    <div
                      key={detalle.id}
                      style={{
                        padding: '1rem',
                        borderBottom: index < remitoSeleccionado.detalles.length - 1 ? '1px solid #f1f5f9' : 'none',
                        background: index % 2 === 0 ? 'white' : '#f8fafc'
                      }}
                    >
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
                        gap: '1rem',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{
                            fontWeight: '600',
                            color: '#1e293b',
                            fontSize: '0.875rem',
                            marginBottom: '0.25rem'
                          }}>
                            {detalle.descripcion}
                          </div>
                          {detalle.codigoPersonalizado && (
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#64748b'
                            }}>
                              Código: {detalle.codigoPersonalizado}
                            </div>
                          )}
                        </div>
                        <div>
                          <label style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#64748b',
                            display: 'block',
                            marginBottom: '0.25rem'
                          }}>
                            Cantidad
                          </label>
                          <span style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#059669'
                          }}>
                            {detalle.cantidad}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
