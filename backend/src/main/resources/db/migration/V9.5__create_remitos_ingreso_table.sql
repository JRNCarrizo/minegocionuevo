-- Crear tabla remitos_ingreso
CREATE TABLE remitos_ingreso (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    numero_remito VARCHAR(255) NOT NULL,
    fecha_remito TIMESTAMP NOT NULL,
    observaciones TEXT,
    total_productos INTEGER NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL,
    fecha_actualizacion TIMESTAMP,
    empresa_id BIGINT NOT NULL,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

-- Crear tabla detalles_remito_ingreso
CREATE TABLE detalles_remito_ingreso (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cantidad INTEGER NOT NULL,
    codigo_personalizado VARCHAR(255),
    descripcion VARCHAR(255) NOT NULL,
    observaciones TEXT,
    fecha_creacion TIMESTAMP NOT NULL,
    remito_ingreso_id BIGINT NOT NULL,
    producto_id BIGINT,
    FOREIGN KEY (remito_ingreso_id) REFERENCES remitos_ingreso(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_remitos_ingreso_empresa ON remitos_ingreso(empresa_id);
CREATE INDEX idx_remitos_ingreso_fecha ON remitos_ingreso(fecha_remito);
CREATE INDEX idx_detalles_remito_ingreso_remito ON detalles_remito_ingreso(remito_ingreso_id);
CREATE INDEX idx_detalles_remito_ingreso_producto ON detalles_remito_ingreso(producto_id);
