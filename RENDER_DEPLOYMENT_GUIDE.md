# 🚀 Guía Completa: Desplegar MiNegocio en Render (SIN Dominio Personalizado)

## 📋 **Prerrequisitos**

- ✅ Cuenta de GitHub con tu proyecto subido
- ✅ Cuenta en Render.com (gratuita)
- ✅ 15-30 minutos de tiempo

## 🎯 **Paso 1: Crear Cuenta en Render**

1. **Ve a [render.com](https://render.com)**
2. **Click en "Get Started"**
3. **Regístrate con tu cuenta de GitHub**
4. **Verifica tu email**

## 🗄️ **Paso 2: Crear Base de Datos PostgreSQL**

1. **En el Dashboard de Render:**
   - Click en "New" → "PostgreSQL"
   - **Name:** `minegocio-db`
   - **Database:** `minegocio`
   - **User:** `minegocio_user`
   - **Plan:** Free
   - Click "Create Database"

2. **Guardar las credenciales:**
   - Anota la **Internal Database URL**
   - Anota el **Username** y **Password**

## ⚙️ **Paso 3: Desplegar el Backend**

1. **En el Dashboard de Render:**
   - Click en "New" → "Web Service"
   - **Connect a repository:** Selecciona tu repositorio de GitHub
   - **Name:** `minegocio-backend`
   - **Environment:** Java
   - **Build Command:** `cd backend && ./mvnw clean package -DskipTests`
   - **Start Command:** `cd backend && java -jar target/miNegocio-Backend-0.0.1-SNAPSHOT.jar`

2. **Variables de Entorno:**
   ```
   SPRING_PROFILES_ACTIVE=render
   SPRING_DATASOURCE_URL=<URL_DE_POSTGRESQL>
   SPRING_DATASOURCE_USERNAME=<USERNAME_DE_POSTGRESQL>
   SPRING_DATASOURCE_PASSWORD=<PASSWORD_DE_POSTGRESQL>
   MINE_NEGOCIO_APP_JWT_SECRET=<GENERAR_SECRET_ALEATORIO>
   MINE_NEGOCIO_APP_FRONTEND_URL=https://minegocio-frontend.onrender.com
   ```

3. **Click "Create Web Service"**

## 🌐 **Paso 4: Desplegar el Frontend**

1. **En el Dashboard de Render:**
   - Click en "New" → "Static Site"
   - **Connect a repository:** Selecciona tu repositorio de GitHub
   - **Name:** `minegocio-frontend`
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Publish Directory:** `frontend/dist`

2. **Variables de Entorno:**
   ```
   VITE_API_URL=https://minegocio-backend.onrender.com/api
   ```

3. **Click "Create Static Site"**

## 🔧 **Paso 5: Configurar Variables de Entorno**

### **Backend Variables:**
```
SPRING_PROFILES_ACTIVE=render
SPRING_DATASOURCE_URL=postgresql://user:pass@host:port/database
SPRING_DATASOURCE_USERNAME=user
SPRING_DATASOURCE_PASSWORD=pass
MINE_NEGOCIO_APP_JWT_SECRET=tu-secret-super-seguro-aqui-123456789
MINE_NEGOCIO_APP_FRONTEND_URL=https://minegocio-frontend.onrender.com
```

### **Frontend Variables:**
```
VITE_API_URL=https://minegocio-backend.onrender.com/api
```

## 🧪 **Paso 6: Probar el Despliegue**

### **1. Verificar Backend:**
```bash
# Test ping
curl https://minegocio-backend.onrender.com/api/debug/ping

# Debería responder:
{
  "mensaje": "Servidor funcionando correctamente",
  "timestamp": 1234567890
}
```

### **2. Verificar Frontend:**
- Ve a: `https://minegocio-frontend.onrender.com`
- Debería cargar la página principal

### **3. Verificar Base de Datos:**
```bash
# Test de conexión
curl https://minegocio-backend.onrender.com/api/debug/info
```

## 🎯 **Paso 7: Probar Sistema Multi-Tenant**

### **1. Crear Empresa de Prueba:**
```bash
# POST a tu backend
curl -X POST https://minegocio-backend.onrender.com/api/empresas/registro \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Mi Tienda de Prueba",
    "subdominio": "mitienda",
    "email": "test@test.com",
    "telefono": "123456789",
    "nombreAdministrador": "Admin",
    "apellidosAdministrador": "Test",
    "emailAdministrador": "admin@test.com",
    "passwordAdministrador": "admin123",
    "telefonoAdministrador": "123456789"
  }'
```

### **2. Verificar Empresa:**
```bash
# GET empresa por subdominio
curl https://minegocio-backend.onrender.com/api/publico/mitienda/empresa
```

### **3. Verificar Productos:**
```bash
# GET productos de la empresa
curl https://minegocio-backend.onrender.com/api/publico/mitienda/productos
```

## 🔐 **Paso 8: Configurar Super Admin**

### **1. Acceder al endpoint de setup:**
```
https://minegocio-backend.onrender.com/api/debug/setup-super-admin
```

### **2. Credenciales del Super Admin:**
```
Email: jrncarrizo@gmail.com
Password: 32691240Jor
```

## 📱 **Paso 9: URLs Finales**

### **Tu aplicación estará disponible en:**
- **Frontend:** `https://minegocio-frontend.onrender.com`
- **Backend:** `https://minegocio-backend.onrender.com`
- **Base de datos:** PostgreSQL en Render

### **Para probar subdominios:**
- **API:** `https://minegocio-backend.onrender.com/api/publico/mitienda/empresa`
- **Frontend:** Acceder desde el panel de administración

## 🎨 **Paso 10: Personalización**

### **1. Login como Super Admin:**
- Ve a: `https://minegocio-frontend.onrender.com/admin/login`
- Email: `jrncarrizo@gmail.com`
- Password: `32691240Jor`

### **2. Crear Empresas:**
- Desde el dashboard del super admin
- Cada empresa tendrá su subdominio
- Personalizar colores y logo

### **3. Probar Multi-Tenant:**
- Crear empresas con diferentes subdominios
- Verificar que los datos están aislados
- Probar personalización por empresa

## 🐛 **Solución de Problemas Comunes**

### **Error: "Application failed to start"**
- Verificar variables de entorno
- Revisar logs en Render dashboard
- Comprobar conexión a base de datos

### **Error: "Database connection failed"**
- Verificar credenciales de PostgreSQL
- Comprobar que la base de datos esté activa
- Revisar configuración de red

### **Error: "CORS policy"**
- Verificar configuración de CORS en backend
- Comprobar URLs en variables de entorno

### **Error: "Build failed"**
- Verificar que el repositorio esté actualizado
- Revisar logs de build en Render
- Comprobar dependencias en pom.xml y package.json

## 📊 **Monitoreo**

### **En Render Dashboard:**
- **Logs en tiempo real** para backend y frontend
- **Métricas de uso** de base de datos
- **Estado de servicios** (up/down)

### **Endpoints de monitoreo:**
```bash
# Health check
curl https://minegocio-backend.onrender.com/api/debug/ping

# Info del sistema
curl https://minegocio-backend.onrender.com/api/debug/info

# Estado de autenticación
curl https://minegocio-backend.onrender.com/api/debug/auth-status
```

## 🎯 **Resultado Final**

### **Tendrás:**
- ✅ **Backend funcionando** en Render
- ✅ **Frontend funcionando** en Render
- ✅ **Base de datos PostgreSQL** en Render
- ✅ **Sistema multi-tenant** completamente funcional
- ✅ **SSL/HTTPS automático**
- ✅ **Todo completamente gratuito**

### **URLs de tu aplicación:**
- **Aplicación principal:** `https://minegocio-frontend.onrender.com`
- **API backend:** `https://minegocio-backend.onrender.com/api`
- **Super Admin:** `https://minegocio-frontend.onrender.com/admin/login`

## 🚀 **¡Listo!**

Tu aplicación MiNegocio estará completamente desplegada y funcional en Render sin necesidad de dominio personalizado. El sistema multi-tenant funcionará perfectamente para pruebas y uso personal.

**¿Necesitas ayuda con algún paso específico?** 