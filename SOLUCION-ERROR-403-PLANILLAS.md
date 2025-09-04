# Solución: Error 403 en Carga de Planillas

## Problema Identificado

Al intentar crear una planilla, se obtiene un error 403 (Forbidden) que indica problemas de autorización.

### Causas Posibles

1. **Token JWT expirado o inválido**
2. **Usuario no tiene rol de administrador**
3. **Problema con el formato de fecha enviado al backend**
4. **Configuración de seguridad incorrecta**

## Solución Implementada

### 1. Corrección del Formato de Fecha

**Problema**: El frontend enviaba fechas con formato ISO que incluía 'Z' (UTC), pero Jackson no estaba configurado para manejarlo.

**Solución**: Actualizar la configuración de Jackson para usar `DateTimeFormatter.ISO_DATE_TIME`.

**JacksonConfig.java:**
```java
// Usar formato ISO que incluye 'Z' para UTC
DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ISO_DATE_TIME;
javaTimeModule.addSerializer(LocalDateTime.class, new LocalDateTimeSerializer(dateTimeFormatter));
javaTimeModule.addDeserializer(LocalDateTime.class, new LocalDateTimeDeserializer(dateTimeFormatter));
```

**application.properties:**
```properties
# Configuración de Jackson para fechas
spring.jackson.serialization.write-dates-as-timestamps=false
spring.jackson.date-format=yyyy-MM-dd'T'HH:mm:ss.SSS'Z'
spring.jackson.time-zone=UTC
spring.jackson.deserialization.adjust-dates-to-context-time-zone=false
```

### 2. Endpoint de Debug para Autenticación

**DebugController.java:**
```java
@GetMapping("/auth-status")
public ResponseEntity<Map<String, Object>> getAuthStatus(Authentication authentication) {
    Map<String, Object> response = new HashMap<>();
    
    if (authentication != null && authentication.isAuthenticated()) {
        response.put("authenticated", true);
        response.put("principal", authentication.getPrincipal().toString());
        response.put("authorities", authentication.getAuthorities().stream()
                .map(Object::toString)
                .collect(Collectors.toList()));
        
        if (authentication.getPrincipal() instanceof UsuarioPrincipal) {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            response.put("userId", usuarioPrincipal.getId());
            response.put("username", usuarioPrincipal.getUsername());
            response.put("empresaId", usuarioPrincipal.getEmpresaId());
            response.put("rol", usuarioPrincipal.getAuthorities().stream()
                    .map(Object::toString)
                    .collect(Collectors.toList()));
        }
    } else {
        response.put("authenticated", false);
        response.put("message", "No hay usuario autenticado");
    }
    
    return ResponseEntity.ok(response);
}
```

### 3. Verificación de Autenticación en Frontend

**CrearPlanilla.tsx:**
```javascript
// Verificar autenticación antes de crear la planilla
console.log('🔍 Verificando autenticación antes de crear planilla...');
try {
  const authStatus = await ApiService.debugAuthStatus();
  console.log('✅ Estado de autenticación:', authStatus);
} catch (authError) {
  console.error('❌ Error de autenticación:', authError);
  toast.error('Error de autenticación. Por favor, inicie sesión nuevamente.');
  return;
}
```

### 4. Mejora en el Manejo de Errores

**api.ts:**
```javascript
async debugAuthStatus(): Promise<any> {
  try {
    console.log('🔍 Verificando estado de autenticación...');
    const response = await this.api.get('/debug/auth-status');
    console.log('✅ Estado de autenticación:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error al verificar estado de autenticación:', error);
    console.error('❌ Status:', error.response?.status);
    console.error('❌ Data:', error.response?.data);
    throw error;
  }
}
```

## Pasos para Verificar y Solucionar

### 1. Verificar Token JWT

1. Abrir las herramientas de desarrollador del navegador
2. Ir a la pestaña Application/Storage
3. Verificar que existe un token en localStorage con la clave 'token'
4. Verificar que el token no ha expirado

### 2. Verificar Rol de Usuario

1. Hacer login como administrador
2. Verificar que el usuario tiene rol ADMINISTRADOR o SUPER_ADMIN
3. Usar el endpoint `/api/debug/auth-status` para verificar el estado

### 3. Verificar Configuración de Seguridad

La configuración de seguridad debe incluir:
```java
auth.requestMatchers("/api/planillas-pedidos/**").hasAnyRole("ADMINISTRADOR", "SUPER_ADMIN");
```

### 4. Verificar Interceptor de API

El interceptor debe agregar el token correctamente:
```javascript
if (config.url && /\/planillas-pedidos\//.test(config.url)) {
  const tokenAdmin = localStorage.getItem('token');
  if (tokenAdmin) {
    config.headers.Authorization = `Bearer ${tokenAdmin}`;
  }
}
```

## Logs de Debug

Para diagnosticar problemas, revisar los logs del backend:

1. **Logs de autenticación**: Verificar que el usuario se autentica correctamente
2. **Logs de Jackson**: Verificar que las fechas se deserializan correctamente
3. **Logs de autorización**: Verificar que el usuario tiene los permisos necesarios

## Comandos de Verificación

### Backend
```bash
# Verificar logs de autenticación
grep "authentication" logs/application.log

# Verificar logs de Jackson
grep "Jackson" logs/application.log

# Verificar logs de planillas
grep "planillas-pedidos" logs/application.log
```

### Frontend
```javascript
// Verificar token en consola
console.log('Token:', localStorage.getItem('token'));

// Verificar estado de autenticación
ApiService.debugAuthStatus().then(console.log).catch(console.error);
```

## Solución de Problemas Comunes

### Error 403 - Token Expirado
**Síntomas**: Error 403 después de un tiempo de inactividad
**Solución**: Hacer logout y login nuevamente

### Error 403 - Rol Incorrecto
**Síntomas**: Usuario logueado pero sin permisos
**Solución**: Verificar que el usuario tiene rol ADMINISTRADOR o SUPER_ADMIN

### Error 400 - Formato de Fecha
**Síntomas**: Error de deserialización de LocalDateTime
**Solución**: Verificar que Jackson está configurado para manejar fechas ISO

### Error 500 - Problema de Base de Datos
**Síntomas**: Error interno del servidor
**Solución**: Verificar logs del backend y estado de la base de datos











