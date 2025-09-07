-- Script para crear las tablas de remitos de ingreso
-- Ejecutar en la consola H2: http://localhost:8080/h2-console

-- Tabla principal de remitos de ingreso
CREATE TABLE IF NOT EXISTS remitos_ingreso (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    numero_remito VARCHAR(255) NOT NULL UNIQUE,
    fecha_remito TIMESTAMP NOT NULL,
    observaciones TEXT,
    total_productos INTEGER NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL,
    fecha_actualizacion TIMESTAMP,
    empresa_id BIGINT NOT NULL,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

-- Tabla de detalles de remitos de ingreso
CREATE TABLE IF NOT EXISTS detalles_remito_ingreso (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    remito_ingreso_id BIGINT NOT NULL,
    producto_id BIGINT,
    codigo_personalizado VARCHAR(255),
    descripcion VARCHAR(500) NOT NULL,
    cantidad INTEGER NOT NULL,
    observaciones TEXT,
    fecha_creacion TIMESTAMP NOT NULL,
    FOREIGN KEY (remito_ingreso_id) REFERENCES remitos_ingreso(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_remitos_ingreso_empresa ON remitos_ingreso(empresa_id);
CREATE INDEX IF NOT EXISTS idx_remitos_ingreso_fecha ON remitos_ingreso(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_detalles_remito_ingreso_remito ON detalles_remito_ingreso(remito_ingreso_id);
CREATE INDEX IF NOT EXISTS idx_detalles_remito_ingreso_producto ON detalles_remito_ingreso(producto_id);



















