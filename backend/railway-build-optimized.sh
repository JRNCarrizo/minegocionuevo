#!/bin/bash

# Script de build optimizado para Railway
echo "🚀 Iniciando build optimizado para Railway..."

# Limpiar directorio target
rm -rf target/

# Construir con optimizaciones para Railway
./mvnw clean package \
  -DskipTests \
  -Dmaven.test.skip=true \
  -Dspring.profiles.active=railway \
  -Dmaven.compiler.source=17 \
  -Dmaven.compiler.target=17 \
  -Dmaven.compiler.release=17

# Verificar que el JAR se generó correctamente
if [ -f "target/backend-0.0.1-SNAPSHOT.jar" ]; then
    echo "✅ Build completado exitosamente"
    echo "📦 JAR generado: target/backend-0.0.1-SNAPSHOT.jar"
    echo "📏 Tamaño del JAR: $(du -h target/backend-0.0.1-SNAPSHOT.jar | cut -f1)"
else
    echo "❌ Error: No se generó el JAR"
    exit 1
fi

# Crear directorios necesarios
mkdir -p /tmp/uploads/images
mkdir -p /tmp/uploads/logos

echo "🎯 Railway build listo para despliegue"
