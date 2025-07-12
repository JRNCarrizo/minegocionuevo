# Funcionalidad: Sector de Almacenamiento, Código Personalizado y Código de Barras - MiNegocio

## Descripción
Se han agregado tres nuevas funcionalidades opcionales para mejorar la organización del inventario:

1. **Sector de Almacenamiento**: Permite asignar ubicaciones específicas como "depósito2", "habitación A33", "góndola 4", "estante 23", etc.
2. **Código Personalizado**: Permite asignar códigos únicos como "330", "420", "EL001", "ROP001", etc.
3. **Código de Barras**: Permite escanear o ingresar códigos de barras estándar como EAN-13, UPC, Code 128, etc.

Esto facilita la migración desde sistemas existentes y mejora la organización del inventario.

## Características

### Sector de Almacenamiento
- ✅ Campo opcional en la creación y edición de productos
- ✅ Autocompletado con sectores existentes
- ✅ Reutilización de sectores en futuras creaciones
- ✅ Almacenamiento persistente en base de datos
- ✅ Endpoint API para obtener sectores existentes
- ✅ Filtro por sector en la gestión de productos
- ✅ Búsqueda combinada (sector + texto)
- ✅ Filtro dinámico (solo aparece si hay sectores)

### Código Personalizado
- ✅ Campo opcional en la creación y edición de productos
- ✅ Autocompletado con códigos existentes
- ✅ Reutilización de códigos en futuras creaciones
- ✅ Almacenamiento persistente en base de datos
- ✅ Endpoint API para obtener códigos existentes
- ✅ Filtro por código en la gestión de productos
- ✅ Búsqueda combinada (código + texto)
- ✅ Filtro dinámico (solo aparece si hay códigos)

### Código de Barras
- ✅ Campo opcional en la creación y edición de productos
- ✅ **Tres opciones de entrada**:
  - 📷 Escáner de cámara integrado (HTML5-QR-Code)
  - 🔗 Escáner físico (USB/Bluetooth) - funciona como teclado
  - ✏️ Ingreso manual de códigos
- ✅ Soporte para múltiples formatos (EAN-13, UPC, Code 128, etc.)
- ✅ Almacenamiento persistente en base de datos
- ✅ Endpoint API para obtener códigos existentes
- ✅ Filtro por código de barras en la gestión de productos
- ✅ Búsqueda combinada (código + texto)
- ✅ Filtro dinámico (solo aparece si hay códigos)
- ✅ Verificación de duplicados

## Cambios Realizados

### Backend

#### 1. Entidad Producto
- **Archivo**: `backend/src/main/java/com/minegocio/backend/entidades/Producto.java`
- **Cambios**: 
  - Agregado campo `sectorAlmacenamiento` con validación de longitud máxima 100 caracteres
  - Agregado campo `codigoPersonalizado` con validación de longitud máxima 50 caracteres
  - Agregado campo `codigoBarras` con validación de longitud máxima 50 caracteres

#### 2. DTO ProductoDTO
- **Archivo**: `backend/src/main/java/com/minegocio/backend/dto/ProductoDTO.java`
- **Cambios**: 
  - Agregado campo `sectorAlmacenamiento` con getters y setters
  - Agregado campo `codigoPersonalizado` con getters y setters
  - Agregado campo `codigoBarras` con getters y setters

#### 3. Servicio ProductoService
- **Archivo**: `backend/src/main/java/com/minegocio/backend/servicios/ProductoService.java`
- **Cambios**:
  - Método `crearProducto`: Incluye los tres nuevos campos
  - Método `actualizarProducto`: Maneja actualización de los tres campos
  - Método `convertirADTO`: Incluye los tres campos en la conversión
  - Nuevo método `obtenerSectoresAlmacenamientoPorEmpresa`: Obtiene sectores únicos
  - Nuevo método `obtenerCodigosPersonalizadosPorEmpresa`: Obtiene códigos únicos
  - Nuevo método `obtenerCodigosBarrasPorEmpresa`: Obtiene códigos de barras únicos
  - Nuevo método `obtenerProductosPorCodigo`: Filtra productos por código personalizado
  - Nuevo método `obtenerProductosPorCodigoYEstado`: Filtra productos por código personalizado y estado
  - Nuevo método `obtenerProductosPorCodigoBarras`: Filtra productos por código de barras
  - Nuevo método `obtenerProductosPorCodigoBarrasYEstado`: Filtra productos por código de barras y estado
  - Nuevo método `buscarProductoPorCodigoBarras`: Busca un producto específico por código de barras

#### 4. Repositorio ProductoRepository
- **Archivo**: `backend/src/main/java/com/minegocio/backend/repositorios/ProductoRepository.java`
- **Cambios**: 
  - Método `findSectoresAlmacenamientoPorEmpresa` para obtener sectores únicos
  - Método `findCodigosPersonalizadosPorEmpresa` para obtener códigos únicos
  - Método `findCodigosBarrasPorEmpresa` para obtener códigos de barras únicos
  - Método `findByEmpresaIdAndCodigoPersonalizado` para filtrar por código personalizado
  - Método `findByEmpresaIdAndCodigoPersonalizadoAndActivo` para filtrar por código personalizado y estado
  - Método `findByEmpresaIdAndCodigoBarras` para filtrar por código de barras
  - Método `findByEmpresaIdAndCodigoBarrasAndActivo` para filtrar por código de barras y estado

#### 5. Controlador ProductoController
- **Archivo**: `backend/src/main/java/com/minegocio/backend/controladores/ProductoController.java`
- **Cambios**:
  - Endpoint `GET /sectores-almacenamiento` para obtener sectores existentes
  - Endpoint `GET /por-sector` para filtrar productos por sector
  - Endpoint `GET /codigos-personalizados` para obtener códigos existentes
  - Endpoint `GET /por-codigo` para filtrar productos por código personalizado
  - Endpoint `GET /codigos-barras` para obtener códigos de barras existentes
  - Endpoint `GET /por-codigo-barras` para filtrar productos por código de barras
  - Endpoint `GET /buscar-por-codigo-barras` para buscar un producto específico por código de barras

### Frontend

#### 1. Tipos TypeScript
- **Archivo**: `frontend/src/types/index.ts`
- **Cambios**:
  - Agregado `sectorAlmacenamiento?: string` al tipo `Producto`
  - Agregado `codigoPersonalizado?: string` al tipo `Producto`
  - Agregado `codigoBarras?: string` al tipo `Producto`
  - Agregado `sectorAlmacenamiento?: string` al tipo `ProductoFormDTO`
  - Agregado `codigoPersonalizado?: string` al tipo `ProductoFormDTO`
  - Agregado `codigoBarras?: string` al tipo `ProductoFormDTO`

#### 2. Servicio API
- **Archivo**: `frontend/src/services/api.ts`
- **Cambios**:
  - Método `obtenerSectoresAlmacenamiento()` para obtener sectores desde el backend
  - Método `obtenerProductosPorSector()` para filtrar productos por sector
  - Método `obtenerCodigosPersonalizados()` para obtener códigos desde el backend
  - Método `obtenerProductosPorCodigo()` para filtrar productos por código personalizado
  - Método `obtenerCodigosBarras()` para obtener códigos de barras desde el backend
  - Método `obtenerProductosPorCodigoBarras()` para filtrar productos por código de barras
  - Método `buscarProductoPorCodigoBarras()` para buscar un producto específico por código de barras

#### 3. Componente BarcodeScanner
- **Archivo**: `frontend/src/components/BarcodeScanner.tsx`
- **Nuevo**: Componente completo para escanear códigos de barras
  - Escáner de cámara usando HTML5-QR-Code
  - Soporte para múltiples formatos de códigos de barras
  - Opción de ingreso manual
  - Interfaz moderna y responsive
  - Manejo de errores y permisos de cámara

#### 4. Formulario de Creación de Productos
- **Archivo**: `frontend/src/pages/admin/NuevoProducto.tsx`
- **Cambios**:
  - Agregado campo `codigoPersonalizado` al estado del formulario
  - Agregado campo `codigoBarras` al estado del formulario
  - Nuevo estado para manejar códigos existentes y filtrados
  - Función `cargarCodigosPersonalizados()` para obtener códigos del backend
  - Función `cargarCodigosBarras()` para obtener códigos de barras del backend
  - Función `manejarCambioCodigoPersonalizado()` con autocompletado
  - Función `manejarEscaneoBarras()` para procesar códigos escaneados
  - Función `abrirScanner()` para abrir el escáner de códigos de barras
  - Campo de entrada con placeholder y sugerencias para código personalizado
  - Campo de código de barras con botón de escáner integrado
  - Campo de código personalizado ubicado en el Paso 1 (Información Básica)
  - Campo de código de barras ubicado en el Paso 1 (Información Básica)

#### 5. Formulario de Edición de Productos
- **Archivo**: `frontend/src/pages/admin/EditarProducto.tsx`
- **Cambios**:
  - Agregado campo `codigoPersonalizado` al estado del formulario
  - Agregado campo `codigoBarras` al estado del formulario
  - Campo de entrada con placeholder y estilos consistentes para código personalizado
  - Campo de entrada con placeholder y estilos consistentes para código de barras

#### 6. Gestión de Productos
- **Archivo**: `frontend/src/pages/admin/GestionProductos.tsx`
- **Cambios**:
  - Agregado filtro por código personalizado
  - Agregado filtro por código de barras
  - Filtros dinámicos (solo aparecen si hay datos cargados)
  - Búsqueda combinada (códigos + texto de búsqueda)
  - Integración con filtros existentes (categoría, marca, sector, estado)
  - Grid adaptativo (4, 5 o 6 columnas según filtros disponibles)

#### 7. Estilos CSS
- **Archivo**: `frontend/src/styles/gestion-productos.css`
- **Cambio**: Agregado grid-6 para acomodar el nuevo filtro de código de barras

### Base de Datos

#### 1. Migración SQL
- **Archivo**: `backend/src/main/resources/data.sql`
- **Contenido**: Script para agregar las columnas `sector_almacenamiento`, `codigo_personalizado` y `codigo_barras` a la tabla `productos`

## Instrucciones de Implementación

### 1. Instalar Dependencias
```bash
cd frontend
npm install html5-qrcode
```

### 2. Ejecutar Migración de Base de Datos
```sql
-- Ejecutar el script de migración
\i backend/src/main/resources/data.sql
```

### 3. Reiniciar Backend
```bash
cd backend
./mvnw spring-boot:run
```

### 4. Reiniciar Frontend
```bash
cd frontend
npm run dev
```

## Uso de la Funcionalidad

### Crear Producto
1. Ir a "Crear Nuevo Producto"
2. En el **Paso 1 (Información Básica)**, encontrar:
   - Campo "Código Personalizado"
   - Campo "Código de Barras" con botón de escáner 📷
3. En el **Paso 2 (Inventario)**, encontrar el campo "Sector de Almacenamiento"
4. Para el código de barras tienes **tres opciones**:
   - **📷 Escáner de cámara**: Hacer clic en el botón 📷 y apuntar la cámara
   - **🔗 Escáner físico**: Hacer clic en el campo de texto y escanear directamente
   - **✏️ Manual**: Escribir el código a mano
5. Los códigos y sectores se guardarán automáticamente para futuras creaciones

### Editar Producto
1. Ir a "Editar Producto"
2. Encontrar los campos:
   - "Código Personalizado"
   - "Código de Barras"
   - "Sector de Almacenamiento"
3. Modificar o agregar los valores deseados

### Filtrar Productos
1. Ir a "Gestión de Productos"
2. En la sección de filtros, aparecerán:
   - "🔢 Todos los códigos" (solo si hay códigos personalizados cargados)
   - "📊 Todos los códigos de barras" (solo si hay códigos de barras cargados)
   - "🏢 Todos los sectores" (solo si hay sectores cargados)
3. Seleccionar el código y/o sector deseado para filtrar productos
4. Combinar con otros filtros (categoría, marca, estado)
5. Usar la búsqueda por texto para encontrar productos específicos dentro del filtro seleccionado

### API Endpoints

#### Obtener Sectores de Almacenamiento
```
GET /api/empresas/{empresaId}/productos/sectores-almacenamiento
```

#### Obtener Códigos Personalizados
```
GET /api/empresas/{empresaId}/productos/codigos-personalizados
```

#### Obtener Códigos de Barras
```
GET /api/empresas/{empresaId}/productos/codigos-barras
```

#### Filtrar Productos por Sector
```
GET /api/empresas/{empresaId}/productos/por-sector?sector={sector}&activo={activo}
```

#### Filtrar Productos por Código Personalizado
```
GET /api/empresas/{empresaId}/productos/por-codigo?codigo={codigo}&activo={activo}
```

#### Filtrar Productos por Código de Barras
```
GET /api/empresas/{empresaId}/productos/por-codigo-barras?codigoBarras={codigoBarras}&activo={activo}
```

#### Buscar Producto por Código de Barras
```
GET /api/empresas/{empresaId}/productos/buscar-por-codigo-barras?codigoBarras={codigoBarras}
```

## Ejemplos de Uso por Industria

### Vinos
- **Códigos Personalizados**: "330", "420", "RES001", "PRE001"
- **Códigos de Barras**: "1234567890123", "7891234567890"
- **Sectores**: "bodega principal", "cava especial", "estante reservas"

### Electrónicos
- **Códigos Personalizados**: "EL001", "EL002", "TAB001", "CEL001"
- **Códigos de Barras**: "1234567890123", "7891234567890"
- **Sectores**: "almacén técnico", "sala de exposición", "depósito repuestos"

### Ropa
- **Códigos Personalizados**: "ROP001", "ROP002", "CAL001", "CAM001"
- **Códigos de Barras**: "1234567890123", "7891234567890"
- **Sectores**: "vestidor damas", "vestidor caballeros", "almacén talles especiales"

### Alimentos
- **Códigos Personalizados**: "ALI001", "BEB001", "CON001", "FRE001"
- **Códigos de Barras**: "1234567890123", "7891234567890"
- **Sectores**: "área refrigerada", "almacén seco", "zona de congelados"

## Opciones de Escaneo de Códigos de Barras

### 📷 Escáner de Cámara
- Usa la cámara del dispositivo (celular, tablet, computadora)
- Hacer clic en el botón 📷 para abrir el escáner
- Apuntar la cámara hacia el código de barras
- Soporta múltiples formatos automáticamente

### 🔗 Escáner Físico (USB/Bluetooth)
- Conectar el escáner al dispositivo
- Hacer clic en el campo "Código de Barras" (para que el cursor esté ahí)
- Apuntar y escanear el código
- El código aparece automáticamente en el campo
- **¡No necesitas abrir el escáner de cámara!**

### ✏️ Ingreso Manual
- Escribir el código directamente en el campo
- Opción "Ingresar Manualmente" en el escáner de cámara
- Útil para códigos dañados o difíciles de escanear

## Formatos de Códigos de Barras Soportados

Los escáneres soportan los siguientes formatos:

- **EAN-13**: Códigos de barras europeos de 13 dígitos
- **EAN-8**: Códigos de barras europeos de 8 dígitos
- **UPC-A**: Códigos de barras americanos de 12 dígitos
- **UPC-E**: Códigos de barras americanos comprimidos
- **Code 128**: Códigos de barras alfanuméricos
- **Code 39**: Códigos de barras alfanuméricos
- **Code 93**: Códigos de barras alfanuméricos
- **Codabar**: Códigos de barras numéricos
- **ITF**: Códigos de barras intercalados

## Beneficios

### Para el Negocio
- **Organización**: Mejor control del inventario físico
- **Identificación**: Códigos únicos para cada producto
- **Automatización**: Escaneo rápido de códigos de barras
- **Búsqueda**: Filtrado rápido por ubicación o código
- **Migración**: Facilita la migración desde sistemas existentes
- **Estandarización**: Soporte para códigos de barras estándar

### Para el Usuario
- **Flexibilidad**: Cada empresa define su propio sistema
- **Familiaridad**: Puede usar códigos que ya conoce
- **Eficiencia**: Autocompletado y filtrado inteligente
- **Simplicidad**: Campos opcionales, no obligatorios
- **Conveniencia**: Escáner de cámara integrado
- **Precisión**: Reducción de errores de digitación

## Notas Técnicas
- Los campos son completamente opcionales
- Máximo 100 caracteres por sector, 50 por código personalizado, 50 por código de barras
- Los sectores y códigos se filtran por empresa (multi-tenant)
- El autocompletado funciona en tiempo real
- Compatible con productos existentes (campos nullable)
- Los filtros aparecen dinámicamente solo si hay datos cargados
- La búsqueda por texto respeta los filtros seleccionados
- Los filtros se pueden combinar entre sí
- Responsive design: el grid se adapta a diferentes tamaños de pantalla
- Grid adaptativo: 4 columnas si solo hay sectores, 5 si hay sectores y códigos personalizados, 6 si hay todos los filtros
- El escáner de códigos de barras requiere permisos de cámara
- Soporte para múltiples formatos de códigos de barras estándar
- Verificación de duplicados de códigos de barras por empresa 