# Solución: Problema de Zona Horaria en Ingresos

## Problema Identificado

En producción, la sección de **ingresos** mostraba la hora adelantada 3 horas comparado con la sección de **gestión de retornos** que mostraba la hora correcta.

### Causa Raíz

El problema estaba en la diferencia de cómo se manejaban las fechas entre los dos módulos:

1. **PlanillaDevolucion (funcionaba correctamente)**:
   - DTO: `fechaPlanilla` como `LocalDateTime`
   - Frontend: Envía objeto `Date` que Jackson deserializa correctamente
   - Servicio: Usa directamente `dto.getFechaPlanilla()`

2. **RemitoIngreso (tenía el problema)**:
   - DTO: `fechaRemito` como `String`
   - Frontend: Envía string que Jackson interpreta como UTC
   - Servicio: Parseaba el string con lógica compleja

## Solución Implementada

### 1. Cambio en RemitoIngresoDTO

**Antes:**
```java
private String fechaRemito;
```

**Después:**
```java
@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
private LocalDateTime fechaRemito;
```

### 2. Cambio en Frontend (CrearIngreso.tsx)

**Antes:**
```javascript
fechaRemito: fechaFormateada, // String
```

**Después:**
```javascript
fechaRemito: fechaLocal, // Objeto Date
```

### 3. Simplificación del Servicio

**Antes (RemitoIngresoService.java):**
```java
// Parsear la fecha string a LocalDateTime
LocalDateTime fechaRemito;
if (remitoDTO.getFechaRemito() != null) {
    String fechaString = remitoDTO.getFechaRemito();
    // Lógica compleja de parsing...
    fechaRemito = LocalDateTime.parse(fechaString);
} else {
    fechaRemito = LocalDateTime.now();
}
```

**Después:**
```java
// Guardar la fecha exacta que envía el usuario (sin convertir a UTC)
LocalDateTime fechaRemito = remitoDTO.getFechaRemito();
if (fechaRemito == null) {
    fechaRemito = LocalDateTime.now();
} else {
    System.out.println("📋 [SERVICE] Guardando fecha exacta del usuario (sin conversión UTC): " + fechaRemito);
}
```

## Flujo de Datos Corregido

### Frontend (modificado)
```javascript
// Crear fecha en la zona horaria local del usuario
const fechaLocal = new Date(
  fechaSeleccionada.getFullYear(),
  fechaSeleccionada.getMonth(),
  fechaSeleccionada.getDate(),
  horaLocal,
  minutosLocal,
  segundosLocal
);

// Enviar como objeto Date (no como string)
const remitoData = {
  fechaRemito: fechaLocal, // Jackson deserializará esto correctamente
  // ... otros campos
};
```

### Backend (corregido)
1. **Jackson**: Recibe objeto `Date` → Lo deserializa como `LocalDateTime` usando la configuración local
2. **Servicio**: Usa directamente `dto.getFechaRemito()` sin parsing
3. **Base de datos**: Se guarda la fecha exacta enviada por el usuario

## Beneficios de la Solución

1. **Consistencia**: Ambos módulos (ingresos y devoluciones) manejan las fechas de la misma manera
2. **Simplicidad**: Eliminación de lógica compleja de parsing y zona horaria
3. **Precisión**: Las fechas se guardan exactamente como las envía el usuario
4. **Mantenibilidad**: Código más limpio y fácil de mantener
5. **Compatibilidad**: Jackson maneja automáticamente la deserialización

## Verificación

Para verificar que la solución funciona:

1. **Crear un ingreso** con fecha y hora actual
2. **Verificar en los logs** que la fecha se recibe como `LocalDateTime`
3. **Verificar en la base de datos** que la fecha se guarda correctamente
4. **Verificar en la interfaz** que se muestra la fecha correcta

## Archivos Modificados

1. `backend/src/main/java/com/minegocio/backend/dto/RemitoIngresoDTO.java`
   - Cambio de `String fechaRemito` a `LocalDateTime fechaRemito`
   - Agregada anotación `@JsonFormat`

2. `backend/src/main/java/com/minegocio/backend/servicios/RemitoIngresoService.java`
   - Simplificación del manejo de fechas
   - Eliminación de lógica compleja de zona horaria
   - Actualización del método `convertirADTO`

3. `frontend/src/pages/admin/CrearIngreso.tsx`
   - Cambio de envío de string a objeto `Date`

## Notas Importantes

- **Jackson**: Configurado para usar fechas locales sin conversión UTC
- **Frontend**: Envía objeto `Date` que Jackson deserializa automáticamente
- **Backend**: Usa `LocalDateTime` directamente sin parsing manual
- **Testing**: Se recomienda probar en desarrollo antes de desplegar a producción

## Ejemplo de Funcionamiento

Si un usuario en Argentina (UTC-3) crea un ingreso a las 15:30:

1. **Frontend**: 15:30 hora local → Se envía como objeto `Date`
2. **Backend**: Jackson deserializa como `LocalDateTime` → Se guarda como 15:30
3. **Visualización**: Se muestra como 15:30 en la zona horaria local del usuario

La solución asegura que tanto ingresos como devoluciones manejen las fechas de manera consistente y correcta, eliminando el problema de las 3 horas de diferencia.
