-- Crear tabla de roturas y pérdidas
CREATE TABLE roturas_perdidas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    cantidad INT NOT NULL,
    observaciones VARCHAR(1000),
    empresa_id BIGINT NOT NULL,
    producto_id BIGINT,
    descripcion_producto VARCHAR(500),
    codigo_personalizado VARCHAR(100),
    usuario_id BIGINT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_roturas_perdidas_empresa_fecha ON roturas_perdidas(empresa_id, fecha);
CREATE INDEX idx_roturas_perdidas_fecha ON roturas_perdidas(fecha);
CREATE INDEX idx_roturas_perdidas_producto ON roturas_perdidas(producto_id);
CREATE INDEX idx_roturas_perdidas_usuario ON roturas_perdidas(usuario_id);
