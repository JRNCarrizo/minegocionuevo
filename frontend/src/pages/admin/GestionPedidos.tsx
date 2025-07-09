import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Pedido {
  id: number;
  cliente: string;
  fecha: string;
  total: number;
  estado: 'pendiente' | 'procesando' | 'enviado' | 'entregado' | 'cancelado';
  productos: number;
}

export default function GestionPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    try {
      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pedidosSimulados: Pedido[] = [
        {
          id: 1,
          cliente: 'María García',
          fecha: '2024-01-15',
          total: 45.99,
          estado: 'pendiente',
          productos: 3
        },
        {
          id: 2,
          cliente: 'Juan Pérez',
          fecha: '2024-01-14',
          total: 89.50,
          estado: 'procesando',
          productos: 2
        },
        {
          id: 3,
          cliente: 'Ana López',
          fecha: '2024-01-14',
          total: 23.75,
          estado: 'enviado',
          productos: 1
        },
        {
          id: 4,
          cliente: 'Carlos Ruiz',
          fecha: '2024-01-13',
          total: 156.20,
          estado: 'entregado',
          productos: 5
        },
        {
          id: 5,
          cliente: 'Laura Martín',
          fecha: '2024-01-13',
          total: 67.30,
          estado: 'cancelado',
          productos: 2
        }
      ];
      
      setPedidos(pedidosSimulados);
    } catch {
      toast.error('Error al cargar los pedidos');
    } finally {
      setCargando(false);
    }
  };

  const cambiarEstadoPedido = async (id: number, nuevoEstado: Pedido['estado']) => {
    try {
      // Simular actualización
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPedidos(prev => prev.map(pedido => 
        pedido.id === id ? { ...pedido, estado: nuevoEstado } : pedido
      ));
      
      toast.success('Estado del pedido actualizado');
    } catch {
      toast.error('Error al actualizar el estado');
    }
  };

  const obtenerColorEstado = (estado: Pedido['estado']) => {
    const colores = {
      pendiente: '#f59e0b',
      procesando: '#3b82f6',
      enviado: '#8b5cf6',
      entregado: '#10b981',
      cancelado: '#ef4444'
    };
    return colores[estado];
  };

  const obtenerTextoEstado = (estado: Pedido['estado']) => {
    const textos = {
      pendiente: 'Pendiente',
      procesando: 'Procesando',
      enviado: 'Enviado',
      entregado: 'Entregado',
      cancelado: 'Cancelado'
    };
    return textos[estado];
  };

  const pedidosFiltrados = filtroEstado === 'todos' 
    ? pedidos 
    : pedidos.filter(pedido => pedido.estado === filtroEstado);

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
            <p>Cargando pedidos...</p>
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
          <h1 className="titulo-2 mb-2">Gestión de Pedidos</h1>
          <p className="texto-gris">Administra todos los pedidos de tu tienda.</p>
        </div>

        {/* Filtros */}
        <div className="tarjeta mb-6">
          <h3 className="titulo-3 mb-4">Filtrar por Estado</h3>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFiltroEstado('todos')}
              className={`boton ${filtroEstado === 'todos' ? 'boton-primario' : 'boton-secundario'}`}
            >
              Todos ({pedidos.length})
            </button>
            {['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'].map(estado => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`boton ${filtroEstado === estado ? 'boton-primario' : 'boton-secundario'}`}
              >
                {obtenerTextoEstado(estado as Pedido['estado'])} ({pedidos.filter(p => p.estado === estado).length})
              </button>
            ))}
          </div>
        </div>

        {/* Lista de pedidos */}
        <div className="tarjeta">
          <h3 className="titulo-3 mb-6">
            Pedidos {filtroEstado !== 'todos' && `- ${obtenerTextoEstado(filtroEstado as Pedido['estado'])}`}
          </h3>
          
          {pedidosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <p className="texto-gris">No hay pedidos que mostrar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pedidosFiltrados.map(pedido => (
                <div
                  key={pedido.id}
                  className="p-6 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-centro entre mb-4">
                    <div>
                      <h4 className="titulo-3 mb-1">Pedido #{pedido.id}</h4>
                      <p className="texto-pequeno texto-gris">
                        Cliente: {pedido.cliente} • {pedido.fecha}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="titulo-3">€{pedido.total.toFixed(2)}</p>
                      <p className="texto-pequeno texto-gris">
                        {pedido.productos} producto{pedido.productos !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-centro entre">
                    <div className="flex items-centro gap-3">
                      <span
                        className="px-3 py-1 rounded-full texto-pequeno"
                        style={{
                          backgroundColor: obtenerColorEstado(pedido.estado) + '20',
                          color: obtenerColorEstado(pedido.estado),
                          fontWeight: '500'
                        }}
                      >
                        {obtenerTextoEstado(pedido.estado)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {pedido.estado === 'pendiente' && (
                        <button
                          onClick={() => cambiarEstadoPedido(pedido.id, 'procesando')}
                          className="boton boton-primario texto-pequeno"
                        >
                          Procesar
                        </button>
                      )}
                      {pedido.estado === 'procesando' && (
                        <button
                          onClick={() => cambiarEstadoPedido(pedido.id, 'enviado')}
                          className="boton boton-primario texto-pequeno"
                        >
                          Marcar como Enviado
                        </button>
                      )}
                      {pedido.estado === 'enviado' && (
                        <button
                          onClick={() => cambiarEstadoPedido(pedido.id, 'entregado')}
                          className="boton boton-primario texto-pequeno"
                        >
                          Marcar como Entregado
                        </button>
                      )}
                      <button className="boton boton-secundario texto-pequeno">
                        Ver Detalles
                      </button>
                    </div>
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
