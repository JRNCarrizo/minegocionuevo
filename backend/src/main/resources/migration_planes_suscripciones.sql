-- Eliminar tablas existentes si existen
DROP TABLE IF EXISTS suscripciones;
DROP TABLE IF EXISTS planes;

-- Crear tabla de planes
CREATE TABLE planes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(500),
    precio DECIMAL(10,2) NOT NULL,
    periodo VARCHAR(20) NOT NULL DEFAULT 'MENSUAL',
    activo BOOLEAN DEFAULT TRUE,
    destacado BOOLEAN DEFAULT FALSE,
    orden INT DEFAULT 0,
    
    -- Límites del plan
    max_productos INT,
    max_usuarios INT,
    max_clientes INT,
    max_almacenamiento_gb INT,
    
    -- Características del plan
    personalizacion_completa BOOLEAN DEFAULT FALSE,
    estadisticas_avanzadas BOOLEAN DEFAULT FALSE,
    soporte_prioritario BOOLEAN DEFAULT FALSE,
    integraciones_avanzadas BOOLEAN DEFAULT FALSE,
    backup_automatico BOOLEAN DEFAULT FALSE,
    dominio_personalizado BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear tabla de suscripciones
CREATE TABLE suscripciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    empresa_id BIGINT NOT NULL,
    plan_id BIGINT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    
    -- Fechas importantes
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP,
    fecha_cancelacion TIMESTAMP,
    fecha_renovacion TIMESTAMP,
    
    -- Información de pago
    precio DECIMAL(10,2),
    moneda VARCHAR(3) DEFAULT 'USD',
    metodo_pago VARCHAR(50),
    referencia_pago VARCHAR(100),
    facturado BOOLEAN DEFAULT FALSE,
    
    -- Configuración de renovación
    renovacion_automatica BOOLEAN DEFAULT TRUE,
    notificar_antes_renovacion BOOLEAN DEFAULT TRUE,
    dias_notificacion_renovacion INT DEFAULT 7,
    
    -- Información adicional
    notas VARCHAR(1000),
    motivo_cancelacion VARCHAR(500),
    
    -- Timestamps
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES planes(id) ON DELETE CASCADE
);

-- Insertar planes de ejemplo
INSERT INTO planes (nombre, descripcion, precio, periodo, activo, destacado, orden, 
                   max_productos, max_usuarios, max_clientes, max_almacenamiento_gb,
                   personalizacion_completa, estadisticas_avanzadas, soporte_prioritario,
                   integraciones_avanzadas, backup_automatico, dominio_personalizado) VALUES

-- Plan Gratuito (Prueba)
('Prueba Gratuita', 'Perfecto para empezar y probar la plataforma', 0.00, 'MENSUAL', true, true, 1,
 100, 1, 500, 1,
 false, false, false, false, false, false),

-- Plan Básico
('Básico', 'Ideal para pequeños negocios que están comenzando', 29.99, 'MENSUAL', true, false, 2,
 1000, 3, 2000, 5,
 true, false, false, false, false, false),

-- Plan Profesional
('Profesional', 'Para negocios en crecimiento que necesitan más funcionalidades', 59.99, 'MENSUAL', true, true, 3,
 5000, 10, 10000, 20,
 true, true, true, false, true, false),

-- Plan Enterprise
('Enterprise', 'Solución completa para grandes empresas', 149.99, 'MENSUAL', true, false, 4,
 -1, -1, -1, 100,
 true, true, true, true, true, true),

-- Plan Anual Básico (con descuento)
('Básico Anual', 'Plan básico con descuento por pago anual', 299.99, 'ANUAL', true, false, 5,
 1000, 3, 2000, 5,
 true, false, false, false, false, false),

-- Plan Anual Profesional (con descuento)
('Profesional Anual', 'Plan profesional con descuento por pago anual', 599.99, 'ANUAL', true, false, 6,
 5000, 10, 10000, 20,
 true, true, true, false, true, false);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_suscripciones_empresa_estado ON suscripciones(empresa_id, estado);
CREATE INDEX idx_suscripciones_fecha_fin ON suscripciones(fecha_fin);
CREATE INDEX idx_suscripciones_estado ON suscripciones(estado);
CREATE INDEX idx_planes_activo_orden ON planes(activo, orden);
CREATE INDEX idx_planes_destacado ON planes(destacado); 