-- Crear tabla de registros de inventario
CREATE TABLE IF NOT EXISTS registros_inventario (
    id BIGSERIAL PRIMARY KEY,
    inventario_completo_id BIGINT NOT NULL,
    empresa_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    nombre_inventario VARCHAR(255) NOT NULL,
    fecha_realizacion TIMESTAMP NOT NULL,
    fecha_generacion TIMESTAMP NOT NULL,
    observaciones TEXT,
    total_productos INTEGER NOT NULL DEFAULT 0,
    productos_con_diferencias INTEGER NOT NULL DEFAULT 0,
    productos_sin_diferencias INTEGER NOT NULL DEFAULT 0,
    total_sectores INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (inventario_completo_id) REFERENCES inventario_completo(id),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Crear tabla de detalles de registros de inventario
CREATE TABLE IF NOT EXISTS detalle_registros_inventario (
    id BIGSERIAL PRIMARY KEY,
    registro_inventario_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    nombre_producto VARCHAR(255) NOT NULL,
    codigo_producto VARCHAR(100),
    stock_anterior INTEGER NOT NULL DEFAULT 0,
    stock_nuevo INTEGER NOT NULL DEFAULT 0,
    diferencia_stock INTEGER NOT NULL DEFAULT 0,
    observaciones TEXT,
    FOREIGN KEY (registro_inventario_id) REFERENCES registros_inventario(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_registros_inventario_empresa ON registros_inventario(empresa_id);
CREATE INDEX IF NOT EXISTS idx_registros_inventario_fecha_generacion ON registros_inventario(fecha_generacion DESC);
CREATE INDEX IF NOT EXISTS idx_detalle_registros_inventario_registro ON detalle_registros_inventario(registro_inventario_id);
CREATE INDEX IF NOT EXISTS idx_detalle_registros_inventario_producto ON detalle_registros_inventario(producto_id);
