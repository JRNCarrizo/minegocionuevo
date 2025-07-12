# Script para verificar la base de datos y crear productos de prueba
Write-Host "🔍 VERIFICANDO BASE DE DATOS" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan

# Verificar si MySQL está disponible
Write-Host "`n📊 Verificando conexión a MySQL..." -ForegroundColor Yellow

try {
    # Intentar conectar a MySQL (ajusta las credenciales según tu configuración)
    $mysqlCommand = "mysql -u root -p -e 'SELECT 1;'"
    $result = Invoke-Expression $mysqlCommand 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Conexión a MySQL exitosa" -ForegroundColor Green
    } else {
        Write-Host "❌ No se pudo conectar a MySQL" -ForegroundColor Red
        Write-Host "💡 Asegúrate de que MySQL esté instalado y corriendo" -ForegroundColor Yellow
        Write-Host "💡 Verifica las credenciales en application.properties" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error al conectar a MySQL: $_" -ForegroundColor Red
}

Write-Host "`n📋 INSTRUCCIONES PARA VERIFICAR PRODUCTOS:" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

Write-Host "1️⃣  Abrir MySQL Workbench o línea de comandos MySQL" -ForegroundColor Yellow
Write-Host "2️⃣  Conectar a tu base de datos (minegocio_db)" -ForegroundColor Yellow
Write-Host "3️⃣  Ejecutar el script: verificar-productos.sql" -ForegroundColor Yellow

Write-Host "`n🔧 COMANDO ALTERNATIVO:" -ForegroundColor Cyan
Write-Host "mysql -u root -p minegocio_db < verificar-productos.sql" -ForegroundColor Gray

Write-Host "`n📊 RESULTADOS ESPERADOS:" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host "• Total productos: al menos 15" -ForegroundColor Gray
Write-Host "• Productos activos: al menos 15" -ForegroundColor Gray
Write-Host "• Productos con stock: al menos 15" -ForegroundColor Gray

Write-Host "`n🎯 PRODUCTOS DE PRUEBA QUE SE CREARÁN:" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "• Coca Cola 500ml (CC001)" -ForegroundColor Gray
Write-Host "• Pepsi 500ml (PP001)" -ForegroundColor Gray
Write-Host "• Leche Entera 1L (LE001)" -ForegroundColor Gray
Write-Host "• Pan de Molde (PM001)" -ForegroundColor Gray
Write-Host "• Y 12 productos más..." -ForegroundColor Gray

Write-Host "`n🚀 DESPUÉS DE EJECUTAR EL SCRIPT:" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host "1️⃣  Reiniciar el backend" -ForegroundColor Yellow
Write-Host "2️⃣  Probar la caja rápida" -ForegroundColor Yellow
Write-Host "3️⃣  Buscar productos por: 'coca', 'leche', 'CC001', etc." -ForegroundColor Yellow

Write-Host "`n✅ Verificación completada" -ForegroundColor Green 