import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import ApiService from '../../services/api';
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
  
  const [detallesConteo, setDetallesConteo] = useState<DetalleConteoData[]>([]);
  const [conteoSectorInfo, setConteoSectorInfo] = useState<ConteoSectorInfo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [filtroProductos, setFiltroProductos] = useState('');

  useEffect(() => {
    if (conteoId && datosUsuario) {
      cargarDetalleConteo();
    }
  }, [conteoId, datosUsuario]);

  const cargarDetalleConteo = async () => {
    try {
      setCargando(true);
      console.log('🔍 Cargando detalle del conteo para ID:', conteoId);
      
      // Cargar información del conteo sector
      const responseConteo = await ApiService.get(`/empresas/${datosUsuario.empresaId}/inventario-completo/conteos-sector/${conteoId}/info`);
      console.log('✅ Información del conteo cargada:', responseConteo);
      setConteoSectorInfo(responseConteo);
      
      // Cargar detalles del conteo
      const responseDetalles = await ApiService.get(`/empresas/${datosUsuario.empresaId}/inventario-completo/conteos-sector/${conteoId}/detalles`);
      console.log('✅ Detalles del conteo cargados:', responseDetalles);
      
      if (Array.isArray(responseDetalles)) {
        setDetallesConteo(responseDetalles);
      } else {
        console.log('⚠️ Respuesta no es un array:', responseDetalles);
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
    const filtro = filtroProductos.toLowerCase();
    return (
      detalle.nombreProducto?.toLowerCase().includes(filtro) ||
      detalle.codigoProducto?.toLowerCase().includes(filtro) ||
      detalle.categoria?.toLowerCase().includes(filtro) ||
      detalle.marca?.toLowerCase().includes(filtro)
    );
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
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '1rem',
        marginBottom: '2rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
            📋 Detalle del Conteo
          </h1>
          <button
            onClick={() => navigate('/admin/inventario-completo')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '0.5rem',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
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
            ← Volver al Inventario
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.25rem' }}>Sector</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{conteoSectorInfo.sectorNombre}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.25rem' }}>Estado</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              {conteoSectorInfo.estado === 'COMPLETADO' ? '✅ Completado' :
               conteoSectorInfo.estado === 'CON_DIFERENCIAS' ? '⚠️ Con Diferencias' :
               conteoSectorInfo.estado}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.25rem' }}>Usuario 1</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{conteoSectorInfo.usuario1Nombre}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.25rem' }}>Usuario 2</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{conteoSectorInfo.usuario2Nombre}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.25rem' }}>Productos Contados</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              {conteoSectorInfo.productosContados} / {conteoSectorInfo.totalProductos}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.25rem' }}>Fecha Finalización</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              {formatearFecha(conteoSectorInfo.fechaFinalizacion)}
            </div>
          </div>
        </div>
      </div>

      {/* Filtro de productos */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#374151' }}>
            🔍 Filtrar Productos:
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, código, categoría o marca..."
            value={filtroProductos}
            onChange={(e) => setFiltroProductos(e.target.value)}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '2px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '1rem',
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

      {/* Tabla de productos */}
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        overflow: 'hidden'
      }}>
        <div style={{
          background: '#f8fafc',
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#374151' }}>
            Productos Contados ({productosFiltrados.length})
          </h2>
        </div>

        {productosFiltrados.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '1.1rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <div>No se encontraron productos que coincidan con el filtro</div>
          </div>
        ) : (
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
