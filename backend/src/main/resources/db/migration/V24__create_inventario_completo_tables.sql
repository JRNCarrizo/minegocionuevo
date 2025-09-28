-- Crear tabla inventario_completo
CREATE TABLE inventario_completo (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    total_sectores INTEGER DEFAULT 0,
    sectores_completados INTEGER DEFAULT 0,
    sectores_en_progreso INTEGER DEFAULT 0,
    sectores_pendientes INTEGER DEFAULT 0,
    porcentaje_completado DECIMAL(5,2) DEFAULT 0.00,
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    empresa_id BIGINT NOT NULL,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- Crear tabla conteo_sector
CREATE TABLE conteo_sector (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre_sector VARCHAR(255) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    productos_contados INTEGER DEFAULT 0,
    productos_con_diferencias INTEGER DEFAULT 0,
    intentos_reconteo INTEGER DEFAULT 0,
    porcentaje_completado DECIMAL(5,2) DEFAULT 0.00,
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    inventario_completo_id BIGINT NOT NULL,
    usuario_asignado_1_id BIGINT,
    usuario_asignado_2_id BIGINT,
    FOREIGN KEY (inventario_completo_id) REFERENCES inventario_completo(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_asignado_1_id) REFERENCES usuarios(id),
    FOREIGN KEY (usuario_asignado_2_id) REFERENCES usuarios(id)
);

-- Crear tabla detalle_conteo
CREATE TABLE detalle_conteo (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
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
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (conteo_sector_id) REFERENCES conteo_sector(id) ON DELETE CASCADE,
    -- FOREIGN KEY (inventario_por_sector_id) REFERENCES inventario_por_sector(id) ON DELETE CASCADE, -- Comentado temporalmente
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_inventario_completo_empresa ON inventario_completo(empresa_id);
CREATE INDEX idx_inventario_completo_estado ON inventario_completo(estado);
CREATE INDEX idx_conteo_sector_inventario ON conteo_sector(inventario_completo_id);
CREATE INDEX idx_conteo_sector_estado ON conteo_sector(estado);
CREATE INDEX idx_conteo_sector_usuario_1 ON conteo_sector(usuario_asignado_1_id);
CREATE INDEX idx_conteo_sector_usuario_2 ON conteo_sector(usuario_asignado_2_id);
CREATE INDEX idx_detalle_conteo_sector ON detalle_conteo(conteo_sector_id);
CREATE INDEX idx_detalle_conteo_producto ON detalle_conteo(producto_id);
