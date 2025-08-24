# Corrección: Problema de Hora en Registros de Planillas

## Problema Identificado

En la sección de carga de planillas, los registros realizados mostraban la hora con un retraso de 3 horas. Esto ocurría porque las fechas se estaban convirtiendo incorrectamente entre UTC y la zona horaria local.

## Causa Raíz

El problema estaba en las funciones de formateo de fechas en el frontend:

1. **CargaPedidos.tsx**: Las funciones `formatearFechaConHoraLocal` y `formatearFechaCortaLocal` estaban convirtiendo las fechas UTC a la zona horaria local del cliente
2. **dateUtils.ts**: Las funciones de utilidad también estaban aplicando conversión de zona horaria innecesaria
3. **Resultado**: Las fechas se mostraban con offset incorrecto

## Solución Implementada

### 1. Corrección en CargaPedidos.tsx

**Antes (❌ Problema):**
```javascript
// Convertir a zona horaria local del cliente
const zonaHorariaLocal = Intl.DateTimeFormat().resolvedOptions().timeZone;

return fechaUTC.toLocaleString('es-ES', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: zonaHorariaLocal  // ❌ Causaba el offset de 3 horas
});
```

**Después (✅ Solución):**
```javascript
// La fecha ya está en UTC, solo formatear sin cambiar zona horaria
return fechaUTC.toLocaleString('es-ES', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC'  // ✅ Mantiene la hora correcta
});
```

### 2. Corrección en dateUtils.ts

**Funciones corregidas:**
- `formatearFecha()`: Ahora mantiene UTC en lugar de convertir a zona horaria local
- `formatearFechaConHora()`: Mantiene UTC para evitar problemas de conversión

**Cambio aplicado:**
```javascript
// Antes: timeZone: zonaHorariaLocal
// Después: timeZone: 'UTC'
```

## Flujo de Datos Corregido

1. **Backend**: Guarda las fechas en UTC correctamente
2. **Frontend**: Recibe las fechas en UTC como arrays `[year, month, day, hour, minute, second]`
3. **Visualización**: Las fechas se formatean manteniendo UTC, mostrando la hora correcta

## Beneficios de la Solución

1. **Precisión**: Las horas se muestran exactamente como se guardaron
2. **Consistencia**: Todas las fechas se manejan en UTC de manera uniforme
3. **Simplicidad**: No hay conversiones de zona horaria innecesarias
4. **Confiabilidad**: Elimina el riesgo de offsets incorrectos

## Verificación

Para verificar que la solución funciona:

1. **Crear una planilla** con fecha y hora actual
2. **Verificar en la interfaz** que la hora mostrada coincide con la hora de creación
3. **Verificar en la base de datos** que la fecha se guarda correctamente
4. **Probar con diferentes zonas horarias** para confirmar consistencia

## Archivos Modificados

- `frontend/src/pages/admin/CargaPedidos.tsx`
  - `formatearFechaConHoraLocal()`: Corregida para mantener UTC
  - `formatearFechaCortaLocal()`: Corregida para mantener UTC

- `frontend/src/utils/dateUtils.ts`
  - `formatearFecha()`: Corregida para mantener UTC
  - `formatearFechaConHora()`: Corregida para mantener UTC

## Notas Importantes

- **UTC como estándar**: Todas las fechas se mantienen en UTC para consistencia
- **Sin conversión**: No se aplican conversiones de zona horaria en la visualización
- **Compatibilidad**: La solución funciona para usuarios en cualquier zona horaria
- **Mantenimiento**: Código más simple y predecible

## Ejemplo de Resultado

**Antes:**
- Usuario crea planilla a las 15:30
- Se muestra como 12:30 (3 horas atrasadas)

**Después:**
- Usuario crea planilla a las 15:30
- Se muestra como 15:30 (hora correcta)
