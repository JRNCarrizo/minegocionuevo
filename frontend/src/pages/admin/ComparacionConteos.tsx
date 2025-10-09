import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
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
  const { isMobile } = useResponsive();
  const [cargando, setCargando] = useState(true);
  const [conteoInfo, setConteoInfo] = useState<ConteoInfo | null>(null);
  const [detallesConteo, setDetallesConteo] = useState<DetalleConteo[]>([]);
  const [filtroDiferencia, setFiltroDiferencia] = useState<'TODOS' | 'CON_DIFERENCIA' | 'SIN_DIFERENCIA'>('TODOS');

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
      const conteoEspecifico = conteosData.find((conteo: ConteoInfo) => conteo.id === parseInt(id));
      
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
          console.log('🔍 DEBUG: Primer detalle del backend:', detallesData[0]);
          const detallesProcesados = detallesData.map(detalle => {
            // ✅ CORRECCIÓN: Usar los campos directos que vienen del backend
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
              diferenciaEntreConteos: detalle.diferenciaConteo || detalle.diferenciaEntreConteos || 0,
              estado: detalle.estado || 'PENDIENTE',
              conteosUsuario1: detalle.conteosUsuario1 || [],
              conteosUsuario2: detalle.conteosUsuario2 || []
            };
          });
          
          console.log('✅ Detalles procesados para comparación:', detallesProcesados);
          console.log('🔍 DEBUG: Primer detalle procesado:', detallesProcesados[0]);
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

  // Aplicar filtro por diferencias
  const detallesFiltrados = detallesConteo.filter(detalle => {
    const diferencia = detalle.cantidadConteo1 - detalle.cantidadConteo2;
    const tieneDiferencia = diferencia !== 0;
    
    if (filtroDiferencia === 'CON_DIFERENCIA') {
      return tieneDiferencia;
    } else if (filtroDiferencia === 'SIN_DIFERENCIA') {
      return !tieneDiferencia;
    }
    return true; // TODOS
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: isMobile ? '1rem' : '2rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: isMobile ? '1rem' : '2rem',
          marginBottom: isMobile ? '1rem' : '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          position: 'relative'
        }}>
          {/* Botón volver */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: isMobile ? '0.75rem' : '1.5rem' }}>
            <button
              onClick={() => navigate('/admin/inventario-completo')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: isMobile ? '1.3rem' : '1.5rem',
                cursor: 'pointer',
                marginRight: '1rem',
                color: '#6b7280'
              }}
            >
              ←
            </button>
            <div style={{ flex: 1 }}>
              <h1 style={{
                margin: '0 0 0.25rem 0',
                fontSize: isMobile ? '1.2rem' : '2rem',
                fontWeight: 'bold',
                color: '#1e293b'
              }}>
                📊 Comparación de Conteos
              </h1>
              {!isMobile && (
              <p style={{
                margin: 0,
                color: '#6b7280',
                fontSize: '1.1rem'
              }}>
                Análisis detallado de los conteos realizados por ambos usuarios
              </p>
              )}
            </div>
          </div>

          {/* Información del sector */}
          {conteoInfo && (
            <div style={{
              background: '#f8fafc',
              borderRadius: '0.75rem',
              padding: isMobile ? '1rem' : '1.5rem',
              border: '1px solid #e2e8f0',
              position: 'relative'
            }}>
              {/* Estado en esquina superior derecha (solo móvil) */}
              {isMobile && (
                <div style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  background: conteoInfo.estado === 'COMPLETADO' ? '#10b981' : '#f59e0b',
                  color: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  {conteoInfo.estado === 'COMPLETADO' ? '✅' : '⚠️'}
                </div>
              )}

              {isMobile ? (
                /* Vista móvil - Compacta */
                <div>
                  {/* Sector y Productos */}
                  <div style={{ marginBottom: '0.75rem', paddingRight: '3rem' }}>
                    <h3 style={{
                      margin: '0 0 0.25rem 0',
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      color: '#1e293b'
                    }}>
                      📍 {conteoInfo.sectorNombre}
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                      {conteoInfo.productosContados} / {conteoInfo.totalProductos} productos
                    </div>
                  </div>
                  
                  {/* Usuarios en fila horizontal */}
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    borderRadius: '0.5rem',
                    padding: '0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>👥</div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      flex: 1,
                      justifyContent: 'flex-end',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      <div style={{
                        background: '#3b82f6',
                        color: 'white',
                        padding: '0.3rem 0.6rem',
                        borderRadius: '0.375rem'
                      }}>
                        {conteoInfo.usuario1Nombre?.split(' ')[0]}
                      </div>
                      <div style={{ color: '#94a3b8' }}>vs</div>
                      <div style={{
                        background: '#10b981',
                        color: 'white',
                        padding: '0.3rem 0.6rem',
                        borderRadius: '0.375rem'
                      }}>
                        {conteoInfo.usuario2Nombre?.split(' ')[0]}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Vista desktop - Original */
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
              )}
            </div>
          )}
        </div>

        {/* Filtros por diferencias */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: isMobile ? '1rem' : '1.5rem',
          marginBottom: isMobile ? '1rem' : '1.5rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            {[
              { key: 'TODOS', label: 'Todos', icon: '📦', color: '#6b7280' },
              { key: 'CON_DIFERENCIA', label: 'Con Diferencias', icon: '⚠️', color: '#ef4444' },
              { key: 'SIN_DIFERENCIA', label: 'Sin Diferencias', icon: '✅', color: '#10b981' }
            ].map(filtro => {
              const total = detallesConteo.filter(d => {
                const dif = d.cantidadConteo1 - d.cantidadConteo2;
                if (filtro.key === 'CON_DIFERENCIA') return dif !== 0;
                if (filtro.key === 'SIN_DIFERENCIA') return dif === 0;
                return true;
              }).length;

              return (
                <button
                  key={filtro.key}
                  onClick={() => setFiltroDiferencia(filtro.key as 'TODOS' | 'CON_DIFERENCIA' | 'SIN_DIFERENCIA')}
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
                    gap: '0.35rem'
                  }}
                >
                  <span>{filtro.icon}</span>
                  <span>{isMobile ? filtro.label.split(' ')[0] : filtro.label}</span>
                  <span style={{
                    background: filtroDiferencia === filtro.key ? 'rgba(255,255,255,0.3)' : filtro.color,
                    color: 'white',
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
        </div>

        {/* Tabla de comparación */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: isMobile ? '1rem' : '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            margin: '0 0 1.5rem 0',
            fontSize: isMobile ? '1.1rem' : '1.5rem',
            fontWeight: 'bold',
            color: '#1e293b',
            textAlign: 'center'
          }}>
            📋 {isMobile ? `Productos (${detallesFiltrados.length})` : `Comparación Detallada de Productos (${detallesFiltrados.length})`}
          </h2>

          {detallesFiltrados.length > 0 ? (
            isMobile ? (
              /* Vista móvil - Cards */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {detallesFiltrados.map((detalle, index) => {
                  const diferencia = detalle.cantidadConteo1 - detalle.cantidadConteo2;
                  const tieneDiferencia = diferencia !== 0;

                  return (
                    <div
                      key={`${detalle.producto?.id || 'unknown'}-${index}`}
                      style={{
                        background: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.75rem',
                        padding: '0.75rem',
                        position: 'relative'
                      }}
                    >
                      {/* Estado arriba derecha */}
                      <div style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        fontSize: '1.2rem'
                      }}>
                        {tieneDiferencia ? '⚠️' : '✅'}
                      </div>

                      {/* Producto */}
                      <div style={{ marginBottom: '0.75rem', paddingRight: '2rem' }}>
                        {/* Código personalizado destacado */}
                        {detalle.producto?.codigoPersonalizado && (
                          <div style={{ 
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            color: '#7c3aed',
                            background: 'linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.375rem',
                            display: 'inline-block',
                            marginBottom: '0.35rem',
                            border: '1.5px solid #c4b5fd',
                            letterSpacing: '0.025em',
                            boxShadow: '0 1px 2px rgba(124, 58, 237, 0.1)'
                          }}>
                            {detalle.producto.codigoPersonalizado}
                          </div>
                        )}
                        <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }}>
                          {detalle.producto?.nombre || 'Producto no encontrado'}
                        </div>
                      </div>

                      {/* Stock Sistema */}
                      <div style={{
                        background: '#f3f4f6',
                        padding: '0.5rem',
                        borderRadius: '0.375rem',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Stock Sistema:</span>
                        <span style={{ fontWeight: '600', color: '#374151' }}>{detalle.stockSistema}</span>
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
                          background: '#eff6ff',
                          borderRadius: '0.5rem',
                          padding: '0.5rem',
                          border: '1px solid #bfdbfe'
                        }}>
                          <div style={{ fontSize: '0.7rem', color: '#1e40af', marginBottom: '0.2rem' }}>Usuario 1</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e40af' }}>
                            {detalle.cantidadConteo1}
                          </div>
                          {detalle.formulaCalculo1 && detalle.formulaCalculo1 !== 'Sin fórmula' && (
                            <div style={{ fontSize: '0.65rem', color: '#0369a1', marginTop: '0.25rem' }}>
                              📐 {detalle.formulaCalculo1}
                            </div>
                          )}
                        </div>

                        {/* Usuario 2 */}
                        <div style={{
                          background: '#f0fdf4',
                          borderRadius: '0.5rem',
                          padding: '0.5rem',
                          border: '1px solid #bbf7d0'
                        }}>
                          <div style={{ fontSize: '0.7rem', color: '#166534', marginBottom: '0.2rem' }}>Usuario 2</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#166534' }}>
                            {detalle.cantidadConteo2}
                          </div>
                          {detalle.formulaCalculo2 && detalle.formulaCalculo2 !== 'Sin fórmula' && (
                            <div style={{ fontSize: '0.65rem', color: '#15803d', marginTop: '0.25rem' }}>
                              📐 {detalle.formulaCalculo2}
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
                        Diferencia: {diferencia > 0 ? '+' : ''}{diferencia}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Vista desktop - Tabla */
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
                    {detallesFiltrados.map((detalle, index) => (
                    <tr key={`${detalle.producto?.id || 'unknown'}-${index}`} style={{
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
                            {detalle.cantidadConteo1}
                          </div>
                          {/* Mostrar fórmulas en lista */}
                          {detalle.formulaCalculo1 && detalle.formulaCalculo1 !== 'Sin fórmula' && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#4b5563' }}>
                              <strong>Fórmulas:</strong>
                              <div style={{ marginTop: '0.25rem' }}>
                                {detalle.formulaCalculo1.split(' | ').map((formula, index) => (
                                  <div key={index} style={{ 
                                    marginBottom: '0.125rem',
                                    padding: '0.125rem 0.25rem',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.65rem'
                                  }}>
                                    {formula}
                                  </div>
                                ))}
                              </div>
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
                            {detalle.cantidadConteo2}
                          </div>
                          {/* Mostrar fórmulas en lista */}
                          {detalle.formulaCalculo2 && detalle.formulaCalculo2 !== 'Sin fórmula' && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#4b5563' }}>
                              <strong>Fórmulas:</strong>
                              <div style={{ marginTop: '0.25rem' }}>
                                {detalle.formulaCalculo2.split(' | ').map((formula, index) => (
                                  <div key={index} style={{ 
                                    marginBottom: '0.125rem',
                                    padding: '0.125rem 0.25rem',
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.65rem'
                                  }}>
                                    {formula}
                                  </div>
                                ))}
                              </div>
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
            )
          ) : (
            <div style={{
              textAlign: 'center',
              padding: isMobile ? '2rem 1rem' : '3rem',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: isMobile ? '2rem' : '3rem', marginBottom: '1rem' }}>📋</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151', fontSize: isMobile ? '1rem' : '1.25rem' }}>
                No hay productos{filtroDiferencia !== 'TODOS' ? ' con este filtro' : ' para comparar'}
              </h3>
              <p style={{ margin: 0, fontSize: isMobile ? '0.85rem' : '1rem' }}>
                {filtroDiferencia !== 'TODOS' ? 'Prueba con otro filtro' : 'No se encontraron detalles de conteo para este sector'}
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
