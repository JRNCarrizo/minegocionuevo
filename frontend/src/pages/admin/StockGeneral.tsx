import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
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
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
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
    
    // Obtener el token correcto del usuario actual
    const token = localStorage.getItem('token');
    console.log('🔍 STOCK GENERAL - Token obtenido:', token ? 'Presente' : 'Ausente');
    console.log('🔍 STOCK GENERAL - URL completa:', url);
    
    const defaultOptions: RequestInit = {
      headers: {
        'Authorization': `Bearer ${token}`,
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
      
      <div className="stock-container" style={{
        padding: isMobile ? '4rem 0.5rem 0.5rem 0.5rem' : '0.25rem 1rem'
      }}>
        {/* Header */}
        <div className="stock-header" style={{
          marginBottom: isMobile ? '1.5rem' : '1rem'
        }}>
          <div className="header-content">
            <div className="header-icon" style={{
              width: isMobile ? '60px' : '80px',
              height: isMobile ? '60px' : '80px',
              fontSize: isMobile ? '2rem' : '3rem'
            }}>📊</div>
            <h1 className="header-title" style={{
              fontSize: isMobile ? '1.75rem' : '2rem'
            }}>Stock General</h1>
            <p className="header-description" style={{
              fontSize: isMobile ? '0.9rem' : '1rem'
            }}>
              Vista completa del inventario de tu empresa con búsqueda avanzada
            </p>
          </div>
        </div>



        {/* Estadísticas */}
        <div className="stats-grid" style={{
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '0.75rem' : '1rem',
          marginBottom: isMobile ? '1.5rem' : '2rem'
        }}>
          <div className="stat-card" style={{
            padding: isMobile ? '1rem' : '1.5rem',
            flexDirection: isMobile ? 'column' : 'row',
            textAlign: isMobile ? 'center' : 'left',
            gap: isMobile ? '0.5rem' : '1rem'
          }}>
            <div className="stat-icon" style={{
              width: isMobile ? '40px' : '50px',
              height: isMobile ? '40px' : '50px',
              fontSize: isMobile ? '1.25rem' : '1.5rem'
            }}>📦</div>
            <div className="stat-content">
              <div className="stat-number" style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem'
              }}>{estadisticas.totalProductos}</div>
              <div className="stat-label" style={{
                fontSize: isMobile ? '0.8rem' : '0.9rem'
              }}>Total Productos</div>
            </div>
          </div>
          <div className="stat-card" style={{
            padding: isMobile ? '1rem' : '1.5rem',
            flexDirection: isMobile ? 'column' : 'row',
            textAlign: isMobile ? 'center' : 'left',
            gap: isMobile ? '0.5rem' : '1rem'
          }}>
            <div className="stat-icon" style={{
              width: isMobile ? '40px' : '50px',
              height: isMobile ? '40px' : '50px',
              fontSize: isMobile ? '1.25rem' : '1.5rem'
            }}>🏢</div>
            <div className="stat-content">
              <div className="stat-number" style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem'
              }}>{estadisticas.productosConSector}</div>
              <div className="stat-label" style={{
                fontSize: isMobile ? '0.8rem' : '0.9rem'
              }}>Con sector</div>
            </div>
          </div>
          <div className="stat-card" style={{
            padding: isMobile ? '1rem' : '1.5rem',
            flexDirection: isMobile ? 'column' : 'row',
            textAlign: isMobile ? 'center' : 'left',
            gap: isMobile ? '0.5rem' : '1rem'
          }}>
            <div className="stat-icon" style={{
              width: isMobile ? '40px' : '50px',
              height: isMobile ? '40px' : '50px',
              fontSize: isMobile ? '1.25rem' : '1.5rem'
            }}>⚠️</div>
            <div className="stat-content">
              <div className="stat-number" style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem'
              }}>{estadisticas.productosSinSector}</div>
              <div className="stat-label" style={{
                fontSize: isMobile ? '0.8rem' : '0.9rem'
              }}>Sin sector</div>
            </div>
          </div>
          <div className="stat-card" style={{
            padding: isMobile ? '1rem' : '1.5rem',
            flexDirection: isMobile ? 'column' : 'row',
            textAlign: isMobile ? 'center' : 'left',
            gap: isMobile ? '0.5rem' : '1rem'
          }}>
            <div className="stat-icon" style={{
              width: isMobile ? '40px' : '50px',
              height: isMobile ? '40px' : '50px',
              fontSize: isMobile ? '1.25rem' : '1.5rem'
            }}>🔢</div>
            <div className="stat-content">
              <div className="stat-number" style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem'
              }}>{estadisticas.totalUnidades}</div>
              <div className="stat-label" style={{
                fontSize: isMobile ? '0.8rem' : '0.9rem'
              }}>Total Unidades</div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="filters-section" style={{
          padding: isMobile ? '1rem' : '1.5rem',
          marginBottom: isMobile ? '1rem' : '1.5rem'
        }}>
          <div className="filters-container" style={{
            gridTemplateColumns: isMobile ? '1fr' : '1fr auto',
            gap: isMobile ? '1rem' : '1rem'
          }}>
            <div className="search-group">
              <div className="search-input-wrapper">
                <span className="search-icon" style={{
                  left: isMobile ? '0.75rem' : '1rem',
                  fontSize: isMobile ? '1rem' : '1.1rem'
                }}>🔍</span>
                <input
                  type="text"
                  placeholder="Buscar por nombre o código..."
                  value={filtroBusqueda}
                  onChange={(e) => setFiltroBusqueda(e.target.value)}
                  className="search-input"
                  ref={(el) => setInputBusquedaRef(el)}
                  style={{
                    padding: isMobile ? '0.75rem 1rem 0.75rem 2.5rem' : '1rem 1.5rem 1rem 3rem',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    minHeight: isMobile ? '44px' : '48px'
                  }}
                />
              </div>
            </div>
            
            <div className="filter-group">
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as any)}
                className="filter-select"
                style={{
                  padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  minHeight: isMobile ? '44px' : '48px'
                }}
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
        <div className="table-section" style={{
          padding: isMobile ? '0.75rem' : '1rem'
        }}>
          <div className="table-header" style={{
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '1rem' : '0',
            alignItems: isMobile ? 'stretch' : 'center'
          }}>
            <h3 style={{
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              textAlign: isMobile ? 'center' : 'left'
            }}>Productos ({datosOrdenados.length})</h3>
          </div>

          {datosOrdenados.length === 0 ? (
            <div className="empty-message">
              <div className="empty-icon">📭</div>
              <h4>No se encontraron productos</h4>
              <p>Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <div className="table-wrapper" style={{
              maxHeight: isMobile ? '60vh' : '70vh',
              overflowX: 'auto',
              overflowY: 'auto'
            }}>
              <table className="stock-table" style={{
                minWidth: isMobile ? '600px' : '100%'
              }}>
                <thead>
                  <tr>
                    <th onClick={() => cambiarOrden('codigo')} className="sortable-header" style={{
                      padding: isMobile ? '0.75rem 0.5rem' : '1.25rem 1rem',
                      fontSize: isMobile ? '0.8rem' : '0.95rem'
                    }}>
                      Código {ordenarPor === 'codigo' && (ordenAscendente ? '↑' : '↓')}
                    </th>
                    <th onClick={() => cambiarOrden('nombre')} className="sortable-header" style={{
                      padding: isMobile ? '0.75rem 0.5rem' : '1.25rem 1rem',
                      fontSize: isMobile ? '0.8rem' : '0.95rem'
                    }}>
                      Producto {ordenarPor === 'nombre' && (ordenAscendente ? '↑' : '↓')}
                    </th>
                    <th onClick={() => cambiarOrden('sector')} className="sortable-header" style={{
                      padding: isMobile ? '0.75rem 0.5rem' : '1.25rem 1rem',
                      fontSize: isMobile ? '0.8rem' : '0.95rem'
                    }}>
                      Sector {ordenarPor === 'sector' && (ordenAscendente ? '↑' : '↓')}
                    </th>
                    <th onClick={() => cambiarOrden('cantidad')} className="sortable-header" style={{
                      padding: isMobile ? '0.75rem 0.5rem' : '1.25rem 1rem',
                      fontSize: isMobile ? '0.8rem' : '0.95rem'
                    }}>
                      Cantidad {ordenarPor === 'cantidad' && (ordenAscendente ? '↑' : '↓')}
                    </th>
                    <th style={{
                      padding: isMobile ? '0.75rem 0.5rem' : '1.25rem 1rem',
                      fontSize: isMobile ? '0.8rem' : '0.95rem'
                    }}>Última Actualización</th>
                  </tr>
                </thead>
                <tbody>
                  {datosOrdenados.map((item, index) => (
                    <tr 
                      key={item.id} 
                      className={`table-row ${filaSeleccionada === index ? 'fila-seleccionada' : ''}`}
                      style={{
                        padding: isMobile ? '0.5rem 0.25rem' : '1.25rem 1rem'
                      }}
                    >
                      <td className="code-cell" style={{
                        padding: isMobile ? '0.5rem 0.25rem' : '1.25rem 1rem',
                        fontSize: isMobile ? '0.8rem' : '0.9rem'
                      }}>{item.producto.codigoPersonalizado || 'Sin código'}</td>
                      <td className="name-cell" style={{
                        padding: isMobile ? '0.5rem 0.25rem' : '1.25rem 1rem',
                        fontSize: isMobile ? '0.8rem' : '0.9rem'
                      }}>
                        <div className="product-name-container">
                          <span className="product-name">{item.producto.nombre}</span>
                        </div>
                      </td>
                      <td className="sector-cell" style={{
                        padding: isMobile ? '0.5rem 0.25rem' : '1.25rem 1rem',
                        fontSize: isMobile ? '0.8rem' : '0.9rem',
                        minWidth: isMobile ? '120px' : '150px',
                        maxWidth: isMobile ? '200px' : '300px',
                        overflow: 'auto',
                        whiteSpace: 'nowrap'
                      }}>
                        <div className="sector-cell-content" style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          width: '100%'
                        }}>
                          {filtroTipo === 'sin_sectorizar' ? (
                            <span className="consolidated-badge">Consolidado</span>
                          ) : item.sector ? (
                            <span 
                              className="sector-badge sector-badge-full" 
                              title={item.sector.nombre}
                              style={{
                                maxWidth: 'none',
                                whiteSpace: 'nowrap',
                                overflow: 'visible',
                                textOverflow: 'clip',
                                display: 'inline-block'
                              }}
                            >
                              {item.sector.nombre}
                            </span>
                          ) : (
                            <span className="no-sector-badge">Sin sector</span>
                          )}
                        </div>
                      </td>
                      <td className="quantity-cell" style={{
                        padding: isMobile ? '0.5rem 0.25rem' : '1.25rem 1rem',
                        fontSize: isMobile ? '0.8rem' : '0.9rem'
                      }}>
                        <span className="quantity-number">{item.cantidad}</span>
                        <span className="quantity-unit">{item.producto.unidadMedida || 'unidades'}</span>
                      </td>
                      <td className="date-cell" style={{
                        padding: isMobile ? '0.5rem 0.25rem' : '1.25rem 1rem',
                        fontSize: isMobile ? '0.8rem' : '0.9rem'
                      }}>
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
