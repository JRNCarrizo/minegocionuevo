# 🚀 Guía de Desarrollo - miNegocio Backend

## 📋 Scripts Disponibles

### 🔧 **Desarrollo Local**

1. **`switch-to-development.bat`** - H2 en memoria
   - Base de datos temporal (se pierde al reiniciar)
   - Ideal para pruebas rápidas
   - URL: http://localhost:8080
   - H2 Console: http://localhost:8080/h2-console

2. **`run-h2-persistent.bat`** - H2 persistente
   - Base de datos guardada en `./data/h2-db.mv.db`
   - Los datos se mantienen entre reinicios
   - Ideal para desarrollo continuo
   - URL: http://localhost:8080
   - H2 Console: http://localhost:8080/h2-console

3. **`clear-h2-data.bat`** - Limpiar datos H2
   - Elimina todos los archivos de base de datos H2
   - Útil para empezar desde cero

### 🚀 **Producción**

4. **`switch-to-production.bat`** - Modo Railway
   - Conecta a PostgreSQL en Railway
   - Para probar configuración de producción localmente

## 🔗 **Acceso a H2 Console**

- **URL**: http://localhost:8080/h2-console
- **JDBC URL**: 
  - Memoria: `jdbc:h2:mem:testdb`
  - Persistente: `jdbc:h2:file:./data/h2-db`
- **Usuario**: `sa`
- **Contraseña**: `password`

## 📁 **Estructura de Archivos**

```
backend/
├── data/                    # Base de datos H2 persistente
│   └── h2-db.mv.db         # Archivo de base de datos
├── uploads/                 # Archivos subidos (desarrollo)
├── switch-to-development.bat
├── run-h2-persistent.bat
├── switch-to-production.bat
├── clear-h2-data.bat
└── README-DESARROLLO.md
```

## ⚡ **Comandos Manuales**

### Desarrollo con H2 en memoria:
```bash
mvnw spring-boot:run -Dspring.profiles.active=h2
```

### Desarrollo con H2 persistente:
```bash
mvnw spring-boot:run -Dspring.profiles.active=h2-persistent
```

### Producción (Railway):
```bash
mvnw spring-boot:run -Dspring.profiles.active=railway
```

## 🔄 **Flujo de Trabajo Recomendado**

1. **Desarrollo diario**: Usar `run-h2-persistent.bat`
2. **Pruebas rápidas**: Usar `switch-to-development.bat`
3. **Antes de hacer push**: Usar `switch-to-production.bat` para verificar
4. **Limpiar datos**: Usar `clear-h2-data.bat` cuando sea necesario

## ⚠️ **Notas Importantes**

- Los datos de H2 son **independientes** de la base de datos de producción
- Para desarrollo, usa siempre H2 (no PostgreSQL local)
- Antes de hacer push a producción, verifica que funcione con Railway
- Los archivos de H2 persistente se guardan en `./data/`

## 🆘 **Solución de Problemas**

### Error de puerto ocupado:
```bash
taskkill /f /im java.exe
```

### Limpiar cache de Maven:
```bash
mvnw clean
```

### Verificar perfiles activos:
- Los logs mostrarán qué perfil está activo
- Busca: "No active profile set, falling back to..." 