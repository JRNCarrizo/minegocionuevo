@echo off
echo Ejecutando migracion para crear tabla historial_carga_productos...
echo.

REM Verificar si el backend esta ejecutandose
echo Verificando si el backend esta ejecutandose...
curl -s http://localhost:8080/api/debug/ping > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: El backend no esta ejecutandose en http://localhost:8080
    echo Por favor, inicia el backend primero con: cd backend && mvn spring-boot:run
    pause
    exit /b 1
)

echo Backend detectado. Ejecutando migracion...
echo.

REM Ejecutar la migracion usando el endpoint de debug
curl -X POST http://localhost:8080/api/debug/migrar-historial-productos -H "Content-Type: application/json"

echo.
echo Migracion completada.
pause 