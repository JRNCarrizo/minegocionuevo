import axios from 'axios';

// Determinar la URL base según el entorno (misma lógica que api.ts)
const getBaseUrl = () => {
  // Si estamos en desarrollo local (localhost:5173), usar localhost:8080
  if (window.location.hostname === 'localhost' && window.location.port === '5173') {
    return 'http://localhost:8080/api/super-admin';
  }
  
  // Si hay una variable de entorno configurada, usarla
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace('/api', '/api/super-admin');
  }
  
  // Por defecto, usar producción
  return 'https://minegocio-backend.onrender.com/api/super-admin';
};

const API_BASE_URL = getBaseUrl();

// Log para debug
console.log('🌐 SuperAdmin API Base URL configurada:', API_BASE_URL);
console.log('🌐 Hostname actual:', window.location.hostname);
console.log('🌐 Puerto actual:', window.location.port);

// Configurar axios para incluir el token JWT
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor para agregar el token JWT a todas las peticiones
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🔑 Token encontrado:', token ? 'SÍ' : 'NO');
    console.log('🔑 Token completo:', token);
    console.log('Token en localStorage:', localStorage.getItem('token'));
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('📤 Enviando petición con token:', config.url);
      console.log('📤 Headers de autorización:', config.headers.Authorization);
      console.log('📤 Todos los headers:', config.headers);
    } else {
      console.log('❌ No hay token en localStorage');
      console.log('❌ localStorage completo:', localStorage);
    }
    return config;
  },
  (error) => {
    console.error('❌ Error en interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('✅ Respuesta exitosa:', response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Error en petición:', error.config?.url);
    console.error('❌ Status:', error.response?.status);
    console.error('❌ Status Text:', error.response?.statusText);
    console.error('❌ Data:', error.response?.data);
    console.error('❌ Headers:', error.response?.headers);
    return Promise.reject(error);
  }
);

export interface DashboardStats {
  totalEmpresas: number;
  totalUsuarios: number;
  totalClientes: number;
  totalProductos: number;
  totalPedidos: number;
  totalVentasRapidas: number;
  empresasActivas: number;
  empresasEnPrueba: number;
  empresasSuspendidas: number;
  empresasCanceladas: number;
  empresasPorExpirar: number;
  ingresosMensuales: number;
  ingresosAnuales: number;
  ingresosTotales: number;
  promedioIngresosPorEmpresa: number;
  tasaConversionPrueba: number;
  nuevasEmpresasEsteMes: number;
  nuevasEmpresasEsteAno: number;
  empresasCanceladasEsteMes: number;
  tasaRetencion: number;
  empresasActivasHoy: number;
  empresasInactivasMasDe30Dias: number;
  empresasNuevasEstaSemana: number;
}

export interface Empresa {
  id: number;
  nombre: string;
  subdominio: string;
  email: string;
  telefono: string;
  logoUrl: string;
  estadoSuscripcion: string;
  fechaCreacion: string;
  totalProductos: number;
  totalClientes: number;
  totalPedidos: number;
  descripcion: string;
  colorPrimario: string;
  moneda: string;
  activa: boolean;
}

export interface EmpresasResponse {
  data: Empresa[];
  mensaje: string;
}

class SuperAdminService {
  private baseUrl = API_BASE_URL;

  async obtenerDashboard(): Promise<DashboardStats> {
    try {
      const response = await axiosInstance.get('/dashboard');
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener dashboard:', error);
      throw error;
    }
  }

  async obtenerEmpresas(page = 0, size = 10): Promise<EmpresasResponse> {
    try {
      const response = await axiosInstance.get(`/empresas?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener empresas:', error);
      throw error;
    }
  }

  async obtenerEstadisticasSuscripciones() {
    try {
      const response = await axiosInstance.get('/suscripciones/estadisticas');
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas de suscripciones:', error);
      throw error;
    }
  }

  async obtenerEmpresasPorExpirar() {
    try {
      const response = await axiosInstance.get('/empresas/por-expirar');
      return response.data;
    } catch (error) {
      console.error('Error al obtener empresas por expirar:', error);
      throw error;
    }
  }

  async obtenerTopEmpresas(limite = 5) {
    try {
      const response = await axiosInstance.get(`/empresas/top?limite=${limite}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener top empresas:', error);
      throw error;
    }
  }

  async testPing() {
    try {
      const response = await axiosInstance.get('/ping');
      return response.data;
    } catch (error) {
      console.error('Error al hacer ping:', error);
      throw error;
    }
  }
}

export const superAdminService = new SuperAdminService(); 