# 🚀 Guía para Ejecutar el Backend

## Prerrequisitos

Antes de ejecutar el backend, asegúrate de tener instalado:

1. **Java 17 o superior**
   ```powershell
   java -version
   ```

2. **Maven** (opcional, ya que el proyecto incluye Maven Wrapper)
   ```powershell
   mvn -version
   ```

## 📂 Estructura del Proyecto

El backend está ubicado en la raíz del proyecto `miNegocio/` y tiene esta estructura:

```
miNegocio/
├── src/main/java/com/minegocio/backend/
│   ├── MiNegocioBackendApplication.java    # Clase principal
│   ├── configuracion/                      # Configuraciones
│   ├── controladores/                      # REST Controllers
│   ├── dto/                               # Data Transfer Objects
│   ├── entidades/                         # Entidades JPA
│   ├── repositorios/                      # Repositorios JPA
│   ├── seguridad/                         # Configuración de seguridad
│   └── servicios/                         # Lógica de negocio
├── src/main/resources/
│   ├── application.properties             # Configuración principal
│   └── data.sql                          # Datos de prueba (opcional)
├── pom.xml                               # Dependencias Maven
├── mvnw.cmd                              # Maven Wrapper (Windows)
└── mvnw                                  # Maven Wrapper (Unix)
```

## 🎯 Cómo Ejecutar el Backend

### **Opción 1: Con Maven Wrapper (Recomendado)**

1. **Abrir PowerShell/CMD en la carpeta del proyecto:**
   ```powershell
   cd "C:\Users\Usuario\Desktop\miNegocio"
   ```

2. **Ejecutar con Maven Wrapper:**
   ```powershell
   # En Windows
   .\mvnw.cmd spring-boot:run
   
   # O también puedes usar:
   .\mvnw.cmd clean spring-boot:run
   ```

### **Opción 2: Con Maven instalado globalmente**

```powershell
cd "C:\Users\Usuario\Desktop\miNegocio"
mvn spring-boot:run
```

### **Opción 3: Compilar y ejecutar JAR**

```powershell
# Compilar el proyecto
.\mvnw.cmd clean package

# Ejecutar el JAR generado
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

### **Opción 4: Desde tu IDE**

1. **IntelliJ IDEA / Eclipse:**
   - Importar como proyecto Maven
   - Ejecutar la clase `MiNegocioBackendApplication.java`

2. **VS Code:**
   - Instalar extensión "Spring Boot Extension Pack"
   - Abrir la carpeta del proyecto
   - Ejecutar desde la paleta de comandos: "Spring Boot: Run"

## 🔧 Configuración

### **Base de Datos**
- **Desarrollo**: H2 en memoria (no requiere instalación)
- **Consola H2**: http://localhost:8080/h2-console
  - URL: `jdbc:h2:mem:minegocio_db`
  - Usuario: `sa`
  - Contraseña: (vacía)

### **Puertos**
- **Backend API**: http://localhost:8080
- **Frontend**: http://localhost:5173

## ✅ Verificar que funciona

Una vez ejecutado, deberías ver en la consola:

```
Started MiNegocioBackendApplication in X.XXX seconds
```

### **Endpoints de prueba:**

1. **Salud de la aplicación:**
   ```
   GET http://localhost:8080/actuator/health
   ```

2. **API de empresas:**
   ```
   GET http://localhost:8080/api/empresas
   ```

3. **Consola H2:**
   ```
   http://localhost:8080/h2-console
   ```

## 🐛 Solución de Problemas

### **Error: Java no encontrado**
```powershell
# Verificar instalación de Java
java -version

# Si no está instalado, descargar desde:
# https://adoptium.net/temurin/releases/
```

### **Error: Puerto 8080 ocupado**
- Cambiar puerto en `application.properties`:
  ```properties
  server.port=8081
  ```

### **Error: Permisos de Maven Wrapper**
```powershell
# En Windows, ejecutar PowerShell como administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### **Error: Dependencias**
```powershell
# Limpiar y reinstalar dependencias
.\mvnw.cmd clean install
```

## 🔄 Desarrollo

### **Reinicio automático**
El backend incluye Spring Boot DevTools para reinicio automático cuando cambies archivos.

### **Hot Reload**
Los cambios en archivos `.java` reiniciarán automáticamente la aplicación.

### **Logs**
Los logs aparecerán en la consola. Para cambiar el nivel:
```properties
# En application.properties
logging.level.com.minegocio=DEBUG
```

## 🌐 Integración con Frontend

Una vez que ambos estén ejecutándose:

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8080
- **API Base URL**: http://localhost:8080/api

El frontend ya está configurado para conectarse al backend en esta URL.

## 📊 Monitoreo

### **Actuator Endpoints:**
- Health: http://localhost:8080/actuator/health
- Info: http://localhost:8080/actuator/info
- Metrics: http://localhost:8080/actuator/metrics

¡Listo! Con estos pasos deberías poder ejecutar el backend sin problemas.
