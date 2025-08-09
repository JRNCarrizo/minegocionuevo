import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../services/api';
import '../styles/login-documento.css';

export default function LoginDocumento() {
  const [formData, setFormData] = useState({
    emailEmpresa: '',
    numeroDocumento: ''
  });
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.emailEmpresa.trim() || !formData.numeroDocumento.trim()) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    try {
      setCargando(true);
      console.log('Intentando login con documento:', formData);
      
      const response = await ApiService.loginConDocumento(
        formData.emailEmpresa, 
        formData.numeroDocumento
      );
      
      console.log('Login exitoso:', response);
      
      // Guardar datos en localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify({
        id: response.id,
        nombre: response.nombre,
        apellidos: response.apellidos,
        email: response.email,
        rol: response.roles?.[0] || 'ADMINISTRADOR',
        empresaId: response.empresaId,
        empresaNombre: response.empresaNombre
      }));
      
      toast.success('Login exitoso');
      navigate('/admin/dashboard');
      
    } catch (error: any) {
      console.error('Error en login:', error);
      const errorMessage = error.response?.data?.error || 'Error de autenticación';
      toast.error(errorMessage);
    } finally {
      setCargando(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="login-documento">
      <div className="contenedor-login">
        {/* Logo y título */}
        <div className="header-login">
          <div className="logo-contenedor">
            <img 
              src="/images/logo.png" 
              alt="Negocio360 Logo" 
              className="logo"
            />
          </div>
          <h1 className="titulo-marca">
            Negocio360
          </h1>
          <h2 className="titulo-pagina">
            Acceso
          </h2>
          <p className="descripcion-pagina">
            Inicia sesión como administrador usando el email de tu empresa y tu número de documento
          </p>
        </div>

        {/* Card de login */}
        <div className="card-login">
          <form onSubmit={handleSubmit} className="formulario">
            <div className="campos-contenedor">
              <div className="campo">
                <label htmlFor="emailEmpresa" className="label">
                  Email de la empresa
                </label>
                <div className="input-contenedor">
                  <div className="input-icono">
                    📧
                  </div>
                  <input
                    id="emailEmpresa"
                    name="emailEmpresa"
                    type="email"
                    required
                    value={formData.emailEmpresa}
                    onChange={handleChange}
                    className="input"
                    placeholder="ejemplo@miempresa.com"
                  />
                </div>
              </div>
              
              <div className="campo">
                <label htmlFor="numeroDocumento" className="label">
                  Número de documento
                </label>
                <div className="input-contenedor">
                  <div className="input-icono">
                    🆔
                  </div>
                  <input
                    id="numeroDocumento"
                    name="numeroDocumento"
                    type="text"
                    required
                    value={formData.numeroDocumento}
                    onChange={handleChange}
                    className="input"
                    placeholder="12345678"
                  />
                </div>
              </div>
            </div>

            <div className="instrucciones">
              <div className="instrucciones-contenido">
                <div className="icono-instrucciones">
                  ℹ️
                </div>
                <div className="texto-instrucciones">
                  <p className="titulo-instrucciones">Instrucciones de acceso:</p>
                  <ul className="lista-instrucciones">
                    <li className="item-instruccion">
                      <span className="punto-instruccion"></span>
                      Usa el email registrado de tu empresa
                    </li>
                    <li className="item-instruccion">
                      <span className="punto-instruccion"></span>
                      Tu contraseña es tu número de documento
                    </li>
                    <li className="item-instruccion">
                      <span className="punto-instruccion"></span>
                      Solo administradores asignados pueden acceder
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="boton-submit"
            >
              {cargando ? (
                <div className="flex items-center justify-center">
                  <div className="spinner-boton"></div>
                  Iniciando sesión...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  🚀 Iniciar sesión
                </div>
              )}
            </button>

            <div className="enlaces-contenedor">
              <div>
                <Link
                  to="/admin/login"
                  className="enlace"
                >
                  ¿Eres el administrador principal? Accede con email y contraseña
                </Link>
              </div>
              <div>
                <Link
                  to="/"
                  className="enlace enlace-secundario"
                >
                  ← Volver al inicio
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}