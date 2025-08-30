# 📊 Exportación de Planillas de Devolución

## 🚨 **Problema Identificado:**

### **Comportamiento Incorrecto:**
- La sección de gestión de retornos no tenía funcionalidad de exportación
- El frontend estaba usando métodos de exportación de pedidos en lugar de devoluciones
- Error: "Planilla no encontrada o no pertenece a la empresa"

---

## ✅ **Solución Implementada:**

### **1. Backend - Servicio (`PlanillaDevolucionService.java`):**

#### **Método de Exportación:**
```java
/**
 * Exportar planilla de devolución a Excel
 */
public byte[] exportarPlanillaAExcel(Long planillaId, Long empresaId) throws IOException {
    // Verificar que la planilla pertenece a la empresa
    PlanillaDevolucion planilla = planillaDevolucionRepository.findByIdAndEmpresaId(planillaId, empresaId)
            .orElseThrow(() -> new RuntimeException("Planilla no encontrada o no pertenece a la empresa"));

    // Obtener los detalles de la planilla
    List<DetallePlanillaDevolucion> detalles = detallePlanillaDevolucionRepository
            .findByPlanillaDevolucionIdOrderByFechaCreacionAsc(planillaId);

    // Crear Excel con formato específico para devoluciones
    // ...
}
```

#### **Características del Excel:**
- **Título**: "PLANILLA DE DEVOLUCIÓN"
- **Información**: Empresa, número de planilla, observaciones, fecha
- **Columnas**: #, Código Interno, Nombre del Producto, Cantidad, **Estado**
- **Estado del Producto**: BUEN_ESTADO, MAL_ESTADO, etc.

### **2. Backend - Controlador (`PlanillaDevolucionController.java`):**

#### **Endpoint de Exportación:**
```java
/**
 * Exportar planilla de devolución a Excel
 */
@GetMapping("/{id}/exportar")
public ResponseEntity<byte[]> exportarPlanilla(@PathVariable Long id, Authentication authentication) {
    // Validación de autenticación y autorización
    // Llamada al servicio de exportación
    // Retorno del archivo Excel
}
```

#### **URL del Endpoint:**
```
GET /api/devoluciones/{id}/exportar
```

### **3. Frontend - ApiService (`api.ts`):**

#### **Método de Exportación:**
```typescript
// Exportar planilla de devolución
async exportarPlanillaDevolucion(id: number): Promise<Blob> {
  try {
    const response = await this.api.get(`/devoluciones/${id}/exportar`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error: any) {
    console.error('❌ Error al exportar planilla de devolución:', error);
    throw error;
  }
}
```

### **4. Frontend - Componente (`DescargaDevoluciones.tsx`):**

#### **Tipos Corregidos:**
```typescript
interface PlanillaDevolucion {
  id: number;
  numeroPlanilla: string;
  fechaPlanilla: string;
  observaciones?: string;
  totalProductos: number;
  fechaCreacion: string;
  fechaActualizacion: string;
  detalles: DetallePlanillaDevolucion[];
}

interface DetallePlanillaDevolucion {
  id: number;
  productoId?: number;
  codigoPersonalizado?: string;
  descripcion: string;
  cantidad: number;
  observaciones?: string;
  estadoProducto?: string;
  fechaCreacion: string;
}
```

#### **Función de Exportación:**
```typescript
const exportarPlanilla = async (planilla: PlanillaDevolucion) => {
  try {
    const blob = await ApiService.exportarPlanillaDevolucion(planilla.id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planilla-devolucion-${planilla.id}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success('Planilla exportada exitosamente');
  } catch (error) {
    console.error('Error al exportar planilla:', error);
    toast.error('Error al exportar la planilla');
  }
};
```

---

## 🎯 **Diferencias con Exportación de Pedidos:**

### **1. Endpoint:**
- **Pedidos**: `/api/planillas-pedidos/{id}/exportar`
- **Devoluciones**: `/api/devoluciones/{id}/exportar`

### **2. Columnas del Excel:**
- **Pedidos**: #, Código Interno, Nombre del Producto, Cantidad
- **Devoluciones**: #, Código Interno, Nombre del Producto, Cantidad, **Estado**

### **3. Título del Excel:**
- **Pedidos**: "PLANILLA DE PEDIDO"
- **Devoluciones**: "PLANILLA DE DEVOLUCIÓN"

### **4. Estado del Producto:**
- **Pedidos**: No aplica
- **Devoluciones**: BUEN_ESTADO, MAL_ESTADO, etc.

---

## 🚀 **Cómo Usar:**

### **1. En la Interfaz:**
1. Ir a "Gestión de Retornos"
2. Seleccionar una planilla de devolución
3. Hacer clic en "📄 Exportar"
4. El archivo se descargará automáticamente

### **2. Formato del Archivo:**
- **Nombre**: `planilla-devolucion-{id}.xlsx`
- **Formato**: Excel (.xlsx)
- **Contenido**: Detalles completos de la devolución

---

## 🔧 **Configuraciones Técnicas:**

### **1. Dependencias:**
```xml
<!-- Apache POI para Excel -->
<dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi-ooxml</artifactId>
    <version>5.2.3</version>
</dependency>
```

### **2. Headers HTTP:**
```java
.header("Content-Disposition", "attachment; filename=\"planilla-devolucion-" + id + ".xlsx\"")
.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
```

### **3. Validaciones:**
- ✅ Autenticación requerida
- ✅ Autorización (rol ADMINISTRADOR)
- ✅ Verificación de empresa
- ✅ Validación de existencia de planilla

---

## 🧪 **Verificación:**

### **Para Confirmar que Funciona:**

1. **Crear una planilla de devolución** con productos en diferentes estados
2. **Ir a la sección de descarga** de devoluciones
3. **Hacer clic en exportar** en una planilla
4. **Verificar el archivo Excel** descargado:
   - Título correcto: "PLANILLA DE DEVOLUCIÓN"
   - Información de la empresa
   - Número de planilla (o "Sin número")
   - Productos con sus estados
   - Formato profesional

---

## 🚨 **Troubleshooting:**

### **Si la exportación falla:**

1. **Verificar autenticación:**
   - Debe estar logueado como administrador
   - Token JWT válido

2. **Verificar permisos:**
   - Rol: ADMINISTRADOR o SUPER_ADMIN
   - Empresa válida

3. **Verificar datos:**
   - Planilla debe existir
   - Planilla debe pertenecer a la empresa del usuario

4. **Verificar logs:**
   - Backend: `📊 [EXPORTAR DEVOLUCION]` logs
   - Frontend: Console del navegador

---

**✅ Problema resuelto. La exportación de planillas de devolución ahora funciona correctamente con todos los detalles incluidos.**
