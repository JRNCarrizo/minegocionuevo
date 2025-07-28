@echo off
echo ========================================
echo   CAMBIANDO A MODO DESARROLLO (H2)
echo ========================================

echo.
echo 1. Deteniendo aplicación si está corriendo...
taskkill /f /im java.exe 2>nul

echo.
echo 2. Limpiando archivos temporales...
if exist target rmdir /s /q target

echo.
echo 3. Configurando para desarrollo...
set SPRING_PROFILES_ACTIVE=h2

echo.
echo 4. Iniciando aplicación en modo desarrollo...
echo.
echo ========================================
echo   APLICACIÓN INICIADA EN MODO H2
echo   URL: http://localhost:8080
echo   H2 Console: http://localhost:8080/h2-console
echo   JDBC URL: jdbc:h2:mem:testdb
echo   Usuario: sa
echo   Contraseña: password
echo ========================================
echo.

mvnw spring-boot:run -Dspring.profiles.active=h2

pause 