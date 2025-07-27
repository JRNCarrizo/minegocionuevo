@echo off
echo ========================================
echo Cambiando a configuración de PRODUCCION
echo ========================================

echo.
echo 1. Comentando H2 y descomentando PostgreSQL en pom.xml...
powershell -Command "(Get-Content pom.xml) -replace '<!-- H2 - Para desarrollo local', '<!-- H2 - Para desarrollo local (COMENTADO PARA PRODUCCION)' | Set-Content pom.xml"
powershell -Command "(Get-Content pom.xml) -replace '<!-- PostgreSQL - Para producción (Railway) -->', '<!-- PostgreSQL - Para producción (Railway) (HABILITADO)' | Set-Content pom.xml"
powershell -Command "(Get-Content pom.xml) -replace '<!--', '' | Set-Content pom.xml"
powershell -Command "(Get-Content pom.xml) -replace '-->', '' | Set-Content pom.xml"

echo.
echo 2. Recompilando proyecto...
mvn clean package -DskipTests

echo.
echo 3. Ejecutando con perfil de producción...
echo Comando: java -jar target/backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=render
echo.
echo ¡Listo! El proyecto está configurado para producción con PostgreSQL.
echo.
pause 