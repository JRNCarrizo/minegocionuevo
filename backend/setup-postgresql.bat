@echo off
echo ========================================
echo   CONFIGURANDO POSTGRESQL LOCAL
echo ========================================

echo.
echo Este script te ayudará a configurar PostgreSQL local
echo.

echo 1. Asegúrate de tener PostgreSQL instalado
echo 2. PostgreSQL debe estar ejecutándose en el puerto 5432
echo 3. Debe existir un usuario 'postgres' con contraseña 'postgres'
echo 4. Se creará la base de datos 'minegocio_dev' automáticamente
echo.

echo ¿Tienes PostgreSQL instalado y ejecutándose? (S/N)
set /p respuesta=

if /i "%respuesta%"=="S" (
    echo.
    echo ✅ PostgreSQL configurado correctamente
    echo.
    echo Ahora puedes ejecutar: run-postgresql.bat
    echo.
) else (
    echo.
    echo ❌ Por favor instala PostgreSQL primero
    echo.
    echo Pasos para instalar PostgreSQL:
    echo 1. Descarga desde: https://www.postgresql.org/download/
    echo 2. Instala con usuario 'postgres' y contraseña 'postgres'
    echo 3. Asegúrate de que el puerto 5432 esté disponible
    echo.
)

pause 