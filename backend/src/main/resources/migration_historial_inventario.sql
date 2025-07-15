-- Migración para crear la tabla historial_inventario
-- Esta tabla registra todos los cambios de inventario

CREATE TABLE IF NOT EXISTS historial_inventario (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relaciones con otras entidades
    producto_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    empresa_id BIGINT NOT NULL,
    
    -- Información de la operación
    tipo_operacion VARCHAR(50) NOT NULL, -- 'INCREMENTO', 'DECREMENTO', 'AJUSTE', 'INVENTARIO_FISICO'
    cantidad INT NOT NULL,
    stock_anterior INT,
    stock_nuevo INT,
    
    -- Información financiera
    precio_unitario DECIMAL(10,2),
    valor_total DECIMAL(10,2),
    
    -- Información adicional
    observacion VARCHAR(500),
    codigo_barras VARCHAR(50),
    metodo_entrada VARCHAR(100), -- 'cámara', 'manual', 'usb'
    
    -- Timestamps
    fecha_operacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices para mejorar el rendimiento
    INDEX idx_empresa_id (empresa_id),
    INDEX idx_producto_id (producto_id),
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_fecha_operacion (fecha_operacion),
    INDEX idx_tipo_operacion (tipo_operacion),
    INDEX idx_codigo_barras (codigo_barras),
    
    -- Claves foráneas
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- Comentarios para documentar la tabla
ALTER TABLE historial_inventario COMMENT = 'Registra el historial de todas las operaciones de inventario';

-- Comentarios para las columnas
ALTER TABLE historial_inventario 
    MODIFY COLUMN tipo_operacion VARCHAR(50) NOT NULL COMMENT 'Tipo de operación: INCREMENTO, DECREMENTO, AJUSTE, INVENTARIO_FISICO',
    MODIFY COLUMN cantidad INT NOT NULL COMMENT 'Cantidad movida en la operación',
    MODIFY COLUMN stock_anterior INT COMMENT 'Stock antes de la operación',
    MODIFY COLUMN stock_nuevo INT COMMENT 'Stock después de la operación',
    MODIFY COLUMN precio_unitario DECIMAL(10,2) COMMENT 'Precio unitario del producto al momento de la operación',
    MODIFY COLUMN valor_total DECIMAL(10,2) COMMENT 'Valor total de la operación (precio_unitario * cantidad)',
    MODIFY COLUMN observacion VARCHAR(500) COMMENT 'Observaciones adicionales sobre la operación',
    MODIFY COLUMN codigo_barras VARCHAR(50) COMMENT 'Código de barras escaneado (si aplica)',
    MODIFY COLUMN metodo_entrada VARCHAR(100) COMMENT 'Método de entrada: cámara, manual, usb',
    MODIFY COLUMN fecha_operacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de la operación'; 