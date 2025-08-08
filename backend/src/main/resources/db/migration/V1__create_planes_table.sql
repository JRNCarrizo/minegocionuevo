-- Crear tabla planes
CREATE TABLE planes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    periodo VARCHAR(20) NOT NULL, -- MENSUAL, ANUAL
    activo BOOLEAN DEFAULT true,
    destacado BOOLEAN DEFAULT false,
    orden INT DEFAULT 0,
    max_productos INT DEFAULT -1, -- -1 = sin límite
    max_usuarios INT DEFAULT -1,
    max_clientes INT DEFAULT -1,
    max_almacenamiento_gb INT DEFAULT 5,
    personalizacion_completa BOOLEAN DEFAULT false,
    estadisticas_avanzadas BOOLEAN DEFAULT false,
    soporte_prioritario BOOLEAN DEFAULT false,
    integraciones_avanzadas BOOLEAN DEFAULT false,
    backup_automatico BOOLEAN DEFAULT false,
    dominio_personalizado BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
); 