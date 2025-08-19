# 🔧 Configuración de Variables de Entorno en Railway

## 🚨 **PROBLEMA ACTUAL**
La aplicación no puede conectarse a PostgreSQL porque faltan las variables de entorno.

## 📋 **PASOS PARA CONFIGURAR**

### **Paso 1: Ir a Railway**
1. Ve a [railway.app](https://railway.app)
2. Inicia sesión en tu cuenta
3. Selecciona tu proyecto

### **Paso 2: Ir a Variables**
1. Haz clic en tu servicio `minegocio-backend`
2. Ve a la pestaña **"Variables"**
3. Haz clic en **"New Variable"**

### **Paso 3: Agregar Variables OBLIGATORIAS**

#### **Base de Datos PostgreSQL:**
```
Variable: SPRING_DATASOURCE_URL
Valor: jdbc:postgresql://tu-host:5432/tu-database
```

```
Variable: SPRING_DATASOURCE_USERNAME
Valor: tu-username
```

```
Variable: SPRING_DATASOURCE_PASSWORD
Valor: tu-password
```

#### **JWT Secret:**
```
Variable: MINE_NEGOCIO_APP_JWT_SECRET
Valor: tu-jwt-secret-super-seguro-y-largo
```

### **Paso 4: Agregar Variables OPCIONALES**

#### **Cloudinary (para imágenes):**
```
Variable: CLOUDINARY_CLOUD_NAME
Valor: tu-cloud-name
```

```
Variable: CLOUDINARY_API_KEY
Valor: tu-api-key
```

```
Variable: CLOUDINARY_API_SECRET
Valor: tu-api-secret
```

#### **Email (Gmail):**
```
Variable: MAIL_USERNAME
Valor: tu-email@gmail.com
```

```
Variable: MAIL_PASSWORD
Valor: tu-app-password
```

```
Variable: MAIL_FROM
Valor: tu-email@gmail.com
```

#### **Frontend:**
```
Variable: MINE_NEGOCIO_APP_FRONTEND_URL
Valor: https://tu-app.onrender.com
```

## 🔍 **CÓMO OBTENER LAS CREDENCIALES**

### **Si ya tienes una base de datos en Railway:**
1. Ve a tu proyecto en Railway
2. Busca el servicio de PostgreSQL
3. Haz clic en "Connect"
4. Railway te mostrará las credenciales automáticamente

### **Si necesitas crear una base de datos:**
1. En Railway, haz clic en "New Service"
2. Selecciona "Database" → "PostgreSQL"
3. Dale un nombre como "minegocio-db"
4. Railway te dará las credenciales automáticamente

## ✅ **VERIFICACIÓN**

Después de configurar las variables:

1. **Railway hará redeploy automáticamente**
2. **Prueba los endpoints:**
   ```
   https://tu-app.railway.app/api/publico/health
   https://tu-app.railway.app/api/publico/health/config
   https://tu-app.railway.app/api/publico/health/db
   ```

## 🚨 **VARIABLES CRÍTICAS**

Si alguna de estas variables falta, la aplicación NO funcionará:
- ✅ `SPRING_DATASOURCE_URL`
- ✅ `SPRING_DATASOURCE_USERNAME`
- ✅ `SPRING_DATASOURCE_PASSWORD`
- ✅ `MINE_NEGOCIO_APP_JWT_SECRET`

## 📞 **SI NECESITAS AYUDA**

1. **Revisa los logs** en Railway para ver errores específicos
2. **Verifica que las variables estén escritas correctamente**
3. **Asegúrate de que la base de datos esté activa**
