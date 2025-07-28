# Usar OpenJDK 17
FROM openjdk:17-jdk-slim

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de Maven
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Dar permisos de ejecución a mvnw
RUN chmod +x mvnw

# Copiar código fuente
COPY src src

# Construir con perfil de producción (solo PostgreSQL, sin H2) - FORZAR DEPLOY
RUN ./mvnw clean package -Pprod -DskipTests

# Exponer puerto
EXPOSE 8080

# Comando para ejecutar la aplicación con perfil railway
ENTRYPOINT ["java", "-Dspring.profiles.active=railway", "-jar", "target/backend-0.0.1-SNAPSHOT.jar"] 