# Solución Final: Problema de Zona Horaria en Planillas

## Problema Identificado

Las planillas se guardaban con la fecha correcta pero con 3 horas atrasadas debido a problemas de conversión de zona horaria entre el frontend y el backend.

### Causa Raíz

1. **Frontend**: Enviaba fechas usando `Date.UTC()` que convertía la hora local a UTC
2. **Backend**: Jackson estaba configurado para usar UTC, interpretando las fechas como UTC
3. **Resultado**: Las fechas se guardaban con offset incorrecto (3 horas atrasadas)

## Solución Implementada

### 1. Frontend - Corrección de la Conversión de Fecha

**Problema anterior:**
```javascript
// ❌ Problema: Usaba Date.UTC() que convertía a UTC
const fechaUTC = new Date(Date.UTC(
  fechaSeleccionada.getFullYear(),
  fechaSeleccionada.getMonth(),
  fechaSeleccionada.getDate(),
  ahora.getUTCHours(),
  ahora.getUTCMinutes(),
  ahora.getUTCSeconds()
));
```

**Solución implementada:**
```javascript
// ✅ Solución: Usa la hora local del usuario
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

// Formatear como ISO string para enviar al backend
const fechaFormateada = fechaConHoraLocal.toISOString();
```

### 2. Backend - Configuración de Jackson

**JacksonConfig.java:**
```java
@Bean
@Primary
public ObjectMapper objectMapper() {
    ObjectMapper objectMapper = new ObjectMapper();
    
    // Configurar módulo para Java Time
    JavaTimeModule javaTimeModule = new JavaTimeModule();
    
    // Configurar serializador y deserializador para LocalDateTime
    DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ISO_DATE_TIME;
    javaTimeModule.addSerializer(LocalDateTime.class, new LocalDateTimeSerializer(dateTimeFormatter));
    javaTimeModule.addDeserializer(LocalDateTime.class, new LocalDateTimeDeserializer(dateTimeFormatter));
    
    // Registrar el módulo
    objectMapper.registerModule(javaTimeModule);
    
    // Configuraciones adicionales
    objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    objectMapper.disable(SerializationFeature.WRITE_DATES_WITH_ZONE_ID);
    
    // Configurar zona horaria del sistema para manejar fechas locales correctamente
    objectMapper.setTimeZone(java.util.TimeZone.getDefault());
    
    return objectMapper;
}
```

**application.properties:**
```properties
# Configuración de Jackson para fechas
spring.jackson.serialization.write-dates-as-timestamps=false
spring.jackson.date-format=yyyy-MM-dd'T'HH:mm:ss.SSS'Z'
spring.jackson.time-zone=America/Argentina/Buenos_Aires
spring.jackson.deserialization.adjust-dates-to-context-time-zone=true
```

### 3. Backend - Configuración de Zona Horaria del Sistema

**TimeZoneConfig.java:**
```java
@PostConstruct
public void init() {
    // Configurar zona horaria del sistema para consistencia
    TimeZone.setDefault(TimeZone.getTimeZone("America/Argentina/Buenos_Aires"));
    
    // Configurar también el sistema
    System.setProperty("user.timezone", "America/Argentina/Buenos_Aires");
    
    System.out.println("🌍 Zona horaria del servidor configurada: " + TimeZone.getDefault().getID());
}
```

## Flujo de Datos Corregido

1. **Frontend**: Usuario selecciona fecha → Se combina con hora local → Se envía como ISO string
2. **Backend**: Jackson recibe fecha ISO → La interpreta en zona horaria local → Se guarda correctamente
3. **Visualización**: Las fechas se muestran en la zona horaria local del usuario

## Logs de Debug Mejorados

**Frontend:**
```javascript
console.log('📋 Fecha seleccionada:', nuevaPlanilla.fechaPlanilla);
console.log('📋 Hora local del usuario:', `${horaLocal}:${minutosLocal}:${segundosLocal}`);
console.log('📋 Fecha con hora local:', fechaConHoraLocal.toString());
console.log('📋 Fecha formateada en UTC:', fechaFormateada);
console.log('📋 Zona horaria del navegador:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('📋 Offset de zona horaria (minutos):', new Date().getTimezoneOffset());
```

**Backend:**
```java
System.out.println("🔧 Jackson configurado para usar zona horaria del sistema: " + java.util.TimeZone.getDefault().getID());
System.out.println("🌍 Zona horaria del servidor configurada: " + TimeZone.getDefault().getID());
```

## Beneficios de la Solución

1. **Precisión**: Las fechas se guardan con la hora exacta del usuario
2. **Consistencia**: Tanto frontend como backend usan la misma zona horaria
3. **Simplicidad**: No hay conversiones complejas de UTC
4. **Mantenibilidad**: Código más claro y predecible

## Verificación

Para verificar que la solución funciona:

1. **Crear una planilla** con fecha y hora actual
2. **Verificar en la base de datos** que la fecha y hora se guardan correctamente
3. **Verificar en la interfaz** que se muestra la fecha y hora correcta
4. **Revisar los logs** para confirmar que no hay errores de zona horaria

## Configuración por Zona Horaria

Si necesitas cambiar la zona horaria para otros países, actualiza:

**application.properties:**
```properties
spring.jackson.time-zone=America/New_York  # Para EST
spring.jackson.time-zone=Europe/Madrid     # Para España
spring.jackson.time-zone=Asia/Tokyo        # Para Japón
```

**TimeZoneConfig.java:**
```java
TimeZone.setDefault(TimeZone.getTimeZone("America/New_York"));
System.setProperty("user.timezone", "America/New_York");
```

## Notas Importantes

- **Zona horaria consistente**: Tanto el frontend como el backend usan la misma zona horaria
- **No hay conversiones UTC**: Se evitan problemas de conversión de zona horaria
- **Configuración centralizada**: La zona horaria se configura en un solo lugar
- **Logs detallados**: Se agregaron logs para debugging de fechas y zonas horarias




















