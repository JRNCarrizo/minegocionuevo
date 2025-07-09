# Estructura del Proyecto miNegocio

## Descripción
Este es un sistema de gestión de negocios multi-tenant con arquitectura separada entre frontend y backend.

## Estructura de Carpetas

```
miNegocio/
├── src/                           # Backend (Java Spring Boot)
│   ├── main/
│   │   ├── java/
│   │   │   └── com/minegocio/backend/
│   │   │       ├── controladores/     # Controladores REST
│   │   │       ├── servicios/         # Lógica de negocio
│   │   │       ├── repositorios/      # Acceso a datos
│   │   │       ├── entidades/         # Entidades JPA
│   │   │       ├── dto/               # Data Transfer Objects
│   │   │       ├── seguridad/         # Configuración de seguridad
│   │   │       ├── configuracion/     # Configuraciones
│   │   │       └── util/              # Utilidades
│   │   └── resources/
│   │       └── application.properties
│   └── test/                          # Tests del backend
├── frontend/                          # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/                # Componentes reutilizables
│   │   ├── pages/                     # Páginas/Vistas
│   │   ├── hooks/                     # Hooks personalizados
│   │   ├── services/                  # Servicios API
│   │   ├── types/                     # Tipos TypeScript
│   │   ├── store/                     # Estado global
│   │   └── styles/                    # Estilos
│   ├── public/                        # Archivos públicos
│   └── package.json                   # Dependencias frontend
├── data/                              # Scripts SQL
├── target/                            # Archivos compilados Java
├── pom.xml                            # Configuración Maven
└── README.md                          # Documentación principal
```

## Comandos Principales

### Backend (desde la raíz del proyecto)
```bash
# Compilar
mvn clean compile

# Ejecutar
mvn spring-boot:run

# Crear JAR
mvn clean package
```

### Frontend (desde /frontend)
```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Compilar para producción
npm run build
```

## Puertos
- Backend: http://localhost:8080
- Frontend: http://localhost:5173

## Notas Importantes
- El backend está configurado como un proyecto Maven en la raíz
- El frontend es un proyecto Vite independiente en la carpeta `/frontend`
- Se eliminó la carpeta `/backend` duplicada para evitar confusión
- Los endpoints públicos están en `/api/publico/{subdominio}/`
- Los endpoints de administración están en `/api/`
