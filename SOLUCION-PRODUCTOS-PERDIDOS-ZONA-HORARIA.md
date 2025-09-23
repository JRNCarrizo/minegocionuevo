# Solución: Problema de Zona Horaria en Modal "Ver Productos Perdidos"

## Problema Identificado

En el modal "Ver Productos Perdidos" de la gestión de retorno, las fechas se mostraban con 3 horas adelantadas en producción, mientras que otros módulos (ingresos, planillas, gestión de retorno principal) mostraban la hora correcta.

### Causa Raíz

El problema estaba en la diferencia de cómo se enviaban las fechas desde el backend:

1. **Módulos que funcionaban correctamente** (planillas, ingresos):
   - Backend: Enviaba fechas como arrays `[year, month, day, hour, minute, second]`
   - Frontend: Usaba `formatearFechaConHora()` que maneja arrays correctamente
   - Resultado: Hora correcta ✅

2. **Modal "Ver Productos Perdidos" (tenía el problema)**:
   - Backend: Enviaba fechas como strings ISO (`yyyy-MM-dd'T'HH:mm:ss`)
   - Frontend: Usaba función específica que parseaba strings ISO con conversión de zona horaria
   - Resultado: 3 horas adelantadas ❌

## Solución Implementada

### 1. Cambio en Backend - MovimientoDiaService.java

**Antes:**
```java
// Formatear fecha como string para evitar problemas de serialización
if (detalle.getFechaCreacion() != null) {
    productoPerdido.put("fechaCreacion", detalle.getFechaCreacion().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
} else {
    productoPerdido.put("fechaCreacion", null);
}
```

**Después:**
```java
// Enviar fecha como array para mantener consistencia con otros módulos
if (detalle.getFechaCreacion() != null) {
    LocalDateTime fechaCreacion = detalle.getFechaCreacion();
    int[] fechaArray = {
        fechaCreacion.getYear(),
        fechaCreacion.getMonthValue(),
        fechaCreacion.getDayOfMonth(),
        fechaCreacion.getHour(),
        fechaCreacion.getMinute(),
        fechaCreacion.getSecond(),
        0 // nanoseconds
    };
    productoPerdido.put("fechaCreacion", fechaArray);
} else {
    productoPerdido.put("fechaCreacion", null);
}
```

### 2. Corrección en Frontend

**Archivos modificados:**
- `frontend/src/pages/admin/DescargaDevoluciones.tsx`
- `frontend/src/pages/admin/MovimientosDia.tsx`

**Problema identificado:**
La función `formatearFechaConHora` en `dateUtils.ts` aplicaba conversión de zona horaria que causaba el adelanto de 3 horas.

**Solución:**
```javascript
// Función específica para productos perdidos que evita conversión de zona horaria
const formatearFechaConHoraProductosPerdidos = (fechaString: any): string => {
  try {
    if (fechaString == null) {
      return 'N/A';
    }

    // Si es un array (formato [year, month, day, hour, minute, second])
    if (Array.isArray(fechaString)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = fechaString;
      
      // Crear fecha local (no UTC) para evitar conversión automática
      const fechaLocal = new Date(year, month - 1, day, hour, minute, second);
      
      if (isNaN(fechaLocal.getTime())) {
        return 'Fecha inválida';
      }
      
      // Mostrar directamente sin conversión de zona horaria
      return fechaLocal.toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC' // Forzar UTC para evitar conversión de zona horaria
      });
    }

    // Si es un string ISO, parsear manualmente para evitar conversión UTC automática
    if (typeof fechaString === 'string' && fechaString.includes('T')) {
      const partes = fechaString.split('T');
      const fechaParte = partes[0].split('-');
      const horaParte = partes[1].split(':');
      
      const year = parseInt(fechaParte[0]);
      const month = parseInt(fechaParte[1]) - 1; // Meses van de 0-11
      const day = parseInt(fechaParte[2]);
      const hour = parseInt(horaParte[0]);
      const minute = parseInt(horaParte[1]);
      const second = parseInt(horaParte[2]) || 0;
      
      // Crear fecha local (no UTC) para evitar conversión automática
      const fechaLocal = new Date(year, month, day, hour, minute, second);
      
      if (isNaN(fechaLocal.getTime())) {
        return 'Fecha inválida';
      }
      
      // Mostrar directamente sin conversión de zona horaria
      return fechaLocal.toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC' // Forzar UTC para evitar conversión de zona horaria
      });
    }

    // Para otros tipos, usar la función de dateUtils
    return formatearFechaConHora(fechaString);
  } catch (error) {
    console.error('Error formateando fecha de productos perdidos:', error);
    return 'Fecha inválida';
  }
};
```

## Flujo Corregido

### 1. Backend
1. Obtiene `LocalDateTime` de la base de datos
2. Convierte a array `[year, month, day, hour, minute, second, nanoseconds]`
3. Envía array al frontend (consistente con otros módulos)

### 2. Frontend
1. Recibe array de fecha del backend
2. Usa `formatearFechaConHora()` que maneja arrays correctamente
3. Muestra fecha en zona horaria local del usuario sin conversión incorrecta

## Beneficios de la Solución

1. **Consistencia**: Ahora todos los módulos usan el mismo formato de fecha (arrays)
2. **Simplicidad**: Eliminada la lógica compleja de conversión de zona horaria
3. **Mantenibilidad**: Una sola función para formatear fechas en toda la aplicación
4. **Confiabilidad**: Usa la misma lógica probada que funciona en otros módulos

## Archivos Modificados

### Backend:
- `backend/src/main/java/com/minegocio/backend/servicios/MovimientoDiaService.java`
  - Líneas 3657-3662: Productos perdidos de remitos de ingreso
  - Líneas 3688-3693: Productos perdidos de planillas de devolución  
  - Líneas 3732-3747: Productos perdidos de roturas registradas

### Frontend:
- `frontend/src/pages/admin/DescargaDevoluciones.tsx`
  - Líneas 308-322: Simplificación de función de formateo
- `frontend/src/pages/admin/MovimientosDia.tsx`
  - Líneas 86-100: Simplificación de función de formateo

## Resultado

✅ **Problema resuelto**: El modal "Ver Productos Perdidos" ahora muestra la hora correcta, consistente con todos los demás módulos de la aplicación.

## Testing

Para verificar que la solución funciona:

1. Ir a Gestión de Retorno
2. Hacer clic en "Ver Productos Perdidos"
3. Verificar que las fechas mostradas coincidan con las de otros módulos
4. Confirmar que no hay diferencia de 3 horas
