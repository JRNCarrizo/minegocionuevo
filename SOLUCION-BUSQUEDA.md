# 🔍 SOLUCIÓN: BÚSQUEDA NO FUNCIONA

## 🚨 **Problema:** No aparecen predicciones ni búsqueda funciona

## 📋 **Pasos para Diagnosticar:**

### **Paso 1: Verificar que el Backend está Corriendo**
```bash
# Ejecutar este script:
.\PROBAR-BACKEND.bat
```

**Resultado esperado:** JSON con productos
**Si falla:** El backend no está corriendo

### **Paso 2: Verificar en el Navegador**
1. Abrir F12 → Console
2. Ir a la Caja Rápida
3. Buscar estos logs:
   ```
   🔄 Cargando productos para empresaId: 1
   📊 Total de productos recibidos: 15
   ✅ Productos activos con stock: 15
   📋 Productos disponibles para búsqueda:
     1. Coca Cola 500ml - Código: CC001 - Barras: 7891234567890 - Stock: 50
   ```

### **Paso 3: Probar Búsqueda en Tiempo Real**
1. En el campo de búsqueda, escribir "coca"
2. Deberías ver logs como:
   ```
   🔍 Mostrando predicciones para: coca
   📦 Productos disponibles: 15
   ✅ Productos filtrados: 1
     - Coca Cola 500ml
   ```

### **Paso 4: Verificar Base de Datos**
```sql
-- Ejecutar en MySQL:
SELECT COUNT(*) FROM productos WHERE empresa_id = 1 AND activo = true AND stock > 0;
```

## 🔧 **Soluciones por Problema:**

### **Problema 1: Backend no responde**
```bash
# Terminal 1
cd backend
mvn spring-boot:run
```

### **Problema 2: No hay productos en la base de datos**
```sql
-- Ejecutar en MySQL:
-- Contenido de DATOS-PRUEBA-CAJA-RAPIDA.sql
```

### **Problema 3: Productos inactivos o sin stock**
```sql
-- Activar productos y agregar stock:
UPDATE productos SET activo = true, stock = 50 WHERE empresa_id = 1;
```

### **Problema 4: Usuario no autenticado**
- Hacer login como administrador
- Verificar que aparece el nombre en la navbar

## 🎯 **Búsquedas de Prueba:**

| **Escribir** | **Debería Mostrar** |
|--------------|---------------------|
| "coca" | Coca Cola 500ml |
| "leche" | Leche Entera 1L |
| "vino" | Vino Tinto Malbec, Vino Blanco Chardonnay |
| "330" | Vino Tinto Malbec |
| "CC001" | Coca Cola 500ml |

## 📝 **Logs a Buscar:**

### **Al Cargar la Página:**
```
🔄 Cargando productos para empresaId: 1
📦 Respuesta completa: {data: Array(15)}
📊 Total de productos recibidos: 15
✅ Productos activos con stock: 15
📋 Productos disponibles para búsqueda:
  1. Coca Cola 500ml - Código: CC001 - Barras: 7891234567890 - Stock: 50
```

### **Al Escribir:**
```
🔍 Mostrando predicciones para: coca
📦 Productos disponibles: 15
✅ Productos filtrados: 1
  - Coca Cola 500ml
```

## 🚨 **Si Nada Funciona:**

1. **Reiniciar todo:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   mvn spring-boot:run
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Limpiar caché del navegador:**
   - Ctrl+Shift+R (hard refresh)

3. **Verificar que no hay errores en la consola**

4. **Probar en modo incógnito**

## 📊 **Comandos de Verificación:**

### **Verificar Backend:**
```bash
curl http://localhost:8080/api/empresas/1/productos
```

### **Verificar Base de Datos:**
```sql
SELECT id, nombre, activo, stock FROM productos WHERE empresa_id = 1 LIMIT 5;
```

### **Verificar Usuario:**
```sql
SELECT u.nombre, e.nombre as empresa FROM usuarios u JOIN empresas e ON u.empresa_id = e.id WHERE u.id = 1;
``` 