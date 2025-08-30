# 🔧 Configuración de Desarrollo - Persistencia de Datos

## 🚨 **Problema Identificado:**

### **Comportamiento Incorrecto:**
- Los datos no persistían entre reinicios del servidor
- La base de datos se recreaba cada vez que se iniciaba la aplicación
- Se perdían todos los datos de desarrollo

### **Causa del Problema:**
```properties
# ❌ Configuración problemática en application.properties
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.properties.hibernate.hbm2ddl.auto=create-drop
spring.datasource.url=jdbc:h2:mem:testdb
```

---

## ✅ **Solución Implementada:**

### **1. Archivo Principal (`application.properties`):**
```properties
# ✅ Configuración corregida
spring.jpa.hibernate.ddl-auto=${SPRING_JPA_HIBERNATE_DDL_AUTO:update}
spring.jpa.properties.hibernate.hbm2ddl.auto=${SPRING_JPA_HIBERNATE_DDL_AUTO:update}
spring.datasource.url=${SPRING_DATASOURCE_URL:jdbc:h2:file:./data/dev-database;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE}
```

### **2. Perfil de Desarrollo (`application-dev-persistent.properties`):**
```properties
# ✅ Configuración específica para desarrollo persistente
spring.datasource.url=jdbc:h2:file:./data/dev-database
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

---

## 🎯 **Diferencias Clave:**

### **❌ Antes (Sin Persistencia):**
```properties
spring.jpa.hibernate.ddl-auto=create-drop    # Elimina y recrea la BD
spring.datasource.url=jdbc:h2:mem:testdb    # Base de datos en memoria
```

### **✅ Ahora (Con Persistencia):**
```properties
spring.jpa.hibernate.ddl-auto=update         # Actualiza la BD existente
spring.datasource.url=jdbc:h2:file:./data/dev-database  # Base de datos en archivo
```

---

## 🚀 **Cómo Usar:**

### **1. Iniciar el Backend con Persistencia:**
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev-persistent
```

### **2. Verificar que Funciona:**
- Crear algunos datos (usuarios, productos, etc.)
- Detener el servidor (`Ctrl+C`)
- Reiniciar el servidor con el mismo comando
- Verificar que los datos siguen ahí

### **3. Acceder a la Consola H2:**
```
URL: http://localhost:8080/h2-console
JDBC URL: jdbc:h2:file:./data/dev-database
Usuario: sa
Contraseña: dev123
```

---

## 📁 **Estructura de Archivos:**

```
backend/
├── data/
│   ├── dev-database.mv.db          # Base de datos H2 persistente
│   └── dev-database.trace.db       # Archivos de traza (si existen)
├── src/main/resources/
│   ├── application.properties              # Configuración base
│   └── application-dev-persistent.properties  # Perfil de desarrollo
```

---

## 🔧 **Configuraciones Importantes:**

### **1. Base de Datos:**
- **Tipo**: H2 File-based (persistente)
- **Ubicación**: `./data/dev-database`
- **Modo**: `update` (no elimina datos existentes)

### **2. JPA/Hibernate:**
- **DDL Auto**: `update` (actualiza esquema sin eliminar datos)
- **Show SQL**: `true` (muestra consultas SQL en consola)
- **Format SQL**: `true` (formatea consultas para mejor legibilidad)

### **3. Consola H2:**
- **Habilitada**: `true`
- **Path**: `/h2-console`
- **Acceso**: Permitido desde cualquier origen

---

## 🧪 **Verificación:**

### **Para Confirmar que Funciona:**

1. **Iniciar el servidor:**
   ```bash
   mvn spring-boot:run -Dspring-boot.run.profiles=dev-persistent
   ```

2. **Crear datos de prueba:**
   - Crear un usuario
   - Crear algunos productos
   - Crear una empresa

3. **Detener el servidor:**
   ```bash
   Ctrl+C
   ```

4. **Reiniciar el servidor:**
   ```bash
   mvn spring-boot:run -Dspring-boot.run.profiles=dev-persistent
   ```

5. **Verificar persistencia:**
   - Los datos creados deben seguir ahí
   - No debe aparecer "create-drop" en los logs

---

## 🚨 **Troubleshooting:**

### **Si los datos siguen sin persistir:**

1. **Verificar el perfil activo:**
   ```bash
   # En los logs debe aparecer:
   The following profiles are active: dev-persistent
   ```

2. **Verificar la URL de la base de datos:**
   ```bash
   # En los logs debe aparecer:
   H2 console available at '/h2-console'. Database available at 'jdbc:h2:file:./data/dev-database'
   ```

3. **Verificar que no hay conflictos:**
   - No debe haber variables de entorno `SPRING_JPA_HIBERNATE_DDL_AUTO=create-drop`
   - No debe haber variables de entorno `SPRING_DATASOURCE_URL` que sobrescriban la configuración

4. **Limpiar y reconstruir:**
   ```bash
   mvn clean
   mvn spring-boot:run -Dspring-boot.run.profiles=dev-persistent
   ```

---

## 📝 **Notas Importantes:**

### **1. Variables de Entorno:**
- Las variables de entorno tienen prioridad sobre los archivos de propiedades
- Verificar que no haya variables que sobrescriban la configuración

### **2. Múltiples Perfiles:**
- El perfil `dev-persistent` está específicamente diseñado para desarrollo local
- Para producción, se usan las variables de Railway automáticamente

### **3. Backup de Datos:**
- Los datos se guardan en `./data/dev-database.mv.db`
- Hacer backup de este archivo si es necesario

---

**✅ Problema resuelto. Los datos ahora persistirán entre reinicios del servidor en desarrollo.**
