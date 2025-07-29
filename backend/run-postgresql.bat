@echo off
echo ========================================
echo   EJECUTANDO CON POSTGRESQL (LOCAL)
echo ========================================

echo.
echo Iniciando aplicación con perfil PostgreSQL...
echo.

mvn spring-boot:run -Dspring-boot.run.profiles=postgresql

echo.
echo ✅ Aplicación iniciada con PostgreSQL
echo.
echo Base de datos: minegocio_dev
echo Puerto: 5432
echo Usuario: postgres
echo.
pause 