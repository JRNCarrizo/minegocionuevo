import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useUsuario } from '../../contexts/UsuarioContext';
import { useResponsive } from '../../hooks/useResponsive';
import NavbarAdmin from '../../components/NavbarAdmin';
import { API_CONFIG } from '../../config/api';
import './StockGeneral.css';

interface StockItem {
  id: number;
  producto: {
    id: number;
    nombre: string;
    codigoPersonalizado?: string;
    unidadMedida?: string;
  };
  sector?: {
    id: number;
    nombre: string;
  };
  cantidad: number;
  fechaActualizacion: string;
  tipo: 'con_sector' | 'sin_sector';
}

export default function StockGeneral() {
  const { datosUsuario, cerrarSesion } = useUsuario();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'con_sector' | 'sin_sector' | 'sin_sectorizar'>('todos');
  const [ordenarPor, setOrdenarPor] = useState<'nombre' | 'codigo' | 'cantidad' | 'sector'>('nombre');
  const [ordenAscendente, setOrdenAscendente] = useState(true);
  
  // Estados para navegación por teclado
  const [filaSeleccionada, setFilaSeleccionada] = useState(-1);
  const [inputBusquedaRef, setInputBusquedaRef] = useState<HTMLInputElement | null>(null);

  // Función para consolidar productos
  const consolidarProductos = (items: StockItem[]): StockItem[] => {
    const productosConsolidados = new Map<number, StockItem>();
    
    items.forEach(item => {
      const productoId = item.producto.id;
      
      if (productosConsolidados.has(productoId)) {
        // Sumar cantidad al producto existente
        const existente = productosConsolidados.get(productoId)!;
        existente.cantidad += item.cantidad;
        
        // Actualizar la fecha de actualización a la más reciente
        const fechaExistente = new Date(existente.fechaActualizacion);
        const fechaNueva = new Date(item.fechaActualizacion);
        if (fechaNueva > fechaExistente) {
          existente.fechaActualizacion = item.fechaActualizacion;
        }
      } else {
        // Crear nuevo producto consolidado
        productosConsolidados.set(productoId, {
          ...item,
          cantidad: item.cantidad,
          sector: undefined, // Sin sector en vista consolidada
          tipo: 'sin_sector' as const
        });
      }
    });
    
    // Log de consolidación solo cuando hay muchos productos
    if (items.length > 10) {
      console.log('🔍 CONSOLIDACIÓN - De', items.length, 'a', productosConsolidados.size, 'productos');
    }
    
    return Array.from(productosConsolidados.values());
  };

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
    
    return fetch(url, defaultOptions);
  };

  // Filtrar y ordenar datos
  const datosFiltrados = stockData.filter(item => {
    const cumpleBusqueda = filtroBusqueda === '' || 
      item.producto.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
      (item.producto.codigoPersonalizado && item.producto.codigoPersonalizado.toLowerCase().includes(filtroBusqueda.toLowerCase()));
    
    let cumpleTipo = true;
    if (filtroTipo === 'con_sector') {
      cumpleTipo = item.tipo === 'con_sector';
    } else if (filtroTipo === 'sin_sector') {
      cumpleTipo = item.tipo === 'sin_sector';
    } else if (filtroTipo === 'sin_sectorizar') {
      // Para "sin sectorizar" incluimos TODOS los productos (con y sin sector)
      cumpleTipo = true;
    }
    
    return cumpleBusqueda && cumpleTipo;
  });

  // Logs de debugging solo cuando hay cambios significativos
  if (stockData.length > 0) {
    console.log('🔍 FILTRADO - Datos originales:', stockData.length, 'Filtrados:', datosFiltrados.length);
  }
  
  // Consolidar productos cuando se selecciona "sin_sectorizar"
  const datosConsolidados = filtroTipo === 'sin_sectorizar' 
    ? consolidarProductos(datosFiltrados)
    : datosFiltrados;

  const datosOrdenados = datosConsolidados.sort((a, b) => {
    let valorA: any, valorB: any;
    
    switch (ordenarPor) {
      case 'nombre':
        valorA = a.producto.nombre.toLowerCase();
        valorB = b.producto.nombre.toLowerCase();
        break;
      case 'codigo':
        valorA = a.producto.codigoPersonalizado || '';
        valorB = b.producto.codigoPersonalizado || '';
        break;
      case 'cantidad':
        valorA = a.cantidad;
        valorB = b.cantidad;
        break;
      case 'sector':
        valorA = a.sector?.nombre || '';
        valorB = b.sector?.nombre || '';
        break;
      default:
        valorA = a.producto.nombre.toLowerCase();
        valorB = b.producto.nombre.toLowerCase();
    }
    
    if (ordenAscendente) {
      return valorA > valorB ? 1 : -1;
    } else {
      return valorA < valorB ? 1 : -1;
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    if (datosUsuario?.empresaId) {
      cargarStockGeneral();
    }
  }, [navigate, datosUsuario?.empresaId]);

  // Manejo de teclas para navegación
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log('🔍 KEYDOWN - Tecla presionada:', event.key);
      console.log('🔍 KEYDOWN - Fila seleccionada actual:', filaSeleccionada);
      console.log('🔍 KEYDOWN - Total de datos:', datosOrdenados.length);
      
      // Enter: Enfocar buscador y hacer scroll
      if (event.key === 'Enter' && !filtroBusqueda.trim()) {
        console.log('🔍 KEYDOWN - Ejecutando Enter');
        event.preventDefault();
        event.stopPropagation();
        if (inputBusquedaRef) {
          inputBusquedaRef.focus();
          // Scroll suave hacia el buscador después de un pequeño delay
          setTimeout(() => {
            // Calcular la posición del buscador y la altura del navbar
            const navbar = document.querySelector('.navbar-admin');
            const navbarHeight = navbar ? navbar.offsetHeight : 80; // altura por defecto si no encuentra el navbar
            
            // Obtener la posición del buscador
            const buscadorRect = inputBusquedaRef.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const buscadorTop = buscadorRect.top + scrollTop;
            
            // Scroll para posicionar el buscador justo debajo del navbar
            window.scrollTo({
              top: buscadorTop - navbarHeight - 20, // 20px de margen adicional
              behavior: 'smooth'
            });
          }, 100);
        }
        return;
      }

      // Navegación con flechas en la tabla
      if (datosOrdenados.length > 0 && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        console.log('🔍 KEYDOWN - Ejecutando navegación con flechas');
        console.log('🔍 KEYDOWN - Fila seleccionada actual:', filaSeleccionada);
        console.log('🔍 KEYDOWN - Total de datos:', datosOrdenados.length);
        event.preventDefault();
        event.stopPropagation();
        
        let newIndex = filaSeleccionada;
        
        if (event.key === 'ArrowDown') {
          // Si no hay fila seleccionada, empezar en la primera
          if (filaSeleccionada === -1) {
            newIndex = 0;
            console.log('🔍 KEYDOWN - Primera vez, seleccionando índice 0');
          } else {
            newIndex = filaSeleccionada < datosOrdenados.length - 1 ? filaSeleccionada + 1 : 0;
            console.log('🔍 KEYDOWN - Navegando hacia abajo desde índice', filaSeleccionada, 'a', newIndex);
          }
        } else if (event.key === 'ArrowUp') {
          // Si no hay fila seleccionada, empezar en la última
          if (filaSeleccionada === -1) {
            newIndex = datosOrdenados.length - 1;
            console.log('🔍 KEYDOWN - Primera vez, seleccionando último índice:', newIndex);
          } else if (filaSeleccionada === 0) {
            // Si estamos en el primer registro, volver al buscador
            console.log('🔍 KEYDOWN - En primer registro, volviendo al buscador');
            setFilaSeleccionada(-1); // Deseleccionar fila
            if (inputBusquedaRef) {
              inputBusquedaRef.focus();
              // Scroll suave hacia el buscador
              setTimeout(() => {
                const navbar = document.querySelector('.navbar-admin');
                const navbarHeight = navbar ? navbar.offsetHeight : 80;
                const buscadorRect = inputBusquedaRef.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const buscadorTop = buscadorRect.top + scrollTop;
                window.scrollTo({
                  top: buscadorTop - navbarHeight - 20,
                  behavior: 'smooth'
                });
              }, 100);
            }
            return; // Salir sin continuar con la navegación
          } else {
            newIndex = filaSeleccionada - 1;
            console.log('🔍 KEYDOWN - Navegando hacia arriba desde índice', filaSeleccionada, 'a', newIndex);
          }
        }
        
        console.log('🔍 KEYDOWN - Nueva fila seleccionada:', newIndex);
        setFilaSeleccionada(newIndex);
        
        // Scroll a la fila seleccionada
        setTimeout(() => {
          const tableRows = document.querySelectorAll('.stock-table tbody tr');
          console.log('🔍 KEYDOWN - Filas encontradas:', tableRows.length);
          if (tableRows[newIndex]) {
            // Calcular la posición considerando el navbar
            const navbar = document.querySelector('.navbar-admin');
            const navbarHeight = navbar ? navbar.offsetHeight : 80;
            
            const rowRect = tableRows[newIndex].getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const rowTop = rowRect.top + scrollTop;
            
            // Scroll para posicionar la fila justo debajo del navbar
            window.scrollTo({
              top: rowTop - navbarHeight - 20, // 20px de margen adicional
              behavior: 'smooth'
            });
          }
        }, 100);
        return;
      }

      // Esc: Volver a la sección de sectores
      if (event.key === 'Escape') {
        console.log('🔍 KEYDOWN - Ejecutando Escape');
        const activeElement = document.activeElement;
        const isInput = activeElement?.tagName === 'INPUT' || 
                       activeElement?.tagName === 'TEXTAREA' || 
                       activeElement?.tagName === 'SELECT';
        
        if (isInput) {
          // Si estás en un input, quitar el foco
          event.preventDefault();
          event.stopPropagation();
          (activeElement as HTMLElement)?.blur();
        } else {
          // Si no estás en un input, volver a gestión de sectores
          event.preventDefault();
          event.stopPropagation();
          navigate('/admin/sectores');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true); // Usar capture phase
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [navigate, filtroBusqueda, inputBusquedaRef, filaSeleccionada, datosOrdenados.length]);

  // Resetear selección cuando cambian los datos
  useEffect(() => {
    setFilaSeleccionada(-1);
  }, [datosOrdenados.length]);

  const cargarStockGeneral = async () => {
    try {
      setCargando(true);
      console.log('🔍 STOCK GENERAL - Iniciando carga...');
      console.log('🔍 STOCK GENERAL - Empresa ID:', datosUsuario?.empresaId);
      
      const response = await apiCall(`/empresas/${datosUsuario?.empresaId}/sectores/stock-general`);
      
      console.log('🔍 STOCK GENERAL - Response status:', response.status);
      console.log('🔍 STOCK GENERAL - Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 STOCK GENERAL - Datos recibidos:', data);
        setStockData(data.data || []);
        console.log('🔍 STOCK GENERAL - Stock data establecido:', data.data?.length || 0, 'items');
      } else if (response.status === 403) {
        console.error('🔍 STOCK GENERAL - Error 403: No autorizado');
        toast.error('Error de autenticación. Por favor, inicia sesión nuevamente.');
        navigate('/admin/login');
      } else {
        const errorText = await response.text();
        console.error('🔍 STOCK GENERAL - Error response:', errorText);
        toast.error('Error al cargar el stock general');
      }
    } catch (error) {
      console.error('🔍 STOCK GENERAL - Error general:', error);
      toast.error('Error al cargar el stock general');
    } finally {
      setCargando(false);
    }
  };

  const cambiarOrden = (campo: 'nombre' | 'codigo' | 'cantidad' | 'sector') => {
    if (ordenarPor === campo) {
      setOrdenAscendente(!ordenAscendente);
    } else {
      setOrdenarPor(campo);
      setOrdenAscendente(true);
    }
  };

  const obtenerEstadisticas = () => {
    const totalProductos = stockData.length;
    const productosConSector = stockData.filter(item => item.tipo === 'con_sector').length;
    const productosSinSector = stockData.filter(item => item.tipo === 'sin_sector').length;
    const totalUnidades = stockData.reduce((sum, item) => sum + item.cantidad, 0);
    
    return { totalProductos, productosConSector, productosSinSector, totalUnidades };
  };

  const estadisticas = obtenerEstadisticas();

  if (!datosUsuario) {
    return (
      <div className="stock-page">
        <div className="stock-container">
          <div className="loading-card">
            <div className="spinner"></div>
            <p>Cargando datos de usuario...</p>
          </div>
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="stock-page">
        <div className="stock-container">
          <div className="loading-card">
            <div className="spinner"></div>
            <p>Cargando stock general...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stock-page">
      <NavbarAdmin onCerrarSesion={cerrarSesion} />
      
      <div className="stock-container">
        {/* Header */}
        <div className="stock-header">
          <div className="header-content">
            <div className="header-icon">📊</div>
            <h1 className="header-title">Stock General</h1>
            <p className="header-description">
              Vista completa del inventario de tu empresa con búsqueda avanzada
            </p>
          </div>
        </div>



        {/* Estadísticas */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <div className="stat-number">{estadisticas.totalProductos}</div>
              <div className="stat-label">Total Productos</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏢</div>
            <div className="stat-content">
              <div className="stat-number">{estadisticas.productosConSector}</div>
              <div className="stat-label">Con sector</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <div className="stat-number">{estadisticas.productosSinSector}</div>
              <div className="stat-label">Sin sector</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔢</div>
            <div className="stat-content">
              <div className="stat-number">{estadisticas.totalUnidades}</div>
              <div className="stat-label">Total Unidades</div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="filters-section">
          <div className="filters-container">
            <div className="search-group">
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar por nombre o código..."
                  value={filtroBusqueda}
                  onChange={(e) => setFiltroBusqueda(e.target.value)}
                  className="search-input"
                  ref={(el) => setInputBusquedaRef(el)}
                />
              </div>
            </div>
            
            <div className="filter-group">
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as any)}
                className="filter-select"
              >
                <option value="todos">Todos los productos</option>
                <option value="con_sector">Con sector asignado</option>
                <option value="sin_sector">Sin sector asignado</option>
                <option value="sin_sectorizar">Sin sectorizar (consolidado)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="table-section">
          <div className="table-header">
            <h3>Productos ({datosOrdenados.length})</h3>
          </div>

          {datosOrdenados.length === 0 ? (
            <div className="empty-message">
              <div className="empty-icon">📭</div>
              <h4>No se encontraron productos</h4>
              <p>Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th onClick={() => cambiarOrden('codigo')} className="sortable-header">
                      Código {ordenarPor === 'codigo' && (ordenAscendente ? '↑' : '↓')}
                    </th>
                    <th onClick={() => cambiarOrden('nombre')} className="sortable-header">
                      Producto {ordenarPor === 'nombre' && (ordenAscendente ? '↑' : '↓')}
                    </th>
                    <th onClick={() => cambiarOrden('sector')} className="sortable-header">
                      Sector {ordenarPor === 'sector' && (ordenAscendente ? '↑' : '↓')}
                    </th>
                    <th onClick={() => cambiarOrden('cantidad')} className="sortable-header">
                      Cantidad {ordenarPor === 'cantidad' && (ordenAscendente ? '↑' : '↓')}
                    </th>
                    <th>Última Actualización</th>
                  </tr>
                </thead>
                <tbody>
                  {datosOrdenados.map((item, index) => (
                    <tr 
                      key={item.id} 
                      className={`table-row ${filaSeleccionada === index ? 'fila-seleccionada' : ''}`}
                    >
                      <td className="code-cell">{item.producto.codigoPersonalizado || 'Sin código'}</td>
                      <td className="name-cell">
                        <div className="product-name-container">
                          <span className="product-name">{item.producto.nombre}</span>
                        </div>
                      </td>
                      <td className="sector-cell">
                        {filtroTipo === 'sin_sectorizar' ? (
                          <span className="consolidated-badge">Consolidado</span>
                        ) : item.sector ? (
                          <span className="sector-badge">{item.sector.nombre}</span>
                        ) : (
                          <span className="no-sector-badge">Sin sector</span>
                        )}
                      </td>
                      <td className="quantity-cell">
                        <span className="quantity-number">{item.cantidad}</span>
                        <span className="quantity-unit">{item.producto.unidadMedida || 'unidades'}</span>
                      </td>
                      <td className="date-cell">
                        {new Date(item.fechaActualizacion).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
