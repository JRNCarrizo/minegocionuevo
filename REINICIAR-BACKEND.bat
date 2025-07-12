@echo off
echo ========================================
echo    REINICIANDO BACKEND MI NEGOCIO
echo ========================================
echo.

echo Deteniendo procesos Java en puerto 8080...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080') do (
    echo Proceso encontrado: %%a
    taskkill /PID %%a /F 2>nul
)

echo.
echo Esperando 3 segundos...
timeout /t 3 /nobreak >nul

echo.
echo Iniciando backend...
cd backend
call mvnw.cmd spring-boot:run

echo.
echo Backend iniciado en http://localhost:8080
echo Presiona Ctrl+C para detener
pause 