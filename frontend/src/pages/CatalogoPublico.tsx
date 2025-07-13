import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSubdominio } from '../hooks/useSubdominio';
import { useCart } from '../hooks/useCart';
import CartIcon from '../components/CartIcon';
import CartModal from '../components/CartModal';
import ProductoDetalleModal from '../components/ProductoDetalleModal';
import NavbarCliente from '../components/NavbarCliente';
import apiService from '../services/api';
import type { Producto } from '../types';
import toast from 'react-hot-toast';
import { FaInstagram, FaFacebook, FaShoppingCart } from 'react-icons/fa';

export default function CatalogoPublico() {
  const { empresa, subdominio, cargando: cargandoEmpresa } = useSubdominio();
  const { addToCart, items, updateQuantity } = useCart();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [filtroMarca, setFiltroMarca] = useState<string>('');
  const [categorias, setCategorias] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [clienteInfo, setClienteInfo] = useState<{ nombre: string; email: string } | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [vistaCuadricula, setVistaCuadricula] = useState(true);
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<number | null>(null);

  // Verificar si hay un cliente logueado
  useEffect(() => {
    const token = localStorage.getItem('clienteToken');
    const cliente = localStorage.getItem('clienteInfo');
    
    if (token && cliente) {
      try {
        setClienteInfo(JSON.parse(cliente));
      } catch (error) {
        console.error('Error al parsear clienteInfo:', error);
        localStorage.removeItem('clienteToken');
        localStorage.removeItem('clienteInfo');
      }
    }
  }, []);

  const cargarProductos = useCallback(async () => {
    if (!subdominio) {
      console.log('No hay subdominio disponible');
      return;
    }
    
    try {
      setCargando(true);
      setError(null);

      console.log('Cargando productos para subdominio:', subdominio);
      console.log('Filtros:', { categoria: filtroCategoria, marca: filtroMarca });

      const response = await apiService.obtenerProductosPublicos(subdominio, {
        categoria: filtroCategoria || undefined,
        marca: filtroMarca || undefined
      });

      console.log('Respuesta del API:', response);

      const productosData = response.data || [];
      console.log('Productos obtenidos:', productosData);
      setProductos(productosData);

      // Extraer categorías y marcas únicas
      const categoriasUnicas = [...new Set(productosData.map((p: Producto) => p.categoria).filter(Boolean))] as string[];
      const marcasUnicas = [...new Set(productosData.map((p: Producto) => p.marca).filter(Boolean))] as string[];
      
      console.log('Categorías:', categoriasUnicas);
      console.log('Marcas:', marcasUnicas);
      
      setCategorias(categoriasUnicas);
      setMarcas(marcasUnicas);
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setError('No se pudieron cargar los productos');
    } finally {
      setCargando(false);
    }
  }, [subdominio, filtroCategoria, filtroMarca]);

  useEffect(() => {
    if (empresa && subdominio) {
      cargarProductos();
    }
  }, [empresa, subdominio, cargarProductos]);

  const formatearPrecio = (precio: number, moneda: string = 'USD') => {
    const simbolos: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'ARS': '$',
      'Peso Argentino ($)': '$'
    };
    
    return `${simbolos[moneda] || '$'}${precio.toLocaleString()}`;
  };

  if (cargandoEmpresa) {
    return (
      <div className="pagina-cargando">
        <div className="spinner"></div>
        <p>Cargando tienda...</p>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="pagina-error">
        <h1>Tienda no encontrada</h1>
        <p>No se pudo encontrar la tienda solicitada.</p>
        <Link to="/" className="boton boton-primario">
          Volver al inicio
        </Link>
      </div>
    );
  }

  // Aplicar colores personalizados de la empresa
  const estilosPersonalizados = empresa ? {
    '--color-primario': empresa.colorPrimario || '#3b82f6',
    '--color-secundario': empresa.colorSecundario || '#64748b',
    '--color-acento': empresa.colorAcento || '#f59e0b',
    '--color-fondo': empresa.colorFondo || '#ffffff',
    '--color-texto': empresa.colorTexto || '#1f2937'
  } as React.CSSProperties : {};

  // Debug: Log de los datos de la empresa
  console.log('=== DEBUG CATÁLOGO PÚBLICO ===');
  console.log('Datos de la empresa:', empresa);
  console.log('Colores personalizados:', estilosPersonalizados);
  console.log('Imagen de fondo URL:', empresa?.imagenFondoUrl);

  // Verificar que los CSS custom properties se estén aplicando
  console.log('CSS Custom Properties aplicados:', {
    '--color-primario': empresa?.colorPrimario,
    '--color-secundario': empresa?.colorSecundario,
    '--color-acento': empresa?.colorAcento,
    '--color-fondo': empresa?.colorFondo,
    '--color-texto': empresa?.colorTexto
  });

  // Verificar valores específicos
  console.log('Color Primario:', empresa?.colorPrimario);
  console.log('Color Secundario:', empresa?.colorSecundario);
  console.log('Color Acento:', empresa?.colorAcento);
  console.log('Color Fondo:', empresa?.colorFondo);
  console.log('Color Texto:', empresa?.colorTexto);
  console.log('Imagen Fondo URL:', empresa?.imagenFondoUrl);
  
  // Verificar si la imagen de fondo se está aplicando
  if (empresa?.imagenFondoUrl) {
    console.log('✅ Imagen de fondo detectada, aplicando...');
    console.log('URL de la imagen:', empresa.imagenFondoUrl);
  } else {
    console.log('❌ No hay imagen de fondo configurada');
  }
  console.log('=== FIN DEBUG ===');

  // Determinar el fondo principal
  const fondoPrincipal = empresa?.colorFondo ? 
    `linear-gradient(135deg, ${empresa.colorFondo} 0%, ${empresa.colorFondo}dd 100%)` :
    'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';

  return (
    <div className="catalogo-publico pagina-con-navbar" style={{
      ...estilosPersonalizados,
      background: fondoPrincipal,
      minHeight: '100vh'
    }}>
      <NavbarCliente
        empresa={empresa}
        clienteInfo={clienteInfo}
        onCerrarSesion={() => {
          localStorage.removeItem('clienteToken');
          localStorage.removeItem('clienteInfo');
          setClienteInfo(null);
        }}
        onShowCart={() => setShowCart(true)}
      />
      <CartModal open={showCart} onClose={() => setShowCart(false)} />
      <ProductoDetalleModal 
        open={showProductoModal} 
        onClose={() => {
          setShowProductoModal(false);
          setProductoSeleccionado(null);
        }}
        productoId={productoSeleccionado}
        subdominio={subdominio || ''}
        empresa={empresa}
      />

      {/* Carrito flotante */}
      {clienteInfo && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          zIndex: 1000,
          cursor: 'pointer'
        }}>
          <div
            onClick={() => setShowCart(true)}
            style={{
              width: '70px',
              height: '70px',
              background: empresa?.colorPrimario ? 
                `linear-gradient(135deg, ${empresa.colorPrimario} 0%, ${empresa.colorSecundario || empresa.colorPrimario} 100%)` :
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: empresa?.colorPrimario ? 
                `0 8px 25px ${empresa.colorPrimario}40` :
                '0 8px 25px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = empresa?.colorPrimario ? 
                `0 12px 35px ${empresa.colorPrimario}60` :
                '0 12px 35px rgba(102, 126, 234, 0.6)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = empresa?.colorPrimario ? 
                `0 8px 25px ${empresa.colorPrimario}40` :
                '0 8px 25px rgba(102, 126, 234, 0.4)';
            }}
          >
            <FaShoppingCart size={28} color="white" />
            
            {/* Badge con cantidad de items */}
            {items.reduce((sum, item) => sum + item.cantidad, 0) > 0 && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '700',
                border: '3px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                {items.reduce((sum, item) => sum + item.cantidad, 0)}
              </div>
            )}
          </div>
          
          {/* Tooltip */}
          <div style={{
            position: 'absolute',
            bottom: '80px',
            right: '0',
            background: '#1e293b',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            opacity: 0,
            transform: 'translateY(10px)',
            transition: 'all 0.3s ease',
            pointerEvents: 'none'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.opacity = '0';
            e.currentTarget.style.transform = 'translateY(10px)';
          }}
          >
            Ver carrito ({items.reduce((sum, item) => sum + item.cantidad, 0)} unidades)
            <div style={{
              position: 'absolute',
              top: '100%',
              right: '20px',
              width: '0',
              height: '0',
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #1e293b'
            }} />
          </div>
        </div>
      )}

      <main className="contenedor" style={{ paddingTop: '20px' }}>
                  {/* Cabecera del catálogo */}
        {/* Cabecera del catálogo */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
          padding: '60px 20px',
          background: empresa?.imagenFondoUrl ? 
            `url(${empresa.imagenFondoUrl})` :
            empresa?.colorPrimario ? 
            `linear-gradient(135deg, ${empresa.colorPrimario} 0%, ${empresa.colorPrimario}dd 100%)` :
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '20px',
          color: 'white',
          boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
          marginTop: '0px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Overlay para mejorar legibilidad del contenido */}
          {empresa?.imagenFondoUrl && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%)',
              zIndex: 1
            }} />
          )}
          
          {/* Enlaces de redes sociales - esquina superior izquierda */}
          {(empresa.instagramUrl || empresa.facebookUrl) && (
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              display: 'flex',
              gap: '8px',
              zIndex: 10
            }}>
              {empresa.instagramUrl && (
                <a
                  href={empresa.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '20px',
                    padding: '8px',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease',
                    background: 'rgba(255,255,255,0.15)',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title="Síguenos en Instagram"
                >
                  <FaInstagram size={18} />
                </a>
              )}
              
              {empresa.facebookUrl && (
                <a
                  href={empresa.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '20px',
                    padding: '8px',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease',
                    background: 'rgba(255,255,255,0.15)',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title="Síguenos en Facebook"
                >
                  <FaFacebook size={18} />
                </a>
              )}
            </div>
          )}

          {/* Contenido de la cabecera */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              width: '140px',
              height: '140px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '56px',
              overflow: 'hidden',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255,255,255,0.2)'
            }}>
              {empresa.logoUrl ? (
                <img
                  src={empresa.logoUrl}
                  alt={`Logo de ${empresa.nombre}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    borderRadius: '50%'
                  }}
                />
              ) : (
                '🛍️'
              )}
            </div>
            
            {/* Bienvenida */}
            <div style={{
              marginBottom: '24px'
            }}>
              <h1 style={{ 
                margin: '0 0 12px 0', 
                fontSize: '32px', 
                fontWeight: '700',
                color: 'white',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                Bienvenido a {empresa.nombre}
              </h1>
              
              {empresa.descripcion && (
                <div style={{
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '16px',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  maxWidth: '600px',
                  margin: '0 auto 16px'
                }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '16px', 
                    lineHeight: '1.6',
                    opacity: 0.95,
                    fontWeight: '400',
                    textAlign: 'center',
                    color: empresa?.colorTexto || '#1e293b'
                  }}>
                    {empresa.descripcion}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filtros y controles combinados */}
        <div style={{
          background: empresa?.colorAcento || '#fff',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: `1px solid ${empresa?.colorPrimario ? `${empresa.colorPrimario}20` : 'rgba(255,255,255,0.2)'}`,
          color: empresa?.colorTexto || '#1e293b'
        }}>
          {/* Título del catálogo */}
          <div style={{
            textAlign: 'center',
            marginBottom: '24px',
            paddingBottom: '20px',
            borderBottom: `2px solid ${empresa?.colorPrimario ? `${empresa.colorPrimario}20` : '#f1f5f9'}`
          }}>
            <h2 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '28px', 
              fontWeight: '700', 
              color: empresa?.colorTexto || '#1e293b',
              background: empresa?.colorPrimario ? `linear-gradient(135deg, ${empresa.colorPrimario} 0%, ${empresa.colorPrimario}dd 100%)` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Catálogo de Productos
            </h2>
            <p style={{ 
              margin: 0, 
              fontSize: '16px', 
              color: empresa?.colorTexto ? `${empresa.colorTexto}80` : '#64748b',
              fontWeight: '400'
            }}>
              Descubre nuestra increíble selección de productos
            </p>
          </div>

          {/* Sección de filtros */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: `linear-gradient(135deg, ${empresa?.colorPrimario || '#10b981'} 0%, ${empresa?.colorPrimario ? `${empresa.colorPrimario}dd` : '#059669'} 100%)`,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: 'white'
            }}>
              🔍
            </div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: empresa?.colorTexto || '#1e293b' }}>
              Filtros de Búsqueda
            </h3>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: empresa?.colorTexto ? `${empresa.colorTexto}80` : '#64748b'
              }}>
                Categoría
              </label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  fontSize: '14px',
                  background: '#fff',
                  color: empresa?.colorTexto || '#1e293b',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              >
                <option value="">Todas las categorías</option>
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: empresa?.colorTexto ? `${empresa.colorTexto}80` : '#64748b'
              }}>
                Marca
              </label>
              <select
                value={filtroMarca}
                onChange={(e) => setFiltroMarca(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #e2e8f0',
                  fontSize: '14px',
                  background: '#fff',
                  color: empresa?.colorTexto || '#1e293b',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#10b981'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              >
                <option value="">Todas las marcas</option>
                {marcas.map(marca => (
                  <option key={marca} value={marca}>{marca}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Separador */}
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%)',
            margin: '0 -24px 24px -24px'
          }} />

          {/* Sección de controles de vista */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                fontSize: '16px',
                fontWeight: '600',
                color: empresa?.colorTexto || '#64748b'
              }}>
                Vista:
              </span>
              <button
                onClick={() => setVistaCuadricula(true)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '2px solid',
                  background: vistaCuadricula ? `linear-gradient(135deg, ${empresa?.colorPrimario || '#667eea'} 0%, ${empresa?.colorPrimario ? `${empresa.colorPrimario}dd` : '#764ba2'} 100%)` : 'transparent',
                  borderColor: vistaCuadricula ? (empresa?.colorPrimario || '#667eea') : (empresa?.colorSecundario ? `${empresa.colorSecundario}40` : '#e2e8f0'),
                  color: vistaCuadricula ? 'white' : (empresa?.colorTexto || '#64748b'),
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
                onMouseOver={(e) => {
                  if (!vistaCuadricula) {
                    e.currentTarget.style.borderColor = empresa?.colorPrimario || '#667eea';
                    e.currentTarget.style.color = empresa?.colorPrimario || '#667eea';
                  }
                }}
                onMouseOut={(e) => {
                  if (!vistaCuadricula) {
                    e.currentTarget.style.borderColor = empresa?.colorSecundario ? `${empresa.colorSecundario}40` : '#e2e8f0';
                    e.currentTarget.style.color = empresa?.colorTexto || '#64748b';
                  }
                }}
              >
                📱 Cuadrícula
              </button>
              <button
                onClick={() => setVistaCuadricula(false)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '2px solid',
                  background: !vistaCuadricula ? `linear-gradient(135deg, ${empresa?.colorPrimario || '#667eea'} 0%, ${empresa?.colorPrimario ? `${empresa.colorPrimario}dd` : '#764ba2'} 100%)` : 'transparent',
                  borderColor: !vistaCuadricula ? (empresa?.colorPrimario || '#667eea') : (empresa?.colorSecundario ? `${empresa.colorSecundario}40` : '#e2e8f0'),
                  color: !vistaCuadricula ? 'white' : (empresa?.colorTexto || '#64748b'),
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '14px',
              fontWeight: '600'
                }}
                onMouseOver={(e) => {
                  if (vistaCuadricula) {
                    e.currentTarget.style.borderColor = empresa?.colorPrimario || '#667eea';
                    e.currentTarget.style.color = empresa?.colorPrimario || '#667eea';
                  }
                }}
                onMouseOut={(e) => {
                  if (vistaCuadricula) {
                    e.currentTarget.style.borderColor = empresa?.colorSecundario ? `${empresa.colorSecundario}40` : '#e2e8f0';
                    e.currentTarget.style.color = empresa?.colorTexto || '#64748b';
                  }
                }}
              >
                📋 Lista
              </button>
            </div>
            
            <div style={{
              fontSize: '14px',
              color: empresa?.colorTexto ? `${empresa.colorTexto}80` : '#64748b',
              fontWeight: '500'
            }}>
              {productos.length} producto{productos.length !== 1 ? 's' : ''} encontrado{productos.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Grid de productos */}
        {cargando ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: empresa?.colorAcento || '#fff',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '3px solid #e2e8f0',
              borderTop: `3px solid ${empresa?.colorPrimario || '#667eea'}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }} />
            <p style={{ margin: 0, fontSize: '18px', color: empresa?.colorTexto ? `${empresa.colorTexto}80` : '#64748b', fontWeight: '500' }}>
              Cargando productos...
            </p>
          </div>
        ) : error ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: empresa?.colorAcento || '#fff',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '24px'
            }}>
              ❌
            </div>
            <p style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#dc2626', fontWeight: '600' }}>
              {error}
            </p>
            <button 
              onClick={cargarProductos} 
              style={{
                background: `linear-gradient(135deg, ${empresa?.colorPrimario || '#667eea'} 0%, ${empresa?.colorPrimario ? `${empresa.colorPrimario}dd` : '#764ba2'} 100%)`,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              🔄 Reintentar
            </button>
          </div>
        ) : productos.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: empresa?.colorAcento || '#fff',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: `linear-gradient(135deg, ${empresa?.colorSecundario ? `${empresa.colorSecundario}20` : '#e2e8f0'} 0%, ${empresa?.colorSecundario ? `${empresa.colorSecundario}10` : '#cbd5e1'} 100%)`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '32px'
            }}>
              📦
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '600', color: empresa?.colorTexto || '#1e293b' }}>
              No hay productos disponibles
            </h3>
            <p style={{ margin: 0, fontSize: '16px', color: empresa?.colorTexto ? `${empresa.colorTexto}80` : '#64748b' }}>
              En este momento no tenemos productos en esta categoría.
            </p>
          </div>
        ) : (
          <div style={{
            display: vistaCuadricula ? 'grid' : 'flex',
            gridTemplateColumns: vistaCuadricula ? 'repeat(auto-fill, minmax(250px, 1fr))' : 'none',
            flexDirection: vistaCuadricula ? 'unset' : 'column',
            gap: vistaCuadricula ? '20px' : '16px',
            marginBottom: '40px'
          }}>
            {productos.map(producto => {
              const cantidadEnCarrito = items.find(i => i.id === producto.id)?.cantidad || 0;
              const maximoAlcanzado = cantidadEnCarrito >= producto.stock;

              return (
                <div key={producto.id} style={{
                  background: empresa?.colorAcento || '#fff',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: `1px solid ${empresa?.colorPrimario ? `${empresa.colorPrimario}20` : 'rgba(255,255,255,0.2)'}`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  display: vistaCuadricula ? 'block' : 'flex',
                  alignItems: vistaCuadricula ? 'unset' : 'stretch',
                  gap: vistaCuadricula ? 'unset' : '0',
                  height: vistaCuadricula ? 'auto' : '160px',
                  color: empresa?.colorTexto || '#1e293b'
                }}
                onClick={(e) => {
                  // Solo abrir modal si no se hizo clic en el botón de agregar al carrito
                  if (!(e.target as HTMLElement).closest('button')) {
                    setProductoSeleccionado(producto.id);
                    setShowProductoModal(true);
                  }
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = vistaCuadricula ? 'translateY(-8px)' : 'translateX(4px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                }}>
                  
                  {/* Imagen del producto */}
                  <div style={{ 
                    position: 'relative', 
                    width: '100%',
                    aspectRatio: vistaCuadricula ? '1 / 1' : undefined,
                    height: vistaCuadricula ? undefined : '160px',
                    minWidth: vistaCuadricula ? undefined : '160px',
                    maxWidth: vistaCuadricula ? undefined : '160px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    borderRadius: vistaCuadricula ? '12px 12px 0 0' : '0',
                    margin: 0,
                    padding: 0
                  }}>
                    {producto.imagenes && producto.imagenes.length > 0 ? (
                      <img 
                        src={producto.imagenes[0]} 
                        alt={producto.nombre}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          borderRadius: vistaCuadricula ? '12px 12px 0 0' : '0',
                          margin: 0,
                          padding: 0
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                        fontSize: vistaCuadricula ? '16px' : '14px',
                        borderRadius: vistaCuadricula ? '12px 12px 0 0' : '0',
                        margin: 0,
                        padding: 0
                      }}>
                        📷 Sin imagen
                      </div>
                    )}
                    
                    {/* Badge destacado */}
                    {producto.destacado && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: vistaCuadricula ? '12px' : '10px',
                        fontWeight: '600',
                        boxShadow: '0 2px 8px rgba(245,158,11,0.3)'
                      }}>
                        ⭐ Destacado
                      </div>
                    )}

                    {/* Badge de stock */}
                    {producto.stock !== null && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: producto.stock > 0 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: vistaCuadricula ? '12px' : '10px',
                        fontWeight: '600',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}>
                        {producto.stock > 0 ? `📦 ${producto.stock}` : '❌ Agotado'}
                      </div>
                    )}
                  </div>
                  
                  {/* Contenido principal */}
                  <div style={{ 
                    flex: 1,
                    padding: vistaCuadricula ? '20px' : '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: vistaCuadricula ? 'space-between' : 'space-between',
                    height: vistaCuadricula ? 'auto' : '160px'
                  }}>
                    {/* Layout horizontal para vista de lista */}
                    <div style={{
                      display: 'flex',
                      flexDirection: vistaCuadricula ? 'column' : 'row',
                      justifyContent: vistaCuadricula ? 'space-between' : 'space-between',
                      alignItems: vistaCuadricula ? 'stretch' : 'center',
                      height: vistaCuadricula ? 'auto' : '100%',
                      gap: vistaCuadricula ? '0' : '16px'
                    }}>
                      {/* Información del producto */}
                      <div style={{
                        flex: vistaCuadricula ? 'none' : '1',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: vistaCuadricula ? 'auto' : '100%'
                      }}>
                        <div>
                          <h3 style={{
                            margin: '0 0 8px 0',
                            fontSize: vistaCuadricula ? '18px' : '16px',
                            fontWeight: '700',
                            color: empresa?.colorTexto || '#1e293b',
                            lineHeight: '1.3',
                            display: '-webkit-box',
                            WebkitLineClamp: vistaCuadricula ? 2 : 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {producto.nombre}
                          </h3>
                          
                          {/* Categoría y marca */}
                          <div style={{ 
                            display: 'flex', 
                            gap: '6px', 
                            marginBottom: vistaCuadricula ? '12px' : '8px', 
                            flexWrap: 'wrap' 
                          }}>
                            {producto.categoria && (
                              <span style={{
                                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                                color: '#1e40af',
                                padding: '3px 8px',
                                borderRadius: '8px',
                                fontSize: vistaCuadricula ? '12px' : '10px',
                                fontWeight: '600',
                                border: '1px solid #93c5fd'
                              }}>
                                📂 {producto.categoria}
                              </span>
                            )}
                            
                            {producto.marca && (
                              <span style={{
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                color: '#92400e',
                                padding: '3px 8px',
                                borderRadius: '8px',
                                fontSize: vistaCuadricula ? '12px' : '10px',
                                fontWeight: '600',
                                border: '1px solid #fbbf24'
                              }}>
                                🏷️ {producto.marca}
                              </span>
                            )}
                          </div>
                          
                          {/* Precio */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: vistaCuadricula ? 'space-between' : 'flex-start',
                            marginBottom: vistaCuadricula ? '16px' : '0'
                          }}>
                            <span style={{
                              fontSize: vistaCuadricula ? '24px' : '20px',
                              fontWeight: '800',
                              color: empresa?.colorAcento || '#059669',
                              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}>
                              {formatearPrecio(producto.precio, empresa.moneda)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controles a la derecha */}
                      {clienteInfo ? (
                        // Mostrar controles de carrito solo si hay cliente logueado
                        <div style={{
                          display: 'flex',
                          flexDirection: vistaCuadricula ? 'column' : 'column',
                          gap: vistaCuadricula ? '12px' : '8px',
                          alignItems: vistaCuadricula ? 'stretch' : 'center',
                          justifyContent: vistaCuadricula ? 'stretch' : 'center',
                          minWidth: vistaCuadricula ? undefined : '200px',
                          maxWidth: vistaCuadricula ? undefined : '220px'
                        }}>
                          {/* Controles de cantidad */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: '#f8fafc',
                            borderRadius: '10px',
                            padding: '8px 12px',
                            border: '1px solid #e2e8f0',
                            width: vistaCuadricula ? '100%' : '100%',
                            gap: '8px'
                          }}>
                            <span style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#374151',
                              minWidth: '60px'
                            }}>
                              Cantidad:
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Botón menos clickeado');
                                console.log('Producto ID:', producto.id);
                                console.log('Cantidad actual:', cantidadEnCarrito);
                                if (cantidadEnCarrito > 0) {
                                  // Actualizar directamente el estado del carrito
                                  const newItems = items.map(item => 
                                    item.id === producto.id 
                                      ? { ...item, cantidad: item.cantidad - 1 }
                                      : item
                                  ).filter(item => item.cantidad > 0);
                                  
                                  // Actualizar localStorage
                                  localStorage.setItem('cart', JSON.stringify(newItems));
                                  
                                  // Forzar re-render
                                  window.dispatchEvent(new Event('storage'));
                                }
                              }}
                              disabled={cantidadEnCarrito === 0}
                              style={{
                                width: '32px',
                                height: '32px',
                                background: cantidadEnCarrito === 0
                                  ? '#e5e7eb'
                                  : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: cantidadEnCarrito === 0 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                opacity: cantidadEnCarrito === 0 ? 0.5 : 1
                              }}
                              onMouseOver={(e) => {
                                if (cantidadEnCarrito > 0) {
                                  e.currentTarget.style.transform = 'scale(1.05)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                                }
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              -
                            </button>
                            
                            <span style={{
                              minWidth: '32px',
                              textAlign: 'center',
                              fontSize: '16px',
                              fontWeight: '700',
                              color: '#1e293b',
                              background: 'white',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid #d1d5db'
                            }}>
                              {cantidadEnCarrito}
                            </span>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Botón más clickeado');
                                console.log('Producto ID:', producto.id);
                                console.log('Cantidad actual:', cantidadEnCarrito);
                                console.log('Stock disponible:', producto.stock);
                                if (cantidadEnCarrito < producto.stock) {
                                  // Actualizar directamente el estado del carrito
                                  const newItems = items.map(item => 
                                    item.id === producto.id 
                                      ? { ...item, cantidad: item.cantidad + 1 }
                                      : item
                                  );
                                  
                                  // Si el producto no está en el carrito, agregarlo
                                  if (!items.find(item => item.id === producto.id)) {
                                    newItems.push({
                                      id: producto.id,
                                      nombre: producto.nombre,
                                      precio: producto.precio,
                                      cantidad: 1,
                                      imagen: producto.imagenes && producto.imagenes[0]
                                    });
                                  }
                                  
                                  // Actualizar localStorage
                                  localStorage.setItem('cart', JSON.stringify(newItems));
                                  
                                  // Forzar re-render
                                  window.dispatchEvent(new Event('storage'));
                                }
                              }}
                              disabled={cantidadEnCarrito >= producto.stock}
                              style={{
                                width: '32px',
                                height: '32px',
                                background: cantidadEnCarrito >= producto.stock
                                  ? '#e5e7eb'
                                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: cantidadEnCarrito >= producto.stock ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                opacity: cantidadEnCarrito >= producto.stock ? 0.5 : 1
                              }}
                              onMouseOver={(e) => {
                                if (cantidadEnCarrito < producto.stock) {
                                  e.currentTarget.style.transform = 'scale(1.05)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                                }
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              +
                            </button>
                          </div>

                          {/* Botón agregar al carrito mejorado */}
                          <button
                            disabled={producto.stock === 0}
                                                          style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: producto.stock === 0 
                                  ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                                  : cantidadEnCarrito > 0
                                    ? `linear-gradient(135deg, ${empresa?.colorAcento || '#f59e0b'} 0%, ${empresa?.colorAcento ? `${empresa.colorAcento}dd` : '#d97706'} 100%)`
                                    : `linear-gradient(135deg, ${empresa?.colorPrimario || '#3b82f6'} 0%, ${empresa?.colorPrimario ? `${empresa.colorPrimario}dd` : '#1d4ed8'} 100%)`,
                              color: 'white',
                              border: 'none',
                              borderRadius: '12px',
                              fontSize: '15px',
                              fontWeight: '700',
                              cursor: producto.stock === 0 ? 'not-allowed' : 'pointer',
                              transition: 'all 0.3s ease',
                              opacity: producto.stock === 0 ? 0.6 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                            onClick={async (e) => {
                              e.stopPropagation();
                              
                              if (producto.stock === 0) {
                                toast.error('Este producto está agotado');
                                return;
                              }
                              
                              if (typeof producto.precio !== 'number' || isNaN(producto.precio)) {
                                alert('Este producto no tiene un precio válido y no puede ser agregado al carrito.');
                                return;
                              }
                              
                              // Si no hay cantidad en carrito, agregar 1
                              if (cantidadEnCarrito === 0) {
                                const agregado = await addToCart({
                                  id: producto.id,
                                  nombre: producto.nombre,
                                  precio: producto.precio,
                                  cantidad: 1,
                                  imagen: producto.imagenes && producto.imagenes[0]
                                }, undefined, subdominio || undefined);
                                
                                if (agregado) {
                                  toast.success('Producto agregado al carrito');
                                }
                              } else {
                                // Si ya hay cantidad, mostrar mensaje
                                toast.success(`Tienes ${cantidadEnCarrito} unidades en el carrito`);
                              }
                            }}
                            onMouseOver={(e) => {
                              if (producto.stock !== 0) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
                              }
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            {producto.stock === 0 ? (
                              <>
                                <span>❌</span>
                                <span>Agotado</span>
                              </>
                            ) : cantidadEnCarrito > 0 ? (
                              <>
                                <span>🛒</span>
                                <span>{cantidadEnCarrito} en carrito</span>
                              </>
                            ) : (
                              <>
                                <span>🛒</span>
                                <span>Agregar al carrito</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        // Mostrar botón de iniciar sesión si no hay cliente logueado
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          alignItems: 'stretch'
                        }}>
                          <div style={{
                            padding: '12px 16px',
                            background: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            borderRadius: '10px',
                            textAlign: 'center',
                            fontSize: '14px',
                            color: '#0369a1'
                          }}>
                            🔑 Inicia sesión para comprar
                          </div>
                          <Link to="/login" style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: `linear-gradient(135deg, ${empresa?.colorPrimario || '#3b82f6'} 0%, ${empresa?.colorPrimario ? `${empresa.colorPrimario}dd` : '#1d4ed8'} 100%)`,
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                            textDecoration: 'none'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          >
                            <span>🔑</span>
                            <span>Iniciar Sesión</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer del catálogo */}
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: '20px',
          border: '2px dashed #cbd5e1',
          marginTop: '40px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '24px'
          }}>
            🎉
          </div>
                      <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '600', color: empresa?.colorTexto || '#1e293b' }}>
            ¡Gracias por visitarnos!
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#64748b' }}>
            Encuentra los mejores productos al mejor precio
          </p>
          
          {/* Redes sociales en el footer */}
          {(empresa.instagramUrl || empresa.facebookUrl) && (
            <div style={{
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: '1px solid #e2e8f0'
            }}>
              <p style={{ 
                margin: '0 0 16px 0', 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                Síguenos en nuestras redes sociales
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                {empresa.instagramUrl && (
                  <a
                    href={empresa.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 20px',
                      background: 'linear-gradient(135deg, #e4405f 0%, #c13584 100%)',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(228, 64, 95, 0.3)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(228, 64, 95, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(228, 64, 95, 0.3)';
                    }}
                  >
                    <FaInstagram size={18} />
                    <span>Instagram</span>
                  </a>
                )}
                
                {empresa.facebookUrl && (
                  <a
                    href={empresa.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 20px',
                      background: 'linear-gradient(135deg, #1877f2 0%, #0d6efd 100%)',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(24, 119, 242, 0.3)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(24, 119, 242, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(24, 119, 242, 0.3)';
                    }}
                  >
                    <FaFacebook size={18} />
                    <span>Facebook</span>
                  </a>
                )}
                

              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
