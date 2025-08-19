# 📋 Guía de Perfiles de Configuración

## 🎯 **Archivos de Configuración**

Después de la limpieza, solo tienes **3 archivos** de configuración:

### 1. **`application.properties`** - Configuración Base
- ✅ Configuraciones que se aplican a TODOS los perfiles
- ✅ Jackson, JWT, archivos, servidor, métricas

### 2. **`application-railway.properties`** - Railway (Producción)
- ✅ PostgreSQL en Railway
- ✅ Cloudinary para imágenes
- ✅ Gmail SMTP para emails
- ✅ Configuración optimizada para producción

### 3. **`application-dev-persistent.properties`** - Desarrollo Local
- ✅ H2 Database persistente
- ✅ Consola H2 habilitada
- ✅ Flyway para migraciones
- ✅ Logging detallado para debugging

## 🚀 **Cómo Usar los Perfiles**

### **Para Railway (Producción):**
```bash
# Railway usa automáticamente el perfil 'railway'
# No necesitas hacer nada especial
```

### **Para Desarrollo Local:**
```bash
# Opción 1: Maven
mvn spring-boot:run -Dspring-boot.run.profiles=dev-persistent

# Opción 2: JAR
java -jar target/backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev-persistent

# Opción 3: Variables de entorno
export SPRING_PROFILES_ACTIVE=dev-persistent
mvn spring-boot:run
```

### **Para Desarrollo con IntelliJ/Eclipse:**
```
VM Options: -Dspring.profiles.active=dev-persistent
```

## 🔧 **Variables de Entorno por Perfil**

### **Railway (Producción):**
```
SPRING_DATASOURCE_URL=jdbc:postgresql://...
SPRING_DATASOURCE_USERNAME=...
SPRING_DATASOURCE_PASSWORD=...
MINE_NEGOCIO_APP_JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_FROM=...
MINE_NEGOCIO_APP_FRONTEND_URL=...
```

### **Desarrollo Local:**
```
# No necesitas variables de entorno
# Todo está configurado en application-dev-persistent.properties
```

## 📊 **Diferencias Clave**

| Aspecto | Railway | Desarrollo Local |
|---------|---------|------------------|
| **Base de Datos** | PostgreSQL | H2 Persistente |
| **Email** | Gmail SMTP | Deshabilitado |
| **Imágenes** | Cloudinary | Local |
| **Logging** | INFO/WARN | DEBUG |
| **Flyway** | Deshabilitado | Habilitado |
| **Consola H2** | No disponible | http://localhost:8080/h2-console |

## ✅ **Verificación**

### **Railway:**
```
https://tu-app.railway.app/api/publico/health
https://tu-app.railway.app/api/publico/health/db
```

### **Desarrollo Local:**
```
http://localhost:8080/api/publico/health
http://localhost:8080/h2-console
```

## 🎯 **Beneficios de esta Configuración**

1. **✅ Limpia** - Solo 3 archivos bien organizados
2. **✅ Clara** - Cada perfil tiene un propósito específico
3. **✅ Mantenible** - Fácil de entender y modificar
4. **✅ Escalable** - Fácil agregar nuevos perfiles si es necesario
