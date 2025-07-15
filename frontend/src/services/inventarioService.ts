import ApiService from './api';

export interface InventarioRequest {
  productoId: number;
  tipoOperacion: 'INCREMENTO' | 'DECREMENTO' | 'AJUSTE' | 'INVENTARIO_FISICO';
  cantidad: number;
  stockAnterior?: number;
  stockNuevo?: number;
  precioUnitario?: number;
  observacion?: string;
  codigoBarras?: string;
  metodoEntrada?: string;
}

export interface HistorialInventario {
  id: number;
  productoId: number;
  productoNombre: string;
  productoCodigoBarras: string;
  usuarioId: number;
  usuarioNombre: string;
  tipoOperacion: string;
  descripcionOperacion: string;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  precioUnitario: number;
  valorTotal: number;
  observacion: string;
  codigoBarras: string;
  metodoEntrada: string;
  fechaOperacion: string;
}

export interface EstadisticasInventario {
  totalOperaciones: number;
  totalIncrementos: number;
  totalDecrementos: number;
  totalAjustes: number;
  valorTotalIncrementos: number;
  valorTotalDecrementos: number;
  valorTotalAjustes: number;
  valorTotalMovimientos: number;
}

class InventarioService {
  /**
   * Registrar una operación de inventario
   */
  async registrarOperacion(request: InventarioRequest) {
    try {
      console.log('📝 Registrando operación de inventario:', request);
      const response = await ApiService.registrarOperacionInventario(request);
      console.log('✅ Operación registrada exitosamente:', response);
      return response;
    } catch (error) {
      console.error('❌ Error al registrar operación de inventario:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de inventario paginado
   */
  async obtenerHistorial(pagina: number = 0, tamano: number = 20) {
    try {
      console.log('📋 Obteniendo historial de inventario - página:', pagina, 'tamaño:', tamano);
      const response = await ApiService.obtenerHistorialInventario(pagina, tamano);
      console.log('✅ Historial obtenido:', response);
      return response;
    } catch (error) {
      console.error('❌ Error al obtener historial de inventario:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de inventario por producto
   */
  async obtenerHistorialPorProducto(productoId: number) {
    try {
      const response = await ApiService.obtenerHistorialInventarioPorProducto(productoId);
      return response;
    } catch (error) {
      console.error('Error al obtener historial del producto:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de inventario por rango de fechas
   */
  async obtenerHistorialPorFechas(fechaInicio: string, fechaFin: string) {
    try {
      const response = await ApiService.obtenerHistorialInventarioPorFechas(fechaInicio, fechaFin);
      return response;
    } catch (error) {
      console.error('Error al obtener historial por fechas:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de inventario
   */
  async obtenerEstadisticas() {
    try {
      console.log('📊 Obteniendo estadísticas de inventario...');
      const response = await ApiService.obtenerEstadisticasInventario();
      console.log('✅ Estadísticas obtenidas:', response);
      return response;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas de inventario:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de inventario por rango de fechas
   */
  async obtenerEstadisticasPorFechas(fechaInicio: string, fechaFin: string) {
    try {
      const response = await ApiService.obtenerEstadisticasInventarioPorFechas(fechaInicio, fechaFin);
      return response;
    } catch (error) {
      console.error('Error al obtener estadísticas por fechas:', error);
      throw error;
    }
  }

  /**
   * Obtener productos más movidos en inventario
   */
  async obtenerProductosMasMovidos(limite: number = 10) {
    try {
      const response = await ApiService.obtenerProductosMasMovidosInventario(limite);
      return response;
    } catch (error) {
      console.error('Error al obtener productos más movidos:', error);
      throw error;
    }
  }

  /**
   * Obtener usuarios más activos en inventario
   */
  async obtenerUsuariosMasActivos(limite: number = 10) {
    try {
      const response = await ApiService.obtenerUsuariosMasActivosInventario(limite);
      return response;
    } catch (error) {
      console.error('Error al obtener usuarios más activos:', error);
      throw error;
    }
  }

  /**
   * Buscar historial por código de barras
   */
  async buscarPorCodigoBarras(codigoBarras: string) {
    try {
      const response = await ApiService.buscarHistorialPorCodigoBarras(codigoBarras);
      return response;
    } catch (error) {
      console.error('Error al buscar por código de barras:', error);
      throw error;
    }
  }

  /**
   * Formatear fecha para la API
   */
  formatearFechaParaAPI(fecha: Date): string {
    return fecha.toISOString().slice(0, 19).replace('T', ' ');
  }

  /**
   * Formatear fecha desde la API
   */
  formatearFechaDesdeAPI(fechaString: string): string {
    const fecha = new Date(fechaString);
    return fecha.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Obtener icono para el tipo de operación
   */
  getIconoTipoOperacion(tipoOperacion: string): string {
    switch (tipoOperacion) {
      case 'INCREMENTO':
        return '📈';
      case 'DECREMENTO':
        return '📉';
      case 'AJUSTE':
        return '⚖️';
      case 'INVENTARIO_FISICO':
        return '📋';
      default:
        return '📊';
    }
  }

  /**
   * Obtener color para el tipo de operación
   */
  getColorTipoOperacion(tipoOperacion: string): string {
    switch (tipoOperacion) {
      case 'INCREMENTO':
        return 'var(--color-verde)';
      case 'DECREMENTO':
        return 'var(--color-rojo)';
      case 'AJUSTE':
        return 'var(--color-acento)';
      case 'INVENTARIO_FISICO':
        return 'var(--color-secundario)';
      default:
        return 'var(--color-texto)';
    }
  }

  /**
   * Obtener descripción corta para el tipo de operación
   */
  getDescripcionCortaTipoOperacion(tipoOperacion: string): string {
    switch (tipoOperacion) {
      case 'INCREMENTO':
        return 'Incremento';
      case 'DECREMENTO':
        return 'Decremento';
      case 'AJUSTE':
        return 'Ajuste';
      case 'INVENTARIO_FISICO':
        return 'Inventario Físico';
      default:
        return tipoOperacion;
    }
  }
}

export default new InventarioService(); 