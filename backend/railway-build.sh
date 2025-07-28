#!/bin/bash

# Script de build para Railway - Usar perfil de producción
echo "🚀 Iniciando build para Railway con perfil de producción..."

# Limpiar y construir con perfil prod (solo PostgreSQL, sin H2)
./mvnw clean package -Pprod -DskipTests

echo "✅ Build completado con perfil de producción"
echo "📦 JAR generado en target/backend-0.0.1-SNAPSHOT.jar" 