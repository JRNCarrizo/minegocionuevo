-- Migración para crear la tabla historial_carga_productos
-- Este script crea la tabla para registrar todas las operaciones de carga de productos

-- Crear tabla historial_carga_productos
CREATE TABLE IF NOT EXISTS historial_carga_productos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relaciones con otras entidades
    producto_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    empresa_id BIGINT NOT NULL,
    
    -- Información de la operación
    tipo_operacion VARCHAR(50) NOT NULL, -- 'CARGA_INICIAL', 'REPOSICION', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'DEVOLUCION', 'TRANSFERENCIA_ENTRADA', 'INVENTARIO_FISICO'
    cantidad INT NOT NULL,
    stock_anterior INT,
    stock_nuevo INT,
    
    -- Información financiera
    precio_unitario DECIMAL(10,2),
    valor_total DECIMAL(10,2),
    
    -- Información adicional
    observacion VARCHAR(500),
    codigo_barras VARCHAR(50),
    metodo_entrada VARCHAR(100), -- 'manual', 'cámara', 'usb', 'importación'
    
    -- Timestamps
    fecha_operacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP,
    
    -- Claves foráneas
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_historial_carga_empresa_id ON historial_carga_productos (empresa_id);
CREATE INDEX IF NOT EXISTS idx_historial_carga_producto_id ON historial_carga_productos (producto_id);
CREATE INDEX IF NOT EXISTS idx_historial_carga_usuario_id ON historial_carga_productos (usuario_id);
CREATE INDEX IF NOT EXISTS idx_historial_carga_fecha_operacion ON historial_carga_productos (fecha_operacion);
CREATE INDEX IF NOT EXISTS idx_historial_carga_tipo_operacion ON historial_carga_productos (tipo_operacion);
CREATE INDEX IF NOT EXISTS idx_historial_carga_codigo_barras ON historial_carga_productos (codigo_barras);

-- Comentarios sobre la tabla y columnas
COMMENT ON TABLE historial_carga_productos IS 'Registro de todas las operaciones de carga de productos para control de inventario';
COMMENT ON COLUMN historial_carga_productos.tipo_operacion IS 'Tipo de operación realizada (CARGA_INICIAL, REPOSICION, etc.)';
COMMENT ON COLUMN historial_carga_productos.cantidad IS 'Cantidad de productos en la operación';
COMMENT ON COLUMN historial_carga_productos.stock_anterior IS 'Stock antes de la operación';
COMMENT ON COLUMN historial_carga_productos.stock_nuevo IS 'Stock después de la operación';
COMMENT ON COLUMN historial_carga_productos.precio_unitario IS 'Precio unitario del producto en la operación';
COMMENT ON COLUMN historial_carga_productos.valor_total IS 'Valor total de la operación (cantidad * precio_unitario)';
COMMENT ON COLUMN historial_carga_productos.observacion IS 'Observaciones adicionales sobre la operación';
COMMENT ON COLUMN historial_carga_productos.metodo_entrada IS 'Método utilizado para ingresar los datos (manual, cámara, etc.)';
COMMENT ON COLUMN historial_carga_productos.codigo_barras IS 'Código de barras del producto (si aplica)';
COMMENT ON COLUMN historial_carga_productos.fecha_operacion IS 'Fecha y hora en que se realizó la operación'; 