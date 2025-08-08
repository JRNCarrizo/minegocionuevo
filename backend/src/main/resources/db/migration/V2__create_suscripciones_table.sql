-- Crear tabla suscripciones
CREATE TABLE suscripciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    empresa_id BIGINT NOT NULL,
    plan_id BIGINT NOT NULL,
    estado VARCHAR(20) NOT NULL, -- ACTIVA, SUSPENDIDA, CANCELADA, EXPIRADA
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'USD',
    facturado BOOLEAN DEFAULT false,
    renovacion_automatica BOOLEAN DEFAULT true,
    notificar_antes_renovacion BOOLEAN DEFAULT true,
    dias_notificacion_renovacion INT DEFAULT 30,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES planes(id) ON DELETE RESTRICT
); 