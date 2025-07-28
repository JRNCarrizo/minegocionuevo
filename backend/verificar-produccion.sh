#!/bin/bash

echo "=== Verificación de Variables de Entorno para Producción ==="

# Variables requeridas para PostgreSQL
REQUIRED_VARS=(
    "SPRING_DATASOURCE_URL"
    "SPRING_DATASOURCE_USERNAME"
    "SPRING_DATASOURCE_PASSWORD"
    "MINE_NEGOCIO_APP_JWT_SECRET"
)

# Variables opcionales
OPTIONAL_VARS=(
    "PORT"
    "MINE_NEGOCIO_APP_FRONTEND_URL"
    "MAIL_FROM"
)

echo ""
echo "Variables Requeridas:"
echo "===================="

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ $var - NO CONFIGURADA"
    else
        echo "✅ $var - CONFIGURADA"
    fi
done

echo ""
echo "Variables Opcionales:"
echo "===================="

for var in "${OPTIONAL_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "⚠️  $var - NO CONFIGURADA (usará valor por defecto)"
    else
        echo "✅ $var - CONFIGURADA"
    fi
done

echo ""
echo "Configuración de Base de Datos:"
echo "==============================="

if [ -n "$SPRING_DATASOURCE_URL" ]; then
    echo "URL de Base de Datos: $SPRING_DATASOURCE_URL"
    
    # Verificar si es PostgreSQL
    if [[ "$SPRING_DATASOURCE_URL" == *"postgresql"* ]]; then
        echo "✅ Base de datos PostgreSQL detectada"
    else
        echo "⚠️  No se detectó PostgreSQL en la URL"
    fi
else
    echo "❌ No hay URL de base de datos configurada"
fi

echo ""
echo "Perfil de Spring Boot:"
echo "====================="

if [ -n "$SPRING_PROFILES_ACTIVE" ]; then
    echo "Perfil activo: $SPRING_PROFILES_ACTIVE"
else
    echo "Perfil activo: prod (por defecto)"
fi

echo ""
echo "=== Fin de Verificación ===" 