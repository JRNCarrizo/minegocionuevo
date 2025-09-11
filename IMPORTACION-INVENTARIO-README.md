# Importación de Inventario

## Funcionalidad Implementada

Se ha creado una nueva funcionalidad de **Importación de Inventario** que permite a las empresas importar su Excel de control de inventario manual y actualizar las cantidades de productos existentes o crear nuevos productos basándose en el código personalizado.

## Características Principales

### 🎯 Objetivo
- **Actualizar cantidades**: Si el código personalizado existe, actualiza la cantidad en stock
- **Crear productos**: Si el código personalizado no existe, crea un nuevo producto
- **No duplicar**: Evita duplicar productos basándose en el código personalizado
- **Respaldo manual**: Permite mantener el inventario actualizado mientras se desarrolla el sistema automático

### 📊 Formato del Excel
La funcionalidad busca automáticamente la pestaña **"Stock"** en el archivo Excel y utiliza las siguientes columnas:

| Columna | Descripción | Uso |
|---------|-------------|-----|
| **Producto** | Código personalizado del producto | Identificador único para buscar/crear productos |
| **Descripción** | Nombre/descripción del producto | Nombre del producto (para nuevos productos) |
| **Movimiento** | Cantidad en stock | Cantidad a establecer en el inventario (prioridad alta) |
| **Stock** | Cantidad en stock | Cantidad a establecer en el inventario (si no hay Movimiento) |

### 🔄 Proceso de Importación

1. **Validación del archivo**:
   - Verifica que sea un archivo Excel (.xlsx)
   - Busca la pestaña "Stock"
   - Valida las columnas requeridas
   - Procesa cada fila de datos

2. **Procesamiento de datos**:
   - Para cada producto en el Excel:
     - Si existe el código personalizado → **Actualiza la cantidad**
     - Si no existe el código personalizado → **Crea nuevo producto**

3. **Importación a la base de datos**:
   - Actualiza productos existentes
   - Crea nuevos productos con datos básicos
   - Reporta estadísticas de la operación

## Implementación Técnica

### Backend

#### Servicio: `ImportacionInventarioService`
- **Método**: `procesarArchivoInventario()` - Valida y procesa el Excel
- **Método**: `importarInventario()` - Importa los datos a la base de datos
- **Validaciones**: Formato de archivo, columnas requeridas, datos válidos

#### Endpoints: `ProductoController`
- **POST** `/api/empresas/{empresaId}/productos/validar-inventario` - Valida el archivo Excel
- **POST** `/api/empresas/{empresaId}/productos/importar-inventario` - Importa los datos

#### Repositorio: `ProductoRepository`
- **Método**: `findByCodigoPersonalizadoAndEmpresaIdAndActivoTrue()` - Busca productos por código

### Frontend

#### Componente: `ImportacionInventario.tsx`
- **Interfaz intuitiva** con instrucciones claras
- **Vista previa** de los datos antes de importar
- **Validación en tiempo real** del archivo
- **Estadísticas** de productos actualizados/creados
- **Manejo de errores** con mensajes descriptivos

#### Integración: `GestionProductos.tsx`
- **Nueva tarjeta** "Importación de Inventario" en la gestión de productos
- **Navegación directa** a la funcionalidad
- **Diseño consistente** con el resto de la aplicación

## Flujo de Usuario

### 1. Acceso a la Funcionalidad
- Ir a **Gestión de Productos**
- Hacer clic en **"Importación de Inventario"**

### 2. Carga del Archivo
- **Arrastrar y soltar** o **seleccionar** archivo Excel
- **Validación automática** del formato y tamaño
- **Vista previa** del archivo seleccionado

### 3. Validación
- **Procesamiento** del archivo Excel
- **Búsqueda** de la pestaña "Stock"
- **Validación** de columnas y datos
- **Vista previa** de resultados

### 4. Importación
- **Revisión** de estadísticas (actualizados/creados/errores)
- **Confirmación** de la importación
- **Procesamiento** de los datos
- **Redirección** a gestión de productos

## Validaciones y Seguridad

### Validaciones de Archivo
- ✅ Solo archivos Excel (.xlsx)
- ✅ Tamaño máximo: 10MB
- ✅ Pestaña "Stock" requerida
- ✅ Columnas "Producto" y "Movimiento" requeridas

### Validaciones de Datos
- ✅ Código personalizado no vacío
- ✅ Cantidad numérica válida (≥ 0)
- ✅ Descripción opcional pero recomendada
- ✅ Manejo de errores por fila

### Seguridad
- ✅ Validación de empresa (solo productos de la empresa del usuario)
- ✅ Transacciones atómicas (todo o nada)
- ✅ Logs detallados para auditoría
- ✅ Manejo seguro de archivos temporales

## Casos de Uso

### Caso 1: Actualización de Inventario
```
Excel contiene:
- Producto: "ABC123"
- Descripción: "Producto A"
- Movimiento: 150

Resultado: Si existe producto con código "ABC123", actualiza stock a 150
```

### Caso 2: Creación de Producto
```
Excel contiene:
- Producto: "XYZ789"
- Descripción: "Producto Nuevo"
- Movimiento: 50

Resultado: Crea nuevo producto con código "XYZ789", nombre "Producto Nuevo", stock 50
```

### Caso 3: Manejo de Errores
```
Excel contiene:
- Producto: ""
- Descripción: "Producto Sin Código"
- Movimiento: 25

Resultado: Error reportado, fila omitida
```

## Beneficios

### Para la Empresa
- **Actualización rápida** del inventario desde su Excel existente
- **No duplicación** de productos
- **Respaldo manual** mientras se desarrolla automatización
- **Control total** sobre los datos importados

### Para el Sistema
- **Integración perfecta** con el sistema existente
- **Validaciones robustas** para mantener integridad de datos
- **Escalabilidad** para futuras mejoras
- **Auditoría completa** de las operaciones

## Próximos Pasos

1. **Sistema de inventario automático** (futuro)
2. **Plantillas personalizadas** por empresa
3. **Importación programada** (cron jobs)
4. **Sincronización bidireccional** con sistemas externos
5. **Reportes de diferencias** entre Excel y sistema

## Archivos Modificados/Creados

### Backend
- ✅ `ImportacionInventarioService.java` - Servicio principal
- ✅ `ProductoController.java` - Endpoints de importación
- ✅ `ProductoRepository.java` - Método de búsqueda

### Frontend
- ✅ `ImportacionInventario.tsx` - Componente principal
- ✅ `GestionProductos.tsx` - Integración con gestión
- ✅ `api.ts` - Métodos de API
- ✅ `App.tsx` - Ruta de navegación

### Documentación
- ✅ `IMPORTACION-INVENTARIO-README.md` - Documentación completa

La funcionalidad está lista para usar y permite a las empresas mantener su inventario actualizado de forma sencilla y eficiente.
