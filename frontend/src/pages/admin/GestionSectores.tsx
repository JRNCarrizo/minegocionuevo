import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { API_CONFIG } from '../../config/api';
import ApiService from '../../services/api';
import './GestionSectores.css';

interface Sector {
  id: number;
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion?: string;
}

interface StockPorSector {
  id: number;
  producto: {
    id: number;
    nombre: string;
    codigoPersonalizado?: string;
  };
  sector: {
    id: number;
    nombre: string;
  };
  cantidad: number;
  fechaActualizacion: string;
}

interface ProductoDisponible {
  id: number;
  nombre: string;
  codigoPersonalizado?: string;
  stockTotal: number;
  stockAsignado: number;
  stockDisponible: number;
  unidadMedida?: string;
}

interface AsignacionProducto {
  productoId: number;
  cantidad: number;
}

export default function GestionSectores() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const navigate = useNavigate();
  
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [mostrarModalProductos, setMostrarModalProductos] = useState(false);
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [mostrarModalAsignar, setMostrarModalAsignar] = useState(false);
  const [mostrarModalTransferir, setMostrarModalTransferir] = useState(false);
  const [sectorSeleccionado, setSectorSeleccionado] = useState<Sector | null>(null);
  const [productosEnSector, setProductosEnSector] = useState<StockPorSector[]>([]);
  const [productosDisponibles, setProductosDisponibles] = useState<ProductoDisponible[]>([]);
  const [asignaciones, setAsignaciones] = useState<AsignacionProducto[]>([]);
  const [guardandoAsignaciones, setGuardandoAsignaciones] = useState(false);
  const [filtroBusquedaAsignacion, setFiltroBusquedaAsignacion] = useState('');
  const [filtroBusquedaProductos, setFiltroBusquedaProductos] = useState('');
  
  // Estados para transferencia de stock
  const [productosConStock, setProductosConStock] = useState<StockPorSector[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<StockPorSector | null>(null);
  const [sectorDestino, setSectorDestino] = useState<number | ''>('');
  const [cantidadTransferir, setCantidadTransferir] = useState<number>(0);
  const [transferiendo, setTransferiendo] = useState(false);
  
  // Estados para calculadora en transferencia
  const [cantidadTransferirTexto, setCantidadTransferirTexto] = useState<string>('');
  const [resultadoCalculoTransferir, setResultadoCalculoTransferir] = useState<number | null>(null);
  const [errorCalculoTransferir, setErrorCalculoTransferir] = useState<string | null>(null);
  
  // Nuevo estado para mostrar sectores inactivos
  const [mostrarSectoresInactivos, setMostrarSectoresInactivos] = useState(false);
  
  // Formulario
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    ubicacion: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [guardando, setGuardando] = useState(false);
  
  // Estado para almacenar información de productos por sector
  const [infoProductosPorSector, setInfoProductosPorSector] = useState<{[key: number]: {productos: number, unidades: number}}>({});
  
  
  // Estado para controlar cuando se está limpiando stock cero
  const [limpiandoStockCero, setLimpiandoStockCero] = useState(false);
  
  // Estado para el modal de confirmación de eliminación
  const [mostrarModalConfirmarEliminar, setMostrarModalConfirmarEliminar] = useState(false);
  const [sectorAEliminar, setSectorAEliminar] = useState<Sector | null>(null);
  const [eliminandoSector, setEliminandoSector] = useState(false);
  
  // Estados para navegación por teclado
  const [modoNavegacion, setModoNavegacion] = useState(false);
  const [elementoSeleccionado, setElementoSeleccionado] = useState(-1); // -1: botones, 0+: sectores
  
  // Estados para navegación por teclado en modal de productos
  const [filaSeleccionada, setFilaSeleccionada] = useState(-1);
  const [accionSeleccionada, setAccionSeleccionada] = useState(-1);
  const [inputBusquedaRef, setInputBusquedaRef] = useState<HTMLInputElement | null>(null);

  // Refs para los campos del formulario de crear sector
  const nombreInputRef = useRef<HTMLInputElement>(null);
  const descripcionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const ubicacionInputRef = useRef<HTMLInputElement>(null);

  // Foco automático en el primer campo cuando se abre el modal de crear
  useEffect(() => {
    if (mostrarModalCrear && nombreInputRef.current) {
      // Pequeño delay para asegurar que el modal esté completamente renderizado
      setTimeout(() => {
        nombreInputRef.current?.focus();
      }, 100);
    }
  }, [mostrarModalCrear]);

  // Resetear navegación y enfocar buscador cuando se abre modal de productos
  useEffect(() => {
    if (mostrarModalProductos) {
      setFilaSeleccionada(-1);
      setAccionSeleccionada(-1);
      // Enfocar el buscador automáticamente
      setTimeout(() => {
        const inputBusqueda = document.querySelector('.campo-busqueda-productos') as HTMLInputElement;
        if (inputBusqueda) {
          inputBusqueda.focus();
          setInputBusquedaRef(inputBusqueda);
        }
      }, 100);
    }
  }, [mostrarModalProductos]);

  // Calcular resultado en tiempo real cuando se escribe en el campo de cantidad de transferencia
  useEffect(() => {
    if (!cantidadTransferirTexto.trim()) {
      setResultadoCalculoTransferir(null);
      setErrorCalculoTransferir(null);
      return;
    }

    // Verificar si la cantidad contiene operadores matemáticos
    const contieneOperadores = /[+\-*/x()]/.test(cantidadTransferirTexto);
    
    if (contieneOperadores) {
      const evaluacion = evaluarExpresion(cantidadTransferirTexto);
      if (evaluacion.error) {
        setResultadoCalculoTransferir(null);
        setErrorCalculoTransferir(evaluacion.error);
      } else {
        setResultadoCalculoTransferir(evaluacion.resultado);
        setErrorCalculoTransferir(null);
      }
    } else {
      // Si no contiene operadores, limpiar el resultado
      setResultadoCalculoTransferir(null);
      setErrorCalculoTransferir(null);
    }
  }, [cantidadTransferirTexto]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    if (datosUsuario) {
      cargarSectores();
    }
  }, [navigate, datosUsuario]);



  // Función helper para hacer llamadas a la API con URL base correcta
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const baseUrl = API_CONFIG.getBaseUrl();
    // Asegurar que el endpoint no empiece con /api para evitar duplicación
    const cleanEndpoint = endpoint.startsWith('/api') ? endpoint.substring(4) : endpoint;
    const url = `${baseUrl}${cleanEndpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    console.log('🌐 API Call:', url); // Debug log
    return fetch(url, defaultOptions);
  };

  // Función para evaluar expresiones matemáticas de forma segura
  const evaluarExpresion = (expresion: string): { resultado: number | null; error: string | null } => {
    try {
      // Limpiar la expresión de espacios
      const expresionLimpia = expresion.trim();
      
      // Verificar que la expresión no esté vacía
      if (!expresionLimpia) {
        return { resultado: null, error: 'Expresión vacía' };
      }

      // Verificar que solo contenga caracteres permitidos (números, operadores básicos, paréntesis)
      const caracteresPermitidos = /^[0-9+\-*/().\s]+$/;
      if (!caracteresPermitidos.test(expresionLimpia)) {
        return { resultado: null, error: 'Caracteres no permitidos. Solo números y operadores (+, -, *, /, paréntesis)' };
      }

      // Verificar que no contenga palabras clave peligrosas
      const palabrasPeligrosas = ['eval', 'function', 'constructor', 'prototype', 'window', 'document', 'global'];
      const expresionLower = expresionLimpia.toLowerCase();
      for (const palabra of palabrasPeligrosas) {
        if (expresionLower.includes(palabra)) {
          return { resultado: null, error: 'Expresión no permitida' };
        }
      }

      // Reemplazar 'x' por '*' para facilitar la escritura (ej: 3x60 -> 3*60)
      const expresionConMultiplicacion = expresionLimpia.replace(/x/gi, '*');

      // Evaluar la expresión usando Function constructor (más seguro que eval)
      const resultado = new Function('return ' + expresionConMultiplicacion)();
      
      // Verificar que el resultado sea un número válido
      if (typeof resultado !== 'number' || !isFinite(resultado)) {
        return { resultado: null, error: 'Resultado no es un número válido' };
      }

      // Verificar que el resultado sea un entero positivo
      if (resultado <= 0 || !Number.isInteger(resultado)) {
        return { resultado: null, error: 'El resultado debe ser un número entero positivo' };
      }

      return { resultado, error: null };
    } catch (error) {
      return { resultado: null, error: 'Expresión inválida' };
    }
  };

  const cargarSectores = async () => {
    try {
      setCargando(true);
      const response = await apiCall(`/empresas/${datosUsuario?.empresaId}/sectores/todos`);
      
      if (response.ok) {
        const data = await response.json();
        setSectores(data.data || []);
        
        // Cargar información de productos por sector
        await cargarInfoProductosPorSector();
      } else {
        console.error('❌ Error response:', response.status, response.statusText);
        toast.error('Error al cargar sectores');
      }
    } catch (error) {
      console.error('Error al cargar sectores:', error);
      toast.error('Error al cargar sectores');
    } finally {
      setCargando(false);
    }
  };

  const cargarInfoProductosPorSector = async () => {
    try {
      console.log('🔍 CARGAR INFO PRODUCTOS - Iniciando...');
      
      // Cargar stock general para obtener información de productos por sector
      const stockResponse = await apiCall(`/empresas/${datosUsuario?.empresaId}/sectores/stock-general`);
      
      if (stockResponse.ok) {
        const stockData = await stockResponse.json();
        const stockGeneral = stockData.data || [];
        
        console.log('🔍 CARGAR INFO PRODUCTOS - Stock general cargado:', stockGeneral.length, 'items');
        
        // Calcular productos y unidades por sector
        const infoPorSector: {[key: number]: {productos: number, unidades: number}} = {};
        
        stockGeneral.forEach((item: any) => {
          if (item.tipo === 'con_sector' && item.sector) {
            const sectorId = item.sector.id;
            
            if (!infoPorSector[sectorId]) {
              infoPorSector[sectorId] = { productos: 0, unidades: 0 };
            }
            
            infoPorSector[sectorId].productos += 1;
            infoPorSector[sectorId].unidades += item.cantidad || 0;
          }
        });
        
        console.log('🔍 CARGAR INFO PRODUCTOS - Info calculada:', infoPorSector);
        setInfoProductosPorSector(infoPorSector);
      } else {
        console.error('🔍 CARGAR INFO PRODUCTOS - Error al cargar stock general:', stockResponse.status);
      }
    } catch (error) {
      console.error('🔍 CARGAR INFO PRODUCTOS - Error:', error);
    }
  };

  const cargarProductosEnSector = async (sectorId: number) => {
    try {
      const response = await apiCall(`/empresas/${datosUsuario?.empresaId}/sectores/${sectorId}/productos`);
      
      if (response.ok) {
        const data = await response.json();
        setProductosEnSector(data.data || []);
      } else {
        toast.error('Error al cargar productos del sector');
      }
    } catch (error) {
      console.error('Error al cargar productos del sector:', error);
      toast.error('Error al cargar productos del sector');
    }
  };



  const validarFormulario = () => {
    const nuevosErrors: {[key: string]: string} = {};
    
    if (!formData.nombre.trim()) {
      nuevosErrors.nombre = 'El nombre del sector es obligatorio';
    }
    
    if (formData.nombre.length > 100) {
      nuevosErrors.nombre = 'El nombre no puede exceder 100 caracteres';
    }
    
    if (formData.descripcion && formData.descripcion.length > 500) {
      nuevosErrors.descripcion = 'La descripción no puede exceder 500 caracteres';
    }
    
    if (formData.ubicacion && formData.ubicacion.length > 200) {
      nuevosErrors.ubicacion = 'La ubicación no puede exceder 200 caracteres';
    }
    
    setErrors(nuevosErrors);
    return Object.keys(nuevosErrors).length === 0;
  };

  const crearSector = async () => {
    if (!validarFormulario()) return;
    
    try {
      setGuardando(true);
      const response = await apiCall(`/empresas/${datosUsuario?.empresaId}/sectores`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        toast.success('Sector creado exitosamente');
        setMostrarModalCrear(false);
        limpiarFormulario();
        cargarSectores();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al crear sector');
      }
    } catch (error) {
      console.error('Error al crear sector:', error);
      toast.error('Error al crear sector');
    } finally {
      setGuardando(false);
    }
  };

  // Funciones para navegación con Enter en el formulario
  const handleKeyDownNombre = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      descripcionTextareaRef.current?.focus();
    }
  };

  const handleKeyDownDescripcion = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      ubicacionInputRef.current?.focus();
    }
  };

  const handleKeyDownUbicacion = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      crearSector();
    }
  };

  const actualizarSector = async () => {
    if (!validarFormulario() || !sectorSeleccionado) return;
    
    try {
      setGuardando(true);
      const response = await apiCall(`/empresas/${datosUsuario?.empresaId}/sectores/${sectorSeleccionado.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        toast.success('Sector actualizado exitosamente');
        setMostrarModalEditar(false);
        limpiarFormulario();
        cargarSectores();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al actualizar sector');
      }
    } catch (error) {
      console.error('Error al actualizar sector:', error);
      toast.error('Error al actualizar sector');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstadoSector = async (sectorId: number, activo: boolean) => {
    try {
      const response = await apiCall(`/empresas/${datosUsuario?.empresaId}/sectores/${sectorId}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ activo })
      });
      
      if (response.ok) {
        toast.success(`Sector ${activo ? 'activado' : 'desactivado'} exitosamente`);
        cargarSectores();
      } else {
        toast.error('Error al cambiar estado del sector');
      }
    } catch (error) {
      console.error('Error al cambiar estado del sector:', error);
      toast.error('Error al cambiar estado del sector');
    }
  };

  // Función para confirmar eliminación de sector
  const confirmarEliminarSector = (sector: Sector) => {
    setSectorAEliminar(sector);
    setMostrarModalConfirmarEliminar(true);
  };

  // Función para eliminar sector
  const eliminarSector = async () => {
    if (!sectorAEliminar) return;
    
    setEliminandoSector(true);
    try {
      const response = await apiCall(`/empresas/${datosUsuario?.empresaId}/sectores/${sectorAEliminar.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Sector eliminado correctamente');
        setMostrarModalConfirmarEliminar(false);
        setSectorAEliminar(null);
        cargarSectores();
      } else {
        toast.error('Error al eliminar el sector');
      }
    } catch (error) {
      toast.error('Error al eliminar el sector');
    } finally {
      setEliminandoSector(false);
    }
  };

  const migrarSectores = async () => {
    try {
      const response = await apiCall(`/empresas/${datosUsuario?.empresaId}/sectores/migrar`, {
        method: 'POST'
      });
      
      if (response.ok) {
        toast.success('Migración de sectores completada exitosamente');
        cargarSectores();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error en la migración');
      }
    } catch (error) {
      console.error('Error en la migración:', error);
      toast.error('Error en la migración');
    }
  };



  const actualizarAsignacion = (productoId: number, cantidad: number) => {
    const nuevaAsignacion = { productoId, cantidad };
    setAsignaciones(prev => {
      const filtradas = prev.filter(a => a.productoId !== productoId);
      if (cantidad > 0) {
        return [...filtradas, nuevaAsignacion];
      }
      return filtradas;
    });
  };

  const guardarAsignaciones = async () => {
    if (asignaciones.length === 0) {
      toast.error('No hay productos para asignar');
      return;
    }

    try {
      setGuardandoAsignaciones(true);
      
      // Debug: Log de las asignaciones que se van a enviar
      console.log('🔍 ASIGNACIONES A ENVIAR:', asignaciones);
      console.log('🔍 SECTOR ID:', sectorSeleccionado?.id);
      console.log('🔍 EMPRESA ID:', datosUsuario?.empresaId);
      
      const requestBody = { asignaciones };
      console.log('🔍 REQUEST BODY:', requestBody);
      
      const response = await apiCall(`/empresas/${datosUsuario?.empresaId}/sectores/${sectorSeleccionado?.id}/asignar-productos`, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.mensaje || 'Productos asignados exitosamente');
        setMostrarModalAsignar(false);
        setSectorSeleccionado(null);
        setAsignaciones([]);
        // Recargar sectores y actualizar información de productos
        await cargarSectores();
        await cargarInfoProductosPorSector();
      } else {
        const errorData = await response.json();
        console.error('🔍 ERROR RESPONSE:', errorData);
        console.error('🔍 RESPONSE STATUS:', response.status);
        toast.error(errorData.error || 'Error al asignar productos');
      }
    } catch (error) {
      console.error('Error al asignar productos:', error);
      toast.error('Error al asignar productos');
    } finally {
      setGuardandoAsignaciones(false);
    }
  };

  const quitarProductoDelSector = async (stockId: number, nombreProducto: string) => {
    if (!sectorSeleccionado) return;
    
    const confirmar = window.confirm(
      `¿Estás seguro de que quieres quitar "${nombreProducto}" del sector "${sectorSeleccionado.nombre}"?\n\nEsta acción devolverá el stock al inventario general.`
    );
    
    if (!confirmar) return;
    
    try {
      const response = await apiCall(`/empresas/${datosUsuario?.empresaId}/sectores/${sectorSeleccionado.id}/quitar-producto/${stockId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success(`Producto "${nombreProducto}" quitado exitosamente del sector`);
        // Recargar los productos del sector
        await cargarProductosEnSector(sectorSeleccionado.id);
        // Recargar la información de los sectores para actualizar las tarjetas
        await cargarSectores();
        await cargarInfoProductosPorSector();
      } else {
        const errorData = await response.json();
        toast.error(errorData.mensaje || 'Error al quitar el producto del sector');
      }
    } catch (error) {
      console.error('Error al quitar producto del sector:', error);
      toast.error('Error al quitar el producto del sector');
    }
  };


  const abrirModalEditar = (sector: Sector) => {
    setSectorSeleccionado(sector);
    setFormData({
      nombre: sector.nombre,
      descripcion: sector.descripcion || '',
      ubicacion: sector.ubicacion || ''
    });
    setMostrarModalEditar(true);
  };

  const abrirModalProductos = async (sector: Sector) => {
    setSectorSeleccionado(sector);
    await cargarProductosEnSector(sector.id);
    setMostrarModalProductos(true);
  };


  const abrirModalTransferirProducto = async (stock: StockPorSector) => {
    // Buscar el sector completo en la lista de sectores
    const sectorCompleto = sectores.find(s => s.id === stock.sector.id);
    if (sectorCompleto) {
      setSectorSeleccionado(sectorCompleto);
    }
    setProductoSeleccionado(stock);
    setSectorDestino('');
    setCantidadTransferir(0);
    setCantidadTransferirTexto('');
    setResultadoCalculoTransferir(null);
    setErrorCalculoTransferir(null);
    setMostrarModalTransferir(true);
  };

  const limpiarFormulario = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      ubicacion: ''
    });
    setErrors({});
    setSectorSeleccionado(null);
  };

  const cerrarModal = () => {
    setMostrarModalCrear(false);
    setMostrarModalEditar(false);
    setMostrarModalProductos(false);
    setMostrarModalDetalle(false);
    setMostrarModalAsignar(false);
    setMostrarModalTransferir(false);
    setSectorSeleccionado(null);
    setProductosEnSector([]);
    setProductosDisponibles([]);
    setAsignaciones([]);
    setFiltroBusquedaAsignacion('');
    setFiltroBusquedaProductos('');
    setProductosConStock([]);
    setProductoSeleccionado(null);
    setSectorDestino('');
    setCantidadTransferir(0);
    setCantidadTransferirTexto('');
    setResultadoCalculoTransferir(null);
    setErrorCalculoTransferir(null);
    limpiarFormulario();
  };

  const realizarTransferencia = async () => {
    if (!productoSeleccionado || !sectorDestino) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    // Determinar la cantidad a transferir
    let cantidadFinal: number;
    
    // Si hay texto en el campo de cantidad, evaluar la expresión
    if (cantidadTransferirTexto.trim()) {
      // Verificar si la cantidad contiene operadores matemáticos
      const contieneOperadores = /[+\-*/x()]/.test(cantidadTransferirTexto);
      
      if (contieneOperadores) {
        // Evaluar la expresión matemática
        const evaluacion = evaluarExpresion(cantidadTransferirTexto);
        if (evaluacion.error) {
          toast.error(`Error en el cálculo: ${evaluacion.error}`);
          return;
        }
        cantidadFinal = evaluacion.resultado!;
      } else {
        // Si no contiene operadores, parsear como número normal
        cantidadFinal = parseInt(cantidadTransferirTexto);
        if (isNaN(cantidadFinal) || cantidadFinal <= 0) {
          toast.error('Por favor ingresa una cantidad válida');
          return;
        }
      }
    } else {
      // Usar la cantidad numérica si no hay texto
      cantidadFinal = cantidadTransferir;
      if (cantidadFinal <= 0) {
        toast.error('Por favor ingresa una cantidad válida');
        return;
      }
    }

    if (cantidadFinal > productoSeleccionado.cantidad) {
      toast.error('La cantidad a transferir no puede ser mayor al stock disponible');
      return;
    }

    try {
      setTransferiendo(true);
      
      const response = await apiCall(`/empresas/${datosUsuario?.empresaId}/sectores/transferir-stock`, {
        method: 'POST',
        body: JSON.stringify({
          productoId: productoSeleccionado.producto.id,
          sectorOrigenId: sectorSeleccionado?.id,
          sectorDestinoId: sectorDestino,
          cantidad: cantidadFinal
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.mensaje || 'Stock transferido exitosamente');
        cerrarModal();
        await cargarSectores();
        await cargarInfoProductosPorSector();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al transferir stock');
      }
    } catch (error) {
      console.error('Error al transferir stock:', error);
      toast.error('Error al transferir stock');
    } finally {
      setTransferiendo(false);
    }
  };

  const obtenerColorSector = (index: number) => {
    const colores = [
      'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      'linear-gradient(135deg, #374151 0%, #4b5563 100%)',
      'linear-gradient(135deg, #475569 0%, #64748b 100%)',
      'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      'linear-gradient(135deg, #059669 0%, #047857 100%)',
      'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
      'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
    ];
    return colores[index % colores.length];
  };



  const limpiarStockCero = async () => {
    setLimpiandoStockCero(true);
    try {
      const response = await apiCall(`/empresas/${datosUsuario?.empresaId}/sectores/limpiar-stock-cero`, {
        method: 'POST'
      });

      if (response.ok) {
        toast.success('Productos con stock 0 eliminados correctamente');
        await cargarSectores();
        await cargarInfoProductosPorSector();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al limpiar stock cero');
      }
    } catch (error) {
      console.error('Error al limpiar stock cero:', error);
      toast.error('Error al limpiar stock cero');
    } finally {
      setLimpiandoStockCero(false);
    }
  };

  // Filtrar sectores activos e inactivos
  const sectoresActivos = sectores.filter(s => s.activo);
  const sectoresInactivos = sectores.filter(s => !s.activo);

  // Manejo de teclas para navegación
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Navegación por teclado en modal de productos
      if (mostrarModalProductos) {
        const productosFiltrados = productosEnSector.filter(stock => {
          if (!filtroBusquedaProductos) return true;
          const busqueda = filtroBusquedaProductos.toLowerCase();
          return (
            stock.producto.nombre.toLowerCase().includes(busqueda) ||
            (stock.producto.codigoPersonalizado && stock.producto.codigoPersonalizado.toLowerCase().includes(busqueda))
          );
        });

        switch (event.key) {
          case 'Escape':
            event.preventDefault();
            event.stopPropagation();
            cerrarModal();
            return;

          case 'ArrowDown':
            event.preventDefault();
            if (filaSeleccionada < productosFiltrados.length - 1) {
              setFilaSeleccionada(filaSeleccionada + 1);
              setAccionSeleccionada(-1); // Reset acción seleccionada
            }
            return;

          case 'ArrowUp':
            event.preventDefault();
            if (filaSeleccionada > 0) {
              setFilaSeleccionada(filaSeleccionada - 1);
              setAccionSeleccionada(-1); // Reset acción seleccionada
            } else if (filaSeleccionada === 0) {
              setFilaSeleccionada(-1); // Volver al buscador
              setAccionSeleccionada(-1);
              inputBusquedaRef?.focus();
            }
            return;

          case 'ArrowRight':
            event.preventDefault();
            if (filaSeleccionada >= 0 && accionSeleccionada < 1) {
              setAccionSeleccionada(accionSeleccionada + 1);
            }
            return;

          case 'ArrowLeft':
            event.preventDefault();
            if (filaSeleccionada >= 0 && accionSeleccionada > 0) {
              setAccionSeleccionada(accionSeleccionada - 1);
            } else if (filaSeleccionada >= 0 && accionSeleccionada === 0) {
              setAccionSeleccionada(-1); // Volver a la fila
            }
            return;

          case 'Enter':
            event.preventDefault();
            if (filaSeleccionada >= 0 && accionSeleccionada >= 0 && productosFiltrados[filaSeleccionada]) {
              const stock = productosFiltrados[filaSeleccionada];
              if (accionSeleccionada === 0) {
                // Botón transferir
                abrirModalTransferirProducto(stock);
              } else if (accionSeleccionada === 1) {
                // Botón quitar
                quitarProductoDelSector(stock.id, stock.producto.nombre);
              }
            }
            return;
        }
        return;
      }

      // Si hay otros modales abiertos, solo manejar Escape
      if (mostrarModalCrear || mostrarModalEditar || 
          mostrarModalDetalle || mostrarModalAsignar || mostrarModalTransferir) {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          cerrarModal();
        }
        return;
      }

      // Si estás en un input, solo manejar Escape
      const activeElement = document.activeElement;
      const isInput = activeElement?.tagName === 'INPUT' || 
                     activeElement?.tagName === 'TEXTAREA' || 
                     activeElement?.tagName === 'SELECT';
      
      if (isInput) {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          (activeElement as HTMLElement)?.blur();
        }
        return;
      }

      switch (event.key) {
        case 'Enter':
          event.preventDefault();
          if (modoNavegacion) {
            if (elementoSeleccionado >= 0 && elementoSeleccionado <= 3) {
              // Navegar entre botones de acción
              if (elementoSeleccionado === 0) {
                navigate('/admin/stock-general');
              } else if (elementoSeleccionado === 1) {
                setMostrarModalCrear(true);
              } else if (elementoSeleccionado === 2) {
                migrarSectores();
              } else if (elementoSeleccionado === 3) {
                // Actualizar información
                setCargando(true);
                cargarInfoProductosPorSector().then(() => {
                  setCargando(false);
                  toast.success('Información actualizada');
                });
              }
            } else if (elementoSeleccionado >= 4) {
              // Seleccionar sector
              const sectoresVisibles = mostrarSectoresInactivos 
                ? [...sectoresActivos, ...sectoresInactivos]
                : sectoresActivos;
              const sectorIndex = elementoSeleccionado - 4;
              const sectorSeleccionado = sectoresVisibles[sectorIndex];
              if (sectorSeleccionado) {
                abrirModalProductos(sectorSeleccionado);
              }
            }
          } else {
            // Activar modo navegación
            setModoNavegacion(true);
            setElementoSeleccionado(0);
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
          const sectoresVisibles = mostrarSectoresInactivos 
            ? [...sectoresActivos, ...sectoresInactivos]
            : sectoresActivos;
          const totalElementos = 4 + sectoresVisibles.length; // 4 botones + sectores
          
          let nuevaSeleccion = elementoSeleccionado;
          
          if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
            if (elementoSeleccionado <= 0) {
              nuevaSeleccion = totalElementos - 1;
            } else {
              nuevaSeleccion = elementoSeleccionado - 1;
            }
          } else {
            if (elementoSeleccionado >= totalElementos - 1) {
              nuevaSeleccion = 0;
            } else {
              nuevaSeleccion = elementoSeleccionado + 1;
            }
          }
          
          setElementoSeleccionado(nuevaSeleccion);
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
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [mostrarModalCrear, mostrarModalEditar, mostrarModalProductos, 
      mostrarModalDetalle, mostrarModalAsignar, mostrarModalTransferir, 
      navigate, modoNavegacion, elementoSeleccionado, sectoresActivos, 
      sectoresInactivos, mostrarSectoresInactivos, migrarSectores, abrirModalProductos, 
      setMostrarModalCrear, productosEnSector, filtroBusquedaProductos, filaSeleccionada, 
      accionSeleccionada, inputBusquedaRef, abrirModalTransferirProducto, quitarProductoDelSector]);

  if (!datosUsuario) {
    return (
      <div className="pagina-carga">
        <div className="tarjeta-carga">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pagina-sectores">
      <NavbarAdmin onCerrarSesion={cerrarSesion} />
      
      <div className="contenedor-sectores">
        {/* Header Principal */}
        <div className="header-sectores">
          <div className="icono-header">
            <span>🏢</span>
          </div>
          <h1 className="titulo-sectores">Gestión de Sectores</h1>
          <p className="descripcion-sectores">
            Administra los sectores de almacenamiento de tu empresa de manera moderna y eficiente
          </p>
        </div>

        {/* Botones de Acción */}
        <div className="botones-accion">
          <button
            onClick={() => navigate('/admin/stock-general')}
            className={`boton-stock-general ${modoNavegacion && elementoSeleccionado === 0 ? 'seleccionado' : ''}`}
          >
            <span className="icono-boton">📊</span>
            Ver Stock General
          </button>
          <button
            onClick={() => setMostrarModalCrear(true)}
            className={`boton-crear ${modoNavegacion && elementoSeleccionado === 1 ? 'seleccionado' : ''}`}
          >
            <span className="icono-boton">➕</span>
            Crear Nuevo Sector
          </button>
          <button
            onClick={migrarSectores}
            className={`boton-migrar ${modoNavegacion && elementoSeleccionado === 2 ? 'seleccionado' : ''}`}
          >
            <span className="icono-boton">🔄</span>
            Migrar Sectores Existentes
          </button>
        </div>


        {/* Estadísticas */}
        <div className="estadisticas-sectores">
          <div className="tarjeta-estadistica tarjeta-total">
            <div className="contenido-estadistica">
              <div className="icono-estadistica">
                <span>🏢</span>
              </div>
              <div className="texto-estadistica">
                <p className="label-estadistica">Total Sectores</p>
                <p className="numero-estadistica">{sectores.length}</p>
              </div>
            </div>
          </div>
          
          <div className="tarjeta-estadistica tarjeta-activos">
            <div className="contenido-estadistica">
              <div className="icono-estadistica">
                <span>✅</span>
              </div>
              <div className="texto-estadistica">
                <p className="label-estadistica">Sectores Activos</p>
                <p className="numero-estadistica">
                  {sectoresActivos.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="tarjeta-estadistica tarjeta-inactivos">
            <div className="contenido-estadistica">
              <div className="icono-estadistica">
                <span>❌</span>
              </div>
              <div className="texto-estadistica">
                <p className="label-estadistica">Sectores Inactivos</p>
                <p className="numero-estadistica">
                  {sectoresInactivos.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle para mostrar sectores inactivos */}
        {sectoresInactivos.length > 0 && (
          <div className="toggle-sectores-inactivos">
            <button
              onClick={() => setMostrarSectoresInactivos(!mostrarSectoresInactivos)}
              className={`boton-toggle ${mostrarSectoresInactivos ? 'activo' : ''}`}
            >
              <span className="icono-toggle">
                {mostrarSectoresInactivos ? '👁️' : '👁️‍🗨️'}
              </span>
              {mostrarSectoresInactivos ? 'Ocultar Sectores Inactivos' : `Mostrar Sectores Inactivos (${sectoresInactivos.length})`}
            </button>
          </div>
        )}

        {/* Grid de Sectores */}
        {cargando ? (
          <div className="tarjeta-carga-sectores">
            <div className="spinner"></div>
            <p>Cargando sectores...</p>
          </div>
        ) : (
          <div className="contenedor-grid">
            {/* Sectores Activos */}
            <div className="seccion-sectores">
              <h2 className="titulo-seccion">Sectores Activos</h2>
              {sectoresActivos.length === 0 ? (
                <div className="tarjeta-vacia">
                  <div className="icono-vacio">✅</div>
                  <h3>No hay sectores activos</h3>
                  <p>Activa algunos sectores para comenzar a usarlos</p>
                  <button
                    onClick={() => setMostrarModalCrear(true)}
                    className="boton-primer-sector"
                  >
                    <span>➕</span>
                    Crear Primer Sector
                  </button>
                </div>
              ) : (
                <div className="grid-sectores">
                  {sectoresActivos.map((sector, index) => (
                    <div
                      key={sector.id}
                      className={`tarjeta-sector ${modoNavegacion && elementoSeleccionado === index + 4 ? 'seleccionada' : ''}`}
                      onClick={() => abrirModalProductos(sector)}
                      style={{
                        animationDelay: `${index * 0.1}s`
                      }}
                    >
                      {/* Header de la card con gradiente */}
                      <div 
                        className="header-tarjeta-sector"
                        style={{ background: obtenerColorSector(index) }}
                      >
                        <div className="contenido-header-sector">
                          <div className="icono-sector">🏢</div>
                          <h3 className="nombre-sector">{sector.nombre}</h3>
                        </div>
                        {/* Badge de estado */}
                        <div className="badge-estado">
                          <span className="estado-sector activo">
                            ✅ Activo
                          </span>
                        </div>
                      </div>

                      {/* Contenido de la card */}
                      <div className="contenido-tarjeta-sector">
                        {sector.descripcion && (
                          <p className="descripcion-sector">
                            {sector.descripcion}
                          </p>
                        )}
                        
                        <div className="info-sector">
                          <div className="info-item">
                            <span className="icono-info">📍</span>
                            <span className="texto-info">
                              {sector.ubicacion || 'Sin ubicación'}
                            </span>
                          </div>
                          
                          {/* Información de productos y unidades */}
                          <div className="info-item">
                            <span className="icono-info">📦</span>
                            <span className="texto-info">
                              Productos: {infoProductosPorSector[sector.id]?.productos || 0}
                            </span>
                          </div>
                          
                          <div className="info-item">
                            <span className="icono-info">🔢</span>
                            <span className="texto-info">
                              Unidades: {infoProductosPorSector[sector.id]?.unidades?.toLocaleString() || 0}
                            </span>
                          </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="botones-accion-sector">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/sectores/${sector.id}/recibir-productos`);
                            }}
                            className="boton-accion boton-asignar"
                            title="Recibir stock"
                          >
                            📦
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirModalEditar(sector);
                            }}
                            className="boton-accion boton-editar"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cambiarEstadoSector(sector.id, false);
                            }}
                            className="boton-accion boton-desactivar"
                            title="Desactivar"
                          >
                            ❌
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmarEliminarSector(sector);
                            }}
                            className="boton-accion boton-eliminar"
                            title="Eliminar sector"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sectores Inactivos */}
            {mostrarSectoresInactivos && sectoresInactivos.length > 0 && (
              <div className="seccion-sectores seccion-inactivos">
                <h2 className="titulo-seccion titulo-inactivos">
                  <span className="icono-titulo">❌</span>
                  Sectores Inactivos
                </h2>
                <div className="grid-sectores">
                  {sectoresInactivos.map((sector, index) => (
                    <div
                      key={sector.id}
                      className={`tarjeta-sector tarjeta-inactiva ${modoNavegacion && elementoSeleccionado === index + 4 + sectoresActivos.length ? 'seleccionada' : ''}`}
                      onClick={() => abrirModalProductos(sector)}
                      style={{
                        animationDelay: `${index * 0.1}s`
                      }}
                    >
                      {/* Header de la card con gradiente gris */}
                      <div 
                        className="header-tarjeta-sector header-inactivo"
                        style={{ background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' }}
                      >
                        <div className="contenido-header-sector">
                          <div className="icono-sector">🏢</div>
                          <h3 className="nombre-sector">{sector.nombre}</h3>
                        </div>
                        {/* Badge de estado */}
                        <div className="badge-estado">
                          <span className="estado-sector inactivo">
                            ❌ Inactivo
                          </span>
                        </div>
                      </div>

                      {/* Contenido de la card */}
                      <div className="contenido-tarjeta-sector">
                        {sector.descripcion && (
                          <p className="descripcion-sector">
                            {sector.descripcion}
                          </p>
                        )}
                        
                        <div className="info-sector">
                          <div className="info-item">
                            <span className="icono-info">📍</span>
                            <span className="texto-info">
                              {sector.ubicacion || 'Sin ubicación'}
                            </span>
                          </div>
                          
                          {/* Información de productos y unidades */}
                          <div className="info-item">
                            <span className="icono-info">📦</span>
                            <span className="texto-info">
                              Productos: {infoProductosPorSector[sector.id]?.productos || 0}
                            </span>
                          </div>
                          
                          <div className="info-item">
                            <span className="icono-info">🔢</span>
                            <span className="texto-info">
                              Unidades: {infoProductosPorSector[sector.id]?.unidades?.toLocaleString() || 0}
                            </span>
                          </div>
                        </div>

                        {/* Botones de acción para sectores inactivos */}
                        <div className="botones-accion-sector">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirModalEditar(sector);
                            }}
                            className="boton-accion boton-editar"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cambiarEstadoSector(sector.id, true);
                            }}
                            className="boton-accion boton-activar"
                            title="Activar"
                          >
                            ✅
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Estado vacío general */}
            {sectores.length === 0 && (
              <div className="tarjeta-vacia">
                <div className="icono-vacio">🏢</div>
                <h3>No hay sectores creados</h3>
                <p>Comienza creando tu primer sector de almacenamiento</p>
                <button
                  onClick={() => setMostrarModalCrear(true)}
                  className="boton-primer-sector"
                >
                  <span>➕</span>
                  Crear Primer Sector
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Detalle del Sector */}
      {mostrarModalDetalle && sectorSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-detalle">
            <div className="header-modal">
              <div className="contenido-header-modal">
                <div className="icono-modal">
                  <span>🏢</span>
                </div>
                <div>
                  <h3 className="titulo-modal">
                    {sectorSeleccionado.nombre}
                  </h3>
                  <p className="subtitulo-modal">
                    Detalles del sector
                  </p>
                </div>
              </div>
              <button
                onClick={cerrarModal}
                className="boton-cerrar-modal"
              >
                ✕
              </button>
            </div>

            <div className="contenido-modal-detalle">
              <div className="seccion-info">
                <h4>Información General</h4>
                <div className="campos-info">
                  <div className="campo-info">
                    <label>Descripción</label>
                    <p>{sectorSeleccionado.descripcion || 'Sin descripción'}</p>
                  </div>
                  <div className="campo-info">
                    <label>Ubicación</label>
                    <p>{sectorSeleccionado.ubicacion || 'Sin ubicación'}</p>
                  </div>
                  <div className="campo-info">
                    <label>Estado</label>
                    <span className={`estado-sector ${sectorSeleccionado.activo ? 'activo' : 'inactivo'}`}>
                      {sectorSeleccionado.activo ? '✅ Activo' : '❌ Inactivo'}
                    </span>
                  </div>
                  <div className="campo-info">
                    <label>Fecha de Creación</label>
                    <p>{new Date(sectorSeleccionado.fechaCreacion).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="seccion-productos">
                <h4>Productos en Sector</h4>
                {productosEnSector.length === 0 ? (
                  <div className="productos-vacios">
                    <div className="icono-productos">📦</div>
                    <p>No hay productos asignados a este sector</p>
                  </div>
                ) : (
                  <div className="lista-productos">
                    {productosEnSector.slice(0, 5).map((stock) => (
                      <div key={stock.id} className="item-producto">
                        <div>
                          <p className="nombre-producto">{stock.producto.nombre}</p>
                          <p className="codigo-producto">{stock.producto.codigoPersonalizado || 'Sin código'}</p>
                        </div>
                        <span className="cantidad-producto">
                          {stock.cantidad}
                        </span>
                      </div>
                    ))}
                    {productosEnSector.length > 5 && (
                      <p className="productos-adicionales">
                        Y {productosEnSector.length - 5} productos más...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="botones-modal">
              <button
                onClick={() => {
                  setMostrarModalDetalle(false);
                  abrirModalProductos(sectorSeleccionado);
                }}
                className="boton-secundario"
              >
                Ver Todos los Productos
              </button>
              <button
                onClick={() => {
                  setMostrarModalDetalle(false);
                  abrirModalEditar(sectorSeleccionado);
                }}
                className="boton-primario"
              >
                Editar Sector
              </button>
              <button
                onClick={cerrarModal}
                className="boton-cancelar"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Sector */}
      {mostrarModalCrear && (
        <div className="modal-overlay">
          <div className="modal-formulario">
            <div className="header-modal">
              <div className="contenido-header-modal">
                <div className="icono-modal">
                  <span>🏢</span>
                </div>
                <h3 className="titulo-modal">Crear Nuevo Sector</h3>
              </div>
            </div>
            
            <div className="contenido-modal-formulario">
              <div className="campo-formulario">
                <label className="label-campo">
                  Nombre del Sector <span className="requerido">*</span>
                </label>
                <input
                  ref={nombreInputRef}
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  onKeyDown={handleKeyDownNombre}
                  className={`input-campo ${errors.nombre ? 'error' : ''}`}
                  placeholder="Ej: Depósito Principal"
                />
                {errors.nombre && (
                  <p className="mensaje-error">{errors.nombre}</p>
                )}
              </div>
              
              <div className="campo-formulario">
                <label className="label-campo">
                  Descripción
                </label>
                <textarea
                  ref={descripcionTextareaRef}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  onKeyDown={handleKeyDownDescripcion}
                  className={`input-campo ${errors.descripcion ? 'error' : ''}`}
                  placeholder="Descripción del sector"
                  rows={3}
                />
                {errors.descripcion && (
                  <p className="mensaje-error">{errors.descripcion}</p>
                )}
              </div>
              
              <div className="campo-formulario">
                <label className="label-campo">
                  Ubicación
                </label>
                <input
                  ref={ubicacionInputRef}
                  type="text"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({...formData, ubicacion: e.target.value})}
                  onKeyDown={handleKeyDownUbicacion}
                  className={`input-campo ${errors.ubicacion ? 'error' : ''}`}
                  placeholder="Ej: Planta baja, Pasillo A"
                />
                {errors.ubicacion && (
                  <p className="mensaje-error">{errors.ubicacion}</p>
                )}
              </div>
            </div>
            
            <div className="botones-modal">
              <button
                onClick={cerrarModal}
                className="boton-cancelar"
              >
                Cancelar
              </button>
              <button
                onClick={crearSector}
                disabled={guardando}
                className="boton-primario"
              >
                {guardando ? 'Creando...' : 'Crear Sector'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Sector */}
      {mostrarModalEditar && (
        <div className="modal-overlay">
          <div className="modal-formulario">
            <div className="header-modal">
              <div className="contenido-header-modal">
                <div className="icono-modal">
                  <span>✏️</span>
                </div>
                <h3 className="titulo-modal">Editar Sector</h3>
              </div>
            </div>
            
            <div className="contenido-modal-formulario">
              <div className="campo-formulario">
                <label className="label-campo">
                  Nombre del Sector <span className="requerido">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className={`input-campo ${errors.nombre ? 'error' : ''}`}
                  placeholder="Ej: Depósito Principal"
                />
                {errors.nombre && (
                  <p className="mensaje-error">{errors.nombre}</p>
                )}
              </div>
              
              <div className="campo-formulario">
                <label className="label-campo">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className={`input-campo ${errors.descripcion ? 'error' : ''}`}
                  placeholder="Descripción del sector"
                  rows={3}
                />
                {errors.descripcion && (
                  <p className="mensaje-error">{errors.descripcion}</p>
                )}
              </div>
              
              <div className="campo-formulario">
                <label className="label-campo">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({...formData, ubicacion: e.target.value})}
                  className={`input-campo ${errors.ubicacion ? 'error' : ''}`}
                  placeholder="Ej: Planta baja, Pasillo A"
                />
                {errors.ubicacion && (
                  <p className="mensaje-error">{errors.ubicacion}</p>
                )}
              </div>
            </div>
            
            <div className="botones-modal">
              <button
                onClick={cerrarModal}
                className="boton-cancelar"
              >
                Cancelar
              </button>
              <button
                onClick={actualizarSector}
                disabled={guardando}
                className="boton-primario"
              >
                {guardando ? 'Actualizando...' : 'Actualizar Sector'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Productos en Sector */}
      {mostrarModalProductos && (
        <div className="modal-overlay">
          <div className="modal-productos">
            <div className="header-modal">
              <div className="contenido-header-modal">
                <div className="icono-modal">
                  <span>📦</span>
                </div>
                <div>
                  <h3 className="titulo-modal">
                    Productos en Sector: {sectorSeleccionado?.nombre}
                  </h3>
                  <p className="subtitulo-modal">
                    Lista completa de productos
                  </p>
                </div>
              </div>
              <button
                onClick={cerrarModal}
                className="boton-cerrar-modal"
              >
                ✕
              </button>
            </div>
            
            {/* Buscador avanzado */}
            <div className="buscador-productos">
              <div className="input-busqueda-productos">
                <span className="icono-busqueda-productos">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar productos por nombre o código..."
                  value={filtroBusquedaProductos}
                  onChange={(e) => setFiltroBusquedaProductos(e.target.value)}
                  className="campo-busqueda-productos"
                  ref={(el) => setInputBusquedaRef(el)}
                />
                {filtroBusquedaProductos && (
                  <button
                    onClick={() => setFiltroBusquedaProductos('')}
                    className="boton-limpiar-busqueda"
                    title="Limpiar búsqueda"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            
            {(() => {
              const productosFiltrados = productosEnSector.filter(stock => {
                if (!filtroBusquedaProductos) return true;
                const busqueda = filtroBusquedaProductos.toLowerCase();
                return (
                  stock.producto.nombre.toLowerCase().includes(busqueda) ||
                  (stock.producto.codigoPersonalizado && stock.producto.codigoPersonalizado.toLowerCase().includes(busqueda))
                );
              });

              if (productosEnSector.length === 0) {
                return (
                  <div className="productos-vacios-grande">
                    <div className="icono-productos-grande">📦</div>
                    <p>No hay productos asignados a este sector</p>
                  </div>
                );
              }

              if (productosFiltrados.length === 0 && filtroBusquedaProductos) {
                return (
                  <div className="productos-vacios-grande">
                    <div className="icono-productos-grande">🔍</div>
                    <p>No se encontraron productos</p>
                    <p className="texto-secundario">
                      Intenta con otro término de búsqueda
                    </p>
                  </div>
                );
              }

              return (
                <div className="contenedor-productos">
                  {window.innerWidth <= 768 ? (
                    // Vista móvil con tarjetas
                    <div className="productos-mobile-cards">
                      {productosFiltrados.map((stock, index) => (
                        <div 
                          key={stock.id}
                          className={`producto-mobile-card ${filaSeleccionada === index ? 'fila-seleccionada' : ''}`}
                        >
                          {/* Primera fila: Código y Nombre */}
                          <div className="producto-card-row">
                            <div className="producto-codigo-container">
                              <div className="producto-label">Código</div>
                              <div className="producto-codigo-value">
                                {stock.producto.codigoPersonalizado || 'Sin código'}
                              </div>
                            </div>
                            <div className="producto-nombre-container">
                              <div className="producto-label">Producto</div>
                              <div className="producto-nombre-value">
                                {stock.producto.nombre}
                              </div>
                            </div>
                          </div>
                          
                          {/* Segunda fila: Cantidad, Fecha y Acciones */}
                          <div className="producto-card-row">
                            <div className="producto-cantidad-container">
                              <div className="producto-label">Cantidad</div>
                              <div className="producto-cantidad-value">
                                {stock.cantidad}
                              </div>
                            </div>
                            <div className="producto-fecha-container">
                              <div className="producto-label">Actualizado</div>
                              <div className="producto-fecha-value">
                                {new Date(stock.fechaActualizacion).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: '2-digit'
                                })}
                              </div>
                            </div>
                            <div className="producto-acciones-container">
                              <button
                                onClick={() => abrirModalTransferirProducto(stock)}
                                className={`boton-accion-mobile boton-transferir-mobile ${filaSeleccionada === index && accionSeleccionada === 0 ? 'accion-seleccionada' : ''}`}
                                title="Transferir stock"
                              >
                                🔄
                              </button>
                              <button
                                onClick={() => quitarProductoDelSector(stock.id, stock.producto.nombre)}
                                className={`boton-accion-mobile boton-quitar-mobile ${filaSeleccionada === index && accionSeleccionada === 1 ? 'accion-seleccionada' : ''}`}
                                title="Quitar producto"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Vista desktop con tabla
                    <div className="tabla-productos">
                      <table>
                        <thead>
                          <tr>
                            <th>Código</th>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Última Actualización</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productosFiltrados.map((stock, index) => (
                            <tr 
                              key={stock.id}
                              className={filaSeleccionada === index ? 'fila-seleccionada' : ''}
                            >
                              <td className="codigo-producto-tabla">
                                {stock.producto.codigoPersonalizado || '-'}
                              </td>
                              <td>
                                <div className="nombre-producto-tabla">
                                  {stock.producto.nombre}
                                </div>
                              </td>
                              <td>
                                <span className="cantidad-producto-tabla">
                                  {stock.cantidad}
                                </span>
                              </td>
                              <td className="fecha-producto-tabla">
                                {new Date(stock.fechaActualizacion).toLocaleDateString()}
                              </td>
                              <td className="acciones-producto-tabla">
                                <div className="botones-accion-producto">
                                  <button
                                    onClick={() => abrirModalTransferirProducto(stock)}
                                    className={`boton-transferir-producto ${filaSeleccionada === index && accionSeleccionada === 0 ? 'accion-seleccionada' : ''}`}
                                    title="Transferir stock"
                                  >
                                    🔄
                                  </button>
                                  <button
                                    onClick={() => quitarProductoDelSector(stock.id, stock.producto.nombre)}
                                    className={`boton-quitar-producto ${filaSeleccionada === index && accionSeleccionada === 1 ? 'accion-seleccionada' : ''}`}
                                    title="Quitar producto del sector"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}
            
            <div className="botones-modal">
              <button
                onClick={cerrarModal}
                className="boton-cancelar"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Asignar Productos */}
      {mostrarModalAsignar && (
        <div className="modal-overlay">
          <div className="modal-asignar-productos">
            <div className="header-modal">
              <div className="contenido-header-modal">
                <div className="icono-modal">
                  <span>➕</span>
                </div>
                <div>
                  <h3 className="titulo-modal">
                    Asignar Productos a: {sectorSeleccionado?.nombre}
                  </h3>
                  <p className="subtitulo-modal">
                    Selecciona productos y asigna cantidades
                  </p>
                </div>
              </div>
              <button
                onClick={cerrarModal}
                className="boton-cerrar-modal"
              >
                ✕
              </button>
            </div>
            
            {/* Buscador avanzado */}
            <div className="buscador-asignacion">
              <div className="input-busqueda-asignacion">
                <span className="icono-busqueda-asignacion">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar productos por nombre o código..."
                  value={filtroBusquedaAsignacion}
                  onChange={(e) => setFiltroBusquedaAsignacion(e.target.value)}
                  className="campo-busqueda-asignacion"
                />
                {filtroBusquedaAsignacion && (
                  <button
                    onClick={() => setFiltroBusquedaAsignacion('')}
                    className="boton-limpiar-busqueda"
                    title="Limpiar búsqueda"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            
            {false ? (
              <div className="productos-cargando">
                <div className="spinner"></div>
                <p>Cargando productos disponibles...</p>
              </div>
            ) : productosDisponibles.length === 0 ? (
              <div className="productos-vacios-grande">
                <div className="icono-productos-grande">📦</div>
                <p>No hay productos disponibles para asignar</p>
                <p className="texto-secundario">
                  Todos los productos ya están asignados o no hay stock disponible
                </p>
              </div>
            ) : (
              <div className="contenido-asignacion">
                {(() => {
                  const productosFiltrados = productosDisponibles.filter(producto => {
                    if (!filtroBusquedaAsignacion) return true;
                    const busqueda = filtroBusquedaAsignacion.toLowerCase();
                    return (
                      producto.nombre.toLowerCase().includes(busqueda) ||
                      (producto.codigoPersonalizado && producto.codigoPersonalizado.toLowerCase().includes(busqueda))
                    );
                  });

                  if (productosFiltrados.length === 0 && filtroBusquedaAsignacion) {
                    return (
                      <div className="productos-vacios-grande">
                        <div className="icono-productos-grande">🔍</div>
                        <p>No se encontraron productos</p>
                        <p className="texto-secundario">
                          Intenta con otro término de búsqueda
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="lista-productos-asignacion">
                      {productosFiltrados.map((producto) => {
                        const asignacionActual = asignaciones.find(a => a.productoId === producto.id);
                        const cantidadAsignada = asignacionActual?.cantidad || 0;
                        
                        return (
                          <div key={producto.id} className="item-producto-asignacion">
                            <div className="info-producto-asignacion">
                              <div className="nombre-producto-asignacion">
                                {producto.nombre}
                              </div>
                              <div className="codigo-producto-asignacion">
                                {producto.codigoPersonalizado || 'Sin código'}
                              </div>
                              <div className="stock-info-asignacion">
                                <span className="stock-total">
                                  Stock total: {producto.stockTotal}
                                </span>
                                <span className="stock-disponible">
                                  Disponible: {producto.stockDisponible}
                                </span>
                              </div>
                            </div>
                            
                            <div className="control-asignacion">
                              <label className="label-cantidad-asignacion">
                                Cantidad a asignar:
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={producto.stockDisponible}
                                value={cantidadAsignada === 0 ? '' : cantidadAsignada}
                                onChange={(e) => {
                                  const valor = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                                  actualizarAsignacion(producto.id, valor);
                                }}
                                className="input-cantidad-asignacion"
                                placeholder="0"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                
                {asignaciones.length > 0 && (
                  <div className="resumen-asignacion">
                    <h4>Resumen de Asignación</h4>
                    <div className="items-resumen">
                      {asignaciones.map((asignacion) => {
                        const producto = productosDisponibles.find(p => p.id === asignacion.productoId);
                        return (
                          <div key={asignacion.productoId} className="item-resumen">
                            <span className="nombre-resumen">{producto?.nombre}</span>
                            <span className="cantidad-resumen">
                              {asignacion.cantidad} {producto?.unidadMedida || 'unidades'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="botones-modal">
              <button
                onClick={cerrarModal}
                className="boton-cancelar"
              >
                Cancelar
              </button>
              <button
                onClick={guardarAsignaciones}
                disabled={guardandoAsignaciones || asignaciones.length === 0}
                className="boton-primario"
              >
                {guardandoAsignaciones ? 'Asignando...' : 'Asignar Productos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Transferir Stock */}
      {mostrarModalTransferir && (
        <div className="modal-overlay">
          <div className="modal-formulario">
            <div className="header-modal">
              <div className="contenido-header-modal">
                <div className="icono-modal">🔄</div>
                <div>
                  <h3 className="titulo-modal">Transferir Stock entre Sectores</h3>
                  <p className="subtitulo-modal">Mover productos entre sectores de almacenamiento</p>
                </div>
              </div>
              <button onClick={cerrarModal} className="boton-cerrar-modal">
                ✕
              </button>
            </div>
            
            <div className="contenido-modal-formulario">
              <div className="seccion-transferencia">
                <h4>Sector Origen: {sectorSeleccionado?.nombre}</h4>
                
                {productoSeleccionado ? (
                  <div className="campo-transferencia">
                    <label>Producto seleccionado:</label>
                    <div className="producto-seleccionado">
                      <strong>{productoSeleccionado.producto.nombre}</strong>
                      <span className="stock-disponible">Stock disponible: {productoSeleccionado.cantidad}</span>
                    </div>
                  </div>
                ) : (
                  <div className="campo-transferencia">
                    <label>Producto a transferir:</label>
                    <select
                      value={productoSeleccionado ? (productoSeleccionado as StockPorSector).id.toString() : ''}
                      onChange={(e) => {
                        const productoId = parseInt(e.target.value);
                        const producto = productosConStock.find((p: StockPorSector) => p.id === productoId);
                        setProductoSeleccionado(producto || null);
                        setCantidadTransferir(0);
                      }}
                      className="select-transferencia"
                    >
                      <option value="">Selecciona un producto</option>
                      {productosConStock.map((producto) => (
                        <option key={producto.id} value={producto.id}>
                          {producto.producto.nombre} - Stock: {producto.cantidad}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="campo-transferencia">
                  <label>Sector destino:</label>
                  <select
                    value={sectorDestino}
                    onChange={(e) => setSectorDestino(parseInt(e.target.value) || '')}
                    className="select-transferencia"
                  >
                    <option value="">Selecciona un sector</option>
                    {sectoresActivos
                      .filter(s => s.id !== sectorSeleccionado?.id)
                      .map((sector) => (
                        <option key={sector.id} value={sector.id}>
                          {sector.nombre}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="campo-transferencia">
                  <label>Cantidad a transferir:</label>
                  <div className="input-cantidad-transferencia">
                    <input
                      type="text"
                      value={cantidadTransferirTexto}
                      onChange={(e) => {
                        const valor = e.target.value;
                        setCantidadTransferirTexto(valor);
                        // También actualizar el valor numérico si es un número simple
                        const numero = parseInt(valor);
                        if (!isNaN(numero) && !/[+\-*/x()]/.test(valor)) {
                          setCantidadTransferir(numero);
                        } else if (valor === '') {
                          setCantidadTransferir(0);
                        }
                      }}
                      className="input-transferencia"
                      placeholder="Ej: 336, 3*112, 3x60..."
                    />
                    <span className="stock-disponible-transferencia">
                      Máximo: {productoSeleccionado?.cantidad || 0}
                    </span>
                    
                    {/* Mostrar resultado del cálculo en tiempo real */}
                    {resultadoCalculoTransferir !== null && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#10b981',
                        marginTop: '0.25rem',
                        fontWeight: '600',
                        background: '#f0fdf4',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        border: '1px solid #bbf7d0'
                      }}>
                        ✅ Resultado: {resultadoCalculoTransferir.toLocaleString()} unidades
                      </div>
                    )}
                    
                    {errorCalculoTransferir && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#ef4444',
                        marginTop: '0.25rem',
                        fontWeight: '600',
                        background: '#fef2f2',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        border: '1px solid #fecaca'
                      }}>
                        ❌ {errorCalculoTransferir}
                      </div>
                    )}
                    
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      marginTop: '0.25rem',
                      lineHeight: '1.2'
                    }}>
                      💡 Puedes usar: +, -, *, /, x, paréntesis
                    </div>
                  </div>
                </div>

                {productoSeleccionado && sectorDestino && cantidadTransferirTexto.trim() && (
                  <div className="resumen-transferencia">
                    <h4>Resumen de Transferencia</h4>
                    <div className="detalles-transferencia">
                      <p><strong>Producto:</strong> {productoSeleccionado.producto.nombre}</p>
                      <p><strong>Desde:</strong> {sectorSeleccionado?.nombre}</p>
                      <p><strong>Hacia:</strong> {sectoresActivos.find(s => s.id === sectorDestino)?.nombre}</p>
                      <p><strong>Cantidad:</strong> {
                        resultadoCalculoTransferir 
                          ? `${cantidadTransferirTexto} = ${resultadoCalculoTransferir}` 
                          : cantidadTransferirTexto
                      }</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="botones-modal">
              <button
                onClick={cerrarModal}
                className="boton-cancelar"
              >
                Cancelar
              </button>
              <button
                onClick={realizarTransferencia}
                disabled={transferiendo || !productoSeleccionado || !sectorDestino || !cantidadTransferirTexto.trim()}
                className="boton-primario"
              >
                {transferiendo ? 'Transferiendo...' : 'Transferir Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar sector */}
      {mostrarModalConfirmarEliminar && (
        <div className="modal-overlay">
          <div className="modal-contenido modal-confirmacion">
            <div className="modal-header">
              <h3>🗑️ Confirmar Eliminación</h3>
            </div>
            <div className="modal-body">
              <p>
                ¿Estás seguro de que quieres eliminar el sector <strong>"{sectorAEliminar?.nombre}"</strong>?
              </p>
              <p className="advertencia">
                ⚠️ Esta acción no se puede deshacer. Se eliminarán todos los registros de stock asociados a este sector.
              </p>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => {
                  setMostrarModalConfirmarEliminar(false);
                  setSectorAEliminar(null);
                }}
                className="boton-cancelar"
                disabled={eliminandoSector}
              >
                Cancelar
              </button>
              <button
                onClick={eliminarSector}
                className="boton-eliminar"
                disabled={eliminandoSector}
              >
                {eliminandoSector ? '⏳ Eliminando...' : '🗑️ Eliminar Sector'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
