# 🔧 Instrucciones: Migración en DESARROLLO - Número de Planilla Opcional

## 🎯 **Objetivo:**
Aplicar la migración de base de datos en tu entorno de **desarrollo local** para hacer el número de planilla opcional.

---

## 🔧 **Pasos para Aplicar la Migración en Desarrollo:**

### **1. Verificar que el Backend esté Ejecutándose:**
```bash
# En una terminal, desde la carpeta del proyecto:
cd backend
mvn spring-boot:run
```

### **2. Conectar a la Base de Datos Local:**

#### **Opción A: Si usas H2 (base de datos en memoria):**
```bash
# El backend debe estar ejecutándose
# Abrir navegador y ir a: http://localhost:8080/h2-console
# JDBC URL: jdbc:h2:mem:testdb
# Username: sa
# Password: (dejar vacío)
```

#### **Opción B: Si usas PostgreSQL local:**
```bash
# Conectar con psql
psql -h localhost -U tu_usuario -d tu_base_de_datos
```

#### **Opción C: Si usas MySQL local:**
```bash
# Conectar con mysql
mysql -h localhost -u tu_usuario -p tu_base_de_datos
```

### **3. Ejecutar la Migración:**

#### **Para H2/PostgreSQL:**
```sql
-- Copiar y pegar el contenido del archivo:
-- migration_desarrollo_planilla_opcional.sql
```

#### **Para MySQL:**
```sql
-- Para MySQL, usar este comando específico:
ALTER TABLE planillas_devoluciones 
MODIFY COLUMN numero_planilla VARCHAR(8) NULL;
```

### **4. Verificar la Migración:**
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

---

## ⚠️ **Solución de Problemas:**

### **Error: "Table doesn't exist"**
```sql
-- Verificar que la tabla existe
SHOW TABLES LIKE 'planillas_devoluciones';
-- o
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'planillas_devoluciones';
```

### **Error: "Column doesn't exist"**
```sql
-- Verificar las columnas de la tabla
DESCRIBE planillas_devoluciones;
-- o
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'planillas_devoluciones';
```

### **Error: "Permission denied"**
- Verificar que tienes permisos de administrador en la base de datos
- En H2, esto no debería ser un problema

---

## 📋 **Checklist de Verificación:**

### **Antes de la Migración:**
- [ ] Backend ejecutándose (`mvn spring-boot:run`)
- [ ] Base de datos accesible
- [ ] Script de migración listo

### **Durante la Migración:**
- [ ] Ejecutar script de migración
- [ ] Verificar que la columna permite NULL
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

**🚀 ¡Listo! Ahora puedes probar la funcionalidad completa en desarrollo antes de aplicar la migración en producción.**
