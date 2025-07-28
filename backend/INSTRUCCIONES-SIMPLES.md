# 🚀 Instrucciones Simples - Desarrollo vs Producción

## 📋 **Método Súper Simple**

### 🔧 **Para Desarrollo (H2):**
1. Ejecuta: `switch-to-dev.bat`
2. Ejecuta: `mvnw spring-boot:run`
3. Ve a: http://localhost:8080/h2-console

### 🚀 **Para Producción (PostgreSQL):**
1. Ejecuta: `switch-to-prod.bat`
2. Ejecuta: `git add . && git commit -m "Switch to production" && git push`

## 🔗 **Acceso H2 Console:**
- URL: http://localhost:8080/h2-console
- Usuario: `sa`
- Contraseña: `password`

## ⚡ **Comandos Rápidos:**

### Desarrollo:
```bash
./switch-to-dev.bat
mvnw spring-boot:run
```

### Producción:
```bash
./switch-to-prod.bat
git add . && git commit -m "Switch to production" && git push
```

## 📁 **Archivos:**
- `switch-to-dev.bat` - Cambia a H2 (desarrollo)
- `switch-to-prod.bat` - Cambia a PostgreSQL (producción)

## ⚠️ **Nota:**
- Los scripts comentan/descomentan las dependencias automáticamente
- Para desarrollo usa H2, para producción usa PostgreSQL
- Railway detectará los cambios automáticamente 