import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { toast } from 'react-toastify';
import { API_CONFIG } from '../../config/api';

interface ConteoIndividual {
  cantidad: number;
  formula: string;
  fecha: string;
}

interface DetalleConteo {
  id: number;
  producto: {
    id: number;
    nombre: string;
    codigoPersonalizado: string;
    stock: number;
  };
  stockSistema: number;
  cantidadConteo1: number;
  cantidadConteo2: number;
  formulaCalculo1: string;
  formulaCalculo2: string;
  diferenciaSistema: number;
  diferenciaEntreConteos: number;
  estado: string;
  conteosUsuario1?: ConteoIndividual[];
  conteosUsuario2?: ConteoIndividual[];
}

interface ConteoInfo {
  id: number;
  sectorId: number;
  sectorNombre: string;
  sectorDescripcion: string;
  usuario1Id: number;
  usuario1Nombre: string;
  usuario2Id: number;
  usuario2Nombre: string;
  estado: string;
  totalProductos: number;
  productosContados: number;
  productosConDiferencias: number;
  porcentajeCompletado: number;
}

const ComparacionConteos: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { datosUsuario } = useUsuarioActual();
  const [cargando, setCargando] = useState(true);
  const [conteoInfo, setConteoInfo] = useState<ConteoInfo | null>(null);
  const [detallesConteo, setDetallesConteo] = useState<DetalleConteo[]>([]);

  useEffect(() => {
    if (datosUsuario) {
      cargarDatos();
    }
  }, [datosUsuario, id]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      
      console.log('🔍 Cargando datos de comparación:', id);

      if (!datosUsuario?.empresaId || !id) {
        console.error('❌ Datos faltantes:', {
          empresaId: datosUsuario?.empresaId,
          id: id,
          datosUsuario: datosUsuario
        });
        toast.error('No se pudo obtener la información del conteo');
        return;
      }

      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Primero obtener el inventario activo
      const baseUrl = API_CONFIG.getBaseUrl();
      const inventarioResponse = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/activo`, {
        headers
      });

      if (!inventarioResponse.ok) {
        console.error('❌ Error cargando inventario activo:', inventarioResponse.status);
        toast.error('No hay inventario activo');
        return;
      }

      const inventarioData = await inventarioResponse.json();
      console.log('✅ Inventario activo cargado:', inventarioData);

      // Luego obtener los conteos de sector para encontrar el conteo específico
      const conteosResponse = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/${inventarioData.id}/conteos-sector`, {
        headers
      });

      if (!conteosResponse.ok) {
        console.error('❌ Error cargando conteos de sector:', conteosResponse.status);
        toast.error('Error al cargar los conteos de sector');
        return;
      }

      const conteosData = await conteosResponse.json();
      console.log('✅ Conteos de sector cargados:', conteosData);

      // Buscar el conteo específico por ID
      const conteoEspecifico = conteosData.find((conteo: any) => conteo.id === parseInt(id));
      
      if (!conteoEspecifico) {
        console.error('❌ Conteo de sector no encontrado:', id);
        toast.error('Conteo de sector no encontrado');
        return;
      }

      console.log('✅ Conteo específico encontrado:', conteoEspecifico);
      setConteoInfo(conteoEspecifico);

      // Cargar detalles consolidados para comparación
      console.log('🔍 Cargando detalles para comparación para ID:', id);
      const detallesResponse = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/conteos-sector/${id}/comparacion`, {
        headers
      });

      if (detallesResponse.ok) {
        const detallesData = await detallesResponse.json();
        console.log('✅ Detalles para comparación cargados:', detallesData);
        
        if (Array.isArray(detallesData)) {
          // El backend ya devuelve los datos en el formato correcto
          const detallesProcesados = detallesData.map(detalle => {
            // Crear objeto producto a partir de los campos individuales
            const productoObj = {
              id: detalle.productoId,
              nombre: detalle.nombreProducto || 'Producto sin nombre',
              codigoPersonalizado: detalle.codigoProducto || 'N/A',
              stock: detalle.stockSistema || 0
            };
            
            return {
              id: detalle.id,
              producto: productoObj,
              stockSistema: detalle.stockSistema || 0,
              cantidadConteo1: detalle.cantidadConteo1 || 0,
              cantidadConteo2: detalle.cantidadConteo2 || 0,
              formulaCalculo1: detalle.formulaCalculo1 || 'Sin fórmula',
              formulaCalculo2: detalle.formulaCalculo2 || 'Sin fórmula',
              diferenciaSistema: detalle.diferenciaSistema || 0,
              diferenciaEntreConteos: detalle.diferenciaEntreConteos || 0,
              estado: detalle.estado || 'PENDIENTE',
              conteosUsuario1: detalle.conteosUsuario1 || [],
              conteosUsuario2: detalle.conteosUsuario2 || []
            };
          });
          
          console.log('✅ Detalles procesados para comparación:', detallesProcesados);
          setDetallesConteo(detallesProcesados);
        } else {
          setDetallesConteo([]);
        }
      } else {
        console.error('❌ Error cargando detalles para comparación:', detallesResponse.status);
        setDetallesConteo([]);
      }
    } catch (error) {
      console.error('Error cargando datos de comparación:', error);
      toast.error('Error al cargar los datos de comparación');
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ margin: 0, color: '#6b7280' }}>Cargando comparación de conteos...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
            <button
              onClick={() => navigate('/admin/inventario-completo')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                marginRight: '1rem',
                color: '#6b7280'
              }}
            >
              ←
            </button>
            <div>
              <h1 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#1e293b'
              }}>
                📊 Comparación de Conteos
              </h1>
              <p style={{
                margin: 0,
                color: '#6b7280',
                fontSize: '1.1rem'
              }}>
                Análisis detallado de los conteos realizados por ambos usuarios
              </p>
            </div>
          </div>

          {/* Información del sector */}
          {conteoInfo && (
            <div style={{
              background: '#f8fafc',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <h3 style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#1e293b'
                  }}>
                    📍 {conteoInfo.sectorNombre}
                  </h3>
                  <p style={{
                    margin: '0 0 1rem 0',
                    color: '#6b7280',
                    fontSize: '0.95rem'
                  }}>
                    {conteoInfo.sectorDescripcion}
                  </p>
                  <div style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    background: conteoInfo.estado === 'COMPLETADO' ? '#dcfce7' : '#fef3c7',
                    color: conteoInfo.estado === 'COMPLETADO' ? '#166534' : '#92400e'
                  }}>
                    {conteoInfo.estado === 'COMPLETADO' ? '✅ Completado' : '⚠️ Con Diferencias'}
                  </div>
                </div>
                <div>
                  <h4 style={{
                    margin: '0 0 1rem 0',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    👥 Usuarios Asignados
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{
                      padding: '0.75rem',
                      background: '#eff6ff',
                      borderRadius: '0.5rem',
                      border: '1px solid #bfdbfe'
                    }}>
                      <strong style={{ color: '#1e40af' }}>Usuario 1:</strong> {conteoInfo.usuario1Nombre}
                    </div>
                    <div style={{
                      padding: '0.75rem',
                      background: '#f0fdf4',
                      borderRadius: '0.5rem',
                      border: '1px solid #bbf7d0'
                    }}>
                      <strong style={{ color: '#166534' }}>Usuario 2:</strong> {conteoInfo.usuario2Nombre}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabla de comparación */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            margin: '0 0 1.5rem 0',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1e293b',
            textAlign: 'center'
          }}>
            📋 Comparación Detallada de Productos
          </h2>

          {detallesConteo.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.9rem'
              }}>
                <thead>
                  <tr style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white'
                  }}>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #1e40af' }}>
                      Producto
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #1e40af' }}>
                      Stock Sistema
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #1e40af' }}>
                      {conteoInfo?.usuario1Nombre}
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #1e40af' }}>
                      {conteoInfo?.usuario2Nombre}
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #1e40af' }}>
                      Diferencia
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #1e40af' }}>
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detallesConteo.map((detalle, index) => (
                    <tr key={detalle.id} style={{
                      borderBottom: '1px solid #e5e7eb',
                      background: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                    }}>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                            {detalle.producto?.nombre || 'Producto no encontrado'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                            Código: {detalle.producto?.codigoPersonalizado || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          background: '#f3f4f6',
                          color: '#374151',
                          fontWeight: '500'
                        }}>
                          {detalle.stockSistema}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{
                          padding: '0.5rem',
                          background: '#eff6ff',
                          borderRadius: '0.5rem',
                          border: '1px solid #bfdbfe'
                        }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e40af', marginBottom: '0.5rem' }}>
                            Total: {detalle.cantidadConteo1}
                          </div>
                          {/* Mostrar conteos individuales */}
                          {detalle.conteosUsuario1 && detalle.conteosUsuario1.length > 0 && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#4b5563' }}>
                              <strong>Conteos individuales:</strong>
                              {detalle.conteosUsuario1.map((conteo: any, idx: number) => (
                                <div key={idx} style={{ marginTop: '0.25rem' }}>
                                  • {conteo.cantidad} ({conteo.formula})
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{
                          padding: '0.5rem',
                          background: '#f0fdf4',
                          borderRadius: '0.5rem',
                          border: '1px solid #bbf7d0'
                        }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#166534', marginBottom: '0.5rem' }}>
                            Total: {detalle.cantidadConteo2}
                          </div>
                          {/* Mostrar conteos individuales */}
                          {detalle.conteosUsuario2 && detalle.conteosUsuario2.length > 0 && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#4b5563' }}>
                              <strong>Conteos individuales:</strong>
                              {detalle.conteosUsuario2.map((conteo: any, idx: number) => (
                                <div key={idx} style={{ marginTop: '0.25rem' }}>
                                  • {conteo.cantidad} ({conteo.formula})
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          background: detalle.diferenciaEntreConteos === 0 ? '#dcfce7' : '#fef3c7',
                          color: detalle.diferenciaEntreConteos === 0 ? '#166534' : '#92400e',
                          fontWeight: '600'
                        }}>
                          {detalle.diferenciaEntreConteos === 0 ? '✅ 0' : `⚠️ ${Math.abs(detalle.diferenciaEntreConteos)}`}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          background: detalle.diferenciaEntreConteos === 0 ? '#dcfce7' : '#fef3c7',
                          color: detalle.diferenciaEntreConteos === 0 ? '#166534' : '#92400e'
                        }}>
                          {detalle.diferenciaEntreConteos === 0 ? '✅ Coincide' : '⚠️ Diferencia'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>
                No hay productos para comparar
              </h3>
              <p style={{ margin: 0 }}>
                No se encontraron detalles de conteo para este sector
              </p>
            </div>
          )}
        </div>

        {/* Resumen estadístico */}
        {detallesConteo.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            marginTop: '2rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              margin: '0 0 1.5rem 0',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1e293b',
              textAlign: 'center'
            }}>
              📊 Resumen Estadístico
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div style={{
                padding: '1.5rem',
                background: '#f8fafc',
                borderRadius: '0.75rem',
                textAlign: 'center',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.25rem' }}>
                  {detallesConteo.length}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Total Productos</div>
              </div>
              
              <div style={{
                padding: '1.5rem',
                background: '#f0fdf4',
                borderRadius: '0.75rem',
                textAlign: 'center',
                border: '1px solid #bbf7d0'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#166534', marginBottom: '0.25rem' }}>
                  {detallesConteo.filter(d => d.diferenciaEntreConteos === 0).length}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Sin Diferencias</div>
              </div>
              
              <div style={{
                padding: '1.5rem',
                background: '#fef3c7',
                borderRadius: '0.75rem',
                textAlign: 'center',
                border: '1px solid #fbbf24'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#92400e', marginBottom: '0.25rem' }}>
                  {detallesConteo.filter(d => d.diferenciaEntreConteos !== 0).length}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Con Diferencias</div>
              </div>
              
              <div style={{
                padding: '1.5rem',
                background: '#eff6ff',
                borderRadius: '0.75rem',
                textAlign: 'center',
                border: '1px solid #bfdbfe'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af', marginBottom: '0.25rem' }}>
                  {detallesConteo.length > 0 ? Math.round((detallesConteo.filter(d => d.diferenciaEntreConteos === 0).length / detallesConteo.length) * 100) : 0}%
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Precisión</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparacionConteos;
