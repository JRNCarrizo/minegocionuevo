#!/bin/bash

echo "🔍 Verificando configuración de Railway..."

# Verificar variables de entorno críticas
echo "📋 Variables de entorno requeridas:"
echo ""

# Variables críticas para la base de datos
CRITICAL_VARS=(
    "SPRING_DATASOURCE_URL"
    "SPRING_DATASOURCE_USERNAME" 
    "SPRING_DATASOURCE_PASSWORD"
    "MINE_NEGOCIO_APP_JWT_SECRET"
)

for var in "${CRITICAL_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        echo "✅ $var está configurada"
    else
        echo "❌ $var NO está configurada"
    fi
done

echo ""
echo "🔧 Pasos para configurar Railway:"
echo "1. Ve a tu proyecto en Railway"
echo "2. Haz clic en 'New Service' → 'Database' → 'PostgreSQL'"
echo "3. En tu servicio backend, ve a 'Variables'"
echo "4. Agrega las variables faltantes"
echo ""
echo "📝 Variables de ejemplo:"
echo "SPRING_DATASOURCE_URL=jdbc:postgresql://host:5432/database"
echo "SPRING_DATASOURCE_USERNAME=username"
echo "SPRING_DATASOURCE_PASSWORD=password"
echo "MINE_NEGOCIO_APP_JWT_SECRET=tu-jwt-secret-super-seguro"
echo ""
echo "🌐 Después de configurar, prueba:"
echo "https://tu-app.railway.app/api/publico/health"
echo "https://tu-app.railway.app/api/publico/health/db"
