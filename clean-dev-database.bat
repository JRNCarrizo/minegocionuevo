@echo off
echo ========================================
echo   LIMPIANDO BASE DE DATOS DESARROLLO
echo ========================================
echo.
echo ADVERTENCIA: Esto eliminara todos los datos
echo de la base de datos de desarrollo.
echo.
set /p confirm="¿Estas seguro? (s/N): "

if /i "%confirm%"=="s" (
    echo.
    echo Eliminando archivos de base de datos...
    
    if exist "backend\data\dev-database.mv.db" (
        del "backend\data\dev-database.mv.db"
        echo ✅ dev-database.mv.db eliminado
    )
    
    if exist "backend\data\dev-database.trace.db" (
        del "backend\data\dev-database.trace.db"
        echo ✅ dev-database.trace.db eliminado
    )
    
    if exist "backend\data\dev-database.lock.db" (
        del "backend\data\dev-database.lock.db"
        echo ✅ dev-database.lock.db eliminado
    )
    
    echo.
    echo ✅ Base de datos limpiada correctamente
    echo La proxima vez que inicies el servidor se crearan
    echo nuevos datos de prueba.
) else (
    echo.
    echo ❌ Operacion cancelada
)

echo.
pause 