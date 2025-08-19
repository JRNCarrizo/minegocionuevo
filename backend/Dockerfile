# Usar imagen base de Java optimizada para Railway
FROM eclipse-temurin:17-jdk-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache curl

# Copiar archivos de Maven
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Dar permisos de ejecución a mvnw
RUN chmod +x mvnw

# Copiar código fuente y scripts
COPY src src
COPY railway-build-optimized.sh .

# Construir la aplicación
RUN ./mvnw clean package -DskipTests

# Crear directorio para uploads
RUN mkdir -p /tmp/uploads/images /tmp/uploads/logos

# Exponer puerto
EXPOSE 8080

# Variables de entorno para Railway
ENV SPRING_PROFILES_ACTIVE=railway
ENV PORT=8080

# Comando para ejecutar la aplicación
ENTRYPOINT ["java", "-Dspring.profiles.active=railway", "-jar", "target/backend-0.0.1-SNAPSHOT.jar"] 