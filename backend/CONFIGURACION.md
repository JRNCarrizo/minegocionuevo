# Guía de Configuración - Negocio360 Backend

## 📁 Archivos de Configuración

### ✅ Archivos que SÍ usamos:

1. **`application.properties`** - Configuración base (común para todos los perfiles)
2. **`application-h2.properties`** - Para desarrollo local con H2
3. **`application-railway.properties`** - Para producción en Railway

### 🗑️ Archivos eliminados (no necesarios):
- `application-simple.properties`
- `application-prod.properties`
- `application-dev-*.properties`
- `application-render-*.properties`
- `application-fly-*.properties`

## 🚀 Cómo Usar

### Desarrollo Local (H2)
```bash
# Usar perfil de desarrollo (incluye H2)
./mvnw spring-boot:run -Pdev

# O por defecto (ya incluye H2)
./mvnw spring-boot:run
```

### Producción en Railway
```bash
# Railway automáticamente usa el perfil 'railway'
# Solo asegúrate de tener las variables de entorno configuradas:
# - SPRING_DATASOURCE_URL
# - SPRING_DATASOURCE_USERNAME
# - SPRING_DATASOURCE_PASSWORD
# - MINE_NEGOCIO_APP_JWT_SECRET
```

## 🔧 Variables de Entorno para Railway

Configura estas variables en tu dashboard de Railway:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://tu-host:puerto/tu-database
SPRING_DATASOURCE_USERNAME=tu_usuario
SPRING_DATASOURCE_PASSWORD=tu_password
MINE_NEGOCIO_APP_JWT_SECRET=tu_secret_super_seguro_de_al_menos_64_caracteres
PORT=8080
MINE_NEGOCIO_APP_FRONTEND_URL=https://tu-frontend-en-render.com
```

## 📊 Diferencias entre Perfiles

| Característica | H2 (Desarrollo) | Railway (Producción) |
|----------------|------------------|---------------------|
| Base de datos | H2 en memoria | PostgreSQL |
| DDL | create-drop | update |
| Logs SQL | DEBUG | DEBUG |
| Consola H2 | Habilitada | Deshabilitada |
| Puerto | 8080 | ${PORT} |
| Archivos | ./uploads/ | /tmp/uploads/ |
| Frontend URL | localhost:5173 | Variable de entorno |
| Driver | H2 | PostgreSQL |

## 🛠️ Comandos Útiles

### Desarrollo
```bash
# Iniciar con H2 (perfil dev)
./mvnw spring-boot:run -Pdev

# Acceder a consola H2
# http://localhost:8080/h2-console
# JDBC URL: jdbc:h2:mem:testdb
# Usuario: sa
# Password: password
```

### Producción
```bash
# Compilar para producción (sin H2)
./mvnw clean package -Pprod -DskipTests

# Ejecutar JAR
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

## 🔍 Troubleshooting

### Si la aplicación no inicia:
1. **Verifica que H2 esté en el classpath** (para desarrollo) - usa `-Pdev`
2. **Verifica que PostgreSQL esté en el classpath** (para producción) - usa `-Pprod`
3. **Verifica las variables de entorno** (para Railway)

### Si hay problemas de conexión:
1. **Desarrollo**: Verifica que el puerto 8080 esté libre
2. **Producción**: Verifica las credenciales de PostgreSQL en Railway

### Error de Driver Conflict:
Si ves el error "Driver org.h2.Driver claims to not accept jdbcUrl, jdbc:postgresql://...":
1. **Desarrollo**: Usa `./mvnw spring-boot:run -Pdev`
2. **Producción**: Usa `./mvnw clean package -Pprod`

## 📝 Notas

- **Desarrollo**: Usa H2 en memoria, se reinicia cada vez
- **Producción**: Usa PostgreSQL persistente en Railway
- **Frontend**: Se despliega en Render, se conecta al backend en Railway
- **Base de datos**: Se crea automáticamente en Railway
- **Perfiles Maven**: Evitan conflictos entre drivers de base de datos 