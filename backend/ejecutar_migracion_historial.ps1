Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MIGRACION DE HISTORIAL DE PRODUCTOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este script ejecutara la migracion para agregar"
Write-Host "historial de carga inicial a productos existentes."
Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "Ejecutando migracion..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/debug/migrar-historial-productos" -Method POST -ContentType "application/json"
    
    Write-Host "Respuesta del servidor:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
    
    if ($response.registrosInsertados -gt 0) {
        Write-Host ""
        Write-Host "Migracion completada exitosamente!" -ForegroundColor Green
        Write-Host "Se insertaron $($response.registrosInsertados) registros de historial." -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "No se requirio migracion." -ForegroundColor Blue
        Write-Host $response.mensaje -ForegroundColor Blue
    }
    
} catch {
    Write-Host ""
    Write-Host "Error al ejecutar la migracion:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "Presiona cualquier tecla para salir..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 