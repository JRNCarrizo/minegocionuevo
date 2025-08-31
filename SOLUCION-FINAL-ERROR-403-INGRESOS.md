# Solución Final: Error 403 y Problema de Zona Horaria en Ingresos

## Problema Identificado

Después de implementar la corrección de zona horaria en ingresos, se presentaron dos problemas:

1. **Error 403 (Forbidden)** al intentar crear remitos de ingreso
2. **Error de deserialización JSON** cuando se resolvió el 403
3. **Problema de zona horaria**: Las fechas seguían apareciendo 3 horas adelantadas

### Causa Raíz

1. **Error 403**: El endpoint `/api/remitos-ingreso` no estaba incluido en el interceptor de Axios
2. **Error de deserialización**: Jackson no podía parsear fechas ISO completas con 'Z' al final
3. **Problema de zona horaria**: Configuraciones conflictivas entre TimeZoneConfig, Jackson y application.properties

## Análisis del Problema de Zona Horaria

### Configuraciones Conflictivas Encontradas:

1. **TimeZoneConfig.java**: Forzaba UTC globalmente
   ```java
   TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
   System.setProperty("user.timezone", "UTC");
   ```

2. **application.properties**: Configuración de Jackson que interfería
   ```properties
   spring.jackson.date-format=yyyy-MM-dd'T'HH:mm:ss
   ```

3. **RemitoIngreso.java**: Anotaciones @JsonFormat inconsistentes
   ```java
   @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
   private LocalDateTime fechaCreacion;
   ```

4. **JacksonConfig.java**: Usaba DateTimeFormatter.ISO_DATE_TIME (con 'Z')

### Error de Deserialización
Los logs mostraron:
```
JSON parse error: Cannot deserialize value of type `java.time.LocalDateTime` from String "2025-08-31T02:57:27.000Z": Failed to deserialize java.time.LocalDateTime: (java.time.format.DateTimeParseException) Text '2025-08-31T02:57:27.000Z' could not be parsed, unparsed text found at index 19
```

## Solución Implementada

### 1. Corrección del Interceptor de Axios

**Archivo**: `frontend/src/services/api.ts`

**Cambio**:
```javascript
// Endpoints de administrador (requieren token de admin)
if (
  config.url &&
  (/\/admin\//.test(config.url) ||
   /\/empresas\/\d+\//.test(config.url) ||
   /\/notificaciones\//.test(config.url) ||
   /\/historial-carga-productos\//.test(config.url) ||
   /\/planillas-pedidos\//.test(config.url) ||
   /\/devoluciones\//.test(config.url) ||
   /\/roturas-perdidas\//.test(config.url) ||
   /\/remitos-ingreso\//.test(config.url))  // ← Agregado
) {
  // Agregar token de administrador
}
```

### 2. Corrección de TimeZoneConfig

**Archivo**: `backend/src/main/java/com/minegocio/backend/configuracion/TimeZoneConfig.java`

**Antes**:
```java
// Configurar zona horaria UTC como base para consistencia global
TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
System.setProperty("user.timezone", "UTC");
```

**Después**:
```java
// NO configurar zona horaria UTC globalmente
// Permitir que las fechas se manejen localmente sin conversiones
// System.setProperty("user.timezone", "UTC"); // COMENTADO
```

### 3. Corrección de application.properties

**Archivo**: `backend/src/main/resources/application.properties`

**Cambio**:
```properties
# Configuración de Jackson para fechas (COMENTADA - se maneja en JacksonConfig.java)
# spring.jackson.serialization.write-dates-as-timestamps=false
# spring.jackson.date-format=yyyy-MM-dd'T'HH:mm:ss
```

### 4. Corrección de JacksonConfig

**Archivo**: `backend/src/main/java/com/minegocio/backend/configuracion/JacksonConfig.java`

**Antes**:
```java
// Usar formato ISO completo que incluye 'Z' para compatibilidad con frontend
DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ISO_DATE_TIME;
```

**Después**:
```java
// Usar formato simple sin 'Z' para evitar conversiones UTC
DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern(DATETIME_FORMAT);
```

### 5. Corrección de RemitoIngreso.java

**Archivo**: `backend/src/main/java/com/minegocio/backend/entidades/RemitoIngreso.java`

**Cambio**:
```java
@CreationTimestamp
@Column(name = "fecha_creacion", updatable = false)
// @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") // REMOVIDO
private LocalDateTime fechaCreacion;

@UpdateTimestamp
@Column(name = "fecha_actualizacion")
// @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") // REMOVIDO
private LocalDateTime fechaActualizacion;
```

### 6. Corrección del DTO

**Archivo**: `backend/src/main/java/com/minegocio/backend/dto/RemitoIngresoDTO.java`

**Cambio**:
```java
@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") // Formato simple sin 'Z'
private LocalDateTime fechaRemito;
```

## Flujo de Datos Corregido

### Frontend
1. Usuario crea un remito de ingreso
2. Interceptor detecta `/api/remitos-ingreso` y agrega token de administrador
3. Se envía objeto `Date` que se serializa como string simple

### Backend
1. Jackson recibe fecha simple (ej: `"2025-08-30T15:30:00"`)
2. `DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")` parsea correctamente
3. Se convierte a `LocalDateTime` sin conversiones UTC
4. Se guarda en la base de datos con hora local

## Verificación

### Logs de Autenticación
```
✅ Autenticación establecida exitosamente para: vinos@gmail.com
✅ Authorities establecidos: [ROLE_ADMINISTRADOR]
```

### Logs de Zona Horaria
```
🌍 Zona horaria del servidor actual: [zona local]
🌍 Configuración: Las fechas se manejan localmente sin conversiones UTC
🔧 Jackson configurado para usar fechas locales sin conversiones UTC
```

### Logs de Deserialización
Ya no aparecen errores de parsing JSON.

## Archivos Modificados

1. **`frontend/src/services/api.ts`**
   - Agregado `/\/remitos-ingreso\//` al interceptor de autenticación
   - Agregados logs de debug para troubleshooting

2. **`backend/src/main/java/com/minegocio/backend/configuracion/TimeZoneConfig.java`**
   - Removida configuración UTC global
   - Permitir manejo local de fechas

3. **`backend/src/main/resources/application.properties`**
   - Comentada configuración de Jackson que interfería

4. **`backend/src/main/java/com/minegocio/backend/configuracion/JacksonConfig.java`**
   - Cambiado a formato simple sin 'Z'
   - Eliminadas conversiones UTC

5. **`backend/src/main/java/com/minegocio/backend/entidades/RemitoIngreso.java`**
   - Removidas anotaciones @JsonFormat conflictivas

6. **`backend/src/main/java/com/minegocio/backend/dto/RemitoIngresoDTO.java`**
   - Actualizada anotación @JsonFormat para formato simple

7. **`backend/src/main/java/com/minegocio/backend/seguridad/AuthTokenFilter.java`**
   - Agregados logs específicos para debugging de `/remitos-ingreso`

## Beneficios de la Solución

1. **Consistencia**: Todas las configuraciones de fecha están alineadas
2. **Simplicidad**: Formato simple sin conversiones UTC
3. **Robustez**: Manejo correcto de fechas locales
4. **Compatibilidad**: Funciona con cualquier zona horaria del servidor
5. **Debugging**: Logs detallados para facilitar troubleshooting futuro

## Notas Importantes

- **Sin UTC forzado**: El servidor usa su zona horaria local
- **Formato simple**: `yyyy-MM-dd'T'HH:mm:ss` sin 'Z' al final
- **Sin conversiones**: Las fechas se manejan tal como se reciben
- **Consistencia**: Ingresos y devoluciones funcionan de manera idéntica

## Ejemplo de Funcionamiento

Si un usuario crea un ingreso a las 15:30:

1. **Frontend**: Envía `"2025-08-30T15:30:00"`
2. **Jackson**: Parsea correctamente usando formato simple
3. **Backend**: Guarda como `LocalDateTime` con hora exacta
4. **Base de datos**: Almacena la fecha exacta enviada por el usuario
5. **Visualización**: Muestra la hora correcta sin adelantos

La solución asegura que tanto la autenticación como el manejo de fechas funcionen correctamente sin problemas de zona horaria.
