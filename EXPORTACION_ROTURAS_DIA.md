# 📊 Exportación de Roturas y Pérdidas del Día

## 🚨 **Problema Identificado:**

### **Solicitud del Usuario:**
- El usuario solicitó agregar un botón de exportación en la sección de "Roturas y Pérdidas"
- Específicamente, quería exportar el detalle de las roturas del día actual
- El reporte debe incluir todas las roturas registradas hasta el momento de la descarga

---

## ✅ **Solución Implementada:**

### **1. Backend - Controlador (`RoturaPerdidaController.java`):**

#### **Nuevo Endpoint de Exportación del Día:**
```java
/**
 * Exportar roturas y pérdidas del día actual a Excel
 */
@GetMapping("/exportar/dia")
public ResponseEntity<byte[]> exportarRoturasPerdidasDelDia(Authentication authentication) {
    try {
        UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
        Long empresaId = usuarioPrincipal.getEmpresaId();
        LocalDate fechaActual = LocalDate.now();
        
        System.out.println("📊 [EXPORTAR DIA] Exportando roturas y pérdidas del día para empresa ID: " + empresaId);
        System.out.println("📊 [EXPORTAR DIA] Fecha: " + fechaActual);
        
        byte[] excelBytes = roturaPerdidaService.exportarRoturasPerdidasDelDiaAExcel(empresaId, fechaActual);
        
        return ResponseEntity.ok()
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .header("Content-Disposition", "attachment; filename=\"Roturas_Perdidas_Dia_" + fechaActual + ".xlsx\"")
                .body(excelBytes);
    } catch (Exception e) {
        System.out.println("❌ [EXPORTAR DIA] Error al exportar roturas y pérdidas del día: " + e.getMessage());
        e.printStackTrace();
        return ResponseEntity.badRequest().build();
    }
}
```

#### **URL del Endpoint:**
```
GET /api/roturas-perdidas/exportar/dia
```

### **2. Backend - Servicio (`RoturaPerdidaService.java`):**

#### **Método de Exportación del Día:**
```java
/**
 * Exportar roturas y pérdidas del día actual a Excel
 */
public byte[] exportarRoturasPerdidasDelDiaAExcel(Long empresaId, LocalDate fecha) throws IOException {
    List<RoturaPerdida> roturasPerdidas = roturaPerdidaRepository.findByEmpresaIdAndFechaOrderByFechaCreacionDesc(empresaId, fecha);
    
    Empresa empresa = empresaRepository.findById(empresaId)
            .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

    // Crear Excel con formato específico para el día
    // ...
}
```

#### **Características del Excel del Día:**
- **Título**: "REPORTE DE ROTURAS Y PÉRDIDAS DEL DÍA"
- **Información**: Empresa, fecha específica del día
- **Columnas**: #, Hora, Código Interno, Nombre del Producto, Cantidad, Observaciones
- **Hora**: Muestra la hora exacta de creación de cada registro
- **Estadísticas**: Total de productos afectados y unidades perdidas del día

### **3. Frontend - ApiService (`api.ts`):**

#### **Método de Exportación del Día:**
```typescript
// Exportar roturas y pérdidas del día
async exportarRoturasPerdidasDelDia(): Promise<Blob> {
  try {
    const response = await this.api.get('/roturas-perdidas/exportar/dia', {
      responseType: 'blob'
    });
    return response.data;
  } catch (error: any) {
    console.error('❌ Error al exportar roturas y pérdidas del día:', error);
    throw error;
  }
}
```

### **4. Frontend - Componente (`RoturasPerdidas.tsx`):**

#### **Función de Exportación del Día:**
```typescript
const exportarRoturasPerdidasDelDia = async () => {
  try {
    const response = await ApiService.exportarRoturasPerdidasDelDia();
    
    const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fechaActual = obtenerFechaActual();
    link.download = `Roturas_Perdidas_Dia_${fechaActual}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('Reporte del día exportado exitosamente');
  } catch (error) {
    console.error('Error al exportar roturas y pérdidas del día:', error);
    toast.error('Error al exportar el reporte del día');
  }
};
```

#### **Botón de Exportación del Día:**
```typescript
<button
  onClick={exportarRoturasPerdidasDelDia}
  style={{
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '0.75rem',
    padding: '0.75rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  }}
>
  📄 Exportar Día
</button>
```

---

## 🎯 **Diferencias con Exportación por Rango:**

### **1. Endpoint:**
- **Rango**: `/api/roturas-perdidas/exportar?fechaInicio=...&fechaFin=...`
- **Día**: `/api/roturas-perdidas/exportar/dia`

### **2. Columnas del Excel:**
- **Rango**: #, Fecha, Código Interno, Nombre del Producto, Cantidad, Observaciones
- **Día**: #, **Hora**, Código Interno, Nombre del Producto, Cantidad, Observaciones

### **3. Título del Excel:**
- **Rango**: "REPORTE DE ROTURAS Y PÉRDIDAS"
- **Día**: "REPORTE DE ROTURAS Y PÉRDIDAS DEL DÍA"

### **4. Información del Reporte:**
- **Rango**: Muestra período completo (fecha inicio - fecha fin)
- **Día**: Muestra fecha específica del día actual

### **5. Ordenamiento:**
- **Rango**: Ordenado por fecha descendente
- **Día**: Ordenado por hora de creación descendente

---

## 🚀 **Cómo Usar:**

### **1. En la Interfaz:**
1. Ir a "Roturas y Pérdidas"
2. Hacer clic en "📄 Exportar Día"
3. El archivo se descargará automáticamente

### **2. Formato del Archivo:**
- **Nombre**: `Roturas_Perdidas_Dia_YYYY-MM-DD.xlsx`
- **Formato**: Excel (.xlsx)
- **Contenido**: Detalles completos de las roturas del día actual

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
.header("Content-Disposition", "attachment; filename=\"Roturas_Perdidas_Dia_" + fechaActual + ".xlsx\"")
.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
```

### **3. Validaciones:**
- ✅ Autenticación requerida
- ✅ Autorización (rol ADMINISTRADOR o SUPER_ADMIN)
- ✅ Verificación de empresa
- ✅ Fecha automática del día actual

---

## 🧪 **Verificación:**

### **Para Confirmar que Funciona:**

1. **Ir a la sección de "Roturas y Pérdidas"**
2. **Agregar algunas roturas/pérdidas** para el día actual
3. **Hacer clic en "📄 Exportar Día"**
4. **Verificar el archivo Excel** descargado:
   - Título correcto: "REPORTE DE ROTURAS Y PÉRDIDAS DEL DÍA"
   - Información de la empresa
   - Fecha del día actual
   - Hora de cada registro
   - Productos con sus cantidades
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
   - Debe haber roturas registradas para el día actual
   - La empresa debe existir

4. **Verificar logs:**
   - Backend: `📊 [EXPORTAR DIA]` logs
   - Frontend: Console del navegador

---

## 📊 **Características del Reporte:**

### **Información Incluida:**
- **Empresa**: Nombre de la empresa
- **Fecha**: Fecha específica del día
- **Estadísticas**: Total de productos afectados y unidades perdidas
- **Detalles**: Lista completa de roturas con hora de registro

### **Columnas del Excel:**
1. **#** - Número de orden
2. **Hora** - Hora exacta de registro (HH:mm:ss)
3. **Código Interno** - Código del producto
4. **Nombre del Producto** - Descripción del producto
5. **Cantidad** - Cantidad perdida/deteriorada
6. **Observaciones** - Comentarios adicionales

---

**✅ Problema resuelto. La exportación de roturas y pérdidas del día actual ahora funciona correctamente con todos los detalles incluidos.**
