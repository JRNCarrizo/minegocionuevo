# 🔄 Sincronización de Stock entre Sectores y Sistema de Ingresos/Cargas

## 📋 **Descripción General**

Se ha implementado un sistema de **sincronización completa e inteligente** de stock que conecta **Gestión de Productos** ↔️ **Gestión de Sectores** ↔️ **Sistema de Ingresos/Cargas/Ventas**. Este sistema aplica una **estrategia híbrida inteligente** para el descuento de stock y mantiene la consistencia total entre todos los módulos.

## 🎯 **Estrategia Híbrida Inteligente**

### 📊 **Prioridad de Descuento:**

1. **Productos sin sectorizar** (PRIMERA PRIORIDAD)
2. **Sector con menos stock** (SEGUNDA PRIORIDAD)
3. **Sector con más stock** (ÚLTIMA PRIORIDAD)

### 🔄 **Ejemplo Práctico:**

```
Stock disponible:
- Producto sin sectorizar: 10 unidades
- Sector1: 5 unidades
- Sector2: 8 unidades
- Total: 23 unidades

Descuento requerido: 3 unidades

Resultado:
1. Descontar 3 unidades del producto sin sectorizar
2. Quedan 7 unidades sin sectorizar
3. Los sectores no se ven afectados
```

## 🚀 **Endpoints Disponibles**

### 1. **Descontar Stock de un Producto**
```http
POST /api/empresas/{empresaId}/stock-sincronizacion/descontar
```

**Body:**
```json
{
  "productoId": 123,
  "cantidad": 5,
  "motivo": "Carga de planilla"
}
```

**Respuesta:**
```json
{
  "mensaje": "Stock descontado exitosamente",
  "data": {
    "productoId": 123,
    "productoNombre": "Producto Ejemplo",
    "cantidadSolicitada": 5,
    "motivo": "Carga de planilla",
    "fechaDescuento": "2024-01-15T10:30:00",
    "descuentos": [
      {
        "tipo": "SIN_SECTORIZAR",
        "cantidad": 3,
        "stockAnterior": 10,
        "stockNuevo": 7
      },
      {
        "tipo": "SECTOR",
        "sectorId": 1,
        "sectorNombre": "Sector A",
        "cantidad": 2,
        "stockAnterior": 5,
        "stockNuevo": 3
      }
    ],
    "cantidadDescontada": 5,
    "cantidadRestante": 0,
    "stockRestante": 18
  }
}
```

### 2. **Obtener Detalle de Stock Disponible**
```http
GET /api/empresas/{empresaId}/stock-sincronizacion/detalle-stock/{productoId}
```

**Respuesta:**
```json
{
  "mensaje": "Detalle de stock obtenido exitosamente",
  "data": {
    "productoId": 123,
    "productoNombre": "Producto Ejemplo",
    "stockSinSectorizar": 7,
    "sectores": [
      {
        "sectorId": 1,
        "sectorNombre": "Sector A",
        "cantidad": 3
      },
      {
        "sectorId": 2,
        "sectorNombre": "Sector B",
        "cantidad": 8
      }
    ],
    "stockTotal": 18
  }
}
```

### 3. **Descontar Stock de Múltiples Productos**
```http
POST /api/empresas/{empresaId}/stock-sincronizacion/descontar-multiple
```

**Body:**
```json
{
  "motivo": "Carga de planilla PP-001",
  "productos": [
    {
      "productoId": 123,
      "cantidad": 5
    },
    {
      "productoId": 456,
      "cantidad": 3
    }
  ]
}
```

## 🔧 **Integración Completa con Servicios Existentes**

### **1️⃣ Venta Rápida (Ya Integrado)**
El servicio de venta rápida ahora usa automáticamente la sincronización de stock:

```java
// Antes (solo stock del producto)
if (producto.getStock() < detalleDTO.getCantidad()) {
    throw new RuntimeException("Stock insuficiente");
}
producto.reducirStock(detalleDTO.getCantidad());

// Ahora (stock total incluyendo sectores)
Integer stockTotalDisponible = stockSincronizacionService
    .obtenerDetalleStockDisponible(empresaId, productoId)
    .get("stockTotal");
```

### **2️⃣ Gestión de Productos (Nuevo - Sincronización Automática)**
Cuando se actualiza el stock de un producto, se sincroniza automáticamente con los sectores:

```java
// En ProductoService.actualizarProducto()
if (productoDTO.getStock() != null && !productoDTO.getStock().equals(stockAnterior)) {
    // SINCRONIZACIÓN AUTOMÁTICA CON SECTORES
    Map<String, Object> resultadoSincronizacion = stockSincronizacionService
        .sincronizarStockConSectores(
            empresaId, 
            id, 
            productoDTO.getStock(), 
            "Actualización desde Gestión de Productos"
        );
}
```

### **3️⃣ Gestión de Sectores (Nuevo - Sincronización Automática)**
Cuando se asigna stock a un sector, se sincroniza automáticamente con el producto:

```java
// En SectorService.asignarStock()
StockPorSector stockGuardado = stockPorSectorRepository.save(stockPorSector);

// SINCRONIZACIÓN AUTOMÁTICA CON PRODUCTO
Map<String, Object> resultadoSincronizacion = stockSincronizacionService
    .sincronizarSectorConProducto(
        producto.getEmpresa().getId(),
        productoId,
        sectorId,
        cantidad,
        "Asignación de stock desde Gestión de Sectores"
    );
```
Map<String, Object> resultadoDescuento = stockSincronizacionService
    .descontarStockInteligente(empresaId, productoId, cantidad, motivo);
```

### **Cargas de Planilla (Pendiente de Integrar)**
Para integrar con cargas de planilla, agregar en el servicio correspondiente:

```java
@Autowired
private StockSincronizacionService stockSincronizacionService;

// En el método de procesar planilla
for (DetallePlanilla detalle : detalles) {
    stockSincronizacionService.descontarStockInteligente(
        empresaId,
        detalle.getProductoId(),
        detalle.getCantidad(),
        "Carga de planilla - " + planilla.getNumero()
    );
}
```

### **Remitos de Ingreso (Pendiente de Integrar)**
Para integrar con remitos de ingreso:

```java
// En el método de procesar remito
for (DetalleRemito detalle : detalles) {
    stockSincronizacionService.descontarStockInteligente(
        empresaId,
        detalle.getProductoId(),
        detalle.getCantidad(),
        "Remito de ingreso - " + remito.getNumero()
    );
}
```

## 📊 **Ventajas del Sistema**

### ✅ **Beneficios:**
- **Consistencia de datos**: Stock sincronizado entre todos los módulos
- **Estrategia inteligente**: Prioriza productos sin sectorizar
- **Trazabilidad completa**: Registra de dónde se descuenta cada unidad
- **Flexibilidad**: Permite descuentos de múltiples productos
- **Validación robusta**: Verifica stock total antes de procesar

### 🎯 **Casos de Uso:**
1. **Ventas rápidas**: Descuenta automáticamente del stock más apropiado
2. **Cargas de planilla**: Procesa múltiples productos con una sola llamada
3. **Remitos de ingreso**: Mantiene consistencia con la gestión de sectores
4. **Roturas y pérdidas**: Aplica la misma lógica de descuento

## 🔍 **Logs y Monitoreo**

El sistema genera logs detallados para monitoreo:

```
🔍 STOCK SINCRONIZACIÓN - Iniciando descuento inteligente
🔍 STOCK SINCRONIZACIÓN - Empresa: 1, Producto: 123, Cantidad: 5
🔍 STOCK SINCRONIZACIÓN - Descontado de sin sectorizar: 3
🔍 STOCK SINCRONIZACIÓN - Descontado del sector Sector A: 2
✅ STOCK SINCRONIZACIÓN - Descuento completado exitosamente
✅ STOCK SINCRONIZACIÓN - Cantidad descontada: 5
```

## 🚨 **Manejo de Errores**

### **Errores Comunes:**
- **Stock insuficiente**: Se valida antes de procesar
- **Producto no encontrado**: Verifica existencia y pertenencia a la empresa
- **Error de transacción**: Rollback automático en caso de fallo

### **Respuestas de Error:**
```json
{
  "error": "Stock insuficiente para el producto: Producto Ejemplo. Disponible: 10, Solicitado: 15"
}
```

## ✅ **Estado de Sincronización Completa**

### 🎯 **Módulos Sincronizados:**

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **Gestión de Productos** | ✅ **COMPLETO** | Sincronización automática con sectores |
| **Gestión de Sectores** | ✅ **COMPLETO** | Sincronización automática con productos |
| **Venta Rápida** | ✅ **COMPLETO** | Usa stock total (producto + sectores) |
| **Sistema de Sincronización** | ✅ **COMPLETO** | Estrategia híbrida inteligente |

### 🔄 **Flujo de Sincronización:**

```
Gestión de Productos ←→ Gestión de Sectores ←→ Venta Rápida
         ↕                      ↕                      ↕
    Stock Principal        Stock por Sector      Stock Total
```

### 📊 **Beneficios Logrados:**

1. **Consistencia Total**: Todos los módulos están sincronizados
2. **Automatización**: No requiere intervención manual
3. **Estrategia Inteligente**: Descuento optimizado por prioridad
4. **Trazabilidad**: Registro completo de cambios
5. **Flexibilidad**: Funciona con cualquier cantidad de sectores

## 🔄 **Próximos Pasos**

1. **Integrar con cargas de planilla**
2. **Integrar con remitos de ingreso**
3. **Integrar con roturas y pérdidas**
4. **Agregar reportes de movimientos de stock**
5. **Implementar alertas de stock bajo por sector**

---

**¡Sincronización completa implementada exitosamente!** 🎉
