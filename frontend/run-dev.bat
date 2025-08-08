@echo off
echo ========================================
echo    INICIANDO FRONTEND EN DESARROLLO
echo ========================================
echo.
echo Configuracion:
echo - Puerto: 5173
echo - API URL: http://localhost:8080/api
echo - Modo: Desarrollo
echo.
echo ========================================
echo.

cd /d "%~dp0"

echo Instalando dependencias...
call npm install

echo.
echo Iniciando servidor de desarrollo...
call npm run dev

pause 