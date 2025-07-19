# 🚀 Guía de Despliegue - MiNegocio

## 📋 Opciones Gratuitas de Despliegue

### 🎯 **1. Render.com (RECOMENDADO)**

#### Ventajas:
- ✅ **Completamente gratuito** para proyectos personales
- ✅ Base de datos PostgreSQL incluida
- ✅ SSL/HTTPS automático
- ✅ Despliegue automático desde GitHub
- ✅ Muy fácil de configurar

#### Pasos:

1. **Crear cuenta en Render.com**
   - Ve a [render.com](https://render.com)
   - Regístrate con tu cuenta de GitHub

2. **Crear Base de Datos PostgreSQL**
   - Dashboard → "New" → "PostgreSQL"
   - Nombre: `minegocio-db`
   - Plan: Free
   - Crear

3. **Desplegar Backend**
   - Dashboard → "New" → "Web Service"
   - Conectar repositorio GitHub
   - Configuración:
     ```
     Name: minegocio-backend
     Environment: Java
     Build Command: cd backend && ./mvnw clean package -DskipTests
     Start Command: cd backend && java -jar target/miNegocio-Backend-0.0.1-SNAPSHOT.jar
     ```

4. **Variables de Entorno Backend:**
   ```
   SPRING_PROFILES_ACTIVE=prod
   SPRING_DATASOURCE_URL=<URL_DE_POSTGRESQL>
   SPRING_DATASOURCE_USERNAME=<USERNAME_DE_POSTGRESQL>
   SPRING_DATASOURCE_PASSWORD=<PASSWORD_DE_POSTGRESQL>
   MINE_NEGOCIO_APP_JWT_SECRET=<GENERAR_SECRET_ALEATORIO>
   MINE_NEGOCIO_APP_FRONTEND_URL=https://minegocio-frontend.onrender.com
   ```

5. **Desplegar Frontend**
   - Dashboard → "New" → "Static Site"
   - Conectar repositorio GitHub
   - Configuración:
     ```
     Name: minegocio-frontend
     Build Command: cd frontend && npm install && npm run build
     Publish Directory: frontend/dist
     ```

6. **Variables de Entorno Frontend:**
   ```
   VITE_API_URL=https://minegocio-backend.onrender.com/api
   ```

### 🌐 **2. Railway.app**

#### Ventajas:
- ✅ **500 horas gratuitas** por mes
- ✅ Despliegue muy sencillo
- ✅ Base de datos PostgreSQL incluida

#### Pasos:

1. **Crear cuenta en Railway**
   - Ve a [railway.app](https://railway.app)
   - Conecta tu cuenta de GitHub

2. **Crear proyecto**
   - "New Project" → "Deploy from GitHub repo"
   - Selecciona tu repositorio

3. **Configurar servicios**
   - Railway detectará automáticamente los servicios
   - Configurar variables de entorno como en Render

### ☁️ **3. Heroku**

#### Ventajas:
- ✅ **550 horas gratuitas** por mes
- ✅ Muy estable
- ⚠️ **Limitación:** Se duerme después de 30 minutos

#### Pasos:

1. **Instalar Heroku CLI**
   ```bash
   # Windows
   winget install --id=Heroku.HerokuCLI
   
   # macOS
   brew tap heroku/brew && brew install heroku
   ```

2. **Login y crear app**
   ```bash
   heroku login
   heroku create minegocio-app
   ```

3. **Configurar base de datos**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

4. **Desplegar**
   ```bash
   git push heroku main
   ```

### 🐳 **4. Fly.io**

#### Ventajas:
- ✅ **3 máquinas virtuales gratuitas**
- ✅ Muy rápido y global
- ✅ No se duerme

#### Pasos:

1. **Instalar Fly CLI**
   ```bash
   # Windows
   winget install --id=Fly.Flyctl
   
   # macOS
   brew install flyctl
   ```

2. **Login y crear app**
   ```bash
   fly auth login
   fly launch
   ```

3. **Configurar base de datos**
   ```bash
   fly postgres create
   fly postgres attach <database-name>
   ```

## 🔧 **Configuración de Base de Datos**

### PostgreSQL en Producción

1. **Crear tablas iniciales:**
   ```sql
   -- Ejecutar los scripts de migración
   -- migration.sql, migration_planes_suscripciones.sql, etc.
   ```

2. **Insertar datos iniciales:**
   ```sql
   -- Ejecutar data.sql para datos de prueba
   ```

## 📧 **Configuración de Email**

### Opción 1: Gmail (Gratuito)
```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=tu-email@gmail.com
spring.mail.password=tu-app-password
```

### Opción 2: SendGrid (Gratuito - 100 emails/día)
```properties
spring.mail.host=smtp.sendgrid.net
spring.mail.port=587
spring.mail.username=apikey
spring.mail.password=tu-sendgrid-api-key
```

## 🔐 **Configuración de Seguridad**

### Variables de Entorno Importantes:
```bash
# JWT Secret (generar uno aleatorio)
MINE_NEGOCIO_APP_JWT_SECRET=tu-secret-super-seguro-aqui

# URLs de la aplicación
MINE_NEGOCIO_APP_FRONTEND_URL=https://tu-frontend.com

# Configuración de CORS
CORS_ALLOWED_ORIGINS=https://tu-frontend.com
```

## 🚀 **Comandos Útiles**

### Verificar despliegue:
```bash
# Backend
curl https://tu-backend.com/api/debug/ping

# Frontend
curl https://tu-frontend.com
```

### Ver logs:
```bash
# Render
# Ir al dashboard y ver logs en tiempo real

# Heroku
heroku logs --tail

# Railway
railway logs

# Fly
fly logs
```

## 🐛 **Solución de Problemas Comunes**

### Error: "Application failed to start"
- Verificar variables de entorno
- Revisar logs de la aplicación
- Comprobar conexión a base de datos

### Error: "Database connection failed"
- Verificar credenciales de PostgreSQL
- Comprobar que la base de datos esté activa
- Revisar configuración de red

### Error: "CORS policy"
- Configurar correctamente las URLs permitidas
- Verificar configuración de CORS en el backend

## 📊 **Monitoreo y Mantenimiento**

### Métricas a monitorear:
- Uptime de la aplicación
- Tiempo de respuesta de la API
- Uso de base de datos
- Errores en logs

### Herramientas gratuitas:
- **UptimeRobot**: Monitoreo de disponibilidad
- **LogRocket**: Análisis de errores frontend
- **Sentry**: Monitoreo de errores backend

## 💡 **Consejos para Producción**

1. **Siempre usar HTTPS** en producción
2. **Configurar backups** de la base de datos
3. **Monitorear logs** regularmente
4. **Usar variables de entorno** para configuraciones sensibles
5. **Configurar alertas** para errores críticos
6. **Optimizar imágenes** antes de subirlas
7. **Implementar rate limiting** para prevenir abuso

## 🎯 **Recomendación Final**

**Para uso personal y de prueba, recomiendo Render.com** porque:
- Es completamente gratuito
- Muy fácil de configurar
- Incluye base de datos PostgreSQL
- No tiene limitaciones de tiempo de ejecución
- Soporte excelente para Java Spring Boot
- Despliegue automático desde GitHub 