# Sistema Multi-Tenant - miNegocio

## Descripción del Proyecto

**miNegocio** es una plataforma multi-tenant que permite a administradores de negocios crear su propia tienda online personalizada con un subdominio único. Los clientes pueden acceder a través del subdominio para ver productos y realizar pedidos.

## Arquitectura Multi-Tenant

### Cómo Funciona

1. **Dominio Principal** (`localhost:5173`): 
   - Página de registro de empresas
   - Panel de administración para los dueños de negocios
   - Gestión de productos, clientes y pedidos

2. **Subdominios** (`empresa.localhost:5173`):
   - Tienda personalizada para cada empresa
   - Catálogo de productos específico
   - Portal de login/registro para clientes
   - Experiencia de compra personalizada

### Detección de Subdominios

El sistema detecta automáticamente si estás en:
- **Dominio principal**: Muestra la plataforma de registro de empresas
- **Subdominio**: Muestra la tienda personalizada de esa empresa

## Configuración para Desarrollo

### 1. Configurar el Archivo Hosts

Para probar subdominios en desarrollo local, necesitas modificar tu archivo hosts:

**Windows**: `C:\Windows\System32\drivers\etc\hosts`
**macOS/Linux**: `/etc/hosts`

Agregar líneas como:
```
127.0.0.1 ejemplo.localhost
127.0.0.1 mitienda.localhost
127.0.0.1 negocio123.localhost
```

### 2. Flujo de Prueba

1. **Registrar una empresa**:
   - Ve a `http://localhost:5173`
   - Registra una empresa con subdominio "ejemplo"

2. **Acceder a la tienda**:
   - Ve a `http://ejemplo.localhost:5173`
   - Verás la tienda personalizada de esa empresa

3. **Experiencia del cliente**:
   - Los clientes ven solo la tienda de esa empresa
   - Pueden registrarse y hacer login específicamente en esa tienda
   - Los colores y logo se personalizan según la empresa

## Estructura del Proyecto

### Frontend
```
src/
├── hooks/
│   └── useSubdominio.ts         # Detecta subdominios y obtiene info de empresa
├── pages/
│   ├── PaginaPrincipal.tsx      # Página principal (dominio principal)
│   ├── PaginaRegistro.tsx       # Registro de empresas (dominio principal)
│   ├── LoginAdministrador.tsx   # Login para administradores
│   ├── DashboardAdministrador.tsx # Panel de admin
│   ├── TiendaCliente.tsx        # Tienda para clientes (subdominios)
│   ├── LoginCliente.tsx         # Login para clientes (subdominios)
│   └── RegistroCliente.tsx      # Registro para clientes (subdominios)
├── components/
│   └── InfoMultiTenant.tsx      # Info de desarrollo (solo localhost)
└── App.tsx                      # Routing basado en subdominio
```

### Servicios

- **useSubdominio**: Hook que detecta automáticamente si estás en un subdominio
- **apiService**: Maneja llamadas a la API con contexto de empresa
- **Routing dinámico**: Muestra diferentes rutas según el tipo de dominio

## Personalización por Empresa

Cada empresa puede personalizar:
- **Logo**: Imagen de marca
- **Colores**: Primario y secundario
- **Subdominio**: URL única (ej: `mitienda.minegocio.com`)
- **Contenido**: Productos, descripción, información de contacto

## Tecnologías Utilizadas

### Frontend
- **React 18** con TypeScript
- **Vite** como build tool
- **React Router** para routing
- **CSS Variables** para personalización dinámica
- **React Hot Toast** para notificaciones

### Backend (estructura esperada)
- **Java Spring Boot**
- **PostgreSQL** con diseño multi-tenant
- **JWT** para autenticación
- **REST API** con contexto de empresa

## Variables de Entorno

```env
VITE_API_URL=http://localhost:8080/api
```

## Scripts Disponibles

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build
npm run build

# Preview
npm run preview
```

## Próximos Pasos

### Funcionalidades Pendientes
1. **Carrito de compras** funcional
2. **Proceso de checkout** completo
3. **Área del cliente** con historial de pedidos
4. **Gestión de inventario** en tiempo real
5. **Sistema de pagos** integrado
6. **Notificaciones** por email/SMS
7. **Dashboard de estadísticas** avanzado

### Mejoras Técnicas
1. **Autenticación JWT** completa
2. **Middleware de subdominio** en el backend
3. **Cache** para información de empresas
4. **Optimización de imágenes**
5. **PWA** capabilities
6. **Tests unitarios e integración**

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.
