-- Crear tabla para almacenar reconteos sin modificar datos originales
CREATE TABLE reconteo_detalle (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conteo_sector_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    numero_reconteo INT NOT NULL,
    cantidad_reconteo INT,
    formula_calculo VARCHAR(500),
    observaciones VARCHAR(1000),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    eliminado BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (conteo_sector_id) REFERENCES conteo_sector(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Crear índices por separado (sintaxis compatible con H2)
CREATE INDEX idx_reconteo_sector_producto ON reconteo_detalle (conteo_sector_id, producto_id);
CREATE INDEX idx_reconteo_sector_numero ON reconteo_detalle (conteo_sector_id, numero_reconteo);
CREATE INDEX idx_reconteo_usuario ON reconteo_detalle (usuario_id, conteo_sector_id);
CREATE INDEX idx_reconteo_eliminado ON reconteo_detalle (eliminado);
