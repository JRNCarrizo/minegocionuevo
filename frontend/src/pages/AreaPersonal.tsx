import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSubdominio } from '../hooks/useSubdominio';
import api from '../services/api';
import * as cookies from '../utils/cookies';

interface ClienteInfo {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
}

export default function AreaPersonal() {
  const { empresa, cargando: cargandoEmpresa, subdominio } = useSubdominio();
  const [cliente, setCliente] = useState<ClienteInfo | null>(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarPerfilCliente = async () => {
      // Buscar token en cookies primero (se comparte entre subdominios)
      let token = cookies.getCookie('clienteToken');
      let clienteInfo = cookies.getCookie('clienteInfo');
      
      // Si no está en cookies, buscar en localStorage
      if (!token) {
        token = localStorage.getItem('clienteToken');
      }
      if (!clienteInfo) {
        clienteInfo = localStorage.getItem('clienteInfo');
      }
      
      if (!token || !clienteInfo) {
        toast.error('Debes iniciar sesión para acceder a esta área');
        navigate('/cliente/login');
        return;
      }

      try {
        // Verificar si el token es válido y obtener información actualizada
        if (subdominio) {
          const response = await api.obtenerPerfilCliente(subdominio, token);
          setCliente(response.cliente);
        } else {
          // Si no hay subdominio, usar datos del localStorage
          setCliente(JSON.parse(clienteInfo));
        }
      } catch (error) {
        console.error('Error al cargar perfil:', error);
        // Si hay error, limpiar datos y redirigir al login
        localStorage.removeItem('clienteToken');
        localStorage.removeItem('clienteInfo');
        cookies.deleteCookie('clienteToken');
        cookies.deleteCookie('clienteInfo');
        toast.error('Sesión expirada. Inicia sesión nuevamente');
        navigate('/cliente/login');
      } finally {
        setCargando(false);
      }
    };

    cargarPerfilCliente();
  }, [subdominio, navigate]);

  const cerrarSesion = () => {
    localStorage.removeItem('clienteToken');
    localStorage.removeItem('clienteInfo');
    cookies.deleteCookie('clienteToken');
    cookies.deleteCookie('clienteInfo');
    toast.success('Has cerrado sesión');
    navigate('/');
  };

  if (cargandoEmpresa || cargando) {
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

  return (
    <div className="area-personal">
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
              <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                <h1 className="nombre-empresa" style={{ 
                  cursor: 'pointer',
                  transition: 'color 0.2s ease',
                  margin: '0'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#667eea'}
                onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>
                  {empresa.nombre}
                </h1>
              </Link>
            </div>
          </div>
          
          <nav className="nav-tienda">
            <Link to="/" className="nav-link">Catálogo</Link>
            <Link to="/carrito" className="nav-link">Carrito</Link>
            <button onClick={cerrarSesion} className="nav-link boton-texto">
              Cerrar sesión
            </button>
          </nav>
        </div>
      </header>

      <main className="contenedor">
        <div className="area-personal-contenido">
          <div className="bienvenida">
            <h2>¡Bienvenido, {cliente?.nombre}!</h2>
            <p>Esta es tu área personal en {empresa.nombre}</p>
          </div>

          <div className="grid-area-personal">
            <div className="tarjeta-perfil">
              <h3>Mi Perfil</h3>
              <div className="info-cliente">
                <p><strong>Nombre:</strong> {cliente?.nombre} {cliente?.apellidos}</p>
                <p><strong>Email:</strong> {cliente?.email}</p>
                {cliente?.telefono && (
                  <p><strong>Teléfono:</strong> {cliente.telefono}</p>
                )}
              </div>
              <button className="boton boton-secundario">
                Editar perfil
              </button>
            </div>

            <div className="tarjeta-pedidos">
              <h3>Mis Pedidos</h3>
              <p>Aquí podrás ver el historial de tus pedidos</p>
              <button className="boton boton-secundario">
                Ver pedidos
              </button>
            </div>

            <div className="tarjeta-favoritos">
              <h3>Mis Favoritos</h3>
              <p>Guarda tus productos favoritos</p>
              <button className="boton boton-secundario">
                Ver favoritos
              </button>
            </div>

            <div className="tarjeta-direcciones">
              <h3>Mis Direcciones</h3>
              <p>Administra tus direcciones de envío</p>
              <button className="boton boton-secundario">
                Gestionar direcciones
              </button>
            </div>
          </div>

          <div className="acciones-rapidas">
            <h3>Acciones Rápidas</h3>
            <div className="botones-acciones">
              <Link to="/" className="boton boton-primario">
                Continuar comprando
              </Link>
              <Link to="/carrito" className="boton boton-secundario">
                Ver carrito
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
