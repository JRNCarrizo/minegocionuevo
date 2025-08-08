import apiService from './api';

// ===== TIPOS PARA SUSCRIPCIONES =====

export interface Plan {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  periodo: string;
  periodoTexto: string;
  precioAnual: number;
  activo: boolean;
  destacado: boolean;
  orden: number;
  maxProductos: number;
  maxUsuarios: number;
  maxClientes: number;
  maxAlmacenamientoGB: number;
  personalizacionCompleta: boolean;
  estadisticasAvanzadas: boolean;
  soportePrioritario: boolean;
  integracionesAvanzadas: boolean;
  backupAutomatico: boolean;
  dominioPersonalizado: boolean;
  planPorDefecto: boolean;
  totalSuscripciones: number;
  suscripcionesActivas: number;
  ingresosTotales: number;
}

export interface Suscripcion {
  id: number;
  empresaId: number;
  empresaNombre: string;
  empresaSubdominio: string;
  planId: number;
  planNombre: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
  fechaCancelacion?: string;
  fechaRenovacion?: string;
  precio: number;
  moneda: string;
  metodoPago?: string;
  referenciaPago?: string;
  facturado: boolean;
  renovacionAutomatica: boolean;
  notificarAntesRenovacion: boolean;
  diasNotificacionRenovacion: number;
  notas?: string;
  motivoCancelacion?: string;
  diasRestantes: number;
  estaActiva: boolean;
  estaExpirada: boolean;
  estaPorExpirar: boolean;
}

export interface EstadisticasSuscripciones {
  totalSuscripciones: number;
  suscripcionesActivas: number;
  suscripcionesSuspendidas: number;
  suscripcionesCanceladas: number;
  suscripcionesPorExpirar: number;
  ingresosMensuales: number;
  ingresosAnuales: number;
}

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

// ===== CONFIGURACIÓN DE API =====

// ===== MÉTODOS PARA PLANES =====

export const obtenerPlanes = async (): Promise<Plan[]> => {
  try {
    return await apiService.getSuperAdminPlanes();
  } catch (error) {
    console.error('Error obteniendo planes:', error);
    throw error;
  }
};

export const obtenerPlan = async (planId: number): Promise<Plan> => {
  try {
    return await apiService.getSuperAdminPlan(planId);
  } catch (error) {
    console.error('Error obteniendo plan:', error);
    throw error;
  }
};

export const crearPlan = async (plan: Omit<Plan, 'id'>): Promise<Plan> => {
  try {
    console.log('🔍 Enviando plan al backend:', plan);
    const result = await apiService.createSuperAdminPlan(plan);
    console.log('✅ Plan creado exitosamente:', result);
    return result;
  } catch (error) {
    console.error('❌ Error creando plan:', error);
    throw error;
  }
};

export const actualizarPlan = async (planId: number, plan: Partial<Plan>): Promise<Plan> => {
  try {
    return await apiService.updateSuperAdminPlan(planId, plan);
  } catch (error) {
    console.error('Error actualizando plan:', error);
    throw error;
  }
};

export const eliminarPlan = async (planId: number): Promise<void> => {
  try {
    await apiService.deleteSuperAdminPlan(planId);
  } catch (error) {
    console.error('Error eliminando plan:', error);
    throw error;
  }
};

// ===== MÉTODOS PARA SUSCRIPCIONES =====

export const obtenerSuscripciones = async (): Promise<Suscripcion[]> => {
  try {
    return await apiService.getSuperAdminSuscripciones();
  } catch (error) {
    console.error('Error obteniendo suscripciones:', error);
    throw error;
  }
};

export const obtenerSuscripcionesPorEmpresa = async (empresaId: number): Promise<Suscripcion[]> => {
  try {
    const response = await apiService.getSuperAdminSuscripciones({ empresaId });
    return response;
  } catch (error) {
    console.error('Error obteniendo suscripciones por empresa:', error);
    throw error;
  }
};

export const crearSuscripcion = async (empresaId: number, planId: number): Promise<Suscripcion> => {
  try {
    return await apiService.createSuperAdminSuscripcion({ empresaId, planId });
  } catch (error) {
    console.error('Error creando suscripción:', error);
    throw error;
  }
};

export const suspenderSuscripcion = async (suscripcionId: number): Promise<Suscripcion> => {
  try {
    return await apiService.suspenderSuperAdminSuscripcion(suscripcionId);
  } catch (error) {
    console.error('Error suspendiendo suscripción:', error);
    throw error;
  }
};

export const reactivarSuscripcion = async (suscripcionId: number): Promise<Suscripcion> => {
  try {
    return await apiService.reactivarSuperAdminSuscripcion(suscripcionId);
  } catch (error) {
    console.error('Error reactivando suscripción:', error);
    throw error;
  }
};

export const cancelarSuscripcion = async (suscripcionId: number, motivo: string): Promise<Suscripcion> => {
  try {
    return await apiService.cancelarSuperAdminSuscripcion(suscripcionId, motivo);
  } catch (error) {
    console.error('Error cancelando suscripción:', error);
    throw error;
  }
};

export const renovarSuscripcion = async (suscripcionId: number): Promise<Suscripcion> => {
  try {
    return await apiService.renovarSuperAdminSuscripcion(suscripcionId);
  } catch (error) {
    console.error('Error renovando suscripción:', error);
    throw error;
  }
};

// ===== MÉTODOS PARA ESTADÍSTICAS =====

export const obtenerEstadisticasSuscripciones = async (): Promise<EstadisticasSuscripciones> => {
  try {
    return await apiService.getSuperAdminEstadisticasSuscripciones();
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw error;
  }
};

export const obtenerSuscripcionesPorExpirar = async (dias: number = 30): Promise<Suscripcion[]> => {
  try {
    return await apiService.getSuperAdminSuscripcionesPorExpirar();
  } catch (error) {
    console.error('Error obteniendo suscripciones por expirar:', error);
    throw error;
  }
};

// ===== MÉTODOS EXISTENTES PARA EMPRESAS =====

export interface Empresa {
  id: number;
  nombre: string;
  subdominio: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
  pais: string;
  descripcion: string;
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  estadoSuscripcion: string;
  fechaFinPrueba: string;
  totalProductos: number;
  totalClientes: number;
  totalPedidos: number;
  ingresosTotales: number;
}

export const obtenerEmpresas = async (): Promise<Empresa[]> => {
  try {
    return await apiService.getSuperAdminEmpresas();
  } catch (error) {
    console.error('Error obteniendo empresas:', error);
    throw error;
  }
};

export const obtenerEmpresa = async (empresaId: number): Promise<Empresa> => {
  try {
    return await apiService.getSuperAdminEmpresa(empresaId);
  } catch (error) {
    console.error('Error obteniendo empresa:', error);
    throw error;
  }
};

export const actualizarEmpresa = async (empresaId: number, empresa: Partial<Empresa>): Promise<Empresa> => {
  try {
    return await apiService.updateSuperAdminEmpresaEstado(empresaId, empresa.activa ? 'ACTIVA' : 'INACTIVA');
  } catch (error) {
    console.error('Error actualizando empresa:', error);
    throw error;
  }
};

export const eliminarEmpresa = async (empresaId: number): Promise<void> => {
  try {
    // Nota: El ApiService no tiene método para eliminar empresas, solo para cambiar estado
    await apiService.updateSuperAdminEmpresaEstado(empresaId, 'ELIMINADA');
  } catch (error) {
    console.error('Error eliminando empresa:', error);
    throw error;
  }
};

export const obtenerEstadisticasEmpresas = async (): Promise<any> => {
  try {
    return await apiService.getSuperAdminDashboard();
  } catch (error) {
    console.error('Error obteniendo estadísticas de empresas:', error);
    throw error;
  }
};

// ===== EXPORTACIÓN DEL OBJETO SERVICIO =====

export const superAdminService = {
  // Métodos para planes
  obtenerPlanes,
  obtenerPlan,
  crearPlan,
  actualizarPlan,
  eliminarPlan,
  
  // Métodos para suscripciones
  obtenerSuscripciones,
  obtenerSuscripcionesPorEmpresa,
  crearSuscripcion,
  suspenderSuscripcion,
  reactivarSuscripcion,
  cancelarSuscripcion,
  renovarSuscripcion,
  
  // Métodos para estadísticas
  obtenerEstadisticasSuscripciones,
  obtenerSuscripcionesPorExpirar,
  
  // Métodos para empresas
  obtenerEmpresas,
  obtenerEmpresa,
  actualizarEmpresa,
  eliminarEmpresa,
  obtenerEstadisticasEmpresas,
  
  // Método para dashboard
  obtenerDashboard: async (): Promise<DashboardStats> => {
    try {
      return await apiService.getSuperAdminDashboard();
    } catch (error) {
      console.error('Error obteniendo dashboard:', error);
      throw error;
    }
  }
}; 