@echo off
echo ========================================
echo   CAMBIANDO A PRODUCCIÓN (PostgreSQL)
echo ========================================

echo.
echo Descomentando PostgreSQL y comentando H2...

REM Descomentar PostgreSQL
powershell -Command "(Get-Content 'pom.xml') -replace '<!-- PostgreSQL para producción \\(COMENTADO PARA DESARROLLO\\) -->', '<!-- PostgreSQL para producción -->' | Set-Content 'pom.xml'"
powershell -Command "(Get-Content 'pom.xml') -replace '<!--', '' | Set-Content 'pom.xml'"
powershell -Command "(Get-Content 'pom.xml') -replace '-->', '' | Set-Content 'pom.xml'"

REM Comentar H2
powershell -Command "(Get-Content 'pom.xml') -replace '<!-- H2 para desarrollo \\(DESCOMENTADO PARA DESARROLLO\\) -->', '<!-- H2 para desarrollo -->' | Set-Content 'pom.xml'"
powershell -Command "(Get-Content 'pom.xml') -replace '<dependency>', '<!-- <dependency>' | Set-Content 'pom.xml'"
powershell -Command "(Get-Content 'pom.xml') -replace '</dependency>', '</dependency> -->' | Set-Content 'pom.xml'"

echo.
echo ✅ Configuración cambiada a PRODUCCIÓN
echo.
echo Ahora puedes hacer:
echo git add .
echo git commit -m "Switch to production"
echo git push
echo.
echo Railway detectará los cambios y redeployará automáticamente.
echo.

pause 