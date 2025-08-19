# Configuración de Base de Datos en Railway

## Paso 1: Crear Base de Datos PostgreSQL

1. En Railway, ve a tu proyecto
2. Haz clic en "New Service" → "Database" → "PostgreSQL"
3. Dale un nombre como "minegocio-db"
4. Railway te dará automáticamente las credenciales

## Paso 2: Conectar la Base de Datos

1. En tu servicio `minegocio-backend`, ve a "Variables"
2. Railway debería haber agregado automáticamente las variables de conexión
3. Si no, agrega manualmente:

```
SPRING_DATASOURCE_URL=jdbc:postgresql://tu-host:5432/tu-database
SPRING_DATASOURCE_USERNAME=tu-username
SPRING_DATASOURCE_PASSWORD=tu-password
```

## Paso 3: Variables Adicionales Necesarias

```
MINE_NEGOCIO_APP_JWT_SECRET=tu-jwt-secret-super-seguro-y-largo
MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=tu-app-password-de-gmail
MAIL_FROM=tu-email@gmail.com
```

## Paso 4: Verificar Conexión

1. Después de configurar las variables, haz un redeploy
2. Ve a los logs para verificar que la conexión sea exitosa
3. Prueba el health check: `https://tu-app.railway.app/api/publico/health`

## Nota Importante

- Railway asigna automáticamente las variables de base de datos cuando conectas un servicio de base de datos
- Los nombres de las variables deben coincidir exactamente con los que espera Spring Boot
- Asegúrate de que la base de datos esté completamente inicializada antes de hacer deploy
