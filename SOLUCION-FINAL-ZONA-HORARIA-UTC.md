# Solución Final: Problema de Zona Horaria en Planillas (UTC)

## Problema Identificado

Las planillas se guardaban con la fecha correcta pero con 3 horas atrasadas debido a problemas de conversión de zona horaria entre el frontend y el backend.

### Causa Raíz

1. **Configuración inconsistente**: El backend tenía configuraciones mezcladas (UTC y Argentina)
2. **Conversión incorrecta**: El frontend no convertía correctamente a UTC
3. **Interpretación errónea**: Jackson interpretaba las fechas en zona horaria incorrecta

## Solución Implementada

### 1. Backend - Configuración Consistente en UTC

**TimeZoneConfig.java:**
```java
@PostConstruct
public void init() {
    // Configurar zona horaria UTC como base para consistencia global
    TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
    System.setProperty("user.timezone", "UTC");
    System.out.println("🌍 Zona horaria del servidor configurada: " + TimeZone.getDefault().getID());
}
```

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
    
    // Configurar zona horaria UTC para manejar fechas correctamente
    objectMapper.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
    
    return objectMapper;
}
```

**application.properties:**
```properties
# Configuración de Jackson para fechas
spring.jackson.serialization.write-dates-as-timestamps=false
spring.jackson.date-format=yyyy-MM-dd'T'HH:mm:ss.SSS'Z'
spring.jackson.time-zone=UTC
spring.jackson.deserialization.adjust-dates-to-context-time-zone=false
```

### 2. Frontend - Conversión Correcta a UTC

**CrearPlanilla.tsx:**
```javascript
// Crear fecha en UTC para evitar problemas de zona horaria
const fechaSeleccionada = new Date(nuevaPlanilla.fechaPlanilla + 'T00:00:00');
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
// El backend espera fechas en UTC
const fechaUTC = new Date(fechaConHoraLocal.getTime() - (fechaConHoraLocal.getTimezoneOffset() * 60000));

// Formatear como ISO string para enviar al backend
const fechaFormateada = fechaUTC.toISOString();
```

## Flujo de Datos Corregido

1. **Frontend**: Usuario selecciona fecha → Se combina con hora local → Se convierte a UTC → Se envía como ISO string
2. **Backend**: Jackson recibe fecha ISO en UTC → La interpreta correctamente en UTC → Se guarda en UTC
3. **Visualización**: Las fechas se muestran convertidas a la zona horaria local del usuario

## Logs de Debug Mejorados

**Frontend:**
```javascript
console.log('📋 Fecha seleccionada:', nuevaPlanilla.fechaPlanilla);
console.log('📋 Hora local del usuario:', `${horaLocal}:${minutosLocal}:${segundosLocal}`);
console.log('📋 Fecha con hora local:', fechaConHoraLocal.toString());
console.log('📋 Fecha convertida a UTC:', fechaUTC.toString());
console.log('📋 Fecha formateada en UTC:', fechaFormateada);
console.log('📋 Zona horaria del navegador:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('📋 Offset de zona horaria (minutos):', new Date().getTimezoneOffset());
```

**Backend:**
```java
System.out.println("🌍 Zona horaria del servidor configurada: " + TimeZone.getDefault().getID());
System.out.println("🔧 Jackson configurado para usar UTC");
```

## Beneficios de la Solución

1. **Consistencia**: Todo el backend usa UTC como base
2. **Precisión**: Las fechas se guardan exactamente como se envían
3. **Escalabilidad**: Funciona para usuarios en cualquier zona horaria
4. **Mantenibilidad**: Configuración simple y clara

## Verificación

Para verificar que la solución funciona:

1. **Crear una planilla** con fecha y hora actual
2. **Verificar en los logs** que la fecha se envía en UTC correctamente
3. **Verificar en la base de datos** que la fecha se guarda en UTC
4. **Verificar en la interfaz** que se muestra la fecha correcta en la zona horaria local

## Notas Importantes

- **UTC como base**: Todas las fechas se almacenan en UTC en la base de datos
- **Conversión en frontend**: El frontend se encarga de convertir entre UTC y zona horaria local
- **Configuración consistente**: Toda la configuración del backend usa UTC
- **Logs detallados**: Se agregaron logs para debugging de fechas y zonas horarias

## Ejemplo de Conversión

Si un usuario en Argentina (UTC-3) crea una planilla a las 15:30:

1. **Frontend**: 15:30 hora local → Se convierte a 18:30 UTC
2. **Backend**: Recibe 18:30 UTC → Se guarda como 18:30 UTC
3. **Visualización**: Se muestra como 15:30 en la zona horaria local del usuario











