-- Crear tabla para trackear archivos de almacenamiento de empresas
CREATE TABLE archivos_empresa (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    empresa_id BIGINT NOT NULL,
    url_archivo VARCHAR(500) NOT NULL,
    public_id VARCHAR(200),
    tipo_archivo VARCHAR(50) NOT NULL,
    tamaño_bytes BIGINT,
    tamaño_mb DOUBLE,
    nombre_original VARCHAR(200),
    tipo_mime VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- Crear índices
CREATE INDEX idx_empresa_activo ON archivos_empresa (empresa_id, activo);
CREATE INDEX idx_tipo_archivo ON archivos_empresa (tipo_archivo);
CREATE INDEX idx_public_id ON archivos_empresa (public_id);
CREATE INDEX idx_url_archivo ON archivos_empresa (url_archivo);
