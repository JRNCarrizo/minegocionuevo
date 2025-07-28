@echo off
echo ========================================
echo   CAMBIANDO A MODO PRODUCCIÓN
echo ========================================

echo.
echo 1. Deteniendo aplicación si está corriendo...
taskkill /f /im java.exe 2>nul

echo.
echo 2. Limpiando archivos temporales...
if exist target rmdir /s /q target

echo.
echo 3. Configurando para producción...
set SPRING_PROFILES_ACTIVE=railway

echo.
echo 4. Iniciando aplicación en modo producción...
echo.
echo ========================================
echo   APLICACIÓN INICIADA EN MODO RAILWAY
echo   URL: http://localhost:8080
echo   Perfil: railway
echo   Base de datos: PostgreSQL (Railway)
echo ========================================
echo.

mvnw spring-boot:run -Dspring.profiles.active=railway

pause 