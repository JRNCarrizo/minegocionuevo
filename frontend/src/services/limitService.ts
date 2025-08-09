import ApiService from './api';
import { API_CONFIG } from '../config/api';

// Interfaces locales para evitar problemas de exportación
type PlanLimits = {
  maxProductos: number;
  maxUsuarios: number;
  maxClientes: number;
  maxAlmacenamientoGB: number;
};

type CurrentUsage = {
  productos: number;
  usuarios: number;
  clientes: number;
  almacenamientoGB: number;
};

type LimitCheckResult = {
  canProceed: boolean;
  message: string;
  currentUsage: CurrentUsage;
  limits: PlanLimits;
  remaining: {
    productos: number;
    usuarios: number;
    clientes: number;
    almacenamientoGB: number;
  };
};

class LimitService {
  /**
   * Obtiene los límites del plan actual
   */
  async getCurrentPlanLimits(): Promise<PlanLimits> {
    try {
      const suscripcion = await ApiService.getMiSuscripcion();
      return {
        maxProductos: suscripcion.plan.maxProductos,
        maxUsuarios: suscripcion.plan.maxUsuarios,
        maxClientes: suscripcion.plan.maxClientes,
        maxAlmacenamientoGB: suscripcion.plan.maxAlmacenamientoGB
      };
    } catch (error) {
      console.error('Error obteniendo límites del plan:', error);
      return {
        maxProductos: 10,
        maxUsuarios: 2,
        maxClientes: 50,
        maxAlmacenamientoGB: 1
      };
    }
  }

  /**
   * Obtiene el uso actual de la empresa
   */
  async getCurrentUsage(): Promise<CurrentUsage> {
    try {
      console.log('🔍 LimitService: Obteniendo uso actual...');
      
      // Obtener el ID de la empresa del localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.error('❌ LimitService: No se encontró información del usuario');
        throw new Error('No se encontró información del usuario');
      }
      
      const user = JSON.parse(userStr);
      const empresaId = user.empresaId;
      
      if (!empresaId) {
        console.error('❌ LimitService: No se encontró empresaId en los datos del usuario');
        throw new Error('No se encontró empresaId');
      }
      
      console.log('🔍 LimitService: EmpresaId:', empresaId);
      
      // Usar el nuevo endpoint de consumo
      const token = localStorage.getItem('token');
      console.log('🔍 LimitService: Token encontrado:', token ? 'Sí' : 'No');
      
      const response = await fetch(`${API_CONFIG.getBaseUrl()}/suscripciones/mi-consumo`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔍 LimitService: Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🔍 LimitService: Data recibida del servidor:', data);
      
      const result = {
        productos: data.consumo?.productos || 0,
        usuarios: data.consumo?.usuarios || 0,
        clientes: data.consumo?.clientes || 0,
        almacenamientoGB: data.consumo?.almacenamientoGB || 0
      };
      
      console.log('🔍 LimitService: Uso procesado:', result);
      return result;
    } catch (error) {
      console.error('❌ LimitService: Error obteniendo uso actual:', error);
      return {
        productos: 0,
        usuarios: 0,
        clientes: 0,
        almacenamientoGB: 0
      };
    }
  }

  /**
   * Verifica si se puede agregar un producto
   */
  async canAddProduct(): Promise<LimitCheckResult> {
    const limits = await this.getCurrentPlanLimits();
    const usage = await this.getCurrentUsage();
    const canProceed = usage.productos < limits.maxProductos;
    const remaining = limits.maxProductos - usage.productos;

    return {
      canProceed,
      message: canProceed 
        ? `Puedes agregar ${remaining} producto${remaining !== 1 ? 's' : ''} más`
        : `Has alcanzado el límite de ${limits.maxProductos} productos. Considera actualizar tu plan.`,
      currentUsage: usage,
      limits,
      remaining: {
        productos: remaining,
        usuarios: limits.maxUsuarios - usage.usuarios,
        clientes: limits.maxClientes - usage.clientes,
        almacenamientoGB: limits.maxAlmacenamientoGB - usage.almacenamientoGB
      }
    };
  }

  /**
   * Verifica si se puede agregar un cliente
   */
  async canAddClient(): Promise<LimitCheckResult> {
    const limits = await this.getCurrentPlanLimits();
    const usage = await this.getCurrentUsage();
    const canProceed = usage.clientes < limits.maxClientes;
    const remaining = limits.maxClientes - usage.clientes;

    return {
      canProceed,
      message: canProceed 
        ? `Puedes agregar ${remaining} cliente${remaining !== 1 ? 's' : ''} más`
        : `Has alcanzado el límite de ${limits.maxClientes} clientes. Considera actualizar tu plan.`,
      currentUsage: usage,
      limits,
      remaining: {
        productos: limits.maxProductos - usage.productos,
        usuarios: limits.maxUsuarios - usage.usuarios,
        clientes: remaining,
        almacenamientoGB: limits.maxAlmacenamientoGB - usage.almacenamientoGB
      }
    };
  }

  /**
   * Verifica si se puede agregar un usuario
   */
  async canAddUser(): Promise<LimitCheckResult> {
    const limits = await this.getCurrentPlanLimits();
    const usage = await this.getCurrentUsage();
    const canProceed = usage.usuarios < limits.maxUsuarios;
    const remaining = limits.maxUsuarios - usage.usuarios;

    return {
      canProceed,
      message: canProceed 
        ? `Puedes agregar ${remaining} usuario${remaining !== 1 ? 's' : ''} más`
        : `Has alcanzado el límite de ${limits.maxUsuarios} usuarios. Considera actualizar tu plan.`,
      currentUsage: usage,
      limits,
      remaining: {
        productos: limits.maxProductos - usage.productos,
        usuarios: remaining,
        clientes: limits.maxClientes - usage.clientes,
        almacenamientoGB: limits.maxAlmacenamientoGB - usage.almacenamientoGB
      }
    };
  }

  /**
   * Verifica si se puede subir un archivo (por tamaño)
   */
  async canUploadFile(fileSizeMB: number): Promise<LimitCheckResult> {
    const limits = await this.getCurrentPlanLimits();
    const usage = await this.getCurrentUsage();
    const fileSizeGB = fileSizeMB / 1024;
    const canProceed = (usage.almacenamientoGB + fileSizeGB) <= limits.maxAlmacenamientoGB;
    const remaining = limits.maxAlmacenamientoGB - usage.almacenamientoGB;

    return {
      canProceed,
      message: canProceed 
        ? `Archivo válido. Quedan ${remaining.toFixed(2)} GB disponibles`
        : `El archivo excede el espacio disponible. Límite: ${limits.maxAlmacenamientoGB} GB, Usado: ${usage.almacenamientoGB.toFixed(2)} GB`,
      currentUsage: usage,
      limits,
      remaining: {
        productos: limits.maxProductos - usage.productos,
        usuarios: limits.maxUsuarios - usage.usuarios,
        clientes: limits.maxClientes - usage.clientes,
        almacenamientoGB: remaining
      }
    };
  }

  /**
   * Muestra una alerta de límite alcanzado
   */
  showLimitAlert(result: LimitCheckResult, action: string) {
    if (!result.canProceed) {
      const message = `
        <div style="text-align: center; padding: 20px;">
          <h3 style="color: #dc2626; margin-bottom: 15px;">🚫 Límite Alcanzado</h3>
          <p style="margin-bottom: 15px; color: #374151;">${result.message}</p>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #1f2937;">Uso Actual:</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
              <div>📦 Productos: ${result.currentUsage.productos}/${result.limits.maxProductos}</div>
              <div>👥 Usuarios: ${result.currentUsage.usuarios}/${result.limits.maxUsuarios}</div>
              <div>👥 Clientes: ${result.currentUsage.clientes}/${result.limits.maxClientes}</div>
              <div>💾 Almacenamiento: ${result.currentUsage.almacenamientoGB.toFixed(2)}/${result.limits.maxAlmacenamientoGB} GB</div>
            </div>
          </div>
          
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button onclick="window.location.href='/admin/suscripcion'" style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
              Ver Planes
            </button>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
              Cerrar
            </button>
          </div>
        </div>
      `;

      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      `;

      const modalContent = document.createElement('div');
      modalContent.style.cssText = `
        background: white;
        border-radius: 10px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      `;
      modalContent.innerHTML = message;

      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
    }
  }

  /**
   * Verifica límites antes de una acción específica
   */
  async checkLimitsBeforeAction(action: 'addProduct' | 'addClient' | 'addUser' | 'uploadFile', fileSizeMB?: number): Promise<boolean> {
    let result: LimitCheckResult;

    switch (action) {
      case 'addProduct':
        result = await this.canAddProduct();
        break;
      case 'addClient':
        result = await this.canAddClient();
        break;
      case 'addUser':
        result = await this.canAddUser();
        break;
      case 'uploadFile':
        if (!fileSizeMB) throw new Error('Tamaño de archivo requerido');
        result = await this.canUploadFile(fileSizeMB);
        break;
      default:
        return true;
    }

    if (!result.canProceed) {
      this.showLimitAlert(result, action);
    }

    return result.canProceed;
  }
}

export default new LimitService(); 