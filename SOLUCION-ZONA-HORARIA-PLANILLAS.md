# Solución: Problema de Zona Horaria en Carga de Planillas

## Problema Identificado

En la carga de planillas, los registros se guardaban con la fecha de ayer y 3 horas atrasadas debido a un problema de zona horaria entre el frontend y el backend.

### Causa Raíz

1. **Frontend**: Enviaba fechas en formato local sin especificar zona horaria
2. **Backend**: Configurado para usar UTC, pero interpretaba las fechas locales como UTC
3. **Resultado**: Las fechas se guardaban con offset incorrecto

## Solución Implementada

### 1. Frontend - CrearPlanilla.tsx

**Problema anterior:**
```javascript
// ❌ Problema: Fecha local sin zona horaria
const fechaActual = new Date();
const fechaFormateada = nuevaPlanilla.fechaPlanilla + 'T' + 
  fechaActual.getHours().toString().padStart(2, '0') + ':' +
  fechaActual.getMinutes().toString().padStart(2, '0') + ':' +
  fechaActual.getSeconds().toString().padStart(2, '0');
```

**Solución implementada:**
```javascript
// ✅ Solución: Fecha en UTC correcta
const fechaSeleccionada = new Date(nuevaPlanilla.fechaPlanilla + 'T00:00:00');
const ahora = new Date();

// Crear fecha UTC combinando la fecha seleccionada con la hora actual
const fechaUTC = new Date(Date.UTC(
  fechaSeleccionada.getFullYear(),
  fechaSeleccionada.getMonth(),
  fechaSeleccionada.getDate(),
  ahora.getUTCHours(),
  ahora.getUTCMinutes(),
  ahora.getUTCSeconds()
));

// Formatear como ISO string para enviar al backend
const fechaFormateada = fechaUTC.toISOString();
```

### 2. Backend - Configuración de Zona Horaria

**TimeZoneConfig.java:**
```java
@PostConstruct
public void init() {
    // Configurar zona horaria UTC como base para consistencia global
    TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
    
    // Configurar también el sistema para usar UTC
    System.setProperty("user.timezone", "UTC");
}
```

### 3. Backend - Configuración de Jackson

**JacksonConfig.java:**
```java
@Bean
@Primary
public ObjectMapper objectMapper() {
    ObjectMapper objectMapper = new ObjectMapper();
    
    // Configurar módulo para Java Time
    JavaTimeModule javaTimeModule = new JavaTimeModule();
    
    // Configurar serializador y deserializador para LocalDateTime
    DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
    javaTimeModule.addSerializer(LocalDateTime.class, new LocalDateTimeSerializer(dateTimeFormatter));
    javaTimeModule.addDeserializer(LocalDateTime.class, new LocalDateTimeDeserializer(dateTimeFormatter));
    
    // Configurar zona horaria UTC
    objectMapper.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
    
    return objectMapper;
}
```

**application.properties:**
```properties
# Configuración de Jackson para fechas
spring.jackson.serialization.write-dates-as-timestamps=false
spring.jackson.date-format=yyyy-MM-dd'T'HH:mm:ss
spring.jackson.time-zone=UTC
spring.jackson.deserialization.adjust-dates-to-context-time-zone=false
```

### 4. Backend - Servicio de Planillas

**PlanillaPedidoService.java:**
```java
// Asegurar que la fecha se procese correctamente en UTC
LocalDateTime fechaPlanilla = dto.getFechaPlanilla();
if (fechaPlanilla == null) {
    fechaPlanilla = LocalDateTime.now();
    System.out.println("📋 [SERVICE] Fecha nula, usando fecha actual: " + fechaPlanilla);
}

PlanillaPedido planilla = new PlanillaPedido(empresa, usuario, fechaPlanilla);
```

## Flujo de Datos Corregido

1. **Frontend**: Usuario selecciona fecha → Se combina con hora actual en UTC → Se envía como ISO string
2. **Backend**: Recibe fecha UTC → Jackson la deserializa correctamente → Se guarda en base de datos
3. **Visualización**: Las fechas se muestran correctamente en la zona horaria local del cliente

## Beneficios de la Solución

1. **Consistencia**: Todas las fechas se almacenan en UTC
2. **Precisión**: No hay pérdida de información por conversiones de zona horaria
3. **Escalabilidad**: Funciona correctamente para usuarios en diferentes zonas horarias
4. **Mantenibilidad**: Código más claro y predecible

## Verificación

Para verificar que la solución funciona:

1. Crear una planilla con fecha actual
2. Verificar en la base de datos que la fecha se guarda correctamente
3. Verificar que se muestra correctamente en la interfaz
4. Probar con usuarios en diferentes zonas horarias

## Notas Importantes

- **UTC como estándar**: Todas las fechas se almacenan en UTC para consistencia global
- **Conversión en frontend**: El frontend se encarga de convertir las fechas a la zona horaria local del usuario
- **Logs mejorados**: Se agregaron logs detallados para debugging de fechas
- **Configuración centralizada**: La configuración de zona horaria está centralizada en TimeZoneConfig
















