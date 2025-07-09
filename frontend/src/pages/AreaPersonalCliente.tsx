import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSubdominio } from '../hooks/useSubdominio';
import api from '../services/api';

interface ClienteInfo {
  id: number;
  nombre: string;
  apellidos?: string;
  email: string;
  telefono?: string;
}

export default function AreaPersonalCliente() {
  const { empresa, cargando: cargandoEmpresa, subdominio } = useSubdominio();
  const [cliente, setCliente] = useState<ClienteInfo | null>(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarPerfilCliente = async () => {
      // Usar subdominio detectado o el de desarrollo
      const subdominioDesarrollo = localStorage.getItem('subdominio-desarrollo');
      const subdominioFinal = subdominio || subdominioDesarrollo;
      
      if (!subdominioFinal) {
        toast.error('No se pudo identificar la tienda');
        return;
      }

      const token = localStorage.getItem('clienteToken');
      if (!token) {
        toast.error('Debes iniciar sesión');
        navigate('/login');
        return;
      }

      setCargando(true);
      try {
        const response = await api.obtenerPerfilCliente(subdominioFinal, token);
        setCliente(response.cliente);
      } catch (error: unknown) {
        console.error('Error al cargar perfil:', error);
        const mensaje = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al cargar perfil';
        toast.error(mensaje);
        
        // Si el token es inválido, redirigir al login
        if ((error as { response?: { status?: number } }).response?.status === 401) {
          localStorage.removeItem('clienteToken');
          localStorage.removeItem('clienteInfo');
          navigate('/login');
        }
      } finally {
        setCargando(false);
      }
    };

    cargarPerfilCliente();
  }, [subdominio, navigate]);

  const cerrarSesion = () => {
    localStorage.removeItem('clienteToken');
    localStorage.removeItem('clienteInfo');
    toast.success('Sesión cerrada');
    navigate('/');
  };

  if (cargandoEmpresa) {
    return (
      <div className="pagina-cargando">
        <div className="spinner"></div>
        <p>Cargando...</p>
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

  if (cargando) {
    return (
      <div className="pagina-cargando">
        <div className="spinner"></div>
        <p>Cargando tu perfil...</p>
      </div>
    );
  }

  return (
    <div className="area-personal-cliente">
      {/* Header de la tienda */}
      <header className="header-tienda">
        <div className="contenedor">
          <div className="info-empresa">
            {empresa.logoUrl && (
              <img 
                src={empresa.logoUrl} 
                alt={`Logo de ${empresa.nombre}`}
                className="logo-empresa"
              />
            )}
            <div>
              <h1 className="nombre-empresa">{empresa.nombre}</h1>
            </div>
          </div>
          
          <nav className="nav-tienda">
            <Link to="/" className="nav-link">Catálogo</Link>
            <Link to="/carrito" className="nav-link">Carrito</Link>
            <button 
              onClick={cerrarSesion}
              className="nav-link boton-transparente"
            >
              Cerrar Sesión
            </button>
          </nav>
        </div>
      </header>

      <main className="contenedor">
        <div className="area-personal">
          <div className="cabecera-area-personal">
            <h2>Mi Cuenta</h2>
            <p>Bienvenido a tu área personal, {cliente?.nombre}</p>
          </div>

          <div className="contenido-area-personal">
            {/* Información del perfil */}
            <div className="tarjeta-perfil">
              <div className="cabecera-tarjeta">
                <h3>Información Personal</h3>
              </div>
              
              <div className="contenido-tarjeta">
                <div className="info-cliente">
                  <div className="campo-info">
                    <strong>Nombre:</strong>
                    <span>{cliente?.nombre} {cliente?.apellidos}</span>
                  </div>
                  
                  <div className="campo-info">
                    <strong>Email:</strong>
                    <span>{cliente?.email}</span>
                  </div>
                  
                  {cliente?.telefono && (
                    <div className="campo-info">
                      <strong>Teléfono:</strong>
                      <span>{cliente.telefono}</span>
                    </div>
                  )}
                </div>
                
                <div className="acciones-perfil">
                  <button className="boton boton-secundario">
                    Editar Perfil
                  </button>
                  <button className="boton boton-secundario">
                    Cambiar Contraseña
                  </button>
                </div>
              </div>
            </div>

            {/* Mis Pedidos */}
            <div className="tarjeta-pedidos">
              <div className="cabecera-tarjeta">
                <h3>Mis Pedidos</h3>
              </div>
              
              <div className="contenido-tarjeta">
                <div className="mensaje-vacio">
                  <p>Aún no tienes pedidos realizados.</p>
                  <Link to="/" className="boton boton-primario">
                    Explorar Productos
                  </Link>
                </div>
              </div>
            </div>

            {/* Favoritos */}
            <div className="tarjeta-favoritos">
              <div className="cabecera-tarjeta">
                <h3>Productos Favoritos</h3>
              </div>
              
              <div className="contenido-tarjeta">
                <div className="mensaje-vacio">
                  <p>No tienes productos favoritos aún.</p>
                  <Link to="/" className="boton boton-primario">
                    Explorar Productos
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
