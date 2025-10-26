import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ApiService from '../../services/api';
import NavbarAdmin from '../../components/NavbarAdmin';
import GestionPermisosModal from '../../components/GestionPermisosModal';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { useTheme } from '../../hooks/useTheme';
import '../../styles/gestion-administradores.css';

interface Administrador {
  id: number;
  nombreUsuario: string;
  email: string;
  nombre: string;
  apellido: string;
  numeroDocumento: string;
  telefono?: string;
  rol: string;
  activo: boolean;
  empresaId: number;
  empresaNombre: string;
  esPrincipal?: boolean;
}

interface NuevoAdministrador {
  nombre: string;
  apellidos: string;
  numeroDocumento: string;
  telefono: string;
}

export default function GestionAdministradores() {
  const { datosUsuario, cerrarSesion } = useUsuarioActual();
  const { isDarkMode } = useTheme();
  const [administradores, setAdministradores] = useState<Administrador[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevoAdmin, setNuevoAdmin] = useState<NuevoAdministrador>({
    nombre: '',
    apellidos: '',
    numeroDocumento: '',
    telefono: ''
  });
  const [procesando, setProcesando] = useState(false);
  const [mostrarModalPermisos, setMostrarModalPermisos] = useState(false);
  const [administradorSeleccionado, setAdministradorSeleccionado] = useState<Administrador | null>(null);

  useEffect(() => {
    cargarAdministradores();
  }, []);

  // Manejar tecla Esc para salir de la sección
  useEffect(() => {
    const manejarTeclaEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        window.location.href = '/admin';
      }
    };

    document.addEventListener('keydown', manejarTeclaEsc);
    return () => {
      document.removeEventListener('keydown', manejarTeclaEsc);
    };
  }, []);

  const cargarAdministradores = async () => {
    try {
      console.log('🔄 Iniciando carga de administradores...');
      setCargando(true);
      const response = await ApiService.obtenerAdministradoresMiEmpresa();
      console.log('📋 Administradores cargados:', response);
      console.log('👥 Total administradores:', response.administradores?.length || 0);
      setAdministradores(response.administradores || []);
      console.log('✅ Estado actualizado correctamente');
    } catch (error) {
      console.error('❌ Error cargando administradores:', error);
      toast.error('Error al cargar administradores');
    } finally {
      setCargando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nuevoAdmin.nombre.trim() || !nuevoAdmin.apellidos.trim() || !nuevoAdmin.numeroDocumento.trim()) {
      toast.error('Nombre, apellidos y número de documento son obligatorios');
      return;
    }

    try {
      setProcesando(true);
      const response = await ApiService.asignarAdministrador(nuevoAdmin);
      console.log('Administrador asignado:', response);
      
      // Agregar el nuevo administrador al estado inmediatamente
      if (response.administrador) {
        setAdministradores(prev => [...prev, response.administrador]);
        console.log('✅ Administrador agregado al estado local');
      }
      
      toast.success('Administrador asignado exitosamente');
      
      // Mostrar credenciales temporalmente
      if (response.credenciales) {
        toast((t) => (
          <div className="max-w-md">
            <div className="font-semibold text-green-800 mb-2">
              ✅ Administrador creado
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <div><strong>Email:</strong> {response.credenciales.email}</div>
              <div><strong>Contraseña:</strong> {response.credenciales.password}</div>
              <div className="text-xs text-blue-600 mt-2">
                {response.credenciales.instrucciones}
              </div>
            </div>
            <button 
              onClick={() => toast.dismiss(t.id)}
              className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
            >
              Entendido
            </button>
          </div>
        ), {
          duration: 15000,
          position: 'top-center'
        });
      }

      // Reset form
      setNuevoAdmin({
        nombre: '',
        apellidos: '',
        numeroDocumento: '',
        telefono: ''
      });
      setMostrarFormulario(false);
      
      // Recargar lista con un pequeño delay para asegurar que la transacción se complete
      console.log('🔄 Recargando lista de administradores...');
      setTimeout(async () => {
        await cargarAdministradores();
        console.log('✅ Lista recargada exitosamente');
      }, 500);
      
    } catch (error: any) {
      console.error('Error asignando administrador:', error);
      toast.error(error.response?.data?.error || 'Error al asignar administrador');
    } finally {
      setProcesando(false);
    }
  };

  const toggleEstadoAdministrador = async (admin: Administrador) => {
    try {
      if (admin.activo) {
        await ApiService.desactivarAdministrador(admin.id);
        toast.success('Administrador desactivado');
      } else {
        await ApiService.reactivarAdministrador(admin.id);
        toast.success('Administrador reactivado');
      }
      
      cargarAdministradores();
    } catch (error: any) {
      console.error('Error cambiando estado del administrador:', error);
      toast.error(error.response?.data?.error || 'Error al cambiar estado del administrador');
    }
  };

  const eliminarAdministrador = async (admin: Administrador) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar al administrador ${admin.nombre} ${admin.apellido}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await ApiService.eliminarAdministrador(admin.id);
      toast.success('Administrador eliminado exitosamente');
      cargarAdministradores();
    } catch (error: any) {
      console.error('Error eliminando administrador:', error);
      toast.error(error.response?.data?.error || 'Error al eliminar administrador');
    }
  };

  const formatearEmail = (email: string) => {
    // Mostrar solo el email de la empresa, sin el documento
    if (email.includes('+')) {
      const [empresa, dominio] = email.split('@');
      const [emailEmpresa] = empresa.split('+');
      return `${emailEmpresa}@${dominio}`;
    }
    return email;
  };

  const abrirModalPermisos = (admin: Administrador) => {
    setAdministradorSeleccionado(admin);
    setMostrarModalPermisos(true);
  };

  const cerrarModalPermisos = () => {
    setMostrarModalPermisos(false);
    setAdministradorSeleccionado(null);
  };

  return (
    <div className="gestion-administradores">
      <NavbarAdmin 
        onCerrarSesion={cerrarSesion}
        empresaNombre={datosUsuario?.empresaNombre}
        nombreAdministrador={datosUsuario?.nombre}
      />
      
      <div className="contenedor-principal">
        <div className="card-principal">
          {/* Header */}
          <div className="header-card">
            <div className="header-contenido">
              <div>
                <div className="header-info">
                  <div className="icono-header">
                    👥
                  </div>
                  <h1 className="titulo-principal">
                    Gestión de Administradores
                  </h1>
                </div>
                <p className="descripcion-header">
                  Administra los usuarios que pueden acceder al panel de administración
                </p>
              </div>
              <button
                onClick={() => setMostrarFormulario(!mostrarFormulario)}
                className="boton-asignar"
              >
                ➕ Asignar Administrador
              </button>
            </div>
          </div>

          {/* Formulario para nuevo administrador */}
          {mostrarFormulario && (
            <div className="formulario-asignacion">
              <div className="formulario-header">
                <div className="icono-formulario">
                  👤
                </div>
                <h3 className="titulo-formulario">
                  Asignar Nuevo Administrador
                </h3>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="grid-campos">
                  <div className="campo-formulario">
                    <label className="label-campo">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={nuevoAdmin.nombre}
                      onChange={(e) => setNuevoAdmin(prev => ({ ...prev, nombre: e.target.value }))}
                      className="input-campo"
                      placeholder="Nombre del administrador"
                      required
                    />
                  </div>
                  
                  <div className="campo-formulario">
                    <label className="label-campo">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      value={nuevoAdmin.apellidos}
                      onChange={(e) => setNuevoAdmin(prev => ({ ...prev, apellidos: e.target.value }))}
                      className="input-campo"
                      placeholder="Apellidos del administrador"
                      required
                    />
                  </div>
                  
                  <div className="campo-formulario">
                    <label className="label-campo">
                      Número de Documento *
                    </label>
                    <input
                      type="text"
                      value={nuevoAdmin.numeroDocumento}
                      onChange={(e) => setNuevoAdmin(prev => ({ ...prev, numeroDocumento: e.target.value }))}
                      className="input-campo"
                      placeholder="DNI, Cédula, etc."
                      required
                    />
                  </div>
                  
                  <div className="campo-formulario">
                    <label className="label-campo">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={nuevoAdmin.telefono}
                      onChange={(e) => setNuevoAdmin(prev => ({ ...prev, telefono: e.target.value }))}
                      className="input-campo"
                      placeholder="Teléfono (opcional)"
                    />
                  </div>
                </div>
                
                <div className="instrucciones">
                  <div className="instrucciones-contenido">
                    <div className="icono-instrucciones">
                      ℹ️
                    </div>
                    <div className="texto-instrucciones">
                      <p className="titulo-instrucciones">Credenciales de acceso:</p>
                      <ul className="lista-instrucciones">
                        <li className="item-instruccion">
                          <span className="punto-instruccion"></span>
                          Email: Se usará el email de la empresa
                        </li>
                        <li className="item-instruccion">
                          <span className="punto-instruccion"></span>
                          Contraseña: Será el número de documento ingresado
                        </li>
                        <li className="item-instruccion">
                          <span className="punto-instruccion"></span>
                          El administrador podrá iniciar sesión inmediatamente
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="botones-formulario">
                  <button
                    type="submit"
                    disabled={procesando}
                    className="boton-enviar"
                  >
                    {procesando ? (
                      <>
                        <div className="spinner"></div>
                        Asignando...
                      </>
                    ) : (
                      <>
                        ➕ Asignar Administrador
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMostrarFormulario(false)}
                    className="boton-cancelar"
                  >
                    ❌ Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de administradores */}
          <div className="contenido-lista">
            {cargando ? (
              <div className="estado-carga">
                <div className="carga-contenido">
                  <div className="spinner"></div>
                  <span className="texto-carga">Cargando administradores...</span>
                </div>
              </div>
            ) : administradores.length === 0 ? (
              <div className="estado-vacio">
                <div className="icono-vacio">
                  👥
                </div>
                <div className="titulo-vacio">No hay administradores asignados</div>
                <p className="descripcion-vacio">Asigna el primer administrador usando el botón de arriba</p>
              </div>
            ) : (
              <div className="contenedor-tabla">
                <div className="tabla-scroll">
                  <table className="tabla">
                    <thead className="tabla-header">
                      <tr>
                        <th className="th">👤 Administrador</th>
                        <th className="th">📧 Email / Credenciales</th>
                        <th className="th">🆔 Documento / Teléfono</th>
                        <th className="th">📊 Estado</th>
                        <th className="th">⚙️ Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="tabla-body">
                      {administradores.map((admin) => (
                        <tr key={admin.id} className={`fila-admin ${!admin.activo ? 'inactiva' : ''}`}>
                          <td className="td">
                            <div className="admin-info">
                              <div className="avatar-contenedor">
                                <div className={`avatar ${admin.activo ? 'activo' : 'inactivo'}`}>
                                  {admin.nombre.charAt(0).toUpperCase()}{admin.apellido?.charAt(0).toUpperCase()}
                                </div>
                                <div className={`estado-indicador ${admin.activo ? 'activo' : 'inactivo'}`}></div>
                              </div>
                              <div className="admin-detalles">
                                <div className="admin-nombre">
                                  {admin.nombre} {admin.apellido}
                                  {admin.esPrincipal && <span className="badge-principal">👑 Principal</span>}
                                </div>
                                <div className="admin-rol">
                                  {admin.rol}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="td">
                            <div className="email-contenedor">
                              {formatearEmail(admin.email)}
                            </div>
                          </td>
                          <td className="td">
                            <div className="documento-badge">
                              <div>{admin.numeroDocumento || 'N/A'}</div>
                              {admin.telefono && (
                                <div style={{ 
                                  fontSize: '0.75rem', 
                                  color: '#6b7280', 
                                  marginTop: '0.25rem' 
                                }}>
                                  📞 {admin.telefono}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="td">
                            <span className={`estado-badge ${admin.activo ? 'activo' : 'inactivo'}`}>
                              <div className={`estado-punto ${admin.activo ? 'activo' : 'inactivo'}`}></div>
                              {admin.activo ? 'Activo' : 'Desactivado'}
                            </span>
                          </td>
                          <td className="td">
                            <div className="acciones-contenedor">
                              {admin.esPrincipal ? (
                                <div className="admin-principal-badge">
                                  <span className="icono-protegido">🔒</span>
                                  <span className="texto-protegido">Protegido</span>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => abrirModalPermisos(admin)}
                                    className="boton-accion permisos"
                                    title={`Gestionar permisos de ${admin.nombre} ${admin.apellido}`}
                                  >
                                    🔐 Permisos
                                  </button>
                                  <button
                                    onClick={() => toggleEstadoAdministrador(admin)}
                                    className={`boton-accion ${admin.activo ? 'desactivar' : 'activar'}`}
                                    title={admin.activo ? 'Desactivar administrador' : 'Reactivar administrador'}
                                  >
                                    {admin.activo ? '⏸️ Desactivar' : '▶️ Reactivar'}
                                  </button>
                                  <button
                                    onClick={() => eliminarAdministrador(admin)}
                                    className="boton-accion eliminar"
                                    title={`Eliminar ${admin.nombre} ${admin.apellido}`}
                                  >
                                    🗑️ Eliminar
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de gestión de permisos */}
      <GestionPermisosModal
        administrador={administradorSeleccionado}
        isOpen={mostrarModalPermisos}
        onClose={cerrarModalPermisos}
        onPermisosActualizados={cargarAdministradores}
      />
    </div>
  );
}