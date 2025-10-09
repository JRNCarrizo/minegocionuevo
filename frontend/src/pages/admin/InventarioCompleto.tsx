import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { usePermissions } from '../../hooks/usePermissions';
import { useResponsive } from '../../hooks/useResponsive';
import ApiService from '../../services/api';
import { API_CONFIG } from '../../config/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Sector {
  id: number;
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
}

interface Usuario {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  rol: string;
}

interface ConteoSector {
  id: number;
  sectorId: number;
  sectorNombre: string;
  sectorDescripcion?: string;
  usuario1Id?: number;
  usuario1Nombre?: string;
  usuario2Id?: number;
  usuario2Nombre?: string;
  estado: string;
  totalProductos: number;
  productosContados: number;
  porcentajeCompletado: number;
  fechaInicio: string;
  // Nuevos campos específicos por usuario
  estadoUsuario1?: string;
  estadoUsuario2?: string;
  fechaInicioUsuario1?: string;
  fechaInicioUsuario2?: string;
  productosContadosUsuario1?: number;
  productosContadosUsuario2?: number;
  // Campos de finalización
  conteo1Finalizado?: boolean;
  conteo2Finalizado?: boolean;
}

interface InventarioCompleto {
  id: number;
  fechaInicio: string;
  estado: string;
  totalSectores: number;
  sectoresCompletados: number;
  sectoresEnProgreso: number;
  sectoresPendientes: number;
  porcentajeCompletado: number;
  conteosSectores: ConteoSector[];
}

export default function InventarioCompleto() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { hasPermission } = usePermissions();
  const { isMobile, isTablet } = useResponsive();
  const navigate = useNavigate();
  const location = useLocation();

  // Agregar estilos CSS para animaciones
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shimmer {
        0% { left: -100%; }
        100% { left: 100%; }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  const [inventario, setInventario] = useState<InventarioCompleto | null>(null);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [usuariosAsignados, setUsuariosAsignados] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(false);
  const [creandoInventario, setCreandoInventario] = useState(false);
  const [mostrarModalAsignacion, setMostrarModalAsignacion] = useState(false);
  const [sectorSeleccionado, setSectorSeleccionado] = useState<Sector | null>(null);
  const [usuario1Seleccionado, setUsuario1Seleccionado] = useState<number | null>(null);
  const [usuario2Seleccionado, setUsuario2Seleccionado] = useState<number | null>(null);
  const [mostrarModalCancelacion, setMostrarModalCancelacion] = useState(false);
  const [mostrarModalFinalizacion, setMostrarModalFinalizacion] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [registrosInventarios, setRegistrosInventarios] = useState<any[]>([]);
  const [mostrarModalRegistro, setMostrarModalRegistro] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState<any>(null);
  
  // Estados para navegación por teclado
  const [modoNavegacion, setModoNavegacion] = useState(false);
  const [elementoSeleccionado, setElementoSeleccionado] = useState(0);

  useEffect(() => {
    if (datosUsuario) {
      cargarDatos();
      cargarRegistrosInventarios();
    }
  }, [datosUsuario]);

  // Debug para el modal de registro
  useEffect(() => {
    if (registroSeleccionado) {
      console.log('🔍 Modal - registroSeleccionado:', registroSeleccionado);
      console.log('🔍 Modal - productosActualizados:', registroSeleccionado?.productosActualizados);
      console.log('🔍 Modal - cantidad productos:', registroSeleccionado?.productosActualizados?.length);
    }
  }, [registroSeleccionado]);

  // Recargar datos cuando se monta el componente (para actualizar estados después de navegación)
  useEffect(() => {
    if (datosUsuario && !cargando) {
      cargarDatos();
    }
  }, []); // Se ejecuta solo al montar el componente

  // Recargar datos cuando se navega de vuelta a esta página
  useEffect(() => {
    if (datosUsuario && location.pathname === '/admin/inventario-completo') {
      console.log('🔄 Navegación detectada a inventario-completo, recargando datos...');
      
      // Si viene con estado de inventario actualizado, forzar recarga
      if (location.state?.inventarioActualizado) {
        console.log('📢 Estado de inventario actualizado detectado, forzando recarga...');
        setTimeout(() => {
          cargarDatos();
        }, 100); // Pequeño delay para asegurar que el estado se procese
      } else {
        cargarDatos();
      }
    }
  }, [location.pathname, location.state, datosUsuario]);

  // ✅ ESCUCHAR CAMBIOS: Recargar datos cuando hay cambios en el inventario
  useEffect(() => {
    const handleStorageChange = () => {
      const inventarioActualizado = localStorage.getItem('inventario_completo_actualizado');
      if (inventarioActualizado && datosUsuario) {
        console.log('📢 Cambio detectado en inventario completo, recargando datos...');
        cargarDatos();
        // Limpiar la notificación después de procesarla
        localStorage.removeItem('inventario_completo_actualizado');
      }
    };

    // Escuchar cambios en localStorage (para cambios desde otras pestañas)
    window.addEventListener('storage', handleStorageChange);
    
    // También verificar periódicamente si hay cambios (para cambios desde la misma pestaña)
    const intervalId = setInterval(() => {
      const inventarioActualizado = localStorage.getItem('inventario_completo_actualizado');
      if (inventarioActualizado && datosUsuario) {
        console.log('📢 Cambio detectado por polling, recargando datos...');
        cargarDatos();
        localStorage.removeItem('inventario_completo_actualizado');
      }
    }, 1000); // Verificar cada segundo
    
    // También verificar al montar el componente por si hay cambios pendientes
    const inventarioActualizado = localStorage.getItem('inventario_completo_actualizado');
    if (inventarioActualizado && datosUsuario) {
      console.log('📢 Cambio pendiente detectado al montar, recargando datos...');
      cargarDatos();
      localStorage.removeItem('inventario_completo_actualizado');
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [datosUsuario]);

  // Manejo de teclas para navegación
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorar si estamos en un input, textarea o select, o si algún modal está abierto
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.tagName === 'SELECT' ||
          mostrarModalAsignacion ||
          mostrarModalCancelacion ||
          mostrarModalFinalizacion) {
        return;
      }

      switch (event.key) {
        case 'Enter':
          event.preventDefault();
          if (modoNavegacion) {
            // Si hay un inventario activo, no hacer nada (solo navegación visual)
            // Si no hay inventario activo, crear uno nuevo
            if (!inventario && !creandoInventario) {
              crearInventarioCompleto();
            }
          } else {
            // Si no está en modo navegación, activarlo
            setModoNavegacion(true);
            setElementoSeleccionado(0);
          }
          break;

        case 'Escape':
          event.preventDefault();
          if (modoNavegacion) {
            setModoNavegacion(false);
            setElementoSeleccionado(0);
          } else {
            navigate('/admin/gestion-empresa');
          }
          break;

        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          if (!modoNavegacion) {
            setModoNavegacion(true);
            setElementoSeleccionado(0);
          }
          
          event.preventDefault();
          // Para esta página solo tenemos un elemento principal (el botón de crear)
          // Todas las flechas mantienen la selección en 0
          setElementoSeleccionado(0);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [modoNavegacion, elementoSeleccionado, navigate, inventario, creandoInventario, 
      mostrarModalAsignacion, mostrarModalCancelacion, mostrarModalFinalizacion]);


  // ✅ FUNCIÓN ESPECÍFICA: Solo actualizar datos del inventario (sin sectores ni usuarios)
  const cargarInventarioEspecifico = async (inventarioId?: number) => {
    try {
      console.log('🔄 Actualizando solo datos del inventario específico...');
      
      if (!datosUsuario?.empresaId) {
        console.error('❌ No se pudo obtener la información de la empresa');
        return;
      }

      // Solo cargar el inventario activo
      const token = localStorage.getItem('token');
      const baseUrl = API_CONFIG.getBaseUrl();
      const inventarioResponse = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/activo`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (inventarioResponse.ok) {
        const inventarioData = await inventarioResponse.json();
        console.log('✅ Inventario actualizado:', inventarioData);
        
        // Actualizar solo los estados del inventario y conteos
        setInventario(inventarioData);
        setConteosSectores(inventarioData.conteosSectores || []);
        
        console.log('✅ Estados actualizados sin recargar página completa');
      } else {
        console.error('❌ Error actualizando inventario:', inventarioResponse.status);
      }
    } catch (error) {
      console.error('❌ Error en cargarInventarioEspecifico:', error);
    }
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      
      console.log('🔍 InventarioCompleto - cargarDatos iniciado');
      console.log('🔍 datosUsuario:', datosUsuario);
      console.log('🔍 empresaId:', datosUsuario?.empresaId);
      console.log('🔍 token presente:', !!localStorage.getItem('token'));
      
      if (!datosUsuario?.empresaId) {
        console.error('❌ No se pudo obtener la información de la empresa');
        toast.error('No se pudo obtener la información de la empresa');
        return;
      }

      try {
        // Cargar sectores usando ApiService
        const sectoresResponse = await ApiService.obtenerSectores(datosUsuario.empresaId);
        console.log('✅ Sectores cargados:', sectoresResponse);
        if (sectoresResponse.data) {
          setSectores(sectoresResponse.data);
        } else {
          setSectores([]);
        }
      } catch (error) {
        console.error('❌ Error cargando sectores:', error);
      }

      try {
        // Cargar usuarios asignados usando fetch con configuración correcta
        const token = localStorage.getItem('token');
        const baseUrl = API_CONFIG.getBaseUrl();
        const usuariosResponse = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/usuarios?rol=ASIGNADO`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (usuariosResponse.ok) {
          const usuariosData = await usuariosResponse.json();
          console.log('✅ Usuarios asignados cargados:', usuariosData);
          setUsuariosAsignados(usuariosData);
        } else {
          console.error('❌ Error cargando usuarios:', usuariosResponse.status);
          const errorData = await usuariosResponse.text();
          console.error('❌ Error details usuarios:', errorData);
        }
      } catch (error) {
        console.error('❌ Error cargando usuarios:', error);
      }


      try {
        // Cargar inventario activo usando fetch con configuración correcta
        const token = localStorage.getItem('token');
        const baseUrl = API_CONFIG.getBaseUrl();
        const inventarioResponse = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/activo`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (inventarioResponse.ok) {
          const inventarioData = await inventarioResponse.json();
          console.log('✅ Inventario activo cargado:', inventarioData);
          console.log('✅ Conteos de sectores:', inventarioData.conteosSectores);
          console.log('🔍 DEBUG - Estado del inventario:', {
            id: inventarioData.id,
            estado: inventarioData.estado,
            sectoresCompletados: inventarioData.sectoresCompletados,
            totalSectores: inventarioData.totalSectores,
            porcentajeCompletado: inventarioData.porcentajeCompletado
          });
          
          // Debug adicional para verificar si se debe mostrar el botón
          const debeMostrarBoton = inventarioData.sectoresCompletados === inventarioData.totalSectores && 
                                  inventarioData.totalSectores > 0 && 
                                  datosUsuario?.rol === 'ADMINISTRADOR';
          console.log('🔍 DEBUG - ¿Debe mostrar botón consolidar?', {
            sectoresCompletados: inventarioData.sectoresCompletados,
            totalSectores: inventarioData.totalSectores,
            sonIguales: inventarioData.sectoresCompletados === inventarioData.totalSectores,
            totalSectoresMayorCero: inventarioData.totalSectores > 0,
            esAdministrador: datosUsuario?.rol === 'ADMINISTRADOR',
            resultado: debeMostrarBoton
          });
          
          // Debug específico para estados de conteos
          if (inventarioData.conteosSectores) {
            inventarioData.conteosSectores.forEach((conteo: any, index: number) => {
              console.log(`🔍 Conteo ${index + 1} COMPLETO:`, conteo);
              console.log(`🔍 Conteo ${index + 1} RESUMEN:`, {
                id: conteo.id,
                sectorId: conteo.sectorId,
                sectorNombre: conteo.sectorNombre,
                estado: conteo.estado,
                estadoUsuario1: conteo.estadoUsuario1,
                estadoUsuario2: conteo.estadoUsuario2,
                usuario1Id: conteo.usuario1Id,
                usuario2Id: conteo.usuario2Id,
                conteo1Finalizado: conteo.conteo1Finalizado,
                conteo2Finalizado: conteo.conteo2Finalizado,
                fechaConteo1Finalizacion: conteo.fechaConteo1Finalizacion,
                fechaConteo2Finalizacion: conteo.fechaConteo2Finalizacion
              });
              
              // Debug específico para campos de finalización
              console.log(`🔍 Conteo ${index + 1} CAMPOS FINALIZACIÓN:`, {
                conteo1Finalizado: conteo.conteo1Finalizado,
                conteo2Finalizado: conteo.conteo2Finalizado,
                tipoConteo1Finalizado: typeof conteo.conteo1Finalizado,
                tipoConteo2Finalizado: typeof conteo.conteo2Finalizado
              });
            });
          }
          // ✅ Verificar si hay un inventario activo REAL antes de establecerlo
          if (inventarioData.inventarioActivo !== false && inventarioData.id) {
            const inventarioConDefaults = {
              ...inventarioData,
              totalSectores: inventarioData.totalSectores || 0,
              sectoresCompletados: inventarioData.sectoresCompletados || 0,
              sectoresEnProgreso: inventarioData.sectoresEnProgreso || 0,
              sectoresPendientes: inventarioData.sectoresPendientes || 0,
              porcentajeCompletado: inventarioData.porcentajeCompletado || 0,
              conteosSectores: inventarioData.conteosSectores || []
            };
            console.log('✅ Inventario con defaults:', inventarioConDefaults);
            console.log('✅ Inventario ID cargado:', inventarioConDefaults.id);
            setInventario(inventarioConDefaults);
          } else {
            console.log('ℹ️ No hay inventario activo real');
            setInventario(null);
          }
        } else if (inventarioResponse.status === 404) {
          console.log('ℹ️ No hay inventario activo');
          setInventario(null);
        } else {
          console.error('❌ Error cargando inventario activo:', inventarioResponse.status);
          const errorData = await inventarioResponse.text();
          console.error('❌ Error details:', errorData);
        }
      } catch (error) {
        console.error('❌ Error cargando inventario activo:', error);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  const cargarRegistrosInventarios = async () => {
    try {
      if (!datosUsuario?.empresaId) return;
      
      const token = localStorage.getItem('token');
      const baseUrl = API_CONFIG.getBaseUrl();
      const response = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/registros`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRegistrosInventarios(data.registros || []);
      } else {
        console.error('Error cargando registros de inventarios');
      }
    } catch (error) {
      console.error('Error cargando registros:', error);
    }
  };

  const verRegistro = async (registro: any) => {
    try {
      console.log('🔍 Abriendo modal de registro:', registro);
      
      // Cargar productos actualizados del inventario
      const token = localStorage.getItem('token');
      const baseUrl = API_CONFIG.getBaseUrl();
      const url = `${baseUrl}/empresas/${datosUsuario?.empresaId}/inventario-completo/${registro.inventarioId}/productos-actualizados`;
      
      console.log('🔍 URL para cargar productos actualizados:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Respuesta del servidor:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Datos recibidos del servidor:', data);
        registro.productosActualizados = data.productosActualizados;
        console.log('🔍 Registro con productos actualizados:', registro);
        setRegistroSeleccionado(registro);
        setMostrarModalRegistro(true);
      } else {
        const errorData = await response.json();
        console.error('❌ Error cargando productos actualizados:', errorData);
        setRegistroSeleccionado(registro);
        setMostrarModalRegistro(true);
      }
    } catch (error) {
      console.error('❌ Error cargando productos actualizados:', error);
      setRegistroSeleccionado(registro);
      setMostrarModalRegistro(true);
    }
  };

  const exportarInventarioPDF = async (registro: any) => {
    try {
      toast.loading('Generando PDF...', { id: 'export-pdf' });
      
      // Cargar productos actualizados del inventario
      const token = localStorage.getItem('token');
      const baseUrl = API_CONFIG.getBaseUrl();
      const url = `${baseUrl}/empresas/${datosUsuario?.empresaId}/inventario-completo/${registro.inventarioId}/productos-actualizados`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let productosActualizados = [];
      if (response.ok) {
        const data = await response.json();
        productosActualizados = data.productosActualizados || [];
      }

      // Crear el PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Configurar colores
      const primaryColor = [124, 58, 237]; // Morado
      const secondaryColor = [100, 116, 139]; // Gris
      const successColor = [16, 185, 129]; // Verde

      // Header del documento
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      // Logo de la empresa (si existe)
      let yOffset = 15;
      if (datosUsuario?.empresaLogoUrl) {
        try {
          // Cargar logo como imagen
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          await new Promise((resolve, reject) => {
            img.onload = () => {
              try {
                doc.addImage(img, 'PNG', 14, 8, 30, 30);
                resolve(true);
              } catch (e) {
                console.warn('No se pudo agregar el logo al PDF');
                resolve(false);
              }
            };
            img.onerror = () => resolve(false);
            img.src = datosUsuario.empresaLogoUrl;
          });
          yOffset = 15;
        } catch (error) {
          console.warn('Error cargando logo para PDF');
        }
      }
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE DE INVENTARIO', pageWidth / 2, yOffset, { align: 'center' });
      
      // Nombre de la empresa
      if (datosUsuario?.empresaNombre) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(datosUsuario.empresaNombre, pageWidth / 2, yOffset + 10, { align: 'center' });
      }
      
      doc.setFontSize(10);
      doc.text(registro.nombreInventario, pageWidth / 2, yOffset + 18, { align: 'center' });

      // Información general
      let yPos = 65;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Información General', 14, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...secondaryColor);
      
      const infoData = [
        ['Fecha de Realización:', new Date(registro.fechaRealizacion).toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })],
        ['Responsable:', registro.usuarioResponsable],
        ['Estado:', 'COMPLETADO'],
        ['Productos Procesados:', productosActualizados.length.toString()]
      ];

      infoData.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 14, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 70, yPos);
        yPos += 7;
      });

      // Tabla de productos
      if (productosActualizados.length > 0) {
        yPos += 10;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Detalle de Productos', 14, yPos);
        
        yPos += 5;

        // Preparar datos de la tabla
        const tableData = productosActualizados.map((item: any) => {
          return [
            item.codigoProducto || 'N/A',
            item.nombreProducto || 'Sin nombre',
            item.stockAnterior?.toString() || '0',
            item.stockNuevo?.toString() || '0',
            item.diferenciaStock?.toString() || '0'
          ];
        });

        autoTable(doc, {
          startY: yPos,
          head: [['Código', 'Producto', 'Stock Anterior', 'Stock Nuevo', 'Diferencia']],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'center'
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [30, 41, 59]
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          columnStyles: {
            0: { cellWidth: 25, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 25, halign: 'center' },
            4: { 
              cellWidth: 25, 
              halign: 'center',
              cellPadding: 2
            }
          },
          didParseCell: function(data: any) {
            // Colorear la columna de diferencia
            if (data.column.index === 4 && data.section === 'body') {
              const valor = parseInt(data.cell.text[0]);
              if (valor !== 0) {
                data.cell.styles.textColor = valor > 0 ? [16, 185, 129] : [239, 68, 68];
                data.cell.styles.fontStyle = 'bold';
              }
            }
          },
          margin: { left: 14, right: 14 },
          didDrawPage: function(data: any) {
            // Footer en cada página
            const pageCount = doc.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(...secondaryColor);
            
            // Nombre de empresa en el footer
            if (datosUsuario?.empresaNombre) {
              doc.text(
                datosUsuario.empresaNombre,
                14,
                pageHeight - 10
              );
            }
            
            doc.text(
              `Página ${data.pageNumber} de ${pageCount}`,
              pageWidth / 2,
              pageHeight - 10,
              { align: 'center' }
            );
            doc.text(
              `Generado: ${new Date().toLocaleString('es-ES')}`,
              pageWidth - 14,
              pageHeight - 10,
              { align: 'right' }
            );
          }
        });
      }

      // Guardar el PDF
      const filename = `inventario_${registro.nombreInventario.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
      doc.save(filename);
      
      toast.success('PDF generado exitosamente', { id: 'export-pdf' });
    } catch (error) {
      console.error('Error exportando PDF:', error);
      toast.error('Error al generar el PDF', { id: 'export-pdf' });
    }
  };

  const crearInventarioCompleto = async () => {
    try {
      setCreandoInventario(true);
      
      if (!datosUsuario?.empresaId) {
        toast.error('No se pudo obtener la información de la empresa');
        return;
      }

      const token = localStorage.getItem('token');
      const baseUrl = API_CONFIG.getBaseUrl();
      const response = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Respuesta crear inventario:', responseData);
        
        const inventarioCreado = responseData.inventario || responseData;
        
        const inventarioConDefaults = {
          ...inventarioCreado,
          totalSectores: inventarioCreado.totalSectores || 0,
          sectoresCompletados: inventarioCreado.sectoresCompletados || 0,
          sectoresEnProgreso: inventarioCreado.sectoresEnProgreso || 0,
          sectoresPendientes: inventarioCreado.sectoresPendientes || 0,
          porcentajeCompletado: inventarioCreado.porcentajeCompletado || 0,
          conteosSectores: inventarioCreado.conteosSectores || []
        };
        
        console.log('✅ Inventario con defaults:', inventarioConDefaults);
        console.log('✅ Inventario ID:', inventarioConDefaults.id);
        
        toast.success('Inventario completo creado exitosamente');
        setInventario(inventarioConDefaults);
      } else if (response.status === 400) {
        const errorData = await response.json();
        if (errorData.error && errorData.error.includes('Ya existe un inventario completo en progreso')) {
          toast.success('Ya existe un inventario en progreso. Cargando inventario existente...');
          await cargarDatos();
        } else {
          toast.error(errorData.error || 'Error al crear el inventario');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al crear el inventario');
      }
    } catch (error) {
      console.error('Error creando inventario:', error);
      toast.error('Error al crear el inventario');
    } finally {
      setCreandoInventario(false);
    }
  };

  const asignarUsuarios = async () => {
    if (!sectorSeleccionado || !usuario1Seleccionado || !usuario2Seleccionado) {
      toast.error('Debe seleccionar ambos usuarios');
      return;
    }
    
    if (usuario1Seleccionado === usuario2Seleccionado) {
      toast.error('Los usuarios deben ser diferentes');
      return;
    }

    try {
      if (!datosUsuario?.empresaId) {
        toast.error('No se pudo obtener la información de la empresa');
        return;
      }
    
      if (!inventario?.id) {
        toast.error('No se pudo obtener la información del inventario');
        return;
      }

      if (!sectorSeleccionado?.id) {
        toast.error('No se pudo obtener la información del sector');
        return;
      }

      const token = localStorage.getItem('token');
      const baseUrl = API_CONFIG.getBaseUrl();
      const response = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/${inventario.id}/sectores/${sectorSeleccionado.id}/asignar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          usuario1Id: usuario1Seleccionado,
          usuario2Id: usuario2Seleccionado
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Respuesta de asignación:', responseData);
        toast.success('Usuarios asignados exitosamente');
        setMostrarModalAsignacion(false);
        setSectorSeleccionado(null);
        setUsuario1Seleccionado(null);
        setUsuario2Seleccionado(null);
        
        // Actualizar el estado local en lugar de recargar toda la página
        if (inventario && sectorSeleccionado) {
          setInventario(prevInventario => {
            if (!prevInventario) return prevInventario;
            
            // Verificar si ya existe un conteo para este sector
            const conteoExistente = prevInventario.conteosSectores?.find(c => c.sectorId === sectorSeleccionado.id);
            
            let nuevosConteosSectores;
            if (conteoExistente) {
              // Actualizar conteo existente
              nuevosConteosSectores = prevInventario.conteosSectores?.map(conteo => {
                if (conteo.sectorId === sectorSeleccionado.id) {
                  return {
                    ...conteo,
                    usuario1Id: usuario1Seleccionado,
                    usuario2Id: usuario2Seleccionado,
                    usuario1Nombre: usuariosAsignados.find(u => u.id === usuario1Seleccionado)?.nombre || 'Usuario 1',
                    usuario2Nombre: usuariosAsignados.find(u => u.id === usuario2Seleccionado)?.nombre || 'Usuario 2'
                  };
                }
                return conteo;
              }) || [];
            } else {
              // Crear nuevo conteo para el sector
              const nuevoConteo = {
                id: Date.now(), // ID temporal
                sectorId: sectorSeleccionado.id,
                sectorNombre: sectorSeleccionado.nombre,
                estado: 'PENDIENTE',
                usuario1Id: usuario1Seleccionado,
                usuario2Id: usuario2Seleccionado,
                usuario1Nombre: usuariosAsignados.find(u => u.id === usuario1Seleccionado)?.nombre || 'Usuario 1',
                usuario2Nombre: usuariosAsignados.find(u => u.id === usuario2Seleccionado)?.nombre || 'Usuario 2',
                productosContados: 0,
                totalProductos: 0,
                porcentajeCompletado: 0,
                productosConDiferencias: 0,
                fechaInicio: new Date().toISOString()
              };
              
              nuevosConteosSectores = [...(prevInventario.conteosSectores || []), nuevoConteo];
            }
            
            return {
              ...prevInventario,
              conteosSectores: nuevosConteosSectores
            };
          });
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al asignar usuarios');
      }
    } catch (error) {
      console.error('Error asignando usuarios:', error);
      toast.error('Error al asignar usuarios');
    }
  };

  const cancelarCompletadoSinConteo = async (sector: Sector) => {
    try {
      if (!datosUsuario?.empresaId || !inventario?.id) {
        toast.error('No se pudo obtener la información del inventario');
        return;
      }

      const token = localStorage.getItem('token');
      const baseUrl = API_CONFIG.getBaseUrl();
      
      const response = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/${inventario.id}/cancelar-sector-completado-sin-conteo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sectorId: sector.id,
          sectorNombre: sector.nombre
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Respuesta del backend:', responseData);
        toast.success(`Sector "${sector.nombre}" vuelve a estado pendiente`);
        
        // ✅ RECARGA INTELIGENTE: Solo actualizar datos del inventario específico
        console.log('🔄 Actualizando datos del inventario específico...');
        await cargarInventarioEspecifico(inventario?.id);
        
      } else {
        const errorData = await response.json();
        console.error('❌ Error del backend:', errorData);
        toast.error(errorData.message || 'Error al cancelar el completado sin conteo');
      }
    } catch (error) {
      console.error('Error cancelando completado sin conteo:', error);
      toast.error('Error al cancelar el completado sin conteo');
    }
  };

  const marcarSectorCompletadoSinConteo = async (sector: Sector) => {
    try {
      if (!datosUsuario?.empresaId || !inventario?.id) {
        toast.error('No se pudo obtener la información del inventario');
        return;
      }

      const token = localStorage.getItem('token');
      const baseUrl = API_CONFIG.getBaseUrl();
      
      const response = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/${inventario.id}/marcar-sector-completado-sin-conteo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sectorId: sector.id,
          sectorNombre: sector.nombre
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Respuesta del backend:', responseData);
        toast.success(`Sector "${sector.nombre}" marcado como completado sin conteo`);
        
        // ✅ RECARGA INTELIGENTE: Solo actualizar datos del inventario específico
        console.log('🔄 Actualizando datos del inventario específico...');
        await cargarInventarioEspecifico(inventario?.id);
        
      } else {
        const errorData = await response.json();
        console.error('❌ Error del backend:', errorData);
        toast.error(errorData.message || 'Error al marcar el sector como completado');
      }
    } catch (error) {
      console.error('Error marcando sector como completado:', error);
      toast.error('Error al marcar el sector como completado');
    }
  };

  const cancelarInventario = async () => {
    try {
      setCancelando(true);
      
      if (!datosUsuario?.empresaId || !inventario?.id) {
        toast.error('No se pudo obtener la información del inventario');
        return;
      }

      const token = localStorage.getItem('token');
      const baseUrl = API_CONFIG.getBaseUrl();
      const response = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/${inventario.id}/cancelar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Inventario cancelado exitosamente');
        setMostrarModalCancelacion(false);
        setInventario(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al cancelar el inventario');
      }
    } catch (error) {
      console.error('Error cancelando inventario:', error);
      toast.error('Error al cancelar el inventario');
    } finally {
      setCancelando(false);
    }
  };

  const finalizarInventario = async () => {
    try {
      setFinalizando(true);
      
      if (!datosUsuario?.empresaId || !inventario?.id) {
        toast.error('No se pudo obtener la información del inventario');
        return;
      }

      const token = localStorage.getItem('token');
      const baseUrl = API_CONFIG.getBaseUrl();
      const response = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/${inventario.id}/finalizar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await response.json();
        toast.success('Inventario finalizado exitosamente');
        setMostrarModalFinalizacion(false);
        
        // Navegar a la vista de productos consolidados
        navigate(`/admin/inventario-completo/${inventario.id}/productos-consolidados`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al finalizar el inventario');
      }
    } catch (error) {
      console.error('Error finalizando inventario:', error);
      toast.error('Error al finalizar el inventario');
    } finally {
      setFinalizando(false);
    }
  };

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return '#f59e0b';
      case 'EN_PROGRESO':
        return '#3b82f6';
      case 'COMPLETADO':
        return '#10b981';
      case 'COMPLETADO_SIN_CONTEO':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  const obtenerColoresSector = (sectorId: number) => {
    const colores = [
      {
        gradient: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
        border: '#64748b',
        header: '#f8fafc',
        text: '#1e293b',
        accent: '#64748b'
      },
      {
        gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        border: '#d97706',
        header: '#f8fafc',
        text: '#1e293b',
        accent: '#d97706'
      },
      {
        gradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
        border: '#2563eb',
        header: '#f8fafc',
        text: '#1e293b',
        accent: '#2563eb'
      },
      {
        gradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
        border: '#059669',
        header: '#f8fafc',
        text: '#1e293b',
        accent: '#059669'
      },
      {
        gradient: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
        border: '#be185d',
        header: '#f8fafc',
        text: '#1e293b',
        accent: '#be185d'
      },
      {
        gradient: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
        border: '#7c3aed',
        header: '#f8fafc',
        text: '#1e293b',
        accent: '#7c3aed'
      },
      {
        gradient: 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
        border: '#dc2626',
        header: '#f8fafc',
        text: '#1e293b',
        accent: '#dc2626'
      },
      {
        gradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
        border: '#16a34a',
        header: '#f8fafc',
        text: '#1e293b',
        accent: '#16a34a'
      }
    ];
    return colores[sectorId % colores.length];
  };

  const obtenerTextoEstado = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'Pendiente';
      case 'EN_PROGRESO':
        return 'En Progreso';
      case 'CON_DIFERENCIAS':
        return 'Con Diferencias';
      case 'COMPLETADO':
        return 'Completado';
      case 'COMPLETADO_SIN_CONTEO':
        return 'Completado sin Conteo';
      default:
        return estado;
    }
  };

  // Función para obtener estilos del botón cuando está seleccionado
  const obtenerEstilosBoton = (esSeleccionado: boolean, esDisabled: boolean) => {
    const baseStyles = {
      background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      padding: '1rem 2rem',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: esDisabled ? 'not-allowed' : 'pointer',
      opacity: esDisabled ? 0.7 : 1,
      transition: 'all 0.3s ease',
      position: 'relative' as const,
      overflow: 'hidden'
    };

    if (esSeleccionado && !esDisabled) {
      return {
        ...baseStyles,
        transform: 'scale(1.05)',
        boxShadow: '0 8px 25px rgba(124, 58, 237, 0.4)',
        border: '3px solid #3b82f6'
      };
    }

    return baseStyles;
  };

  // Función para obtener estilos del indicador de selección
  const obtenerEstilosIndicador = () => {
    return {
      position: 'absolute' as const,
      top: '-4px',
      left: '-4px',
      right: '-4px',
      bottom: '-4px',
      border: '3px solid #3b82f6',
      borderRadius: '0.5rem',
      pointerEvents: 'none' as const,
      zIndex: 10,
      opacity: 1,
      boxShadow: '0 0 20px #3b82f640'
    };
  };

  const esUsuarioAsignadoAlSector = (conteo: ConteoSector) => {
    if (!datosUsuario?.id) {
      console.log('🔍 esUsuarioAsignadoAlSector: No hay datosUsuario.id');
      return false;
    }
    
    // Verificar tipos de datos
    const usuarioActualId = datosUsuario.id;
    const usuario1Id = conteo.usuario1Id;
    const usuario2Id = conteo.usuario2Id;
    
    console.log('🔍 TIPOS DE DATOS:', {
      usuarioActualId: usuarioActualId,
      tipoUsuarioActualId: typeof usuarioActualId,
      usuario1Id: usuario1Id,
      tipoUsuario1Id: typeof usuario1Id,
      usuario2Id: usuario2Id,
      tipoUsuario2Id: typeof usuario2Id
    });
    
    // Convertir a números para comparación
    const esAsignado = (Number(usuario1Id) === Number(usuarioActualId)) || (Number(usuario2Id) === Number(usuarioActualId));
    
    console.log('🔍 esUsuarioAsignadoAlSector:', {
      conteoId: conteo.id,
      sectorNombre: conteo.sectorNombre,
      usuarioActualId: usuarioActualId,
      usuario1Id: usuario1Id,
      usuario2Id: usuario2Id,
      esAsignado: esAsignado,
      comparacion1: Number(usuario1Id) === Number(usuarioActualId),
      comparacion2: Number(usuario2Id) === Number(usuarioActualId)
    });
    
    return esAsignado;
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
            width: '50px',
            height: '50px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #7c3aed',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280', margin: 0 }}>Cargando inventario completo...</p>
        </div>
      </div>
    );
  }

  return (
    <>
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
          maxWidth: '1200px',
          margin: '0 auto',
          paddingTop: isMobile ? '8rem' : '9rem',
          paddingBottom: isMobile ? '1rem' : '2rem',
          paddingLeft: isMobile ? '1rem' : '2rem',
          paddingRight: isMobile ? '1rem' : '2rem'
        }}>
          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <h1 style={{
              color: 'white',
              fontSize: isMobile ? '1.8rem' : '2.5rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>
              🏢 Inventario Completo
            </h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: isMobile ? '1rem' : '1.2rem',
              margin: 0
            }}>
              Inventario de todos los sectores con doble verificación
            </p>
            
            {/* Instrucciones de navegación */}
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'inline-block'
            }}>
              <div style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.9rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <span><strong>Enter</strong> Crear Inventario</span>
                <span><strong>Esc</strong> Volver</span>
              </div>
            </div>
          </div>
          
          {!inventario ? (
            /* Crear nuevo inventario */
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '4rem',
                marginBottom: '1rem'
              }}>
                📋
              </div>
              <h2 style={{
                margin: '0 0 1rem 0',
                color: '#1e293b',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}>
                Crear Nuevo Inventario Completo
              </h2>
              <p style={{
                color: '#64748b',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                Inicia un inventario completo de todos los sectores de tu empresa. 
                Cada sector será asignado a dos usuarios para doble verificación.
              </p>
              <button
                onClick={crearInventarioCompleto}
                disabled={creandoInventario}
                style={obtenerEstilosBoton(modoNavegacion && elementoSeleccionado === 0, creandoInventario)}
              >
                {/* Indicador de selección */}
                {modoNavegacion && elementoSeleccionado === 0 && !creandoInventario && (
                  <div style={obtenerEstilosIndicador()}></div>
                )}
                {creandoInventario ? 'Creando...' : 'Crear Inventario Completo'}
              </button>
            </div>
            
          ) : (
            /* Inventario existente */
            <div>
              {/* Resumen del inventario */}
              <div style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0',
                marginBottom: '3rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <h2 style={{
                    margin: 0,
                    color: '#1e293b',
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}>
                    Inventario #{inventario.id}
                  </h2>
                  <span style={{
                    background: obtenerColorEstado(inventario.estado),
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '1rem',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}>
                    {obtenerTextoEstado(inventario.estado)}
                  </span>
                </div>

                {/* Estadísticas */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#1e293b',
                      marginBottom: '0.25rem'
                    }}>
                      {inventario.totalSectores || 0}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#64748b'
                    }}>
                      Total Sectores
                    </div>
                  </div>
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#10b981',
                      marginBottom: '0.25rem'
                    }}>
                      {inventario.sectoresCompletados || 0}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#64748b'
                    }}>
                      Completados
                    </div>
                  </div>
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#3b82f6',
                      marginBottom: '0.25rem'
                    }}>
                      {inventario.sectoresEnProgreso || 0}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#64748b'
                    }}>
                      En Progreso
                    </div>
                  </div>
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#f59e0b',
                      marginBottom: '0.25rem'
                    }}>
                      {inventario.sectoresPendientes || 0}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#64748b'
                    }}>
                      Pendientes
                    </div>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div style={{
                  background: '#f1f5f9',
                  borderRadius: '0.5rem',
                  height: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                    height: '100%',
                    width: `${inventario.porcentajeCompletado || 0}%`,
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.5rem'
                }}>
                  <span style={{
                    fontSize: '0.9rem',
                    color: '#64748b'
                  }}>
                    Progreso General
                  </span>
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: '#1e293b'
                  }}>
                    {(inventario.porcentajeCompletado || 0).toFixed(1)}%
                  </span>
                </div>
                
                {/* Botón para ver vista consolidada cuando todos los sectores estén completados - Solo para administradores */}
                {inventario.sectoresCompletados === inventario.totalSectores && inventario.totalSectores > 0 && datosUsuario?.rol === 'ADMINISTRADOR' && (
                  <div style={{
                    marginTop: '1.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid #e2e8f0',
                    textAlign: 'center'
                  }}>
                    <button
                      onClick={() => navigate(`/admin/inventario-completo/${inventario.id}/productos-consolidados`)}
                      style={{
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.75rem',
                        padding: '1rem 2rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(139, 92, 246, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(139, 92, 246, 0.3)';
                      }}
                    >
                      📊 Ver Lista Consolidada y Comparar con Stock
                    </button>
                    <p style={{
                      margin: '0.75rem 0 0 0',
                      fontSize: '0.85rem',
                      color: '#64748b',
                      fontStyle: 'italic'
                    }}>
                      Revisa todos los productos consolidados y compara con el stock real del sistema
                    </p>
                  </div>
                )}
                
                {/* Botones de gestión del administrador */}
                {datosUsuario?.rol === 'ADMINISTRADOR' && (
                  <div style={{
                    marginTop: '1.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => setMostrarModalCancelacion(true)}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      🗑️ Cancelar Inventario
                    </button>
                    
                    {inventario.estado === 'EN_PROGRESO' && inventario.sectoresCompletados === inventario.totalSectores && (
                      <button
                        onClick={() => setMostrarModalFinalizacion(true)}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          padding: '0.75rem 1.5rem',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        ✅ Finalizar Inventario
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Sectores del inventario */}
              <div style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{
                  margin: '0 0 1.5rem 0',
                  color: '#1e293b',
                  fontSize: '1.3rem',
                  fontWeight: 'bold'
                }}>
                  Sectores del Inventario 📋
                </h3>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(380px, 1fr))',
                  gap: isMobile ? '1rem' : '1.5rem',
                  padding: isMobile ? '0.5rem' : '0'
                }}>
                  {sectores.map((sector) => {
                    const conteo = inventario.conteosSectores?.find(c => c.sectorId === sector.id);
                    const colores = obtenerColoresSector(sector.id);
                    
                    // Debug específico para verificar el objeto conteo en el render
                    if (conteo && conteo.id === 29) {
                      console.log('🔍 DEBUG CONTEOSECTOR EN RENDER:', conteo);
                      console.log('🔍 DEBUG CAMPOS FINALIZACIÓN EN RENDER:', {
                        conteo1Finalizado: conteo.conteo1Finalizado,
                        conteo2Finalizado: conteo.conteo2Finalizado
                      });
                    }
                    return (
                      <div
                        key={sector.id}
                        style={{
                          background: 'white',
                          borderRadius: '1rem',
                          padding: isMobile ? '1rem' : '1.5rem',
                          border: `1px solid #e2e8f0`,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
                          position: 'relative',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          transform: 'translateY(0)',
                          backdropFilter: 'blur(10px)',
                          backgroundImage: `linear-gradient(135deg, ${colores.gradient.replace('linear-gradient(135deg, ', '').replace(')', '')}, rgba(255, 255, 255, 0.95))`
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.1)';
                          e.currentTarget.style.borderColor = colores.accent;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '1rem'
                        }}>
                          <div>
                            <h5 style={{
                              margin: '0 0 0.5rem 0',
                              color: colores.accent,
                              fontSize: '1.2rem',
                              fontWeight: '700',
                              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                              letterSpacing: '0.025em'
                            }}>
                              {sector.nombre}
                            </h5>
                            {sector.descripcion && (
                              <p style={{
                                margin: 0,
                                color: '#64748b',
                                fontSize: '0.9rem'
                              }}>
                                {sector.descripcion}
                              </p>
                            )}
                          </div>
                          <span style={{
                            background: (() => {
                              if (!conteo) return '#6b7280';
                              
                              // Verificar si el usuario actual está asignado
                              const esUsuario1 = conteo.usuario1Id === datosUsuario?.id;
                              const esUsuario2 = conteo.usuario2Id === datosUsuario?.id;
                              
                              if (esUsuario1 || esUsuario2) {
                                // Usar el color del estado específico del usuario
                                const estadoUsuarioActual = esUsuario1 ? conteo.estadoUsuario1 : conteo.estadoUsuario2;
                                return obtenerColorEstado(estadoUsuarioActual || 'PENDIENTE');
                              } else {
                                // Si no está asignado, usar el color del estado general
                                return obtenerColorEstado(conteo.estado);
                              }
                            })(),
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.8rem',
                            fontWeight: '500'
                          }}>
                            {(() => {
                              if (!conteo) return 'PENDIENTE';
                              
                              // Verificar si el usuario actual está asignado
                              const esUsuario1 = conteo.usuario1Id === datosUsuario?.id;
                              const esUsuario2 = conteo.usuario2Id === datosUsuario?.id;
                              
                              if (esUsuario1 || esUsuario2) {
                                // Mostrar el estado específico del usuario
                                const estadoUsuarioActual = esUsuario1 ? conteo.estadoUsuario1 : conteo.estadoUsuario2;
                                return obtenerTextoEstado(estadoUsuarioActual || 'PENDIENTE');
                              } else {
                                // Si no está asignado, mostrar el estado general
                                return obtenerTextoEstado(conteo.estado);
                              }
                            })()}
                          </span>
                        </div>

                        {/* Información de usuarios asignados - Diseño moderno */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                          gap: isMobile ? '0.75rem' : '1rem',
                          marginBottom: '1.25rem'
                        }}>
                          <div style={{
                            background: (() => {
                              // ✅ DESTACADO VISUAL: Si el usuario actual es el Usuario 1
                              const esUsuarioActual = conteo?.usuario1Id === datosUsuario?.id;
                              return esUsuarioActual ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)' : 'rgba(255, 255, 255, 0.7)';
                            })(),
                            borderRadius: '0.75rem',
                            padding: isMobile ? '0.875rem' : '1rem',
                            border: (() => {
                              // ✅ DESTACADO VISUAL: Borde especial para el usuario actual
                              const esUsuarioActual = conteo?.usuario1Id === datosUsuario?.id;
                              if (esUsuarioActual) {
                                return `2px solid #3b82f6`;
                              }
                              return `1px solid ${conteo?.usuario1Nombre ? colores.accent + '30' : '#e2e8f0'}`;
                            })(),
                            backdropFilter: 'blur(10px)',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: (() => {
                              // ✅ DESTACADO VISUAL: Sombra especial para el usuario actual
                              const esUsuarioActual = conteo?.usuario1Id === datosUsuario?.id;
                              return esUsuarioActual ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none';
                            })()
                          }}>
                            {conteo?.usuario1Nombre && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '3px',
                                background: (() => {
                                  // ✅ DESTACADO VISUAL: Color especial para el usuario actual
                                  const esUsuarioActual = conteo?.usuario1Id === datosUsuario?.id;
                                  return esUsuarioActual ? '#3b82f6' : colores.accent;
                                })(),
                                borderRadius: '0.75rem 0.75rem 0 0'
                              }}></div>
                            )}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '0.5rem'
                            }}>
                              <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: (() => {
                                  // ✅ DESTACADO VISUAL: Color especial para el usuario actual
                                  const esUsuarioActual = conteo?.usuario1Id === datosUsuario?.id;
                                  if (esUsuarioActual) {
                                    return '#3b82f6';
                                  }
                                  return conteo?.usuario1Nombre ? colores.accent : '#94a3b8';
                                })(),
                                boxShadow: (() => {
                                  const esUsuarioActual = conteo?.usuario1Id === datosUsuario?.id;
                                  if (esUsuarioActual) {
                                    return '0 0 0 2px rgba(59, 130, 246, 0.3)';
                                  }
                                  return `0 0 0 2px ${conteo?.usuario1Nombre ? colores.accent + '30' : '#94a3b830'}`;
                                })()
                              }}></div>
                              <span style={{
                                fontSize: isMobile ? '0.75rem' : '0.8rem',
                              color: '#64748b',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                              Usuario 1
                              </span>
                              {/* ✅ DESTACADO VISUAL: Ícono especial para el usuario actual */}
                              {conteo?.usuario1Id === datosUsuario?.id && (
                                <span style={{
                                  fontSize: '0.75rem',
                                  color: '#3b82f6',
                                  fontWeight: 'bold',
                                  background: 'rgba(59, 130, 246, 0.1)',
                                  padding: '0.125rem 0.375rem',
                                  borderRadius: '0.375rem',
                                  border: '1px solid rgba(59, 130, 246, 0.2)'
                                }}>
                                  TÚ
                                </span>
                              )}
                            </div>
                            <div style={{
                              fontSize: isMobile ? '0.85rem' : '0.9rem',
                              fontWeight: '600',
                              color: (() => {
                                // ✅ DESTACADO VISUAL: Color especial para el nombre del usuario actual
                                const esUsuarioActual = conteo?.usuario1Id === datosUsuario?.id;
                                if (esUsuarioActual) {
                                  return '#1e40af';
                                }
                                return conteo?.usuario1Nombre ? '#1e293b' : '#94a3b8';
                              })(),
                              lineHeight: '1.3'
                            }}>
                              {conteo?.usuario1Nombre || 'No asignado'}
                            </div>
                          </div>
                          <div style={{
                            background: (() => {
                              // ✅ DESTACADO VISUAL: Si el usuario actual es el Usuario 2
                              const esUsuarioActual = conteo?.usuario2Id === datosUsuario?.id;
                              return esUsuarioActual ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)' : 'rgba(255, 255, 255, 0.7)';
                            })(),
                            borderRadius: '0.75rem',
                            padding: isMobile ? '0.875rem' : '1rem',
                            border: (() => {
                              // ✅ DESTACADO VISUAL: Borde especial para el usuario actual
                              const esUsuarioActual = conteo?.usuario2Id === datosUsuario?.id;
                              if (esUsuarioActual) {
                                return `2px solid #3b82f6`;
                              }
                              return `1px solid ${conteo?.usuario2Nombre ? colores.accent + '30' : '#e2e8f0'}`;
                            })(),
                            backdropFilter: 'blur(10px)',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: (() => {
                              // ✅ DESTACADO VISUAL: Sombra especial para el usuario actual
                              const esUsuarioActual = conteo?.usuario2Id === datosUsuario?.id;
                              return esUsuarioActual ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none';
                            })()
                          }}>
                            {conteo?.usuario2Nombre && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '3px',
                                background: (() => {
                                  // ✅ DESTACADO VISUAL: Color especial para el usuario actual
                                  const esUsuarioActual = conteo?.usuario2Id === datosUsuario?.id;
                                  return esUsuarioActual ? '#3b82f6' : colores.accent;
                                })(),
                                borderRadius: '0.75rem 0.75rem 0 0'
                              }}></div>
                            )}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '0.5rem'
                            }}>
                              <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: (() => {
                                  // ✅ DESTACADO VISUAL: Color especial para el usuario actual
                                  const esUsuarioActual = conteo?.usuario2Id === datosUsuario?.id;
                                  if (esUsuarioActual) {
                                    return '#3b82f6';
                                  }
                                  return conteo?.usuario2Nombre ? colores.accent : '#94a3b8';
                                })(),
                                boxShadow: (() => {
                                  const esUsuarioActual = conteo?.usuario2Id === datosUsuario?.id;
                                  if (esUsuarioActual) {
                                    return '0 0 0 2px rgba(59, 130, 246, 0.3)';
                                  }
                                  return `0 0 0 2px ${conteo?.usuario2Nombre ? colores.accent + '30' : '#94a3b830'}`;
                                })()
                              }}></div>
                              <span style={{
                                fontSize: isMobile ? '0.75rem' : '0.8rem',
                              color: '#64748b',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                              Usuario 2
                              </span>
                              {/* ✅ DESTACADO VISUAL: Ícono especial para el usuario actual */}
                              {conteo?.usuario2Id === datosUsuario?.id && (
                                <span style={{
                                  fontSize: '0.75rem',
                                  color: '#3b82f6',
                                  fontWeight: 'bold',
                                  background: 'rgba(59, 130, 246, 0.1)',
                                  padding: '0.125rem 0.375rem',
                                  borderRadius: '0.375rem',
                                  border: '1px solid rgba(59, 130, 246, 0.2)'
                                }}>
                                  TÚ
                                </span>
                              )}
                            </div>
                            <div style={{
                              fontSize: isMobile ? '0.85rem' : '0.9rem',
                              fontWeight: '600',
                              color: (() => {
                                // ✅ DESTACADO VISUAL: Color especial para el nombre del usuario actual
                                const esUsuarioActual = conteo?.usuario2Id === datosUsuario?.id;
                                if (esUsuarioActual) {
                                  return '#1e40af';
                                }
                                return conteo?.usuario2Nombre ? '#1e293b' : '#94a3b8';
                              })(),
                              lineHeight: '1.3'
                            }}>
                              {conteo?.usuario2Nombre || 'No asignado'}
                            </div>
                          </div>
                        </div>

                        {/* Progreso del sector - Diseño moderno */}
                        <div style={{
                          background: 'rgba(255, 255, 255, 0.8)',
                          borderRadius: '0.75rem',
                          padding: isMobile ? '1rem' : '1.25rem',
                          border: `1px solid ${colores.accent}20`,
                          marginBottom: '1.25rem',
                          backdropFilter: 'blur(10px)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          {/* Indicador de progreso animado */}
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            background: `linear-gradient(90deg, ${colores.accent}, ${colores.accent}80)`,
                            borderRadius: '0.75rem 0.75rem 0 0'
                          }}></div>
                          
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.75rem'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: conteo ? colores.accent : '#94a3b8',
                                boxShadow: `0 0 0 2px ${conteo ? colores.accent + '30' : '#94a3b830'}`
                              }}></div>
                            <span style={{
                                fontSize: isMobile ? '0.8rem' : '0.9rem',
                              fontWeight: '600',
                                color: '#1e293b',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                              Progreso
                            </span>
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                            <span style={{
                                fontSize: isMobile ? '0.75rem' : '0.8rem',
                                fontWeight: '700',
                                color: conteo ? colores.accent : '#94a3b8',
                                background: conteo ? `${colores.accent}15` : '#f1f5f9',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.375rem',
                                border: `1px solid ${conteo ? colores.accent + '30' : '#e2e8f0'}`
                            }}>
                              {conteo ? (
                                conteo.totalProductos && conteo.totalProductos > 0 
                                    ? `${Math.round((conteo.productosContados || 0) * 100 / conteo.totalProductos)}%`
                                    : `${conteo.productosContados || 0} productos`
                              ) : (
                                  '0%'
                              )}
                            </span>
                          </div>
                          </div>
                          
                          {/* Barra de progreso mejorada */}
                          <div style={{
                            background: '#f1f5f9',
                            borderRadius: '0.5rem',
                            height: isMobile ? '8px' : '10px',
                            overflow: 'hidden',
                            position: 'relative',
                            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)'
                          }}>
                            <div style={{
                              background: conteo ? `linear-gradient(90deg, ${colores.accent}, ${colores.accent}80)` : '#e2e8f0',
                              height: '100%',
                              width: `${conteo ? (
                                conteo.totalProductos && conteo.totalProductos > 0 
                                  ? Math.round((conteo.productosContados || 0) * 100 / conteo.totalProductos)
                                  : (conteo.porcentajeCompletado || 0)
                              ) : 0}%`,
                              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                              borderRadius: '0.5rem',
                              position: 'relative',
                              overflow: 'hidden'
                            }}>
                              {/* Efecto de brillo animado */}
                              {conteo && (
                                <div style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: '-100%',
                                  width: '100%',
                                  height: '100%',
                                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                                  animation: 'shimmer 2s infinite'
                            }}></div>
                              )}
                          </div>
                        </div>

                          {/* Información detallada */}
                          {conteo && (
                        <div style={{
                          display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginTop: '0.75rem',
                              fontSize: isMobile ? '0.75rem' : '0.8rem',
                              color: '#64748b'
                            }}>
                              <span>
                                {conteo.productosContados || 0} de {conteo.totalProductos || 0} productos
                              </span>
                              {(conteo as any).productosConDiferencias > 0 && (
                                <span style={{
                                  color: '#ef4444',
                                  fontWeight: '600'
                                }}>
                                  {(conteo as any).productosConDiferencias} diferencias
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Botones de acción - Diseño moderno y responsive */}
                        <div style={{
                          display: 'flex',
                          flexDirection: isMobile ? 'column' : 'row',
                          gap: isMobile ? '0.75rem' : '0.5rem',
                          justifyContent: isMobile ? 'stretch' : 'flex-end',
                          marginTop: 'auto'
                        }}>
                          {(!conteo || !conteo.usuario1Nombre || !conteo.usuario2Nombre) && datosUsuario?.rol === 'ADMINISTRADOR' && conteo?.estado !== 'COMPLETADO_SIN_CONTEO' ? (
                            <div style={{ 
                              display: 'flex', 
                              flexDirection: isMobile ? 'column' : 'row',
                              gap: isMobile ? '0.75rem' : '0.5rem',
                              width: isMobile ? '100%' : 'auto'
                            }}>
                              <button
                                onClick={() => {
                                  setSectorSeleccionado(sector);
                                  setMostrarModalAsignacion(true);
                                }}
                                style={{
                                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.75rem',
                                  padding: isMobile ? '0.875rem 1.25rem' : '0.75rem 1.5rem',
                                  fontSize: isMobile ? '0.9rem' : '0.85rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  transform: 'translateY(0)',
                                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  width: isMobile ? '100%' : 'auto',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.5rem'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                                }}
                              >
                                <span>👥</span>
                                Asignar Usuarios
                              </button>
                              <button
                                onClick={() => marcarSectorCompletadoSinConteo(sector)}
                                style={{
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.75rem',
                                  padding: isMobile ? '0.875rem 1.25rem' : '0.75rem 1.5rem',
                                  fontSize: isMobile ? '0.9rem' : '0.85rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  transform: 'translateY(0)',
                                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  width: isMobile ? '100%' : 'auto',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.5rem'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
                                }}
                              >
                                <span>✅</span>
                                Dar por completado
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              {/* Mostrar botón "Cancelar y Contar" si el sector está completado sin conteo */}
                              {conteo?.estado === 'COMPLETADO_SIN_CONTEO' && datosUsuario?.rol === 'ADMINISTRADOR' ? (
                                <button
                                  onClick={() => cancelarCompletadoSinConteo(sector)}
                                  style={{
                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.75rem',
                                    padding: isMobile ? '0.875rem 1.25rem' : '0.75rem 1.5rem',
                                    fontSize: isMobile ? '0.9rem' : '0.85rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    transform: 'translateY(0)',
                                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    width: isMobile ? '100%' : 'auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
                                  }}
                                >
                                  <span>❌</span>
                                  Cancelar y Contar
                                </button>
                              ) : (
                                <>
                              {datosUsuario?.rol === 'ADMINISTRADOR' && (
                                <button
                                  onClick={() => {
                                    setSectorSeleccionado(sector);
                                    setMostrarModalAsignacion(true);
                                  }}
                                  style={{
                                    background: '#f59e0b',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    transform: 'scale(1)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#d97706';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#f59e0b';
                                    e.currentTarget.style.transform = 'scale(1)';
                                  }}
                                >
                                  🔄 Reasignar
                                </button>
                              )}
                              
                              {(() => {
                                // Verificar si hay usuarios asignados
                                const tieneUsuariosAsignados = conteo && conteo.usuario1Id && conteo.usuario2Id;
                                
                                if (!tieneUsuariosAsignados) {
                                  // Mostrar botón para asignar usuarios (solo para administradores)
                                  return datosUsuario?.rol === 'ADMINISTRADOR';
                                }
                                
                                const esAsignado = conteo && esUsuarioAsignadoAlSector(conteo);
                                
                                // Lógica mejorada: cada usuario puede hacer su conteo independientemente
                                const esUsuario1 = conteo && conteo.usuario1Id === datosUsuario?.id;
                                const esUsuario2 = conteo && conteo.usuario2Id === datosUsuario?.id;
                                
                                // Lógica basada en estados específicos por usuario
                                const estadoUsuarioActual = esUsuario1 ? conteo.estadoUsuario1 : conteo.estadoUsuario2;
                                const productosContadosUsuarioActual = esUsuario1 ? conteo.productosContadosUsuario1 : conteo.productosContadosUsuario2;
                                
                                console.log('🔍 DEBUG estadoUsuarioActual:', {
                                  esUsuario1: esUsuario1,
                                  esUsuario2: esUsuario2,
                                  estadoUsuario1: conteo.estadoUsuario1,
                                  estadoUsuario2: conteo.estadoUsuario2,
                                  estadoUsuarioActual: estadoUsuarioActual,
                                  conteo1Finalizado: conteo.conteo1Finalizado,
                                  conteo2Finalizado: conteo.conteo2Finalizado
                                });
                                
                                console.log('🔍 DEBUG CONTEOSECTOR COMPLETO:', conteo);
                                
                                // Debug específico para verificar si el objeto conteo tiene los campos de finalización
                                console.log('🔍 DEBUG CAMPOS FINALIZACIÓN EN LOG:', {
                                  conteo1Finalizado: conteo.conteo1Finalizado,
                                  conteo2Finalizado: conteo.conteo2Finalizado,
                                  tipoConteo1Finalizado: typeof conteo.conteo1Finalizado,
                                  tipoConteo2Finalizado: typeof conteo.conteo2Finalizado
                                });
                                
                                
                                // ✅ CORRECCIÓN: Verificar si el usuario ya completó su reconteo
                                const usuarioYaCompletoReconteo = (esUsuario1 && conteo?.conteo1Finalizado) || 
                                                               (esUsuario2 && conteo?.conteo2Finalizado);
                                
                                const puedeIniciarConteo = esAsignado && conteo && !usuarioYaCompletoReconteo && (
                                  // ✅ CORREGIDO: No permitir iniciar conteo si el sector ya está completado
                                  conteo.estado !== 'COMPLETADO' && (
                                    // Si el usuario no ha iniciado su conteo (estado PENDIENTE)
                                    estadoUsuarioActual === 'PENDIENTE' ||
                                    // Si el usuario ya inició su conteo (estado EN_PROGRESO)
                                    estadoUsuarioActual === 'EN_PROGRESO' ||
                                    // Si hay diferencias y necesita reconteo (estado CON_DIFERENCIAS)
                                    conteo.estado === 'CON_DIFERENCIAS' ||
                                    // Si el estado específico del usuario es CON_DIFERENCIAS (para reconteo)
                                    estadoUsuarioActual === 'CON_DIFERENCIAS' ||
                                    // ✅ CORRECCIÓN: Solo permitir reconteo cuando el usuario específico debe hacer reconteo
                                    (conteo.estado === 'ESPERANDO_SEGUNDO_RECONTEO' && estadoUsuarioActual === 'ESPERANDO_SEGUNDO_RECONTEO')
                                  )
                                );
                                
                                // Mostrar botón si puede iniciar conteo O si es administrador y no hay usuarios asignados
                                const mostrarBoton = puedeIniciarConteo || (datosUsuario?.rol === 'ADMINISTRADOR' && !tieneUsuariosAsignados);
                                
                                console.log('🔍 LÓGICA BOTÓN:', {
                                  sectorNombre: conteo?.sectorNombre,
                                  conteoExiste: !!conteo,
                                  esAsignado: esAsignado,
                                  estado: conteo?.estado,
                                  usuarioActualId: datosUsuario?.id,
                                  usuario1Id: conteo?.usuario1Id,
                                  usuario2Id: conteo?.usuario2Id,
                                  esUsuario1: esUsuario1,
                                  esUsuario2: esUsuario2,
                                  estadoUsuarioActual: estadoUsuarioActual,
                                  productosContadosUsuarioActual: productosContadosUsuarioActual,
                                  puedeIniciarConteo: puedeIniciarConteo,
                                  mostrarBoton: mostrarBoton,
                                  // ✅ DEBUG: Información adicional para reconteo
                                  conteo1Finalizado: conteo?.conteo1Finalizado,
                                  conteo2Finalizado: conteo?.conteo2Finalizado,
                                  ambosUsuariosFinalizaron: conteo?.conteo1Finalizado && conteo?.conteo2Finalizado,
                                  usuarioYaCompletoReconteo: usuarioYaCompletoReconteo,
                                  // Debug específico para CON_DIFERENCIAS
                                  esEstadoConDiferencias: conteo?.estado === 'CON_DIFERENCIAS',
                                  esAsignadoYConDiferencias: esAsignado && conteo?.estado === 'CON_DIFERENCIAS'
                                });
                                
                                // Logs separados para los estados específicos
                                console.log('🔍 ESTADOS ESPECÍFICOS DE USUARIOS:');
                                console.log('  - estadoUsuario1:', conteo?.estadoUsuario1);
                                console.log('  - estadoUsuario2:', conteo?.estadoUsuario2);
                                console.log('  - productosContadosUsuario1:', conteo?.productosContadosUsuario1);
                                console.log('  - productosContadosUsuario2:', conteo?.productosContadosUsuario2);
                                
                                if (mostrarBoton) {
                                  console.log('🟢 BOTÓN SE MOSTRARÁ para:', {
                                    sector: conteo?.sectorNombre,
                                    estado: conteo?.estado,
                                    usuario: datosUsuario?.id,
                                    esUsuario1: esUsuario1,
                                    esUsuario2: esUsuario2,
                                    textoBoton: 'calculado en JSX'
                                  });
                                } else {
                                  console.log('🔴 BOTÓN NO SE MOSTRARÁ para:', {
                                    sector: conteo?.sectorNombre,
                                    estado: conteo?.estado,
                                    usuario: datosUsuario?.id,
                                    esUsuario1: esUsuario1,
                                    esUsuario2: esUsuario2
                                  });
                                }
                                
                                return mostrarBoton;
                              })() && (
                                <button
                                  onClick={() => {
                                    console.log('🖱️ CLIC EN BOTÓN:', {
                                      conteoId: conteo?.id,
                                      estado: conteo?.estado,
                                      usuario1Id: conteo?.usuario1Id,
                                      usuario2Id: conteo?.usuario2Id,
                                      datosUsuarioId: datosUsuario?.id
                                    });
                                    
                                    // Verificar si hay usuarios asignados
                                    const tieneUsuariosAsignados = conteo && conteo.usuario1Id && conteo.usuario2Id;
                                    
                                    if (!tieneUsuariosAsignados && datosUsuario?.rol === 'ADMINISTRADOR' && conteo) {
                                      console.log('👥 Navegando a asignar usuarios');
                                      // Navegar a página de asignación de usuarios
                                      navigate(`/admin/asignar-usuarios-inventario/${conteo.id}`);
                                    } else if (!tieneUsuariosAsignados) {
                                      console.log('⏳ Usuario no administrador, no puede asignar usuarios');
                                      toast('Solo el administrador puede asignar usuarios');
                                    } else {
                                      // Verificar si es reconteo basándose en el estado general o el estado del usuario
                                      const esUsuario1 = conteo && conteo.usuario1Id === datosUsuario?.id;
                                      const estadoUsuarioActual = esUsuario1 ? conteo?.estadoUsuario1 : conteo?.estadoUsuario2;
                                      
                                      // ✅ CORREGIDO: No permitir acceso a reconteo si el sector ya está completado
                                      if (conteo.estado === 'COMPLETADO') {
                                        console.log('⚠️ Sector ya completado, no se puede acceder a reconteo');
                                        toast('Este sector ya está completado. No se puede hacer reconteo.');
                                        return;
                                      }
                                      
                                      const esReconteo = conteo.estado === 'CON_DIFERENCIAS' || 
                                                         estadoUsuarioActual === 'CON_DIFERENCIAS' ||
                                                         conteo.estado === 'ESPERANDO_SEGUNDO_RECONTEO' ||
                                                         estadoUsuarioActual === 'ESPERANDO_SEGUNDO_RECONTEO';
                                      
                                      if (esReconteo) {
                                        console.log('🔍 Navegando al reconteo con modo reconteo');
                                        // Navegar a página separada de reconteo
                                        navigate(`/admin/reconteo-sector/${conteo.id}`);
                                      } else {
                                        console.log('🚀 Navegando al conteo con autoStart=true');
                                        // Navegar al conteo normal
                                        navigate(`/admin/conteo-sector/${conteo.id}?autoStart=true`);
                                      }
                                    }
                                  }}
                                  style={{
                                    background: (() => {
                                      const tieneUsuariosAsignados = conteo && conteo.usuario1Id && conteo.usuario2Id;
                                      if (!tieneUsuariosAsignados) return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'; // Azul para asignar usuarios
                                      if (conteo?.estado === 'CON_DIFERENCIAS') return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'; // Naranja para revisar
                                      if (conteo?.estado === 'EN_PROGRESO') return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'; // Azul para continuar conteo
                                      
                                      // Verificar si el usuario está asignado
                                      const esUsuario1 = conteo && conteo.usuario1Id === datosUsuario?.id;
                                      const esUsuario2 = conteo && conteo.usuario2Id === datosUsuario?.id;
                                      const esUsuarioAsignado = esUsuario1 || esUsuario2;
                                      
                                      // Si el estado es EN_PROGRESO, ESPERANDO_VERIFICACION, ESPERANDO_SEGUNDO_RECONTEO o COMPARANDO_RECONTEO pero el usuario está asignado, usar color azul para continuar
                                      if ((conteo?.estado === 'EN_PROGRESO' || conteo?.estado === 'ESPERANDO_VERIFICACION' || 
                                           conteo?.estado === 'ESPERANDO_SEGUNDO_RECONTEO' || conteo?.estado === 'COMPARANDO_RECONTEO') && esUsuarioAsignado) {
                                        return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'; // Azul para continuar conteo
                                      }
                                      
                                      return 'linear-gradient(135deg, #10b981 0%, #059669 100%)'; // Verde para iniciar conteo
                                    })(),
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.75rem',
                                    padding: isMobile ? '0.875rem 1.25rem' : '0.75rem 1.5rem',
                                    fontSize: isMobile ? '0.9rem' : '0.85rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    transform: 'translateY(0)',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    width: isMobile ? '100%' : 'auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    minHeight: isMobile ? 'auto' : '3rem',
                                    marginTop: '0.5rem'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                                  }}
                                >
                                  {(() => {
                                    console.log('🚀 INICIO PRIMERA FUNCIÓN BOTÓN:', {
                                      conteoId: conteo?.id,
                                      estado: conteo?.estado,
                                      tieneUsuarios: conteo && conteo.usuario1Id && conteo.usuario2Id
                                    });
                                    
                                    const tieneUsuariosAsignados = conteo && conteo.usuario1Id && conteo.usuario2Id;
                                    if (!tieneUsuariosAsignados && datosUsuario?.rol === 'ADMINISTRADOR') return '👥 Asignar Usuarios';
                                    if (!tieneUsuariosAsignados) return '⏳ Esperando asignación';
                                    
                                    // Verificar si el usuario está asignado para obtener su estado específico
                                    const esUsuario1Local = conteo && conteo.usuario1Id === datosUsuario?.id;
                                    const estadoUsuarioActual = esUsuario1Local ? conteo?.estadoUsuario1 : conteo?.estadoUsuario2;
                                    
                                    // ✅ CORREGIDO: No mostrar "Revisar y Recontar" si el sector ya está completado
                                    if (conteo?.estado === 'COMPLETADO') {
                                      return '✅ Completado';
                                    }
                                    
                                    // Si el estado general es CON_DIFERENCIAS o el estado del usuario es CON_DIFERENCIAS
                                    if (conteo?.estado === 'CON_DIFERENCIAS' || estadoUsuarioActual === 'CON_DIFERENCIAS') {
                                      return '🔍 Revisar y Recontar';
                                    }
                                    
                                    // Verificar si es reconteo: ambos usuarios han finalizado
                                    const esReconteo = conteo.conteo1Finalizado && conteo.conteo2Finalizado;
                                    console.log('🔍 DEBUG RECONTEO EN PRIMERA FUNCIÓN:', {
                                      conteo1Finalizado: conteo.conteo1Finalizado,
                                      conteo2Finalizado: conteo.conteo2Finalizado,
                                      esReconteo: esReconteo
                                    });
                                    
                                    if (esReconteo) {
                                      console.log('✅ MOSTRANDO: Revisar y Recontar (primera función)');
                                      return '🔍 Revisar y Recontar';
                                    }
                                    
                                    // Verificar si es reconteo ANTES de verificar el estado general
                                    if (conteo?.estado === 'EN_PROGRESO') {
                                      // Si ambos usuarios han finalizado, es reconteo
                                      if (conteo.conteo1Finalizado && conteo.conteo2Finalizado) {
                                        return '🔍 Revisar y Recontar';
                                      }
                                      return '🔄 Continuar Conteo';
                                    }
                                    
                                    // Verificar si el usuario está asignado
                                    const esUsuario1 = conteo && conteo.usuario1Id === datosUsuario?.id;
                                    const esUsuario2 = conteo && conteo.usuario2Id === datosUsuario?.id;
                                    const esUsuarioAsignado = esUsuario1 || esUsuario2;
                                    
                                    // Definir estadoUsuarioActualLocal dentro de este scope
                                    const estadoUsuarioActualLocal = esUsuario1 ? conteo.estadoUsuario1 : conteo.estadoUsuario2;
                                    
                                    console.log('🚀 INICIO FUNCIÓN BOTÓN:', {
                                      estadoUsuarioActual: estadoUsuarioActualLocal,
                                      esUsuario1: esUsuario1,
                                      esUsuario2: esUsuario2
                                    });
                                    
                                    // Logs de depuración
                                    console.log('🔍 DEBUG Botón:', {
                                      conteoId: conteo?.id,
                                      estado: conteo?.estado,
                                      usuario1Id: conteo?.usuario1Id,
                                      usuario2Id: conteo?.usuario2Id,
                                      datosUsuarioId: datosUsuario?.id,
                                      esUsuario1,
                                      esUsuario2,
                                      esUsuarioAsignado,
                                      tieneUsuariosAsignados,
                                      estadoUsuarioActual
                                    });
                                    
                                    // Calcular el texto del botón directamente aquí
                                    // esReconteo ya se calculó en la primera función
                                    
                                    console.log('🔍 DEBUG RECONTEO EN BOTÓN (segunda función):', {
                                      conteo1Finalizado: conteo.conteo1Finalizado,
                                      conteo2Finalizado: conteo.conteo2Finalizado
                                    });
                                    
                                    if (estadoUsuarioActualLocal === 'PENDIENTE') {
                                      return '▶️ Iniciar Conteo';
                                    } else if (estadoUsuarioActualLocal === 'ESPERANDO_VERIFICACION') {
                                      return '▶️ Iniciar Conteo';
                                    } else if (estadoUsuarioActualLocal === 'ESPERANDO_SEGUNDO_RECONTEO') {
                                      return '🔄 Continuar Reconteo';
                                    } else if (estadoUsuarioActualLocal === 'COMPARANDO_RECONTEO') {
                                      return '⏳ Comparando Reconteos';
                                    } else if (estadoUsuarioActualLocal === 'EN_PROGRESO') {
                                      return '🔄 Continuar Conteo';
                                    } else {
                                      return '▶️ Iniciar Conteo';
                                    }
                                  })()}
                                </button>
                              )}
                              
                              {/* Mensaje cuando está esperando verificación o en reconteo */}
                              {(() => {
                                const mostrarMensaje = conteo && (conteo.estado === 'ESPERANDO_VERIFICACION' || 
                                                                    conteo.estado === 'ESPERANDO_SEGUNDO_RECONTEO' || 
                                                                    conteo.estado === 'COMPARANDO_RECONTEO');
                                const esUsuario1 = conteo && conteo.usuario1Id === datosUsuario?.id;
                                const esUsuario2 = conteo && conteo.usuario2Id === datosUsuario?.id;
                                
                                console.log('🔍 LÓGICA MENSAJE ESPERANDO:', {
                                  sectorNombre: conteo?.sectorNombre,
                                  conteoExiste: !!conteo,
                                  estado: conteo?.estado,
                                  esUsuario1: esUsuario1,
                                  esUsuario2: esUsuario2,
                                  mostrarMensaje: mostrarMensaje
                                });
                                return mostrarMensaje;
                              })() && (
                                <div style={{
                                  marginTop: '1rem',
                                  padding: isMobile ? '1rem' : '0.875rem',
                                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                  color: 'white',
                                  borderRadius: '0.75rem',
                                  textAlign: 'center',
                                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                                  fontWeight: '500',
                                  lineHeight: '1.4',
                                  minHeight: isMobile ? 'auto' : '3rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 8px rgba(251, 191, 36, 0.3)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}>
                                  {(() => {
                                    // Definir el estado específico del usuario para determinar el mensaje
                                    const esUsuario1 = conteo && conteo.usuario1Id === datosUsuario?.id;
                                    const estadoUsuarioActual = esUsuario1 ? conteo?.estadoUsuario1 : conteo?.estadoUsuario2;
                                    
                                    if (estadoUsuarioActual === 'ESPERANDO_VERIFICACION') {
                                      return '✅ Tu conteo está completo. Esperando verificación del segundo usuario';
                                    } else if (estadoUsuarioActual === 'ESPERANDO_SEGUNDO_RECONTEO') {
                                      return '✅ Tu reconteo está completo. Esperando que el segundo usuario complete su reconteo';
                                    } else if (estadoUsuarioActual === 'COMPARANDO_RECONTEO') {
                                      return '⏳ Sistema comparando reconteos. Por favor espera...';
                                    } else if (estadoUsuarioActual === 'EN_PROGRESO' || estadoUsuarioActual === 'PENDIENTE') {
                                      return '🔄 Es tu turno de hacer el conteo de verificación';
                                    } else {
                                      return '⏳ Esperando verificación del segundo usuario';
                                    }
                                  })()}
                                </div>
                              )}

                              {/* Botón para ver detalle del conteo cuando ambos usuarios han finalizado */}
                              {(() => {
                                const ambosUsuariosFinalizaron = conteo && conteo.conteo1Finalizado && conteo.conteo2Finalizado;
                                const esAsignado = conteo && esUsuarioAsignadoAlSector(conteo);
                                
                                console.log('🔍 DEBUG BOTÓN DETALLE:', {
                                  conteo1Finalizado: conteo?.conteo1Finalizado,
                                  conteo2Finalizado: conteo?.conteo2Finalizado,
                                  ambosUsuariosFinalizaron: ambosUsuariosFinalizaron,
                                  esAsignado: esAsignado,
                                  estado: conteo?.estado
                                });
                                
                                return ambosUsuariosFinalizaron && esAsignado;
                              })() && (
                                <button
                                  onClick={() => {
                                    console.log('🖱️ CLIC EN VER DETALLE:', {
                                      conteoId: conteo?.id,
                                      estado: conteo?.estado
                                    });
                                    // Navegar a la página de detalle del conteo
                                    if (conteo) {
                                      navigate(`/admin/detalle-conteo/${conteo.id}`);
                                    }
                                  }}
                                  style={{
                                    background: '#8b5cf6', // Púrpura para ver detalle
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    transform: 'scale(1)',
                                    marginTop: '0.5rem',
                                    marginRight: '0.5rem'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#7c3aed';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#8b5cf6';
                                    e.currentTarget.style.transform = 'scale(1)';
                                  }}
                                >
                                  📋 Ver Detalle del Conteo
                                </button>
                              )}

                              {/* Botón para ver detalle de conteo cuando el estado es COMPLETADO o CON_DIFERENCIAS */}
                              {(() => {
                                const estadoFinal = conteo && (conteo.estado === 'COMPLETADO' || conteo.estado === 'CON_DIFERENCIAS');
                                const esAsignado = conteo && esUsuarioAsignadoAlSector(conteo);
                                const esAdmin = datosUsuario?.rol === 'ADMINISTRADOR';
                                
                                console.log('🔍 DEBUG BOTÓN VER DETALLE:', {
                                  estado: conteo?.estado,
                                  estadoFinal: estadoFinal,
                                  esAsignado: esAsignado,
                                  esAdmin: esAdmin
                                });
                                
                                return estadoFinal && (esAsignado || esAdmin);
                              })() && (
                                <button
                                  onClick={() => {
                                    console.log('🖱️ CLIC EN VER DETALLE:', {
                                      conteoId: conteo?.id,
                                      estado: conteo?.estado
                                    });
                                    // Navegar a la página de comparación de conteos
                                    if (conteo) {
                                      navigate(`/admin/comparacion-conteos/${conteo.id}`);
                                    }
                                  }}
                                  style={{
                                    background: '#3b82f6', // Azul para ver detalle
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    transform: 'scale(1)',
                                    marginTop: '0.5rem'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#2563eb';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#3b82f6';
                                    e.currentTarget.style.transform = 'scale(1)';
                                  }}
                                >
                                  🔍 Ver Detalle de Conteo
                                </button>
                              )}
                                </>
                              )}
                              
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Registros de inventarios completados */}
          {registrosInventarios.length > 0 && (
            <div style={{
              background: 'white',
              borderRadius: '1.25rem',
              padding: isMobile ? '1.5rem' : '2rem',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
              border: '2px solid #f1f5f9',
              marginTop: '2rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.75rem',
                paddingBottom: '1rem',
                borderBottom: '2px solid #f1f5f9'
              }}>
                <h3 style={{
                  margin: 0,
                  color: '#1e293b',
                  fontSize: isMobile ? '1.15rem' : '1.4rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                    borderRadius: '0.75rem',
                    padding: '0.5rem',
                    display: 'inline-flex',
                    fontSize: '1.25rem'
                  }}>📋</span>
                  Historial de Inventarios
                </h3>
                <div style={{
                  background: '#f0f4ff',
                  color: '#5b21b6',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: '600'
                }}>
                  {registrosInventarios.length} {registrosInventarios.length === 1 ? 'registro' : 'registros'}
                </div>
              </div>
              
              <div style={{
                display: 'grid',
                gap: isMobile ? '1rem' : '1.25rem',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(380px, 1fr))'
              }}>
                {registrosInventarios.map((registro) => (
                  <div
                    key={registro.inventarioId}
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      borderRadius: '1rem',
                      padding: isMobile ? '1.25rem' : '1.5rem',
                      border: '2px solid #e2e8f0',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Badge de estado en la esquina */}
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                      letterSpacing: '0.5px'
                    }}>
                      ✓ COMPLETADO
                    </div>

                    <div>
                      {/* Título del inventario */}
                      <div style={{
                        fontWeight: '700',
                        color: '#1e293b',
                        fontSize: isMobile ? '1rem' : '1.1rem',
                        marginBottom: '0.75rem',
                        paddingRight: '6rem',
                        lineHeight: '1.4'
                      }}>
                        {registro.nombreInventario}
                      </div>

                      {/* Información en grid */}
                      <div style={{
                        display: 'grid',
                        gap: '0.65rem',
                        marginTop: '1rem'
                      }}>
                        {/* Fecha */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem'
                        }}>
                          <div style={{
                            background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)',
                            borderRadius: '0.5rem',
                            padding: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '2.5rem',
                            minHeight: '2.5rem'
                          }}>
                            <span style={{ fontSize: '1.1rem' }}>📅</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '0.7rem',
                              color: '#64748b',
                              fontWeight: '500',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              Fecha de Realización
                            </div>
                            <div style={{
                              fontSize: '0.9rem',
                              color: '#1e293b',
                              fontWeight: '600',
                              marginTop: '0.15rem'
                            }}>
                              {new Date(registro.fechaRealizacion).toLocaleDateString('es-ES', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Usuario */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem'
                        }}>
                          <div style={{
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                            borderRadius: '0.5rem',
                            padding: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '2.5rem',
                            minHeight: '2.5rem'
                          }}>
                            <span style={{ fontSize: '1.1rem' }}>👤</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '0.7rem',
                              color: '#64748b',
                              fontWeight: '500',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              Responsable
                            </div>
                            <div style={{
                              fontSize: '0.9rem',
                              color: '#1e293b',
                              fontWeight: '600',
                              marginTop: '0.15rem'
                            }}>
                              {registro.usuarioResponsable}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Botón de ver detalle */}
                      <div style={{
                        marginTop: '1.25rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        gap: '0.75rem',
                        flexDirection: isMobile ? 'column' : 'row'
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            verRegistro(registro);
                          }}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            color: '#7c3aed',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f3e8ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <span>Ver Detalles</span>
                          <span style={{ fontSize: '1.2rem' }}>👁️</span>
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            exportarInventarioPDF(registro);
                          }}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            color: 'white',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.2)';
                          }}
                        >
                          <span>Exportar PDF</span>
                          <span style={{ fontSize: '1.1rem' }}>📄</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal de asignación de usuarios */}
          {mostrarModalAsignacion && (
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
              zIndex: 1000
            }}>
              <div style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}>
                <h3 style={{
                  margin: '0 0 1.5rem 0',
                  color: '#1e293b',
                  fontSize: '1.3rem',
                  fontWeight: 'bold'
                }}>
                  Asignar Usuarios a {sectorSeleccionado?.nombre}
                </h3>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Usuario 1
                  </label>
                  <select
                    value={usuario1Seleccionado || ''}
                    onChange={(e) => setUsuario1Seleccionado(e.target.value ? parseInt(e.target.value) : null)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem',
                      background: 'white'
                    }}
                  >
                    <option value="">Seleccionar usuario</option>
                    {usuariosAsignados.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nombre} {usuario.apellidos}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Usuario 2
                  </label>
                  <select
                    value={usuario2Seleccionado || ''}
                    onChange={(e) => setUsuario2Seleccionado(e.target.value ? parseInt(e.target.value) : null)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem',
                      background: 'white'
                    }}
                  >
                    <option value="">Seleccionar usuario</option>
                    {usuariosAsignados.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nombre} {usuario.apellidos}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => {
                      setMostrarModalAsignacion(false);
                      setSectorSeleccionado(null);
                      setUsuario1Seleccionado(null);
                      setUsuario2Seleccionado(null);
                    }}
                    style={{
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={asignarUsuarios}
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Asignar Usuarios
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de confirmación para cancelar inventario */}
          {mostrarModalCancelacion && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000
            }}>
              <div style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                maxWidth: '400px',
                width: '90%',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem'
                }}>
                  ⚠️
                </div>
                <h3 style={{
                  margin: '0 0 1rem 0',
                  color: '#1e293b',
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                }}>
                  ¿Cancelar Inventario?
                </h3>
                <p style={{
                  margin: '0 0 1.5rem 0',
                  color: '#64748b',
                  lineHeight: '1.5'
                }}>
                  Esta acción cancelará el inventario completo y eliminará todos los datos de conteo. Esta acción no se puede deshacer.
                </p>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center'
                }}>
                  <button
                    onClick={() => setMostrarModalCancelacion(false)}
                    style={{
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    No, Mantener
                  </button>
                  <button
                    onClick={cancelarInventario}
                    disabled={cancelando}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: cancelando ? 'not-allowed' : 'pointer',
                      opacity: cancelando ? 0.7 : 1,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {cancelando ? 'Cancelando...' : 'Sí, Cancelar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de confirmación para finalizar inventario */}
          {mostrarModalFinalizacion && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000
            }}>
              <div style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                maxWidth: '400px',
                width: '90%',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem'
                }}>
                  ✅
                </div>
                <h3 style={{
                  margin: '0 0 1rem 0',
                  color: '#1e293b',
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                }}>
                  ¿Finalizar Inventario?
                </h3>
                <p style={{
                  margin: '0 0 1.5rem 0',
                  color: '#64748b',
                  lineHeight: '1.5'
                }}>
                  Todos los sectores han sido completados. ¿Desea finalizar el inventario y generar el reporte final?
                </p>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center'
                }}>
                  <button
                    onClick={() => setMostrarModalFinalizacion(false)}
                    style={{
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    No, Revisar
                  </button>
                  <button
                    onClick={finalizarInventario}
                    disabled={finalizando}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: finalizando ? 'not-allowed' : 'pointer',
                      opacity: finalizando ? 0.7 : 1,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {finalizando ? 'Finalizando...' : 'Sí, Finalizar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de detalle de registro */}
          {mostrarModalRegistro && registroSeleccionado && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000
            }}>
              <div style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                maxWidth: '90vw',
                maxHeight: '90vh',
                width: '800px',
                overflow: 'auto'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <h2 style={{
                    margin: 0,
                    color: '#1e293b',
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}>
                    📋 Detalle del Registro - {registroSeleccionado.nombreInventario}
                  </h2>
                  <button
                    onClick={() => setMostrarModalRegistro(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      color: '#64748b'
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Información del registro */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <strong>Fecha de realización:</strong><br/>
                      {new Date(registroSeleccionado.fechaRealizacion).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div>
                      <strong>Usuario responsable:</strong><br/>
                      {registroSeleccionado.usuarioResponsable}
                    </div>
                    <div>
                      <strong>Total productos:</strong><br/>
                      {registroSeleccionado.estadisticas?.totalProductos || 0}
                    </div>
                    <div>
                      <strong>Productos con diferencias:</strong><br/>
                      {registroSeleccionado.estadisticas?.productosConDiferencias || 0}
                    </div>
                  </div>
                </div>

                {/* Productos actualizados */}
                <h3 style={{
                  margin: '0 0 1rem 0',
                  color: '#1e293b',
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                }}>
                  Productos Actualizados
                </h3>
                
                
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                    gap: '1rem',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '0.9rem',
                    marginBottom: '0.5rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    <div>Producto</div>
                    <div style={{ textAlign: 'center' }}>Stock Anterior</div>
                    <div style={{ textAlign: 'center' }}>Stock Nuevo</div>
                    <div style={{ textAlign: 'center' }}>Diferencia</div>
                    <div style={{ textAlign: 'center' }}>Estado</div>
                  </div>
                  
                  {registroSeleccionado.productosActualizados?.length > 0 ? (
                    registroSeleccionado.productosActualizados.map((producto: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                        gap: '1rem',
                        padding: '0.5rem 0',
                        borderBottom: index < (registroSeleccionado.productosActualizados.length - 1) ? '1px solid #f1f5f9' : 'none'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>
                          {producto.nombreProducto}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {producto.codigoProducto}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', color: '#64748b' }}>
                        {producto.stockAnterior}
                      </div>
                      <div style={{ textAlign: 'center', fontWeight: '600', color: '#1e293b' }}>
                        {producto.stockNuevo}
                      </div>
                      <div style={{ 
                        textAlign: 'center', 
                        fontWeight: '600',
                        color: producto.diferenciaStock === 0 ? '#10b981' : 
                               producto.diferenciaStock > 0 ? '#3b82f6' : '#ef4444'
                      }}>
                        {producto.diferenciaStock > 0 ? '+' : ''}{producto.diferenciaStock}
                      </div>
                      <div style={{ 
                        textAlign: 'center',
                        color: producto.diferenciaStock === 0 ? '#10b981' : 
                               producto.diferenciaStock > 0 ? '#3b82f6' : '#ef4444'
                      }}>
                        {producto.diferenciaStock === 0 ? 'Sin cambios' : 
                         producto.diferenciaStock > 0 ? 'Aumento' : 'Disminución'}
                      </div>
                    </div>
                    ))
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '2rem',
                      color: '#64748b',
                      fontStyle: 'italic'
                    }}>
                      No hay productos actualizados disponibles para este inventario.
                      <br/>
                      <small>Debug: productosActualizados = {JSON.stringify(registroSeleccionado?.productosActualizados)}</small>
                    </div>
                  )}
                </div>

                {/* Información de sectores */}
                <h3 style={{
                  margin: '1.5rem 0 1rem 0',
                  color: '#1e293b',
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                }}>
                  Sectores Involucrados
                </h3>
                
                <div style={{
                  display: 'grid',
                  gap: '0.5rem'
                }}>
                  {registroSeleccionado.sectoresInfo?.map((sector: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        background: '#f8fafc',
                        borderRadius: '0.25rem',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>
                          {sector.nombreSector}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {sector.productosContados} productos contados
                        </div>
                      </div>
                      <div style={{
                        color: '#10b981',
                        fontWeight: '600',
                        fontSize: '0.9rem'
                      }}>
                        {sector.estado}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: '2rem'
                }}>
                  <button
                    onClick={() => setMostrarModalRegistro(false)}
                    style={{
                      background: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#4b5563';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#6b7280';
                    }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Botón de regreso */}
          <div style={{
            textAlign: 'center',
            marginTop: '2rem'
          }}>
            <button
              onClick={() => navigate('/admin/gestion-inventario')}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              ← Volver a Gestión de Inventario
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
