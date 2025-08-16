-- Crear tabla de planillas de pedidos
CREATE TABLE planillas_pedidos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    numero_planilla VARCHAR(8) NOT NULL UNIQUE,
    observaciones VARCHAR(1000),
    fecha_planilla DATE NOT NULL,
    total_productos INT NOT NULL DEFAULT 0,
    empresa_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Crear tabla de detalles de planillas de pedidos
CREATE TABLE detalle_planillas_pedidos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    numero_personalizado VARCHAR(50),
    descripcion VARCHAR(500) NOT NULL,
    cantidad INT NOT NULL,
    observaciones VARCHAR(500),
    planilla_pedido_id BIGINT NOT NULL,
    producto_id BIGINT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (planilla_pedido_id) REFERENCES planillas_pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_planillas_pedidos_empresa ON planillas_pedidos(empresa_id);
CREATE INDEX idx_planillas_pedidos_fecha ON planillas_pedidos(fecha_planilla);
CREATE INDEX idx_planillas_pedidos_numero ON planillas_pedidos(numero_planilla);
CREATE INDEX idx_detalle_planillas_planilla ON detalle_planillas_pedidos(planilla_pedido_id);
CREATE INDEX idx_detalle_planillas_producto ON detalle_planillas_pedidos(producto_id);
