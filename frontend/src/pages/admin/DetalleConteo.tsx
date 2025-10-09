import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
import { API_CONFIG } from '../../config/api';
import { toast } from 'react-toastify';

interface DetalleConteoData {
  id: number;
  cantidadConteo1: number;
  cantidadConteo2: number;
  formulaCalculo1: string;
  formulaCalculo2: string;
  diferenciaEntreConteos: number;
  nombreProducto: string;
  codigoProducto: string;
  categoria: string;
  marca: string;
  stockSistema: number;
  precioUnitario: number;
  fechaCreacion: string;
}

interface ConteoSectorInfo {
  id: number;
  sectorNombre: string;
  sectorDescripcion: string;
  usuario1Id: number;
  usuario2Id: number;
  usuario1Nombre: string;
  usuario2Nombre: string;
  estado: string;
  fechaInicio: string;
  fechaFinalizacion: string;
  productosContados: number;
  totalProductos: number;
}

const DetalleConteo: React.FC = () => {
  const { conteoId } = useParams<{ conteoId: string }>();
  const navigate = useNavigate();
  const { datosUsuario } = useUsuarioActual();
  const { isMobile } = useResponsive();
  
  const [detallesConteo, setDetallesConteo] = useState<DetalleConteoData[]>([]);
  const [conteoSectorInfo, setConteoSectorInfo] = useState<ConteoSectorInfo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [filtroProductos, setFiltroProductos] = useState('');
  const [filtroDiferencia, setFiltroDiferencia] = useState<'TODOS' | 'CON_DIFERENCIA' | 'SIN_DIFERENCIA'>('TODOS');

  useEffect(() => {
    if (conteoId && datosUsuario) {
      cargarDetalleConteo();
    }
  }, [conteoId, datosUsuario]);

  const cargarDetalleConteo = async () => {
    try {
      setCargando(true);
      console.log('🔍 Cargando detalle del conteo para ID:', conteoId);
      
      // Obtener token de autenticación
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const baseUrl = API_CONFIG.getBaseUrl();
      
      // Cargar información del conteo sector
      const responseConteo = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/conteos-sector/${conteoId}/info`, {
        headers
      });
      
      if (!responseConteo.ok) {
        throw new Error(`Error cargando información del conteo: ${responseConteo.status}`);
      }
      
      const conteoData = await responseConteo.json();
      console.log('✅ Información del conteo cargada:', conteoData);
      setConteoSectorInfo(conteoData);
      
      // Cargar detalles del conteo
      const responseDetalles = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/conteos-sector/${conteoId}/detalles`, {
        headers
      });
      
      if (!responseDetalles.ok) {
        throw new Error(`Error cargando detalles del conteo: ${responseDetalles.status}`);
      }
      
      const detallesData = await responseDetalles.json();
      console.log('✅ Detalles del conteo cargados:', detallesData);
      
      if (Array.isArray(detallesData)) {
        setDetallesConteo(detallesData);
      } else {
        console.log('⚠️ Respuesta no es un array:', detallesData);
        setDetallesConteo([]);
      }
      
    } catch (error) {
      console.error('❌ Error cargando detalle del conteo:', error);
      toast.error('Error al cargar el detalle del conteo');
    } finally {
      setCargando(false);
    }
  };

  const productosFiltrados = detallesConteo.filter(detalle => {
    // Filtro por texto
    const filtro = filtroProductos.toLowerCase();
    const coincideTexto = (
      detalle.nombreProducto?.toLowerCase().includes(filtro) ||
      detalle.codigoProducto?.toLowerCase().includes(filtro) ||
      detalle.categoria?.toLowerCase().includes(filtro) ||
      detalle.marca?.toLowerCase().includes(filtro)
    );
    
    // Filtro por diferencia
    const diferencia = calcularDiferencia(detalle.cantidadConteo1, detalle.cantidadConteo2);
    const tieneDiferencia = diferencia !== 0;
    
    let coincideDiferencia = true;
    if (filtroDiferencia === 'CON_DIFERENCIA') {
      coincideDiferencia = tieneDiferencia;
    } else if (filtroDiferencia === 'SIN_DIFERENCIA') {
      coincideDiferencia = !tieneDiferencia;
    }
    
    return coincideTexto && coincideDiferencia;
  });

  const calcularDiferencia = (cantidad1: number, cantidad2: number) => {
    return cantidad1 - cantidad2;
  };

  const formatearFecha = (fecha: string) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleString('es-ES');
  };

  if (cargando) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        fontSize: '1.2rem',
        color: '#6b7280'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <div>Cargando detalle del conteo...</div>
        </div>
      </div>
    );
  }

  if (!conteoSectorInfo) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        fontSize: '1.2rem',
        color: '#ef4444'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
          <div>No se pudo cargar la información del conteo</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? '1rem' : '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: isMobile ? '1rem' : '2rem',
        borderRadius: '1rem',
        marginBottom: isMobile ? '1rem' : '2rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: isMobile ? '0.75rem' : '1rem',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: '0.5rem'
        }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: isMobile ? '1.3rem' : '2rem', 
            fontWeight: 'bold',
            flex: isMobile ? '1 1 100%' : '1'
          }}>
            📋 Detalle del Conteo
          </h1>
          <button
            onClick={() => navigate('/admin/inventario-completo')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '0.5rem',
              padding: isMobile ? '0.6rem 1rem' : '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }}
          >
            ← Volver
          </button>
        </div>
        
        {/* Información organizada para móvil / desktop */}
        {isMobile ? (
          /* Vista móvil - Layout compacto */
          <div style={{ position: 'relative' }}>
            {/* Estado en esquina superior derecha */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: conteoSectorInfo.estado === 'COMPLETADO' ? '#10b981' : '#f59e0b',
              color: 'white',
              padding: '0.4rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: '700',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              {conteoSectorInfo.estado === 'COMPLETADO' ? '✅ Completado' :
               conteoSectorInfo.estado === 'CON_DIFERENCIAS' ? '⚠️ Con Diferencias' :
               conteoSectorInfo.estado}
            </div>

            {/* Contenido principal */}
            <div style={{ paddingTop: '2.5rem' }}>
              {/* Sector */}
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.25rem' }}>📍 Sector</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>{conteoSectorInfo.sectorNombre}</div>
              </div>

              {/* Productos Contados */}
              <div style={{ 
                background: 'rgba(255,255,255,0.2)',
                padding: '0.6rem',
                borderRadius: '0.5rem',
                marginBottom: '0.75rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.15rem' }}>Productos Contados</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700' }}>
                  {conteoSectorInfo.productosContados} / {conteoSectorInfo.totalProductos}
                </div>
              </div>

              {/* Usuarios - Una fila horizontal compacta */}
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '0.5rem',
                padding: '0.6rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                justifyContent: 'space-between'
              }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: '600' }}>👥 Usuarios:</div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  flex: 1,
                  justifyContent: 'flex-end'
                }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.3)',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {conteoSectorInfo.usuario1Nombre?.split(' ')[0] || 'U1'}
                  </div>
                  <div style={{ opacity: 0.7, fontSize: '0.7rem' }}>•</div>
                  <div style={{
                    background: 'rgba(255,255,255,0.3)',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {conteoSectorInfo.usuario2Nombre?.split(' ')[0] || 'U2'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Vista desktop - Grid tradicional */
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem' 
          }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.75rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.15rem' }}>Sector</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{conteoSectorInfo.sectorNombre}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.75rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.15rem' }}>Estado</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                {conteoSectorInfo.estado === 'COMPLETADO' ? '✅ Completado' :
                 conteoSectorInfo.estado === 'CON_DIFERENCIAS' ? '⚠️ Con Diferencias' :
                 conteoSectorInfo.estado}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.75rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.15rem' }}>Usuario 1</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{conteoSectorInfo.usuario1Nombre}</div>
          </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.75rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.15rem' }}>Usuario 2</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{conteoSectorInfo.usuario2Nombre}</div>
          </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.75rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.15rem' }}>Productos</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              {conteoSectorInfo.productosContados} / {conteoSectorInfo.totalProductos}
            </div>
          </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.75rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.15rem' }}>Fecha Finalización</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              {formatearFecha(conteoSectorInfo.fechaFinalizacion)}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Filtros de productos */}
      <div style={{
        background: 'white',
        padding: isMobile ? '1rem' : '1.5rem',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        marginBottom: isMobile ? '1rem' : '1.5rem'
      }}>
        {/* Botones de filtro por diferencia */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1rem',
          flexWrap: 'wrap'
        }}>
          {[
            { key: 'TODOS', label: 'Todos', icon: '📦', color: '#6b7280' },
            { key: 'CON_DIFERENCIA', label: 'Con Diferencias', icon: '⚠️', color: '#ef4444' },
            { key: 'SIN_DIFERENCIA', label: 'Sin Diferencias', icon: '✅', color: '#10b981' }
          ].map(filtro => {
            const total = detallesConteo.filter(d => {
              const dif = calcularDiferencia(d.cantidadConteo1, d.cantidadConteo2);
              if (filtro.key === 'CON_DIFERENCIA') return dif !== 0;
              if (filtro.key === 'SIN_DIFERENCIA') return dif === 0;
              return true;
            }).length;

            return (
              <button
                key={filtro.key}
                onClick={() => setFiltroDiferencia(filtro.key as any)}
                style={{
                  flex: isMobile ? '1 1 auto' : '0 1 auto',
                  background: filtroDiferencia === filtro.key ? filtro.color : 'white',
                  color: filtroDiferencia === filtro.key ? 'white' : '#374151',
                  border: `2px solid ${filtro.color}`,
                  borderRadius: '0.5rem',
                  padding: isMobile ? '0.6rem 0.75rem' : '0.5rem 1rem',
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  minWidth: isMobile ? '0' : 'auto'
                }}
                onMouseEnter={(e) => {
                  if (filtroDiferencia !== filtro.key) {
                    e.currentTarget.style.background = `${filtro.color}15`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (filtroDiferencia !== filtro.key) {
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                <span>{filtro.icon}</span>
                <span>{isMobile ? filtro.label.split(' ')[0] : filtro.label}</span>
                <span style={{
                  background: filtroDiferencia === filtro.key ? 'rgba(255,255,255,0.3)' : filtro.color,
                  color: filtroDiferencia === filtro.key ? 'white' : 'white',
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.4rem',
                  borderRadius: '0.25rem',
                  fontWeight: 'bold',
                  minWidth: '1.5rem',
                  textAlign: 'center'
                }}>
                  {total}
                </span>
              </button>
            );
          })}
        </div>

        {/* Campo de búsqueda */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? '0.5rem' : '1rem',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          {!isMobile && (
          <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#374151' }}>
              🔍 Buscar:
          </div>
          )}
          <input
            type="text"
            placeholder={isMobile ? "🔍 Buscar producto..." : "Buscar por nombre, código, categoría o marca..."}
            value={filtroProductos}
            onChange={(e) => setFiltroProductos(e.target.value)}
            style={{
              flex: 1,
              width: isMobile ? '100%' : 'auto',
              padding: isMobile ? '0.75rem' : '0.75rem',
              border: '2px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: isMobile ? '0.95rem' : '1rem',
              outline: 'none',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#8b5cf6';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
            }}
          />
        </div>
      </div>

      {/* Lista de productos - Tabla (desktop) / Cards (móvil) */}
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        overflow: 'hidden'
      }}>
        <div style={{
          background: '#f8fafc',
          padding: isMobile ? '0.75rem 1rem' : '1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: isMobile ? '1rem' : '1.25rem', 
            fontWeight: '600', 
            color: '#374151' 
          }}>
            📦 Productos ({productosFiltrados.length})
          </h2>
        </div>

        {productosFiltrados.length === 0 ? (
          <div style={{
            padding: isMobile ? '2rem 1rem' : '3rem',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: isMobile ? '0.95rem' : '1.1rem'
          }}>
            <div style={{ fontSize: isMobile ? '2rem' : '3rem', marginBottom: '1rem' }}>📦</div>
            <div>No se encontraron productos</div>
          </div>
        ) : isMobile ? (
          /* Vista de cards para móvil */
          <div style={{ padding: '0.5rem' }}>
            {productosFiltrados.map((detalle, index) => {
              const diferencia = calcularDiferencia(detalle.cantidadConteo1, detalle.cantidadConteo2);
              const tieneDiferencia = diferencia !== 0;
              
              return (
                <div
                  key={detalle.id}
                  style={{
                    background: index % 2 === 0 ? 'white' : '#fafbfc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.75rem',
                    padding: '0.75rem',
                    marginBottom: '0.75rem'
                  }}
                >
                  {/* Nombre del producto y código */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                      {detalle.nombreProducto}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {detalle.codigoProducto}
                    </div>
                  </div>

                  {/* Stock Sistema */}
                  <div style={{
                    background: '#f3f4f6',
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Stock Sistema:</span>
                    <span style={{ fontWeight: '600', color: '#374151' }}>
                      {detalle.stockSistema?.toLocaleString() || 0}
                    </span>
                  </div>

                  {/* Conteos de usuarios */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    {/* Usuario 1 */}
                    <div style={{
                      background: '#dbeafe',
                      padding: '0.5rem',
                      borderRadius: '0.375rem'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: '#1e40af', marginBottom: '0.15rem' }}>
                        Usuario 1
                      </div>
                      <div style={{ fontWeight: '700', color: '#1e40af', fontSize: '1.1rem' }}>
                        {detalle.cantidadConteo1?.toLocaleString() || 0}
                      </div>
                      {detalle.formulaCalculo1 && (
                        <div style={{
                          fontSize: '0.65rem',
                          color: '#0369a1',
                          marginTop: '0.15rem',
                          fontFamily: 'monospace',
                          background: '#f0f9ff',
                          padding: '0.15rem 0.25rem',
                          borderRadius: '0.2rem'
                        }}>
                          {detalle.formulaCalculo1}
                        </div>
                      )}
                    </div>

                    {/* Usuario 2 */}
                    <div style={{
                      background: '#dcfce7',
                      padding: '0.5rem',
                      borderRadius: '0.375rem'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: '#166534', marginBottom: '0.15rem' }}>
                        Usuario 2
                      </div>
                      <div style={{ fontWeight: '700', color: '#166534', fontSize: '1.1rem' }}>
                        {detalle.cantidadConteo2?.toLocaleString() || 0}
                      </div>
                      {detalle.formulaCalculo2 && (
                        <div style={{
                          fontSize: '0.65rem',
                          color: '#15803d',
                          marginTop: '0.15rem',
                          fontFamily: 'monospace',
                          background: '#f0fdf4',
                          padding: '0.15rem 0.25rem',
                          borderRadius: '0.2rem'
                        }}>
                          {detalle.formulaCalculo2}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Diferencia */}
                  <div style={{
                    background: tieneDiferencia ? '#fef2f2' : '#f0fdf4',
                    color: tieneDiferencia ? '#dc2626' : '#16a34a',
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    fontWeight: '600',
                    textAlign: 'center',
                    fontSize: '0.9rem'
                  }}>
                    {tieneDiferencia ? '⚠️' : '✅'} Diferencia: {diferencia > 0 ? '+' : ''}{diferencia}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Vista de tabla para desktop */
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.9rem'
            }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    Producto
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    Stock Sistema
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    Usuario 1
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    Fórmula Usuario 1
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    Usuario 2
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    Fórmula Usuario 2
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    Diferencia
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map((detalle, index) => {
                  const diferencia = calcularDiferencia(detalle.cantidadConteo1, detalle.cantidadConteo2);
                  const tieneDiferencia = diferencia !== 0;
                  
                  return (
                    <tr key={detalle.id} style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: index % 2 === 0 ? 'white' : '#fafbfc'
                    }}>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
                            {detalle.nombreProducto}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                            <div>Código: {detalle.codigoProducto}</div>
                            <div>Categoría: {detalle.categoria}</div>
                            <div>Marca: {detalle.marca}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{
                          background: '#f3f4f6',
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          fontWeight: '600',
                          color: '#374151'
                        }}>
                          {detalle.stockSistema?.toLocaleString() || 0}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{
                          background: '#dbeafe',
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          fontWeight: '600',
                          color: '#1e40af'
                        }}>
                          {detalle.cantidadConteo1?.toLocaleString() || 0}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{
                          background: '#f0f9ff',
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.8rem',
                          color: '#0369a1',
                          fontFamily: 'monospace'
                        }}>
                          {detalle.formulaCalculo1 || 'Sin fórmula'}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{
                          background: '#dcfce7',
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          fontWeight: '600',
                          color: '#166534'
                        }}>
                          {detalle.cantidadConteo2?.toLocaleString() || 0}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{
                          background: '#f0fdf4',
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.8rem',
                          color: '#15803d',
                          fontFamily: 'monospace'
                        }}>
                          {detalle.formulaCalculo2 || 'Sin fórmula'}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{
                          background: tieneDiferencia ? '#fef2f2' : '#f0fdf4',
                          color: tieneDiferencia ? '#dc2626' : '#16a34a',
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          fontWeight: '600'
                        }}>
                          {diferencia > 0 ? '+' : ''}{diferencia}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#6b7280'
                        }}>
                          {formatearFecha(detalle.fechaCreacion)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetalleConteo;
