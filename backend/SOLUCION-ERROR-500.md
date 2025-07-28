# Solución para Error 500 en Producción

## 🔍 **Problema Identificado**

Estás experimentando errores 500 en producción cuando:
- Entras como administrador
- Intentas cargar la configuración de empresa
- Intentas cargar estadísticas de ventas

## 🛠️ **Cambios Realizados**

### 1. **Mejorado el Manejo de Errores**
- ✅ Agregado logging detallado en endpoints críticos
- ✅ Mejorado el manejo de excepciones en `AdminController`
- ✅ Agregado endpoint `/health` para diagnóstico

### 2. **Configuración de Logs Mejorada**
- ✅ Activado logging DEBUG en producción para Railway
- ✅ Agregado logging de SQL y Hibernate
- ✅ Configurado logging a archivo `/tmp/minegocio.log`

### 3. **Script de Verificación**
- ✅ Creado `verificar-produccion.sh` para diagnosticar problemas
- ✅ Endpoint `/api/admin/health` para verificar conectividad

## 🚀 **Pasos para Resolver**

### **Paso 1: Hacer Deploy de los Cambios**
```bash
# Hacer commit y push de los cambios
git add .
git commit -m "Fix: Mejorado manejo de errores y logging para producción"
git push origin main
```

### **Paso 2: Verificar Variables de Entorno en Railway**
Asegúrate de que estas variables estén configuradas en Railway:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://tu-host:puerto/tu-database
SPRING_DATASOURCE_USERNAME=tu_usuario
SPRING_DATASOURCE_PASSWORD=tu_password
MINE_NEGOCIO_APP_JWT_SECRET=tu_secret_super_seguro_de_al_menos_64_caracteres
PORT=8080
MINE_NEGOCIO_APP_FRONTEND_URL=https://tu-frontend-en-render.com
```

### **Paso 3: Verificar el Estado de la Aplicación**
```bash
# Ejecutar el script de verificación
./backend/verificar-produccion.sh

# O manualmente verificar endpoints
curl https://minegocio-backend-production.up.railway.app/api/admin/health
```

### **Paso 4: Revisar Logs en Railway**
1. Ve a tu dashboard de Railway
2. Selecciona tu servicio backend
3. Ve a la pestaña "Logs"
4. Busca errores específicos

## 🔍 **Diagnóstico de Errores Comunes**

### **Error 1: Problemas de Base de Datos**
```
❌ Error: Cannot load driver class: org.postgresql.Driver
```
**Solución:** Verificar que PostgreSQL esté en el classpath y las variables de entorno estén correctas.

### **Error 2: Problemas de Autenticación**
```
❌ Error: Token no válido
```
**Solución:** Verificar que el JWT secret esté configurado correctamente.

### **Error 3: Problemas de Conexión**
```
❌ Error: Connection refused
```
**Solución:** Verificar que la URL de la base de datos sea correcta y accesible.

### **Error 4: Problemas de Permisos**
```
❌ Error: Permission denied
```
**Solución:** Verificar que las credenciales de la base de datos tengan permisos suficientes.

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

### **Verificar Base de Datos**
```sql
-- Verificar que las tablas existan
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verificar datos de empresa
SELECT * FROM empresas LIMIT 5;

-- Verificar datos de usuario
SELECT * FROM usuarios LIMIT 5;
```

## 📞 **Siguientes Pasos**

1. **Hacer deploy** de los cambios
2. **Verificar** que la aplicación se inicie correctamente
3. **Revisar logs** en Railway para identificar errores específicos
4. **Probar** los endpoints con el script de verificación
5. **Reportar** cualquier error específico que encuentres

## 🔧 **Comandos Útiles**

```bash
# Verificar estado de la aplicación
curl https://minegocio-backend-production.up.railway.app/api/admin/health

# Ver logs en Railway (desde el dashboard)
# Ve a Railway > Tu servicio > Logs

# Reiniciar el servicio en Railway
# Ve a Railway > Tu servicio > Settings > Redeploy
```

## 📝 **Notas Importantes**

- **Logs detallados** están activados temporalmente para debugging
- **El endpoint `/health`** no requiere autenticación
- **Los errores 500** ahora incluyen más información de debugging
- **La aplicación** debería ser más robusta después de estos cambios

¡Con estos cambios deberías poder identificar y resolver el problema específico que está causando los errores 500! 