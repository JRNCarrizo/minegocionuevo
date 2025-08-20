# 🔍 Debug: Problema de Stock en Frontend

## 🚨 **Problema**
- Usuario cambia stock a 4 → queda en 22
- Usuario cambia stock a 10 → queda en 22
- Los valores se incrementan en lugar de reemplazarse

## ✅ **Debug Aplicado en Frontend**

### **1. Logging en Carga de Producto**
```javascript
console.log('🔍 === DEBUG FRONTEND - PRODUCTO CARGADO ===');
console.log('🔍 Producto recibido:', producto);
console.log('🔍 Stock del producto:', producto.stock);
```

### **2. Logging en Envío de Datos**
```javascript
console.log('🔍 === DEBUG FRONTEND - DATOS A ENVIAR ===');
console.log('🔍 Formulario completo:', formulario);
console.log('🔍 Stock en formulario:', formulario.stock);
console.log('🔍 Stock convertido a Number:', Number(formulario.stock));
console.log('🔍 DatosProducto a enviar:', datosProducto);
```

## 🔍 **Pasos para Debug**

### **1. Abrir Herramientas de Desarrollador**
- F12 → Console
- F12 → Network

### **2. Reproducir el Bug**
1. Editar un producto
2. Cambiar el stock
3. Guardar
4. Revisar logs en consola

### **3. Verificar Petición Network**
1. Buscar la petición PUT
2. Verificar el payload enviado
3. Verificar la respuesta del servidor

## 📝 **Información a Recolectar**

### **En Console:**
- Stock del producto cargado
- Stock en formulario
- Datos enviados al servidor

### **En Network:**
- Payload de la petición PUT
- Respuesta del servidor
- Headers de la petición

## 🎯 **Hipótesis**

El problema podría estar en:
1. **Frontend:** Datos se envían incorrectamente
2. **Backend:** Proceso de historial modifica valores
3. **Base de datos:** Triggers o constraints

## 📋 **Próximos Pasos**

1. **Hacer commit y push** de los cambios
2. **Reproducir el bug** con herramientas de desarrollador abiertas
3. **Compartir logs** de console y network
4. **Identificar punto exacto** donde se modifica el valor
