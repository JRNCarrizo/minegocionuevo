#!/bin/bash

echo "========================================"
echo "   INICIANDO MINE NEGOCIO - DESARROLLO"
echo "========================================"
echo ""
echo "Configuracion:"
echo "- Base de datos: H2 (en memoria)"
echo "- Email: Gmail (jrncarrizo@gmail.com)"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:8080"
echo "- Consola H2: http://localhost:8080/h2-console"
echo ""
echo "IMPORTANTE: Asegurate de haber configurado la contraseña de aplicacion de Gmail"
echo "en el archivo: backend/src/main/resources/application-dev.properties"
echo ""
read -p "Presiona Enter para continuar..."

echo ""
echo "Iniciando backend..."
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev 