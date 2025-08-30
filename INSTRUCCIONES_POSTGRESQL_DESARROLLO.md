# 🔧 Instrucciones: Migración PostgreSQL en DESARROLLO

## 🎯 **Tu Configuración:**
Estás usando **PostgreSQL de Railway** tanto en desarrollo como en producción, según tu `application.properties`.

---

## 🔧 **Pasos para Aplicar la Migración en Desarrollo:**

### **1. Verificar que el Backend esté Ejecutándose:**
```bash
# En una terminal, desde la carpeta del proyecto:
cd backend
mvn spring-boot:run
```

### **2. Conectar a la Base de Datos PostgreSQL de Railway:**

#### **Opción A: Usando psql (recomendado):**
```bash
# Conectar directamente a la base de datos de Railway
psql $SPRING_DATASOURCE_URL
```

#### **Opción B: Usando pgAdmin o DBeaver:**
- **Host**: El host de tu base de datos Railway
- **Puerto**: 5432
- **Base de datos**: Tu base de datos Railway
- **Usuario**: Tu usuario Railway
- **Contraseña**: Tu contraseña Railway

#### **Opción C: Desde Railway Dashboard:**
1. Ir a tu proyecto en Railway
2. Seleccionar la base de datos PostgreSQL
3. Ir a la pestaña "Query"
4. Ejecutar el script de migración

### **3. Ejecutar la Migración:**

#### **Copiar y Pegar el Script:**
```sql
-- Copiar todo el contenido del archivo:
-- migration_postgresql_planilla_opcional.sql
```

#### **O Ejecutar Comando Directo:**
```sql
-- Eliminar la restricción NOT NULL
ALTER TABLE planillas_devoluciones 
ALTER COLUMN numero_planilla DROP NOT NULL;

-- Verificar que funcionó
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'planillas_devoluciones'
AND column_name = 'numero_planilla';
```

### **4. Verificar la Migración:**
```sql
-- Debe mostrar: is_nullable = 'YES'
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

## 🧪 **Pruebas en Desarrollo:**

### **1. Iniciar el Frontend:**
```bash
# En otra terminal, desde la carpeta del proyecto:
cd frontend
npm run dev
```

### **2. Probar Crear Registro sin Número de Planilla:**
1. Ir a **Gestión de Devoluciones** → **Crear Devolución**
2. Dejar el campo **Número de Planilla** vacío
3. Llenar **Fecha de Planilla**
4. Agregar al menos un producto
5. Llenar **Observaciones** (opcional)
6. Hacer clic en **Crear Registro de Devolución**

**✅ Resultado Esperado:** Registro creado exitosamente

### **3. Probar Crear Registro con Número de Planilla:**
1. Llenar **Número de Planilla**: `PL00012345`
2. Llenar **Fecha de Planilla**
3. Agregar productos
4. Hacer clic en **Crear Registro de Devolución**

**✅ Resultado Esperado:** Registro creado exitosamente

---

## 🔍 **Verificación en Base de Datos:**

### **Verificar Registros Creados:**
```sql
-- Ver los últimos registros creados
SELECT 
    id,
    numero_planilla,
    fecha_planilla,
    observaciones,
    fecha_creacion
FROM planillas_devoluciones 
ORDER BY fecha_creacion DESC 
LIMIT 5;
```

### **Verificar que Funciona con NULL:**
```sql
-- Buscar registros sin número de planilla
SELECT 
    id,
    numero_planilla,
    fecha_planilla,
    observaciones
FROM planillas_devoluciones 
WHERE numero_planilla IS NULL
ORDER BY fecha_creacion DESC;
```

### **Test de Inserción con NULL:**
```sql
-- Verificar que se puede insertar con NULL (sin insertar realmente)
SELECT 
    'Test de inserción' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'planillas_devoluciones' 
            AND column_name = 'numero_planilla' 
            AND is_nullable = 'YES'
        ) 
        THEN '✅ Columna permite NULL' 
        ELSE '❌ Columna NO permite NULL' 
    END as resultado;
```

---

## ⚠️ **Solución de Problemas:**

### **Error: "Connection refused"**
```bash
# Verificar que las variables de entorno están configuradas
echo $SPRING_DATASOURCE_URL
echo $SPRING_DATASOURCE_USERNAME
echo $SPRING_DATASOURCE_PASSWORD
```

### **Error: "Table doesn't exist"**
```sql
-- Verificar que la tabla existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'planillas_devoluciones';
```

### **Error: "Permission denied"**
- Verificar que tienes permisos de administrador en la base de datos
- En Railway, esto no debería ser un problema

### **Error: "Column doesn't exist"**
```sql
-- Verificar las columnas de la tabla
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'planillas_devoluciones';
```

---

## 📋 **Checklist de Verificación:**

### **Antes de la Migración:**
- [ ] Backend ejecutándose (`mvn spring-boot:run`)
- [ ] Variables de entorno configuradas
- [ ] Conexión a PostgreSQL establecida
- [ ] Script de migración listo

### **Durante la Migración:**
- [ ] Ejecutar script de migración
- [ ] Verificar que la columna permite NULL (`is_nullable = 'YES'`)
- [ ] Confirmar que no hay errores

### **Después de la Migración:**
- [ ] Frontend ejecutándose (`npm run dev`)
- [ ] Probar crear registro sin número de planilla
- [ ] Probar crear registro con número de planilla
- [ ] Verificar en base de datos que ambos casos funcionan

---

## 🎯 **Resultado Final:**

### **✅ Funcionalidad Completa en Desarrollo:**
- **Registros sin número de planilla**: Se crean exitosamente
- **Registros con número de planilla**: Siguen funcionando
- **Interfaz actualizada**: Campos opcionales claramente marcados
- **Validaciones correctas**: Solo valida campos obligatorios

---

## 🚀 **Próximos Pasos:**

### **Una vez que funcione en desarrollo:**
1. **Probar exhaustivamente** todos los casos de uso
2. **Aplicar la misma migración en producción**
3. **Verificar que todo funciona en producción**

---

**🚀 ¡Listo! Ahora puedes probar la funcionalidad completa en desarrollo antes de aplicar la migración en producción.**
