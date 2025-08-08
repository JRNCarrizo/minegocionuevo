@echo off
echo ========================================
echo    INICIANDO DESARROLLO COMPLETO
echo ========================================
echo.
echo Este script iniciara:
echo 1. Backend (puerto 8080) - Modo desarrollo
echo 2. Frontend (puerto 5173) - Modo desarrollo
echo.
echo Configuracion de desarrollo:
echo - Base de datos: H2 (memoria)
echo - Email: Simulado (no se envian emails reales)
echo - Tokens de verificacion: Se muestran en consola
echo.
echo ========================================
echo.

cd /d "%~dp0"

echo Iniciando Backend en modo desarrollo...
start "Backend - Desarrollo" cmd /k "cd backend && call run-dev.bat"

echo Esperando 10 segundos para que el backend inicie...
timeout /t 10 /nobreak > nul

echo.
echo Iniciando Frontend en modo desarrollo...
start "Frontend - Desarrollo" cmd /k "cd frontend && call run-dev.bat"

echo.
echo ========================================
echo    DESARROLLO INICIADO
echo ========================================
echo.
echo Servicios disponibles:
echo - Backend: http://localhost:8080
echo - Frontend: http://localhost:5173
echo - H2 Console: http://localhost:8080/h2-console
echo.
echo Para detener los servicios, cierra las ventanas de comandos.
echo.
pause 