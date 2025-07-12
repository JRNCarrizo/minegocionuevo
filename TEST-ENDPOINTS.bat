@echo off
echo ========================================
echo    TESTEANDO ENDPOINTS DEL BACKEND
echo ========================================
echo.

echo 1. Probando endpoint de productos...
curl -X GET "http://localhost:8080/api/empresas/1/productos" -H "Content-Type: application/json"
echo.
echo.

echo 2. Probando endpoint de productos por código personalizado...
curl -X GET "http://localhost:8080/api/empresas/1/productos/por-codigo?codigo=330&activo=true" -H "Content-Type: application/json"
echo.
echo.

echo 3. Probando endpoint de productos por código de barras...
curl -X GET "http://localhost:8080/api/empresas/1/productos/por-codigo-barras?codigoBarras=7891234567890&activo=true" -H "Content-Type: application/json"
echo.
echo.

echo 4. Probando endpoint de búsqueda por nombre...
curl -X GET "http://localhost:8080/api/empresas/1/productos/buscar?termino=coca" -H "Content-Type: application/json"
echo.
echo.

echo ========================================
echo    FIN DE PRUEBAS
echo ========================================
pause 