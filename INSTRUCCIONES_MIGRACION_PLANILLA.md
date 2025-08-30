# 🔧 Instrucciones: Migración Número de Planilla Opcional

## 🚨 **Problema Actual:**

### **Error en Producción:**
```
La columna "NUMERO_PLANILLA" no permite valores nulos (NULL)
NULL not allowed for column "NUMERO_PLANILLA"
```

### **Causa:**
La base de datos de producción **todavía tiene la restricción `NOT NULL`** en la columna `numero_planilla`, aunque el código Java ya está configurado como opcional.

---

## ✅ **Solución: Migración de Base de Datos**

### **Archivo de Migración:**
`migration_numero_planilla_opcional.sql`

### **Comando a Ejecutar:**
```sql
-- Eliminar la restricción NOT NULL
ALTER TABLE planillas_devoluciones 
ALTER COLUMN numero_planilla DROP NOT NULL;
```

---

## 🔧 **Pasos para Aplicar la Migración:**

### **1. Acceder a la Base de Datos de Producción:**
```bash
# Conectar a la base de datos de Railway
psql $DATABASE_URL
```

### **2. Ejecutar la Migración:**
```sql
-- Ejecutar el script completo
\i migration_numero_planilla_opcional.sql
```

### **3. Verificar la Migración:**
```sql
-- Verificar que la columna ahora permite NULL
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'planillas_devoluciones'
AND column_name = 'numero_planilla';
```

**Resultado Esperado:**
```
column_name     | data_type | is_nullable | column_default
----------------|-----------|-------------|----------------
numero_planilla | varchar   | YES         | null
```

---

## 🧪 **Pruebas Después de la Migración:**

### **1. Crear Registro sin Número de Planilla:**
```
📄 Número de Planilla: (vacío)
💬 Observaciones: Retiro de cliente
✅ Resultado Esperado: Registro creado exitosamente
```

### **2. Crear Registro con Número de Planilla:**
```
📄 Número de Planilla: PL00012345
💬 Observaciones: Devolución por planilla
✅ Resultado Esperado: Registro creado exitosamente
```

### **3. Verificar en Base de Datos:**
```sql
-- Verificar registros recién creados
SELECT 
    id,
    numero_planilla,
    fecha_planilla,
    observaciones
FROM planillas_devoluciones 
ORDER BY fecha_creacion DESC 
LIMIT 5;
```

---

## ⚠️ **Consideraciones Importantes:**

### **1. Backup Antes de la Migración:**
```sql
-- Crear backup de la tabla
CREATE TABLE planillas_devoluciones_backup AS 
SELECT * FROM planillas_devoluciones;
```

### **2. Horario de Aplicación:**
- **Recomendado**: Horario de bajo tráfico
- **Duración**: ~30 segundos
- **Impacto**: Mínimo (solo cambio de restricción)

### **3. Rollback (si es necesario):**
```sql
-- Restaurar la restricción NOT NULL
ALTER TABLE planillas_devoluciones 
ALTER COLUMN numero_planilla SET NOT NULL;
```

---

## 📋 **Checklist de Verificación:**

### **Antes de la Migración:**
- [ ] Backup de la base de datos creado
- [ ] Horario de bajo tráfico seleccionado
- [ ] Script de migración revisado

### **Durante la Migración:**
- [ ] Ejecutar script de migración
- [ ] Verificar que la columna permite NULL
- [ ] Confirmar que no hay errores

### **Después de la Migración:**
- [ ] Probar crear registro sin número de planilla
- [ ] Probar crear registro con número de planilla
- [ ] Verificar que ambos casos funcionan
- [ ] Confirmar que los datos existentes no se afectaron

---

## 🎯 **Resultado Esperado:**

### **Después de la Migración:**
- ✅ **Registros sin número de planilla**: Se crean exitosamente
- ✅ **Registros con número de planilla**: Siguen funcionando
- ✅ **Datos existentes**: No se afectan
- ✅ **Funcionalidad completa**: Sistema totalmente operativo

---

**⚠️ IMPORTANTE: Esta migración es necesaria para que el número de planilla sea realmente opcional. Sin ella, el sistema seguirá fallando al intentar crear registros sin número de planilla.**
