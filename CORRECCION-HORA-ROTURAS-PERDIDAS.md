# Corrección: Problema de Hora en Roturas y Pérdidas

## Problema Identificado

En la sección de roturas y pérdidas, los registros se guardaban con la fecha de ayer debido a problemas de conversión de zona horaria entre el frontend y el backend.

### Causa Raíz

1. **Frontend**: Enviaba fechas en formato local sin especificar zona horaria
2. **Backend**: Configurado para usar UTC, pero interpretaba las fechas locales como UTC
3. **Resultado**: Las fechas se guardaban con offset incorrecto (un día atrás)

## Solución Implementada

### 1. Frontend - ModalAgregarRoturaPerdida.tsx

**Problema anterior:**
```javascript
// ❌ Problema: Fecha local sin zona horaria
const datosRoturaPerdida = {
  fecha, // Se enviaba directamente la fecha local
  cantidad: cantidadFinal,
  // ... otros campos
};
```

**Solución implementada:**
```javascript
// ✅ Solución: Fecha en UTC correcta
// Crear fecha en UTC para evitar problemas de zona horaria
const fechaSeleccionada = new Date(fecha + 'T00:00:00');
const ahora = new Date();

// Obtener la hora local del usuario
const horaLocal = ahora.getHours();
const minutosLocal = ahora.getMinutes();
const segundosLocal = ahora.getSeconds();

// Crear fecha usando la hora local del usuario
const fechaConHoraLocal = new Date(
  fechaSeleccionada.getFullYear(),
  fechaSeleccionada.getMonth(),
  fechaSeleccionada.getDate(),
  horaLocal,
  minutosLocal,
  segundosLocal
);

// Convertir a UTC para enviar al backend
const fechaUTC = new Date(fechaConHoraLocal.getTime() - (fechaConHoraLocal.getTimezoneOffset() * 60000));

// Formatear como ISO string y extraer solo la fecha
const fechaFormateada = fechaUTC.toISOString().split('T')[0];

const datosRoturaPerdida = {
  fecha: fechaFormateada, // Fecha corregida en UTC
  cantidad: cantidadFinal,
  // ... otros campos
};
```

### 2. Backend - Configuración Consistente

**RoturaPerdidaDTO.java:**
```java
// Usa LocalDate para manejar solo fechas (sin hora)
@NotNull(message = "La fecha es obligatoria")
private LocalDate fecha;
```

**RoturaPerdidaService.java:**
```java
// Guardar la fecha exactamente como la recibe del frontend
RoturaPerdida roturaPerdida = new RoturaPerdida(empresa, usuario, dto.getFecha(), dto.getCantidad());
```

### 3. Visualización - dateUtils.ts

Las funciones de formateo ya están corregidas para mantener UTC:
- `formatearFecha()`: Mantiene UTC en lugar de convertir a zona horaria local
- `formatearFechaCorta()`: Mantiene UTC para evitar problemas de conversión

## Flujo de Datos Corregido

1. **Frontend**: Usuario selecciona fecha → Se combina con hora actual → Se convierte a UTC → Se envía como YYYY-MM-DD
2. **Backend**: Jackson recibe fecha en UTC → La interpreta correctamente → Se guarda en UTC
3. **Visualización**: Las fechas se muestran convertidas a la zona horaria local del usuario

## Logs de Debug Mejorados

**Frontend:**
```javascript
console.log('📋 Fecha seleccionada:', fecha);
console.log('📋 Hora local del usuario:', `${horaLocal}:${minutosLocal}:${segundosLocal}`);
console.log('📋 Fecha con hora local:', fechaConHoraLocal.toString());
console.log('📋 Fecha convertida a UTC:', fechaUTC.toString());
console.log('📋 Fecha formateada en UTC:', fechaFormateada);
console.log('📋 Zona horaria del navegador:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('📋 Offset de zona horaria (minutos):', new Date().getTimezoneOffset());
```

## Beneficios de la Solución

1. **Precisión**: Las fechas se guardan exactamente como se seleccionan
2. **Consistencia**: Todas las fechas se manejan en UTC de manera uniforme
3. **Simplicidad**: No hay conversiones de zona horaria innecesarias
4. **Confiabilidad**: Elimina el riesgo de offsets incorrectos

## Verificación

Para verificar que la solución funciona:

1. **Crear una rotura/pérdida** con fecha actual
2. **Verificar en la interfaz** que la fecha mostrada coincide con la fecha seleccionada
3. **Verificar en la base de datos** que la fecha se guarda correctamente
4. **Probar con diferentes zonas horarias** para confirmar consistencia

## Archivos Modificados

- `frontend/src/components/ModalAgregarRoturaPerdida.tsx`
  - `crearRoturaPerdida()`: Corregida para enviar fecha en UTC

- `frontend/src/utils/dateUtils.ts` (ya corregido anteriormente)
  - `formatearFecha()`: Mantiene UTC
  - `formatearFechaCorta()`: Mantiene UTC

## Notas Importantes

- **UTC como estándar**: Todas las fechas se almacenan en UTC para consistencia
- **LocalDate vs LocalDateTime**: Las roturas y pérdidas usan LocalDate (solo fecha) a diferencia de las planillas que usan LocalDateTime (fecha y hora)
- **Conversión en frontend**: El frontend se encarga de convertir entre UTC y zona horaria local
- **Configuración consistente**: Toda la configuración del backend usa UTC

## Ejemplo de Conversión

Si un usuario en Argentina (UTC-3) registra una rotura/pérdida el 15 de enero:

1. **Frontend**: 15/01/2024 fecha local → Se convierte a 15/01/2024 UTC
2. **Backend**: Recibe 15/01/2024 UTC → Se guarda como 15/01/2024 UTC
3. **Visualización**: Se muestra como 15/01/2024 en la zona horaria local del usuario

## Diferencias con Planillas

- **Planillas**: Usan `LocalDateTime` (fecha + hora) y se muestran con hora
- **Roturas/Pérdidas**: Usan `LocalDate` (solo fecha) y se muestran solo la fecha
- **Ambos**: Se corrigen de la misma manera para evitar problemas de zona horaria
