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
import { API_CONFIG } from '../config/api';

const API_BASE_URL = API_CONFIG.getBaseUrl();

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
        console.log('🌐 API Request:', config.method?.toUpperCase(), config.url);
        
        // Endpoints completamente públicos (no requieren token)
        if (
          config.url &&
          (/\/publico\/[^/]+\/productos/.test(config.url) ||
           /\/publico\/[^/]+\/empresa/.test(config.url) ||
           /\/auth\/login/.test(config.url) ||
           /\/auth\/recuperar-password/.test(config.url) ||
           /\/auth\/validar-token/.test(config.url) ||
           /\/auth\/cambiar-password/.test(config.url) ||
           /\/empresas\/registro/.test(config.url) ||
           /\/empresas\/verificar-subdominio/.test(config.url))
        ) {
          console.log('🔓 Endpoint público - sin token');
          delete config.headers.Authorization;
          return config;
        }
        
        // Endpoints de super admin (requieren token de admin)
        if (
          config.url &&
          /\/super-admin\//.test(config.url)
        ) {
          const tokenAdmin = localStorage.getItem('token');
          if (tokenAdmin) {
            console.log('👑 Token super admin agregado');
            config.headers.Authorization = `Bearer ${tokenAdmin}`;
          } else {
            console.log('❌ Token super admin requerido pero no encontrado');
          }
          return config;
        }
        
        // Endpoints de administrador (requieren token de admin)
        if (
          config.url &&
          (/\/admin\//.test(config.url) ||
           /\/empresas\/\d+\//.test(config.url) ||
           /\/notificaciones\//.test(config.url) ||
           /\/historial-carga-productos\//.test(config.url))
        ) {
          const tokenAdmin = localStorage.getItem('token');
          if (tokenAdmin) {
            console.log('👨‍💼 Token admin agregado');
            config.headers.Authorization = `Bearer ${tokenAdmin}`;
          } else {
            console.log('❌ Token admin requerido pero no encontrado');
          }
          return config;
        }
        

        
        // Endpoints de cliente (requieren token de cliente)
        if (
          config.url &&
          (/\/cliente\//.test(config.url) ||
           /\/pedidos\/cliente/.test(config.url))
        ) {
          const tokenCliente = localStorage.getItem('clienteToken');
          if (tokenCliente) {
            console.log('👤 Token cliente agregado');
            config.headers.Authorization = `Bearer ${tokenCliente}`;
          } else {
            console.log('❌ Token cliente requerido pero no encontrado');
          }
          return config;
        }
        
        // Para otros endpoints, intentar con cualquier token disponible
        const tokenAdmin = localStorage.getItem('token');
        const tokenCliente = localStorage.getItem('clienteToken');
        const token = tokenAdmin || tokenCliente;
        
        if (token) {
          console.log('🔑 Token genérico agregado');
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.log('⚠️ No se encontró token para endpoint:', config.url);
        }
        
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

  async verificarSubdominio(subdominio: string): Promise<{ disponible: boolean; mensaje: string }> {
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

  async subirLogoEmpresa(archivo: File): Promise<ApiResponse<{ logoUrl: string }>> {
    const formData = new FormData();
    formData.append('logo', archivo);
    
    const response = await this.api.post('/admin/empresa/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async subirFondoEmpresa(archivo: File): Promise<ApiResponse<{ fondoUrl: string }>> {
    const formData = new FormData();
    formData.append('fondo', archivo);
    const response = await this.api.post('/admin/empresa/fondo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async login(data: LoginDTO): Promise<LoginResponse> {
    const response = await this.api.post('/auth/login', data);
    return response.data;
  }

  // Métodos de Google OAuth
  async loginConGoogle(googleData: { email: string; name: string; picture?: string; sub: string }): Promise<LoginResponse> {
    const response = await this.api.post('/auth/google/login', googleData);
    return response.data;
  }

  async loginClienteConGoogle(subdominio: string, googleData: { email: string; name: string; picture?: string; sub: string }) {
    const response = await this.api.post(`/cliente/${subdominio}/auth/google/login`, googleData);
    return response.data;
  }

  async obtenerPerfil(): Promise<ApiResponse<Usuario>> {
    const response = await this.api.get('/auth/perfil');
    return response.data;
  }

  // Métodos de empresa
  async actualizarPersonalizacion(
    empresaId: number, 
    data: { 
      logoUrl?: string; 
      descripcion?: string;
      textoBienvenida?: string;
      colorPrimario?: string; 
      colorSecundario?: string;
      colorAcento?: string;
      colorFondo?: string;
      colorTexto?: string;
      colorTituloPrincipal?: string;
      colorCardFiltros?: string;
      imagenFondoUrl?: string;
      instagramUrl?: string;
      facebookUrl?: string;
    }
  ): Promise<ApiResponse<{ mensaje: string; empresa: Empresa }>> {
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

  async reactivarProducto(empresaId: number, id: number): Promise<ApiResponse<Producto>> {
    const response = await this.api.put(`/empresas/${empresaId}/productos/${id}/reactivar`);
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

  async obtenerMarcas(empresaId?: number): Promise<ApiResponse<string[]>> {
    if (empresaId) {
      const response = await this.api.get(`/empresas/${empresaId}/productos/marcas`);
      return response.data;
    } else {
      // Fallback temporal para compatibilidad
      const response = await this.api.get('/productos/marcas');
      return response.data;
    }
  }

  async obtenerSectoresAlmacenamiento(empresaId?: number): Promise<ApiResponse<string[]>> {
    if (empresaId) {
      const response = await this.api.get(`/empresas/${empresaId}/productos/sectores-almacenamiento`);
      return response.data;
    } else {
      // Fallback temporal para compatibilidad
      const response = await this.api.get('/productos/sectores-almacenamiento');
      return response.data;
    }
  }

  async obtenerProductosPorSector(empresaId: number, sector: string, activo?: boolean): Promise<Producto[]> {
    const params = new URLSearchParams();
    params.append('sector', sector);
    if (activo !== undefined) {
      params.append('activo', activo.toString());
    }
    
    const response = await this.api.get(`/empresas/${empresaId}/productos/por-sector?${params}`);
    return response.data;
  }

  async obtenerCodigosPersonalizados(empresaId?: number): Promise<ApiResponse<string[]>> {
    if (empresaId) {
      const response = await this.api.get(`/empresas/${empresaId}/productos/codigos-personalizados`);
      return response.data;
    } else {
      // Fallback temporal para compatibilidad
      const response = await this.api.get('/productos/codigos-personalizados');
      return response.data;
    }
  }

  async obtenerProductosPorCodigo(empresaId: number, codigo: string, activo?: boolean): Promise<Producto[]> {
    const params = new URLSearchParams();
    params.append('codigo', codigo);
    if (activo !== undefined) {
      params.append('activo', activo.toString());
    }
    
    const response = await this.api.get(`/empresas/${empresaId}/productos/por-codigo?${params}`);
    return response.data;
  }

  async obtenerCodigosBarras(empresaId?: number): Promise<ApiResponse<string[]>> {
    if (empresaId) {
      const response = await this.api.get(`/empresas/${empresaId}/productos/codigos-barras`);
      return response.data;
    } else {
      // Fallback temporal para compatibilidad
      const response = await this.api.get('/productos/codigos-barras');
      return response.data;
    }
  }

  async obtenerProductosPorCodigoBarras(empresaId: number, codigoBarras: string, activo?: boolean): Promise<Producto[]> {
    const params = new URLSearchParams();
    params.append('codigoBarras', codigoBarras);
    if (activo !== undefined) {
      params.append('activo', activo.toString());
    }
    
    const response = await this.api.get(`/empresas/${empresaId}/productos/por-codigo-barras?${params}`);
    return response.data;
  }

  async buscarProductoPorCodigoBarras(empresaId: number, codigoBarras: string): Promise<ApiResponse<Producto | null>> {
    const params = new URLSearchParams();
    params.append('codigoBarras', codigoBarras);
    
    const response = await this.api.get(`/empresas/${empresaId}/productos/buscar-por-codigo-barras?${params}`);
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

  async crearPedidoPublico(subdominio: string, pedido: {
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
    const response = await this.api.post(`/publico/${subdominio}/pedidos`, pedido);
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

  async subirImagen(archivo: File, tipo: 'logo' | 'producto' | 'fondo'): Promise<ApiResponse<{ url: string }>> {
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

  async actualizarPerfilCliente(subdominio: string, clienteId: number, data: {
    nombre: string;
    apellidos: string;
    email: string;
    telefono: string;
  }, token: string) {
    const response = await this.api.put(`/publico/${subdominio}/auth/perfil/${clienteId}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async cambiarPasswordCliente(subdominio: string, clienteId: number, data: {
    passwordActual: string;
    passwordNueva: string;
  }, token: string) {
    const response = await this.api.put(`/publico/${subdominio}/auth/password/${clienteId}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  // ============================================
  // MÉTODOS PARA PRODUCTOS FAVORITOS
  // ============================================

  async obtenerFavoritos(subdominio: string, token: string) {
    const response = await this.api.get(`/publico/${subdominio}/auth/favoritos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async agregarFavorito(subdominio: string, productoId: number, token: string) {
    const response = await this.api.post(`/publico/${subdominio}/auth/favoritos/${productoId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async removerFavorito(subdominio: string, productoId: number, token: string) {
    const response = await this.api.delete(`/publico/${subdominio}/auth/favoritos/${productoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async verificarFavorito(subdominio: string, productoId: number, token: string) {
    const response = await this.api.get(`/publico/${subdominio}/auth/favoritos/${productoId}/verificar`, {
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

    // Métodos de estadísticas de pedidos
    async obtenerEstadisticasPedidos(empresaId: number): Promise<ApiResponse<any>> {
        const response = await this.api.get(`/empresas/${empresaId}/pedidos/estadisticas`);
        return response.data;
    }

    async obtenerEstadisticasPedidosPorFecha(empresaId: number, fechaInicio: string, fechaFin: string): Promise<ApiResponse<any>> {
        const response = await this.api.get(`/empresas/${empresaId}/pedidos/estadisticas/por-fecha?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
        return response.data;
    }

    async obtenerEstadisticasPedidosDiarias(empresaId: number, fecha: string): Promise<ApiResponse<any>> {
        const response = await this.api.get(`/empresas/${empresaId}/pedidos/estadisticas/diarias?fecha=${fecha}`);
        return response.data;
    }

    async obtenerEstadisticasPedidosMensuales(empresaId: number, año: number, mes: number): Promise<ApiResponse<any>> {
        const response = await this.api.get(`/empresas/${empresaId}/pedidos/estadisticas/mensuales?año=${año}&mes=${mes}`);
        return response.data;
    }

    async obtenerEstadisticasPedidosAnuales(empresaId: number, año: number): Promise<ApiResponse<any>> {
        const response = await this.api.get(`/empresas/${empresaId}/pedidos/estadisticas/anuales?año=${año}`);
        return response.data;
    }

    async testEstadisticasPedidos(empresaId: number): Promise<ApiResponse<any>> {
        const response = await this.api.get(`/empresas/${empresaId}/pedidos/test-estadisticas`);
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

  // Métodos para venta rápida
  async procesarVentaRapida(ventaData: {
    clienteNombre: string;
    clienteEmail?: string;
    total: number;
    subtotal: number;
    metodoPago: string;
    montoRecibido?: number;
    vuelto?: number;
    observaciones?: string;
    detalles: Array<{
      productoId: number;
      productoNombre: string;
      cantidad: number;
      precioUnitario: number;
      subtotal: number;
    }>;
  }) {
    const response = await this.api.post('/admin/venta-rapida/procesar', ventaData);
    return response.data;
  }

  async debugVentaRapida(ventaData: {
    clienteNombre: string;
    clienteEmail?: string;
    total: number;
    subtotal: number;
    metodoPago: string;
    montoRecibido?: number;
    vuelto?: number;
    observaciones?: string;
    detalles: Array<{
      productoId: number;
      productoNombre: string;
      cantidad: number;
      precioUnitario: number;
      subtotal: number;
    }>;
  }) {
    const response = await this.api.post('/admin/venta-rapida/debug', ventaData);
    return response.data;
  }

  async obtenerEstadisticasVentaRapida(fechaInicio?: string, fechaFin?: string) {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    const response = await this.api.get(`/admin/venta-rapida/estadisticas?${params}`);
    return response.data;
  }

  async obtenerHistorialVentaRapida(fechaInicio?: string, fechaFin?: string) {
    if (fechaInicio && fechaFin) {
      // Si hay fechas, usar el endpoint específico para filtrado por fecha
      const response = await this.api.get(`/admin/venta-rapida/historial/por-fecha?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
      return response.data;
    } else {
      // Si no hay fechas, usar el endpoint general
      const response = await this.api.get('/admin/venta-rapida/historial');
      return response.data;
    }
  }

  // Métodos de notificaciones
  async obtenerNotificaciones(empresaId: number, pagina = 0, tamano = 10) {
    const response = await this.api.get(`/notificaciones/empresa/${empresaId}?pagina=${pagina}&tamano=${tamano}`);
    return response.data;
  }

  async obtenerNotificacionesRecientes(empresaId: number) {
    const response = await this.api.get(`/notificaciones/empresa/${empresaId}/recientes`);
    return response.data;
  }

  async obtenerNotificacionesNoLeidas(empresaId: number) {
    const response = await this.api.get(`/notificaciones/empresa/${empresaId}/no-leidas`);
    return response.data;
  }

  async contarNotificacionesNoLeidas(empresaId: number) {
    const response = await this.api.get(`/notificaciones/empresa/${empresaId}/contar-no-leidas`);
    return response.data;
  }

  async marcarNotificacionComoLeida(notificacionId: number) {
    const response = await this.api.put(`/notificaciones/${notificacionId}/marcar-leida`);
    return response.data;
  }

  async marcarTodasNotificacionesComoLeidas(empresaId: number) {
    const response = await this.api.put(`/notificaciones/empresa/${empresaId}/marcar-todas-leidas`);
    return response.data;
  }

  async limpiarNotificacionesAntiguas(empresaId: number) {
    const response = await this.api.delete(`/notificaciones/empresa/${empresaId}/limpiar-antiguas`);
    return response.data;
  }

  async eliminarNotificacion(notificacionId: number, empresaId: number) {
    const response = await this.api.delete(`/notificaciones/${notificacionId}?empresaId=${empresaId}`);
    return response.data;
  }

  async eliminarNotificaciones(empresaId: number, notificacionIds: number[]) {
    const response = await this.api.delete(`/notificaciones/empresa/${empresaId}/eliminar-multiples`, {
      data: notificacionIds
    });
    return response.data;
  }

  // Métodos de inventario
  async registrarOperacionInventario(request: any) {
    const response = await this.api.post('/admin/inventario/operacion', request);
    return response.data;
  }

  async obtenerHistorialInventario(pagina: number = 0, tamano: number = 20) {
    const response = await this.api.get(`/admin/inventario/historial?pagina=${pagina}&tamano=${tamano}`);
    return response.data;
  }

  async obtenerEstadisticasInventario() {
    const response = await this.api.get('/admin/inventario/estadisticas');
    return response.data;
  }

  async obtenerHistorialInventarioPorProducto(productoId: number) {
    const response = await this.api.get(`/admin/inventario/historial/producto/${productoId}`);
    return response.data;
  }

  async obtenerHistorialInventarioPorFechas(fechaInicio: string, fechaFin: string) {
    const response = await this.api.get(`/admin/inventario/historial/fechas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
    return response.data;
  }

  async obtenerEstadisticasInventarioPorFechas(fechaInicio: string, fechaFin: string) {
    const response = await this.api.get(`/admin/inventario/estadisticas/fechas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
    return response.data;
  }

  async obtenerProductosMasMovidosInventario(limite: number = 10) {
    const response = await this.api.get(`/admin/inventario/productos-mas-movidos?limite=${limite}`);
    return response.data;
  }

  async obtenerUsuariosMasActivosInventario(limite: number = 10) {
    const response = await this.api.get(`/admin/inventario/usuarios-mas-activos?limite=${limite}`);
    return response.data;
  }

  async buscarHistorialPorCodigoBarras(codigoBarras: string) {
    const response = await this.api.get(`/admin/inventario/buscar/codigo-barras/${codigoBarras}`);
    return response.data;
  }

  async debugInventario() {
    const response = await this.api.get('/admin/inventario/debug');
    return response.data;
  }

  async crearOperacionesPrueba() {
    const response = await this.api.post('/admin/inventario/test-registro');
    return response.data;
  }

  async testSqlEstadisticas() {
    const response = await this.api.get('/admin/inventario/test-sql-estadisticas');
    return response.data;
  }

  // ===== NUEVAS FUNCIONES PARA INVENTARIOS FÍSICOS =====

  /**
   * Obtener historial de inventarios físicos
   */
  async obtenerHistorialInventariosFisicos(pagina: number = 0, tamano: number = 20) {
    const response = await this.api.get(`/admin/inventario-fisico/historial?pagina=${pagina}&tamano=${tamano}`);
    return response.data;
  }

  /**
   * Obtener inventario físico por ID
   */
  async obtenerInventarioFisicoPorId(inventarioId: number) {
    const response = await this.api.get(`/admin/inventario-fisico/${inventarioId}`);
    return response.data;
  }

  /**
   * Guardar inventario físico
   */
  async guardarInventarioFisico(inventario: any) {
    const response = await this.api.post('/admin/inventario-fisico/guardar', inventario);
    return response.data;
  }

  /**
   * Eliminar inventario físico
   */
  async eliminarInventarioFisico(inventarioId: number) {
    const response = await this.api.delete(`/admin/inventario-fisico/${inventarioId}`);
    return response.data;
  }

  /**
   * Obtener estadísticas de inventarios físicos
   */
  async obtenerEstadisticasInventariosFisicos() {
    const response = await this.api.get('/admin/inventario-fisico/estadisticas');
    return response.data;
  }

  // Métodos para Historial de Carga de Productos
  async obtenerHistorialCargaProductos(
    empresaId: number,
    pagina: number = 0,
    tamano: number = 20,
    filtros?: {
      fechaInicio?: string;
      fechaFin?: string;
      tipoOperacion?: string;
      productoId?: number;
      usuarioId?: number;
      codigoBarras?: string;
    }
  ): Promise<ApiResponse<{
    contenido: any[];
    totalElementos: number;
    totalPaginas: number;
    paginaActual: number;
    tamano: number;
  }>> {
    const params = new URLSearchParams({
      empresaId: empresaId.toString(),
      pagina: pagina.toString(),
      tamanio: tamano.toString(),
      ...(filtros?.fechaInicio && { fechaInicio: filtros.fechaInicio }),
      ...(filtros?.fechaFin && { fechaFin: filtros.fechaFin }),
      ...(filtros?.tipoOperacion && { tipoOperacion: filtros.tipoOperacion }),
      ...(filtros?.productoId && { productoId: filtros.productoId.toString() }),
      ...(filtros?.usuarioId && { usuarioId: filtros.usuarioId.toString() }),
      ...(filtros?.codigoBarras && { codigoBarras: filtros.codigoBarras })
    });

    const response = await this.api.get(`/historial-carga-productos/buscar?${params}`);
    return response.data;
  }

  async obtenerEstadisticasHistorialCarga(empresaId: number): Promise<ApiResponse<{
    totalOperaciones: number;
    operacionesHoy: number;
    operacionesEstaSemana: number;
    operacionesEsteMes: number;
    valorTotalOperaciones: number;
    productosMasCargados: Array<{ productoId: number; nombre: string; cantidad: number }>;
    usuariosMasActivos: Array<{ usuarioId: number; nombre: string; operaciones: number }>;
    operacionesPorTipo: Array<{ tipo: string; cantidad: number }>;
  }>> {
    const response = await this.api.get(`/historial-carga-productos/estadisticas/${empresaId}`);
    return response.data;
  }

  async obtenerHistorialCargaPorProducto(empresaId: number, productoId: number): Promise<ApiResponse<any[]>> {
    const response = await this.api.get(`/historial-carga-productos/producto/${productoId}/empresa/${empresaId}`);
    return response.data;
  }

  async obtenerHistorialCargaPorFechas(
    empresaId: number,
    fechaInicio: string,
    fechaFin: string
  ): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams({
      fechaInicio,
      fechaFin
    });
    const response = await this.api.get(`/historial-carga-productos/fechas/empresa/${empresaId}?${params}`);
    return response.data;
  }

  async obtenerHistorialCargaPorCodigoBarras(empresaId: number, codigoBarras: string): Promise<ApiResponse<any[]>> {
    const response = await this.api.get(`/historial-carga-productos/codigo-barras/${codigoBarras}/empresa/${empresaId}`);
    return response.data;
  }

  async obtenerHistorialCargaPorUsuario(empresaId: number, usuarioId: number): Promise<ApiResponse<any[]>> {
    const response = await this.api.get(`/historial-carga-productos/usuario/${usuarioId}/empresa/${empresaId}`);
    return response.data;
  }

  // Métodos para códigos de barras
  async generarCodigoBarras(empresaId: number): Promise<ApiResponse<{ codigoBarras: string }>> {
    const response = await this.api.post(`/empresas/${empresaId}/productos/generar-codigo-barras`);
    return response.data;
  }

  async verificarCodigoBarras(empresaId: number, codigoBarras: string): Promise<ApiResponse<{ existe: boolean; codigoBarras: string }>> {
    const response = await this.api.get(`/empresas/${empresaId}/productos/verificar-codigo-barras`, {
      params: { codigoBarras }
    });
    return response.data;
  }

  // Métodos para Super Admin
  async getSuperAdminDashboard() {
    const response = await this.api.get('/super-admin/dashboard');
    return response.data;
  }

  async getSuperAdminEmpresas(params: any = {}) {
    console.log('🔍 ApiService - Iniciando llamada a /super-admin/empresas');
    console.log('🔍 ApiService - Parámetros:', params);
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    console.log('🔍 ApiService - URL final:', `/super-admin/empresas?${queryParams}`);
    const response = await this.api.get(`/super-admin/empresas?${queryParams}`);
    console.log('🔍 ApiService - Respuesta completa:', response);
    console.log('🔍 ApiService - Datos de respuesta:', response.data);
    return response.data;
  }

  async getSuperAdminEmpresa(id: number) {
    const response = await this.api.get(`/super-admin/empresas/${id}`);
    return response.data;
  }

  async updateSuperAdminEmpresaEstado(id: number, estado: string) {
    const response = await this.api.put(`/super-admin/empresas/${id}/estado?estado=${estado}`);
    return response.data;
  }

  async getSuperAdminEstadisticasSuscripciones() {
    const response = await this.api.get('/super-admin/suscripciones/estadisticas');
    return response.data;
  }

  // Métodos para gestión de planes
  async getSuperAdminPlanes() {
    const response = await this.api.get('/super-admin/suscripciones/planes');
    return response.data;
  }

  async getSuperAdminPlan(id: number) {
    const response = await this.api.get(`/super-admin/suscripciones/planes/${id}`);
    return response.data;
  }

  async createSuperAdminPlan(plan: any) {
    const response = await this.api.post('/super-admin/suscripciones/planes', plan);
    return response.data;
  }

  async updateSuperAdminPlan(id: number, plan: any) {
    const response = await this.api.put(`/super-admin/suscripciones/planes/${id}`, plan);
    return response.data;
  }

  async deleteSuperAdminPlan(id: number) {
    const response = await this.api.delete(`/super-admin/suscripciones/planes/${id}`);
    return response.data;
  }

  // Métodos para gestión de suscripciones
  async getSuperAdminSuscripciones(params: any = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    const response = await this.api.get(`/super-admin/suscripciones?${queryParams}`);
    return response.data;
  }

  async getSuperAdminSuscripcion(id: number) {
    const response = await this.api.get(`/super-admin/suscripciones/${id}`);
    return response.data;
  }

  async createSuperAdminSuscripcion(suscripcion: any) {
    const response = await this.api.post('/super-admin/suscripciones', suscripcion);
    return response.data;
  }

  async cancelarSuperAdminSuscripcion(id: number, motivo: string) {
    const response = await this.api.post(`/super-admin/suscripciones/${id}/cancelar`, { motivo });
    return response.data;
  }

  async suspenderSuperAdminSuscripcion(id: number) {
    const response = await this.api.post(`/super-admin/suscripciones/${id}/suspender`);
    return response.data;
  }

  async reactivarSuperAdminSuscripcion(id: number) {
    const response = await this.api.post(`/super-admin/suscripciones/${id}/reactivar`);
    return response.data;
  }

  async renovarSuperAdminSuscripcion(id: number) {
    const response = await this.api.post(`/super-admin/suscripciones/${id}/renovar`);
    return response.data;
  }

  async getSuperAdminSuscripcionesPorExpirar() {
    const response = await this.api.get('/super-admin/suscripciones/por-expirar');
    return response.data;
  }

  async getSuperAdminSuscripcionesExpiradas() {
    const response = await this.api.get('/super-admin/suscripciones/expiradas');
    return response.data;
  }

  async procesarRenovacionesAutomaticas() {
    const response = await this.api.post('/super-admin/suscripciones/procesar-renovaciones');
    return response.data;
  }

  async getSuperAdminEmpresasPorExpirar() {
    const response = await this.api.get('/super-admin/empresas/por-expirar');
    return response.data;
  }

  async getSuperAdminTopEmpresasPorIngresos(limite: number = 10) {
    const response = await this.api.get(`/super-admin/empresas/top-ingresos?limite=${limite}`);
    return response.data;
  }

  async getSuperAdminEmpresasEnRiesgo() {
    const response = await this.api.get('/super-admin/empresas/en-riesgo');
    return response.data;
  }

  async getSuperAdminAlertas(soloNoLeidas: boolean = false) {
    const response = await this.api.get(`/super-admin/alertas?soloNoLeidas=${soloNoLeidas}`);
    return response.data;
  }

  async marcarSuperAdminAlertaComoLeida(id: number) {
    const response = await this.api.put(`/super-admin/alertas/${id}/leer`);
    return response.data;
  }

  async getSuperAdminNotificaciones(soloNoLeidas: boolean = false) {
    const response = await this.api.get(`/super-admin/notificaciones?soloNoLeidas=${soloNoLeidas}`);
    return response.data;
  }

  async marcarSuperAdminNotificacionComoLeida(id: number) {
    const response = await this.api.put(`/super-admin/notificaciones/${id}/leer`);
    return response.data;
  }

  async getSuperAdminReporteIngresos(fechaDesde: string, fechaHasta: string) {
    const response = await this.api.get(`/super-admin/reportes/ingresos?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`);
    return response.data;
  }

  async getSuperAdminReporteCrecimiento(meses: number = 12) {
    const response = await this.api.get(`/super-admin/reportes/crecimiento?meses=${meses}`);
    return response.data;
  }

  async enviarSuperAdminNotificacionEmpresa(id: number, notificacion: any) {
    const response = await this.api.post(`/super-admin/empresas/${id}/notificar`, notificacion);
    return response.data;
  }

  async getSuperAdminLogs(params: any = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    const response = await this.api.get(`/super-admin/logs?${queryParams}`);
    return response.data;
  }

  // Métodos de recuperación de contraseña
  async solicitarRecuperacionPassword(email: string) {
    const response = await this.api.post('/auth/recuperar-password', { email });
    return response.data;
  }

  async validarTokenRecuperacion(token: string) {
    const response = await this.api.get(`/auth/validar-token/${token}`);
    return response.data;
  }

  async cambiarPasswordRecuperacion(token: string, nuevaPassword: string, confirmarPassword: string) {
    const response = await this.api.post('/auth/cambiar-password', {
      token,
      nuevaPassword,
      confirmarPassword
    });
    return response.data;
  }

  // Métodos para recuperación de contraseña de clientes
  async solicitarRecuperacionPasswordCliente(subdominio: string, email: string) {
    const response = await this.api.post(`/publico/${subdominio}/auth/solicitar-recuperacion`, {
      email
    });
    return response.data;
  }

  async validarTokenRecuperacionCliente(subdominio: string, token: string) {
    const response = await this.api.get(`/publico/${subdominio}/auth/validar-token/${token}`);
    return response.data;
  }

  async cambiarPasswordConTokenCliente(subdominio: string, data: { token: string; password: string }) {
    const response = await this.api.post(`/publico/${subdominio}/auth/cambiar-password-token`, data);
    return response.data;
  }
}

export default new ApiService();
