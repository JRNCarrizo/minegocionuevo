#!/bin/bash

echo "=== Configuración Automática para Producción ==="

# Función para verificar si una variable está definida
check_var() {
    local var_name=$1
    local default_value=$2
    
    if [ -z "${!var_name}" ]; then
        echo "⚠️  $var_name no está configurada"
        if [ -n "$default_value" ]; then
            echo "   Usando valor por defecto: $default_value"
            export $var_name="$default_value"
        fi
    else
        echo "✅ $var_name está configurada"
    fi
}

echo ""
echo "Verificando variables de entorno..."
echo "=================================="

# Verificar variables requeridas
check_var "SPRING_DATASOURCE_URL" "jdbc:postgresql://localhost:5432/minegocio"
check_var "SPRING_DATASOURCE_USERNAME" "postgres"
check_var "SPRING_DATASOURCE_PASSWORD" "password"
check_var "MINE_NEGOCIO_APP_JWT_SECRET" "Negocio360SecretKeyParaJWT2024DeProduccionSuperSeguroConAlMenos64CaracteresParaHS512"

# Verificar variables opcionales
check_var "PORT" "8080"
check_var "MINE_NEGOCIO_APP_FRONTEND_URL" "https://negocio360.org"
check_var "MAIL_FROM" "noreply@negocio360.com"

echo ""
echo "Configuración de perfil de Spring Boot..."
echo "========================================"

# Determinar qué perfil usar
if [ -n "$SPRING_DATASOURCE_URL" ] && [[ "$SPRING_DATASOURCE_URL" != "jdbc:postgresql://localhost:5432/minegocio" ]]; then
    echo "✅ Variables de entorno detectadas - usando perfil 'prod'"
    export SPRING_PROFILES_ACTIVE="prod"
else
    echo "⚠️  Variables de entorno no configuradas - usando perfil 'simple'"
    export SPRING_PROFILES_ACTIVE="simple"
fi

echo ""
echo "Resumen de configuración:"
echo "========================"
echo "Perfil activo: $SPRING_PROFILES_ACTIVE"
echo "URL de base de datos: $SPRING_DATASOURCE_URL"
echo "Puerto: $PORT"
echo "Frontend URL: $MINE_NEGOCIO_APP_FRONTEND_URL"

echo ""
echo "Para ejecutar la aplicación:"
echo "==========================="
echo "java -jar target/backend-0.0.1-SNAPSHOT.jar"
echo ""
echo "O con variables de entorno explícitas:"
echo "SPRING_PROFILES_ACTIVE=$SPRING_PROFILES_ACTIVE java -jar target/backend-0.0.1-SNAPSHOT.jar"

echo ""
echo "=== Fin de Configuración ===" 