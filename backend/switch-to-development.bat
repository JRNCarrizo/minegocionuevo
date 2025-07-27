@echo off
echo ========================================
echo Cambiando a configuración de DESARROLLO
echo ========================================

echo.
echo 1. Habilitando H2 y comentando PostgreSQL en pom.xml...
powershell -Command "(Get-Content pom.xml) -replace '<!-- H2 - Para desarrollo local (COMENTADO PARA PRODUCCION)', '<!-- H2 - Para desarrollo local' | Set-Content pom.xml"
powershell -Command "(Get-Content pom.xml) -replace '<!-- PostgreSQL - Para producción (Railway) (HABILITADO)', '<!-- PostgreSQL - Para producción (Railway) -->' | Set-Content pom.xml"
powershell -Command "(Get-Content pom.xml) -replace '<dependency>', '<!--<dependency>' | Set-Content pom.xml"
powershell -Command "(Get-Content pom.xml) -replace '</dependency>', '</dependency>-->' | Set-Content pom.xml"

echo.
echo 2. Recompilando proyecto...
mvn clean package -DskipTests

echo.
echo 3. Ejecutando con perfil de desarrollo...
echo Comando: java -jar target/backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev-h2
echo.
echo ¡Listo! El proyecto está configurado para desarrollo con H2.
echo.
pause 