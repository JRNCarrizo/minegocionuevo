import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import type { Empresa } from '../../types';

interface ConfiguracionEmpresa {
  nombre: string;
  descripcion: string;
  subdominio: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
  pais: string;
  logo: File | null;
  colorPrimario: string;
  colorSecundario: string;
  moneda: string;
  idioma: string;
  notificacionesPedidos: boolean;
  notificacionesStock: boolean;
  stockMinimo: number;
}

export default function ConfiguracionEmpresa() {
  const [configuracion, setConfiguracion] = useState<ConfiguracionEmpresa>({
    nombre: '',
    descripcion: '',
    subdominio: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    pais: 'España',
    logo: null,
    colorPrimario: '#2563eb',
    colorSecundario: '#64748b',
    moneda: 'ARS',
    idioma: 'es',
    notificacionesPedidos: true,
    notificacionesStock: true,
    stockMinimo: 5
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      setCargando(true);
      
      console.log('Cargando configuración de la empresa del administrador...');
      
      // Obtener datos de la empresa desde el backend usando el token del usuario
      const response = await ApiService.obtenerEmpresaAdmin();
      
      if (!response.data) {
        toast.error('No se encontraron datos de la empresa');
        return;
      }
      
      const empresa: Empresa = response.data;
      
      console.log('Datos de la empresa obtenidos:', empresa);
      
      setConfiguracion({
        nombre: empresa.nombre || '',
        descripcion: empresa.descripcion || '',
        subdominio: empresa.subdominio || '',
        email: empresa.email || '',
        telefono: empresa.telefono || '',
        direccion: '',
        ciudad: '',
        codigoPostal: '',
        pais: 'Argentina',
        logo: null,
        colorPrimario: empresa.colorPrimario || '#2563eb',
        colorSecundario: empresa.colorSecundario || '#64748b',
        moneda: empresa.moneda || 'USD',
        idioma: 'es',
        notificacionesPedidos: true,
        notificacionesStock: true,
        stockMinimo: 5
      });
      
      toast.success('Configuración cargada correctamente');
    } catch (error) {
      console.error('Error al cargar la configuración:', error);
      toast.error('Error al cargar la configuración de la empresa');
    } finally {
      setCargando(false);
    }
  };

  const manejarCambio = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setConfiguracion(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setConfiguracion(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const manejarLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setConfiguracion(prev => ({
        ...prev,
        logo: e.target.files![0]
      }));
    }
  };

  const validarFormulario = () => {
    if (!configuracion.nombre.trim()) {
      toast.error('El nombre de la empresa es obligatorio');
      return false;
    }
    if (!configuracion.subdominio.trim()) {
      toast.error('El subdominio es obligatorio');
      return false;
    }
    if (!configuracion.email.trim() || !configuracion.email.includes('@')) {
      toast.error('El email debe ser válido');
      return false;
    }
    return true;
  };

  const guardarConfiguracion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setGuardando(true);
    
    try {
      // Datos a enviar al backend
      const datosEmpresa = {
        nombre: configuracion.nombre,
        descripcion: configuracion.descripcion,
        email: configuracion.email,
        telefono: configuracion.telefono,
        colorPrimario: configuracion.colorPrimario,
        colorSecundario: configuracion.colorSecundario,
        moneda: configuracion.moneda
      };
      
      console.log('Guardando configuración:', datosEmpresa);
      
      // Enviar datos al backend
      const response = await ApiService.actualizarEmpresaAdmin(datosEmpresa);
      
      if (response.data) {
        toast.success('Configuración guardada exitosamente');
        // Recargar la configuración para mostrar los datos actualizados
        cargarConfiguracion();
      } else {
        toast.error('Error al guardar la configuración');
      }
    } catch (error) {
      console.error('Error al guardar la configuración:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="h-pantalla-minimo" style={{ backgroundColor: '#f8fafc' }}>
        <nav className="navbar">
          <div className="contenedor">
            <div className="navbar-contenido">
              <Link to="/admin/dashboard" className="logo">
                ← miNegocio - Admin
              </Link>
            </div>
          </div>
        </nav>
        <div className="contenedor py-8">
          <div className="tarjeta text-center py-12">
            <div className="spinner mx-auto mb-4"></div>
            <p>Cargando configuración...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-pantalla-minimo" style={{ backgroundColor: '#f8fafc' }}>
      {/* Navegación */}
      <nav className="navbar">
        <div className="contenedor">
          <div className="navbar-contenido">
            <Link to="/admin/dashboard" className="logo">
              ← miNegocio - Admin
            </Link>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <div className="contenedor py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="titulo-2 mb-2">Configuración de la Empresa</h1>
            <p className="texto-gris">Personaliza la información y apariencia de tu tienda.</p>
          </div>

          <form onSubmit={guardarConfiguracion} className="space-y-8">
            {/* Información Básica */}
            <div className="tarjeta">
              <h3 className="titulo-3 mb-6">Información Básica</h3>
              <div className="space-y-6">
                <div className="grid grid-2">
                  <div>
                    <label htmlFor="nombre" className="etiqueta">
                      Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      value={configuracion.nombre}
                      onChange={manejarCambio}
                      className="campo"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="subdominio" className="etiqueta">
                      Subdominio *
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        id="subdominio"
                        name="subdominio"
                        value={configuracion.subdominio}
                        onChange={manejarCambio}
                        className="campo"
                        style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                        required
                      />
                      <span 
                        className="px-3 py-2 border border-gray-300 border-l-0 rounded-r-md bg-gray-50 texto-pequeno"
                        style={{ borderColor: 'var(--color-borde)' }}
                      >
                        .minegocio.com
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="descripcion" className="etiqueta">
                    Descripción
                  </label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    value={configuracion.descripcion}
                    onChange={manejarCambio}
                    rows={3}
                    className="campo"
                    placeholder="Describe tu negocio..."
                  />
                </div>

                <div>
                  <label htmlFor="logo" className="etiqueta">
                    Logo de la Empresa
                  </label>
                  <input
                    type="file"
                    id="logo"
                    name="logo"
                    onChange={manejarLogo}
                    className="campo"
                    accept="image/*"
                  />
                  {configuracion.logo && (
                    <p className="texto-pequeno texto-gris mt-2">
                      Archivo seleccionado: {configuracion.logo.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="tarjeta">
              <h3 className="titulo-3 mb-6">Información de Contacto</h3>
              <div className="space-y-6">
                <div className="grid grid-2">
                  <div>
                    <label htmlFor="email" className="etiqueta">
                      Email de Contacto *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={configuracion.email}
                      onChange={manejarCambio}
                      className="campo"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="telefono" className="etiqueta">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="telefono"
                      name="telefono"
                      value={configuracion.telefono}
                      onChange={manejarCambio}
                      className="campo"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="direccion" className="etiqueta">
                    Dirección
                  </label>
                  <input
                    type="text"
                    id="direccion"
                    name="direccion"
                    value={configuracion.direccion}
                    onChange={manejarCambio}
                    className="campo"
                  />
                </div>

                <div className="grid grid-3">
                  <div>
                    <label htmlFor="ciudad" className="etiqueta">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      id="ciudad"
                      name="ciudad"
                      value={configuracion.ciudad}
                      onChange={manejarCambio}
                      className="campo"
                    />
                  </div>
                  <div>
                    <label htmlFor="codigoPostal" className="etiqueta">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      id="codigoPostal"
                      name="codigoPostal"
                      value={configuracion.codigoPostal}
                      onChange={manejarCambio}
                      className="campo"
                    />
                  </div>
                  <div>
                    <label htmlFor="pais" className="etiqueta">
                      País
                    </label>
                    <select
                      id="pais"
                      name="pais"
                      value={configuracion.pais}
                      onChange={manejarCambio}
                      className="campo"
                    >
                      <option value="España">España</option>
                      <option value="Francia">Francia</option>
                      <option value="Portugal">Portugal</option>
                      <option value="Italia">Italia</option>
                      <option value="Alemania">Alemania</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Personalización */}
            <div className="tarjeta">
              <h3 className="titulo-3 mb-6">Personalización</h3>
              <div className="space-y-6">
                <div className="grid grid-2">
                  <div>
                    <label htmlFor="colorPrimario" className="etiqueta">
                      Color Primario
                    </label>
                    <input
                      type="color"
                      id="colorPrimario"
                      name="colorPrimario"
                      value={configuracion.colorPrimario}
                      onChange={manejarCambio}
                      className="campo h-12"
                    />
                  </div>
                  <div>
                    <label htmlFor="colorSecundario" className="etiqueta">
                      Color Secundario
                    </label>
                    <input
                      type="color"
                      id="colorSecundario"
                      name="colorSecundario"
                      value={configuracion.colorSecundario}
                      onChange={manejarCambio}
                      className="campo h-12"
                    />
                  </div>
                </div>

                <div className="grid grid-2">
                  <div>
                    <label htmlFor="moneda" className="etiqueta">
                      Moneda
                    </label>
                    <select
                      id="moneda"
                      name="moneda"
                      value={configuracion.moneda}
                      onChange={manejarCambio}
                      className="campo"
                    >
                      <option value="EUR">Euro (€)</option>
                      <option value="USD">Dólar ($)</option>
                      <option value="ARS">Peso Argentino ($)</option>
                      <option value="GBP">Libra (£)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="idioma" className="etiqueta">
                      Idioma
                    </label>
                    <select
                      id="idioma"
                      name="idioma"
                      value={configuracion.idioma}
                      onChange={manejarCambio}
                      className="campo"
                    >
                      <option value="es">Español</option>
                      <option value="en">Inglés</option>
                      <option value="fr">Francés</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Configuración de Notificaciones */}
            <div className="tarjeta">
              <h3 className="titulo-3 mb-6">Notificaciones</h3>
              <div className="space-y-4">
                <div className="flex items-centro">
                  <input
                    type="checkbox"
                    id="notificacionesPedidos"
                    name="notificacionesPedidos"
                    checked={configuracion.notificacionesPedidos}
                    onChange={manejarCambio}
                    className="mr-3"
                  />
                  <label htmlFor="notificacionesPedidos" className="etiqueta">
                    Recibir notificaciones de nuevos pedidos
                  </label>
                </div>
                
                <div className="flex items-centro">
                  <input
                    type="checkbox"
                    id="notificacionesStock"
                    name="notificacionesStock"
                    checked={configuracion.notificacionesStock}
                    onChange={manejarCambio}
                    className="mr-3"
                  />
                  <label htmlFor="notificacionesStock" className="etiqueta">
                    Recibir alertas de stock bajo
                  </label>
                </div>

                <div>
                  <label htmlFor="stockMinimo" className="etiqueta">
                    Stock mínimo para alertas
                  </label>
                  <input
                    type="number"
                    id="stockMinimo"
                    name="stockMinimo"
                    value={configuracion.stockMinimo}
                    onChange={manejarCambio}
                    className="campo"
                    min="0"
                    style={{ maxWidth: '200px' }}
                  />
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={guardando}
                className="boton boton-primario flex-1"
              >
                {guardando ? 'Guardando Configuración...' : 'Guardar Configuración'}
              </button>
              <Link
                to="/admin/dashboard"
                className="boton boton-secundario flex-1 text-center"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
