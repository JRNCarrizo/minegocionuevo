@echo off
echo ========================================
echo   EJECUTANDO EN PRODUCCIÓN (RAILWAY)
echo ========================================

echo.
echo Iniciando aplicación con perfil de producción...
echo.

mvn spring-boot:run -Dspring-boot.run.profiles=railway

echo.
echo ✅ Aplicación iniciada en modo producción
echo.
pause 