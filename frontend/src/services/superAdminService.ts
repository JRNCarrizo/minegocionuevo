import ApiService from './api';

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
  async obtenerDashboard(): Promise<DashboardStats> {
    try {
      const response = await ApiService.getSuperAdminDashboard();
      return response.data;
    } catch (error) {
      console.error('Error al obtener dashboard:', error);
      throw error;
    }
  }

  async obtenerEmpresas(page = 0, size = 10): Promise<EmpresasResponse> {
    try {
      const response = await ApiService.getSuperAdminEmpresas({ page, size });
      return response;
    } catch (error) {
      console.error('Error al obtener empresas:', error);
      throw error;
    }
  }

  async obtenerEstadisticasSuscripciones() {
    try {
      const response = await ApiService.getSuperAdminEstadisticasSuscripciones();
      return response;
    } catch (error) {
      console.error('Error al obtener estadísticas de suscripciones:', error);
      throw error;
    }
  }

  async obtenerEmpresasPorExpirar() {
    try {
      const response = await ApiService.getSuperAdminEmpresasPorExpirar();
      return response;
    } catch (error) {
      console.error('Error al obtener empresas por expirar:', error);
      throw error;
    }
  }

  async obtenerTopEmpresas(limite = 5) {
    try {
      const response = await ApiService.getSuperAdminTopEmpresasPorIngresos(limite);
      return response;
    } catch (error) {
      console.error('Error al obtener top empresas:', error);
      throw error;
    }
  }

  async testPing() {
    try {
      // Nota: Este endpoint específico no existe en ApiService, usar uno similar
      const response = await ApiService.getSuperAdminDashboard();
      return response;
    } catch (error) {
      console.error('Error al hacer ping:', error);
      throw error;
    }
  }
}

export const superAdminService = new SuperAdminService(); 