@echo off
echo ========================================
echo   LIMPIANDO DATOS DE H2
echo ========================================

echo.
echo 1. Deteniendo aplicación si está corriendo...
taskkill /f /im java.exe 2>nul

echo.
echo 2. Eliminando archivos de base de datos H2...
if exist data\*.mv.db del /q data\*.mv.db
if exist data\*.trace.db del /q data\*.trace.db
if exist data\*.lock.db del /q data\*.lock.db

echo.
echo 3. Eliminando archivos temporales...
if exist target rmdir /s /q target

echo.
echo ✅ Datos de H2 eliminados correctamente
echo.
echo Ahora puedes ejecutar:
echo - switch-to-development.bat (para H2 en memoria)
echo - run-h2-persistent.bat (para H2 persistente)
echo.

pause 