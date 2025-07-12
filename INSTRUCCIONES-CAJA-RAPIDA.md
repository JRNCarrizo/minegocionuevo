# 💰 INSTRUCCIONES CAJA RÁPIDA - PROBLEMA SOLUCIONADO

## ✅ PROBLEMAS CORREGIDOS
- **Bucle infinito del escáner**: Eliminado spam de errores de QR
- **Configuración optimizada**: Escáner configurado específicamente para códigos de barras
- **Scripts de PowerShell**: Comandos simples para ejecutar frontend y backend

## 🚀 CÓMO EJECUTAR

### Opción 1: Scripts Automáticos (Recomendado)
```powershell
# Terminal 1 - Backend
.\ejecutar-backend.ps1

# Terminal 2 - Frontend  
.\ejecutar-frontend.ps1
```

### Opción 2: Comandos Manuales
```powershell
# Terminal 1 - Backend
cd backend
.\mvnw spring-boot:run

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 📱 USO DE LA CAJA RÁPIDA

### 1. Acceso
- Abrir: http://localhost:5173
- Login como administrador
- Ir a "Caja Rápida" en el dashboard

### 2. Agregar Productos
**Opción A: Escáner de Cámara**
- Clic en "📷 Escanear Código"
- Apuntar cámara al código de barras
- Si hay problemas: clic en "🔄 Reiniciar Escáner"

**Opción B: Escáner Físico (Recomendado)**
- Clic en el campo de texto "Código de barras..."
- Escanear directamente con dispositivo USB/Bluetooth
- ¡Más rápido y confiable!

**Opción C: Búsqueda Manual**
- Escribir nombre, código personalizado o código de barras
- Aparecerán sugerencias automáticas
- Seleccionar producto de la lista

### 3. Gestión de Cantidades
- Cambiar cantidad en el campo numérico
- O usar botones +/- en cada producto
- Stock se valida automáticamente

### 4. Finalizar Venta
- Seleccionar método de pago
- Si es efectivo: ingresar monto recibido
- Clic en "Finalizar Venta"

## 🔧 SOLUCIÓN DE PROBLEMAS

### Escáner de Cámara No Funciona
1. **Verificar permisos**: Permitir acceso a cámara
2. **Reiniciar escáner**: Clic en "🔄 Reiniciar Escáner"
3. **Usar escáner físico**: Más confiable
4. **Ingreso manual**: Escribir código a mano

### No Aparecen Productos
1. **Verificar backend**: http://localhost:8080/api/productos/todos-incluir-inactivos/1
2. **Verificar base de datos**: Debe haber productos activos con stock
3. **Revisar consola**: F12 → Console para ver logs

### Errores en Consola
- **Errores de QR**: Ignorar, son normales (ya filtrados)
- **Errores 403/401**: Verificar login de administrador
- **Errores de red**: Verificar que backend esté corriendo

## 📊 LOGS ESPERADOS

### Al Cargar la Página
```
🔄 Cargando productos para empresaId: 1
📦 Respuesta de productos: {data: [...]}
📊 Total de productos recibidos: X
✅ Productos activos con stock: X
```

### Al Buscar Productos
```
🔍 mostrarPredicciones llamado con: "texto"
📦 Productos disponibles: X
🔄 useEffect - Filtro cambiado: "texto"
✅ Productos filtrados encontrados: X
```

### Al Escanear Código
```
✅ Código escaneado: 123456789
```

## 🎯 CONSEJOS DE USO

1. **Escáneres físicos**: Son más rápidos y confiables que la cámara
2. **Búsqueda por nombre**: Funciona con texto parcial
3. **Códigos personalizados**: Útiles para productos internos
4. **Validación de stock**: Se verifica automáticamente
5. **Múltiples métodos de pago**: Efectivo, tarjeta, transferencia

## 📞 SOPORTE

Si persisten problemas:
1. Revisar logs en consola del navegador (F12)
2. Verificar que backend responda en puerto 8080
3. Confirmar que hay productos en la base de datos
4. Probar con escáner físico en lugar de cámara 