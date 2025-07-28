@echo off
echo ============================================
echo    miNegocio - H2 Persistente
echo ============================================
echo.
echo Iniciando backend con H2 persistente...
echo Los datos se guardaran en: ./data/minegocio_db.mv.db
echo.
echo Para acceder a la consola H2: http://localhost:8080/h2-console
echo JDBC URL: jdbc:h2:file:./data/minegocio_db
echo Usuario: sa
echo Password: password
echo.
echo ============================================

cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev-h2-persistent

pause 