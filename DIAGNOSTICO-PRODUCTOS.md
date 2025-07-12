# 🔍 DIAGNÓSTICO: PRODUCTOS NO ENCONTRADOS

## 🚨 **Problema:** La Caja Rápida no encuentra productos

## 📋 **Pasos para Diagnosticar:**

### **Paso 1: Verificar Base de Datos**
```sql
-- Ejecutar en tu base de datos MySQL:
-- Contenido del archivo VERIFICAR-PRODUCTOS.sql
```

**Resultados esperados:**
- Debe mostrar al menos 1 empresa con ID = 1
- Debe mostrar al menos 15 productos
- Debe mostrar productos con códigos personalizados

### **Paso 2: Verificar Backend**
```bash
# Ejecutar el script de prueba:
.\TEST-ENDPOINTS.bat
```

**Resultados esperados:**
- Status 200 en todas las respuestas
- JSON con datos de productos

### **Paso 3: Verificar Frontend**
1. Abrir navegador → F12 → Console
2. Ir a la Caja Rápida
3. Buscar estos logs:
   ```
   🔄 Cargando productos para empresaId: 1
   📦 Respuesta de productos: {data: Array(15)}
   ✅ Productos activos con stock: 15
   📋 Primeros productos disponibles:
     1. Coca Cola 500ml - Código: CC001 - Barras: 7891234567890 - Stock: 50
   ```

### **Paso 4: Probar Búsquedas Específicas**
En la Caja Rápida, probar estas búsquedas:

| **Búsqueda** | **Resultado Esperado** |
|--------------|----------------------|
| "coca" | Encuentra "Coca Cola 500ml" |
| "330" | Encuentra "Vino Tinto Malbec" |
| "7891234567890" | Encuentra "Coca Cola 500ml" |

## 🔧 **Posibles Causas y Soluciones:**

### **Causa 1: No hay productos en la base de datos**
**Solución:**
```sql
-- Ejecutar el contenido de DATOS-PRUEBA-CAJA-RAPIDA.sql
```

### **Causa 2: Backend no está corriendo**
**Solución:**
```bash
cd backend
mvn spring-boot:run
```

### **Causa 3: Usuario no autenticado**
**Solución:**
- Hacer login como administrador
- Verificar que aparece el nombre en la navbar

### **Causa 4: Empresa ID incorrecto**
**Solución:**
- Verificar que el usuario pertenece a la empresa con ID = 1
- Verificar en la base de datos: `SELECT * FROM usuarios WHERE id = 1;`

### **Causa 5: Productos inactivos o sin stock**
**Solución:**
```sql
-- Activar productos y agregar stock:
UPDATE productos SET activo = true, stock = 50 WHERE empresa_id = 1;
```

## 📊 **Comandos de Verificación:**

### **Verificar Backend:**
```bash
curl http://localhost:8080/api/empresas/1/productos
```

### **Verificar Base de Datos:**
```sql
SELECT COUNT(*) FROM productos WHERE empresa_id = 1 AND activo = true AND stock > 0;
```

### **Verificar Usuario:**
```sql
SELECT u.id, u.nombre, u.email, e.id as empresa_id, e.nombre as empresa_nombre 
FROM usuarios u 
JOIN empresas e ON u.empresa_id = e.id 
WHERE u.id = 1;
```

## 🎯 **Búsquedas de Prueba:**

### **Búsqueda por Nombre:**
- Escribir "coca" → Debería encontrar Coca Cola
- Escribir "leche" → Debería encontrar Leche Entera
- Escribir "vino" → Debería mostrar múltiples opciones

### **Búsqueda por Código:**
- Escribir "330" → Debería encontrar Vino Tinto Malbec
- Escribir "CC001" → Debería encontrar Coca Cola

### **Búsqueda por Código de Barras:**
- Escribir "7891234567890" → Debería encontrar Coca Cola

## 📝 **Logs a Buscar en la Consola:**

### **Logs de Carga:**
```
🔄 Cargando productos para empresaId: 1
📦 Respuesta de productos: {data: Array(15)}
✅ Productos activos con stock: 15
📋 Primeros productos disponibles:
  1. Coca Cola 500ml - Código: CC001 - Barras: 7891234567890 - Stock: 50
```

### **Logs de Búsqueda:**
```
🔍 Iniciando búsqueda para: coca
📦 Productos cargados: 15
✅ Productos encontrados localmente: 1
🎯 Producto único encontrado: Coca Cola 500ml
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

2. **Verificar puertos:**
   - Backend: http://localhost:8080
   - Frontend: http://localhost:5173

3. **Limpiar caché del navegador:**
   - Ctrl+Shift+R (hard refresh)

4. **Verificar que no hay errores en la consola del navegador** 