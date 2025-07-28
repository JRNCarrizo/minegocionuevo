#!/bin/bash

# Script para verificar el estado de la aplicación en producción
# Uso: ./verificar-produccion.sh [URL_BASE]

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URL base por defecto (Railway)
DEFAULT_URL="https://minegocio-backend-production.up.railway.app"
URL_BASE=${1:-$DEFAULT_URL}

echo -e "${BLUE}🔍 Verificando estado de la aplicación en producción${NC}"
echo -e "${BLUE}URL Base: ${URL_BASE}${NC}"
echo ""

# Función para hacer requests HTTP
make_request() {
    local endpoint=$1
    local method=${2:-GET}
    local data=${3:-""}
    
    local url="${URL_BASE}${endpoint}"
    echo -e "${YELLOW}📡 Probando: ${method} ${url}${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "${url}")
    else
        response=$(curl -s -w "\n%{http_code}" -X "${method}" -H "Content-Type: application/json" -d "${data}" "${url}")
    fi
    
    # Separar respuesta y código HTTP
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✅ Éxito (${http_code})${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ Error (${http_code})${NC}"
        echo "$body"
    fi
    echo ""
}

# 1. Verificar si la aplicación responde
echo -e "${BLUE}1️⃣ Verificando conectividad básica...${NC}"
make_request "/api/admin/health"

# 2. Verificar endpoint de empresa (sin token)
echo -e "${BLUE}2️⃣ Verificando endpoint de empresa (sin autenticación)...${NC}"
make_request "/api/admin/empresa"

# 3. Verificar endpoint de estadísticas (sin token)
echo -e "${BLUE}3️⃣ Verificando endpoint de estadísticas (sin autenticación)...${NC}"
make_request "/api/admin/estadisticas-ventas"

# 4. Verificar logs de Railway (si es posible)
echo -e "${BLUE}4️⃣ Información adicional:${NC}"
echo -e "${YELLOW}📋 Para ver logs en Railway:${NC}"
echo "   - Ve a tu dashboard de Railway"
echo "   - Selecciona tu servicio backend"
echo "   - Ve a la pestaña 'Logs'"
echo ""
echo -e "${YELLOW}🔧 Variables de entorno requeridas:${NC}"
echo "   - SPRING_DATASOURCE_URL"
echo "   - SPRING_DATASOURCE_USERNAME" 
echo "   - SPRING_DATASOURCE_PASSWORD"
echo "   - MINE_NEGOCIO_APP_JWT_SECRET"
echo "   - PORT (opcional, por defecto 8080)"
echo ""
echo -e "${YELLOW}🌐 Para probar con autenticación:${NC}"
echo "   - Usa un token JWT válido en el header Authorization"
echo "   - Ejemplo: curl -H 'Authorization: Bearer TU_TOKEN' ${URL_BASE}/api/admin/empresa"
echo ""
echo -e "${GREEN}✅ Verificación completada${NC}" 