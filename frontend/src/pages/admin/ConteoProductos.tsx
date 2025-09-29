import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
import { API_CONFIG } from '../../config/api';

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
  usuarioAsignado1?: {
    id: number;
    nombre: string;
    apellidos: string;
  };
  usuarioAsignado2?: {
    id: number;
    nombre: string;
    apellidos: string;
  };
}

export default function ConteoProductos() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [conteoInfo, setConteoInfo] = useState<ConteoInfo | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [detallesConteo, setDetallesConteo] = useState<DetalleConteo[]>([]);
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarProductos, setMostrarProductos] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [inputBusqueda, setInputBusqueda] = useState('');
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [cantidad, setCantidad] = useState('');
  const [formulaCalculo, setFormulaCalculo] = useState('');
  const [resultadoCalculo, setResultadoCalculo] = useState<number | null>(null);
  const [errorCalculo, setErrorCalculo] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  
  // Estados para edición
  const [editandoDetalle, setEditandoDetalle] = useState<DetalleConteo | null>(null);
  const [cantidadEditada, setCantidadEditada] = useState('');
  const [formulaEditada, setFormulaEditada] = useState('');
  const [resultadoEditado, setResultadoEditado] = useState<number | null>(null);
  const [errorEditado, setErrorEditado] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      cargarDatos();
    }
  }, [id]);

  useEffect(() => {
    filtrarProductos();
  }, [inputBusqueda, productos]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      
      if (!datosUsuario?.empresaId || !id) {
        console.error('❌ No se pudo obtener la información de la empresa o ID del conteo');
        toast.error('No se pudo obtener la información del conteo');
        return;
      }

      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      console.log('🔍 Cargando datos del conteo:', id);

      // Cargar información del conteo
      const baseUrl = API_CONFIG.getBaseUrl();
      const conteoResponse = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/conteos-sector/${id}`, {
        headers
      });

      let conteoData = null;
      if (conteoResponse.ok) {
        conteoData = await conteoResponse.json();
        console.log('✅ Información del conteo cargada:', conteoData);
        setConteoInfo(conteoData);
        
        // Si el conteo está en estado PENDIENTE, iniciarlo automáticamente
        if (conteoData.estado === 'PENDIENTE') {
          console.log('🔄 Conteo en estado PENDIENTE, iniciando automáticamente...');
          try {
            const iniciarResponse = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/conteos-sector/${id}/iniciar`, {
              method: 'POST',
              headers
            });
            
            if (iniciarResponse.ok) {
              const iniciarData = await iniciarResponse.json();
              console.log('✅ Conteo iniciado exitosamente:', iniciarData);
              // Actualizar la información del conteo con el nuevo estado
              setConteoInfo(iniciarData.conteoSector);
              toast.success('Conteo iniciado');
            } else {
              console.error('❌ Error iniciando conteo:', iniciarResponse.status);
              const errorData = await iniciarResponse.json();
              toast.error(errorData.message || 'Error al iniciar el conteo');
            }
          } catch (error) {
            console.error('❌ Error iniciando conteo:', error);
            toast.error('Error al iniciar el conteo');
          }
        }
      } else {
        console.error('❌ Error cargando información del conteo:', conteoResponse.status);
        toast.error('Error al cargar la información del conteo');
        return;
      }

      // Cargar productos del sector
      const productosResponse = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/productos?activo=true`, {
        headers
      });

      if (productosResponse.ok) {
        const productosResponseData = await productosResponse.json();
        console.log('✅ Respuesta completa de productos:', productosResponseData);
        
        // Extraer los datos del producto del formato de respuesta
        const productosData = productosResponseData.data || productosResponseData;
        console.log('✅ Productos extraídos:', productosData);
        
        // Filtrar productos por sector usando la información del conteo cargada
        if (conteoData?.sectorNombre) {
          const productosEnSector = productosData.filter((producto: any) => 
            producto.sectorAlmacenamiento === conteoData.sectorNombre
          );
          console.log('🔍 Productos filtrados por sector:', {
            sectorNombre: conteoData.sectorNombre,
            totalProductos: productosData.length,
            productosEnSector: productosEnSector.length
          });
          setProductos(productosEnSector);
        } else {
          console.log('🔍 No hay información del sector, cargando todos los productos');
          setProductos(productosData);
        }
      } else {
        console.error('❌ Error cargando productos:', productosResponse.status);
        toast.error('Error al cargar los productos');
      }

      // Cargar detalles de conteo existentes
      console.log('🔍 Intentando cargar detalles de conteo para ID:', id);
      const detallesResponse = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/conteos-sector/${id}/detalles`, {
        headers
      });

      console.log('🔍 Respuesta de detalles:', {
        status: detallesResponse.status,
        ok: detallesResponse.ok,
        url: detallesResponse.url
      });

      if (detallesResponse.ok) {
        const detallesData = await detallesResponse.json();
        console.log('✅ Detalles de conteo cargados:', detallesData);
        console.log('✅ Tipo de datos:', typeof detallesData);
        console.log('✅ Es array:', Array.isArray(detallesData));
        console.log('✅ Longitud:', detallesData?.length);
        
        // Verificar si los datos están en el formato correcto
        if (Array.isArray(detallesData)) {
          console.log('🔍 FRONTEND: Detalles cargados (array directo):', detallesData.length, 'elementos');
          if (detallesData.length > 0) {
            console.log('🔍 FRONTEND: Primer detalle cargado:', {
              id: detallesData[0].id,
              idType: typeof detallesData[0].id,
              producto: detallesData[0].producto?.nombre
            });
          }
          setDetallesConteo(detallesData);
        } else if (detallesData && detallesData.data && Array.isArray(detallesData.data)) {
          console.log('✅ Datos encontrados en .data:', detallesData.data);
          console.log('🔍 FRONTEND: Detalles cargados (.data):', detallesData.data.length, 'elementos');
          if (detallesData.data.length > 0) {
            console.log('🔍 FRONTEND: Primer detalle cargado (.data):', {
              id: detallesData.data[0].id,
              idType: typeof detallesData.data[0].id,
              producto: detallesData.data[0].producto?.nombre
            });
          }
          setDetallesConteo(detallesData.data);
        } else {
          console.log('⚠️ Formato de datos inesperado, estableciendo array vacío');
      setDetallesConteo([]);
        }
      } else {
        console.error('❌ Error cargando detalles de conteo:', detallesResponse.status);
        const errorText = await detallesResponse.text();
        console.error('❌ Error details:', errorText);
        // No es crítico, puede que no haya detalles aún
        setDetallesConteo([]);
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar los datos del conteo');
    } finally {
      setCargando(false);
    }
  };

  const filtrarProductos = () => {
    if (!inputBusqueda.trim()) {
      setProductosFiltrados(productos);
      return;
    }

    const filtrados = productos.filter(producto => {
      const matchCodigo = producto.codigoPersonalizado && producto.codigoPersonalizado.toLowerCase().includes(inputBusqueda.toLowerCase());
      const matchBarras = producto.codigoBarras && producto.codigoBarras.includes(inputBusqueda);
      const matchNombre = producto.nombre.toLowerCase().includes(inputBusqueda.toLowerCase());
      
      return matchCodigo || matchBarras || matchNombre;
    });
    
    // Ordenar resultados: primero códigos personalizados, luego códigos de barras, luego nombres
    const productosOrdenados = filtrados.sort((a, b) => {
      const busqueda = inputBusqueda.toLowerCase();
      
      // Prioridad 1: Coincidencia exacta en código personalizado
      const aCodigoExacto = a.codigoPersonalizado?.toLowerCase() === busqueda;
      const bCodigoExacto = b.codigoPersonalizado?.toLowerCase() === busqueda;
      if (aCodigoExacto && !bCodigoExacto) return -1;
      if (!aCodigoExacto && bCodigoExacto) return 1;
      
      // Prioridad 2: Coincidencia que empieza con el código personalizado
      const aCodigoInicio = a.codigoPersonalizado?.toLowerCase().startsWith(busqueda);
      const bCodigoInicio = b.codigoPersonalizado?.toLowerCase().startsWith(busqueda);
      if (aCodigoInicio && !bCodigoInicio) return -1;
      if (!aCodigoInicio && bCodigoInicio) return 1;
      
      // Prioridad 3: Coincidencia en código personalizado (contiene)
      const aTieneCodigo = a.codigoPersonalizado?.toLowerCase().includes(busqueda);
      const bTieneCodigo = b.codigoPersonalizado?.toLowerCase().includes(busqueda);
      if (aTieneCodigo && !bTieneCodigo) return -1;
      if (!aTieneCodigo && bTieneCodigo) return 1;
      
      // Prioridad 4: Coincidencia en código de barras
      const aTieneBarras = a.codigoBarras?.includes(inputBusqueda);
      const bTieneBarras = b.codigoBarras?.includes(inputBusqueda);
      if (aTieneBarras && !bTieneBarras) return -1;
      if (!aTieneBarras && bTieneBarras) return 1;
      
      // Prioridad 5: Coincidencia en nombre (orden alfabético)
      return a.nombre.localeCompare(b.nombre);
    });
    
    setProductosFiltrados(productosOrdenados);
  };

  const evaluarFormula = async (formula: string) => {
    if (!formula.trim()) {
      setResultadoCalculo(null);
      setErrorCalculo(null);
      return;
    }

    try {
      // Aquí llamarías a la API para evaluar la fórmula
      // Por ahora simulamos la evaluación
      const resultado = eval(formula); // En producción usarías una librería segura
      if (typeof resultado === 'number' && !isNaN(resultado)) {
        setResultadoCalculo(Math.round(resultado));
        setErrorCalculo(null);
      } else {
        setErrorCalculo('La fórmula debe resultar en un número válido');
        setResultadoCalculo(null);
      }
    } catch (error) {
      setErrorCalculo('Error en la fórmula matemática');
      setResultadoCalculo(null);
    }
  };

  const evaluarFormulaEditada = async (formula: string) => {
    if (!formula.trim()) {
      setResultadoEditado(null);
      setErrorEditado(null);
      return;
    }

    try {
      // Evaluar la fórmula de forma segura
      const resultado = eval(formula); // En producción usarías una librería segura
      if (typeof resultado === 'number' && !isNaN(resultado)) {
        setResultadoEditado(Math.round(resultado));
        setErrorEditado(null);
      } else {
        setErrorEditado('La fórmula debe resultar en un número válido');
        setResultadoEditado(null);
      }
    } catch (error) {
      setErrorEditado('Error en la fórmula matemática');
      setResultadoEditado(null);
    }
  };

  const agregarProductoAlConteo = async () => {
    if (!productoSeleccionado) {
      toast.error('Debe seleccionar un producto');
      return;
    }

    // ✅ VERIFICAR SI EL PRODUCTO YA EXISTE
    const productoExistente = detallesConteo.find(d => d.producto?.id === productoSeleccionado.id);
    
    console.log('🔍 DEBUG DETECCIÓN PRODUCTO (ConteoProductos):', {
      productoId: productoSeleccionado.id,
      productoNombre: productoSeleccionado.nombre,
      totalDetalles: detallesConteo.length,
      detallesExistentes: detallesConteo.map(d => ({
        id: d.id,
        productoId: d.producto?.id,
        productoNombre: d.producto?.nombre,
        cantidadConteo1: d.cantidadConteo1,
        cantidadConteo2: d.cantidadConteo2
      })),
      productoExistente: productoExistente ? {
        id: productoExistente.id,
        cantidadConteo1: productoExistente.cantidadConteo1,
        cantidadConteo2: productoExistente.cantidadConteo2
      } : null
    });
    
    if (productoExistente) {
      console.log('🔍 Producto ya existe, usando flujo de edición en lugar de agregar nuevo');
      // Si el producto ya existe, usar el flujo de edición
      await editarProductoExistente(productoExistente, parseInt(cantidad), formulaCalculo);
      return;
    }

    let cantidadFinal = parseInt(cantidad);
    
    if (formulaCalculo.trim() && resultadoCalculo !== null) {
      cantidadFinal = resultadoCalculo;
    }

    if (isNaN(cantidadFinal) || cantidadFinal < 0) {
      toast.error('La cantidad debe ser un número válido mayor o igual a 0');
      return;
    }

    try {
      setGuardando(true);
      
      if (!datosUsuario?.empresaId || !id) {
        toast.error('No se pudo obtener la información del conteo');
        return;
      }

      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Llamar a la API para agregar el producto al conteo
      const baseUrl = API_CONFIG.getBaseUrl();
      const response = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/conteos-sector/${id}/productos`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          productoId: productoSeleccionado.id,
          cantidad: cantidadFinal,
          formula: formulaCalculo.trim() || null
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Producto agregado al conteo:', responseData);
      toast.success('Producto agregado al conteo exitosamente');
      
      // Limpiar formulario
      setProductoSeleccionado(null);
      setCantidad('');
      setFormulaCalculo('');
      setResultadoCalculo(null);
      setErrorCalculo(null);
      setMostrarProductos(false);
      
      // ✅ FORZAR RECARGA COMPLETA: Limpiar estado local y recargar desde backend
      console.log('🔄 Limpiando estado local y recargando datos desde backend...');
      setDetallesConteo([]); // Limpiar estado local
      await new Promise(resolve => setTimeout(resolve, 500)); // Esperar un momento
      await cargarDatos(); // Recargar desde backend
      
      // ✅ NOTIFICAR CAMBIO: Marcar que hay cambios en el inventario completo
      localStorage.setItem('inventario_completo_actualizado', Date.now().toString());
      console.log('📢 Notificación enviada: inventario_completo_actualizado');
      } else {
        const errorData = await response.json();
        console.error('❌ Error agregando producto:', errorData);
        toast.error(errorData.message || 'Error al agregar el producto al conteo');
      }
    } catch (error) {
      console.error('Error agregando producto:', error);
      toast.error('Error al agregar el producto al conteo');
    } finally {
      setGuardando(false);
    }
  };

  // ✅ NUEVA FUNCIÓN: Editar producto existente
  const editarProductoExistente = async (detalleExistente: any, cantidad: number, formulaCalculo: string) => {
    console.log('🔄 Editando producto existente en ConteoProductos:', {
      detalleId: detalleExistente.id,
      productoId: detalleExistente.producto?.id,
      cantidadAnterior: detalleExistente.cantidadConteo1 || detalleExistente.cantidadConteo2,
      cantidadNueva: cantidad
    });

    try {
      setGuardando(true);
      
      if (!datosUsuario?.empresaId || !id) {
        toast.error('No se pudo obtener la información del conteo');
        return;
      }

      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // ✅ SOLUCIÓN: Buscar el detalle real en el backend usando el producto ID
      const baseUrl = API_CONFIG.getBaseUrl();
      
      console.log('🔄 Buscando detalle real en backend usando producto ID:', {
        productoId: detalleExistente.producto?.id,
        detalleExistenteId: detalleExistente.id
      });
      
      // Primero obtener los detalles del backend para encontrar el ID real
      const detallesResponse = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/conteos-sector/${id}/detalles`, {
        headers
      });
      
      if (!detallesResponse.ok) {
        throw new Error('Error obteniendo detalles del backend');
      }
      
      const detallesBackend = await detallesResponse.json();
      const detalleReal = detallesBackend.find((d: any) => d.productoId === detalleExistente.producto?.id);
      
      if (!detalleReal) {
        throw new Error('No se encontró el detalle real en el backend');
      }
      
      console.log('🔍 Detalle real encontrado:', {
        detalleId: detalleReal.id,
        productoId: detalleReal.productoId
      });
      
      // Usar el ID real para actualizar
      const url = `${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/conteos-sector/${id}/detalles/${detalleReal.id}`;
      const body = {
        cantidad: cantidad,
        formula: formulaCalculo.trim() || null
      };

      console.log('🔍 FRONTEND: Enviando PUT request:', {
        url: url,
        method: 'PUT',
        headers: headers,
        body: body
      });

      const response = await fetch(url, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(body)
      });
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ FRONTEND: Producto editado exitosamente:', responseData);
        toast.success('Producto actualizado exitosamente');
        
        // ✅ ACTUALIZAR SOLO EL DETALLE ESPECÍFICO en lugar de recargar toda la pantalla
        setDetallesConteo(prev => prev.map(detalle => {
          if (detalle.id === detalleExistente.id) {
            return {
              ...detalle,
              cantidadConteo1: responseData.cantidadConteo1 || detalle.cantidadConteo1,
              cantidadConteo2: responseData.cantidadConteo2 || detalle.cantidadConteo2,
              formulaCalculo1: responseData.formulaCalculo1 || detalle.formulaCalculo1,
              formulaCalculo2: responseData.formulaCalculo2 || detalle.formulaCalculo2,
              estado: responseData.estado || detalle.estado
            };
          }
          return detalle;
        }));
        
        // ✅ NOTIFICAR CAMBIO: Marcar que hay cambios en el inventario completo
        localStorage.setItem('inventario_completo_actualizado', Date.now().toString());
        console.log('📢 Notificación enviada: inventario_completo_actualizado');
      } else {
        const errorData = await response.json();
        console.error('❌ FRONTEND: Error actualizando producto:', errorData);
        toast.error(errorData.error || 'Error al actualizar el producto');
      }
    } catch (error) {
      console.error('❌ Error editando producto existente:', error);
      toast.error('Error al editar el producto');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarProductoDelConteo = async (detalleId: number) => {
    try {
      setGuardando(true);
      
      if (!datosUsuario?.empresaId || !id) {
        toast.error('No se pudo obtener la información del conteo');
        return;
      }

      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Llamar a la API para eliminar el producto del conteo
      const baseUrl = API_CONFIG.getBaseUrl();
      const response = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/conteos-sector/${id}/detalles/${detalleId}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        console.log('✅ Producto eliminado del conteo');
        toast.success('Producto eliminado del conteo exitosamente');
        
        // ✅ FORZAR RECARGA COMPLETA: Limpiar estado local y recargar desde backend
        console.log('🔄 Limpiando estado local y recargando datos desde backend...');
        setDetallesConteo([]); // Limpiar estado local
        await new Promise(resolve => setTimeout(resolve, 500)); // Esperar un momento
        await cargarDatos(); // Recargar desde backend
        
        // ✅ NOTIFICAR CAMBIO: Marcar que hay cambios en el inventario completo
        localStorage.setItem('inventario_completo_actualizado', Date.now().toString());
        console.log('📢 Notificación enviada: inventario_completo_actualizado');
      } else {
        const errorData = await response.json();
        console.error('❌ Error eliminando producto:', errorData);
        toast.error(errorData.message || 'Error al eliminar el producto del conteo');
      }
    } catch (error) {
      console.error('Error eliminando producto:', error);
      toast.error('Error al eliminar el producto del conteo');
    } finally {
      setGuardando(false);
    }
  };

  const iniciarEdicion = (detalle: DetalleConteo) => {
    console.log('🔍 FRONTEND: iniciarEdicion llamado con detalle:', {
      detalle: detalle,
      detalleId: detalle.id,
      detalleIdType: typeof detalle.id,
      producto: detalle.producto
    });
    setEditandoDetalle(detalle);
    // Determinar qué cantidad mostrar basándose en el usuario actual
    const cantidadActual = datosUsuario?.id === conteoInfo?.usuarioAsignado1?.id 
      ? detalle.cantidadConteo1 
      : detalle.cantidadConteo2;
    const formulaActual = datosUsuario?.id === conteoInfo?.usuarioAsignado1?.id 
      ? detalle.formulaCalculo1 
      : detalle.formulaCalculo2;
    
    setCantidadEditada(cantidadActual?.toString() || '');
    setFormulaEditada(formulaActual || '');
    setResultadoEditado(null);
    setErrorEditado(null);
    
    // Evaluar la fórmula si existe
    if (formulaActual) {
      evaluarFormulaEditada(formulaActual);
    }
  };

  const cancelarEdicion = () => {
    setEditandoDetalle(null);
    setCantidadEditada('');
    setFormulaEditada('');
    setResultadoEditado(null);
    setErrorEditado(null);
  };

  const actualizarDetalleConteo = async () => {
    console.log('🔍 FRONTEND: actualizarDetalleConteo iniciado');
    console.log('🔍 FRONTEND: editandoDetalle actual:', {
      editandoDetalle: editandoDetalle,
      editandoDetalleId: editandoDetalle?.id,
      editandoDetalleIdType: typeof editandoDetalle?.id
    });
    
    if (!editandoDetalle) {
      toast.error('No hay detalle seleccionado para editar');
      return;
    }

    let cantidadFinal = parseInt(cantidadEditada);
    
    if (formulaEditada.trim() && resultadoEditado !== null) {
      cantidadFinal = resultadoEditado;
    }

    if (isNaN(cantidadFinal) || cantidadFinal < 0) {
      toast.error('La cantidad debe ser un número válido mayor o igual a 0');
      return;
    }

    try {
      setGuardando(true);
      
      if (!datosUsuario?.empresaId || !id) {
        toast.error('No se pudo obtener la información del conteo');
        return;
      }

      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // ✅ SOLUCIÓN: Buscar el detalle real en el backend usando el producto ID
      const baseUrl = API_CONFIG.getBaseUrl();
      
      console.log('🔄 Buscando detalle real en backend usando producto ID:', {
        productoId: editandoDetalle.producto?.id,
        editandoDetalleId: editandoDetalle.id
      });
      
      // Primero obtener los detalles del backend para encontrar el ID real
      const detallesResponse = await fetch(`${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/conteos-sector/${id}/detalles`, {
        headers
      });
      
      if (!detallesResponse.ok) {
        throw new Error('Error obteniendo detalles del backend');
      }
      
      const detallesBackend = await detallesResponse.json();
      const detalleReal = detallesBackend.find((d: any) => d.productoId === editandoDetalle.producto?.id);
      
      if (!detalleReal) {
        throw new Error('No se encontró el detalle real en el backend');
      }
      
      console.log('🔍 Detalle real encontrado:', {
        detalleId: detalleReal.id,
        productoId: detalleReal.productoId
      });
      
      // Usar el ID real para actualizar
      const url = `${baseUrl}/empresas/${datosUsuario.empresaId}/inventario-completo/conteos-sector/${id}/detalles/${detalleReal.id}`;
      const body = {
        cantidad: cantidadFinal,
        formula: formulaEditada.trim() || null
      };

      console.log('🔍 FRONTEND: Enviando PUT request:', {
        url: url,
        method: 'PUT',
        headers: headers,
        body: body,
        editandoDetalle: editandoDetalle,
        cantidadEditada: cantidadEditada,
        formulaEditada: formulaEditada,
        cantidadFinal: cantidadFinal
      });

      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
      });

      console.log('🔍 FRONTEND: Response status:', response.status, 'ok:', response.ok);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ FRONTEND: Detalle actualizado exitosamente:', responseData);
        toast.success('Producto actualizado exitosamente');
        
        // ✅ ACTUALIZAR SOLO EL DETALLE ESPECÍFICO en lugar de recargar toda la pantalla
        setDetallesConteo(prev => prev.map(detalle => {
          if (detalle.id === editandoDetalle?.id) {
            return {
              ...detalle,
              cantidadConteo1: responseData.cantidadConteo1 || detalle.cantidadConteo1,
              cantidadConteo2: responseData.cantidadConteo2 || detalle.cantidadConteo2,
              formulaCalculo1: responseData.formulaCalculo1 || detalle.formulaCalculo1,
              formulaCalculo2: responseData.formulaCalculo2 || detalle.formulaCalculo2,
              estado: responseData.estado || detalle.estado
            };
          }
          return detalle;
        }));
        
        // Cancelar edición
        cancelarEdicion();
        
        // ✅ NOTIFICAR CAMBIO: Marcar que hay cambios en el inventario completo
        localStorage.setItem('inventario_completo_actualizado', Date.now().toString());
        console.log('📢 Notificación enviada: inventario_completo_actualizado');
      } else {
        const errorData = await response.json();
        console.error('❌ FRONTEND: Error actualizando detalle:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        });
        toast.error(errorData.message || 'Error al actualizar el producto');
      }
    } catch (error: any) {
      console.error('❌ FRONTEND: Error en actualizarDetalleConteo:', {
        error: error,
        message: error?.message,
        stack: error?.stack
      });
      toast.error('Error al actualizar el producto');
    } finally {
      setGuardando(false);
    }
  };

  const finalizarConteo = async () => {
    try {
      setGuardando(true);
      // Aquí llamarías a la API para finalizar el conteo
      toast.success('Conteo finalizado exitosamente');
      navigate('/admin/gestion-inventario');
    } catch (error) {
      console.error('Error finalizando conteo:', error);
      toast.error('Error al finalizar el conteo');
    } finally {
      setGuardando(false);
    }
  };

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return '#f59e0b';
      case 'CONTADO_1': return '#3b82f6';
      case 'CONTADO_2': return '#8b5cf6';
      case 'CON_DIFERENCIAS': return '#ef4444';
      case 'VERIFICADO': return '#10b981';
      case 'FINALIZADO': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const obtenerTextoEstado = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'Pendiente';
      case 'CONTADO_1': return 'Contado por Usuario 1';
      case 'CONTADO_2': return 'Contado por Usuario 2';
      case 'CON_DIFERENCIAS': return 'Con Diferencias';
      case 'VERIFICADO': return 'Verificado';
      case 'FINALIZADO': return 'Finalizado';
      default: return estado;
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
          <p style={{ color: '#6b7280', margin: 0 }}>Cargando conteo de productos...</p>
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
          <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Conteo no encontrado</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            El conteo solicitado no existe o no tienes permisos para acceder.
          </p>
          <button
            onClick={() => navigate('/admin/gestion-inventario')}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Volver a Gestión de Inventario
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
            📦 Conteo de Productos
          </h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: isMobile ? '1rem' : '1.2rem',
            margin: 0
          }}>
            {conteoInfo.sector ? conteoInfo.sector.nombre : 'Inventario por Sector'}
          </p>
        </div>

        {/* Información del conteo */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          marginBottom: '2rem'
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
              Conteo #{conteoInfo.id}
            </h2>
            <span style={{
              background: '#3b82f6',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '1rem',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              En Progreso
            </span>
          </div>

          {/* Estadísticas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
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
                {conteoInfo.totalProductos}
              </div>
              <div style={{
                fontSize: '0.8rem',
                color: '#64748b'
              }}>
                Total Productos
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
                {conteoInfo.productosContados}
              </div>
              <div style={{
                fontSize: '0.8rem',
                color: '#64748b'
              }}>
                Contados
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
                {conteoInfo.porcentajeCompletado.toFixed(1)}%
              </div>
              <div style={{
                fontSize: '0.8rem',
                color: '#64748b'
              }}>
                Progreso
              </div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div style={{
            background: '#e2e8f0',
            borderRadius: '0.5rem',
            height: '0.5rem',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)',
              height: '100%',
              width: `${conteoInfo.porcentajeCompletado}%`,
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>

        {/* Formulario de agregar producto */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            margin: '0 0 1.5rem 0',
            color: '#1e293b',
            fontSize: '1.3rem',
            fontWeight: 'bold'
          }}>
            ➕ Agregar Producto al Conteo
          </h3>

          {/* Buscador de productos */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <input
                type="text"
                placeholder="Buscar producto por nombre, código o categoría..."
                value={inputBusqueda}
                onChange={(e) => setInputBusqueda(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              />
              <button
                onClick={() => setMostrarScanner(!mostrarScanner)}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                📷
              </button>
            </div>

            {/* Lista de productos */}
            {inputBusqueda && (
              <div style={{
                maxHeight: '320px',
                overflow: 'auto',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                background: 'white',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem'
              }}>
                {productosFiltrados.map((producto) => (
                  <div
                    key={producto.id}
                    onClick={() => {
                      setProductoSeleccionado(producto);
                      setInputBusqueda('');
                    }}
                    style={{
                      padding: isMobile ? '0.75rem' : '0.5rem',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                    }}
                  >
                    {/* Código personalizado en azul arriba del nombre */}
                    {producto.codigoPersonalizado && (
                      <div style={{
                        fontWeight: 'bold',
                        color: '#3b82f6',
                        fontSize: '0.9rem',
                        marginBottom: '0.25rem'
                      }}>
                        {producto.codigoPersonalizado}
                      </div>
                    )}
                    
                    {/* Nombre del producto */}
                    <div style={{
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: '0.25rem'
                    }}>
                      {producto.nombre}
                    </div>
                    
                    {/* Información adicional */}
                    <div style={{
                      fontSize: '0.9rem',
                      color: '#64748b'
                    }}>
                      {producto.codigoBarras && `Código: ${producto.codigoBarras}`}
                      {producto.categoria && ` | Categoría: ${producto.categoria}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Producto seleccionado */}
          {productoSeleccionado && (
            <div style={{
              background: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <h4 style={{
                margin: '0 0 0.5rem 0',
                color: '#0c4a6e',
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}>
                {productoSeleccionado.nombre}
              </h4>
              <div style={{
                fontSize: '0.9rem',
                color: '#0c4a6e',
                marginBottom: '0.5rem'
              }}>
                Stock en sistema: {productoSeleccionado.stock}
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#0c4a6e'
              }}>
                {productoSeleccionado.codigoBarras && `Código: ${productoSeleccionado.codigoBarras}`}
                {productoSeleccionado.codigoPersonalizado && ` | Personalizado: ${productoSeleccionado.codigoPersonalizado}`}
              </div>
            </div>
          )}

          {/* Formulario de cantidad */}
          {productoSeleccionado && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  Cantidad:
                </label>
                <input
                  type="number"
                  min="0"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  Fórmula de cálculo (opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej: 112*4+3"
                  value={formulaCalculo}
                  onChange={(e) => {
                    setFormulaCalculo(e.target.value);
                    evaluarFormula(e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
                {formulaCalculo && (
                  <div style={{ marginTop: '0.5rem' }}>
                    {errorCalculo ? (
                      <div style={{
                        color: '#ef4444',
                        fontSize: '0.9rem'
                      }}>
                        ❌ {errorCalculo}
                      </div>
                    ) : resultadoCalculo !== null ? (
                      <div style={{
                        color: '#10b981',
                        fontSize: '0.9rem'
                      }}>
                        ✅ Resultado: {resultadoCalculo}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          {productoSeleccionado && (
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setProductoSeleccionado(null);
                  setCantidad('');
                  setFormulaCalculo('');
                  setResultadoCalculo(null);
                  setErrorCalculo(null);
                }}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={agregarProductoAlConteo}
                disabled={guardando || !cantidad}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: guardando || !cantidad ? 'not-allowed' : 'pointer',
                  opacity: guardando || !cantidad ? 0.7 : 1
                }}
              >
                {guardando ? 'Agregando...' : 'Agregar al Conteo'}
              </button>
            </div>
          )}
        </div>

        {/* Lista de productos contados */}
        {detallesConteo.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              margin: '0 0 1.5rem 0',
              color: '#1e293b',
              fontSize: '1.3rem',
              fontWeight: 'bold'
            }}>
              📋 Productos Contados
            </h3>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {detallesConteo.map((detalle) => (
                <div
                  key={detalle.id}
                  style={{
                    background: '#f8fafc',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <h4 style={{
                      margin: 0,
                      color: '#1e293b',
                      fontSize: '1rem',
                      fontWeight: 'bold'
                    }}>
                      {detalle.producto.nombre}
                    </h4>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{
                        background: obtenerColorEstado(detalle.estado),
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.8rem',
                        fontWeight: '500'
                      }}>
                        {obtenerTextoEstado(detalle.estado)}
                      </span>
                      <button
                        onClick={() => {
                          console.log('🔍 FRONTEND: Botón editar clickeado para detalle:', {
                            detalle: detalle,
                            detalleId: detalle.id,
                            detalleIdType: typeof detalle.id,
                            producto: detalle.producto?.nombre,
                            detallesConteoLength: detallesConteo.length,
                            detallesConteoIds: detallesConteo.map(d => ({ id: d.id, tipo: typeof d.id, producto: d.producto?.nombre }))
                          });
                          iniciarEdicion(detalle);
                        }}
                        style={{
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          marginRight: '0.5rem'
                        }}
                        title="Editar cantidad y fórmula"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => eliminarProductoDelConteo(detalle.id)}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                        title="Eliminar producto del conteo"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    color: '#64748b'
                  }}>
                    <div>Stock Sistema: {detalle.stockSistema}</div>
                    {detalle.cantidadConteo1 !== null && (
                      <div>Conteo 1: {detalle.cantidadConteo1}</div>
                    )}
                    {detalle.cantidadConteo2 !== null && (
                      <div>Conteo 2: {detalle.cantidadConteo2}</div>
                    )}
                    {detalle.cantidadFinal !== null && (
                      <div>Final: {detalle.cantidadFinal}</div>
                    )}
                  </div>

                  {/* Mostrar fórmulas si existen */}
                  {(detalle.formulaCalculo1 || detalle.formulaCalculo2) && (
                    <div style={{
                      marginTop: '0.5rem',
                      fontSize: '0.8rem',
                      color: '#6b7280'
                    }}>
                      {detalle.formulaCalculo1 && (
                        <div>Fórmula 1: {detalle.formulaCalculo1}</div>
                      )}
                      {detalle.formulaCalculo2 && (
                        <div>Fórmula 2: {detalle.formulaCalculo2}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formulario de edición */}
        {editandoDetalle && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '2px solid #3b82f6',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              margin: '0 0 1.5rem 0',
              color: '#1e293b',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              ✏️ Editando: {editandoDetalle.producto.nombre}
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  Cantidad:
                </label>
                <input
                  type="number"
                  min="0"
                  value={cantidadEditada}
                  onChange={(e) => setCantidadEditada(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  Fórmula de cálculo (opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej: 112*4+3"
                  value={formulaEditada}
                  onChange={(e) => {
                    setFormulaEditada(e.target.value);
                    evaluarFormulaEditada(e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
                {formulaEditada && (
                  <div style={{ marginTop: '0.5rem' }}>
                    {errorEditado ? (
                      <div style={{
                        color: '#ef4444',
                        fontSize: '0.9rem'
                      }}>
                        ❌ {errorEditado}
                      </div>
                    ) : resultadoEditado !== null ? (
                      <div style={{
                        color: '#10b981',
                        fontSize: '0.9rem'
                      }}>
                        ✅ Resultado: {resultadoEditado}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={cancelarEdicion}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={actualizarDetalleConteo}
                disabled={guardando || !cantidadEditada}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: guardando || !cantidadEditada ? 'not-allowed' : 'pointer',
                  opacity: guardando || !cantidadEditada ? 0.7 : 1
                }}
              >
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        )}

        {/* Botones de acción final */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          marginBottom: '2rem'
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
            ← Volver
          </button>
          <button
            onClick={finalizarConteo}
            disabled={guardando || detallesConteo.length === 0}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: guardando || detallesConteo.length === 0 ? 'not-allowed' : 'pointer',
              opacity: guardando || detallesConteo.length === 0 ? 0.7 : 1
            }}
          >
            {guardando ? 'Finalizando...' : 'Finalizar Conteo'}
          </button>
        </div>
      </div>
    </div>
  );
}


