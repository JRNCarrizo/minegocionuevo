# 🚀 Guía de Desarrollo Simple

## Configuración de Base de Datos

### Opción 1: H2 (Base de datos en memoria - Recomendado para desarrollo rápido)

```bash
# Ejecutar con H2
./run-h2.bat
```

**Ventajas:**
- ✅ No requiere instalación de base de datos
- ✅ Se inicia automáticamente
- ✅ Datos se pierden al reiniciar (perfecto para desarrollo)
- ✅ Consola web disponible en: http://localhost:8080/h2-console

**Configuración H2:**
- JDBC URL: `jdbc:h2:mem:testdb`
- Usuario: `sa`
- Contraseña: `password`

### Opción 2: PostgreSQL Local (Base de datos persistente)

#### 1. Instalar PostgreSQL
- Descargar desde: https://www.postgresql.org/download/
- Instalar con usuario `postgres` y contraseña `postgres`
- Puerto por defecto: `5432`

#### 2. Configurar
```bash
# Ejecutar script de configuración
./setup-postgresql.bat
```

#### 3. Ejecutar aplicación
```bash
# Ejecutar con PostgreSQL
./run-postgresql.bat
```

**Ventajas:**
- ✅ Datos persistentes
- ✅ Más similar a producción
- ✅ Mejor rendimiento con muchos datos

## Comandos Útiles

### Limpiar y recompilar
```bash
mvn clean compile
```

### Ejecutar tests
```bash
mvn test
```

### Ver dependencias
```bash
mvn dependency:tree
```

## Perfiles Disponibles

- `h2` - Base de datos H2 en memoria
- `postgresql` - Base de datos PostgreSQL local
- `railway` - Base de datos PostgreSQL en Railway (producción)

## URLs Importantes

- **Aplicación:** http://localhost:8080
- **API Docs:** http://localhost:8080/swagger-ui.html
- **Consola H2:** http://localhost:8080/h2-console (solo con perfil H2)

## Solución de Problemas

### Error: "Cannot load driver class"
```bash
# Limpiar y recompilar
mvn clean compile
```

### Error: "Connection refused" (PostgreSQL)
- Verificar que PostgreSQL esté ejecutándose
- Verificar puerto 5432
- Verificar usuario y contraseña

### Error: "Port already in use"
- Cambiar puerto en `application.properties`
- O matar proceso en puerto 8080 

# Ejecutar con perfil de producción (Railway)
mvn spring-boot:run -Dspring-boot.run.profiles=railway