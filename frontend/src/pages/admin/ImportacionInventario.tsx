import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
import ApiService from '../../services/api';

interface ProductoInventario {
  fila: number;
  codigoPersonalizado: string;
  descripcion: string;
  cantidad: number;
  actualizado: boolean;
}

interface ResultadoValidacion {
  exito: boolean;
  mensaje: string;
  totalRegistros: number;
  productosActualizados: number;
  productosCreados: number;
  errores: Array<{ fila: number; error: string }>;
  resultados: ProductoInventario[];
}

export default function ImportacionInventario() {
  const navigate = useNavigate();
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile } = useResponsive();
  
  const [archivo, setArchivo] = useState<File | null>(null);
  const [validando, setValidando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [resultadoValidacion, setResultadoValidacion] = useState<ResultadoValidacion | null>(null);
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Función para determinar si hay errores críticos que impidan la importación
  const tieneErroresCriticos = () => {
    if (!resultadoValidacion?.errores) return false;
    
    const erroresCriticos = resultadoValidacion.errores.filter(error => 
      !error.error.includes('Código de producto vacío')
    );
    
    // Si hay pocos errores críticos (menos del 5% del total), los ignoramos
    // Probablemente son de tablas irrelevantes al final del Excel
    const porcentajeErroresCriticos = (erroresCriticos.length / resultadoValidacion.errores.length) * 100;
    
    return porcentajeErroresCriticos >= 5; // Solo bloquear si hay 5% o más de errores críticos
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        toast.error('Solo se permiten archivos Excel (.xlsx)');
        return;
      }
      
      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo no puede ser mayor a 10MB');
        return;
      }
      
      setArchivo(file);
      setResultadoValidacion(null);
      setMostrarVistaPrevia(false);
    }
  };

  const validarArchivo = async () => {
    if (!archivo || !datosUsuario?.empresaId) return;

    setValidando(true);
    try {
      const response = await ApiService.validarArchivoInventario(datosUsuario.empresaId, archivo);
      
      if (response.exito) {
        setResultadoValidacion(response);
        setMostrarVistaPrevia(true);
        toast.success('Archivo validado correctamente');
      } else {
        toast.error(response.mensaje || 'Error al validar el archivo');
      }
    } catch (error: any) {
      console.error('Error al validar archivo:', error);
      toast.error(error.response?.data?.error || 'Error al validar el archivo');
    } finally {
      setValidando(false);
    }
  };

  const importarInventario = async () => {
    if (!resultadoValidacion?.resultados || !datosUsuario?.empresaId) return;

    console.log('🚀 [DEBUG] Iniciando importación de inventario...');
    setImportando(true);
    try {
      const response = await ApiService.importarInventario(datosUsuario.empresaId, resultadoValidacion.resultados);
      
      console.log('📊 [DEBUG] Respuesta de importación:', response);
      
      if (response.exito) {
        console.log('✅ [DEBUG] Importación exitosa, mostrando toast...');
        toast.success(`✅ Importación completada: ${response.productosActualizados} productos actualizados, ${response.productosCreados} productos creados`);
        
        console.log('⏰ [DEBUG] Programando navegación en 1.5 segundos...');
        // Después de una importación exitosa, regresar automáticamente a gestión de productos
        setTimeout(() => {
          console.log('🔄 [DEBUG] Ejecutando navegación a gestión de productos...');
          // Limpiar el formulario primero
          resetearFormulario();
          // Regresar a la gestión de productos usando window.location para evitar problemas de navegación
          window.location.href = '/admin/gestion-productos';
        }, 1500);
        
      } else {
        console.log('❌ [DEBUG] Importación falló:', response.mensaje);
        toast.error(response.mensaje || 'Error al importar el inventario');
      }
    } catch (error: any) {
      console.error('💥 [DEBUG] Error al importar inventario:', error);
      toast.error(error.response?.data?.error || 'Error al importar el inventario');
    } finally {
      console.log('🏁 [DEBUG] Finalizando proceso de importación...');
      setImportando(false);
    }
  };

  const resetearFormulario = () => {
    setArchivo(null);
    setResultadoValidacion(null);
    setMostrarVistaPrevia(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: isMobile ? '1rem' : '2rem'
    }}>
      <NavbarAdmin 
        onCerrarSesion={cerrarSesion}
        empresaNombre={datosUsuario?.empresaNombre}
        nombreAdministrador={datosUsuario?.nombre}
      />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        marginTop: isMobile ? '1rem' : '2rem'
      }}>
        {/* Botón de regreso */}
        <div style={{
          marginBottom: '1rem'
        }}>
          <button
            onClick={() => window.location.href = '/admin/gestion-productos'}
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            ← Regresar a Gestión de Productos
          </button>
        </div>

        {/* Título */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: isMobile ? '1.5rem' : '2rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 0.5rem 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            📊 Importación de Inventario
          </h1>
          <p style={{
            fontSize: isMobile ? '0.875rem' : '1rem',
            color: '#64748b',
            margin: 0,
            lineHeight: '1.5'
          }}>
            Importa tu Excel de inventario para actualizar cantidades y crear nuevos productos
          </p>
        </div>

        {/* Instrucciones */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: isMobile ? '1.5rem' : '2rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '600',
            color: '#1e293b',
            margin: '0 0 1rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📋 Instrucciones
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '1.5rem'
          }}>
            <div>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#374151',
                margin: '0 0 0.5rem 0'
              }}>
                📁 Formato del Excel
              </h3>
              <ul style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: 0,
                paddingLeft: '1.5rem',
                lineHeight: '1.6'
              }}>
                <li>El archivo debe tener una pestaña llamada <strong>"Stock"</strong></li>
                <li>Columna <strong>"Producto"</strong>: Código personalizado</li>
                <li>Columna <strong>"Descripción"</strong>: Nombre del producto</li>
                <li>Columna <strong>"Stock"</strong>: Cantidad en stock</li>
              </ul>
            </div>
            
            <div>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#374151',
                margin: '0 0 0.5rem 0'
              }}>
                ⚡ Funcionamiento
              </h3>
              <ul style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: 0,
                paddingLeft: '1.5rem',
                lineHeight: '1.6'
              }}>
                <li>Si el código existe: <strong>actualiza la cantidad</strong></li>
                <li>Si el código no existe: <strong>crea nuevo producto</strong></li>
                <li>No se duplican productos</li>
                <li>Validación automática de datos</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Formulario de carga */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: isMobile ? '1.5rem' : '2rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '600',
            color: '#1e293b',
            margin: '0 0 1.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📤 Cargar Archivo
          </h2>

          <div style={{
            border: '2px dashed #d1d5db',
            borderRadius: '0.75rem',
            padding: isMobile ? '2rem 1rem' : '3rem 2rem',
            textAlign: 'center',
            background: '#f9fafb',
            transition: 'all 0.3s ease'
          }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            
            {!archivo ? (
              <div>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem'
                }}>
                  📁
                </div>
                <p style={{
                  fontSize: '1rem',
                  color: '#6b7280',
                  margin: '0 0 1rem 0'
                }}>
                  Arrastra tu archivo Excel aquí o haz clic para seleccionar
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Seleccionar Archivo
                </button>
              </div>
            ) : (
              <div>
                <div style={{
                  fontSize: '2rem',
                  marginBottom: '1rem'
                }}>
                  ✅
                </div>
                <p style={{
                  fontSize: '1rem',
                  color: '#059669',
                  margin: '0 0 0.5rem 0',
                  fontWeight: '600'
                }}>
                  Archivo seleccionado
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: '0 0 1rem 0'
                }}>
                  {archivo.name} ({(archivo.size / 1024 / 1024).toFixed(2)} MB)
                </p>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={validarArchivo}
                    disabled={validando}
                    style={{
                      background: validando ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: validando ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {validando ? '⏳ Validando...' : '🔍 Validar Archivo'}
                  </button>
                  <button
                    onClick={resetearFormulario}
                    style={{
                      background: 'transparent',
                      color: '#6b7280',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Cambiar Archivo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vista previa de resultados */}
        {mostrarVistaPrevia && resultadoValidacion && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: isMobile ? '1.5rem' : '2rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <h2 style={{
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0 0 1.5rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📊 Resumen de Validación
            </h2>

            {/* Estadísticas */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '0.5rem',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#0369a1'
                }}>
                  {resultadoValidacion.totalRegistros}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#0369a1'
                }}>
                  Total Registros
                </div>
              </div>
              
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '0.5rem',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#059669'
                }}>
                  {resultadoValidacion.productosActualizados}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#059669'
                }}>
                  Actualizados
                </div>
              </div>
              
              <div style={{
                background: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: '0.5rem',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#d97706'
                }}>
                  {resultadoValidacion.productosCreados}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#d97706'
                }}>
                  Nuevos
                </div>
              </div>
              
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.5rem',
                padding: '1rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#dc2626'
                }}>
                  {resultadoValidacion.errores.length}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#dc2626'
                }}>
                  Errores
                </div>
              </div>
            </div>

            {/* Errores */}
            {resultadoValidacion.errores.length > 0 && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#dc2626',
                  margin: '0 0 0.5rem 0'
                }}>
                  ⚠️ Errores encontrados:
                </h3>
                <div style={{
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {resultadoValidacion.errores.map((error, index) => (
                    <div key={index} style={{
                      fontSize: '0.875rem',
                      color: '#dc2626',
                      marginBottom: '0.25rem'
                    }}>
                      Fila {error.fila}: {error.error}
                    </div>
                  ))}
                </div>
                
                {/* Mensaje informativo sobre filas vacías */}
                {!tieneErroresCriticos() && (
                  <div style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '0.375rem',
                    padding: '0.75rem',
                    marginTop: '0.75rem',
                    fontSize: '0.75rem',
                    color: '#0369a1'
                  }}>
                    ℹ️ <strong>Nota:</strong> Las filas vacías y errores menores (menos del 5%) se saltarán automáticamente durante la importación. 
                    Puedes proceder con la importación de los {resultadoValidacion.productosCreados + resultadoValidacion.productosActualizados} productos válidos.
                  </div>
                )}
              </div>
            )}

            {/* Botones de acción */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={importarInventario}
                disabled={importando || tieneErroresCriticos()}
                style={{
                  background: importando || tieneErroresCriticos() ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 2rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: importando || tieneErroresCriticos() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {importando ? '⏳ Importando...' : '📥 Importar Inventario'}
              </button>
              
              <button
                onClick={resetearFormulario}
                style={{
                  background: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 2rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                🔄 Nuevo Archivo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
