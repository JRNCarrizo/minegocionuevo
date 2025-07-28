@echo off
echo ============================================
echo    miNegocio - Cambiar a Producción
echo ============================================
echo.
echo Este script cambia las dependencias para producción:
echo - Comenta H2 (desarrollo)
echo - Descomenta PostgreSQL (producción)
echo.
echo ============================================

echo.
echo Cambiando dependencias para producción...

REM Comentar H2
powershell -Command "(Get-Content 'pom.xml') -replace '<dependency>', '<!-- <dependency>' | Set-Content 'pom.xml'"
powershell -Command "(Get-Content 'pom.xml') -replace '</dependency>', '</dependency> -->' | Set-Content 'pom.xml'"

REM Descomentar PostgreSQL
powershell -Command "(Get-Content 'pom.xml') -replace '<!-- <dependency>', '<dependency>' | Set-Content 'pom.xml'"
powershell -Command "(Get-Content 'pom.xml') -replace '</dependency> -->', '</dependency>' | Set-Content 'pom.xml'"

echo.
echo ✅ Configuración cambiada a producción
echo.
echo Ahora puedes hacer:
echo 1. git add .
echo 2. git commit -m "Switch to production"
echo 3. git push origin main
echo.
echo Railway detectará los cambios y redeployará automáticamente.
echo.
pause 