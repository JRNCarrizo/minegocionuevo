@echo off
echo ========================================
echo APLICANDO MIGRACION DE INVENTARIO COMPLETO
echo ========================================
echo.

echo 1. Deteniendo el backend...
taskkill /f /im java.exe 2>nul

echo 2. Aplicando migracion de base de datos...
cd backend
./mvnw flyway:migrate

echo 3. Iniciando el backend...
start "Backend" cmd /k "./mvnw spring-boot:run"

echo.
echo ========================================
echo MIGRACION COMPLETADA
echo ========================================
echo.
echo El backend se esta iniciando...
echo Espera unos segundos y prueba el inventario completo.
echo.
pause































