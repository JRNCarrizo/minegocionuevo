@echo off
echo ========================================
echo    PROBANDO SI EL BACKEND RESPONDE
echo ========================================
echo.

echo Probando endpoint de productos...
curl -X GET "http://localhost:8080/api/empresas/1/productos" -H "Content-Type: application/json"
echo.
echo.

echo Si ves un JSON con productos, el backend funciona.
echo Si ves un error, el backend no está corriendo.
echo.
pause 