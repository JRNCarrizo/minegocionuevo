import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';

interface Producto {
  id: number;
  nombre: string;
  codigoBarras?: string;
  codigoPersonalizado?: string;
  categoria?: string;
  marca?: string;
  stock: number;
  precio?: number;
}

interface ConteoIndividual {
  cantidad: number;
  formula: string;
  fecha: string;
}

interface DetalleConteo {
  id: number;
  producto: Producto;
  stockSistema: number;
  cantidadConteo1?: number;
  cantidadConteo2?: number;
  cantidadFinal?: number;
  diferenciaSistema?: number;
  diferenciaEntreConteos?: number;
  formulaCalculo1?: string;
  formulaCalculo2?: string;
  estado: string;
  conteosUsuario1?: ConteoIndividual[];
  conteosUsuario2?: ConteoIndividual[];
}

interface ConteoInfo {
  id: number;
  sector?: {
    id: number;
    nombre: string;
  };
  estado: string;
  totalProductos: number;
  productosContados: number;
  porcentajeCompletado: number;
  // Usuarios asignados (formato del DTO)
  usuario1Id?: number;
  usuario1Nombre?: string;
  usuario2Id?: number;
  usuario2Nombre?: string;
  // Estados por usuario
  estadoUsuario1?: string;
  estadoUsuario2?: string;
}

export default function ReconteoSector() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [conteoInfo, setConteoInfo] = useState<ConteoInfo | null>(null);
  const [detallesConteo, setDetallesConteo] = useState<DetalleConteo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [reconteos, setReconteos] = useState<{[key: number]: string}>({});
  const [reconteosSolidificados, setReconteosSolidificados] = useState<{[key: number]: string}>({});
  const [productoActual, setProductoActual] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (id && datosUsuario?.empresaId) {
      cargarDatos();
    }
  }, [id, datosUsuario]);

  // Establecer el primer producto como activo cuando se cargan los datos
  useEffect(() => {
    console.log('🔍 useEffect detallesConteo:', {
      detallesConteoLength: detallesConteo.length,
      productoActual,
      primerProducto: detallesConteo[0]?.producto?.id
    });
    
    if (detallesConteo.length > 0 && productoActual === null) {
      const primerProductoId = detallesConteo[0].producto.id;
      console.log('✅ Estableciendo primer producto como activo:', primerProductoId);
      setProductoActual(primerProductoId);
    }
  }, [detallesConteo, productoActual]);

  // Función para calcular el resultado de una fórmula
  const calcularFormula = (formula: string): number => {
    try {
      // Reemplazar caracteres problemáticos y evaluar
      const formulaLimpia = formula.replace(/[^0-9+\-*/().]/g, '');
      return eval(formulaLimpia) || 0;
    } catch (error) {
      console.error('Error calculando fórmula:', formula, error);
      return 0;
    }
  };

  // Función para solidificar el reconteo y pasar al siguiente
  const solidificarReconteo = (productoId: number, formula: string) => {
    console.log('🔍 solidificarReconteo llamado:', { productoId, formula });
    
    if (!formula.trim()) {
      console.log('⚠️ Fórmula vacía, no se solidifica');
      return;
    }

    // Solidificar el valor (quedará visible en el campo)
    setReconteosSolidificados(prev => {
      const nuevo = { ...prev, [productoId]: formula };
      console.log('✅ Reconteo solidificado:', nuevo);
      return nuevo;
    });
    
    // Limpiar el campo de entrada
    setReconteos(prev => ({ ...prev, [productoId]: '' }));
    
    // Pasar al siguiente producto
    const indiceActual = detallesConteo.findIndex(d => d.producto.id === productoId);
    console.log('🔍 Índice actual:', indiceActual, 'Total productos:', detallesConteo.length);
    
    if (indiceActual < detallesConteo.length - 1) {
      // Hay más productos, pasar al siguiente
      const siguienteProducto = detallesConteo[indiceActual + 1].producto.id;
      console.log('➡️ Pasando al siguiente producto:', siguienteProducto);
      setProductoActual(siguienteProducto);
    } else {
      // Es el último producto, guardar todos los reconteos
      console.log('🏁 Último producto, guardando todos los reconteos');
      guardarTodosLosReconteos();
    }
  };

  // Función para guardar todos los reconteos solidificados
  const guardarTodosLosReconteos = async () => {
    if (!datosUsuario?.id) return;

    setGuardando(true);

    try {
      const token = localStorage.getItem('token');
      const reconteosParaGuardar = Object.entries(reconteosSolidificados)
        .filter(([_, formula]) => formula.trim())
        .map(([productoId, formula]) => ({
          productoId: parseInt(productoId),
          cantidad: calcularFormula(formula),
          formulaCalculo: formula
        }));

      console.log('🔍 Reconteos preparados para guardar:', {
        reconteosSolidificados,
        reconteosParaGuardar,
        usuarioId: datosUsuario.id,
        empresaId: datosUsuario.empresaId,
        conteoSectorId: id
      });

      if (reconteosParaGuardar.length === 0) {
        toast.info('No hay reconteos para guardar');
        return;
      }

      // Guardar cada reconteo
      for (const reconteo of reconteosParaGuardar) {
        console.log('🔍 Enviando reconteo:', {
          url: `/api/empresas/${datosUsuario.empresaId}/inventario-completo/${conteoInfo?.inventarioId}/conteos-sector/${id}/agregar-producto`,
          reconteo: reconteo,
          token: token ? 'presente' : 'ausente'
        });

        const response = await fetch(`/api/empresas/${datosUsuario.empresaId}/inventario-completo/${conteoInfo?.inventarioId}/conteos-sector/${id}/agregar-producto`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reconteo)
        });

        console.log('🔍 Respuesta del servidor:', {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Error response:', errorText);
          throw new Error(`Error guardando reconteo para producto ${reconteo.productoId}: ${response.status} ${errorText}`);
        }
      }

      // Limpiar reconteos solidificados
      setReconteosSolidificados({});
      setProductoActual(null);
      
      // Recargar datos para ver si hay nuevas diferencias
      await cargarDatos();
      
      toast.success(`${reconteosParaGuardar.length} reconteos guardados correctamente`);
    } catch (error) {
      console.error('Error guardando reconteos:', error);
      toast.error('Error al guardar los reconteos');
    } finally {
      setGuardando(false);
    }
  };

  // Función para manejar Enter en el input
  const manejarEnter = (productoId: number, formula: string) => {
    console.log('🔍 manejarEnter llamado:', { productoId, formula });
    if (formula.trim()) {
      solidificarReconteo(productoId, formula);
    } else {
      console.log('⚠️ Fórmula vacía en manejarEnter');
    }
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      
      console.log('🔍 Debugging datos:', {
        id: id,
        empresaId: datosUsuario?.empresaId,
        datosUsuario: datosUsuario
      });
      
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

      console.log('🔍 Cargando datos del reconteo:', id);

      // Primero obtener el inventario activo
      const inventarioResponse = await fetch(`/api/empresas/${datosUsuario.empresaId}/inventario-completo/activo`, {
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
      const conteosResponse = await fetch(`/api/empresas/${datosUsuario.empresaId}/inventario-completo/${inventarioData.id}/conteos-sector`, {
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
      console.log('🔍 Usuarios asignados:', {
        usuario1Id: conteoEspecifico.usuario1Id,
        usuario1Nombre: conteoEspecifico.usuario1Nombre,
        usuario2Id: conteoEspecifico.usuario2Id,
        usuario2Nombre: conteoEspecifico.usuario2Nombre
      });
      setConteoInfo(conteoEspecifico);

      // Cargar detalles de reconteo usando el mismo endpoint de comparación
      console.log('🔍 Cargando detalles de reconteo para ID:', id);
      console.log('🔍 URL de detalles:', `/api/empresas/${datosUsuario.empresaId}/inventario-completo/conteos-sector/${id}/comparacion`);
      const detallesResponse = await fetch(`/api/empresas/${datosUsuario.empresaId}/inventario-completo/conteos-sector/${id}/comparacion`, {
        headers
      });

      console.log('🔍 Respuesta de detalles reconteo:', {
        status: detallesResponse.status,
        ok: detallesResponse.ok,
        url: detallesResponse.url
      });

      if (detallesResponse.ok) {
        const detallesData = await detallesResponse.json();
        console.log('✅ Detalles de reconteo cargados:', detallesData);
        
        if (Array.isArray(detallesData)) {
          console.log('✅ Detalles de reconteo (array directo):', detallesData.length, 'elementos');
          console.log('🔍 Primer detalle completo:', detallesData[0]);
          console.log('🔍 Estructura del primer detalle:', Object.keys(detallesData[0]));
          
          // El endpoint de comparación ya devuelve los datos en el formato correcto
          const todosLosDetalles = detallesData.map(detalle => {
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
          
          // Filtrar solo los productos que tienen diferencias para reconteo
          const detallesConDiferencias = todosLosDetalles.filter(detalle => {
            const tieneDiferencias = detalle.diferenciaEntreConteos !== 0;
            console.log(`🔍 Producto ${detalle.producto.nombre}: diferencia=${detalle.diferenciaEntreConteos}, tieneDiferencias=${tieneDiferencias}`);
            return tieneDiferencias;
          });
          
          console.log('✅ Todos los detalles procesados:', todosLosDetalles.length);
          console.log('✅ Detalles con diferencias (para reconteo):', detallesConDiferencias.length);
          setDetallesConteo(detallesConDiferencias);
        } else {
          console.log('⚠️ No se encontraron detalles válidos');
          setDetallesConteo([]);
        }
      } else {
        console.error('❌ Error cargando detalles de reconteo:', detallesResponse.status);
        const errorText = await detallesResponse.text();
        console.error('❌ Error details:', errorText);
        setDetallesConteo([]);
      }
    } catch (error) {
      console.error('Error cargando datos de reconteo:', error);
      toast.error('Error al cargar los datos del reconteo');
    } finally {
      setCargando(false);
    }
  };

  const obtenerTextoEstado = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'Pendiente';
      case 'EN_PROGRESO':
        return 'En Progreso';
      case 'ESPERANDO_VERIFICACION':
        return 'Esperando Verificación';
      case 'CON_DIFERENCIAS':
        return 'Con Diferencias';
      case 'COMPLETADO':
        return 'Completado';
      default:
        return estado;
    }
  };

  // Mostrar carga si no hay datos del usuario o si está cargando
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
          <p style={{ color: '#6b7280', margin: 0 }}>
            {!datosUsuario ? 'Cargando datos del usuario...' : 'Cargando reconteo...'}
          </p>
        </div>
      </div>
    );
  }

  if (!conteoInfo) {
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
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ color: '#374151', marginBottom: '1rem' }}>Error al cargar el reconteo</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>No se pudo cargar la información del reconteo.</p>
          <button
            onClick={() => navigate('/admin/inventario-completo')}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Volver al Inventario Completo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <NavbarAdmin />
      
      <div style={{
        padding: isMobile ? '1rem' : '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h1 style={{
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: 0,
                marginBottom: '0.5rem'
              }}>
                🔍 Reconteo - {conteoInfo.sector?.nombre || 'Sector'}
              </h1>
              <p style={{
                color: '#6b7280',
                margin: 0,
                fontSize: '0.875rem'
              }}>
                Revisión de diferencias encontradas entre conteos
              </p>
            </div>
            
            <button
              onClick={() => navigate('/admin/inventario-completo')}
              style={{
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              ← Volver al Inventario Completo
            </button>
          </div>

          {/* Información del reconteo */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              background: '#f3f4f6',
              padding: '1rem',
              borderRadius: '0.5rem'
            }}>
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                margin: '0 0 0.5rem 0'
              }}>
                Estado
              </h3>
              <p style={{
                fontSize: '1.125rem',
                fontWeight: 'bold',
                color: '#dc2626',
                margin: 0
              }}>
                {obtenerTextoEstado(conteoInfo.estado)}
              </p>
            </div>

            <div style={{
              background: '#f3f4f6',
              padding: '1rem',
              borderRadius: '0.5rem'
            }}>
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                margin: '0 0 0.5rem 0'
              }}>
                Usuarios Asignados
              </h3>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                <p style={{ margin: '0.25rem 0' }}>
                  <strong>Usuario 1:</strong> {conteoInfo.usuario1Nombre || 'No asignado'}
                </p>
                <p style={{ margin: '0.25rem 0' }}>
                  <strong>Usuario 2:</strong> {conteoInfo.usuario2Nombre || 'No asignado'}
                </p>
              </div>
            </div>

            <div style={{
              background: '#f3f4f6',
              padding: '1rem',
              borderRadius: '0.5rem'
            }}>
              <h3 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                margin: '0 0 0.5rem 0'
              }}>
                Productos con Diferencias
              </h3>
              <p style={{
                fontSize: '1.125rem',
                fontWeight: 'bold',
                color: '#dc2626',
                margin: 0
              }}>
                {detallesConteo.length}
              </p>
            </div>
          </div>


        </div>

        
        {detallesConteo.length > 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              Productos con Diferencias
            </h2>
            
            {/* Indicador de progreso */}
            <div style={{
              background: '#f3f4f6',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                  Progreso del Reconteo
                </span>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {Object.keys(reconteosSolidificados).length} / {detallesConteo.length}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '0.5rem',
                background: '#e5e7eb',
                borderRadius: '0.25rem',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(Object.keys(reconteosSolidificados).length / detallesConteo.length) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              {productoActual && (
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#3b82f6',
                  textAlign: 'center'
                }}>
                  Producto actual: {detallesConteo.find(d => d.producto.id === productoActual)?.producto.nombre}
                </div>
              )}
              
              {/* Botón de debug temporal */}
              <button
                onClick={() => {
                  console.log('🔍 DEBUG ESTADOS:', {
                    productoActual,
                    reconteosSolidificados,
                    reconteos,
                    detallesConteo: detallesConteo.map(d => ({ id: d.producto.id, nombre: d.producto.nombre }))
                  });
                }}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                🔍 Debug Estados
              </button>
            </div>

            <div style={{
              display: 'grid',
              gap: '0.5rem'
            }}>
              {detallesConteo
                .filter(detalle => detalle.producto) // Filtrar detalles sin producto
                .map((detalle) => (
                <div
                  key={detalle.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    background: 'white',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {/* Fila compacta con información principal */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr',
                    gap: '1rem',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    {/* Información del producto */}
                    <div>
                      <h3 style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: '0 0 0.25rem 0'
                      }}>
                        {detalle.producto?.nombre || 'Producto no encontrado'}
                      </h3>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280'
                      }}>
                        <div><strong>Código:</strong> {detalle.producto?.codigoPersonalizado || 'N/A'}</div>
                        <div><strong>Stock:</strong> {detalle.stockSistema || 0}</div>
                      </div>
                    </div>

                    {/* Usuario 1 */}
                    <div style={{
                      background: '#eff6ff',
                      padding: '0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #dbeafe',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#1e40af',
                        marginBottom: '0.25rem'
                      }}>
                        👤 {conteoInfo?.usuario1Nombre || 'Usuario 1'}
                      </div>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: '#1e40af',
                        marginBottom: '0.25rem'
                      }}>
                        {detalle.cantidadConteo1 || 0}
                      </div>
                      {detalle.conteosUsuario1 && detalle.conteosUsuario1.length > 0 && (
                        <div style={{
                          fontSize: '0.65rem',
                          color: '#4b5563',
                          background: 'white',
                          padding: '0.25rem',
                          borderRadius: '0.25rem',
                          border: '1px solid #dbeafe'
                        }}>
                          {detalle.conteosUsuario1.map((conteo: any, idx: number) => (
                            <div key={idx}>
                              {conteo.cantidad} ({conteo.formula})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Usuario 2 */}
                    <div style={{
                      background: '#f0fdf4',
                      padding: '0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #bbf7d0',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#059669',
                        marginBottom: '0.25rem'
                      }}>
                        👤 {conteoInfo?.usuario2Nombre || 'Usuario 2'}
                      </div>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: '#059669',
                        marginBottom: '0.25rem'
                      }}>
                        {detalle.cantidadConteo2 || 0}
                      </div>
                      {detalle.conteosUsuario2 && detalle.conteosUsuario2.length > 0 && (
                        <div style={{
                          fontSize: '0.65rem',
                          color: '#4b5563',
                          background: 'white',
                          padding: '0.25rem',
                          borderRadius: '0.25rem',
                          border: '1px solid #bbf7d0'
                        }}>
                          {detalle.conteosUsuario2.map((conteo: any, idx: number) => (
                            <div key={idx}>
                              {conteo.cantidad} ({conteo.formula})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Diferencia */}
                    <div style={{
                      background: detalle.diferenciaEntreConteos === 0 ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${detalle.diferenciaEntreConteos === 0 ? '#bbf7d0' : '#fecaca'}`,
                      borderRadius: '0.375rem',
                      padding: '0.75rem',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: detalle.diferenciaEntreConteos === 0 ? '#059669' : '#dc2626',
                        marginBottom: '0.25rem'
                      }}>
                        Diferencia
                      </div>
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: detalle.diferenciaEntreConteos === 0 ? '#059669' : '#dc2626'
                      }}>
                        {Math.abs(detalle.diferenciaEntreConteos || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Campo de reconteo abajo */}
                  <div style={{
                    background: '#f8fafc',
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      {productoActual === detalle.producto.id 
                        ? '🔄 Reconteo Manual (Enter para continuar)' 
                        : 'Estado del Reconteo'
                      }
                    </label>
                    
                    {(() => {
                      const esSolidificado = reconteosSolidificados[detalle.producto.id];
                      const esActivo = productoActual === detalle.producto.id;
                      
                      if (esSolidificado) {
                        // Campo solidificado (solo lectura)
                        return (
                          <div style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '2px solid #10b981',
                            borderRadius: '0.25rem',
                            fontSize: '0.875rem',
                            background: '#f0fdf4',
                            color: '#065f46',
                            fontWeight: '600',
                            textAlign: 'center'
                          }}>
                            ✅ {reconteosSolidificados[detalle.producto.id]} = {calcularFormula(reconteosSolidificados[detalle.producto.id])}
                          </div>
                        );
                      } else if (esActivo) {
                        // Campo activo (editable)
                        return (
                          <input
                            type="text"
                            placeholder="Ej: 10, 5*2, 3+7, etc."
                            value={reconteos[detalle.producto.id] || ''}
                            onChange={(e) => {
                              setReconteos(prev => ({ ...prev, [detalle.producto.id]: e.target.value }));
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                manejarEnter(detalle.producto.id, reconteos[detalle.producto.id] || '');
                              }
                            }}
                            disabled={guardando}
                            autoFocus
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              border: '2px solid #3b82f6',
                              borderRadius: '0.25rem',
                              fontSize: '0.875rem',
                              background: '#eff6ff',
                              opacity: guardando ? 0.6 : 1
                            }}
                          />
                        );
                      } else {
                        // Campo pendiente
                        return (
                          <div style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.25rem',
                            fontSize: '0.875rem',
                            background: '#f9fafb',
                            color: '#6b7280',
                            textAlign: 'center'
                          }}>
                            ⏳ Pendiente
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#059669',
              marginBottom: '1rem'
            }}>
              ¡Sector Completado!
            </h2>
            <p style={{
              color: '#6b7280',
              marginBottom: '1.5rem'
            }}>
              Todos los productos han sido reconciliados exitosamente. No hay diferencias entre los conteos.
            </p>
            <button
              onClick={() => navigate('/admin/inventario-completo')}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 2rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(5, 150, 105, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 12px rgba(5, 150, 105, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 6px rgba(5, 150, 105, 0.3)';
              }}
            >
              🔍 Ver Detalle Final del Sector
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
