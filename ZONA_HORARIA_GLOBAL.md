# Sistema de Zonas Horarias Global

## Descripción

El sistema ahora maneja automáticamente las zonas horarias para clientes de todo el mundo. Todas las fechas se almacenan en UTC en el backend y se convierten automáticamente a la zona horaria local del cliente en el frontend.

## Cómo Funciona

### Backend (UTC)
- **Almacenamiento**: Todas las fechas se guardan en UTC en la base de datos
- **Configuración**: El servidor usa UTC como zona horaria base
- **Consistencia**: Garantiza que las fechas sean consistentes independientemente de dónde se ejecute el servidor

### Frontend (Zona Horaria Local)
- **Detección Automática**: Detecta automáticamente la zona horaria del cliente
- **Conversión**: Convierte las fechas UTC a la zona horaria local del cliente
- **Visualización**: Muestra las fechas en el formato local del cliente

## Componentes Implementados

### 1. TimeZoneConfig.java
```java
// Configura el servidor para usar UTC como base
TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
```

### 2. dateUtils.ts
Funciones principales:
- `obtenerZonaHorariaLocal()`: Detecta la zona horaria del cliente
- `convertirUTCALocal()`: Convierte fechas UTC a zona horaria local
- `formatearFechaConHora()`: Formatea fechas con conversión automática

### 3. TimeZoneInfo.tsx
Componente que muestra información sobre la zona horaria detectada:
- Zona horaria actual
- Offset respecto a UTC
- Formato: "America/Argentina/Buenos_Aires (UTC-03:00)"

## Beneficios

### Para Clientes
- **Fechas Correctas**: Las fechas se muestran en su zona horaria local
- **Sin Confusión**: No hay diferencias de horas entre servidor y cliente
- **Experiencia Consistente**: Funciona igual en cualquier parte del mundo

### Para Desarrolladores
- **Código Limpio**: No hay lógica de zona horaria hardcodeada
- **Escalabilidad**: Funciona automáticamente para cualquier zona horaria
- **Mantenimiento**: Un solo lugar para manejar conversiones de fechas

## Ejemplos de Uso

### Cliente en Argentina (UTC-3)
- Fecha en BD: `2025-01-20T05:25:00Z` (UTC)
- Fecha mostrada: `20/01/2025, 02:25` (hora local)

### Cliente en España (UTC+1 en invierno, UTC+2 en verano)
- Fecha en BD: `2025-01-20T05:25:00Z` (UTC)
- Fecha mostrada: `20/01/2025, 06:25` (hora local en invierno)

### Cliente en Japón (UTC+9)
- Fecha en BD: `2025-01-20T05:25:00Z` (UTC)
- Fecha mostrada: `20/01/2025, 14:25` (hora local)

## Verificación

Para verificar que funciona correctamente:

1. **En Gestión de Pedidos**: Se muestra la zona horaria detectada en la parte superior
2. **En Consola del Navegador**: Se registran las conversiones de fechas
3. **En Diferentes Dispositivos**: Las fechas se adaptan automáticamente

## Configuración

### Variables de Entorno
No se requieren variables adicionales. El sistema detecta automáticamente la zona horaria del cliente.

### Personalización
Si necesitas personalizar el formato de fechas para una región específica, puedes modificar las opciones en `formatearFechaConHora()`.

## Troubleshooting

### Problema: Fechas incorrectas
**Solución**: Verificar que el navegador tenga la zona horaria correcta configurada

### Problema: Zona horaria no detectada
**Solución**: El sistema fallback a UTC automáticamente

### Problema: Fechas en formato incorrecto
**Solución**: Verificar que las fechas del backend vengan en formato ISO 8601

## Notas Técnicas

- **Compatibilidad**: Funciona en todos los navegadores modernos
- **Performance**: La detección de zona horaria es instantánea
- **Fallback**: Si no se puede detectar la zona horaria, usa UTC
- **Logging**: Se registran las conversiones en la consola para debugging
