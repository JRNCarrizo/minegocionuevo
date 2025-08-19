# 🚀 Variables de Entorno para Railway

## 📋 Variables OBLIGATORIAS

### 🔐 Base de Datos PostgreSQL
```
SPRING_DATASOURCE_URL=jdbc:postgresql://tu-host:5432/tu-database
SPRING_DATASOURCE_USERNAME=tu-username
SPRING_DATASOURCE_PASSWORD=tu-password
```

### 🔑 Seguridad JWT
```
MINE_NEGOCIO_APP_JWT_SECRET=tu-jwt-secret-super-seguro-y-largo
```

## 📧 Variables de Email (Gmail)

### Opción 1: Usar App Password (Recomendado)
```
MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=tu-app-password-de-gmail
MAIL_FROM=tu-email@gmail.com
```

### Opción 2: Usar Contraseña Normal (Menos seguro)
```
MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=tu-contraseña-normal
MAIL_FROM=tu-email@gmail.com
```

## ☁️ Variables de Cloudinary

```
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
```

## 🌐 Variables de Frontend

```
MINE_NEGOCIO_APP_FRONTEND_URL=https://tu-app.onrender.com
```

## 🔧 Variables Automáticas de Railway

Estas las configura Railway automáticamente:
```
PORT=8080
SPRING_PROFILES_ACTIVE=railway
```

## 📝 Cómo Configurar en Railway

1. Ve a tu proyecto en Railway
2. Haz clic en tu servicio `minegocio-backend`
3. Ve a la pestaña **"Variables"**
4. Agrega cada variable con su valor correspondiente

## ✅ Verificación

Después de configurar todas las variables:

1. **Health Check General:**
   ```
   https://tu-app.railway.app/api/publico/health
   ```

2. **Health Check Base de Datos:**
   ```
   https://tu-app.railway.app/api/publico/health/db
   ```

## 🚨 Variables Críticas

Si alguna de estas variables falta, la aplicación NO funcionará:
- ✅ `SPRING_DATASOURCE_URL`
- ✅ `SPRING_DATASOURCE_USERNAME`
- ✅ `SPRING_DATASOURCE_PASSWORD`
- ✅ `MINE_NEGOCIO_APP_JWT_SECRET`

## 🔍 Variables Opcionales

Estas tienen valores por defecto, pero puedes personalizarlas:
- `MINE_NEGOCIO_APP_FRONTEND_URL` (default: https://negocio360.org)
- `MAIL_FROM` (default: usa MAIL_USERNAME)
