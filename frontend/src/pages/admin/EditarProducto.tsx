import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import GestorImagenes from '../../components/GestorImagenes';
import NavbarAdmin from '../../components/NavbarAdmin';
import BarcodeScanner from '../../components/BarcodeScanner';
import { useResponsive } from '../../hooks/useResponsive';
import '../../styles/gestor-imagenes.css';
import Barcode from 'react-barcode';

const EditarProducto: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Usuario logueado
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const empresaId = user.empresaId;

  // Formulario
  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    stockMinimo: 5,
    categoria: '',
    marca: '',
    unidad: '',
    sectorAlmacenamiento: '',
    codigoPersonalizado: '',
    codigoBarras: '',
    activo: true,
    destacado: false,
    imagenes: [] as string[]
  });

  const [categorias, setCategorias] = useState<string[]>([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [mostrarOtraCategoria, setMostrarOtraCategoria] = useState(false);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [cargandoMarcas, setCargandoMarcas] = useState(true);
  const [marcasFiltradas, setMarcasFiltradas] = useState<string[]>([]);
  const [mostrarSugerenciasMarca, setMostrarSugerenciasMarca] = useState(false);
  const [mostrarScanner, setMostrarScanner] = useState(false);
  
  // Estados para autocomplete de sectores
  const [sectoresAlmacenamiento, setSectoresAlmacenamiento] = useState<string[]>([]);
  const [sectoresFiltrados, setSectoresFiltrados] = useState<string[]>([]);
  const [mostrarSugerenciasSector, setMostrarSugerenciasSector] = useState(false);
  const [sectorSeleccionadoIndex, setSectorSeleccionadoIndex] = useState(-1);
  
  // Estado para guardar el sector original del producto
  const [sectorOriginal, setSectorOriginal] = useState<string>('');

  const playBeepSound = () => {
    // Sonido simple de beep
    console.log('Beep! Código de barras escaneado');
  };

  const manejarEscaneoBarras = useCallback((codigoBarras: string) => {
    playBeepSound();
    setFormulario(prev => ({ ...prev, codigoBarras }));
    setMostrarScanner(false);
  }, []);

  const abrirScanner = useCallback(() => {
    setMostrarScanner(true);
  }, []);

  const manejarCambioImagenes = (imagenes: string[]) => {
    setFormulario(prev => ({
      ...prev,
      imagenes
    }));
  };

  const cargarProducto = useCallback(async () => {
    if (!id) {
      setError('ID de producto no válido');
      setCargando(false);
      return;
    }

    if (!empresaId) {
      setError('No se encontró información de empresa');
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError('');
      
      const response = await ApiService.obtenerProducto(empresaId, parseInt(id), true);
      
      if (response && response.data) {
        const producto = response.data;
        
        setFormulario({
          nombre: producto.nombre,
          descripcion: producto.descripcion || '',
          precio: producto.precio,
          stock: producto.stock,
          stockMinimo: producto.stockMinimo || 0,
          categoria: producto.categoria || '',
          marca: producto.marca || '',
          unidad: producto.unidad || '',
          sectorAlmacenamiento: producto.sectorAlmacenamiento || '',
          codigoPersonalizado: producto.codigoPersonalizado || '',
          codigoBarras: producto.codigoBarras || '',
          activo: producto.activo,
          destacado: producto.destacado || false,
          imagenes: producto.imagenes || []
        });
        
        // Guardar el sector original para comparar después
        setSectorOriginal(producto.sectorAlmacenamiento || '');
      } else {
        setError('Producto no encontrado o respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('Error detallado al cargar producto:', error);
      
      let mensajeError = 'Error al cargar el producto';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown } };
        
        if (axiosError.response?.status === 404) {
          mensajeError = 'Producto no encontrado. Puede haber sido eliminado.';
        } else if (axiosError.response?.status === 403) {
          mensajeError = 'No tienes permisos para acceder a este producto.';
        } else if (axiosError.response?.status === 401) {
          mensajeError = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        }
      }
      
      setError(mensajeError);
    } finally {
      setCargando(false);
    }
  }, [id, empresaId]);

  const cargarCategorias = useCallback(async () => {
    try {
      setCargandoCategorias(true);
      const response = await ApiService.obtenerCategorias(empresaId);
      if (response.data) {
        setCategorias(response.data);
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    } finally {
      setCargandoCategorias(false);
    }
  }, [empresaId]);

  const cargarMarcas = useCallback(async () => {
    try {
      setCargandoMarcas(true);
      const response = await ApiService.obtenerMarcas(empresaId);
      if (response.data) {
        setMarcas(response.data);
      }
    } catch (error) {
      console.error('Error al cargar marcas:', error);
    } finally {
      setCargandoMarcas(false);
    }
  }, [empresaId]);

  const cargarSectoresAlmacenamiento = useCallback(async () => {
    try {
      // Cargar sectores desde la gestión de sectores
      const response = await fetch(`/api/empresas/${empresaId}/sectores/todos`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Extraer solo los nombres de los sectores activos
        const sectoresActivos = (data.data || [])
          .filter((sector: any) => sector.activo)
          .map((sector: any) => sector.nombre);
        setSectoresAlmacenamiento(sectoresActivos);
      } else {
        console.error('Error al cargar sectores:', response.status);
      }
    } catch (error) {
      console.error('Error al cargar sectores de almacenamiento:', error);
    }
  }, [empresaId]);

  const manejarCambioMarca = (valor: string) => {
    manejarCambio('marca', valor);
    
    // Filtrar marcas que coincidan con lo que se está escribiendo
    if (valor.trim()) {
      const filtradas = marcas.filter(marca => 
        marca.toLowerCase().includes(valor.toLowerCase())
      );
      setMarcasFiltradas(filtradas);
      setMostrarSugerenciasMarca(filtradas.length > 0);
    } else {
      setMarcasFiltradas([]);
      setMostrarSugerenciasMarca(false);
    }
  };

  const seleccionarMarca = (marca: string) => {
    manejarCambio('marca', marca);
    setMarcasFiltradas([]);
    setMostrarSugerenciasMarca(false);
  };

  const manejarCambioSectorAlmacenamiento = useCallback((valor: string) => {
    manejarCambio('sectorAlmacenamiento', valor);
    
    // Resetear índice de selección
    setSectorSeleccionadoIndex(-1);
    
    // Filtrar sectores que coincidan con lo que está escribiendo
    if (valor.trim()) {
      const filtrados = sectoresAlmacenamiento.filter(sector =>
        sector.toLowerCase().includes(valor.toLowerCase())
      );
      setSectoresFiltrados(filtrados);
      setMostrarSugerenciasSector(filtrados.length > 0);
    } else {
      setSectoresFiltrados([]);
      setMostrarSugerenciasSector(false);
    }
  }, [sectoresAlmacenamiento]);

  const seleccionarSector = (sector: string) => {
    setFormulario(prev => ({ ...prev, sectorAlmacenamiento: sector }));
    setMostrarSugerenciasSector(false);
    setSectorSeleccionadoIndex(-1);
  };

  const crearNuevoSector = useCallback(async (nombreSector: string) => {
    try {
      const response = await fetch(`/api/empresas/${empresaId}/sectores`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: nombreSector,
          descripcion: `Sector creado automáticamente desde formulario de editar producto`,
          ubicacion: '',
          activo: true
        })
      });
      
      if (response.ok) {
        // Agregar el nuevo sector a la lista local
        setSectoresAlmacenamiento(prev => [...prev, nombreSector]);
        setExito(`Sector "${nombreSector}" creado exitosamente`);
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al crear sector');
        return false;
      }
    } catch (error) {
      console.error('Error al crear sector:', error);
      setError('Error al crear sector');
      return false;
    }
  }, [empresaId]);

  const manejarTecladoSector = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!mostrarSugerenciasSector) return;

    const totalOpciones = sectoresFiltrados.length + 
      (formulario.sectorAlmacenamiento.trim() && 
       !sectoresFiltrados.includes(formulario.sectorAlmacenamiento.trim()) ? 1 : 0);

    if (totalOpciones === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSectorSeleccionadoIndex(prev => 
          prev < totalOpciones - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSectorSeleccionadoIndex(prev => 
          prev > 0 ? prev - 1 : totalOpciones - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (sectorSeleccionadoIndex >= 0 && sectorSeleccionadoIndex < sectoresFiltrados.length) {
          seleccionarSector(sectoresFiltrados[sectorSeleccionadoIndex]);
        } else if (sectorSeleccionadoIndex === sectoresFiltrados.length && 
                   formulario.sectorAlmacenamiento.trim() && 
                   !sectoresFiltrados.includes(formulario.sectorAlmacenamiento.trim())) {
          // Crear nuevo sector
          crearNuevoSector(formulario.sectorAlmacenamiento.trim()).then(success => {
            if (success) {
              seleccionarSector(formulario.sectorAlmacenamiento.trim());
            }
          });
        }
        break;
      case 'Escape':
        setMostrarSugerenciasSector(false);
        setSectorSeleccionadoIndex(-1);
        break;
    }
  }, [mostrarSugerenciasSector, sectoresFiltrados, sectorSeleccionadoIndex, crearNuevoSector, formulario.sectorAlmacenamiento]);

  const generarCodigoBarras = useCallback(async () => {
    try {
      if (!empresaId) {
        setError('Error: No se encontró la empresa asociada');
        return;
      }
      const response = await ApiService.generarCodigoBarras(empresaId);
      if (
        response &&
        typeof response === 'object' &&
        'data' in response &&
        response.data &&
        typeof response.data === 'object' &&
        'codigoBarras' in response.data &&
        typeof (response.data as { codigoBarras?: string }).codigoBarras === 'string' &&
        (response.data as { codigoBarras?: string }).codigoBarras
      ) {
        setFormulario(prev => ({ ...prev, codigoBarras: (response.data as { codigoBarras: string }).codigoBarras }));
        setExito('Código de barras generado exitosamente');
      }
    } catch (error) {
      console.error('Error al generar código de barras:', error);
      setError('Error al generar código de barras');
    }
  }, [empresaId]);

  useEffect(() => {
    if (id) {
      cargarProducto();
    }
    cargarCategorias();
    cargarMarcas();
    cargarSectoresAlmacenamiento();
  }, [id, cargarProducto, cargarCategorias, cargarMarcas, cargarSectoresAlmacenamiento]);

  const manejarCambio = (campo: string, valor: string | number | boolean) => {
    setFormulario({ ...formulario, [campo]: valor });
    setError('');
    setExito('');
  };

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formulario.nombre.trim()) {
      setError('El nombre del producto es obligatorio');
      return;
    }

    if (formulario.precio < 0) {
      setError('El precio debe ser mayor o igual a cero');
      return;
    }

    if (formulario.stock < 0) {
      setError('El stock no puede ser negativo');
      return;
    }

    try {
      setGuardando(true);
      setError('');
      
      const datosProducto = {
        ...formulario,
        precio: formulario.precio ? Number(formulario.precio) : undefined,
        stock: Number(formulario.stock),
        stockMinimo: Number(formulario.stockMinimo)
      };

      if (id) {
        const response = await ApiService.actualizarProducto(empresaId, parseInt(id), datosProducto);
        
        if (response && response.data) {
          // Verificar si cambió el sector de almacenamiento
          const sectorAnterior = sectorOriginal;
          const sectorNuevo = formulario.sectorAlmacenamiento;
          
          console.log('🔍 DEBUG MIGRACIÓN - Sector anterior:', sectorAnterior);
          console.log('🔍 DEBUG MIGRACIÓN - Sector nuevo:', sectorNuevo);
          console.log('🔍 DEBUG MIGRACIÓN - ¿Son diferentes?', sectorAnterior !== sectorNuevo);
          console.log('🔍 DEBUG MIGRACIÓN - ¿Sector nuevo no está vacío?', sectorNuevo.trim() !== '');
          
          if (sectorAnterior !== sectorNuevo && sectorNuevo.trim()) {
            console.log('🔍 DEBUG MIGRACIÓN - Iniciando migración automática...');
            try {
              // Migrar el stock al nuevo sector
              const migracionResponse = await fetch(`/api/empresas/${empresaId}/productos/${id}/migrar-sector`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  sectorDestino: sectorNuevo
                })
              });
              
              console.log('🔍 DEBUG MIGRACIÓN - Respuesta migración:', migracionResponse.status);
              
              if (migracionResponse.ok) {
                console.log('🔍 DEBUG MIGRACIÓN - Migración exitosa');
                setExito('Producto actualizado correctamente y stock migrado al nuevo sector');
              } else {
                console.log('🔍 DEBUG MIGRACIÓN - Error en migración:', migracionResponse.status);
                setExito('Producto actualizado correctamente, pero hubo un problema al migrar el stock');
              }
            } catch (migracionError) {
              console.error('Error al migrar stock:', migracionError);
              setExito('Producto actualizado correctamente, pero hubo un problema al migrar el stock');
            }
          } else {
            console.log('🔍 DEBUG MIGRACIÓN - No se requiere migración');
            setExito('Producto actualizado correctamente');
          }
          
          setTimeout(() => {
            navigate('/admin/productos');
          }, 1500);
        } else {
          setError('Respuesta inesperada del servidor');
        }
      } else {
        const response = await ApiService.crearProducto(empresaId, datosProducto);
        
        if (response.data) {
          setExito('Producto creado correctamente');
          setTimeout(() => {
            navigate('/admin/productos');
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error detallado al guardar producto:', error);
      
      let mensajeError = 'Error al guardar el producto';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
        
        if (axiosError.response?.data?.error) {
          mensajeError = axiosError.response.data.error;
        } else if (axiosError.response?.status === 404) {
          mensajeError = 'Producto no encontrado. Puede haber sido eliminado.';
        } else if (axiosError.response?.status === 403) {
          mensajeError = 'No tienes permisos para realizar esta acción.';
        } else if (axiosError.response?.status === 401) {
          mensajeError = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        } else if (axiosError.response?.status === 400) {
          mensajeError = 'Datos de producto inválidos. Verifica la información ingresada.';
        }
      }
      
      setError(mensajeError);
      
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setGuardando(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  const descargarCodigoBarras = (elementId: string) => {
    console.log('🔍 Descargando código de barras...', elementId);
    
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('❌ Elemento no encontrado:', elementId);
      alert('No se pudo encontrar el código de barras');
      return;
    }
    
    const svg = element.querySelector('svg');
    if (!svg) {
      console.error('❌ SVG no encontrado en el elemento');
      alert('No se pudo generar el código de barras');
      return;
    }
    
    try {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      console.log('✅ SVG serializado correctamente');
      
      const canvas = document.createElement('canvas');
      const img = new window.Image();
      
      img.onload = function () {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const png = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = png;
            a.download = `codigo_barras_${formulario.codigoBarras || 'producto'}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            console.log('✅ Código de barras descargado exitosamente');
          }
        } catch (error) {
          console.error('❌ Error al generar PNG:', error);
          alert('Error al generar la imagen del código de barras');
        }
      };
      
      img.onerror = function() {
        console.error('❌ Error al cargar la imagen SVG');
        alert('Error al procesar el código de barras');
      };
      
      img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgString)));
    } catch (error) {
      console.error('❌ Error al serializar SVG:', error);
      alert('Error al procesar el código de barras');
    }
  };

  const imprimirCodigoBarras = (elementId: string) => {
    console.log('🔍 Imprimiendo código de barras...', elementId);
    
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('❌ Elemento no encontrado:', elementId);
      alert('No se pudo encontrar el código de barras');
      return;
    }
    
    const svg = element.querySelector('svg');
    if (!svg) {
      console.error('❌ SVG no encontrado en el elemento');
      alert('No se pudo generar el código de barras');
      return;
    }
    
    try {
      const w = window.open('', 'Imprimir código de barras');
      if (w) {
        w.document.write(`
          <html>
            <head>
              <title>Imprimir código de barras</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  font-family: Arial, sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                }
                .barcode-container {
                  text-align: center;
                  border: 1px solid #ccc;
                  padding: 20px;
                  border-radius: 8px;
                  background: white;
                }
                .barcode-title {
                  font-size: 18px;
                  font-weight: bold;
                  margin-bottom: 10px;
                  color: #333;
                }
                .barcode-code {
                  font-size: 14px;
                  color: #666;
                  margin-top: 10px;
                }
                svg {
                  max-width: 100%;
                  height: auto;
                }
              </style>
            </head>
            <body>
              <div class="barcode-container">
                <div class="barcode-title">Código de Barras del Producto</div>
                ${svg.outerHTML}
                <div class="barcode-code">Código: ${formulario.codigoBarras || 'N/A'}</div>
              </div>
            </body>
          </html>
        `);
        w.document.close();
        w.focus();
        
        setTimeout(() => {
          w.print();
          w.close();
          console.log('✅ Código de barras enviado a impresión');
        }, 500);
      } else {
        console.error('❌ No se pudo abrir la ventana de impresión');
        alert('No se pudo abrir la ventana de impresión. Verifica que el bloqueador de ventanas emergentes esté desactivado.');
      }
    } catch (error) {
      console.error('❌ Error al imprimir:', error);
      alert('Error al imprimir el código de barras');
    }
  };

  if (cargando) {
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
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#64748b', fontSize: '16px' }}>Cargando producto...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Navbar */}
      <NavbarAdmin 
        onCerrarSesion={cerrarSesion}
        empresaNombre={user.empresaNombre}
        nombreAdministrador={user.nombre}
      />

      {/* Contenido principal */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: isMobile ? '24px 16px' : '32px',
        paddingTop: isMobile ? 120 : 100
      }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 8px 0',
            lineHeight: '1.2'
          }}>
            {id ? 'Editar Producto' : 'Crear Nuevo Producto'}
          </h2>
          <p style={{
            color: '#64748b',
            fontSize: '16px',
            margin: 0
          }}>
            {id ? 'Modifica los datos del producto para actualizar tu inventario.' : 'Completa los datos del producto para añadirlo a tu catálogo.'}
          </p>
        </div>

        {/* Mensajes de estado */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {exito && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#16a34a',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            ✅ {exito}
          </div>
        )}

        {/* Formulario */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0'
        }}>
          <form onSubmit={manejarSubmit} style={{ display: 'grid', gap: '24px' }}>
            {/* Información Básica */}
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 20px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📋 Información Básica
              </h3>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                {/* Nombre */}
                <div>
                  <label htmlFor="nombre" style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    value={formulario.nombre}
                    onChange={(e) => manejarCambio('nombre', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      transition: 'all 0.2s ease'
                    }}
                    placeholder="Ej: Camiseta Básica Algodón"
                    required
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Marca */}
                <div style={{ position: 'relative' }}>
                  <label htmlFor="marca" style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Marca
                  </label>
                  {cargandoMarcas ? (
                    <div style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      color: '#64748b',
                      background: '#f8fafc'
                    }}>
                      Cargando marcas...
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        id="marca"
                        value={formulario.marca}
                        onChange={(e) => manejarCambioMarca(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '16px',
                          transition: 'all 0.2s ease'
                        }}
                        placeholder="Ej: Nike, Apple, Samsung..."
                        onFocus={(e) => {
                          e.target.style.borderColor = '#3b82f6';
                          e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.boxShadow = 'none';
                          setTimeout(() => {
                            setMostrarSugerenciasMarca(false);
                          }, 100);
                        }}
                      />
                      {mostrarSugerenciasMarca && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          maxHeight: '150px',
                          overflowY: 'auto',
                          zIndex: 1000,
                          marginTop: '2px'
                        }}>
                          {marcasFiltradas.map(marca => (
                            <div
                              key={marca}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#374151',
                                borderBottom: '1px solid #f3f4f6',
                                transition: 'background-color 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f8fafc';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              onClick={() => seleccionarMarca(marca)}
                            >
                              {marca}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Descripción */}
                <div>
                  <label htmlFor="descripcion" style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Descripción
                  </label>
                  <textarea
                    id="descripcion"
                    value={formulario.descripcion}
                    onChange={(e) => manejarCambio('descripcion', e.target.value)}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      resize: 'vertical',
                      transition: 'all 0.2s ease',
                      fontFamily: 'inherit'
                    }}
                    placeholder="Describe las características del producto..."
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Precios y Stock */}
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 20px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                💰 Precios y Stock
              </h3>
              
              <div style={{
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                gap: isMobile ? '16px' : '20px'
              }}>
                {/* Precio */}
                <div>
                  <label htmlFor="precio" style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Precio ($) (opcional)
                  </label>
                  <input
                    type="number"
                    id="precio"
                    value={formulario.precio}
                    onChange={(e) => manejarCambio('precio', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      transition: 'all 0.2s ease'
                    }}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Unidad */}
                <div>
                  <label htmlFor="unidad" style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Unidad
                  </label>
                  <input
                    type="text"
                    id="unidad"
                    value={formulario.unidad}
                    onChange={(e) => manejarCambio('unidad', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      transition: 'all 0.2s ease'
                    }}
                    placeholder="ej: kg, litro, unidad"
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Sector de Almacenamiento */}
                <div style={{ position: 'relative' }}>
                  <label htmlFor="sectorAlmacenamiento" style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Sector de Almacenamiento <span style={{ color: '#6b7280', fontWeight: '400' }}>(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    id="sectorAlmacenamiento"
                    value={formulario.sectorAlmacenamiento}
                    onChange={(e) => manejarCambioSectorAlmacenamiento(e.target.value)}
                    onKeyDown={manejarTecladoSector}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      transition: 'all 0.2s ease'
                    }}
                    placeholder="Escribe el nombre del sector o selecciona uno existente"
                    autoComplete="off"
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                      // Pequeño delay para permitir que el click en las sugerencias funcione
                      setTimeout(() => {
                        setMostrarSugerenciasSector(false);
                        setSectorSeleccionadoIndex(-1);
                      }, 150);
                    }}
                  />
                  {mostrarSugerenciasSector && sectoresFiltrados && sectoresFiltrados.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderTop: 'none',
                      borderRadius: '0 0 8px 8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      zIndex: 1000,
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      {sectoresFiltrados.map((sector, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '12px 16px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f3f4f6',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: index === sectorSeleccionadoIndex ? '#eff6ff' : 'transparent',
                            borderLeft: index === sectorSeleccionadoIndex ? '3px solid #3b82f6' : 'none'
                          }}
                          onClick={() => seleccionarSector(sector)}
                          onMouseEnter={() => setSectorSeleccionadoIndex(index)}
                        >
                          <span style={{ fontSize: '16px', color: '#6b7280' }}>🏢</span>
                          <span style={{ flex: 1, fontWeight: '500' }}>{sector}</span>
                          <span style={{
                            background: '#6b7280',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>Existente</span>
                        </div>
                      ))}
                      {formulario.sectorAlmacenamiento.trim() && 
                       !sectoresFiltrados.includes(formulario.sectorAlmacenamiento.trim()) && (
                        <div
                          style={{
                            padding: '12px 16px',
                            cursor: 'pointer',
                            borderTop: '2px solid #e5e7eb',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: '#fef3c7',
                            borderLeft: sectoresFiltrados.length === sectorSeleccionadoIndex ? '3px solid #3b82f6' : 'none'
                          }}
                          onClick={() => {
                            crearNuevoSector(formulario.sectorAlmacenamiento.trim()).then(success => {
                              if (success) {
                                seleccionarSector(formulario.sectorAlmacenamiento.trim());
                              }
                            });
                          }}
                          onMouseEnter={() => setSectorSeleccionadoIndex(sectoresFiltrados.length)}
                        >
                          <span style={{ fontSize: '16px', color: '#6b7280' }}>➕</span>
                          <span style={{ flex: 1, fontWeight: '500' }}>Crear sector "{formulario.sectorAlmacenamiento.trim()}"</span>
                          <span style={{
                            background: '#10b981',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>Nuevo</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Código Personalizado */}
                <div>
                  <label htmlFor="codigoPersonalizado" style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Código Personalizado <span style={{ color: '#6b7280', fontWeight: '400' }}>(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    id="codigoPersonalizado"
                    value={formulario.codigoPersonalizado}
                    onChange={(e) => manejarCambio('codigoPersonalizado', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      transition: 'all 0.2s ease'
                    }}
                    placeholder="Ej: 330, 420, EL001, ROP001"
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Código de Barras */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="codigoBarras" style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Código de Barras
                  </label>
                  <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: '8px',
                    alignItems: isMobile ? 'stretch' : 'center',
                    width: '100%'
                  }}>
                    <input
                      type="text"
                      id="codigoBarras"
                      value={formulario.codigoBarras}
                      onChange={(e) => manejarCambio('codigoBarras', e.target.value)}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: '12px 16px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '16px',
                        transition: 'all 0.2s ease',
                        minHeight: '44px',
                        maxWidth: '100%'
                      }}
                      placeholder="Ej: 1234567890123"
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <div style={{
                      display: 'flex',
                      flexDirection: isMobile ? 'row' : 'row',
                      gap: '8px',
                      marginTop: isMobile ? '8px' : 0
                    }}>
                      <button
                        type="button"
                        onClick={abrirScanner}
                        style={{
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '10px',
                          cursor: 'pointer',
                          fontSize: '18px',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '44px',
                          minHeight: '44px',
                          transition: 'all 0.2s ease'
                        }}
                        title="Escanear código de barras"
                      >
                        📷
                      </button>
                      <button
                        type="button"
                        onClick={generarCodigoBarras}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '10px',
                          cursor: 'pointer',
                          fontSize: '18px',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '44px',
                          minHeight: '44px',
                          transition: 'all 0.2s ease'
                        }}
                        title="Generar código de barras automáticamente"
                      >
                        🔄
                      </button>
                    </div>
                  </div>
                  {formulario.codigoBarras && (
                      <div style={{
                        marginTop: '16px',
                        textAlign: 'center',
                        width: '100%',
                        maxWidth: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: isMobile ? '0 10px' : '0'
                      }}>
                        <div 
                          id="barcode-preview-editar"
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            width: '100%',
                            maxWidth: isMobile ? 280 : 350,
                            margin: '0 auto'
                          }}
                        >
                          <Barcode
                            value={formulario.codigoBarras}
                            width={isMobile ? 1 : 2}
                            height={isMobile ? 50 : 80}
                            displayValue
                          />
                        </div>
                        <div style={{
                          marginTop: '10px',
                          display: 'flex',
                          gap: '8px',
                          justifyContent: 'center',
                          flexWrap: 'wrap',
                          width: '100%'
                        }}>
                          <button type="button" onClick={() => descargarCodigoBarras('barcode-preview-editar')} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease' }}>💾 Descargar</button>
                          <button type="button" onClick={() => imprimirCodigoBarras('barcode-preview-editar')} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease' }}>🖨️ Imprimir</button>
                        </div>
                      </div>
                    )}
                </div>

                {/* Stock Actual */}
                <div>
                  <label htmlFor="stock" style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Stock Actual *
                  </label>
                  <input
                    type="number"
                    id="stock"
                    value={formulario.stock}
                    onChange={(e) => manejarCambio('stock', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      transition: 'all 0.2s ease'
                    }}
                    placeholder="0"
                    min="0"
                    required
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Stock Mínimo */}
                <div>
                  <label htmlFor="stockMinimo" style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    id="stockMinimo"
                    value={formulario.stockMinimo}
                    onChange={(e) => manejarCambio('stockMinimo', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '16px',
                      transition: 'all 0.2s ease'
                    }}
                    placeholder="5"
                    min="0"
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Categoría */}
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 20px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📂 Categoría
              </h3>
              
              <div>
                <label htmlFor="categoria" style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Categoría *
                </label>
                {cargandoCategorias ? (
                  <div style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    color: '#64748b',
                    background: '#f8fafc'
                  }}>
                    Cargando categorías...
                  </div>
                ) : (
                  <>
                    <select
                      id="categoria"
                      value={mostrarOtraCategoria ? '__nueva__' : formulario.categoria}
                      onChange={(e) => {
                        if (e.target.value === '__nueva__') {
                          setMostrarOtraCategoria(true);
                          manejarCambio('categoria', '');
                        } else {
                          setMostrarOtraCategoria(false);
                          manejarCambio('categoria', e.target.value);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '16px',
                        transition: 'all 0.2s ease',
                        background: 'white'
                      }}
                      required
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <option value="">Selecciona una categoría</option>
                      {categorias.map(categoria => (
                        <option key={categoria} value={categoria}>
                          {categoria}
                        </option>
                      ))}
                      <option value="__nueva__">+ Agregar nueva categoría</option>
                    </select>
                    
                    {mostrarOtraCategoria && (
                      <div style={{ marginTop: '12px' }}>
                        <input
                          type="text"
                          placeholder="Escribe el nombre de la nueva categoría"
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '16px',
                            transition: 'all 0.2s ease'
                          }}
                          value={formulario.categoria}
                          onChange={(e) => manejarCambio('categoria', e.target.value)}
                          autoFocus
                          onFocus={(e) => {
                            e.target.style.borderColor = '#3b82f6';
                            e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e2e8f0';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Imágenes */}
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 20px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🖼️ Imágenes del Producto
              </h3>
              
              <GestorImagenes
                empresaId={empresaId}
                imagenesIniciales={formulario.imagenes}
                onChange={manejarCambioImagenes}
                maxImagenes={5}
                disabled={guardando}
              />
            </div>

            {/* Configuración del Producto */}
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 20px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ⚙️ Configuración
              </h3>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                {/* Producto Activo */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formulario.activo}
                    onChange={(e) => manejarCambio('activo', e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: '#3b82f6'
                    }}
                  />
                  <div>
                    <label htmlFor="activo" style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1e293b',
                      cursor: 'pointer'
                    }}>
                      Producto activo
                    </label>
                    <p style={{
                      fontSize: '14px',
                      color: '#64748b',
                      margin: '4px 0 0 0'
                    }}>
                      El producto aparecerá en el catálogo público
                    </p>
                  </div>
                </div>

                {/* Producto Destacado */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <input
                    type="checkbox"
                    id="destacado"
                    checked={formulario.destacado}
                    onChange={(e) => manejarCambio('destacado', e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: '#f97316'
                    }}
                  />
                  <div>
                    <label htmlFor="destacado" style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1e293b',
                      cursor: 'pointer'
                    }}>
                      Producto destacado
                    </label>
                    <p style={{
                      fontSize: '14px',
                      color: '#64748b',
                      margin: '4px 0 0 0'
                    }}>
                      El producto aparecerá en secciones especiales
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div style={{
              display: 'flex',
              gap: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #e2e8f0'
            }}>
              <button
                type="submit"
                disabled={guardando}
                style={{
                  flex: 1,
                  background: guardando ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '16px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: guardando ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  if (!guardando) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.3)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!guardando) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {guardando ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    {id ? 'Actualizando...' : 'Creando...'}
                  </>
                ) : (
                  <>
                    {id ? '✅ Actualizar Producto' : '➕ Crear Producto'}
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/admin/productos')}
                disabled={guardando}
                style={{
                  flex: 1,
                  background: guardando ? '#9ca3af' : 'white',
                  color: guardando ? '#6b7280' : '#374151',
                  border: '2px solid',
                  borderColor: guardando ? '#9ca3af' : '#e2e8f0',
                  borderRadius: '8px',
                  padding: '16px 24px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: guardando ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (!guardando) {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }
                }}
                onMouseOut={(e) => {
                  if (!guardando) {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }
                }}
              >
                ❌ Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Scanner de código de barras */}
      <BarcodeScanner
        isOpen={mostrarScanner}
        onScan={manejarEscaneoBarras}
        onClose={() => setMostrarScanner(false)}
      />
    </div>
  );
};

export default EditarProducto;
