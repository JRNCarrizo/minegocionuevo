-- Tablas base de planillas de devolución (no existían en migraciones anteriores; V36/V37 amplían el esquema)
CREATE TABLE IF NOT EXISTS planillas_devoluciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    numero_planilla VARCHAR(8) UNIQUE,
    observaciones VARCHAR(1000),
    transporte VARCHAR(500),
    fecha_planilla TIMESTAMP NOT NULL,
    total_productos INTEGER NOT NULL DEFAULT 0,
    empresa_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS detalle_planillas_devoluciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(500) NOT NULL,
    cantidad INTEGER NOT NULL,
    numero_personalizado VARCHAR(100),
    observaciones VARCHAR(1000),
    estado_producto VARCHAR(50),
    planilla_devolucion_id BIGINT NOT NULL,
    producto_id BIGINT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (planilla_devolucion_id) REFERENCES planillas_devoluciones(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
);

CREATE INDEX idx_planillas_devoluciones_empresa ON planillas_devoluciones(empresa_id);
CREATE INDEX idx_detalle_plan_dev_planilla ON detalle_planillas_devoluciones(planilla_devolucion_id);
