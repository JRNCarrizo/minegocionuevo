FROM openjdk:17-jdk-slim

WORKDIR /app

# Copiar el archivo JAR
COPY target/miNegocio-Backend-0.0.1-SNAPSHOT.jar app.jar

# Exponer puerto
EXPOSE 8080

# Comando para ejecutar la aplicación
ENTRYPOINT ["java", "-jar", "app.jar"] 