import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
      precio: '$0',
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
      precio: '$29',
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
    }}>
      {/* Navegación */}
      <nav style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 0'
          }}>
            <Link to="/" style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1e293b',
              textDecoration: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              MiNegocio
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link to="/login" style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'white',
                color: '#3b82f6',
                border: '2px solid #3b82f6',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                Iniciar Sesión
              </Link>
              <Link to="/registro" style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              }}>
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '6rem 0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.3
        }} />
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontSize: '3.5rem',
              fontWeight: '800',
              lineHeight: '1.1',
              marginBottom: '1.5rem',
              animation: 'slideInUp 0.8s ease-out'
            }}>
              La plataforma completa para gestionar tu negocio
            </h1>
            <p style={{
              fontSize: '1.25rem',
              lineHeight: '1.6',
              marginBottom: '2rem',
              maxWidth: '600px',
              marginLeft: 'auto',
              marginRight: 'auto',
              opacity: 0.9,
              animation: 'slideInUp 0.8s ease-out 0.2s both'
            }}>
              Crea tu tienda online, gestiona productos, clientes y pedidos desde un solo lugar.
              Empieza gratis y haz crecer tu negocio con todas las herramientas que necesitas.
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
              animation: 'slideInUp 0.8s ease-out 0.4s both'
            }}>
              <Link to="/registro" style={{
                padding: '1rem 2rem',
                backgroundColor: 'white',
                color: '#3b82f6',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1.125rem',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}>
                Empezar Gratis →
              </Link>
              <Link to="/demo" style={{
                padding: '1rem 2rem',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '2px solid white',
                borderRadius: '0.5rem',
                fontSize: '1.125rem',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                Ver Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section style={{
        backgroundColor: 'white',
        padding: '4rem 0',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              animation: 'fadeInUp 0.6s ease-out'
            }}>
              <div style={{
                fontSize: '3rem',
                fontWeight: '800',
                color: '#3b82f6',
                marginBottom: '0.5rem'
              }}>
                {estadisticas.empresasRegistradas.toLocaleString()}+
              </div>
              <p style={{
                color: '#64748b',
                fontSize: '1.125rem',
                fontWeight: '500'
              }}>
                Empresas Registradas
              </p>
            </div>
            <div style={{
              animation: 'fadeInUp 0.6s ease-out 0.2s both'
            }}>
              <div style={{
                fontSize: '3rem',
                fontWeight: '800',
                color: '#3b82f6',
                marginBottom: '0.5rem'
              }}>
                {estadisticas.productosGestionados.toLocaleString()}+
              </div>
              <p style={{
                color: '#64748b',
                fontSize: '1.125rem',
                fontWeight: '500'
              }}>
                Productos Gestionados
              </p>
            </div>
            <div style={{
              animation: 'fadeInUp 0.6s ease-out 0.4s both'
            }}>
              <div style={{
                fontSize: '3rem',
                fontWeight: '800',
                color: '#3b82f6',
                marginBottom: '0.5rem'
              }}>
                {estadisticas.pedidosProcesados.toLocaleString()}+
              </div>
              <p style={{
                color: '#64748b',
                fontSize: '1.125rem',
                fontWeight: '500'
              }}>
                Pedidos Procesados
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Características principales */}
      <section style={{
        padding: '6rem 0',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              lineHeight: '1.2',
              marginBottom: '1rem',
              color: '#1e293b'
            }}>
              Todo lo que necesitas para hacer crecer tu negocio
            </h2>
            <p style={{
              fontSize: '1.25rem',
              color: '#64748b',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              Una plataforma integral que se adapta a las necesidades de tu empresa,
              desde pequeños emprendimientos hasta grandes organizaciones.
            </p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem'
          }}>
            {caracteristicas.map((caracteristica, index) => (
              <div key={index} style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease',
                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                  fontSize: '2rem'
                }}>
                  {caracteristica.icono}
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  color: '#1e293b'
                }}>
                  {caracteristica.titulo}
                </h3>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  marginBottom: '1.5rem',
                  lineHeight: '1.6'
                }}>
                  {caracteristica.descripcion}
                </p>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {caracteristica.beneficios.map((beneficio, i) => (
                    <li key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '0.75rem',
                      fontSize: '0.875rem',
                      color: '#475569'
                    }}>
                      <span style={{
                        color: '#10b981',
                        marginRight: '0.5rem',
                        fontSize: '1rem',
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </span>
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
      <section style={{
        padding: '6rem 0',
        backgroundColor: 'white'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              lineHeight: '1.2',
              marginBottom: '1rem',
              color: '#1e293b'
            }}>
              Planes diseñados para cada etapa de tu negocio
            </h2>
            <p style={{
              fontSize: '1.25rem',
              color: '#64748b'
            }}>
              Empieza gratis y escala cuando lo necesites
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '2rem',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            {planes.map((plan, index) => (
              <div key={index} style={{
                background: plan.destacado ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                color: plan.destacado ? 'white' : '#1e293b',
                borderRadius: '1.5rem',
                padding: '2.5rem',
                border: plan.destacado ? 'none' : '2px solid #e2e8f0',
                transition: 'all 0.3s ease',
                position: 'relative',
                transform: plan.destacado ? 'scale(1.05)' : 'scale(1)',
                animation: `fadeInUp 0.6s ease-out ${index * 0.2}s both`
              }}
              onMouseOver={(e) => {
                if (!plan.destacado) {
                  e.currentTarget.style.transform = 'scale(1.05) translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseOut={(e) => {
                if (!plan.destacado) {
                  e.currentTarget.style.transform = 'scale(1) translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}>
                {plan.destacado && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#10b981',
                    color: 'white',
                    padding: '0.5rem 1.5rem',
                    borderRadius: '2rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Más Popular
                  </div>
                )}
                
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    marginBottom: '1rem'
                  }}>
                    {plan.nombre}
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{
                      fontSize: '3rem',
                      fontWeight: '800',
                      color: plan.destacado ? 'white' : '#3b82f6'
                    }}>
                      {plan.precio}
                    </span>
                    <span style={{
                      marginLeft: '0.5rem',
                      opacity: 0.8
                    }}>
                      /{plan.periodo}
                    </span>
                  </div>
                  <p style={{
                    opacity: 0.8,
                    fontSize: '1rem'
                  }}>
                    {plan.descripcion}
                  </p>
                </div>

                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  marginBottom: '2rem'
                }}>
                  {plan.caracteristicas.map((caracteristica, i) => (
                    <li key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '1rem',
                      fontSize: '1rem'
                    }}>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        backgroundColor: plan.destacado ? 'rgba(255, 255, 255, 0.2)' : '#10b981',
                        borderRadius: '50%',
                        color: plan.destacado ? 'white' : 'white',
                        fontSize: '12px',
                        marginRight: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </span>
                      <span style={{ opacity: 0.9 }}>
                        {caracteristica}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link to="/registro" 
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '1rem 2rem',
                        background: plan.destacado ? 'white' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: plan.destacado ? '#3b82f6' : 'white',
                        border: 'none',
                        borderRadius: '0.75rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                        textDecoration: 'none',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        boxShadow: plan.destacado ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(102, 126, 234, 0.3)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = plan.destacado ? 
                          '0 6px 16px rgba(0, 0, 0, 0.2)' : 
                          '0 6px 16px rgba(102, 126, 234, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = plan.destacado ? 
                          '0 4px 12px rgba(0, 0, 0, 0.15)' : 
                          '0 4px 12px rgba(102, 126, 234, 0.3)';
                      }}>
                  {plan.precio === '$0' ? 'Empezar Gratis' : 'Elegir Plan'} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section style={{
        padding: '6rem 0',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.3
        }} />
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            lineHeight: '1.2',
            marginBottom: '1rem'
          }}>
            ¿Listo para transformar tu negocio?
          </h2>
          <p style={{
            fontSize: '1.25rem',
            marginBottom: '2rem',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
            opacity: 0.9,
            lineHeight: '1.6'
          }}>
            Únete a miles de empresarios que ya están creciendo con nuestra plataforma.
            Configura tu tienda en menos de 5 minutos.
          </p>
          <Link to="/registro" style={{
            display: 'inline-block',
            padding: '1rem 2rem',
            backgroundColor: 'white',
            color: '#3b82f6',
            border: 'none',
            borderRadius: '0.75rem',
            fontSize: '1.125rem',
            fontWeight: '600',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}>
            Crear mi tienda gratis →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#1e293b',
        color: 'white',
        padding: '3rem 0 2rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '0.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                miNegocio
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                lineHeight: '1.5'
              }}>
                La plataforma completa para gestionar tu negocio online
              </p>
            </div>
            <div style={{
              display: 'flex',
              gap: '1.5rem',
              flexWrap: 'wrap'
            }}>
              <Link to="/privacidad" style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'white'}
              onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}>
                Privacidad
              </Link>
              <Link to="/terminos" style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'white'}
              onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}>
                Términos
              </Link>
              <Link to="/soporte" style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'white'}
              onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}>
                Soporte
              </Link>
            </div>
          </div>
          <div style={{
            textAlign: 'center',
            paddingTop: '2rem',
            borderTop: '1px solid #334155'
          }}>
            <p style={{
              fontSize: '0.875rem',
              color: '#64748b'
            }}>
              © 2024 miNegocio. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Icono del carrito */}
      
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 768px) {
          .hero h1 {
            font-size: 2.5rem !important;
          }
          
          .hero p {
            font-size: 1.125rem !important;
          }
          
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
          
          .features-grid {
            grid-template-columns: 1fr !important;
          }
          
          .pricing-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
