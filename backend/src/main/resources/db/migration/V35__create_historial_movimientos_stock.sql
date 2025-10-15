-- Crear tabla de historial de movimientos de stock
CREATE TABLE historial_movimientos_stock (
    id BIGSERIAL PRIMARY KEY,
    producto_id BIGINT NOT NULL,
    sector_origen_id BIGINT,
    sector_destino_id BIGINT,
    cantidad INTEGER NOT NULL,
    tipo_movimiento VARCHAR(20) NOT NULL,
    usuario_id BIGINT NOT NULL,
    empresa_id BIGINT NOT NULL,
    fecha_movimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT,
    
    -- Foreign keys
    CONSTRAINT fk_historial_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
    CONSTRAINT fk_historial_sector_origen FOREIGN KEY (sector_origen_id) REFERENCES sectores(id),
    CONSTRAINT fk_historial_sector_destino FOREIGN KEY (sector_destino_id) REFERENCES sectores(id),
    CONSTRAINT fk_historial_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_historial_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id),
    
    -- Check constraints
    CONSTRAINT chk_historial_cantidad_positiva CHECK (cantidad > 0),
    CONSTRAINT chk_historial_tipo_movimiento CHECK (tipo_movimiento IN ('TRANSFERENCIA', 'RECEPCION', 'ASIGNACION', 'REMOCION')),
    CONSTRAINT chk_historial_sectores_diferentes CHECK (sector_origen_id != sector_destino_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_historial_empresa_fecha ON historial_movimientos_stock(empresa_id, fecha_movimiento DESC);
CREATE INDEX idx_historial_sector_origen ON historial_movimientos_stock(sector_origen_id, fecha_movimiento DESC);
CREATE INDEX idx_historial_sector_destino ON historial_movimientos_stock(sector_destino_id, fecha_movimiento DESC);
CREATE INDEX idx_historial_producto ON historial_movimientos_stock(producto_id, fecha_movimiento DESC);
CREATE INDEX idx_historial_usuario ON historial_movimientos_stock(usuario_id, fecha_movimiento DESC);
CREATE INDEX idx_historial_tipo_movimiento ON historial_movimientos_stock(tipo_movimiento, fecha_movimiento DESC);

-- Comentarios en la tabla
COMMENT ON TABLE historial_movimientos_stock IS 'Registro de todos los movimientos de stock entre sectores';
COMMENT ON COLUMN historial_movimientos_stock.producto_id IS 'Producto que se movió';
COMMENT ON COLUMN historial_movimientos_stock.sector_origen_id IS 'Sector de origen (NULL para asignaciones desde stock general)';
COMMENT ON COLUMN historial_movimientos_stock.sector_destino_id IS 'Sector de destino (NULL para remociones hacia stock general)';
COMMENT ON COLUMN historial_movimientos_stock.cantidad IS 'Cantidad movida';
COMMENT ON COLUMN historial_movimientos_stock.tipo_movimiento IS 'Tipo de movimiento: TRANSFERENCIA, RECEPCION, ASIGNACION, REMOCION';
COMMENT ON COLUMN historial_movimientos_stock.usuario_id IS 'Usuario que realizó el movimiento';
COMMENT ON COLUMN historial_movimientos_stock.empresa_id IS 'Empresa del movimiento';
COMMENT ON COLUMN historial_movimientos_stock.fecha_movimiento IS 'Fecha y hora del movimiento';
COMMENT ON COLUMN historial_movimientos_stock.observaciones IS 'Observaciones adicionales del movimiento';
