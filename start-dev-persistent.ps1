Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INICIANDO DESARROLLO PERSISTENTE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuracion: Base de datos H2 persistente" -ForegroundColor Yellow
Write-Host "Perfil: dev-persistent" -ForegroundColor Yellow
Write-Host "Puerto: 8080" -ForegroundColor Yellow
Write-Host ""
Write-Host "Los datos se mantendran entre reinicios" -ForegroundColor Green
Write-Host "Base de datos: ./data/dev-database.mv.db" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANTE: Los datos se crean manualmente" -ForegroundColor Magenta
Write-Host "No se crean datos automáticos" -ForegroundColor Magenta
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navegar al directorio backend
Set-Location backend

Write-Host "Iniciando servidor con perfil dev-persistent..." -ForegroundColor Green

# Ejecutar Maven
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev-persistent

# Mantener la ventana abierta
Read-Host "Presiona Enter para cerrar..." 