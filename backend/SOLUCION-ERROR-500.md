# Solución para Error 500 en Producción

## 🔍 **Problema Identificado**

Estás experimentando errores 500 en producción cuando:
- Entras como administrador
- Intentas cargar la configuración de empresa
- Intentas cargar estadísticas de ventas

**Error específico encontrado:**
```
Driver org.h2.Driver claims to not accept jdbcUrl, jdbc:postgresql://maglev.proxy.rlwy.net:47286/railway
```

## 🛠️ **Cambios Realizados**

### 1. **Resuelto Conflicto de Drivers de Base de Datos**
- ✅ Implementado perfiles Maven para separar H2 (desarrollo) y PostgreSQL (producción)
- ✅ H2 solo disponible en perfil `dev`
- ✅ PostgreSQL solo disponible en perfil `prod`
- ✅ Eliminado conflicto entre drivers

### 2. **Mejorado el Manejo de Errores**
- ✅ Agregado logging detallado en endpoints críticos
- ✅ Mejorado el manejo de excepciones en `AdminController`
- ✅ Agregado endpoint `/health` para diagnóstico

### 3. **Configuración de Logs Mejorada**
- ✅ Activado logging DEBUG en producción para Railway
- ✅ Agregado logging de SQL y Hibernate
- ✅ Configurado logging a archivo `/tmp/minegocio.log`

### 4. **Scripts de Build**
- ✅ Creado `railway-build.sh` para build de producción
- ✅ Creado `verificar-produccion.sh` para diagnosticar problemas
- ✅ Endpoint `/api/admin/health` para verificar conectividad

## 🚀 **Pasos para Resolver**

### **Paso 1: Hacer Deploy de los Cambios**
```bash
# Hacer commit y push de los cambios
git add .
git commit -m "Fix: Resuelto conflicto de drivers H2/PostgreSQL con perfiles Maven"
git push origin main
```

### **Paso 2: Configurar Railway para Usar Perfil de Producción**
En Railway, asegúrate de que el build use el perfil correcto:

```bash
# En Railway, el build command debería ser:
./mvnw clean package -Pprod -DskipTests

# O usar el script:
./railway-build.sh
```

### **Paso 3: Verificar Variables de Entorno en Railway**
Asegúrate de que estas variables estén configuradas en Railway:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://tu-host:puerto/tu-database
SPRING_DATASOURCE_USERNAME=tu_usuario
SPRING_DATASOURCE_PASSWORD=tu_password
MINE_NEGOCIO_APP_JWT_SECRET=tu_secret_super_seguro_de_al_menos_64_caracteres
PORT=8080
MINE_NEGOCIO_APP_FRONTEND_URL=https://tu-frontend-en-render.com
```

### **Paso 4: Verificar el Estado de la Aplicación**
```bash
# Ejecutar el script de verificación
./backend/verificar-produccion.sh

# O manualmente verificar endpoints
curl https://minegocio-backend-production.up.railway.app/api/admin/health
```

### **Paso 5: Revisar Logs en Railway**
1. Ve a tu dashboard de Railway
2. Selecciona tu servicio backend
3. Ve a la pestaña "Logs"
4. Busca errores específicos

## 🔍 **Diagnóstico de Errores Comunes**

### **Error 1: Conflicto de Drivers (RESUELTO)**
```
❌ Error: Driver org.h2.Driver claims to not accept jdbcUrl, jdbc:postgresql://...
```
**Solución:** ✅ Implementado perfiles Maven para separar drivers

### **Error 2: Problemas de Base de Datos**
```
❌ Error: Cannot load driver class: org.postgresql.Driver
```
**Solución:** Verificar que se use el perfil `prod` en Railway

### **Error 3: Problemas de Autenticación**
```
❌ Error: Token no válido
```
**Solución:** Verificar que el JWT secret esté configurado correctamente.

### **Error 4: Problemas de Conexión**
```
❌ Error: Connection refused
```
**Solución:** Verificar que la URL de la base de datos sea correcta y accesible.

## 📊 **Endpoints para Verificar**

### **1. Health Check (Sin Autenticación)**
```bash
GET /api/admin/health
```
**Respuesta esperada:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00",
  "environment": "production",
  "token_present": false
}
```

### **2. Empresa (Con Autenticación)**
```bash
GET /api/admin/empresa
Authorization: Bearer TU_TOKEN_JWT
```
**Respuesta esperada:**
```json
{
  "mensaje": "Empresa obtenida correctamente",
  "data": {
    "id": 1,
    "nombre": "Mi Empresa",
    "subdominio": "miempresa",
    // ... más datos
  }
}
```

### **3. Estadísticas de Ventas (Con Autenticación)**
```bash
GET /api/admin/estadisticas-ventas
Authorization: Bearer TU_TOKEN_JWT
```
**Respuesta esperada:**
```json
{
  "mensaje": "Estadísticas obtenidas correctamente",
  "data": {
    "totalVentas": 1000.0,
    "totalVentasPedidos": 800.0,
    "totalVentasRapidas": 200.0
  }
}
```

## 🐛 **Debugging Avanzado**

### **Verificar Perfil de Build**
```bash
# Verificar que se use el perfil correcto
./mvnw clean package -Pprod -DskipTests

# Verificar dependencias en el JAR
jar -tf target/backend-0.0.1-SNAPSHOT.jar | grep -E "(h2|postgresql)"
```

### **Verificar Logs Detallados**
Los logs ahora incluyen información detallada:
- ✅ Tokens JWT
- ✅ IDs de usuario y empresa
- ✅ Consultas SQL
- ✅ Errores específicos

### **Usar el Endpoint de Health**
El endpoint `/health` te dará información sobre:
- ✅ Estado de la aplicación
- ✅ Validez del token
- ✅ Existencia del usuario
- ✅ Existencia de la empresa

## 📞 **Siguientes Pasos**

1. **Hacer deploy** de los cambios
2. **Verificar** que Railway use el perfil `prod`
3. **Revisar logs** en Railway para confirmar que no hay errores de driver
4. **Probar** los endpoints con el script de verificación
5. **Reportar** cualquier error específico que encuentres

## 🔧 **Comandos Útiles**

```bash
# Build para producción (sin H2)
./mvnw clean package -Pprod -DskipTests

# Build para desarrollo (con H2)
./mvnw clean package -Pdev -DskipTests

# Verificar estado de la aplicación
curl https://minegocio-backend-production.up.railway.app/api/admin/health

# Ver logs en Railway (desde el dashboard)
# Ve a Railway > Tu servicio > Logs

# Reiniciar el servicio en Railway
# Ve a Railway > Tu servicio > Settings > Redeploy
```

## 📝 **Notas Importantes**

- **Perfiles Maven** resuelven el conflicto de drivers
- **H2 solo en desarrollo**, PostgreSQL solo en producción
- **Logs detallados** están activados temporalmente para debugging
- **El endpoint `/health`** no requiere autenticación
- **Los errores 500** ahora incluyen más información de debugging
- **La aplicación** debería ser más robusta después de estos cambios

¡Con estos cambios el conflicto de drivers debería estar resuelto y la aplicación debería funcionar correctamente en producción! 