import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSubdominio } from '../hooks/useSubdominio';
import { getCookie } from '../utils/cookies';
import { useCart } from '../hooks/useCart';
import { useClienteAuth } from '../hooks/useClienteAuth';
import { useResponsive } from '../hooks/useResponsive';
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
  const { isMobile, isTablet } = useResponsive();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [filtroMarca, setFiltroMarca] = useState<string>('');
  const [categorias, setCategorias] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const { clienteInfo, cerrarSesion } = useClienteAuth();
  const [showCart, setShowCart] = useState(false);
  type VistaProducto = 'lista' | 'intermedia' | 'grande';
  const [vista, setVista] = useState<VistaProducto>('intermedia');

  // Permitir todas las vistas en móvil
  // useEffect(() => {
  //   if (isMobile) {
  //     setVista('lista');
  //   }
  // }, [isMobile]);
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<number | null>(null);

  // Estados para favoritos
  const [favoritos, setFavoritos] = useState<Set<number>>(new Set());
  const [cargandoFavoritos, setCargandoFavoritos] = useState(false);

  // El hook useClienteAuth maneja automáticamente la autenticación

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

  // Debug: Log de la empresa cuando se carga
  useEffect(() => {
    if (empresa) {
      console.log('🏢 Empresa cargada:', {
        nombre: empresa.nombre,
        descripcion: empresa.descripcion,
        subdominio: empresa.subdominio,
        mostrarStock: empresa.mostrarStock,
        mostrarCategorias: empresa.mostrarCategorias,
        logoUrl: empresa.logoUrl,
        colorPrimario: empresa.colorPrimario,
        colorSecundario: empresa.colorSecundario,
        colorAcento: empresa.colorAcento,
        colorFondo: empresa.colorFondo,
        colorTexto: empresa.colorTexto,
        colorTituloPrincipal: empresa.colorTituloPrincipal,
        colorCardFiltros: empresa.colorCardFiltros,
        imagenFondoUrl: empresa.imagenFondoUrl,
        instagramUrl: empresa.instagramUrl,
        facebookUrl: empresa.facebookUrl
      });
    }
  }, [empresa]);

  const formatearPrecio = (precio: number, moneda: string = 'USD') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 2
    }).format(precio);
  };

  // ============================================
  // FUNCIONES PARA FAVORITOS
  // ============================================

  const cargarFavoritos = async () => {
    if (!clienteInfo) return;
    
    const subdominioDesarrollo = localStorage.getItem('subdominio-desarrollo');
    const subdominioFinal = subdominio || subdominioDesarrollo;
    
    // Buscar token en cookies primero (se comparte entre subdominios)
    let token = getCookie('clienteToken');
    if (!token) {
      token = localStorage.getItem('clienteToken');
    }
    
    if (!subdominioFinal || !token) return;

    setCargandoFavoritos(true);
    try {
      const response = await apiService.obtenerFavoritos(subdominioFinal, token);
      const favoritosIds = new Set<number>((response.favoritos || []).map((f: any) => f.producto.id));
      setFavoritos(favoritosIds);
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
    } finally {
      setCargandoFavoritos(false);
    }
  };

  const toggleFavorito = async (productoId: number) => {
    if (!clienteInfo) {
      toast.error('Debes iniciar sesión para guardar favoritos');
      return;
    }

    const subdominioDesarrollo = localStorage.getItem('subdominio-desarrollo');
    const subdominioFinal = subdominio || subdominioDesarrollo;
    
    // Buscar token en cookies primero (se comparte entre subdominios)
    let token = getCookie('clienteToken');
    if (!token) {
      token = localStorage.getItem('clienteToken');
    }
    
    if (!subdominioFinal || !token) {
      toast.error('Error de autenticación');
      return;
    }

    try {
      if (favoritos.has(productoId)) {
        // Remover de favoritos
        await apiService.removerFavorito(subdominioFinal, productoId, token);
        setFavoritos(prev => {
          const newSet = new Set(prev);
          newSet.delete(productoId);
          return newSet;
        });
        toast.success('Producto removido de favoritos');
      } else {
        // Agregar a favoritos
        await apiService.agregarFavorito(subdominioFinal, productoId, token);
        setFavoritos(prev => new Set([...prev, productoId]));
        toast.success('Producto agregado a favoritos');
      }
    } catch (error) {
      console.error('Error al gestionar favorito:', error);
      const mensaje = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al gestionar favorito';
      toast.error(mensaje);
    }
  };

  // Cargar favoritos cuando el cliente esté logueado
  useEffect(() => {
    if (clienteInfo) {
      cargarFavoritos();
    }
  }, [clienteInfo, subdominio]);

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
  console.log('Color Título Principal:', empresa?.colorTituloPrincipal);
  console.log('Color Card Filtros:', empresa?.colorCardFiltros);
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
      minHeight: '100vh',
      paddingTop: isMobile ? '120px' : '80px'
    }}>
      <NavbarCliente
        empresa={empresa}
        clienteInfo={clienteInfo}
        onCerrarSesion={cerrarSesion}
        onShowCart={() => setShowCart(true)}
      />
              <CartModal 
          open={showCart} 
          onClose={() => setShowCart(false)} 
          onCompraExitosa={cargarProductos}
        />
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
          bottom: isMobile ? '20px' : '30px',
          right: isMobile ? '20px' : '30px',
          zIndex: 1000,
          cursor: 'pointer'
        }}>
          <div
            onClick={() => setShowCart(true)}
            style={{
              width: isMobile ? '60px' : '70px',
              height: isMobile ? '60px' : '70px',
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
            <FaShoppingCart size={isMobile ? 24 : 28} color="white" />
            
            {/* Badge con cantidad de items */}
                        {items.reduce((sum, item) => sum + item.cantidad, 0) > 0 && (
              <div style={{
                position: 'absolute',
                top: isMobile ? '-6px' : '-8px',
                right: isMobile ? '-6px' : '-8px',
                background: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: isMobile ? '24px' : '28px',
                height: isMobile ? '24px' : '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '10px' : '12px',
                fontWeight: '700',
                border: isMobile ? '2px solid white' : '3px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                {items.reduce((sum, item) => sum + item.cantidad, 0)}
              </div>
            )}
          </div>
          
          {/* Tooltip */}
          <div style={{
            position: 'absolute',
            bottom: isMobile ? '70px' : '80px',
            right: '0',
            background: '#1e293b',
            color: 'white',
            padding: isMobile ? '6px 10px' : '8px 12px',
            borderRadius: '8px',
            fontSize: isMobile ? '12px' : '14px',
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

      <main className="contenedor" style={{ 
        paddingTop: isMobile ? '16px' : '20px',
        paddingLeft: isMobile ? '1rem' : '2rem',
        paddingRight: isMobile ? '1rem' : '2rem'
      }}>
                  {/* Cabecera del catálogo */}
        {/* Cabecera del catálogo */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '32px' : '40px',
          padding: isMobile ? '40px 16px' : isTablet ? '50px 20px' : '60px 20px',
          background: empresa?.imagenFondoUrl ? 
            `url(${empresa.imagenFondoUrl})` :
            empresa?.colorPrimario ? 
            `linear-gradient(135deg, ${empresa.colorPrimario} 0%, ${empresa.colorPrimario}dd 100%)` :
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: isMobile ? '24px' : '32px',
          color: 'white',
          boxShadow: empresa?.imagenFondoUrl ? 
            '0 20px 60px rgba(0, 0, 0, 0.4), 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)' :
            empresa?.colorPrimario ? 
            `0 20px 60px ${empresa.colorPrimario}40, 0 8px 32px ${empresa.colorPrimario}20, inset 0 1px 0 rgba(255, 255, 255, 0.1)` :
            '0 20px 60px rgba(102, 126, 234, 0.4), 0 8px 32px rgba(102, 126, 234, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          marginTop: '0px',
          position: 'relative',
          overflow: 'hidden',
          border: empresa?.imagenFondoUrl ? 
            '2px solid rgba(255, 255, 255, 0.2)' :
            empresa?.colorPrimario ? 
            `2px solid ${empresa.colorPrimario}30` :
            '2px solid rgba(102, 126, 234, 0.3)',
          backdropFilter: empresa?.imagenFondoUrl ? 'blur(1px)' : 'none',
          transform: 'translateY(0)',
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = empresa?.imagenFondoUrl ? 
            '0 25px 80px rgba(0, 0, 0, 0.5), 0 12px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)' :
            empresa?.colorPrimario ? 
            `0 25px 80px ${empresa.colorPrimario}50, 0 12px 40px ${empresa.colorPrimario}30, inset 0 1px 0 rgba(255, 255, 255, 0.15)` :
            '0 25px 80px rgba(102, 126, 234, 0.5), 0 12px 40px rgba(102, 126, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = empresa?.imagenFondoUrl ? 
            '0 20px 60px rgba(0, 0, 0, 0.4), 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)' :
            empresa?.colorPrimario ? 
            `0 20px 60px ${empresa.colorPrimario}40, 0 8px 32px ${empresa.colorPrimario}20, inset 0 1px 0 rgba(255, 255, 255, 0.1)` :
            '0 20px 60px rgba(102, 126, 234, 0.4), 0 8px 32px rgba(102, 126, 234, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
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
              top: isMobile ? '16px' : '20px',
              left: isMobile ? '16px' : '20px',
              display: 'flex',
              gap: isMobile ? '6px' : '8px',
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
                    fontSize: isMobile ? '16px' : '20px',
                    padding: isMobile ? '6px' : '8px',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease',
                    background: 'rgba(255,255,255,0.15)',
                    width: isMobile ? '32px' : '36px',
                    height: isMobile ? '32px' : '36px',
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
                  <FaInstagram size={isMobile ? 14 : 18} />
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
                    fontSize: isMobile ? '16px' : '20px',
                    padding: isMobile ? '6px' : '8px',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease',
                    background: 'rgba(255,255,255,0.15)',
                    width: isMobile ? '32px' : '36px',
                    height: isMobile ? '32px' : '36px',
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
                  <FaFacebook size={isMobile ? 14 : 18} />
                </a>
              )}
            </div>
          )}

          {/* Contenido de la cabecera */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              width: '200px',
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '80px',
              overflow: 'hidden',
              borderRadius: '50%'
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
              marginBottom: isMobile ? '20px' : '24px'
            }}>
              <h1 style={{ 
                margin: '0 0 12px 0', 
                fontSize: isMobile ? '28px' : isTablet ? '32px' : '36px', 
                fontWeight: '800',
                color: empresa?.colorTituloPrincipal || 'white',
                textShadow: empresa?.colorTituloPrincipal ? 
                  `0 4px 8px ${empresa.colorTituloPrincipal}40, 0 2px 4px ${empresa.colorTituloPrincipal}20` :
                  '0 4px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)',
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                letterSpacing: '-0.5px',
                lineHeight: '1.1',
                textAlign: 'center'
              }}>
                {empresa.textoBienvenida || `Bienvenido a ${empresa.nombre}`}
                {/* Debug: {empresa.textoBienvenida ? `✅ Texto personalizado: "${empresa.textoBienvenida}"` : `❌ Sin texto personalizado`} */}
              </h1>
              
              {empresa.descripcion && (
                <div style={{
                  marginBottom: isMobile ? '12px' : '16px',
                  maxWidth: '600px',
                  margin: isMobile ? '0 auto 12px' : '0 auto 16px'
                }}>
                  <p style={{ 
                    margin: '0 auto', 
                    fontSize: isMobile ? '16px' : '18px', 
                    lineHeight: '1.5',
                    fontWeight: '500',
                    textAlign: 'center',
                    color: empresa?.colorTituloPrincipal || 'white',
                    textShadow: empresa?.colorTituloPrincipal ? 
                      `0 3px 6px ${empresa.colorTituloPrincipal}30, 0 1px 2px ${empresa.colorTituloPrincipal}15` :
                      '0 3px 6px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.2)',
                    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                    letterSpacing: '0.2px',
                    maxWidth: '600px',
                    opacity: '0.95'
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
          background: empresa?.colorCardFiltros || empresa?.colorAcento || '#fff',
          borderRadius: isMobile ? '12px' : '16px',
          padding: isMobile ? '12px' : isTablet ? '16px' : '20px',
          marginBottom: isMobile ? '24px' : '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: `1px solid ${empresa?.colorPrimario ? `${empresa.colorPrimario}20` : 'rgba(255,255,255,0.2)'}`,
          color: empresa?.colorTexto || '#1e293b'
        }}>
          {/* Título del catálogo */}
          <div style={{
            textAlign: 'center',
            marginBottom: isMobile ? '16px' : '20px',
            paddingBottom: isMobile ? '12px' : '16px',
            borderBottom: `2px solid ${empresa?.colorPrimario ? `${empresa.colorPrimario}20` : '#f1f5f9'}`
          }}>
            <h2 style={{ 
              margin: '0 0 8px 0', 
              fontSize: isMobile ? '24px' : isTablet ? '26px' : '28px', 
              fontWeight: '700', 
              color: empresa?.colorTexto || '#1e293b'
            }}>
              Catálogo de Productos
            </h2>
            <p style={{ 
              margin: 0, 
              fontSize: isMobile ? '14px' : '16px', 
              color: empresa?.colorTexto ? `${empresa.colorTexto}80` : '#64748b',
              fontWeight: '400'
            }}>
              Descubre nuestra increíble selección de productos
            </p>
          </div>

          {/* Sección de filtros */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: isMobile ? '16px' : '20px',
            marginBottom: isMobile ? '16px' : '20px'
          }}>
            {/* Casilleros de búsqueda con lupa a la izquierda */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '12px' : '16px',
              width: '100%',
              maxWidth: isMobile ? '100%' : '600px',
              margin: '0 auto'
            }}>
              {/* Icono de lupa - solo en tablet y desktop */}
              {!isMobile && (
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: `linear-gradient(135deg, ${empresa?.colorPrimario || '#10b981'} 0%, ${empresa?.colorPrimario ? `${empresa.colorPrimario}dd` : '#059669'} 100%)`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: 'white',
                  flexShrink: 0
                }}>
                  🔍
                </div>
              )}
              
              {/* Filtros */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
                gap: isMobile ? '8px' : '16px',
                flex: 1
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: isMobile ? '6px' : '8px',
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: '600',
                    color: empresa?.colorTexto || '#1e293b',
                    textAlign: 'left'
                  }}>
                    Categoría
                  </label>
                  <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    style={{
                      width: '100%',
                      padding: isMobile ? '10px 14px' : '12px 16px',
                      borderRadius: '10px',
                      border: '2px solid #e2e8f0',
                      fontSize: isMobile ? '13px' : '14px',
                      background: '#fff',
                      color: '#000000',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                    onFocus={(e) => e.target.style.borderColor = empresa?.colorPrimario || '#10b981'}
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
                    marginBottom: isMobile ? '6px' : '8px',
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: '600',
                    color: empresa?.colorTexto || '#1e293b',
                    textAlign: 'left'
                  }}>
                    Marca
                  </label>
                  <select
                    value={filtroMarca}
                    onChange={(e) => setFiltroMarca(e.target.value)}
                    style={{
                      width: '100%',
                      padding: isMobile ? '10px 14px' : '12px 16px',
                      borderRadius: '10px',
                      border: '2px solid #e2e8f0',
                      fontSize: isMobile ? '13px' : '14px',
                      background: '#fff',
                      color: '#000000',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                    onFocus={(e) => e.target.style.borderColor = empresa?.colorPrimario || '#10b981'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  >
                    <option value="">Todas las marcas</option>
                    {marcas.map(marca => (
                      <option key={marca} value={marca}>{marca}</option>
                    ))}
                  </select>
                </div>
              </div>
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
            justifyContent: isMobile ? 'center' : 'space-between',
            alignItems: 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '16px' : '0'
          }}>
            {/* Opciones de vista - ahora también en móvil */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '8px' : '8px',
              flexWrap: 'wrap',
              justifyContent: isMobile ? 'center' : 'flex-start',
              width: '100%',
              margin: isMobile ? '0 auto' : '0'
            }}>
                                  <span style={{
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: '600',
                    color: empresa?.colorTexto || '#64748b'
                  }}>
                    Vista:
                  </span>
                  <button
                    onClick={() => setVista('lista')}
                    style={{
                      padding: isMobile ? '8px 12px' : '8px 12px',
                      borderRadius: '8px',
                      border: '2px solid',
                      background: vista === 'lista' ? `linear-gradient(135deg, ${empresa?.colorPrimario || '#667eea'} 0%, ${empresa?.colorPrimario ? `${empresa.colorPrimario}dd` : '#764ba2'} 100%)` : (isMobile ? '#f8fafc' : 'transparent'),
                      borderColor: vista === 'lista' ? (empresa?.colorPrimario || '#667eea') : (empresa?.colorSecundario ? `${empresa.colorSecundario}40` : '#e2e8f0'),
                      color: vista === 'lista' ? 'white' : (empresa?.colorTexto || '#64748b'),
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontSize: isMobile ? '14px' : '14px',
                      fontWeight: '600',
                      boxShadow: isMobile ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                    }}
                  onMouseOver={(e) => {
                    if (vista !== 'lista') {
                      e.currentTarget.style.borderColor = empresa?.colorPrimario || '#667eea';
                      e.currentTarget.style.color = empresa?.colorPrimario || '#667eea';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (vista !== 'lista') {
                      e.currentTarget.style.borderColor = empresa?.colorSecundario ? `${empresa.colorSecundario}40` : '#e2e8f0';
                      e.currentTarget.style.color = empresa?.colorTexto || '#64748b';
                    }
                  }}
                >
                  {isMobile ? '📋' : '📋 Lista'}
                </button>
                <button
                  onClick={() => setVista('intermedia')}
                  style={{
                    padding: isMobile ? '8px 12px' : '8px 12px',
                    borderRadius: '8px',
                    border: '2px solid',
                    background: vista === 'intermedia' ? `linear-gradient(135deg, ${empresa?.colorPrimario || '#667eea'} 0%, ${empresa?.colorPrimario ? `${empresa.colorPrimario}dd` : '#764ba2'} 100%)` : (isMobile ? '#f8fafc' : 'transparent'),
                    borderColor: vista === 'intermedia' ? (empresa?.colorPrimario || '#667eea') : (empresa?.colorSecundario ? `${empresa.colorSecundario}40` : '#e2e8f0'),
                    color: vista === 'intermedia' ? 'white' : (empresa?.colorTexto || '#64748b'),
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: isMobile ? '14px' : '14px',
                    fontWeight: '600'
                  }}
                  onMouseOver={(e) => {
                    if (vista !== 'intermedia') {
                      e.currentTarget.style.borderColor = empresa?.colorPrimario || '#667eea';
                      e.currentTarget.style.color = empresa?.colorPrimario || '#667eea';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (vista !== 'intermedia') {
                      e.currentTarget.style.borderColor = empresa?.colorSecundario ? `${empresa.colorSecundario}40` : '#e2e8f0';
                      e.currentTarget.style.color = empresa?.colorTexto || '#64748b';
                    }
                  }}
                >
                  {isMobile ? '📱' : '📱 Intermedia'}
                </button>
                <button
                  onClick={() => setVista('grande')}
                  style={{
                    padding: isMobile ? '8px 12px' : '8px 12px',
                    borderRadius: '8px',
                    border: '2px solid',
                    background: vista === 'grande' ? `linear-gradient(135deg, ${empresa?.colorPrimario || '#667eea'} 0%, ${empresa?.colorPrimario ? `${empresa.colorPrimario}dd` : '#764ba2'} 100%)` : (isMobile ? '#f8fafc' : 'transparent'),
                    borderColor: vista === 'grande' ? (empresa?.colorPrimario || '#667eea') : (empresa?.colorSecundario ? `${empresa.colorSecundario}40` : '#e2e8f0'),
                    color: vista === 'grande' ? 'white' : (empresa?.colorTexto || '#64748b'),
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: isMobile ? '14px' : '14px',
                    fontWeight: '600'
                  }}
                  onMouseOver={(e) => {
                    if (vista !== 'grande') {
                      e.currentTarget.style.borderColor = empresa?.colorPrimario || '#667eea';
                      e.currentTarget.style.color = empresa?.colorPrimario || '#667eea';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (vista !== 'grande') {
                      e.currentTarget.style.borderColor = empresa?.colorSecundario ? `${empresa.colorSecundario}40` : '#e2e8f0';
                      e.currentTarget.style.color = empresa?.colorTexto || '#64748b';
                    }
                  }}
                >
                  {isMobile ? '⊞' : '⊞ Grande'}
                </button>
              </div>
            
            {/* Contador de productos */}
            <div style={{
              fontSize: isMobile ? '12px' : '14px',
              color: empresa?.colorTexto ? `${empresa.colorTexto}80` : '#64748b',
              fontWeight: '500',
              textAlign: 'left',
              padding: isMobile ? '8px 12px' : '10px 16px',
              background: 'rgba(255,255,255,0.9)',
              borderRadius: '8px',
              backdropFilter: 'blur(4px)',
              border: `1px solid ${empresa?.colorPrimario ? `${empresa.colorPrimario}20` : 'rgba(0,0,0,0.1)'}`,
              width: 'fit-content',
              alignSelf: 'flex-start',
              marginTop: isMobile ? '12px' : '16px',
              whiteSpace: 'nowrap'
            }}>
              {productos.length} producto{productos.length !== 1 ? 's' : ''} encontrado{productos.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Grid de productos */}
        {cargando ? (
          <div style={{
            textAlign: 'center',
            padding: isMobile ? '40px 16px' : '60px 20px',
            background: empresa?.colorAcento || '#fff',
            borderRadius: isMobile ? '12px' : '16px',
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
            <p style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', color: empresa?.colorTexto ? `${empresa.colorTexto}80` : '#64748b', fontWeight: '500' }}>
              Cargando productos...
            </p>
          </div>
        ) : error ? (
          <div style={{
            textAlign: 'center',
            padding: isMobile ? '32px 16px' : '40px 20px',
            background: empresa?.colorAcento || '#fff',
            borderRadius: isMobile ? '12px' : '16px',
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
            <p style={{ margin: '0 0 20px 0', fontSize: isMobile ? '16px' : '18px', color: '#dc2626', fontWeight: '600' }}>
              {error}
            </p>
            <button 
              onClick={cargarProductos} 
              style={{
                background: `linear-gradient(135deg, ${empresa?.colorPrimario || '#667eea'} 0%, ${empresa?.colorPrimario ? `${empresa.colorPrimario}dd` : '#764ba2'} 100%)`,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: isMobile ? '10px 20px' : '12px 24px',
                fontSize: isMobile ? '14px' : '16px',
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
            padding: isMobile ? '40px 16px' : '60px 20px',
            background: empresa?.colorAcento || '#fff',
            borderRadius: isMobile ? '12px' : '16px',
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
            <h3 style={{ margin: '0 0 12px 0', fontSize: isMobile ? '20px' : '24px', fontWeight: '600', color: empresa?.colorTexto || '#1e293b' }}>
              No hay productos disponibles
            </h3>
            <p style={{ margin: 0, fontSize: isMobile ? '14px' : '16px', color: empresa?.colorTexto ? `${empresa.colorTexto}80` : '#64748b' }}>
              En este momento no tenemos productos en esta categoría.
            </p>
          </div>
        ) : (
          <div style={{
            display: vista === 'lista' ? 'grid' : 'grid',
            gridTemplateColumns: vista === 'lista' ? 
              (isMobile ? '1fr' : 'repeat(2, 1fr)') :
              vista === 'intermedia' ? 
              (isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(auto-fill, minmax(200px, 1fr))' : 'repeat(auto-fill, minmax(250px, 1fr))') : 
              vista === 'grande' ? 
              (isMobile ? 'repeat(1, 1fr)' : isTablet ? 'repeat(auto-fill, minmax(250px, 1fr))' : 'repeat(auto-fill, minmax(320px, 1fr))') : 
              'none',
            gap: vista === 'lista' ? (isMobile ? '12px' : '16px') : (isMobile ? (vista === 'grande' ? '16px' : '12px') : isTablet ? '16px' : '20px'),
            marginBottom: '40px',
            justifyContent: isMobile ? 'center' : 'start'
          }}>
            {productos.map(producto => {
              const cantidadEnCarrito = items.find(i => i.id === producto.id)?.cantidad || 0;

              return (
                <div key={producto.id} style={{
                  background: empresa?.colorAcento || '#fff',
                  borderRadius: isMobile ? '16px' : '20px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: `1px solid ${empresa?.colorPrimario ? `${empresa.colorPrimario}20` : 'rgba(255,255,255,0.2)'}`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  display: vista === 'lista' ? 'flex' : 'block',
                  alignItems: vista === 'lista' ? 'stretch' : 'unset',
                  gap: vista === 'lista' ? '0' : 'unset',
                  height: vista === 'lista' ? 'auto' : 'auto',
                  color: empresa?.colorTexto || '#1e293b',
                  width: '100%',
                  minHeight: vista === 'lista' ? (isMobile ? '140px' : '160px') : 'auto',
                  padding: vista === 'lista' ? '0' : '0'
                }}
                onClick={(e) => {
                  // Solo abrir modal si no se hizo clic en el botón de agregar al carrito
                  if (!(e.target as HTMLElement).closest('button')) {
                    setProductoSeleccionado(producto.id);
                    setShowProductoModal(true);
                  }
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = vista === 'lista' ? 'translateX(4px)' : 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                }}>
                  
                  {/* Imagen del producto */}
                  <div style={{ 
                    position: 'relative', 
                    width: vista === 'lista' ? (isMobile ? '140px' : '180px') : '100%',
                    aspectRatio: vista === 'lista' ? (isMobile ? '1 / 1' : '3 / 4') : '1 / 1',
                    height: vista === 'lista' ? (isMobile ? '140px' : '100%') : undefined,
                    minWidth: vista === 'lista' ? (isMobile ? '140px' : '180px') : undefined,
                    maxWidth: vista === 'lista' ? (isMobile ? '140px' : '180px') : undefined,
                    overflow: 'hidden',
                    flexShrink: 0,
                    borderRadius: vista === 'lista' ? '0' : (isMobile ? '8px 8px 0 0' : '12px 12px 0 0'),
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
                          borderRadius: vista === 'lista' ? '0' : (isMobile ? '8px 8px 0 0' : '12px 12px 0 0'),
                          margin: 0,
                          padding: 0
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                        fontSize: vista === 'lista' ? '14px' : vista === 'intermedia' ? '16px' : '18px',
                        borderRadius: vista === 'lista' ? '0' : (isMobile ? '8px 8px 0 0' : '12px 12px 0 0'),
                        margin: 0,
                        padding: '20px',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: vista === 'lista' ? '36px' : vista === 'intermedia' ? '48px' : '56px',
                          marginBottom: '8px',
                          opacity: 0.7
                        }}>
                          📸
                        </div>
                        <div style={{
                          fontSize: vista === 'lista' ? '10px' : vista === 'intermedia' ? '12px' : '14px',
                          fontWeight: '500',
                          opacity: 0.8
                        }}>
                          Sin imagen
                        </div>
                      </div>
                    )}
                    
                    {/* Badge destacado */}
                    {producto.destacado && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        left: '48px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: vista === 'lista' ? '10px' : vista === 'intermedia' ? '12px' : '14px',
                        fontWeight: '600',
                        boxShadow: '0 2px 8px rgba(245,158,11,0.3)'
                      }}>
                        ⭐ Destacado
                      </div>
                    )}



                    {/* Botón de favoritos */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorito(producto.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: favoritos.has(producto.id)
                          ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                          : 'rgba(255,255,255,0.9)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        color: favoritos.has(producto.id) ? 'white' : '#ef4444',
                        fontSize: '16px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        zIndex: 10
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                      }}
                    >
                      {favoritos.has(producto.id) ? '❤️' : '🤍'}
                    </button>
                  </div>
                  
                  {/* Contenido principal */}
                  <div style={{ 
                    flex: 1,
                    padding: vista === 'lista' ? '16px' : 
                    vista === 'intermedia' ? 
                    (isMobile ? '12px' : '20px') : 
                    (isMobile ? '20px' : '24px'),
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: vista === 'lista' ? '100%' : 'auto',
                    minWidth: 0,
                    overflow: 'hidden'
                  }}>
                    {/* Información del producto */}
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      gap: '8px',
                      minWidth: 0,
                      overflow: 'hidden'
                    }}>
                      <h3 style={{
                        margin: '0 0 4px 0',
                        fontSize: vista === 'lista' ? '16px' : vista === 'intermedia' ? (isMobile ? '15px' : '18px') : (isMobile ? '16px' : '20px'),
                        fontWeight: '700',
                        color: empresa?.colorTexto || '#1e293b',
                        lineHeight: '1.2',
                        display: '-webkit-box',
                        WebkitLineClamp: vista === 'lista' ? 2 : vista === 'intermedia' ? 2 : 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textAlign: 'left'
                      }}>
                        {producto.nombre}
                      </h3>
                      
                      {/* Categoría - Solo se muestra si mostrarCategorias está habilitado */}
                      {empresa?.mostrarCategorias && producto.categoria && (
                        <div style={{ 
                          display: 'flex', 
                          gap: '6px', 
                          marginBottom: '8px', 
                          flexWrap: 'wrap',
                          justifyContent: 'flex-start'
                        }}>
                          <span style={{
                            background: `linear-gradient(135deg, ${empresa?.colorCardFiltros || '#f8fafc'} 0%, ${empresa?.colorCardFiltros ? `${empresa.colorCardFiltros}dd` : '#e2e8f0'} 100%)`,
                            color: empresa?.colorTexto || '#374151',
                            padding: '3px 8px',
                            borderRadius: '8px',
                            fontSize: vista === 'lista' ? '10px' : vista === 'intermedia' ? (isMobile ? '10px' : '12px') : (isMobile ? '12px' : '14px'),
                            fontWeight: '600',
                            border: `1px solid ${empresa?.colorCardFiltros ? `${empresa.colorCardFiltros}40` : '#cbd5e1'}`
                          }}>
                            🏷️ {producto.categoria}
                          </span>
                        </div>
                      )}
                      
                      {/* Marca */}
                      {producto.marca && (
                        <div style={{ 
                          display: 'flex', 
                          gap: '6px', 
                          marginBottom: '8px', 
                          flexWrap: 'wrap',
                          justifyContent: 'flex-start'
                        }}>
                          <span style={{
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                            color: '#92400e',
                            padding: '3px 8px',
                            borderRadius: '8px',
                            fontSize: vista === 'lista' ? '10px' : vista === 'intermedia' ? (isMobile ? '10px' : '12px') : (isMobile ? '12px' : '14px'),
                            fontWeight: '600',
                            border: '1px solid #fbbf24'
                          }}>
                            🏷️ {producto.marca}
                          </span>
                        </div>
                      )}
                      
                      {/* Precio y Stock */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '12px',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        {/* Precio - Solo se muestra si mostrarPrecios está habilitado */}
                        {empresa?.mostrarPrecios && (
                          <span style={{
                            fontSize: vista === 'lista' ? '18px' : vista === 'intermedia' ? (isMobile ? '18px' : '24px') : (isMobile ? '20px' : '28px'),
                            fontWeight: '800',
                            color: empresa?.colorTexto || '#1e293b',
                            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                          }}>
                            {formatearPrecio(producto.precio, empresa.moneda)}
                          </span>
                        )}
                        
                        {/* Stock disponible en tiempo real - Solo se muestra si mostrarStock está habilitado */}
                        {empresa?.mostrarStock && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            background: (() => {
                              const stockDisponible = producto.stock - cantidadEnCarrito;
                              if (stockDisponible <= 0) return 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)';
                              if (stockDisponible <= 2) return 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
                              return 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)';
                            })(),
                            border: (() => {
                              const stockDisponible = producto.stock - cantidadEnCarrito;
                              if (stockDisponible <= 0) return '1px solid #fecaca';
                              if (stockDisponible <= 2) return '1px solid #fbbf24';
                              return '1px solid #bbf7d0';
                            })(),
                            fontSize: vista === 'lista' ? '10px' : vista === 'intermedia' ? '11px' : '12px',
                            fontWeight: '600',
                            color: (() => {
                              const stockDisponible = producto.stock - cantidadEnCarrito;
                              if (stockDisponible <= 0) return '#dc2626';
                              if (stockDisponible <= 2) return '#92400e';
                              return '#166534';
                            })()
                          }}>
                            <span>
                              {(() => {
                                const stockDisponible = producto.stock - cantidadEnCarrito;
                                if (stockDisponible <= 0) return '❌';
                                if (stockDisponible <= 2) return '⚠️';
                                return '✓';
                              })()}
                            </span>
                            <span>
                              {(() => {
                                const stockDisponible = producto.stock - cantidadEnCarrito;
                                if (stockDisponible <= 0) return 'Agotado';
                                return `${stockDisponible} disponible${stockDisponible !== 1 ? 's' : ''}`;
                              })()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Controles */}
                    {clienteInfo ? (
                      // Mostrar controles de carrito solo si hay cliente logueado
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        alignItems: 'stretch',
                        justifyContent: 'flex-end',
                        marginTop: 'auto'
                      }}>
                        {/* Controles de cantidad */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          padding: vista === 'lista' && !isMobile ? '4px 6px' : '6px 8px',
                          border: '1px solid #e2e8f0',
                          gap: vista === 'lista' && !isMobile ? '4px' : '6px',
                          justifyContent: 'center',
                          height: vista === 'lista' && !isMobile ? '28px' : '36px'
                        }}>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (cantidadEnCarrito > 0) {
                                await updateQuantity(producto.id, cantidadEnCarrito - 1, undefined, subdominio || undefined);
                              }
                            }}
                            disabled={cantidadEnCarrito === 0}
                            style={{
                              width: vista === 'lista' && !isMobile ? '20px' : '24px',
                              height: vista === 'lista' && !isMobile ? '20px' : '24px',
                              background: cantidadEnCarrito === 0
                                ? 'rgba(0,0,0,0.1)'
                                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              color: cantidadEnCarrito === 0 ? '#6b7280' : 'white',
                              border: 'none',
                              borderRadius: vista === 'lista' && !isMobile ? '4px' : '6px',
                              fontSize: vista === 'lista' && !isMobile ? '10px' : '12px',
                              fontWeight: '700',
                              cursor: cantidadEnCarrito === 0 ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            -
                          </button>
                          <span style={{
                            fontSize: vista === 'lista' && !isMobile ? '11px' : '12px',
                            fontWeight: '600',
                            color: '#1e293b',
                            minWidth: vista === 'lista' && !isMobile ? '16px' : '20px',
                            textAlign: 'center'
                          }}>
                            {cantidadEnCarrito}
                          </span>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const stockDisponible = producto.stock - cantidadEnCarrito;
                              
                              if (stockDisponible > 0) {
                                if (cantidadEnCarrito === 0) {
                                  // Si no está en el carrito, agregarlo
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
                                  // Si ya está en el carrito, aumentar cantidad
                                  await updateQuantity(producto.id, cantidadEnCarrito + 1, undefined, subdominio || undefined);
                                }
                              } else {
                                toast.error('No hay más stock disponible');
                              }
                            }}
                            disabled={(() => {
                              const stockDisponible = producto.stock - cantidadEnCarrito;
                              return stockDisponible <= 0;
                            })()}
                            style={{
                              width: vista === 'lista' && !isMobile ? '20px' : '24px',
                              height: vista === 'lista' && !isMobile ? '20px' : '24px',
                              background: (() => {
                                const stockDisponible = producto.stock - cantidadEnCarrito;
                                if (stockDisponible <= 0) return 'rgba(0,0,0,0.1)';
                                return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                              })(),
                              color: (() => {
                                const stockDisponible = producto.stock - cantidadEnCarrito;
                                if (stockDisponible <= 0) return '#6b7280';
                                return 'white';
                              })(),
                              border: 'none',
                              borderRadius: vista === 'lista' && !isMobile ? '4px' : '6px',
                              fontSize: vista === 'lista' && !isMobile ? '10px' : '12px',
                              fontWeight: '700',
                              cursor: (() => {
                                const stockDisponible = producto.stock - cantidadEnCarrito;
                                if (stockDisponible <= 0) return 'not-allowed';
                                return 'pointer';
                              })(),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.3s ease',
                              opacity: (() => {
                                const stockDisponible = producto.stock - cantidadEnCarrito;
                                if (stockDisponible <= 0) return 0.6;
                                return 1;
                              })()
                            }}
                          >
                            +
                          </button>
                        </div>

                        {/* Botón agregar al carrito */}
                        <button
                          disabled={(() => {
                            const stockDisponible = producto.stock - cantidadEnCarrito;
                            return stockDisponible <= 0;
                          })()}
                          style={{
                            padding: vista === 'lista' && !isMobile ? '6px 8px' : '8px 12px',
                            height: vista === 'lista' && !isMobile ? '32px' : '36px',
                            background: (() => {
                              const stockDisponible = producto.stock - cantidadEnCarrito;
                              if (stockDisponible <= 0) return 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)';
                              if (cantidadEnCarrito > 0) return `linear-gradient(135deg, ${empresa?.colorSecundario || '#64748b'} 0%, ${empresa?.colorSecundario ? `${empresa.colorSecundario}dd` : '#475569'} 100%)`;
                              return `linear-gradient(135deg, ${empresa?.colorPrimario || '#3b82f6'} 0%, ${empresa?.colorPrimario ? `${empresa.colorPrimario}dd` : '#1d4ed8'} 100%)`;
                            })(),
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: vista === 'lista' && !isMobile ? '11px' : '12px',
                            fontWeight: '600',
                            cursor: (() => {
                              const stockDisponible = producto.stock - cantidadEnCarrito;
                              if (stockDisponible <= 0) return 'not-allowed';
                              return 'pointer';
                            })(),
                            transition: 'all 0.3s ease',
                            opacity: (() => {
                              const stockDisponible = producto.stock - cantidadEnCarrito;
                              if (stockDisponible <= 0) return 0.6;
                              return 1;
                            })(),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: vista === 'lista' && !isMobile ? '2px' : '4px',
                            whiteSpace: 'nowrap',
                            minWidth: vista === 'lista' && !isMobile ? '80px' : 'auto'
                          }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            
                            const stockDisponible = producto.stock - cantidadEnCarrito;
                            
                            if (stockDisponible <= 0) {
                              toast.error('Este producto está agotado');
                              return;
                            }
                            
                            if (typeof producto.precio !== 'number' || isNaN(producto.precio)) {
                              // Permitir productos sin precio para gestión de inventario
                              console.log('Producto sin precio - permitido para gestión de inventario');
                            }
                            
                            // Si no hay cantidad en carrito, agregar 1
                            if (cantidadEnCarrito === 0) {
                              const agregado = await addToCart({
                                id: producto.id,
                                nombre: producto.nombre,
                                precio: producto.precio || 0, // Usar 0 si no hay precio
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
                        >
                          {(() => {
                            const stockDisponible = producto.stock - cantidadEnCarrito;
                            if (stockDisponible <= 0) {
                              return (
                                <>
                                  <span>❌</span>
                                  <span>{vista === 'lista' && !isMobile ? 'Sin stock' : 'Agotado'}</span>
                                </>
                              );
                            } else if (cantidadEnCarrito > 0) {
                              return (
                                <>
                                  <span>🛒</span>
                                  <span>{vista === 'lista' && !isMobile ? `${cantidadEnCarrito}` : `${cantidadEnCarrito} en carrito`}</span>
                                </>
                              );
                            } else {
                              return (
                                <>
                                  <span>🛒</span>
                                  <span>{vista === 'lista' && !isMobile ? 'Agregar' : 'Agregar'}</span>
                                </>
                              );
                            }
                          })()}
                        </button>
                      </div>
                    ) : (
                      // Mostrar botón de iniciar sesión si no hay cliente logueado
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        alignItems: 'stretch',
                        marginTop: 'auto'
                      }}>
                        <div style={{
                          padding: '8px 12px',
                          background: '#f0f9ff',
                          border: '1px solid #bae6fd',
                          borderRadius: '8px',
                          textAlign: 'center',
                          fontSize: '11px',
                          color: '#0369a1'
                        }}>
                          🔑 Inicia sesión para comprar
                        </div>
                        <Link to="/login" style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: `linear-gradient(135deg, ${empresa?.colorPrimario || '#3b82f6'} 0%, ${empresa?.colorPrimario ? `${empresa.colorPrimario}dd` : '#1d4ed8'} 100%)`,
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease',
                          textDecoration: 'none'
                        }}
                        >
                          <span>🔑</span>
                          <span>Iniciar Sesión</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer del catálogo */}
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '24px 16px' : '40px 20px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: isMobile ? '16px' : '20px',
          border: '2px dashed #cbd5e1',
          marginTop: isMobile ? '24px' : '40px'
        }}>
          <div style={{
            width: isMobile ? '48px' : '60px',
            height: isMobile ? '48px' : '60px',
            background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: isMobile ? '20px' : '24px'
          }}>
            🎉
          </div>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            fontSize: isMobile ? '18px' : '20px', 
            fontWeight: '600', 
            color: empresa?.colorTexto || '#1e293b' 
          }}>
            ¡Gracias por visitarnos!
          </h3>
          <p style={{ 
            margin: '0 0 20px 0', 
            fontSize: isMobile ? '14px' : '16px', 
            color: '#64748b' 
          }}>
            Encuentra los mejores productos al mejor precio
          </p>
          
          {/* Redes sociales en el footer */}
          {(empresa.instagramUrl || empresa.facebookUrl) && (
            <div style={{
              marginTop: isMobile ? '16px' : '24px',
              paddingTop: isMobile ? '16px' : '24px',
              borderTop: '1px solid #e2e8f0'
            }}>
              <p style={{ 
                margin: '0 0 16px 0', 
                fontSize: isMobile ? '14px' : '16px', 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                Síguenos en nuestras redes sociales
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: isMobile ? '12px' : '16px',
                flexWrap: 'wrap',
                flexDirection: isMobile ? 'column' : 'row'
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
                      padding: isMobile ? '10px 16px' : '12px 20px',
                      background: 'linear-gradient(135deg, #e4405f 0%, #c13584 100%)',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '12px',
                      fontSize: isMobile ? '14px' : '16px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(228, 64, 95, 0.3)',
                      width: isMobile ? '100%' : 'auto',
                      justifyContent: 'center'
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
                      padding: isMobile ? '10px 16px' : '12px 20px',
                      background: 'linear-gradient(135deg, #1877f2 0%, #0d6efd 100%)',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '12px',
                      fontSize: isMobile ? '14px' : '16px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(24, 119, 242, 0.3)',
                      width: isMobile ? '100%' : 'auto',
                      justifyContent: 'center'
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

      {/* Footer con referencia a Negocio360.org */}
      <footer style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: 'white',
        padding: isMobile ? '24px 16px' : '32px 24px',
        marginTop: isMobile ? '32px' : '48px',
        textAlign: 'center',
        borderTop: `3px solid ${empresa?.colorPrimario || '#10b981'}`
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: isMobile ? '16px' : '24px',
          position: 'relative'
        }}>
          {/* Separador decorativo */}
          <div style={{
            width: '60px',
            height: '3px',
            background: empresa?.colorPrimario || '#10b981',
            borderRadius: '2px',
            margin: '0 auto 8px auto'
          }} />
          
          {/* Texto principal */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <p style={{
              margin: 0,
              fontSize: isMobile ? '14px' : '16px',
              color: '#cbd5e1',
              fontWeight: '400'
            }}>
              Esta tienda online fue creada con
            </p>
            
            {/* Logo y enlace a Negocio360.org */}
            <a
              href="https://negocio360.org"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: isMobile ? '8px 16px' : '12px 20px',
                background: `linear-gradient(135deg, ${empresa?.colorPrimario || '#10b981'} 0%, ${empresa?.colorPrimario ? `${empresa.colorPrimario}dd` : '#059669'} 100%)`,
                color: 'white',
                textDecoration: 'none',
                borderRadius: '12px',
                fontSize: isMobile ? '16px' : '18px',
                fontWeight: '700',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                border: '2px solid transparent'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <span style={{ fontSize: isMobile ? '20px' : '24px' }}>🚀</span>
              <span>Negocio360.org</span>
              <span style={{ fontSize: isMobile ? '14px' : '16px' }}>→</span>
            </a>
            
            <p style={{
              margin: 0,
              fontSize: isMobile ? '12px' : '14px',
              color: '#94a3b8',
              fontWeight: '400',
              marginTop: '8px'
            }}>
              La plataforma líder para gestionar tu negocio en minutos
            </p>
          </div>
          
          {/* Información adicional */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '8px' : '16px',
            marginTop: '8px'
          }}>
            <span style={{
              fontSize: isMobile ? '11px' : '12px',
              color: '#64748b',
              fontWeight: '400',
              textAlign: 'center'
            }}>
              ✨ Sin costos ocultos • 🚀 Configuración rápida • 📱 Responsive
            </span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
