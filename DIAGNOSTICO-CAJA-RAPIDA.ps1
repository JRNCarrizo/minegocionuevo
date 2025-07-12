# Script de diagnóstico para Caja Rápida
# Ejecutar en PowerShell como administrador

Write-Host "🔍 DIAGNÓSTICO CAJA RÁPIDA" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Verificar si estamos en el directorio correcto
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "❌ Error: Debes ejecutar este script desde la raíz del proyecto" -ForegroundColor Red
    Write-Host "   Directorio actual: $(Get-Location)" -ForegroundColor Yellow
    Write-Host "   Buscando archivos backend/ y frontend/..." -ForegroundColor Yellow
    
    if (Test-Path "backend") {
        Write-Host "   ✅ Backend encontrado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Backend no encontrado" -ForegroundColor Red
    }
    
    if (Test-Path "frontend") {
        Write-Host "   ✅ Frontend encontrado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Frontend no encontrado" -ForegroundColor Red
    }
    
    exit 1
}

Write-Host "✅ Directorio correcto detectado" -ForegroundColor Green

# Verificar puertos
Write-Host "`n🔌 Verificando puertos..." -ForegroundColor Cyan

$puerto8080 = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
$puerto5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

if ($puerto8080) {
    Write-Host "⚠️  Puerto 8080 (Backend) está en uso" -ForegroundColor Yellow
    Write-Host "   PID: $($puerto8080.OwningProcess)" -ForegroundColor Gray
} else {
    Write-Host "✅ Puerto 8080 (Backend) disponible" -ForegroundColor Green
}

if ($puerto5173) {
    Write-Host "⚠️  Puerto 5173 (Frontend) está en uso" -ForegroundColor Yellow
    Write-Host "   PID: $($puerto5173.OwningProcess)" -ForegroundColor Gray
} else {
    Write-Host "✅ Puerto 5173 (Frontend) disponible" -ForegroundColor Green
}

# Verificar archivos necesarios
Write-Host "`n📁 Verificando archivos..." -ForegroundColor Cyan

$archivosBackend = @(
    "backend/pom.xml",
    "backend/mvnw",
    "backend/src/main/java/com/minegocio/backend/MiNegocioBackendApplication.java"
)

$archivosFrontend = @(
    "frontend/package.json",
    "frontend/vite.config.ts",
    "frontend/src/pages/admin/CajaRapida.tsx"
)

foreach ($archivo in $archivosBackend) {
    if (Test-Path $archivo) {
        Write-Host "   ✅ $archivo" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $archivo" -ForegroundColor Red
    }
}

foreach ($archivo in $archivosFrontend) {
    if (Test-Path $archivo) {
        Write-Host "   ✅ $archivo" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $archivo" -ForegroundColor Red
    }
}

# Verificar dependencias del frontend
Write-Host "`n📦 Verificando dependencias del frontend..." -ForegroundColor Cyan

if (Test-Path "frontend/node_modules") {
    Write-Host "   ✅ node_modules encontrado" -ForegroundColor Green
} else {
    Write-Host "   ❌ node_modules no encontrado" -ForegroundColor Red
    Write-Host "   💡 Ejecuta: cd frontend && npm install" -ForegroundColor Yellow
}

# Instrucciones
Write-Host "`n🚀 INSTRUCCIONES PARA PROBAR:" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

Write-Host "1️⃣  Iniciar Backend:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   .\mvnw spring-boot:run" -ForegroundColor Gray

Write-Host "`n2️⃣  Iniciar Frontend (en otra terminal):" -ForegroundColor Yellow
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray

Write-Host "`n3️⃣  Probar Backend:" -ForegroundColor Yellow
Write-Host "   Abrir: http://localhost:8080/api/productos/todos-incluir-inactivos/1" -ForegroundColor Gray

Write-Host "`n4️⃣  Probar Frontend:" -ForegroundColor Yellow
Write-Host "   Abrir: http://localhost:5173" -ForegroundColor Gray
Write-Host "   Login como admin → Caja Rápida" -ForegroundColor Gray

Write-Host "`n5️⃣  Verificar en DevTools:" -ForegroundColor Yellow
Write-Host "   F12 → Console → Escribir en campo búsqueda" -ForegroundColor Gray
Write-Host "   Buscar logs que empiecen con 🔄 📦 ✅" -ForegroundColor Gray

Write-Host "`n📝 REPORTAR:" -ForegroundColor Cyan
Write-Host "=============" -ForegroundColor Cyan
Write-Host "• ¿Cuántos productos hay en la base de datos?" -ForegroundColor Gray
Write-Host "• ¿El backend responde en /api/productos/...?" -ForegroundColor Gray
Write-Host "• ¿Qué logs aparecen en la consola del navegador?" -ForegroundColor Gray
Write-Host "• ¿Hay errores en la consola?" -ForegroundColor Gray

Write-Host "`n🔧 SOLUCIÓN RÁPIDA:" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host "Si no hay productos, ejecuta en tu base de datos:" -ForegroundColor Gray
Write-Host "INSERT INTO productos (nombre, descripcion, precio, stock, activo, empresa_id, codigo_personalizado, codigo_barras) VALUES" -ForegroundColor Gray
Write-Host "('Producto Test 1', 'Descripción 1', 10.50, 100, true, 1, 'TEST001', '123456789');" -ForegroundColor Gray

Write-Host "`n✅ Diagnóstico completado" -ForegroundColor Green 