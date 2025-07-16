-- Migración para crear las tablas de inventario físico

-- Crear tabla inventario_fisico
CREATE TABLE IF NOT EXISTS inventario_fisico (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relaciones con otras entidades
    empresa_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    
    -- Información del inventario
    fecha_inventario TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_productos INT,
    productos_con_diferencias INT,
    valor_total_diferencias DECIMAL(10,2),
    porcentaje_precision DOUBLE,
    estado VARCHAR(50) DEFAULT 'EN_PROGRESO',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Claves foráneas
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Crear índices después de la tabla inventario_fisico
CREATE INDEX IF NOT EXISTS idx_empresa_id ON inventario_fisico(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuario_id ON inventario_fisico(usuario_id);
CREATE INDEX IF NOT EXISTS idx_fecha_inventario ON inventario_fisico(fecha_inventario);
CREATE INDEX IF NOT EXISTS idx_estado ON inventario_fisico(estado);

-- Crear tabla detalle_inventario_fisico
CREATE TABLE IF NOT EXISTS detalle_inventario_fisico (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relaciones con otras entidades
    inventario_fisico_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    
    -- Información del producto
    codigo_producto VARCHAR(50),
    nombre_producto VARCHAR(255),
    stock_real INT,
    stock_escaneado INT,
    diferencia INT,
    precio_unitario DECIMAL(10,2),
    categoria VARCHAR(100),
    marca VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Claves foráneas
    FOREIGN KEY (inventario_fisico_id) REFERENCES inventario_fisico(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- Crear índices después de la tabla detalle_inventario_fisico
CREATE INDEX IF NOT EXISTS idx_inventario_fisico_id ON detalle_inventario_fisico(inventario_fisico_id);
CREATE INDEX IF NOT EXISTS idx_producto_id ON detalle_inventario_fisico(producto_id);
CREATE INDEX IF NOT EXISTS idx_codigo_producto ON detalle_inventario_fisico(codigo_producto);

-- Comentarios sobre las tablas
COMMENT ON TABLE inventario_fisico IS 'Tabla que almacena los inventarios físicos completos realizados por los usuarios';
COMMENT ON TABLE detalle_inventario_fisico IS 'Tabla que almacena los detalles de cada producto en un inventario físico';

-- Comentarios sobre las columnas principales
COMMENT ON COLUMN inventario_fisico.total_productos IS 'Número total de productos en el inventario';
COMMENT ON COLUMN inventario_fisico.productos_con_diferencias IS 'Número de productos que tienen diferencias entre stock real y escaneado';
COMMENT ON COLUMN inventario_fisico.valor_total_diferencias IS 'Valor monetario total de las diferencias encontradas';
COMMENT ON COLUMN inventario_fisico.porcentaje_precision IS 'Porcentaje de precisión del inventario (0-100)';
COMMENT ON COLUMN inventario_fisico.estado IS 'Estado del inventario: EN_PROGRESO, COMPLETADO';

COMMENT ON COLUMN detalle_inventario_fisico.stock_real IS 'Stock real del producto según el sistema';
COMMENT ON COLUMN detalle_inventario_fisico.stock_escaneado IS 'Stock contado durante el inventario físico';
COMMENT ON COLUMN detalle_inventario_fisico.diferencia IS 'Diferencia entre stock escaneado y real (escaneado - real)'; 