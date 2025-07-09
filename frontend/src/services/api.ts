import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { 
  RegistroEmpresaDTO, 
  LoginDTO, 
  LoginResponse,
  Empresa, 
  Usuario, 
  Producto, 
  Cliente, 
  Pedido,
  ApiResponse,
  PaginatedResponse
} from '../types';

// Configuración base de Axios
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar token de autenticación
    this.api.interceptors.request.use(
      (config) => {
        console.log('=== DEBUG API INTERCEPTOR ===');
        console.log('URL:', config.url);
        console.log('Method:', config.method);
        
        // Solo omitir token en endpoints realmente públicos (productos y empresa)
        if (
          config.url &&
          (/\/publico\/[^/]+\/productos/.test(config.url) ||
           /\/publico\/[^/]+\/empresa/.test(config.url))
        ) {
          console.log('Endpoint público - omitiendo token');
          delete config.headers.Authorization;
          return config;
        }
        
        // Intentar obtener token de administrador o cliente
        const tokenAdmin = localStorage.getItem('token');
        const tokenCliente = localStorage.getItem('clienteToken');
        const token = tokenAdmin || tokenCliente;
        
        console.log('Token admin:', tokenAdmin ? 'Presente' : 'Ausente');
        console.log('Token cliente:', tokenCliente ? 'Presente' : 'Ausente');
        console.log('Token final:', token ? 'Presente' : 'Ausente');
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('Authorization header agregado');
        } else {
          console.log('No se encontró token - request sin autorización');
        }
        
        console.log('Headers finales:', config.headers);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor para manejar respuestas
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado o inválido
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('clienteToken');
          localStorage.removeItem('clienteInfo');
          
          // Redirigir según el tipo de usuario
          if (window.location.pathname.startsWith('/admin')) {
            window.location.href = '/admin/login';
          } else {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Métodos de autenticación
  async registrarEmpresa(data: RegistroEmpresaDTO): Promise<{ mensaje: string; empresa: Empresa }> {
    const response = await this.api.post('/empresas/registro', data);
    return response.data;
  }

  async verificarSubdominio(subdominio: string): Promise<{ disponible: boolean }> {
    const response = await this.api.get(`/empresas/verificar-subdominio/${subdominio}`);
    return response.data;
  }

  async obtenerEmpresaPorSubdominio(subdominio: string): Promise<ApiResponse<Empresa>> {
    const response = await this.api.get(`/publico/${subdominio}/empresa`);
    return response.data;
  }

  // Métodos de administrador
  async obtenerEmpresaAdmin(): Promise<ApiResponse<Empresa>> {
    const response = await this.api.get('/admin/empresa');
    return response.data;
  }

  async actualizarEmpresaAdmin(data: Partial<Empresa>): Promise<ApiResponse<Empresa>> {
    const response = await this.api.put('/admin/empresa', data);
    return response.data;
  }

  async login(data: LoginDTO): Promise<LoginResponse> {
    const response = await this.api.post('/auth/login', data);
    return response.data;
  }

  async obtenerPerfil(): Promise<ApiResponse<Usuario>> {
    const response = await this.api.get('/auth/perfil');
    return response.data;
  }

  // Métodos de empresa
  async actualizarPersonalizacion(
    empresaId: number, 
    data: { logoUrl?: string; colorPrimario?: string; colorSecundario?: string }
  ): Promise<ApiResponse<Empresa>> {
    const response = await this.api.put(`/empresas/${empresaId}/personalizacion`, data);
    return response.data;
  }

  // Métodos de productos (requieren empresaId)
  async obtenerProductos(
    empresaId: number,
    page = 0, 
    size = 10, 
    filtros?: { nombre?: string; categoria?: string; marca?: string }
  ): Promise<PaginatedResponse<Producto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      ...filtros
    });
    const response = await this.api.get(`/empresas/${empresaId}/productos/paginado?${params}`);
    return response.data;
  }

  async obtenerTodosLosProductos(empresaId: number): Promise<ApiResponse<Producto[]>> {
    const response = await this.api.get(`/empresas/${empresaId}/productos`);
    return response.data;
  }

  async obtenerTodosLosProductosIncluirInactivos(empresaId: number): Promise<ApiResponse<Producto[]>> {
    const response = await this.api.get(`/empresas/${empresaId}/productos/todos`);
    return response.data;
  }

  async obtenerProducto(empresaId: number, id: number, incluirInactivos = false): Promise<ApiResponse<Producto>> {
    const params = incluirInactivos ? '?incluirInactivos=true' : '';
    const response = await this.api.get(`/empresas/${empresaId}/productos/${id}${params}`);
    return response.data;
  }

  async crearProducto(empresaId: number, data: Partial<Producto>): Promise<ApiResponse<Producto>> {
    const response = await this.api.post(`/empresas/${empresaId}/productos`, data);
    return response.data;
  }

  async actualizarProducto(empresaId: number, id: number, data: Partial<Producto>): Promise<ApiResponse<Producto>> {
    const response = await this.api.put(`/empresas/${empresaId}/productos/${id}`, data);
    return response.data;
  }

  async actualizarStock(empresaId: number, id: number, stock: number): Promise<ApiResponse<Producto>> {
    const response = await this.api.patch(`/empresas/${empresaId}/productos/${id}/stock`, { stock });
    return response.data;
  }

  async validarStock(empresaId: number, id: number, cantidad: number): Promise<ApiResponse<{
    stockDisponible: number;
    stockSuficiente: boolean;
    cantidadSolicitada: number;
    productoNombre: string;
  }>> {
    const response = await this.api.get(`/empresas/${empresaId}/productos/${id}/validar-stock?cantidad=${cantidad}`);
    return response.data;
  }

  async validarStockPublico(subdominio: string, id: number, cantidad: number): Promise<ApiResponse<{
    stockDisponible: number;
    stockSuficiente: boolean;
    cantidadSolicitada: number;
    productoNombre: string;
  }>> {
    const response = await this.api.get(`/publico/${subdominio}/productos/${id}/validar-stock?cantidad=${cantidad}`);
    return response.data;
  }

  async eliminarProducto(empresaId: number, id: number): Promise<ApiResponse<void>> {
    const response = await this.api.delete(`/empresas/${empresaId}/productos/${id}`);
    return response.data;
  }

  async obtenerCategorias(empresaId?: number): Promise<ApiResponse<string[]>> {
    if (empresaId) {
      const response = await this.api.get(`/empresas/${empresaId}/productos/categorias`);
      return response.data;
    } else {
      // Fallback temporal para compatibilidad
      const response = await this.api.get('/productos/categorias');
      return response.data;
    }
  }

  async obtenerMarcas(): Promise<ApiResponse<string[]>> {
    const response = await this.api.get('/productos/marcas');
    return response.data;
  }

  // Métodos de clientes (requieren empresaId)
  async obtenerClientes(empresaId: number, page = 0, size = 10): Promise<PaginatedResponse<Cliente>> {
    const response = await this.api.get(`/empresas/${empresaId}/clientes?page=${page}&size=${size}`);
    return response.data;
  }

  async obtenerCliente(empresaId: number, id: number): Promise<ApiResponse<Cliente>> {
    const response = await this.api.get(`/empresas/${empresaId}/clientes/${id}`);
    return response.data;
  }

  async crearCliente(empresaId: number, data: Partial<Cliente>): Promise<ApiResponse<Cliente>> {
    const response = await this.api.post(`/empresas/${empresaId}/clientes`, data);
    return response.data;
  }

  async actualizarCliente(empresaId: number, id: number, data: Partial<Cliente>): Promise<ApiResponse<Cliente>> {
    const response = await this.api.put(`/empresas/${empresaId}/clientes/${id}`, data);
    return response.data;
  }

  // Métodos de pedidos (requieren empresaId)
  async obtenerPedidos(empresaId: number, page = 0, size = 10, estado?: string): Promise<PaginatedResponse<Pedido>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      ...(estado && { estado })
    });
    const response = await this.api.get(`/empresas/${empresaId}/pedidos?${params}`);
    return response.data;
  }

  async obtenerPedido(empresaId: number, id: number): Promise<ApiResponse<Pedido>> {
    const response = await this.api.get(`/empresas/${empresaId}/pedidos/${id}`);
    return response.data;
  }

  async actualizarEstadoPedido(empresaId: number, id: number, estado: string): Promise<ApiResponse<Pedido>> {
    const response = await this.api.put(`/empresas/${empresaId}/pedidos/${id}/estado`, { estado });
    return response.data;
  }

  async cancelarPedido(empresaId: number, id: number): Promise<ApiResponse<Pedido>> {
    const response = await this.api.put(`/empresas/${empresaId}/pedidos/${id}/cancelar`);
    return response.data;
  }

  async crearPedido(empresaId: number, pedido: {
    clienteId?: number;
    clienteNombre: string;
    clienteEmail: string;
    direccionEnvio: string;
    detalles: Array<{
      productoId: number;
      productoNombre: string;
      cantidad: number;
      precioUnitario: number;
    }>;
    total: number;
  }): Promise<ApiResponse<unknown>> {
    const response = await this.api.post(`/empresas/${empresaId}/pedidos`, pedido);
    return response.data;
  }

  // Métodos de mensajes (requieren empresaId)
  async obtenerMensajes(empresaId: number, page = 0, size = 10): Promise<PaginatedResponse<{ id: number; asunto: string; mensaje: string; leido: boolean }>> {
    const response = await this.api.get(`/empresas/${empresaId}/mensajes?page=${page}&size=${size}`);
    return response.data;
  }

  async responderMensaje(empresaId: number, id: number, respuesta: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await this.api.post(`/empresas/${empresaId}/mensajes/${id}/responder`, { respuesta });
    return response.data;
  }

  // Métodos de estadísticas (requieren empresaId)
  async obtenerEstadisticas(empresaId: number): Promise<ApiResponse<{ [key: string]: number }>> {
    const response = await this.api.get(`/empresas/${empresaId}/dashboard/estadisticas`);
    return response.data;
  }

  // Métodos de subida de archivos
  async subirImagenProducto(empresaId: number, archivo: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('imagen', archivo);
    
    const response = await this.api.post(`/empresas/${empresaId}/productos/subir-imagen`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async eliminarImagenProducto(empresaId: number, urlImagen: string): Promise<ApiResponse<{ mensaje: string }>> {
    const response = await this.api.delete(`/empresas/${empresaId}/productos/eliminar-imagen`, {
      params: { url: urlImagen }
    });
    return response.data;
  }

  async subirImagen(archivo: File, tipo: 'logo' | 'producto'): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('tipo', tipo);
    
    const response = await this.api.post('/archivos/subir', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async obtenerProductosPorEstado(
    empresaId: number,
    activo?: boolean
  ): Promise<Producto[]> {
    const params = new URLSearchParams();
    if (activo !== undefined) {
      params.append('activo', activo.toString());
    }
    
    const response = await this.api.get(`/empresas/${empresaId}/productos/por-estado?${params}`);
    return response.data;
  }

  // Métodos públicos para catálogo (por subdominio)
  async obtenerProductosPublicos(
    subdominio: string,
    filtros?: { categoria?: string; marca?: string; buscar?: string }
  ): Promise<ApiResponse<Producto[]>> {
    // Construir parámetros solo si tienen valores
    const params = new URLSearchParams();
    if (filtros?.categoria) params.append('categoria', filtros.categoria);
    if (filtros?.marca) params.append('marca', filtros.marca);
    if (filtros?.buscar) params.append('buscar', filtros.buscar);
    
    const queryString = params.toString();
    const url = `/publico/${subdominio}/productos${queryString ? `?${queryString}` : ''}`;
    
    console.log('URL de productos:', url);
    const response = await this.api.get(url);
    return response.data;
  }

  async obtenerProductoPublico(subdominio: string, id: number): Promise<ApiResponse<Producto>> {
    const response = await this.api.get(`/publico/${subdominio}/productos/${id}`);
    return response.data;
  }

  // Métodos de autenticación de clientes
  async loginCliente(subdominio: string, datos: { email: string; password: string }) {
    const response = await this.api.post(`/publico/${subdominio}/auth/login`, datos);
    return response.data;
  }

  async registrarCliente(subdominio: string, datos: { nombre: string; apellidos?: string; email: string; telefono?: string; password: string }) {
    const response = await this.api.post(`/publico/${subdominio}/auth/registro`, datos);
    return response.data;
  }

  async obtenerPerfilCliente(subdominio: string, token: string) {
    const response = await this.api.get(`/publico/${subdominio}/auth/perfil`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  // Obtener pedidos de un cliente (requiere empresaId y clienteId)
  async obtenerPedidosCliente(empresaId: number, clienteId: number): Promise<ApiResponse<Pedido[]>> {
    const response = await this.api.get(`/empresas/${empresaId}/pedidos/cliente/${clienteId}`);
    return response.data;
  }

  // Obtener pedidos de un cliente (endpoint público)
  async obtenerPedidosClientePublico(subdominio: string, clienteId: number): Promise<ApiResponse<Pedido[]>> {
    const response = await this.api.get(`/publico/${subdominio}/pedidos/cliente/${clienteId}`);
    return response.data;
  }

  // Cancelar pedido del cliente (endpoint público)
  async cancelarPedidoCliente(subdominio: string, pedidoId: number, clienteId: number): Promise<ApiResponse<Pedido>> {
    const response = await this.api.put(`/publico/${subdominio}/pedidos/${pedidoId}/cancelar?clienteId=${clienteId}`);
    return response.data;
  }

  // Obtener clientes paginados (para dashboard y conteo real)
  async obtenerClientesPaginado(empresaId: number, page = 0, size = 10) {
    const response = await this.api.get(`/empresas/${empresaId}/clientes/paginado?page=${page}&size=${size}`);
    return response.data;
  }
  
  async obtenerClienteConHistorial(empresaId: number, clienteId: number) {
    const response = await this.api.get(`/empresas/${empresaId}/clientes/${clienteId}/historial`);
    return response.data;
  }
  
  async obtenerHistorialPedidosCliente(empresaId: number, clienteId: number) {
    const response = await this.api.get(`/empresas/${empresaId}/clientes/${clienteId}/pedidos`);
    return response.data;
  }
  
  async debugAuth(empresaId: number) {
    const response = await this.api.get(`/empresas/${empresaId}/clientes/debug/auth`);
    return response.data;
  }
  
  async debugPublic(empresaId: number) {
    const response = await this.api.get(`/empresas/${empresaId}/clientes/debug/public`);
    return response.data;
  }
  
  async obtenerEstadisticasVentas() {
    const response = await this.api.get('/admin/estadisticas-ventas');
    return response.data;
  }
}

export default new ApiService();
