# 🔧 Instrucciones para Aplicar la Migración de Base de Datos

## 📋 Problema Actual
El error `Columna "DPD1_0.ESTADO_PRODUCTO" no encontrada` indica que la columna `estado_producto` no existe en la tabla `detalle_planillas_devoluciones` en la base de datos de producción.

## ✅ Solución

### 1. **Aplicar la Migración SQL**

Ejecutar el siguiente script SQL en la base de datos de producción:

```sql
-- Agregar la columna estado_producto con valor por defecto 'BUEN_ESTADO'
ALTER TABLE detalle_planillas_devoluciones 
ADD COLUMN estado_producto VARCHAR(20) NOT NULL DEFAULT 'BUEN_ESTADO';

-- Crear un índice para mejorar el rendimiento de consultas por estado
CREATE INDEX idx_detalle_planillas_devoluciones_estado 
ON detalle_planillas_devoluciones(estado_producto);
```

### 2. **Verificar la Migración**

Ejecutar esta consulta para verificar que la columna se agregó correctamente:

```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'detalle_planillas_devoluciones' 
AND column_name = 'estado_producto';
```

### 3. **Reiniciar el Backend**

Después de aplicar la migración, reiniciar el backend para que los cambios tomen efecto.

## 🔄 Comportamiento Temporal

Mientras se aplica la migración, el sistema:

- ✅ **Funcionará normalmente** con el comportamiento anterior
- ✅ **Mostrará warnings** en los logs sobre la columna faltante
- ✅ **Usará "BUEN_ESTADO"** como valor por defecto para todos los productos
- ✅ **Sumará al stock** todos los productos (comportamiento anterior)

## 🎯 Después de la Migración

Una vez aplicada la migración:

- ✅ **Nueva funcionalidad disponible**: Selección de estado de productos
- ✅ **Stock inteligente**: Solo productos en buen estado afectan el stock
- ✅ **Reportes mejorados**: Trazabilidad de productos rotos/mal estado

## 📞 Soporte

Si tienes problemas aplicando la migración, contacta al equipo de desarrollo.

---

**⚠️ IMPORTANTE**: Hacer backup de la base de datos antes de aplicar cualquier migración.
