@echo off
echo ========================================
echo    INICIANDO BACKEND EN DESARROLLO
echo ========================================
echo.
echo Configuracion:
echo - Base de datos: H2 (memoria)
echo - Email: Simulado (no se envian emails reales)
echo - Puerto: 8080
echo - Frontend URL: http://localhost:5173
echo.
echo ========================================
echo.

cd /d "%~dp0"

echo Limpiando y compilando...
call mvn clean compile

echo.
echo Iniciando servidor en modo desarrollo...
call mvn spring-boot:run -Dspring-boot.run.profiles=dev

pause 