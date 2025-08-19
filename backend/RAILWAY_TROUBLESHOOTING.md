# 🔧 Troubleshooting Railway

## 🚨 **Problema: Variables de entorno no funcionan después de commit**

### **Diagnóstico:**
- ✅ Variables configuradas en Railway
- ✅ Código funcionaba antes
- ❌ Después de commit, conexión a base de datos falla

### **Posibles Causas:**

#### **1. Archivo application.properties base sin configuración de BD**
- **Problema:** El archivo base no tenía configuración de base de datos
- **Solución:** ✅ Agregada configuración de BD al archivo base

#### **2. Railway no usa el perfil correcto**
- **Problema:** Railway podría no estar usando `--spring.profiles.active=railway`
- **Solución:** ✅ Verificado en `railway.json`

#### **3. Variables de entorno se perdieron**
- **Problema:** Las variables se borraron accidentalmente
- **Solución:** Verificar en Railway → Variables

## 🔍 **Pasos de Verificación**

### **Paso 1: Verificar Variables en Railway**
1. Ve a Railway → Tu proyecto → Variables
2. Verifica que tengas:
   ```
   SPRING_DATASOURCE_URL=jdbc:postgresql://...
   SPRING_DATASOURCE_USERNAME=...
   SPRING_DATASOURCE_PASSWORD=...
   MINE_NEGOCIO_APP_JWT_SECRET=...
   ```

### **Paso 2: Verificar Perfil Activo**
1. En Railway → Variables, verifica:
   ```
   SPRING_PROFILES_ACTIVE=railway
   ```

### **Paso 3: Probar Endpoints**
```
https://tu-app.railway.app/api/publico/health
https://tu-app.railway.app/api/publico/health/config
```

## 🚀 **Solución Aplicada**

### **Cambios Realizados:**
1. ✅ **Agregada configuración de BD al archivo base** (`application.properties`)
2. ✅ **Mantenida configuración específica** en `application-railway.properties`
3. ✅ **Verificado perfil activo** en `railway.json`

### **Configuración Actual:**
- **Archivo base:** Configuración de BD con variables de entorno
- **Perfil railway:** Configuración adicional específica
- **Perfil dev-persistent:** Configuración H2 para desarrollo

## 📝 **Próximos Pasos**

1. **Hacer commit y push** de los cambios
2. **Railway hará deploy automáticamente**
3. **Verificar que funcione** con los endpoints de health check
4. **Si no funciona:** Revisar variables de entorno en Railway

## 🎯 **Estado Esperado**

Después del deploy:
- ✅ Aplicación se inicia sin errores
- ✅ Conexión a PostgreSQL exitosa
- ✅ Endpoints de health check funcionan
- ✅ Variables de entorno se leen correctamente
