# 🚀 Guía de Desarrollo - Negocio360

## 📋 Configuraciones Disponibles

### 1. **Desarrollo con Base de Datos Persistente** (RECOMENDADO)
```bash
# Usar el script automático
start-dev-persistent.bat

# O manualmente
cd backend
mvnw spring-boot:run -Dspring-boot.run.profiles=dev-persistent
```

**Características:**
- ✅ Base de datos H2 persistente (datos se mantienen entre reinicios)
- ✅ **Datos creados manualmente** - Tú tienes control total
- ✅ Consola H2 disponible en: http://localhost:8080/h2-console
- ✅ Logs detallados para debugging
- ✅ Emails deshabilitados (no se envían emails reales)

### 2. **Desarrollo con Base de Datos en Memoria**
```bash
cd backend
mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

**Características:**
- ❌ Datos se pierden al reiniciar
- ✅ Inicialización rápida
- ✅ Ideal para pruebas rápidas

### 3. **Producción**
```bash
cd backend
mvnw spring-boot:run -Dspring-boot.run.profiles=prod
```

## 🔧 Creación Manual de Datos

### **Paso 1: Crear Super Admin**
1. Ve a la página de registro de administrador
2. Crea un usuario con rol `SUPER_ADMIN`
3. O usa el endpoint: `POST /api/super-admin/crear-super-admin-prueba`

### **Paso 2: Crear Planes**
1. Accede como Super Admin
2. Ve a "Gestión de Suscripciones"
3. Crea los planes que necesites

### **Paso 3: Crear Empresas**
1. Como Super Admin, crea empresas
2. O registra empresas desde el frontend

## 🗄️ Base de Datos

### **Ubicación de Archivos**
- **Desarrollo persistente:** `backend/data/dev-database.mv.db`
- **Consola H2:** http://localhost:8080/h2-console

### **Credenciales H2**
- **JDBC URL:** jdbc:h2:file:./data/dev-database
- **Usuario:** sa
- **Password:** dev123

### **Limpiar Base de Datos**
```bash
# Usar el script automático
clean-dev-database.bat

# O manualmente eliminar:
# backend/data/dev-database.mv.db
# backend/data/dev-database.trace.db
# backend/data/dev-database.lock.db
```

## 🔍 Debugging

### **Logs Disponibles**
- **Aplicación:** `logging.level.com.minegocio=DEBUG`
- **SQL:** `logging.level.org.hibernate.SQL=DEBUG`
- **Parámetros SQL:** `logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE`

### **Endpoints de Debug**
- **Usuario actual:** GET `/api/super-admin/debug/usuario-actual`
- **Crear Super Admin:** POST `/api/super-admin/crear-super-admin-prueba`

## 📁 Estructura de Archivos

```
backend/
├── data/                          # Base de datos H2 persistente
│   └── dev-database.mv.db
├── uploads/                       # Archivos subidos
│   ├── images/
│   └── logos/
└── src/main/resources/
    ├── application.properties     # Configuración base
    ├── application-dev.properties # Desarrollo en memoria
    └── application-dev-persistent.properties # Desarrollo persistente
```

## 🚨 Solución de Problemas

### **Error 403 Forbidden**
1. Verificar que estés logueado como Super Admin
2. Usar el archivo `debug-super-admin.html` para diagnosticar
3. Verificar que el token sea válido

### **Base de Datos Corrupta**
1. Detener el servidor
2. Ejecutar `clean-dev-database.bat`
3. Reiniciar el servidor

### **Datos No Se Persisten**
1. Verificar que uses el perfil `dev-persistent`
2. Verificar que el directorio `backend/data/` existe
3. Verificar permisos de escritura

## 🎯 Flujo de Trabajo Recomendado

1. **Iniciar desarrollo:**
   ```bash
   start-dev-persistent.bat
   ```

2. **Crear Super Admin:**
   - Usar el endpoint de debug o registro manual
   - Email: tu-email@ejemplo.com
   - Password: tu-password

3. **Crear planes y empresas manualmente**

4. **Reiniciar servidor cuando sea necesario**
   - Los datos se mantienen automáticamente

5. **Limpiar datos cuando sea necesario:**
   ```bash
   clean-dev-database.bat
   ```

## 📞 Soporte

Si tienes problemas:
1. Revisar los logs en la consola
2. Verificar la configuración del perfil
3. Usar los scripts de debug incluidos
4. Consultar este documento 