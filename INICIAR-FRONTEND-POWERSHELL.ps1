Write-Host "========================================" -ForegroundColor Green
Write-Host "    INICIANDO FRONTEND MI NEGOCIO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Cambiando al directorio frontend..." -ForegroundColor Yellow
Set-Location frontend

Write-Host "Instalando dependencias si es necesario..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "Iniciando servidor de desarrollo..." -ForegroundColor Yellow
npm run dev

Write-Host ""
Write-Host "Frontend iniciado en http://localhost:5173" -ForegroundColor Green
Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Cyan 