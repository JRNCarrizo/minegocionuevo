@echo off
echo ========================================
echo   INICIANDO DESARROLLO PERSISTENTE
echo ========================================
echo.
echo Configuracion: Base de datos H2 persistente
echo Perfil: dev-persistent
echo Puerto: 8080
echo.
echo Los datos se mantendran entre reinicios
echo Base de datos: ./data/dev-database.mv.db
echo.
echo ========================================
echo.

cd backend

echo Iniciando servidor con perfil dev-persistent...
mvnw spring-boot:run -Dspring-boot.run.profiles=dev-persistent

pause 