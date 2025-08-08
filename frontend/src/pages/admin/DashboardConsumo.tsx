import React, { useState, useEffect } from 'react';
import { useUsuarioActual } from '../../hooks/useUsuarioActual';
import { api } from '../../config/api';
import NavbarAdmin from '../../components/NavbarAdmin';
import '../../estilos/principal.css';

interface ConsumoData {
  plan: {
    id: number;
    nombre: string;
    maxProductos: number;
    maxClientes: number;
    maxUsuarios: number;
    maxAlmacenamientoGB: number;
  };
  consumo: {
    productosActuales: number;
    productosMax: number;
    productosPorcentaje: number;
    clientesActuales: number;
    clientesMax: number;
    clientesPorcentaje: number;
    usuariosActuales: number;
    usuariosMax: number;
    usuariosPorcentaje: number;
    almacenamientoActualGB: number;
    almacenamientoMaxGB: number;
    almacenamientoPorcentaje: number;
  };
  suscripcion: {
    diasRestantes: number;
    estaPorExpirar: boolean;
    fechaFin: string;
  };
}

const DashboardConsumo: React.FC = () => {
  const { usuario } = useUsuarioActual();
  const [consumoData, setConsumoData] = useState<ConsumoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarDatosConsumo();
  }, []);

  const cargarDatosConsumo = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get('/api/super-admin/suscripciones/mi-consumo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConsumoData(response.data);
    } catch (err) {
      console.error('Error cargando datos de consumo:', err);
      setError('Error al cargar los datos de consumo');
    } finally {
      setLoading(false);
    }
  };

  const getColorPorcentaje = (porcentaje: number) => {
    if (porcentaje >= 90) return 'text-red-600';
    if (porcentaje >= 75) return 'text-orange-600';
    if (porcentaje >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getColorFondoPorcentaje = (porcentaje: number) => {
    if (porcentaje >= 90) return 'bg-red-100';
    if (porcentaje >= 75) return 'bg-orange-100';
    if (porcentaje >= 50) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  const getColorBarraPorcentaje = (porcentaje: number) => {
    if (porcentaje >= 90) return 'bg-red-500';
    if (porcentaje >= 75) return 'bg-orange-500';
    if (porcentaje >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarAdmin />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !consumoData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarAdmin />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
            <p className="text-gray-600">{error || 'No se pudieron cargar los datos de consumo'}</p>
            <button 
              onClick={cargarDatosConsumo}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarAdmin />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard de Consumo</h1>
          <p className="text-gray-600">Monitorea el uso de recursos de tu plan actual</p>
        </div>

        {/* Plan Actual */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Plan Actual</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {consumoData.plan.nombre}
            </span>
          </div>
          
          {/* Estado de Suscripción */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Días Restantes</div>
              <div className={`text-2xl font-bold ${consumoData.suscripcion.diasRestantes <= 7 ? 'text-red-600' : 'text-gray-800'}`}>
                {consumoData.suscripcion.diasRestantes}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Estado</div>
              <div className={`text-lg font-semibold ${consumoData.suscripcion.estaPorExpirar ? 'text-red-600' : 'text-green-600'}`}>
                {consumoData.suscripcion.estaPorExpirar ? 'Por Expirar' : 'Activa'}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Fecha de Expiración</div>
              <div className="text-lg font-semibold text-gray-800">
                {new Date(consumoData.suscripcion.fechaFin).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Alerta de Expiración */}
          {consumoData.suscripcion.estaPorExpirar && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-red-800 font-medium">
                  Tu suscripción expira en {consumoData.suscripcion.diasRestantes} días. 
                  Considera renovar para evitar interrupciones en el servicio.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Métricas de Consumo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Productos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Productos</h3>
              <span className={`px-2 py-1 rounded text-sm font-medium ${getColorFondoPorcentaje(consumoData.consumo.productosPorcentaje)} ${getColorPorcentaje(consumoData.consumo.productosPorcentaje)}`}>
                {consumoData.consumo.productosPorcentaje.toFixed(1)}%
              </span>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{consumoData.consumo.productosActuales} utilizados</span>
                <span>{consumoData.consumo.productosMax} máximo</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getColorBarraPorcentaje(consumoData.consumo.productosPorcentaje)}`}
                  style={{ width: `${Math.min(consumoData.consumo.productosPorcentaje, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Clientes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Clientes</h3>
              <span className={`px-2 py-1 rounded text-sm font-medium ${getColorFondoPorcentaje(consumoData.consumo.clientesPorcentaje)} ${getColorPorcentaje(consumoData.consumo.clientesPorcentaje)}`}>
                {consumoData.consumo.clientesPorcentaje.toFixed(1)}%
              </span>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{consumoData.consumo.clientesActuales} utilizados</span>
                <span>{consumoData.consumo.clientesMax} máximo</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getColorBarraPorcentaje(consumoData.consumo.clientesPorcentaje)}`}
                  style={{ width: `${Math.min(consumoData.consumo.clientesPorcentaje, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Usuarios */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Usuarios</h3>
              <span className={`px-2 py-1 rounded text-sm font-medium ${getColorFondoPorcentaje(consumoData.consumo.usuariosPorcentaje)} ${getColorPorcentaje(consumoData.consumo.usuariosPorcentaje)}`}>
                {consumoData.consumo.usuariosPorcentaje.toFixed(1)}%
              </span>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{consumoData.consumo.usuariosActuales} utilizados</span>
                <span>{consumoData.consumo.usuariosMax} máximo</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getColorBarraPorcentaje(consumoData.consumo.usuariosPorcentaje)}`}
                  style={{ width: `${Math.min(consumoData.consumo.usuariosPorcentaje, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Almacenamiento */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Almacenamiento</h3>
              <span className={`px-2 py-1 rounded text-sm font-medium ${getColorFondoPorcentaje(consumoData.consumo.almacenamientoPorcentaje)} ${getColorPorcentaje(consumoData.consumo.almacenamientoPorcentaje)}`}>
                {consumoData.consumo.almacenamientoPorcentaje.toFixed(1)}%
              </span>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{consumoData.consumo.almacenamientoActualGB} GB utilizados</span>
                <span>{consumoData.consumo.almacenamientoMaxGB} GB máximo</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getColorBarraPorcentaje(consumoData.consumo.almacenamientoPorcentaje)}`}
                  style={{ width: `${Math.min(consumoData.consumo.almacenamientoPorcentaje, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Acciones</h3>
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Actualizar Plan
            </button>
            <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Renovar Suscripción
            </button>
            <button className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
              Ver Historial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardConsumo; 