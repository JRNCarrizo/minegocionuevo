# 🏪 miNegocio - Sistema de Gestión de Negocios Multi-Tenant

Una plataforma completa para la gestión de negocios online que permite a cualquier empresa crear su propia tienda virtual con panel de administración personalizable y portal de clientes.

## 🌟 Características Principales

### 🌐 Página de Entrada Principal
- **Presentación de la Plataforma**: Explicación clara de funcionalidades y beneficios
- **Formulario de Registro**: Para administradores de empresas, comercios y negocios
- **Promoción Inicial**: Un mes de uso gratuito sin necesidad de tarjeta de crédito
- **Subdominio Personalizado**: Cada empresa recibe su propio subdominio

### 🛠️ Panel del Administrador
- **🎨 Personalización de la Interfaz**
  - Subida de logo empresarial
  - Selector de colores personalizados
  - Logo visible en navegación, panel principal y login de clientes

- **📦 Gestión de Stock y Productos**
  - CRUD completo de productos
  - Dos vistas: lista y cuadrícula con imágenes
  - Asignación de fotos, precios y descripciones
  - Control de stock con opciones de aumento/disminución
  - Filtros personalizables (categoría, marca, nombre)
  - Campos del formulario renombrables desde el frontend

- **👥 Clientes y Pedidos**
  - Visualización de clientes registrados
  - Detalle completo de pedidos (fechas, cantidades, estado)
  - Cancelación de pedidos con reintegro automático de stock
  - Panel de estadísticas con productos más vendidos
  - Bandeja de mensajes para consultas de clientes
  - Área de sugerencias para mejoras

### 🛒 Portal del Cliente
- **Catálogo de Productos**: Visualización completa con detalles
- **Gestión del Carrito**
  - Selección de productos y cantidades
  - Edición del carrito (eliminar, modificar cantidades)
  - Proceso de compra con notificación al administrador
  - Descuento automático de stock

- **Comunicación y Registro**
  - Envío de preguntas desde fichas de productos
  - Historial personal de pedidos y compras
  - Sistema de registro y acceso personalizado

### ⚙️ Funcionalidades Adicionales
- **Control automático de stock mínimo** con notificaciones
- **Personalización fiscal** con opciones de impuestos (IVA)
- **Multilenguaje** para alcance global
- **Arquitectura multi-tenant** con aislamiento total de datos

## 🏗️ Arquitectura Técnica

### Backend (Java Spring Boot)
- **Lenguaje**: Java 17
- **Framework**: Spring Boot 3.3.6
- **Base de datos**: PostgreSQL (H2 para desarrollo)
- **Autenticación**: JWT + Spring Security
- **API**: REST con documentación OpenAPI

### Frontend (React + Vite)
- **Framework**: React 18 con TypeScript
- **Build Tool**: Vite
- **Estilos**: Tailwind CSS
- **Estado**: Context API + Zustand
- **Formularios**: React Hook Form + Yup

## 📁 Estructura del Proyecto

```
miNegocio/
├── backend/                    # Aplicación Spring Boot
│   ├── src/main/java/com/minegocio/backend/
│   │   ├── entidades/         # Entidades JPA
│   │   ├── repositorios/      # Repositorios Spring Data
│   │   ├── servicios/         # Lógica de negocio
│   │   ├── controladores/     # Controladores REST
│   │   ├── dto/              # DTOs de transferencia
│   │   ├── configuracion/     # Configuraciones
│   │   └── seguridad/        # Autenticación y autorización
│   └── src/main/resources/
│       └── application.properties
├── frontend/                   # Aplicación React
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   ├── pages/            # Páginas principales
│   │   ├── services/         # Servicios API
│   │   ├── types/            # Tipos TypeScript
│   │   ├── hooks/            # Hooks personalizados
│   │   └── store/            # Estado global
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Java 17+
- Node.js 18+
- Maven 3.8+
- PostgreSQL 13+ (opcional, usa H2 en desarrollo)

### Backend
1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd miNegocio
   ```

2. **Configurar la base de datos** (opcional)
   ```properties
   # application.properties para PostgreSQL
   spring.datasource.url=jdbc:postgresql://localhost:5432/minegocio_db
   spring.datasource.username=tu_usuario
   spring.datasource.password=tu_password
   ```

3. **Ejecutar el backend**
   ```bash
   mvn spring-boot:run
   ```
   El servidor estará disponible en `http://localhost:8080`

### Frontend
1. **Instalar dependencias**
   ```bash
   cd frontend
   npm install
   ```

2. **Configurar variables de entorno**
   ```bash
   # .env.local
   VITE_API_URL=http://localhost:8080/api
   ```

3. **Ejecutar el frontend**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173`

## 🎯 Casos de Uso

### Para Administradores de Empresa
1. **Registro**: Crear cuenta con datos de empresa y administrador
2. **Personalización**: Configurar logo, colores y branding
3. **Gestión de Productos**: Añadir catálogo con fotos y precios
4. **Gestión de Pedidos**: Procesar pedidos y comunicarse con clientes
5. **Análisis**: Revisar estadísticas y productos más vendidos

### Para Clientes
1. **Acceso**: Entrar al portal a través del subdominio de la empresa
2. **Navegación**: Explorar catálogo con filtros y búsquedas
3. **Compras**: Añadir productos al carrito y realizar pedidos
4. **Comunicación**: Enviar consultas sobre productos específicos
5. **Historial**: Revisar pedidos anteriores y su estado

## 🔧 Tecnologías Utilizadas

### Backend
- **Spring Boot 3.3.6**: Framework principal
- **Spring Security**: Autenticación y autorización
- **Spring Data JPA**: Persistencia de datos
- **H2/PostgreSQL**: Base de datos
- **JWT**: Tokens de autenticación
- **MapStruct**: Mapeo de objetos
- **OpenAPI**: Documentación de API

### Frontend
- **React 18**: Interfaz de usuario
- **TypeScript**: Tipado estático
- **Vite**: Build tool y desarrollo
- **Tailwind CSS**: Estilos y diseño
- **React Router**: Enrutamiento
- **Axios**: Cliente HTTP
- **React Hook Form**: Gestión de formularios
- **Zustand**: Estado global

## 📊 Modelo de Datos

### Entidades Principales
- **Empresa**: Información de la empresa y configuración
- **Usuario**: Administradores y empleados
- **Producto**: Catálogo de productos con imágenes
- **Cliente**: Clientes registrados de cada empresa
- **Pedido**: Pedidos realizados por clientes
- **DetallePedido**: Líneas de productos en pedidos
- **Mensaje**: Comunicación entre clientes y administradores

### Relaciones
- Empresa ↔ Usuario (1:N)
- Empresa ↔ Producto (1:N)
- Empresa ↔ Cliente (1:N)
- Cliente ↔ Pedido (1:N)
- Pedido ↔ DetallePedido (1:N)
- Producto ↔ DetallePedido (1:N)

## 🔐 Seguridad

- **Autenticación JWT**: Tokens seguros con expiración
- **Multi-tenancy**: Aislamiento total de datos por empresa
- **Validación de entrada**: Sanitización de todos los inputs
- **CORS configurado**: Solo orígenes autorizados
- **HTTPS ready**: Preparado para SSL en producción

## 🚀 Deployment

### Desarrollo
- Backend: `mvn spring-boot:run`
- Frontend: `npm run dev`
- Base de datos: H2 en memoria

### Producción
- Backend: JAR ejecutable
- Frontend: Build estático para servir
- Base de datos: PostgreSQL
- Proxy reverso: Nginx recomendado

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🎯 Roadmap

- [ ] **v1.1**: Integración con pasarelas de pago
- [ ] **v1.2**: Sistema de notificaciones en tiempo real
- [ ] **v1.3**: App móvil para administradores
- [ ] **v1.4**: Marketplace de templates
- [ ] **v1.5**: Integraciones con redes sociales
- [ ] **v2.0**: Funcionalidades de e-commerce avanzadas

## 📞 Soporte

Para soporte técnico o preguntas sobre el proyecto:
- **Email**: soporte@minegocio.com
- **Documentación**: [docs.minegocio.com](https://docs.minegocio.com)
- **Issues**: [GitHub Issues](https://github.com/minegocio/issues)

---

**miNegocio** - Digitalizando negocios, un subdominio a la vez 🚀

¡No te preocupes! Sí puedes recuperarlo fácilmente. El backend está definido en tu `render.yaml`, así que Render puede recrearlo automáticamente.

## **Pasos para recuperar el backend:**

### 1. **Verificar que el render.yaml esté correcto**
Tu archivo `render.yaml` ya tiene la configuración del backend:

```yaml
# Backend Spring Boot
- type: web
  name: minegocio-backend
  env: java
  buildCommand: cd backend && ./mvnw clean package -DskipTests
  startCommand: cd backend && java -jar target/miNegocio-Backend-0.0.1-SNAPSHOT.jar
```

### 2. **Crear el backend desde render.yaml**
- Ve a tu dashboard de Render
- Haz clic en **"New"** → **"Blueprint"**
- Selecciona tu repositorio: `JRNCarrizo/minegocionuevo`
- Render detectará automáticamente el `render.yaml`
- Haz clic en **"Apply"**

### 3. **O crear el backend manualmente**
Si prefieres crearlo manualmente:

- **New** → **Web Service**
- **Repository:** `JRNCarrizo/minegocionuevo`
- **Branch:** `master`
- **Root Directory:** `backend`
- **Runtime:** `Java`
- **Build Command:** `./mvnw clean package -DskipTests`
- **Start Command:** `java -jar target/miNegocio-Backend-0.0.1-SNAPSHOT.jar`

### 4. **Variables de entorno necesarias:**
```
SPRING_PROFILES_ACTIVE=render
SPRING_DATASOURCE_URL=(se conectará automáticamente a la base de datos)
MINE_NEGOCIO_APP_JWT_SECRET=(se generará automáticamente)
MINE_NEGOCIO_APP_FRONTEND_URL=https://negocio360.org
```

## **¿Quieres que te ayude a recrearlo usando el Blueprint (opción más fácil)?**

El Blueprint recreará automáticamente tanto el backend como la base de datos con la configuración correcta.
