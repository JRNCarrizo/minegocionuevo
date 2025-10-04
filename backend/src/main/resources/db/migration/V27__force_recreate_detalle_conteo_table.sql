-- Forzar la recreación de la tabla detalle_conteo con el esquema correcto
-- Compatible con PostgreSQL

-- Eliminar la tabla si existe (con todas sus dependencias)
DROP TABLE IF EXISTS detalle_conteo CASCADE;

-- Recrear la tabla con el esquema correcto que coincide con la entidad
CREATE TABLE detalle_conteo (
    id BIGSERIAL PRIMARY KEY,
    conteo_sector_id BIGINT NOT NULL,
    -- inventario_por_sector_id BIGINT, -- Comentado temporalmente
    producto_id BIGINT NOT NULL,
    codigo_producto VARCHAR(255),
    nombre_producto VARCHAR(255),
    stock_sistema INTEGER,
    cantidad_conteo_1 INTEGER DEFAULT 0,
    cantidad_conteo_2 INTEGER DEFAULT 0,
    cantidad_final INTEGER DEFAULT 0,
    diferencia_sistema INTEGER DEFAULT 0,
    diferencia_entre_conteos INTEGER DEFAULT 0,
    formula_calculo_1 VARCHAR(500),
    formula_calculo_2 VARCHAR(500),
    precio_unitario DECIMAL(10,2),
    valor_diferencia DECIMAL(10,2),
    categoria VARCHAR(255),
    marca VARCHAR(255),
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    observaciones TEXT,
    eliminado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conteo_sector_id) REFERENCES conteo_sector(id) ON DELETE CASCADE,
    -- FOREIGN KEY (inventario_por_sector_id) REFERENCES inventario_por_sector(id) ON DELETE CASCADE, -- Comentado temporalmente
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- Recrear índices
CREATE INDEX idx_detalle_conteo_sector ON detalle_conteo(conteo_sector_id);
CREATE INDEX idx_detalle_conteo_producto ON detalle_conteo(producto_id);
CREATE INDEX idx_detalle_conteo_eliminado ON detalle_conteo(eliminado);
CREATE INDEX idx_detalle_conteo_sector_eliminado ON detalle_conteo(conteo_sector_id, eliminado);











