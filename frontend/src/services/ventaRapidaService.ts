import type { ApiResponse } from '../types';

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
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

class VentaRapidaService {
  private baseURL = '/api/admin/venta-rapida';

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('token');
    const url = `${this.baseURL}${endpoint}`;

    console.log('VentaRapidaService - URL:', url);
    console.log('VentaRapidaService - Token:', token ? 'Presente' : 'Ausente');

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    };

    try {
      console.log('VentaRapidaService - Enviando request a:', url);
      const response = await fetch(url, config);
      console.log('VentaRapidaService - Status:', response.status);
      console.log('VentaRapidaService - Headers:', response.headers);

      if (!response.ok) {
        console.error('VentaRapidaService - Error response:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('VentaRapidaService - Error body:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('VentaRapidaService - Success response:', data);

      return {
        mensaje: data.message || 'Operación exitosa',
        data
      };
    } catch (error) {
      console.error('VentaRapidaService - Exception:', error);
      return {
        mensaje: error instanceof Error ? error.message : 'Error desconocido',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // Procesar una venta rápida
  async procesarVentaRapida(ventaDTO: VentaRapidaDTO): Promise<ApiResponse<any>> {
    return this.request('/procesar', {
      method: 'POST',
      body: JSON.stringify(ventaDTO)
    });
  }

  // Obtener historial completo de ventas rápidas
  async obtenerHistorial(): Promise<ApiResponse<VentaRapida[]>> {
    return this.request<VentaRapida[]>('/historial');
  }

  // Obtener ventas por rango de fechas
  async obtenerVentasPorFecha(fechaInicio: string, fechaFin: string): Promise<ApiResponse<VentaRapida[]>> {
    return this.request<VentaRapida[]>(`/historial/por-fecha?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
  }

  // Obtener ventas por método de pago
  async obtenerVentasPorMetodoPago(metodoPago: string): Promise<ApiResponse<VentaRapida[]>> {
    return this.request<VentaRapida[]>(`/historial/por-metodo-pago?metodoPago=${metodoPago}`);
  }

  // Obtener estadísticas generales
  async obtenerEstadisticas(fechaInicio?: string, fechaFin?: string): Promise<ApiResponse<EstadisticasVentaRapida>> {
    let url = '/estadisticas';
    if (fechaInicio && fechaFin) {
      url += `?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
    }
    return this.request<EstadisticasVentaRapida>(url);
  }

  // Obtener estadísticas diarias
  async obtenerEstadisticasDiarias(fecha: string): Promise<ApiResponse<EstadisticasVentaRapida>> {
    return this.request<EstadisticasVentaRapida>(`/estadisticas/diarias?fecha=${fecha}`);
  }

  // Obtener estadísticas mensuales
  async obtenerEstadisticasMensuales(año: number, mes: number): Promise<ApiResponse<EstadisticasVentaRapida>> {
    return this.request<EstadisticasVentaRapida>(`/estadisticas/mensuales?año=${año}&mes=${mes}`);
  }

  // Obtener estadísticas anuales
  async obtenerEstadisticasAnuales(año: number): Promise<ApiResponse<EstadisticasVentaRapida>> {
    return this.request<EstadisticasVentaRapida>(`/estadisticas/anuales?año=${año}`);
  }

  // Obtener una venta específica por ID
  async obtenerVentaPorId(ventaId: number): Promise<ApiResponse<VentaRapida>> {
    return this.request<VentaRapida>(`/venta/${ventaId}`);
  }

  // Endpoint de prueba
  async test(): Promise<ApiResponse<any>> {
    return this.request('/test');
  }

  // Endpoint de debug
  async debugVenta(ventaDTO: VentaRapidaDTO): Promise<ApiResponse<any>> {
    return this.request('/debug', {
      method: 'POST',
      body: JSON.stringify(ventaDTO)
    });
  }
}

export const ventaRapidaService = new VentaRapidaService(); 