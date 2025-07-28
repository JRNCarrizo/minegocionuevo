@echo off
echo ========================================
echo   DESARROLLO CON H2 PERSISTENTE
echo ========================================

echo.
echo 1. Deteniendo aplicación si está corriendo...
taskkill /f /im java.exe 2>nul

echo.
echo 2. Limpiando archivos temporales...
if exist target rmdir /s /q target

echo.
echo 3. Configurando H2 persistente...
set SPRING_PROFILES_ACTIVE=h2-persistent

echo.
echo 4. Iniciando aplicación con H2 persistente...
echo.
echo ========================================
echo   APLICACIÓN INICIADA CON H2 PERSISTENTE
echo   URL: http://localhost:8080
echo   H2 Console: http://localhost:8080/h2-console
echo   JDBC URL: jdbc:h2:file:./data/h2-db
echo   Usuario: sa
echo   Contraseña: password
echo   Archivo DB: ./data/h2-db.mv.db
echo ========================================
echo.

mvnw spring-boot:run -Dspring.profiles.active=h2-persistent

pause 