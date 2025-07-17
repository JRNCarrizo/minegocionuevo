@echo off
echo ========================================
echo MIGRACION DE HISTORIAL DE PRODUCTOS
echo ========================================
echo.
echo Este script ejecutara la migracion para agregar
echo historial de carga inicial a productos existentes.
echo.
echo Presiona cualquier tecla para continuar...
pause > nul

echo.
echo Ejecutando migracion...
echo.

curl -X POST http://localhost:8080/api/debug/migrar-historial-productos -H "Content-Type: application/json"

echo.
echo.
echo Migracion completada.
echo Revisa la respuesta anterior para ver el resultado.
echo.
pause 