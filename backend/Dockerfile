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

# Construir la aplicación con optimizaciones para Railway
RUN chmod +x railway-build-optimized.sh && ./railway-build-optimized.sh

# Crear directorio para uploads
RUN mkdir -p /tmp/uploads/images /tmp/uploads/logos

# Exponer puerto
EXPOSE 8080

# Variables de entorno para Railway
ENV SPRING_PROFILES_ACTIVE=railway
ENV PORT=8080

# Comando para ejecutar la aplicación con optimizaciones
ENTRYPOINT ["java", "-Xmx512m", "-Xms256m", "-Dspring.profiles.active=railway", "-jar", "target/backend-0.0.1-SNAPSHOT.jar"] 