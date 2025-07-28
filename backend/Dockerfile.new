# Usar imagen base de Java
FROM openjdk:17-jdk-slim

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de Maven
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Dar permisos de ejecución a mvnw
RUN chmod +x mvnw

# Limpiar cache de Maven y forzar descarga de dependencias
RUN ./mvnw dependency:purge-local-repository
RUN ./mvnw clean

# Copiar código fuente
COPY src src

# Construir la aplicación con dependencias explícitas
RUN ./mvnw clean package -DskipTests -U

# Exponer puerto
EXPOSE 8080

# Comando para ejecutar la aplicación
ENTRYPOINT ["java", "-Dspring.profiles.active=railway", "-jar", "target/backend-0.0.1-SNAPSHOT.jar"] 