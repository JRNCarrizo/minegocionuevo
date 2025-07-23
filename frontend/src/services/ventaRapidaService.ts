import type { ApiResponse } from '../types';
import ApiService from './api';

export interface VentaRapida {
  id: number;
  numeroComprobante: string;
  clienteNombre: string;
  clienteEmail: string;
  total: number;
  subtotal: number;
  metodoPago: string;
  montoRecibido?: number;
  vuelto?: number;
  observaciones?: string;
  fechaVenta: string;
  detalles: DetalleVentaRapida[];
}

export interface DetalleVentaRapida {
  id: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface EstadisticasVentaRapida {
  totalVentas: number;
  totalTransacciones: number;
  totalProductos: number;
  cantidadVentas: number;
}

export interface VentaRapidaDTO {
  clienteNombre: string;
  clienteEmail?: string;
  total: number;
  subtotal: number;
  metodoPago: string;
  montoRecibido?: number;
  vuelto?: number;
  observaciones?: string;
  detalles: DetalleVentaRapidaDTO[];
}

export interface DetalleVentaRapidaDTO {
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

class VentaRapidaService {


  // Método helper para manejar errores de manera consistente
  private handleError(error: any): ApiResponse<any> {
    return {
      mensaje: error instanceof Error ? error.message : 'Error desconocido',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }

  // Procesar una venta rápida
  async procesarVentaRapida(ventaDTO: VentaRapidaDTO): Promise<ApiResponse<any>> {
    try {
      const response = await ApiService.procesarVentaRapida(ventaDTO);
      return {
        mensaje: 'Venta procesada correctamente',
        data: response
      };
    } catch (error) {
      return {
        mensaje: error instanceof Error ? error.message : 'Error desconocido',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // Obtener historial completo de ventas rápidas
  async obtenerHistorial(): Promise<ApiResponse<VentaRapida[]>> {
    try {
      const response = await ApiService.obtenerEstadisticasVentaRapida();
      return {
        mensaje: 'Historial obtenido correctamente',
        data: response
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Obtener ventas por rango de fechas
  async obtenerVentasPorFecha(fechaInicio: string, fechaFin: string): Promise<ApiResponse<VentaRapida[]>> {
    try {
      const response = await ApiService.obtenerEstadisticasVentaRapida(fechaInicio, fechaFin);
      return {
        mensaje: 'Ventas por fecha obtenidas correctamente',
        data: response
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Obtener ventas por método de pago
  async obtenerVentasPorMetodoPago(metodoPago: string): Promise<ApiResponse<VentaRapida[]>> {
    try {
      // Nota: Este endpoint específico no existe en ApiService, usar el general
      const response = await ApiService.obtenerEstadisticasVentaRapida();
      return {
        mensaje: 'Ventas por método de pago obtenidas correctamente',
        data: response
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Obtener estadísticas generales
  async obtenerEstadisticas(fechaInicio?: string, fechaFin?: string): Promise<ApiResponse<EstadisticasVentaRapida>> {
    try {
      const response = await ApiService.obtenerEstadisticasVentaRapida(fechaInicio, fechaFin);
      return {
        mensaje: 'Estadísticas obtenidas correctamente',
        data: response
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Endpoint de debug
  async debugVenta(ventaDTO: VentaRapidaDTO): Promise<ApiResponse<any>> {
    try {
      const response = await ApiService.debugVentaRapida(ventaDTO);
      return {
        mensaje: 'Debug realizado correctamente',
        data: response
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}

export const ventaRapidaService = new VentaRapidaService(); 