# Solución para Error de Producción - entityManagerFactory

## Problema
```
Caused by: org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'usuarioRepository' defined in com.minegocio.backend.repositorios.UsuarioRepository defined in @EnableJpaRepositories declared on JpaRepositoriesRegistrar.EnableJpaRepositoriesConfiguration: Cannot resolve reference to bean 'jpaSharedEM_entityManagerFactory' while setting bean property 'entityManager'
```

## Problema Adicional - Driver PostgreSQL
```
Caused by: java.lang.IllegalStateException: Cannot load driver class: org.postgresql.Driver
```

## Problema Adicional - HikariConnectionProvider
```
Caused by: java.lang.ClassNotFoundException: org.hibernate.hikaricp.internal.HikariConnectionProvider
```

## Solución Implementada (Simplificada)

### 1. Eliminación de Configuraciones Personalizadas
Se han eliminado las configuraciones personalizadas que causaban conflictos:
- Eliminado `JpaConfig.java` (configuración personalizada de JPA)
- Eliminado `DataSourceConfig.java` (configuración personalizada de DataSource)
- Se confía en la auto-configuración de Spring Boot

### 2. Dependencia PostgreSQL Corregida
En `pom.xml`:
- Se agregó `<scope>runtime</scope>` a la dependencia de PostgreSQL
- Se asegura que el driver esté disponible en tiempo de ejecución

### 3. Configuración de Producción Simplificada
Se ha creado `application-prod.properties` con:
- Configuración específica para PostgreSQL
- Configuración básica de HikariCP
- Deshabilitación de características problemáticas
- Uso de `spring.datasource.driver-class-name` en lugar de `driverClassName`

### 4. Variables de Entorno Requeridas

Asegúrate de tener configuradas estas variables de entorno:

```bash
# Base de datos PostgreSQL (OBLIGATORIAS)
SPRING_DATASOURCE_URL=jdbc:postgresql://host:port/database
SPRING_DATASOURCE_USERNAME=tu_usuario
SPRING_DATASOURCE_PASSWORD=tu_password

# JWT (OBLIGATORIA)
MINE_NEGOCIO_APP_JWT_SECRET=tu_secret_super_seguro_de_al_menos_64_caracteres

# Opcionales
PORT=8080
MINE_NEGOCIO_APP_FRONTEND_URL=https://tu-dominio.com
MAIL_FROM=noreply@tu-dominio.com
```

### 5. Perfil de Spring Boot
El perfil por defecto está configurado como `prod`. Si necesitas usar un perfil específico, configura:

```bash
SPRING_PROFILES_ACTIVE=prod
```

## Pasos para Desplegar

### 1. Verificar Variables de Entorno
Ejecuta el script de verificación (en Linux/Mac):
```bash
./verificar-produccion.sh
```

O verifica manualmente que todas las variables requeridas estén configuradas.

### 2. Compilar la Aplicación
```bash
cd backend
./mvnw clean package -DskipTests
```

### 3. Verificar que el JAR incluya PostgreSQL
```bash
# Verificar que el driver esté en el JAR
jar -tf target/backend-0.0.1-SNAPSHOT.jar | grep postgresql
```

### 4. Ejecutar en Producción
```bash
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

O si usas Docker:
```bash
docker build -t minegocio-backend .
docker run -p 8080:8080 --env-file .env minegocio-backend
```

## Configuraciones Específicas por Plataforma

### Railway
- Usa el perfil `railway` automáticamente
- Las variables de entorno se configuran desde el dashboard de Railway

### Render
- Usa el perfil `prod` por defecto
- Configura las variables de entorno en el dashboard de Render

### Heroku
- Usa el perfil `prod` por defecto
- Configura las variables de entorno con `heroku config:set`

## Troubleshooting

### Si el error persiste:

1. **Verifica que PostgreSQL esté en el classpath**:
   ```bash
   # Verificar dependencias
   ./mvnw dependency:tree | grep postgresql
   ```

2. **Verifica el JAR generado**:
   ```bash
   # Verificar contenido del JAR
   jar -tf target/backend-0.0.1-SNAPSHOT.jar | grep postgresql
   ```

3. **Verifica la configuración del driver**:
   ```bash
   # Asegúrate de que use driver-class-name, no driverClassName
   grep -r "driver-class-name" src/main/resources/
   ```

4. **Verifica la conexión a la base de datos**:
   ```bash
   # Prueba la conexión manualmente
   psql $SPRING_DATASOURCE_URL
   ```

5. **Verifica que no haya configuraciones personalizadas**:
   ```bash
   # Asegúrate de que no existan archivos de configuración personalizada
   find src/main/java -name "*Config.java" -type f
   ```

### Logs Útiles para Debugging

Agrega estas configuraciones temporalmente para debugging:

```properties
# En application-prod.properties (temporalmente)
logging.level.org.springframework.orm.jpa=DEBUG
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE
logging.level.com.zaxxer.hikari=DEBUG
logging.level.org.springframework.boot.autoconfigure=DEBUG
```

## Cambios Específicos Realizados

### pom.xml
- Agregado `<scope>runtime</scope>` a la dependencia de PostgreSQL
- Asegurado que el driver esté disponible en tiempo de ejecución

### application-prod.properties
- Cambiado `driverClassName` por `driver-class-name`
- Configuración explícita del driver de PostgreSQL
- Configuración básica de HikariCP sin personalizaciones complejas

### Eliminados
- `JpaConfig.java` - Configuración personalizada de JPA
- `DataSourceConfig.java` - Configuración personalizada de DataSource

### Enfoque Simplificado
- Se confía en la auto-configuración de Spring Boot
- Se evitan configuraciones personalizadas que pueden causar conflictos
- Se mantiene solo la configuración esencial en los archivos properties

## Ventajas de la Solución Simplificada

1. **Menos código personalizado** = Menos puntos de falla
2. **Auto-configuración de Spring Boot** = Configuración probada y estable
3. **Mantenimiento más fácil** = Menos archivos de configuración
4. **Compatibilidad garantizada** = Spring Boot maneja las versiones automáticamente

## Contacto

Si el problema persiste después de seguir estos pasos, verifica:
1. Que todas las variables de entorno estén configuradas correctamente
2. Que la base de datos PostgreSQL esté accesible
3. Que las credenciales de la base de datos sean correctas
4. Que el puerto 8080 esté disponible
5. Que el driver de PostgreSQL esté incluido en el JAR final
6. Que no haya configuraciones personalizadas que interfieran 