@echo off
echo ============================================
echo    miNegocio - Cambiar a Desarrollo
echo ============================================
echo.
echo Este script cambia las dependencias para desarrollo:
echo - Descomenta H2 (desarrollo)
echo - Comenta PostgreSQL (producción)
echo.
echo ============================================

echo.
echo Cambiando dependencias para desarrollo...

REM Descomentar H2
powershell -Command "(Get-Content 'pom.xml') -replace '<!-- <dependency>', '<dependency>' | Set-Content 'pom.xml'"
powershell -Command "(Get-Content 'pom.xml') -replace '</dependency> -->', '</dependency>' | Set-Content 'pom.xml'"

REM Comentar PostgreSQL
powershell -Command "(Get-Content 'pom.xml') -replace '<dependency>', '<!-- <dependency>' | Set-Content 'pom.xml'"
powershell -Command "(Get-Content 'pom.xml') -replace '</dependency>', '</dependency> -->' | Set-Content 'pom.xml'"

echo.
echo ✅ Configuración cambiada a desarrollo
echo.
echo Ahora puedes ejecutar:
echo - run-h2-persistent.bat (para H2 persistente)
echo - O: mvn spring-boot:run -Dspring-boot.run.profiles=dev-h2-persistent
echo.
pause 