@echo off
echo ========================================
echo   CAMBIANDO A DESARROLLO (H2)
echo ========================================

echo.
echo Comentando PostgreSQL y descomentando H2...

REM Comentar PostgreSQL
powershell -Command "(Get-Content 'pom.xml') -replace '<!-- PostgreSQL para producción \\(COMENTADO PARA DESARROLLO\\) -->', '<!-- PostgreSQL para producción (COMENTADO PARA DESARROLLO) -->' | Set-Content 'pom.xml'"
powershell -Command "(Get-Content 'pom.xml') -replace '<!--', '<!--' | Set-Content 'pom.xml'"
powershell -Command "(Get-Content 'pom.xml') -replace '-->', '-->' | Set-Content 'pom.xml'"

REM Descomentar H2
powershell -Command "(Get-Content 'pom.xml') -replace '<!-- H2 para desarrollo \\(DESCOMENTADO PARA DESARROLLO\\) -->', '<!-- H2 para desarrollo (DESCOMENTADO PARA DESARROLLO) -->' | Set-Content 'pom.xml'"

echo.
echo ✅ Configuración cambiada a DESARROLLO
echo.
echo Ahora puedes ejecutar:
echo mvnw spring-boot:run
echo.
echo O ir a: http://localhost:8080/h2-console
echo.

pause 