import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
import ApiService from '../../services/api';
import type { Producto } from '../../types';

interface HistorialCargaProductos {
  id: number;
  productoId: number;
  productoNombre: string;
  productoDescripcion: string;
  productoMarca: string;
  productoCategoria: string;
  productoUnidad: string;
  codigoBarras: string;
  usuarioId: number;
  usuarioNombre: string;
  usuarioApellidos: string;
  empresaId: number;
  empresaNombre: string;
  tipoOperacion: string;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  precioUnitario: number;
  valorTotal: number;
  fechaOperacion: string;
}

interface FiltrosHistorial {
  productoId: number | null;
  tipoOperacion: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  codigoBarras: string | null;
}

interface Estadisticas {
  totalOperaciones: number;
  operacionesHoy: number;
  valorTotalOperaciones: number;
  operacionesPorTipo: Array<{ tipo: string; cantidad: number }>;
}

export default function HistorialCargaProductos() {
  const navigate = useNavigate();
  const { datosUsuario, cerrarSesion, cargando: cargandoUsuario } = useUsuarioActual();
  const { isMobile } = useResponsive();

  const [historial, setHistorial] = useState<HistorialCargaProductos[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [tiposOperacion, setTiposOperacion] = useState<string[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [historialLength, setHistorialLength] = useState(0);
  const [filtros, setFiltros] = useState<FiltrosHistorial>({
    productoId: null,
    tipoOperacion: null,
    fechaInicio: null,
    fechaFin: null,
    codigoBarras: null,
  });

  useEffect(() => {
    console.log('🔄 useEffect ejecutado, datosUsuario:', datosUsuario);
    if (datosUsuario?.empresaId) {
      console.log('✅ EmpresaId encontrado:', datosUsuario.empresaId);
      cargarDatos();
    } else {
      console.log('❌ No hay empresaId disponible');
    }
    // eslint-disable-next-line
  }, [datosUsuario?.empresaId]);

  const cargarDatos = async () => {
    console.log('🚀 Iniciando carga de datos...');
    setCargando(true);
    try {
      console.log('📋 Ejecutando Promise.all...');
      await Promise.all([
        cargarHistorial(0),
        cargarProductos(),
        cargarTiposOperacion(),
        cargarEstadisticas(),
      ]);
      console.log('✅ Todos los datos cargados exitosamente');
    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  const cargarHistorial = async (paginaActual: number = 0) => {
    try {
      console.log('🔍 [DEBUG] EmpresaId:', datosUsuario?.empresaId);
      console.log('🔍 [DEBUG] Filtros enviados:', filtros);
      console.log('🔍 [DEBUG] Página actual:', paginaActual);
      const response = await ApiService.obtenerHistorialCargaProductos(
        datosUsuario?.empresaId || 0,
        paginaActual,
        20,
        {
          fechaInicio: filtros.fechaInicio || undefined,
          fechaFin: filtros.fechaFin || undefined,
          tipoOperacion: filtros.tipoOperacion || undefined,
          productoId: filtros.productoId || undefined,
          codigoBarras: filtros.codigoBarras || undefined,
        }
      );
      console.log('🔍 [DEBUG] Respuesta de historial:', response);
      console.log('📦 Respuesta completa:', response);
      console.log('📦 Response.data:', response.data);
      console.log('📦 Response.data.contenido:', response.data?.contenido);
      console.log('📦 Response.data.totalElementos:', response.data?.totalElementos);
      console.log('📦 Response.data.totalPaginas:', response.data?.totalPaginas);
      
      // La API devuelve directamente el objeto, no envuelto en ApiResponse
      const datos = response.data || response;
      console.log('📦 Datos extraídos:', datos);
      
      if (datos && (datos as any).contenido) {
        console.log('✅ Datos del historial:', datos);
        console.log('✅ Contenido del historial:', (datos as any).contenido);
        console.log('✅ Longitud del contenido:', (datos as any).contenido?.length);
        
        setHistorial((datos as any).contenido || []);
        setTotalPaginas((datos as any).totalPaginas || 0);
        setHistorialLength((datos as any).totalElementos || 0);
        setPagina(paginaActual);
        
        console.log('✅ Estado actualizado - historial.length:', (datos as any).contenido?.length);
      } else {
        console.error('❌ Respuesta sin datos válidos:', response);
      }
    } catch (error) {
      console.error('❌ Error al cargar historial:', error);
      toast.error('Error al cargar el historial');
    }
  };

  const cargarProductos = async () => {
    try {
      const response = await ApiService.obtenerTodosLosProductos(datosUsuario?.empresaId || 0);
      if (response.data) {
        setProductos(response.data || []);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const cargarTiposOperacion = async () => {
    try {
      // Como no hay un endpoint específico para tipos de operación, usamos valores hardcodeados
      setTiposOperacion(['CARGA_INICIAL', 'INCREMENTO', 'DECREMENTO', 'AJUSTE']);
    } catch (error) {
      console.error('Error al cargar tipos de operación:', error);
    }
  };

  const cargarEstadisticas = async () => {
    console.log('🚀 INICIO cargarEstadisticas');
    setCargandoEstadisticas(true);
    try {
      console.log('📊 Cargando estadísticas...');
      const response = await ApiService.obtenerEstadisticasHistorialCarga(datosUsuario?.empresaId || 0);
      console.log('📊 Respuesta de estadísticas:', response);
      console.log('📊 Response.data:', response.data);
      
      if (response.data) {
        console.log('✅ Estadísticas cargadas:', response.data);
        console.log('✅ Estructura completa de estadísticas:', JSON.stringify(response.data, null, 2));
        
        // Calcular operaciones de hoy desde ultimasOperaciones
        const hoy = new Date().toDateString();
        const operacionesHoy = (response.data as any).ultimasOperaciones ? 
          (response.data as any).ultimasOperaciones.filter((op: any) => 
            new Date(op.fechaOperacion || op.fechaCreacion).toDateString() === hoy
          ).length : 0;
        
        console.log('📅Operaciones de hoy calculadas:', operacionesHoy);
        
        // Mapear la estructura de la API a la estructura esperada por el frontend
        const estadisticasMapeadas = {
          totalOperaciones: (response.data as any).totalOperaciones || 0,
          operacionesHoy: operacionesHoy,
          operacionesEstaSemana: (response.data as any).operacionesEstaSemana || 0,
          operacionesEsteMes: (response.data as any).operacionesEsteMes || 0,
          valorTotalOperaciones: (response.data as any).totalValorCargado || 0,
          productosMasCargados: (response.data as any).productosMasCargados || [],
          usuariosMasActivos: (response.data as any).usuariosMasActivos || [],
          operacionesPorTipo: (response.data as any).operacionesPorTipo ? Object.entries((response.data as any).operacionesPorTipo).map(([tipo, cantidad]: [string, any]) => ({ tipo, cantidad })) : []
        };
        console.log('✅ Estadísticas mapeadas:', estadisticasMapeadas);
        setEstadisticas(estadisticasMapeadas as any);
      } else {
        console.error('❌ Estadísticas sin datos:', response);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
    setCargandoEstadisticas(false);
    console.log('🏁 FIN cargarEstadisticas');
  };

  const limpiarFiltros = () => {
    setFiltros({ productoId: null, tipoOperacion: null, fechaInicio: null, fechaFin: null, codigoBarras: null });
    cargarHistorial(0);
  };

  const aplicarFiltros = () => {
    cargarHistorial(0);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const obtenerColorTipoOperacion = (tipo: string) => {
    switch (tipo) {
      case 'CARGA_INICIAL': return '#10b981';
      case 'INCREMENTO': return '#3b82f6';
      case 'DECREMENTO': return '#ef4444';
      case 'AJUSTE': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const cerrarSesionConToast = () => {
    toast.success('Sesión cerrada correctamente');
    cerrarSesion();
  };

  // Debug: log del estado actual
  console.log('🎯 Render - historial.length:', historial.length);
  console.log('🎯 Render - historial:', historial);
  console.log('🎯 Render - historialLength:', historialLength);
  console.log('🎯 Render - cargando:', cargando);
  console.log('🎯 Render - datosUsuario:', datosUsuario);
  console.log('🎯 Render - datosUsuario?.empresaId:', datosUsuario?.empresaId);
  console.log('🎯 Render - cargandoUsuario:', cargandoUsuario);
  console.log('🎯 Render - estadisticas:', estadisticas);
  console.log('🎯 Render - cargandoEstadisticas:', cargandoEstadisticas);
  
  // Log temporal para ver estructura del historial
  if (historial.length > 0) {
    console.log('📋 Estructura del primer registro:', JSON.stringify(historial[0], null, 2));
  }

  if (cargandoUsuario) {
    return (
      <div className="h-pantalla-minimo pagina-con-navbar" style={{ backgroundColor: 'var(--color-fondo)' }}>
        <div className="contenedor" style={{
          paddingTop: isMobile ? '10.5rem' : '5rem',
          paddingBottom: '2rem',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e2e8f0',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}></div>
            <p style={{ color: '#64748b', fontSize: '16px' }}>
              Cargando datos del usuario...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (cargando && historial.length === 0) {
    return (
      <div className="h-pantalla-minimo pagina-con-navbar" style={{ backgroundColor: 'var(--color-fondo)' }}>
        <NavbarAdmin
          onCerrarSesion={cerrarSesionConToast}
          empresaNombre={datosUsuario?.empresaNombre}
          nombreAdministrador={datosUsuario?.nombre}
        />
        <div className="contenedor" style={{
          paddingTop: isMobile ? '10.5rem' : '5rem',
          paddingBottom: '2rem',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e2e8f0',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}></div>
            <p style={{ color: '#64748b', fontSize: '16px' }}>
              Cargando historial de carga de productos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-pantalla-minimo pagina-con-navbar" style={{ backgroundColor: 'var(--color-fondo)' }}>
      <NavbarAdmin
        onCerrarSesion={cerrarSesionConToast}
        empresaNombre={datosUsuario?.empresaNombre}
        nombreAdministrador={datosUsuario?.nombre}
      />
      <div className="contenedor" style={{
        paddingTop: isMobile ? '10.5rem' : '5rem',
        paddingBottom: '2rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
      }}>
        {/* Navegación superior */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/admin/productos')}
            className="boton boton-secundario"
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            ← Volver a Productos
          </button>
        </div>
        {/* Header */}
        <div className="mb-8" style={{ textAlign: isMobile ? 'center' : 'left' }}>
          <h1 className="titulo-2" style={{
            fontSize: isMobile ? '1.75rem' : '2rem',
            fontWeight: 700,
            color: '#1e293b',
            letterSpacing: '-0.025em',
            lineHeight: '1.25',
          }}>
            📦 Historial de Carga de Productos
          </h1>
          <p className="texto-gris" style={{
            fontSize: isMobile ? '1rem' : '0.875rem',
            color: '#64748b',
            marginBottom: '8px',
          }}>
            Control y seguimiento de todas las operaciones de carga de inventario.
          </p>
          <div style={{
            height: '4px',
            width: '60px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            borderRadius: '2px',
            marginTop: '16px',
            marginLeft: isMobile ? 'auto' : '0',
            marginRight: isMobile ? 'auto' : '0',
          }}></div>
        </div>
        {/* Estadísticas */}
        {!cargandoEstadisticas && estadisticas && (
          <div className="tarjeta mb-6" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: isMobile ? '16px' : '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}>
            <h3 className="titulo-3" style={{
              fontSize: isMobile ? '1.125rem' : '1.5rem',
              fontWeight: 600,
              color: '#1e293b',
              marginBottom: '16px',
              textAlign: 'center',
            }}>
              📊 Estadísticas Generales
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
              gap: isMobile ? '0.75rem' : '1rem',
            }}>
              <div style={{
                background: 'white',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: '#3b82f6' }}>
                  {estadisticas.totalOperaciones || 0}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>Total Operaciones</div>
              </div>
              <div style={{
                background: 'white',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: '#10b981' }}>
                  {estadisticas.operacionesHoy || 0}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>Operaciones Hoy</div>
              </div>
              <div style={{
                background: 'white',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: 700, color: '#8b5cf6' }}>
                  ${(estadisticas.valorTotalOperaciones || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>Valor Total</div>
              </div>
              <div style={{
                background: 'white',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: '#f59e0b' }}>
                  {estadisticas.operacionesPorTipo?.length || 0}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>Tipos de Operación</div>
              </div>
            </div>
          </div>
        )}
        {/* Filtros */}
        <div className="tarjeta mb-6" style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: isMobile ? '16px' : '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: mostrarFiltros ? '16px' : '0',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            <h3 className="titulo-3" style={{
              fontSize: isMobile ? '1.125rem' : '1.5rem',
              fontWeight: 600,
              color: '#1e293b',
              margin: 0,
            }}>
              🔍 Filtros de Búsqueda
            </h3>
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="boton boton-secundario"
              style={{
                background: 'white',
                color: '#3b82f6',
                border: '2px solid #3b82f6',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {mostrarFiltros ? '👁️ Ocultar Filtros' : '👁️ Mostrar Filtros'}
            </button>
          </div>
          {mostrarFiltros && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
                gap: '12px',
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Producto</label>
                  <select
                    value={filtros.productoId || ''}
                    onChange={e => setFiltros(prev => ({ ...prev, productoId: e.target.value ? Number(e.target.value) : null }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', background: 'white' }}
                  >
                    <option value="">Todos los productos</option>
                    {productos.map(producto => (
                      <option key={producto.id} value={producto.id}>{producto.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Tipo de Operación</label>
                  <select
                    value={filtros.tipoOperacion || ''}
                    onChange={e => setFiltros(prev => ({ ...prev, tipoOperacion: e.target.value || null }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', background: 'white' }}
                  >
                    <option value="">Todos los tipos</option>
                    {tiposOperacion.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Código de Barras</label>
                  <input
                    type="text"
                    value={filtros.codigoBarras || ''}
                    onChange={e => setFiltros(prev => ({ ...prev, codigoBarras: e.target.value || null }))}
                    placeholder="Buscar por código..."
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', background: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Fecha Inicio</label>
                  <input
                    type="datetime-local"
                    value={filtros.fechaInicio || ''}
                    onChange={e => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value || null }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', background: 'white' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '12px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>Fecha Fin</label>
                  <input
                    type="datetime-local"
                    value={filtros.fechaFin || ''}
                    onChange={e => setFiltros(prev => ({ ...prev, fechaFin: e.target.value || null }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', background: 'white' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                  <button
                    onClick={aplicarFiltros}
                    className="boton boton-primario"
                    style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', width: isMobile ? '100%' : 'auto' }}
                  >
                    🔍 Aplicar Filtros
                  </button>
                  <button
                    onClick={limpiarFiltros}
                    className="boton boton-secundario"
                    style={{ background: 'white', color: '#ef4444', border: '2px solid #ef4444', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', width: isMobile ? '100%' : 'auto' }}
                  >
                    🗑️ Limpiar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Tabla de historial */}
        <div className="tarjeta mb-6" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid #e2e8f0', borderRadius: '16px', padding: isMobile ? '16px' : '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 className="titulo-3" style={{ fontSize: isMobile ? '1.125rem' : '1.5rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
              📋 Historial de Operaciones ({historialLength})
            </h3>
          </div>
          {historial.length > 0 ? (
            isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {historial.map((item) => (
                  <div key={item.id} style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '16px', marginBottom: '4px' }}>{item.productoNombre}</div>
                        <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>{item.productoMarca} • {item.productoCategoria}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{item.codigoBarras}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: 'white', background: obtenerColorTipoOperacion(item.tipoOperacion) }}>{item.tipoOperacion}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Cantidad</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{item.cantidad} {item.productoUnidad}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Valor</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#059669' }}>${item.valorTotal.toLocaleString()}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Stock Anterior</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{item.stockAnterior}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Stock Nuevo</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{item.stockNuevo}</div>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{formatearFecha(item.fechaOperacion)}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {item.usuarioNombre ? `${item.usuarioNombre} ${item.usuarioApellidos}` : 'No disponible'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Producto</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Tipo</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Cantidad</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Stock</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Valor</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Usuario</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.2s' }}>
                        <td style={{ padding: '12px' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.productoNombre}</div>
                            <div style={{ fontSize: '14px', color: '#64748b' }}>{item.productoMarca} • {item.productoCategoria}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{item.codigoBarras}</div>
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: 'white', background: obtenerColorTipoOperacion(item.tipoOperacion), display: 'inline-block' }}>{item.tipoOperacion}</div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#1e293b' }}>{item.cantidad} {item.productoUnidad}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '14px', color: '#64748b' }}>{item.stockAnterior} → {item.stockNuevo}</div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#059669' }}>${item.valorTotal.toLocaleString()}</td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
                          {item.usuarioNombre ? `${item.usuarioNombre} ${item.usuarioApellidos}` : 'No disponible'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>{formatearFecha(item.fechaOperacion)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>No hay operaciones registradas</h4>
              <p style={{ margin: 0, fontSize: '14px' }}>Realiza operaciones de carga de productos para ver el historial aquí.</p>
            </div>
          )}
          {/* Paginación */}
          {totalPaginas > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px', flexWrap: 'wrap' }}>
              <button
                onClick={() => cargarHistorial(pagina - 1)}
                disabled={pagina === 0}
                style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', background: pagina === 0 ? '#f3f4f6' : 'white', color: pagina === 0 ? '#93a3b8' : '#1e293b', cursor: pagina === 0 ? 'not-allowed' : 'pointer', fontSize: '14px' }}
              >
                ← Anterior
              </button>
              <span style={{ fontSize: '14px', color: '#64748b' }}>
                Página {pagina + 1} de {totalPaginas}
              </span>
              <button
                onClick={() => cargarHistorial(pagina + 1)}
                disabled={pagina >= totalPaginas - 1}
                style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', background: pagina >= totalPaginas - 1 ? '#f3f4f6' : 'white', color: pagina >= totalPaginas - 1 ? '#93a3b8' : '#1e293b', cursor: pagina >= totalPaginas - 1 ? 'not-allowed' : 'pointer', fontSize: '14px' }}
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 