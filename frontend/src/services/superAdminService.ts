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
  totalVentasRapidas: number;
  totalTransacciones: number;
  ultimaConexion: string;
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
      console.log('🔍 SuperAdminService - Iniciando llamada a API...');
      const response = await ApiService.getSuperAdminEmpresas({ page, size });
      console.log('🔍 SuperAdminService - Respuesta recibida:', response);
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

  // Métodos para gestión de planes
  async obtenerPlanes() {
    try {
      const response = await ApiService.getSuperAdminPlanes();
      return response;
    } catch (error) {
      console.error('Error al obtener planes:', error);
      throw error;
    }
  }

  async obtenerPlan(id: number) {
    try {
      const response = await ApiService.getSuperAdminPlan(id);
      return response;
    } catch (error) {
      console.error('Error al obtener plan:', error);
      throw error;
    }
  }

  async crearPlan(plan: any) {
    try {
      const response = await ApiService.createSuperAdminPlan(plan);
      return response;
    } catch (error) {
      console.error('Error al crear plan:', error);
      throw error;
    }
  }

  async actualizarPlan(id: number, plan: any) {
    try {
      const response = await ApiService.updateSuperAdminPlan(id, plan);
      return response;
    } catch (error) {
      console.error('Error al actualizar plan:', error);
      throw error;
    }
  }

  async eliminarPlan(id: number) {
    try {
      const response = await ApiService.deleteSuperAdminPlan(id);
      return response;
    } catch (error) {
      console.error('Error al eliminar plan:', error);
      throw error;
    }
  }

  // Métodos para gestión de suscripciones
  async obtenerSuscripciones(params: any = {}) {
    try {
      const response = await ApiService.getSuperAdminSuscripciones(params);
      return response;
    } catch (error) {
      console.error('Error al obtener suscripciones:', error);
      throw error;
    }
  }

  async obtenerSuscripcion(id: number) {
    try {
      const response = await ApiService.getSuperAdminSuscripcion(id);
      return response;
    } catch (error) {
      console.error('Error al obtener suscripción:', error);
      throw error;
    }
  }

  async crearSuscripcion(suscripcion: any) {
    try {
      const response = await ApiService.createSuperAdminSuscripcion(suscripcion);
      return response;
    } catch (error) {
      console.error('Error al crear suscripción:', error);
      throw error;
    }
  }

  async cancelarSuscripcion(id: number, motivo: string) {
    try {
      const response = await ApiService.cancelarSuperAdminSuscripcion(id, motivo);
      return response;
    } catch (error) {
      console.error('Error al cancelar suscripción:', error);
      throw error;
    }
  }

  async suspenderSuscripcion(id: number) {
    try {
      const response = await ApiService.suspenderSuperAdminSuscripcion(id);
      return response;
    } catch (error) {
      console.error('Error al suspender suscripción:', error);
      throw error;
    }
  }

  async reactivarSuscripcion(id: number) {
    try {
      const response = await ApiService.reactivarSuperAdminSuscripcion(id);
      return response;
    } catch (error) {
      console.error('Error al reactivar suscripción:', error);
      throw error;
    }
  }

  async renovarSuscripcion(id: number) {
    try {
      const response = await ApiService.renovarSuperAdminSuscripcion(id);
      return response;
    } catch (error) {
      console.error('Error al renovar suscripción:', error);
      throw error;
    }
  }

  async obtenerSuscripcionesPorExpirar() {
    try {
      const response = await ApiService.getSuperAdminSuscripcionesPorExpirar();
      return response;
    } catch (error) {
      console.error('Error al obtener suscripciones por expirar:', error);
      throw error;
    }
  }

  async obtenerSuscripcionesExpiradas() {
    try {
      const response = await ApiService.getSuperAdminSuscripcionesExpiradas();
      return response;
    } catch (error) {
      console.error('Error al obtener suscripciones expiradas:', error);
      throw error;
    }
  }

  async procesarRenovacionesAutomaticas() {
    try {
      const response = await ApiService.procesarRenovacionesAutomaticas();
      return response;
    } catch (error) {
      console.error('Error al procesar renovaciones automáticas:', error);
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