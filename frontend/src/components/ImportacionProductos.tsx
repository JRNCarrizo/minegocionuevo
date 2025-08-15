import React, { useState, useRef } from 'react';
import ApiService from '../services/api';
import '../styles/importacion-productos.css';

interface ImportacionProducto {
  nombre: string;
  descripcion?: string;
  precio?: number;
  stock: number;
  categoria?: string;
  marca?: string;
  sectorAlmacenamiento?: string;
  codigoBarras?: string;
  codigoPersonalizado?: string;
}

interface ErrorImportacion {
  fila: number;
  error: string;
}

interface ResultadoImportacion {
  totalRegistros: number;
  registrosExitosos: number;
  registrosConErrores: number;
  errores: ErrorImportacion[];
  productosPreview: ImportacionProducto[];
  mensaje: string;
}

interface ImportacionProductosProps {
  empresaId: number;
  onImportacionCompletada: () => void;
  onCerrar: () => void;
}

const ImportacionProductos: React.FC<ImportacionProductosProps> = ({
  empresaId,
  onImportacionCompletada,
  onCerrar
}) => {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [resultadoValidacion, setResultadoValidacion] = useState<ResultadoImportacion | null>(null);
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [productosAImportar, setProductosAImportar] = useState<ImportacionProducto[]>([]);
  const [importando, setImportando] = useState(false);
  const [resultadoImportacion, setResultadoImportacion] = useState<ResultadoImportacion | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const descargarPlantilla = async () => {
    try {
      setCargando(true);
      
      console.log('🏢 Empresa ID:', empresaId);
      console.log('📥 Iniciando descarga de plantilla...');
      
      // Intentar primero con el endpoint directo nuevo
      let blob;
      try {
        blob = await ApiService.descargarPlantillaDirectaNueva();
        console.log('✅ Plantilla descargada usando endpoint directo nuevo');
      } catch (error) {
        console.log('⚠️ Endpoint directo nuevo falló, intentando endpoint independiente...');
        try {
          blob = await ApiService.descargarPlantillaIndependiente();
          console.log('✅ Plantilla descargada usando endpoint independiente');
        } catch (error2) {
          console.log('⚠️ Endpoint independiente falló, intentando endpoint Download...');
          try {
            blob = await ApiService.descargarPlantillaDownload();
            console.log('✅ Plantilla descargada usando endpoint Download');
          } catch (error3) {
            console.log('⚠️ Endpoint Download falló, intentando endpoint público...');
            try {
              blob = await ApiService.descargarPlantillaPublica();
              console.log('✅ Plantilla descargada usando endpoint público');
            } catch (error4) {
              console.log('⚠️ Endpoint público falló, intentando endpoint simple...');
              blob = await ApiService.descargarPlantillaSimple();
              console.log('✅ Plantilla descargada usando endpoint simple');
            }
          }
        }
      }
      
      // Crear un enlace para descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'plantilla_productos.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Plantilla descargada exitosamente');
      
    } catch (error: any) {
      console.error('❌ Error al descargar plantilla:', error);
      
      if (error.response) {
        const status = error.response.status;
        const errorMessage = error.response.data?.error || 'Error desconocido';
        alert(`❌ Error ${status}: ${errorMessage}`);
      } else {
        alert('❌ Error de conexión: ' + (error.message || 'Error desconocido'));
      }
    } finally {
      setCargando(false);
    }
  };

  const manejarSeleccionArchivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        alert('Solo se permiten archivos Excel (.xlsx)');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo no puede ser mayor a 10MB');
        return;
      }
      setArchivo(file);
      setResultadoValidacion(null);
      setMostrarPreview(false);
    }
  };

  const validarArchivo = async () => {
    if (!archivo) {
      alert('Por favor seleccione un archivo');
      return;
    }

    try {
      setCargando(true);
      const resultado = await ApiService.validarArchivoImportacion(empresaId, archivo);

      setResultadoValidacion(resultado);
      setProductosAImportar(resultado.productosPreview);
      
      if (resultado.registrosConErrores > 0) {
        alert(`Se encontraron ${resultado.registrosConErrores} errores. Revise los detalles antes de continuar.`);
      } else {
        alert('Archivo validado correctamente. Puede proceder con la importación.');
      }

    } catch (error: any) {
      console.error('Error al validar archivo:', error);
      const mensaje = error.response?.data?.error || 'Error al validar el archivo';
      alert(mensaje);
    } finally {
      setCargando(false);
    }
  };

  const importarProductos = async () => {
    if (productosAImportar.length === 0) {
      alert('No hay productos para importar');
      return;
    }

    try {
      setImportando(true);
      const resultado = await ApiService.importarProductos(empresaId, productosAImportar);

      setResultadoImportacion(resultado);
      
      if (resultado.registrosExitosos > 0) {
        alert(`Importación completada. ${resultado.registrosExitosos} productos creados exitosamente.`);
        onImportacionCompletada();
      } else {
        alert('No se pudieron importar productos. Revise los errores.');
      }

    } catch (error: any) {
      console.error('Error al importar productos:', error);
      const mensaje = error.response?.data?.error || 'Error al importar productos';
      alert(mensaje);
    } finally {
      setImportando(false);
    }
  };

  const limpiarFormulario = () => {
    setArchivo(null);
    setResultadoValidacion(null);
    setMostrarPreview(false);
    setProductosAImportar([]);
    setResultadoImportacion(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatearPrecio = (precio?: number) => {
    if (precio === undefined || precio === null) return 'No especificado';
    return `$${precio.toFixed(2)}`;
  };

  return (
    <div className="importacion-productos-overlay">
      <div className="importacion-productos-modal">
        <div className="importacion-productos-header">
          <h2>Importación Masiva de Productos</h2>
          <button className="cerrar-btn" onClick={onCerrar}>×</button>
        </div>

        <div className="importacion-productos-content">
          {/* Paso 1: Descargar plantilla */}
          <div className="paso-importacion">
            <h3>Paso 1: Descargar Plantilla</h3>
            <p>Descargue la plantilla Excel con el formato correcto para cargar sus productos.</p>
            <div className="flex gap-2">
                <button
                  type="button"
                  onClick={descargarPlantilla}
                  disabled={cargando}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  {cargando ? 'Descargando...' : '📥 Descargar Plantilla'}
                </button>
              </div>
          </div>

          {/* Paso 2: Seleccionar archivo */}
          <div className="paso-importacion">
            <h3>Paso 2: Seleccionar Archivo</h3>
            <p>Seleccione el archivo Excel con sus productos para validar.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={manejarSeleccionArchivo}
              className="archivo-input"
            />
            {archivo && (
              <div className="archivo-seleccionado">
                <span>Archivo seleccionado: {archivo.name}</span>
                <button 
                  className="btn-validar"
                  onClick={validarArchivo}
                  disabled={cargando}
                >
                  {cargando ? 'Validando...' : 'Validar Archivo'}
                </button>
              </div>
            )}
          </div>

          {/* Resultado de validación */}
          {resultadoValidacion && (
            <div className="resultado-validacion">
              <h3>Resultado de Validación</h3>
              <div className="estadisticas-validacion">
                <div className="stat">
                  <span className="stat-label">Total registros:</span>
                  <span className="stat-value">{resultadoValidacion.totalRegistros}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Válidos:</span>
                  <span className="stat-value valido">{resultadoValidacion.registrosExitosos}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Con errores:</span>
                  <span className="stat-value error">{resultadoValidacion.registrosConErrores}</span>
                </div>
              </div>

              {/* Errores */}
              {resultadoValidacion.errores.length > 0 && (
                <div className="errores-validacion">
                  <h4>Errores encontrados:</h4>
                  <div className="lista-errores">
                    {resultadoValidacion.errores.map((error, index) => (
                      <div key={index} className="error-item">
                        <span className="error-fila">Fila {error.fila}:</span>
                        <span className="error-mensaje">{error.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview de productos */}
              {resultadoValidacion.productosPreview.length > 0 && (
                <div className="preview-productos">
                  <h4>Vista previa de productos ({resultadoValidacion.productosPreview.length})</h4>
                  <button 
                    className="btn-toggle-preview"
                    onClick={() => setMostrarPreview(!mostrarPreview)}
                  >
                    {mostrarPreview ? 'Ocultar' : 'Mostrar'} vista previa
                  </button>
                  
                  {mostrarPreview && (
                    <div className="tabla-preview">
                      <table>
                                                                           <thead>
                            <tr>
                              <th>Nombre</th>
                              <th>Marca</th>
                              <th>Descripción</th>
                              <th>Precio</th>
                              <th>Stock</th>
                              <th>Categoría</th>
                              <th>Sector Almacenamiento</th>
                              <th>Código Personalizado</th>
                            </tr>
                          </thead>
                        <tbody>
                                                                               {resultadoValidacion.productosPreview.slice(0, 10).map((producto, index) => (
                              <tr key={index}>
                                <td>{producto.nombre}</td>
                                <td>{producto.marca || '-'}</td>
                                <td>{producto.descripcion || '-'}</td>
                                <td>{formatearPrecio(producto.precio)}</td>
                                <td>{producto.stock}</td>
                                <td>{producto.categoria || '-'}</td>
                                <td>{producto.sectorAlmacenamiento || '-'}</td>
                                <td>{producto.codigoPersonalizado || '-'}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {resultadoValidacion.productosPreview.length > 10 && (
                        <p className="preview-nota">
                          Mostrando los primeros 10 productos de {resultadoValidacion.productosPreview.length}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Botón de importación */}
              {resultadoValidacion.registrosExitosos > 0 && (
                <div className="acciones-importacion">
                  <button 
                    className="btn-importar"
                    onClick={importarProductos}
                    disabled={importando}
                  >
                    {importando ? 'Importando...' : `Importar ${resultadoValidacion.registrosExitosos} productos`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Resultado de importación */}
          {resultadoImportacion && (
            <div className="resultado-importacion">
              <h3>Resultado de Importación</h3>
              <div className="estadisticas-importacion">
                <div className="stat">
                  <span className="stat-label">Productos creados:</span>
                  <span className="stat-value exito">{resultadoImportacion.registrosExitosos}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Errores:</span>
                  <span className="stat-value error">{resultadoImportacion.registrosConErrores}</span>
                </div>
              </div>
              
              {resultadoImportacion.errores.length > 0 && (
                <div className="errores-importacion">
                  <h4>Errores durante la importación:</h4>
                  <div className="lista-errores">
                    {resultadoImportacion.errores.map((error, index) => (
                      <div key={index} className="error-item">
                        <span className="error-fila">Fila {error.fila}:</span>
                        <span className="error-mensaje">{error.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="acciones-finales">
            <button className="btn-limpiar" onClick={limpiarFormulario}>
              Limpiar Formulario
            </button>
            <button className="btn-cerrar" onClick={onCerrar}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportacionProductos;
