import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import NavbarAdmin from '../../components/NavbarAdmin';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useResponsive } from '../../hooks/useResponsive';
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
  const { isMobile } = useResponsive();
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
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [guardandoAsignaciones, setGuardandoAsignaciones] = useState(false);
  const [filtroBusquedaAsignacion, setFiltroBusquedaAsignacion] = useState('');
  const [filtroBusquedaProductos, setFiltroBusquedaProductos] = useState('');
  const [quitandoProducto, setQuitandoProducto] = useState(false);
  
  // Estados para transferencia de stock
  const [productosConStock, setProductosConStock] = useState<StockPorSector[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<StockPorSector | null>(null);
  const [sectorDestino, setSectorDestino] = useState<number | ''>('');
  const [cantidadTransferir, setCantidadTransferir] = useState<number>(0);
  const [transferiendo, setTransferiendo] = useState(false);
  
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

  const cargarSectores = async () => {
    try {
      setCargando(true);
      const response = await fetch(`/api/empresas/${datosUsuario?.empresaId}/sectores/todos`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSectores(data.data || []);
      } else {
        toast.error('Error al cargar sectores');
      }
    } catch (error) {
      console.error('Error al cargar sectores:', error);
      toast.error('Error al cargar sectores');
    } finally {
      setCargando(false);
    }
  };

  const cargarProductosEnSector = async (sectorId: number) => {
    try {
      const response = await fetch(`/api/empresas/${datosUsuario?.empresaId}/sectores/${sectorId}/productos`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
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
      const response = await fetch(`/api/empresas/${datosUsuario?.empresaId}/sectores`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
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

  const actualizarSector = async () => {
    if (!validarFormulario() || !sectorSeleccionado) return;
    
    try {
      setGuardando(true);
      const response = await fetch(`/api/empresas/${datosUsuario?.empresaId}/sectores/${sectorSeleccionado.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
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
      const response = await fetch(`/api/empresas/${datosUsuario?.empresaId}/sectores/${sectorId}/estado`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
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

  const migrarSectores = async () => {
    try {
      const response = await fetch(`/api/empresas/${datosUsuario?.empresaId}/sectores/migrar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
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

  // Funciones para asignación de productos
  const cargarProductosDisponibles = async () => {
    try {
      setCargandoProductos(true);
      
      // Cargar productos
      const productosResponse = await fetch(`/api/empresas/${datosUsuario?.empresaId}/productos`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!productosResponse.ok) {
        toast.error('Error al cargar productos');
        return;
      }
      
      const productosData = await productosResponse.json();
      const productos = productosData.data || [];
      
      // Cargar stock general para obtener información de asignaciones
      const stockResponse = await fetch(`/api/empresas/${datosUsuario?.empresaId}/sectores/stock-general`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      let stockAsignadoPorProducto: { [key: number]: number } = {};
      
      if (stockResponse.ok) {
        const stockData = await stockResponse.json();
        const stockGeneral = stockData.data || [];
        
        // Calcular stock asignado por producto
        stockGeneral.forEach((item: any) => {
          if (item.tipo === 'con_sector') {
            const productoId = item.producto.id;
            stockAsignadoPorProducto[productoId] = (stockAsignadoPorProducto[productoId] || 0) + item.cantidad;
          }
        });
      }
      
      // Filtrar solo productos activos con stock disponible
      const productosDisponibles = productos
        .filter((producto: any) => producto.activo && producto.stock > 0)
        .map((producto: any) => {
          const stockAsignado = stockAsignadoPorProducto[producto.id] || 0;
          const stockDisponible = Math.max(0, producto.stock - stockAsignado);
          
          return {
            id: producto.id,
            nombre: producto.nombre,
            codigoPersonalizado: producto.codigoPersonalizado,
            stockTotal: producto.stock,
            stockAsignado: stockAsignado,
            stockDisponible: stockDisponible,
            unidadMedida: producto.unidad
          };
        })
        .filter((producto: any) => producto.stockDisponible > 0); // Solo productos con stock disponible
        
      setProductosDisponibles(productosDisponibles);
    } catch (error) {
      console.error('Error al cargar productos disponibles:', error);
      toast.error('Error al cargar productos disponibles');
    } finally {
      setCargandoProductos(false);
    }
  };

  const abrirModalAsignar = async (sector: Sector) => {
    setSectorSeleccionado(sector);
    await cargarProductosDisponibles();
    setAsignaciones([]);
    setMostrarModalAsignar(true);
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
      
      const response = await fetch(`/api/empresas/${datosUsuario?.empresaId}/sectores/${sectorSeleccionado?.id}/asignar-productos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.mensaje || 'Productos asignados exitosamente');
        setMostrarModalAsignar(false);
        setSectorSeleccionado(null);
        setAsignaciones([]);
        cargarSectores();
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
      setQuitandoProducto(true);
      
      const response = await fetch(`/api/empresas/${datosUsuario?.empresaId}/sectores/${sectorSeleccionado.id}/quitar-producto/${stockId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        toast.success(`Producto "${nombreProducto}" quitado exitosamente del sector`);
        // Recargar los productos del sector
        await cargarProductosEnSector(sectorSeleccionado.id);
      } else {
        const errorData = await response.json();
        toast.error(errorData.mensaje || 'Error al quitar el producto del sector');
      }
    } catch (error) {
      console.error('Error al quitar producto del sector:', error);
      toast.error('Error al quitar el producto del sector');
    } finally {
      setQuitandoProducto(false);
    }
  };

  const abrirModalDetalle = async (sector: Sector) => {
    setSectorSeleccionado(sector);
    await cargarProductosEnSector(sector.id);
    setMostrarModalDetalle(true);
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

  const abrirModalTransferir = async (sector: Sector) => {
    setSectorSeleccionado(sector);
    setProductoSeleccionado(null);
    setSectorDestino('');
    setCantidadTransferir(0);
    setMostrarModalTransferir(true);
    
    // Cargar productos del sector
    try {
      const response = await fetch(`/api/empresas/${datosUsuario?.empresaId}/sectores/${sector.id}/productos`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProductosConStock(data.data || []);
      } else {
        console.error('Error al cargar productos del sector');
        setProductosConStock([]);
      }
    } catch (error) {
      console.error('Error al cargar productos del sector:', error);
      setProductosConStock([]);
    }
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
    setQuitandoProducto(false);
    setProductosConStock([]);
    setProductoSeleccionado(null);
    setSectorDestino('');
    setCantidadTransferir(0);
    limpiarFormulario();
  };

  const realizarTransferencia = async () => {
    if (!productoSeleccionado || !sectorDestino || cantidadTransferir <= 0) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (cantidadTransferir > productoSeleccionado.cantidad) {
      toast.error('La cantidad a transferir no puede ser mayor al stock disponible');
      return;
    }

    try {
      setTransferiendo(true);
      
      const response = await fetch(`/api/empresas/${datosUsuario?.empresaId}/sectores/transferir-stock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productoId: productoSeleccionado.producto.id,
          sectorOrigenId: sectorSeleccionado?.id,
          sectorDestinoId: sectorDestino,
          cantidad: cantidadTransferir
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.mensaje || 'Stock transferido exitosamente');
        cerrarModal();
        cargarSectores();
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
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    ];
    return colores[index % colores.length];
  };

  // Filtrar sectores activos e inactivos
  const sectoresActivos = sectores.filter(s => s.activo);
  const sectoresInactivos = sectores.filter(s => !s.activo);

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
            onClick={migrarSectores}
            className="boton-migrar"
          >
            <span className="icono-boton">🔄</span>
            Migrar Sectores Existentes
          </button>
          <button
            onClick={() => setMostrarModalCrear(true)}
            className="boton-crear"
          >
            <span className="icono-boton">➕</span>
            Crear Nuevo Sector
          </button>
                  <button
          onClick={() => navigate('/admin/stock-general')}
          className="boton-stock-general"
        >
          <span className="icono-boton">📊</span>
          Ver Stock General
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
                      className="tarjeta-sector"
                      onClick={() => abrirModalDetalle(sector)}
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
                          
                          <div className="info-item">
                            <span className="icono-info">📅</span>
                            <span className="texto-info">
                              Creado: {new Date(sector.fechaCreacion).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="botones-accion-sector">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirModalAsignar(sector);
                            }}
                            className="boton-accion boton-asignar"
                            title="Asignar productos"
                          >
                            ➕
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirModalProductos(sector);
                            }}
                            className="boton-accion boton-productos"
                            title="Ver productos"
                          >
                            📦
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirModalTransferir(sector);
                            }}
                            className="boton-accion boton-transferir"
                            title="Transferir stock"
                          >
                            🔄
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
                      className="tarjeta-sector tarjeta-inactiva"
                      onClick={() => abrirModalDetalle(sector)}
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
                          
                          <div className="info-item">
                            <span className="icono-info">📅</span>
                            <span className="texto-info">
                              Creado: {new Date(sector.fechaCreacion).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Botones de acción para sectores inactivos */}
                        <div className="botones-accion-sector">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirModalProductos(sector);
                            }}
                            className="boton-accion boton-productos"
                            title="Ver productos"
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
                <div className="tabla-productos">
                  <table>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Código</th>
                        <th>Cantidad</th>
                        <th>Última Actualización</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosFiltrados.map((stock) => (
                        <tr key={stock.id}>
                          <td>
                            <div className="nombre-producto-tabla">
                              {stock.producto.nombre}
                            </div>
                          </td>
                          <td className="codigo-producto-tabla">
                            {stock.producto.codigoPersonalizado || '-'}
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
                            <button
                              onClick={() => quitarProductoDelSector(stock.id, stock.producto.nombre)}
                              className="boton-quitar-producto"
                              title="Quitar producto del sector"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
            
            {cargandoProductos ? (
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
                                  Stock total: {producto.stockTotal} {producto.unidadMedida || 'unidades'}
                                </span>
                                <span className="stock-disponible">
                                  Disponible: {producto.stockDisponible} {producto.unidadMedida || 'unidades'}
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
                              <span className="unidad-asignacion">
                                {producto.unidadMedida || 'unidades'}
                              </span>
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
                
                <div className="campo-transferencia">
                  <label>Producto a transferir:</label>
                  <select
                    value={productoSeleccionado?.id || ''}
                    onChange={(e) => {
                      const productoId = parseInt(e.target.value);
                      const producto = productosConStock.find(p => p.id === productoId);
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
                      type="number"
                      min="1"
                      max={productoSeleccionado?.cantidad || 0}
                      value={cantidadTransferir || ''}
                      onChange={(e) => setCantidadTransferir(parseInt(e.target.value) || 0)}
                      className="input-transferencia"
                      placeholder="0"
                    />
                    <span className="stock-disponible-transferencia">
                      Máximo: {productoSeleccionado?.cantidad || 0}
                    </span>
                  </div>
                </div>

                {productoSeleccionado && sectorDestino && cantidadTransferir > 0 && (
                  <div className="resumen-transferencia">
                    <h4>Resumen de Transferencia</h4>
                    <div className="detalles-transferencia">
                      <p><strong>Producto:</strong> {productoSeleccionado.producto.nombre}</p>
                      <p><strong>Desde:</strong> {sectorSeleccionado?.nombre}</p>
                      <p><strong>Hacia:</strong> {sectoresActivos.find(s => s.id === sectorDestino)?.nombre}</p>
                      <p><strong>Cantidad:</strong> {cantidadTransferir}</p>
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
                disabled={transferiendo || !productoSeleccionado || !sectorDestino || cantidadTransferir <= 0}
                className="boton-primario"
              >
                {transferiendo ? 'Transferiendo...' : 'Transferir Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
