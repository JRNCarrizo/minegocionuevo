// Tipos para las entidades del backend

export interface Empresa {
  id: number;
  nombre: string;
  subdominio: string;
  email: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  codigoPostal?: string;
  pais?: string;
  descripcion?: string;
  textoBienvenida?: string;
  logoUrl?: string;
  colorPrimario: string;
  colorSecundario: string;
  colorAcento?: string;
  colorFondo?: string;
  colorTexto?: string;
  colorTituloPrincipal?: string;
  colorCardFiltros?: string;
  imagenFondoUrl?: string;
  moneda: string;
  instagramUrl?: string;
  facebookUrl?: string;
  mercadolibreUrl?: string;
  estadoSuscripcion: 'PRUEBA' | 'ACTIVA' | 'SUSPENDIDA' | 'CANCELADA';
  fechaFinPrueba: string;
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  totalUsuarios?: number;
  totalProductos?: number;
  totalClientes?: number;
  totalPedidos?: number;
}

export interface Usuario {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  telefono?: string;
  rol: 'ADMINISTRADOR' | 'EMPLEADO';
  activo: boolean;
  emailVerificado: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  ultimoAcceso?: string;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  stockMinimo?: number;
  imagenUrl?: string;
  imagenes?: string[];
  categoria?: string;
  marca?: string;
  unidad?: string;
  sectorAlmacenamiento?: string;
  codigoPersonalizado?: string;
  codigoBarras?: string;
  activo: boolean;
  destacado?: boolean;
  empresaId: number;
  empresaNombre?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface ProductoFavorito {
  id: number;
  clienteId: number;
  clienteNombre: string;
  producto: Producto;
  empresaId: number;
  empresaNombre: string;
  fechaAgregado: string;
}

export interface Cliente {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  codigoPostal?: string;
  pais?: string;
  fechaNacimiento?: string;
  tipo: 'REGULAR' | 'PREMIUM' | 'VIP';
  activo: boolean;
  aceptaMarketing: boolean;
  emailVerificado: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  ultimoAcceso?: string;
  totalPedidos?: number;
  totalCompras?: number;
}

export interface Pedido {
  id: number;
  numeroPedido: string;
  estado: 'PENDIENTE' | 'CONFIRMADO' | 'PREPARANDO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';
  total: number;
  subtotal: number;
  impuestos?: number;
  descuento?: number;
  observaciones?: string;
  direccionEntrega?: string;
  fechaEntregaEstimada?: string;
  fechaEntregaReal?: string;
  cliente: Cliente;
  detalles: DetallePedido[];
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface DetallePedido {
  id: number;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
  subtotal: number; // Agregar subtotal
  observaciones?: string;
  producto: Producto;
  nombreProducto: string;
  productoNombre: string; // Nuevo campo del DTO
  productoDescripcion?: string; // Nuevo campo del DTO
  productoImagen?: string; // Nuevo campo del DTO
  productoCategoria?: string; // Nuevo campo del DTO
  productoMarca?: string; // Nuevo campo del DTO
  descripcionProducto?: string;
  categoriaProducto?: string;
  marcaProducto?: string; // Campo de la entidad
}

export interface Mensaje {
  id: number;
  asunto: string;
  contenido: string;
  tipo: 'CONSULTA' | 'RECLAMO' | 'SUGERENCIA' | 'SOPORTE';
  estado: 'PENDIENTE' | 'RESPONDIDO' | 'CERRADO';
  leido: boolean;
  respuesta?: string;
  fechaRespuesta?: string;
  cliente: Cliente;
  producto?: Producto;
  respondidoPor?: Usuario;
  fechaCreacion: string;
  fechaActualizacion: string;
}

// DTOs para formularios

export interface RegistroEmpresaDTO {
  nombreEmpresa: string;
  subdominio: string;
  emailEmpresa: string;
  telefonoEmpresa?: string;
  direccionEmpresa?: string;
  ciudadEmpresa?: string;
  codigoPostalEmpresa?: string;
  paisEmpresa?: string;
  nombreAdministrador: string;
  apellidosAdministrador: string;
  emailAdministrador: string;
  passwordAdministrador: string;
  confirmarPasswordAdministrador: string;
  telefonoAdministrador?: string;
  aceptaTerminos: boolean;
  aceptaMarketing: boolean;
}

export interface LoginDTO {
  usuario: string; // puede ser email o nombre de usuario
  contrasena: string;
}

export interface ProductoFormDTO {
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  stockMinimo: number;
  categoria?: string;
  marca?: string;
  unidad?: string;
  sectorAlmacenamiento?: string;
  codigoPersonalizado?: string;
  codigoBarras?: string;
  destacado: boolean;
  imagenes: string[];
}

export interface ClienteFormDTO {
  nombre: string;
  apellidos: string;
  email: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  codigoPostal?: string;
  pais?: string;
  fechaNacimiento?: string;
  tipo: 'REGULAR' | 'PREMIUM' | 'VIP';
  aceptaMarketing: boolean;
}

// Respuestas de la API

export interface ApiResponse<T = unknown> {
  mensaje: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// Tipos para autenticación
export interface LoginResponse {
  token: string;
  nombreUsuario: string;
  email: string;
  nombre: string;
  apellidos: string;
  roles: string[];
  empresaId: number;
  empresaNombre: string;
  empresaSubdominio: string;
  // Propiedades para usuarios nuevos con Google
  usuarioNuevo?: boolean;
  mensaje?: string;
  datosGoogle?: {
    email: string;
    name: string;
    picture?: string;
    sub: string;
  };
}

export interface Notificacion {
  id: number;
  tipo: 'PEDIDO_NUEVO' | 'PRODUCTO_ACTUALIZADO' | 'CLIENTE_NUEVO' | 'PEDIDO_CANCELADO' | 'VENTA_RAPIDA' | 'STOCK_BAJO' | 'PEDIDO_COMPLETADO' | 'REPORTE_GENERADO';
  titulo: string;
  descripcion: string;
  detalles?: string; // JSON string con información adicional
  empresaId: number;
  fechaCreacion: string;
  leida: boolean;
  icono?: string;
  color?: string;
}

// Tipo para errores de API
export interface ApiError {
  response?: {
    data?: {
      error?: string;
      mensaje?: string;
    };
  };
  message?: string;
}
