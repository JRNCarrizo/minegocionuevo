import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fechaRegistro: string;
  totalPedidos: number;
  totalGastado: number;
  activo: boolean;
}

export default function GestionClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const clientesSimulados: Cliente[] = [
        {
          id: 1,
          nombre: 'María',
          apellido: 'García',
          email: 'maria.garcia@email.com',
          telefono: '+34 666 123 456',
          fechaRegistro: '2024-01-10',
          totalPedidos: 5,
          totalGastado: 234.50,
          activo: true
        },
        {
          id: 2,
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan.perez@email.com',
          telefono: '+34 677 234 567',
          fechaRegistro: '2024-01-08',
          totalPedidos: 3,
          totalGastado: 145.75,
          activo: true
        },
        {
          id: 3,
          nombre: 'Ana',
          apellido: 'López',
          email: 'ana.lopez@email.com',
          telefono: '+34 688 345 678',
          fechaRegistro: '2024-01-05',
          totalPedidos: 8,
          totalGastado: 456.20,
          activo: true
        },
        {
          id: 4,
          nombre: 'Carlos',
          apellido: 'Ruiz',
          email: 'carlos.ruiz@email.com',
          telefono: '+34 699 456 789',
          fechaRegistro: '2023-12-20',
          totalPedidos: 12,
          totalGastado: 678.90,
          activo: false
        },
        {
          id: 5,
          nombre: 'Laura',
          apellido: 'Martín',
          email: 'laura.martin@email.com',
          telefono: '+34 611 567 890',
          fechaRegistro: '2023-12-15',
          totalPedidos: 2,
          totalGastado: 89.30,
          activo: true
        }
      ];
      
      setClientes(clientesSimulados);
    } catch {
      toast.error('Error al cargar los clientes');
    } finally {
      setCargando(false);
    }
  };

  const alternarEstadoCliente = async (id: number) => {
    try {
      // Simular actualización
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setClientes(prev => prev.map(cliente => 
        cliente.id === id ? { ...cliente, activo: !cliente.activo } : cliente
      ));
      
      toast.success('Estado del cliente actualizado');
    } catch {
      toast.error('Error al actualizar el estado del cliente');
    }
  };

  const clientesFiltrados = clientes.filter(cliente => {
    const textoBusqueda = busqueda.toLowerCase();
    return (
      cliente.nombre.toLowerCase().includes(textoBusqueda) ||
      cliente.apellido.toLowerCase().includes(textoBusqueda) ||
      cliente.email.toLowerCase().includes(textoBusqueda) ||
      cliente.telefono.includes(textoBusqueda)
    );
  });

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
            <p>Cargando clientes...</p>
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
        <div className="mb-8">
          <h1 className="titulo-2 mb-2">Gestión de Clientes</h1>
          <p className="texto-gris">Administra tu base de clientes y sus actividades.</p>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-2 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="tarjeta">
            <h3 className="texto-pequeno texto-gris mb-1">Total Clientes</h3>
            <p className="titulo-2" style={{ color: 'var(--color-primario)' }}>
              {clientes.length}
            </p>
          </div>
          <div className="tarjeta">
            <h3 className="texto-pequeno texto-gris mb-1">Clientes Activos</h3>
            <p className="titulo-2" style={{ color: '#10b981' }}>
              {clientes.filter(c => c.activo).length}
            </p>
          </div>
          <div className="tarjeta">
            <h3 className="texto-pequeno texto-gris mb-1">Total Pedidos</h3>
            <p className="titulo-2" style={{ color: '#f59e0b' }}>
              {clientes.reduce((total, cliente) => total + cliente.totalPedidos, 0)}
            </p>
          </div>
          <div className="tarjeta">
            <h3 className="texto-pequeno texto-gris mb-1">Ingresos Totales</h3>
            <p className="titulo-2" style={{ color: '#8b5cf6' }}>
              €{clientes.reduce((total, cliente) => total + cliente.totalGastado, 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Buscador */}
        <div className="tarjeta mb-6">
          <h3 className="titulo-3 mb-4">Buscar Clientes</h3>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="campo"
            placeholder="Buscar por nombre, email o teléfono..."
          />
        </div>

        {/* Lista de clientes */}
        <div className="tarjeta">
          <h3 className="titulo-3 mb-6">
            Clientes ({clientesFiltrados.length})
          </h3>
          
          {clientesFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <p className="texto-gris">
                {busqueda ? 'No se encontraron clientes que coincidan con la búsqueda.' : 'No hay clientes registrados.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {clientesFiltrados.map(cliente => (
                <div
                  key={cliente.id}
                  className="p-6 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-centro entre mb-4">
                    <div>
                      <h4 className="titulo-3 mb-1">
                        {cliente.nombre} {cliente.apellido}
                        {!cliente.activo && (
                          <span 
                            className="ml-2 px-2 py-1 rounded-full texto-pequeno"
                            style={{
                              backgroundColor: '#ef444420',
                              color: '#ef4444'
                            }}
                          >
                            Inactivo
                          </span>
                        )}
                      </h4>
                      <p className="texto-pequeno texto-gris mb-2">
                        {cliente.email} • {cliente.telefono}
                      </p>
                      <p className="texto-pequeno texto-gris">
                        Registrado: {cliente.fechaRegistro}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="titulo-3 mb-1">{cliente.totalPedidos} pedidos</p>
                      <p className="texto-medio">€{cliente.totalGastado.toFixed(2)} gastados</p>
                    </div>
                  </div>

                  <div className="flex items-centro entre">
                    <div className="flex gap-2">
                      <button className="boton boton-secundario texto-pequeno">
                        Ver Historial
                      </button>
                      <button className="boton boton-secundario texto-pequeno">
                        Enviar Email
                      </button>
                    </div>
                    <button
                      onClick={() => alternarEstadoCliente(cliente.id)}
                      className={`boton texto-pequeno ${cliente.activo ? 'boton-secundario' : 'boton-primario'}`}
                    >
                      {cliente.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
