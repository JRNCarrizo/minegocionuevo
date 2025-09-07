@echo off
echo Iniciando servidores de desarrollo para debug de permisos...

echo.
echo Iniciando backend en puerto 8080...
start "Backend" cmd /k "cd backend && mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8080"

echo.
echo Esperando 10 segundos para que el backend inicie...
timeout /t 10 /nobreak > nul

echo.
echo Iniciando frontend en puerto 5173...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Servidores iniciados!
echo Backend: http://localhost:8080
echo Frontend: http://localhost:5173
echo.
echo Presiona cualquier tecla para cerrar...
pause > nul
