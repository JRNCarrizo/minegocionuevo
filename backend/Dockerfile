# Usar OpenJDK 17
FROM openjdk:17-jdk-slim

# Establecer directorio de trabajo
WORKDIR /app

# Forzar rebuild sin cache
ARG BUILD_DATE=unknown
RUN echo "Build date: $BUILD_DATE"

# Copiar archivos de Maven
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Dar permisos de ejecución a mvnw
RUN chmod +x mvnw

# Copiar código fuente
COPY src src

# Construir la aplicación con perfil de producción
RUN ./mvnw clean package -Pprod -DskipTests

# Exponer puerto
EXPOSE 8080

# Comando para ejecutar la aplicación con perfil railway
ENTRYPOINT ["java", "-Dspring.profiles.active=railway", "-jar", "target/backend-0.0.1-SNAPSHOT.jar"] 