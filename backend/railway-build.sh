#!/bin/bash

# Script de build para Railway (Producción)
# Este script asegura que se use PostgreSQL y no H2

echo "🚀 Iniciando build para Railway (Producción)..."

# Limpiar y compilar con perfil de producción
echo "📦 Compilando con perfil de producción (PostgreSQL)..."
./mvnw clean package -Pprod -DskipTests

if [ $? -eq 0 ]; then
    echo "✅ Build completado exitosamente"
    echo "📁 JAR generado en: target/backend-0.0.1-SNAPSHOT.jar"
    
    # Verificar que el JAR existe
    if [ -f "target/backend-0.0.1-SNAPSHOT.jar" ]; then
        echo "✅ JAR encontrado y listo para deploy"
        
        # Mostrar información del JAR
        echo "📊 Información del JAR:"
        ls -lh target/backend-0.0.1-SNAPSHOT.jar
        
        # Verificar dependencias incluidas
        echo "🔍 Verificando dependencias..."
        jar -tf target/backend-0.0.1-SNAPSHOT.jar | grep -E "(h2|postgresql)" | head -10
        
    else
        echo "❌ Error: JAR no encontrado"
        exit 1
    fi
else
    echo "❌ Error en el build"
    exit 1
fi

echo "🎉 Build listo para Railway!" 