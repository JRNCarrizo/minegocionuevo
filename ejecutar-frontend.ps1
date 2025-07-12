# Script para ejecutar el frontend de MiNegocio
Write-Host "Iniciando frontend de MiNegocio..." -ForegroundColor Green

# Navegar al directorio del frontend
Set-Location "frontend"

# Verificar si Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host "Por favor instala Node.js 16 o superior" -ForegroundColor Red
    exit 1
}

# Verificar si npm está instalado
try {
    $npmVersion = npm --version
    Write-Host "npm encontrado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: npm no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host "Por favor instala npm" -ForegroundColor Red
    exit 1
}

# Verificar si node_modules existe, si no, instalar dependencias
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Green
    npm install
}

# Ejecutar el servidor de desarrollo
Write-Host "Ejecutando el servidor de desarrollo..." -ForegroundColor Green
Write-Host "El frontend estará disponible en: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Cyan

npm run dev 