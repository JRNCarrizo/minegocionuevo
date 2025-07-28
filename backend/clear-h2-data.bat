@echo off
echo ============================================
echo    miNegocio - Limpiar Datos H2
echo ============================================
echo.
echo ADVERTENCIA: Esto eliminara todos los datos guardados
echo.
set /p confirm="¿Estas seguro? (s/N): "
if /i "%confirm%"=="s" (
    echo.
    echo Eliminando archivos de base de datos...
    if exist "data\minegocio_db.mv.db" del "data\minegocio_db.mv.db"
    if exist "data\minegocio_db.trace.db" del "data\minegocio_db.trace.db"
    if exist "data\minegocio_db.lock.db" del "data\minegocio_db.lock.db"
    echo.
    echo Datos eliminados correctamente.
    echo La proxima vez que inicies el backend, se crearan nuevas tablas.
) else (
    echo.
    echo Operacion cancelada.
)
echo.
pause 