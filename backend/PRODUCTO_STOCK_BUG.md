# 🐛 Bug: Actualización Incorrecta de Stock en Productos

## 🚨 **Problema Reportado**
- Usuario cambia stock de 4 a 10
- Al guardar, se actualiza con 16 (valor incorrecto)
- Los valores se modifican de manera inesperada

## 🎯 **Posibles Causas**

### **1. Problema en el Frontend**
- Los datos se están enviando incorrectamente
- Hay algún cálculo o transformación errónea

### **2. Problema en el Backend**
- El método `actualizarProducto` no está manejando correctamente el stock
- Hay algún proceso de historial que está modificando los valores

### **3. Problema en la Base de Datos**
- Triggers o constraints que modifican los valores
- Problemas de concurrencia

## ✅ **Debug Aplicado**

### **Logging Agregado en ProductoService.java**
```java
// Antes de establecer el stock
System.out.println("🔍 Stock anterior: " + producto.getStock());
System.out.println("🔍 Stock nuevo recibido: " + productoDTO.getStock());

// Después de establecer el stock
System.out.println("🔍 Stock establecido: " + producto.getStock());

// Después de guardar en BD
System.out.println("🔍 Stock en producto guardado: " + productoActualizado.getStock());

// En el historial
System.out.println("🔍 Diferencia: " + (productoDTO.getStock() - stockAnterior));
```

## 🔍 **Pasos para Reproducir**

1. Editar un producto
2. Cambiar el stock (ej: de 4 a 10)
3. Guardar
4. Verificar los logs en Railway
5. Verificar el valor final en la base de datos

## 📝 **Próximos Pasos**

1. **Hacer commit y push** de los cambios de logging
2. **Reproducir el bug** con el usuario
3. **Revisar los logs** para identificar dónde se modifica el valor
4. **Aplicar la corrección** específica

## 🎯 **Hipótesis Principal**

El problema probablemente está en:
- El proceso de historial de inventario
- Algún trigger de base de datos
- Un problema de concurrencia
- Un error en el cálculo de diferencias
