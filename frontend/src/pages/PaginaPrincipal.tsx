import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import InfoMultiTenant from '../components/InfoMultiTenant';
import CartIcon from "../components/CartIcon";
import CartModal from "../components/CartModal";

export default function PaginaPrincipal() {
  const [estadisticas, setEstadisticas] = useState({
    empresasRegistradas: 1250,
    productosGestionados: 45680,
    pedidosProcesados: 12430
  });
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    // Animación de contadores
    const intervalo = setInterval(() => {
      setEstadisticas(prev => ({
        empresasRegistradas: prev.empresasRegistradas + Math.floor(Math.random() * 3),
        productosGestionados: prev.productosGestionados + Math.floor(Math.random() * 10),
        pedidosProcesados: prev.pedidosProcesados + Math.floor(Math.random() * 5)
      }));
    }, 5000);

    return () => clearInterval(intervalo);
  }, []);

  const caracteristicas = [
    {
      icono: '🛍️',
      titulo: 'Gestión de Productos',
      descripcion: 'Administra tu inventario con facilidad. Sube fotos, gestiona stock, categorías y precios.',
      beneficios: ['Control de stock automático', 'Imágenes ilimitadas', 'Categorización flexible']
    },
    {
      icono: '👥',
      titulo: 'Portal de Clientes',
      descripcion: 'Tus clientes tienen su propio portal para ver productos y realizar pedidos.',
      beneficios: ['Registro automático', 'Historial de pedidos', 'Comunicación directa']
    },
    {
      icono: '📊',
      titulo: 'Estadísticas Avanzadas',
      descripcion: 'Conoce tu negocio con reportes detallados y métricas en tiempo real.',
      beneficios: ['Productos más vendidos', 'Análisis de ventas', 'Predicción de stock']
    },
    {
      icono: '🎨',
      titulo: 'Personalización Total',
      descripcion: 'Haz que la plataforma refleje tu marca con colores, logo y diseño único.',
      beneficios: ['Logo personalizado', 'Colores de marca', 'Subdominio propio']
    },
    {
      icono: '🌐',
      titulo: 'Acceso Global',
      descripcion: 'Tu tienda está disponible 24/7 desde cualquier dispositivo y ubicación.',
      beneficios: ['Responsive design', 'Múltiples idiomas', 'Acceso móvil']
    },
    {
      icono: '🛡️',
      titulo: 'Seguridad Garantizada',
      descripcion: 'Protegemos tus datos y los de tus clientes con la máxima seguridad.',
      beneficios: ['SSL incluido', 'Copias de seguridad', 'Privacidad total']
    }
  ];

  const planes = [
    {
      nombre: 'Prueba Gratuita',
      precio: '0€',
      periodo: '1 mes',
      descripcion: 'Perfecto para empezar',
      caracteristicas: [
        'Hasta 100 productos',
        'Panel de administración completo',
        'Portal de clientes',
        'Personalización básica',
        'Soporte por email'
      ],
      destacado: true
    },
    {
      nombre: 'Profesional',
      precio: '29€',
      periodo: 'mes',
      descripcion: 'Para negocios en crecimiento',
      caracteristicas: [
        'Productos ilimitados',
        'Estadísticas avanzadas',
        'Múltiples usuarios',
        'Personalización completa',
        'Soporte prioritario',
        'Integraciones avanzadas'
      ],
      destacado: false
    }
  ];

  return (
    <div className="h-pantalla-minimo">
      {/* Navegación */}
      <nav className="navbar">
        <div className="contenedor">
          <div className="navbar-contenido">
            <Link to="/" className="logo">
              miNegocio
            </Link>
            <div className="flex items-centro">
              <Link to="/login" className="boton boton-secundario" style={{ marginRight: '1rem' }}>
                Iniciar Sesión
              </Link>
              <Link to="/registro" className="boton boton-primario">
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="contenedor">
          <div className="animacion-entrada">
            <h1 className="titulo-1 texto-centro mb-6">
              La plataforma completa para gestionar tu negocio
            </h1>
            <p className="texto-grande texto-centro mb-8 mx-auto" style={{ maxWidth: '600px' }}>
              Crea tu tienda online, gestiona productos, clientes y pedidos desde un solo lugar.
              Empieza gratis y haz crecer tu negocio con todas las herramientas que necesitas.
            </p>
            <div className="flex centrado">
              <Link to="/registro" className="boton boton-grande boton-secundario" style={{ marginRight: '1rem' }}>
                Empezar Gratis →
              </Link>
              <Link to="/demo" className="boton boton-grande" style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '2px solid white'
              }}>
                Ver Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="py-8" style={{ backgroundColor: 'white' }}>
        <div className="contenedor">
          <div className="grid grid-3 texto-centro">
            <div className="animacion-flotante">
              <div className="titulo-2" style={{ color: 'var(--color-primario)' }}>
                {estadisticas.empresasRegistradas.toLocaleString()}+
              </div>
              <p className="texto-gris">Empresas Registradas</p>
            </div>
            <div className="animacion-flotante" style={{ animationDelay: '0.2s' }}>
              <div className="titulo-2" style={{ color: 'var(--color-primario)' }}>
                {estadisticas.productosGestionados.toLocaleString()}+
              </div>
              <p className="texto-gris">Productos Gestionados</p>
            </div>
            <div className="animacion-flotante" style={{ animationDelay: '0.4s' }}>
              <div className="titulo-2" style={{ color: 'var(--color-primario)' }}>
                {estadisticas.pedidosProcesados.toLocaleString()}+
              </div>
              <p className="texto-gris">Pedidos Procesados</p>
            </div>
          </div>
        </div>
      </section>

      {/* Características principales */}
      <section className="caracteristicas">
        <div className="contenedor">
          <div className="texto-centro mb-12">
            <h2 className="titulo-2 mb-4">
              Todo lo que necesitas para hacer crecer tu negocio
            </h2>
            <p className="texto-grande texto-gris mx-auto" style={{ maxWidth: '600px' }}>
              Una plataforma integral que se adapta a las necesidades de tu empresa,
              desde pequeños emprendimientos hasta grandes organizaciones.
            </p>
          </div>
          
          <div className="grid grid-3">
            {caracteristicas.map((caracteristica, index) => (
              <div key={index} className="caracteristica animacion-entrada" 
                   style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="icono-caracteristica">
                  <span style={{ fontSize: '2rem' }}>{caracteristica.icono}</span>
                </div>
                <h3 className="titulo-3 mb-4">{caracteristica.titulo}</h3>
                <p className="texto-medio texto-gris mb-4">
                  {caracteristica.descripcion}
                </p>
                <ul className="texto-pequeno">
                  {caracteristica.beneficios.map((beneficio, i) => (
                    <li key={i} className="flex items-centro mb-2">
                      <span style={{ color: 'var(--color-exito)', marginRight: '0.5rem' }}>✓</span>
                      {beneficio}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planes de precios */}
      <section className="py-8" style={{ backgroundColor: '#f8fafc' }}>
        <div className="contenedor">
          <div className="texto-centro mb-12">
            <h2 className="titulo-2 mb-4">
              Planes diseñados para cada etapa de tu negocio
            </h2>
            <p className="texto-grande texto-gris">
              Empieza gratis y escala cuando lo necesites
            </p>
          </div>

          <div className="grid grid-2" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {planes.map((plan, index) => (
              <div key={index} className={`tarjeta ${plan.destacado ? 'tarjeta-elevada' : ''}`}
                   style={plan.destacado ? {
                     border: '2px solid var(--color-primario)',
                     transform: 'scale(1.05)'
                   } : {}}>
                {plan.destacado && (
                  <div className="texto-centro mb-4">
                    <span className="boton-primario px-4 py-2 texto-pequeno">
                      MÁS POPULAR
                    </span>
                  </div>
                )}
                
                <div className="texto-centro mb-6">
                  <h3 className="titulo-3 mb-2">{plan.nombre}</h3>
                  <div className="flex items-centro centrado mb-2">
                    <span className="titulo-1" style={{ color: 'var(--color-primario)' }}>
                      {plan.precio}
                    </span>
                    <span className="texto-gris" style={{ marginLeft: '0.5rem' }}>/{plan.periodo}</span>
                  </div>
                  <p className="texto-gris">{plan.descripcion}</p>
                </div>

                <ul className="mb-8">
                  {plan.caracteristicas.map((caracteristica, i) => (
                    <li key={i} className="flex items-centro mb-3">
                      <span className="flex items-centro centrado"
                            style={{
                              width: '20px',
                              height: '20px',
                              backgroundColor: 'var(--color-exito)',
                              borderRadius: '50%',
                              color: 'white',
                              fontSize: '12px',
                              marginRight: '0.75rem'
                            }}>
                        ✓
                      </span>
                      <span className="texto-medio">{caracteristica}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/registro" 
                      className={`boton boton-completo ${plan.destacado ? 'boton-primario' : 'boton-secundario'}`}>
                  {plan.precio === '0€' ? 'Empezar Gratis' : 'Elegir Plan'} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-8 tarjeta-gradiente">
        <div className="contenedor texto-centro">
          <h2 className="titulo-2 texto-blanco mb-4">
            ¿Listo para transformar tu negocio?
          </h2>
          <p className="texto-grande texto-blanco mb-8 mx-auto" style={{ maxWidth: '600px' }}>
            Únete a miles de empresarios que ya están creciendo con nuestra plataforma.
            Configura tu tienda en menos de 5 minutos.
          </p>
          <Link to="/registro" className="boton boton-grande"
                style={{
                  backgroundColor: 'white',
                  color: 'var(--color-primario)',
                  fontWeight: '600'
                }}>
            Crear mi tienda gratis →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: '#1e293b', color: 'white' }} className="py-8">
        <div className="contenedor">
          <div className="flex entre items-centro">
            <div>
              <div className="logo texto-blanco mb-2">miNegocio</div>
              <p className="texto-pequeno" style={{ color: '#94a3b8' }}>
                La plataforma completa para gestionar tu negocio online
              </p>
            </div>
            <div className="flex">
              <Link to="/privacidad" className="texto-pequeno" style={{ color: '#94a3b8', marginRight: '1.5rem' }}>
                Privacidad
              </Link>
              <Link to="/terminos" className="texto-pequeno" style={{ color: '#94a3b8', marginRight: '1.5rem' }}>
                Términos
              </Link>
              <Link to="/soporte" className="texto-pequeno" style={{ color: '#94a3b8' }}>
                Soporte
              </Link>
            </div>
          </div>
          <div className="mt-8 texto-centro">
            <p className="texto-pequeno" style={{ color: '#64748b' }}>
              © 2024 miNegocio. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Información de desarrollo - Solo mostrar en localhost */}
      {window.location.hostname === 'localhost' && <InfoMultiTenant />}
      <CartIcon onClick={() => setShowCart(true)} />
      <CartModal open={showCart} onClose={() => setShowCart(false)} />
    </div>
  );
}
