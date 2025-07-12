# 🔍 DIAGNÓSTICO COMPLETO - CAJA RÁPIDA

## 🚨 PROBLEMA REPORTADO
La búsqueda de productos no funciona - no aparecen resultados ni sugerencias predictivas.

## 📋 PASOS DE DIAGNÓSTICO

### 1. VERIFICAR BASE DE DATOS
```sql
-- Ejecutar en tu base de datos
SELECT COUNT(*) as total_productos FROM productos WHERE empresa_id = 1;
SELECT COUNT(*) as productos_activos FROM productos WHERE empresa_id = 1 AND activo = true;
SELECT COUNT(*) as productos_con_stock FROM productos WHERE empresa_id = 1 AND activo = true AND stock > 0;

-- Ver productos específicos
SELECT id, nombre, codigo_personalizado, codigo_barras, activo, stock, precio 
FROM productos 
WHERE empresa_id = 1 
ORDER BY nombre;
```

### 2. VERIFICAR BACKEND
```bash
# Ejecutar en PowerShell
cd backend
.\mvnw spring-boot:run
```

Luego abrir en navegador:
- http://localhost:8080/api/productos/todos-incluir-inactivos/1
- Debería devolver JSON con productos

### 3. VERIFICAR FRONTEND
```bash
# Ejecutar en PowerShell
cd frontend
npm run dev
```

Luego:
1. Abrir http://localhost:5173
2. Hacer login como admin
3. Ir a Caja Rápida
4. Abrir DevTools (F12)
5. Ir a la pestaña Console
6. Escribir en el campo de búsqueda
7. Revisar los logs en consola

### 4. LOGS ESPERADOS EN CONSOLA
Si todo funciona, deberías ver:
```
🔄 Cargando productos para empresaId: 1
📦 Respuesta de productos: {data: [...]}
📊 Total de productos recibidos: X
✅ Productos activos con stock: X
🔍 mostrarPredicciones llamado con: "texto"
📦 Productos disponibles: X
🔄 useEffect - Filtro cambiado: "texto"
📦 Productos disponibles para filtrar: X
✅ Productos filtrados encontrados: X
```

### 5. POSIBLES PROBLEMAS Y SOLUCIONES

#### A. No hay productos en la base de datos
**Síntoma:** Logs muestran "Total de productos recibidos: 0"
**Solución:** Crear productos de prueba

#### B. Productos están inactivos
**Síntoma:** Logs muestran "Productos activos con stock: 0"
**Solución:** Activar productos en la base de datos

#### C. Backend no responde
**Síntoma:** Error 404 o 500 al cargar productos
**Solución:** Verificar que el backend esté corriendo

#### D. Problema de CORS
**Síntoma:** Error de CORS en consola
**Solución:** Verificar configuración CORS en backend

#### E. Problema de autenticación
**Síntoma:** Error 401 o 403
**Solución:** Verificar token JWT

## 🛠️ COMANDOS PARA EJECUTAR

### PowerShell - Backend
```powershell
cd backend
.\mvnw spring-boot:run
```

### PowerShell - Frontend
```powershell
cd frontend
npm run dev
```

### Verificar puertos
```powershell
netstat -an | findstr :8080
netstat -an | findstr :5173
```

## 📝 REPORTE DE DIAGNÓSTICO

Por favor, ejecuta estos pasos y reporta:

1. **Base de datos:** ¿Cuántos productos hay? ¿Están activos?
2. **Backend:** ¿Responde en http://localhost:8080/api/productos/todos-incluir-inactivos/1?
3. **Frontend:** ¿Qué logs aparecen en la consola del navegador?
4. **Errores:** ¿Hay errores en la consola del navegador o en la terminal del backend?

## 🔧 SOLUCIÓN RÁPIDA

Si quieres probar inmediatamente, ejecuta este SQL para crear productos de prueba:

```sql
INSERT INTO productos (nombre, descripcion, precio, stock, activo, empresa_id, codigo_personalizado, codigo_barras) VALUES
('Producto Test 1', 'Descripción del producto 1', 10.50, 100, true, 1, 'TEST001', '123456789'),
('Producto Test 2', 'Descripción del producto 2', 25.00, 50, true, 1, 'TEST002', '987654321'),
('Producto Test 3', 'Descripción del producto 3', 15.75, 75, true, 1, 'TEST003', '456789123');
``` 