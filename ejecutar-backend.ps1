# Script para ejecutar el backend de MiNegocio
Write-Host "Iniciando backend de MiNegocio..." -ForegroundColor Green

# Navegar al directorio del backend
Set-Location "backend"

# Verificar si Java está instalado
try {
    $javaVersion = java -version 2>&1
    Write-Host "Java encontrado:" -ForegroundColor Green
    Write-Host $javaVersion[0] -ForegroundColor Yellow
} catch {
    Write-Host "Error: Java no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host "Por favor instala Java 17 o superior" -ForegroundColor Red
    exit 1
}

# Verificar si Maven está instalado
try {
    $mvnVersion = mvn -version 2>&1
    Write-Host "Maven encontrado:" -ForegroundColor Green
    Write-Host $mvnVersion[0] -ForegroundColor Yellow
} catch {
    Write-Host "Error: Maven no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host "Por favor instala Maven" -ForegroundColor Red
    exit 1
}

# Limpiar y compilar el proyecto
Write-Host "Compilando el proyecto..." -ForegroundColor Green
mvn clean compile

# Ejecutar el proyecto
Write-Host "Ejecutando el backend..." -ForegroundColor Green
Write-Host "El servidor estará disponible en: http://localhost:8080" -ForegroundColor Yellow
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Cyan

mvn spring-boot:run 