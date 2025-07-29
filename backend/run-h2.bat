@echo off
echo ========================================
echo   EJECUTANDO CON H2 (DESARROLLO)
echo ========================================

echo.
echo Iniciando aplicación con perfil H2...
echo.

mvn spring-boot:run -Dspring-boot.run.profiles=h2

echo.
echo ✅ Aplicación iniciada con H2
echo.
echo Consola H2: http://localhost:8080/h2-console
echo JDBC URL: jdbc:h2:mem:testdb
echo Usuario: sa
echo Contraseña: password
echo.
pause 